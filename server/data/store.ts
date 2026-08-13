import {
  Activity,
  AttendanceRecord,
  Branch,
  Customer,
  Deal,
  DebtPayment,
  Employee,
  Invoice,
  LeaveRequest,
  Order,
  Payroll,
  Product,
  Purchase,
  Refund,
  Sale,
  StockMovement,
  Supplier,
  Transaction,
  StoredUser,
} from "@shared/api";
import { buildSeedData } from "./seed";
import { isEmpty, readTable, writeTable } from "./db";
import { DEFAULT_PASSWORD, hashPassword } from "../lib/auth";

/**
 * Yagona ma'lumotlar ombori. Barcha route'lar shu yerdan o'qiydi, shuning uchun
 * bir bo'limdagi o'zgarish boshqa bo'lim statistikasida ham darhol aks etadi.
 *
 * Massivlar — ish jarayonidagi nusxa (tez filtrlash uchun), SQLite esa doimiy manba:
 * server ishga tushganda bazadan yuklanadi, o'zgarishdan keyin `persist()` bilan
 * qayta yoziladi. Shu sababli kiritilgan yozuvlar qayta ishga tushirilgandan keyin
 * ham saqlanib qoladi.
 */

// Bo'sh baza — birinchi ishga tushirish. Demo ma'lumotlar bir marta yoziladi.
console.log("🔍 Checking database state...");
const dbEmpty = isEmpty();
console.log(`📊 Database empty: ${dbEmpty}`);

if (dbEmpty) {
  console.log("🌱 Seeding database with demo data...");
  try {
    const seed = buildSeedData();
    console.log("📝 Writing tables...");
    writeTable("employees", seed.employees);
    writeTable("products", seed.products);
    writeTable("customers", seed.customers);
    writeTable("suppliers", seed.suppliers);
    writeTable("branches", seed.branches);
    writeTable("orders", seed.orders);
    writeTable("purchases", seed.purchases);
    writeTable("invoices", seed.invoices);
    writeTable("attendance", seed.attendance);
    writeTable("leave_requests", seed.leaveRequests);
    writeTable("users", seed.users);
    writeTable("movements", seed.movements);
    writeTable("deals", seed.deals);
    writeTable("payrolls", seed.payrolls);
    writeTable("transactions", seed.transactions);
    writeTable("activities", seed.activities);
    console.log("✅ Database seeded successfully");
  } catch (seedError) {
    console.error("❌ Database seeding failed:", seedError);
    throw seedError;
  }
} else {
  console.log("✅ Database already contains data");
}

console.log("📖 Reading tables from database...");
export const employees: Employee[] = readTable<Employee>("employees");
export const products: Product[] = readTable<Product>("products");
export const customers: Customer[] = readTable<Customer>("customers");
export const suppliers: Supplier[] = readTable<Supplier>("suppliers");
export const branches: Branch[] = readTable<Branch>("branches");
export const orders: Order[] = readTable<Order>("orders");
export const purchases: Purchase[] = readTable<Purchase>("purchases");
export const invoices: Invoice[] = readTable<Invoice>("invoices");
export const attendance: AttendanceRecord[] = readTable<AttendanceRecord>("attendance");
export const leaveRequests: LeaveRequest[] = readTable<LeaveRequest>("leave_requests");
export const users: StoredUser[] = readTable<StoredUser>("users");
export const movements: StockMovement[] = readTable<StockMovement>("movements");
export const deals: Deal[] = readTable<Deal>("deals");
export const payrolls: Payroll[] = readTable<Payroll>("payrolls");
export const transactions: Transaction[] = readTable<Transaction>("transactions");
export const activities: Activity[] = readTable<Activity>("activities");
export const debtPayments: DebtPayment[] = readTable<DebtPayment>("debt_payments");
export const sales: Sale[] = readTable<Sale>("sales");
export const refunds: Refund[] = readTable<Refund>("refunds");
export const supplierReturns: any[] = readTable<any>("supplier_returns");

console.log("✅ Tables loaded successfully");
console.log(`📊 Data counts: users=${users?.length || 0}, employees=${employees?.length || 0}, products=${products?.length || 0}`);

/**
 * Auth qo'shilishidan oldin yaratilgan bazada parol hash'i bo'sh bo'ladi.
 * Bunday hisoblarga standart parol beriladi, aks holda hech kim kira olmaydi.
 */
const usersMissingPassword = users.filter((user) => !user.passwordHash);
if (usersMissingPassword.length > 0) {
  for (const user of usersMissingPassword) {
    user.passwordHash = hashPassword(DEFAULT_PASSWORD);
  }
  writeTable("users", users);
  console.info(
    `${usersMissingPassword.length} ta hisobga standart parol o'rnatildi: ${DEFAULT_PASSWORD}`,
  );
}

