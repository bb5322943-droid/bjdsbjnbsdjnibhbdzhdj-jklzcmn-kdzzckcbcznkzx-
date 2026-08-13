import { Pool, PoolClient, types } from "pg";
import { logger } from "../lib/logger";
import { TABLES, TableName, POSTGRES_CONNECTION_STRING } from "./db";

/**
 * PostgreSQL adapter — Vercel serverless muhitida ma'lumotlar barqaror
 * saqlanishi uchun. SQLite (`db.ts`) bilan bir xil jadval/ustun tuzilishi va
 * o'qish/yozish interfeysi, lekin ma'lumotlar barcha funksiya instance'lari
 * orasida umumiy — chunki `/tmp` har bir konteynerga xos va ular orasida
 * almashinmaydi (aynan shu sabab mahsulot qoldig'i kabi qiymatlar Vercel'da
 * tasodifiy noto'g'ri ko'rinardi).
 */

// pg standart holatda BIGINT/NUMERIC ustunlarni JS string qilib qaytaradi
// (aniqlikni yo'qotmaslik uchun). Ilova hamma joyda JS number kutadi.
types.setTypeParser(20, (value) => parseInt(value, 10)); // BIGINT
types.setTypeParser(1700, (value) => parseFloat(value)); // NUMERIC/DECIMAL

let pool: Pool | null = null;

export function initPostgres(): void {
  if (pool) return;

  const connectionString = POSTGRES_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable not set");
  }

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    logger.error("PostgreSQL pool error:", err);
  });

  logger.info("PostgreSQL connection pool initialized");
}

export async function getClient(): Promise<PoolClient> {
  if (!pool) initPostgres();
  return pool!.connect();
}

export async function query(text: string, params?: unknown[]): Promise<any> {
  const client = await getClient();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info("PostgreSQL pool closed");
  }
}

/**
 * Jadval ta'riflari — `db.ts`dagi SQLite sxemasi bilan bir xil, Postgres
 * sintaksisida. Sana maydonlari ataylab TEXT (ISO satr), DATE/TIMESTAMP emas —
 * butun ilova (frontend va backend) ularni satr sifatida ishlatadi; agar
 * native sana turi ishlatilsa, `pg` ularni avtomatik JS Date obyektiga
 * aylantirib qo'yadi va bu butun ilovadagi sana bilan ishlashni buzadi.
 * Pul/miqdor maydonlari uchun DOUBLE PRECISION — NUMERIC emas, chunki `pg`
 * NUMERIC'ni string qilib qaytaradi (yuqoridagi type parser buni qoplasa ham,
 * DOUBLE PRECISION JS number'ning o'ziga ekvivalent, qo'shimcha o'girishsiz).
 */
