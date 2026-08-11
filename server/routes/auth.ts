import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, LoginResponse, StoredUser, User } from "@shared/api";
import { logActivity, users } from "../data/store";
import {
  createSession,
  destroySession,
  destroyUserSessions,
  extractToken,
  hashPassword,
  resolveSession,
  verifyPassword,
  createAccessToken,
  verifyAccessToken,
} from "../lib/auth";
import { sendValidationError } from "../lib/http";
import { clientIp, recordAudit } from "../lib/audit";

/** Parol hash'ini javobdan chiqarib tashlaydi. */
export function toPublicUser(user: StoredUser): User {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

const loginSchema = z.object({
  login: z.string().trim().min(1, "login kiritilishi shart"),
  password: z.string().min(1, "parol kiritilishi shart"),
});

/**
 * Parol kuchliligini tekshiruvchi schema.
 * Kamida 8 belgidan iborat, katta va kichik harf, raqam va maxsus belgi bo'lishi kerak.
 */
const passwordSchema = z
  .string()
  .min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
  .regex(/[a-z]/, "Parol kamida bitta kichik harf (a-z) o'z ichiga olishi kerak")
  .regex(/[A-Z]/, "Parol kamida bitta katta harf (A-Z) o'z ichiga olishi kerak")
  .regex(/[0-9]/, "Parol kamida bitta raqam (0-9) o'z ichiga olishi kerak")
  .regex(/[^a-zA-Z0-9]/, "Parol kamida bitta maxsus belgi (!@#$%^&*) o'z ichiga olishi kerak");

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "joriy parol kiritilishi shart"),
  newPassword: passwordSchema,
});

export const login: RequestHandler = (req, res) => {
  try {
    // 1. Request body tekshirish
    console.log("📨 Login request received");
    console.log("📦 Request body:", req.body ? "exists" : "undefined/null");
    console.log("🔍 Body type:", typeof req.body);
    
    if (!req.body || typeof req.body !== 'object') {
      console.error("❌ Invalid request body:", req.body);
      return res.status(400).json({ 
        success: false, 
        message: "Yaroqsiz so'rov: body bo'sh yoki noto'g'ri formatda" 
      });
    }

    // 2. Validation
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("❌ Login validation error:", parsed.error.errors);
      return sendValidationError(res, parsed.error);
    }

    const loginValue = parsed.data.login.trim().toLowerCase();
    console.log("🔍 Login attempt for:", loginValue);
    console.log("📊 Total users in database:", users?.length || 0);
    
    // 3. Users array tekshirish
    if (!users || !Array.isArray(users)) {
      console.error("❌ CRITICAL: users array undefined or not array!");
      return res.status(500).json({
        success: false,
        message: "Server xatosi: Ma'lumotlar bazasi mavjud emas"
      });
    }

    // 4. Email yoki login orqali qidirish
    const user = users.find(
      (item) => {
        try {
          const loginMatch = item.login && item.login.toLowerCase() === loginValue;
          const emailMatch = item.email && item.email.toLowerCase() === loginValue;
          const notDeleted = !item.deletedAt;
          return (loginMatch || emailMatch) && notDeleted;
        } catch (findError) {
          console.error("❌ Error in find predicate:", findError);
          return false;
        }
      }
    );

    if (!user) {
      console.error("❌ User not found:", loginValue);
      console.error("📋 Available users:", users.slice(0, 5).map(u => ({ 
        login: u.login, 
        email: u.email, 
        hasPassword: !!u.passwordHash 
      })));
      return res.status(401).json({ 
        success: false, 
        message: "Login yoki parol noto'g'ri" 
      });
    }

    console.log("✅ User found:", { 
      id: user.id, 
      login: user.login, 
      email: user.email,
      hasPassword: !!user.passwordHash,
      status: user.status
    });

    // 5. Parol tekshirish
    if (!user.passwordHash) {
      console.error("❌ User has no password hash:", user.login);
      return res.status(500).json({
        success: false,
        message: "Server xatosi: Parol hash mavjud emas"
      });
    }

    let passwordValid = false;
    try {
      passwordValid = verifyPassword(parsed.data.password, user.passwordHash);
      console.log("🔐 Password verification result:", passwordValid);
    } catch (verifyError) {
      console.error("❌ Password verification error:", verifyError);
      return res.status(500).json({
        success: false,
        message: "Server xatosi: Parol tekshirishda xatolik"
      });
    }
    
    if (!passwordValid) {
      console.error("❌ Invalid password for user:", user.login);
      return res.status(401).json({ 
        success: false, 
        message: "Login yoki parol noto'g'ri" 
      });
    }

    // 6. User status tekshirish
    if (user.status === "suspended") {
      console.warn("⚠️ User suspended:", user.email);
      return res.status(403).json({
        success: false,
        message: "Hisobingiz to'xtatilgan. Administratorga murojaat qiling.",
      });
    }

    // 7. JWT Token yaratish (Vercel serverless uchun)
    let token: string;
    try {
      user.lastLogin = new Date().toISOString();
      
      // JWT token (stateless - database kerak emas!)
      token = createAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      console.log("✅ JWT token created:", { 
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenPrefix: token.substring(0, 20) + "..." 
      });
    } catch (tokenError) {
      console.error("❌ Token creation error:", tokenError);
      return res.status(500).json({
        success: false,
        message: "Server xatosi: Token yaratishda xatolik"
      });
    }

    // 8. Audit logging
    try {
      recordAudit({
        user,
        action: "login",
        entity: "auth",
        summary: `${user.name} tizimga kirdi`,
        ip: clientIp(req),
      });
    } catch (auditError) {
      // Audit xatosi login'ni to'xtatmasin
      console.error("⚠️ Audit logging error (non-critical):", auditError);
    }

    // 9. Success response
    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: { token, user: toPublicUser(user) },
      message: "Tizimga muvaffaqiyatli kirdingiz",
    };
    
    console.log("✅ Login successful for:", user.email);
    res.json(response);
    
  } catch (error) {
    // 10. Global error handler
    console.error("❌❌❌ LOGIN EXCEPTION (UNCAUGHT) ❌❌❌");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Request details:", {
      body: req.body,
      headers: req.headers,
      url: req.url,
      method: req.method
    });
    
    res.status(500).json({ 
      success: false, 
      message: "Server xatosi: " + (error instanceof Error ? error.message : "Noma'lum xatolik")
    });
  }
};

