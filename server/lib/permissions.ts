import { RequestHandler } from "express";
import {
  PermissionAccess as Access,
  PermissionModule as Module,
  UserRole,
} from "@shared/api";

/**
 * Rol asosidagi kirish nazorati (RBAC).
 *
 * TZ 14-bo'lim talabi: "frontendda tugma yashirilishi yetarli emas — backend
 * ham tekshiradi". Matritsa frontend nusxasi (`client/lib/permissions.ts`) bilan
 * bir xil tutiladi — o'zgartirsangiz ikkalasini ham yangilang.
 */

export type { Module, Access };

const MATRIX: Record<UserRole, Partial<Record<Module, Access>>> = {
  // ADMIN: Hamma narsaga to'liq kirish
  admin: {
    dashboard: "manage", 
    finance: "manage", 
    hr: "manage", 
    warehouse: "manage",
    crm: "manage", 
    sales: "manage", 
    posts: "manage", 
    reports: "manage", 
    users: "manage", 
    audit: "manage",
  },
  
  // MENEJR: Ko'p bo'limlarga kirish, faqat foydalanuvchilarni boshqara olmaydi
  manager: {
    dashboard: "manage", 
    finance: "view",      // Moliya - faqat ko'rish
    hr: "view",           // Xodimlar - faqat ko'rish
    warehouse: "manage",  // Ombor - boshqarish
    crm: "manage",        // CRM - boshqarish
    sales: "manage",      // Savdo - boshqarish
    reports: "manage",    // Hisobotlar - boshqarish
  },
  
  // HISOBCHI: Faqat moliya bo'limi
  accountant: { 
    dashboard: "view",    // Dashboard - faqat ko'rish
    finance: "manage",    // Moliya - to'liq boshqarish
    reports: "view",      // Hisobotlar - faqat ko'rish
  },
  
  // KASSIR: Faqat savdo/kassa
  cashier: {
    dashboard: "view",    // Dashboard - asosiy ko'rsatkichlar
    sales: "manage",      // Savdo/POS - to'liq boshqarish
    reports: "view",      // Hisobotlar - faqat ko'rish
  },
  
  // Qolgan rollar (ishlatilmaydi, lekin TypeScript uchun kerak)
  warehouse: { 
    warehouse: "manage", reports: "view" 
  },
  sales: { 
    sales: "manage", crm: "view", reports: "view" 
  },
  viewer: {
    dashboard: "view", reports: "view",
  },
  hr_manager: {
    hr: "manage", reports: "view"
  },
};

/** Rolda modul uchun kerakli daraja bor-yo'qligini tekshiradi. */
export function can(role: UserRole, module: Module, access: Access): boolean {
  const granted = MATRIX[role]?.[module];
  if (!granted) return false;
  if (access === "view") return true;
  return granted === "manage";
}

/**
 * Modulni himoyalovchi middleware.
 * GET/HEAD — `view`, qolgan metodlar `manage` talab qiladi.
 * `requireAuth` dan keyin ishlatiladi (`req.currentUser` mavjud bo'lishi shart).
 */
export function requireModule(module: Module): RequestHandler {
  return (req, res, next) => {
    const user = req.currentUser;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Avtorizatsiya talab qilinadi" });
    }

    const access: Access =
      req.method === "GET" || req.method === "HEAD" ? "view" : "manage";

    if (!can(user.role, module, access)) {
      return res.status(403).json({
        success: false,
        message:
          access === "view"
            ? "Bu bo'limni ko'rish uchun ruxsatingiz yo'q"
            : "Bu amalni bajarish uchun ruxsatingiz yo'q",
      });
    }

    next();
  };
}

/** Faqat sanab o'tilgan rollarga ruxsat beruvchi middleware. */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const user = req.currentUser;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Avtorizatsiya talab qilinadi" });
    }
    if (!roles.includes(user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Bu amal uchun ruxsatingiz yo'q" });
    }
    next();
  };
}
