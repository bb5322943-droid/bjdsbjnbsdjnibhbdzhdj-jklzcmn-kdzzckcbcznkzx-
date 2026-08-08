import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Sale, SaleItem, Refund, SalesStats } from "@shared/api";
import { active, logActivity, nextId, products, applyStockChange } from "../data/store";
import { sendValidationError } from "../lib/http";

// Sales va refunds store.ts da e'lon qilingan
import { sales, refunds } from "../data/store";

const saleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  total: z.number(),
  discount: z.number().optional().default(0),
});

const createSaleSchema = z.object({
  customerId: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  items: z.array(saleItemSchema).min(1, "Kamida 1 ta mahsulot kerak"),
  subtotal: z.number().positive(),
  discount: z.number().optional().default(0),
  tax: z.number().optional().default(0),
  total: z.number().positive(),
  paymentMethod: z.enum(["cash", "card", "transfer", "credit", "mixed"]),
  sellerId: z.string(),
  sellerName: z.string(),
  branchId: z.string(),
  branchName: z.string(),
  note: z.string().optional().default(""),
});

const refundSchema = z.object({
  originalSaleId: z.string(),
  items: z.array(saleItemSchema).min(1, "Kamida 1 ta mahsulot kerak"),
  refundReason: z.string().min(1, "Qaytarish sababini kiriting"),
  paymentMethod: z.enum(["cash", "card", "transfer"]),
});

/** Sotuvlar statistikasi */
export const getSalesStats: RequestHandler = (_req, res) => {
  const activeSales = active(sales);
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const todaySales = activeSales.filter(s => s.saleDate.startsWith(today));
  const monthSales = activeSales.filter(s => {
    const saleDate = s.saleDate.split("T")[0];
    return saleDate >= startOfMonth && saleDate <= endOfMonth;
  });

  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0);

  // Top mahsulotlar
  const productStats = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();
  
  monthSales.forEach(sale => {
    sale.items.forEach(item => {
      const existing = productStats.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.total;
      } else {
        productStats.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          revenue: item.total,
        });
      }
    });
  });

  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top sotuvchilar
  const sellerStats = new Map<string, { sellerId: string; sellerName: string; salesCount: number; revenue: number }>();
  
  monthSales.forEach(sale => {
    const existing = sellerStats.get(sale.sellerId);
    if (existing) {
      existing.salesCount++;
      existing.revenue += sale.total;
    } else {
      sellerStats.set(sale.sellerId, {
        sellerId: sale.sellerId,
        sellerName: sale.sellerName,
        salesCount: 1,
        revenue: sale.total,
      });
    }
  });

  const topSellers = Array.from(sellerStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const stats: SalesStats = {
    todaySales: todayTotal,
    todayTransactions: todaySales.length,
    monthSales: monthTotal,
    monthTransactions: monthSales.length,
    topProducts,
    topSellers,
  };

  const response: ApiResponse<SalesStats> = { success: true, data: stats };
  res.json(response);
};

/** Sotuvlar ro'yxati */
export const getSales: RequestHandler = (req, res) => {
  const { page = "1", limit = "20", search = "", status = "" } = req.query;

  let filtered = active(sales);

  if (search) {
    const searchLower = String(search).toLowerCase();
    filtered = filtered.filter(
      s =>
        s.saleNumber.toLowerCase().includes(searchLower) ||
        s.customerName?.toLowerCase().includes(searchLower) ||
        s.customerPhone?.includes(searchLower)
    );
  }

  if (status && status !== "__all__") {
    filtered = filtered.filter(s => s.status === status);
  }

  filtered.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;

  const response: ApiResponse<Sale[]> = {
    success: true,
    data: filtered.slice(start, end),
    pagination: {
      page: pageNum,
      pages: Math.ceil(filtered.length / limitNum),
      total: filtered.length,
    },
  };

  res.json(response);
};

