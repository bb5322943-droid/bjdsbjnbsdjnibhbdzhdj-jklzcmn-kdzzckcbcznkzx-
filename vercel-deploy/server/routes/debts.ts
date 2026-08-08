import { RequestHandler } from "express";
import { z } from "zod";
import {
  ApiResponse,
  CustomerDebt,
  DebtPayment,
  DebtStats,
} from "@shared/api";
import {
  customers,
  debtPayments,
  logActivity,
  nextId,
  orders,
} from "../data/store";
import { todayISO } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

// Qarz statistikasi
export const getDebtStats: RequestHandler = (_req, res) => {
  const today = todayISO();
  
  // Barcha to'lanmagan va qisman to'langan buyurtmalar
  const unpaidOrders = orders.filter(
    o => o.paymentStatus === "unpaid" || o.paymentStatus === "partial"
  );
  
  const totalDebt = unpaidOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Bugun to'langan summa
  const paidToday = debtPayments
    .filter(p => p.paymentDate === today)
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Muddati o'tgan qarzlar (yetkazilganidan 30 kun o'tgan)
  const overdueDebt = unpaidOrders
    .filter(o => {
      const deliveryDate = new Date(o.deliveryDate);
      const daysDiff = Math.floor(
        (Date.now() - deliveryDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      return daysDiff > 30;
    })
    .reduce((sum, o) => sum + o.total, 0);
  
  // Qarzdor mijozlar soni
  const customersInDebt = new Set(unpaidOrders.map(o => o.customerId)).size;
  
  const stats: DebtStats = {
    totalDebt,
    paidToday,
    overdueDebt,
    customersInDebt,
  };
  
  const response: ApiResponse<DebtStats> = {
    success: true,
    data: stats,
  };
  
  res.json(response);
};

// Mijozlar bo'yicha qarz xulasasi
export const getCustomerDebts: RequestHandler = (req, res) => {
  const query = paginationSchema.parse(req.query);
  const search = query.search.toLowerCase();
  
  // Har bir mijoz uchun qarzni hisoblash
  const customerDebtsMap = new Map<string, CustomerDebt>();
  
  orders.forEach(order => {
    if (order.paymentStatus === "paid") return; // To'langan buyurtmalarni o'tkazib yuborish
    
    if (!customerDebtsMap.has(order.customerId)) {
      customerDebtsMap.set(order.customerId, {
        customerId: order.customerId,
        customerName: order.customerName,
        totalDebt: 0,
        paidAmount: 0,
        remainingDebt: 0,
        orderCount: 0,
        oldestDebtDate: order.orderDate,
        lastPaymentDate: null,
      });
    }
    
    const debt = customerDebtsMap.get(order.customerId)!;
    debt.totalDebt += order.total;
    debt.orderCount += 1;
    
    if (order.orderDate < debt.oldestDebtDate) {
      debt.oldestDebtDate = order.orderDate;
    }
  });
  
  // To'lovlarni hisoblash
  debtPayments.forEach(payment => {
    const debt = customerDebtsMap.get(payment.customerId);
    if (debt) {
      debt.paidAmount += payment.amount;
      if (!debt.lastPaymentDate || payment.paymentDate > debt.lastPaymentDate) {
        debt.lastPaymentDate = payment.paymentDate;
      }
    }
  });
  
  // Qoldiq qarzni hisoblash
  customerDebtsMap.forEach(debt => {
    debt.remainingDebt = debt.totalDebt - debt.paidAmount;
  });
  
  // Faqat qolgan qarzi bo'lganlarni ko'rsatish
  let debts = Array.from(customerDebtsMap.values())
    .filter(d => d.remainingDebt > 0);
  
  // Qidiruv
  if (search) {
    debts = debts.filter(d => 
      d.customerName.toLowerCase().includes(search)
    );
  }
  
  // Eng ko'p qarzdan boshlab tartiblash
  debts.sort((a, b) => b.remainingDebt - a.remainingDebt);
  
  res.json(paginate(debts, query.page, query.limit));
};

// Mijoz qarz tarixi
export const getCustomerDebtHistory: RequestHandler = (req, res) => {
  const customerId = req.params.customerId;
  
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return sendNotFound(res, "Mijoz topilmadi");
  
  // Mijozning qarzli buyurtmalari
  const customerOrders = orders.filter(
    o => o.customerId === customerId && o.paymentStatus !== "paid"
  );
  
  // Mijozning to'lovlari
  const customerPayments = debtPayments.filter(p => p.customerId === customerId);
  
  const response: ApiResponse<{
    orders: typeof customerOrders;
    payments: typeof customerPayments;
    totalDebt: number;
    paidAmount: number;
    remainingDebt: number;
  }> = {
    success: true,
    data: {
      orders: customerOrders,
      payments: customerPayments,
      totalDebt: customerOrders.reduce((sum, o) => sum + o.total, 0),
      paidAmount: customerPayments.reduce((sum, p) => sum + p.amount, 0),
      remainingDebt: 
        customerOrders.reduce((sum, o) => sum + o.total, 0) -
        customerPayments.reduce((sum, p) => sum + p.amount, 0),
    },
  };
  
  res.json(response);
};

// Qarz to'lovlari ro'yxati
export const getDebtPayments: RequestHandler = (req, res) => {
  const query = paginationSchema.parse(req.query);
  const search = query.search.toLowerCase();
  
  let filtered = debtPayments.filter(payment => {
    if (search && 
        !payment.customerName.toLowerCase().includes(search) &&
        !payment.orderNumber.toLowerCase().includes(search)) {
      return false;
    }
    return true;
  });
  
  // Eng yangi to'lovlar birinchi
  filtered.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  
  res.json(paginate(filtered, query.page, query.limit));
};

// Qarz to'lovini qo'shish
const paymentSchema = z.object({
  orderId: z.string().min(1, "Buyurtma tanlanishi shart"),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  paymentMethod: z.string().min(1, "To'lov usuli kiritilishi shart"),
  note: z.string().optional().default(""),
});

export const createDebtPayment: RequestHandler = (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  
  const order = orders.find(o => o.id === parsed.data.orderId);
  if (!order) return sendNotFound(res, "Buyurtma topilmadi");
  
  if (order.paymentStatus === "paid") {
    return res.status(400).json({
      success: false,
      message: "Bu buyurtma allaqachon to'liq to'langan",
    });
  }
  
  // To'langan jami summa
  const alreadyPaid = debtPayments
    .filter(p => p.orderId === order.id)
    .reduce((sum, p) => sum + p.amount, 0);
  
  const remainingAmount = order.total - alreadyPaid;
  
  if (parsed.data.amount > remainingAmount) {
    return res.status(400).json({
      success: false,
      message: `Qoldiq qarz: ${remainingAmount.toFixed(2)} so'm. Ortiqcha to'lov qabul qilinmaydi.`,
    });
  }
  
  const payment: DebtPayment = {
    id: nextId(),
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerName: order.customerName,
    amount: parsed.data.amount,
    paymentDate: todayISO(),
    paymentMethod: parsed.data.paymentMethod,
    note: parsed.data.note,
    createdBy: "current-user", // TODO: Haqiqiy user ID
  };
  
  debtPayments.unshift(payment);
  
  // Buyurtma to'lov holatini yangilash
  const newPaidTotal = alreadyPaid + parsed.data.amount;
  if (newPaidTotal >= order.total) {
    order.paymentStatus = "paid";
  } else if (newPaidTotal > 0) {
    order.paymentStatus = "partial";
  }
  
  logActivity({
    action: "Qarz to'landi",
    details: `${order.customerName} · ${payment.amount.toFixed(0)} so'm`,
    icon: "DollarSign",
  });
  
  const response: ApiResponse<DebtPayment> = {
    success: true,
    data: payment,
    message: "To'lov muvaffaqiyatli qo'shildi",
  };
  
  res.status(201).json(response);
};

// Mijoz qarzlarini tozalash (barcha buyurtmalarni "to'langan" holatiga o'tkazish)
export const clearCustomerDebt: RequestHandler = (req, res) => {
  const customerId = req.params.customerId;
  
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return sendNotFound(res, "Mijoz topilmadi");
  
  // Mijozning barcha qarzli buyurtmalarini topish
  const customerOrders = orders.filter(
    o => o.customerId === customerId && o.paymentStatus !== "paid"
  );
  
  if (customerOrders.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Bu mijozning qarzlari yo'q",
    });
  }
  
  // Barcha buyurtmalarni "to'langan" holatiga o'tkazish
  let clearedCount = 0;
  customerOrders.forEach(order => {
    order.paymentStatus = "paid";
    clearedCount++;
  });
  
  logActivity({
    action: "Qarz tozalandi",
    details: `${customer.name} · ${clearedCount} ta buyurtma`,
    icon: "CheckCircle",
  });
  
  const response: ApiResponse<{ clearedOrders: number }> = {
    success: true,
    data: { clearedOrders: clearedCount },
    message: `${clearedCount} ta buyurtma tozalandi`,
  };
  
  res.json(response);
};
