import { Request } from "express";
import { AuditAction, AuditLog, StoredUser } from "@shared/api";
import { db } from "../data/db";

/**
 * Audit-log — TZ 14-bo'lim: har bir yaratish/tahrirlash/o'chirish amali kim,
 * qachon, qaysi IP orqali bajarganini saqlaydi.
 *
 * To'g'ridan-to'g'ri bazaga yoziladi (xotira massivi orqali emas), chunki
 * jurnal o'zgarmas bo'lishi va har doim saqlanishi kerak.
 */

let auditIdCounter = Date.now();

/** So'rovdan IP manzilini ajratib oladi. */
export function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "—";
}

/** Bitta audit yozuvini bazaga qo'shadi. */
export function recordAudit(entry: {
  user: StoredUser;
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary: string;
  ip: string;
}): void {
  const log: AuditLog = {
    id: (++auditIdCounter).toString(),
    userId: entry.user.id,
    userName: entry.user.name,
    userRole: entry.user.role,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? "",
    summary: entry.summary,
    ipAddress: entry.ip,
    timestamp: new Date().toISOString(),
  };

  db()
    .prepare(
      `INSERT INTO audit_logs
       (id, userId, userName, userRole, action, entity, entityId, summary, ipAddress, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      log.id,
      log.userId,
      log.userName,
      log.userRole,
      log.action,
      log.entity,
      log.entityId,
      log.summary,
      log.ipAddress,
      log.timestamp,
    );
}
