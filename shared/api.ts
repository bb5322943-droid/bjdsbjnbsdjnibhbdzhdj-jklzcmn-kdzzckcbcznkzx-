/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * O'chirilishi mumkin bo'lgan yozuvlar uchun umumiy maydon (soft delete).
 * `deletedAt` to'ldirilgan bo'lsa — yozuv arxivda, ro'yxatlarda ko'rsatilmaydi.
 */
export interface SoftDeleteFields {
  deletedAt?: string | null;
}

// Dashboard API Types
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeEmployees: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
  employeesChange: number;
}

export interface Activity {
  id: string;
  userId: string;
  userInitials: string;
  userBgClass: string;
  action: string;
  details: string;
  timestamp: string;
  icon: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
}

/** Dashboard grafigidagi bitta kun. */
export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}

/** Savdo voronkasining bitta bosqichi. */
export interface FunnelStage {
  status: Deal['status'];
  label: string;
  count: number;
  value: number;
}

// Tahliliy kesimlar — kartochkalardagi "eng ko'p / eng katta" ro'yxatlar uchun.

/** Kategoriya bo'yicha kirim/chiqim. */
export interface CategoryBreakdown {
  category: string;
  income: number;
  expense: number;
}

/** Hisob (bank/kassa) bo'yicha qoldiq. */
export interface AccountBalance {
  account: string;
  balance: number;
  income: number;
  expense: number;
}

export interface FinanceBreakdown {
  byCategory: CategoryBreakdown[];
  byAccount: AccountBalance[];
}

export interface DepartmentBreakdown {
  department: string;
  headcount: number;
  salaryTotal: number;
  onLeave: number;
}

export interface HRBreakdown {
  byDepartment: DepartmentBreakdown[];
  /** Oylik jami maosh fondi. */
  totalMonthlyPayroll: number;
}

// === SALES MODULE ===

/** Sotuv mahsuloti (chek yoki fakturadagi bitta qator). */
export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
}

/** Sotuv (chek/invoice). */
export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  status: 'completed' | 'refunded' | 'partial_refund';
  sellerId: string;
  sellerName: string;
  branchId: string;
  branchName: string;
  saleDate: string;
  note?: string;
  receiptPrinted: boolean;
}

/** Refund (qaytarib berish). */
export interface Refund {
  id: string;
  refundNumber: string;
  originalSaleId: string;
  originalSaleNumber: string;
  items: SaleItem[];
  refundAmount: number;
  refundReason: string;
  processedById: string;
  processedByName: string;
  refundDate: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'cancelled';
}

/** Sotuv statistikasi. */
export interface SalesStats {
  todaySales: number;
  todayTransactions: number;
  monthSales: number;
  monthTransactions: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  topSellers: Array<{
    sellerId: string;
    sellerName: string;
    salesCount: number;
    revenue: number;
  }>;
}

// === POS MODULE ===

/** POS da sotilayotgan mahsulot. */
export interface POSCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  discount?: number;
  category: string;
  barcode?: string;
}

/** POS savat (cart). */
export interface POSCart {
  items: POSCartItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  total: number;
  itemCount: number;
}

/** POS da mahsulot qidirish uchun. */
export interface POSProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  barcode?: string;
  quantity: number; // ombordagi qoldiq
  image?: string;
}

/** POS tranzaksiya (sotuv). */
export interface POSTransaction {
  id: string;
  transactionNumber: string;
  items: POSCartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mixed';
  cashReceived?: number;
  cardAmount?: number;
  cashAmount?: number;
  change?: number;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  branchId: string;
  branchName: string;
  timestamp: string;
  status: 'completed' | 'cancelled' | 'refunded';
  receiptPrinted: boolean;
  note?: string;
}

/** POS da tez tugmalar uchun mahsulot kategoriyalari. */
export interface POSCategory {
  id: string;
  name: string;
  color: string;
  productCount: number;
}

/** POS statistikasi. */
export interface POSStats {
  todayTransactions: number;
  todayRevenue: number;
  averageTransactionSize: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethodBreakdown: {
    cash: { count: number; amount: number };
    card: { count: number; amount: number };
    mixed: { count: number; amount: number };
  };
}

// === POSTS MODULE ===

/** Post kategoriyasi. */
export type PostCategory = 'news' | 'announcement' | 'blog' | 'update' | 'event';

/** Post holati. */
export type PostStatus = 'draft' | 'published' | 'archived';

