import { useState } from "react";
import {
  CircleCheck,
  CircleX,
  PackageCheck,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentStatus, Purchase, PurchaseStatus } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import {
  PurchaseDialog,
  PURCHASE_PAYMENT_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
} from "@/components/PurchaseDialog";
import {
  ErrorState,
  HeroStat,
  PageHeader,
  RowActions,
  SearchInput,
  StatTile,
  StatusBadge,
  ViewButton,
  ViewMode,
  ViewToggle,
} from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeletePurchase,
  usePurchaseStats,
  usePurchases,
  useUpdatePurchase,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

const ALL = "__all__";

const STATUS_META: Record<
  PurchaseStatus,
  { label: string; tone: "slate" | "blue" | "green" }
> = {
  draft: { label: "Qoralama", tone: "slate" },
  ordered: { label: "Buyurtma berilgan", tone: "blue" },
  received: { label: "Qabul qilingan", tone: "green" },
  cancelled: { label: "Bekor qilingan", tone: "slate" },
};

const PAYMENT_META: Record<
  PaymentStatus,
  { label: string; tone: "green" | "amber" | "red" }
> = {
  paid: { label: "To'langan", tone: "green" },
  partial: { label: "Qisman", tone: "amber" },
  unpaid: { label: "To'lanmagan", tone: "red" },
};

