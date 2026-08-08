import {
  AccountBalance,
  AttendanceRecord,
  AttendanceStats,
  CRMBreakdown,
  CRMStats,
  CategoryBreakdown,
  CustomerStats,
  DashboardStats,
  Deal,
  DepartmentBreakdown,
  FinanceBreakdown,
  FinanceStats,
  GroupValue,
  HRBreakdown,
  HRStats,
  Invoice,
  InvoiceStats,
  LeaveStats,
  Order,
  OrderBreakdown,
  OrderStats,
  Payroll,
  PayrollStats,
  ProfitLossRow,
  PurchaseStats,
  ReportSummary,
  RolePermission,
  SupplierStats,
  Transaction,
  TrendPoint,
  UserStats,
  WarehouseBreakdown,
  WarehouseStats,
} from "@shared/api";
import {
  active,
  attendance,
  customers as allCustomers,
  deals as allDeals,
  employees as allEmployees,
  invoices as allInvoices,
  leaveRequests,
  orders as allOrders,
  payrolls as allPayrolls,
  products as allProducts,
  purchases as allPurchases,
  suppliers as allSuppliers,
  transactions as allTransactions,
  users as allUsers,
} from "./store";

/**
 * Statistika faqat o'chirilmagan yozuvlardan hisoblanadi (soft delete).
 * Har chaqiruvda `active()` qo'llanadi — arxivdagi yozuvlar ko'rsatkichlarni
 * buzmaydi. `attendance` va `leaveRequests` jurnallari soft-delete emas.
 */
const customers = () => active(allCustomers);
const deals = () => active(allDeals);
const employees = () => active(allEmployees);
const invoices = () => active(allInvoices);
const orders = () => active(allOrders);
const payrolls = () => active(allPayrolls);
const products = () => active(allProducts);
const purchases = () => active(allPurchases);
const suppliers = () => active(allSuppliers);
const transactions = () => active(allTransactions);
const users = () => active(allUsers);

/**
 * Barcha ko'rsatkichlar store'dagi jonli ma'lumotdan hisoblanadi.
 * Shu sababli yangi tranzaksiya qo'shilishi balansda ham, dashboardda ham darhol aks etadi.
 */

/** Hisobot davri — real joriy oy. Yangi yozuvlar bugungi sana bilan kiritiladi. */
function currentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function previousPeriod(): { year: number; month: number } {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() };
}

function inPeriod(dateStr: string, period: { year: number; month: number }) {
  const date = new Date(dateStr);
  return date.getFullYear() === period.year && date.getMonth() === period.month;
}

function sumBy(list: Transaction[], type: Transaction["type"]) {
  return list
    .filter((t) => t.type === type)
    .reduce((total, t) => total + t.amount, 0);
}

/**
 * Foizli o'zgarish.
 * Baza nolga teng bo'lsa foiz matematik jihatdan aniqlanmagan — Infinity ko'rsatmaslik
 * uchun ±100% qaytaramiz, ishora esa joriy qiymatdan olinadi (zarar +100% bo'lib ko'rinmasin).
 */
function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export function financeStats(): FinanceStats {
  const thisMonth = transactions().filter((t) => inPeriod(t.date, currentPeriod()));
  const lastMonth = transactions().filter((t) => inPeriod(t.date, previousPeriod()));

  const monthlyIncome = sumBy(thisMonth, "income");
  const monthlyExpenses = sumBy(thisMonth, "expense");

  // Joriy balans — butun tarix bo'yicha kirim minus chiqim.
  const currentBalance = sumBy(transactions(), "income") - sumBy(transactions(), "expense");
  const lastBalance = sumBy(lastMonth, "income") - sumBy(lastMonth, "expense");
  const thisBalance = monthlyIncome - monthlyExpenses;

  return {
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    balanceChange: percentChange(thisBalance, lastBalance),
  };
}

