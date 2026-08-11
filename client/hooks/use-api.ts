import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  Activity,
  Alert,
  ApiResponse,
  AuditLog,
  AuditStats,
  AttendanceRecord,
  AttendanceStats,
  Branch,
  BranchStats,
  CRMBreakdown,
  CRMStats,
  CreateBranchRequest,
  CreateCustomerRequest,
  CreateDealRequest,
  CreateEmployeeRequest,
  CreateLeaveRequest,
  CreateOrderRequest,
  CreateProductRequest,
  CreatePurchaseRequest,
  CreateSupplierRequest,
  CreateTransactionRequest,
  CreateUserRequest,
  CalculatePayrollRequest,
  UpdateBranchRequest,
  UpdatePayrollRequest,
  Customer,
  CustomerDebt,
  CustomerStats,
  DashboardStats,
  Deal,
  DebtPayment,
  DebtStats,
  Employee,
  FinanceBreakdown,
  FinanceStats,
  FunnelStage,
  HRBreakdown,
  HRStats,
  LeaveRequest,
  LeaveStats,
  Order,
  OrderBreakdown,
  OrderStats,
  PaginatedResponse,
  Payroll,
  PayrollStats,
  Product,
  Purchase,
  PurchaseStats,
  ReportSummary,
  RolePermission,
  StockMovement,
  Supplier,
  SupplierStats,
  Transaction,
  TrendPoint,
  UpdateCustomerRequest,
  UpdateDealRequest,
  UpdateEmployeeRequest,
  UpdateLeaveRequest,
  UpdateOrderRequest,
  UpdateProductRequest,
  UpdatePurchaseRequest,
  UpdateSupplierRequest,
  UpdateTransactionRequest,
  UpdateUserRequest,
  User,
  UserStats,
  WarehouseBreakdown,
  WarehouseStats,
} from "@shared/api";
import { getToken, handleUnauthorized } from "./use-auth";

const API_BASE = "/api";

/**
 * Server xatolarini o'qiladigan xabarga aylantiradi.
 * Backend har doim {success, message} JSON qaytaradi, lekin proxy yoki tarmoq
 * xatosida oddiy matn kelishi mumkin — ikkala holat ham qo'llab-quvvatlanadi.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  /*
   * Content-Type sifatida `text/plain` yuboriladi (`application/json` emas).
   *
   * Sabab: Vercel serverless runtime `application/json` body'ni funksiyaga
   * yetkazishdan oldin o'zi parse qilmoqchi bo'ladi va bizning custom build +
   * bundle muhitimizda bu POST so'rovni "400 Bad Request" bilan rad etadi
   * (funksiya hatto chaqirilmaydi). `text/plain` da Vercel body'ga tegmaydi va
   * xom JSON matnini to'g'ridan-to'g'ri serverga uzatadi. Server (Express)
   * body'ni o'zi xom o'qib JSON.parse qiladi — shuning uchun payload o'zgarmaydi.
   */
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // Sessiya tugagan yoki bekor qilingan — foydalanuvchini kirish sahifasiga qaytaramiz.
  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError("Avtorizatsiya talab qilinadi", 401);
  }

  if (!response.ok) {
    const body = await response.text();
    let message = `So'rov bajarilmadi (${response.status})`;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.message) message = parsed.message;
    } catch {
      if (body) message = body;
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
}

/**
 * Ro'yxat hook'lariga beriladigan qo'shimcha sozlamalar.
 * Filtrlardan alohida turadi, aks holda `enabled` query string'ga tushib qolardi.
 */
export interface QueryOptions {
  /** `false` bo'lsa so'rov yuborilmaydi (masalan, qidiruv oynasi yopiq turganda). */
  enabled?: boolean;
}

/** Query string'ni faqat to'ldirilgan parametrlardan quradi. */
function toQueryString(params: Record<string, unknown> | object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    search.set(key, String(value));
  });
  return search.toString();
}

// ---------------------------------------------------------------- Dashboard

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => fetchApi<ApiResponse<DashboardStats>>("/dashboard/stats"),
  });
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: ["dashboard", "trend"],
    queryFn: () => fetchApi<ApiResponse<TrendPoint[]>>("/dashboard/trend"),
  });
}

