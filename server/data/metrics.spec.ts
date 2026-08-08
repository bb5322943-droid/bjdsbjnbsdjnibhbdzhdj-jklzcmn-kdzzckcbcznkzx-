import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AttendanceRecord,
  Deal,
  Employee,
  Product,
  Transaction,
} from "@shared/api";
import {
  attendanceStats,
  crmStats,
  dashboardStats,
  financeStats,
  hrStats,
  leaveStats,
  revenueTrend,
  warehouseStats,
} from "./metrics";
import {
  attendance,
  deals,
  employees,
  leaveRequests,
  products,
  transactions,
} from "./store";

/**
 * Store modul darajasidagi massivlardan iborat, shuning uchun har bir testdan oldin
 * uni ma'lum holatga keltiramiz va keyin asl holatiga qaytaramiz.
 */
const originals = {
  transactions: [...transactions],
  employees: [...employees],
  products: [...products],
  deals: [...deals],
  attendance: [...attendance],
  leaveRequests: [...leaveRequests],
};

function replace<T>(list: T[], items: T[]) {
  list.splice(0, list.length, ...items);
}

function restoreAll() {
  replace(transactions, originals.transactions);
  replace(employees, originals.employees);
  replace(products, originals.products);
  replace(deals, originals.deals);
  replace(attendance, originals.attendance);
  replace(leaveRequests, originals.leaveRequests);
}

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "t",
  title: "Test",
  category: "Boshqa",
  account: "Kassa · UZS",
  date: "2026-07-10",
  amount: 1000,
  type: "income",
  ...over,
});

const product = (over: Partial<Product>): Product => ({
  id: "p",
  name: "Test",
  location: "Asosiy ombor",
  quantity: 10,
  minQuantity: 5,
  price: 1000,
  category: "Boshqa",
  supplier: "Test",
  ...over,
});

const employee = (over: Partial<Employee>): Employee => ({
  id: "e",
  name: "Test",
  position: "Test",
  department: "IT",
  status: "active",
  salary: 1000,
  hireDate: "2026-07-01",
  email: "test@company.uz",
  phone: "",
  ...over,
});

const deal = (over: Partial<Deal>): Deal => ({
  id: "d",
  clientName: "Test",
  status: "new_lead",
  value: 1000,
  description: "",
  createdDate: "2026-07-01",
  expectedCloseDate: "2026-07-20",
  assignedTo: "Test",
  ...over,
});

beforeEach(() => {
  // Barcha "joriy oy" hisoblari shu sanaga nisbatan bo'ladi.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  restoreAll();
});

describe("financeStats", () => {
  it("balansni butun tarix bo'yicha, oylik ko'rsatkichni joriy oydan hisoblaydi", () => {
    replace(transactions, [
      tx({ id: "1", date: "2026-07-05", amount: 100, type: "income" }),
      tx({ id: "2", date: "2026-07-06", amount: 30, type: "expense" }),
      // O'tgan oy — balansga kiradi, "oylik" ko'rsatkichga kirmaydi.
      tx({ id: "3", date: "2026-06-10", amount: 500, type: "income" }),
    ]);

    const stats = financeStats();

    expect(stats.currentBalance).toBe(570);
    expect(stats.monthlyIncome).toBe(100);
    expect(stats.monthlyExpenses).toBe(30);
  });

  it("o'tgan oyda ma'lumot bo'lmasa foizni Infinity qilib qaytarmaydi", () => {
    replace(transactions, [tx({ date: "2026-07-05", amount: 100, type: "income" })]);

    expect(financeStats().balanceChange).toBe(100);
  });

  it("o'tgan oy nol, joriy oy zarar bo'lsa o'sish emas, pasayish ko'rsatadi", () => {
    // Faqat chiqim bor — oylik natija manfiy, shuning uchun "+100%" bo'lishi mumkin emas.
    replace(transactions, [tx({ date: "2026-07-05", amount: 100, type: "expense" })]);

    expect(financeStats().balanceChange).toBe(-100);
  });

  it("bo'sh store'da nol qaytaradi", () => {
    replace(transactions, []);

    const stats = financeStats();

    expect(stats.currentBalance).toBe(0);
    expect(stats.balanceChange).toBe(0);
  });
});

describe("dashboardStats", () => {
  it("foydani va o'tgan oyga nisbatan o'zgarishni hisoblaydi", () => {
    replace(transactions, [
      tx({ id: "1", date: "2026-07-05", amount: 200, type: "income" }),
      tx({ id: "2", date: "2026-07-06", amount: 50, type: "expense" }),
      tx({ id: "3", date: "2026-06-05", amount: 100, type: "income" }),
      tx({ id: "4", date: "2026-06-06", amount: 25, type: "expense" }),
    ]);
    replace(employees, []);

    const stats = dashboardStats();

    expect(stats.totalRevenue).toBe(200);
    expect(stats.netProfit).toBe(150);
    // O'tgan oy foydasi 75 edi → 150 ga o'sdi = +100%
    expect(stats.profitChange).toBe(100);
  });

  it("faqat 'active' xodimlarni sanaydi", () => {
    replace(transactions, []);
    replace(employees, [
      employee({ id: "1", status: "active" }),
      employee({ id: "2", status: "vacation" }),
      employee({ id: "3", status: "active" }),
    ]);

    expect(dashboardStats().activeEmployees).toBe(2);
  });
});

