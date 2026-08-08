import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Invoice, InvoiceStats, InvoiceStatus } from "@shared/api";
import {
  customers,
  invoices,
  logActivity,
  nextId,
  orders,
  active,
  softRemove,
  transactions,
} from "../data/store";
import { invoiceStats, isOverdueInvoice, todayISO } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  paramId,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;

const invoiceSchema = z.object({
  customerId: z.string().trim().min(1, "mijoz tanlanishi shart"),
  orderId: z.string().trim().nullable().optional(),
  amount: z.coerce.number().positive("summa noldan katta bo'lishi kerak"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  note: z.string().trim().catch(""),
  status: z.enum(INVOICE_STATUSES).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
});

const querySchema = paginationSchema.extend({
  status: z.enum(INVOICE_STATUSES).optional().catch(undefined),
  customerId: z.string().optional(),
  overdueOnly: z
    .string()
    .transform((value) => value === "true")
    .catch(false),
});

function nextInvoiceNumber(): string {
  const max = invoices.reduce((highest, invoice) => {
    const parsed = Number(invoice.invoiceNumber.replace(/\D/g, ""));
    return Number.isFinite(parsed) && parsed > highest ? parsed : highest;
  }, 3000);
  return `INV-${max + 1}`;
}

/**
 * To'lov holatiga qarab faktura statusini aniqlaydi.
 * Qo'lda qo'yilgan `draft`/`cancelled` holatlari saqlanadi.
 */
function resolveStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === "draft" || invoice.status === "cancelled") return invoice.status;
  if (invoice.paidAmount >= invoice.amount) return "paid";
  return invoice.dueDate < todayISO() ? "overdue" : "sent";
}

/** To'lov tushganda moliyaga daromad yozuvi qo'shadi. */
function recordPayment(invoice: Invoice, amount: number): void {
  transactions.unshift({
    id: nextId(),
    title: `${invoice.customerName} · ${invoice.invoiceNumber}`,
    category: "Savdo daromadi",
    account: "Ipak Yo'li bank · UZS",
    date: todayISO(),
    amount,
    type: "income",
  });
}

export const getInvoiceStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<InvoiceStats> = { success: true, data: invoiceStats() };
  res.json(response);
};

export const getInvoices: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(invoices)
    // Muddati o'tganini har so'rovda qayta baholaymiz — sana o'zgarib turadi.
    .map((invoice) => {
      invoice.status = resolveStatus(invoice);
      return invoice;
    })
    .filter((invoice) => {
      if (
        search &&
        !invoice.invoiceNumber.toLowerCase().includes(search) &&
        !invoice.customerName.toLowerCase().includes(search) &&
        !invoice.orderNumber.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (query.status && invoice.status !== query.status) return false;
      if (query.customerId && invoice.customerId !== query.customerId) return false;
      if (query.overdueOnly && !isOverdueInvoice(invoice)) return false;
      return true;
    })
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  res.json(paginate(filtered, query.page, query.limit));
};

export const createInvoice: RequestHandler = (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const customer = customers.find((c) => c.id === parsed.data.customerId);
  if (!customer) return sendNotFound(res, "Mijoz topilmadi");

  const order = parsed.data.orderId
    ? orders.find((o) => o.id === parsed.data.orderId)
    : null;
  if (parsed.data.orderId && !order) return sendNotFound(res, "Buyurtma topilmadi");

  const newInvoice: Invoice = {
    id: nextId(),
    invoiceNumber: nextInvoiceNumber(),
    orderId: order?.id ?? null,
    orderNumber: order?.orderNumber ?? "—",
    customerId: customer.id,
    customerName: customer.name,
    amount: parsed.data.amount,
    paidAmount: parsed.data.paidAmount ?? 0,
    status: parsed.data.status ?? "sent",
    issueDate: todayISO(),
    dueDate: parsed.data.dueDate,
    note: parsed.data.note,
  };
  newInvoice.status = resolveStatus(newInvoice);

  invoices.unshift(newInvoice);
  if (newInvoice.paidAmount > 0) recordPayment(newInvoice, newInvoice.paidAmount);

  logActivity({
    action: "Hisob-faktura chiqarildi",
    details: `${newInvoice.invoiceNumber} · ${newInvoice.customerName}`,
    icon: "FileText",
  });

  const response: ApiResponse<Invoice> = {
    success: true,
    data: newInvoice,
    message: "Hisob-faktura yaratildi",
  };
  res.status(201).json(response);
};

