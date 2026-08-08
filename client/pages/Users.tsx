import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { User, UserRole } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { UserDialog, ROLE_OPTIONS } from "@/components/UserDialog";
import { Panel } from "@/components/Breakdown";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteUser,
  useRolePermissions,
  useUserStats,
  useUsers,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatDate, formatNumber, formatTimeAgo } from "@/lib/format";

const ALL = "__all__";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Rahbar",
  accountant: "Buxgalter",
  warehouse: "Ombor xodimi",
  sales: "Sotuv menejeri",
  viewer: "Kuzatuvchi",
};

const ROLE_TONE: Record<
  UserRole,
  "green" | "blue" | "violet" | "amber" | "slate"
> = {
  admin: "green",
  manager: "blue",
  accountant: "violet",
  warehouse: "amber",
  sales: "blue",
  viewer: "slate",
};

export default function Users() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useUserStats();
  const { data: rolesData, isLoading: rolesLoading } = useRolePermissions();
  const { data, isLoading, isError, error, refetch } = useUsers({
    page,
    limit: 10,
    search: debouncedSearch,
    role: role === ALL ? undefined : (role as UserRole),
    status: status === ALL ? undefined : (status as User["status"]),
  });
  const deleteUser = useDeleteUser();

  const stats = statsData?.data;
  const roles = rolesData?.data ?? [];
  const users = data?.data ?? [];
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
    await deleteUser.mutateAsync(deleting.id);
    toast.success(`${deleting.name} o'chirildi`);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setDialogOpen(true);
  };

  const columns: Column<User>[] = [
    {
      header: "Foydalanuvchi",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-xs font-bold text-[#327f6a]">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Rol",
      cell: (user) => (
        <StatusBadge
          label={ROLE_LABEL[user.role]}
          tone={ROLE_TONE[user.role]}
        />
      ),
    },
    {
      header: "Oxirgi kirish",
      className: "hidden lg:table-cell",
      cell: (user) => (
        <span className="text-sm text-slate-500">
          {user.lastLogin ? formatTimeAgo(user.lastLogin) : "Hech qachon"}
        </span>
      ),
    },
    {
      header: "Qo'shilgan",
      className: "hidden xl:table-cell",
      cell: (user) => (
        <span className="text-sm text-slate-500">
          {formatDate(user.createdDate)}
        </span>
      ),
    },
    {
      header: "Holati",
      cell: (user) => (
        <StatusBadge
          label={user.status === "active" ? "Faol" : "To'xtatilgan"}
          tone={user.status === "active" ? "green" : "slate"}
        />
      ),
    },
    {
      header: "",
      align: "right",
      cell: (user) => (
        <RowActions
          onView={() => setViewing(user)}
          onEdit={() => openEdit(user)}
          onDelete={() => setDeleting(user)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Foydalanuvchilar va rollar"
        description="Tizimga kirish huquqlari — kim qaysi bo'limni ocha oladi."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi foydalanuvchi
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={ShieldCheck}
          value={stats ? formatNumber(stats.totalUsers) : "—"}
          label="Jami foydalanuvchi"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.activeUsers) : "—"}
          label="Faol hisob"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.admins) : "—"}
          label="Administrator"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.activeThisWeek) : "—"}
          label="Shu hafta kirgan"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Foydalanuvchilar</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Ism yoki email"
            />
            <Select value={role} onValueChange={withPageReset(setRole)}>
              <SelectTrigger
                className="w-[170px]"
                aria-label="Rol bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha rollar</SelectItem>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="suspended">To'xtatilgan</SelectItem>
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
                rows={users}
                rowKey={(user) => user.id}
                isLoading={isLoading}
                emptyText="Mos foydalanuvchi topilmadi."
                minWidth={860}
              />
            ) : (
              <CardGrid
                rows={users}
                rowKey={(user) => user.id}
                isLoading={isLoading}
                emptyText="Mos foydalanuvchi topilmadi."
                renderCard={(user) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-sm font-bold text-[#327f6a]">
                          {initials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-700">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(user)} />
                        <RowActions
                          onView={() => setViewing(user)}
                          onEdit={() => openEdit(user)}
                          onDelete={() => setDeleting(user)}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <StatusBadge
                        label={ROLE_LABEL[user.role]}
                        tone={ROLE_TONE[user.role]}
                      />
                      <StatusBadge
                        label={
                          user.status === "active" ? "Faol" : "To'xtatilgan"
                        }
                        tone={user.status === "active" ? "green" : "slate"}
                      />
                    </div>

                    <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Oxirgi kirish</dt>
                        <dd className="text-slate-600">
                          {user.lastLogin
                            ? formatTimeAgo(user.lastLogin)
                            : "Hech qachon"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Qo'shilgan</dt>
                        <dd className="text-slate-600">
                          {formatDate(user.createdDate)}
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
                itemLabel="foydalanuvchi"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <section className="mt-6">
        <Panel
          title="Ruxsatlar matritsasi"
          subtitle="Har bir rol qaysi bo'limlarni ocha oladi"
        >
          {rolesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((permission) => (
                <div
                  key={permission.role}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge
                      label={permission.label}
                      tone={ROLE_TONE[permission.role]}
                    />
                    <span className="text-xs text-slate-400">
                      {permission.description}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {permission.modules.map((module) => (
                      <span
                        key={module}
                        className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing?.email}
        badges={
          viewing && (
            <>
              <StatusBadge
                label={ROLE_LABEL[viewing.role]}
                tone={ROLE_TONE[viewing.role]}
              />
              <StatusBadge
                label={viewing.status === "active" ? "Faol" : "To'xtatilgan"}
                tone={viewing.status === "active" ? "green" : "slate"}
              />
            </>
          )
        }
        sections={
          viewing
            ? [
                {
                  fields: [
                    { label: "Rol", value: ROLE_LABEL[viewing.role] },
                    {
                      label: "Bog'liq xodim",
                      value: viewing.employeeId ? "Bog'langan" : "Bog'lanmagan",
                    },
                    {
                      label: "Oxirgi kirish",
                      value: viewing.lastLogin
                        ? formatTimeAgo(viewing.lastLogin)
                        : "Hech qachon",
                    },
                    {
                      label: "Qo'shilgan",
                      value: formatDate(viewing.createdDate),
                    },
                    {
                      label: "Ruxsat etilgan bo'limlar",
                      value: (
                        <span className="flex flex-wrap gap-1.5">
                          {(
                            roles.find((item) => item.role === viewing.role)
                              ?.modules ?? []
                          ).map((module) => (
                            <span
                              key={module}
                              className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
                            >
                              {module}
                            </span>
                          ))}
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
                const user = viewing;
                setViewing(null);
                openEdit(user);
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
        title="Foydalanuvchini o'chirish"
        description={
          <>
            <b>{deleting?.name}</b> tizimga kira olmaydi. Oxirgi administratorni
            o'chirib bo'lmaydi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}

/** "Azizbek Mansurov" → "AM" */
function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
