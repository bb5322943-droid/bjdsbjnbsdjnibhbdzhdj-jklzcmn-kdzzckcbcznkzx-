import { RequestHandler } from "express";
import { SQLInputValue } from "node:sqlite";
import { z } from "zod";
import { AuditAction, AuditLog, AuditStats } from "@shared/api";
import { db } from "../data/db";
import { paginationSchema } from "../lib/http";

/** HTTP metodini audit amaliga aylantiradi. */
export function auditActionFor(method: string): AuditAction {
  if (method === "POST") return "create";
  if (method === "PUT" || method === "PATCH") return "update";
  if (method === "DELETE") return "delete";
  return "update";
}

/**
 * `/api/finance/transactions/123` → `finance.transaction`.
 * Birinchi ikki bo'lakni oladi, id va ko'plik qo'shimchasini olib tashlaydi.
 */
export function auditEntityFor(path: string): string {
  const parts = path.split("/").filter(Boolean); // ["finance","transactions","123"]
  const module = parts[0] ?? "tizim";
  const raw = parts[1] ?? "";
  // Oxirgi bo'lak id bo'lsa (raqam), entity nomi ikkinchi bo'lakdan olinadi.
  const entity = raw.replace(/s$/, "");
  return entity ? `${module}.${entity}` : module;
}

const MODULE_LABEL: Record<string, string> = {
  finance: "Moliya",
  hr: "Xodimlar",
  warehouse: "Ombor",
  crm: "Savdo",
  orders: "Buyurtma",
  customers: "Mijoz",
  suppliers: "Ta'minotchi",
  purchases: "Xarid",
  invoices: "Faktura",
  attendance: "Davomat",
  leave: "Ta'til",
  payroll: "Ish haqi",
  users: "Foydalanuvchi",
  auth: "Autentifikatsiya",
};

const ACTION_LABEL: Record<AuditAction, string> = {
  create: "yaratdi",
  update: "yangiladi",
  delete: "o'chirdi",
  login: "tizimga kirdi",
  logout: "tizimdan chiqdi",
  auth: "autentifikatsiya",
};

/** Yo'ldagi id (raqamli oxirgi yoki oxiridan oldingi bo'lak). */
export function extractIdFromPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  // .../invoices/123 yoki .../invoices/123/payment
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(parts[i])) return parts[i];
  }
  return "";
}

/** Metod va yo'ldan inson o'qiy oladigan tavsif quradi. */
export function auditSummary(method: string, path: string): string {
  const parts = path.split("/").filter(Boolean);
  const module = MODULE_LABEL[parts[0]] ?? parts[0];
  const action = ACTION_LABEL[auditActionFor(method)];
  const id = extractIdFromPath(path);

  // Maxsus amallar: /invoices/:id/payment, /warehouse/restock, va h.k.
  const last = parts[parts.length - 1];
  const sub = last && !/^\d+$/.test(last) && parts.length > 2 ? ` (${last})` : "";
  return `${module}${sub} ${action}${id ? ` #${id}` : ""}`.trim();
}

const querySchema = paginationSchema.extend({
  action: z.enum(["create", "update", "delete", "login", "logout", "auth"]).optional().catch(undefined),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const getAuditLogs: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const clauses: string[] = [];
  const params: SQLInputValue[] = [];
  if (query.action) {
    clauses.push("action = ?");
    params.push(query.action);
  }
  if (query.userId) {
    clauses.push("userId = ?");
    params.push(query.userId);
  }
  if (query.from) {
    clauses.push("timestamp >= ?");
    params.push(query.from);
  }
  if (query.to) {
    clauses.push("timestamp <= ?");
    params.push(query.to + "T23:59:59.999Z");
  }
  if (search) {
    clauses.push("(LOWER(userName) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(entity) LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const instance = db();

  const total = (
    instance.prepare(`SELECT COUNT(*) AS n FROM audit_logs ${where}`).get(...params) as {
      n: number;
    }
  ).n;

  const pages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, pages);
  const offset = (page - 1) * query.limit;

  const rows = instance
    .prepare(
      `SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, query.limit, offset) as unknown as AuditLog[];

  res.json({
    data: rows,
    pagination: { page, limit: query.limit, total, pages },
  });
};

export const getAuditStats: RequestHandler = (_req, res) => {
  const instance = db();
  const count = (sql: string, ...p: SQLInputValue[]) =>
    (instance.prepare(sql).get(...p) as { n: number }).n;

  const todayStart = new Date().toISOString().split("T")[0];

  const data: AuditStats = {
    total: count("SELECT COUNT(*) AS n FROM audit_logs"),
    today: count("SELECT COUNT(*) AS n FROM audit_logs WHERE timestamp >= ?", todayStart),
    creates: count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'create'"),
    updates: count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'update'"),
    deletes: count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'delete'"),
  };

  res.json({ success: true, data });
};