describe("revenueTrend", () => {
  it("oyning har bir kuni uchun nuqta qaytaradi, tranzaksiyasiz kunlar nol bo'ladi", () => {
    replace(transactions, [tx({ date: "2026-07-03", amount: 500, type: "income" })]);

    const trend = revenueTrend();

    expect(trend).toHaveLength(31);
    expect(trend[2]).toEqual({ label: "03", income: 500, expense: 0 });
    expect(trend[0]).toEqual({ label: "01", income: 0, expense: 0 });
  });
});

describe("warehouseStats", () => {
  it("qoldiq minimal chegaraga teng bo'lsa ham tanqis deb sanaydi", () => {
    replace(products, [
      product({ id: "1", quantity: 5, minQuantity: 5 }),
      product({ id: "2", quantity: 6, minQuantity: 5 }),
    ]);

    const stats = warehouseStats();

    expect(stats.lowStock).toBe(1);
    expect(stats.normalStock).toBe(1);
  });

  it("ombor qiymatini narx × qoldiq bo'yicha hisoblaydi", () => {
    replace(products, [
      product({ id: "1", quantity: 2, price: 1000 }),
      product({ id: "2", quantity: 3, price: 500 }),
    ]);

    expect(warehouseStats().warehouseValue).toBe(3500);
  });
});

describe("hrStats va attendanceStats", () => {
  /** Bugungi sana bilan davomat yozuvi. */
  function record(
    overrides: Partial<AttendanceRecord> & { id: string },
  ): AttendanceRecord {
    return {
      employeeId: "1",
      employeeName: "Test Xodim",
      department: "IT",
      date: new Date().toISOString().split("T")[0],
      status: "present",
      checkIn: "09:00",
      checkOut: "18:00",
      hours: 8,
      note: "",
      ...overrides,
    };
  }

  it("davomat foizini haqiqiy yozuvlardan hisoblaydi, bandlik holatidan emas", () => {
    replace(attendance, [
      record({ id: "1", status: "present" }),
      record({ id: "2", status: "remote" }),
      record({ id: "3", status: "late" }),
      record({ id: "4", status: "absent" }),
    ]);

    // Kelgan + masofadan + kechikkan = 3, kutilgan = 4 → 75%.
    expect(attendanceStats().attendanceRate).toBe(75);
    expect(hrStats().attendanceRate).toBe(75);
  });

  it("ta'tildagilarni davomat foizidan chiqarib tashlaydi", () => {
    replace(attendance, [
      record({ id: "1", status: "present" }),
      record({ id: "2", status: "leave" }),
      record({ id: "3", status: "leave" }),
    ]);

    // Ta'tildagilardan kelish kutilmaydi — foiz faqat 1 ta yozuvdan hisoblanadi.
    expect(attendanceStats().attendanceRate).toBe(100);
    expect(attendanceStats().onLeave).toBe(2);
  });

  it("yozuv yo'q bo'lsa nolga bo'lmaydi", () => {
    replace(attendance, []);

    expect(attendanceStats().attendanceRate).toBe(0);
  });

  it("ochiq vakansiyani shtat rejasidan hisoblaydi", () => {
    // Rejada Savdo bo'limi uchun 6 o'rin bor; 2 ta xodim bo'lsa 4 tasi ochiq.
    replace(employees, [
      employee({ id: "1", department: "Savdo" }),
      employee({ id: "2", department: "Savdo" }),
    ]);

    const stats = hrStats();

    expect(stats.totalEmployees).toBe(2);
    // Boshqa bo'limlar ham to'liq bo'sh, shuning uchun natija noldan katta bo'ladi.
    expect(stats.openPositions).toBeGreaterThan(0);
  });

  it("bugun ta'tilda bo'lganlarni tasdiqlangan so'rovlardan sanaydi", () => {
    const today = new Date().toISOString().split("T")[0];
    replace(leaveRequests, [
      {
        id: "1",
        employeeId: "1",
        employeeName: "Test Xodim",
        type: "vacation",
        startDate: today,
        endDate: today,
        days: 1,
        status: "approved",
        reason: "",
        requestedDate: today,
      },
      {
        id: "2",
        employeeId: "2",
        employeeName: "Boshqa Xodim",
        type: "vacation",
        startDate: today,
        endDate: today,
        days: 1,
        // Tasdiqlanmagan so'rov hisobga olinmaydi.
        status: "pending",
        reason: "",
        requestedDate: today,
      },
    ]);

    expect(hrStats().onVacationToday).toBe(1);
    expect(leaveStats().pending).toBe(1);
  });
});

describe("crmStats", () => {
  it("voronkaga faqat yopilmagan bitimlarni qo'shadi", () => {
    replace(deals, [
      deal({ id: "1", status: "new_lead", value: 100 }),
      deal({ id: "2", status: "negotiation", value: 200 }),
      deal({ id: "3", status: "closed_won", value: 5000 }),
      deal({ id: "4", status: "closed_lost", value: 9000 }),
    ]);

    expect(crmStats().totalPipeline).toBe(300);
  });

  it("bu oy yopilgan bitimlarni sanaydi", () => {
    replace(deals, [
      deal({ id: "1", status: "closed_won", expectedCloseDate: "2026-07-10" }),
      deal({ id: "2", status: "closed_won", expectedCloseDate: "2026-06-10" }),
      deal({ id: "3", status: "closed_lost", expectedCloseDate: "2026-07-11" }),
    ]);

    expect(crmStats().closedThisMonth).toBe(1);
  });
});
