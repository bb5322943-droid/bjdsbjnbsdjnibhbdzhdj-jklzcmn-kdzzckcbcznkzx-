import { PermissionAccess, PermissionModule, UserRole } from "@shared/api";

/**
 * Rol asosidagi kirish matritsasi — frontend nusxasi.
 * Backend (`server/lib/permissions.ts`) bilan bir xil tutiladi.
 * Frontend faqat menyu/route'ni yashirish uchun ishlatadi; haqiqiy himoya
 * backendda. Ikkalasi mos bo'lishi kerak.
 */
const MATRIX: Record<UserRole, Partial<Record<PermissionModule, PermissionAccess>>> = {
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
export function hasPermission(
  role: UserRole,
  module: PermissionModule,
  access: PermissionAccess = "view",
): boolean {
  const granted = MATRIX[role]?.[module];
  if (!granted) return false;
  if (access === "view") return true;
  return granted === "manage";
}
