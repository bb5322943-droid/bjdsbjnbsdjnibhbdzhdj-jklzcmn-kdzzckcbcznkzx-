import { useState } from "react";
import { ScrollText } from "lucide-react";
import { AuditAction, AuditLog as AuditEntry } from "@shared/api";
import { Column, DataTable, TablePagination } from "@/components/DataTable";
import {
  ErrorState,
  HeroStat,
  PageHeader,
  SearchInput,
  StatTile,
  StatusBadge,
} from "@/components/PageKit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLogs, useAuditStats } from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatNumber, formatTimeAgo } from "@/lib/format";

const ALL = "__all__";

const ACTION_META: Record<
  AuditAction,
  { label: string; tone: "green" | "blue" | "red" | "slate" | "violet" }
> = {
  create: { label: "Yaratildi", tone: "green" },
  update: { label: "Yangilandi", tone: "blue" },
  delete: { label: "O'chirildi", tone: "red" },
  login: { label: "Kirish", tone: "violet" },
  logout: { label: "Chiqish", tone: "slate" },
  auth: { label: "Autentifikatsiya", tone: "slate" },
};

/** ISO vaqtni "17-iyul 14:32" ko'rinishida ko'rsatadi. */
function formatFullTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("uz-UZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState(ALL);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useAuditStats();
  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page,
    limit: 15,
    search: debouncedSearch,
    action: action === ALL ? undefined : (action as AuditAction),
  });

  const stats = statsData?.data;
  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const withPageReset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const columns: Column<AuditEntry>[] = [
    {
      header: "Vaqt",
      cell: (log) => (
        <div>
          <p className="text-sm font-medium text-slate-600">
            {formatFullTime(log.timestamp)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{formatTimeAgo(log.timestamp)}</p>
        </div>
      ),
    },
    {
      header: "Foydalanuvchi",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">{log.userName}</p>
          <p className="mt-0.5 text-xs text-slate-400">{log.userRole}</p>
        </div>
      ),
    },
    {
      header: "Amal",
      cell: (log) => (
        <StatusBadge label={ACTION_META[log.action].label} tone={ACTION_META[log.action].tone} />
      ),
    },
    {
      header: "Tavsif",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-600">{log.summary}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{log.entity}</p>
        </div>
      ),
    },
    {
      header: "IP manzil",
      align: "right",
      className: "hidden lg:table-cell",
      cell: (log) => (
        <span className="font-mono text-xs text-slate-500">{log.ipAddress}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit jurnali"
        description="Tizimdagi har bir amal — kim, qachon, qaysi IP orqali bajarganini kuzating."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={ScrollText}
          value={stats ? formatNumber(stats.total) : "—"}
          label="Jami yozuv"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.today) : "—"}
          label="Bugun"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.creates) : "—"}
          label="Yaratildi"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.deletes) : "—"}
          label="O'chirildi"
          tone="warning"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Amallar tarixi</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Foydalanuvchi, tavsif, modul"
            />
            <Select value={action} onValueChange={withPageReset(setAction)}>
              <SelectTrigger className="w-[170px]" aria-label="Amal turi bo'yicha filtr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha amallar</SelectItem>
                {Object.entries(ACTION_META).map(([value, meta]) => (
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
              rows={logs}
              rowKey={(log) => log.id}
              isLoading={isLoading}
              emptyText="Audit yozuvi topilmadi."
              minWidth={820}
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
    </>
  );
}
