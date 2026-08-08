import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Building2,
  Calculator,
  CalendarCheck,
  ChartColumn,
  ChartNoAxesCombined,
  Contact,
  CreditCard,
  FileText,
  LayoutDashboard,
  LucideIcon,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDebounced } from "@/hooks/use-debounced";
import {
  useCustomers,
  useDeals,
  useEmployees,
  useInvoices,
  useLeaveRequests,
  useOrders,
  useProducts,
  usePurchases,
  useSuppliers,
  useTransactions,
  useUsers,
} from "@/hooks/use-api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

const PAGES: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Boshqaruv paneli", to: "/", icon: LayoutDashboard },
  { label: "Moliya", to: "/finance", icon: WalletCards },
  { label: "Hisobotlar", to: "/reports", icon: ChartColumn },
  { label: "Buyurtmalar", to: "/orders", icon: ShoppingCart },
  { label: "Sotuv", to: "/sales", icon: ShoppingCart },
  { label: "POS Sistema", to: "/pos", icon: CreditCard },
  { label: "Hisob-fakturalar", to: "/invoices", icon: FileText },
  { label: "Bitimlar", to: "/crm", icon: ChartNoAxesCombined },
  { label: "Mijozlar", to: "/customers", icon: Contact },
  { label: "Ombor", to: "/warehouse", icon: Boxes },
  { label: "Mahsulotlar", to: "/products", icon: Package },
  { label: "Xaridlar", to: "/purchases", icon: ShoppingBag },
  { label: "Ta'minotchilar", to: "/suppliers", icon: Truck },
  { label: "Xodimlar", to: "/hr", icon: UsersRound },
  { label: "Davomat va ta'til", to: "/attendance", icon: CalendarCheck },
  { label: "Foydalanuvchilar", to: "/users", icon: ShieldCheck },
  { label: "Filiallar", to: "/branches", icon: Building2 },
];

/** Bitta natija qatorining ko'rinishi. */
interface ResultRow {
  id: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
}

/** Qidiruv guruhi — bitta ma'lumot turi. */
interface ResultGroup {
  heading: string;
  icon: LucideIcon;
  to: string;
  rows: ResultRow[];
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  vacation: "Mehnat ta'tili",
  sick: "Kasallik",
  personal: "Shaxsiy",
  unpaid: "Haqsiz",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  manager: "Rahbar",
  accountant: "Buxgalter",
  warehouse: "Ombor xodimi",
  sales: "Sotuv menejeri",
  viewer: "Kuzatuvchi",
};

