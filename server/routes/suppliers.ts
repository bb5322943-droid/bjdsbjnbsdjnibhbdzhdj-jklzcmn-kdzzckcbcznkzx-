import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Supplier, SupplierStats } from "@shared/api";
import { active, logActivity, nextId, products, softRemove, suppliers } from "../data/store";
import { supplierStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const supplierSchema = z.object({
  name: z.string().trim().min(1, "ta'minotchi nomi kiritilishi shart"),
  contactPerson: z.string().trim().catch(""),
  phone: z.string().trim().catch(""),
  email: z.string().trim().email("email formati noto'g'ri").or(z.literal("")).catch(""),
  category: z.string().trim().min(1).catch("Boshqa"),
  address: z.string().trim().catch(""),
  rating: z.coerce.number().min(1).max(5).catch(3),
  status: z.enum(["active", "inactive"]).optional(),
});

const querySchema = paginationSchema.extend({
  category: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional().catch(undefined),
});

export const getSupplierStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<SupplierStats> = { success: true, data: supplierStats() };
  res.json(response);
};

export const getSuppliers: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(suppliers).filter((s) => {
    if (
      search &&
      !s.name.toLowerCase().includes(search) &&
      !s.contactPerson.toLowerCase().includes(search) &&
      !s.category.toLowerCase().includes(search) &&
      !s.email.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (query.category && s.category !== query.category) return false;
    if (query.status && s.status !== query.status) return false;
    return true;
  });

  res.json(paginate(filtered, query.page, query.limit));
};

export const getSupplierCategories: RequestHandler = (_req, res) => {
  const categories = [...new Set(suppliers.map((s) => s.category))].sort();
  res.json({ success: true, data: categories });
};

/** Bitta ta'minotchi + u yetkazadigan mahsulotlar. */
export const getSupplierDetail: RequestHandler = (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  const supplied = active(products).filter((p) => p.supplier === supplier.name);

  res.json({
    success: true,
    data: {
      supplier,
      products: supplied,
      totalValue: supplied.reduce((sum, p) => sum + p.price * p.quantity, 0),
    },
  });
};

export const createSupplier: RequestHandler = (req, res) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  if (active(suppliers).some((s) => s.name.toLowerCase() === parsed.data.name.toLowerCase())) {
    return res
      .status(409)
      .json({ success: false, message: "Bu nom bilan ta'minotchi allaqachon mavjud" });
  }

  const newSupplier: Supplier = {
    id: nextId(),
    name: parsed.data.name,
    contactPerson: parsed.data.contactPerson,
    phone: parsed.data.phone,
    email: parsed.data.email,
    category: parsed.data.category,
    address: parsed.data.address,
    status: parsed.data.status ?? "active",
    rating: parsed.data.rating,
    createdDate: new Date().toISOString().split("T")[0],
  };

  suppliers.unshift(newSupplier);
  logActivity({
    action: "Yangi ta'minotchi qo'shildi",
    details: newSupplier.name,
    icon: "PackagePlus",
  });

  const response: ApiResponse<Supplier> = {
    success: true,
    data: newSupplier,
    message: "Ta'minotchi muvaffaqiyatli qo'shildi",
  };
  res.status(201).json(response);
};

export const updateSupplier: RequestHandler = (req, res) => {
  const parsed = supplierSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  const previousName = supplier.name;
  Object.assign(supplier, parsed.data);

  // Mahsulotlar ta'minotchini nomi orqali bog'laydi — nom o'zgarsa ular ham yangilanadi.
  if (parsed.data.name && parsed.data.name !== previousName) {
    products
      .filter((p) => p.supplier === previousName)
      .forEach((p) => {
        p.supplier = supplier.name;
      });
  }

  logActivity({
    action: "Ta'minotchi ma'lumotlari yangilandi",
    details: supplier.name,
    icon: "PenLine",
  });

  const response: ApiResponse<Supplier> = {
    success: true,
    data: supplier,
    message: "Ta'minotchi ma'lumotlari yangilandi",
  };
  res.json(response);
};

export const deleteSupplier: RequestHandler = (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  const linked = active(products).filter((p) => p.supplier === supplier.name).length;
  if (linked > 0) {
    return res.status(409).json({
      success: false,
      message: `Bu ta'minotchiga ${linked} ta mahsulot bog'langan. Avval ularni boshqa ta'minotchiga o'tkazing.`,
    });
  }

  softRemove(suppliers, supplier.id);
  logActivity({
    action: "Ta'minotchi o'chirildi",
    details: supplier.name,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Ta'minotchi o'chirildi",
  };
  res.json(response);
};
