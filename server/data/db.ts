import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { logger } from "../lib/logger";

/**
 * SQLite orqali doimiy saqlash qatlami.
 * Production uchun PostgreSQL tavsiya etiladi (db-postgres.ts).
 */

// Database tanlash: agar DATABASE_URL mavjud bo'lsa PostgreSQL, aks holda SQLite
const USE_POSTGRES = !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgresql://");

if (USE_POSTGRES) {
  logger.info("Using PostgreSQL database");
} else {
  logger.info("Using SQLite database");
}

const DB_PATH = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : resolve(process.cwd(), "data", "orbis.db");

let database: DatabaseSync | null = null;

/** Ochilgan ulanishni qaytaradi, kerak bo'lsa fayl va jadvallarni yaratadi. */
export function db(): DatabaseSync {
  if (database) return database;

  if (USE_POSTGRES) {
    throw new Error(
      "PostgreSQL mode enabled but db() called. Use db-postgres.ts functions instead."
    );
  }

  // SQLite file-based database
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    logger.info(`Database papkasi yaratildi: ${dirname(DB_PATH)}`);
  } catch (error) {
    logger.error("Database papkasini yaratishda xatolik:", error);
  }
  
  database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  
  createSchema(database);
  logger.info(`✅ SQLite database ishga tushdi: ${DB_PATH}`);

  return database;
}

