import { useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Employee } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { EmployeeDialog } from "@/components/EmployeeDialog";
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
  useDeleteEmployee,
  useDepartments,
  useEmployees,
  useHRStats,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatCurrency, formatDate, formatUzPhone } from "@/lib/format";

const STATUS_META: Record<
  Employee["status"],
  { label: string; tone: "green" | "amber" | "red" }
> = {
  active: { label: "Ishda", tone: "green" },
  vacation: { label: "Ta'tilda", tone: "amber" },
  sick_leave: { label: "Kasallik ta'tili", tone: "red" },
};

const ALL = "__all__";

export default function HR() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  // Har bir harf uchun so'rov yubormaslik uchun qidiruv kechiktiriladi.
  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useHRStats();
  const { data: departmentsData } = useDepartments();
  const { data, isLoading, isError, error, refetch } = useEmployees({
    page,
    limit: 10,
    search: debouncedSearch,
    department: department === ALL ? undefined : department,
    status: status === ALL ? undefined : (status as Employee["status"]),
  });
  const deleteEmployee = useDeleteEmployee();

  const stats = statsData?.data;
  const employees = data?.data ?? [];
  const pagination = data?.pagination;
  const departments = departmentsData?.data ?? [];

  /** Filtr o'zgarganda birinchi sahifaga qaytamiz — aks holda bo'sh sahifa ko'rinadi. */
  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  // Xato bo'lsa ConfirmDialog uni ushlab, xabar ko'rsatadi va oynani ochiq qoldiradi.
  const handleDelete = async () => {
    if (!deleting) return;
    await deleteEmployee.mutateAsync(deleting.id);
    toast.success(`${deleting.name} ro'yxatdan o'chirildi`);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setDialogOpen(true);
  };

  const columns: Column<Employee>[] = [
    {
      header: "Xodim",
      cell: (employee) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-xs font-bold text-[#327f6a]">
            {initials(employee.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700">
              {employee.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {employee.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Lavozim",
      cell: (employee) => (
        <div>
          <p className="text-sm text-slate-600">{employee.position}</p>
          <p className="mt-0.5 text-xs text-slate-400">{employee.department}</p>
        </div>
      ),
    },
    {
      header: "Ishga kirgan",
      className: "hidden lg:table-cell",
      cell: (employee) => (
        <span className="text-sm text-slate-500">
          {formatDate(employee.hireDate)}
        </span>
      ),
    },
    {
      header: "Maosh",
      align: "right",
      cell: (employee) => (
        <span className="text-sm font-bold text-slate-700">
          {formatCurrency(employee.salary)}
        </span>
      ),
    },
    {
      header: "Holati",
      cell: (employee) => (
        <StatusBadge
          label={STATUS_META[employee.status].label}
          tone={STATUS_META[employee.status].tone}
        />
      ),
    },
    {
      header: "",
      align: "right",
      cell: (employee) => (
        <RowActions
          onView={() => setViewing(employee)}
          onEdit={() => openEdit(employee)}
          onDelete={() => setDeleting(employee)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Xodimlar"
        description="Jamoa, davomat va ish haqi jarayonlarini boshqaring."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi xodim
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={UsersRound}
          value={stats ? stats.totalEmployees.toString() : "—"}
          label="Jami xodim"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? stats.onVacationToday.toString() : "—"}
          label="Bugun ta'tilda"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? `${stats.attendanceRate}%` : "—"}
          label="Bugungi davomat"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? stats.openPositions.toString() : "—"}
          label="Ochiq vakansiya"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Xodimlar ro'yxati</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Ism, lavozim, email"
            />
            <Select
              value={department}
              onValueChange={withPageReset(setDepartment)}
            >
              <SelectTrigger
                className="w-[150px]"
                aria-label="Bo'lim bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha bo'limlar</SelectItem>
                {departments.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger
                className="w-[150px]"
                aria-label="Holat bo'yicha filtr"
              >
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
                rows={employees}
                rowKey={(employee) => employee.id}
                isLoading={isLoading}
                emptyText="Mos xodim topilmadi."
              />
            ) : (
              <CardGrid
                rows={employees}
                rowKey={(employee) => employee.id}
                isLoading={isLoading}
                emptyText="Mos xodim topilmadi."
                renderCard={(employee) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-sm font-bold text-[#327f6a]">
                          {initials(employee.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-700">
                            {employee.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {employee.position}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(employee)} />
                        <RowActions
                          onView={() => setViewing(employee)}
                          onEdit={() => openEdit(employee)}
                          onDelete={() => setDeleting(employee)}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <StatusBadge
                        label={STATUS_META[employee.status].label}
                        tone={STATUS_META[employee.status].tone}
                      />
                      <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                        {employee.department}
                      </span>
                    </div>
                    <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Maosh</dt>
                        <dd className="font-bold text-slate-700">
                          {formatCurrency(employee.salary)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Telefon</dt>
                        <dd className="text-slate-600">
                          {formatUzPhone(employee.phone) || "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Ishga kirgan</dt>
                        <dd className="text-slate-600">
                          {formatDate(employee.hireDate)}
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
                itemLabel="xodim"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editing}
        departments={departments}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing?.position}
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
                  title: "Ish ma'lumotlari",
                  fields: [
                    { label: "Bo'lim", value: viewing.department },
                    { label: "Lavozim", value: viewing.position },
                    {
                      label: "Ishga kirgan",
                      value: formatDate(viewing.hireDate),
                    },
                    {
                      label: "Maosh",
                      value: (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(viewing.salary)}
                        </span>
                      ),
                    },
                  ],
                },
                {
                  title: "Aloqa",
                  fields: [
                    { label: "Telefon", value: formatUzPhone(viewing.phone) },
                    { label: "Email", value: viewing.email },
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
                const employee = viewing;
                setViewing(null);
                openEdit(employee);
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
        title="Xodimni o'chirish"
        description={
          <>
            <b>{deleting?.name}</b> ro'yxatdan butunlay o'chiriladi. Bu amalni
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

/** "Madina Rasulova" → "MR" */
function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