export function dashboardStats(): DashboardStats {
  const thisMonth = transactions().filter((t) => inPeriod(t.date, currentPeriod()));
  const lastMonth = transactions().filter((t) => inPeriod(t.date, previousPeriod()));

  const totalRevenue = sumBy(thisMonth, "income");
  const totalExpenses = sumBy(thisMonth, "expense");
  const prevRevenue = sumBy(lastMonth, "income");
  const prevExpenses = sumBy(lastMonth, "expense");

  const netProfit = totalRevenue - totalExpenses;
  const prevProfit = prevRevenue - prevExpenses;

  const activeEmployees = employees().filter((e) => e.status === "active").length;
  const hiredThisMonth = employees().filter((e) =>
    inPeriod(e.hireDate, currentPeriod()),
  ).length;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    activeEmployees,
    revenueChange: percentChange(totalRevenue, prevRevenue),
    expensesChange: percentChange(totalExpenses, prevExpenses),
    profitChange: percentChange(netProfit, prevProfit),
    employeesChange: hiredThisMonth,
  };
}

/**
 * Joriy oyning har bir kuni uchun kirim/chiqim yig'indisi — dashboard grafigi uchun.
 * Tranzaksiyasi yo'q kunlar ham nol qiymat bilan qaytadi, aks holda grafik uzilib qoladi.
 */
export function revenueTrend(): TrendPoint[] {
  const { year, month } = currentPeriod();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayTransactions = transactions().filter((t) => {
      const date = new Date(t.date);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    });

    return {
      label: day.toString().padStart(2, "0"),
      income: sumBy(dayTransactions, "income"),
      expense: sumBy(dayTransactions, "expense"),
    };
  });
}

/**
 * Bo'limlar bo'yicha rejadagi shtat birliklari.
 * Ochiq vakansiya shu rejadan haqiqiy xodimlar sonini ayirish orqali topiladi.
 */
const HEADCOUNT_PLAN: Record<string, number> = {
  Savdo: 6,
  IT: 5,
  Marketing: 4,
  Moliya: 4,
  Ombor: 4,
  HR: 3,
  "Ishlab chiqarish": 4,
  Yuridik: 2,
};

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Bugungi davomat yozuvlari; hali kiritilmagan bo'lsa oxirgi mavjud kun olinadi. */
function latestAttendanceDay(): AttendanceRecord[] {
  const today = todayISO();
  const forToday = attendance.filter((record) => record.date === today);
  if (forToday.length > 0) return forToday;

  const latest = attendance.reduce(
    (newest, record) => (record.date > newest ? record.date : newest),
    "",
  );
  return latest ? attendance.filter((record) => record.date === latest) : [];
}

export function attendanceStats(): AttendanceStats {
  const day = latestAttendanceDay();

  const count = (status: AttendanceRecord["status"]) =>
    day.filter((record) => record.status === status).length;

  const present = count("present");
  const late = count("late");
  const remote = count("remote");
  const absent = count("absent");
  const onLeave = count("leave");

  // Davomat foizi — ta'tildagilar hisobdan chiqariladi, ular kutilmaydi.
  const expected = present + late + remote + absent;

  return {
    totalEmployees: employees().length,
    present,
    late,
    remote,
    absent,
    onLeave,
    attendanceRate:
      expected === 0 ? 0 : Math.round(((present + late + remote) / expected) * 100),
  };
}

export function hrStats(): HRStats {
  const totalEmployees = employees().length;

  // Bugun ta'tilda — tasdiqlangan so'rov bugungi sanani qamrab olsa.
  const today = todayISO();
  const onVacationToday = leaveRequests.filter(
    (request) =>
      request.status === "approved" &&
      request.startDate <= today &&
      request.endDate >= today,
  ).length;

  const actual = new Map<string, number>();
  for (const employee of employees()) {
    actual.set(employee.department, (actual.get(employee.department) ?? 0) + 1);
  }

  const openPositions = Object.entries(HEADCOUNT_PLAN).reduce(
    (sum, [department, planned]) => sum + Math.max(0, planned - (actual.get(department) ?? 0)),
    0,
  );

  return {
    totalEmployees,
    onVacationToday,
    // Haqiqiy davomat yozuvlaridan hisoblanadi, bandlik holatidan emas.
    attendanceRate: attendanceStats().attendanceRate,
    openPositions,
  };
}

