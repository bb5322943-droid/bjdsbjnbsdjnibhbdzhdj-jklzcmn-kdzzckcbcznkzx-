import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  CircleAlert,
  Download,
  Handshake,
  PackageMinus,
  PackagePlus,
  PenLine,
  Plus,
  Trash2,
  TrendingUp,
  UserPlus,
  UsersRound,
  WalletCards,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { RevenueChart } from "@/components/RevenueChart";
import { BarList, DonutChart, Panel } from "@/components/Breakdown";
import { PageHeader } from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import { MetricCardSkeleton } from "@/components/ChartSkeleton";
import {
  downloadTransactionsCsv,
  useAlerts,
  useCRMBreakdown,
  useDashboardStats,
  useFinanceBreakdown,
  useHRBreakdown,
  useOrderStats,
  useRecentActivities,
  useRevenueTrend,
  useWarehouseStats,
} from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { CATEGORICAL, toSegments } from "@/lib/chart-colors";
import { formatNumber, formatPercentChange, formatTimeAgo } from "@/lib/format";

/** Faollik jurnalidagi `icon` matnini komponentga bog'laydi. */
const ACTIVITY_ICONS: Record<string, typeof Plus> = {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  UsersRound,
  UserPlus,
  Handshake,
  PackagePlus,
  PackageMinus,
  PenLine,
  Trash2,
};

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

