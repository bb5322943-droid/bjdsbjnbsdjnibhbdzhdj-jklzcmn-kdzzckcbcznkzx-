  import { useState } from "react";
import { Building2, Plus, User, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import {
  CustomerDialog,
  CUSTOMER_TYPE_OPTIONS,
} from "@/components/CustomerDialog";
import { CustomerOrdersHistoryDialog } from "@/components/CustomerOrdersHistoryDialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCustomerRegions,
  useCustomerStats,
  useCustomers,
  useDeleteCustomer,
  useOrders,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatDate, formatNumber, formatUzPhone } from "@/lib/format";

const ALL = "__all__";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useCustomerStats();
  const { data: regionsData } = useCustomerRegions();
  const { data: ordersData } = useOrders({ page: 1, limit: 1000 }); // Barcha buyurtmalar
  const { data, isLoading, isError, error, refetch } = useCustomers({
    page,
    limit: 10,
    search: debouncedSearch,
    type: type === ALL ? undefined : (type as Customer["type"]),
    region: region === ALL ? undefined : region,
    status: status === ALL ? undefined : (status as Customer["status"]),
  });
  const deleteCustomer = useDeleteCustomer();

  const stats = statsData?.data;
  const customers = data?.data ?? [];
  const pagination = data?.pagination;
  const regions = regionsData?.data ?? [];
  const allOrders = ordersData?.data ?? [];

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  // Xato bo'lsa ConfirmDialog uni ushlab, xabar ko'rsatadi va oynani ochiq qoldiradi.
  const handleDelete = async () => {
    if (!deleting) return;
    await deleteCustomer.mutateAsync(deleting.id);
    toast.success(`${deleting.name} kartotekadan o'chirildi`);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setDialogOpen(true);
  };

  const typeLabel = (value: Customer["type"]) =>
    CUSTOMER_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value;

  const columns: Column<Customer>[] = [
    {
      header: "Mijoz",
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf4f1] text-[#327f6a]">
            {customer.type === "company" ? (
              <Building2 size={17} />
            ) : (
              <User size={17} />
            )}
          </span>
          <div className="min-w-0">
            <button
              onClick={() => {
                setHistoryCustomer(customer);
                setShowHistoryDialog(true);
              }}
              className="text-left hover:text-[#173f38] transition-colors"
            >
              <p className="truncate text-sm font-bold text-slate-700 hover:underline">
                {customer.name}
              </p>
            </button>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {customer.contactPerson || typeLabel(customer.type)}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Aloqa",
      className: "hidden lg:table-cell",
      cell: (customer) => (
        <div>
          <p className="text-sm text-slate-600">
            {formatUzPhone(customer.phone) || "—"}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {customer.email || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Hudud",
      className: "hidden xl:table-cell",
      cell: (customer) => (
        <span className="text-sm text-slate-500">{customer.region || "—"}</span>
      ),
    },
    {
      header: "Qo'shilgan",
      className: "hidden sm:table-cell",
      cell: (customer) => (
        <span className="text-sm text-slate-500">
          {formatDate(customer.createdDate)}
        </span>
      ),
    },
    {
      header: "Holati",
      cell: (customer) => (
        <StatusBadge
          label={customer.status === "active" ? "Faol" : "Arxivda"}
          tone={customer.status === "active" ? "green" : "slate"}
        />
      ),
    },
    {
      header: "",
      align: "right",
      cell: (customer) => (
        <RowActions
          onView={() => setViewing(customer)}
          onEdit={() => openEdit(customer)}
          onDelete={() => setDeleting(customer)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Mijozlar"
        description="Mijoz kartotekasi — bitim va buyurtmalar shu yozuvlarga bog'lanadi."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi mijoz
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={UsersRound}
          value={stats ? formatNumber(stats.totalCustomers) : "—"}
          label="Jami mijoz"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.activeCustomers) : "—"}
          label="Faol mijoz"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.newThisMonth) : "—"}
          label="Bu oy qo'shilgan"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.totalRevenue) : "—"}
          label="Yetkazilgan buyurtmalar (so'm)"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Mijozlar ro'yxati</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Nomi, aloqa shaxsi, email"
            />
            <Select value={type} onValueChange={withPageReset(setType)}>
              <SelectTrigger
                className="w-[150px]"
                aria-label="Turi bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha turlar</SelectItem>
                {CUSTOMER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={region} onValueChange={withPageReset(setRegion)}>
              <SelectTrigger
                className="w-[160px]"
                aria-label="Hudud bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha hududlar</SelectItem>
                {regions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger
                className="w-[140px]"
                aria-label="Holat bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holatlar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Arxivda</SelectItem>
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
                rows={customers}
                rowKey={(customer) => customer.id}
                isLoading={isLoading}
                emptyText="Mos mijoz topilmadi."
                minWidth={860}
              />
            ) : (
              <CardGrid
                rows={customers}
                rowKey={(customer) => customer.id}
                isLoading={isLoading}
                emptyText="Mos mijoz topilmadi."
                renderCard={(customer) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf4f1] text-[#327f6a]">
                          {customer.type === "company" ? (
                            <Building2 size={20} />
                          ) : (
                            <User size={20} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <button
                            onClick={() => {
                              setHistoryCustomer(customer);
                              setShowHistoryDialog(true);
                            }}
                            className="text-left hover:text-[#173f38] transition-colors"
                          >
                            <p className="truncate font-bold text-slate-700 hover:underline">
                              {customer.name}
                            </p>
                          </button>
                          <p className="truncate text-xs text-slate-400">
                            {typeLabel(customer.type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(customer)} />
                        <RowActions
                          onView={() => setViewing(customer)}
                          onEdit={() => openEdit(customer)}
                          onDelete={() => setDeleting(customer)}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <StatusBadge
                        label={
                          customer.status === "active" ? "Faol" : "Arxivda"
                        }
                        tone={customer.status === "active" ? "green" : "slate"}
                      />
                      <span className="truncate text-xs text-slate-500">
                        {customer.region || "—"}
                      </span>
                    </div>
                    <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Aloqa shaxsi</dt>
                        <dd className="truncate text-slate-600">
                          {customer.contactPerson || "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Telefon</dt>
                        <dd className="text-slate-600">
                          {formatUzPhone(customer.phone) || "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Qo'shilgan</dt>
                        <dd className="text-slate-600">
                          {formatDate(customer.createdDate)}
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
                itemLabel="mijoz"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
        regions={regions}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing ? typeLabel(viewing.type) : undefined}
        badges={
          viewing && (
            <StatusBadge
              label={viewing.status === "active" ? "Faol" : "Arxivda"}
              tone={viewing.status === "active" ? "green" : "slate"}
            />
          )
        }
        sections={
          viewing
            ? [
                {
                  title: "Aloqa",
                  fields: [
                    { label: "Aloqa shaxsi", value: viewing.contactPerson },
                    { label: "Telefon", value: formatUzPhone(viewing.phone) },
                    { label: "Email", value: viewing.email, full: true },
                  ],
                },
                {
                  title: "Joylashuv",
                  fields: [
                    { label: "Hudud", value: viewing.region },
                    {
                      label: "Qo'shilgan",
                      value: formatDate(viewing.createdDate),
                    },
                    { label: "Manzil", value: viewing.address, full: true },
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
                const customer = viewing;
                setViewing(null);
                openEdit(customer);
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
        title="Mijozni o'chirish"
        description={
          <>
            <b>{deleting?.name}</b> kartotekadan o'chiriladi. Buyurtmasi bor
            mijozni o'chirib bo'lmaydi — uni arxivga o'tkazing.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />

      {/* Customer Orders History Dialog */}
      {historyCustomer && (
        <CustomerOrdersHistoryDialog
          open={showHistoryDialog}
          onClose={() => {
            setShowHistoryDialog(false);
            setHistoryCustomer(null);
          }}
          customerName={historyCustomer.name}
          customerPhone={historyCustomer.phone}
          orders={
            allOrders
              .filter((order) => order.customerId === historyCustomer.id)
              .map((order) => ({
                orderNumber: order.orderNumber,
                orderDate: order.orderDate,
                itemsCount: order.items?.length || 0,
                total: order.total,
                paymentStatus: order.paymentStatus,
                status: order.status,
              }))
          }
        />
      )}
    </>
  );
}
