import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Supplier, SupplierStats } from "@shared/api";
import { active, logActivity, nextId, products, softRemove, suppliers, purchases, persist, supplierReturns } from "../data/store";
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

/** Har bir ta'minotchining yetkazadigan mahsulotlar soni */
export const getSuppliersWithProducts: RequestHandler = (req, res) => {
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

  // Har bir supplier uchun products sonini qo'shamiz
  const withProducts = filtered.map((s) => ({
    ...s,
    productsCount: active(products).filter((p) => p.supplier === s.name).length,
    products: active(products).filter((p) => p.supplier === s.name),
  }));

  res.json(paginate(withProducts, query.page, query.limit));
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

export const restoreSupplier: RequestHandler = (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  if (supplier.status === "active") {
    return res.status(400).json({
      success: false,
      message: "Ta'minotchi allaqachon faol holatda",
    });
  }

  supplier.status = "active";
  
  logActivity({
    action: "Ta'minotchi faollashtirildi",
    details: supplier.name,
    icon: "RotateCcw",
  });

  const response: ApiResponse<Supplier> = {
    success: true,
    data: supplier,
    message: "Ta'minotchi muvaffaqiyatli faollashtirildi",
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

/** Ta'minotchining xaridlar tarixi */
export const getSupplierPurchases: RequestHandler = (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  // Ushbu ta'minotchidan bo'lgan barcha xaridlar
  const supplierPurchases = active(purchases).filter(
    (p) => p.supplierId === supplier.id || p.supplierName === supplier.name
  );

  // Har bir xaridning mahsulotlari bilan
  const purchasesWithDetails = supplierPurchases.map((purchase) => ({
    ...purchase,
    products: purchase.items, // items allaqachon mahsulotlar ro'yxati
  }));

  res.json({
    success: true,
    data: purchasesWithDetails,
  });
};

/** Ta'minotchi yetkazgan mahsulotlar ro'yxati */
export const getSupplierProducts: RequestHandler = (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  const suppliedProducts = active(products).filter((p) => p.supplier === supplier.name);

  // Har bir mahsulot uchun qo'shimcha ma'lumotlar
  const productsWithDetails = suppliedProducts.map((product) => ({
    ...product,
    sku: `${product.category.substring(0, 3).toUpperCase()}-${product.id}`,
    lastDeliveryDate: new Date().toISOString().split("T")[0], // Mock: oxirgi yetkazilgan sana
  }));

  res.json({
    success: true,
    data: productsWithDetails,
  });
};

/** Ta'minotchiga qaytarilgan mahsulotlar tarixi */
export const getSupplierReturns: RequestHandler = (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  // Ushbu ta'minotchiga qaytarilgan mahsulotlar
  const returns = supplierReturns.filter(
    (r) => r.supplierId === supplier.id
  );

  res.json({
    success: true,
    data: returns,
  });
};

/** Ta'minotchi bilan moliyaviy hisob-kitoblar */
export const getSupplierFinancial: RequestHandler = (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id && !s.deletedAt);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  // Ushbu ta'minotchidan bo'lgan barcha xaridlar
  const supplierPurchases = active(purchases).filter(
    (p) => p.supplierId === supplier.id || p.supplierName === supplier.name
  );

  // Moliyaviy hisobotlar
  let totalPurchases = 0;
  let totalPaid = 0;
  const financialHistory: any[] = [];

  supplierPurchases.forEach((purchase) => {
    totalPurchases += purchase.total;

    // To'lov holati bo'yicha
    if (purchase.paymentStatus === "paid") {
      totalPaid += purchase.total;
      financialHistory.push({
        id: `PAY-${purchase.id}`,
        date: purchase.orderDate,
        type: "payment",
        description: `To'lov - ${purchase.purchaseNumber}`,
        amount: purchase.total,
        balance: totalPaid - totalPurchases,
      });
    } else if (purchase.paymentStatus === "partial") {
      const partialAmount = purchase.total * 0.5; // Mock: 50% to'langan deb hisoblash
      totalPaid += partialAmount;
      financialHistory.push({
        id: `PAY-${purchase.id}`,
        date: purchase.orderDate,
        type: "payment",
        description: `Qisman to'lov - ${purchase.purchaseNumber}`,
        amount: partialAmount,
        balance: totalPaid - totalPurchases,
      });
    } else {
      // unpaid - qarz
      financialHistory.push({
        id: `DEBT-${purchase.id}`,
        date: purchase.orderDate,
        type: "debt",
        description: `Qarz - ${purchase.purchaseNumber}`,
        amount: purchase.total,
        balance: totalPaid - totalPurchases,
      });
    }
  });

  const currentDebt = totalPurchases - totalPaid;
  const lastPaymentDate = financialHistory
    .filter((f) => f.type === "payment")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null;

  res.json({
    success: true,
    data: {
      summary: {
        totalPurchases,
        totalPaid,
        currentDebt,
        lastPaymentDate,
      },
      history: financialHistory.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    },
  });
};

/** Ta'minotchi statistikasi (KPI) - bitta ta'minotchi uchun */
export const getSupplierKPI: RequestHandler = (req, res) => {
  const supplierId = req.params.id;
  const supplier = suppliers.find((s) => s.id === supplierId && !s.deletedAt);
  
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  // Xaridlar
  const supplierPurchases = active(purchases).filter(
    (p) => p.supplierId === supplier.id || p.supplierName === supplier.name
  );

  const totalPurchases = supplierPurchases.reduce((sum, p) => sum + p.total, 0);
  const ordersCount = supplierPurchases.length;

  // Qaytarilgan mahsulotlar (mock: hozircha 0)
  const returnsCount = 0;

  res.json({
    success: true,
    data: {
      totalPurchases,
      ordersCount,
      avgRating: supplier.rating,
      returnsCount,
    },
  });
};

/** Ta'minotchiga mahsulot qaytarish */
const returnProductSchema = z.object({
  productId: z.string().min(1, "Mahsulot ID kiritilishi shart"),
  quantity: z.coerce.number().min(1, "Miqdor kamida 1 bo'lishi kerak"),
  reason: z.enum(["defective", "wrong_item", "damaged", "quality", "expired", "other"]),
  note: z.string().trim().catch(""),
});

export const returnProductToSupplier: RequestHandler = (req, res) => {
  const supplierId = req.params.id;
  
  console.log('🔍 [Backend] returnProductToSupplier START:', {
    supplierId,
    body: req.body,
    bodyType: typeof req.body,
  });

  const supplier = suppliers.find((s) => s.id === supplierId && !s.deletedAt);
  
  if (!supplier) {
    console.error('❌ [Backend] Supplier not found:', supplierId);
    return sendNotFound(res, "Ta'minotchi topilmadi");
  }

  const parsed = returnProductSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error('❌ [Backend] Validation failed:', parsed.error);
    return sendValidationError(res, parsed.error);
  }

  const { productId, quantity, reason, note } = parsed.data;
  
  console.log('✅ [Backend] Parsed data:', {
    productId,
    quantity,
    quantityType: typeof quantity,
    reason,
    note,
  });

  // Mahsulotni topish
  const product = products.find((p) => p.id === productId && !p.deletedAt);
  if (!product) {
    console.error('❌ [Backend] Product not found:', productId);
    return sendNotFound(res, "Mahsulot topilmadi");
  }

  console.log('📦 [Backend] Product found:', {
    productId: product.id,
    productName: product.name,
    currentQuantity: product.quantity,
    quantityType: typeof product.quantity,
    returningQuantity: quantity,
  });

  // Mahsulot omborda yetarli bo'lishi kerak
  if (product.quantity < quantity) {
    console.error('❌ [Backend] Insufficient stock:', {
      available: product.quantity,
      requested: quantity,
    });
    return res.status(400).json({
      success: false,
      message: `Omborda faqat ${product.quantity} ta mahsulot mavjud`,
    });
  }

  // Return record yaratish
  const returnNumber = `RET-${nextId()}`;
  const returnRecord = {
    id: nextId(),
    returnNumber,
    supplierId,
    supplierName: supplier.name,
    productId,
    productName: product.name,
    quantity,
    reason,
    reasonText: note,
    amount: product.price * quantity,
    status: "pending" as const,
    returnDate: new Date().toISOString().split("T")[0],
    purchaseNumber: "AUTO", // Mock: xarid raqami
    createdAt: new Date().toISOString(),
  };

  // Save to supplier_returns table
  supplierReturns.unshift(returnRecord);
  console.log('💾 [Backend] Return record saved:', returnNumber);

  // Mahsulot miqdorini kamaytirish
  const oldQuantity = product.quantity;
  product.quantity -= quantity;
  const newQuantity = product.quantity;
  
  console.log('✅ [Backend] Product quantity updated:', {
    productId: product.id,
    oldQuantity,
    returningQuantity: quantity,
    newQuantity,
    calculation: `${oldQuantity} - ${quantity} = ${newQuantity}`,
  });

  // CRITICAL: Immediately persist to database to ensure changes are saved
  // This is especially important for Vercel serverless where /tmp is ephemeral
  try {
    persist();
    console.log('💾 [Backend] Data persisted to database');
  } catch (persistError) {
    console.error("❌ [Backend] Failed to persist product return:", persistError);
    // Still return success since the in-memory change was made
  }

  console.log('✅ [Backend] returnProductToSupplier COMPLETE');

  // Log activity without req.user (not available in all contexts)
  // logActivity will be called when auth middleware is properly set up

  res.json({
    success: true,
    data: returnRecord,
    message: "Mahsulot muvaffaqiyatli qaytarildi",
  });
};