/** Post. */
export interface Post extends SoftDeleteFields {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  category: PostCategory;
  status: PostStatus;
  tags?: string[];
  viewCount: number;
  likesCount: number;
  createdDate: string;
  updatedDate: string;
  publishedDate?: string;
}

/** Yangi post yaratish uchun ma'lumotlar. */
export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  category: PostCategory;
  status: PostStatus;
  tags?: string[];
}

/** Postni yangilash uchun ma'lumotlar. */
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string;
  category?: PostCategory;
  status?: PostStatus;
  tags?: string[];
}

/** Posts statistikasi. */
export interface PostsStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  popularPosts: Array<{
    id: string;
    title: string;
    viewCount: number;
    category: PostCategory;
  }>;
  recentPosts: Array<{
    id: string;
    title: string;
    authorName: string;
    createdDate: string;
    status: PostStatus;
  }>;
}

export interface PayrollBreakdown {
  byDepartment: DepartmentBreakdown[];
  salaryFund: number;
  averageSalary: number;
}

export interface GroupValue {
  label: string;
  count: number;
  value: number;
}

export interface WarehouseBreakdown {
  byCategory: GroupValue[];
  byLocation: GroupValue[];
  topSuppliers: GroupValue[];
  /** Qoldig'i minimal chegaradan past mahsulotlar (eng tanqisi birinchi). */
  lowStockItems: Product[];
}

export interface CRMBreakdown {
  topClients: GroupValue[];
  byAssignee: GroupValue[];
  /** Yopilgan bitimlar ichida yutuqlar ulushi, foizda. */
  conversionRate: number;
  averageDealSize: number;
  /** Yaqin 7 kun ichida yopilishi kutilayotgan ochiq bitimlar. */
  closingSoon: Deal[];
  /** Muddati o'tgan, hali yopilmagan bitimlar. */
  overdue: Deal[];
}

// Finance API Types
export interface FinanceStats {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  balanceChange: number;
}

export interface Transaction extends SoftDeleteFields {
  id: string;
  title: string;
  category: string;
  account: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface CreateTransactionRequest {
  title: string;
  category: string;
  account: string;
  amount: number;
  type: 'income' | 'expense';
  /** ISO sana (YYYY-MM-DD). Berilmasa bugungi sana qo'yiladi. */
  date?: string;
  description?: string;
}

// HR API Types
export interface Employee extends SoftDeleteFields {
  id: string;
  name: string;
  position: string;
  department: string;
  status: 'active' | 'vacation' | 'sick_leave';
  salary: number;
  hireDate: string;
  email: string;
  phone: string;
}

export interface HRStats {
  totalEmployees: number;
  onVacationToday: number;
  attendanceRate: number;
  openPositions: number;
}

export interface CreateEmployeeRequest {
  name: string;
  position: string;
  department: string;
  salary: number;
  email: string;
  phone: string;
}

// Warehouse API Types
export interface Product extends SoftDeleteFields {
  id: string;
  name: string;
  location: string;
  quantity: number;
  minQuantity: number;
  price: number;
  category: string;
  supplier: string;
}

export interface WarehouseStats {
  totalProducts: number;
  normalStock: number;
  lowStock: number;
  warehouseValue: number;
}

export interface CreateProductRequest {
  name: string;
  location: string;
  quantity: number;
  minQuantity: number;
  price: number;
  category: string;
  supplier: string;
}

// CRM API Types
export interface Deal extends SoftDeleteFields {
  id: string;
  clientName: string;
  status: 'new_lead' | 'negotiation' | 'proposal' | 'closed_won' | 'closed_lost';
  value: number;
  description: string;
  createdDate: string;
  expectedCloseDate: string;
  assignedTo: string;
}

export interface CRMStats {
  totalPipeline: number;
  newLeads: number;
  inNegotiation: number;
  closedThisMonth: number;
}

export interface CreateDealRequest {
  clientName: string;
  value: number;
  description: string;
  expectedCloseDate: string;
  assignedTo: string;
}

// Customers API Types — mijoz kartotekasi. Bitim va buyurtmalar shu yozuvga bog'lanadi.
export interface Customer extends SoftDeleteFields {
  id: string;
  name: string;
  type: 'company' | 'individual';
  contactPerson: string;
  phone: string;
  email: string;
  region: string;
  address: string;
  status: 'active' | 'inactive';
  createdDate: string;
  note: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  /** Yetkazilgan buyurtmalar bo'yicha jami tushum. */
  totalRevenue: number;
}

export interface CreateCustomerRequest {
  name: string;
  type: 'company' | 'individual';
  contactPerson: string;
  phone: string;
  email: string;
  region: string;
  address: string;
  note: string;
}

// Suppliers API Types — ta'minotchi kartotekasi.
export interface Supplier extends SoftDeleteFields {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  status: 'active' | 'inactive';
  /** 1–5 oralig'idagi baho. */
  rating: number;
  createdDate: string;
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  categories: number;
  averageRating: number;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  rating: number;
}

// Branches API Types — kompaniya filiallari.
export interface Branch extends SoftDeleteFields {
  id: string;
  name: string;
  /** Bosh ofis yagona bo'ladi — sahifada alohida belgilanadi. */
  type: 'head_office' | 'branch';
  region: string;
  address: string;
  phone: string;
  /** Filialga mas'ul xodim (ixtiyoriy). */
  manager: string;
  status: 'active' | 'inactive';
  createdDate: string;
  note: string;
}

export interface BranchStats {
  totalBranches: number;
  activeBranches: number;
  regions: number;
}

export interface CreateBranchRequest {
  name: string;
  type: Branch['type'];
  region: string;
  address: string;
  phone: string;
  manager: string;
  note: string;
}

export type UpdateBranchRequest = Partial<CreateBranchRequest> & {
  status?: Branch['status'];
};

// Orders API Types — savdo buyurtmasi. ERP yadrosi: mijoz + mahsulot + ombor + moliya.
export interface OrderItem {
  productId: string;
  /** Buyurtma paytidagi nom — keyin mahsulot nomi o'zgarsa ham hujjat o'zgarmaydi. */
  productName: string;
  quantity: number;
  /** Buyurtma paytidagi narx. */
  price: number;
}

export type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// Qarz to'lovlari tarixi
export interface DebtPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  note: string;
  createdBy: string;
}

