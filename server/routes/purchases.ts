import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Purchase, PurchaseItem, PurchaseStats, PurchaseStatus } from "@shared/api";
import {
  applyStockChange,
  logActivity,
  nextId,
  products,
  purchases,
  active,
  softRemove,
  suppliers,
  transactions,
} from "../data/store";
import { purchaseStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const PURCHASE_STATUSES = ["draft", "ordered", "received", "cancelled"] as const;
const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;

const purchaseSchema = z.object({
  supplierId: z.string().trim().min(1, "ta'minotchi tanlanishi shart"),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.coerce.number().int().positive("miqdor noldan katta bo'lishi kerak"),
        cost: z.coerce.number().min(0).optional(),
      }),
    )
    .min(1, "kamida bitta mahsulot qo'shilishi kerak"),
  expectedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  createdBy: z.string().trim().min(1, "mas'ul xodim tanlanishi shart"),
  note: z.string().trim().catch(""),
  status: z.enum(PURCHASE_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

const querySchema = paginationSchema.extend({
  status: z.enum(PURCHASE_STATUSES).optional().catch(undefined),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional().catch(undefined),
  supplierId: z.string().optional(),
});

function nextPurchaseNumber(): string {
  const max = purchases.reduce((highest, purchase) => {
    const parsed = Number(purchase.purchaseNumber.replace(/\D/g, ""));
    return Number.isFinite(parsed) && parsed > highest ? parsed : highest;
  }, 2000);
  return `PO-${max + 1}`;
}

/** So'rovdagi qatorlarni tekshiradi; tannarx berilmasa sotish narxining 70% i olinadi. */
function buildItems(
  rows: { productId: string; quantity: number; cost?: number }[],
): { items: PurchaseItem[] } | { error: string } {
  const items: PurchaseItem[] = [];

  for (const row of rows) {
    const product = products.find((p) => p.id === row.productId);
    if (!product) return { error: `Mahsulot topilmadi: ${row.productId}` };

    const existing = items.find((item) => item.productId === product.id);
    if (existing) {
      existing.quantity += row.quantity;
      continue;
    }

    items.push({
      productId: product.id,
      productName: product.name,
      quantity: row.quantity,
      cost: row.cost ?? Math.round(product.price * 0.7),
    });
  }

  return { items };
}

function purchaseTotal(items: PurchaseItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
}

/** Tovar qabul qilinganda qoldiq oshadi va harakat jurnaliga yoziladi. */
function receiveStock(purchase: Purchase): void {
  for (const item of purchase.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    applyStockChange(product, item.quantity, {
      reason: "Xarid bo'yicha qabul",
      reference: purchase.purchaseNumber,
      type: "in",
    });
  }
}

/** Qabul bekor qilinsa, kirim qilingan tovar hisobdan chiqariladi. */
function reverseStock(purchase: Purchase): void {
  for (const item of purchase.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    applyStockChange(product, -item.quantity, {
      reason: "Xarid qabuli bekor qilindi",
      reference: purchase.purchaseNumber,
      type: "out",
    });
  }
}

/** To'langan xarid uchun moliyaga xarajat yozuvi qo'shadi. */
function recordExpense(purchase: Purchase): void {
  transactions.unshift({
    id: nextId(),
    title: `${purchase.supplierName} · ${purchase.purchaseNumber}`,
    category: "Xarid",
    account: "Ipak Yo'li bank · UZS",
    date: new Date().toISOString().split("T")[0],
    amount: purchase.total,
    type: "expense",
  });
}

export const getPurchaseStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<PurchaseStats> = { success: true, data: purchaseStats() };
  res.json(response);
};

export const getPurchases: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(purchases)
    .filter((p) => {
      if (
        search &&
        !p.purchaseNumber.toLowerCase().includes(search) &&
        !p.supplierName.toLowerCase().includes(search) &&
        !p.createdBy.toLowerCase().includes(search) &&
        !p.items.some((item) => item.productName.toLowerCase().includes(search))
      ) {
        return false;
      }
      if (query.status && p.status !== query.status) return false;
      if (query.paymentStatus && p.paymentStatus !== query.paymentStatus) return false;
      if (query.supplierId && p.supplierId !== query.supplierId) return false;
      return true;
    })
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate));

  res.json(paginate(filtered, query.page, query.limit));
};

