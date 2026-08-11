import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Sale } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useSales, useSalesStats, useRefundSale, useDeleteSale } from "@/hooks/use-api";

const ALL = "__all__";

export default function Sales() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [paymentMethod, setPaymentMethod] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [refunding, setRefunding] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState("Mijoz iltimosi");
  const [refundMethod, setRefundMethod] = useState<"cash" | "card" | "transfer">("cash");

  // Real API calls
  const { data: statsData, isLoading: statsLoading } = useSalesStats();
  const { data: salesData, isLoading, isError, error } = useSales({
    page,
    limit: 20,
    search,
    status: status === ALL ? undefined : status,
    paymentMethod: paymentMethod === ALL ? undefined : paymentMethod,
  });
  
  const refundMutation = useRefundSale();
  const deleteMutation = useDeleteSale();

  const stats = statsData?.data;
  const salesList = salesData?.data ?? [];
  const pagination = salesData?.pagination;

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const handleCreateSale = () => {
    navigate("/pos");
  };

  const handleRefund = async () => {
    if (!refunding) return;
    if (!refundReason.trim()) {
      toast.error("Qaytarish sababini kiriting");
      return;
    }
    try {
      await refundMutation.mutateAsync({
        id: refunding.id,
        items: refunding.items,
        refundReason: refundReason.trim(),
        paymentMethod: refundMethod,
      });
      toast.success(`${refunding.saleNumber} sotuvi qaytarib berildi`);
      setRefunding(null);
      setRefundReason("Mijoz iltimosi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Qaytarib berishda xatolik");
    }
  };

  const getStatusBadge = (sale: Sale) => {
    switch (sale.status) {
      case "completed":
        return <StatusBadge label="Tugallangan" tone="green" />;
      case "refunded":
        return <StatusBadge label="Qaytarilgan" tone="red" />;
      case "partial_refund":
        return <StatusBadge label="Qisman qaytarilgan" tone="amber" />;
      default:
        return <StatusBadge label="Noma'lum" tone="gray" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Naqd pul";
      case "card":
        return "Plastik karta";
      case "transfer":
        return "Bank o'tkazmasi";
      case "credit":
        return "Nasiya";
      default:
        return method;
    }
  };

  const columns: Column<Sale>[] = [
    {
      header: "Chek raqami",
      cell: (sale) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {sale.saleNumber}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {formatDate(sale.saleDate)}
          </p>
        </div>
      ),
    },
    {
      header: "Mijoz",
      className: "hidden lg:table-cell",
      cell: (sale) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-900">
            {sale.customerName || "Noma'lum mijoz"}
          </p>
          {sale.customerPhone && (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {sale.customerPhone}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Mahsulotlar",
      className: "hidden xl:table-cell",
      cell: (sale) => (
        <span className="text-sm text-slate-600">
          {sale.items.length} ta mahsulot
        </span>
      ),
    },
    {
      header: "Summa",
      align: "right",
      cell: (sale) => (
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(sale.total)}
          </p>
          {sale.discount > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">
              chegirma: {formatCurrency(sale.discount)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "To'lov",
      className: "hidden md:table-cell",
      cell: (sale) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {getPaymentMethodLabel(sale.paymentMethod)}
        </span>
      ),
    },
    {
      header: "Sotuvchi",
      className: "hidden lg:table-cell",
      cell: (sale) => (
        <span className="text-sm text-slate-600">{sale.sellerName}</span>
      ),
    },
    {
      header: "Holat",
      className: "hidden sm:table-cell",
      cell: (sale) => getStatusBadge(sale),
    },
    {
      header: "",
      align: "right",
      cell: (sale) => (
        <RowActions
          onView={() => setViewing(sale)}
          onReturn={() => setRefunding(sale)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sotuv"
        description="Sotuvlarni ro'yxatga olish, chek berish va qaytarish."
      >
        <Button
          onClick={handleCreateSale}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi sotuv
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={DollarSign}
          value={formatCurrency(stats?.todaySales ?? 0)}
          label="Bugungi sotuv"
          isLoading={statsLoading}
        />
        <StatTile
          value={formatNumber(stats?.todayTransactions ?? 0)}
          label="Bugungi tranzaksiyalar"
          isLoading={statsLoading}
        />
        <StatTile
          value={formatCurrency(stats?.monthSales ?? 0)}
          label="Oylik sotuv"
          isLoading={statsLoading}
        />
        <StatTile
          value={formatNumber(stats?.monthTransactions ?? 0)}
          label="Oylik tranzaksiyalar"
          isLoading={statsLoading}
        />
      </section>

      {/* Top Products va Sellers */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h3 className="font-bold text-slate-800">Eng ko'p sotiladigan mahsulotlar</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {statsLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : stats && stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e9f5ef] text-sm font-bold text-[#378166]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {product.productName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {product.quantity} ta sotildi
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Ma'lumot yo'q</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h3 className="font-bold text-slate-800">Eng yaxshi sotuvchilar</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {statsLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : stats && stats.topSellers.length > 0 ? (
              stats.topSellers.map((seller, index) => (
                <div key={seller.sellerId} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e9f5ef] text-sm font-bold text-[#378166]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {seller.sellerName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {seller.salesCount} ta sotuv
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(seller.revenue)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Ma'lumot yo'q</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Sotuvlar tarixi</h3>
            <p className="mt-1 text-sm text-slate-400">
              Barcha sotuvlar ro'yxati va tafsilotlari
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Chek raqami, mijoz nomi"
            />
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holat</SelectItem>
                <SelectItem value="completed">Tugallangan</SelectItem>
                <SelectItem value="refunded">Qaytarilgan</SelectItem>
                <SelectItem value="partial_refund">Qisman qaytarilgan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethod} onValueChange={withPageReset(setPaymentMethod)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha to'lov</SelectItem>
                <SelectItem value="cash">Naqd pul</SelectItem>
                <SelectItem value="card">Plastik karta</SelectItem>
                <SelectItem value="transfer">Bank o'tkazmasi</SelectItem>
                <SelectItem value="credit">Nasiya</SelectItem>
              </SelectContent>
            </Select>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => {}} />
        ) : (
          <>
            {view === "table" ? (
              <DataTable
                columns={columns}
                rows={salesList}
                rowKey={(sale) => sale.id}
                isLoading={isLoading}
                emptyText="Sotuvlar topilmadi."
                minWidth={900}
              />
            ) : (
              <CardGrid
                rows={salesList}
                rowKey={(sale) => sale.id}
                isLoading={isLoading}
                emptyText="Sotuvlar topilmadi."
                renderCard={(sale) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-700">
                          {sale.saleNumber}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {formatDate(sale.saleDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(sale)} />
                        <RowActions
                          onView={() => setViewing(sale)}
                          onReturn={() => setRefunding(sale)}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {getStatusBadge(sale)}
                      <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </span>
                    </div>
                    <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Mijoz</dt>
                        <dd className="truncate text-slate-600">
                          {sale.customerName || "Noma'lum"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Mahsulotlar</dt>
                        <dd className="text-slate-600">
                          {sale.items.length} ta
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Jami summa</dt>
                        <dd className="font-bold text-slate-700">
                          {formatCurrency(sale.total)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Sotuvchi</dt>
                        <dd className="truncate text-slate-600">
                          {sale.sellerName}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              />
            )}
            {pagination && !isLoading && (
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                itemLabel="sotuv"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.saleNumber ?? ""}
        subtitle={`${viewing?.customerName || "Noma'lum mijoz"} • ${
          viewing ? formatDate(viewing.saleDate) : ""
        }`}
        badges={viewing && getStatusBadge(viewing)}
        sections={
          viewing
            ? [
                {
                  title: "Mijoz ma'lumotlari",
                  fields: [
                    {
                      label: "Mijoz nomi",
                      value: viewing.customerName || "Noma'lum",
                    },
                    {
                      label: "Telefon raqami", 
                      value: viewing.customerPhone || "—",
                    },
                  ],
                },
                {
                  title: "Sotuv tafsilotlari",
                  fields: [
                    {
                      label: "Mahsulotlar soni",
                      value: `${viewing.items.length} ta`,
                    },
                    {
                      label: "Oraliq summa",
                      value: formatCurrency(viewing.subtotal),
                    },
                    {
                      label: "Chegirma",
                      value: formatCurrency(viewing.discount),
                    },
                    {
                      label: "Soliq",
                      value: formatCurrency(viewing.tax),
                    },
                    {
                      label: "Jami summa",
                      value: (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(viewing.total)}
                        </span>
                      ),
                    },
                    {
                      label: "To'lov usuli",
                      value: getPaymentMethodLabel(viewing.paymentMethod),
                    },
                  ],
                },
                {
                  title: "Qo'shimcha",
                  fields: [
                    {
                      label: "Sotuvchi",
                      value: viewing.sellerName,
                    },
                    {
                      label: "Filial",
                      value: viewing.branchName,
                    },
                    {
                      label: "Chek chop etilgan",
                      value: viewing.receiptPrinted ? "Ha" : "Yo'q",
                    },
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
                const sale = viewing;
                setViewing(null);
                setRefunding(sale);
              }}
            >
              Qaytarish
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(refunding)}
        onOpenChange={(open) => {
          if (!open) { setRefunding(null); setRefundReason("Mijoz iltimosi"); }
        }}
        title="Sotuvni qaytarish"
        description={
          refunding && (
            <div className="space-y-3">
              <p>
                <b>{refunding.saleNumber}</b> raqamli sotuv qaytarib beriladi.
                Mijozga {formatCurrency(refunding.total)} qaytariladi.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Qaytarish sababi</Label>
                <Input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Sababni kiriting..."
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">To'lov usuli</Label>
                <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as typeof refundMethod)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Naqd pul</SelectItem>
                    <SelectItem value="card">Plastik karta</SelectItem>
                    <SelectItem value="transfer">Bank o'tkazmasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        }
        confirmText="Qaytarish"
        destructive
        onConfirm={handleRefund}
      />
    </>
  );
}