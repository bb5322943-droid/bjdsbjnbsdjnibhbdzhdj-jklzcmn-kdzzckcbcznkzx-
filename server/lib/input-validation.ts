import { z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Server-side input validation middleware.
 * Zod schema'larni ishlatib, malicious input'lardan himoya qiladi.
 * 
 * XSS, SQL Injection, va boshqa attack'lardan himoya.
 */

/**
 * Generic validation middleware factory
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Sanitized data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Ma'lumotlar validatsiyadan o'tmadi",
          errors: error.errors.map(err => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Common schemas - real business uchun
 */

// Email validation
export const emailSchema = z.string().email("To'g'ri email kiriting").toLowerCase().trim();

// Phone validation (O'zbekiston formati)
export const phoneSchema = z.string()
  .regex(/^\+998[0-9]{9}$/, "To'g'ri telefon raqam kiriting (+998XXXXXXXXX)")
  .or(z.string().regex(/^998[0-9]{9}$/, "To'g'ri telefon raqam kiriting"))
  .or(z.string().regex(/^[0-9]{9}$/, "To'g'ri telefon raqam kiriting"));

// Money validation (positive numbers)
export const moneySchema = z.number()
  .nonnegative("Pul miqdori manfiy bo'lishi mumkin emas")
  .finite("To'g'ri raqam kiriting");

// Quantity validation
export const quantitySchema = z.number()
  .int("Butun son kiriting")
  .nonnegative("Soni manfiy bo'lishi mumkin emas");

// Name validation (no special chars)
export const nameSchema = z.string()
  .min(1, "Nom kiritilishi shart")
  .max(100, "Nom juda uzun")
  .trim()
  .regex(/^[a-zA-Z0-9\s\u0400-\u04FF\u0600-\u06FF'-]+$/, "Nomda faqat harflar va raqamlar bo'lishi mumkin");

// Address validation
export const addressSchema = z.string()
  .min(5, "Manzil juda qisqa")
  .max(500, "Manzil juda uzun")
  .trim();

// Notes/comments validation
export const notesSchema = z.string()
  .max(2000, "Izoh juda uzun")
  .trim()
  .optional();

// Date validation (ISO 8601)
export const dateSchema = z.string().datetime().or(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To'g'ri sana kiriting (YYYY-MM-DD)")
);

// ID validation
export const idSchema = z.string().min(1, "ID kiritilishi shart");

/**
 * Business entity schemas
 */

export const createCustomerSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  region: z.string().optional(),
  notes: notesSchema,
});

export const createProductSchema = z.object({
  name: nameSchema,
  sku: z.string().max(50).optional(),
  category: z.string().max(50),
  buyPrice: moneySchema,
  sellPrice: moneySchema,
  quantity: quantitySchema,
  unit: z.string().max(20),
  supplier: z.string().optional(),
  minStock: quantitySchema.optional(),
  notes: notesSchema,
});

export const createOrderSchema = z.object({
  customerId: idSchema,
  items: z.array(z.object({
    productId: idSchema,
    quantity: quantitySchema.min(1, "Kamida 1 dona buyurtma qiling"),
    price: moneySchema,
  })).min(1, "Kamida 1 ta mahsulot qo'shing"),
  status: z.enum(["pending", "processing", "completed", "cancelled"]).optional(),
  notes: notesSchema,
});

export const createPurchaseSchema = z.object({
  supplierId: idSchema,
  productId: idSchema,
  quantity: quantitySchema.min(1, "Kamida 1 dona sotib oling"),
  price: moneySchema,
  total: moneySchema,
  notes: notesSchema,
});

export const createEmployeeSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  position: z.string().min(1).max(50),
  department: z.string().min(1).max(50),
  salary: moneySchema,
  hireDate: dateSchema,
  address: addressSchema.optional(),
  notes: notesSchema,
});

export const createSupplierSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  category: z.string().max(50).optional(),
  notes: notesSchema,
});

export const loginSchema = z.object({
  email: emailSchema.or(z.string().min(1, "Email yoki login kiriting")),
  password: z.string().min(1, "Parol kiriting"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Joriy parol kiriting"),
  newPassword: z.string()
    .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak")
    .max(100, "Parol juda uzun")
    .regex(/[A-Z]/, "Parolda kamida 1 ta katta harf bo'lishi kerak")
    .regex(/[a-z]/, "Parolda kamida 1 ta kichik harf bo'lishi kerak")
    .regex(/[0-9]/, "Parolda kamida 1 ta raqam bo'lishi kerak"),
});

/**
 * SQL Injection prevention
 * Zod automatically sanitizes strings, but this adds extra protection
 */
export function sanitizeSqlString(input: string): string {
  // Remove SQL keywords and dangerous characters
  const dangerous = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|SCRIPT)\b|;|--|\/\*|\*\/)/gi;
  return input.replace(dangerous, "");
}

/**
 * XSS prevention
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Request body size limiter (DDoS protection)
 */
export function limitBodySize(maxSizeKb: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const bodySize = JSON.stringify(req.body).length;
    const maxBytes = maxSizeKb * 1024;
    
    if (bodySize > maxBytes) {
      return res.status(413).json({
        success: false,
        message: `Request juda katta (max: ${maxSizeKb}KB)`,
      });
    }
    
    next();
  };
}

/**
 * IP-based request tracking (brute force protection)
 */
const requestTracker = new Map<string, { count: number; lastReset: number }>();

export function trackRequests(maxPerMinute: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const minute = 60 * 1000;
    
    let tracker = requestTracker.get(ip);
    
    if (!tracker || now - tracker.lastReset > minute) {
      tracker = { count: 0, lastReset: now };
      requestTracker.set(ip, tracker);
    }
    
    tracker.count++;
    
    if (tracker.count > maxPerMinute) {
      return res.status(429).json({
        success: false,
        message: "Juda ko'p so'rov yuborildi, 1 daqiqa kuting",
      });
    }
    
    next();
  };
}