export const logout: RequestHandler = (req, res) => {
  const token = extractToken(req.headers.authorization);
  if (token) destroySession(token);

  res.json({ success: true, data: null, message: "Tizimdan chiqdingiz" });
};

/** Joriy sessiya egasi — sahifa yangilanganda holatni tiklash uchun. */
export const getCurrentUser: RequestHandler = (req, res) => {
  console.log("👤 getCurrentUser called");
  
  const token = extractToken(req.headers.authorization);
  console.log("   Token:", token ? "present" : "missing");

  if (!token) {
    console.error("   ❌ No token");
    return res.status(401).json({ success: false, message: "Token topilmadi" });
  }

  // JWT verify
  const payload = verifyAccessToken(token);
  console.log("   JWT payload:", payload ? `userId=${payload.userId}` : "null");

  if (!payload) {
    console.error("   ❌ Invalid JWT");
    return res.status(401).json({ success: false, message: "Token yaroqsiz" });
  }

  // User topish
  const user = users.find((item) => item.id === payload.userId && !item.deletedAt);
  console.log("   User found:", user ? user.email : "null");

  if (!user) {
    console.error("   ❌ User not found");
    return res.status(401).json({ success: false, message: "Foydalanuvchi topilmadi" });
  }

  console.log("   ✅ getCurrentUser success:", user.email);
  const response: ApiResponse<User> = { success: true, data: toPublicUser(user) };
  res.json(response);
};

export const changePassword: RequestHandler = (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const user = req.currentUser;
  if (!user) {
    return res.status(401).json({ success: false, message: "Sessiya topilmadi" });
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return res
      .status(400)
      .json({ success: false, message: "Joriy parol noto'g'ri" });
  }

  user.passwordHash = hashPassword(parsed.data.newPassword);

  // Parol o'zgargach boshqa qurilmalardagi sessiyalar bekor qilinadi.
  destroyUserSessions(user.id);

  logActivity({
    action: "Parol o'zgartirildi",
    details: user.name,
    icon: "ShieldCheck",
  });

  res.json({
    success: true,
    data: null,
    message: "Parol yangilandi. Iltimos, qaytadan kiring.",
  });
};

/**
 * Sessiyani tekshiruvchi middleware.
 * JWT token'ni verify qiladi (stateless - Vercel serverless uchun).
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  console.log("🔐 requireAuth middleware called");
  console.log("   URL:", req.url);
  console.log("   Method:", req.method);
  console.log("   Authorization header:", req.headers.authorization ? "present" : "missing");
  
  const token = extractToken(req.headers.authorization);
  console.log("   Token extracted:", token ? `${token.substring(0, 20)}...` : "null");

  if (!token) {
    console.error("❌ requireAuth failed: No token");
    return res
      .status(401)
      .json({ success: false, message: "Avtorizatsiya talab qilinadi" });
  }

  // JWT verify (stateless - database query yo'q!)
  const payload = verifyAccessToken(token);
  console.log("   JWT payload:", payload ? `userId=${payload.userId}` : "null (invalid token)");

  if (!payload) {
    console.error("❌ requireAuth failed: Invalid JWT token");
    return res
      .status(401)
      .json({ success: false, message: "Token yaroqsiz yoki muddati o'tgan" });
  }

  // User'ni in-memory array'dan topish (tez - database query yo'q)
  const user = users.find((item) => item.id === payload.userId && !item.deletedAt);
  console.log("   User found in memory:", user ? user.email : "null");
  
  if (!user || user.status === "suspended") {
    console.error("❌ requireAuth failed: User not found or suspended");
    return res
      .status(401)
      .json({ success: false, message: "Hisob mavjud emas yoki to'xtatilgan" });
  }

  console.log("✅ requireAuth success:", user.email);
  req.currentUser = user;
  next();
};