export const createPurchase: RequestHandler = (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const supplier = suppliers.find((s) => s.id === parsed.data.supplierId);
  if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");

  const built = buildItems(parsed.data.items);
  if ("error" in built) {
    return res.status(400).json({ success: false, message: built.error });
  }

  const newPurchase: Purchase = {
    id: nextId(),
    purchaseNumber: nextPurchaseNumber(),
    supplierId: supplier.id,
    supplierName: supplier.name,
    items: built.items,
    total: purchaseTotal(built.items),
    status: parsed.data.status ?? "draft",
    paymentStatus: parsed.data.paymentStatus ?? "unpaid",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: parsed.data.expectedDate,
    createdBy: parsed.data.createdBy,
    note: parsed.data.note,
  };

  purchases.unshift(newPurchase);
  if (newPurchase.status === "received") receiveStock(newPurchase);
  if (newPurchase.paymentStatus === "paid") recordExpense(newPurchase);

  logActivity({
    action: "Xarid buyurtmasi yaratildi",
    details: `${newPurchase.purchaseNumber} · ${newPurchase.supplierName}`,
    icon: "PackagePlus",
  });

  const response: ApiResponse<Purchase> = {
    success: true,
    data: newPurchase,
    message: "Xarid buyurtmasi yaratildi",
  };
  res.status(201).json(response);
};

export const updatePurchase: RequestHandler = (req, res) => {
  const parsed = purchaseSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const purchase = purchases.find((p) => p.id === req.params.id && !p.deletedAt);
  if (!purchase) return sendNotFound(res, "Xarid buyurtmasi topilmadi");

  const wasReceived = purchase.status === "received";
  const previousPayment = purchase.paymentStatus;
  const nextStatus: PurchaseStatus = parsed.data.status ?? purchase.status;

  // Qatorlar o'zgarsa, avval qabul qilingan tovarni hisobdan chiqaramiz.
  if (parsed.data.items) {
    const built = buildItems(parsed.data.items);
    if ("error" in built) {
      return res.status(400).json({ success: false, message: built.error });
    }
    if (wasReceived) reverseStock(purchase);
    purchase.items = built.items;
    purchase.total = purchaseTotal(built.items);
  }

  if (parsed.data.supplierId) {
    const supplier = suppliers.find((s) => s.id === parsed.data.supplierId);
    if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
    purchase.supplierId = supplier.id;
    purchase.supplierName = supplier.name;
  }

  if (parsed.data.expectedDate) purchase.expectedDate = parsed.data.expectedDate;
  if (parsed.data.createdBy) purchase.createdBy = parsed.data.createdBy;
  if (parsed.data.note !== undefined) purchase.note = parsed.data.note;
  if (parsed.data.paymentStatus) purchase.paymentStatus = parsed.data.paymentStatus;
  purchase.status = nextStatus;

  // Qabul holatiga o'tish/qaytish qoldiqni o'zgartiradi.
  const isReceivedNow = purchase.status === "received";
  const alreadyCounted = wasReceived && !parsed.data.items;
  if (isReceivedNow && !alreadyCounted) receiveStock(purchase);
  else if (!isReceivedNow && alreadyCounted) reverseStock(purchase);

  if (previousPayment !== "paid" && purchase.paymentStatus === "paid") {
    recordExpense(purchase);
  }

  logActivity({
    action:
      purchase.status === "received"
        ? "Xarid qabul qilindi"
        : "Xarid buyurtmasi yangilandi",
    details: `${purchase.purchaseNumber} · ${purchase.supplierName}`,
    icon: purchase.status === "received" ? "PackagePlus" : "PenLine",
  });

  const response: ApiResponse<Purchase> = {
    success: true,
    data: purchase,
    message: "Xarid buyurtmasi yangilandi",
  };
  res.json(response);
};

export const deletePurchase: RequestHandler = (req, res) => {
  const purchase = purchases.find((p) => p.id === req.params.id && !p.deletedAt);
  if (!purchase) return sendNotFound(res, "Xarid buyurtmasi topilmadi");

  // Qabul qilingan tovar hisobdan chiqariladi, aks holda qoldiq oshib qoladi.
  if (purchase.status === "received") reverseStock(purchase);
  softRemove(purchases, purchase.id);

  logActivity({
    action: "Xarid buyurtmasi o'chirildi",
    details: `${purchase.purchaseNumber} · ${purchase.supplierName}`,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Xarid buyurtmasi o'chirildi",
  };
  res.json(response);
};
