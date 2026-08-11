import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "../data/db";

/**
 * Parol va sessiya boshqaruvi JWT bilan.
 *
 * Parollar hech qachon ochiq saqlanmaydi — scrypt bilan, har biri uchun alohida
 * tuz (salt) qo'shib hashlanadi. JWT tokenlar ishlatiladi, refresh tokenlar
 * bazada saqlanadi.
 */

const KEY_LENGTH = 64;
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "default-refresh-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * DIQQAT: Yangi hisob uchun boshlang'ich parol environment variable'dan olinadi.
 * Production'da albatta .env faylida o'rnatilishi kerak!
 * 
 * DEFAULT (Deploy): OrbisAdmin2024!
 * TEST (Demo): 123456
 */
export const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "OrbisAdmin2024!";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

/**
 * Parolni saqlangan hash bilan solishtiradi.
 * Taqqoslash `timingSafeEqual` orqali — javob vaqti parolga bog'liq bo'lmasin.
 */
export function verifyPassword(password: string, stored: string): boolean {
  // Hash yo'q bo'lishi mumkin (auth qo'shilishidan oldingi hisob) — bu kirishni rad etadi.
  if (!stored) return false;

  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/**
 * Sessiyalar JWT orqali boshqariladi.
 * Access token — qisqa muddatli (12 soat)
 * Refresh token — uzoq muddatli (7 kun) va bazada saqlanadi
 */

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function createAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function createRefreshToken(userId: string): string {
  const token = jwt.sign({ userId, type: "refresh" }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  // Refresh tokenni bazaga yozamiz
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 kun
  db()
    .prepare("INSERT INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)")
    .run(token, userId, expiresAt);

  return token;
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; type: string };
    if (decoded.type !== "refresh") return null;

    // Bazada borligini tekshiramiz
    const row = db()
      .prepare("SELECT userId, expiresAt FROM sessions WHERE token = ?")
      .get(token) as { userId: string; expiresAt: number } | undefined;

    if (!row || row.expiresAt < Date.now()) {
      if (row) destroySession(token);
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * Eski sessiya tizimi (backward compatibility uchun)
 */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 soat

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("hex");
  db()
    .prepare("INSERT INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)")
    .run(token, userId, Date.now() + SESSION_TTL_MS);
  return token;
}

/** Token bo'yicha foydalanuvchi ID sini qaytaradi; muddati o'tgan bo'lsa null. */
export function resolveSession(token: string): string | null {
  console.log("🔍 resolveSession called");
  console.log("   Token:", token ? `${token.substring(0, 10)}...` : "null");
  
  try {
    const row = db()
      .prepare("SELECT userId, expiresAt FROM sessions WHERE token = ?")
      .get(token) as { userId: string; expiresAt: number } | undefined;

    console.log("   Session row from DB:", row ? "found" : "not found");
    
    if (!row) {
      console.log("   ❌ Session not found in database");
      return null;
    }

    const now = Date.now();
    const expired = row.expiresAt < now;
    console.log("   Session expires at:", new Date(row.expiresAt).toISOString());
    console.log("   Current time:", new Date(now).toISOString());
    console.log("   Expired:", expired);

    if (expired) {
      destroySession(token);
      console.log("   ❌ Session expired and deleted");
      return null;
    }

    console.log("   ✅ Session valid, userId:", row.userId);
    return row.userId;
  } catch (error) {
    console.error("   ❌ resolveSession error:", error);
    return null;
  }
}

export function destroySession(token: string): void {
  db().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/** Foydalanuvchining barcha sessiyalarini bekor qiladi (o'chirilganda/bloklanganda). */
export function destroyUserSessions(userId: string): void {
  db().prepare("DELETE FROM sessions WHERE userId = ?").run(userId);
}

/** Muddati o'tgan sessiyalarni tozalaydi — server ishga tushganda chaqiriladi. */
export function purgeExpiredSessions(): void {
  db().prepare("DELETE FROM sessions WHERE expiresAt < ?").run(Date.now());
}

/** So'rov sarlavhasidan Bearer tokenni ajratadi. */
export function extractToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}