export function leaveStats(): LeaveStats {
  const today = todayISO();
  const year = new Date().getFullYear();

  return {
    pending: leaveRequests.filter((request) => request.status === "pending").length,
    approvedThisMonth: leaveRequests.filter(
      (request) => request.status === "approved" && inPeriod(request.startDate, currentPeriod()),
    ).length,
    onLeaveToday: leaveRequests.filter(
      (request) =>
        request.status === "approved" &&
        request.startDate <= today &&
        request.endDate >= today,
    ).length,
    totalDaysThisYear: leaveRequests
      .filter(
        (request) =>
          request.status === "approved" &&
          new Date(request.startDate).getFullYear() === year,
      )
      .reduce((sum, request) => sum + request.days, 0),
  };
}

export function isLowStock(product: { quantity: number; minQuantity: number }) {
  return product.quantity <= product.minQuantity;
}

export function warehouseStats(): WarehouseStats {
  const lowStock = products().filter(isLowStock).length;

  return {
    totalProducts: products().length,
    normalStock: products().length - lowStock,
    lowStock,
    warehouseValue: products().reduce((sum, p) => sum + p.price * p.quantity, 0),
  };
}

/** Voronkada faqat yopilmagan bitimlar hisobga olinadi. */
const OPEN_STATUSES: Deal["status"][] = ["new_lead", "negotiation", "proposal"];

export function crmStats(): CRMStats {
  return {
    totalPipeline: deals()
      .filter((d) => OPEN_STATUSES.includes(d.status))
      .reduce((sum, d) => sum + d.value, 0),
    newLeads: deals().filter((d) => d.status === "new_lead").length,
    inNegotiation: deals().filter((d) => d.status === "negotiation").length,
    closedThisMonth: deals().filter(
      (d) => d.status === "closed_won" && inPeriod(d.expectedCloseDate, currentPeriod()),
    ).length,
  };
}

/** Savdo voronkasi bosqichlari — CRM sahifasidagi diagramma uchun. */
export function dealFunnel() {
  const stages: { status: Deal["status"]; label: string }[] = [
    { status: "new_lead", label: "Yangi lead" },
    { status: "negotiation", label: "Muzokara" },
    { status: "proposal", label: "Taklif" },
    { status: "closed_won", label: "Muvaffaqiyatli" },
    { status: "closed_lost", label: "Yopilgan" },
  ];

  return stages.map(({ status, label }) => {
    const stageDeals = deals().filter((d) => d.status === status);
    return {
      status,
      label,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });
}

// ----------------------------------------------------- Tahliliy kesimlar

/** `map`ni qiymat bo'yicha kamayish tartibida ro'yxatga aylantiradi. */
function toSortedGroups(
  map: Map<string, { count: number; value: number }>,
  limit?: number,
): GroupValue[] {
  const groups = [...map.entries()]
    .map(([label, agg]) => ({ label, count: agg.count, value: agg.value }))
    .sort((a, b) => b.value - a.value);
  return limit ? groups.slice(0, limit) : groups;
}

/** Moliya: kategoriya bo'yicha kirim/chiqim va hisoblar balansi. */
export function financeBreakdown(): FinanceBreakdown {
  const thisMonth = transactions().filter((t) => inPeriod(t.date, currentPeriod()));

  const categoryMap = new Map<string, { income: number; expense: number }>();
  const accountMap = new Map<string, { income: number; expense: number }>();

  for (const t of thisMonth) {
    const category = categoryMap.get(t.category) ?? { income: 0, expense: 0 };
    category[t.type] += t.amount;
    categoryMap.set(t.category, category);

    const account = accountMap.get(t.account) ?? { income: 0, expense: 0 };
    account[t.type] += t.amount;
    accountMap.set(t.account, account);
  }

  const byCategory: CategoryBreakdown[] = [...categoryMap.entries()]
    .map(([category, agg]) => ({ category, ...agg }))
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));

  const byAccount: AccountBalance[] = [...accountMap.entries()]
    .map(([account, agg]) => ({
      account,
      income: agg.income,
      expense: agg.expense,
      balance: agg.income - agg.expense,
    }))
    .sort((a, b) => b.balance - a.balance);

  return { byCategory, byAccount };
}