/**
 * Production deploymentda admin foydalanuvchini yaratish yoki yangilash.
 * Environment variable'lardan yoki hardcoded qiymatlardan olinadi.
 * 
 * DEPLOY UCHUN DEFAULT LOGIN (hardcoded - ishonchli):
 * Email: admin@orbiserp.uz
 * Parol: OrbisAdmin2024!
 */
const PRODUCTION_ADMIN_EMAIL = "admin@orbiserp.uz";
const PRODUCTION_ADMIN_PASSWORD = "OrbisAdmin2024!";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || PRODUCTION_ADMIN_EMAIL;
const ADMIN_PASSWORD_FROM_ENV = process.env.ADMIN_PASSWORD || PRODUCTION_ADMIN_PASSWORD;

console.log("🔐 Admin initialization:");
console.log("   Email from env:", process.env.ADMIN_EMAIL || "not set");
console.log("   Password from env:", process.env.ADMIN_PASSWORD ? "***" : "not set");
console.log("   Using Email:", ADMIN_EMAIL);
console.log("   Using Password:", ADMIN_PASSWORD_FROM_ENV ? "***" : "empty");
console.log("   Users array length:", users?.length || 0);

try {
  if (!ADMIN_PASSWORD_FROM_ENV) {
    console.error("❌ CRITICAL: Admin password not configured!");
    throw new Error("Admin password is required");
  }

  // Admin foydalanuvchini topish (email yoki login bo'yicha)
  let adminUser = users.find(
    (u) => u.email === ADMIN_EMAIL || u.login === "admin" || u.role === "admin"
  );

  console.log("🔍 Admin user search result:", adminUser ? "found" : "not found");

  if (!adminUser) {
    // Admin yo'q bo'lsa - yangi admin yaratish
    console.log("📝 Creating new admin user...");
    const now = new Date();
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
      passwordHash: hashPassword(ADMIN_PASSWORD_FROM_ENV),
    };
    users.push(adminUser);
    writeTable("users", users);
    console.info("✅ Admin foydalanuvchi yaratildi:", ADMIN_EMAIL);
    console.info("🔑 Admin login ma'lumotlari:");
    console.info(`   ID: ${newAdminId}`);
    console.info(`   Login: admin`);
    console.info(`   Email: ${ADMIN_EMAIL}`);
    console.info(`   Parol: ${ADMIN_PASSWORD_FROM_ENV}`);
    console.info(`   Password hash length: ${adminUser.passwordHash?.length || 0}`);
  } else {
    // Admin mavjud - parolni yangilash
    console.log("♻️ Updating existing admin user...");
    const oldHash = adminUser.passwordHash;
    adminUser.passwordHash = hashPassword(ADMIN_PASSWORD_FROM_ENV);
    adminUser.email = ADMIN_EMAIL;
    adminUser.login = "admin";
    adminUser.role = "admin";
    adminUser.status = "active";
    writeTable("users", users);
    console.info("✅ Admin foydalanuvchi paroli yangilandi:", ADMIN_EMAIL);
    console.info("🔑 Admin login ma'lumotlari:");
    console.info(`   ID: ${adminUser.id}`);
    console.info(`   Login: ${adminUser.login}`);
    console.info(`   Email: ${ADMIN_EMAIL}`);
    console.info(`   Parol: ${ADMIN_PASSWORD_FROM_ENV}`);
    console.info(`   Old hash length: ${oldHash?.length || 0}`);
    console.info(`   New hash length: ${adminUser.passwordHash?.length || 0}`);
  }

  // Final verification
  const verifyAdmin = users.find(u => u.login === "admin" || u.email === ADMIN_EMAIL);
  if (!verifyAdmin) {
    console.error("❌ CRITICAL: Admin user not found after creation!");
  } else {
    console.log("✅ Admin user verification passed:", {
      id: verifyAdmin.id,
      login: verifyAdmin.login,
      email: verifyAdmin.email,
      hasPassword: !!verifyAdmin.passwordHash,
      passwordHashLength: verifyAdmin.passwordHash?.length || 0,
      status: verifyAdmin.status,
      role: verifyAdmin.role
    });
  }
} catch (adminError) {
  console.error("❌ CRITICAL: Admin initialization failed!");
  console.error("Error:", adminError);
  throw adminError;
}

/**
 * Xotiradagi holatni bazaga yozadi.
 * O'zgartiruvchi so'rovdan keyin chaqiriladi (`server/index.ts` dagi middleware).
 */
