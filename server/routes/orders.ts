import { RequestHandler } from "express";
import { z } from "zod";
import {
  ApiResponse,
  Order,
  OrderBreakdown,
  OrderItem,
  OrderStats,
  OrderStatus,
} from "@shared/api";
import {
  applyStockChange,
  customers,
  logActivity,
  nextId,
  orders,
  products,
  active,
  softRemove,
  transactions,
} from "../data/store";
import { orderBreakdown, orderStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;

/**
 * Shu bosqichlarda tovar ombordan ajratilgan hisoblanadi.
 * Qoralama va bekor qilingan buyurtma qoldiqqa ta'sir qilmaydi.
 */
const STOCK_COMMITTED: OrderStatus[] = ["confirmed", "shipped", "delivered"];
const isCommitted = (status: OrderStatus) => STOCK_COMMITTED.includes(status);

const orderSchema = z.object({
  customerId: z.string().trim().min(1, "mijoz tanlanishi shart"),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.coerce.number().int().positive("miqdor noldan katta bo'lishi kerak"),
        price: z.coerce.number().min(0).optional(),
      }),
    )
    .min(1, "kamida bitta mahsulot qo'shilishi kerak"),
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  assignedTo: z.string().trim().min(1, "mas'ul xodim tanlanishi shart"),
  note: z.string().trim().catch(""),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

const querySchema = paginationSchema.extend({
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional().catch(undefined),
  customerId: z.string().optional(),
});

/** Keyingi bo'sh buyurtma raqami — mavjud eng kattasidan bittaga ko'p. */
function nextOrderNumber(): string {
  const max = orders.reduce((highest, order) => {
    const parsed = Number(order.orderNumber.replace(/\D/g, ""));
    return Number.isFinite(parsed) && parsed > highest ? parsed : highest;
  }, 1000);
  return `ORD-${max + 1}`;
}

/**
 * So'rovdagi qatorlarni tekshiradi va narx suratini oladi.
 * Narx berilmasa mahsulotning joriy narxi qo'yiladi.
 */
function buildItems(
  rows: { productId: string; quantity: number; price?: number }[],
): { items: OrderItem[] } | { error: string } {
  const items: OrderItem[] = [];

  for (const row of rows) {
    const product = products.find((p) => p.id === row.productId);
    if (!product) return { error: `Mahsulot topilmadi: ${row.productId}` };

    const existing = items.find((item) => item.productId === product.id);
    if (existing) {
      // Bir mahsulot ikki marta kiritilsa miqdorlar qo'shiladi.
      existing.quantity += row.quantity;
      continue;
    }

    items.push({
      productId: product.id,
      productName: product.name,
      quantity: row.quantity,
      price: row.price ?? product.price,
    });
  }

  return { items };
}

function orderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

/** Qatorlar bo'yicha omborda yetarli qoldiq bor-yo'qligini tekshiradi. */
function findInsufficientStock(items: OrderItem[]): string | null {
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return `Mahsulot topilmadi: ${item.productName}`;
    if (product.quantity < item.quantity) {
      return `${product.name}: omborda ${product.quantity} dona bor, ${item.quantity} dona so'ralmoqda`;
    }
  }
  return null;
}

/** Buyurtma qatorlari bo'yicha qoldiqni kamaytiradi va harakatlarni yozadi. */
function commitStock(order: Order): void {
  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    applyStockChange(product, -item.quantity, {
      reason: "Buyurtma bo'yicha chiqim",
      reference: order.orderNumber,
      type: "out",
    });
  }
}

/** Bekor qilingan yoki qoralamaga qaytarilgan buyurtma qoldig'ini tiklaydi. */
function releaseStock(order: Order): void {
  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    applyStockChange(product, item.quantity, {
      reason: "Buyurtma bekor qilindi",
      reference: order.orderNumber,
      type: "in",
    });
  }
}

/** To'liq to'langan buyurtma uchun moliyaga daromad yozuvi qo'shadi. */
function recordRevenue(order: Order): void {
  transactions.unshift({
    id: nextId(),
    title: `${order.customerName} · ${order.orderNumber}`,
    category: "Savdo daromadi",
    account: "Ipak Yo'li bank · UZS",
    date: new Date().toISOString().split("T")[0],
    amount: order.total,
    type: "income",
  });
}

export const getOrderStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<OrderStats> = { success: true, data: orderStats() };
  res.json(response);
};

export const getOrderBreakdown: RequestHandler = (_req, res) => {
  const response: ApiResponse<OrderBreakdown> = { success: true, data: orderBreakdown() };
  res.json(response);
};

export const getOrders: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(orders)
    .filter((o) => {
      if (
        search &&
        !o.orderNumber.toLowerCase().includes(search) &&
        !o.customerName.toLowerCase().includes(search) &&
        !o.assignedTo.toLowerCase().includes(search) &&
        !o.items.some((item) => item.productName.toLowerCase().includes(search))
      ) {
        return false;
      }
      if (query.status && o.status !== query.status) return false;
      if (query.paymentStatus && o.paymentStatus !== query.paymentStatus) return false;
      if (query.customerId && o.customerId !== query.customerId) return false;
      return true;
    })
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate));

  res.json(paginate(filtered, query.page, query.limit));
};

export const getOrderDetail: RequestHandler = (req, res) => {
  const order = orders.find((o) => o.id === req.params.id && !o.deletedAt);
  if (!order) return sendNotFound(res, "Buyurtma topilmadi");

  res.json({
    success: true,
    data: {
      order,
      customer: customers.find((c) => c.id === order.customerId) ?? null,
    },
  });
};