export default function Purchases() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [paymentStatus, setPaymentStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState<Purchase | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = usePurchaseStats();
  const { data, isLoading, isError, error, refetch } = usePurchases({
    page,
    limit: 10,
    search: debouncedSearch,
    status: status === ALL ? undefined : (status as PurchaseStatus),
    paymentStatus:
      paymentStatus === ALL ? undefined : (paymentStatus as PaymentStatus),
  });
  const deletePurchase = useDeletePurchase();
  const updatePurchase = useUpdatePurchase();

  const stats = statsData?.data;
  const purchases = data?.data ?? [];
  const pagination = data?.pagination;

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  // Xato bo'lsa ConfirmDialog uni ushlab, xabar ko'rsatadi va oynani ochiq qoldiradi.
  const handleDelete = async () => {
    if (!deleting) return;
    await deletePurchase.mutateAsync(deleting.id);
    toast.success(`${deleting.purchaseNumber} o'chirildi`);
  };

  const changeStatus = async (purchase: Purchase, next: PurchaseStatus) => {
    try {
      await updatePurchase.mutateAsync({ id: purchase.id, status: next });
      toast.success(
        `${purchase.purchaseNumber}: ${STATUS_META[next].label.toLowerCase()}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  const markPaid = async (purchase: Purchase) => {
    try {
      await updatePurchase.mutateAsync({
        id: purchase.id,
        paymentStatus: "paid",
      });
      toast.success(`${purchase.purchaseNumber} to'langan deb belgilandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (purchase: Purchase) => {
    setEditing(purchase);
    setDialogOpen(true);
  };

  /** Holatga qarab keyingi mantiqiy qadamlar. */
  const purchaseMenuItems = (purchase: Purchase) => {
    const items = [];
    if (purchase.status === "draft") {
      items.push(
        <DropdownMenuItem
          key="order"
          onSelect={() => changeStatus(purchase, "ordered")}
          className="gap-2"
        >
          <ShoppingBag size={15} className="text-[#4d81b7]" /> Buyurtma berish
        </DropdownMenuItem>,
      );
    }
    if (purchase.status === "ordered") {
      items.push(
        <DropdownMenuItem
          key="receive"
          onSelect={() => changeStatus(purchase, "received")}
          className="gap-2"
        >
          <PackageCheck size={15} className="text-[#2d7d64]" /> Tovarni qabul
          qilish
        </DropdownMenuItem>,
      );
    }
    if (purchase.paymentStatus !== "paid" && purchase.status !== "cancelled") {
      items.push(
        <DropdownMenuItem
          key="paid"
          onSelect={() => markPaid(purchase)}
          className="gap-2"
        >
          <CircleCheck size={15} className="text-[#2d7d64]" /> To'landi deb
          belgilash
        </DropdownMenuItem>,
      );
    }
    if (purchase.status !== "cancelled" && purchase.status !== "received") {
      items.push(
        <DropdownMenuItem
          key="cancel"
          onSelect={() => changeStatus(purchase, "cancelled")}
          className="gap-2"
        >
          <CircleX size={15} className="text-slate-400" /> Bekor qilish
        </DropdownMenuItem>,
      );
    }

    return items.length > 0 ? (
      <>
        {items}
        <DropdownMenuSeparator />
      </>
    ) : null;
  };

  const columns: Column<Purchase>[] = [
    {
      header: "Xarid",
      cell: (purchase) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">
            {purchase.purchaseNumber}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {purchase.supplierName}
          </p>
        </div>
      ),
    },
    {
      header: "Mahsulotlar",
      className: "hidden lg:table-cell",
      cell: (purchase) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-600">
            {purchase.items[0]?.productName ?? "—"}
          </p>
          {purchase.items.length > 1 && (
            <p className="mt-0.5 text-xs text-slate-400">
              va yana {purchase.items.length - 1} ta
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Sana",
      className: "hidden xl:table-cell",
      cell: (purchase) => (
        <div>
          <p className="text-sm text-slate-500">
            {formatDate(purchase.orderDate)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            kutilmoqda: {formatDate(purchase.expectedDate)}
          </p>
        </div>
      ),
    },
    {
      header: "Holati",
      cell: (purchase) => (
        <StatusBadge
          label={STATUS_META[purchase.status].label}
          tone={STATUS_META[purchase.status].tone}
        />
      ),
    },
    {
      header: "To'lov",
      className: "hidden sm:table-cell",
      cell: (purchase) => (
        <StatusBadge
          label={PAYMENT_META[purchase.paymentStatus].label}
          tone={PAYMENT_META[purchase.paymentStatus].tone}
        />
      ),
    },
    {
      header: "Summa",
      align: "right",
      cell: (purchase) => (
        <span className="whitespace-nowrap text-sm font-bold text-slate-700">
          {formatCurrency(purchase.total)}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (purchase) => (
        <RowActions
          onView={() => setViewing(purchase)}
          onEdit={() => openEdit(purchase)}
          onDelete={() => setDeleting(purchase)}
        >
          {purchaseMenuItems(purchase)}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Xaridlar"
        description="Ta'minotchilarga beriladigan xarid buyurtmalari — qabul qilinganda ombor to'ldiriladi."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi xarid
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={ShoppingBag}
          value={stats ? formatNumber(stats.totalPurchases) : "—"}
          label="Jami xarid"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.awaitingDelivery) : "—"}
          label="Yetkazish kutilmoqda"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.totalValue) : "—"}
          label="Umumiy qiymat (so'm)"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(Math.round(stats.unpaidAmount)) : "—"}
          label="To'lanmagan (so'm)"
          tone="warning"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Xarid buyurtmalari</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Raqam, ta'minotchi, mahsulot"
            />
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger
                className="w-[180px]"
                aria-label="Holat bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holatlar</SelectItem>
                {PURCHASE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={paymentStatus}
              onValueChange={withPageReset(setPaymentStatus)}
            >
              <SelectTrigger
                className="w-[160px]"
                aria-label="To'lov bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha to'lovlar</SelectItem>
                {PURCHASE_PAYMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : (
          <>
            {view === "table" ? (
              <DataTable
                columns={columns}
                rows={purchases}
                rowKey={(purchase) => purchase.id}
                isLoading={isLoading}
                emptyText="Mos xarid topilmadi."
                minWidth={940}
              />
            ) : (
              <CardGrid
                rows={purchases}
                rowKey={(purchase) => purchase.id}
                isLoading={isLoading}
                emptyText="Mos xarid topilmadi."
                renderCard={(purchase) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-700">
                          {purchase.purchaseNumber}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {purchase.supplierName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(purchase)} />
                        <RowActions
                          onView={() => setViewing(purchase)}
                          onEdit={() => openEdit(purchase)}
                          onDelete={() => setDeleting(purchase)}
                        >
                          {purchaseMenuItems(purchase)}
                        </RowActions>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={STATUS_META[purchase.status].label}
                        tone={STATUS_META[purchase.status].tone}
                      />
                      <StatusBadge
                        label={PAYMENT_META[purchase.paymentStatus].label}
                        tone={PAYMENT_META[purchase.paymentStatus].tone}
                      />
                    </div>

                    <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
                      {purchase.items.slice(0, 3).map((item) => (
                        <li
                          key={item.productId}
                          className="flex justify-between gap-2"
                        >
                          <span className="truncate text-slate-600">
                            {item.productName}
                          </span>
                          <span className="shrink-0 text-slate-400">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                      {purchase.items.length > 3 && (
                        <li className="text-xs text-slate-400">
                          va yana {purchase.items.length - 3} ta mahsulot
                        </li>
                      )}
                    </ul>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-400">
                        {formatDate(purchase.expectedDate)}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(purchase.total)}
                      </span>
                    </div>
                  </div>
                )}
              />
            )}
            {pagination && !isLoading && (
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                itemLabel="xarid"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <PurchaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchase={editing}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.purchaseNumber ?? ""}
        subtitle={viewing?.supplierName}
        badges={
          viewing && (
            <>
              <StatusBadge
                label={STATUS_META[viewing.status].label}
                tone={STATUS_META[viewing.status].tone}
              />
              <StatusBadge
                label={PAYMENT_META[viewing.paymentStatus].label}
                tone={PAYMENT_META[viewing.paymentStatus].tone}
              />
            </>
          )
        }
        sections={
          viewing
            ? [
                {
                  fields: [
                    {
                      label: "Buyurtma sanasi",
                      value: formatDate(viewing.orderDate),
                    },
                    {
                      label: "Kutilayotgan sana",
                      value: formatDate(viewing.expectedDate),
                    },
                    { label: "Mas'ul", value: viewing.createdBy },
                    {
                      label: "Jami summa",
                      value: (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(viewing.total)}
                        </span>
                      ),
                    },
                    { label: "Izoh", value: viewing.note, full: true },
                  ],
                },
              ]
            : []
        }
        actions={
          viewing && (
            <Button
              variant="outline"
              onClick={() => {
                const purchase = viewing;
                setViewing(null);
                openEdit(purchase);
              }}
            >
              Tahrirlash
            </Button>
          )
        }
      >
        {viewing && (
          <div>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[.1em] text-slate-400">
              Mahsulotlar ({viewing.items.length})
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fafbfa] text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Mahsulot</th>
                    <th className="px-3 py-2 text-right font-semibold">Soni</th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Tannarx
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Summa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewing.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-3 py-2 text-slate-700">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500">
                        {formatNumber(item.cost)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">
                        {formatNumber(item.quantity * item.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xaridni o'chirish"
        description={
          <>
            <b>{deleting?.purchaseNumber}</b> o'chiriladi. Qabul qilingan tovar
            ombor hisobidan chiqariladi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
