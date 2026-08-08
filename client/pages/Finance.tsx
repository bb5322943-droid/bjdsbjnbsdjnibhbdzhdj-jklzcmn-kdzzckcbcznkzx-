import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Download,
  Plus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Transaction } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { TransactionDialog } from "@/components/TransactionDialog";
import {
  ErrorState,
  PageHeader,
  RowActions,
  SearchInput,
  StatusBadge,
  ViewButton,
  ViewMode,
  ViewToggle,
} from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransactionFilters,
  downloadTransactionsCsv,
  useDeleteTransaction,
  useFinanceStats,
  useTransactionCategories,
  useTransactions,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatPercentChange } from "@/lib/format";

const ALL = "__all__";
const TYPE_TABS = [
  { value: "all", label: "Barchasi" },
  { value: "income", label: "Kirim" },
  { value: "expense", label: "Chiqim" },
] as const;

export default function Finance() {
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const debouncedSearch = useDebounced(search);

  const filters: TransactionFilters = {
    search: debouncedSearch,
    type,
    category: category === ALL ? undefined : category,
    from: from || undefined,
    to: to || undefined,
  };

  const { data: statsData, isLoading: statsLoading } = useFinanceStats();
  const { data: categoriesData } = useTransactionCategories();
  const { data, isLoading, isError, error, refetch } = useTransactions({
    ...filters,
    page,
    limit: 10,
  });
  const deleteTransaction = useDeleteTransaction();

  const stats = statsData?.data;
  const transactions = data?.data ?? [];
  const pagination = data?.pagination;
  const categories = categoriesData?.data ?? [];

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const hasDateFilter = Boolean(from || to);

  // Xato bo'lsa ConfirmDialog uni ushlab, xabar ko'rsatadi va oynani ochiq qoldiradi.
  const handleDelete = async () => {
    if (!deleting) return;
    await deleteTransaction.mutateAsync(deleting.id);
    toast.success("Tranzaksiya o'chirildi");
  };

  /** Joriy filtrga mos yozuvlarni CSV qilib yuklaydi. */
  const handleExport = () => {
    if (!pagination?.total) {
      toast.error("Eksport uchun yozuv yo'q");
      return;
    }
    downloadTransactionsCsv(filters)
      .then(() => toast.success(`${pagination.total} ta yozuv yuklab olindi`))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Eksport bajarilmadi"),
      );
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setDialogOpen(true);
  };

  const columns: Column<Transaction>[] = [
    {
      header: "Tranzaksiya",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full",
              item.type === "income"
                ? "bg-[#e9f5ef] text-[#378166]"
                : "bg-[#fff3e7] text-[#cc8537]",
            )}
          >
            {item.type === "income" ? (
              <ArrowDownToLine size={16} />
            ) : (
              <ArrowUpFromLine size={16} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700">
              {item.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {item.category}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Hisob",
      className: "hidden lg:table-cell",
      cell: (item) => (
        <span className="text-sm text-slate-500">{item.account}</span>
      ),
    },
    {
      header: "Sana",
      className: "hidden sm:table-cell",
      cell: (item) => (
        <span className="text-sm text-slate-500">{formatDate(item.date)}</span>
      ),
    },
    {
      header: "Summa",
      align: "right",
      cell: (item) => (
        <span
          className={cn(
            "whitespace-nowrap text-sm font-bold",
            item.type === "income" ? "text-[#2d8068]" : "text-slate-700",
          )}
        >
          {item.type === "income" ? "+" : "−"} {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (item) => (
        <RowActions
          onView={() => setViewing(item)}
          onEdit={() => openEdit(item)}
          onDelete={() => setDeleting(item)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Moliya markazi"
        description="Hisoblar, pul oqimi va tranzaksiyalarni boshqaring."
      >
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!pagination?.total}
        >
          <Download size={16} /> Eksport
        </Button>
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi tranzaksiya
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Wallet}
          tone="bg-[#e8f4ef] text-[#2c8168]"
          label="Joriy balans"
          value={stats ? formatCurrency(stats.currentBalance) : "—"}
          isLoading={statsLoading}
          badge={
            stats ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold",
                  stats.balanceChange >= 0
                    ? "bg-[#ecf8ef] text-[#378166]"
                    : "bg-[#fdeceb] text-[#b8443a]",
                )}
              >
                <ArrowUpRight
                  size={13}
                  className={stats.balanceChange < 0 ? "rotate-90" : undefined}
                />
                {formatPercentChange(stats.balanceChange)}
              </span>
            ) : null
          }
        />
        <StatCard
          icon={ArrowDownToLine}
          tone="bg-[#eef4fb] text-[#4d81b7]"
          label="Oylik kirim"
          value={stats ? formatCurrency(stats.monthlyIncome) : "—"}
          isLoading={statsLoading}
        />
        <StatCard
          icon={ArrowUpFromLine}
          tone="bg-[#fff3e8] text-[#cd8639]"
          label="Oylik chiqim"
          value={stats ? formatCurrency(stats.monthlyExpenses) : "—"}
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h3 className="font-bold text-slate-800">Kirim-chiqim jurnali</h3>
              <p className="mt-1 text-sm text-slate-400">
                {pagination ? `${pagination.total} ta amal` : "Yuklanmoqda..."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SearchInput
                value={search}
                onChange={withPageReset(setSearch)}
                placeholder="Nomi, kategoriya, hisob"
              />
              <Select
                value={category}
                onValueChange={withPageReset(setCategory)}
              >
                <SelectTrigger
                  className="w-[170px]"
                  aria-label="Kategoriya bo'yicha filtr"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Barcha kategoriya</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setType(tab.value);
                    setPage(1);
                  }}
                  aria-pressed={type === tab.value}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition",
                    type === tab.value
                      ? tab.value === "expense"
                        ? "bg-[#fff5ea] text-[#bd792b]"
                        : "bg-[#e8f1ee] text-[#1e6f5d]"
                      : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-500">
                Davr:
                <input
                  type="date"
                  value={from}
                  onChange={(event) =>
                    withPageReset(setFrom)(event.target.value)
                  }
                  aria-label="Boshlanish sanasi"
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#4f947f]"
                />
                <span className="text-slate-300">—</span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) => withPageReset(setTo)(event.target.value)}
                  aria-label="Tugash sanasi"
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#4f947f]"
                />
              </label>
              {hasDateFilter && (
                <button
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setPage(1);
                  }}
                  className="text-sm font-semibold text-slate-400 hover:text-slate-600"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : (
          <>
            {view === "table" ? (
              <DataTable
                columns={columns}
                rows={transactions}
                rowKey={(item) => item.id}
                isLoading={isLoading}
                emptyText="Mos tranzaksiya topilmadi."
              />
            ) : (
              <CardGrid
                rows={transactions}
                rowKey={(item) => item.id}
                isLoading={isLoading}
                emptyText="Mos tranzaksiya topilmadi."
                renderCard={(item) => {
                  const income = item.type === "income";
                  return (
                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                              income
                                ? "bg-[#e9f5ef] text-[#378166]"
                                : "bg-[#fff3e7] text-[#cc8537]",
                            )}
                          >
                            {income ? (
                              <ArrowDownToLine size={18} />
                            ) : (
                              <ArrowUpFromLine size={18} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-700">
                              {item.title}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {item.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <ViewButton onClick={() => setViewing(item)} />
                          <RowActions
                            onView={() => setViewing(item)}
                            onEdit={() => openEdit(item)}
                            onDelete={() => setDeleting(item)}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <StatusBadge
                          label={income ? "Kirim" : "Chiqim"}
                          tone={income ? "green" : "amber"}
                        />
                        <span className="text-xs text-slate-400">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-400">Hisob</dt>
                          <dd className="truncate text-slate-600">
                            {item.account}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-400">Summa</dt>
                          <dd
                            className={cn(
                              "font-bold",
                              income ? "text-[#2d8068]" : "text-slate-700",
                            )}
                          >
                            {income ? "+" : "−"} {formatCurrency(item.amount)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                }}
              />
            )}
            {pagination && !isLoading && (
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                itemLabel="tranzaksiya"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.title ?? ""}
        subtitle={viewing?.category}
        badges={
          viewing && (
            <StatusBadge
              label={viewing.type === "income" ? "Kirim" : "Chiqim"}
              tone={viewing.type === "income" ? "green" : "amber"}
            />
          )
        }
        sections={
          viewing
            ? [
                {
                  fields: [
                    { label: "Sana", value: formatDate(viewing.date) },
                    { label: "Kategoriya", value: viewing.category },
                    { label: "Hisob", value: viewing.account, full: true },
                    {
                      label: "Summa",
                      value: (
                        <span
                          className={cn(
                            "text-base font-bold",
                            viewing.type === "income"
                              ? "text-[#2d8068]"
                              : "text-slate-900",
                          )}
                        >
                          {viewing.type === "income" ? "+" : "−"}{" "}
                          {formatCurrency(viewing.amount)}
                        </span>
                      ),
                      full: true,
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
                const transaction = viewing;
                setViewing(null);
                openEdit(transaction);
              }}
            >
              Tahrirlash
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Tranzaksiyani o'chirish"
        description={
          <>
            <b>{deleting?.title}</b> yozuvi o'chiriladi va balans qayta
            hisoblanadi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  badge,
  isLoading,
}: {
  icon: typeof Wallet;
  tone: string;
  label: string;
  value: string;
  badge?: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn("grid h-10 w-10 place-items-center rounded-lg", tone)}
        >
          <Icon size={20} />
        </span>
        {badge}
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-40" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      )}
    </article>
  );
}