/** HR: bo'lim bo'yicha xodim soni, maosh fondi va o'rtacha maosh. */
export function hrBreakdown(): HRBreakdown {
  const map = new Map<string, { headcount: number; salaryTotal: number; onLeave: number }>();

  for (const e of employees()) {
    const dept = map.get(e.department) ?? { headcount: 0, salaryTotal: 0, onLeave: 0 };
    dept.headcount += 1;
    dept.salaryTotal += e.salary;
    if (e.status !== "active") dept.onLeave += 1;
    map.set(e.department, dept);
  }

  const byDepartment: DepartmentBreakdown[] = [...map.entries()]
    .map(([department, agg]) => ({ department, ...agg }))
    .sort((a, b) => b.headcount - a.headcount);

  const salaryFund = employees().reduce((sum, e) => sum + e.salary, 0);

  return {
    byDepartment,
    totalMonthlyPayroll: salaryFund,
  };
}

/** Ombor: kategoriya/joy bo'yicha qiymat, top ta'minotchilar va tanqis mahsulotlar. */
export function warehouseBreakdown(): WarehouseBreakdown {
  const categoryMap = new Map<string, { count: number; value: number }>();
  const locationMap = new Map<string, { count: number; value: number }>();
  const supplierMap = new Map<string, { count: number; value: number }>();

  for (const p of products()) {
    const value = p.price * p.quantity;
    for (const [map, key] of [
      [categoryMap, p.category],
      [locationMap, p.location],
      [supplierMap, p.supplier],
    ] as const) {
      const agg = map.get(key) ?? { count: 0, value: 0 };
      agg.count += 1;
      agg.value += value;
      map.set(key, agg);
    }
  }

  return {
    byCategory: toSortedGroups(categoryMap),
    byLocation: toSortedGroups(locationMap),
    topSuppliers: toSortedGroups(supplierMap, 5),
    // Eng tanqisi birinchi: qoldiq/chegara nisbati eng kichigi tepada.
    lowStockItems: products()
      .filter(isLowStock)
      .sort((a, b) => a.quantity / a.minQuantity - b.quantity / b.minQuantity),
  };
}

// ------------------------------------------------------ Buyurtma va kartotekalar

/** Buyurtma "faol" — hali yetkazilmagan va bekor qilinmagan. */
export function isPendingOrder(order: Order): boolean {
  return order.status !== "delivered" && order.status !== "cancelled";
}

/** Bekor qilingan buyurtma tushum va qarzga kirmaydi. */
function billableOrders(): Order[] {
  return orders().filter((o) => o.status !== "cancelled");
}

export function orderStats(): OrderStats {
  const billable = billableOrders();

  return {
    totalOrders: orders().length,
    pendingOrders: orders().filter(isPendingOrder).length,
    deliveredThisMonth: orders().filter(
      (o) => o.status === "delivered" && inPeriod(o.orderDate, currentPeriod()),
    ).length,
    totalValue: billable.reduce((sum, o) => sum + o.total, 0),
    // To'lanmagan — to'liq qarz, qisman to'langan — yarmi hisoblanadi.
    unpaidAmount: billable.reduce((sum, o) => {
      if (o.paymentStatus === "paid") return sum;
      return sum + (o.paymentStatus === "partial" ? o.total / 2 : o.total);
    }, 0),
  };
}