// Mijoz qarz xulasasi
export interface CustomerDebt {
  customerId: string;
  customerName: string;
  totalDebt: number; // Jami qarz
  paidAmount: number; // To'langan
  remainingDebt: number; // Qoldiq qarz
  orderCount: number; // Qarzli buyurtmalar soni
  oldestDebtDate: string; // Eng eski qarz sanasi
  lastPaymentDate: string | null; // Oxirgi to'lov sanasi
}

// Qarz statistikasi
export interface DebtStats {
  totalDebt: number; // Jami qarz
  paidToday: number; // Bugun to'langan
  overdueDebt: number; // Muddati o'tgan qarzlar
  customersInDebt: number; // Qarzdor mijozlar soni
}

export interface Order extends SoftDeleteFields {
  id: string;
  orderNumber: string;
  customerId: string;
  /** Buyurtma paytidagi mijoz nomi — ro'yxatda qo'shimcha so'rovsiz ko'rsatish uchun. */
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  deliveryDate: string;
  assignedTo: string;
  note: string;
}

export interface OrderStats {
  totalOrders: number;
  /** Yetkazilmagan va bekor qilinmagan buyurtmalar. */
  pendingOrders: number;
  deliveredThisMonth: number;
  totalValue: number;
  unpaidAmount: number;
}

export interface CreateOrderRequest {
  customerId: string;
  items: { productId: string; quantity: number; price?: number }[];
  deliveryDate: string;
  assignedTo: string;
  note?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface OrderBreakdown {
  byStatus: GroupValue[];
  topCustomers: GroupValue[];
  topProducts: GroupValue[];
}

// Ombor harakatlari — qoldiq nega o'zgargani tarixi.
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  /** Harakatdan keyingi qoldiq — inventarizatsiya tekshiruvi uchun. */
  balanceAfter: number;
  reason: string;
  /** Bog'liq hujjat, masalan buyurtma raqami. */
  reference: string;
  date: string;
}

// Purchases API Types — ta'minotchiga beriladigan xarid buyurtmasi.
export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  /** Xarid tannarxi (sotish narxidan farq qiladi). */
  cost: number;
}

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface Purchase extends SoftDeleteFields {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  expectedDate: string;
  createdBy: string;
  note: string;
}

