import { useState } from "react";
import { CircleCheck, CircleX, Plus, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { Order, OrderStatus, PaymentStatus } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import {
  OrderDialog,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/components/OrderDialog";
import { BarList, Panel } from "@/components/Breakdown";
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
  useDeleteOrder,
  useOrderBreakdown,
  useOrderStats,
  useOrders,
  useUpdateOrder,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { CATEGORICAL } from "@/lib/chart-colors";

const ALL = "__all__";

const STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "slate" | "blue" | "violet" | "green" | "amber" }
> = {
  draft: { label: "Qoralama", tone: "slate" },
  confirmed: { label: "Tasdiqlangan", tone: "blue" },
  shipped: { label: "Jo'natilgan", tone: "violet" },
  delivered: { label: "Yetkazilgan", tone: "green" },
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

export default function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [paymentStatus, setPaymentStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useOrderStats();
  const { data: breakdownData, isLoading: breakdownLoading } =
    useOrderBreakdown();
  const { data, isLoading, isError, error, refetch } = useOrders({
    page,
    limit: 10,
    search: debouncedSearch,
    status: status === ALL ? undefined : (status as OrderStatus),
    paymentStatus:
      paymentStatus === ALL ? undefined : (paymentStatus as PaymentStatus),
  });
  const deleteOrder = useDeleteOrder();
  const updateOrder = useUpdateOrder();

  const stats = statsData?.data;
  const breakdown = breakdownData?.data;
  const orders = data?.data ?? [];
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
    await deleteOrder.mutateAsync(deleting.id);
    toast.success(`${deleting.orderNumber} o'chirildi`);
  };

  /** Menyudan bir bosishda bosqichni o'zgartirish. */
  const changeStatus = async (order: Order, next: OrderStatus) => {
    try {
      await updateOrder.mutateAsync({ id: order.id, status: next });
      toast.success(
        `${order.orderNumber}: ${STATUS_META[next].label.toLowerCase()}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  /** To'lovni yakunlangan deb belgilash — moliyaga daromad yoziladi. */
  const markPaid = async (order: Order) => {
    try {
      await updateOrder.mutateAsync({ id: order.id, paymentStatus: "paid" });
      toast.success(`${order.orderNumber} to'langan deb belgilandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditing(order);
    setDialogOpen(true);
  };

  /** Bosqichga qarab keyingi mantiqiy qadamlar. */
  const orderMenuItems = (order: Order) => {
    const items = [];
    if (order.status === "draft") {
      items.push(
        <DropdownMenuItem
          key="confirm"
          onSelect={() => changeStatus(order, "confirmed")}
          className="gap-2"
        >
          <CircleCheck size={15} className="text-[#4d81b7]" /> Tasdiqlash
        </DropdownMenuItem>,
      );
    }
    if (order.status === "confirmed") {
      items.push(
        <DropdownMenuItem
          key="ship"
          onSelect={() => changeStatus(order, "shipped")}
          className="gap-2"
        >
          <Truck size={15} className="text-[#7266c9]" /> Jo'natildi
        </DropdownMenuItem>,
      );
    }
    if (order.status === "shipped") {
      items.push(
        <DropdownMenuItem
          key="deliver"
          onSelect={() => changeStatus(order, "delivered")}
          className="gap-2"
        >
          <CircleCheck size={15} className="text-[#2d7d64]" /> Yetkazildi
        </DropdownMenuItem>,
      );
    }
    if (order.paymentStatus !== "paid" && order.status !== "cancelled") {
      items.push(
        <DropdownMenuItem
          key="paid"
          onSelect={() => markPaid(order)}
          className="gap-2"
        >
          <CircleCheck size={15} className="text-[#2d7d64]" /> To'landi deb
          belgilash
        </DropdownMenuItem>,
      );
    }
    if (order.status !== "cancelled" && order.status !== "delivered") {
      items.push(
        <DropdownMenuItem
          key="cancel"
          onSelect={() => changeStatus(order, "cancelled")}
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

  const columns: Column<Order>[] = [
    {
      header: "Buyurtma",
      cell: (order) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">
            {order.orderNumber}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {order.customerName}
          </p>
        </div>
      ),
    },
    {
      header: "Mahsulotlar",
      className: "hidden lg:table-cell",
      cell: (order) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-600">
            {order.items[0]?.productName ?? "—"}
          </p>
          {order.items.length > 1 && (
            <p className="mt-0.5 text-xs text-slate-400">
              va yana {order.items.length - 1} ta
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Sana",
      className: "hidden xl:table-cell",
      cell: (order) => (
        <div>
          <p className="text-sm text-slate-500">
            {formatDate(order.orderDate)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            yetkazish: {formatDate(order.deliveryDate)}
          </p>
        </div>
      ),
    },
    {
      header: "Bosqich",
      cell: (order) => (
        <StatusBadge
          label={STATUS_META[order.status].label}
          tone={STATUS_META[order.status].tone}
        />
      ),
    },
    {
      header: "To'lov",
      className: "hidden sm:table-cell",
      cell: (order) => (
        <StatusBadge
          label={PAYMENT_META[order.paymentStatus].label}
          tone={PAYMENT_META[order.paymentStatus].tone}
        />
      ),
    },
    {
      header: "Summa",
      align: "right",
      cell: (order) => (
        <span className="whitespace-nowrap text-sm font-bold text-slate-700">
          {formatCurrency(order.total)}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (order) => (
        <RowActions
          onView={() => setViewing(order)}
          onEdit={() => openEdit(order)}
          onDelete={() => setDeleting(order)}
        >
          {orderMenuItems(order)}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Buyurtmalar"
        description="Savdo buyurtmalari — mijoz, ombor va moliyani bog'laydigan asosiy hujjat."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi buyurtma
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={ShoppingCart}
          value={stats ? formatNumber(stats.totalOrders) : "—"}
          label="Jami buyurtma"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.pendingOrders) : "—"}
          label="Jarayonda"
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

      <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Bosqichlar bo'yicha" subtitle="Buyurtmalar taqsimoti">
          <BarList
            isLoading={breakdownLoading}
            rows={(breakdown?.byStatus ?? []).map((row) => ({
              label: row.label,
              value: row.count,
              display: `${row.count} ta`,
              hint: `${formatNumber(row.value)} so'm`,
            }))}
          />
        </Panel>

        <Panel title="Top mijozlar" subtitle="Buyurtma summasi bo'yicha">
          <BarList
            color={CATEGORICAL[1]}
            isLoading={breakdownLoading}
            rows={(breakdown?.topCustomers ?? []).map((row) => ({
              label: row.label,
              value: row.value,
              display: formatNumber(row.value),
              hint: `${row.count} ta buyurtma`,
            }))}
          />
        </Panel>

        <Panel
          title="Ko'p sotilgan mahsulotlar"
          subtitle="Miqdor va summa bo'yicha"
        >
          <BarList
            color={CATEGORICAL[2]}
            isLoading={breakdownLoading}
            rows={(breakdown?.topProducts ?? []).map((row) => ({
              label: row.label,
              value: row.value,
              display: formatNumber(row.value),
              hint: `${formatNumber(row.count)} dona`,
            }))}
          />
        </Panel>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Buyurtmalar ro'yxati</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Raqam, mijoz, mahsulot"
            />
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger
                className="w-[170px]"
                aria-label="Bosqich bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha bosqichlar</SelectItem>
                {ORDER_STATUS_OPTIONS.map((option) => (
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
                {PAYMENT_STATUS_OPTIONS.map((option) => (
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
                rows={orders}
                rowKey={(order) => order.id}
                isLoading={isLoading}
                emptyText="Mos buyurtma topilmadi."
                minWidth={940}
              />
            ) : (
              <CardGrid
                rows={orders}
                rowKey={(order) => order.id}
                isLoading={isLoading}
                emptyText="Mos buyurtma topilmadi."
                renderCard={(order) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-700">
                          {order.orderNumber}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {order.customerName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(order)} />
                        <RowActions
                          onView={() => setViewing(order)}
                          onEdit={() => openEdit(order)}
                          onDelete={() => setDeleting(order)}
                        >
                          {orderMenuItems(order)}
                        </RowActions>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={STATUS_META[order.status].label}
                        tone={STATUS_META[order.status].tone}
                      />
                      <StatusBadge
                        label={PAYMENT_META[order.paymentStatus].label}
                        tone={PAYMENT_META[order.paymentStatus].tone}
                      />
                    </div>

                    <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
                      {order.items.slice(0, 3).map((item) => (
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
                      {order.items.length > 3 && (
                        <li className="text-xs text-slate-400">
                          va yana {order.items.length - 3} ta mahsulot
                        </li>
                      )}
                    </ul>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-400">
                        {formatDate(order.deliveryDate)}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(order.total)}
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
                itemLabel="buyurtma"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={editing}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.orderNumber ?? ""}
        subtitle={viewing?.customerName}
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
                      label: "Yetkazish sanasi",
                      value: formatDate(viewing.deliveryDate),
                    },
                    { label: "Mas'ul xodim", value: viewing.assignedTo },
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
                const order = viewing;
                setViewing(null);
                openEdit(order);
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
                    <th className="px-3 py-2 text-right font-semibold">Narx</th>
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
                        {formatNumber(item.price)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">
                        {formatNumber(item.quantity * item.price)}
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
        title="Buyurtmani o'chirish"
        description={
          <>
            <b>{deleting?.orderNumber}</b> o'chiriladi. Ajratilgan tovar omborga
            qaytariladi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