export function orderBreakdown(): OrderBreakdown {
  const statusLabels: Record<Order["status"], string> = {
    draft: "Qoralama",
    confirmed: "Tasdiqlangan",
    shipped: "Jo'natilgan",
    delivered: "Yetkazilgan",
    cancelled: "Bekor qilingan",
  };

  const byStatus: GroupValue[] = (
    Object.keys(statusLabels) as Order["status"][]
  ).map((status) => {
    const group = orders().filter((o) => o.status === status);
    return {
      label: statusLabels[status],
      count: group.length,
      value: group.reduce((sum, o) => sum + o.total, 0),
    };
  });

  const customerMap = new Map<string, { count: number; value: number }>();
  const productMap = new Map<string, { count: number; value: number }>();

  for (const order of billableOrders()) {
    const customer = customerMap.get(order.customerName) ?? { count: 0, value: 0 };
    customer.count += 1;
    customer.value += order.total;
    customerMap.set(order.customerName, customer);

    for (const item of order.items) {
      const product = productMap.get(item.productName) ?? { count: 0, value: 0 };
      product.count += item.quantity;
      product.value += item.quantity * item.price;
      productMap.set(item.productName, product);
    }
  }

  return {
    byStatus,
    topCustomers: toSortedGroups(customerMap, 5),
    topProducts: toSortedGroups(productMap, 5),
  };
}

export function customerStats(): CustomerStats {
  return {
    totalCustomers: customers().length,
    activeCustomers: customers().filter((c) => c.status === "active").length,
    newThisMonth: customers().filter((c) => inPeriod(c.createdDate, currentPeriod())).length,
    totalRevenue: orders()
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0),
  };
}

export function supplierStats(): SupplierStats {
  const active = suppliers().filter((s) => s.status === "active");
  const totalRating = suppliers().reduce((sum, s) => sum + s.rating, 0);

  return {
    totalSuppliers: suppliers().length,
    activeSuppliers: active.length,
    categories: new Set(suppliers().map((s) => s.category)).size,
    averageRating:
      suppliers().length === 0 ? 0 : Math.round((totalRating / suppliers().length) * 10) / 10,
  };
}

// ---------------------------------------------- Xarid, faktura, foydalanuvchi

export function purchaseStats(): PurchaseStats {
  const billable = purchases().filter((p) => p.status !== "cancelled");

  return {
    totalPurchases: purchases().length,
    awaitingDelivery: purchases().filter((p) => p.status === "ordered").length,
    receivedThisMonth: purchases().filter(
      (p) => p.status === "received" && inPeriod(p.orderDate, currentPeriod()),
    ).length,
    totalValue: billable.reduce((sum, p) => sum + p.total, 0),
    unpaidAmount: billable.reduce((sum, p) => {
      if (p.paymentStatus === "paid") return sum;
      return sum + (p.paymentStatus === "partial" ? p.total / 2 : p.total);
    }, 0),
  };
}

/** Muddati o'tgan faktura — to'liq to'lanmagan va to'lov sanasi o'tib ketgan. */
export function isOverdueInvoice(invoice: Invoice): boolean {
  return (
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    invoice.status !== "draft" &&
    invoice.dueDate < todayISO()
  );
}

export function invoiceStats(): InvoiceStats {
  const active = invoices().filter((i) => i.status !== "cancelled");
  const outstanding = active.filter((i) => i.paidAmount < i.amount);

  return {
    totalInvoices: invoices().length,
    outstandingCount: outstanding.length,
    outstandingAmount: outstanding.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0),
    overdueCount: active.filter(isOverdueInvoice).length,
    paidThisMonth: active.filter(
      (i) => i.status === "paid" && inPeriod(i.issueDate, currentPeriod()),
    ).length,
  };
}

export function userStats(): UserStats {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    totalUsers: users().length,
    activeUsers: users().filter((u) => u.status === "active").length,
    admins: users().filter((u) => u.role === "admin").length,
    activeThisWeek: users().filter((u) => u.lastLogin && u.lastLogin >= weekAgo).length,
  };
}

