import "dotenv/config";
import express, {
  ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger, logRequest } from "./lib/logger";
import { startBackupScheduler } from "./lib/backup";
import { handleDemo } from "./routes/demo";
import {
  getAlerts,
  getDashboardStats,
  getRecentActivities,
  getRevenueTrend,
} from "./routes/dashboard";
import {
  createTransaction,
  deleteTransaction,
  exportTransactions,
  getFinanceBreakdown,
  getFinanceStats,
  getTransactionCategories,
  getTransactions,
  updateTransaction,
} from "./routes/finance";
import {
  createEmployee,
  deleteEmployee,
  getDepartments,
  getEmployees,
  getHRBreakdown,
  getHRStats,
  updateEmployee,
} from "./routes/hr";
import {
  adjustStock,
  createProduct,
  deleteProduct,
  getProductFilters,
  getProducts,
  getStockMovements,
  getWarehouseBreakdown,
  getWarehouseStats,
  restockLowProducts,
  updateProduct,
} from "./routes/warehouse";
import {
  createCustomer,
  deleteCustomer,
  getCustomerDetail,
  getCustomerRegions,
  getCustomerStats,
  getCustomers,
  updateCustomer,
} from "./routes/customers";
import {
  createSupplier,
  deleteSupplier,
  getSupplierCategories,
  getSupplierDetail,
  getSupplierStats,
  getSuppliers,
  updateSupplier,
} from "./routes/suppliers";
import {
  createBranch,
  deleteBranch,
  getBranchStats,
  getBranches,
  updateBranch,
} from "./routes/branches";
import {
  createOrder,
  deleteOrder,
  getOrderBreakdown,
  getOrderDetail,
  getOrderStats,
  getOrders,
  updateOrder,
} from "./routes/orders";
import {
  createPurchase,
  deletePurchase,
  getPurchaseStats,
  getPurchases,
  updatePurchase,
} from "./routes/purchases";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceStats,
  getInvoices,
  recordInvoicePayment,
  updateInvoice,
} from "./routes/invoices";
import {
  createDebtPayment,
  getCustomerDebtHistory,
  getCustomerDebts,
  getDebtPayments,
  getDebtStats,
  clearCustomerDebt,
} from "./routes/debts";
import {
  createLeaveRequest,
  deleteLeaveRequest,
  clearAllAttendance,
  getAttendance,
  getAttendanceStats,
  getLeaveRequests,
  getLeaveStats,
  markAttendance,
  updateLeaveRequest,
} from "./routes/attendance";
import {
  createUser,
  deleteUser,
  getRolePermissions,
  getUserStats,
  getUsers,
  updateUser,
} from "./routes/users";
import { exportReport, getReportSummary } from "./routes/reports";
import { persist } from "./data/store";
import { purgeExpiredSessions } from "./lib/auth";
import {
  changePassword,
  getCurrentUser,
  login,
  logout,
  requireAuth,
} from "./routes/auth";
import { requireModule } from "./lib/permissions";
import { clientIp, recordAudit } from "./lib/audit";
import {
  auditActionFor,
  auditEntityFor,
  auditSummary,
  extractIdFromPath,
  getAuditLogs,
  getAuditStats,
} from "./routes/audit";
import {
  createDeal,
  deleteDeal,
  getCRMBreakdown,
  getCRMStats,
  getDealFunnel,
  getDeals,
  updateDeal,
} from "./routes/crm";
import {
  calculatePayroll,
  deletePayroll,
  getPayrollPeriods,
  getPayrollStats,
  getPayrolls,
  updatePayroll,
} from "./routes/payroll";
import {
  createSale,
  deleteSale,
  getSales,
  getSalesStats,
  refundSale,
} from "./routes/sales";

/**
 * JSON matnini xavfsiz parslaydi — noto'g'ri yoki bo'sh matn xato o'rniga bo'sh
 * obyekt qaytaradi. Shunda buzilgan body butun so'rovni yiqitmaydi.
 */
function safeJson(text: string): Record<string, unknown> {
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
function validateEnvironment(): void {
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    // Production'da default qiymatlar xavfli!
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
  }
  
  // Database path tekshirish
  const dbPath = process.env.DATABASE_PATH;
  if (!dbPath) {
    logger.warn("⚠️  DATABASE_PATH o'rnatilmagan, default path ishlatiladi: ./data/app.db");
  }
  
  logger.info("✅ Environment validation muvaffaqiyatli");
}

