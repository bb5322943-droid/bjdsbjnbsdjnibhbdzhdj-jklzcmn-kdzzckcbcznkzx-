import { Request, Response } from "express";
import { z } from "zod";
import { PaginatedResponse } from "@shared/api";

/**
 * Marshrut parametrini har doim yagona satr sifatida o'qiydi.
 * `@types/express` 5.1+ da `req.params[...]` tipi `string | string[]` bo'ldi
 * (takrorlanuvchi segmentlar uchun). Bizning yo'llarimizda parametr doim yagona,
 * shuning uchun massiv kelsa birinchi elementni olamiz.
 */
export function paramId(req: Request, key = "id"): string {
  const value = req.params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** So'rov query'sidan sahifalash parametrlarini xavfsiz o'qiydi. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().catch(""),
});

/** Ro'yxatni sahifalarga bo'lib, standart javob shaklida qaytaradi. */
export function paginate<T>(
  list: T[],
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  // Filtrdan keyin sahifa diapazondan chiqib ketishi mumkin — oxirgi sahifaga qisqartiramiz.
  const safePage = Math.min(page, pages);
  const offset = (safePage - 1) * limit;

  return {
    data: list.slice(offset, offset + limit),
    pagination: { page: safePage, limit, total, pages },
  };
}

/** Zod xatosini foydalanuvchi uchun o'qiladigan xabarga aylantiradi. */
export function sendValidationError(res: Response, error: z.ZodError) {
  const message = error.issues
    .map((issue) => `${issue.path.join(".") || "maydon"}: ${issue.message}`)
    .join("; ");

  res.status(400).json({ success: false, message });
}

export function sendNotFound(res: Response, message: string) {
  res.status(404).json({ success: false, message });
}