/** Rollar va ular ochadigan bo'limlar — ruxsatlar matritsasi uchun. */
export function rolePermissions(): RolePermission[] {
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
        "Sozlamalar",
      ],
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
        "Hisobotlar",
      ],
    },
    {
      role: "accountant",
      label: "Buxgalter",
      description: "Moliya, fakturalar va hisobotlar bilan ishlaydi",
      modules: ["Boshqaruv paneli", "Moliya", "Fakturalar", "Xaridlar", "Hisobotlar"],
    },
    {
      role: "warehouse",
      label: "Ombor xodimi",
      description: "Ombor qoldig'i, xaridlar va ta'minotchilarni boshqaradi",
      modules: ["Ombor", "Xaridlar", "Ta'minotchilar", "Buyurtmalar"],
    },
    {
      role: "sales",
      label: "Sotuv menejeri",
      description: "Buyurtma, bitim va mijozlar bilan ishlaydi",
      modules: ["Boshqaruv paneli", "Buyurtmalar", "Bitimlar", "Mijozlar", "Fakturalar"],
    },
    {
      role: "viewer",
      label: "Kuzatuvchi",
      description: "Faqat ko'rish huquqi, o'zgartira olmaydi",
      modules: ["Boshqaruv paneli", "Hisobotlar"],
    },
  ];
}

// ----------------------------------------------------------- Yig'ma hisobot

const MONTH_NAMES = [
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
  "Dekabr",
];

/**
 * Tanlangan davr uchun yig'ma hisobot: daromad/xarajat, marja, kategoriya
 * kesimi, oylik dinamika va top ro'yxatlar.
 */
export function reportSummary(from: string, to: string): ReportSummary {
  const inRange = (date: string) => date >= from && date <= to;

  const periodTransactions = transactions().filter((t) => inRange(t.date));
  const totalIncome = sumBy(periodTransactions, "income");
  const totalExpense = sumBy(periodTransactions, "expense");
  const netProfit = totalIncome - totalExpense;

  // Kategoriya kesimi.
  const categoryMap = new Map<string, { income: number; expense: number }>();
  for (const t of periodTransactions) {
    const row = categoryMap.get(t.category) ?? { income: 0, expense: 0 };
    row[t.type] += t.amount;
    categoryMap.set(t.category, row);
  }
  const byCategory: ProfitLossRow[] = [...categoryMap.entries()]
    .map(([label, row]) => ({ label, ...row }))
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));

  // Oylik dinamika — davr ichidagi har bir oy.
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const t of periodTransactions) {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    const row = monthMap.get(key) ?? { income: 0, expense: 0 };
    row[t.type] += t.amount;
    monthMap.set(key, row);
  }
  const monthly: ProfitLossRow[] = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, row]) => {
      const [year, month] = key.split("-");
      return { label: `${MONTH_NAMES[Number(month)]} ${year}`, ...row };
    });

  const periodOrders = orders().filter(
    (o) => o.status !== "cancelled" && inRange(o.orderDate),
  );

  const productMap = new Map<string, { count: number; value: number }>();
  const customerMap = new Map<string, { count: number; value: number }>();
  for (const order of periodOrders) {
    const customer = customerMap.get(order.customerName) ?? { count: 0, value: 0 };
    customer.count += 1;
    customer.value += order.total;
    customerMap.set(order.customerName, customer);

    for (const item of order.items) {
      const product = productMap.get(item.productName) ?? { count: 0, value: 0 };
      product.count += item.quantity;
      product.value += item.quantity * item.price;
      productMap.set(item.productName, product);
    }
  }

  return {
    period: { from, to },
    totalIncome,
    totalExpense,
    netProfit,
    margin: totalIncome === 0 ? 0 : Math.round((netProfit / totalIncome) * 1000) / 10,
    ordersCount: periodOrders.length,
    ordersValue: periodOrders.reduce((sum, o) => sum + o.total, 0),
    purchasesValue: purchases()
      .filter((p) => p.status !== "cancelled" && inRange(p.orderDate))
      .reduce((sum, p) => sum + p.total, 0),
    newCustomers: customers().filter((c) => inRange(c.createdDate)).length,
    byCategory,
    monthly,
    topProducts: toSortedGroups(productMap, 8),
    topCustomers: toSortedGroups(customerMap, 8),
  };
}

