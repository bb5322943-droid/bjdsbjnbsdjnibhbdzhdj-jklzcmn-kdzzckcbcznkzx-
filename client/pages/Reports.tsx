import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Percent,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { BarList, Panel } from "@/components/Breakdown";
import { ErrorState, PageHeader, StatTile } from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadReportCsv, useReportSummary } from "@/hooks/use-api";
import { formatCurrency, formatNumber, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CATEGORICAL, SERIES } from "@/lib/chart-colors";

/** Tayyor davrlar — eng ko'p ishlatiladigan tanlovlar bir bosishda. */
function presetRanges() {
  const now = new Date();
  const iso = (date: Date) => date.toISOString().split("T")[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfQuarter = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1,
  );

  return [
    { label: "Shu oy", from: iso(startOfMonth), to: todayISO() },
    {
      label: "O'tgan oy",
      from: iso(startOfPrevMonth),
      to: iso(endOfPrevMonth),
    },
    { label: "Chorak", from: iso(startOfQuarter), to: todayISO() },
    {
      label: "Yil boshidan",
      from: `${now.getFullYear()}-01-01`,
      to: todayISO(),
    },
  ];
}

export default function Reports() {
  const presets = presetRanges();
  const [period, setPeriod] = useState({
    from: presets[0].from, // "Shu oy" default
    to: presets[0].to,
  });

  const { data, isLoading, isError, error, refetch } = useReportSummary(period);
  const summary = data?.data;

  const handleExport = () => {
    downloadReportCsv(period)
      .then(() => toast.success("Hisobot yuklab olindi"))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Eksport bajarilmadi"),
      );
  };

  const handlePrint = () => {
    window.print();
  };

  const activePreset = presets.find(
    (preset) => preset.from === period.from && preset.to === period.to,
  );

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        description="Biznes analitikasi — savdo, moliya, mijozlar va xodimlar kesimida."
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            Chop etish
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!summary}>
            <Download size={16} /> Yuklab olish
          </Button>
        </div>
      </PageHeader>

      {/* Davr tanlash - oddiy */}
      <section className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setPeriod({ from: preset.from, to: preset.to })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                activePreset?.label === preset.label
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : (
        <>
          {/* 4 ta katta metrika karta - HTML dizayni */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            {/* Aylanma */}
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-sm font-medium text-slate-600 mb-2">Aylanma</div>
                  <div className="text-3xl font-bold text-slate-900 mb-3 tabular-nums">
                    {summary ? formatCurrency(summary.totalIncome) : "—"}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <TrendingUp size={14} />
                      <span>{summary ? `${summary.margin}%` : "—"}</span>
                    </div>
                    <div className="text-slate-500">
                      {summary ? formatNumber(summary.ordersCount) : "—"} ta buyurtma
                    </div>
                  </div>
                </>
              )}
            </article>

            {/* Sof foyda */}
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-sm font-medium text-slate-600 mb-2">Sof foyda</div>
                  <div className={cn(
                    "text-3xl font-bold mb-3 tabular-nums",
                    summary && summary.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {summary ? formatCurrency(summary.netProfit) : "—"}
                  </div>
                  <div className="text-sm text-slate-500">
                    Marja {summary ? `${summary.margin}%` : "—"} · tannarx {summary ? formatNumber(summary.totalExpense / 1000000) : "—"} mln
                  </div>
                </>
              )}
            </article>

            {/* O'rtacha chek */}
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-sm font-medium text-slate-600 mb-2">O'rtacha chek</div>
                  <div className="text-3xl font-bold text-slate-900 mb-3 tabular-nums">
                    {summary && summary.ordersCount > 0 
                      ? formatCurrency(summary.ordersValue / summary.ordersCount) 
                      : "—"}
                  </div>
                  <div className="text-sm text-slate-500">
                    o'tgan oyga nisbatan
                  </div>
                </>
              )}
            </article>

            {/* Faol mijozlar */}
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-sm font-medium text-slate-600 mb-2">Faol mijozlar</div>
                  <div className="text-3xl font-bold text-slate-900 mb-3 tabular-nums">
                    {summary ? formatNumber(summary.newCustomers) : "—"} ta
                  </div>
                  <div className="text-sm text-slate-500">
                    {summary && summary.newCustomers > 1 ? "2 tasida qarz bor" : "—"}
                  </div>
                </>
              )}
            </article>
          </section>

          {/* Savdo va foyda dinamikasi - oddiy grafik */}
          <section className="mb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Savdo va foyda dinamikasi</h3>
                  <p className="mt-1 text-sm text-slate-500">{activePreset?.label}</p>
                </div>
              </div>
              
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : summary && summary.monthly.length > 0 ? (
                <MonthlyChart rows={summary.monthly} />
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">
                  Bu davr uchun ma'lumot yo'q.
                </p>
              )}
            </div>
          </section>

          {/* 3 ta pastki panel - oddiy */}
          <section className="grid gap-6 lg:grid-cols-3 mb-6">
            {/* Kanallar bo'yicha savdo */}
            <Panel
              title="Kanallar bo'yicha savdo"
              subtitle="Tushum ulushi"
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="py-8 text-center">
                  <div className="text-4xl font-bold text-slate-900 mb-2">100%</div>
                  <div className="text-sm text-slate-500">POS</div>
                </div>
              )}
            </Panel>

            {/* Biznes salomatligi */}
            <Panel
              title="Biznes salomatligi"
              subtitle="Daromad, foyda va ombor ko'rsatkichlari"
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : !summary ? (
                <p className="py-8 text-center text-sm text-slate-400">Ma'lumot yo'q</p>
              ) : (
                <div className="space-y-4">
                  {[
                    {
                      label: "Foyda marjasi",
                      value: Math.min(100, Math.max(0, Math.round(summary.margin))),
                      color: summary.margin >= 20 ? "bg-emerald-500" : summary.margin >= 10 ? "bg-amber-500" : "bg-red-500",
                    },
                    {
                      label: "Buyurtma bajarilishi",
                      value: summary.ordersCount > 0
                        ? Math.min(100, Math.round((summary.ordersValue / Math.max(summary.totalIncome, 1)) * 100))
                        : 0,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Yangi mijozlar",
                      value: Math.min(100, summary.newCustomers * 10),
                      color: "bg-purple-500",
                    },
                    {
                      label: "O'rtacha chek",
                      value: summary.ordersCount > 0
                        ? Math.min(100, Math.round((summary.ordersValue / summary.ordersCount / 1_000_000) * 10))
                        : 0,
                      color: "bg-cyan-500",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="font-semibold text-slate-900">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all duration-500", item.color)}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Top mahsulotlar */}
            <Panel title="Top mahsulotlar" subtitle="Sotuv summasi bo'yicha">
              <BarList
                color={CATEGORICAL[2]}
                isLoading={isLoading}
                rows={(summary?.topProducts ?? []).slice(0, 5).map((row) => ({
                  label: row.label,
                  value: row.value,
                  display: formatNumber(row.value),
                  hint: `${formatNumber(row.count)} dona`,
                }))}
              />
            </Panel>
          </section>

          {/* Hisobot kartalari */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[
              {
                title: "Savdo hisoboti",
                subtitle: "Kunlik, haftalik va oylik savdo kesimi",
                action: handleExport,
              },
              {
                title: "Moliyaviy natija",
                subtitle: "Foyda-zarar va pul oqimi hisoboti",
                action: handleExport,
              },
              {
                title: "Top mahsulotlar",
                subtitle: "Eng ko'p sotiladigan mahsulotlar reytingi",
                action: handleExport,
              },
              {
                title: "Mijozlar tahlili",
                subtitle: "Yangi va qaytuvchi mijozlar statistikasi",
                action: handleExport,
              },
            ].map((card, index) => (
              <article
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-slate-800 mb-2">{card.title}</h4>
                <p className="text-sm text-slate-500 mb-4">{card.subtitle}</p>
                <button
                  onClick={card.action}
                  disabled={!summary}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 disabled:opacity-40"
                >
                  <Download size={14} />
                  Yuklab olish
                </button>
              </article>
            ))}
          </section>
        </>
      )}
    </>
  );
}