export const updateInvoice: RequestHandler = (req, res) => {
  const parsed = invoiceSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const invoice = invoices.find((i) => i.id === paramId(req) && !i.deletedAt);
  if (!invoice) return sendNotFound(res, "Hisob-faktura topilmadi");

  const previousPaid = invoice.paidAmount;

  if (parsed.data.customerId) {
    const customer = customers.find((c) => c.id === parsed.data.customerId);
    if (!customer) return sendNotFound(res, "Mijoz topilmadi");
    invoice.customerId = customer.id;
    invoice.customerName = customer.name;
  }
  if (parsed.data.amount !== undefined) invoice.amount = parsed.data.amount;
  if (parsed.data.dueDate) invoice.dueDate = parsed.data.dueDate;
  if (parsed.data.note !== undefined) invoice.note = parsed.data.note;
  if (parsed.data.status) invoice.status = parsed.data.status;

  if (parsed.data.paidAmount !== undefined) {
    // To'langan summa faktura summasidan oshmasligi kerak.
    invoice.paidAmount = Math.min(parsed.data.paidAmount, invoice.amount);
  }

  invoice.status = resolveStatus(invoice);

  // Faqat qo'shimcha tushgan summa daromad sifatida yoziladi.
  const delta = invoice.paidAmount - previousPaid;
  if (delta > 0) recordPayment(invoice, delta);

  logActivity({
    action: invoice.status === "paid" ? "Faktura to'landi" : "Faktura yangilandi",
    details: `${invoice.invoiceNumber} · ${invoice.customerName}`,
    icon: invoice.status === "paid" ? "CircleCheck" : "PenLine",
  });

  const response: ApiResponse<Invoice> = {
    success: true,
    data: invoice,
    message: "Hisob-faktura yangilandi",
  };
  res.json(response);
};

const paymentSchema = z.object({
  amount: z.coerce.number().positive("to'lov summasi noldan katta bo'lishi kerak"),
});

/** Faktura bo'yicha to'lov qayd etish — qisman to'lovlar ham qo'llab-quvvatlanadi. */
export const recordInvoicePayment: RequestHandler = (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const invoice = invoices.find((i) => i.id === paramId(req) && !i.deletedAt);
  if (!invoice) return sendNotFound(res, "Hisob-faktura topilmadi");

  const remaining = invoice.amount - invoice.paidAmount;
  if (remaining <= 0) {
    return res
      .status(409)
      .json({ success: false, message: "Bu faktura allaqachon to'liq to'langan" });
  }

  const applied = Math.min(parsed.data.amount, remaining);
  invoice.paidAmount += applied;
  invoice.status = resolveStatus(invoice);
  recordPayment(invoice, applied);

  logActivity({
    action: "Faktura bo'yicha to'lov qabul qilindi",
    details: `${invoice.invoiceNumber} · ${applied.toLocaleString("uz-UZ")} so'm`,
    icon: "CircleCheck",
  });

  const response: ApiResponse<Invoice> = {
    success: true,
    data: invoice,
    message:
      applied < parsed.data.amount
        ? `Qoldiq ${applied.toLocaleString("uz-UZ")} so'm edi — shu summa qabul qilindi`
        : "To'lov qabul qilindi",
  };
  res.json(response);
};

export const deleteInvoice: RequestHandler = (req, res) => {
  const removed = softRemove(invoices, paramId(req));
  if (!removed) return sendNotFound(res, "Hisob-faktura topilmadi");

  logActivity({
    action: "Hisob-faktura o'chirildi",
    details: removed.invoiceNumber,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Hisob-faktura o'chirildi",
  };
  res.json(response);
};
