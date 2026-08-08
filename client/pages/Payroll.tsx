import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleCheck,
  Loader2,
  Wallet,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Payroll, PayrollStatus } from "@shared/api";
import { Column, DataTable, TablePagination } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { PayrollDialog } from "@/components/PayrollDialog";
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
  useCalculatePayroll,
  useDeletePayroll,
  usePayrollPeriods,
  usePayrollStats,
  usePayrolls,
  useUpdatePayroll,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatCurrency, formatNumber } from "@/lib/format";

const ALL = "__all__";

const STATUS_META: Record<
  PayrollStatus,
  { label: string; tone: "amber" | "green" | "blue" | "slate" }
> = {
  draft: { label: "Qoralama", tone: "slate" },
  approved: { label: "Tasdiqlangan", tone: "blue" },
  paid: { label: "To'langan", tone: "green" },
};

/** "2026-07" → "iyul, 2026" */
const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return `${MONTHS[month - 1]}, ${year}`;
}

export default function PayrollPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Payroll | null>(null);
  const [viewing, setViewing] = useState<Payroll | null>(null);
  const [deleting, setDeleting] = useState<Payroll | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: periodsData } = usePayrollPeriods();
  const periods = periodsData?.data ?? [];
  // Statistika joriy tanlangan davrga tegishli bo'lsin (barcha davr tanlansa — umumiy).
  const statsPeriod = period === ALL ? undefined : period;

  const { data: statsData, isLoading: statsLoading } = usePayrollStats(statsPeriod);
  const { data, isLoading, isError, error, refetch } = usePayrolls({
    page,
    limit: 10,
    search: debouncedSearch,
    period: period === ALL ? undefined : period,
    status: status === ALL ? undefined : (status as PayrollStatus),
  });

  const calculate = useCalculatePayroll();
  const updatePayroll = useUpdatePayroll();
  const deletePayroll = useDeletePayroll();

  const stats = statsData?.data;
  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  // "Hisoblash" tugmasi tanlangan davr uchun ishlaydi; barcha davr tanlansa joriy oy.
  const calcPeriod = useMemo(() => {
    if (period !== ALL) return period;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, [period]);

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const handleCalculate = async () => {
    try {
      const result = await calculate.mutateAsync({ period: calcPeriod });
      toast.success(result.message ?? "Ish haqi hisoblandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hisoblashda xatolik");
    }
  };

  const setStatusFor = async (row: Payroll, next: PayrollStatus) => {
    try {
      await updatePayroll.mutateAsync({ id: row.id, status: next });
      toast.success(
        next === "paid"
          ? `${row.employeeName} — ish haqi to'landi`
          : `${row.employeeName} — holat yangilandi`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deletePayroll.mutateAsync(deleting.id);
    toast.success("Ish haqi yozuvi o'chirildi");
  };

  /** Holatga qarab qo'shimcha amallar (tasdiqlash / to'langan deb belgilash). */
  const rowMenuItems = (row: Payroll) => {
    if (row.status === "paid") return null;
    return (
      <>
        {row.status === "draft" && (
          <DropdownMenuItem
            onSelect={() => setStatusFor(row, "approved")}
            className="gap-2"
          >
            <BadgeCheck size={15} className="text-[#3f77ad]" /> Tasdiqlash
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => setStatusFor(row, "paid")}
          className="gap-2"
        >
          <CircleCheck size={15} className="text-[#2d7d64]" /> To'langan deb belgilash
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    );
  };

  const columns: Column<Payroll>[] = [
    {
      header: "Xodim",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">
            {row.employeeName}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{row.department}</p>
        </div>
      ),
    },
    {
      header: "Davr",
      className: "hidden sm:table-cell",
      cell: (row) => (
        <span className="text-sm text-slate-500">{formatPeriod(row.period)}</span>
      ),
    },
    {
      header: "Asosiy maosh",
      align: "right",
      className: "hidden md:table-cell",
      cell: (row) => (
        <span className="text-sm text-slate-500">{formatCurrency(row.baseSalary)}</span>
      ),
    },
    {
      header: "Bonus / Jarima",
      align: "right",
      className: "hidden lg:table-cell",
      cell: (row) => (
        <span className="text-sm">
          <span className="text-[#2d7d64]">+{formatNumber(row.bonus)}</span>
          {" / "}
          <span className="text-[#b8564a]">−{formatNumber(row.penalty)}</span>
        </span>
      ),
    },
    {
      header: "Soliq",
      align: "right",
      className: "hidden xl:table-cell",
      cell: (row) => (
        <span className="text-sm text-slate-500">{formatNumber(row.tax)}</span>
      ),
    },
    {
      header: "Qo'lga tegadi",
      align: "right",
      cell: (row) => (
        <span className="text-sm font-bold text-slate-800">
          {formatCurrency(row.netSalary)}
        </span>
      ),
    },
    {
      header: "Holati",
      cell: (row) => (
        <StatusBadge
          label={STATUS_META[row.status].label}
          tone={STATUS_META[row.status].tone}
        />
      ),
    },
    {
      header: "",
      align: "right",
      cell: (row) => (
        <RowActions
          onView={() => setViewing(row)}
          onEdit={row.status === "paid" ? undefined : () => setEditing(row)}
          onDelete={row.status === "paid" ? undefined : () => setDeleting(row)}
        >
          {rowMenuItems(row)}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Ish haqi"
        description="Xodimlar oyligini davomat asosida hisoblang va to'lovlarni boshqaring."
      >
        <Button
          onClick={handleCalculate}
          disabled={calculate.isPending}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          {calculate.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Hisoblanmoqda...
            </>
          ) : (
            <>
              <WalletCards size={16} /> {formatPeriod(calcPeriod)} uchun hisoblash
            </>
          )}
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={Wallet}
          value={stats ? formatCurrency(stats.totalNet) : "—"}
          label="Jami to'lanadigan (net)"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.totalPayrolls) : "—"}
          label="Hisob-kitoblar soni"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.paidCount) : "—"}
          label="To'langan"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.pendingCount) : "—"}
          label="Kutilmoqda"
          tone="warning"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Ish haqi hisob-kitoblari</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Xodim yoki bo'lim"
            />
            <Select value={period} onValueChange={withPageReset(setPeriod)}>
              <SelectTrigger className="w-[160px]" aria-label="Davr bo'yicha filtr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha davrlar</SelectItem>
                {periods.map((item) => (
                  <SelectItem key={item} value={item}>
                    {formatPeriod(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger className="w-[150px]" aria-label="Holat bo'yicha filtr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holatlar</SelectItem>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              isLoading={isLoading}
              emptyText="Ish haqi yozuvi topilmadi. Yuqoridagi tugma bilan hisoblang."
              minWidth={920}
            />
            {pagination && !isLoading && (
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                itemLabel="yozuv"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <PayrollDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        payroll={editing}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.employeeName ?? ""}
        subtitle={viewing ? `${viewing.department} · ${formatPeriod(viewing.period)}` : undefined}
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
                    { label: "Asosiy maosh", value: formatCurrency(viewing.baseSalary) },
                    {
                      label: "Ish kunlari",
                      value: `${viewing.presentDays} / ${viewing.workingDays} kun`,
                    },
                    {
                      label: "Kelmagan uchun ushlanma",
                      value: formatCurrency(viewing.absenceDeduction),
                    },
                    { label: "Bonus", value: formatCurrency(viewing.bonus) },
                    { label: "Jarima", value: formatCurrency(viewing.penalty) },
                    { label: "Soliq (12%)", value: formatCurrency(viewing.tax) },
                    {
                      label: "Qo'lga tegadigan summa",
                      value: (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(viewing.netSalary)}
                        </span>
                      ),
                      full: true,
                    },
                    ...(viewing.note
                      ? [{ label: "Izoh", value: viewing.note, full: true }]
                      : []),
                  ],
                },
              ]
            : []
        }
        actions={
          viewing &&
          viewing.status !== "paid" && (
            <Button
              variant="outline"
              onClick={() => {
                const row = viewing;
                setViewing(null);
                setStatusFor(row, "paid");
              }}
            >
              To'langan deb belgilash
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Ish haqini o'chirish"
        description={
          <>
            <b>{deleting?.employeeName}</b> uchun{" "}
            {deleting ? formatPeriod(deleting.period) : ""} davridagi ish haqi
            yozuvi o'chiriladi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
