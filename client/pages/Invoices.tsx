import { useState } from "react";
import { CircleDollarSign, FileText, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Invoice, InvoiceStatus } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import {
  InvoiceDialog,
  InvoicePaymentDialog,
  INVOICE_STATUS_OPTIONS,
} from "@/components/InvoiceDialogs";
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
  useDeleteInvoice,
  useInvoiceStats,
  useInvoices,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { SERIES } from "@/lib/chart-colors";

const ALL = "__all__";

const STATUS_META: Record<
  InvoiceStatus,
  { label: string; tone: "slate" | "blue" | "green" | "red" }
> = {
  draft: { label: "Qoralama", tone: "slate" },
  sent: { label: "Yuborilgan", tone: "blue" },
  paid: { label: "To'langan", tone: "green" },
  overdue: { label: "Muddati o'tgan", tone: "red" },
  cancelled: { label: "Bekor qilingan", tone: "slate" },
};

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useInvoiceStats();
  const { data, isLoading, isError, error, refetch } = useInvoices({
    page,
    limit: 10,
    search: debouncedSearch,
    status: status === ALL ? undefined : (status as InvoiceStatus),
    overdueOnly,
  });
  const deleteInvoice = useDeleteInvoice();

  const stats = statsData?.data;
  const invoices = data?.data ?? [];
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
    await deleteInvoice.mutateAsync(deleting.id);
    toast.success(`${deleting.invoiceNumber} o'chirildi`);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setDialogOpen(true);
  };

  /** To'lanmagan fakturaga to'lov qabul qilish bandi. */
  const invoiceMenuItems = (invoice: Invoice) =>
    invoice.paidAmount < invoice.amount && invoice.status !== "cancelled" ? (
      <>
        <DropdownMenuItem onSelect={() => setPaying(invoice)} className="gap-2">
          <CircleDollarSign size={15} className="text-[#2d7d64]" /> To'lov qayd
          etish
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    ) : null;

  /** To'langan ulush — progress ko'rsatkichi uchun. */
  const paidPercent = (invoice: Invoice) =>
    invoice.amount === 0
      ? 0
      : Math.round((invoice.paidAmount / invoice.amount) * 100);

  const columns: Column<Invoice>[] = [
    {
      header: "Faktura",
      cell: (invoice) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">
            {invoice.invoiceNumber}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {invoice.customerName}
          </p>
        </div>
      ),
    },
    {
      header: "Buyurtma",
      className: "hidden lg:table-cell",
      cell: (invoice) => (
        <span className="text-sm text-slate-500">{invoice.orderNumber}</span>
      ),
    },
    {
      header: "Muddat",
      className: "hidden sm:table-cell",
      cell: (invoice) => (
        <div>
          <p className="text-sm text-slate-500">
            {formatDate(invoice.dueDate)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            chiqarilgan: {formatDate(invoice.issueDate)}
          </p>
        </div>
      ),
    },
    {
      header: "To'langan",
      align: "right",
      className: "hidden xl:table-cell",
      cell: (invoice) => (
        <div className="min-w-[110px]">
          <p className="text-sm font-semibold text-slate-600">
            {formatCurrency(invoice.paidAmount)}
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${paidPercent(invoice)}%`, backgroundColor: SERIES.income }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Holati",
      cell: (invoice) => (
        <StatusBadge
          label={STATUS_META[invoice.status].label}
          tone={STATUS_META[invoice.status].tone}
        />
      ),
    },
    {
      header: "Summa",
      align: "right",
      cell: (invoice) => (
        <span className="whitespace-nowrap text-sm font-bold text-slate-700">
          {formatCurrency(invoice.amount)}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (invoice) => (
        <RowActions
          onView={() => setViewing(invoice)}
          onEdit={() => openEdit(invoice)}
          onDelete={() => setDeleting(invoice)}
        >
          {invoiceMenuItems(invoice)}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Hisob-fakturalar"
        description="Mijozlarga chiqarilgan hisoblar va to'lovlar nazorati."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi faktura
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={FileText}
          value={stats ? formatNumber(stats.totalInvoices) : "—"}
          label="Jami faktura"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.outstandingCount) : "—"}
          label="To'lanmagan faktura"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.outstandingAmount) : "—"}
          label="Qarzdorlik (so'm)"
          tone="warning"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.overdueCount) : "—"}
          label="Muddati o'tgan"
          tone="warning"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Fakturalar ro'yxati</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Raqam, mijoz, buyurtma"
            />
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger
                className="w-[170px]"
                aria-label="Holat bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holatlar</SelectItem>
                {INVOICE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => {
                setOverdueOnly(!overdueOnly);
                setPage(1);
              }}
              aria-pressed={overdueOnly}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                overdueOnly
                  ? "border-[#e8b0a8] bg-[#fdeceb] text-[#b8443a]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Muddati o'tgan
            </button>
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
                rows={invoices}
                rowKey={(invoice) => invoice.id}
                isLoading={isLoading}
                emptyText="Mos faktura topilmadi."
                minWidth={940}
              />
            ) : (
              <CardGrid
                rows={invoices}
                rowKey={(invoice) => invoice.id}
                isLoading={isLoading}
                emptyText="Mos faktura topilmadi."
                renderCard={(invoice) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-700">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {invoice.customerName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(invoice)} />
                        <RowActions
                          onView={() => setViewing(invoice)}
                          onEdit={() => openEdit(invoice)}
                          onDelete={() => setDeleting(invoice)}
                        >
                          {invoiceMenuItems(invoice)}
                        </RowActions>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <StatusBadge
                        label={STATUS_META[invoice.status].label}
                        tone={STATUS_META[invoice.status].tone}
                      />
                      <span className="text-xs text-slate-400">
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-slate-400">
                          To'langan
                        </span>
                        <span className="text-sm font-semibold text-slate-600">
                          {formatCurrency(invoice.paidAmount)} /{" "}
                          {formatCurrency(invoice.amount)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${paidPercent(invoice)}%`, backgroundColor: SERIES.income }}
                        />
                      </div>
                      <p className="mt-1.5 text-right text-xs text-slate-400">
                        {paidPercent(invoice)}%
                      </p>
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
                itemLabel="faktura"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editing}
      />

      <InvoicePaymentDialog
        open={Boolean(paying)}
        onOpenChange={(open) => !open && setPaying(null)}
        invoice={paying}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.invoiceNumber ?? ""}
        subtitle={viewing?.customerName}
        badges={
          viewing && (
            <StatusBadge
              label={STATUS_META[viewing.status].label}
              tone={STATUS_META[viewing.status].tone}
            />
          )
        }
        sections={
          viewing
            ? [
                {
                  fields: [
                    { label: "Bog'liq buyurtma", value: viewing.orderNumber },
                    {
                      label: "Chiqarilgan",
                      value: formatDate(viewing.issueDate),
                    },
                    {
                      label: "To'lov muddati",
                      value: formatDate(viewing.dueDate),
                    },
                    {
                      label: "Faktura summasi",
                      value: (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(viewing.amount)}
                        </span>
                      ),
                    },
                    {
                      label: "To'langan",
                      value: formatCurrency(viewing.paidAmount),
                    },
                    {
                      label: "Qoldiq",
                      value: (
                        <span className="font-bold text-[#b5761f]">
                          {formatCurrency(viewing.amount - viewing.paidAmount)}
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
          viewing &&
          viewing.paidAmount < viewing.amount &&
          viewing.status !== "cancelled" && (
            <Button
              variant="outline"
              onClick={() => {
                const invoice = viewing;
                setViewing(null);
                setPaying(invoice);
              }}
            >
              To'lov qayd etish
            </Button>
          )
        }
      >
        {viewing && (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-slate-400">To'lov holati</span>
              <span className="font-semibold text-slate-600">
                {paidPercent(viewing)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${paidPercent(viewing)}%`, backgroundColor: SERIES.income }}
              />
            </div>
          </div>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Fakturani o'chirish"
        description={
          <>
            <b>{deleting?.invoiceNumber}</b> o'chiriladi. Qayd etilgan to'lovlar
            moliyada qoladi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
