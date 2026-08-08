import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Product, StockMovement, WarehouseStats } from "@shared/api";
import {
  active,
  applyStockChange,
  logActivity,
  movements,
  nextId,
  products,
  softRemove,
} from "../data/store";
import { isLowStock, warehouseBreakdown, warehouseStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  paramId,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const productSchema = z.object({
  name: z.string().trim().min(1, "mahsulot nomi kiritilishi shart"),
  location: z.string().trim().min(1).catch("Asosiy ombor"),
  quantity: z.coerce.number().int().min(0, "qoldiq manfiy bo'lishi mumkin emas"),
  minQuantity: z.coerce.number().int().min(0).catch(10),
  price: z.coerce.number().positive("narx noldan katta bo'lishi kerak"),
  category: z.string().trim().min(1).catch("Boshqa"),
  supplier: z.string().trim().min(1).catch("Noma'lum"),
});

const querySchema = paginationSchema.extend({
  category: z.string().optional(),
  location: z.string().optional(),
  lowStockOnly: z
    .string()
    .transform((value) => value === "true")
    .catch(false),
});

export const getWarehouseStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<WarehouseStats> = {
    success: true,
    data: warehouseStats(),
  };
  res.json(response);
};

/** Kategoriya/joy bo'yicha qiymat, top ta'minotchilar va tanqis mahsulotlar. */
export const getWarehouseBreakdown: RequestHandler = (_req, res) => {
  res.json({ success: true, data: warehouseBreakdown() });
};

export const getProducts: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(products).filter((p) => {
    if (
      search &&
      !p.name.toLowerCase().includes(search) &&
      !p.category.toLowerCase().includes(search) &&
      !p.supplier.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (query.category && p.category !== query.category) return false;
    if (query.location && p.location !== query.location) return false;
    if (query.lowStockOnly && !isLowStock(p)) return false;
    return true;
  });

  res.json(paginate(filtered, query.page, query.limit));
};

/** Kategoriya va ombor joylari — filtr ro'yxatlari uchun. */
export const getProductFilters: RequestHandler = (_req, res) => {
  res.json({
    success: true,
    data: {
      categories: [...new Set(products.map((p) => p.category))].sort(),
      locations: [...new Set(products.map((p) => p.location))].sort(),
    },
  });
};

export const createProduct: RequestHandler = (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const newProduct: Product = {
    id: nextId(),
    name: parsed.data.name,
    location: parsed.data.location,
    quantity: parsed.data.quantity,
    minQuantity: parsed.data.minQuantity,
    price: parsed.data.price,
    category: parsed.data.category,
    supplier: parsed.data.supplier,
  };

  products.unshift(newProduct);
  logActivity({
    action: "Yangi mahsulot qo'shildi",
    details: `${newProduct.name} · ${newProduct.quantity} dona`,
    icon: "PackagePlus",
  });

  const response: ApiResponse<Product> = {
    success: true,
    data: newProduct,
    message: "Mahsulot muvaffaqiyatli qo'shildi",
  };
  res.status(201).json(response);
};

export const updateProduct: RequestHandler = (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const product = products.find((p) => p.id === paramId(req) && !p.deletedAt);
  if (!product) return sendNotFound(res, "Mahsulot topilmadi");

  const wasLow = isLowStock(product);
  Object.assign(product, parsed.data);

  // Qoldiq tanqis darajaga endigina tushgan bo'lsa, buni jurnalda alohida belgilaymiz.
  if (!wasLow && isLowStock(product)) {
    logActivity({
      action: "Mahsulot qoldig'i tanqis darajaga tushdi",
      details: `${product.name} · ${product.quantity} dona`,
      icon: "PackageMinus",
    });
  } else {
    logActivity({
      action: "Mahsulot ma'lumotlari yangilandi",
      details: product.name,
      icon: "PenLine",
    });
  }

  const response: ApiResponse<Product> = {
    success: true,
    data: product,
    message: "Mahsulot ma'lumotlari yangilandi",
  };
  res.json(response);
};