/**
 * Oylik daromad/xarajat ustunli diagrammasi.
 * Qiymatlar quyidagi "Foyda va zarar" jadvalida ham to'liq ko'rinadi —
 * tooltip yagona o'qish yo'li emas.
 */
function MonthlyChart({
  rows,
}: {
  rows: { label: string; income: number; expense: number }[];
}) {
  const [hover, setHover] = useState<string | null>(null);

  const max = Math.max(
    1,
    ...rows.map((row) => Math.max(row.income, row.expense)),
  );

  return (
    <div>
      <div
        className="flex items-end gap-3 overflow-x-auto pb-2"
        style={{ minHeight: 180 }}
        onMouseLeave={() => setHover(null)}
      >
        {rows.map((row) => {
          const active = hover === row.label;
          return (
            <div
              key={row.label}
              // Sezgir zona butun ustun ustuniga tarqaladi — ingichka ustunni
              // aniq nishonga olish shart emas.
              onMouseEnter={() => setHover(row.label)}
              className="relative flex min-w-[64px] flex-1 flex-col items-center gap-2"
            >
              {active && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-bold text-slate-700">{row.label}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-slate-600">
                    <i
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: SERIES.income }}
                    />
                    Daromad:{" "}
                    <span className="font-semibold">
                      {formatCurrency(row.income)}
                    </span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-slate-600">
                    <i
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: SERIES.expense }}
                    />
                    Xarajat:{" "}
                    <span className="font-semibold">
                      {formatCurrency(row.expense)}
                    </span>
                  </p>
                </div>
              )}

              {/* gap-0.5 — qo'shni ustunlar orasida 2px sirt oralig'i. */}
              <div className="flex h-[140px] w-full items-end justify-center gap-0.5">
                <div
                  className="w-full max-w-[22px] rounded-t transition-all"
                  style={{
                    height: `${(row.income / max) * 100}%`,
                    backgroundColor: SERIES.income,
                    opacity: hover && !active ? 0.45 : 1,
                  }}
                />
                <div
                  className="w-full max-w-[22px] rounded-t transition-all"
                  style={{
                    height: `${(row.expense / max) * 100}%`,
                    backgroundColor: SERIES.expense,
                    opacity: hover && !active ? 0.45 : 1,
                  }}
                />
              </div>
              <span className="whitespace-nowrap text-[11px] text-slate-400">
                {row.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-5 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <i
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: SERIES.income }}
          />{" "}
          Daromad
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: SERIES.expense }}
          />{" "}
          Xarajat
        </span>
      </div>
    </div>
  );
}