/** Yangi sotuv yaratish */
export const createSale: RequestHandler = (req, res) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { items, ...saleData } = parsed.data;

  // Ombordagi qoldiqni tekshirish
  for (const item of items) {
    const product = products.find(p => p.id === item.productId && !p.deletedAt);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Mahsulot topilmadi: ${item.productName}`,
      });
    }
    if (product.quantity < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `${product.name} uchun yetarli qoldiq yo'q. Mavjud: ${product.quantity}`,
      });
    }
  }

  // Sotuv yaratish
  const saleNumber = `S-${new Date().getFullYear()}-${String(sales.length + 1).padStart(6, "0")}`;
  const sale: Sale = {
    id: nextId(),
    saleNumber,
    ...saleData,
    items: items as SaleItem[],
    status: "completed",
    saleDate: new Date().toISOString(),
    receiptPrinted: true,
  };

  sales.push(sale);

  // Ombor qoldig'ini kamaytirish
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      applyStockChange(product, -item.quantity, {
        reason: "Sotuv",
        reference: saleNumber,
        type: "out",
      });
    }
  }

  logActivity({
    action: "Yangi sotuv",
    details: `${saleNumber} - ${saleData.total.toLocaleString()} so'm`,
    icon: "ShoppingCart",
  });

  const response: ApiResponse<Sale> = {
    success: true,
    data: sale,
    message: "Sotuv muvaffaqiyatli yaratildi",
  };
  res.json(response);
};

/** Sotuvni qaytarish (refund) */
export const refundSale: RequestHandler = (req, res) => {
  const { id } = req.params;
  const parsed = refundSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const sale = sales.find(s => s.id === id && !s.deletedAt);
  if (!sale) {
    return res.status(404).json({ success: false, message: "Sotuv topilmadi" });
  }

  if (sale.status === "refunded") {
    return res.status(400).json({ success: false, message: "Bu sotuv allaqachon qaytarilgan" });
  }

  const { items, refundReason, paymentMethod } = parsed.data;
  const refundAmount = items.reduce((sum, item) => sum + item.total, 0);

  // Refund yaratish
  const refundNumber = `R-${new Date().getFullYear()}-${String(refunds.length + 1).padStart(6, "0")}`;
  const refund: Refund = {
    id: nextId(),
    refundNumber,
    originalSaleId: sale.id,
    originalSaleNumber: sale.saleNumber,
    items: items as SaleItem[],
    refundAmount,
    refundReason,
    processedById: req.currentUser!.id,
    processedByName: req.currentUser!.name,
    refundDate: new Date().toISOString(),
    paymentMethod,
    status: "completed",
  };

  refunds.push(refund);

  // Sotuvning holatini o'zgartirish
  const isFullRefund = items.length === sale.items.length && 
    items.every(item => sale.items.find(si => si.productId === item.productId && si.quantity === item.quantity));

  sale.status = isFullRefund ? "refunded" : "partial_refund";

  // Mahsulotlarni omborga qaytarish
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      applyStockChange(product, item.quantity, {
        reason: "Sotuv qaytarildi",
        reference: refundNumber,
        type: "in",
      });
    }
  }

  logActivity({
    action: "Sotuv qaytarildi",
    details: `${sale.saleNumber} - ${refundAmount.toLocaleString()} so'm`,
    icon: "ArrowDownRight",
  });

  const response: ApiResponse<Refund> = {
    success: true,
    data: refund,
    message: "Sotuv qaytarildi",
  };
  res.json(response);
};

/** Sotuvni o'chirish (soft delete) */
export const deleteSale: RequestHandler = (req, res) => {
  const { id } = req.params;
  const sale = sales.find(s => s.id === id && !s.deletedAt);
  
  if (!sale) {
    return res.status(404).json({ success: false, message: "Sotuv topilmadi" });
  }

  if (sale.status === "completed") {
    return res.status(400).json({ 
      success: false, 
      message: "Tugallangan sotuvni o'chirish mumkin emas. Qaytarish (refund) qiling." 
    });
  }

  sale.deletedAt = new Date().toISOString();

  logActivity({
    action: "Sotuv o'chirildi",
    details: sale.saleNumber,
    icon: "Trash2",
  });

  res.json({ success: true, data: null, message: "Sotuv o'chirildi" });
};