/**
 * Jadval ta'riflari. Har bir ustun entity maydoniga mos keladi, shuning uchun
 * bazani tashqi vositalar bilan ham ko'rish va so'rov yozish mumkin.
 * Buyurtma va xarid qatorlari ichma-ich ro'yxat bo'lgani uchun JSON ustunda saqlanadi.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
  account TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, position TEXT NOT NULL,
  department TEXT NOT NULL, status TEXT NOT NULL, salary REAL NOT NULL,
  hireDate TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL,
  quantity INTEGER NOT NULL, minQuantity INTEGER NOT NULL, price REAL NOT NULL,
  category TEXT NOT NULL, supplier TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
  contactPerson TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL,
  region TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL,
  createdDate TEXT NOT NULL, note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, contactPerson TEXT NOT NULL,
  phone TEXT NOT NULL, email TEXT NOT NULL, category TEXT NOT NULL,
  address TEXT NOT NULL, status TEXT NOT NULL, rating INTEGER NOT NULL,
  createdDate TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
  region TEXT NOT NULL, address TEXT NOT NULL, phone TEXT NOT NULL,
  manager TEXT NOT NULL, status TEXT NOT NULL, createdDate TEXT NOT NULL,
  note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, orderNumber TEXT NOT NULL, customerId TEXT NOT NULL,
  customerName TEXT NOT NULL, items TEXT NOT NULL, total REAL NOT NULL,
  status TEXT NOT NULL, paymentStatus TEXT NOT NULL, orderDate TEXT NOT NULL,
  deliveryDate TEXT NOT NULL, assignedTo TEXT NOT NULL, note TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY, purchaseNumber TEXT NOT NULL, supplierId TEXT NOT NULL,
  supplierName TEXT NOT NULL, items TEXT NOT NULL, total REAL NOT NULL,
  status TEXT NOT NULL, paymentStatus TEXT NOT NULL, orderDate TEXT NOT NULL,
  expectedDate TEXT NOT NULL, createdBy TEXT NOT NULL, note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, invoiceNumber TEXT NOT NULL, orderId TEXT,
  orderNumber TEXT NOT NULL, customerId TEXT NOT NULL, customerName TEXT NOT NULL,
  amount REAL NOT NULL, paidAmount REAL NOT NULL, status TEXT NOT NULL,
  issueDate TEXT NOT NULL, dueDate TEXT NOT NULL, note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY, employeeId TEXT NOT NULL, employeeName TEXT NOT NULL,
  department TEXT NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL,
  checkIn TEXT NOT NULL, checkOut TEXT NOT NULL, hours REAL NOT NULL, note TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY, employeeId TEXT NOT NULL, employeeName TEXT NOT NULL,
  type TEXT NOT NULL, startDate TEXT NOT NULL, endDate TEXT NOT NULL,
  days INTEGER NOT NULL, status TEXT NOT NULL, reason TEXT NOT NULL,
  requestedDate TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, login TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL,
  status TEXT NOT NULL, lastLogin TEXT NOT NULL, employeeId TEXT,
  createdDate TEXT NOT NULL, passwordHash TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login ON users(login);

CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY, productId TEXT NOT NULL, productName TEXT NOT NULL,
  type TEXT NOT NULL, quantity INTEGER NOT NULL, balanceAfter INTEGER NOT NULL,
  reason TEXT NOT NULL, reference TEXT NOT NULL, date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY, clientName TEXT NOT NULL, status TEXT NOT NULL,
  value REAL NOT NULL, description TEXT NOT NULL, createdDate TEXT NOT NULL,
  expectedCloseDate TEXT NOT NULL, assignedTo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, userId TEXT NOT NULL, expiresAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL, userName TEXT NOT NULL,
  userRole TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL,
  entityId TEXT NOT NULL, summary TEXT NOT NULL, ipAddress TEXT NOT NULL,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

CREATE TABLE IF NOT EXISTS payrolls (
  id TEXT PRIMARY KEY, employeeId TEXT NOT NULL, employeeName TEXT NOT NULL,
  department TEXT NOT NULL, period TEXT NOT NULL, baseSalary REAL NOT NULL,
  workingDays INTEGER NOT NULL, presentDays INTEGER NOT NULL,
  absenceDeduction REAL NOT NULL, bonus REAL NOT NULL, penalty REAL NOT NULL,
  tax REAL NOT NULL, netSalary REAL NOT NULL, status TEXT NOT NULL,
  createdDate TEXT NOT NULL, note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL, userInitials TEXT NOT NULL,
  userBgClass TEXT NOT NULL, action TEXT NOT NULL, details TEXT NOT NULL,
  timestamp TEXT NOT NULL, icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY, orderId TEXT NOT NULL, orderNumber TEXT NOT NULL,
  customerId TEXT NOT NULL, customerName TEXT NOT NULL, amount REAL NOT NULL,
  paymentDate TEXT NOT NULL, paymentMethod TEXT NOT NULL, note TEXT NOT NULL,
  createdBy TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer ON debt_payments(customerId);
CREATE INDEX IF NOT EXISTS idx_debt_payments_order ON debt_payments(orderId);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(paymentDate);

-- Sales module tables
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY, saleNumber TEXT NOT NULL, customerId TEXT,
  customerName TEXT, customerPhone TEXT, items TEXT NOT NULL,
  subtotal REAL NOT NULL, discount REAL NOT NULL DEFAULT 0, tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL, paymentMethod TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
  sellerId TEXT NOT NULL, sellerName TEXT NOT NULL, branchId TEXT NOT NULL,
  branchName TEXT NOT NULL, saleDate TEXT NOT NULL, note TEXT DEFAULT '',
  receiptPrinted INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_number ON sales(saleNumber);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(saleDate);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales(sellerId);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branchId);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY, refundNumber TEXT NOT NULL, originalSaleId TEXT NOT NULL,
  originalSaleNumber TEXT NOT NULL, items TEXT NOT NULL, refundAmount REAL NOT NULL,
  refundReason TEXT NOT NULL, processedById TEXT NOT NULL, processedByName TEXT NOT NULL,
  refundDate TEXT NOT NULL, paymentMethod TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_number ON refunds(refundNumber);
CREATE INDEX IF NOT EXISTS idx_refunds_original_sale ON refunds(originalSaleId);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds(refundDate);

-- Posts module tables
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL,
  excerpt TEXT, imageUrl TEXT, authorId TEXT NOT NULL, authorName TEXT NOT NULL,
  category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
  tags TEXT, viewCount INTEGER NOT NULL DEFAULT 0, likesCount INTEGER NOT NULL DEFAULT 0,
  createdDate TEXT NOT NULL, updatedDate TEXT NOT NULL, publishedDate TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(authorId);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(createdDate);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(publishedDate);
`;

/**
 * Sxema kengaygach mavjud bazaga qo'shilishi kerak bo'lgan ustunlar.
 * `CREATE TABLE IF NOT EXISTS` eski jadvalni o'zgartirmaydi, shuning uchun
 * yangi ustunlar shu ro'yxat orqali qo'shiladi.
 */
