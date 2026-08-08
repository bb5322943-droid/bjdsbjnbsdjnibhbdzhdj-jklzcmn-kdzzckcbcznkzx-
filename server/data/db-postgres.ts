import { Pool, PoolClient } from "pg";
import { logger } from "../lib/logger";

/**
 * PostgreSQL adapter - production muhitlar uchun
 * SQLite bilan bir xil interfeys, lekin kuchliroq va masshtablanuvchi
 */

let pool: Pool | null = null;

export function initPostgres(): void {
  if (pool) return;

  const connectionString = process.env.DATABASE_URL;
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

export async function query(text: string, params?: any[]): Promise<any> {
  const client = await getClient();
  try {
    const result = await client.query(text, params);
    return result;
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
 * PostgreSQL schema - SQLite bilan mos keladi
 */
export const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  account TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL,
  salary DECIMAL(15,2) NOT NULL,
  "hireDate" DATE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "minQuantity" INTEGER NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  category TEXT NOT NULL,
  supplier TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL,
  "createdDate" DATE NOT NULL,
  note TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL,
  rating INTEGER NOT NULL,
  "createdDate" DATE NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  manager TEXT NOT NULL,
  status TEXT NOT NULL,
  "createdDate" DATE NOT NULL,
  note TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL,
  "paymentStatus" TEXT NOT NULL,
  "orderDate" DATE NOT NULL,
  "deliveryDate" DATE NOT NULL,
  "assignedTo" TEXT NOT NULL,
  note TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("customerId");

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  "purchaseNumber" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "supplierName" TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL,
  "paymentStatus" TEXT NOT NULL,
  "orderDate" DATE NOT NULL,
  "expectedDate" DATE NOT NULL,
  "createdBy" TEXT NOT NULL,
  note TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  "invoiceNumber" TEXT NOT NULL,
  "orderId" TEXT,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  "paidAmount" DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL,
  "issueDate" DATE NOT NULL,
  "dueDate" DATE NOT NULL,
  note TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  department TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  "checkIn" TEXT NOT NULL,
  "checkOut" TEXT NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  note TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  type TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  days INTEGER NOT NULL,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  "requestedDate" DATE NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  "lastLogin" TIMESTAMP NOT NULL,
  "employeeId" TEXT,
  "createdDate" DATE NOT NULL,
  "passwordHash" TEXT NOT NULL DEFAULT '',
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference TEXT NOT NULL,
  date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  "clientName" TEXT NOT NULL,
  status TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  "createdDate" DATE NOT NULL,
  "expectedCloseDate" DATE NOT NULL,
  "assignedTo" TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "expiresAt" BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions("userId");

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "userRole" TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  summary TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

CREATE TABLE IF NOT EXISTS payrolls (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  department TEXT NOT NULL,
  period TEXT NOT NULL,
  "baseSalary" DECIMAL(15,2) NOT NULL,
  "workingDays" INTEGER NOT NULL,
  "presentDays" INTEGER NOT NULL,
  "absenceDeduction" DECIMAL(15,2) NOT NULL,
  bonus DECIMAL(15,2) NOT NULL,
  penalty DECIMAL(15,2) NOT NULL,
  tax DECIMAL(15,2) NOT NULL,
  "netSalary" DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL,
  "createdDate" DATE NOT NULL,
  note TEXT NOT NULL,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "userInitials" TEXT NOT NULL,
  "userBgClass" TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  "paymentDate" DATE NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  note TEXT NOT NULL,
  "createdBy" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer ON debt_payments("customerId");
CREATE INDEX IF NOT EXISTS idx_debt_payments_order ON debt_payments("orderId");

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  "saleNumber" TEXT NOT NULL UNIQUE,
  "customerId" TEXT,
  "customerName" TEXT,
  "customerPhone" TEXT,
  items JSONB NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  "sellerId" TEXT NOT NULL,
  "sellerName" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "branchName" TEXT NOT NULL,
  "saleDate" DATE NOT NULL,
  note TEXT DEFAULT '',
  "receiptPrinted" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  "imageUrl" TEXT,
  "authorId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  tags TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "likesCount" INTEGER NOT NULL DEFAULT 0,
  "createdDate" TIMESTAMP NOT NULL,
  "updatedDate" TIMESTAMP NOT NULL,
  "publishedDate" TIMESTAMP,
  "deletedAt" TIMESTAMP
);
`;

export async function createSchema(): Promise<void> {
  try {
    await query(POSTGRES_SCHEMA);
    logger.info("PostgreSQL schema created/verified");
  } catch (error) {
    logger.error("Failed to create PostgreSQL schema:", error);
    throw error;
  }
}
