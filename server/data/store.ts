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
import { isEmpty, readTable, writeTable, USE_POSTGRES, TableName } from "./db";
import { pgIsEmpty, pgReadTable, pgWriteTable } from "./db-postgres";
import { DEFAULT_PASSWORD, hashPassword } from "../lib/auth";

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

export const employees: Employee[] = [];
export const products: Product[] = [];
export const customers: Customer[] = [];
export const suppliers: Supplier[] = [];
export const branches: Branch[] = [];
export const orders: Order[] = [];
export const purchases: Purchase[] = [];
export const invoices: Invoice[] = [];
export const attendance: AttendanceRecord[] = [];
export const leaveRequests: LeaveRequest[] = [];
export const users: StoredUser[] = [];
export const movements: StockMovement[] = [];
export const deals: Deal[] = [];
export const payrolls: Payroll[] = [];
export const transactions: Transaction[] = [];
export const activities: Activity[] = [];
export const debtPayments: DebtPayment[] = [];
export const sales: Sale[] = [];
export const refunds: Refund[] = [];
export const supplierReturns: any[] = [];

/** Massiv referensiyasini saqlab, ichidagi qatorlarni to'liq almashtiradi. */
function replaceContents<T>(target: T[], fresh: T[]): void {
  target.length = 0;
  target.push(...fresh);
}

async function loadTable<T>(table: TableName): Promise<T[]> {
  return USE_POSTGRES ? pgReadTable<T>(table) : readTable<T>(table);
}

async function saveTable(table: TableName, rows: readonly object[]): Promise<void> {
  if (USE_POSTGRES) {
    await pgWriteTable(table, rows);
  } else {
    writeTable(table, rows);
  }
}

async function loadAllTables(): Promise<void> {
  replaceContents(employees, await loadTable<Employee>("employees"));
  replaceContents(products, await loadTable<Product>("products"));
  replaceContents(customers, await loadTable<Customer>("customers"));
  replaceContents(suppliers, await loadTable<Supplier>("suppliers"));
  replaceContents(branches, await loadTable<Branch>("branches"));
  replaceContents(orders, await loadTable<Order>("orders"));
  replaceContents(purchases, await loadTable<Purchase>("purchases"));
  replaceContents(invoices, await loadTable<Invoice>("invoices"));
  replaceContents(attendance, await loadTable<AttendanceRecord>("attendance"));
  replaceContents(leaveRequests, await loadTable<LeaveRequest>("leave_requests"));
  replaceContents(users, await loadTable<StoredUser>("users"));
  replaceContents(movements, await loadTable<StockMovement>("movements"));
  replaceContents(deals, await loadTable<Deal>("deals"));
  replaceContents(payrolls, await loadTable<Payroll>("payrolls"));
  replaceContents(transactions, await loadTable<Transaction>("transactions"));
  replaceContents(activities, await loadTable<Activity>("activities"));
  replaceContents(debtPayments, await loadTable<DebtPayment>("debt_payments"));
  replaceContents(sales, await loadTable<Sale>("sales"));
  replaceContents(refunds, await loadTable<Refund>("refunds"));
  replaceContents(supplierReturns, await loadTable<any>("supplier_returns"));
}

/**
 * Xotiradagi holatni bazaga yozadi.
 * Har bir o'zgartiruvchi so'rov javobi jo'natilishidan OLDIN chaqiriladi
 * (`server/index.ts`) — Vercel javob jo'natilgach funksiyani darhol
 * to'xtatib qo'yishi mumkin, shu sabab yozish "fire-and-forget" emas.
 */
export async function persist(): Promise<void> {
  await saveTable("employees", employees);
  await saveTable("products", products);
  await saveTable("customers", customers);
  await saveTable("suppliers", suppliers);
  await saveTable("branches", branches);
  await saveTable("orders", orders);
  await saveTable("purchases", purchases);
  await saveTable("invoices", invoices);
  await saveTable("attendance", attendance);
  await saveTable("leave_requests", leaveRequests);
  await saveTable("users", users);
  await saveTable("movements", movements);
  await saveTable("deals", deals);
  await saveTable("payrolls", payrolls);
  await saveTable("transactions", transactions);
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
export async function reloadStore(): Promise<void> {
  if (!USE_POSTGRES) return;
  await loadAllTables();
}

let readyPromise: Promise<void> | null = null;

/**
 * Ombor birinchi marta ishlatilishidan oldin (server ishga tushganda yoki
 * Vercel funksiyasi "sovuq" boshlanganda) bir marta chaqiriladi. Keyingi
 * chaqiruvlar xotiradagi (allaqachon bajarilgan) promise'ni qaytaradi.
 */
export function ensureStoreReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = initStore().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

async function initStore(): Promise<void> {
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
  } else {
    console.log("✅ Database already contains data");
  }

  console.log("📖 Reading tables from database...");
  await loadAllTables();
  console.log("✅ Tables loaded successfully");
  console.log(
    `📊 Data counts: users=${users?.length || 0}, employees=${employees?.length || 0}, products=${products?.length || 0}`,
  );

  /**
   * Auth qo'shilishidan oldin yaratilgan bazada parol hash'i bo'sh bo'ladi.
   * Bunday hisoblarga standart parol beriladi, aks holda hech kim kira olmaydi.
   */
  const usersMissingPassword = users.filter((user) => !user.passwordHash);
  if (usersMissingPassword.length > 0) {
    for (const user of usersMissingPassword) {
      user.passwordHash = hashPassword(DEFAULT_PASSWORD);
    }
    await saveTable("users", users);
    console.info(
      `${usersMissingPassword.length} ta hisobga standart parol o'rnatildi: ${DEFAULT_PASSWORD}`,
    );
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
async function ensureAdminUser(): Promise<void> {
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
      (u) => u.email === ADMIN_EMAIL || u.login === "admin" || u.role === "admin",
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
      await saveTable("users", users);
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
      await saveTable("users", users);
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
    const verifyAdmin = users.find((u) => u.login === "admin" || u.email === ADMIN_EMAIL);
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
        role: verifyAdmin.role,
      });
    }
  } catch (adminError) {
    console.error("❌ CRITICAL: Admin initialization failed!");
    console.error("Error:", adminError);
    throw adminError;
  }
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