const MIGRATIONS: { table: string; column: string; definition: string }[] = [
  { table: "users", column: "passwordHash", definition: "TEXT NOT NULL DEFAULT ''" },
  { table: "users", column: "login", definition: "TEXT NOT NULL DEFAULT ''" },
  // Soft delete — o'chirilgan yozuvlar arxivda qoladi (TZ 6, 8-bo'lim).
  ...[
    "transactions",
    "employees",
    "products",
    "customers",
    "suppliers",
    "branches",
    "orders",
    "deals",
    "purchases",
    "invoices",
    "leave_requests",
    "users",
  ].map((table) => ({ table, column: "deletedAt", definition: "TEXT" })),
];

function createSchema(instance: DatabaseSync) {
  instance.exec(SCHEMA);

  for (const { table, column, definition } of MIGRATIONS) {
    const columns = instance
      .prepare(`PRAGMA table_info(${table})`)
      .all() as { name: string }[];

    if (columns.some((info) => info.name === column)) continue;
    instance.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/**
 * Har bir jadval uchun ustunlar tartibi — o'qish va yozishda bir xil ishlatiladi.
 * Soft-delete jadvallariga `deletedAt` ro'yxat oxirida qo'shiladi (pastda).
 */
const BASE_TABLES = {
  transactions: ["id", "title", "category", "account", "date", "amount", "type"],
  employees: [
    "id",
    "name",
    "position",
    "department",
    "status",
    "salary",
    "hireDate",
    "email",
    "phone",
  ],
  products: [
    "id",
    "name",
    "location",
    "quantity",
    "minQuantity",
    "price",
    "category",
    "supplier",
  ],
  customers: [
    "id",
    "name",
    "type",
    "contactPerson",
    "phone",
    "email",
    "region",
    "address",
    "status",
    "createdDate",
    "note",
  ],
  suppliers: [
    "id",
    "name",
    "contactPerson",
    "phone",
    "email",
    "category",
    "address",
    "status",
    "rating",
    "createdDate",
  ],
  branches: [
    "id",
    "name",
    "type",
    "region",
    "address",
    "phone",
    "manager",
    "status",
    "createdDate",
    "note",
  ],
  orders: [
    "id",
    "orderNumber",
    "customerId",
    "customerName",
    "items",
    "total",
    "status",
    "paymentStatus",
    "orderDate",
    "deliveryDate",
    "assignedTo",
    "note",
  ],
  purchases: [
    "id",
    "purchaseNumber",
    "supplierId",
    "supplierName",
    "items",
    "total",
    "status",
    "paymentStatus",
    "orderDate",
    "expectedDate",
    "createdBy",
    "note",
  ],
  invoices: [
    "id",
    "invoiceNumber",
    "orderId",
    "orderNumber",
    "customerId",
    "customerName",
    "amount",
    "paidAmount",
    "status",
    "issueDate",
    "dueDate",
    "note",
  ],
  attendance: [
    "id",
    "employeeId",
    "employeeName",
    "department",
    "date",
    "status",
    "checkIn",
    "checkOut",
    "hours",
    "note",
  ],
  leave_requests: [
    "id",
    "employeeId",
    "employeeName",
    "type",
    "startDate",
    "endDate",
    "days",
    "status",
    "reason",
    "requestedDate",
  ],
  users: [
    "id",
    "name",
    "login",
    "email",
    "role",
    "status",
    "lastLogin",
    "employeeId",
    "createdDate",
    "passwordHash",
  ],
  movements: [
    "id",
    "productId",
    "productName",
    "type",
    "quantity",
    "balanceAfter",
    "reason",
    "reference",
    "date",
  ],
  deals: [
    "id",
    "clientName",
    "status",
    "value",
    "description",
    "createdDate",
    "expectedCloseDate",
    "assignedTo",
  ],
  payrolls: [
    "id",
    "employeeId",
    "employeeName",
    "department",
    "period",
    "baseSalary",
    "workingDays",
    "presentDays",
    "absenceDeduction",
    "bonus",
    "penalty",
    "tax",
    "netSalary",
    "status",
    "createdDate",
    "note",
  ],
  activities: [
    "id",
    "userId",
    "userInitials",
    "userBgClass",
    "action",
    "details",
    "timestamp",
    "icon",
  ],
  debt_payments: [
    "id",
    "orderId",
    "orderNumber",
    "customerId",
    "customerName",
    "amount",
    "paymentDate",
    "paymentMethod",
    "note",
    "createdBy",
  ],
  posts: [
    "id",
    "title",
    "content",
    "excerpt",
    "imageUrl",
    "authorId",
    "authorName",
    "category",
    "status", 
    "tags",
    "viewCount",
    "likesCount",
    "createdDate",
    "updatedDate",
    "publishedDate",
  ],
  sales: [
    "id",
    "saleNumber", 
    "customerId",
    "customerName",
    "customerPhone",
    "items",
    "subtotal",
    "discount",
    "tax",
    "total",
    "paymentMethod",
    "status",
    "sellerId",
    "sellerName",
    "branchId",
    "branchName",
    "saleDate",
    "note",
    "receiptPrinted",
  ],
  refunds: [
    "id",
    "refundNumber",
    "originalSaleId", 
    "originalSaleNumber",
    "items",
    "refundAmount",
    "refundReason",
    "processedById",
    "processedByName",
    "refundDate",
    "paymentMethod",
    "status",
  ],
} as const;

/** Soft-delete qo'llab-quvvatlaydigan jadvallar — ularga `deletedAt` ustuni qo'shiladi. */
const SOFT_DELETE_TABLES = new Set([
  "transactions",
  "employees",
  "products",
  "customers",
  "suppliers",
  "branches",
  "orders",
  "purchases",
  "invoices",
  "leave_requests",
  "users",
  "deals",
  "sales",
  "refunds",
  "posts",
]);

/**
 * Yakuniy ustunlar ro'yxati: soft-delete jadvallariga `deletedAt` qo'shiladi.
 * Shu bitta joyda kengaytirilgani uchun har bir jadval ta'rifini qo'lda
 * tahrirlash shart emas.
 */
export const TABLES = Object.fromEntries(
  Object.entries(BASE_TABLES).map(([table, columns]) => [
    table,
    SOFT_DELETE_TABLES.has(table) ? [...columns, "deletedAt"] : columns,
  ]),
) as { [K in keyof typeof BASE_TABLES]: string[] };

export type TableName = keyof typeof TABLES;

/** JSON sifatida saqlanadigan ustunlar — o'qishda qayta parse qilinadi. */
const JSON_COLUMNS = new Set(["items"]);

/**
 * SQLite faqat null/number/bigint/string/Uint8Array qabul qiladi.
 * Obyekt va massivlar JSON'ga, `undefined` esa null'ga aylantiriladi.
 */
function toSqlValue(value: unknown): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number" || typeof value === "string") return value;
  return String(value);
}

/** Jadvaldagi barcha qatorlarni o'qiydi va JSON ustunlarni tiklaydi. */
export function readTable<T>(table: TableName): T[] {
  const rows = db().prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];

  return rows.map((row) => {
    const result: Record<string, unknown> = { ...row };
    for (const column of JSON_COLUMNS) {
      if (typeof result[column] === "string") {
        try {
          result[column] = JSON.parse(result[column] as string);
        } catch {
          result[column] = [];
        }
      }
    }
    return result as T;
  });
}

/**
 * Jadvalni berilgan qatorlar bilan to'liq almashtiradi.
 * Bitta tranzaksiyada bajariladi — yarim yozilgan holat qolmaydi.
 */
export function writeTable(table: TableName, rows: readonly object[]): void {
  const columns = TABLES[table] as readonly string[];
  const instance = db();

  const placeholders = columns.map(() => "?").join(", ");
  const insert = instance.prepare(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
  );

  instance.exec("BEGIN");
  try {
    instance.exec(`DELETE FROM ${table}`);
    for (const row of rows) {
      const record = row as Record<string, unknown>;
      insert.run(...columns.map((column) => toSqlValue(record[column])));
    }
    instance.exec("COMMIT");
  } catch (error) {
    instance.exec("ROLLBACK");
    throw error;
  }
}

/** Bazada umuman yozuv bor-yo'qligini tekshiradi — birinchi ishga tushirishni aniqlash uchun. */
export function isEmpty(): boolean {
  const row = db()
    .prepare("SELECT COUNT(*) AS count FROM employees")
    .get() as { count: number };
  return row.count === 0;
}

export function closeDatabase(): void {
  database?.close();
  database = null;
}