export interface PurchaseStats {
  totalPurchases: number;
  /** Buyurtma berilgan, lekin hali qabul qilinmagan. */
  awaitingDelivery: number;
  receivedThisMonth: number;
  totalValue: number;
  unpaidAmount: number;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  items: { productId: string; quantity: number; cost?: number }[];
  expectedDate: string;
  createdBy: string;
  note?: string;
  status?: PurchaseStatus;
  paymentStatus?: PaymentStatus;
}

// Invoices API Types — mijozga chiqariladigan hisob-faktura.
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice extends SoftDeleteFields {
  id: string;
  invoiceNumber: string;
  /** Bog'liq buyurtma; qo'lda yaratilgan fakturada bo'sh bo'ladi. */
  orderId: string | null;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  note: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  /** Chiqarilgan, lekin to'liq to'lanmagan. */
  outstandingCount: number;
  outstandingAmount: number;
  overdueCount: number;
  paidThisMonth: number;
}

export interface CreateInvoiceRequest {
  customerId: string;
  orderId?: string | null;
  amount: number;
  dueDate: string;
  note?: string;
  status?: InvoiceStatus;
}

// HR: davomat va ta'til.
export type AttendanceStatus = 'present' | 'late' | 'remote' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  status: AttendanceStatus;
  /** "09:05" ko'rinishidagi vaqt; kelmagan kunlarda bo'sh. */
  checkIn: string;
  checkOut: string;
  hours: number;
  note: string;
}

export interface AttendanceStats {
  /** Jami xodimlar soni. */
  totalEmployees: number;
  /** Bugungi kun kesimi. */
  present: number;
  late: number;
  remote: number;
  absent: number;
  onLeave: number;
  attendanceRate: number;
}

export type LeaveType = 'vacation' | 'sick' | 'unpaid' | 'personal';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest extends SoftDeleteFields {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string;
  requestedDate: string;
}

export interface LeaveStats {
  pending: number;
  approvedThisMonth: number;
  onLeaveToday: number;
  totalDaysThisYear: number;
}

