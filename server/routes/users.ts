import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, RolePermission, StoredUser, User, UserStats } from "@shared/api";
import { active, employees, logActivity, nextId, softRemove, users } from "../data/store";
import { rolePermissions, userStats } from "../data/metrics";
import { DEFAULT_PASSWORD, destroyUserSessions, hashPassword } from "../lib/auth";
import { toPublicUser } from "./auth";
import {
  paginate,
  paginationSchema,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const USER_ROLES = [
  "admin",
  "manager",
  "accountant",
  "warehouse",
  "sales",
  "viewer",
] as const;

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

const userSchema = z.object({
  name: z.string().trim().min(1, "ism kiritilishi shart"),
  login: z.string().trim().min(3, "login kamida 3 belgidan iborat bo'lishi kerak"),
  email: z.string().trim().email("email formati noto'g'ri"),
  role: z.enum(USER_ROLES),
  employeeId: z.string().trim().nullable().optional(),
  status: z.enum(["active", "suspended"]).optional(),
  /** Faqat yangi hisob ochishda; berilmasa boshlang'ich parol qo'yiladi. */
  password: passwordSchema.optional(),
});

/** Yangi hisob uchun boshlang'ich parol — foydalanuvchi keyin o'zgartiradi. */

const querySchema = paginationSchema.extend({
  role: z.enum(USER_ROLES).optional().catch(undefined),
  status: z.enum(["active", "suspended"]).optional().catch(undefined),
});

export const getUserStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<UserStats> = { success: true, data: userStats() };
  res.json(response);
};

/** Rollar va ular ochadigan bo'limlar matritsasi. */
export const getRolePermissions: RequestHandler = (_req, res) => {
  const response: ApiResponse<RolePermission[]> = {
    success: true,
    data: rolePermissions(),
  };
  res.json(response);
};

export const getUsers: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(users).filter((user) => {
    if (
      search &&
      !user.name.toLowerCase().includes(search) &&
      !user.login.toLowerCase().includes(search) &&
      !user.email.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (query.role && user.role !== query.role) return false;
    if (query.status && user.status !== query.status) return false;
    return true;
  });

  // Parol hash'i hech qachon tarmoqqa chiqmaydi.
  const page = paginate(filtered, query.page, query.limit);
  res.json({ ...page, data: page.data.map(toPublicUser) });
};

export const createUser: RequestHandler = (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  // Login — tizimga kirish identifikatori, takrorlanmasligi shart.
  if (active(users).some((u) => u.login.toLowerCase() === parsed.data.login.toLowerCase())) {
    return res
      .status(409)
      .json({ success: false, message: "Bu login bilan foydalanuvchi allaqachon mavjud" });
  }

  // Email ham unikal bo'lishi kerak.
  if (active(users).some((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase())) {
    return res
      .status(409)
      .json({ success: false, message: "Bu email bilan foydalanuvchi allaqachon mavjud" });
  }

  if (parsed.data.employeeId && !employees.some((e) => e.id === parsed.data.employeeId)) {
    return sendNotFound(res, "Xodim topilmadi");
  }

  const newUser: StoredUser = {
    id: nextId(),
    name: parsed.data.name,
    login: parsed.data.login,
    email: parsed.data.email,
    role: parsed.data.role,
    status: parsed.data.status ?? "active",
    lastLogin: "",
    employeeId: parsed.data.employeeId ?? null,
    createdDate: new Date().toISOString().split("T")[0],
    passwordHash: hashPassword(parsed.data.password ?? DEFAULT_PASSWORD),
  };

  users.unshift(newUser);
  logActivity({
    action: "Yangi foydalanuvchi qo'shildi",
    details: `${newUser.name} · ${newUser.role}`,
    icon: "UserPlus",
  });

  const response: ApiResponse<User> = {
    success: true,
    data: toPublicUser(newUser),
    message: parsed.data.password
      ? "Foydalanuvchi qo'shildi"
      : `Foydalanuvchi qo'shildi. Boshlang'ich parol: ${DEFAULT_PASSWORD}`,
  };
  res.status(201).json(response);
};

export const updateUser: RequestHandler = async (req, res) => {
  const parsed = userSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const user = users.find((u) => u.id === req.params.id && !u.deletedAt);
  if (!user) return sendNotFound(res, "Foydalanuvchi topilmadi");

  if (
    parsed.data.login &&
    active(users).some(
      (u) => u.id !== user.id && u.login.toLowerCase() === parsed.data.login!.toLowerCase(),
    )
  ) {
    return res
      .status(409)
      .json({ success: false, message: "Bu login boshqa foydalanuvchiga biriktirilgan" });
  }

  if (
    parsed.data.email &&
    active(users).some(
      (u) => u.id !== user.id && u.email.toLowerCase() === parsed.data.email!.toLowerCase(),
    )
  ) {
    return res
      .status(409)
      .json({ success: false, message: "Bu email boshqa foydalanuvchiga biriktirilgan" });
  }

  // Oxirgi faol administratordan mahrum bo'lib qolmaslik kerak.
  const losingAdmin =
    user.role === "admin" &&
    ((parsed.data.role && parsed.data.role !== "admin") ||
      parsed.data.status === "suspended");
  if (losingAdmin) {
    const otherAdmins = active(users).filter(
      (u) => u.id !== user.id && u.role === "admin" && u.status === "active",
    ).length;
    if (otherAdmins === 0) {
      return res.status(409).json({
        success: false,
        message: "Tizimda kamida bitta faol administrator qolishi kerak",
      });
    }
  }

  const { password, ...fields } = parsed.data;
  Object.assign(user, fields);

  // Administrator parolni qayta o'rnatsa, eski sessiyalar bekor qilinadi.
  if (password) {
    user.passwordHash = hashPassword(password);
    await destroyUserSessions(user.id);
  }
  // Hisob to'xtatilsa ham foydalanuvchi darhol tizimdan chiqarilishi kerak.
  if (fields.status === "suspended") await destroyUserSessions(user.id);

  logActivity({
    action: "Foydalanuvchi yangilandi",
    details: `${user.name} · ${user.role}`,
    icon: "PenLine",
  });

  const response: ApiResponse<User> = {
    success: true,
    data: toPublicUser(user),
    message: "Foydalanuvchi yangilandi",
  };
  res.json(response);
};

export const deleteUser: RequestHandler = async (req, res) => {
  const user = users.find((u) => u.id === req.params.id && !u.deletedAt);
  if (!user) return sendNotFound(res, "Foydalanuvchi topilmadi");

  if (user.role === "admin") {
    const otherAdmins = active(users).filter(
      (u) => u.id !== user.id && u.role === "admin" && u.status === "active",
    ).length;
    if (otherAdmins === 0) {
      return res.status(409).json({
        success: false,
        message: "Oxirgi administratorni o'chirib bo'lmaydi",
      });
    }
  }

  softRemove(users, user.id);
  // O'chirilgan hisob egasi ochiq turgan sessiyasi bilan ishlashda davom etmasin.
  await destroyUserSessions(user.id);

  logActivity({
    action: "Foydalanuvchi o'chirildi",
    details: user.name,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Foydalanuvchi o'chirildi",
  };
  res.json(response);
};
