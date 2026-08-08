import { z } from "zod";

/**
 * Barcha API endpoint'lar uchun Zod validatorlari.
 * Har bir route bu validatorlardan foydalanadi.
 */

// Auth validators
export const loginSchema = z.object({
  email: z.string().email("Email noto'g'ri formatda"),
  password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Eski parol kiritilishi kerak"),
  newPassword: z
    .string()
    .min(8, "Yangi parol kamida 8 belgidan iborat bo'lishi kerak")
    .regex(/[A-Z]/, "Kamida bitta katta harf bo'lishi kerak")
    .regex(/[a-z]/, "Kamida bitta kichik harf bo'lishi kerak")
    .regex(/[0-9]/, "Kamida bitta raqam bo'lishi kerak")
    .regex(/[^A-Za-z0-9]/, "Kamida bitta maxsus belgi bo'lishi kerak"),
});

// User validators
export const createUserSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 belgidan iborat bo'lishi kerak"),
  email: z.string().email("Email noto'g'ri formatda"),
  login: z
    .string()
    .min(3, "Login kamida 3 belgidan iborat bo'lishi kerak")
    .regex(/^[a-zA-Z0-9_]+$/, "Login faqat harflar, raqamlar va _ bo'lishi mumkin"),
  role: z.enum(["admin", "manager", "accountant", "hr", "warehouse", "sales"]),
  password: z.string().min(8).optional(),
  employeeId: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string(),
});

// Employee validators
export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 belgidan iborat bo'lishi kerak"),
  position: z.string().min(2, "Lavozim kiritilishi kerak"),
  department: z.string().min(2, "Bo'lim kiritilishi kerak"),
  salary: z.number().positive("Maosh musbat son bo'lishi kerak"),
  email: z.string().email("Email noto'g'ri formatda"),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/, "Telefon raqami noto'g'ri formatda"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string(),
});

// Product validators
export const createProductSchema = z.object({
  name: z.string().min(2, "Mahsulot nomi kamida 2 belgidan iborat bo'lishi kerak"),
  category: z.string().min(2, "Kategoriya kiritilishi kerak"),
  price: z.number().positive("Narx musbat son bo'lishi kerak"),
  quantity: z.number().int().min(0, "Miqdor manfiy bo'lishi mumkin emas"),
  minQuantity: z.number().int().min(0, "Minimal miqdor manfiy bo'lishi mumkin emas"),
  location: z.string().min(1, "Joylashuv kiritilishi kerak"),
  supplier: z.string().min(2, "Ta'minotchi kiritilishi kerek"),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string(),
});

// Customer validators
export const createCustomerSchema = z.object({
  name: z.string().min(2, "Mijoz nomi kamida 2 belgidan iborat bo'lishi kerak"),
  type: z.enum(["individual", "company"]),
  contactPerson: z.string().min(2, "Aloqa shaxsi kiritilishi kerak"),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/, "Telefon raqami noto'g'ri formatda"),
  email: z.string().email("Email noto'g'ri formatda").or(z.literal("")),
  region: z.string().min(2, "Hudud kiritilishi kerak"),
  address: z.string().min(5, "Manzil kamida 5 belgidan iborat bo'lishi kerak"),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string(),
});

// Transaction validators
export const createTransactionSchema = z.object({
  title: z.string().min(2, "Sarlavha kiritilishi kerak"),
  category: z.string().min(2, "Kategoriya kiritilishi kerak"),
  account: z.string().min(2, "Hisob kiritilishi kerak"),
  amount: z.number().positive("Summa musbat son bo'lishi kerak"),
  type: z.enum(["income", "expense"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string(),
});

// Order validators
export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Mijoz tanlanishi kerak"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number().int().positive("Miqdor musbat bo'lishi kerak"),
        price: z.number().positive("Narx musbat bo'lishi kerak"),
      })
    )
    .min(1, "Kamida bitta mahsulot bo'lishi kerak"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  assignedTo: z.string().min(1, "Mas'ul shaxs tanlanishi kerak"),
  note: z.string().optional(),
});

export const updateOrderSchema = createOrderSchema.partial().extend({
  id: z.string(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
});

// Pagination validators
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Validator middleware yaratuvchi
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validatsiya xatosi",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validatsiya xatosi",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}