export default function Index() {
  const { user } = useAuth();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: trendData, isLoading: trendLoading } = useRevenueTrend();
  const { data: activitiesData, isLoading: activitiesLoading } =
    useRecentActivities(6);
  const { data: alertsData } = useAlerts();
  const { data: warehouseData } = useWarehouseStats();
  const { data: financeBreakdownData, isLoading: financeBreakdownLoading } =
    useFinanceBreakdown();
  const { data: hrBreakdownData, isLoading: hrBreakdownLoading } =
    useHRBreakdown();
  const { data: crmBreakdownData } = useCRMBreakdown();
  const { data: orderStatsData } = useOrderStats();

  const stats = statsData?.data;
  const trend = trendData?.data ?? [];
  const activities = activitiesData?.data ?? [];
  const alerts = alertsData?.data ?? [];
  const warehouse = warehouseData?.data;
  const financeBreakdown = financeBreakdownData?.data;
  const hrBreakdown = hrBreakdownData?.data;
  const crmBreakdown = crmBreakdownData?.data;
  const orderStats = orderStatsData?.data;

  // Xarajatlar kategoriya bo'yicha: eng yiriklari alohida, qolgani "Boshqa" ostida.
  // Tail'ni tashlab yubormaymiz — aks holda diagramma qismni butun deb ko'rsatardi.
  const expenseSegments = toSegments(
    financeBreakdown?.byCategory ?? [],
    (row) => row.category,
    (row) => row.expense,
  );
  const totalExpense = expenseSegments.reduce(
    (sum, segment) => sum + segment.value,
    0,
  );

  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const periodLabel = `1 — ${daysInMonth} ${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;

  // Salomlashuvda foydalanuvchining ismini (familiyasiz) ko'rsatamiz.
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName
    ? `Assalomu alaykum, ${firstName}`
    : "Assalomu alaykum";

  /** Hisobot — joriy oydagi barcha tranzaksiyalarni CSV qilib yuklaydi. */
  const handleExportReport = () => {
    const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const last = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${daysInMonth}`;
    downloadTransactionsCsv({ from: first, to: last })
      .then(() => toast.success("Oylik hisobot yuklab olindi"))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Eksport bajarilmadi"),
      );
  };

  const cards = stats
    ? [
        {
          label: "Jami daromad",
          value: formatNumber(stats.totalRevenue),
          change: stats.revenueChange,
          note: "o'tgan oyga nisbatan",
          icon: WalletCards,
          tone: "bg-[#e9f5ef] text-[#2b8169]",
          suffix: "so'm",
        },
        {
          label: "Jami xarajat",
          value: formatNumber(stats.totalExpenses),
          change: stats.expensesChange,
          note: "o'tgan oyga nisbatan",
          icon: ArrowDownRight,
          tone: "bg-[#fff3e7] text-[#d8893e]",
          suffix: "so'm",
          // Xarajatning o'sishi yomon signal — rang mantig'i teskari.
          invert: true,
        },
        {
          label: "Sof foyda",
          value: formatNumber(stats.netProfit),
          change: stats.profitChange,
          note: "o'tgan oyga nisbatan",
          icon: TrendingUp,
          tone: "bg-[#eeedfb] text-[#7266c9]",
          suffix: "so'm",
        },
        {
          label: "Faol xodimlar",
          value: formatNumber(stats.activeEmployees),
          change: stats.employeesChange,
          note: "bu oyda qo'shildi",
          icon: UsersRound,
          tone: "bg-[#eaf2fa] text-[#4e81b6]",
          isCount: true,
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        title={greeting}
        description="Kompaniyangizdagi asosiy ko'rsatkichlar va so'nggi faollik."
      >
        <span className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600">
          {periodLabel}
        </span>
        <Button
          onClick={handleExportReport}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Download size={16} /> Hisobot olish
        </Button>
      </PageHeader>

      <section className="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <MetricCardSkeleton key={index} />
            ))
          : cards.map((card) => {
              const Icon = card.icon;
              const isPositive = card.change > 0;
              const changeColor = card.invert
                ? isPositive
                  ? "text-red-600"
                  : "text-emerald-600"
                : isPositive
                ? "text-emerald-600"
                : "text-red-600";

              return (
                <article
                  key={card.label}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className={cn("rounded-lg p-2.5", card.tone)}>
                      <Icon size={20} />
                    </div>
                    <div className="text-right">
                      <div className={cn("text-xs font-semibold", changeColor)}>
                        {formatPercentChange(card.change)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {card.note}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-600">
                      {card.label}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-slate-900 tabular-nums">
                        {card.value}
                      </p>
                      <span className="text-sm font-medium text-slate-500">
                        {card.suffix}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
      </section>

      <section className="mt-6 xl:grid xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.8fr)] xl:gap-6 space-y-6 xl:space-y-0">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <RevenueChart points={trend} isLoading={trendLoading} />
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h3 className="font-bold text-slate-800">Diqqat talab etadi</h3>
            <p className="mt-1 text-sm text-slate-500">
              {alerts.length} ta faol ogohlantirish
            </p>
          </div>

          {alerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Hozircha ogohlantirish yo'q. Barcha ko'rsatkichlar me'yorda.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-lg border p-3.5",
                    alert.type === "warning"
                      ? "border-[#f1ddbf] bg-[#fffaf2]"
                      : "border-[#e7e4f7] bg-[#faf9ff]",
                  )}
                >
                  <div className="flex gap-3">
                    <CircleAlert
                      className={cn(
                        "mt-0.5 shrink-0",
                        alert.type === "warning"
                          ? "text-[#d9953e]"
                          : "text-[#7165c5]",
                      )}
                      size={19}
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {alert.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {alert.description}
                      </p>
                      <Link
                        to={alert.actionUrl}
                        className={cn(
                          "mt-2 inline-block text-xs font-bold",
                          alert.type === "warning"
                            ? "text-[#b66d20]"
                            : "text-[#5f56ab]",
                        )}
                      >
                        {alert.actionText}{" "}
                        <ChevronRight className="inline" size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 xl:grid xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.8fr)] xl:gap-6 space-y-6 xl:space-y-0">
        <article className="rounded-xl border border-slate-200 bg-white">
          <div className="p-5">
            <h3 className="font-bold text-slate-800">So'nggi faollik</h3>
            <p className="mt-1 text-sm text-slate-500">
              Barcha bo'limlardan so'nggi yangilanishlar
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {activitiesLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex gap-3 px-5 py-4">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              : activities.length === 0 ? (
                <div className="py-12 px-5 text-center">
                  <p className="text-sm text-slate-500">Hali faollik yo'q</p>
                </div>
              ) : activities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.icon] ?? Plus;
                  return (
                    <div
                      key={activity.id}
                      className="flex gap-3 px-5 py-4 hover:bg-slate-50"
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold",
                          activity.userBgClass,
                        )}
                      >
                        {activity.userInitials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700">
                          {activity.action}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {activity.details}
                        </p>
                      </div>
                      <span className="hidden whitespace-nowrap text-xs text-slate-400 sm:block">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      <Icon className="text-slate-300 sm:hidden" size={16} />
                    </div>
                  );
                })}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-[#173f38] p-5 text-white">
          <WarehouseIcon size={21} className="text-[#a4d6b5]" />
          <h3 className="mt-5 text-lg font-bold">Ombor holati</h3>
          <p className="mt-1 text-sm text-[#b6ccc5]">
            {warehouse
              ? `Jami ${formatNumber(warehouse.totalProducts)} ta mahsulot nazorat ostida`
              : "Ma'lumotlar yuklanmoqda..."}
          </p>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-2xl font-bold">
                {warehouse ? formatNumber(warehouse.normalStock) : "—"}
              </p>
              <p className="mt-1 text-xs text-[#b6ccc5]">Me'yorda</p>
            </div>
            
            <div
              className={cn(
                "rounded-lg p-3",
                warehouse && warehouse.lowStock > 0
                  ? "bg-amber-500/90 text-amber-900"
                  : "bg-white/10 text-white",
              )}
            >
              <p className="text-2xl font-bold">
                {warehouse ? formatNumber(warehouse.lowStock) : "—"}
              </p>
              <p className="mt-1 text-xs font-medium">Tanqis</p>
            </div>
          </div>
          
          <Link
            to="/warehouse"
            className="mt-5 flex items-center justify-between rounded-lg bg-white/10 px-3.5 py-3 text-sm font-bold transition hover:bg-white/15"
          >
            Omborga o'tish 
            <ChevronRight size={18} />
          </Link>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="Xarajatlar tarkibi"
          subtitle={
            financeBreakdown
              ? `Joriy oy · ${formatNumber(totalExpense)} so'm`
              : "Joriy oy · kategoriya bo'yicha"
          }
        >
          <DonutChart
            segments={expenseSegments}
            isLoading={financeBreakdownLoading}
          />
        </Panel>

        <Panel
          title="Bo'limlar bo'yicha xodimlar"
          subtitle="Soni va oylik ish haqi fondi"
        >
          <BarList
            isLoading={hrBreakdownLoading}
            rows={(hrBreakdown?.byDepartment ?? []).map((row) => ({
              label: row.department,
              value: row.headcount,
              display: `${row.headcount} kishi`,
              hint: `${formatNumber(row.salaryTotal)} so'm/oy`,
            }))}
          />
        </Panel>

        <Panel
          title="Buyurtmalar holati"
          subtitle="Jarayondagi va to'lanmagan summalar"
          action={
            <Link
              to="/orders"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Barchasi
            </Link>
          }
        >
          {!orderStats ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <dl className="space-y-3">
              {[
                [
                  "Jami buyurtma",
                  orderStats ? formatNumber(orderStats.totalOrders) : "—",
                ],
                [
                  "Jarayonda",
                  orderStats ? formatNumber(orderStats.pendingOrders) : "—",
                ],
                [
                  "Umumiy qiymat",
                  orderStats
                    ? `${formatNumber(orderStats.totalValue)} so'm`
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-3"
                >
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="text-sm font-bold text-slate-800">{value}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3">
                <dt className="text-sm text-slate-500">To'lanmagan</dt>
                <dd className="text-sm font-bold text-[#b5761f]">
                  {orderStats
                    ? `${formatNumber(Math.round(orderStats.unpaidAmount))} so'm`
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
        </Panel>

        <Panel
          title="Top mijozlar"
          subtitle="Bitimlar summasi bo'yicha"
          action={
            crmBreakdown ? (
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  {crmBreakdown.conversionRate}%
                </p>
                <p className="text-[11px] text-slate-400">konversiya</p>
              </div>
            ) : undefined
          }
        >
          <BarList
            color={CATEGORICAL[1]}
            rows={(crmBreakdown?.topClients ?? []).map((row) => ({
              label: row.label,
              value: row.value,
              display: formatNumber(row.value),
            }))}
          />
        </Panel>
      </section>
    </>
  );
}

