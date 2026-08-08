import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  Eye,
  Trash2,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerDebt, Order } from "@shared/api";
import {
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { DebtPaymentDialog } from "@/components/DebtPaymentDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  ErrorState,
  HeroStat,
  PageHeader,
  RowActions,
  SearchInput,
  StatTile,
  StatusBadge,
} from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useCustomerDebtHistory,
  useCustomerDebts,
  useDebtPayments,
  useDebtStats,
  useClearCustomerDebt,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default function Debts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerDebt | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useDebtStats();
  const { data, isLoading, isError, error, refetch } = useCustomerDebts({
    page,
    limit: 15,
    search: debouncedSearch,
  });
  const { data: historyData } = useCustomerDebtHistory(
    viewingCustomer?.customerId || ""
  );
  const clearDebt = useClearCustomerDebt();

  const stats = statsData?.data;
  const debts = data?.data ?? [];
  const pagination = data?.pagination;
  const history = historyData?.data;

  const openPayment = (order: Order, paidAmount: number) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  const handleDeleteDebt = (customerId: string, customerName: string) => {
    setCustomerToDelete({ id: customerId, name: customerName });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    setDeletingCustomerId(customerToDelete.id);
    try {
      // API orqali qarzni tozalash
      const result = await clearDebt.mutateAsync(customerToDelete.id);
      
      toast.success(`${customerToDelete.name}ning qarzlari tozalandi`);
      
      // Ro'yxatni yangilash
      await refetch();
      
      // Agar hozirda bu mijozning detallari ochiq bo'lsa, yopish
      if (viewingCustomer?.customerId === customerToDelete.id) {
        setViewingCustomer(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Qarzni o'chirishda xatolik yuz berdi");
    } finally {
      setDeletingCustomerId(null);
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
    }
  };

  const columns: Column<CustomerDebt>[] = [
    {
      header: "Mijoz",
      cell: (debt) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {debt.customerName}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {debt.orderCount} marta qarzga olgan
          </p>
        </div>
      ),
    },
    {
      header: "Jami Qarz",
      align: "right",
      cell: (debt) => (
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">
            {formatCurrency(debt.totalDebt)}
          </p>
          {debt.paidAmount > 0 && (
            <p className="mt-0.5 text-xs text-green-600">
              {formatCurrency(debt.paidAmount)} to'langan
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Qoldiq",
      align: "right",
      cell: (debt) => (
        <span className="text-sm font-bold text-[#d5943c]">
          {formatCurrency(debt.remainingDebt)}
        </span>
      ),
    },
    {
      header: "Eng Eski Qarz",
      className: "hidden md:table-cell",
      cell: (debt) => (
        <div>
          <p className="text-sm text-slate-600">
            {formatDate(debt.oldestDebtDate)}
          </p>
          {debt.lastPaymentDate && (
            <p className="mt-0.5 text-xs text-slate-400">
              Oxirgi to'lov: {formatDate(debt.lastPaymentDate)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Holat",
      cell: (debt) => {
        const daysSinceOldest = Math.floor(
          (Date.now() - new Date(debt.oldestDebtDate).getTime()) /
            (24 * 60 * 60 * 1000)
        );
        
        if (daysSinceOldest > 60) {
          return <StatusBadge label="Muddati o'tgan" tone="red" />;
        } else if (daysSinceOldest > 30) {
          return <StatusBadge label="E'tibor kerak" tone="amber" />;
        } else {
          return <StatusBadge label="Normal" tone="green" />;
        }
      },
    },
    {
      header: "Amallar",
      align: "right",
      cell: (debt) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewingCustomer(debt)}
            className="h-8 gap-1.5"
          >
            <Eye size={14} />
            Ko'rish
          </Button>
          {debt.remainingDebt > 0 && (
            <Button
              size="sm"
              onClick={() => {
                setViewingCustomer(debt);
                setPaymentDialogOpen(true);
              }}
              className="h-8 gap-1.5 bg-[#173f38] hover:bg-[#0f312b]"
            >
              <CreditCard size={14} />
              To'lash
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteDebt(debt.customerId, debt.customerName)}
            disabled={deletingCustomerId === debt.customerId}
            className="h-8 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={14} />
            {deletingCustomerId === debt.customerId ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Qarzlar Boshqaruvi"
        description="Mijozlar qarzi, to'lovlar tarixi va hisobotlar."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={DollarSign}
          value={stats ? formatCurrency(stats.totalDebt) : "—"}
          label="Jami Qarz"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatCurrency(stats.paidToday) : "—"}
          label="Bugun To'langan"
          tone="success"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatCurrency(stats.overdueDebt) : "—"}
          label="Muddati O'tgan"
          tone="warning"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.customersInDebt) : "—"}
          label="Qarzdor Mijozlar"
          isLoading={statsLoading}
        />
      </section>

      {stats && stats.overdueDebt > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#efdfc5] bg-[#fffaf3] p-4">
          <AlertTriangle className="shrink-0 text-[#d5943c]" size={20} />
          <p className="text-sm text-slate-600">
            <b className="text-slate-700">E'tibor:</b> Muddati o'tgan qarzlar: {formatCurrency(stats.overdueDebt)}. 
            Mijozlar bilan bog'lanish tavsiya etiladi.
          </p>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Qarzdor Mijozlar</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta mijoz` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Mijoz qidirish..."
            />
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={debts}
              rowKey={(debt) => debt.customerId}
              isLoading={isLoading}
              emptyText="Qarzdor mijozlar topilmadi."
              minWidth={800}
            />
            {pagination && !isLoading && (
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                itemLabel="mijoz"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      {/* Mijoz qarz tarixi dialogi */}
      {viewingCustomer && history && (
        <DetailDialog
          open={Boolean(viewingCustomer)}
          onOpenChange={(open) => !open && setViewingCustomer(null)}
          title={viewingCustomer.customerName}
          subtitle="Qarz tarixi"
          badges={
            <Badge className="bg-[#d5943c] text-white">
              Qoldiq: {formatCurrency(history.remainingDebt)}
            </Badge>
          }
          sections={[
            {
              title: "Xulasa",
              fields: [
                {
                  label: "Jami qarz",
                  value: formatCurrency(history.totalDebt),
                },
                {
                  label: "To'langan",
                  value: formatCurrency(history.paidAmount),
                },
                {
                  label: "Qoldiq",
                  value: (
                    <span className="font-bold text-[#d5943c]">
                      {formatCurrency(history.remainingDebt)}
                    </span>
                  ),
                },
                {
                  label: "Buyurtmalar soni",
                  value: `${history.orders.length} ta`,
                },
              ],
            },
          ]}
        >
          {/* Qarzli buyurtmalar */}
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Qarzli Buyurtmalar ({history.orders.length} ta)
            </h4>
            <div className="space-y-3">
              {history.orders.map((order) => {
                const orderPaid = history.payments
                  .filter(p => p.orderId === order.id)
                  .reduce((sum, p) => sum + p.amount, 0);
                const orderRemaining = order.total - orderPaid;

                return (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-200 p-3 bg-white"
                  >
                    {/* Buyurtma header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(order.orderDate)} · {order.status}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                        {orderPaid > 0 && (
                          <p className="text-xs text-green-600">
                            -{formatCurrency(orderPaid)}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-[#d5943c]">
                          Qoldiq: {formatCurrency(orderRemaining)}
                        </p>
                      </div>
                    </div>

                    {/* Mahsulotlar ro'yxati */}
                    {order.items && order.items.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-600 mb-1.5">
                          Mahsulotlar:
                        </p>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1.5">
                            <span className="text-slate-700">
                              {item.productName}
                            </span>
                            <span className="text-slate-500 ml-2">
                              {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* To'lash tugmasi */}
                    {orderRemaining > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <Button
                          size="sm"
                          onClick={() => openPayment(order, orderPaid)}
                          className="w-full bg-[#173f38] hover:bg-[#0f312b]"
                        >
                          <CreditCard size={14} className="mr-1.5" />
                          To'lash
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* To'lovlar tarixi */}
          {history.payments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                To'lovlar Tarixi
              </h4>
              <div className="space-y-2">
                {history.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {payment.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(payment.paymentDate)} · {payment.paymentMethod}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      +{formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DetailDialog>
      )}

      {/* To'lov dialogi */}
      <DebtPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        order={selectedOrder}
        alreadyPaid={
          selectedOrder && history
            ? history.payments
                .filter(p => p.orderId === selectedOrder.id)
                .reduce((sum, p) => sum + p.amount, 0)
            : 0
        }
      />

      {/* O'chirish tasdiqlash dialogi */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Qarzni o'chirish"
        description={
          customerToDelete 
            ? `${customerToDelete.name}ning barcha qarzlarini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`
            : ""
        }
        confirmText="O'chirish"
        destructive
      />
    </>
  );
}
