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
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("❌ Login validation error:", parsed.error);
      return sendValidationError(res, parsed.error);
    }

    const loginValue = parsed.data.login.trim().toLowerCase();
    console.log("🔍 Login attempt:", { login: loginValue });
    
    // Email yoki login orqali qidirish
    const user = users.find(
      (item) =>
        (
          (item.login && item.login.toLowerCase() === loginValue) ||
          (item.email && item.email.toLowerCase() === loginValue)
        ) &&
        !item.deletedAt
    );

    if (!user) {
      console.error("❌ User not found:", loginValue);
      console.error("📋 Available users:", users.map(u => ({ login: u.login, email: u.email, hasPassword: !!u.passwordHash })));
    }

    // Parol tekshirish
    const passwordValid = user ? verifyPassword(parsed.data.password, user.passwordHash) : false;
    
    if (!user || !passwordValid) {
      console.error("❌ Auth failed:", { 
        userFound: !!user, 
        passwordValid,
        userEmail: user?.email,
        userLogin: user?.login,
        hasPasswordHash: !!user?.passwordHash
      });
      return res
        .status(401)
        .json({ success: false, message: "Login yoki parol noto'g'ri" });
    }

    if (user.status === "suspended") {
      console.warn("⚠️ User suspended:", user.email);
      return res.status(403).json({
        success: false,
        message: "Hisobingiz to'xtatilgan. Administratorga murojaat qiling.",
      });
    }

    user.lastLogin = new Date().toISOString();
    const token = createSession(user.id);

    console.log("✅ Login successful:", { user: user.email, token: token.substring(0, 10) + "..." });

    recordAudit({
      user,
      action: "login",
      entity: "auth",
      summary: `${user.name} tizimga kirdi`,
      ip: clientIp(req),
    });

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: { token, user: toPublicUser(user) },
      message: "Tizimga muvaffaqiyatli kirdingiz",
    };
    res.json(response);
  } catch (error) {
    console.error("❌ LOGIN EXCEPTION:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server xatosi: " + (error instanceof Error ? error.message : "Unknown error")
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
  const user = req.currentUser;
  if (!user) {
    return res.status(401).json({ success: false, message: "Sessiya topilmadi" });
  }

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
 * Token yaroqli bo'lsa foydalanuvchini `req.currentUser` ga qo'yadi.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  const userId = token ? resolveSession(token) : null;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Avtorizatsiya talab qilinadi" });
  }

  const user = users.find((item) => item.id === userId && !item.deletedAt);
  if (!user || user.status === "suspended") {
    // Hisob o'chirilgan yoki bloklangan bo'lsa sessiya ham yaroqsiz.
    if (token) destroySession(token);
    return res
      .status(401)
      .json({ success: false, message: "Hisob mavjud emas yoki to'xtatilgan" });
  }

  req.currentUser = user;
  next();
};