export function createServer() {
  // Environment variables validatsiyasi
  validateEnvironment();
  
  // Muddati o'tgan sessiyalar bazada to'planib qolmasin.
  purgeExpiredSessions();

  // Avtomatik backup tizimini ishga tushirish
  startBackupScheduler();

  const app = express();

  // Xavfsizlik middleware'lari
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite dev server uchun
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS sozlamalari
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Development'da origin bo'lmasligi mumkin (Postman, curl)
        if (!origin && process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        
        // Vercel deployment: agar origin yo'q bo'lsa (serverless), ruxsat ber
        if (!origin) {
          return callback(null, true);
        }
        
        // Vercel preview deployments va production uchun
        const isVercelDomain = origin.includes('.vercel.app') || origin.includes('vercel.com');
        
        if (allowedOrigins.includes(origin) || isVercelDomain) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`);
          callback(new Error("CORS policy: Origin not allowed"));
        }
      },
      credentials: true,
    })
  );

  // Rate limiting - brute force hujumlardan himoya
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 daqiqa
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // 100 so'rov
    message: {
      success: false,
      message: "Juda ko'p so'rov yuborildi, keyinroq urinib ko'ring",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Login endpoint'iga maxsus rate limit (brute force oldini olish)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 5, // Faqat 5 ta urinish
    message: {
      success: false,
      message: "Juda ko'p login urinishi, 15 daqiqadan keyin urinib ko'ring",
    },
    skipSuccessfulRequests: true,
  });

  app.use("/api", limiter);

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logRequest(req, res, duration);
    });
    next();
  });

  // Middleware

  /*
   * Body parsing — muhitdan mustaqil.
   *
   * Muammo: Vercel'ning `@vercel/node` runtime'i so'rov oqimini o'zi iste'mol
   * qiladi (`req.body` ni Buffer/obyekt qilib qo'yadi yoki oqimni yopadi). Shundan
   * keyin standart `express.json()` oqimni qayta o'qiydi va bo'sh/buzilgan
   * ma'lumotni parse qilib "Expected property name" SyntaxError (500) beradi.
   *
   * Yechim: har qanday shakldagi body'ni (obyekt, Buffer, string yoki xom oqim)
   * bir joyda, xatolarga chidamli tarzda JSON obyektiga aylantiramiz. Noto'g'ri
   * JSON butun so'rovni yiqitmaydi — bo'sh obyekt sifatida davom etadi va route
   * o'z validatsiyasini beradi. Mahalliy Node serverda ham (`node-build.ts`)
   * xuddi shunday ishlaydi.
   */
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "HEAD") return next();

    const raw = (req as unknown as { body?: unknown }).body;

    // 1) Runtime string yoki Buffer qilib bergan — o'zimiz JSON parslaymiz.
    if (typeof raw === "string" || Buffer.isBuffer(raw)) {
      req.body = safeJson(Buffer.isBuffer(raw) ? raw.toString("utf8") : (raw as string));
      return next();
    }

    // 2) Runtime bo'sh BO'LMAGAN obyekt bergan — allaqachon parse qilingan.
    if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
      return next();
    }

    // 3) Body yo'q yoki bo'sh `{}` — xom oqimni o'zimiz o'qishga urinamiz.
    // Oqim allaqachon tugagan bo'lsa (Vercel iste'mol qilgan), bo'sh qoladi.
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
   * Ma'lumotni o'zgartirgan har bir muvaffaqiyatli so'rovdan keyin holat bazaga yoziladi.
   * Javob yuborilgach ishga tushadi — foydalanuvchi saqlashni kutib turmaydi.
   * Bitta joyda turgani uchun hech bir route uni chaqirishni unutib qo'ymaydi.
   */
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "HEAD") return next();

    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      try {
        persist();
      } catch (error) {
        // Saqlash uzilsa ham so'rov allaqachon bajarilgan — faqat jurnalga yozamiz.
        console.error("Bazaga saqlashda xatolik:", error);
      }
    });

    next();
  });

  // Health check endpoint (monitoring uchun)
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // --- Ochiq yo'llar: kirish uchun avtorizatsiya talab qilinmaydi ---
  app.post("/api/auth/login", authLimiter, login);
  app.post("/api/auth/logout", logout);

  /**
   * Shu qatordan keyingi barcha /api yo'llari himoyalangan.
   * Yagona joyda turgani uchun yangi route qo'shilganda himoyani
   * ulashni unutib qo'yish mumkin emas.
   */
  app.use("/api", requireAuth);

  /**
   * Audit-log middleware (TZ 14-bo'lim).
   * `requireAuth` dan keyin turadi — foydalanuvchi ma'lum. Har bir muvaffaqiyatli
   * o'zgartiruvchi so'rov (POST/PUT/PATCH/DELETE) kim/qachon/IP bilan yoziladi.
   * Yo'l va metoddan avtomatik inson o'qiy oladigan tavsif quriladi.
   */
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    if (["GET", "HEAD"].includes(req.method)) return next();
    // Audit sahifasining o'zini o'qish yoki login/logout bu yerda emas.
    if (req.path.startsWith("/audit")) return next();

    const ip = clientIp(req);
    res.on("finish", () => {
      if (res.statusCode >= 400 || !req.currentUser) return;
      try {
        // `/api/customers/123?x=1` → `/customers/123` (prefiks va query'siz).
        const apiPath = req.originalUrl.replace(/^\/api/, "").split("?")[0];
        recordAudit({
          user: req.currentUser,
          action: auditActionFor(req.method),
          entity: auditEntityFor(apiPath),
          entityId: extractIdFromPath(apiPath),
          summary: auditSummary(req.method, apiPath),
          ip,
        });
      } catch (error) {
        console.error("Audit yozishda xatolik:", error);
      }
    });
    next();
  });

  app.get("/api/auth/me", getCurrentUser);

  // Sales routes
  app.use("/api/sales", requireModule("sales"));
  app.get("/api/sales/stats", getSalesStats);
  app.get("/api/sales", getSales);
  app.post("/api/sales", createSale);
  app.post("/api/sales/:id/refund", refundSale);
  app.delete("/api/sales/:id", deleteSale);

  // POS routes — real ombor ma'lumotlaridan foydalanadi, alohida endpoint shart emas.
  // GET /api/warehouse/products?limit=200  →  mahsulotlar ro'yxati
  // POST /api/sales                         →  sotuv yaratish
  // Quyidagi eski hardcode endpointlar olib tashlandi.
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
  app.use("/api/invoices", requireModule("crm"));
  app.use("/api/debts", requireModule("crm"));
  app.use("/api/reports", requireModule("reports"));
  app.use("/api/users", requireModule("users"));
  app.use("/api/audit-logs", requireModule("audit"));

  // Dashboard API routes
  app.get("/api/dashboard/stats", getDashboardStats);
  app.get("/api/dashboard/trend", getRevenueTrend);
  app.get("/api/dashboard/activities", getRecentActivities);
  app.get("/api/dashboard/alerts", getAlerts);

  // Finance API routes
  app.get("/api/finance/stats", getFinanceStats);
  app.get("/api/finance/breakdown", getFinanceBreakdown);
  app.get("/api/finance/categories", getTransactionCategories);
  app.get("/api/finance/transactions/export", exportTransactions);
  app.get("/api/finance/transactions", getTransactions);
  app.post("/api/finance/transactions", createTransaction);
  app.put("/api/finance/transactions/:id", updateTransaction);
  app.delete("/api/finance/transactions/:id", deleteTransaction);

  // HR API routes
  app.get("/api/hr/stats", getHRStats);
  app.get("/api/hr/breakdown", getHRBreakdown);
  app.get("/api/hr/departments", getDepartments);
  app.get("/api/hr/employees", getEmployees);
  app.post("/api/hr/employees", createEmployee);
  app.put("/api/hr/employees/:id", updateEmployee);
  app.delete("/api/hr/employees/:id", deleteEmployee);

  // Warehouse API routes
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

  // Customers API routes
  app.get("/api/customers/stats", getCustomerStats);
  app.get("/api/customers/regions", getCustomerRegions);
  app.get("/api/customers", getCustomers);
  app.get("/api/customers/:id", getCustomerDetail);
  app.post("/api/customers", createCustomer);
  app.put("/api/customers/:id", updateCustomer);
  app.delete("/api/customers/:id", deleteCustomer);

  // Suppliers API routes
  app.get("/api/suppliers/stats", getSupplierStats);
  app.get("/api/suppliers/categories", getSupplierCategories);
  app.get("/api/suppliers", getSuppliers);
  app.get("/api/suppliers/:id", getSupplierDetail);
  app.post("/api/suppliers", createSupplier);
  app.put("/api/suppliers/:id", updateSupplier);
  app.delete("/api/suppliers/:id", deleteSupplier);

  // Branches (filiallar) API routes — dashboard moduli bilan himoyalanadi.
  app.use("/api/branches", requireModule("dashboard"));
  app.get("/api/branches/stats", getBranchStats);
  app.get("/api/branches", getBranches);
  app.post("/api/branches", createBranch);
  app.put("/api/branches/:id", updateBranch);
  app.delete("/api/branches/:id", deleteBranch);

  // Orders API routes
  app.get("/api/orders/stats", getOrderStats);
  app.get("/api/orders/breakdown", getOrderBreakdown);
  app.get("/api/orders", getOrders);
  app.get("/api/orders/:id", getOrderDetail);
  app.post("/api/orders", createOrder);
  app.put("/api/orders/:id", updateOrder);
  app.delete("/api/orders/:id", deleteOrder);

  // CRM API routes
  app.get("/api/crm/stats", getCRMStats);
  app.get("/api/crm/breakdown", getCRMBreakdown);
  app.get("/api/crm/funnel", getDealFunnel);
  app.get("/api/crm/deals", getDeals);
  app.post("/api/crm/deals", createDeal);
  app.put("/api/crm/deals/:id", updateDeal);
  app.delete("/api/crm/deals/:id", deleteDeal);

  // Purchases API routes
  app.get("/api/purchases/stats", getPurchaseStats);
  app.get("/api/purchases", getPurchases);
  app.post("/api/purchases", createPurchase);
  app.put("/api/purchases/:id", updatePurchase);
  app.delete("/api/purchases/:id", deletePurchase);

  // Invoices API routes
  app.get("/api/invoices/stats", getInvoiceStats);
  app.get("/api/invoices", getInvoices);
  app.post("/api/invoices", createInvoice);
  app.post("/api/invoices/:id/payment", recordInvoicePayment);
  app.put("/api/invoices/:id", updateInvoice);
  app.delete("/api/invoices/:id", deleteInvoice);

  // Debts (Qarzlar) API routes
  app.get("/api/debts/stats", getDebtStats);
  app.get("/api/debts/customers", getCustomerDebts);
  app.get("/api/debts/customers/:customerId/history", getCustomerDebtHistory);
  app.get("/api/debts/payments", getDebtPayments);
  app.post("/api/debts/payments", createDebtPayment);
  app.delete("/api/debts/customers/:customerId", clearCustomerDebt);

  // Attendance & leave API routes
  app.get("/api/attendance/stats", getAttendanceStats);
  app.get("/api/attendance", getAttendance);
  app.post("/api/attendance", markAttendance);
  app.delete("/api/attendance/clear", clearAllAttendance);
  app.get("/api/leave/stats", getLeaveStats);
  app.get("/api/leave", getLeaveRequests);
  app.post("/api/leave", createLeaveRequest);
  app.put("/api/leave/:id", updateLeaveRequest);
  app.delete("/api/leave/:id", deleteLeaveRequest);

  // Payroll (ish haqi) API routes
  app.get("/api/payroll/stats", getPayrollStats);
  app.get("/api/payroll/periods", getPayrollPeriods);
  app.get("/api/payroll", getPayrolls);
  app.post("/api/payroll/calculate", calculatePayroll);
  app.put("/api/payroll/:id", updatePayroll);
  app.delete("/api/payroll/:id", deletePayroll);

  // Users & roles API routes
  app.get("/api/users/stats", getUserStats);
  app.get("/api/users/roles", getRolePermissions);
  app.get("/api/users", getUsers);
  app.post("/api/users", createUser);
  app.put("/api/users/:id", updateUser);
  app.delete("/api/users/:id", deleteUser);

  // Reports API routes
  app.get("/api/reports/summary", getReportSummary);
  app.get("/api/reports/export", exportReport);

  // Audit-log API routes (faqat audit huquqiga ega rollar — admin)
  app.get("/api/audit-logs/stats", getAuditStats);
  app.get("/api/audit-logs", getAuditLogs);

  // Noma'lum API yo'llari HTML emas, JSON qaytarishi kerak — aks holda client
  // javobni parse qila olmay tushunarsiz xato beradi.
  app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, message: "Endpoint topilmadi" });
  });

  // Kutilmagan xatolarda ham JSON qaytaramiz va log'laymiz.
  const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    logger.error("Server xatosi:", {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
    });

    // Production'da xato detallari foydalanuvchiga ko'rinmasin (xavfsizlik)
    if (process.env.NODE_ENV === "production") {
      return res.status(error.status || 500).json({
        success: false,
        message: "Ichki server xatosi. Iltimos, keyinroq urinib ko'ring.",
      });
    }

    // Development'da to'liq xato ma'lumotlari
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Ichki server xatosi",
      stack: error.stack,
    });
  };
  app.use(errorHandler);

  return app;
}