export function useRecentActivities(limit?: number) {
  return useQuery({
    queryKey: ["dashboard", "activities", limit],
    queryFn: () =>
      fetchApi<ApiResponse<Activity[]>>(
        `/dashboard/activities?${toQueryString({ limit })}`,
      ),
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["dashboard", "alerts"],
    queryFn: () => fetchApi<ApiResponse<Alert[]>>("/dashboard/alerts"),
  });
}

/**
 * Yozuv o'zgarganda qaysi query'lar eskirishini bitta joyda belgilaymiz.
 * Har bir modul dashboard ko'rsatkichlariga ta'sir qiladi, shuning uchun
 * dashboard doim birga yangilanadi.
 */
function useInvalidate(scope: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [scope] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

// ------------------------------------------------------------------ Finance

export function useFinanceStats() {
  return useQuery({
    queryKey: ["finance", "stats"],
    queryFn: () => fetchApi<ApiResponse<FinanceStats>>("/finance/stats"),
  });
}

export function useFinanceBreakdown() {
  return useQuery({
    queryKey: ["finance", "breakdown"],
    queryFn: () => fetchApi<ApiResponse<FinanceBreakdown>>("/finance/breakdown"),
  });
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: "all" | "income" | "expense";
  category?: string;
  from?: string;
  to?: string;
}

export function useTransactions(
  params: TransactionFilters = {},
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ["finance", "transactions", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<Transaction>>(
        `/finance/transactions?${toQueryString(params)}`,
      ),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useTransactionCategories() {
  return useQuery({
    queryKey: ["finance", "categories"],
    queryFn: () => fetchApi<ApiResponse<string[]>>("/finance/categories"),
  });
}

/**
 * Himoyalangan CSV endpointini yuklab oladi.
 *
 * `window.location` ishlatib bo'lmaydi — brauzer u yerda Authorization
 * sarlavhasini yubormaydi va so'rov 401 bilan qaytardi. Shuning uchun fayl
 * fetch orqali olinib, vaqtinchalik havola ustiga bosiladi.
 */
async function downloadCsv(path: string, fallbackName: string): Promise<void> {
  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) handleUnauthorized();
  if (!response.ok) {
    throw new ApiError("Faylni yuklab bo'lmadi", response.status);
  }

  // Fayl nomi server bergan sarlavhadan olinadi.
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Joriy filtrga mos tranzaksiyalarni CSV fayl sifatida yuklab oladi. */
export function downloadTransactionsCsv(params: TransactionFilters = {}): Promise<void> {
  const { page: _page, limit: _limit, ...rest } = params;
  return downloadCsv(
    `/finance/transactions/export?${toQueryString(rest)}`,
    "tranzaksiyalar.csv",
  );
}

/** Mahsulotlarni CSV fayl sifatida yuklab oladi. */
export function downloadProductsCsv(params: ProductFilters = {}): Promise<void> {
  const { page: _page, limit: _limit, ...rest } = params;
  return downloadCsv(
    `/warehouse/products/export?${toQueryString(rest)}`,
    "mahsulotlar.csv",
  );
}

export function useCreateTransaction() {
  const invalidate = useInvalidate("finance");
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      fetchApi<ApiResponse<Transaction>>("/finance/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidate("finance");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTransactionRequest & { id: string }) =>
      fetchApi<ApiResponse<Transaction>>(`/finance/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidate("finance");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/finance/transactions/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ----------------------------------------------------------------------- HR

export function useHRStats() {
  return useQuery({
    queryKey: ["hr", "stats"],
    queryFn: () => fetchApi<ApiResponse<HRStats>>("/hr/stats"),
  });
}

export function useHRBreakdown() {
  return useQuery({
    queryKey: ["hr", "breakdown"],
    queryFn: () => fetchApi<ApiResponse<HRBreakdown>>("/hr/breakdown"),
  });
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: Employee["status"];
}

export function useEmployees(params: EmployeeFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["hr", "employees", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<Employee>>(`/hr/employees?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["hr", "departments"],
    queryFn: () => fetchApi<ApiResponse<string[]>>("/hr/departments"),
  });
}

export function useCreateEmployee() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) =>
      fetchApi<ApiResponse<Employee>>("/hr/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateEmployeeRequest & { id: string }) =>
      fetchApi<ApiResponse<Employee>>(`/hr/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/hr/employees/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------- Warehouse

export function useWarehouseStats() {
  return useQuery({
    queryKey: ["warehouse", "stats"],
    queryFn: () => fetchApi<ApiResponse<WarehouseStats>>("/warehouse/stats"),
  });
}

export function useWarehouseBreakdown() {
  return useQuery({
    queryKey: ["warehouse", "breakdown"],
    queryFn: () => fetchApi<ApiResponse<WarehouseBreakdown>>("/warehouse/breakdown"),
  });
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  location?: string;
  lowStockOnly?: boolean;
}

export function useProducts(params: ProductFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["warehouse", "products", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<Product>>(`/warehouse/products?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useProductFilters() {
  return useQuery({
    queryKey: ["warehouse", "filters"],
    queryFn: () =>
      fetchApi<ApiResponse<{ categories: string[]; locations: string[] }>>(
        "/warehouse/filters",
      ),
  });
}

export function useCreateProduct() {
  const invalidate = useInvalidate("warehouse");
  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      fetchApi<ApiResponse<Product>>("/warehouse/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidate("warehouse");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProductRequest & { id: string }) =>
      fetchApi<ApiResponse<Product>>(`/warehouse/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate("warehouse");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/warehouse/products/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** Tanqis qoldiqli mahsulotlar uchun xarid buyurtmasi yaratadi. */
export function useRestockProducts() {
  const invalidate = useInvalidate("warehouse");
  return useMutation({
    mutationFn: () =>
      fetchApi<ApiResponse<Product[]>>("/warehouse/restock", { method: "POST" }),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------------- CRM

export function useCRMStats() {
  return useQuery({
    queryKey: ["crm", "stats"],
    queryFn: () => fetchApi<ApiResponse<CRMStats>>("/crm/stats"),
  });
}

export function useDealFunnel() {
  return useQuery({
    queryKey: ["crm", "funnel"],
    queryFn: () => fetchApi<ApiResponse<FunnelStage[]>>("/crm/funnel"),
  });
}

export function useCRMBreakdown() {
  return useQuery({
    queryKey: ["crm", "breakdown"],
    queryFn: () => fetchApi<ApiResponse<CRMBreakdown>>("/crm/breakdown"),
  });
}

export interface DealFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Deal["status"];
  assignedTo?: string;
}

export function useDeals(params: DealFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["crm", "deals", params],
    queryFn: () => fetchApi<PaginatedResponse<Deal>>(`/crm/deals?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCreateDeal() {
  const invalidate = useInvalidate("crm");
  return useMutation({
    mutationFn: (data: CreateDealRequest) =>
      fetchApi<ApiResponse<Deal>>("/crm/deals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateDeal() {
  const invalidate = useInvalidate("crm");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateDealRequest & { id: string }) =>
      fetchApi<ApiResponse<Deal>>(`/crm/deals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteDeal() {
  const invalidate = useInvalidate("crm");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/crm/deals/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------- Mijozlar

export function useCustomerStats() {
  return useQuery({
    queryKey: ["customers", "stats"],
    queryFn: () => fetchApi<ApiResponse<CustomerStats>>("/customers/stats"),
  });
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: Customer["type"];
  region?: string;
  status?: Customer["status"];
}

export function useCustomers(params: CustomerFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["customers", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<Customer>>(`/customers?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCustomerRegions() {
  return useQuery({
    queryKey: ["customers", "regions"],
    queryFn: () => fetchApi<ApiResponse<string[]>>("/customers/regions"),
  });
}

export function useCreateCustomer() {
  const invalidate = useInvalidate("customers");
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) =>
      fetchApi<ApiResponse<Customer>>("/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate("customers");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCustomerRequest & { id: string }) =>
      fetchApi<ApiResponse<Customer>>(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomer() {
  const invalidate = useInvalidate("customers");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/customers/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------------ Ta'minotchilar

export function useSupplierStats() {
  return useQuery({
    queryKey: ["suppliers", "stats"],
    queryFn: () => fetchApi<ApiResponse<SupplierStats>>("/suppliers/stats"),
  });
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: Supplier["status"];
}

export function useSuppliers(params: SupplierFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["suppliers", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<Supplier>>(`/suppliers?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useSupplierCategories() {
  return useQuery({
    queryKey: ["suppliers", "categories"],
    queryFn: () => fetchApi<ApiResponse<string[]>>("/suppliers/categories"),
  });
}

export function useCreateSupplier() {
  const invalidate = useInvalidate("suppliers");
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) =>
      fetchApi<ApiResponse<Supplier>>("/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateSupplier() {
  const invalidate = useInvalidate("suppliers");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSupplierRequest & { id: string }) =>
      fetchApi<ApiResponse<Supplier>>(`/suppliers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteSupplier() {
  const invalidate = useInvalidate("suppliers");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// -------------------------------------------------------------- Buyurtmalar

/**
 * Buyurtma o'zgarishi ombor qoldig'iga va (to'lov yakunlanganda) moliya balansiga
 * ta'sir qiladi — shuning uchun bog'liq bo'limlar ham yangilanadi.
 */
function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () => {
    ["orders", "warehouse", "finance", "customers", "dashboard"].forEach((scope) =>
      queryClient.invalidateQueries({ queryKey: [scope] }),
    );
  };
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["orders", "stats"],
    queryFn: () => fetchApi<ApiResponse<OrderStats>>("/orders/stats"),
  });
}

export function useOrderBreakdown() {
  return useQuery({
    queryKey: ["orders", "breakdown"],
    queryFn: () => fetchApi<ApiResponse<OrderBreakdown>>("/orders/breakdown"),
  });
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Order["status"];
  paymentStatus?: Order["paymentStatus"];
  customerId?: string;
}

export function useOrders(params: OrderFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["orders", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<Order>>(`/orders?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) =>
      fetchApi<ApiResponse<Order>>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateOrderRequest & { id: string }) =>
      fetchApi<ApiResponse<Order>>(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/orders/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// --------------------------------------------------------- Ombor harakatlari

export interface MovementFilters {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  type?: StockMovement["type"];
}

export function useStockMovements(params: MovementFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["warehouse", "movements", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<StockMovement>>(`/warehouse/movements?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

/** Qo'lda qoldiq tuzatish — inventarizatsiya yoki hisobdan chiqarish uchun. */
export function useAdjustStock() {
  const invalidate = useInvalidate("warehouse");
  return useMutation({
    mutationFn: ({ id, delta, reason }: { id: string; delta: number; reason: string }) =>
      fetchApi<ApiResponse<StockMovement>>(`/warehouse/products/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify({ delta, reason }),
      }),
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------------------ Xaridlar

/** Xarid qabul qilinishi ombor qoldig'iga, to'lov esa moliyaga ta'sir qiladi. */
function useInvalidatePurchases() {
  const queryClient = useQueryClient();
  return () => {
    ["purchases", "warehouse", "finance", "suppliers", "dashboard", "reports"].forEach(
      (scope) => queryClient.invalidateQueries({ queryKey: [scope] }),
    );
  };
}

export function usePurchaseStats() {
  return useQuery({
    queryKey: ["purchases", "stats"],
    queryFn: () => fetchApi<ApiResponse<PurchaseStats>>("/purchases/stats"),
  });
}

export interface PurchaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Purchase["status"];
  paymentStatus?: Purchase["paymentStatus"];
  supplierId?: string;
}

export function usePurchases(params: PurchaseFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["purchases", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<Purchase>>(`/purchases?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCreatePurchase() {
  const invalidate = useInvalidatePurchases();
  return useMutation({
    mutationFn: (data: CreatePurchaseRequest) =>
      fetchApi<ApiResponse<Purchase>>("/purchases", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdatePurchase() {
  const invalidate = useInvalidatePurchases();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePurchaseRequest & { id: string }) =>
      fetchApi<ApiResponse<Purchase>>(`/purchases/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeletePurchase() {
  const invalidate = useInvalidatePurchases();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/purchases/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------------- Fakturalar


// -------------------------------------------------------- Davomat va ta'til

export function useAttendanceStats() {
  return useQuery({
    queryKey: ["hr", "attendance", "stats"],
    queryFn: () => fetchApi<ApiResponse<AttendanceStats>>("/attendance/stats"),
  });
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  search?: string;
  employeeId?: string;
  department?: string;
  status?: AttendanceRecord["status"];
  date?: string;
}

export function useAttendance(params: AttendanceFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["hr", "attendance", "list", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<AttendanceRecord>>(`/attendance?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      status: AttendanceRecord["status"];
      date?: string;
      checkIn?: string;
      checkOut?: string;
      note?: string;
    }) =>
      fetchApi<ApiResponse<AttendanceRecord>>("/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      console.log("Davomat muvaffaqiyatli saqlandi:", data);
      // Barcha davomat querylarini kuchli yangilash
      queryClient.invalidateQueries({ queryKey: ["hr", "attendance"], refetchType: 'all' });
      // Qo'shimcha: to'g'ridan-to'g'ri refetch
      queryClient.refetchQueries({ queryKey: ["hr", "attendance", "list"] });
    },
  });
}

export function useClearAllAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<ApiResponse<null>>("/attendance/clear", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "attendance"] });
    },
  });
}

export function useLeaveStats() {
  return useQuery({
    queryKey: ["hr", "leave", "stats"],
    queryFn: () => fetchApi<ApiResponse<LeaveStats>>("/leave/stats"),
  });
}

export interface LeaveFilters {
  page?: number;
  limit?: number;
  search?: string;
  employeeId?: string;
  type?: LeaveRequest["type"];
  status?: LeaveRequest["status"];
}

export function useLeaveRequests(params: LeaveFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["hr", "leave", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<LeaveRequest>>(`/leave?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCreateLeaveRequest() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: (data: CreateLeaveRequest) =>
      fetchApi<ApiResponse<LeaveRequest>>("/leave", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateLeaveRequest() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateLeaveRequest & { id: string }) =>
      fetchApi<ApiResponse<LeaveRequest>>(`/leave/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteLeaveRequest() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/leave/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------------ Ish haqi (payroll)

export function usePayrollStats(period?: string) {
  return useQuery({
    queryKey: ["hr", "payroll", "stats", period],
    queryFn: () =>
      fetchApi<ApiResponse<PayrollStats>>(`/payroll/stats?${toQueryString({ period })}`),
  });
}

export function usePayrollPeriods() {
  return useQuery({
    queryKey: ["hr", "payroll", "periods"],
    queryFn: () => fetchApi<ApiResponse<string[]>>("/payroll/periods"),
  });
}

export interface PayrollFilters {
  page?: number;
  limit?: number;
  search?: string;
  period?: string;
  department?: string;
  status?: Payroll["status"];
}

export function usePayrolls(params: PayrollFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["hr", "payroll", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<Payroll>>(`/payroll?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

/** Ish haqini hisoblaydi — davomatga asoslanib yozuvlar yaratadi. */
export function useCalculatePayroll() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: (data: CalculatePayrollRequest) =>
      fetchApi<ApiResponse<Payroll[]>>("/payroll/calculate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdatePayroll() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePayrollRequest & { id: string }) =>
      fetchApi<ApiResponse<Payroll>>(`/payroll/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeletePayroll() {
  const invalidate = useInvalidate("hr");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/payroll/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------------ Filiallar

export function useBranchStats() {
  return useQuery({
    queryKey: ["branches", "stats"],
    queryFn: () => fetchApi<ApiResponse<BranchStats>>("/branches/stats"),
  });
}

export interface BranchFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: Branch["type"];
  region?: string;
  status?: Branch["status"];
}

export function useBranches(params: BranchFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["branches", "list", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<Branch>>(`/branches?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCreateBranch() {
  const invalidate = useInvalidate("branches");
  return useMutation({
    mutationFn: (data: CreateBranchRequest) =>
      fetchApi<ApiResponse<Branch>>("/branches", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateBranch() {
  const invalidate = useInvalidate("branches");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBranchRequest & { id: string }) =>
      fetchApi<ApiResponse<Branch>>(`/branches/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteBranch() {
  const invalidate = useInvalidate("branches");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/branches/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------ Foydalanuvchi va rol

export function useUserStats() {
  return useQuery({
    queryKey: ["users", "stats"],
    queryFn: () => fetchApi<ApiResponse<UserStats>>("/users/stats"),
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["users", "roles"],
    queryFn: () => fetchApi<ApiResponse<RolePermission[]>>("/users/roles"),
  });
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: User["role"];
  status?: User["status"];
}

export function useUsers(params: UserFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<User>>(`/users?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCreateUser() {
  const invalidate = useInvalidate("users");
  return useMutation({
    mutationFn: (data: CreateUserRequest) =>
      fetchApi<ApiResponse<User>>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidate("users");
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateUserRequest & { id: string }) =>
      fetchApi<ApiResponse<User>>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate("users");
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------------- Hisobotlar

export interface ReportPeriod {
  from?: string;
  to?: string;
}

export function useReportSummary(period: ReportPeriod = {}) {
  return useQuery({
    queryKey: ["reports", "summary", period],
    queryFn: () =>
      fetchApi<ApiResponse<ReportSummary>>(`/reports/summary?${toQueryString(period)}`),
    placeholderData: (previous) => previous,
  });
}

/** Yig'ma hisobotni CSV fayl sifatida yuklab oladi. */
export function downloadReportCsv(period: ReportPeriod = {}): Promise<void> {
  return downloadCsv(`/reports/export?${toQueryString(period)}`, "hisobot.csv");
}

// ---------------------------------------------------------------- Audit-log

export function useAuditStats() {
  return useQuery({
    queryKey: ["audit", "stats"],
    queryFn: () => fetchApi<ApiResponse<AuditStats>>("/audit-logs/stats"),
  });
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  search?: string;
  action?: AuditLog["action"];
  from?: string;
  to?: string;
}

export function useAuditLogs(params: AuditFilters = {}) {
  return useQuery({
    queryKey: ["audit", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<AuditLog>>(`/audit-logs?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
  });
}

export type AnyMutation = UseMutationResult<unknown, Error, never, unknown>;


// -------------------------------------------------------- Qarzlar (Debts)

export function useDebtStats() {
  return useQuery({
    queryKey: ["debts", "stats"],
    queryFn: () => fetchApi<ApiResponse<DebtStats>>("/debts/stats"),
  });
}

export function useCustomerDebts(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["debts", "customers", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<CustomerDebt>>(`/debts/customers?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
  });
}

export function useCustomerDebtHistory(customerId: string) {
  return useQuery({
    queryKey: ["debts", "customers", customerId, "history"],
    queryFn: () =>
      fetchApi<ApiResponse<{
        orders: Order[];
        payments: DebtPayment[];
        totalDebt: number;
        paidAmount: number;
        remainingDebt: number;
      }>>(`/debts/customers/${customerId}/history`),
    enabled: !!customerId,
  });
}

export function useDebtPayments(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["debts", "payments", params],
    queryFn: () =>
      fetchApi<PaginatedResponse<DebtPayment>>(`/debts/payments?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
  });
}

export function useCreateDebtPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      orderId: string;
      amount: number;
      paymentMethod: string;
      note?: string;
    }) =>
      fetchApi<ApiResponse<DebtPayment>>("/debts/payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useClearCustomerDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) =>
      fetchApi<ApiResponse<{ clearedOrders: number }>>(`/debts/customers/${customerId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}


// -------------------------------------------------------------------- Sales

/** Sales o'zgarishi ombor va dashboardga ta'sir qiladi. */
function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => {
    ["sales", "warehouse", "dashboard", "reports"].forEach((scope) =>
      queryClient.invalidateQueries({ queryKey: [scope] }),
    );
  };
}

export function useSalesStats() {
  return useQuery({
    queryKey: ["sales", "stats"],
    queryFn: () => fetchApi<ApiResponse<import("@shared/api").SalesStats>>("/sales/stats"),
  });
}

export interface SalesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: import("@shared/api").Sale["status"];
  paymentMethod?: string;
}

export function useSales(params: SalesFilters = {}, options?: QueryOptions) {
  return useQuery({
    queryKey: ["sales", "list", params],
    queryFn: () => fetchApi<PaginatedResponse<import("@shared/api").Sale>>(`/sales?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useCreateSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<ApiResponse<import("@shared/api").Sale>>("/sales", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useRefundSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; items: any[]; refundReason: string; paymentMethod: string }) =>
      fetchApi<ApiResponse<import("@shared/api").Refund>>(`/sales/${id}/refund`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<null>>(`/sales/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