export const deleteProduct: RequestHandler = (req, res) => {
  const removed = softRemove(products, paramId(req));
  if (!removed) return sendNotFound(res, "Mahsulot topilmadi");

  logActivity({
    action: "Mahsulot o'chirildi",
    details: removed.name,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Mahsulot o'chirildi",
  };
  res.json(response);
};

const movementQuerySchema = paginationSchema.extend({
  productId: z.string().optional(),
  type: z.enum(["in", "out", "adjustment"]).optional().catch(undefined),
});

/** Ombor harakatlari jurnali — qoldiq nega o'zgargani tarixi. */
export const getStockMovements: RequestHandler = (req, res) => {
  const query = movementQuerySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = movements.filter((m) => {
    if (
      search &&
      !m.productName.toLowerCase().includes(search) &&
      !m.reason.toLowerCase().includes(search) &&
      !m.reference.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (query.productId && m.productId !== query.productId) return false;
    if (query.type && m.type !== query.type) return false;
    return true;
  });

  res.json(paginate(filtered, query.page, query.limit));
};

const adjustSchema = z.object({
  /** Musbat — kirim, manfiy — chiqim. */
  delta: z.coerce.number().int().refine((value) => value !== 0, "o'zgarish nolga teng bo'lmasligi kerak"),
  reason: z.string().trim().min(1, "sabab kiritilishi shart"),
});

/** Qo'lda qoldiq tuzatish (inventarizatsiya, yaroqsizga chiqarish va h.k.). */
export const adjustStock: RequestHandler = (req, res) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const product = products.find((p) => p.id === paramId(req) && !p.deletedAt);
  if (!product) return sendNotFound(res, "Mahsulot topilmadi");

  if (product.quantity + parsed.data.delta < 0) {
    return res.status(409).json({
      success: false,
      message: `Omborda ${product.quantity} dona bor — bundan ko'pini chiqarib bo'lmaydi`,
    });
  }

  const movement = applyStockChange(product, parsed.data.delta, {
    reason: parsed.data.reason,
    reference: "Qo'lda tuzatish",
    type: "adjustment",
  });

  logActivity({
    action: "Qoldiq qo'lda tuzatildi",
    details: `${product.name} · ${parsed.data.delta > 0 ? "+" : ""}${parsed.data.delta} dona`,
    icon: parsed.data.delta > 0 ? "PackagePlus" : "PackageMinus",
  });

  const response: ApiResponse<StockMovement> = {
    success: true,
    data: movement,
    message: "Qoldiq yangilandi",
  };
  res.json(response);
};

/**
 * Tanqis mahsulotlar uchun xarid buyurtmasi — qoldiqni minimal darajaning ikki barobariga
 * to'ldiradi. "Buyurtma berish" tugmasi shu endpointni chaqiradi.
 */
export const restockLowProducts: RequestHandler = (_req, res) => {
  const low = active(products).filter(isLowStock);

  low.forEach((product) => {
    // minQuantity 0 bo'lganda ikkilantirish ham 0 beradi va mahsulot tanqisligicha
    // qolib ketadi — shuning uchun kamida 1 dona kafolatlanadi.
    const target = Math.max(product.minQuantity * 2, 1);
    applyStockChange(product, target - product.quantity, {
      reason: "Xarid buyurtmasi bo'yicha to'ldirish",
      reference: "Avtomatik xarid",
      type: "in",
    });
  });

  if (low.length > 0) {
    logActivity({
      action: "Xarid buyurtmasi yaratildi",
      details: `${low.length} ta tanqis mahsulot to'ldirildi`,
      icon: "PackagePlus",
    });
  }

  res.json({
    success: true,
    data: low,
    message:
      low.length === 0
        ? "Tanqis mahsulot yo'q"
        : `${low.length} ta mahsulot qoldig'i to'ldirildi`,
  });
};