/**
 * ⌘K global qidiruv — sahifalar va loyihadagi barcha yozuvlar bo'yicha.
 *
 * Filtrlashni server bajaradi, shuning uchun cmdk ichki filtri o'chirilgan
 * (`shouldFilter={false}`): aks holda u natijalarni `value` bilan taqqoslab
 * qayta chiqarib tashlardi. Sahifalar ro'yxati shu sababli qo'lda filtrlanadi.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);
  const trimmed = debouncedQuery.trim();
  const hasQuery = trimmed.length > 1;

  // Yozuv kiritilmaguncha so'rov yubormaymiz — oyna har ochilganda
  // o'nlab ortiqcha so'rov ketmasligi uchun.
  const search = { search: trimmed, limit: 5 };
  const enabled = { enabled: hasQuery };

  const { data: orders } = useOrders(search, enabled);
  const { data: invoices } = useInvoices(search, enabled);
  const { data: customers } = useCustomers(search, enabled);
  const { data: deals } = useDeals(search, enabled);
  const { data: products } = useProducts(search, enabled);
  const { data: purchases } = usePurchases(search, enabled);
  const { data: suppliers } = useSuppliers(search, enabled);
  const { data: employees } = useEmployees(search, enabled);
  const { data: users } = useUsers(search, enabled);
  const { data: transactions } = useTransactions(search, enabled);
  const { data: leaveRequests } = useLeaveRequests(search, enabled);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const lowered = trimmed.toLowerCase();
  const visiblePages = hasQuery
    ? PAGES.filter((page) => page.label.toLowerCase().includes(lowered))
    : PAGES;

  const groups: ResultGroup[] = [
    {
      heading: "Buyurtmalar",
      icon: ShoppingCart,
      to: "/orders",
      rows: (orders?.data ?? []).map((order) => ({
        id: order.id,
        title: order.orderNumber,
        subtitle: order.customerName,
        meta: formatCurrency(order.total),
      })),
    },
    {
      heading: "Hisob-fakturalar",
      icon: FileText,
      to: "/invoices",
      rows: (invoices?.data ?? []).map((invoice) => ({
        id: invoice.id,
        title: invoice.invoiceNumber,
        subtitle: invoice.customerName,
        meta: formatCurrency(invoice.amount),
      })),
    },
    {
      heading: "Mijozlar",
      icon: Contact,
      to: "/customers",
      rows: (customers?.data ?? []).map((customer) => ({
        id: customer.id,
        title: customer.name,
        subtitle: customer.contactPerson || undefined,
        meta: customer.region,
      })),
    },
    {
      heading: "Bitimlar",
      icon: ChartNoAxesCombined,
      to: "/crm",
      rows: (deals?.data ?? []).map((deal) => ({
        id: deal.id,
        title: deal.clientName,
        subtitle: deal.assignedTo,
        meta: formatCurrency(deal.value),
      })),
    },
    {
      heading: "Mahsulotlar",
      icon: Boxes,
      to: "/warehouse",
      rows: (products?.data ?? []).map((product) => ({
        id: product.id,
        title: product.name,
        subtitle: product.category,
        meta: `${formatNumber(product.quantity)} dona`,
      })),
    },
    {
      heading: "Xaridlar",
      icon: ShoppingBag,
      to: "/purchases",
      rows: (purchases?.data ?? []).map((purchase) => ({
        id: purchase.id,
        title: purchase.purchaseNumber,
        subtitle: purchase.supplierName,
        meta: formatCurrency(purchase.total),
      })),
    },
    {
      heading: "Ta'minotchilar",
      icon: Truck,
      to: "/suppliers",
      rows: (suppliers?.data ?? []).map((supplier) => ({
        id: supplier.id,
        title: supplier.name,
        subtitle: supplier.contactPerson || undefined,
        meta: supplier.category,
      })),
    },
    {
      heading: "Xodimlar",
      icon: UsersRound,
      to: "/hr",
      rows: (employees?.data ?? []).map((employee) => ({
        id: employee.id,
        title: employee.name,
        subtitle: employee.department,
        meta: employee.position,
      })),
    },
    {
      heading: "Foydalanuvchilar",
      icon: ShieldCheck,
      to: "/users",
      rows: (users?.data ?? []).map((user) => ({
        id: user.id,
        title: user.name,
        subtitle: user.email,
        meta: ROLE_LABEL[user.role] ?? user.role,
      })),
    },
    {
      heading: "Tranzaksiyalar",
      icon: ReceiptText,
      to: "/finance",
      rows: (transactions?.data ?? []).map((transaction) => ({
        id: transaction.id,
        title: transaction.title,
        subtitle: transaction.category,
        meta: (
          <span
            className={
              transaction.type === "income" ? "text-[#2d8068]" : "text-slate-500"
            }
          >
            {transaction.type === "income" ? "+" : "−"}{" "}
            {formatCurrency(transaction.amount)}
          </span>
        ),
      })),
    },
    {
      heading: "Ta'til so'rovlari",
      icon: CalendarCheck,
      to: "/attendance",
      rows: (leaveRequests?.data ?? []).map((request) => ({
        id: request.id,
        title: request.employeeName,
        subtitle: LEAVE_TYPE_LABEL[request.type] ?? request.type,
        meta: `${formatDate(request.startDate)} · ${request.days} kun`,
      })),
    },
  ];

  const groupsWithResults = groups.filter((group) => group.rows.length > 0);
  const hasAnything = visiblePages.length > 0 || groupsWithResults.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Buyurtma, mijoz, mahsulot, xodim, faktura — barchasini qidiring..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!hasAnything && (
          <CommandEmpty>
            {hasQuery
              ? "Hech narsa topilmadi."
              : "Qidirish uchun kamida ikki harf yozing."}
          </CommandEmpty>
        )}

        {visiblePages.length > 0 && (
          <CommandGroup heading="Bo'limlar">
            {visiblePages.map((page) => (
              <CommandItem
                key={page.to}
                value={page.to}
                onSelect={() => go(page.to)}
              >
                <page.icon size={16} className="mr-2 shrink-0 text-slate-400" />
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groupsWithResults.map((group) => (
          <div key={group.heading}>
            <CommandSeparator />
            <CommandGroup heading={group.heading}>
              {group.rows.map((row) => (
                <CommandItem
                  key={`${group.heading}-${row.id}`}
                  value={`${group.heading}-${row.id}`}
                  onSelect={() => go(group.to)}
                >
                  <group.icon size={16} className="mr-2 shrink-0 text-slate-400" />
                  <span className="truncate">{row.title}</span>
                  {row.subtitle && (
                    <span className="ml-2 truncate text-xs text-slate-400">
                      {row.subtitle}
                    </span>
                  )}
                  {row.meta && (
                    <span className="ml-auto shrink-0 pl-3 text-xs text-slate-400">
                      {row.meta}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