export interface CreateLeaveRequest {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

// Payroll — ish haqi hisob-kitobi (TZ 7-bo'lim).
export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface Payroll extends SoftDeleteFields {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  /** Hisob davri, masalan "2026-07". */
  period: string;
  baseSalary: number;
  /** Oylik ish kunlari soni. */
  workingDays: number;
  /** Xodim kelgan kunlar (davomatdan). */
  presentDays: number;
  /** Kelmagan kunlar uchun ushlanma. */
  absenceDeduction: number;
  bonus: number;
  penalty: number;
  /** Daromad solig'i (12%). */
  tax: number;
  /** Yakuniy to'lanadigan summa. */
  netSalary: number;
  status: PayrollStatus;
  createdDate: string;
  note: string;
}

export interface PayrollStats {
  /** Joriy davr uchun yaratilgan hisob-kitoblar soni. */
  totalPayrolls: number;
  /** Jami to'lanadigan (net) summa. */
  totalNet: number;
  /** To'langanlar soni. */
  paidCount: number;
  pendingCount: number;
}

export interface CalculatePayrollRequest {
  /** Hisob davri "YYYY-MM"; berilmasa joriy oy. */
  period?: string;
  /** Faqat shu xodim uchun; berilmasa barcha faol xodimlar. */
  employeeId?: string;
}

export interface UpdatePayrollRequest {
  bonus?: number;
  penalty?: number;
  status?: PayrollStatus;
  note?: string;
}

// Users & roles — kim nima qila oladi.
export type UserRole = 'admin' | 'manager' | 'accountant' | 'warehouse' | 'sales' | 'viewer' | 'cashier' | 'hr_manager';

/** Ruxsat nazorati moduli — backend va frontend bitta manbadan foydalanadi. */
export type PermissionModule =
  | 'dashboard'
  | 'finance'
  | 'hr'
  | 'warehouse'
  | 'crm'
  | 'sales'
  | 'posts'
  | 'reports'
  | 'users'
  | 'audit';

export type PermissionAccess = 'view' | 'manage';

export interface User extends SoftDeleteFields {
  id: string;
  name: string;
  login: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  /** ISO vaqt; hech qachon kirmagan bo'lsa bo'sh. */
  lastLogin: string;
  employeeId: string | null;
  createdDate: string;
}

/**
 * Parol hash'i bilan birga saqlanadigan yozuv — faqat server ichida ishlatiladi.
 * API javoblarida `passwordHash` hech qachon qaytarilmaydi.
 */
export interface StoredUser extends User {
  passwordHash: string;
}

export interface LoginRequest {
  /** Login (foydalanuvchi nomi) yoki email — ikkalasi ham qabul qilinadi. */
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Audit-log — tizimdagi har bir muhim amal tarixi (TZ 14-bo'lim).
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'auth';

export interface AuditLog {
  id: string;
  /** Amalni bajargan foydalanuvchi. */
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  /** Qaysi modul/entity ustida, masalan "finance.transaction". */
  entity: string;
  /** O'zgargan yozuv id'si (bo'lsa). */
  entityId: string;
  /** Inson o'qiy oladigan tavsif. */
  summary: string;
  ipAddress: string;
  timestamp: string;
}

export interface AuditStats {
  total: number;
  today: number;
  creates: number;
  updates: number;
  deletes: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  /** Oxirgi 7 kun ichida tizimga kirganlar. */
  activeThisWeek: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
}

/** Rol uchun ruxsat etilgan bo'limlar — sozlamalar sahifasidagi matritsa uchun. */
export interface RolePermission {
  role: UserRole;
  label: string;
  description: string;
  modules: string[];
}

// Reports — yig'ma hisobot.
export interface ProfitLossRow {
  label: string;
  income: number;
  expense: number;
}

export interface ReportSummary {
  period: { from: string; to: string };
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  /** Sof foydaning daromadga nisbati, foizda. */
  margin: number;
  ordersCount: number;
  ordersValue: number;
  purchasesValue: number;
  newCustomers: number;
  byCategory: ProfitLossRow[];
  monthly: ProfitLossRow[];
  topProducts: GroupValue[];
  topCustomers: GroupValue[];
}

// Update request types — barcha maydonlar ixtiyoriy (qisman yangilash).
export type UpdatePurchaseRequest = Partial<CreatePurchaseRequest>;
export type UpdateInvoiceRequest = Partial<
  CreateInvoiceRequest & { paidAmount: number }
>;
export type UpdateLeaveRequest = Partial<
  CreateLeaveRequest & { status: LeaveStatus }
>;
export type UpdateUserRequest = Partial<
  CreateUserRequest & { status: User['status'] }
>;
export type UpdateCustomerRequest = Partial<
  CreateCustomerRequest & { status: Customer['status'] }
>;
export type UpdateSupplierRequest = Partial<
  CreateSupplierRequest & { status: Supplier['status'] }
>;
export type UpdateOrderRequest = Partial<CreateOrderRequest>;
export type UpdateTransactionRequest = Partial<CreateTransactionRequest>;
export type UpdateEmployeeRequest = Partial<
  CreateEmployeeRequest & { status: Employee['status'] }
>;
export type UpdateProductRequest = Partial<CreateProductRequest>;
export type UpdateDealRequest = Partial<
  CreateDealRequest & { status: Deal['status'] }
>;

// Common API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Supplier Detail Page Types
export interface SupplierPurchase {
  id: string;
  purchaseNumber: string;
  orderDate: string;
  items: PurchaseItem[];
  total: number;
  paymentStatus: PaymentStatus;
  status: PurchaseStatus;
}

export interface SupplierProduct {
  id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  price: number;
  lastDeliveryDate?: string;
}

export interface SupplierReturn {
  id: string;
  returnDate: string;
  purchaseNumber: string;
  productName: string;
  quantity: number;
  reason: 'defective' | 'wrong_item' | 'damaged' | 'quality' | 'expired' | 'other';
  reasonText: string;
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
}

export interface SupplierFinancial {
  summary: {
    totalPaid: number;
    currentDebt: number;
    lastPaymentDate?: string;
  };
  history: FinancialRecord[];
}

export interface FinancialRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'payment' | 'purchase';
  balance: number;
}

export interface SupplierKPI {
  totalPurchases: number;
  ordersCount: number;
  avgRating: number;
  returnsCount: number;
}

export interface ReturnProductRequest {
  productId: string;
  quantity: number;
  reason: SupplierReturn['reason'];
  note: string;
}

// Receipt Types
export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  saleNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  sellerName: string;
  branchName: string;
}

// Sales & Refund Types
export interface CreateSaleData {
  items: SaleItem[];
  discount: number;
  tax: number;
  paymentMethod: Sale['paymentMethod'];
  customerId?: string;
  note?: string;
}

export interface RefundItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface RefundSaleData {
  id: string;
  items: RefundItem[];
  refundReason: string;
  paymentMethod: Refund['paymentMethod'];
}