export function persist(): void {
  writeTable("employees", employees);
  writeTable("products", products);
  writeTable("customers", customers);
  writeTable("suppliers", suppliers);
  writeTable("branches", branches);
  writeTable("orders", orders);
  writeTable("purchases", purchases);
  writeTable("invoices", invoices);
  writeTable("attendance", attendance);
  writeTable("leave_requests", leaveRequests);
  writeTable("users", users);
  writeTable("movements", movements);
  writeTable("deals", deals);
  writeTable("payrolls", payrolls);
  writeTable("transactions", transactions);
  writeTable("activities", activities);
  writeTable("debt_payments", debtPayments);
  writeTable("sales", sales);
  writeTable("refunds", refunds);
  writeTable("supplier_returns", supplierReturns);
}

/** ID generatori — ketma-ket chaqiruvlarda takrorlanmasligi kafolatlanadi. */
let idCounter = Date.now();
export function nextId(): string {
  return (++idCounter).toString();
}

/** Faollik jurnaliga yangi yozuv qo'shadi (eng yangisi birinchi). */
export function logActivity(entry: {
  action: string;
  details: string;
  icon: string;
  userInitials?: string;
  userBgClass?: string;
}): void {
  activities.unshift({
    id: nextId(),
    userId: "user1",
    userInitials: entry.userInitials ?? "AZ",
    userBgClass: entry.userBgClass ?? "bg-[#def0ea] text-[#317b68]",
    action: entry.action,
    details: entry.details,
    timestamp: new Date().toISOString(),
    icon: entry.icon,
  });

  // Jurnal cheksiz o'smasligi uchun oxirgi 50 ta yozuv saqlanadi.
  if (activities.length > 50) activities.length = 50;
}

/**
 * Mahsulot qoldig'ini o'zgartiradi va harakatni jurnalga yozadi.
 * Qoldiq hech qachon manfiy bo'lmaydi — ombor hisobida bu mumkin emas.
 * `delta` musbat bo'lsa kirim, manfiy bo'lsa chiqim.
 */
export function applyStockChange(
  product: Product,
  delta: number,
  options: { reason: string; reference?: string; type?: StockMovement["type"] },
): StockMovement {
  product.quantity = Math.max(0, product.quantity + delta);

  const movement: StockMovement = {
    id: nextId(),
    productId: product.id,
    productName: product.name,
    type: options.type ?? (delta >= 0 ? "in" : "out"),
    quantity: Math.abs(delta),
    balanceAfter: product.quantity,
    reason: options.reason,
    reference: options.reference ?? "—",
    date: new Date().toISOString().split("T")[0],
  };

  movements.unshift(movement);
  // Jurnal cheksiz o'smasligi uchun oxirgi 500 ta harakat saqlanadi.
  if (movements.length > 500) movements.length = 500;

  return movement;
}

/** Soft-delete qo'llab-quvvatlaydigan yozuv — o'chirilgani `deletedAt` bilan belgilanadi. */
export interface SoftDeletable {
  id: string;
  deletedAt?: string | null;
}

/**
 * Yozuvni "arxivga" ko'chiradi — massivdan olib tashlamaydi, faqat `deletedAt`
 * belgisini qo'yadi (TZ 6, 8-bo'lim: soft delete). Shu sababli yozuv tarixi va
 * bog'liq hisobotlar buzilmaydi, kerak bo'lsa tiklash mumkin.
 * Allaqachon o'chirilgan bo'lsa null qaytaradi.
 */
export function softRemove<T extends SoftDeletable>(list: T[], id: string): T | null {
  const item = list.find((row) => row.id === id && !row.deletedAt);
  if (!item) return null;
  item.deletedAt = new Date().toISOString();
  return item;
}

/** O'chirilgan yozuvni qayta tiklaydi. */
export function restoreById<T extends SoftDeletable>(list: T[], id: string): T | null {
  const item = list.find((row) => row.id === id && row.deletedAt);
  if (!item) return null;
  item.deletedAt = null;
  return item;
}

/** Faqat o'chirilmagan yozuvlar. Ro'yxat va statistikalarda ishlatiladi. */
export function active<T extends SoftDeletable>(list: T[]): T[] {
  return list.filter((row) => !row.deletedAt);
}

/**
 * Yozuvni butunlay o'chiradi (arxivdan ham) — faqat maxsus hollarda.
 * Oddiy o'chirish `softRemove` orqali bo'ladi.
 */
export function removeById<T extends { id: string }>(
  list: T[],
  id: string,
): T | null {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  return list.splice(index, 1)[0];
}
