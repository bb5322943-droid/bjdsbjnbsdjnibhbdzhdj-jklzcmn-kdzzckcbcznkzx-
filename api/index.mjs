import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import winston from "winston";
import { resolve } from "path";
import { mkdirSync } from "fs";
import { copyFileSync, mkdirSync as mkdirSync$1, readdirSync, statSync, unlinkSync } from "node:fs";
import { dirname, join, resolve as resolve$1 } from "node:path";
import * as schedule from "node-schedule";
import { z } from "zod";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { DatabaseSync } from "node:sqlite";
import { Pool, types } from "pg";
//#region server/lib/logger.ts
var logDir = resolve(process.cwd(), "logs");
mkdirSync(logDir, { recursive: true });
var logLevel = process.env.LOG_LEVEL || "info";
var logFile = process.env.LOG_FILE_PATH || "./logs/app.log";
/**
* Markaziy logging tizimi.
* Console va faylga yozadi, production'da faqat error+ saqlanadi.
*/
var logger = winston.createLogger({
	level: logLevel,
	format: winston.format.combine(winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.errors({ stack: true }), winston.format.json()),
	transports: [new winston.transports.File({
		filename: resolve(logFile),
		maxsize: 10485760,
		maxFiles: 5,
		tailable: true
	}), new winston.transports.File({
		filename: resolve(logDir, "error.log"),
		level: "error",
		maxsize: 10485760,
		maxFiles: 5
	})]
});
/**
* Express middleware uchun request logger
*/
function logRequest(req, res, duration) {
	const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
	logger.log(level, "HTTP Request", {
		method: req.method,
		url: req.originalUrl,
		status: res.statusCode,
		duration: `${duration}ms`,
		ip: req.ip
	});
}
//#endregion
//#region server/lib/backup.ts
/**
* Avtomatik backup tizimi.
* 
* Har kuni belgilangan vaqtda database faylining nusxasini oladi.
* Eski backuplar avtomatik o'chiriladi (retention policy).
*/
var BACKUP_DIR = resolve$1(process.cwd(), "backups");
var DB_PATH$1 = process.env.DATABASE_PATH ? resolve$1(process.env.DATABASE_PATH) : resolve$1(process.cwd(), "data", "app.db");
var BACKUP_ENABLED = process.env.BACKUP_ENABLED === "true";
var BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || "0 2 * * *";
var BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || "30");
/**
* Backup scheduler'ni ishga tushiradi.
* Environment variable orqali o'chirib qo'yish mumkin.
*/
function startBackupScheduler() {
	if (!BACKUP_ENABLED) {
		logger.info("Backup scheduler o'chirilgan (BACKUP_ENABLED=false)");
		return;
	}
	try {
		mkdirSync$1(BACKUP_DIR, { recursive: true });
		schedule.scheduleJob(BACKUP_SCHEDULE, () => {
			try {
				createBackup();
				cleanOldBackups();
			} catch (error) {
				logger.error("Backup jarayonida xatolik:", error);
			}
		});
		logger.info(`Backup scheduler ishga tushdi: ${BACKUP_SCHEDULE}`);
		logger.info(`Backup retention: ${BACKUP_RETENTION_DAYS} kun`);
	} catch (error) {
		logger.error("Backup scheduler'ni ishga tushirishda xatolik:", error);
	}
}
/**
* Database faylining nusxasini oladi.
* Fayl nomi: app_YYYY-MM-DD_HH-mm-ss.db
*/
function createBackup() {
	try {
		const backupFileName = `app_${(/* @__PURE__ */ new Date()).toISOString().replace(/:/g, "-").replace(/\..+/, "").replace("T", "_")}.db`;
		const backupPath = join(BACKUP_DIR, backupFileName);
		copyFileSync(DB_PATH$1, backupPath);
		const sizeMB = (statSync(backupPath).size / (1024 * 1024)).toFixed(2);
		logger.info(`✅ Backup yaratildi: ${backupFileName} (${sizeMB} MB)`);
		return backupPath;
	} catch (error) {
		logger.error("Backup yaratishda xatolik:", error);
		throw error;
	}
}
/**
* Eski backuplarni retention policy bo'yicha o'chiradi.
* Retention days'dan eskiroq backuplar o'chiriladi.
*/
function cleanOldBackups() {
	try {
		const files = readdirSync(BACKUP_DIR);
		const now = Date.now();
		const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1e3;
		let deletedCount = 0;
		for (const file of files) {
			if (!file.endsWith(".db")) continue;
			const filePath = join(BACKUP_DIR, file);
			if (now - statSync(filePath).mtimeMs > retentionMs) {
				unlinkSync(filePath);
				deletedCount++;
				logger.info(`🗑️  Eski backup o'chirildi: ${file}`);
			}
		}
		if (deletedCount > 0) logger.info(`Jami ${deletedCount} ta eski backup o'chirildi`);
	} catch (error) {
		logger.error("Eski backuplarni tozalashda xatolik:", error);
	}
}
//#endregion
//#region server/routes/demo.ts
var handleDemo = (req, res) => {
	res.status(200).json({ message: "Hello from Express server" });
};
//#endregion
//#region server/data/db.ts
/**
* SQLite orqali doimiy saqlash qatlami.
* Production uchun PostgreSQL tavsiya etiladi (db-postgres.ts).
*/
/**
* Postgres ulanish satri. `NEON_DATABASE_URL` ustuvor — Vercel Marketplace
* orqali ulangan Neon integratsiyasi shu nomda beradi (loyihada avvaldan
* mavjud `DATABASE_URL` esa ishlamaydigan placeholder bo'lib chiqqan edi,
* shuning uchun uni o'chirmasdan, ustidan ustuvorroq manba qo'shildi).
*/
var POSTGRES_CONNECTION_STRING = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
var USE_POSTGRES = !!POSTGRES_CONNECTION_STRING && (POSTGRES_CONNECTION_STRING.startsWith("postgresql://") || POSTGRES_CONNECTION_STRING.startsWith("postgres://"));
if (USE_POSTGRES) logger.info("Using PostgreSQL database");
else logger.info("Using SQLite database");
var IS_VERCEL = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
var DB_PATH = (() => {
	if (process.env.DATABASE_PATH) return resolve$1(process.env.DATABASE_PATH);
	if (IS_VERCEL) {
		logger.info("🔧 Vercel detected - using /tmp directory for SQLite");
		return resolve$1("/tmp", "orbis.db");
	}
	return resolve$1(process.cwd(), "data", "orbis.db");
})();
var database = null;
/** Ochilgan ulanishni qaytaradi, kerak bo'lsa fayl va jadvallarni yaratadi. */
function db() {
	if (database) return database;
	if (USE_POSTGRES) throw new Error("PostgreSQL mode enabled but db() called. Use db-postgres.ts functions instead.");
	try {
		const dbDir = dirname(DB_PATH);
		mkdirSync$1(dbDir, { recursive: true });
		logger.info(`📂 Database papkasi yaratildi: ${dbDir}`);
	} catch (error) {
		logger.error("❌ Database papkasini yaratishda xatolik:", error);
		if (IS_VERCEL) logger.error("🚨 CRITICAL: Cannot create /tmp directory on Vercel!");
	}
	try {
		database = new DatabaseSync(DB_PATH);
		database.exec("PRAGMA journal_mode = WAL");
		database.exec("PRAGMA foreign_keys = ON");
		createSchema$1(database);
		logger.info(`✅ SQLite database ishga tushdi: ${DB_PATH}`);
		logger.info(`📊 Database location: ${IS_VERCEL ? "/tmp (Vercel)" : "local data/"}`);
	} catch (error) {
		logger.error("❌ CRITICAL: Database initialization failed:", error);
		throw error;
	}
	return database;
}
/**
* Jadval ta'riflari. Har bir ustun entity maydoniga mos keladi, shuning uchun
* bazani tashqi vositalar bilan ham ko'rish va so'rov yozish mumkin.
* Buyurtma va xarid qatorlari ichma-ich ro'yxat bo'lgani uchun JSON ustunda saqlanadi.
*/
var SCHEMA = `
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

-- Supplier returns module tables
CREATE TABLE IF NOT EXISTS supplier_returns (
  id TEXT PRIMARY KEY, returnNumber TEXT NOT NULL, supplierId TEXT NOT NULL,
  supplierName TEXT NOT NULL, productId TEXT NOT NULL, productName TEXT NOT NULL,
  quantity INTEGER NOT NULL, reason TEXT NOT NULL, reasonText TEXT,
  amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  returnDate TEXT NOT NULL, purchaseNumber TEXT, createdAt TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_returns_number ON supplier_returns(returnNumber);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_supplier ON supplier_returns(supplierId);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_product ON supplier_returns(productId);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_date ON supplier_returns(returnDate);

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
var MIGRATIONS = [
	{
		table: "users",
		column: "passwordHash",
		definition: "TEXT NOT NULL DEFAULT ''"
	},
	{
		table: "users",
		column: "login",
		definition: "TEXT NOT NULL DEFAULT ''"
	},
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
		"users"
	].map((table) => ({
		table,
		column: "deletedAt",
		definition: "TEXT"
	}))
];
function createSchema$1(instance) {
	instance.exec(SCHEMA);
	for (const { table, column, definition } of MIGRATIONS) {
		if (instance.prepare(`PRAGMA table_info(${table})`).all().some((info) => info.name === column)) continue;
		instance.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
	}
}
/**
* Har bir jadval uchun ustunlar tartibi — o'qish va yozishda bir xil ishlatiladi.
* Soft-delete jadvallariga `deletedAt` ro'yxat oxirida qo'shiladi (pastda).
*/
var BASE_TABLES = {
	transactions: [
		"id",
		"title",
		"category",
		"account",
		"date",
		"amount",
		"type"
	],
	employees: [
		"id",
		"name",
		"position",
		"department",
		"status",
		"salary",
		"hireDate",
		"email",
		"phone"
	],
	products: [
		"id",
		"name",
		"location",
		"quantity",
		"minQuantity",
		"price",
		"category",
		"supplier"
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
		"note"
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
		"createdDate"
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
		"note"
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
		"note"
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
		"note"
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
		"note"
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
		"note"
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
		"requestedDate"
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
		"passwordHash"
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
		"date"
	],
	deals: [
		"id",
		"clientName",
		"status",
		"value",
		"description",
		"createdDate",
		"expectedCloseDate",
		"assignedTo"
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
		"note"
	],
	activities: [
		"id",
		"userId",
		"userInitials",
		"userBgClass",
		"action",
		"details",
		"timestamp",
		"icon"
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
		"createdBy"
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
		"publishedDate"
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
		"receiptPrinted"
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
		"status"
	],
	supplier_returns: [
		"id",
		"returnNumber",
		"supplierId",
		"supplierName",
		"productId",
		"productName",
		"quantity",
		"reason",
		"reasonText",
		"amount",
		"status",
		"returnDate",
		"purchaseNumber",
		"createdAt"
	]
};
/** Soft-delete qo'llab-quvvatlaydigan jadvallar — ularga `deletedAt` ustuni qo'shiladi. */
var SOFT_DELETE_TABLES = new Set([
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
	"posts"
]);
/**
* Yakuniy ustunlar ro'yxati: soft-delete jadvallariga `deletedAt` qo'shiladi.
* Shu bitta joyda kengaytirilgani uchun har bir jadval ta'rifini qo'lda
* tahrirlash shart emas.
*/
var TABLES = Object.fromEntries(Object.entries(BASE_TABLES).map(([table, columns]) => [table, SOFT_DELETE_TABLES.has(table) ? [...columns, "deletedAt"] : columns]));
/** JSON sifatida saqlanadigan ustunlar — o'qishda qayta parse qilinadi. */
var JSON_COLUMNS$1 = new Set(["items"]);
/**
* SQLite faqat null/number/bigint/string/Uint8Array qabul qiladi.
* Obyekt va massivlar JSON'ga, `undefined` esa null'ga aylantiriladi.
*/
function toSqlValue(value) {
	if (value === void 0 || value === null) return null;
	if (typeof value === "object") return JSON.stringify(value);
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "number" || typeof value === "string") return value;
	return String(value);
}
/** Jadvaldagi barcha qatorlarni o'qiydi va JSON ustunlarni tiklaydi. */
function readTable(table) {
	return db().prepare(`SELECT * FROM ${table}`).all().map((row) => {
		const result = { ...row };
		for (const column of JSON_COLUMNS$1) if (typeof result[column] === "string") try {
			result[column] = JSON.parse(result[column]);
		} catch {
			result[column] = [];
		}
		return result;
	});
}
/**
* Jadvalni berilgan qatorlar bilan to'liq almashtiradi.
* Bitta tranzaksiyada bajariladi — yarim yozilgan holat qolmaydi.
*/
function writeTable(table, rows) {
	const columns = TABLES[table];
	const instance = db();
	const placeholders = columns.map(() => "?").join(", ");
	const insert = instance.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`);
	instance.exec("BEGIN");
	try {
		instance.exec(`DELETE FROM ${table}`);
		for (const row of rows) {
			const record = row;
			insert.run(...columns.map((column) => toSqlValue(record[column])));
		}
		instance.exec("COMMIT");
	} catch (error) {
		instance.exec("ROLLBACK");
		throw error;
	}
}
/** Bazada umuman yozuv bor-yo'qligini tekshiradi — birinchi ishga tushirishni aniqlash uchun. */
function isEmpty() {
	return db().prepare("SELECT COUNT(*) AS count FROM employees").get().count === 0;
}
//#endregion
//#region server/data/db-postgres.ts
/**
* PostgreSQL adapter — Vercel serverless muhitida ma'lumotlar barqaror
* saqlanishi uchun. SQLite (`db.ts`) bilan bir xil jadval/ustun tuzilishi va
* o'qish/yozish interfeysi, lekin ma'lumotlar barcha funksiya instance'lari
* orasida umumiy — chunki `/tmp` har bir konteynerga xos va ular orasida
* almashinmaydi (aynan shu sabab mahsulot qoldig'i kabi qiymatlar Vercel'da
* tasodifiy noto'g'ri ko'rinardi).
*/
types.setTypeParser(20, (value) => parseInt(value, 10));
types.setTypeParser(1700, (value) => parseFloat(value));
var pool = null;
function initPostgres() {
	if (pool) return;
	const connectionString = POSTGRES_CONNECTION_STRING;
	if (!connectionString) throw new Error("DATABASE_URL environment variable not set");
	pool = new Pool({
		connectionString,
		max: 20,
		idleTimeoutMillis: 3e4,
		connectionTimeoutMillis: 1e4
	});
	pool.on("error", (err) => {
		logger.error("PostgreSQL pool error:", err);
	});
	logger.info("PostgreSQL connection pool initialized");
}
async function getClient() {
	if (!pool) initPostgres();
	return pool.connect();
}
async function query(text, params) {
	const client = await getClient();
	try {
		return await client.query(text, params);
	} finally {
		client.release();
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
var POSTGRES_SCHEMA = `
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
async function createSchema() {
	await query(POSTGRES_SCHEMA);
	logger.info("PostgreSQL schema created/verified");
}
var schemaReady = null;
/** Sxema jarayon davomida faqat bir marta yaratiladi/tekshiriladi. */
function ensureSchema() {
	if (!schemaReady) schemaReady = createSchema().catch((error) => {
		schemaReady = null;
		throw error;
	});
	return schemaReady;
}
var JSON_COLUMNS = new Set(["items"]);
function toPgValue(column, value) {
	if (value === void 0 || value === null) return null;
	if (JSON_COLUMNS.has(column) && typeof value === "object") return JSON.stringify(value);
	if (typeof value === "boolean") return value ? 1 : 0;
	return value;
}
/** Bazada umuman yozuv bor-yo'qligini tekshiradi — birinchi ishga tushirishni aniqlash uchun. */
async function pgIsEmpty() {
	await ensureSchema();
	const result = await query("SELECT COUNT(*) AS count FROM employees");
	return Number(result.rows[0].count) === 0;
}
/** Jadvaldagi barcha qatorlarni o'qiydi. */
async function pgReadTable(table) {
	await ensureSchema();
	return (await query(`SELECT * FROM ${table}`)).rows;
}
/**
* Jadvalni berilgan qatorlar bilan to'liq almashtiradi (bitta tranzaksiyada) —
* `db.ts`dagi SQLite `writeTable` bilan bir xil xatti-harakat.
*/
async function pgWriteTable(table, rows) {
	await ensureSchema();
	const columns = TABLES[table];
	const quotedColumns = columns.map((c) => `"${c}"`).join(", ");
	const client = await getClient();
	try {
		await client.query("BEGIN");
		await client.query(`DELETE FROM ${table}`);
		for (const row of rows) {
			const record = row;
			const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
			const values = columns.map((c) => toPgValue(c, record[c]));
			await client.query(`INSERT INTO ${table} (${quotedColumns}) VALUES (${placeholders})`, values);
		}
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}
async function pgDeleteSessionByToken(token) {
	await ensureSchema();
	await query(`DELETE FROM sessions WHERE token = $1`, [token]);
}
async function pgDeleteSessionsByUser(userId) {
	await ensureSchema();
	await query(`DELETE FROM sessions WHERE "userId" = $1`, [userId]);
}
async function pgDeleteExpiredSessions() {
	await ensureSchema();
	await query(`DELETE FROM sessions WHERE "expiresAt" < $1`, [Date.now()]);
}
/** Audit jurnali — `lib/audit.ts` va `routes/audit.ts` orqali chaqiriladi. */
async function pgInsertAuditLog(log) {
	await ensureSchema();
	await query(`INSERT INTO audit_logs (id, "userId", "userName", "userRole", action, entity, "entityId", summary, "ipAddress", timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
		log.id,
		log.userId,
		log.userName,
		log.userRole,
		log.action,
		log.entity,
		log.entityId,
		log.summary,
		log.ipAddress,
		log.timestamp
	]);
}
async function pgQueryAuditLogs(where, requestedPage, limit) {
	await ensureSchema();
	const clauses = [];
	const params = [];
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
		clauses.push(`(LOWER("userName") LIKE $${i} OR LOWER(summary) LIKE $${i + 1} OR LOWER(entity) LIKE $${i + 2})`);
		params.push(like, like, like);
		i += 3;
	}
	const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const totalResult = await query(`SELECT COUNT(*) AS n FROM audit_logs ${whereSql}`, params);
	const total = Number(totalResult.rows[0].n);
	const pages = Math.max(1, Math.ceil(total / limit));
	const page = Math.min(requestedPage, pages);
	const offset = (page - 1) * limit;
	return {
		rows: (await query(`SELECT * FROM audit_logs ${whereSql} ORDER BY timestamp DESC LIMIT $${i} OFFSET $${i + 1}`, [
			...params,
			limit,
			offset
		])).rows,
		total,
		page,
		pages
	};
}
async function pgAuditStats() {
	await ensureSchema();
	const count = async (sql, params = []) => Number((await query(sql, params)).rows[0].n);
	const todayStart = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	return {
		total: await count("SELECT COUNT(*) AS n FROM audit_logs"),
		today: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE timestamp >= $1", [todayStart]),
		creates: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'create'"),
		updates: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'update'"),
		deletes: await count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'delete'")
	};
}
//#endregion
//#region server/lib/auth.ts
/**
* Parol va sessiya boshqaruvi JWT bilan.
*
* Parollar hech qachon ochiq saqlanmaydi — scrypt bilan, har biri uchun alohida
* tuz (salt) qo'shib hashlanadi. JWT tokenlar ishlatiladi, refresh tokenlar
* bazada saqlanadi.
*/
var KEY_LENGTH = 64;
var JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production";
process.env.JWT_REFRESH_SECRET;
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";
process.env.JWT_REFRESH_EXPIRES_IN;
/**
* DIQQAT: Yangi hisob uchun boshlang'ich parol environment variable'dan olinadi.
* Production'da albatta .env faylida o'rnatilishi kerak!
* 
* DEFAULT (Deploy): OrbisAdmin2024!
* TEST (Demo): 123456
*/
var DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "OrbisAdmin2024!";
function hashPassword(password) {
	const salt = randomBytes(16).toString("hex");
	return `${salt}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}
/**
* Parolni saqlangan hash bilan solishtiradi.
* Taqqoslash `timingSafeEqual` orqali — javob vaqti parolga bog'liq bo'lmasin.
*/
function verifyPassword(password, stored) {
	if (!stored) return false;
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) return false;
	const expected = Buffer.from(hash, "hex");
	const actual = scryptSync(password, salt, KEY_LENGTH);
	if (expected.length !== actual.length) return false;
	return timingSafeEqual(expected, actual);
}
function createAccessToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyAccessToken(token) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch {
		return null;
	}
}
async function destroySession(token) {
	if (USE_POSTGRES) await pgDeleteSessionByToken(token);
	else db().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
/** Foydalanuvchining barcha sessiyalarini bekor qiladi (o'chirilganda/bloklanganda). */
async function destroyUserSessions(userId) {
	if (USE_POSTGRES) await pgDeleteSessionsByUser(userId);
	else db().prepare("DELETE FROM sessions WHERE userId = ?").run(userId);
}
/** Muddati o'tgan sessiyalarni tozalaydi — server ishga tushganda chaqiriladi. */
async function purgeExpiredSessions() {
	if (USE_POSTGRES) await pgDeleteExpiredSessions();
	else db().prepare("DELETE FROM sessions WHERE expiresAt < ?").run(Date.now());
}
/** So'rov sarlavhasidan Bearer tokenni ajratadi. */
function extractToken(header) {
	if (!header?.startsWith("Bearer ")) return null;
	return header.slice(7).trim() || null;
}
//#endregion
//#region server/data/seed.ts
/**
* Demo ma'lumotlarini joriy sanaga nisbatan generatsiya qiladi.
*
* Sanalar qotib qolgan bo'lsa, kalendar keyingi oyga o'tishi bilan barcha
* "joriy oy" ko'rsatkichlari nolga tushib, dashboard bo'shab qolardi.
* Shuning uchun tranzaksiyalar har safar joriy va o'tgan oy uchun quriladi.
*/
/**
* Deterministik PRNG (mulberry32).
* Math.random() ishlatilsa server har qayta ishga tushganda raqamlar sakrab,
* demo ishonchsiz ko'rinardi — shuning uchun urug' qat'iy.
*/
function createRandom(seed) {
	let state = seed;
	return function random() {
		state = state + 1831565813 | 0;
		let t = Math.imul(state ^ state >>> 15, 1 | state);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
var random = createRandom(20260717);
function between(min, max) {
	return Math.floor(random() * (max - min + 1)) + min;
}
function pick(list) {
	return list[Math.floor(random() * list.length)];
}
/** Summani 100 ming aniqligida qaytaradi — real hisobotlardagidek yaxlit ko'rinsin. */
function money(minMln, maxMln) {
	return between(minMln * 10, maxMln * 10) * 1e5;
}
function isoDate(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function daysIn(year, month) {
	return new Date(year, month + 1, 0).getDate();
}
var PEOPLE = [
	[
		"Sardor Mahmudov",
		"Savdo rahbari",
		"Savdo"
	],
	[
		"Madina Rasulova",
		"Marketing menejeri",
		"Marketing"
	],
	[
		"Gulnoza Abdullayeva",
		"Bosh buxgalter",
		"Moliya"
	],
	[
		"Bobur Karimov",
		"IT mutaxassis",
		"IT"
	],
	[
		"Sevara Umarova",
		"HR menejeri",
		"HR"
	],
	[
		"Jasur To'rayev",
		"Ombor mudiri",
		"Ombor"
	],
	[
		"Nilufar Sodiqova",
		"Savdo menejeri",
		"Savdo"
	],
	[
		"Aziz Yo'ldoshev",
		"Bosh dasturchi",
		"IT"
	],
	[
		"Dilnoza Ergasheva",
		"Marketing mutaxassisi",
		"Marketing"
	],
	[
		"Rustam Qodirov",
		"Logistika mutaxassisi",
		"Ombor"
	],
	[
		"Kamola Nazarova",
		"Buxgalter",
		"Moliya"
	],
	[
		"Gulnora Salimova",
		"Kassir",
		"Savdo"
	],
	[
		"Otabek Sharipov",
		"Savdo menejeri",
		"Savdo"
	],
	[
		"Zulfiya Tosheva",
		"Yurist",
		"Yuridik"
	],
	[
		"Shohruh Islomov",
		"Tizim administratori",
		"IT"
	],
	[
		"Feruza Xolmatova",
		"Recruiter",
		"HR"
	],
	[
		"Doniyor Yusupov",
		"Ishlab chiqarish ustasi",
		"Ishlab chiqarish"
	],
	[
		"Malika Ibragimova",
		"Kontent menejer",
		"Marketing"
	],
	[
		"Ulug'bek Rahimov",
		"Savdo menejeri",
		"Savdo"
	],
	[
		"Nodira Ahmedova",
		"Moliyaviy analitik",
		"Moliya"
	],
	[
		"Farrux Abdullayev",
		"Omborchi",
		"Ombor"
	],
	[
		"Sitora Yo'ldosheva",
		"UX dizayner",
		"IT"
	],
	[
		"Javohir Mirzayev",
		"Ishlab chiqarish operatori",
		"Ishlab chiqarish"
	],
	[
		"Umida Qosimova",
		"Ofis menejeri",
		"HR"
	],
	[
		"Sanjar Bekmurodov",
		"Sifat nazoratchisi",
		"Ishlab chiqarish"
	]
];
/** Lavozimga qarab maosh oralig'i (mln so'm) — rahbarlar yuqoriroq. */
function salaryFor(position) {
	if (/rahbar|Bosh /.test(position)) return money(12, 16);
	if (/menejer|Yurist|analitik|administrator|usta/.test(position)) return money(8, 12);
	if (/dizayner|mutaxassis|Recruiter/.test(position)) return money(7, 10);
	return money(5, 8);
}
function buildEmployees() {
	const now = /* @__PURE__ */ new Date();
	return PEOPLE.map((person, index) => {
		const [name, position, department] = person;
		let status = "active";
		if (index % 11 === 2) status = "vacation";
		else if (index % 17 === 6) status = "sick_leave";
		const hire = index >= PEOPLE.length - 2 ? new Date(now.getFullYear(), now.getMonth(), between(1, Math.max(1, now.getDate()))) : new Date(now.getFullYear() - between(0, 4), between(0, 11), between(1, 28));
		const slug = name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".");
		return {
			id: (index + 1).toString(),
			name,
			position,
			department,
			status,
			salary: salaryFor(position),
			hireDate: isoDate(hire.getFullYear(), hire.getMonth(), hire.getDate()),
			email: `${slug}@company.uz`,
			phone: `+9989${between(0, 9)}${between(1e6, 9999999)}`
		};
	});
}
var CATALOG = [
	[
		"Samsung Galaxy S24 Ultra 256GB",
		"Telefonlar",
		"Samsung Uzbekistan",
		12.5
	],
	[
		"Samsung Galaxy S24+ 256GB",
		"Telefonlar",
		"Samsung Uzbekistan",
		9.8
	],
	[
		"Samsung Galaxy A55 5G 128GB",
		"Telefonlar",
		"Samsung Uzbekistan",
		5.2
	],
	[
		"Samsung Galaxy A35 5G 128GB",
		"Telefonlar",
		"Samsung Uzbekistan",
		3.8
	],
	[
		"Samsung Galaxy A15 128GB",
		"Telefonlar",
		"Samsung Uzbekistan",
		2.1
	],
	[
		"iPhone 15 Pro Max 256GB",
		"Telefonlar",
		"Apple Store UZ",
		18.9
	],
	[
		"iPhone 15 Pro 128GB",
		"Telefonlar",
		"Apple Store UZ",
		15.4
	],
	[
		"iPhone 15 128GB",
		"Telefonlar",
		"Apple Store UZ",
		11.2
	],
	[
		"iPhone 14 128GB",
		"Telefonlar",
		"Apple Store UZ",
		8.6
	],
	[
		"Xiaomi 14 256GB",
		"Telefonlar",
		"Xiaomi Official",
		8.7
	],
	[
		"Xiaomi Redmi Note 13 Pro 256GB",
		"Telefonlar",
		"Xiaomi Official",
		4.2
	],
	[
		"Xiaomi Redmi 13C 128GB",
		"Telefonlar",
		"Xiaomi Official",
		2.4
	],
	[
		"Xiaomi Redmi 13 128GB",
		"Telefonlar",
		"Xiaomi Official",
		2.8
	],
	[
		"Realme C67 128GB",
		"Telefonlar",
		"Xiaomi Official",
		2.2
	],
	[
		"MacBook Air M3 15\" 256GB",
		"Noutbuklar",
		"Apple Store UZ",
		18.5
	],
	[
		"MacBook Pro M3 14\" 512GB",
		"Noutbuklar",
		"Apple Store UZ",
		24.8
	],
	[
		"MacBook Pro M3 16\" 1TB",
		"Noutbuklar",
		"Apple Store UZ",
		32.5
	],
	[
		"Lenovo ThinkPad X1 Carbon Gen 11 i7",
		"Noutbuklar",
		"Tech Supply",
		9.8
	],
	[
		"Lenovo IdeaPad 3 15\" i5 8GB",
		"Noutbuklar",
		"Tech Supply",
		4.6
	],
	[
		"Lenovo V15 G4 i5 8GB",
		"Noutbuklar",
		"Tech Supply",
		3.8
	],
	[
		"ASUS ZenBook 14 OLED i7",
		"Noutbuklar",
		"Tech Supply",
		7.6
	],
	[
		"ASUS VivoBook 15 i5 8GB",
		"Noutbuklar",
		"Tech Supply",
		5.2
	],
	[
		"HP Pavilion 15 i5 8GB",
		"Noutbuklar",
		"Tech Supply",
		5.4
	],
	[
		"HP ProBook 450 G10 i7 16GB",
		"Noutbuklar",
		"Tech Supply",
		6.8
	],
	[
		"Dell XPS 15 i7 16GB",
		"Noutbuklar",
		"Tech Supply",
		11.2
	],
	[
		"Acer Aspire 5 i5 8GB",
		"Noutbuklar",
		"Tech Supply",
		4.2
	],
	[
		"Kir yuvish mashinasi Samsung WW70",
		"Maishiy texnika",
		"Samsung Uzbekistan",
		8.4
	],
	[
		"Kir yuvish mashinasi LG F4",
		"Maishiy texnika",
		"LG Electronics",
		6.8
	],
	[
		"Muzlatgich Samsung RT38",
		"Maishiy texnika",
		"Samsung Uzbekistan",
		9.2
	],
	[
		"Muzlatgich LG GBB62",
		"Maishiy texnika",
		"LG Electronics",
		7.6
	],
	[
		"Muzlatgich Hisense RQ720N6AC2",
		"Maishiy texnika",
		"Xiaomi Official",
		5.8
	],
	[
		"Konditsioner Samsung AR12 Split",
		"Maishiy texnika",
		"Samsung Uzbekistan",
		5.4
	],
	[
		"Konditsioner LG S4NQ14JA3",
		"Maishiy texnika",
		"LG Electronics",
		4.8
	],
	[
		"Dyson V15 Detect Absolute",
		"Maishiy texnika",
		"Tech Supply",
		5.6
	],
	[
		"Robot purkagich Xiaomi Robot Vacuum X10+",
		"Maishiy texnika",
		"Xiaomi Official",
		4.2
	],
	[
		"Mikroto'lqinli pech Samsung ME83",
		"Maishiy texnika",
		"Samsung Uzbekistan",
		2.8
	],
	[
		"Mikroto'lqinli pech LG MS2042DB",
		"Maishiy texnika",
		"LG Electronics",
		2.4
	],
	[
		"Chang yutgich Xiaomi G9",
		"Maishiy texnika",
		"Xiaomi Official",
		3.2
	],
	[
		"Samsung 65\" QLED 4K QN85B",
		"Televizorlar",
		"Samsung Uzbekistan",
		14.8
	],
	[
		"Samsung 55\" Crystal UHD CU8000",
		"Televizorlar",
		"Samsung Uzbekistan",
		7.2
	],
	[
		"Samsung 43\" Crystal UHD CU7100",
		"Televizorlar",
		"Samsung Uzbekistan",
		4.6
	],
	[
		"LG 55\" OLED evo C4",
		"Televizorlar",
		"LG Electronics",
		12.4
	],
	[
		"LG 50\" UR7800 4K",
		"Televizorlar",
		"LG Electronics",
		5.8
	],
	[
		"Sony 65\" BRAVIA XR A95L",
		"Televizorlar",
		"Sony Uzbekistan",
		18.6
	],
	[
		"Hisense 50\" A6K 4K",
		"Televizorlar",
		"Xiaomi Official",
		4.2
	],
	[
		"Sony 55\" BRAVIA X80L 4K",
		"Televizorlar",
		"Sony Uzbekistan",
		8.8
	],
	[
		"Sony WH-1000XM5 quloqchin",
		"Aksessuarlar",
		"Sony Uzbekistan",
		3.4
	],
	[
		"Sony WF-1000XM5",
		"Aksessuarlar",
		"Sony Uzbekistan",
		2.2
	]
];
/** Kategoriyaga qarab mos ombor tanlanadi. */
function locationFor(category) {
	if (category === "Telefonlar") return pick(["Samsung pavilioni", "Apple pavilioni"]);
	if (category === "Noutbuklar") return pick(["Apple pavilioni", "Asosiy do'kon"]);
	if (category === "Maishiy texnika" || category === "Televizorlar") return "Maishiy texnika bo'limi";
	return pick(["Asosiy do'kon", "Maishiy texnika bo'limi"]);
}
function buildProducts() {
	return CATALOG.map((item, index) => {
		const [name, category, supplier, priceMln] = item;
		const minQuantity = between(4, 25);
		const quantity = index % 5 === 3 ? between(0, minQuantity) : between(minQuantity + 5, minQuantity + 90);
		return {
			id: (index + 1).toString(),
			name,
			location: locationFor(category),
			quantity,
			minQuantity,
			price: Math.round(priceMln * 1e6),
			category,
			supplier
		};
	});
}
var CLIENTS = [
	"Texno Park do'koni",
	"Smart Electronics",
	"Digi Market",
	"TechZone Toshkent",
	"Elektron UZ",
	"Gadget Store",
	"Phone House",
	"Laptop World",
	"Apex Electronics",
	"Digital Life",
	"TechPoint",
	"Mega Electronics",
	"Future Tech",
	"Pro Electronics",
	"Star Mobile",
	"Vision Electronics",
	"Top Tech Store",
	"Inno Electronics"
];
var DEAL_NOTES = {
	new_lead: [
		"Yangi so'rov keldi",
		"Sayt orqali murojaat",
		"Ko'rgazmada tanishdik"
	],
	negotiation: [
		"Narx bo'yicha muzokara",
		"Shartlar muhokama qilinmoqda",
		"Hajm kelishilmoqda"
	],
	proposal: [
		"Tijorat taklifi yuborildi",
		"Taklif ko'rib chiqilmoqda",
		"Shartnoma loyihasi tayyor"
	],
	closed_won: [
		"Shartnoma imzolandi",
		"Buyurtma qabul qilindi",
		"To'lov amalga oshirildi"
	],
	closed_lost: [
		"Narx bo'yicha kelisha olmadik",
		"Raqobatchini tanladi",
		"Byudjet muzlatildi"
	]
};
function buildDeals(sellers) {
	const now = /* @__PURE__ */ new Date();
	return [
		"new_lead",
		"new_lead",
		"new_lead",
		"negotiation",
		"negotiation",
		"negotiation",
		"negotiation",
		"proposal",
		"proposal",
		"proposal",
		"closed_won",
		"closed_won",
		"closed_won",
		"closed_won",
		"closed_lost",
		"closed_lost"
	].map((status, index) => {
		const created = new Date(now);
		created.setDate(created.getDate() - between(3, 55));
		const close = new Date(created);
		if (status === "closed_won" || status === "closed_lost") close.setDate(close.getDate() + between(5, 20));
		else if (index % 7 === 4) close.setDate(close.getDate() + between(1, 4));
		else {
			close.setDate(now.getDate() + between(2, 40));
			close.setMonth(now.getMonth());
			close.setFullYear(now.getFullYear());
		}
		return {
			id: (index + 1).toString(),
			clientName: CLIENTS[index % CLIENTS.length],
			status,
			value: money(4, 45),
			description: pick(DEAL_NOTES[status]),
			createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate()),
			expectedCloseDate: isoDate(close.getFullYear(), close.getMonth(), close.getDate()),
			assignedTo: pick(sellers).name
		};
	});
}
var ACCOUNTS = [
	"Ipak Yo'li bank · UZS",
	"Hamkorbank · UZS",
	"Trastbank · UZS",
	"Kassa · UZS"
];
var INCOME_CATEGORIES = [
	"Savdo daromadi",
	"Xizmat ko'rsatish",
	"Ijara daromadi"
];
var EXPENSE_ITEMS = [
	[
		"Ijara xarajati",
		"Office Service MChJ",
		8,
		9
	],
	[
		"Yetkazib berish",
		"Yangiobod Logistic",
		1,
		4
	],
	[
		"Marketing",
		"Marketing kampaniya",
		3,
		12
	],
	[
		"Kommunal",
		"Kommunal to'lovlar",
		2,
		5
	],
	[
		"Xarid",
		"Ofis jihozlari xaridi",
		3,
		14
	],
	[
		"Transport",
		"Transport xizmati",
		1,
		6
	],
	[
		"Aloqa",
		"Internet va aloqa",
		1,
		3
	],
	[
		"Ta'mirlash",
		"Jihozlarni ta'mirlash",
		1,
		7
	],
	[
		"Soliq",
		"Soliq to'lovlari",
		12,
		28
	]
];
/** Bitta oy uchun tranzaksiyalar. `maxDay` — kelajakdagi sanalar yaratilmasligi uchun. */
function buildMonth(year, month, maxDay, salaryFund, scale, startId) {
	const result = [];
	let id = startId;
	const incomeCount = Math.round(35 * scale);
	for (let i = 0; i < incomeCount; i++) {
		const day = between(1, maxDay);
		const dayOfWeek = new Date(year, month, day).getDay();
		const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? .3 : 1.2;
		result.push({
			id: (id++).toString(),
			title: `${pick(CLIENTS)} to'lovi`,
			category: pick(INCOME_CATEGORIES),
			account: pick(ACCOUNTS),
			date: isoDate(year, month, day),
			amount: Math.round(money(15, 85) * scale * multiplier),
			type: "income"
		});
	}
	const expenseCount = Math.round(28 * scale);
	for (let i = 0; i < expenseCount; i++) {
		const [category, title, min, max] = pick(EXPENSE_ITEMS);
		const day = between(1, maxDay);
		result.push({
			id: (id++).toString(),
			title,
			category,
			account: pick(ACCOUNTS),
			date: isoDate(year, month, day),
			amount: Math.round(money(min, max) * scale * between(80, 120) / 100),
			type: "expense"
		});
	}
	if (maxDay >= 10) result.push({
		id: (id++).toString(),
		title: "Ish haqi to'lovi",
		category: "Ish haqi",
		account: ACCOUNTS[0],
		date: isoDate(year, month, 10),
		amount: salaryFund,
		type: "expense"
	});
	return result;
}
function buildTransactions(salaryFund) {
	const now = /* @__PURE__ */ new Date();
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const previous = buildMonth(prev.getFullYear(), prev.getMonth(), daysIn(prev.getFullYear(), prev.getMonth()), salaryFund, .75, 1e3);
	const current = buildMonth(now.getFullYear(), now.getMonth(), daysIn(now.getFullYear(), now.getMonth()), salaryFund, 1.5, 2e3);
	return [...previous, ...current].sort((a, b) => b.date.localeCompare(a.date));
}
/** CATALOG'dagi ta'minotchi nomlariga qo'shimcha ma'lumot. */
var SUPPLIER_META = {
	"Samsung Uzbekistan": [
		"Aziza Karimova",
		"Samsung distribyutor",
		"Toshkent sh., Yunusobod t."
	],
	"Apple Store UZ": [
		"Timur Rashidov",
		"Apple distribyutor",
		"Toshkent sh., Shayxontohur t."
	],
	"Tech Supply": [
		"Dilshod Ergashev",
		"Texnika optom",
		"Toshkent sh., Mirzo Ulug'bek t."
	],
	"Xiaomi Official": [
		"Nodir Sharipov",
		"Xiaomi distribyutor",
		"Toshkent sh., Uchtepa t."
	],
	"LG Electronics": [
		"Bekzod Nazarov",
		"LG distribyutor",
		"Toshkent sh., Olmazor t."
	],
	"Sony Uzbekistan": [
		"Sherzod Qurbonov",
		"Sony distribyutor",
		"Toshkent sh., Chilonzor t."
	]
};
function buildSuppliers() {
	const names = [...new Set(CATALOG.map(([, , supplier]) => supplier))];
	const now = /* @__PURE__ */ new Date();
	return names.map((name, index) => {
		const [contactPerson, category, address] = SUPPLIER_META[name] ?? [
			"Mas'ul shaxs",
			"Boshqa",
			"Toshkent sh."
		];
		const created = new Date(now.getFullYear() - between(0, 3), between(0, 11), between(1, 28));
		return {
			id: (index + 1).toString(),
			name,
			contactPerson,
			phone: `+9989${between(0, 9)}${between(1e6, 9999999)}`,
			email: `info@${name.toLowerCase().replace(/[^a-z]/g, "")}.uz`,
			category,
			address,
			status: index === names.length - 1 ? "inactive" : "active",
			rating: between(3, 5),
			createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate())
		};
	});
}
/** Boshlang'ich filiallar — bosh ofis va bir nechta hududiy filial. */
function buildBranches() {
	const rows = [{
		name: "Orbis ERP — Toshkent",
		type: "head_office",
		region: "Toshkent shahri",
		address: "Toshkent sh., Yunusobod tumani",
		phone: "+998 71 200 00 00",
		manager: "Azizbek Zokirov",
		status: "active",
		note: "Bosh ofis va markaziy ombor."
	}, {
		name: "Orbis ERP — Samarqand",
		type: "branch",
		region: "Samarqand",
		address: "Samarqand sh., Registon ko'chasi 12",
		phone: "+998 66 233 44 55",
		manager: "Dilnoza Karimova",
		status: "active",
		note: ""
	}];
	const now = /* @__PURE__ */ new Date();
	return rows.map((row, index) => {
		const created = new Date(now.getFullYear() - between(0, 2), between(0, 11), between(1, 28));
		return {
			id: (index + 1).toString(),
			...row,
			createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate())
		};
	});
}
var REGIONS = [
	"Toshkent shahri",
	"Toshkent viloyati",
	"Samarqand",
	"Buxoro",
	"Farg'ona",
	"Andijon",
	"Namangan",
	"Qashqadaryo"
];
var CONTACT_NAMES = [
	"Akmal Tursunov",
	"Zarina Yusupova",
	"Bahodir Ismoilov",
	"Nigora Salimova",
	"Timur Rashidov",
	"Lola Xamidova",
	"Shavkat Bo'riyev",
	"Gulbahor Nazirova"
];
function buildCustomers() {
	const now = /* @__PURE__ */ new Date();
	return CLIENTS.map((name, index) => {
		const created = index >= CLIENTS.length - 2 ? new Date(now.getFullYear(), now.getMonth(), between(1, Math.max(1, now.getDate()))) : new Date(now.getFullYear() - between(0, 2), between(0, 11), between(1, 28));
		return {
			id: (index + 1).toString(),
			name,
			type: index % 5 === 3 ? "individual" : "company",
			contactPerson: pick(CONTACT_NAMES),
			phone: `+9989${between(0, 9)}${between(1e6, 9999999)}`,
			email: `info@${name.toLowerCase().replace(/[^a-z]/g, "")}.uz`,
			region: pick(REGIONS),
			address: `${pick(REGIONS)}, ${between(1, 120)}-uy`,
			status: index % 9 === 7 ? "inactive" : "active",
			createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate()),
			note: ""
		};
	});
}
/** Bosqichlar taqsimoti — ko'pchiligi yetkazilgan, bir nechtasi jarayonda. */
var ORDER_STATUSES$1 = [
	"delivered",
	"delivered",
	"delivered",
	"delivered",
	"delivered",
	"delivered",
	"shipped",
	"shipped",
	"shipped",
	"confirmed",
	"confirmed",
	"confirmed",
	"draft",
	"draft",
	"cancelled"
];
function buildOrders(customers, products, sellers) {
	const now = /* @__PURE__ */ new Date();
	return ORDER_STATUSES$1.map((status, index) => {
		const customer = customers[index % customers.length];
		const ordered = new Date(now);
		ordered.setDate(ordered.getDate() - between(1, 70));
		const delivery = new Date(ordered);
		delivery.setDate(delivery.getDate() + between(3, 21));
		const itemCount = between(1, 4);
		const chosen = /* @__PURE__ */ new Set();
		const items = [];
		while (items.length < itemCount) {
			const product = pick(products);
			if (chosen.has(product.id)) continue;
			chosen.add(product.id);
			items.push({
				productId: product.id,
				productName: product.name,
				quantity: between(1, 12),
				price: product.price
			});
		}
		const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
		let paymentStatus = "unpaid";
		if (status === "delivered") paymentStatus = index % 6 === 5 ? "partial" : "paid";
		else if (status === "shipped") paymentStatus = index % 2 === 0 ? "partial" : "unpaid";
		return {
			id: (index + 1).toString(),
			orderNumber: `ORD-${1e3 + index + 1}`,
			customerId: customer.id,
			customerName: customer.name,
			items,
			total,
			status,
			paymentStatus,
			orderDate: isoDate(ordered.getFullYear(), ordered.getMonth(), ordered.getDate()),
			deliveryDate: isoDate(delivery.getFullYear(), delivery.getMonth(), delivery.getDate()),
			assignedTo: pick(sellers).name,
			note: ""
		};
	});
}
var MOVEMENT_REASONS = {
	in: [
		"Ta'minotchidan qabul",
		"Xarid buyurtmasi",
		"Qaytarilgan tovar"
	],
	out: [
		"Buyurtma bo'yicha chiqim",
		"Ichki ehtiyoj",
		"Yaroqsiz deb hisobdan chiqarish"
	],
	adjustment: ["Inventarizatsiya tuzatishi", "Hisob xatosi tuzatildi"]
};
/**
* Har bir mahsulot uchun harakatlar tarixini quradi.
* Boshlang'ich qoldiq shunday tanlanadiki, harakatlardan keyingi yakuniy qoldiq
* mahsulotning joriy `quantity` qiymatiga aynan teng bo'lsin.
*/
function buildMovements(products) {
	const movements = [];
	const now = /* @__PURE__ */ new Date();
	let id = 1;
	for (const product of products) {
		const count = between(2, 5);
		const deltas = [];
		for (let i = 0; i < count; i++) {
			const roll = random();
			if (roll < .45) deltas.push({
				type: "in",
				delta: between(5, 60)
			});
			else if (roll < .9) deltas.push({
				type: "out",
				delta: -between(1, 25)
			});
			else deltas.push({
				type: "adjustment",
				delta: between(-4, 4)
			});
		}
		const net = deltas.reduce((sum, move) => sum + move.delta, 0);
		let balance = product.quantity - net;
		if (balance < 0) {
			deltas.unshift({
				type: "in",
				delta: -balance
			});
			balance = 0;
		}
		deltas.forEach((move, index) => {
			const date = new Date(now);
			date.setDate(date.getDate() - (deltas.length - index) * between(2, 9));
			balance += move.delta;
			movements.push({
				id: (id++).toString(),
				productId: product.id,
				productName: product.name,
				type: move.type,
				quantity: Math.abs(move.delta),
				balanceAfter: balance,
				reason: pick(MOVEMENT_REASONS[move.type]),
				reference: "—",
				date: isoDate(date.getFullYear(), date.getMonth(), date.getDate())
			});
		});
	}
	return movements.sort((a, b) => b.date.localeCompare(a.date));
}
var PURCHASE_STATUSES$1 = [
	"received",
	"received",
	"received",
	"received",
	"received",
	"ordered",
	"ordered",
	"ordered",
	"draft",
	"draft",
	"cancelled"
];
function buildPurchases(suppliers, products, staff) {
	const now = /* @__PURE__ */ new Date();
	return PURCHASE_STATUSES$1.map((status, index) => {
		const supplier = suppliers[index % suppliers.length];
		const catalog = products.filter((p) => p.supplier === supplier.name);
		const pool = catalog.length > 0 ? catalog : products;
		const ordered = new Date(now);
		ordered.setDate(ordered.getDate() - between(2, 80));
		const expected = new Date(ordered);
		expected.setDate(expected.getDate() + between(5, 25));
		const itemCount = Math.min(pool.length, between(1, 3));
		const chosen = /* @__PURE__ */ new Set();
		const items = [];
		while (items.length < itemCount) {
			const product = pick(pool);
			if (chosen.has(product.id)) continue;
			chosen.add(product.id);
			items.push({
				productId: product.id,
				productName: product.name,
				quantity: between(10, 80),
				cost: Math.round(product.price * between(60, 75) / 100)
			});
		}
		const total = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
		let paymentStatus = "unpaid";
		if (status === "received") paymentStatus = index % 5 === 4 ? "partial" : "paid";
		else if (status === "ordered") paymentStatus = index % 2 === 0 ? "partial" : "unpaid";
		return {
			id: (index + 1).toString(),
			purchaseNumber: `PO-${2e3 + index + 1}`,
			supplierId: supplier.id,
			supplierName: supplier.name,
			items,
			total,
			status,
			paymentStatus,
			orderDate: isoDate(ordered.getFullYear(), ordered.getMonth(), ordered.getDate()),
			expectedDate: isoDate(expected.getFullYear(), expected.getMonth(), expected.getDate()),
			createdBy: pick(staff).name,
			note: ""
		};
	});
}
/** Yetkazilgan va jo'natilgan buyurtmalar uchun faktura chiqariladi. */
function buildInvoices(orders) {
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	return orders.filter((order) => order.status === "delivered" || order.status === "shipped").map((order, index) => {
		const issue = new Date(order.orderDate);
		issue.setDate(issue.getDate() + between(0, 3));
		const due = new Date(issue);
		due.setDate(due.getDate() + between(10, 30));
		const dueDate = isoDate(due.getFullYear(), due.getMonth(), due.getDate());
		let status;
		let paidAmount;
		if (order.paymentStatus === "paid") {
			status = "paid";
			paidAmount = order.total;
		} else if (order.paymentStatus === "partial") {
			status = dueDate < today ? "overdue" : "sent";
			paidAmount = Math.round(order.total / 2);
		} else {
			status = dueDate < today ? "overdue" : "sent";
			paidAmount = 0;
		}
		return {
			id: (index + 1).toString(),
			invoiceNumber: `INV-${3e3 + index + 1}`,
			orderId: order.id,
			orderNumber: order.orderNumber,
			customerId: order.customerId,
			customerName: order.customerName,
			amount: order.total,
			paidAmount,
			status,
			issueDate: isoDate(issue.getFullYear(), issue.getMonth(), issue.getDate()),
			dueDate,
			note: ""
		};
	});
}
var ATTENDANCE_POOL = [
	"present",
	"present",
	"present",
	"present",
	"present",
	"present",
	"present",
	"remote",
	"late",
	"absent"
];
/** Dam olish kuni emasligini tekshiradi (shanba/yakshanba). */
function isWorkday(date) {
	const day = date.getDay();
	return day !== 0 && day !== 6;
}
/** Oxirgi 14 ish kuni uchun har bir xodimning davomat yozuvi. */
function buildAttendance(employees) {
	const result = [];
	const now = /* @__PURE__ */ new Date();
	let id = 1;
	const workdays = [];
	let pointer = new Date(now);
	while (workdays.length < 14) {
		if (isWorkday(pointer)) workdays.push(new Date(pointer));
		pointer.setDate(pointer.getDate() - 1);
	}
	workdays.reverse();
	for (const employee of employees) for (const day of workdays) {
		if (employee.status === "vacation" || employee.status === "sick_leave") continue;
		const status = pick(ATTENDANCE_POOL);
		const date = isoDate(day.getFullYear(), day.getMonth(), day.getDate());
		let checkIn = "—";
		let checkOut = "—";
		let hours = 0;
		if (status === "present") {
			const startHour = 9;
			const endHour = 18;
			checkIn = `${String(startHour).padStart(2, "0")}:${String(between(0, 15)).padStart(2, "0")}`;
			checkOut = `${String(endHour).padStart(2, "0")}:${String(between(0, 30)).padStart(2, "0")}`;
			hours = endHour - startHour + between(0, 30) / 60;
		} else if (status === "remote") {
			checkIn = `${String(between(8, 10)).padStart(2, "0")}:${String(between(0, 59)).padStart(2, "0")}`;
			checkOut = `${String(between(17, 19)).padStart(2, "0")}:${String(between(0, 59)).padStart(2, "0")}`;
			hours = 8 + between(0, 60) / 60;
		} else if (status === "late") {
			const lateMinutes = between(15, 90);
			const startHour = 9;
			const startMinute = lateMinutes;
			checkIn = `${String(startHour + Math.floor(startMinute / 60)).padStart(2, "0")}:${String(startMinute % 60).padStart(2, "0")}`;
			checkOut = "18:00";
			hours = 18 - (startHour + startMinute / 60);
		}
		result.push({
			id: (id++).toString(),
			employeeId: employee.id,
			employeeName: employee.name,
			department: employee.department,
			date,
			status,
			checkIn,
			checkOut,
			hours: Math.round(hours * 10) / 10,
			note: ""
		});
	}
	return result.sort((a, b) => b.date.localeCompare(a.date));
}
var LEAVE_TYPES$1 = [
	"vacation",
	"vacation",
	"sick",
	"personal",
	"unpaid"
];
var LEAVE_REASONS = {
	vacation: [
		"Yillik mehnat ta'tili",
		"Oilaviy sayohat",
		"Dam olish"
	],
	sick: [
		"Shifokor tavsiyasi",
		"Kasallik varaqasi",
		"Sog'liqni tiklash"
	],
	personal: [
		"Shaxsiy sabab",
		"Oilaviy tadbir",
		"Hujjat rasmiylashtirish"
	],
	unpaid: ["Haq to'lanmaydigan ta'til", "Shaxsiy ishlar"]
};
function buildLeaveRequests(employees) {
	const now = /* @__PURE__ */ new Date();
	return [
		"approved",
		"approved",
		"approved",
		"approved",
		"pending",
		"pending",
		"pending",
		"rejected"
	].map((status, index) => {
		const employee = employees[index * 3 % employees.length];
		const type = LEAVE_TYPES$1[index % LEAVE_TYPES$1.length];
		const start = new Date(now);
		if (status === "pending") start.setDate(start.getDate() + between(3, 25));
		else start.setDate(start.getDate() - between(0, 20));
		const days = between(1, 12);
		const end = new Date(start);
		end.setDate(end.getDate() + days - 1);
		const requested = new Date(start);
		requested.setDate(requested.getDate() - between(3, 14));
		return {
			id: (index + 1).toString(),
			employeeId: employee.id,
			employeeName: employee.name,
			type,
			startDate: isoDate(start.getFullYear(), start.getMonth(), start.getDate()),
			endDate: isoDate(end.getFullYear(), end.getMonth(), end.getDate()),
			days,
			status,
			reason: pick(LEAVE_REASONS[type]),
			requestedDate: isoDate(requested.getFullYear(), requested.getMonth(), requested.getDate())
		};
	});
}
/**
* Oddiy 4 ta foydalanuvchi: admin, menejr, hisobchi, kassir
* 
* DEPLOY UCHUN DEFAULT LOGIN/PAROL:
* Login: admin@orbiserp.uz
* Parol: OrbisAdmin2024!
* 
* Bu parol production'da ham ishlaydi (environment variable bo'lmasa)
*/
var DEMO_PASSWORD = "123456";
var PRODUCTION_ADMIN_EMAIL = "admin@orbiserp.uz";
var PRODUCTION_ADMIN_PASSWORD = "OrbisAdmin2024!";
function buildUsers(employees) {
	const now = /* @__PURE__ */ new Date();
	const createdDate = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
	const adminEmail = process.env.ADMIN_EMAIL || PRODUCTION_ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD || PRODUCTION_ADMIN_PASSWORD;
	const adminPasswordHash = hashPassword(adminPassword);
	const demoPasswordHash = hashPassword("123456");
	const users = [
		{
			id: "1",
			name: "Administrator",
			login: "admin",
			email: adminEmail,
			role: "admin",
			status: "active",
			lastLogin: now.toISOString(),
			employeeId: null,
			createdDate,
			passwordHash: adminPasswordHash
		},
		{
			id: "2",
			name: "Menejr",
			login: "menejr",
			email: "menejr@test.uz",
			role: "manager",
			status: "active",
			lastLogin: now.toISOString(),
			employeeId: null,
			createdDate,
			passwordHash: demoPasswordHash
		},
		{
			id: "3",
			name: "Hisobchi",
			login: "hisobchi",
			email: "hisobchi@test.uz",
			role: "accountant",
			status: "active",
			lastLogin: now.toISOString(),
			employeeId: null,
			createdDate,
			passwordHash: demoPasswordHash
		},
		{
			id: "4",
			name: "Kassir",
			login: "kassir",
			email: "kassir@test.uz",
			role: "cashier",
			status: "active",
			lastLogin: now.toISOString(),
			employeeId: null,
			createdDate,
			passwordHash: demoPasswordHash
		}
	];
	console.log("\n" + "=".repeat(60));
	console.log("🔐 ADMIN LOGIN MA'LUMOTLARI:");
	console.log("=".repeat(60));
	console.log(`📧 Email: ${adminEmail}`);
	console.log(`👤 Username: admin`);
	console.log(`🔑 Password: ${adminPassword}`);
	console.log("=".repeat(60));
	console.log(`📝 Boshqa foydalanuvchilar paroli: ${DEMO_PASSWORD}`);
	console.log("=".repeat(60) + "\n");
	return users;
}
/** "YYYY-MM" davridagi ish (dam olishsiz) kunlari — dush–juma. */
function workingDaysOf(year, month) {
	const total = daysIn(year, month);
	let count = 0;
	for (let day = 1; day <= total; day++) {
		const weekday = new Date(year, month, day).getDay();
		if (weekday !== 0 && weekday !== 6) count++;
	}
	return count;
}
/**
* O'tgan oy uchun barcha faol xodimlarga ish haqi hisob-kitobini quradi.
* Joriy oy ataylab bo'sh qoldiriladi — foydalanuvchi uni "Hisoblash" tugmasi
* bilan yaratib ko'radi. Statuslar aralash: ko'pchilik to'langan, ba'zilari
* tasdiqlangan yoki qoralama.
*/
function buildPayrolls(employees) {
	const now = /* @__PURE__ */ new Date();
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const year = prev.getFullYear();
	const month = prev.getMonth();
	const period = `${year}-${String(month + 1).padStart(2, "0")}`;
	const workingDays = workingDaysOf(year, month);
	const createdDate = isoDate(year, month, Math.min(28, daysIn(year, month)));
	return employees.filter((employee) => !employee.deletedAt).map((employee, index) => {
		const absentDays = index % 3 === 0 ? between(1, 3) : 0;
		const presentDays = workingDays - absentDays;
		const perDay = workingDays === 0 ? 0 : employee.salary / workingDays;
		const absenceDeduction = Math.round(perDay * absentDays);
		const bonus = index % 4 === 0 ? money(.5, 2) : 0;
		const penalty = index % 7 === 0 ? money(.2, .6) : 0;
		const taxable = Math.max(0, employee.salary - absenceDeduction + bonus - penalty);
		const tax = Math.round(taxable * .12);
		const netSalary = taxable - tax;
		const status = index % 5 === 0 ? "approved" : index % 11 === 0 ? "draft" : "paid";
		return {
			id: `payroll-${period}-${employee.id}`,
			employeeId: employee.id,
			employeeName: employee.name,
			department: employee.department,
			period,
			baseSalary: employee.salary,
			workingDays,
			presentDays,
			absenceDeduction,
			bonus,
			penalty,
			tax,
			netSalary,
			status,
			createdDate,
			note: ""
		};
	});
}
function buildActivities() {
	return [
		[
			"AB",
			"bg-[#def0ea] text-[#317b68]",
			"Yangi buyurtma yaratildi",
			"#ORD-1098 · Texno Park do'koni",
			"Plus",
			8
		],
		[
			"MP",
			"bg-[#fff0dc] text-[#bf7430]",
			"Xarajat tranzaksiyasi qo'shildi",
			"Ofis ijarasi · 8 500 000 so'm",
			"ArrowDownRight",
			24
		],
		[
			"HR",
			"bg-[#eeeafd] text-[#6b61b7]",
			"Ta'til so'rovi tasdiqlandi",
			"Madina Rasulova · 5 ish kuni",
			"UsersRound",
			62
		],
		[
			"SM",
			"bg-[#e3eefb] text-[#3f77ad]",
			"Bitim muvaffaqiyatli yopildi",
			"Smart Electronics · 24 000 000 so'm",
			"Handshake",
			180
		],
		[
			"JT",
			"bg-[#fdeae9] text-[#b8564a]",
			"Mahsulot qoldig'i tanqis darajaga tushdi",
			"iPhone 15 Pro Max 256GB · 2 dona",
			"PackageMinus",
			300
		],
		[
			"GA",
			"bg-[#def0ea] text-[#317b68]",
			"Oylik hisobot yuklandi",
			"Iyul oyi · moliya bo'limi",
			"Download",
			420
		]
	].map(([userInitials, userBgClass, action, details, icon, minutesAgo], index) => ({
		id: (index + 1).toString(),
		userId: `user${index + 1}`,
		userInitials,
		userBgClass,
		action,
		details,
		timestamp: (/* @__PURE__ */ new Date(Date.now() - minutesAgo * 60 * 1e3)).toISOString(),
		icon
	}));
}
/** Barcha demo ma'lumotlarini bir marta quradi. */
function buildSeedData() {
	const employees = buildEmployees();
	const salaryFund = employees.reduce((sum, e) => sum + e.salary, 0);
	const sellers = employees.filter((e) => e.department === "Savdo");
	const products = buildProducts();
	const customers = buildCustomers();
	const suppliers = buildSuppliers();
	const orders = buildOrders(customers, products, sellers);
	return {
		employees,
		products,
		customers,
		suppliers,
		branches: buildBranches(),
		orders,
		purchases: buildPurchases(suppliers, products, employees),
		invoices: buildInvoices(orders),
		attendance: buildAttendance(employees),
		leaveRequests: buildLeaveRequests(employees),
		users: buildUsers(employees),
		movements: buildMovements(products),
		deals: buildDeals(sellers),
		payrolls: buildPayrolls(employees),
		transactions: buildTransactions(salaryFund),
		activities: buildActivities()
	};
}
//#endregion
//#region server/data/store.ts
/**
* Yagona ma'lumotlar ombori. Barcha route'lar shu yerdan o'qiydi, shuning uchun
* bir bo'limdagi o'zgarish boshqa bo'lim statistikasida ham darhol aks etadi.
*
* Massivlar — ish jarayonidagi nusxa (tez filtrlash uchun), doimiy manba esa
* SQLite (mahalliy) yoki PostgreSQL (Vercel/production, `DATABASE_URL` orqali).
*
* MUHIM: Vercel serverless funksiyalari bir nechta mustaqil konteynerda
* ishlashi mumkin, har birining o'z vaqtinchalik `/tmp` fayl tizimi bor va
* ular bir-birining yozganini ko'rmaydi. Shu sabab SQLite `/tmp`da ishlatilsa,
* masalan mahsulot qoldig'i turli so'rovlarda turlicha (tasodifiy) ko'rinishi
* mumkin edi. PostgreSQL barcha instance'lar uchun umumiy va doimiy bo'lgani
* uchun bu muammoni hal qiladi — shuning uchun har bir so'rov boshida qayta
* yuklanadi (`reloadStore`) va har bir yozuvdan keyin darhol saqlanadi
* (`persist`), javob jo'natilishidan OLDIN (server/index.ts).
*/
var employees$1 = [];
var products$1 = [];
var customers$1 = [];
var suppliers$1 = [];
var branches = [];
var orders$1 = [];
var purchases$1 = [];
var invoices = [];
var attendance = [];
var leaveRequests = [];
var users$1 = [];
var movements = [];
var deals$1 = [];
var payrolls$1 = [];
var transactions$1 = [];
var activities = [];
var debtPayments = [];
var sales = [];
var refunds = [];
var supplierReturns = [];
/** Massiv referensiyasini saqlab, ichidagi qatorlarni to'liq almashtiradi. */
function replaceContents(target, fresh) {
	target.length = 0;
	target.push(...fresh);
}
async function loadTable(table) {
	return USE_POSTGRES ? pgReadTable(table) : readTable(table);
}
async function saveTable(table, rows) {
	if (USE_POSTGRES) await pgWriteTable(table, rows);
	else writeTable(table, rows);
}
async function loadAllTables() {
	replaceContents(employees$1, await loadTable("employees"));
	replaceContents(products$1, await loadTable("products"));
	replaceContents(customers$1, await loadTable("customers"));
	replaceContents(suppliers$1, await loadTable("suppliers"));
	replaceContents(branches, await loadTable("branches"));
	replaceContents(orders$1, await loadTable("orders"));
	replaceContents(purchases$1, await loadTable("purchases"));
	replaceContents(invoices, await loadTable("invoices"));
	replaceContents(attendance, await loadTable("attendance"));
	replaceContents(leaveRequests, await loadTable("leave_requests"));
	replaceContents(users$1, await loadTable("users"));
	replaceContents(movements, await loadTable("movements"));
	replaceContents(deals$1, await loadTable("deals"));
	replaceContents(payrolls$1, await loadTable("payrolls"));
	replaceContents(transactions$1, await loadTable("transactions"));
	replaceContents(activities, await loadTable("activities"));
	replaceContents(debtPayments, await loadTable("debt_payments"));
	replaceContents(sales, await loadTable("sales"));
	replaceContents(refunds, await loadTable("refunds"));
	replaceContents(supplierReturns, await loadTable("supplier_returns"));
}
/**
* Xotiradagi holatni bazaga yozadi.
* Har bir o'zgartiruvchi so'rov javobi jo'natilishidan OLDIN chaqiriladi
* (`server/index.ts`) — Vercel javob jo'natilgach funksiyani darhol
* to'xtatib qo'yishi mumkin, shu sabab yozish "fire-and-forget" emas.
*/
async function persist() {
	await saveTable("employees", employees$1);
	await saveTable("products", products$1);
	await saveTable("customers", customers$1);
	await saveTable("suppliers", suppliers$1);
	await saveTable("branches", branches);
	await saveTable("orders", orders$1);
	await saveTable("purchases", purchases$1);
	await saveTable("invoices", invoices);
	await saveTable("attendance", attendance);
	await saveTable("leave_requests", leaveRequests);
	await saveTable("users", users$1);
	await saveTable("movements", movements);
	await saveTable("deals", deals$1);
	await saveTable("payrolls", payrolls$1);
	await saveTable("transactions", transactions$1);
	await saveTable("activities", activities);
	await saveTable("debt_payments", debtPayments);
	await saveTable("sales", sales);
	await saveTable("refunds", refunds);
	await saveTable("supplier_returns", supplierReturns);
}
/**
* Boshqa instance'lar yozgan eng so'nggi holatni qayta yuklaydi.
* PostgreSQL'da har bir so'rov boshida chaqiriladi (server/index.ts) — shu
* orqali barcha serverless instance'lar bir xil ma'lumotni ko'radi. Mahalliy
* SQLite rejimida bitta jarayon ichida massivlar allaqachon dolzarb bo'lgani
* uchun keraksiz ish qilmaslik uchun hech narsa bajarmaydi.
*/
async function reloadStore() {
	if (!USE_POSTGRES) return;
	await loadAllTables();
}
var readyPromise = null;
/**
* Ombor birinchi marta ishlatilishidan oldin (server ishga tushganda yoki
* Vercel funksiyasi "sovuq" boshlanganda) bir marta chaqiriladi. Keyingi
* chaqiruvlar xotiradagi (allaqachon bajarilgan) promise'ni qaytaradi.
*/
function ensureStoreReady() {
	if (!readyPromise) readyPromise = initStore().catch((error) => {
		readyPromise = null;
		throw error;
	});
	return readyPromise;
}
async function initStore() {
	console.log("🔍 Checking database state...");
	const dbEmpty = USE_POSTGRES ? await pgIsEmpty() : isEmpty();
	console.log(`📊 Database empty: ${dbEmpty}`);
	if (dbEmpty) {
		console.log("🌱 Seeding database with demo data...");
		try {
			const seed = buildSeedData();
			console.log("📝 Writing tables...");
			await saveTable("employees", seed.employees);
			await saveTable("products", seed.products);
			await saveTable("customers", seed.customers);
			await saveTable("suppliers", seed.suppliers);
			await saveTable("branches", seed.branches);
			await saveTable("orders", seed.orders);
			await saveTable("purchases", seed.purchases);
			await saveTable("invoices", seed.invoices);
			await saveTable("attendance", seed.attendance);
			await saveTable("leave_requests", seed.leaveRequests);
			await saveTable("users", seed.users);
			await saveTable("movements", seed.movements);
			await saveTable("deals", seed.deals);
			await saveTable("payrolls", seed.payrolls);
			await saveTable("transactions", seed.transactions);
			await saveTable("activities", seed.activities);
			console.log("✅ Database seeded successfully");
		} catch (seedError) {
			console.error("❌ Database seeding failed:", seedError);
			throw seedError;
		}
	} else console.log("✅ Database already contains data");
	console.log("📖 Reading tables from database...");
	await loadAllTables();
	console.log("✅ Tables loaded successfully");
	console.log(`📊 Data counts: users=${users$1?.length || 0}, employees=${employees$1?.length || 0}, products=${products$1?.length || 0}`);
	/**
	* Auth qo'shilishidan oldin yaratilgan bazada parol hash'i bo'sh bo'ladi.
	* Bunday hisoblarga standart parol beriladi, aks holda hech kim kira olmaydi.
	*/
	const usersMissingPassword = users$1.filter((user) => !user.passwordHash);
	if (usersMissingPassword.length > 0) {
		for (const user of usersMissingPassword) user.passwordHash = hashPassword(DEFAULT_PASSWORD);
		await saveTable("users", users$1);
		console.info(`${usersMissingPassword.length} ta hisobga standart parol o'rnatildi: ${DEFAULT_PASSWORD}`);
	}
	await ensureAdminUser();
}
/**
* Production deploymentda admin foydalanuvchini yaratish yoki yangilash.
* Environment variable'lardan yoki hardcoded qiymatlardan olinadi.
*
* DEPLOY UCHUN DEFAULT LOGIN (hardcoded - ishonchli):
* Email: admin@orbiserp.uz
* Parol: OrbisAdmin2024!
*/
async function ensureAdminUser() {
	const PRODUCTION_ADMIN_EMAIL = "admin@orbiserp.uz";
	const PRODUCTION_ADMIN_PASSWORD = "OrbisAdmin2024!";
	const ADMIN_EMAIL = process.env.ADMIN_EMAIL || PRODUCTION_ADMIN_EMAIL;
	const ADMIN_PASSWORD_FROM_ENV = process.env.ADMIN_PASSWORD || PRODUCTION_ADMIN_PASSWORD;
	console.log("🔐 Admin initialization:");
	console.log("   Email from env:", process.env.ADMIN_EMAIL || "not set");
	console.log("   Password from env:", process.env.ADMIN_PASSWORD ? "***" : "not set");
	console.log("   Using Email:", ADMIN_EMAIL);
	console.log("   Using Password:", ADMIN_PASSWORD_FROM_ENV ? "***" : "empty");
	console.log("   Users array length:", users$1?.length || 0);
	try {
		if (!ADMIN_PASSWORD_FROM_ENV) {
			console.error("❌ CRITICAL: Admin password not configured!");
			throw new Error("Admin password is required");
		}
		let adminUser = users$1.find((u) => u.email === ADMIN_EMAIL || u.login === "admin" || u.role === "admin");
		console.log("🔍 Admin user search result:", adminUser ? "found" : "not found");
		if (!adminUser) {
			console.log("📝 Creating new admin user...");
			const now = /* @__PURE__ */ new Date();
			const newAdminId = nextId();
			adminUser = {
				id: newAdminId,
				name: "Administrator",
				login: "admin",
				email: ADMIN_EMAIL,
				role: "admin",
				status: "active",
				lastLogin: now.toISOString(),
				employeeId: null,
				createdDate: now.toISOString().split("T")[0],
				passwordHash: hashPassword(ADMIN_PASSWORD_FROM_ENV)
			};
			users$1.push(adminUser);
			await saveTable("users", users$1);
			console.info("✅ Admin foydalanuvchi yaratildi:", ADMIN_EMAIL);
			console.info("🔑 Admin login ma'lumotlari:");
			console.info(`   ID: ${newAdminId}`);
			console.info(`   Login: admin`);
			console.info(`   Email: ${ADMIN_EMAIL}`);
			console.info(`   Parol: ${ADMIN_PASSWORD_FROM_ENV}`);
			console.info(`   Password hash length: ${adminUser.passwordHash?.length || 0}`);
		} else {
			console.log("♻️ Updating existing admin user...");
			const oldHash = adminUser.passwordHash;
			adminUser.passwordHash = hashPassword(ADMIN_PASSWORD_FROM_ENV);
			adminUser.email = ADMIN_EMAIL;
			adminUser.login = "admin";
			adminUser.role = "admin";
			adminUser.status = "active";
			await saveTable("users", users$1);
			console.info("✅ Admin foydalanuvchi paroli yangilandi:", ADMIN_EMAIL);
			console.info("🔑 Admin login ma'lumotlari:");
			console.info(`   ID: ${adminUser.id}`);
			console.info(`   Login: ${adminUser.login}`);
			console.info(`   Email: ${ADMIN_EMAIL}`);
			console.info(`   Parol: ${ADMIN_PASSWORD_FROM_ENV}`);
			console.info(`   Old hash length: ${oldHash?.length || 0}`);
			console.info(`   New hash length: ${adminUser.passwordHash?.length || 0}`);
		}
		const verifyAdmin = users$1.find((u) => u.login === "admin" || u.email === ADMIN_EMAIL);
		if (!verifyAdmin) console.error("❌ CRITICAL: Admin user not found after creation!");
		else console.log("✅ Admin user verification passed:", {
			id: verifyAdmin.id,
			login: verifyAdmin.login,
			email: verifyAdmin.email,
			hasPassword: !!verifyAdmin.passwordHash,
			passwordHashLength: verifyAdmin.passwordHash?.length || 0,
			status: verifyAdmin.status,
			role: verifyAdmin.role
		});
	} catch (adminError) {
		console.error("❌ CRITICAL: Admin initialization failed!");
		console.error("Error:", adminError);
		throw adminError;
	}
}
/** ID generatori — ketma-ket chaqiruvlarda takrorlanmasligi kafolatlanadi. */
var idCounter = Date.now();
function nextId() {
	return (++idCounter).toString();
}
/** Faollik jurnaliga yangi yozuv qo'shadi (eng yangisi birinchi). */
function logActivity(entry) {
	activities.unshift({
		id: nextId(),
		userId: "user1",
		userInitials: entry.userInitials ?? "AZ",
		userBgClass: entry.userBgClass ?? "bg-[#def0ea] text-[#317b68]",
		action: entry.action,
		details: entry.details,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		icon: entry.icon
	});
	if (activities.length > 50) activities.length = 50;
}
/**
* Mahsulot qoldig'ini o'zgartiradi va harakatni jurnalga yozadi.
* Qoldiq hech qachon manfiy bo'lmaydi — ombor hisobida bu mumkin emas.
* `delta` musbat bo'lsa kirim, manfiy bo'lsa chiqim.
*/
function applyStockChange(product, delta, options) {
	product.quantity = Math.max(0, product.quantity + delta);
	const movement = {
		id: nextId(),
		productId: product.id,
		productName: product.name,
		type: options.type ?? (delta >= 0 ? "in" : "out"),
		quantity: Math.abs(delta),
		balanceAfter: product.quantity,
		reason: options.reason,
		reference: options.reference ?? "—",
		date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
	};
	movements.unshift(movement);
	if (movements.length > 500) movements.length = 500;
	return movement;
}
/**
* Yozuvni "arxivga" ko'chiradi — massivdan olib tashlamaydi, faqat `deletedAt`
* belgisini qo'yadi (TZ 6, 8-bo'lim: soft delete). Shu sababli yozuv tarixi va
* bog'liq hisobotlar buzilmaydi, kerak bo'lsa tiklash mumkin.
* Allaqachon o'chirilgan bo'lsa null qaytaradi.
*/
function softRemove(list, id) {
	const item = list.find((row) => row.id === id && !row.deletedAt);
	if (!item) return null;
	item.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
	return item;
}
/** Faqat o'chirilmagan yozuvlar. Ro'yxat va statistikalarda ishlatiladi. */
function active(list) {
	return list.filter((row) => !row.deletedAt);
}
/**
* Yozuvni butunlay o'chiradi (arxivdan ham) — faqat maxsus hollarda.
* Oddiy o'chirish `softRemove` orqali bo'ladi.
*/
function removeById(list, id) {
	const index = list.findIndex((item) => item.id === id);
	if (index === -1) return null;
	return list.splice(index, 1)[0];
}
//#endregion
//#region server/data/metrics.ts
/**
* Statistika faqat o'chirilmagan yozuvlardan hisoblanadi (soft delete).
* Har chaqiruvda `active()` qo'llanadi — arxivdagi yozuvlar ko'rsatkichlarni
* buzmaydi. `attendance` va `leaveRequests` jurnallari soft-delete emas.
*/
var customers = () => active(customers$1);
var deals = () => active(deals$1);
var employees = () => active(employees$1);
var orders = () => active(orders$1);
var payrolls = () => active(payrolls$1);
var products = () => active(products$1);
var purchases = () => active(purchases$1);
var suppliers = () => active(suppliers$1);
var transactions = () => active(transactions$1);
var users = () => active(users$1);
/**
* Barcha ko'rsatkichlar store'dagi jonli ma'lumotdan hisoblanadi.
* Shu sababli yangi tranzaksiya qo'shilishi balansda ham, dashboardda ham darhol aks etadi.
*/
/** Hisobot davri — real joriy oy. Yangi yozuvlar bugungi sana bilan kiritiladi. */
function currentPeriod$1() {
	const now = /* @__PURE__ */ new Date();
	return {
		year: now.getFullYear(),
		month: now.getMonth()
	};
}
function previousPeriod() {
	const now = /* @__PURE__ */ new Date();
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	return {
		year: prev.getFullYear(),
		month: prev.getMonth()
	};
}
function inPeriod(dateStr, period) {
	const date = new Date(dateStr);
	return date.getFullYear() === period.year && date.getMonth() === period.month;
}
function sumBy(list, type) {
	return list.filter((t) => t.type === type).reduce((total, t) => total + t.amount, 0);
}
/**
* Foizli o'zgarish.
* Baza nolga teng bo'lsa foiz matematik jihatdan aniqlanmagan — Infinity ko'rsatmaslik
* uchun ±100% qaytaramiz, ishora esa joriy qiymatdan olinadi (zarar +100% bo'lib ko'rinmasin).
*/
function percentChange(current, previous) {
	if (previous === 0) {
		if (current === 0) return 0;
		return current > 0 ? 100 : -100;
	}
	return Math.round((current - previous) / Math.abs(previous) * 1e3) / 10;
}
function financeStats() {
	const thisMonth = transactions().filter((t) => inPeriod(t.date, currentPeriod$1()));
	const lastMonth = transactions().filter((t) => inPeriod(t.date, previousPeriod()));
	const monthlyIncome = sumBy(thisMonth, "income");
	const monthlyExpenses = sumBy(thisMonth, "expense");
	const currentBalance = sumBy(transactions(), "income") - sumBy(transactions(), "expense");
	const lastBalance = sumBy(lastMonth, "income") - sumBy(lastMonth, "expense");
	return {
		currentBalance,
		monthlyIncome,
		monthlyExpenses,
		balanceChange: percentChange(monthlyIncome - monthlyExpenses, lastBalance)
	};
}
function dashboardStats() {
	const thisMonth = transactions().filter((t) => inPeriod(t.date, currentPeriod$1()));
	const lastMonth = transactions().filter((t) => inPeriod(t.date, previousPeriod()));
	const totalRevenue = sumBy(thisMonth, "income");
	const totalExpenses = sumBy(thisMonth, "expense");
	const prevRevenue = sumBy(lastMonth, "income");
	const prevExpenses = sumBy(lastMonth, "expense");
	const netProfit = totalRevenue - totalExpenses;
	const prevProfit = prevRevenue - prevExpenses;
	const activeEmployees = employees().filter((e) => e.status === "active").length;
	const hiredThisMonth = employees().filter((e) => inPeriod(e.hireDate, currentPeriod$1())).length;
	return {
		totalRevenue,
		totalExpenses,
		netProfit,
		activeEmployees,
		revenueChange: percentChange(totalRevenue, prevRevenue),
		expensesChange: percentChange(totalExpenses, prevExpenses),
		profitChange: percentChange(netProfit, prevProfit),
		employeesChange: hiredThisMonth
	};
}
/**
* Joriy oyning har bir kuni uchun kirim/chiqim yig'indisi — dashboard grafigi uchun.
* Tranzaksiyasi yo'q kunlar ham nol qiymat bilan qaytadi, aks holda grafik uzilib qoladi.
*/
function revenueTrend() {
	const { year, month } = currentPeriod$1();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	return Array.from({ length: daysInMonth }, (_, index) => {
		const day = index + 1;
		const dayTransactions = transactions().filter((t) => {
			const date = new Date(t.date);
			return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
		});
		return {
			label: day.toString().padStart(2, "0"),
			income: sumBy(dayTransactions, "income"),
			expense: sumBy(dayTransactions, "expense")
		};
	});
}
/**
* Bo'limlar bo'yicha rejadagi shtat birliklari.
* Ochiq vakansiya shu rejadan haqiqiy xodimlar sonini ayirish orqali topiladi.
*/
var HEADCOUNT_PLAN = {
	Savdo: 6,
	IT: 5,
	Marketing: 4,
	Moliya: 4,
	Ombor: 4,
	HR: 3,
	"Ishlab chiqarish": 4,
	Yuridik: 2
};
function todayISO() {
	return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
/** Bugungi davomat yozuvlari; hali kiritilmagan bo'lsa oxirgi mavjud kun olinadi. */
function latestAttendanceDay() {
	const today = todayISO();
	const forToday = attendance.filter((record) => record.date === today);
	if (forToday.length > 0) return forToday;
	const latest = attendance.reduce((newest, record) => record.date > newest ? record.date : newest, "");
	return latest ? attendance.filter((record) => record.date === latest) : [];
}
function attendanceStats() {
	const day = latestAttendanceDay();
	const count = (status) => day.filter((record) => record.status === status).length;
	const present = count("present");
	const late = count("late");
	const remote = count("remote");
	const absent = count("absent");
	const onLeave = count("leave");
	const expected = present + late + remote + absent;
	return {
		totalEmployees: employees().length,
		present,
		late,
		remote,
		absent,
		onLeave,
		attendanceRate: expected === 0 ? 0 : Math.round((present + late + remote) / expected * 100)
	};
}
function hrStats() {
	const totalEmployees = employees().length;
	const today = todayISO();
	const onVacationToday = leaveRequests.filter((request) => request.status === "approved" && request.startDate <= today && request.endDate >= today).length;
	const actual = /* @__PURE__ */ new Map();
	for (const employee of employees()) actual.set(employee.department, (actual.get(employee.department) ?? 0) + 1);
	const openPositions = Object.entries(HEADCOUNT_PLAN).reduce((sum, [department, planned]) => sum + Math.max(0, planned - (actual.get(department) ?? 0)), 0);
	return {
		totalEmployees,
		onVacationToday,
		attendanceRate: attendanceStats().attendanceRate,
		openPositions
	};
}
function leaveStats() {
	const today = todayISO();
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	return {
		pending: leaveRequests.filter((request) => request.status === "pending").length,
		approvedThisMonth: leaveRequests.filter((request) => request.status === "approved" && inPeriod(request.startDate, currentPeriod$1())).length,
		onLeaveToday: leaveRequests.filter((request) => request.status === "approved" && request.startDate <= today && request.endDate >= today).length,
		totalDaysThisYear: leaveRequests.filter((request) => request.status === "approved" && new Date(request.startDate).getFullYear() === year).reduce((sum, request) => sum + request.days, 0)
	};
}
function isLowStock(product) {
	return product.quantity <= product.minQuantity;
}
function warehouseStats() {
	const lowStock = products().filter(isLowStock).length;
	return {
		totalProducts: products().length,
		normalStock: products().length - lowStock,
		lowStock,
		warehouseValue: products().reduce((sum, p) => sum + p.price * p.quantity, 0)
	};
}
/** Voronkada faqat yopilmagan bitimlar hisobga olinadi. */
var OPEN_STATUSES = [
	"new_lead",
	"negotiation",
	"proposal"
];
function crmStats() {
	return {
		totalPipeline: deals().filter((d) => OPEN_STATUSES.includes(d.status)).reduce((sum, d) => sum + d.value, 0),
		newLeads: deals().filter((d) => d.status === "new_lead").length,
		inNegotiation: deals().filter((d) => d.status === "negotiation").length,
		closedThisMonth: deals().filter((d) => d.status === "closed_won" && inPeriod(d.expectedCloseDate, currentPeriod$1())).length
	};
}
/** Savdo voronkasi bosqichlari — CRM sahifasidagi diagramma uchun. */
function dealFunnel() {
	return [
		{
			status: "new_lead",
			label: "Yangi lead"
		},
		{
			status: "negotiation",
			label: "Muzokara"
		},
		{
			status: "proposal",
			label: "Taklif"
		},
		{
			status: "closed_won",
			label: "Muvaffaqiyatli"
		},
		{
			status: "closed_lost",
			label: "Yopilgan"
		}
	].map(({ status, label }) => {
		const stageDeals = deals().filter((d) => d.status === status);
		return {
			status,
			label,
			count: stageDeals.length,
			value: stageDeals.reduce((sum, d) => sum + d.value, 0)
		};
	});
}
/** `map`ni qiymat bo'yicha kamayish tartibida ro'yxatga aylantiradi. */
function toSortedGroups(map, limit) {
	const groups = [...map.entries()].map(([label, agg]) => ({
		label,
		count: agg.count,
		value: agg.value
	})).sort((a, b) => b.value - a.value);
	return limit ? groups.slice(0, limit) : groups;
}
/** Moliya: kategoriya bo'yicha kirim/chiqim va hisoblar balansi. */
function financeBreakdown() {
	const thisMonth = transactions().filter((t) => inPeriod(t.date, currentPeriod$1()));
	const categoryMap = /* @__PURE__ */ new Map();
	const accountMap = /* @__PURE__ */ new Map();
	for (const t of thisMonth) {
		const category = categoryMap.get(t.category) ?? {
			income: 0,
			expense: 0
		};
		category[t.type] += t.amount;
		categoryMap.set(t.category, category);
		const account = accountMap.get(t.account) ?? {
			income: 0,
			expense: 0
		};
		account[t.type] += t.amount;
		accountMap.set(t.account, account);
	}
	return {
		byCategory: [...categoryMap.entries()].map(([category, agg]) => ({
			category,
			...agg
		})).sort((a, b) => b.income + b.expense - (a.income + a.expense)),
		byAccount: [...accountMap.entries()].map(([account, agg]) => ({
			account,
			income: agg.income,
			expense: agg.expense,
			balance: agg.income - agg.expense
		})).sort((a, b) => b.balance - a.balance)
	};
}
/** HR: bo'lim bo'yicha xodim soni, maosh fondi va o'rtacha maosh. */
function hrBreakdown() {
	const map = /* @__PURE__ */ new Map();
	for (const e of employees()) {
		const dept = map.get(e.department) ?? {
			headcount: 0,
			salaryTotal: 0,
			onLeave: 0
		};
		dept.headcount += 1;
		dept.salaryTotal += e.salary;
		if (e.status !== "active") dept.onLeave += 1;
		map.set(e.department, dept);
	}
	return {
		byDepartment: [...map.entries()].map(([department, agg]) => ({
			department,
			...agg
		})).sort((a, b) => b.headcount - a.headcount),
		totalMonthlyPayroll: employees().reduce((sum, e) => sum + e.salary, 0)
	};
}
/** Ombor: kategoriya/joy bo'yicha qiymat, top ta'minotchilar va tanqis mahsulotlar. */
function warehouseBreakdown() {
	const categoryMap = /* @__PURE__ */ new Map();
	const locationMap = /* @__PURE__ */ new Map();
	const supplierMap = /* @__PURE__ */ new Map();
	for (const p of products()) {
		const value = p.price * p.quantity;
		for (const [map, key] of [
			[categoryMap, p.category],
			[locationMap, p.location],
			[supplierMap, p.supplier]
		]) {
			const agg = map.get(key) ?? {
				count: 0,
				value: 0
			};
			agg.count += 1;
			agg.value += value;
			map.set(key, agg);
		}
	}
	return {
		byCategory: toSortedGroups(categoryMap),
		byLocation: toSortedGroups(locationMap),
		topSuppliers: toSortedGroups(supplierMap, 5),
		lowStockItems: products().filter(isLowStock).sort((a, b) => a.quantity / a.minQuantity - b.quantity / b.minQuantity)
	};
}
/** Buyurtma "faol" — hali yetkazilmagan va bekor qilinmagan. */
function isPendingOrder(order) {
	return order.status !== "delivered" && order.status !== "cancelled";
}
/** Bekor qilingan buyurtma tushum va qarzga kirmaydi. */
function billableOrders() {
	return orders().filter((o) => o.status !== "cancelled");
}
function orderStats() {
	const billable = billableOrders();
	return {
		totalOrders: orders().length,
		pendingOrders: orders().filter(isPendingOrder).length,
		deliveredThisMonth: orders().filter((o) => o.status === "delivered" && inPeriod(o.orderDate, currentPeriod$1())).length,
		totalValue: billable.reduce((sum, o) => sum + o.total, 0),
		unpaidAmount: billable.reduce((sum, o) => {
			if (o.paymentStatus === "paid") return sum;
			return sum + (o.paymentStatus === "partial" ? o.total / 2 : o.total);
		}, 0)
	};
}
function orderBreakdown() {
	const statusLabels = {
		draft: "Qoralama",
		confirmed: "Tasdiqlangan",
		shipped: "Jo'natilgan",
		delivered: "Yetkazilgan",
		cancelled: "Bekor qilingan"
	};
	const byStatus = Object.keys(statusLabels).map((status) => {
		const group = orders().filter((o) => o.status === status);
		return {
			label: statusLabels[status],
			count: group.length,
			value: group.reduce((sum, o) => sum + o.total, 0)
		};
	});
	const customerMap = /* @__PURE__ */ new Map();
	const productMap = /* @__PURE__ */ new Map();
	for (const order of billableOrders()) {
		const customer = customerMap.get(order.customerName) ?? {
			count: 0,
			value: 0
		};
		customer.count += 1;
		customer.value += order.total;
		customerMap.set(order.customerName, customer);
		for (const item of order.items) {
			const product = productMap.get(item.productName) ?? {
				count: 0,
				value: 0
			};
			product.count += item.quantity;
			product.value += item.quantity * item.price;
			productMap.set(item.productName, product);
		}
	}
	return {
		byStatus,
		topCustomers: toSortedGroups(customerMap, 5),
		topProducts: toSortedGroups(productMap, 5)
	};
}
function customerStats() {
	return {
		totalCustomers: customers().length,
		activeCustomers: customers().filter((c) => c.status === "active").length,
		newThisMonth: customers().filter((c) => inPeriod(c.createdDate, currentPeriod$1())).length,
		totalRevenue: orders().filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total, 0)
	};
}
function supplierStats() {
	const active = suppliers().filter((s) => s.status === "active");
	const totalRating = suppliers().reduce((sum, s) => sum + s.rating, 0);
	return {
		totalSuppliers: suppliers().length,
		activeSuppliers: active.length,
		categories: new Set(suppliers().map((s) => s.category)).size,
		averageRating: suppliers().length === 0 ? 0 : Math.round(totalRating / suppliers().length * 10) / 10
	};
}
function purchaseStats() {
	const billable = purchases().filter((p) => p.status !== "cancelled");
	return {
		totalPurchases: purchases().length,
		awaitingDelivery: purchases().filter((p) => p.status === "ordered").length,
		receivedThisMonth: purchases().filter((p) => p.status === "received" && inPeriod(p.orderDate, currentPeriod$1())).length,
		totalValue: billable.reduce((sum, p) => sum + p.total, 0),
		unpaidAmount: billable.reduce((sum, p) => {
			if (p.paymentStatus === "paid") return sum;
			return sum + (p.paymentStatus === "partial" ? p.total / 2 : p.total);
		}, 0)
	};
}
function userStats() {
	const weekAgo = (/* @__PURE__ */ new Date(Date.now() - 10080 * 60 * 1e3)).toISOString();
	return {
		totalUsers: users().length,
		activeUsers: users().filter((u) => u.status === "active").length,
		admins: users().filter((u) => u.role === "admin").length,
		activeThisWeek: users().filter((u) => u.lastLogin && u.lastLogin >= weekAgo).length
	};
}
/** Rollar va ular ochadigan bo'limlar — ruxsatlar matritsasi uchun. */
function rolePermissions() {
	return [
		{
			role: "admin",
			label: "Administrator",
			description: "Barcha bo'limlarga to'liq huquq, foydalanuvchilarni boshqaradi",
			modules: [
				"Boshqaruv paneli",
				"Moliya",
				"Buyurtmalar",
				"Xaridlar",
				"Fakturalar",
				"Mijozlar",
				"Ombor",
				"Ta'minotchilar",
				"Xodimlar",
				"Hisobotlar",
				"Sozlamalar"
			]
		},
		{
			role: "manager",
			label: "Rahbar",
			description: "Sozlamalardan tashqari barcha bo'limlarni ko'radi va tahrirlaydi",
			modules: [
				"Boshqaruv paneli",
				"Moliya",
				"Buyurtmalar",
				"Xaridlar",
				"Fakturalar",
				"Mijozlar",
				"Ombor",
				"Ta'minotchilar",
				"Xodimlar",
				"Hisobotlar"
			]
		},
		{
			role: "accountant",
			label: "Buxgalter",
			description: "Moliya, fakturalar va hisobotlar bilan ishlaydi",
			modules: [
				"Boshqaruv paneli",
				"Moliya",
				"Fakturalar",
				"Xaridlar",
				"Hisobotlar"
			]
		},
		{
			role: "warehouse",
			label: "Ombor xodimi",
			description: "Ombor qoldig'i, xaridlar va ta'minotchilarni boshqaradi",
			modules: [
				"Ombor",
				"Xaridlar",
				"Ta'minotchilar",
				"Buyurtmalar"
			]
		},
		{
			role: "sales",
			label: "Sotuv menejeri",
			description: "Buyurtma, bitim va mijozlar bilan ishlaydi",
			modules: [
				"Boshqaruv paneli",
				"Buyurtmalar",
				"Bitimlar",
				"Mijozlar",
				"Fakturalar"
			]
		},
		{
			role: "viewer",
			label: "Kuzatuvchi",
			description: "Faqat ko'rish huquqi, o'zgartira olmaydi",
			modules: ["Boshqaruv paneli", "Hisobotlar"]
		}
	];
}
var MONTH_NAMES = [
	"Yanvar",
	"Fevral",
	"Mart",
	"Aprel",
	"May",
	"Iyun",
	"Iyul",
	"Avgust",
	"Sentabr",
	"Oktabr",
	"Noyabr",
	"Dekabr"
];
/**
* Tanlangan davr uchun yig'ma hisobot: daromad/xarajat, marja, kategoriya
* kesimi, oylik dinamika va top ro'yxatlar.
*/
function reportSummary(from, to) {
	const inRange = (date) => date >= from && date <= to;
	const periodTransactions = transactions().filter((t) => inRange(t.date));
	const totalIncome = sumBy(periodTransactions, "income");
	const totalExpense = sumBy(periodTransactions, "expense");
	const netProfit = totalIncome - totalExpense;
	const categoryMap = /* @__PURE__ */ new Map();
	for (const t of periodTransactions) {
		const row = categoryMap.get(t.category) ?? {
			income: 0,
			expense: 0
		};
		row[t.type] += t.amount;
		categoryMap.set(t.category, row);
	}
	const byCategory = [...categoryMap.entries()].map(([label, row]) => ({
		label,
		...row
	})).sort((a, b) => b.income + b.expense - (a.income + a.expense));
	const monthMap = /* @__PURE__ */ new Map();
	for (const t of periodTransactions) {
		const date = new Date(t.date);
		const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
		const row = monthMap.get(key) ?? {
			income: 0,
			expense: 0
		};
		row[t.type] += t.amount;
		monthMap.set(key, row);
	}
	const monthly = [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, row]) => {
		const [year, month] = key.split("-");
		return {
			label: `${MONTH_NAMES[Number(month)]} ${year}`,
			...row
		};
	});
	const periodOrders = orders().filter((o) => o.status !== "cancelled" && inRange(o.orderDate));
	const productMap = /* @__PURE__ */ new Map();
	const customerMap = /* @__PURE__ */ new Map();
	for (const order of periodOrders) {
		const customer = customerMap.get(order.customerName) ?? {
			count: 0,
			value: 0
		};
		customer.count += 1;
		customer.value += order.total;
		customerMap.set(order.customerName, customer);
		for (const item of order.items) {
			const product = productMap.get(item.productName) ?? {
				count: 0,
				value: 0
			};
			product.count += item.quantity;
			product.value += item.quantity * item.price;
			productMap.set(item.productName, product);
		}
	}
	return {
		period: {
			from,
			to
		},
		totalIncome,
		totalExpense,
		netProfit,
		margin: totalIncome === 0 ? 0 : Math.round(netProfit / totalIncome * 1e3) / 10,
		ordersCount: periodOrders.length,
		ordersValue: periodOrders.reduce((sum, o) => sum + o.total, 0),
		purchasesValue: purchases().filter((p) => p.status !== "cancelled" && inRange(p.orderDate)).reduce((sum, p) => sum + p.total, 0),
		newCustomers: customers().filter((c) => inRange(c.createdDate)).length,
		byCategory,
		monthly,
		topProducts: toSortedGroups(productMap, 8),
		topCustomers: toSortedGroups(customerMap, 8)
	};
}
/** CRM: top mijozlar, mas'ul kesimi, konversiya va yaqin/muddati o'tgan bitimlar. */
function crmBreakdown() {
	const clientMap = /* @__PURE__ */ new Map();
	const assigneeMap = /* @__PURE__ */ new Map();
	for (const d of deals()) {
		const client = clientMap.get(d.clientName) ?? {
			count: 0,
			value: 0
		};
		client.count += 1;
		client.value += d.value;
		clientMap.set(d.clientName, client);
		const assignee = assigneeMap.get(d.assignedTo) ?? {
			count: 0,
			value: 0
		};
		assignee.count += 1;
		assignee.value += d.value;
		assigneeMap.set(d.assignedTo, assignee);
	}
	const won = deals().filter((d) => d.status === "closed_won");
	const lost = deals().filter((d) => d.status === "closed_lost");
	const closed = won.length + lost.length;
	const averageDealSize = deals().length === 0 ? 0 : Math.round(deals().reduce((sum, d) => sum + d.value, 0) / deals().length);
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const weekAhead = new Date(Date.now() + 10080 * 60 * 1e3).toISOString().split("T")[0];
	const isOpen = (d) => d.status !== "closed_won" && d.status !== "closed_lost";
	return {
		topClients: toSortedGroups(clientMap, 5),
		byAssignee: toSortedGroups(assigneeMap),
		conversionRate: closed === 0 ? 0 : Math.round(won.length / closed * 100),
		averageDealSize,
		closingSoon: deals().filter((d) => isOpen(d) && d.expectedCloseDate >= today && d.expectedCloseDate <= weekAhead).sort((a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate)),
		overdue: deals().filter((d) => isOpen(d) && d.expectedCloseDate < today).sort((a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate))
	};
}
/** Daromad solig'i stavkasi — TZ 7-bo'lim bo'yicha 12%. */
var INCOME_TAX_RATE = .12;
/** "YYYY-MM" davridagi ish (dam olishsiz) kunlari soni — dush–juma. */
function workingDaysInMonth(period) {
	const [year, month] = period.split("-").map(Number);
	if (!year || !month) return 0;
	const daysInMonth = new Date(year, month, 0).getDate();
	let count = 0;
	for (let day = 1; day <= daysInMonth; day++) {
		const weekday = new Date(year, month - 1, day).getDay();
		if (weekday !== 0 && weekday !== 6) count++;
	}
	return count;
}
/** Davr ichida xodim haqiqatan kelgan kunlar (kelgan/kechikkan/masofaviy). */
function presentDaysFor(employeeId, period) {
	const PRESENT = [
		"present",
		"late",
		"remote"
	];
	return attendance.filter((record) => record.employeeId === employeeId && record.date.startsWith(period) && PRESENT.includes(record.status)).length;
}
/**
* Bitta xodim uchun ish haqini hisoblaydi (yozib qo'ymaydi — faqat qiymatlar).
* netSalary = asosiy maosh − kelmagan kunlar ushlanmasi + bonus − jarima − soliq.
* Soliq soliqqa tortiladigan (ushlanma va jarimadan keyingi) summadan olinadi.
*/
function computePayroll(employee, period, options = {}) {
	const workingDays = workingDaysInMonth(period);
	const recorded = presentDaysFor(employee.id, period);
	const presentDays = attendance.some((r) => r.employeeId === employee.id && r.date.startsWith(period)) ? recorded : workingDays;
	const perDay = workingDays === 0 ? 0 : employee.salary / workingDays;
	const absentDays = Math.max(0, workingDays - presentDays);
	const absenceDeduction = Math.round(perDay * absentDays);
	const bonus = Math.max(0, Math.round(options.bonus ?? 0));
	const penalty = Math.max(0, Math.round(options.penalty ?? 0));
	const taxable = Math.max(0, employee.salary - absenceDeduction + bonus - penalty);
	const tax = Math.round(taxable * INCOME_TAX_RATE);
	const netSalary = taxable - tax;
	return {
		employeeId: employee.id,
		employeeName: employee.name,
		department: employee.department,
		period,
		baseSalary: employee.salary,
		workingDays,
		presentDays,
		absenceDeduction,
		bonus,
		penalty,
		tax,
		netSalary
	};
}
function payrollStats(period) {
	const rows = period ? payrolls().filter((p) => p.period === period) : payrolls();
	return {
		totalPayrolls: rows.length,
		totalNet: rows.reduce((sum, p) => sum + p.netSalary, 0),
		paidCount: rows.filter((p) => p.status === "paid").length,
		pendingCount: rows.filter((p) => p.status !== "paid").length
	};
}
//#endregion
//#region server/routes/dashboard.ts
var getDashboardStats = (_req, res) => {
	const response = {
		success: true,
		data: dashboardStats()
	};
	res.json(response);
};
/** Grafik uchun joriy oy bo'yicha kunlik kirim/chiqim. */
var getRevenueTrend = (_req, res) => {
	const response = {
		success: true,
		data: revenueTrend()
	};
	res.json(response);
};
var getRecentActivities = (req, res) => {
	const limit = z.coerce.number().int().min(1).max(50).catch(10).parse(req.query.limit);
	const response = {
		success: true,
		data: activities.slice(0, limit)
	};
	res.json(response);
};
/**
* Ogohlantirishlar statik emas — jonli ma'lumotdan hisoblanadi.
* Muammo bartaraf etilsa, ogohlantirish ro'yxatdan o'zi yo'qoladi.
*/
var getAlerts = (_req, res) => {
	const alerts = [];
	const lowStock = products$1.filter(isLowStock);
	if (lowStock.length > 0) alerts.push({
		id: "low-stock",
		type: "warning",
		title: "Tanqis mahsulotlar",
		description: `${lowStock.length} mahsulot minimal qoldiq chegarasidan past.`,
		actionText: "Omborni ochish",
		actionUrl: "/warehouse"
	});
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const overdue = deals$1.filter((d) => d.expectedCloseDate < today && d.status !== "closed_won" && d.status !== "closed_lost");
	if (overdue.length > 0) alerts.push({
		id: "overdue-deals",
		type: "warning",
		title: "Muddati o'tgan bitimlar",
		description: `${overdue.length} ta bitimning kutilayotgan yopilish sanasi o'tib ketdi.`,
		actionText: "Savdo bo'limiga o'tish",
		actionUrl: "/crm"
	});
	const weekAhead = new Date(Date.now() + 10080 * 60 * 1e3).toISOString().split("T")[0];
	const closingSoon = deals$1.filter((d) => d.expectedCloseDate >= today && d.expectedCloseDate <= weekAhead && (d.status === "proposal" || d.status === "negotiation"));
	if (closingSoon.length > 0) alerts.push({
		id: "closing-soon",
		type: "info",
		title: "Yopilish arafasidagi bitimlar",
		description: `${closingSoon.length} ta bitim shu hafta yopilishi kutilmoqda.`,
		actionText: "Bitimlarni ko'rish",
		actionUrl: "/crm"
	});
	const response = {
		success: true,
		data: alerts
	};
	res.json(response);
};
//#endregion
//#region server/lib/http.ts
/**
* Marshrut parametrini har doim yagona satr sifatida o'qiydi.
* `@types/express` 5.1+ da `req.params[...]` tipi `string | string[]` bo'ldi
* (takrorlanuvchi segmentlar uchun). Bizning yo'llarimizda parametr doim yagona,
* shuning uchun massiv kelsa birinchi elementni olamiz.
*/
function paramId(req, key = "id") {
	const value = req.params[key];
	return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
/** So'rov query'sidan sahifalash parametrlarini xavfsiz o'qiydi. */
var paginationSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	limit: z.coerce.number().int().min(1).max(100).catch(10),
	search: z.string().catch("")
});
/** Ro'yxatni sahifalarga bo'lib, standart javob shaklida qaytaradi. */
function paginate(list, page, limit) {
	const total = list.length;
	const pages = Math.max(1, Math.ceil(total / limit));
	const safePage = Math.min(page, pages);
	const offset = (safePage - 1) * limit;
	return {
		data: list.slice(offset, offset + limit),
		pagination: {
			page: safePage,
			limit,
			total,
			pages
		}
	};
}
/** Zod xatosini foydalanuvchi uchun o'qiladigan xabarga aylantiradi. */
function sendValidationError(res, error) {
	const message = error.issues.map((issue) => `${issue.path.join(".") || "maydon"}: ${issue.message}`).join("; ");
	res.status(400).json({
		success: false,
		message
	});
}
function sendNotFound(res, message) {
	res.status(404).json({
		success: false,
		message
	});
}
//#endregion
//#region server/routes/finance.ts
var transactionSchema = z.object({
	title: z.string().trim().min(1, "nomi kiritilishi shart"),
	category: z.string().trim().min(1).catch("Boshqa"),
	account: z.string().trim().min(1).catch("Asosiy hisob"),
	amount: z.coerce.number().positive("summa noldan katta bo'lishi kerak"),
	type: z.enum(["income", "expense"]),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak").optional()
});
var querySchema$11 = paginationSchema.extend({
	type: z.enum([
		"all",
		"income",
		"expense"
	]).catch("all"),
	category: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional()
});
var getFinanceStats = (_req, res) => {
	const response = {
		success: true,
		data: financeStats()
	};
	res.json(response);
};
/** Kategoriya bo'yicha kirim/chiqim va hisoblar balansi. */
var getFinanceBreakdown = (_req, res) => {
	res.json({
		success: true,
		data: financeBreakdown()
	});
};
/** Filtrlangan tranzaksiyalar — eksport va ro'yxat uchun umumiy. */
function filterTransactions(query) {
	const search = query.search.toLowerCase();
	return active(transactions$1).filter((t) => {
		if (search && !t.title.toLowerCase().includes(search) && !t.category.toLowerCase().includes(search) && !t.account.toLowerCase().includes(search)) return false;
		if (query.type !== "all" && t.type !== query.type) return false;
		if (query.category && t.category !== query.category) return false;
		if (query.from && t.date < query.from) return false;
		if (query.to && t.date > query.to) return false;
		return true;
	}).sort((a, b) => b.date.localeCompare(a.date));
}
var getTransactions = (req, res) => {
	const query = querySchema$11.parse(req.query);
	res.json(paginate(filterTransactions(query), query.page, query.limit));
};
/** Mavjud tranzaksiyalardagi kategoriyalar — filtr ro'yxatini to'ldirish uchun. */
var getTransactionCategories = (_req, res) => {
	const categories = [...new Set(transactions$1.map((t) => t.category))].sort();
	res.json({
		success: true,
		data: categories
	});
};
/** Filtrga mos tranzaksiyalarni CSV holida yuklab beradi. */
var exportTransactions = (req, res) => {
	const rows = filterTransactions(querySchema$11.parse(req.query));
	const escape = (value) => {
		return `"${String(value).replace(/"/g, "\"\"")}"`;
	};
	const csv = [[
		"Sana",
		"Nomi",
		"Kategoriya",
		"Hisob",
		"Turi",
		"Summa"
	].map(escape).join(","), ...rows.map((t) => [
		t.date,
		t.title,
		t.category,
		t.account,
		t.type === "income" ? "Kirim" : "Chiqim",
		t.amount
	].map(escape).join(","))].join("\r\n");
	const filename = `tranzaksiyalar-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
	res.setHeader("Content-Type", "text/csv; charset=utf-8");
	res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
	res.send("﻿" + csv);
};
var createTransaction = (req, res) => {
	const parsed = transactionSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const newTransaction = {
		id: nextId(),
		title: parsed.data.title,
		category: parsed.data.category,
		account: parsed.data.account,
		date: parsed.data.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		amount: parsed.data.amount,
		type: parsed.data.type
	};
	transactions$1.unshift(newTransaction);
	logActivity({
		action: parsed.data.type === "income" ? "Kirim tranzaksiyasi qo'shildi" : "Xarajat tranzaksiyasi qo'shildi",
		details: `${newTransaction.title} · ${newTransaction.amount.toLocaleString("uz-UZ")} so'm`,
		icon: parsed.data.type === "income" ? "ArrowUpRight" : "ArrowDownRight"
	});
	const response = {
		success: true,
		data: newTransaction,
		message: "Tranzaksiya muvaffaqiyatli yaratildi"
	};
	res.status(201).json(response);
};
var updateTransaction = (req, res) => {
	const parsed = transactionSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const transaction = transactions$1.find((t) => t.id === req.params.id && !t.deletedAt);
	if (!transaction) return sendNotFound(res, "Tranzaksiya topilmadi");
	Object.assign(transaction, parsed.data);
	logActivity({
		action: "Tranzaksiya tahrirlandi",
		details: transaction.title,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: transaction,
		message: "Tranzaksiya yangilandi"
	};
	res.json(response);
};
var deleteTransaction = (req, res) => {
	const removed = softRemove(transactions$1, paramId(req));
	if (!removed) return sendNotFound(res, "Tranzaksiya topilmadi");
	logActivity({
		action: "Tranzaksiya o'chirildi",
		details: removed.title,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Tranzaksiya o'chirildi"
	});
};
//#endregion
//#region server/routes/hr.ts
var employeeSchema = z.object({
	name: z.string().trim().min(1, "F.I.Sh. kiritilishi shart"),
	position: z.string().trim().min(1, "lavozim kiritilishi shart"),
	department: z.string().trim().min(1).catch("Boshqa"),
	salary: z.coerce.number().min(0, "maosh manfiy bo'lishi mumkin emas").catch(0),
	email: z.string().trim().email("email formati noto'g'ri"),
	phone: z.string().trim().catch(""),
	status: z.enum([
		"active",
		"vacation",
		"sick_leave"
	]).optional()
});
var querySchema$10 = paginationSchema.extend({
	department: z.string().optional(),
	status: z.enum([
		"active",
		"vacation",
		"sick_leave"
	]).optional().catch(void 0)
});
var getHRStats = (_req, res) => {
	const response = {
		success: true,
		data: hrStats()
	};
	res.json(response);
};
/** Bo'lim bo'yicha xodim soni, maosh fondi va o'rtacha maosh. */
var getHRBreakdown = (_req, res) => {
	res.json({
		success: true,
		data: hrBreakdown()
	});
};
var getEmployees = (req, res) => {
	const query = querySchema$10.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(employees$1).filter((e) => {
		if (search && !e.name.toLowerCase().includes(search) && !e.position.toLowerCase().includes(search) && !e.department.toLowerCase().includes(search) && !e.email.toLowerCase().includes(search)) return false;
		if (query.department && e.department !== query.department) return false;
		if (query.status && e.status !== query.status) return false;
		return true;
	});
	res.json(paginate(filtered, query.page, query.limit));
};
/** Mavjud bo'limlar ro'yxati — filtr uchun. */
var getDepartments = (_req, res) => {
	const departments = [...new Set(employees$1.map((e) => e.department))].sort();
	res.json({
		success: true,
		data: departments
	});
};
var createEmployee = (req, res) => {
	const parsed = employeeSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	if (active(employees$1).some((e) => e.email.toLowerCase() === parsed.data.email.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu email bilan xodim allaqachon mavjud"
	});
	const newEmployee = {
		id: nextId(),
		name: parsed.data.name,
		position: parsed.data.position,
		department: parsed.data.department,
		status: parsed.data.status ?? "active",
		salary: parsed.data.salary,
		hireDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		email: parsed.data.email,
		phone: parsed.data.phone
	};
	employees$1.unshift(newEmployee);
	logActivity({
		action: "Yangi xodim qo'shildi",
		details: `${newEmployee.name} · ${newEmployee.position}`,
		icon: "UserPlus"
	});
	const response = {
		success: true,
		data: newEmployee,
		message: "Xodim muvaffaqiyatli qo'shildi"
	};
	res.status(201).json(response);
};
var updateEmployee = (req, res) => {
	const parsed = employeeSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const employee = employees$1.find((e) => e.id === req.params.id && !e.deletedAt);
	if (!employee) return sendNotFound(res, "Xodim topilmadi");
	if (parsed.data.email && active(employees$1).some((e) => e.id !== employee.id && e.email.toLowerCase() === parsed.data.email.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu email boshqa xodimga biriktirilgan"
	});
	Object.assign(employee, parsed.data);
	logActivity({
		action: "Xodim ma'lumotlari yangilandi",
		details: employee.name,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: employee,
		message: "Xodim ma'lumotlari yangilandi"
	};
	res.json(response);
};
var deleteEmployee = (req, res) => {
	const removed = softRemove(employees$1, paramId(req));
	if (!removed) return sendNotFound(res, "Xodim topilmadi");
	logActivity({
		action: "Xodim o'chirildi",
		details: removed.name,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Xodim o'chirildi"
	});
};
//#endregion
//#region server/routes/warehouse.ts
var productSchema = z.object({
	name: z.string().trim().min(1, "mahsulot nomi kiritilishi shart"),
	location: z.string().trim().min(1).catch("Asosiy ombor"),
	quantity: z.coerce.number().int().min(0, "qoldiq manfiy bo'lishi mumkin emas"),
	minQuantity: z.coerce.number().int().min(0).catch(10),
	price: z.coerce.number().positive("narx noldan katta bo'lishi kerak"),
	category: z.string().trim().min(1).catch("Boshqa"),
	supplier: z.string().trim().min(1).catch("Noma'lum")
});
var querySchema$9 = paginationSchema.extend({
	category: z.string().optional(),
	location: z.string().optional(),
	lowStockOnly: z.string().transform((value) => value === "true").catch(false)
});
var getWarehouseStats = (_req, res) => {
	const response = {
		success: true,
		data: warehouseStats()
	};
	res.json(response);
};
/** Kategoriya/joy bo'yicha qiymat, top ta'minotchilar va tanqis mahsulotlar. */
var getWarehouseBreakdown = (_req, res) => {
	res.json({
		success: true,
		data: warehouseBreakdown()
	});
};
var getProducts = (req, res) => {
	const query = querySchema$9.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(products$1).filter((p) => {
		if (search && !p.name.toLowerCase().includes(search) && !p.category.toLowerCase().includes(search) && !p.supplier.toLowerCase().includes(search)) return false;
		if (query.category && p.category !== query.category) return false;
		if (query.location && p.location !== query.location) return false;
		if (query.lowStockOnly && !isLowStock(p)) return false;
		return true;
	});
	res.json(paginate(filtered, query.page, query.limit));
};
/** Kategoriya va ombor joylari — filtr ro'yxatlari uchun. */
var getProductFilters = (_req, res) => {
	res.json({
		success: true,
		data: {
			categories: [...new Set(products$1.map((p) => p.category))].sort(),
			locations: [...new Set(products$1.map((p) => p.location))].sort()
		}
	});
};
var createProduct = (req, res) => {
	const parsed = productSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const newProduct = {
		id: nextId(),
		name: parsed.data.name,
		location: parsed.data.location,
		quantity: parsed.data.quantity,
		minQuantity: parsed.data.minQuantity,
		price: parsed.data.price,
		category: parsed.data.category,
		supplier: parsed.data.supplier
	};
	products$1.unshift(newProduct);
	logActivity({
		action: "Yangi mahsulot qo'shildi",
		details: `${newProduct.name} · ${newProduct.quantity} dona`,
		icon: "PackagePlus"
	});
	const response = {
		success: true,
		data: newProduct,
		message: "Mahsulot muvaffaqiyatli qo'shildi"
	};
	res.status(201).json(response);
};
var updateProduct = (req, res) => {
	const parsed = productSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const product = products$1.find((p) => p.id === paramId(req) && !p.deletedAt);
	if (!product) return sendNotFound(res, "Mahsulot topilmadi");
	const wasLow = isLowStock(product);
	Object.assign(product, parsed.data);
	if (!wasLow && isLowStock(product)) logActivity({
		action: "Mahsulot qoldig'i tanqis darajaga tushdi",
		details: `${product.name} · ${product.quantity} dona`,
		icon: "PackageMinus"
	});
	else logActivity({
		action: "Mahsulot ma'lumotlari yangilandi",
		details: product.name,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: product,
		message: "Mahsulot ma'lumotlari yangilandi"
	};
	res.json(response);
};
var deleteProduct = (req, res) => {
	const removed = softRemove(products$1, paramId(req));
	if (!removed) return sendNotFound(res, "Mahsulot topilmadi");
	logActivity({
		action: "Mahsulot o'chirildi",
		details: removed.name,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Mahsulot o'chirildi"
	});
};
var movementQuerySchema = paginationSchema.extend({
	productId: z.string().optional(),
	type: z.enum([
		"in",
		"out",
		"adjustment"
	]).optional().catch(void 0)
});
/** Ombor harakatlari jurnali — qoldiq nega o'zgargani tarixi. */
var getStockMovements = (req, res) => {
	const query = movementQuerySchema.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = movements.filter((m) => {
		if (search && !m.productName.toLowerCase().includes(search) && !m.reason.toLowerCase().includes(search) && !m.reference.toLowerCase().includes(search)) return false;
		if (query.productId && m.productId !== query.productId) return false;
		if (query.type && m.type !== query.type) return false;
		return true;
	});
	res.json(paginate(filtered, query.page, query.limit));
};
var adjustSchema = z.object({
	delta: z.coerce.number().int().refine((value) => value !== 0, "o'zgarish nolga teng bo'lmasligi kerak"),
	reason: z.string().trim().min(1, "sabab kiritilishi shart")
});
/** Qo'lda qoldiq tuzatish (inventarizatsiya, yaroqsizga chiqarish va h.k.). */
var adjustStock = (req, res) => {
	const parsed = adjustSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const product = products$1.find((p) => p.id === paramId(req) && !p.deletedAt);
	if (!product) return sendNotFound(res, "Mahsulot topilmadi");
	if (product.quantity + parsed.data.delta < 0) return res.status(409).json({
		success: false,
		message: `Omborda ${product.quantity} dona bor — bundan ko'pini chiqarib bo'lmaydi`
	});
	const movement = applyStockChange(product, parsed.data.delta, {
		reason: parsed.data.reason,
		reference: "Qo'lda tuzatish",
		type: "adjustment"
	});
	logActivity({
		action: "Qoldiq qo'lda tuzatildi",
		details: `${product.name} · ${parsed.data.delta > 0 ? "+" : ""}${parsed.data.delta} dona`,
		icon: parsed.data.delta > 0 ? "PackagePlus" : "PackageMinus"
	});
	const response = {
		success: true,
		data: movement,
		message: "Qoldiq yangilandi"
	};
	res.json(response);
};
/**
* Tanqis mahsulotlar uchun xarid buyurtmasi — qoldiqni minimal darajaning ikki barobariga
* to'ldiradi. "Buyurtma berish" tugmasi shu endpointni chaqiradi.
*/
var restockLowProducts = (_req, res) => {
	const low = active(products$1).filter(isLowStock);
	low.forEach((product) => {
		applyStockChange(product, Math.max(product.minQuantity * 2, 1) - product.quantity, {
			reason: "Xarid buyurtmasi bo'yicha to'ldirish",
			reference: "Avtomatik xarid",
			type: "in"
		});
	});
	if (low.length > 0) logActivity({
		action: "Xarid buyurtmasi yaratildi",
		details: `${low.length} ta tanqis mahsulot to'ldirildi`,
		icon: "PackagePlus"
	});
	res.json({
		success: true,
		data: low,
		message: low.length === 0 ? "Tanqis mahsulot yo'q" : `${low.length} ta mahsulot qoldig'i to'ldirildi`
	});
};
//#endregion
//#region server/routes/customers.ts
var customerSchema = z.object({
	name: z.string().trim().min(1, "mijoz nomi kiritilishi shart"),
	type: z.enum(["company", "individual"]).catch("company"),
	contactPerson: z.string().trim().catch(""),
	phone: z.string().trim().catch(""),
	email: z.string().trim().email("email formati noto'g'ri").or(z.literal("")).catch(""),
	region: z.string().trim().catch(""),
	address: z.string().trim().catch(""),
	note: z.string().trim().catch(""),
	status: z.enum(["active", "inactive"]).optional()
});
var querySchema$8 = paginationSchema.extend({
	type: z.enum(["company", "individual"]).optional().catch(void 0),
	region: z.string().optional(),
	status: z.enum(["active", "inactive"]).optional().catch(void 0)
});
var getCustomerStats = (_req, res) => {
	const response = {
		success: true,
		data: customerStats()
	};
	res.json(response);
};
var getCustomers = (req, res) => {
	const query = querySchema$8.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(customers$1).filter((c) => {
		if (search && !c.name.toLowerCase().includes(search) && !c.contactPerson.toLowerCase().includes(search) && !c.email.toLowerCase().includes(search) && !c.phone.includes(search)) return false;
		if (query.type && c.type !== query.type) return false;
		if (query.region && c.region !== query.region) return false;
		if (query.status && c.status !== query.status) return false;
		return true;
	});
	res.json(paginate(filtered, query.page, query.limit));
};
/** Filtr ro'yxatlari uchun mavjud hududlar. */
var getCustomerRegions = (_req, res) => {
	const regions = [...new Set(customers$1.map((c) => c.region).filter(Boolean))].sort();
	res.json({
		success: true,
		data: regions
	});
};
/** Bitta mijoz + unga bog'liq buyurtma va bitimlar tarixi. */
var getCustomerDetail = (req, res) => {
	const customer = customers$1.find((c) => c.id === req.params.id && !c.deletedAt);
	if (!customer) return sendNotFound(res, "Mijoz topilmadi");
	const customerOrders = active(orders$1).filter((o) => o.customerId === customer.id).sort((a, b) => b.orderDate.localeCompare(a.orderDate));
	res.json({
		success: true,
		data: {
			customer,
			orders: customerOrders,
			deals: active(deals$1).filter((d) => d.clientName === customer.name),
			totalSpent: customerOrders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0)
		}
	});
};
var createCustomer = (req, res) => {
	const parsed = customerSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	if (active(customers$1).some((c) => c.name.toLowerCase() === parsed.data.name.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu nom bilan mijoz allaqachon mavjud"
	});
	const newCustomer = {
		id: nextId(),
		name: parsed.data.name,
		type: parsed.data.type,
		contactPerson: parsed.data.contactPerson,
		phone: parsed.data.phone,
		email: parsed.data.email,
		region: parsed.data.region,
		address: parsed.data.address,
		status: parsed.data.status ?? "active",
		createdDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		note: parsed.data.note
	};
	customers$1.unshift(newCustomer);
	logActivity({
		action: "Yangi mijoz qo'shildi",
		details: newCustomer.name,
		icon: "UserPlus"
	});
	const response = {
		success: true,
		data: newCustomer,
		message: "Mijoz muvaffaqiyatli qo'shildi"
	};
	res.status(201).json(response);
};
var updateCustomer = (req, res) => {
	const parsed = customerSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const customer = customers$1.find((c) => c.id === req.params.id && !c.deletedAt);
	if (!customer) return sendNotFound(res, "Mijoz topilmadi");
	const previousName = customer.name;
	Object.assign(customer, parsed.data);
	if (parsed.data.name && parsed.data.name !== previousName) {
		orders$1.filter((o) => o.customerId === customer.id).forEach((o) => {
			o.customerName = customer.name;
		});
		deals$1.filter((d) => d.clientName === previousName).forEach((d) => {
			d.clientName = customer.name;
		});
	}
	logActivity({
		action: "Mijoz ma'lumotlari yangilandi",
		details: customer.name,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: customer,
		message: "Mijoz ma'lumotlari yangilandi"
	};
	res.json(response);
};
var deleteCustomer = (req, res) => {
	const customer = customers$1.find((c) => c.id === req.params.id && !c.deletedAt);
	if (!customer) return sendNotFound(res, "Mijoz topilmadi");
	const linkedOrders = active(orders$1).filter((o) => o.customerId === customer.id).length;
	if (linkedOrders > 0) return res.status(409).json({
		success: false,
		message: `Bu mijozda ${linkedOrders} ta buyurtma bor. Avval buyurtmalarni o'chiring yoki mijozni arxivga o'tkazing.`
	});
	softRemove(customers$1, customer.id);
	logActivity({
		action: "Mijoz o'chirildi",
		details: customer.name,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Mijoz o'chirildi"
	});
};
//#endregion
//#region server/routes/suppliers.ts
var supplierSchema = z.object({
	name: z.string().trim().min(1, "ta'minotchi nomi kiritilishi shart"),
	contactPerson: z.string().trim().catch(""),
	phone: z.string().trim().catch(""),
	email: z.string().trim().email("email formati noto'g'ri").or(z.literal("")).catch(""),
	category: z.string().trim().min(1).catch("Boshqa"),
	address: z.string().trim().catch(""),
	rating: z.coerce.number().min(1).max(5).catch(3),
	status: z.enum(["active", "inactive"]).optional()
});
var querySchema$7 = paginationSchema.extend({
	category: z.string().optional(),
	status: z.enum(["active", "inactive"]).optional().catch(void 0)
});
var getSupplierStats = (_req, res) => {
	const response = {
		success: true,
		data: supplierStats()
	};
	res.json(response);
};
var getSuppliers = (req, res) => {
	const query = querySchema$7.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(suppliers$1).filter((s) => {
		if (search && !s.name.toLowerCase().includes(search) && !s.contactPerson.toLowerCase().includes(search) && !s.category.toLowerCase().includes(search) && !s.email.toLowerCase().includes(search)) return false;
		if (query.category && s.category !== query.category) return false;
		if (query.status && s.status !== query.status) return false;
		return true;
	});
	res.json(paginate(filtered, query.page, query.limit));
};
var getSupplierCategories = (_req, res) => {
	const categories = [...new Set(suppliers$1.map((s) => s.category))].sort();
	res.json({
		success: true,
		data: categories
	});
};
/** Bitta ta'minotchi + u yetkazadigan mahsulotlar. */
var getSupplierDetail = (req, res) => {
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const supplied = active(products$1).filter((p) => p.supplier === supplier.name);
	res.json({
		success: true,
		data: {
			supplier,
			products: supplied,
			totalValue: supplied.reduce((sum, p) => sum + p.price * p.quantity, 0)
		}
	});
};
var createSupplier = (req, res) => {
	const parsed = supplierSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	if (active(suppliers$1).some((s) => s.name.toLowerCase() === parsed.data.name.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu nom bilan ta'minotchi allaqachon mavjud"
	});
	const newSupplier = {
		id: nextId(),
		name: parsed.data.name,
		contactPerson: parsed.data.contactPerson,
		phone: parsed.data.phone,
		email: parsed.data.email,
		category: parsed.data.category,
		address: parsed.data.address,
		status: parsed.data.status ?? "active",
		rating: parsed.data.rating,
		createdDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
	};
	suppliers$1.unshift(newSupplier);
	logActivity({
		action: "Yangi ta'minotchi qo'shildi",
		details: newSupplier.name,
		icon: "PackagePlus"
	});
	const response = {
		success: true,
		data: newSupplier,
		message: "Ta'minotchi muvaffaqiyatli qo'shildi"
	};
	res.status(201).json(response);
};
var updateSupplier = (req, res) => {
	const parsed = supplierSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const previousName = supplier.name;
	Object.assign(supplier, parsed.data);
	if (parsed.data.name && parsed.data.name !== previousName) products$1.filter((p) => p.supplier === previousName).forEach((p) => {
		p.supplier = supplier.name;
	});
	logActivity({
		action: "Ta'minotchi ma'lumotlari yangilandi",
		details: supplier.name,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: supplier,
		message: "Ta'minotchi ma'lumotlari yangilandi"
	};
	res.json(response);
};
var restoreSupplier = (req, res) => {
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	if (supplier.status === "active") return res.status(400).json({
		success: false,
		message: "Ta'minotchi allaqachon faol holatda"
	});
	supplier.status = "active";
	logActivity({
		action: "Ta'minotchi faollashtirildi",
		details: supplier.name,
		icon: "RotateCcw"
	});
	const response = {
		success: true,
		data: supplier,
		message: "Ta'minotchi muvaffaqiyatli faollashtirildi"
	};
	res.json(response);
};
var deleteSupplier = (req, res) => {
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const linked = active(products$1).filter((p) => p.supplier === supplier.name).length;
	if (linked > 0) return res.status(409).json({
		success: false,
		message: `Bu ta'minotchiga ${linked} ta mahsulot bog'langan. Avval ularni boshqa ta'minotchiga o'tkazing.`
	});
	softRemove(suppliers$1, supplier.id);
	logActivity({
		action: "Ta'minotchi o'chirildi",
		details: supplier.name,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Ta'minotchi o'chirildi"
	});
};
/** Ta'minotchining xaridlar tarixi */
var getSupplierPurchases = (req, res) => {
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const purchasesWithDetails = active(purchases$1).filter((p) => p.supplierId === supplier.id || p.supplierName === supplier.name).map((purchase) => ({
		...purchase,
		products: purchase.items
	}));
	res.json({
		success: true,
		data: purchasesWithDetails
	});
};
/** Ta'minotchi yetkazgan mahsulotlar ro'yxati */
var getSupplierProducts = (req, res) => {
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const productsWithDetails = active(products$1).filter((p) => p.supplier === supplier.name).map((product) => ({
		...product,
		sku: `${product.category.substring(0, 3).toUpperCase()}-${product.id}`,
		lastDeliveryDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
	}));
	res.json({
		success: true,
		data: productsWithDetails
	});
};
/** Ta'minotchiga qaytarilgan mahsulotlar tarixi */
var getSupplierReturns = (req, res) => {
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const returns = supplierReturns.filter((r) => r.supplierId === supplier.id);
	res.json({
		success: true,
		data: returns
	});
};
/** Ta'minotchi bilan moliyaviy hisob-kitoblar */
var getSupplierFinancial = (req, res) => {
	const supplier = suppliers$1.find((s) => s.id === req.params.id && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const supplierPurchases = active(purchases$1).filter((p) => p.supplierId === supplier.id || p.supplierName === supplier.name);
	let totalPurchases = 0;
	let totalPaid = 0;
	const financialHistory = [];
	supplierPurchases.forEach((purchase) => {
		totalPurchases += purchase.total;
		if (purchase.paymentStatus === "paid") {
			totalPaid += purchase.total;
			financialHistory.push({
				id: `PAY-${purchase.id}`,
				date: purchase.orderDate,
				type: "payment",
				description: `To'lov - ${purchase.purchaseNumber}`,
				amount: purchase.total,
				balance: totalPaid - totalPurchases
			});
		} else if (purchase.paymentStatus === "partial") {
			const partialAmount = purchase.total * .5;
			totalPaid += partialAmount;
			financialHistory.push({
				id: `PAY-${purchase.id}`,
				date: purchase.orderDate,
				type: "payment",
				description: `Qisman to'lov - ${purchase.purchaseNumber}`,
				amount: partialAmount,
				balance: totalPaid - totalPurchases
			});
		} else financialHistory.push({
			id: `DEBT-${purchase.id}`,
			date: purchase.orderDate,
			type: "debt",
			description: `Qarz - ${purchase.purchaseNumber}`,
			amount: purchase.total,
			balance: totalPaid - totalPurchases
		});
	});
	const currentDebt = totalPurchases - totalPaid;
	const lastPaymentDate = financialHistory.filter((f) => f.type === "payment").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null;
	res.json({
		success: true,
		data: {
			summary: {
				totalPurchases,
				totalPaid,
				currentDebt,
				lastPaymentDate
			},
			history: financialHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		}
	});
};
/** Ta'minotchi statistikasi (KPI) - bitta ta'minotchi uchun */
var getSupplierKPI = (req, res) => {
	const supplierId = req.params.id;
	const supplier = suppliers$1.find((s) => s.id === supplierId && !s.deletedAt);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const supplierPurchases = active(purchases$1).filter((p) => p.supplierId === supplier.id || p.supplierName === supplier.name);
	const totalPurchases = supplierPurchases.reduce((sum, p) => sum + p.total, 0);
	const ordersCount = supplierPurchases.length;
	res.json({
		success: true,
		data: {
			totalPurchases,
			ordersCount,
			avgRating: supplier.rating,
			returnsCount: 0
		}
	});
};
/** Ta'minotchiga mahsulot qaytarish */
var returnProductSchema = z.object({
	productId: z.string().min(1, "Mahsulot ID kiritilishi shart"),
	quantity: z.coerce.number().min(1, "Miqdor kamida 1 bo'lishi kerak"),
	reason: z.enum([
		"defective",
		"wrong_item",
		"damaged",
		"quality",
		"expired",
		"other"
	]),
	note: z.string().trim().catch("")
});
var returnProductToSupplier = (req, res) => {
	const supplierId = req.params.id;
	console.log("🔍 [Backend] returnProductToSupplier START:", {
		supplierId,
		body: req.body,
		bodyType: typeof req.body
	});
	const supplier = suppliers$1.find((s) => s.id === supplierId && !s.deletedAt);
	if (!supplier) {
		console.error("❌ [Backend] Supplier not found:", supplierId);
		return sendNotFound(res, "Ta'minotchi topilmadi");
	}
	const parsed = returnProductSchema.safeParse(req.body);
	if (!parsed.success) {
		console.error("❌ [Backend] Validation failed:", parsed.error);
		return sendValidationError(res, parsed.error);
	}
	const { productId, quantity, reason, note } = parsed.data;
	console.log("✅ [Backend] Parsed data:", {
		productId,
		quantity,
		quantityType: typeof quantity,
		reason,
		note
	});
	const product = products$1.find((p) => p.id === productId && !p.deletedAt);
	if (!product) {
		console.error("❌ [Backend] Product not found:", productId);
		return sendNotFound(res, "Mahsulot topilmadi");
	}
	console.log("📦 [Backend] Product found:", {
		productId: product.id,
		productName: product.name,
		currentQuantity: product.quantity,
		quantityType: typeof product.quantity,
		returningQuantity: quantity
	});
	if (product.quantity < quantity) {
		console.error("❌ [Backend] Insufficient stock:", {
			available: product.quantity,
			requested: quantity
		});
		return res.status(400).json({
			success: false,
			message: `Omborda faqat ${product.quantity} ta mahsulot mavjud`
		});
	}
	const returnNumber = `RET-${nextId()}`;
	const returnRecord = {
		id: nextId(),
		returnNumber,
		supplierId,
		supplierName: supplier.name,
		productId,
		productName: product.name,
		quantity,
		reason,
		reasonText: note,
		amount: product.price * quantity,
		status: "pending",
		returnDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		purchaseNumber: "AUTO",
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	supplierReturns.unshift(returnRecord);
	console.log("💾 [Backend] Return record saved:", returnNumber);
	const oldQuantity = product.quantity;
	product.quantity -= quantity;
	const newQuantity = product.quantity;
	console.log("✅ [Backend] Product quantity updated:", {
		productId: product.id,
		oldQuantity,
		returningQuantity: quantity,
		newQuantity,
		calculation: `${oldQuantity} - ${quantity} = ${newQuantity}`
	});
	console.log("✅ [Backend] returnProductToSupplier COMPLETE");
	res.json({
		success: true,
		data: returnRecord,
		message: "Mahsulot muvaffaqiyatli qaytarildi"
	});
};
//#endregion
//#region server/routes/branches.ts
var branchSchema = z.object({
	name: z.string().trim().min(1, "filial nomi kiritilishi shart"),
	type: z.enum(["head_office", "branch"]).catch("branch"),
	region: z.string().trim().catch(""),
	address: z.string().trim().catch(""),
	phone: z.string().trim().catch(""),
	manager: z.string().trim().catch(""),
	note: z.string().trim().catch(""),
	status: z.enum(["active", "inactive"]).optional()
});
var querySchema$6 = paginationSchema.extend({
	type: z.enum(["head_office", "branch"]).optional().catch(void 0),
	region: z.string().optional(),
	status: z.enum(["active", "inactive"]).optional().catch(void 0)
});
var getBranchStats = (_req, res) => {
	const list = active(branches);
	const response = {
		success: true,
		data: {
			totalBranches: list.length,
			activeBranches: list.filter((b) => b.status === "active").length,
			regions: new Set(list.map((b) => b.region).filter(Boolean)).size
		}
	};
	res.json(response);
};
var getBranches = (req, res) => {
	const query = querySchema$6.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(branches).filter((b) => {
		if (search && !b.name.toLowerCase().includes(search) && !b.manager.toLowerCase().includes(search) && !b.region.toLowerCase().includes(search) && !b.phone.includes(search)) return false;
		if (query.type && b.type !== query.type) return false;
		if (query.region && b.region !== query.region) return false;
		if (query.status && b.status !== query.status) return false;
		return true;
	});
	filtered.sort((a, b) => {
		if (a.type !== b.type) return a.type === "head_office" ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
	res.json(paginate(filtered, query.page, query.limit));
};
var createBranch = (req, res) => {
	const parsed = branchSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	if (active(branches).some((b) => b.name.toLowerCase() === parsed.data.name.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu nom bilan filial allaqachon mavjud"
	});
	const type = parsed.data.type === "head_office" && active(branches).some((b) => b.type === "head_office") ? "branch" : parsed.data.type;
	const newBranch = {
		id: nextId(),
		name: parsed.data.name,
		type,
		region: parsed.data.region,
		address: parsed.data.address,
		phone: parsed.data.phone,
		manager: parsed.data.manager,
		status: parsed.data.status ?? "active",
		createdDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		note: parsed.data.note
	};
	branches.unshift(newBranch);
	logActivity({
		action: "Yangi filial qo'shildi",
		details: newBranch.name,
		icon: "Building2"
	});
	const response = {
		success: true,
		data: newBranch,
		message: "Filial muvaffaqiyatli qo'shildi"
	};
	res.status(201).json(response);
};
var updateBranch = (req, res) => {
	const parsed = branchSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const branch = branches.find((b) => b.id === req.params.id && !b.deletedAt);
	if (!branch) return sendNotFound(res, "Filial topilmadi");
	if (parsed.data.type === "head_office" && branch.type !== "head_office" && active(branches).some((b) => b.type === "head_office")) return res.status(409).json({
		success: false,
		message: "Bosh ofis allaqachon mavjud"
	});
	Object.assign(branch, parsed.data);
	logActivity({
		action: "Filial ma'lumotlari yangilandi",
		details: branch.name,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: branch,
		message: "Filial ma'lumotlari yangilandi"
	};
	res.json(response);
};
var deleteBranch = (req, res) => {
	const branch = branches.find((b) => b.id === req.params.id && !b.deletedAt);
	if (!branch) return sendNotFound(res, "Filial topilmadi");
	if (branch.type === "head_office") return res.status(409).json({
		success: false,
		message: "Bosh ofisni o'chirib bo'lmaydi"
	});
	softRemove(branches, branch.id);
	logActivity({
		action: "Filial o'chirildi",
		details: branch.name,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Filial o'chirildi"
	});
};
//#endregion
//#region server/routes/orders.ts
var ORDER_STATUSES = [
	"draft",
	"confirmed",
	"shipped",
	"delivered",
	"cancelled"
];
var PAYMENT_STATUSES$1 = [
	"unpaid",
	"partial",
	"paid"
];
/**
* Shu bosqichlarda tovar ombordan ajratilgan hisoblanadi.
* Qoralama va bekor qilingan buyurtma qoldiqqa ta'sir qilmaydi.
*/
var STOCK_COMMITTED = [
	"confirmed",
	"shipped",
	"delivered"
];
var isCommitted = (status) => STOCK_COMMITTED.includes(status);
var orderSchema = z.object({
	customerId: z.string().trim().min(1, "mijoz tanlanishi shart"),
	items: z.array(z.object({
		productId: z.string().trim().min(1),
		quantity: z.coerce.number().int().positive("miqdor noldan katta bo'lishi kerak"),
		price: z.coerce.number().min(0).optional()
	})).min(1, "kamida bitta mahsulot qo'shilishi kerak"),
	deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
	assignedTo: z.string().trim().min(1, "mas'ul xodim tanlanishi shart"),
	note: z.string().trim().catch(""),
	status: z.enum(ORDER_STATUSES).optional(),
	paymentStatus: z.enum(PAYMENT_STATUSES$1).optional()
});
var querySchema$5 = paginationSchema.extend({
	status: z.enum(ORDER_STATUSES).optional().catch(void 0),
	paymentStatus: z.enum(PAYMENT_STATUSES$1).optional().catch(void 0),
	customerId: z.string().optional()
});
/** Keyingi bo'sh buyurtma raqami — mavjud eng kattasidan bittaga ko'p. */
function nextOrderNumber() {
	return `ORD-${orders$1.reduce((highest, order) => {
		const parsed = Number(order.orderNumber.replace(/\D/g, ""));
		return Number.isFinite(parsed) && parsed > highest ? parsed : highest;
	}, 1e3) + 1}`;
}
/**
* So'rovdagi qatorlarni tekshiradi va narx suratini oladi.
* Narx berilmasa mahsulotning joriy narxi qo'yiladi.
*/
function buildItems$1(rows) {
	const items = [];
	for (const row of rows) {
		const product = products$1.find((p) => p.id === row.productId);
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
			price: row.price ?? product.price
		});
	}
	return { items };
}
function orderTotal(items) {
	return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}
/** Qatorlar bo'yicha omborda yetarli qoldiq bor-yo'qligini tekshiradi. */
function findInsufficientStock(items) {
	for (const item of items) {
		const product = products$1.find((p) => p.id === item.productId);
		if (!product) return `Mahsulot topilmadi: ${item.productName}`;
		if (product.quantity < item.quantity) return `${product.name}: omborda ${product.quantity} dona bor, ${item.quantity} dona so'ralmoqda`;
	}
	return null;
}
/** Buyurtma qatorlari bo'yicha qoldiqni kamaytiradi va harakatlarni yozadi. */
function commitStock(order) {
	for (const item of order.items) {
		const product = products$1.find((p) => p.id === item.productId);
		if (!product) continue;
		applyStockChange(product, -item.quantity, {
			reason: "Buyurtma bo'yicha chiqim",
			reference: order.orderNumber,
			type: "out"
		});
	}
}
/** Bekor qilingan yoki qoralamaga qaytarilgan buyurtma qoldig'ini tiklaydi. */
function releaseStock(order) {
	for (const item of order.items) {
		const product = products$1.find((p) => p.id === item.productId);
		if (!product) continue;
		applyStockChange(product, item.quantity, {
			reason: "Buyurtma bekor qilindi",
			reference: order.orderNumber,
			type: "in"
		});
	}
}
/** To'liq to'langan buyurtma uchun moliyaga daromad yozuvi qo'shadi. */
function recordRevenue(order) {
	transactions$1.unshift({
		id: nextId(),
		title: `${order.customerName} · ${order.orderNumber}`,
		category: "Savdo daromadi",
		account: "Ipak Yo'li bank · UZS",
		date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		amount: order.total,
		type: "income"
	});
}
var getOrderStats = (_req, res) => {
	const response = {
		success: true,
		data: orderStats()
	};
	res.json(response);
};
var getOrderBreakdown = (_req, res) => {
	const response = {
		success: true,
		data: orderBreakdown()
	};
	res.json(response);
};
var getOrders = (req, res) => {
	const query = querySchema$5.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(orders$1).filter((o) => {
		if (search && !o.orderNumber.toLowerCase().includes(search) && !o.customerName.toLowerCase().includes(search) && !o.assignedTo.toLowerCase().includes(search) && !o.items.some((item) => item.productName.toLowerCase().includes(search))) return false;
		if (query.status && o.status !== query.status) return false;
		if (query.paymentStatus && o.paymentStatus !== query.paymentStatus) return false;
		if (query.customerId && o.customerId !== query.customerId) return false;
		return true;
	}).sort((a, b) => b.orderDate.localeCompare(a.orderDate));
	res.json(paginate(filtered, query.page, query.limit));
};
var getOrderDetail = (req, res) => {
	const order = orders$1.find((o) => o.id === req.params.id && !o.deletedAt);
	if (!order) return sendNotFound(res, "Buyurtma topilmadi");
	res.json({
		success: true,
		data: {
			order,
			customer: customers$1.find((c) => c.id === order.customerId) ?? null
		}
	});
};
var createOrder = (req, res) => {
	const parsed = orderSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const customer = customers$1.find((c) => c.id === parsed.data.customerId && !c.deletedAt);
	if (!customer) return sendNotFound(res, "Mijoz topilmadi");
	const built = buildItems$1(parsed.data.items);
	if ("error" in built) return res.status(400).json({
		success: false,
		message: built.error
	});
	const status = parsed.data.status ?? "draft";
	if (isCommitted(status)) {
		const problem = findInsufficientStock(built.items);
		if (problem) return res.status(409).json({
			success: false,
			message: problem
		});
	}
	const newOrder = {
		id: nextId(),
		orderNumber: nextOrderNumber(),
		customerId: customer.id,
		customerName: customer.name,
		items: built.items,
		total: orderTotal(built.items),
		status,
		paymentStatus: parsed.data.paymentStatus ?? "unpaid",
		orderDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		deliveryDate: parsed.data.deliveryDate,
		assignedTo: parsed.data.assignedTo,
		note: parsed.data.note
	};
	orders$1.unshift(newOrder);
	if (isCommitted(newOrder.status)) commitStock(newOrder);
	if (newOrder.paymentStatus === "paid") recordRevenue(newOrder);
	logActivity({
		action: "Yangi buyurtma yaratildi",
		details: `${newOrder.orderNumber} · ${newOrder.customerName}`,
		icon: "Plus"
	});
	const response = {
		success: true,
		data: newOrder,
		message: "Buyurtma muvaffaqiyatli yaratildi"
	};
	res.status(201).json(response);
};
var updateOrder = (req, res) => {
	const parsed = orderSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const order = orders$1.find((o) => o.id === req.params.id && !o.deletedAt);
	if (!order) return sendNotFound(res, "Buyurtma topilmadi");
	const previousStatus = order.status;
	const previousPayment = order.paymentStatus;
	const nextStatus = parsed.data.status ?? previousStatus;
	let nextItems = order.items;
	if (parsed.data.items) {
		const built = buildItems$1(parsed.data.items);
		if ("error" in built) return res.status(400).json({
			success: false,
			message: built.error
		});
		nextItems = built.items;
		if (isCommitted(previousStatus)) releaseStock(order);
	}
	if (parsed.data.customerId) {
		const customer = customers$1.find((c) => c.id === parsed.data.customerId && !c.deletedAt);
		if (!customer) {
			if (parsed.data.items && isCommitted(previousStatus)) commitStock(order);
			return sendNotFound(res, "Mijoz topilmadi");
		}
		order.customerId = customer.id;
		order.customerName = customer.name;
	}
	const willCommit = isCommitted(nextStatus);
	const wasCommitted = isCommitted(previousStatus) && !parsed.data.items;
	if (willCommit && !wasCommitted) {
		const problem = findInsufficientStock({
			...order,
			items: nextItems
		}.items);
		if (problem) {
			if (parsed.data.items && isCommitted(previousStatus)) commitStock(order);
			return res.status(409).json({
				success: false,
				message: problem
			});
		}
	}
	order.items = nextItems;
	order.total = orderTotal(nextItems);
	if (parsed.data.deliveryDate) order.deliveryDate = parsed.data.deliveryDate;
	if (parsed.data.assignedTo) order.assignedTo = parsed.data.assignedTo;
	if (parsed.data.note !== void 0) order.note = parsed.data.note;
	if (parsed.data.paymentStatus) order.paymentStatus = parsed.data.paymentStatus;
	order.status = nextStatus;
	if (willCommit && !wasCommitted) commitStock(order);
	else if (!willCommit && isCommitted(previousStatus) && !parsed.data.items) releaseStock(order);
	if (previousPayment !== "paid" && order.paymentStatus === "paid") recordRevenue(order);
	logActivity({
		action: previousStatus !== order.status ? `Buyurtma holati: ${order.status}` : "Buyurtma yangilandi",
		details: `${order.orderNumber} · ${order.customerName}`,
		icon: order.status === "delivered" ? "Handshake" : "PenLine"
	});
	const response = {
		success: true,
		data: order,
		message: "Buyurtma yangilandi"
	};
	res.json(response);
};
var deleteOrder = (req, res) => {
	const order = orders$1.find((o) => o.id === req.params.id && !o.deletedAt);
	if (!order) return sendNotFound(res, "Buyurtma topilmadi");
	if (isCommitted(order.status)) releaseStock(order);
	softRemove(orders$1, order.id);
	logActivity({
		action: "Buyurtma o'chirildi",
		details: `${order.orderNumber} · ${order.customerName}`,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Buyurtma o'chirildi"
	});
};
//#endregion
//#region server/routes/purchases.ts
var PURCHASE_STATUSES = [
	"draft",
	"ordered",
	"received",
	"cancelled"
];
var PAYMENT_STATUSES = [
	"unpaid",
	"partial",
	"paid"
];
var purchaseSchema = z.object({
	supplierId: z.string().trim().min(1, "ta'minotchi tanlanishi shart"),
	items: z.array(z.object({
		productId: z.string().trim().min(1),
		quantity: z.coerce.number().int().positive("miqdor noldan katta bo'lishi kerak"),
		cost: z.coerce.number().min(0).optional()
	})).min(1, "kamida bitta mahsulot qo'shilishi kerak"),
	expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
	createdBy: z.string().trim().min(1, "mas'ul xodim tanlanishi shart"),
	note: z.string().trim().catch(""),
	status: z.enum(PURCHASE_STATUSES).optional(),
	paymentStatus: z.enum(PAYMENT_STATUSES).optional()
});
var querySchema$4 = paginationSchema.extend({
	status: z.enum(PURCHASE_STATUSES).optional().catch(void 0),
	paymentStatus: z.enum(PAYMENT_STATUSES).optional().catch(void 0),
	supplierId: z.string().optional()
});
function nextPurchaseNumber() {
	return `PO-${purchases$1.reduce((highest, purchase) => {
		const parsed = Number(purchase.purchaseNumber.replace(/\D/g, ""));
		return Number.isFinite(parsed) && parsed > highest ? parsed : highest;
	}, 2e3) + 1}`;
}
/** So'rovdagi qatorlarni tekshiradi; tannarx berilmasa sotish narxining 70% i olinadi. */
function buildItems(rows) {
	const items = [];
	for (const row of rows) {
		const product = products$1.find((p) => p.id === row.productId);
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
			cost: row.cost ?? Math.round(product.price * .7)
		});
	}
	return { items };
}
function purchaseTotal(items) {
	return items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
}
/** Tovar qabul qilinganda qoldiq oshadi va harakat jurnaliga yoziladi. */
function receiveStock(purchase) {
	for (const item of purchase.items) {
		const product = products$1.find((p) => p.id === item.productId);
		if (!product) continue;
		applyStockChange(product, item.quantity, {
			reason: "Xarid bo'yicha qabul",
			reference: purchase.purchaseNumber,
			type: "in"
		});
	}
}
/** Qabul bekor qilinsa, kirim qilingan tovar hisobdan chiqariladi. */
function reverseStock(purchase) {
	for (const item of purchase.items) {
		const product = products$1.find((p) => p.id === item.productId);
		if (!product) continue;
		applyStockChange(product, -item.quantity, {
			reason: "Xarid qabuli bekor qilindi",
			reference: purchase.purchaseNumber,
			type: "out"
		});
	}
}
/** To'langan xarid uchun moliyaga xarajat yozuvi qo'shadi. */
function recordExpense(purchase) {
	transactions$1.unshift({
		id: nextId(),
		title: `${purchase.supplierName} · ${purchase.purchaseNumber}`,
		category: "Xarid",
		account: "Ipak Yo'li bank · UZS",
		date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		amount: purchase.total,
		type: "expense"
	});
}
var getPurchaseStats = (_req, res) => {
	const response = {
		success: true,
		data: purchaseStats()
	};
	res.json(response);
};
var getPurchases = (req, res) => {
	const query = querySchema$4.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(purchases$1).filter((p) => {
		if (search && !p.purchaseNumber.toLowerCase().includes(search) && !p.supplierName.toLowerCase().includes(search) && !p.createdBy.toLowerCase().includes(search) && !p.items.some((item) => item.productName.toLowerCase().includes(search))) return false;
		if (query.status && p.status !== query.status) return false;
		if (query.paymentStatus && p.paymentStatus !== query.paymentStatus) return false;
		if (query.supplierId && p.supplierId !== query.supplierId) return false;
		return true;
	}).sort((a, b) => b.orderDate.localeCompare(a.orderDate));
	res.json(paginate(filtered, query.page, query.limit));
};
var createPurchase = (req, res) => {
	const parsed = purchaseSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const supplier = suppliers$1.find((s) => s.id === parsed.data.supplierId);
	if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
	const built = buildItems(parsed.data.items);
	if ("error" in built) return res.status(400).json({
		success: false,
		message: built.error
	});
	const newPurchase = {
		id: nextId(),
		purchaseNumber: nextPurchaseNumber(),
		supplierId: supplier.id,
		supplierName: supplier.name,
		items: built.items,
		total: purchaseTotal(built.items),
		status: parsed.data.status ?? "draft",
		paymentStatus: parsed.data.paymentStatus ?? "unpaid",
		orderDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		expectedDate: parsed.data.expectedDate,
		createdBy: parsed.data.createdBy,
		note: parsed.data.note
	};
	purchases$1.unshift(newPurchase);
	if (newPurchase.status === "received") receiveStock(newPurchase);
	if (newPurchase.paymentStatus === "paid") recordExpense(newPurchase);
	logActivity({
		action: "Xarid buyurtmasi yaratildi",
		details: `${newPurchase.purchaseNumber} · ${newPurchase.supplierName}`,
		icon: "PackagePlus"
	});
	const response = {
		success: true,
		data: newPurchase,
		message: "Xarid buyurtmasi yaratildi"
	};
	res.status(201).json(response);
};
var updatePurchase = (req, res) => {
	const parsed = purchaseSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const purchase = purchases$1.find((p) => p.id === req.params.id && !p.deletedAt);
	if (!purchase) return sendNotFound(res, "Xarid buyurtmasi topilmadi");
	const wasReceived = purchase.status === "received";
	const previousPayment = purchase.paymentStatus;
	const nextStatus = parsed.data.status ?? purchase.status;
	if (parsed.data.items) {
		const built = buildItems(parsed.data.items);
		if ("error" in built) return res.status(400).json({
			success: false,
			message: built.error
		});
		if (wasReceived) reverseStock(purchase);
		purchase.items = built.items;
		purchase.total = purchaseTotal(built.items);
	}
	if (parsed.data.supplierId) {
		const supplier = suppliers$1.find((s) => s.id === parsed.data.supplierId);
		if (!supplier) return sendNotFound(res, "Ta'minotchi topilmadi");
		purchase.supplierId = supplier.id;
		purchase.supplierName = supplier.name;
	}
	if (parsed.data.expectedDate) purchase.expectedDate = parsed.data.expectedDate;
	if (parsed.data.createdBy) purchase.createdBy = parsed.data.createdBy;
	if (parsed.data.note !== void 0) purchase.note = parsed.data.note;
	if (parsed.data.paymentStatus) purchase.paymentStatus = parsed.data.paymentStatus;
	purchase.status = nextStatus;
	const isReceivedNow = purchase.status === "received";
	const alreadyCounted = wasReceived && !parsed.data.items;
	if (isReceivedNow && !alreadyCounted) receiveStock(purchase);
	else if (!isReceivedNow && alreadyCounted) reverseStock(purchase);
	if (previousPayment !== "paid" && purchase.paymentStatus === "paid") recordExpense(purchase);
	logActivity({
		action: purchase.status === "received" ? "Xarid qabul qilindi" : "Xarid buyurtmasi yangilandi",
		details: `${purchase.purchaseNumber} · ${purchase.supplierName}`,
		icon: purchase.status === "received" ? "PackagePlus" : "PenLine"
	});
	const response = {
		success: true,
		data: purchase,
		message: "Xarid buyurtmasi yangilandi"
	};
	res.json(response);
};
var deletePurchase = (req, res) => {
	const purchase = purchases$1.find((p) => p.id === req.params.id && !p.deletedAt);
	if (!purchase) return sendNotFound(res, "Xarid buyurtmasi topilmadi");
	if (purchase.status === "received") reverseStock(purchase);
	softRemove(purchases$1, purchase.id);
	logActivity({
		action: "Xarid buyurtmasi o'chirildi",
		details: `${purchase.purchaseNumber} · ${purchase.supplierName}`,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Xarid buyurtmasi o'chirildi"
	});
};
//#endregion
//#region server/routes/debts.ts
var getDebtStats = (_req, res) => {
	const today = todayISO();
	const unpaidOrders = orders$1.filter((o) => o.paymentStatus === "unpaid" || o.paymentStatus === "partial");
	const response = {
		success: true,
		data: {
			totalDebt: unpaidOrders.reduce((sum, o) => sum + o.total, 0),
			paidToday: debtPayments.filter((p) => p.paymentDate === today).reduce((sum, p) => sum + p.amount, 0),
			overdueDebt: unpaidOrders.filter((o) => {
				const deliveryDate = new Date(o.deliveryDate);
				return Math.floor((Date.now() - deliveryDate.getTime()) / (1440 * 60 * 1e3)) > 30;
			}).reduce((sum, o) => sum + o.total, 0),
			customersInDebt: new Set(unpaidOrders.map((o) => o.customerId)).size
		}
	};
	res.json(response);
};
var getCustomerDebts = (req, res) => {
	const query = paginationSchema.parse(req.query);
	const search = query.search.toLowerCase();
	const customerDebtsMap = /* @__PURE__ */ new Map();
	orders$1.forEach((order) => {
		if (order.paymentStatus === "paid") return;
		if (!customerDebtsMap.has(order.customerId)) customerDebtsMap.set(order.customerId, {
			customerId: order.customerId,
			customerName: order.customerName,
			totalDebt: 0,
			paidAmount: 0,
			remainingDebt: 0,
			orderCount: 0,
			oldestDebtDate: order.orderDate,
			lastPaymentDate: null
		});
		const debt = customerDebtsMap.get(order.customerId);
		debt.totalDebt += order.total;
		debt.orderCount += 1;
		if (order.orderDate < debt.oldestDebtDate) debt.oldestDebtDate = order.orderDate;
	});
	debtPayments.forEach((payment) => {
		const debt = customerDebtsMap.get(payment.customerId);
		if (debt) {
			debt.paidAmount += payment.amount;
			if (!debt.lastPaymentDate || payment.paymentDate > debt.lastPaymentDate) debt.lastPaymentDate = payment.paymentDate;
		}
	});
	customerDebtsMap.forEach((debt) => {
		debt.remainingDebt = debt.totalDebt - debt.paidAmount;
	});
	let debts = Array.from(customerDebtsMap.values()).filter((d) => d.remainingDebt > 0);
	if (search) debts = debts.filter((d) => d.customerName.toLowerCase().includes(search));
	debts.sort((a, b) => b.remainingDebt - a.remainingDebt);
	res.json(paginate(debts, query.page, query.limit));
};
var getCustomerDebtHistory = (req, res) => {
	const customerId = req.params.customerId;
	if (!customers$1.find((c) => c.id === customerId)) return sendNotFound(res, "Mijoz topilmadi");
	const customerOrders = orders$1.filter((o) => o.customerId === customerId && o.paymentStatus !== "paid");
	const customerPayments = debtPayments.filter((p) => p.customerId === customerId);
	const response = {
		success: true,
		data: {
			orders: customerOrders,
			payments: customerPayments,
			totalDebt: customerOrders.reduce((sum, o) => sum + o.total, 0),
			paidAmount: customerPayments.reduce((sum, p) => sum + p.amount, 0),
			remainingDebt: customerOrders.reduce((sum, o) => sum + o.total, 0) - customerPayments.reduce((sum, p) => sum + p.amount, 0)
		}
	};
	res.json(response);
};
var getDebtPayments = (req, res) => {
	const query = paginationSchema.parse(req.query);
	const search = query.search.toLowerCase();
	let filtered = debtPayments.filter((payment) => {
		if (search && !payment.customerName.toLowerCase().includes(search) && !payment.orderNumber.toLowerCase().includes(search)) return false;
		return true;
	});
	filtered.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
	res.json(paginate(filtered, query.page, query.limit));
};
var paymentSchema = z.object({
	orderId: z.string().min(1, "Buyurtma tanlanishi shart"),
	amount: z.number().positive("Summa musbat bo'lishi kerak"),
	paymentMethod: z.string().min(1, "To'lov usuli kiritilishi shart"),
	note: z.string().optional().default("")
});
var createDebtPayment = (req, res) => {
	const parsed = paymentSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const order = orders$1.find((o) => o.id === parsed.data.orderId);
	if (!order) return sendNotFound(res, "Buyurtma topilmadi");
	if (order.paymentStatus === "paid") return res.status(400).json({
		success: false,
		message: "Bu buyurtma allaqachon to'liq to'langan"
	});
	const alreadyPaid = debtPayments.filter((p) => p.orderId === order.id).reduce((sum, p) => sum + p.amount, 0);
	const remainingAmount = order.total - alreadyPaid;
	if (parsed.data.amount > remainingAmount) return res.status(400).json({
		success: false,
		message: `Qoldiq qarz: ${remainingAmount.toFixed(2)} so'm. Ortiqcha to'lov qabul qilinmaydi.`
	});
	const payment = {
		id: nextId(),
		orderId: order.id,
		orderNumber: order.orderNumber,
		customerId: order.customerId,
		customerName: order.customerName,
		amount: parsed.data.amount,
		paymentDate: todayISO(),
		paymentMethod: parsed.data.paymentMethod,
		note: parsed.data.note,
		createdBy: "current-user"
	};
	debtPayments.unshift(payment);
	const newPaidTotal = alreadyPaid + parsed.data.amount;
	if (newPaidTotal >= order.total) order.paymentStatus = "paid";
	else if (newPaidTotal > 0) order.paymentStatus = "partial";
	logActivity({
		action: "Qarz to'landi",
		details: `${order.customerName} · ${payment.amount.toFixed(0)} so'm`,
		icon: "DollarSign"
	});
	const response = {
		success: true,
		data: payment,
		message: "To'lov muvaffaqiyatli qo'shildi"
	};
	res.status(201).json(response);
};
var clearCustomerDebt = (req, res) => {
	const customerId = req.params.customerId;
	const customer = customers$1.find((c) => c.id === customerId);
	if (!customer) return sendNotFound(res, "Mijoz topilmadi");
	const customerOrders = orders$1.filter((o) => o.customerId === customerId && o.paymentStatus !== "paid");
	if (customerOrders.length === 0) return res.status(400).json({
		success: false,
		message: "Bu mijozning qarzlari yo'q"
	});
	let clearedCount = 0;
	customerOrders.forEach((order) => {
		order.paymentStatus = "paid";
		clearedCount++;
	});
	logActivity({
		action: "Qarz tozalandi",
		details: `${customer.name} · ${clearedCount} ta buyurtma`,
		icon: "CheckCircle"
	});
	const response = {
		success: true,
		data: { clearedOrders: clearedCount },
		message: `${clearedCount} ta buyurtma tozalandi`
	};
	res.json(response);
};
//#endregion
//#region server/routes/attendance.ts
var ATTENDANCE_STATUSES = [
	"present",
	"late",
	"remote",
	"absent",
	"leave"
];
var LEAVE_TYPES = [
	"vacation",
	"sick",
	"unpaid",
	"personal"
];
var LEAVE_STATUSES = [
	"pending",
	"approved",
	"rejected"
];
var attendanceQuerySchema = paginationSchema.extend({
	employeeId: z.string().optional(),
	department: z.string().optional(),
	status: z.enum(ATTENDANCE_STATUSES).optional().catch(void 0),
	date: z.string().optional()
});
var getAttendanceStats = (_req, res) => {
	const response = {
		success: true,
		data: attendanceStats()
	};
	res.json(response);
};
var getAttendance = (req, res) => {
	const query = attendanceQuerySchema.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = attendance.filter((record) => {
		if (search && !record.employeeName.toLowerCase().includes(search) && !record.department.toLowerCase().includes(search)) return false;
		if (query.employeeId && record.employeeId !== query.employeeId) return false;
		if (query.department && record.department !== query.department) return false;
		if (query.status && record.status !== query.status) return false;
		if (query.date && record.date !== query.date) return false;
		return true;
	});
	res.json(paginate(filtered, query.page, query.limit));
};
var markSchema = z.object({
	employeeId: z.string().trim().min(1, "xodim tanlanishi shart"),
	status: z.enum(ATTENDANCE_STATUSES),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak").optional(),
	checkIn: z.string().trim().catch(""),
	checkOut: z.string().trim().catch(""),
	note: z.string().trim().catch("")
});
/** Davomatni belgilash — o'sha kunda yozuv bo'lsa yangilanadi, bo'lmasa yaratiladi. */
var markAttendance = (req, res) => {
	const parsed = markSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const employee = employees$1.find((e) => e.id === parsed.data.employeeId);
	if (!employee) return sendNotFound(res, "Xodim topilmadi");
	const date = parsed.data.date ?? todayISO();
	const worked = [
		"present",
		"late",
		"remote"
	].includes(parsed.data.status);
	const existing = attendance.find((record) => record.employeeId === employee.id && record.date === date);
	const payload = {
		status: parsed.data.status,
		checkIn: worked ? parsed.data.checkIn || "09:00" : "",
		checkOut: worked ? parsed.data.checkOut || "18:00" : "",
		hours: worked ? 8 : 0,
		note: parsed.data.note
	};
	let record;
	if (existing) {
		Object.assign(existing, payload);
		record = existing;
	} else {
		record = {
			id: nextId(),
			employeeId: employee.id,
			employeeName: employee.name,
			department: employee.department,
			date,
			...payload
		};
		attendance.unshift(record);
	}
	logActivity({
		action: "Davomat belgilandi",
		details: `${employee.name} · ${date}`,
		icon: "UsersRound"
	});
	const response = {
		success: true,
		data: record,
		message: "Davomat saqlandi"
	};
	res.json(response);
};
/** Barcha davomat yozuvlarini o'chirish */
var clearAllAttendance = (_req, res) => {
	const count = attendance.length;
	attendance.length = 0;
	logActivity({
		action: "Barcha davomat yozuvlari o'chirildi",
		details: `${count} ta yozuv tozalandi`,
		icon: "Trash2"
	});
	const response = {
		success: true,
		data: null,
		message: `${count} ta davomat yozuvi o'chirildi`
	};
	res.json(response);
};
var leaveQuerySchema = paginationSchema.extend({
	employeeId: z.string().optional(),
	type: z.enum(LEAVE_TYPES).optional().catch(void 0),
	status: z.enum(LEAVE_STATUSES).optional().catch(void 0)
});
var leaveSchema = z.object({
	employeeId: z.string().trim().min(1, "xodim tanlanishi shart"),
	type: z.enum(LEAVE_TYPES),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "boshlanish sanasi YYYY-MM-DD ko'rinishida bo'lishi kerak"),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "tugash sanasi YYYY-MM-DD ko'rinishida bo'lishi kerak"),
	reason: z.string().trim().catch(""),
	status: z.enum(LEAVE_STATUSES).optional()
});
/** Ikki sana orasidagi kunlar soni (ikkala chekka ham hisobga olinadi). */
function daysBetween(start, end) {
	const diff = new Date(end).getTime() - new Date(start).getTime();
	return Math.floor(diff / (1440 * 60 * 1e3)) + 1;
}
/**
* Tasdiqlangan ta'til bugungi kunni qamrasa, xodim holati mos ravishda o'zgaradi.
* Aks holda u yana "ishda" holatiga qaytadi.
*/
function syncEmployeeStatus(employee) {
	const today = todayISO();
	const active = leaveRequests.find((request) => request.employeeId === employee.id && request.status === "approved" && request.startDate <= today && request.endDate >= today);
	if (!active) {
		employee.status = "active";
		return;
	}
	employee.status = active.type === "sick" ? "sick_leave" : "vacation";
}
var getLeaveStats = (_req, res) => {
	const response = {
		success: true,
		data: leaveStats()
	};
	res.json(response);
};
var getLeaveRequests = (req, res) => {
	const query = leaveQuerySchema.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = leaveRequests.filter((request) => {
		if (search && !request.employeeName.toLowerCase().includes(search) && !request.reason.toLowerCase().includes(search)) return false;
		if (query.employeeId && request.employeeId !== query.employeeId) return false;
		if (query.type && request.type !== query.type) return false;
		if (query.status && request.status !== query.status) return false;
		return true;
	}).sort((a, b) => b.startDate.localeCompare(a.startDate));
	res.json(paginate(filtered, query.page, query.limit));
};
var createLeaveRequest = (req, res) => {
	const parsed = leaveSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const employee = employees$1.find((e) => e.id === parsed.data.employeeId);
	if (!employee) return sendNotFound(res, "Xodim topilmadi");
	if (parsed.data.endDate < parsed.data.startDate) return res.status(400).json({
		success: false,
		message: "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas"
	});
	const newRequest = {
		id: nextId(),
		employeeId: employee.id,
		employeeName: employee.name,
		type: parsed.data.type,
		startDate: parsed.data.startDate,
		endDate: parsed.data.endDate,
		days: daysBetween(parsed.data.startDate, parsed.data.endDate),
		status: parsed.data.status ?? "pending",
		reason: parsed.data.reason,
		requestedDate: todayISO()
	};
	leaveRequests.unshift(newRequest);
	if (newRequest.status === "approved") syncEmployeeStatus(employee);
	logActivity({
		action: "Ta'til so'rovi yuborildi",
		details: `${employee.name} · ${newRequest.days} kun`,
		icon: "CalendarDays"
	});
	const response = {
		success: true,
		data: newRequest,
		message: "Ta'til so'rovi yaratildi"
	};
	res.status(201).json(response);
};
var updateLeaveRequest = (req, res) => {
	const parsed = leaveSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const request = leaveRequests.find((r) => r.id === paramId(req));
	if (!request) return sendNotFound(res, "Ta'til so'rovi topilmadi");
	const previousStatus = request.status;
	Object.assign(request, parsed.data);
	if (parsed.data.startDate || parsed.data.endDate) {
		if (request.endDate < request.startDate) return res.status(400).json({
			success: false,
			message: "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas"
		});
		request.days = daysBetween(request.startDate, request.endDate);
	}
	const employee = employees$1.find((e) => e.id === request.employeeId);
	if (employee) syncEmployeeStatus(employee);
	const statusChanged = previousStatus !== request.status;
	logActivity({
		action: statusChanged && request.status === "approved" ? "Ta'til so'rovi tasdiqlandi" : statusChanged && request.status === "rejected" ? "Ta'til so'rovi rad etildi" : "Ta'til so'rovi yangilandi",
		details: `${request.employeeName} · ${request.days} kun`,
		icon: "CalendarDays"
	});
	const response = {
		success: true,
		data: request,
		message: "Ta'til so'rovi yangilandi"
	};
	res.json(response);
};
var deleteLeaveRequest = (req, res) => {
	const removed = removeById(leaveRequests, paramId(req));
	if (!removed) return sendNotFound(res, "Ta'til so'rovi topilmadi");
	const employee = employees$1.find((e) => e.id === removed.employeeId);
	if (employee) syncEmployeeStatus(employee);
	logActivity({
		action: "Ta'til so'rovi o'chirildi",
		details: removed.employeeName,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Ta'til so'rovi o'chirildi"
	});
};
//#endregion
//#region server/lib/audit.ts
/**
* Audit-log — TZ 14-bo'lim: har bir yaratish/tahrirlash/o'chirish amali kim,
* qachon, qaysi IP orqali bajarganini saqlaydi.
*
* To'g'ridan-to'g'ri bazaga yoziladi (xotira massivi orqali emas), chunki
* jurnal o'zgarmas bo'lishi va har doim saqlanishi kerak.
*/
var auditIdCounter = Date.now();
/** So'rovdan IP manzilini ajratib oladi. */
function clientIp(req) {
	const forwarded = req.headers["x-forwarded-for"];
	if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
	return req.socket.remoteAddress ?? "—";
}
/** Bitta audit yozuvini bazaga qo'shadi. */
async function recordAudit(entry) {
	const log = {
		id: (++auditIdCounter).toString(),
		userId: entry.user.id,
		userName: entry.user.name,
		userRole: entry.user.role,
		action: entry.action,
		entity: entry.entity,
		entityId: entry.entityId ?? "",
		summary: entry.summary,
		ipAddress: entry.ip,
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (USE_POSTGRES) {
		await pgInsertAuditLog(log);
		return;
	}
	db().prepare(`INSERT INTO audit_logs
       (id, userId, userName, userRole, action, entity, entityId, summary, ipAddress, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(log.id, log.userId, log.userName, log.userRole, log.action, log.entity, log.entityId, log.summary, log.ipAddress, log.timestamp);
}
//#endregion
//#region server/routes/auth.ts
/** Parol hash'ini javobdan chiqarib tashlaydi. */
function toPublicUser(user) {
	const { passwordHash: _passwordHash, ...safe } = user;
	return safe;
}
var loginSchema = z.object({
	login: z.string().trim().min(1, "login kiritilishi shart"),
	password: z.string().min(1, "parol kiritilishi shart")
});
/**
* Parol kuchliligini tekshiruvchi schema.
* Kamida 8 belgidan iborat, katta va kichik harf, raqam va maxsus belgi bo'lishi kerak.
*/
var passwordSchema$1 = z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak").regex(/[a-z]/, "Parol kamida bitta kichik harf (a-z) o'z ichiga olishi kerak").regex(/[A-Z]/, "Parol kamida bitta katta harf (A-Z) o'z ichiga olishi kerak").regex(/[0-9]/, "Parol kamida bitta raqam (0-9) o'z ichiga olishi kerak").regex(/[^a-zA-Z0-9]/, "Parol kamida bitta maxsus belgi (!@#$%^&*) o'z ichiga olishi kerak");
var changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "joriy parol kiritilishi shart"),
	newPassword: passwordSchema$1
});
var login = async (req, res) => {
	try {
		console.log("📨 Login request received");
		console.log("📦 Request body:", req.body ? "exists" : "undefined/null");
		console.log("🔍 Body type:", typeof req.body);
		if (!req.body || typeof req.body !== "object") {
			console.error("❌ Invalid request body:", req.body);
			return res.status(400).json({
				success: false,
				message: "Yaroqsiz so'rov: body bo'sh yoki noto'g'ri formatda"
			});
		}
		const parsed = loginSchema.safeParse(req.body);
		if (!parsed.success) {
			console.error("❌ Login validation error:", parsed.error.errors);
			return sendValidationError(res, parsed.error);
		}
		const loginValue = parsed.data.login.trim().toLowerCase();
		console.log("🔍 Login attempt for:", loginValue);
		console.log("📊 Total users in database:", users$1?.length || 0);
		if (!users$1 || !Array.isArray(users$1)) {
			console.error("❌ CRITICAL: users array undefined or not array!");
			return res.status(500).json({
				success: false,
				message: "Server xatosi: Ma'lumotlar bazasi mavjud emas"
			});
		}
		const user = users$1.find((item) => {
			try {
				const loginMatch = item.login && item.login.toLowerCase() === loginValue;
				const emailMatch = item.email && item.email.toLowerCase() === loginValue;
				const notDeleted = !item.deletedAt;
				return (loginMatch || emailMatch) && notDeleted;
			} catch (findError) {
				console.error("❌ Error in find predicate:", findError);
				return false;
			}
		});
		if (!user) {
			console.error("❌ User not found:", loginValue);
			console.error("📋 Available users:", users$1.slice(0, 5).map((u) => ({
				login: u.login,
				email: u.email,
				hasPassword: !!u.passwordHash
			})));
			return res.status(401).json({
				success: false,
				message: "Login yoki parol noto'g'ri"
			});
		}
		console.log("✅ User found:", {
			id: user.id,
			login: user.login,
			email: user.email,
			hasPassword: !!user.passwordHash,
			status: user.status
		});
		if (!user.passwordHash) {
			console.error("❌ User has no password hash:", user.login);
			return res.status(500).json({
				success: false,
				message: "Server xatosi: Parol hash mavjud emas"
			});
		}
		let passwordValid = false;
		try {
			passwordValid = verifyPassword(parsed.data.password, user.passwordHash);
			console.log("🔐 Password verification result:", passwordValid);
		} catch (verifyError) {
			console.error("❌ Password verification error:", verifyError);
			return res.status(500).json({
				success: false,
				message: "Server xatosi: Parol tekshirishda xatolik"
			});
		}
		if (!passwordValid) {
			console.error("❌ Invalid password for user:", user.login);
			return res.status(401).json({
				success: false,
				message: "Login yoki parol noto'g'ri"
			});
		}
		if (user.status === "suspended") {
			console.warn("⚠️ User suspended:", user.email);
			return res.status(403).json({
				success: false,
				message: "Hisobingiz to'xtatilgan. Administratorga murojaat qiling."
			});
		}
		let token;
		try {
			user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
			token = createAccessToken({
				userId: user.id,
				email: user.email,
				role: user.role
			});
			console.log("✅ JWT token created:", {
				userId: user.id,
				email: user.email,
				role: user.role,
				tokenPrefix: token.substring(0, 20) + "..."
			});
		} catch (tokenError) {
			console.error("❌ Token creation error:", tokenError);
			return res.status(500).json({
				success: false,
				message: "Server xatosi: Token yaratishda xatolik"
			});
		}
		try {
			await recordAudit({
				user,
				action: "login",
				entity: "auth",
				summary: `${user.name} tizimga kirdi`,
				ip: clientIp(req)
			});
		} catch (auditError) {
			console.error("⚠️ Audit logging error (non-critical):", auditError);
		}
		const response = {
			success: true,
			data: {
				token,
				user: toPublicUser(user)
			},
			message: "Tizimga muvaffaqiyatli kirdingiz"
		};
		console.log("✅ Login successful for:", user.email);
		res.json(response);
	} catch (error) {
		console.error("❌❌❌ LOGIN EXCEPTION (UNCAUGHT) ❌❌❌");
		console.error("Error type:", error?.constructor?.name);
		console.error("Error message:", error instanceof Error ? error.message : "Unknown");
		console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
		console.error("Request details:", {
			body: req.body,
			headers: req.headers,
			url: req.url,
			method: req.method
		});
		res.status(500).json({
			success: false,
			message: "Server xatosi: " + (error instanceof Error ? error.message : "Noma'lum xatolik")
		});
	}
};
var logout = async (req, res) => {
	const token = extractToken(req.headers.authorization);
	if (token) await destroySession(token);
	res.json({
		success: true,
		data: null,
		message: "Tizimdan chiqdingiz"
	});
};
/** Joriy sessiya egasi — sahifa yangilanganda holatni tiklash uchun. */
var getCurrentUser = (req, res) => {
	console.log("👤 getCurrentUser called");
	const token = extractToken(req.headers.authorization);
	console.log("   Token:", token ? "present" : "missing");
	if (!token) {
		console.error("   ❌ No token");
		return res.status(401).json({
			success: false,
			message: "Token topilmadi"
		});
	}
	const payload = verifyAccessToken(token);
	console.log("   JWT payload:", payload ? `userId=${payload.userId}` : "null");
	if (!payload) {
		console.error("   ❌ Invalid JWT");
		return res.status(401).json({
			success: false,
			message: "Token yaroqsiz"
		});
	}
	const user = users$1.find((item) => item.id === payload.userId && !item.deletedAt);
	console.log("   User found:", user ? user.email : "null");
	if (!user) {
		console.error("   ❌ User not found");
		return res.status(401).json({
			success: false,
			message: "Foydalanuvchi topilmadi"
		});
	}
	console.log("   ✅ getCurrentUser success:", user.email);
	const response = {
		success: true,
		data: toPublicUser(user)
	};
	res.json(response);
};
var changePassword = async (req, res) => {
	const parsed = changePasswordSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const user = req.currentUser;
	if (!user) return res.status(401).json({
		success: false,
		message: "Sessiya topilmadi"
	});
	if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) return res.status(400).json({
		success: false,
		message: "Joriy parol noto'g'ri"
	});
	user.passwordHash = hashPassword(parsed.data.newPassword);
	await destroyUserSessions(user.id);
	logActivity({
		action: "Parol o'zgartirildi",
		details: user.name,
		icon: "ShieldCheck"
	});
	res.json({
		success: true,
		data: null,
		message: "Parol yangilandi. Iltimos, qaytadan kiring."
	});
};
/**
* Sessiyani tekshiruvchi middleware.
* JWT token'ni verify qiladi (stateless - Vercel serverless uchun).
*/
var requireAuth = (req, res, next) => {
	console.log("🔐 requireAuth middleware called");
	console.log("   URL:", req.url);
	console.log("   Method:", req.method);
	console.log("   Authorization header:", req.headers.authorization ? "present" : "missing");
	const token = extractToken(req.headers.authorization);
	console.log("   Token extracted:", token ? `${token.substring(0, 20)}...` : "null");
	if (!token) {
		console.error("❌ requireAuth failed: No token");
		return res.status(401).json({
			success: false,
			message: "Avtorizatsiya talab qilinadi"
		});
	}
	const payload = verifyAccessToken(token);
	console.log("   JWT payload:", payload ? `userId=${payload.userId}` : "null (invalid token)");
	if (!payload) {
		console.error("❌ requireAuth failed: Invalid JWT token");
		return res.status(401).json({
			success: false,
			message: "Token yaroqsiz yoki muddati o'tgan"
		});
	}
	const user = users$1.find((item) => item.id === payload.userId && !item.deletedAt);
	console.log("   User found in memory:", user ? user.email : "null");
	if (!user || user.status === "suspended") {
		console.error("❌ requireAuth failed: User not found or suspended");
		return res.status(401).json({
			success: false,
			message: "Hisob mavjud emas yoki to'xtatilgan"
		});
	}
	console.log("✅ requireAuth success:", user.email);
	req.currentUser = user;
	next();
};
//#endregion
//#region server/routes/users.ts
var USER_ROLES = [
	"admin",
	"manager",
	"accountant",
	"warehouse",
	"sales",
	"viewer"
];
/**
* Parol kuchliligini tekshiruvchi schema.
* Kamida 8 belgidan iborat, katta va kichik harf, raqam va maxsus belgi bo'lishi kerak.
*/
var passwordSchema = z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak").regex(/[a-z]/, "Parol kamida bitta kichik harf (a-z) o'z ichiga olishi kerak").regex(/[A-Z]/, "Parol kamida bitta katta harf (A-Z) o'z ichiga olishi kerak").regex(/[0-9]/, "Parol kamida bitta raqam (0-9) o'z ichiga olishi kerak").regex(/[^a-zA-Z0-9]/, "Parol kamida bitta maxsus belgi (!@#$%^&*) o'z ichiga olishi kerak");
var userSchema = z.object({
	name: z.string().trim().min(1, "ism kiritilishi shart"),
	login: z.string().trim().min(3, "login kamida 3 belgidan iborat bo'lishi kerak"),
	email: z.string().trim().email("email formati noto'g'ri"),
	role: z.enum(USER_ROLES),
	employeeId: z.string().trim().nullable().optional(),
	status: z.enum(["active", "suspended"]).optional(),
	password: passwordSchema.optional()
});
/** Yangi hisob uchun boshlang'ich parol — foydalanuvchi keyin o'zgartiradi. */
var querySchema$3 = paginationSchema.extend({
	role: z.enum(USER_ROLES).optional().catch(void 0),
	status: z.enum(["active", "suspended"]).optional().catch(void 0)
});
var getUserStats = (_req, res) => {
	const response = {
		success: true,
		data: userStats()
	};
	res.json(response);
};
/** Rollar va ular ochadigan bo'limlar matritsasi. */
var getRolePermissions = (_req, res) => {
	const response = {
		success: true,
		data: rolePermissions()
	};
	res.json(response);
};
var getUsers = (req, res) => {
	const query = querySchema$3.parse(req.query);
	const search = query.search.toLowerCase();
	const page = paginate(active(users$1).filter((user) => {
		if (search && !user.name.toLowerCase().includes(search) && !user.login.toLowerCase().includes(search) && !user.email.toLowerCase().includes(search)) return false;
		if (query.role && user.role !== query.role) return false;
		if (query.status && user.status !== query.status) return false;
		return true;
	}), query.page, query.limit);
	res.json({
		...page,
		data: page.data.map(toPublicUser)
	});
};
var createUser = (req, res) => {
	const parsed = userSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	if (active(users$1).some((u) => u.login.toLowerCase() === parsed.data.login.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu login bilan foydalanuvchi allaqachon mavjud"
	});
	if (active(users$1).some((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu email bilan foydalanuvchi allaqachon mavjud"
	});
	if (parsed.data.employeeId && !employees$1.some((e) => e.id === parsed.data.employeeId)) return sendNotFound(res, "Xodim topilmadi");
	const newUser = {
		id: nextId(),
		name: parsed.data.name,
		login: parsed.data.login,
		email: parsed.data.email,
		role: parsed.data.role,
		status: parsed.data.status ?? "active",
		lastLogin: "",
		employeeId: parsed.data.employeeId ?? null,
		createdDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		passwordHash: hashPassword(parsed.data.password ?? DEFAULT_PASSWORD)
	};
	users$1.unshift(newUser);
	logActivity({
		action: "Yangi foydalanuvchi qo'shildi",
		details: `${newUser.name} · ${newUser.role}`,
		icon: "UserPlus"
	});
	const response = {
		success: true,
		data: toPublicUser(newUser),
		message: parsed.data.password ? "Foydalanuvchi qo'shildi" : `Foydalanuvchi qo'shildi. Boshlang'ich parol: ${DEFAULT_PASSWORD}`
	};
	res.status(201).json(response);
};
var updateUser = async (req, res) => {
	const parsed = userSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const user = users$1.find((u) => u.id === req.params.id && !u.deletedAt);
	if (!user) return sendNotFound(res, "Foydalanuvchi topilmadi");
	if (parsed.data.login && active(users$1).some((u) => u.id !== user.id && u.login.toLowerCase() === parsed.data.login.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu login boshqa foydalanuvchiga biriktirilgan"
	});
	if (parsed.data.email && active(users$1).some((u) => u.id !== user.id && u.email.toLowerCase() === parsed.data.email.toLowerCase())) return res.status(409).json({
		success: false,
		message: "Bu email boshqa foydalanuvchiga biriktirilgan"
	});
	if (user.role === "admin" && (parsed.data.role && parsed.data.role !== "admin" || parsed.data.status === "suspended")) {
		if (active(users$1).filter((u) => u.id !== user.id && u.role === "admin" && u.status === "active").length === 0) return res.status(409).json({
			success: false,
			message: "Tizimda kamida bitta faol administrator qolishi kerak"
		});
	}
	const { password, ...fields } = parsed.data;
	Object.assign(user, fields);
	if (password) {
		user.passwordHash = hashPassword(password);
		await destroyUserSessions(user.id);
	}
	if (fields.status === "suspended") await destroyUserSessions(user.id);
	logActivity({
		action: "Foydalanuvchi yangilandi",
		details: `${user.name} · ${user.role}`,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: toPublicUser(user),
		message: "Foydalanuvchi yangilandi"
	};
	res.json(response);
};
var deleteUser = async (req, res) => {
	const user = users$1.find((u) => u.id === req.params.id && !u.deletedAt);
	if (!user) return sendNotFound(res, "Foydalanuvchi topilmadi");
	if (user.role === "admin") {
		if (active(users$1).filter((u) => u.id !== user.id && u.role === "admin" && u.status === "active").length === 0) return res.status(409).json({
			success: false,
			message: "Oxirgi administratorni o'chirib bo'lmaydi"
		});
	}
	softRemove(users$1, user.id);
	await destroyUserSessions(user.id);
	logActivity({
		action: "Foydalanuvchi o'chirildi",
		details: user.name,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Foydalanuvchi o'chirildi"
	});
};
//#endregion
//#region server/routes/reports.ts
/** Davr berilmasa joriy yilning boshidan bugungacha olinadi. */
var periodSchema = z.object({
	from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).catch(`${(/* @__PURE__ */ new Date()).getFullYear()}-01-01`),
	to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).catch(todayISO())
});
var getReportSummary = (req, res) => {
	const { from, to } = periodSchema.parse(req.query);
	const [start, end] = from <= to ? [from, to] : [to, from];
	const response = {
		success: true,
		data: reportSummary(start, end)
	};
	res.json(response);
};
/** Yig'ma hisobotni CSV holida yuklab beradi. */
var exportReport = (req, res) => {
	const { from, to } = periodSchema.parse(req.query);
	const [start, end] = from <= to ? [from, to] : [to, from];
	const summary = reportSummary(start, end);
	const escape = (value) => `"${String(value).replace(/"/g, "\"\"")}"`;
	const lines = [
		[escape("Hisobot davri"), escape(`${start} — ${end}`)].join(","),
		"",
		[escape("Ko'rsatkich"), escape("Qiymat")].join(","),
		[escape("Jami daromad"), escape(summary.totalIncome)].join(","),
		[escape("Jami xarajat"), escape(summary.totalExpense)].join(","),
		[escape("Sof foyda"), escape(summary.netProfit)].join(","),
		[escape("Rentabellik, %"), escape(summary.margin)].join(","),
		[escape("Buyurtmalar soni"), escape(summary.ordersCount)].join(","),
		[escape("Buyurtmalar qiymati"), escape(summary.ordersValue)].join(","),
		[escape("Xaridlar qiymati"), escape(summary.purchasesValue)].join(","),
		[escape("Yangi mijozlar"), escape(summary.newCustomers)].join(","),
		"",
		[
			escape("Kategoriya"),
			escape("Daromad"),
			escape("Xarajat")
		].join(","),
		...summary.byCategory.map((row) => [
			escape(row.label),
			escape(row.income),
			escape(row.expense)
		].join(",")),
		"",
		[
			escape("Mahsulot"),
			escape("Miqdor"),
			escape("Summa")
		].join(","),
		...summary.topProducts.map((row) => [
			escape(row.label),
			escape(row.count),
			escape(row.value)
		].join(","))
	];
	const filename = `hisobot-${start}_${end}.csv`;
	res.setHeader("Content-Type", "text/csv; charset=utf-8");
	res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
	res.send("﻿" + lines.join("\r\n"));
};
//#endregion
//#region server/lib/permissions.ts
var MATRIX = {
	admin: {
		dashboard: "manage",
		finance: "manage",
		hr: "manage",
		warehouse: "manage",
		crm: "manage",
		sales: "manage",
		posts: "manage",
		reports: "manage",
		users: "manage",
		audit: "manage"
	},
	manager: {
		dashboard: "manage",
		finance: "view",
		hr: "view",
		warehouse: "manage",
		crm: "manage",
		sales: "manage",
		reports: "manage"
	},
	accountant: {
		dashboard: "view",
		finance: "manage",
		reports: "view"
	},
	cashier: {
		dashboard: "view",
		sales: "manage",
		reports: "view"
	},
	warehouse: {
		warehouse: "manage",
		reports: "view"
	},
	sales: {
		sales: "manage",
		crm: "view",
		reports: "view"
	},
	viewer: {
		dashboard: "view",
		reports: "view"
	},
	hr_manager: {
		hr: "manage",
		reports: "view"
	}
};
/** Rolda modul uchun kerakli daraja bor-yo'qligini tekshiradi. */
function can(role, module, access) {
	const granted = MATRIX[role]?.[module];
	if (!granted) return false;
	if (access === "view") return true;
	return granted === "manage";
}
/**
* Modulni himoyalovchi middleware.
* GET/HEAD — `view`, qolgan metodlar `manage` talab qiladi.
* `requireAuth` dan keyin ishlatiladi (`req.currentUser` mavjud bo'lishi shart).
*/
function requireModule(module) {
	return (req, res, next) => {
		const user = req.currentUser;
		if (!user) return res.status(401).json({
			success: false,
			message: "Avtorizatsiya talab qilinadi"
		});
		const access = req.method === "GET" || req.method === "HEAD" ? "view" : "manage";
		if (!can(user.role, module, access)) return res.status(403).json({
			success: false,
			message: access === "view" ? "Bu bo'limni ko'rish uchun ruxsatingiz yo'q" : "Bu amalni bajarish uchun ruxsatingiz yo'q"
		});
		next();
	};
}
//#endregion
//#region server/routes/audit.ts
/** HTTP metodini audit amaliga aylantiradi. */
function auditActionFor(method) {
	if (method === "POST") return "create";
	if (method === "PUT" || method === "PATCH") return "update";
	if (method === "DELETE") return "delete";
	return "update";
}
/**
* `/api/finance/transactions/123` → `finance.transaction`.
* Birinchi ikki bo'lakni oladi, id va ko'plik qo'shimchasini olib tashlaydi.
*/
function auditEntityFor(path) {
	const parts = path.split("/").filter(Boolean);
	const module = parts[0] ?? "tizim";
	const entity = (parts[1] ?? "").replace(/s$/, "");
	return entity ? `${module}.${entity}` : module;
}
var MODULE_LABEL = {
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
	auth: "Autentifikatsiya"
};
var ACTION_LABEL = {
	create: "yaratdi",
	update: "yangiladi",
	delete: "o'chirdi",
	login: "tizimga kirdi",
	logout: "tizimdan chiqdi",
	auth: "autentifikatsiya"
};
/** Yo'ldagi id (raqamli oxirgi yoki oxiridan oldingi bo'lak). */
function extractIdFromPath(path) {
	const parts = path.split("/").filter(Boolean);
	for (let i = parts.length - 1; i >= 0; i--) if (/^\d+$/.test(parts[i])) return parts[i];
	return "";
}
/** Metod va yo'ldan inson o'qiy oladigan tavsif quradi. */
function auditSummary(method, path) {
	const parts = path.split("/").filter(Boolean);
	const module = MODULE_LABEL[parts[0]] ?? parts[0];
	const action = ACTION_LABEL[auditActionFor(method)];
	const id = extractIdFromPath(path);
	const last = parts[parts.length - 1];
	return `${module}${last && !/^\d+$/.test(last) && parts.length > 2 ? ` (${last})` : ""} ${action}${id ? ` #${id}` : ""}`.trim();
}
var querySchema$2 = paginationSchema.extend({
	action: z.enum([
		"create",
		"update",
		"delete",
		"login",
		"logout",
		"auth"
	]).optional().catch(void 0),
	userId: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional()
});
var getAuditLogs = async (req, res) => {
	const query = querySchema$2.parse(req.query);
	const search = query.search.toLowerCase();
	const to = query.to ? query.to + "T23:59:59.999Z" : void 0;
	if (USE_POSTGRES) {
		const { rows, total, page, pages } = await pgQueryAuditLogs({
			action: query.action,
			userId: query.userId,
			from: query.from,
			to,
			search
		}, query.page, query.limit);
		res.json({
			data: rows,
			pagination: {
				page,
				limit: query.limit,
				total,
				pages
			}
		});
		return;
	}
	const clauses = [];
	const params = [];
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
	if (to) {
		clauses.push("timestamp <= ?");
		params.push(to);
	}
	if (search) {
		clauses.push("(LOWER(userName) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(entity) LIKE ?)");
		const like = `%${search}%`;
		params.push(like, like, like);
	}
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const instance = db();
	const total = instance.prepare(`SELECT COUNT(*) AS n FROM audit_logs ${where}`).get(...params).n;
	const pages = Math.max(1, Math.ceil(total / query.limit));
	const page = Math.min(query.page, pages);
	const offset = (page - 1) * query.limit;
	const rows = instance.prepare(`SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(...params, query.limit, offset);
	res.json({
		data: rows,
		pagination: {
			page,
			limit: query.limit,
			total,
			pages
		}
	});
};
var getAuditStats = async (_req, res) => {
	if (USE_POSTGRES) {
		const data = await pgAuditStats();
		res.json({
			success: true,
			data
		});
		return;
	}
	const instance = db();
	const count = (sql, ...p) => instance.prepare(sql).get(...p).n;
	const todayStart = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const data = {
		total: count("SELECT COUNT(*) AS n FROM audit_logs"),
		today: count("SELECT COUNT(*) AS n FROM audit_logs WHERE timestamp >= ?", todayStart),
		creates: count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'create'"),
		updates: count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'update'"),
		deletes: count("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'delete'")
	};
	res.json({
		success: true,
		data
	});
};
//#endregion
//#region server/routes/crm.ts
var DEAL_STATUSES = [
	"new_lead",
	"negotiation",
	"proposal",
	"closed_won",
	"closed_lost"
];
var dealSchema = z.object({
	clientName: z.string().trim().min(1, "mijoz nomi kiritilishi shart"),
	value: z.coerce.number().positive("bitim summasi noldan katta bo'lishi kerak"),
	description: z.string().trim().catch(""),
	expectedCloseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
	assignedTo: z.string().trim().min(1, "mas'ul xodim tanlanishi shart"),
	status: z.enum(DEAL_STATUSES).optional()
});
var querySchema$1 = paginationSchema.extend({
	status: z.enum(DEAL_STATUSES).optional().catch(void 0),
	assignedTo: z.string().optional()
});
var getCRMStats = (_req, res) => {
	const response = {
		success: true,
		data: crmStats()
	};
	res.json(response);
};
/** Top mijozlar, mas'ul kesimi, konversiya va yaqin/muddati o'tgan bitimlar. */
var getCRMBreakdown = (_req, res) => {
	res.json({
		success: true,
		data: crmBreakdown()
	});
};
/** Savdo voronkasi bosqichlari bo'yicha taqsimot. */
var getDealFunnel = (_req, res) => {
	const response = {
		success: true,
		data: dealFunnel()
	};
	res.json(response);
};
var getDeals = (req, res) => {
	const query = querySchema$1.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(deals$1).filter((d) => {
		if (search && !d.clientName.toLowerCase().includes(search) && !d.description.toLowerCase().includes(search) && !d.assignedTo.toLowerCase().includes(search)) return false;
		if (query.status && d.status !== query.status) return false;
		if (query.assignedTo && d.assignedTo !== query.assignedTo) return false;
		return true;
	});
	res.json(paginate(filtered, query.page, query.limit));
};
var createDeal = (req, res) => {
	const parsed = dealSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const newDeal = {
		id: nextId(),
		clientName: parsed.data.clientName,
		status: parsed.data.status ?? "new_lead",
		value: parsed.data.value,
		description: parsed.data.description,
		createdDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		expectedCloseDate: parsed.data.expectedCloseDate,
		assignedTo: parsed.data.assignedTo
	};
	deals$1.unshift(newDeal);
	logActivity({
		action: "Yangi bitim yaratildi",
		details: `${newDeal.clientName} · ${newDeal.value.toLocaleString("uz-UZ")} so'm`,
		icon: "Handshake"
	});
	const response = {
		success: true,
		data: newDeal,
		message: "Bitim muvaffaqiyatli yaratildi"
	};
	res.status(201).json(response);
};
var updateDeal = (req, res) => {
	const parsed = dealSchema.partial().safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const deal = deals$1.find((d) => d.id === req.params.id && !d.deletedAt);
	if (!deal) return sendNotFound(res, "Bitim topilmadi");
	const previousStatus = deal.status;
	Object.assign(deal, parsed.data);
	if (previousStatus !== deal.status && deal.status === "closed_won") logActivity({
		action: "Bitim muvaffaqiyatli yopildi",
		details: `${deal.clientName} · ${deal.value.toLocaleString("uz-UZ")} so'm`,
		icon: "Handshake"
	});
	else logActivity({
		action: "Bitim yangilandi",
		details: deal.clientName,
		icon: "PenLine"
	});
	const response = {
		success: true,
		data: deal,
		message: "Bitim ma'lumotlari yangilandi"
	};
	res.json(response);
};
var deleteDeal = (req, res) => {
	const removed = softRemove(deals$1, paramId(req));
	if (!removed) return sendNotFound(res, "Bitim topilmadi");
	logActivity({
		action: "Bitim o'chirildi",
		details: removed.clientName,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Bitim o'chirildi"
	});
};
//#endregion
//#region server/routes/payroll.ts
var PAYROLL_STATUSES = [
	"draft",
	"approved",
	"paid"
];
/** Joriy oy "YYYY-MM" ko'rinishida. */
function currentPeriod() {
	const now = /* @__PURE__ */ new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
var querySchema = paginationSchema.extend({
	period: z.string().optional(),
	department: z.string().optional(),
	status: z.enum(PAYROLL_STATUSES).optional().catch(void 0)
});
var getPayrollStats = (req, res) => {
	const response = {
		success: true,
		data: payrollStats(typeof req.query.period === "string" ? req.query.period : void 0)
	};
	res.json(response);
};
var getPayrolls = (req, res) => {
	const query = querySchema.parse(req.query);
	const search = query.search.toLowerCase();
	const filtered = active(payrolls$1).filter((p) => {
		if (search && !p.employeeName.toLowerCase().includes(search) && !p.department.toLowerCase().includes(search)) return false;
		if (query.period && p.period !== query.period) return false;
		if (query.department && p.department !== query.department) return false;
		if (query.status && p.status !== query.status) return false;
		return true;
	}).sort((a, b) => b.period.localeCompare(a.period) || a.employeeName.localeCompare(b.employeeName));
	res.json(paginate(filtered, query.page, query.limit));
};
/** Mavjud hisob davrlari — filtr ro'yxati uchun. */
var getPayrollPeriods = (_req, res) => {
	const periods = [...new Set(active(payrolls$1).map((p) => p.period))].sort((a, b) => b.localeCompare(a));
	const current = currentPeriod();
	if (!periods.includes(current)) periods.unshift(current);
	res.json({
		success: true,
		data: periods
	});
};
var calculateSchema = z.object({
	period: z.string().regex(/^\d{4}-\d{2}$/, "davr YYYY-MM ko'rinishida bo'lishi kerak").optional(),
	employeeId: z.string().trim().optional()
});
/**
* Ish haqini hisoblaydi. Har bir faol xodim uchun (yoki bittasi uchun) davomatga
* asoslanib qiymatlarni chiqaradi. Shu davr uchun avval hisoblangan yozuv bo'lsa,
* u qayta yozilmaydi — takroriy hisoblash dublikat yaratmaydi.
*/
var calculatePayroll = (req, res) => {
	const parsed = calculateSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const period = parsed.data.period ?? currentPeriod();
	let targets = active(employees$1);
	if (parsed.data.employeeId) {
		targets = targets.filter((e) => e.id === parsed.data.employeeId);
		if (targets.length === 0) return sendNotFound(res, "Xodim topilmadi");
	}
	const created = [];
	let skipped = 0;
	for (const employee of targets) {
		if (active(payrolls$1).some((p) => p.employeeId === employee.id && p.period === period)) {
			skipped++;
			continue;
		}
		const record = {
			...computePayroll(employee, period),
			id: nextId(),
			status: "draft",
			createdDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
			note: ""
		};
		payrolls$1.unshift(record);
		created.push(record);
	}
	if (created.length > 0) logActivity({
		action: "Ish haqi hisoblandi",
		details: `${period} · ${created.length} ta xodim`,
		icon: "WalletCards"
	});
	const response = {
		success: true,
		data: created,
		message: created.length === 0 ? "Bu davr uchun barcha xodimlarga ish haqi allaqachon hisoblangan" : `${created.length} ta xodim uchun ish haqi hisoblandi${skipped > 0 ? ` (${skipped} tasi allaqachon mavjud)` : ""}`
	};
	res.status(201).json(response);
};
var updateSchema = z.object({
	bonus: z.coerce.number().min(0, "bonus manfiy bo'lishi mumkin emas").optional(),
	penalty: z.coerce.number().min(0, "jarima manfiy bo'lishi mumkin emas").optional(),
	status: z.enum(PAYROLL_STATUSES).optional(),
	note: z.string().trim().optional()
});
/**
* Ish haqini yangilaydi. Bonus yoki jarima o'zgarsa, soliq va yakuniy summa
* qayta hisoblanadi. To'langan yozuvni tahrirlab bo'lmaydi (moliyaviy yaxlitlik).
*/
var updatePayroll = (req, res) => {
	const parsed = updateSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const payroll = payrolls$1.find((p) => p.id === paramId(req) && !p.deletedAt);
	if (!payroll) return sendNotFound(res, "Ish haqi yozuvi topilmadi");
	if (payroll.status === "paid" && parsed.data.status !== "paid") return res.status(409).json({
		success: false,
		message: "To'langan ish haqini o'zgartirib bo'lmaydi"
	});
	if (parsed.data.bonus !== void 0 || parsed.data.penalty !== void 0) {
		const employee = active(employees$1).find((e) => e.id === payroll.employeeId);
		const recomputed = computePayroll({
			id: payroll.employeeId,
			name: payroll.employeeName,
			department: payroll.department,
			salary: employee?.salary ?? payroll.baseSalary
		}, payroll.period, {
			bonus: parsed.data.bonus ?? payroll.bonus,
			penalty: parsed.data.penalty ?? payroll.penalty
		});
		payroll.bonus = recomputed.bonus;
		payroll.penalty = recomputed.penalty;
		payroll.tax = recomputed.tax;
		payroll.netSalary = recomputed.netSalary;
	}
	if (parsed.data.status) payroll.status = parsed.data.status;
	if (parsed.data.note !== void 0) payroll.note = parsed.data.note;
	logActivity({
		action: parsed.data.status === "paid" ? "Ish haqi to'landi" : "Ish haqi yangilandi",
		details: `${payroll.employeeName} · ${payroll.period}`,
		icon: parsed.data.status === "paid" ? "WalletCards" : "PenLine"
	});
	const response = {
		success: true,
		data: payroll,
		message: "Ish haqi yangilandi"
	};
	res.json(response);
};
var deletePayroll = (req, res) => {
	const payroll = payrolls$1.find((p) => p.id === paramId(req) && !p.deletedAt);
	if (!payroll) return sendNotFound(res, "Ish haqi yozuvi topilmadi");
	if (payroll.status === "paid") return res.status(409).json({
		success: false,
		message: "To'langan ish haqini o'chirib bo'lmaydi"
	});
	softRemove(payrolls$1, paramId(req));
	logActivity({
		action: "Ish haqi o'chirildi",
		details: `${payroll.employeeName} · ${payroll.period}`,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Ish haqi yozuvi o'chirildi"
	});
};
//#endregion
//#region server/routes/sales.ts
var saleItemSchema = z.object({
	productId: z.string(),
	productName: z.string(),
	quantity: z.number().positive(),
	unitPrice: z.number().positive(),
	total: z.number(),
	discount: z.number().optional().default(0)
});
var createSaleSchema = z.object({
	customerId: z.string().nullable().optional(),
	customerName: z.string().nullable().optional(),
	customerPhone: z.string().nullable().optional(),
	items: z.array(saleItemSchema).min(1, "Kamida 1 ta mahsulot kerak"),
	subtotal: z.number().positive(),
	discount: z.number().optional().default(0),
	tax: z.number().optional().default(0),
	total: z.number().positive(),
	paymentMethod: z.enum([
		"cash",
		"card",
		"transfer",
		"credit",
		"mixed"
	]),
	sellerId: z.string(),
	sellerName: z.string(),
	branchId: z.string(),
	branchName: z.string(),
	note: z.string().optional().default("")
});
var refundSchema = z.object({
	originalSaleId: z.string(),
	items: z.array(saleItemSchema).min(1, "Kamida 1 ta mahsulot kerak"),
	refundReason: z.string().min(1, "Qaytarish sababini kiriting"),
	paymentMethod: z.enum([
		"cash",
		"card",
		"transfer"
	])
});
/** Sotuvlar statistikasi */
var getSalesStats = (_req, res) => {
	const activeSales = active(sales);
	const now = /* @__PURE__ */ new Date();
	const today = now.toISOString().split("T")[0];
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
	const todaySales = activeSales.filter((s) => s.saleDate.startsWith(today));
	const monthSales = activeSales.filter((s) => {
		const saleDate = s.saleDate.split("T")[0];
		return saleDate >= startOfMonth && saleDate <= endOfMonth;
	});
	const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
	const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0);
	const productStats = /* @__PURE__ */ new Map();
	monthSales.forEach((sale) => {
		sale.items.forEach((item) => {
			const existing = productStats.get(item.productId);
			if (existing) {
				existing.quantity += item.quantity;
				existing.revenue += item.total;
			} else productStats.set(item.productId, {
				productId: item.productId,
				productName: item.productName,
				quantity: item.quantity,
				revenue: item.total
			});
		});
	});
	const topProducts = Array.from(productStats.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
	const sellerStats = /* @__PURE__ */ new Map();
	monthSales.forEach((sale) => {
		const existing = sellerStats.get(sale.sellerId);
		if (existing) {
			existing.salesCount++;
			existing.revenue += sale.total;
		} else sellerStats.set(sale.sellerId, {
			sellerId: sale.sellerId,
			sellerName: sale.sellerName,
			salesCount: 1,
			revenue: sale.total
		});
	});
	const topSellers = Array.from(sellerStats.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
	const response = {
		success: true,
		data: {
			todaySales: todayTotal,
			todayTransactions: todaySales.length,
			monthSales: monthTotal,
			monthTransactions: monthSales.length,
			topProducts,
			topSellers
		}
	};
	res.json(response);
};
/** Sotuvlar ro'yxati */
var getSales = (req, res) => {
	const { page = "1", limit = "20", search = "", status = "" } = req.query;
	let filtered = active(sales);
	if (search) {
		const searchLower = String(search).toLowerCase();
		filtered = filtered.filter((s) => s.saleNumber.toLowerCase().includes(searchLower) || s.customerName?.toLowerCase().includes(searchLower) || s.customerPhone?.includes(searchLower));
	}
	if (status && status !== "__all__") filtered = filtered.filter((s) => s.status === status);
	filtered.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
	const pageNum = parseInt(String(page), 10);
	const limitNum = parseInt(String(limit), 10);
	const start = (pageNum - 1) * limitNum;
	const end = start + limitNum;
	const response = {
		success: true,
		data: filtered.slice(start, end),
		pagination: {
			page: pageNum,
			pages: Math.ceil(filtered.length / limitNum),
			total: filtered.length
		}
	};
	res.json(response);
};
/** Yangi sotuv yaratish */
var createSale = (req, res) => {
	const parsed = createSaleSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const { items, ...saleData } = parsed.data;
	for (const item of items) {
		const product = products$1.find((p) => p.id === item.productId && !p.deletedAt);
		if (!product) return res.status(400).json({
			success: false,
			message: `Mahsulot topilmadi: ${item.productName}`
		});
		if (product.quantity < item.quantity) return res.status(400).json({
			success: false,
			message: `${product.name} uchun yetarli qoldiq yo'q. Mavjud: ${product.quantity}`
		});
	}
	const saleNumber = `S-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(sales.length + 1).padStart(6, "0")}`;
	const sale = {
		id: nextId(),
		saleNumber,
		...saleData,
		items,
		status: "completed",
		saleDate: (/* @__PURE__ */ new Date()).toISOString(),
		receiptPrinted: true
	};
	sales.push(sale);
	for (const item of items) {
		const product = products$1.find((p) => p.id === item.productId);
		if (product) applyStockChange(product, -item.quantity, {
			reason: "Sotuv",
			reference: saleNumber,
			type: "out"
		});
	}
	logActivity({
		action: "Yangi sotuv",
		details: `${saleNumber} - ${saleData.total.toLocaleString()} so'm`,
		icon: "ShoppingCart"
	});
	const response = {
		success: true,
		data: sale,
		message: "Sotuv muvaffaqiyatli yaratildi"
	};
	res.json(response);
};
/** Sotuvni qaytarish (refund) */
var refundSale = (req, res) => {
	const { id } = req.params;
	const parsed = refundSchema.safeParse(req.body);
	if (!parsed.success) return sendValidationError(res, parsed.error);
	const sale = sales.find((s) => s.id === id && !s.deletedAt);
	if (!sale) return res.status(404).json({
		success: false,
		message: "Sotuv topilmadi"
	});
	if (sale.status === "refunded") return res.status(400).json({
		success: false,
		message: "Bu sotuv allaqachon qaytarilgan"
	});
	const { items, refundReason, paymentMethod } = parsed.data;
	const refundAmount = items.reduce((sum, item) => sum + item.total, 0);
	const refundNumber = `R-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(refunds.length + 1).padStart(6, "0")}`;
	const refund = {
		id: nextId(),
		refundNumber,
		originalSaleId: sale.id,
		originalSaleNumber: sale.saleNumber,
		items,
		refundAmount,
		refundReason,
		processedById: req.currentUser.id,
		processedByName: req.currentUser.name,
		refundDate: (/* @__PURE__ */ new Date()).toISOString(),
		paymentMethod,
		status: "completed"
	};
	refunds.push(refund);
	sale.status = items.length === sale.items.length && items.every((item) => sale.items.find((si) => si.productId === item.productId && si.quantity === item.quantity)) ? "refunded" : "partial_refund";
	for (const item of items) {
		const product = products$1.find((p) => p.id === item.productId);
		if (product) applyStockChange(product, item.quantity, {
			reason: "Sotuv qaytarildi",
			reference: refundNumber,
			type: "in"
		});
	}
	logActivity({
		action: "Sotuv qaytarildi",
		details: `${sale.saleNumber} - ${refundAmount.toLocaleString()} so'm`,
		icon: "ArrowDownRight"
	});
	const response = {
		success: true,
		data: refund,
		message: "Sotuv qaytarildi"
	};
	res.json(response);
};
/** Sotuvni o'chirish (soft delete) */
var deleteSale = (req, res) => {
	const { id } = req.params;
	const sale = sales.find((s) => s.id === id && !s.deletedAt);
	if (!sale) return res.status(404).json({
		success: false,
		message: "Sotuv topilmadi"
	});
	if (sale.status === "completed") return res.status(400).json({
		success: false,
		message: "Tugallangan sotuvni o'chirish mumkin emas. Qaytarish (refund) qiling."
	});
	sale.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
	logActivity({
		action: "Sotuv o'chirildi",
		details: sale.saleNumber,
		icon: "Trash2"
	});
	res.json({
		success: true,
		data: null,
		message: "Sotuv o'chirildi"
	});
};
//#endregion
//#region server/index.ts
/**
* JSON matnini xavfsiz parslaydi — noto'g'ri yoki bo'sh matn xato o'rniga bo'sh
* obyekt qaytaradi. Shunda buzilgan body butun so'rovni yiqitmaydi.
*/
function safeJson(text) {
	const trimmed = text.trim();
	if (!trimmed) return {};
	try {
		const parsed = JSON.parse(trimmed);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
/**
* Environment variables validatsiyasi.
* Production'da kritik sozlamalarning mavjudligini tekshiradi.
*/
function validateEnvironment() {
	if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
		logger.error("⚠️  JWT_SECRET o'rnatilmagan yoki juda qisqa!");
		logger.error("   Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
		throw new Error("JWT_SECRET environment variable majburiy (production)");
	}
	if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
		logger.error("⚠️  JWT_REFRESH_SECRET o'rnatilmagan yoki juda qisqa!");
		throw new Error("JWT_REFRESH_SECRET environment variable majburiy (production)");
	}
	if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 8) {
		logger.error("⚠️  ADMIN_PASSWORD o'rnatilmagan yoki juda qisqa!");
		throw new Error("ADMIN_PASSWORD environment variable majburiy (production)");
	}
	if (!process.env.DATABASE_PATH) logger.warn("⚠️  DATABASE_PATH o'rnatilmagan, default path ishlatiladi: ./data/app.db");
	logger.info("✅ Environment validation muvaffaqiyatli");
}
function createServer() {
	validateEnvironment();
	purgeExpiredSessions().catch((error) => logger.error("Muddati o'tgan sessiyalarni tozalashda xatolik:", error));
	startBackupScheduler();
	const app = express();
	app.use(helmet({
		contentSecurityPolicy: false,
		crossOriginEmbedderPolicy: false
	}));
	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
		"http://localhost:5173",
		"http://localhost:8080",
		"http://localhost:8081"
	];
	app.use(cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			const isVercelDomain = origin.includes(".vercel.app") || origin.includes("vercel.com");
			if (allowedOrigins.includes(origin) || isVercelDomain) callback(null, true);
			else {
				logger.warn(`CORS blocked origin: ${origin}`);
				callback(/* @__PURE__ */ new Error("CORS policy: Origin not allowed"));
			}
		},
		credentials: true
	}));
	/**
	* Ma'lumotlar ombori tayyor ekanini kafolatlaydi va (PostgreSQL rejimida)
	* har bir so'rov boshida boshqa serverless instance'lar yozgan eng so'nggi
	* holatni qayta yuklaydi. Vercel'da har bir konteynerning o'z vaqtinchalik
	* xotirasi bor va ular bir-birining yozganini avtomatik ko'rmaydi — shu
	* sabab masalan mahsulot qoldig'i turli so'rovlarda turlicha ko'rinardi.
	* Mahalliy SQLite rejimida `reloadStore` hech narsa qilmaydi (keraksiz).
	* CORS'dan keyin turadi — shu tufayli xatolik javobi ham to'g'ri header bilan boradi.
	*/
	app.use((req, res, next) => {
		ensureStoreReady().then(() => reloadStore()).then(() => next()).catch((error) => next(error));
	});
	const limiter = rateLimit({
		windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
		max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
		message: {
			success: false,
			message: "Juda ko'p so'rov yuborildi, keyinroq urinib ko'ring"
		},
		standardHeaders: true,
		legacyHeaders: false
	});
	const authLimiter = rateLimit({
		windowMs: 900 * 1e3,
		max: 5,
		message: {
			success: false,
			message: "Juda ko'p login urinishi, 15 daqiqadan keyin urinib ko'ring"
		},
		skipSuccessfulRequests: true
	});
	app.use("/api", limiter);
	app.use((req, res, next) => {
		const start = Date.now();
		res.on("finish", () => {
			logRequest(req, res, Date.now() - start);
		});
		next();
	});
	app.use((req, _res, next) => {
		if (req.method === "GET" || req.method === "HEAD") return next();
		const raw = req.body;
		if (typeof raw === "string" || Buffer.isBuffer(raw)) {
			req.body = safeJson(Buffer.isBuffer(raw) ? raw.toString("utf8") : raw);
			return next();
		}
		if (raw && typeof raw === "object" && Object.keys(raw).length > 0) return next();
		if (req.readableEnded || req.readable === false) {
			req.body = raw && typeof raw === "object" ? raw : {};
			return next();
		}
		let data = "";
		req.setEncoding("utf8");
		req.on("data", (chunk) => {
			data += chunk;
		});
		req.on("end", () => {
			req.body = safeJson(data);
			next();
		});
		req.on("error", () => {
			req.body = {};
			next();
		});
	});
	/**
	* Ma'lumotni o'zgartiradigan har bir muvaffaqiyatli so'rovdan keyin holat
	* bazaga yoziladi va (autentifikatsiya qilingan /api so'rovlar uchun) audit
	* jurnaliga yozuv qo'shiladi — javob mijozga jo'natilishidan OLDIN.
	*
	* Muhim: Vercel javob jo'natilgach funksiya jarayonini darhol to'xtatib
	* qo'yishi mumkin, shuning uchun "javobdan keyin fon vazifasi" ishonchli
	* emas — saqlash tugamaguncha javob jo'natilmaydi. Bitta joyda turgani
	* uchun hech bir route buni chaqirishni unutib qo'ymaydi.
	*/
	app.use((req, res, next) => {
		if (req.method === "GET" || req.method === "HEAD") return next();
		const originalEnd = res.end.bind(res);
		let finalizing = false;
		res.end = (...args) => {
			if (finalizing || res.statusCode >= 400) return originalEnd(...args);
			finalizing = true;
			const shouldAudit = req.path.startsWith("/api") && !req.path.startsWith("/api/audit") && !!req.currentUser;
			Promise.resolve().then(() => persist()).then(() => {
				if (!shouldAudit) return;
				const apiPath = req.originalUrl.replace(/^\/api/, "").split("?")[0];
				return recordAudit({
					user: req.currentUser,
					action: auditActionFor(req.method),
					entity: auditEntityFor(apiPath),
					entityId: extractIdFromPath(apiPath),
					summary: auditSummary(req.method, apiPath),
					ip: clientIp(req)
				});
			}).catch((error) => {
				console.error("Bazaga saqlashda xatolik:", error);
			}).finally(() => {
				originalEnd(...args);
			});
			return res;
		};
		next();
	});
	app.get("/health", (_req, res) => {
		res.json({
			status: "ok",
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			uptime: process.uptime(),
			environment: "production"
		});
	});
	app.get("/api/ping", (_req, res) => {
		const ping = process.env.PING_MESSAGE ?? "ping";
		res.json({ message: ping });
	});
	app.get("/api/demo", handleDemo);
	app.post("/api/auth/login", authLimiter, login);
	app.post("/api/auth/logout", logout);
	/**
	* Shu qatordan keyingi barcha /api yo'llari himoyalangan.
	* Yagona joyda turgani uchun yangi route qo'shilganda himoyani
	* ulashni unutib qo'yish mumkin emas.
	*/
	app.use("/api", requireAuth);
	app.get("/api/auth/me", getCurrentUser);
	app.use("/api/sales", requireModule("sales"));
	app.get("/api/sales/stats", getSalesStats);
	app.get("/api/sales", getSales);
	app.post("/api/sales", createSale);
	app.post("/api/sales/:id/refund", refundSale);
	app.delete("/api/sales/:id", deleteSale);
	app.post("/api/auth/change-password", changePassword);
	/**
	* RBAC — modul prefiksi bo'yicha rol tekshiruvi (TZ 12, 14-bo'lim).
	* `requireAuth` dan keyin, route'lardan oldin turadi: GET → ko'rish huquqi,
	* qolgan metodlar → boshqarish huquqi talab qilinadi.
	* Har bir yangi route avtomatik himoyalanadi — alohida ulash shart emas.
	*/
	app.use("/api/dashboard", requireModule("dashboard"));
	app.use("/api/finance", requireModule("finance"));
	app.use("/api/hr", requireModule("hr"));
	app.use("/api/attendance", requireModule("hr"));
	app.use("/api/leave", requireModule("hr"));
	app.use("/api/payroll", requireModule("hr"));
	app.use("/api/warehouse", requireModule("warehouse"));
	app.use("/api/purchases", requireModule("warehouse"));
	app.use("/api/suppliers", requireModule("warehouse"));
	app.use("/api/crm", requireModule("crm"));
	app.use("/api/orders", requireModule("crm"));
	app.use("/api/customers", requireModule("crm"));
	app.use("/api/debts", requireModule("crm"));
	app.use("/api/reports", requireModule("reports"));
	app.use("/api/users", requireModule("users"));
	app.use("/api/audit-logs", requireModule("audit"));
	app.get("/api/dashboard/stats", getDashboardStats);
	app.get("/api/dashboard/trend", getRevenueTrend);
	app.get("/api/dashboard/activities", getRecentActivities);
	app.get("/api/dashboard/alerts", getAlerts);
	app.get("/api/finance/stats", getFinanceStats);
	app.get("/api/finance/breakdown", getFinanceBreakdown);
	app.get("/api/finance/categories", getTransactionCategories);
	app.get("/api/finance/transactions/export", exportTransactions);
	app.get("/api/finance/transactions", getTransactions);
	app.post("/api/finance/transactions", createTransaction);
	app.put("/api/finance/transactions/:id", updateTransaction);
	app.delete("/api/finance/transactions/:id", deleteTransaction);
	app.get("/api/hr/stats", getHRStats);
	app.get("/api/hr/breakdown", getHRBreakdown);
	app.get("/api/hr/departments", getDepartments);
	app.get("/api/hr/employees", getEmployees);
	app.post("/api/hr/employees", createEmployee);
	app.put("/api/hr/employees/:id", updateEmployee);
	app.delete("/api/hr/employees/:id", deleteEmployee);
	app.get("/api/warehouse/stats", getWarehouseStats);
	app.get("/api/warehouse/breakdown", getWarehouseBreakdown);
	app.get("/api/warehouse/filters", getProductFilters);
	app.get("/api/warehouse/movements", getStockMovements);
	app.get("/api/warehouse/products", getProducts);
	app.post("/api/warehouse/products", createProduct);
	app.post("/api/warehouse/restock", restockLowProducts);
	app.post("/api/warehouse/products/:id/adjust", adjustStock);
	app.put("/api/warehouse/products/:id", updateProduct);
	app.delete("/api/warehouse/products/:id", deleteProduct);
	app.get("/api/customers/stats", getCustomerStats);
	app.get("/api/customers/regions", getCustomerRegions);
	app.get("/api/customers", getCustomers);
	app.get("/api/customers/:id", getCustomerDetail);
	app.post("/api/customers", createCustomer);
	app.put("/api/customers/:id", updateCustomer);
	app.delete("/api/customers/:id", deleteCustomer);
	app.get("/api/suppliers/stats", getSupplierStats);
	app.get("/api/suppliers/categories", getSupplierCategories);
	app.get("/api/suppliers", getSuppliers);
	app.get("/api/suppliers/:id", getSupplierDetail);
	app.get("/api/suppliers/:id/purchases", getSupplierPurchases);
	app.get("/api/suppliers/:id/products", getSupplierProducts);
	app.get("/api/suppliers/:id/returns", getSupplierReturns);
	app.get("/api/suppliers/:id/financial", getSupplierFinancial);
	app.get("/api/suppliers/:id/stats", getSupplierKPI);
	app.post("/api/suppliers", createSupplier);
	app.post("/api/suppliers/:id/return", returnProductToSupplier);
	app.put("/api/suppliers/:id", updateSupplier);
	app.patch("/api/suppliers/:id/restore", restoreSupplier);
	app.delete("/api/suppliers/:id", deleteSupplier);
	app.use("/api/branches", requireModule("dashboard"));
	app.get("/api/branches/stats", getBranchStats);
	app.get("/api/branches", getBranches);
	app.post("/api/branches", createBranch);
	app.put("/api/branches/:id", updateBranch);
	app.delete("/api/branches/:id", deleteBranch);
	app.get("/api/orders/stats", getOrderStats);
	app.get("/api/orders/breakdown", getOrderBreakdown);
	app.get("/api/orders", getOrders);
	app.get("/api/orders/:id", getOrderDetail);
	app.post("/api/orders", createOrder);
	app.put("/api/orders/:id", updateOrder);
	app.delete("/api/orders/:id", deleteOrder);
	app.get("/api/crm/stats", getCRMStats);
	app.get("/api/crm/breakdown", getCRMBreakdown);
	app.get("/api/crm/funnel", getDealFunnel);
	app.get("/api/crm/deals", getDeals);
	app.post("/api/crm/deals", createDeal);
	app.put("/api/crm/deals/:id", updateDeal);
	app.delete("/api/crm/deals/:id", deleteDeal);
	app.get("/api/purchases/stats", getPurchaseStats);
	app.get("/api/purchases", getPurchases);
	app.post("/api/purchases", createPurchase);
	app.put("/api/purchases/:id", updatePurchase);
	app.delete("/api/purchases/:id", deletePurchase);
	app.get("/api/debts/stats", getDebtStats);
	app.get("/api/debts/customers", getCustomerDebts);
	app.get("/api/debts/customers/:customerId/history", getCustomerDebtHistory);
	app.get("/api/debts/payments", getDebtPayments);
	app.post("/api/debts/payments", createDebtPayment);
	app.delete("/api/debts/customers/:customerId", clearCustomerDebt);
	app.get("/api/attendance/stats", getAttendanceStats);
	app.get("/api/attendance", getAttendance);
	app.post("/api/attendance", markAttendance);
	app.delete("/api/attendance/clear", clearAllAttendance);
	app.get("/api/leave/stats", getLeaveStats);
	app.get("/api/leave", getLeaveRequests);
	app.post("/api/leave", createLeaveRequest);
	app.put("/api/leave/:id", updateLeaveRequest);
	app.delete("/api/leave/:id", deleteLeaveRequest);
	app.get("/api/payroll/stats", getPayrollStats);
	app.get("/api/payroll/periods", getPayrollPeriods);
	app.get("/api/payroll", getPayrolls);
	app.post("/api/payroll/calculate", calculatePayroll);
	app.put("/api/payroll/:id", updatePayroll);
	app.delete("/api/payroll/:id", deletePayroll);
	app.get("/api/users/stats", getUserStats);
	app.get("/api/users/roles", getRolePermissions);
	app.get("/api/users", getUsers);
	app.post("/api/users", createUser);
	app.put("/api/users/:id", updateUser);
	app.delete("/api/users/:id", deleteUser);
	app.get("/api/reports/summary", getReportSummary);
	app.get("/api/reports/export", exportReport);
	app.get("/api/audit-logs/stats", getAuditStats);
	app.get("/api/audit-logs", getAuditLogs);
	app.use("/api", (_req, res) => {
		res.status(404).json({
			success: false,
			message: "Endpoint topilmadi"
		});
	});
	const errorHandler = (error, req, res, _next) => {
		logger.error("Server xatosi:", {
			error: error.message,
			stack: error.stack,
			method: req.method,
			url: req.originalUrl,
			body: req.body
		});
		console.error("❌ SERVER ERROR:", {
			message: error.message,
			stack: error.stack,
			url: req.originalUrl,
			method: req.method
		});
		return res.status(error.status || 500).json({
			success: false,
			message: "Ichki server xatosi. Iltimos, keyinroq urinib ko'ring.",
			error: error.message
		});
	};
	app.use(errorHandler);
	return app;
}
//#endregion
//#region server/vercel-handler.ts
/**
* Vercel serverless handler — Express ilovasining o'zi `(req, res)` funksiyasi,
* shuning uchun uni to'g'ridan-to'g'ri qaytaramiz. Body'ni Express o'zi o'qiydi
* (`server/index.ts` dagi maxsus body-parser Vercel muhitini ham qamraydi).
*/
var app = createServer();
//#endregion
export { app as default };