const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
  account TEXT NOT NULL, date TEXT NOT NULL, amount DOUBLE PRECISION NOT NULL, type TEXT NOT NULL,
  "deletedAt" TEXT
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, position TEXT NOT NULL,
  department TEXT NOT NULL, status TEXT NOT NULL, salary DOUBLE PRECISION NOT NULL,
  "hireDate" TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
  "deletedAt" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL,
  quantity INTEGER NOT NULL, "minQuantity" INTEGER NOT NULL, price DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL, supplier TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL,
  region TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL,
  "createdDate" TEXT NOT NULL, note TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, "contactPerson" TEXT NOT NULL,
  phone TEXT NOT NULL, email TEXT NOT NULL, category TEXT NOT NULL,
  address TEXT NOT NULL, status TEXT NOT NULL, rating INTEGER NOT NULL,
  "createdDate" TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
  region TEXT NOT NULL, address TEXT NOT NULL, phone TEXT NOT NULL,
  manager TEXT NOT NULL, status TEXT NOT NULL, "createdDate" TEXT NOT NULL,
  note TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, "orderNumber" TEXT NOT NULL, "customerId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL, items JSONB NOT NULL, total DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL, "paymentStatus" TEXT NOT NULL, "orderDate" TEXT NOT NULL,
  "deliveryDate" TEXT NOT NULL, "assignedTo" TEXT NOT NULL, note TEXT NOT NULL,
  "deletedAt" TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("customerId");

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY, "purchaseNumber" TEXT NOT NULL, "supplierId" TEXT NOT NULL,
  "supplierName" TEXT NOT NULL, items JSONB NOT NULL, total DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL, "paymentStatus" TEXT NOT NULL, "orderDate" TEXT NOT NULL,
  "expectedDate" TEXT NOT NULL, "createdBy" TEXT NOT NULL, note TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, "invoiceNumber" TEXT NOT NULL, "orderId" TEXT,
  "orderNumber" TEXT NOT NULL, "customerId" TEXT NOT NULL, "customerName" TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL, "paidAmount" DOUBLE PRECISION NOT NULL, status TEXT NOT NULL,
  "issueDate" TEXT NOT NULL, "dueDate" TEXT NOT NULL, note TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY, "employeeId" TEXT NOT NULL, "employeeName" TEXT NOT NULL,
  department TEXT NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL,
  "checkIn" TEXT NOT NULL, "checkOut" TEXT NOT NULL, hours DOUBLE PRECISION NOT NULL, note TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY, "employeeId" TEXT NOT NULL, "employeeName" TEXT NOT NULL,
  type TEXT NOT NULL, "startDate" TEXT NOT NULL, "endDate" TEXT NOT NULL,
  days INTEGER NOT NULL, status TEXT NOT NULL, reason TEXT NOT NULL,
  "requestedDate" TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, login TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL,
  status TEXT NOT NULL, "lastLogin" TEXT NOT NULL, "employeeId" TEXT,
  "createdDate" TEXT NOT NULL, "passwordHash" TEXT NOT NULL DEFAULT '',
  "deletedAt" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login ON users(login);

CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY, "productId" TEXT NOT NULL, "productName" TEXT NOT NULL,
  type TEXT NOT NULL, quantity INTEGER NOT NULL, "balanceAfter" INTEGER NOT NULL,
  reason TEXT NOT NULL, reference TEXT NOT NULL, date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY, "clientName" TEXT NOT NULL, status TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL, description TEXT NOT NULL, "createdDate" TEXT NOT NULL,
  "expectedCloseDate" TEXT NOT NULL, "assignedTo" TEXT NOT NULL,
  "deletedAt" TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "expiresAt" BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions("userId");

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "userName" TEXT NOT NULL,
  "userRole" TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL,
  "entityId" TEXT NOT NULL, summary TEXT NOT NULL, "ipAddress" TEXT NOT NULL,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