export const createOrder: RequestHandler = (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const customer = customers.find((c) => c.id === parsed.data.customerId && !c.deletedAt);
  if (!customer) return sendNotFound(res, "Mijoz topilmadi");

  const built = buildItems(parsed.data.items);
  if ("error" in built) {
    return res.status(400).json({ success: false, message: built.error });
  }

  const status = parsed.data.status ?? "draft";

  // Tovar ajratiladigan bosqichda qoldiq yetarli ekanini oldindan tekshiramiz.
  if (isCommitted(status)) {
    const problem = findInsufficientStock(built.items);
    if (problem) return res.status(409).json({ success: false, message: problem });
  }

  const newOrder: Order = {
    id: nextId(),
    orderNumber: nextOrderNumber(),
    customerId: customer.id,
    customerName: customer.name,
    items: built.items,
    total: orderTotal(built.items),
    status,
    paymentStatus: parsed.data.paymentStatus ?? "unpaid",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: parsed.data.deliveryDate,
    assignedTo: parsed.data.assignedTo,
    note: parsed.data.note,
  };

  orders.unshift(newOrder);
  if (isCommitted(newOrder.status)) commitStock(newOrder);
  if (newOrder.paymentStatus === "paid") recordRevenue(newOrder);

  logActivity({
    action: "Yangi buyurtma yaratildi",
    details: `${newOrder.orderNumber} · ${newOrder.customerName}`,
    icon: "Plus",
  });

  const response: ApiResponse<Order> = {
    success: true,
    data: newOrder,
    message: "Buyurtma muvaffaqiyatli yaratildi",
  };
  res.status(201).json(response);
};

export const updateOrder: RequestHandler = (req, res) => {
  const parsed = orderSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const order = orders.find((o) => o.id === req.params.id && !o.deletedAt);
  if (!order) return sendNotFound(res, "Buyurtma topilmadi");

  const previousStatus = order.status;
  const previousPayment = order.paymentStatus;
  const nextStatus = parsed.data.status ?? previousStatus;

  // Qatorlar o'zgarsa, avval eski band qilingan qoldiqni qaytaramiz.
  let nextItems = order.items;
  if (parsed.data.items) {
    const built = buildItems(parsed.data.items);
    if ("error" in built) {
      return res.status(400).json({ success: false, message: built.error });
    }
    nextItems = built.items;
    if (isCommitted(previousStatus)) releaseStock(order);
  }

  if (parsed.data.customerId) {
    const customer = customers.find((c) => c.id === parsed.data.customerId && !c.deletedAt);
    if (!customer) {
      // Qatorlar allaqachon qaytarilgan bo'lsa, holatni tiklab chiqamiz.
      if (parsed.data.items && isCommitted(previousStatus)) commitStock(order);
      return sendNotFound(res, "Mijoz topilmadi");
    }
    order.customerId = customer.id;
    order.customerName = customer.name;
  }

  const willCommit = isCommitted(nextStatus);
  const wasCommitted = isCommitted(previousStatus) && !parsed.data.items;

  // Yangi holat tovar ajratishni talab qilsa, qoldiq yetarliligini tekshiramiz.
  if (willCommit && !wasCommitted) {
    const candidate: Order = { ...order, items: nextItems };
    const problem = findInsufficientStock(candidate.items);
    if (problem) {
      // Tekshiruv o'tmadi — qatorlar uchun qaytarilgan qoldiqni joyiga qo'yamiz.
      if (parsed.data.items && isCommitted(previousStatus)) commitStock(order);
      return res.status(409).json({ success: false, message: problem });
    }
  }

  order.items = nextItems;
  order.total = orderTotal(nextItems);
  if (parsed.data.deliveryDate) order.deliveryDate = parsed.data.deliveryDate;
  if (parsed.data.assignedTo) order.assignedTo = parsed.data.assignedTo;
  if (parsed.data.note !== undefined) order.note = parsed.data.note;
  if (parsed.data.paymentStatus) order.paymentStatus = parsed.data.paymentStatus;
  order.status = nextStatus;

  // Qoldiqni holat o'zgarishiga qarab band qilamiz yoki bo'shatamiz.
  if (willCommit && !wasCommitted) commitStock(order);
  else if (!willCommit && isCommitted(previousStatus) && !parsed.data.items) {
    releaseStock(order);
  }

  // To'lov endigina yakunlandi — daromad bir marta yoziladi.
  if (previousPayment !== "paid" && order.paymentStatus === "paid") {
    recordRevenue(order);
  }

  logActivity({
    action:
      previousStatus !== order.status
        ? `Buyurtma holati: ${order.status}`
        : "Buyurtma yangilandi",
    details: `${order.orderNumber} · ${order.customerName}`,
    icon: order.status === "delivered" ? "Handshake" : "PenLine",
  });

  const response: ApiResponse<Order> = {
    success: true,
    data: order,
    message: "Buyurtma yangilandi",
  };
  res.json(response);
};

export const deleteOrder: RequestHandler = (req, res) => {
  const order = orders.find((o) => o.id === req.params.id && !o.deletedAt);
  if (!order) return sendNotFound(res, "Buyurtma topilmadi");

  // O'chirishdan oldin band qilingan qoldiqni omborga qaytaramiz.
  if (isCommitted(order.status)) releaseStock(order);
  softRemove(orders, order.id);

  logActivity({
    action: "Buyurtma o'chirildi",
    details: `${order.orderNumber} · ${order.customerName}`,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Buyurtma o'chirildi",
  };
  res.json(response);
};
