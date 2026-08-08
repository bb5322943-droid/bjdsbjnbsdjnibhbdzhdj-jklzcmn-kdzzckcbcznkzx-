// Constants for form options - separated from React components to avoid HMR issues

export const CUSTOMER_TYPE_OPTIONS = [
  { value: "individual", label: "Jismoniy shaxs" },
  { value: "company", label: "Yuridik shaxs" },
] as const;

export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Kutilmoqda" },
  { value: "processing", label: "Jarayonda" },
  { value: "shipped", label: "Yuborilgan" },
  { value: "delivered", label: "Yetkazilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
] as const;

export const PURCHASE_PAYMENT_OPTIONS = [
  { value: "cash", label: "Naqd" },
  { value: "card", label: "Karta" },
  { value: "transfer", label: "O'tkazma" },
  { value: "credit", label: "Nasiya" },
] as const;

export const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Menejer" },
  { value: "employee", label: "Xodim" },
  { value: "accountant", label: "Buxgalter" },
] as const;

export const LEAVE_STATUS_OPTIONS = [
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
] as const;

export const INVOICE_STATUS_OPTIONS = [
  { value: "draft", label: "Qoralama" },
  { value: "sent", label: "Yuborilgan" },
  { value: "paid", label: "To'langan" },
  { value: "overdue", label: "Muddati o'tgan" },
  { value: "cancelled", label: "Bekor qilingan" },
] as const;

export const DEAL_STATUS_OPTIONS = [
  { value: "new_lead", label: "Yangi lead" },
  { value: "negotiation", label: "Muzokara" },
  { value: "proposal", label: "Taklif" },
  { value: "closed_won", label: "Muvaffaqiyatli" },
  { value: "closed_lost", label: "Yopilgan" },
] as const;

export const DEPARTMENT_OPTIONS = [
  { value: "it", label: "IT bo'limi" },
  { value: "finance", label: "Moliya bo'limi" },
  { value: "hr", label: "HR bo'limi" },
  { value: "marketing", label: "Marketing bo'limi" },
  { value: "sales", label: "Savdo bo'limi" },
] as const;

export const PRODUCT_CATEGORY_OPTIONS = [
  { value: "electronics", label: "Elektronika" },
  { value: "office", label: "Ofis jihozlari" },
  { value: "furniture", label: "Mebel" },
  { value: "supplies", label: "Ehtiyot qismlar" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Naqd pul" },
  { value: "card", label: "Bank kartasi" },
  { value: "bank_transfer", label: "Bank o'tkazmasi" },
  { value: "check", label: "Chek" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Past" },
  { value: "medium", label: "O'rtacha" },
  { value: "high", label: "Yuqori" },
  { value: "urgent", label: "Shoshilinch" },
] as const;