/** CRM: top mijozlar, mas'ul kesimi, konversiya va yaqin/muddati o'tgan bitimlar. */
export function crmBreakdown(): CRMBreakdown {
  const clientMap = new Map<string, { count: number; value: number }>();
  const assigneeMap = new Map<string, { count: number; value: number }>();

  for (const d of deals()) {
    const client = clientMap.get(d.clientName) ?? { count: 0, value: 0 };
    client.count += 1;
    client.value += d.value;
    clientMap.set(d.clientName, client);

    const assignee = assigneeMap.get(d.assignedTo) ?? { count: 0, value: 0 };
    assignee.count += 1;
    assignee.value += d.value;
    assigneeMap.set(d.assignedTo, assignee);
  }

  const won = deals().filter((d) => d.status === "closed_won");
  const lost = deals().filter((d) => d.status === "closed_lost");
  const closed = won.length + lost.length;

  const averageDealSize =
    deals().length === 0
      ? 0
      : Math.round(deals().reduce((sum, d) => sum + d.value, 0) / deals().length);

  const today = new Date().toISOString().split("T")[0];
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const isOpen = (d: Deal) => d.status !== "closed_won" && d.status !== "closed_lost";

  return {
    topClients: toSortedGroups(clientMap, 5),
    byAssignee: toSortedGroups(assigneeMap),
    conversionRate: closed === 0 ? 0 : Math.round((won.length / closed) * 100),
    averageDealSize,
    closingSoon: deals()
      .filter((d) => isOpen(d) && d.expectedCloseDate >= today && d.expectedCloseDate <= weekAhead)
      .sort((a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate)),
    overdue: deals()
      .filter((d) => isOpen(d) && d.expectedCloseDate < today)
      .sort((a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate)),
  };
}

// -------------------------------------------------------------- Ish haqi (payroll)

/** Daromad solig'i stavkasi — TZ 7-bo'lim bo'yicha 12%. */
const INCOME_TAX_RATE = 0.12;

/** "YYYY-MM" davridagi ish (dam olishsiz) kunlari soni — dush–juma. */
export function workingDaysInMonth(period: string): number {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, month - 1, day).getDay();
    if (weekday !== 0 && weekday !== 6) count++; // 0=yakshanba, 6=shanba
  }
  return count;
}

/** Davr ichida xodim haqiqatan kelgan kunlar (kelgan/kechikkan/masofaviy). */
function presentDaysFor(employeeId: string, period: string): number {
  const PRESENT: AttendanceRecord["status"][] = ["present", "late", "remote"];
  return attendance.filter(
    (record) =>
      record.employeeId === employeeId &&
      record.date.startsWith(period) &&
      PRESENT.includes(record.status),
  ).length;
}

/**
 * Bitta xodim uchun ish haqini hisoblaydi (yozib qo'ymaydi — faqat qiymatlar).
 * netSalary = asosiy maosh − kelmagan kunlar ushlanmasi + bonus − jarima − soliq.
 * Soliq soliqqa tortiladigan (ushlanma va jarimadan keyingi) summadan olinadi.
 */
export function computePayroll(
  employee: { id: string; name: string; department: string; salary: number },
  period: string,
  options: { bonus?: number; penalty?: number } = {},
): Omit<Payroll, "id" | "status" | "createdDate" | "note"> {
  const workingDays = workingDaysInMonth(period);
  // Davomat yozuvi bo'lmasa (masalan o'tgan davrlar), to'liq davomat deb hisoblaymiz.
  const recorded = presentDaysFor(employee.id, period);
  const hasRecords = attendance.some(
    (r) => r.employeeId === employee.id && r.date.startsWith(period),
  );
  const presentDays = hasRecords ? recorded : workingDays;

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
    netSalary,
  };
}

export function payrollStats(period?: string): PayrollStats {
  const rows = period ? payrolls().filter((p) => p.period === period) : payrolls();

  return {
    totalPayrolls: rows.length,
    totalNet: rows.reduce((sum, p) => sum + p.netSalary, 0),
    paidCount: rows.filter((p) => p.status === "paid").length,
    pendingCount: rows.filter((p) => p.status !== "paid").length,
  };
}