CREATE TABLE IF NOT EXISTS payrolls (
  id TEXT PRIMARY KEY, "employeeId" TEXT NOT NULL, "employeeName" TEXT NOT NULL,
  department TEXT NOT NULL, period TEXT NOT NULL, "baseSalary" DOUBLE PRECISION NOT NULL,
  "workingDays" INTEGER NOT NULL, "presentDays" INTEGER NOT NULL,
  "absenceDeduction" DOUBLE PRECISION NOT NULL, bonus DOUBLE PRECISION NOT NULL, penalty DOUBLE PRECISION NOT NULL,
  tax DOUBLE PRECISION NOT NULL, "netSalary" DOUBLE PRECISION NOT NULL, status TEXT NOT NULL,
  "createdDate" TEXT NOT NULL, note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "userInitials" TEXT NOT NULL,
  "userBgClass" TEXT NOT NULL, action TEXT NOT NULL, details TEXT NOT NULL,
  timestamp TEXT NOT NULL, icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY, "orderId" TEXT NOT NULL, "orderNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL, "customerName" TEXT NOT NULL, amount DOUBLE PRECISION NOT NULL,
  "paymentDate" TEXT NOT NULL, "paymentMethod" TEXT NOT NULL, note TEXT NOT NULL,
  "createdBy" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer ON debt_payments("customerId");
CREATE INDEX IF NOT EXISTS idx_debt_payments_order ON debt_payments("orderId");
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments("paymentDate");

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY, "saleNumber" TEXT NOT NULL, "customerId" TEXT,
  "customerName" TEXT, "customerPhone" TEXT, items JSONB NOT NULL,
  subtotal DOUBLE PRECISION NOT NULL, discount DOUBLE PRECISION NOT NULL DEFAULT 0, tax DOUBLE PRECISION NOT NULL DEFAULT 0,
  total DOUBLE PRECISION NOT NULL, "paymentMethod" TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
  "sellerId" TEXT NOT NULL, "sellerName" TEXT NOT NULL, "branchId" TEXT NOT NULL,
  "branchName" TEXT NOT NULL, "saleDate" TEXT NOT NULL, note TEXT DEFAULT '',
  "receiptPrinted" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_number ON sales("saleNumber");
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales("saleDate");
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales("sellerId");
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales("branchId");

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY, "refundNumber" TEXT NOT NULL, "originalSaleId" TEXT NOT NULL,
  "originalSaleNumber" TEXT NOT NULL, items JSONB NOT NULL, "refundAmount" DOUBLE PRECISION NOT NULL,
  "refundReason" TEXT NOT NULL, "processedById" TEXT NOT NULL, "processedByName" TEXT NOT NULL,
  "refundDate" TEXT NOT NULL, "paymentMethod" TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
  "deletedAt" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_number ON refunds("refundNumber");
CREATE INDEX IF NOT EXISTS idx_refunds_original_sale ON refunds("originalSaleId");
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds("refundDate");

CREATE TABLE IF NOT EXISTS supplier_returns (
  id TEXT PRIMARY KEY, "returnNumber" TEXT NOT NULL, "supplierId" TEXT NOT NULL,
  "supplierName" TEXT NOT NULL, "productId" TEXT NOT NULL, "productName" TEXT NOT NULL,
  quantity INTEGER NOT NULL, reason TEXT NOT NULL, "reasonText" TEXT,
  amount DOUBLE PRECISION NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  "returnDate" TEXT NOT NULL, "purchaseNumber" TEXT, "createdAt" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_returns_number ON supplier_returns("returnNumber");
CREATE INDEX IF NOT EXISTS idx_supplier_returns_supplier ON supplier_returns("supplierId");
CREATE INDEX IF NOT EXISTS idx_supplier_returns_product ON supplier_returns("productId");
CREATE INDEX IF NOT EXISTS idx_supplier_returns_date ON supplier_returns("returnDate");

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL,
  excerpt TEXT, "imageUrl" TEXT, "authorId" TEXT NOT NULL, "authorName" TEXT NOT NULL,
  category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
  tags TEXT, "viewCount" INTEGER NOT NULL DEFAULT 0, "likesCount" INTEGER NOT NULL DEFAULT 0,
  "createdDate" TEXT NOT NULL, "updatedDate" TEXT NOT NULL, "publishedDate" TEXT,
  "deletedAt" TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts("authorId");
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts("createdDate");
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts("publishedDate");
`;

export async function createSchema(): Promise<void> {
  await query(POSTGRES_SCHEMA);
  logger.info("PostgreSQL schema created/verified");
}

let schemaReady: Promise<void> | null = null;

/** Sxema jarayon davomida faqat bir marta yaratiladi/tekshiriladi. */
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = createSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

const JSON_COLUMNS = new Set(["items"]);

function toPgValue(column: string, value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (JSON_COLUMNS.has(column) && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

/** Bazada umuman yozuv bor-yo'qligini tekshiradi — birinchi ishga tushirishni aniqlash uchun. */
export async function pgIsEmpty(): Promise<boolean> {
  await ensureSchema();
  const result = await query("SELECT COUNT(*) AS count FROM employees");
  return Number(result.rows[0].count) === 0;
}

/** Jadvaldagi barcha qatorlarni o'qiydi. */
export async function pgReadTable<T>(table: TableName): Promise<T[]> {
  await ensureSchema();
  const result = await query(`SELECT * FROM ${table}`);
  return result.rows as T[];
}

/**
 * Jadvalni berilgan qatorlar bilan to'liq almashtiradi (bitta tranzaksiyada) —
 * `db.ts`dagi SQLite `writeTable` bilan bir xil xatti-harakat.
 */
export async function pgWriteTable(table: TableName, rows: readonly object[]): Promise<void> {
  await ensureSchema();
  const columns = TABLES[table] as readonly string[];
  const quotedColumns = columns.map((c) => `"${c}"`).join(", ");
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${table}`);
    for (const row of rows) {
      const record = row as Record<string, unknown>;
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
      const values = columns.map((c) => toPgValue(c, record[c]));
      await client.query(
        `INSERT INTO ${table} (${quotedColumns}) VALUES (${placeholders})`,
        values,
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Sessiyalar — `lib/auth.ts` orqali chaqiriladi. */
export async function pgInsertSession(
  token: string,
  userId: string,
  expiresAt: number,
): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO sessions (token, "userId", "expiresAt") VALUES ($1, $2, $3)`,
    [token, userId, expiresAt],
  );
}

export async function pgGetSession(
  token: string,
): Promise<{ userId: string; expiresAt: number } | null> {
  await ensureSchema();
  const result = await query(
    `SELECT "userId", "expiresAt" FROM sessions WHERE token = $1`,
    [token],
  );
  return result.rows[0] ?? null;
}

export async function pgDeleteSessionByToken(token: string): Promise<void> {
  await ensureSchema();
  await query(`DELETE FROM sessions WHERE token = $1`, [token]);
}

export async function pgDeleteSessionsByUser(userId: string): Promise<void> {
  await ensureSchema();
  await query(`DELETE FROM sessions WHERE "userId" = $1`, [userId]);
}

export async function pgDeleteExpiredSessions(): Promise<void> {
  await ensureSchema();
  await query(`DELETE FROM sessions WHERE "expiresAt" < $1`, [Date.now()]);
}

/** Audit jurnali — `lib/audit.ts` va `routes/audit.ts` orqali chaqiriladi. */
export async function pgInsertAuditLog(log: {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  ipAddress: string;
  timestamp: string;
}): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO audit_logs (id, "userId", "userName", "userRole", action, entity, "entityId", summary, "ipAddress", timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
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
    ],
  );
}

export async function pgQueryAuditLogs(
  where: { action?: string; userId?: string; from?: string; to?: string; search?: string },
  requestedPage: number,
  limit: number,
): Promise<{ rows: unknown[]; total: number; page: number; pages: number }> {
  await ensureSchema();
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (where.action) {
    clauses.push(`action = $${i++}`);
    params.push(where.action);
  }
  if (where.userId) {
    clauses.push(`"userId" = $${i++}`);
    params.push(where.userId);
  }
  if (where.from) {
    clauses.push(`timestamp >= $${i++}`);
    params.push(where.from);
  }
  if (where.to) {
    clauses.push(`timestamp <= $${i++}`);
    params.push(where.to);
  }
  if (where.search) {
    const like = `%${where.search.toLowerCase()}%`;
    clauses.push(
      `(LOWER("userName") LIKE $${i} OR LOWER(summary) LIKE $${i + 1} OR LOWER(entity) LIKE $${i + 2})`,
    );
    params.push(like, like, like);
    i += 3;
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const totalResult = await query(`SELECT COUNT(*) AS n FROM audit_logs ${whereSql}`, params);
  const total = Number(totalResult.rows[0].n);
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requestedPage, pages);
  const offset = (page - 1) * limit;

  const rowsResult = await query(
    `SELECT * FROM audit_logs ${whereSql} ORDER BY timestamp DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset],
  );

  return { rows: rowsResult.rows, total, page, pages };
}

export async function pgAuditStats(): Promise<{
  total: number;
  today: number;
  creates: number;
  updates: number;
  deletes: number;
}> {
  await ensureSchema();
  const count = async (sql: string, params: unknown[] = []) =>
    Number((await query(sql, params)).rows[0].n);

  const todayStart = new Date().toISOString().split("T")[0];

  return {
    total: await count("SELECT COUNT(*) AS n FROM audit_logs"),
    today: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE timestamp >= $1", [
      todayStart,
    ]),
    creates: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'create'"),
    updates: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'update'"),
    deletes: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'delete'"),
  };
}
