import { useState } from "react";
import { ChartNoAxesCombined, CircleCheck, CircleX, Plus } from "lucide-react";
import { toast } from "sonner";
import { Deal } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { DealDialog, DEAL_STATUS_OPTIONS } from "@/components/DealDialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCRMStats,
  useDealFunnel,
  useDeals,
  useDeleteDeal,
  useUpdateDeal,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  todayISO,
} from "@/lib/format";
import { ORDINAL } from "@/lib/chart-colors";

const STATUS_META: Record<
  Deal["status"],
  { label: string; tone: "blue" | "violet" | "amber" | "green" | "slate" }
> = {
  new_lead: { label: "Yangi lead", tone: "blue" },
  negotiation: { label: "Muzokara", tone: "violet" },
  proposal: { label: "Taklif", tone: "amber" },
  closed_won: { label: "Muvaffaqiyatli", tone: "green" },
  closed_lost: { label: "Yo'qotildi", tone: "slate" },
};

const ALL = "__all__";

export default function CRM() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Deal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState<Deal | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useCRMStats();
  const { data: funnelData, isLoading: funnelLoading } = useDealFunnel();
  const { data, isLoading, isError, error, refetch } = useDeals({
    page,
    limit: 10,
    search: debouncedSearch,
    status: status === ALL ? undefined : (status as Deal["status"]),
  });
  const deleteDeal = useDeleteDeal();
  const updateDeal = useUpdateDeal();

  const stats = statsData?.data;
  const funnel = funnelData?.data ?? [];
  const deals = data?.data ?? [];
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
    await deleteDeal.mutateAsync(deleting.id);
    toast.success(`${deleting.clientName} bitimi o'chirildi`);
  };

  /** Jadval menyusidan bitimni bir bosishda yopish. */
  const closeDeal = async (
    deal: Deal,
    outcome: "closed_won" | "closed_lost",
  ) => {
    try {
      await updateDeal.mutateAsync({ id: deal.id, status: outcome });
      toast.success(
        outcome === "closed_won"
          ? `${deal.clientName} bitimi muvaffaqiyatli yopildi`
          : `${deal.clientName} bitimi yo'qotilgan deb belgilandi`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditing(deal);
    setDialogOpen(true);
  };

  const today = todayISO();
  const isOpenStage = (deal: Deal) =>
    deal.status !== "closed_won" && deal.status !== "closed_lost";

  /** Ochiq bitim uchun "yutuq/yo'qotildi" menyu bandlari — jadval va kartochkada bir xil. */
  const dealMenuItems = (deal: Deal) =>
    isOpenStage(deal) ? (
      <>
        <DropdownMenuItem
          onSelect={() => closeDeal(deal, "closed_won")}
          className="gap-2"
        >
          <CircleCheck size={15} className="text-[#2d7d64]" /> Yutuq deb yopish
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => closeDeal(deal, "closed_lost")}
          className="gap-2"
        >
          <CircleX size={15} className="text-slate-400" /> Yo'qotilgan deb
          belgilash
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    ) : null;

  const columns: Column<Deal>[] = [
    {
      header: "Mijoz",
      cell: (deal) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">
            {deal.clientName}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {deal.description || "Izoh yo'q"}
          </p>
        </div>
      ),
    },
    {
      header: "Bosqich",
      cell: (deal) => (
        <StatusBadge
          label={STATUS_META[deal.status].label}
          tone={STATUS_META[deal.status].tone}
        />
      ),
    },
    {
      header: "Mas'ul",
      className: "hidden lg:table-cell",
      cell: (deal) => (
        <span className="text-sm text-slate-500">{deal.assignedTo}</span>
      ),
    },
    {
      header: "Yopilishi",
      className: "hidden sm:table-cell",
      cell: (deal) => {
        // Muddati o'tgan ochiq bitimlar qizil ko'rsatiladi — bu darhol e'tibor talab qiladi.
        const overdue = isOpenStage(deal) && deal.expectedCloseDate < today;
        return (
          <span
            className={
              overdue
                ? "text-sm font-semibold text-red-600"
                : "text-sm text-slate-500"
            }
          >
            {formatDate(deal.expectedCloseDate)}
            {overdue && (
              <span className="mt-0.5 block text-xs">Muddati o'tgan</span>
            )}
          </span>
        );
      },
    },
    {
      header: "Summa",
      align: "right",
      cell: (deal) => (
        <span className="text-sm font-bold text-slate-700">
          {formatCurrency(deal.value)}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (deal) => (
        <RowActions
          onView={() => setViewing(deal)}
          onEdit={() => openEdit(deal)}
          onDelete={() => setDeleting(deal)}
        >
          {dealMenuItems(deal)}
        </RowActions>
      ),
    },
  ];

  const funnelMax = Math.max(1, ...funnel.map((stage) => stage.count));

  return (
    <>
      <PageHeader
        title="Savdo"
        description="Mijozlar, bitimlar va buyurtmalarni bitta joyda boshqaring."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi bitim
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={ChartNoAxesCombined}
          value={stats ? formatNumber(stats.totalPipeline) : "—"}
          label="Faol voronka (so'm)"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? stats.newLeads.toString() : "—"}
          label="Yangi lead"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? stats.inNegotiation.toString() : "—"}
          label="Muzokarada"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? stats.closedThisMonth.toString() : "—"}
          label="Bu oy yopildi"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="font-bold text-slate-800">Savdo voronkasi</h3>
        <p className="mt-1 text-sm text-slate-400">
          Bosqichlar bo'yicha bitimlar taqsimoti
        </p>

        <div className="mt-6 space-y-3">
          {funnelLoading
            ? Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))
            : funnel.map((stage, index) => (
                <button
                  key={stage.status}
                  onClick={() => {
                    setStatus(stage.status);
                    setPage(1);
                  }}
                  aria-label={`${stage.label}: ${stage.count} ta bitim, ${formatNumber(stage.value)} so'm`}
                  className="flex w-full items-center gap-4 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#4f947f]"
                >
                  <span className="w-28 shrink-0 text-sm font-medium text-slate-600">
                    {stage.label}
                  </span>
                  <span className="relative h-9 flex-1 overflow-hidden rounded-lg bg-slate-100">
                    {/*
                      Bosqichlar tartiblangan, shuning uchun bitta ohangning
                      och→to'q qadamlari ishlatiladi (ordinal ramp).
                    */}
                    <span
                      className="absolute inset-y-0 left-0 rounded-lg transition-all"
                      style={{
                        width: `${(stage.count / funnelMax) * 100}%`,
                        backgroundColor: ORDINAL[index % ORDINAL.length],
                      }}
                    />
                  </span>
                  {/*
                    Son ustun ichida emas, alohida ustunda — qisqa ustunda
                    yorliq sig'may qolmaydi va matn o'z rangida qoladi.
                  */}
                  <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600">
                    {stage.count} ta
                  </span>
                  <span className="w-28 shrink-0 text-right text-xs tabular-nums text-slate-500">
                    {formatNumber(stage.value)}
                  </span>
                </button>
              ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Bitimlar</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Mijoz, izoh, mas'ul"
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
                {DEAL_STATUS_OPTIONS.map((option) => (
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
                rows={deals}
                rowKey={(deal) => deal.id}
                isLoading={isLoading}
                emptyText="Mos bitim topilmadi."
                minWidth={800}
              />
            ) : (
              <CardGrid
                rows={deals}
                rowKey={(deal) => deal.id}
                isLoading={isLoading}
                emptyText="Mos bitim topilmadi."
                renderCard={(deal) => {
                  const overdue =
                    isOpenStage(deal) && deal.expectedCloseDate < today;
                  return (
                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-700">
                            {deal.clientName}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                            {deal.description || "Izoh yo'q"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <ViewButton onClick={() => setViewing(deal)} />
                          <RowActions
                            onView={() => setViewing(deal)}
                            onEdit={() => openEdit(deal)}
                            onDelete={() => setDeleting(deal)}
                          >
                            {dealMenuItems(deal)}
                          </RowActions>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <StatusBadge
                          label={STATUS_META[deal.status].label}
                          tone={STATUS_META[deal.status].tone}
                        />
                        <span className="truncate text-xs text-slate-500">
                          {deal.assignedTo}
                        </span>
                      </div>
                      <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-400">Summa</dt>
                          <dd className="font-bold text-slate-700">
                            {formatCurrency(deal.value)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-400">Yopilishi</dt>
                          <dd
                            className={
                              overdue
                                ? "font-semibold text-red-600"
                                : "text-slate-600"
                            }
                          >
                            {formatDate(deal.expectedCloseDate)}
                            {overdue && " · muddati o'tgan"}
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
                itemLabel="bitim"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editing}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.clientName ?? ""}
        subtitle={viewing?.assignedTo}
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
                    {
                      label: "Bitim summasi",
                      value: (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(viewing.value)}
                        </span>
                      ),
                    },
                    { label: "Mas'ul xodim", value: viewing.assignedTo },
                    {
                      label: "Yaratilgan",
                      value: formatDate(viewing.createdDate),
                    },
                    {
                      label: "Kutilayotgan yopilish",
                      value: (
                        <span
                          className={
                            isOpenStage(viewing) &&
                            viewing.expectedCloseDate < today
                              ? "font-semibold text-red-600"
                              : undefined
                          }
                        >
                          {formatDate(viewing.expectedCloseDate)}
                          {isOpenStage(viewing) &&
                            viewing.expectedCloseDate < today &&
                            " · muddati o'tgan"}
                        </span>
                      ),
                    },
                    { label: "Izoh", value: viewing.description, full: true },
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
                const deal = viewing;
                setViewing(null);
                openEdit(deal);
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
        title="Bitimni o'chirish"
        description={
          <>
            <b>{deleting?.clientName}</b> bitimi butunlay o'chiriladi. Bu amalni
            qaytarib bo'lmaydi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
