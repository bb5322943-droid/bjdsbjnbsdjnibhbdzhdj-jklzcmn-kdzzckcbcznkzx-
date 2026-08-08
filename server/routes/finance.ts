import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, FinanceStats, Transaction } from "@shared/api";
import { active, logActivity, nextId, softRemove, transactions } from "../data/store";
import { financeBreakdown, financeStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  paramId,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const transactionSchema = z.object({
  title: z.string().trim().min(1, "nomi kiritilishi shart"),
  category: z.string().trim().min(1).catch("Boshqa"),
  account: z.string().trim().min(1).catch("Asosiy hisob"),
  amount: z.coerce.number().positive("summa noldan katta bo'lishi kerak"),
  type: z.enum(["income", "expense"]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak")
    .optional(),
});

const querySchema = paginationSchema.extend({
  type: z.enum(["all", "income", "expense"]).catch("all"),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const getFinanceStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<FinanceStats> = {
    success: true,
    data: financeStats(),
  };
  res.json(response);
};

/** Kategoriya bo'yicha kirim/chiqim va hisoblar balansi. */
export const getFinanceBreakdown: RequestHandler = (_req, res) => {
  res.json({ success: true, data: financeBreakdown() });
};

/** Filtrlangan tranzaksiyalar — eksport va ro'yxat uchun umumiy. */
function filterTransactions(query: z.infer<typeof querySchema>) {
  const search = query.search.toLowerCase();

  return active(transactions)
    .filter((t) => {
      if (
        search &&
        !t.title.toLowerCase().includes(search) &&
        !t.category.toLowerCase().includes(search) &&
        !t.account.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (query.type !== "all" && t.type !== query.type) return false;
      if (query.category && t.category !== query.category) return false;
      if (query.from && t.date < query.from) return false;
      if (query.to && t.date > query.to) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getTransactions: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  res.json(paginate(filterTransactions(query), query.page, query.limit));
};

/** Mavjud tranzaksiyalardagi kategoriyalar — filtr ro'yxatini to'ldirish uchun. */
export const getTransactionCategories: RequestHandler = (_req, res) => {
  const categories = [...new Set(transactions.map((t) => t.category))].sort();
  res.json({ success: true, data: categories });
};

/** Filtrga mos tranzaksiyalarni CSV holida yuklab beradi. */
export const exportTransactions: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const rows = filterTransactions(query);

  const escape = (value: string | number) => {
    const text = String(value);
    // CSV'da qo'shtirnoq ikkilantiriladi, matn qo'shtirnoq ichiga olinadi.
    return `"${text.replace(/"/g, '""')}"`;
  };

  const header = ["Sana", "Nomi", "Kategoriya", "Hisob", "Turi", "Summa"];
  const csv = [
    header.map(escape).join(","),
    ...rows.map((t) =>
      [
        t.date,
        t.title,
        t.category,
        t.account,
        t.type === "income" ? "Kirim" : "Chiqim",
        t.amount,
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\r\n");

  const filename = `tranzaksiyalar-${new Date().toISOString().split("T")[0]}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // BOM — Excel UTF-8 ni to'g'ri o'qishi uchun (o'zbekcha harflar buzilmasin).
  res.send("﻿" + csv);
};

export const createTransaction: RequestHandler = (req, res) => {
  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const newTransaction: Transaction = {
    id: nextId(),
    title: parsed.data.title,
    category: parsed.data.category,
    account: parsed.data.account,
    date: parsed.data.date ?? new Date().toISOString().split("T")[0],
    amount: parsed.data.amount,
    type: parsed.data.type,
  };

  transactions.unshift(newTransaction);
  logActivity({
    action:
      parsed.data.type === "income"
        ? "Kirim tranzaksiyasi qo'shildi"
        : "Xarajat tranzaksiyasi qo'shildi",
    details: `${newTransaction.title} · ${newTransaction.amount.toLocaleString("uz-UZ")} so'm`,
    icon: parsed.data.type === "income" ? "ArrowUpRight" : "ArrowDownRight",
  });

  const response: ApiResponse<Transaction> = {
    success: true,
    data: newTransaction,
    message: "Tranzaksiya muvaffaqiyatli yaratildi",
  };
  res.status(201).json(response);
};

export const updateTransaction: RequestHandler = (req, res) => {
  const parsed = transactionSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const transaction = transactions.find((t) => t.id === req.params.id && !t.deletedAt);
  if (!transaction) return sendNotFound(res, "Tranzaksiya topilmadi");

  Object.assign(transaction, parsed.data);
  logActivity({
    action: "Tranzaksiya tahrirlandi",
    details: transaction.title,
    icon: "PenLine",
  });

  const response: ApiResponse<Transaction> = {
    success: true,
    data: transaction,
    message: "Tranzaksiya yangilandi",
  };
  res.json(response);
};

export const deleteTransaction: RequestHandler = (req, res) => {
  const removed = softRemove(transactions, paramId(req));
  if (!removed) return sendNotFound(res, "Tranzaksiya topilmadi");

  logActivity({
    action: "Tranzaksiya o'chirildi",
    details: removed.title,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Tranzaksiya o'chirildi",
  };
  res.json(response);
};
