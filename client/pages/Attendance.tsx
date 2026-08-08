import { useState } from "react";
import {
  CalendarCheck,
  CircleCheck,
  CircleX,
  Plus,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  AttendanceRecord,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "@shared/api";
import { AttendanceDialog } from "@/components/AttendanceDialog";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import {
  LeaveDialog,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
} from "@/components/LeaveDialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAttendance,
  useAttendanceStats,
  useDeleteLeaveRequest,
  useDepartments,
  useLeaveRequests,
  useLeaveStats,
  useUpdateLeaveRequest,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatDate, formatNumber, todayISO } from "@/lib/format";

const ALL = "__all__";

const ATTENDANCE_META: Record<
  AttendanceRecord["status"],
  { label: string; tone: "green" | "amber" | "blue" | "red" | "slate" }
> = {
  present: { label: "Kelgan", tone: "green" },
  late: { label: "Kechikkan", tone: "amber" },
  remote: { label: "Masofadan", tone: "blue" },
  absent: { label: "Kelmagan", tone: "red" },
  leave: { label: "Ta'tilda", tone: "slate" },
};

const LEAVE_STATUS_META: Record<
  LeaveStatus,
  { label: string; tone: "amber" | "green" | "slate" }
> = {
  pending: { label: "Kutilmoqda", tone: "amber" },
  approved: { label: "Tasdiqlangan", tone: "green" },
  rejected: { label: "Rad etilgan", tone: "slate" },
};

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  vacation: "Mehnat ta'tili",
  sick: "Kasallik",
  personal: "Shaxsiy",
  unpaid: "Haqsiz",
};

export default function Attendance() {
  const [tab, setTab] = useState("attendance");

  return (
    <>
      <PageHeader
        title="Davomat va ta'til"
        description="Kunlik davomat yozuvlari va ta'til so'rovlarini boshqaring."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="attendance">Davomat</TabsTrigger>
          <TabsTrigger value="leave">Ta'til so'rovlari</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>
        <TabsContent value="leave">
          <LeaveTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function AttendanceTab() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [date, setDate] = useState(todayISO());
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useAttendanceStats();
  const { data: departmentsData } = useDepartments();
  const { data, isLoading, isError, error, refetch } = useAttendance({
    page,
    limit: 10,
    search: debouncedSearch,
    department: department === ALL ? undefined : department,
    status: status === ALL ? undefined : (status as AttendanceRecord["status"]),
    date: date || undefined,
  });

  const stats = statsData?.data;
  const records = data?.data ?? [];
  const pagination = data?.pagination;
  const departments = departmentsData?.data ?? [];

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const columns: Column<AttendanceRecord>[] = [
    {
      header: "Xodim",
      cell: (record) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">
            {record.employeeName}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {record.department}
          </p>
        </div>
      ),
    },
    {
      header: "Sana",
      className: "hidden sm:table-cell",
      cell: (record) => (
        <span className="text-sm text-slate-500">
          {formatDate(record.date)}
        </span>
      ),
    },
    {
      header: "Kelgan",
      className: "hidden lg:table-cell",
      cell: (record) => (
        <span className="text-sm text-slate-500">{record.checkIn || "—"}</span>
      ),
    },
    {
      header: "Ketgan",
      className: "hidden lg:table-cell",
      cell: (record) => (
        <span className="text-sm text-slate-500">{record.checkOut || "—"}</span>
      ),
    },
    {
      header: "Soat",
      align: "right",
      className: "hidden xl:table-cell",
      cell: (record) => (
        <span className="text-sm font-semibold text-slate-600">
          {record.hours > 0 ? `${record.hours} soat` : "—"}
        </span>
      ),
    },
    {
      header: "Holati",
      cell: (record) => (
        <StatusBadge
          label={ATTENDANCE_META[record.status].label}
          tone={ATTENDANCE_META[record.status].tone}
        />
      ),
    },
  ];

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={UserCheck}
          value={stats ? `${stats.attendanceRate}%` : "—"}
          label="Bugungi davomat"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.present + stats.remote) : "—"}
          label="Ishda (ofis + masofadan)"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.late) : "—"}
          label="Kechikkan"
          tone="warning"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.absent) : "—"}
          label="Kelmagan"
          tone="warning"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Davomat jurnali</h3>
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
            <input
              type="date"
              value={date}
              onChange={(event) => withPageReset(setDate)(event.target.value)}
              aria-label="Sana bo'yicha filtr"
              className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#4f947f]"
            />
            <Button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="bg-[#173f38] hover:bg-[#0f312b]"
            >
              <Plus size={16} className="mr-1.5" /> Davomat belgilash
            </Button>
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
                {Object.entries(ATTENDANCE_META).map(([value, meta]) => (
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
              rows={records}
              rowKey={(record) => record.id}
              isLoading={isLoading}
              emptyText="Bu sana uchun davomat yozuvi topilmadi."
              minWidth={800}
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

      <AttendanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
      />
    </>
  );
}

function LeaveTab() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<LeaveRequest | null>(null);
  const [deleting, setDeleting] = useState<LeaveRequest | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useLeaveStats();
  const { data, isLoading, isError, error, refetch } = useLeaveRequests({
    page,
    limit: 10,
    search: debouncedSearch,
    type: type === ALL ? undefined : (type as LeaveType),
    status: status === ALL ? undefined : (status as LeaveStatus),
  });
  const updateLeave = useUpdateLeaveRequest();
  const deleteLeave = useDeleteLeaveRequest();

  const stats = statsData?.data;
  const requests = data?.data ?? [];
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
    await deleteLeave.mutateAsync(deleting.id);
    toast.success("Ta'til so'rovi o'chirildi");
  };

  const decide = async (request: LeaveRequest, next: LeaveStatus) => {
    try {
      await updateLeave.mutateAsync({ id: request.id, status: next });
      toast.success(
        next === "approved"
          ? `${request.employeeName} ta'tili tasdiqlandi`
          : `${request.employeeName} so'rovi rad etildi`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (request: LeaveRequest) => {
    setEditing(request);
    setDialogOpen(true);
  };

  /** Kutilayotgan so'rov uchun tasdiqlash/rad etish bandlari. */
  const leaveMenuItems = (request: LeaveRequest) =>
    request.status === "pending" ? (
      <>
        <DropdownMenuItem
          onSelect={() => decide(request, "approved")}
          className="gap-2"
        >
          <CircleCheck size={15} className="text-[#2d7d64]" /> Tasdiqlash
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => decide(request, "rejected")}
          className="gap-2"
        >
          <CircleX size={15} className="text-slate-400" /> Rad etish
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    ) : null;

  const columns: Column<LeaveRequest>[] = [
    {
      header: "Xodim",
      cell: (request) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-700">
            {request.employeeName}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {LEAVE_TYPE_LABEL[request.type]}
          </p>
        </div>
      ),
    },
    {
      header: "Davr",
      cell: (request) => (
        <div>
          <p className="text-sm text-slate-600">
            {formatDate(request.startDate)} — {formatDate(request.endDate)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{request.days} kun</p>
        </div>
      ),
    },
    {
      header: "Sabab",
      className: "hidden xl:table-cell",
      cell: (request) => (
        <span className="text-sm text-slate-500">{request.reason || "—"}</span>
      ),
    },
    {
      header: "So'ralgan",
      className: "hidden lg:table-cell",
      cell: (request) => (
        <span className="text-sm text-slate-500">
          {formatDate(request.requestedDate)}
        </span>
      ),
    },
    {
      header: "Holati",
      cell: (request) => (
        <StatusBadge
          label={LEAVE_STATUS_META[request.status].label}
          tone={LEAVE_STATUS_META[request.status].tone}
        />
      ),
    },
    {
      header: "",
      align: "right",
      cell: (request) => (
        <RowActions
          onView={() => setViewing(request)}
          onEdit={() => openEdit(request)}
          onDelete={() => setDeleting(request)}
        >
          {leaveMenuItems(request)}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={CalendarCheck}
          value={stats ? formatNumber(stats.pending) : "—"}
          label="Kutilayotgan so'rov"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.onLeaveToday) : "—"}
          label="Bugun ta'tilda"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.approvedThisMonth) : "—"}
          label="Bu oy tasdiqlangan"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.totalDaysThisYear) : "—"}
          label="Yillik ta'til kunlari"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Ta'til so'rovlari</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Xodim yoki sabab"
            />
            <Select value={type} onValueChange={withPageReset(setType)}>
              <SelectTrigger
                className="w-[170px]"
                aria-label="Tur bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha turlar</SelectItem>
                {LEAVE_TYPE_OPTIONS.map((option) => (
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
                {LEAVE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ViewToggle view={view} onChange={setView} />
            <Button
              onClick={openCreate}
              className="bg-[#173f38] hover:bg-[#0f312b]"
            >
              <Plus size={16} /> Yangi so'rov
            </Button>
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : (
          <>
            {view === "table" ? (
              <DataTable
                columns={columns}
                rows={requests}
                rowKey={(request) => request.id}
                isLoading={isLoading}
                emptyText="Mos ta'til so'rovi topilmadi."
                minWidth={860}
              />
            ) : (
              <CardGrid
                rows={requests}
                rowKey={(request) => request.id}
                isLoading={isLoading}
                emptyText="Mos ta'til so'rovi topilmadi."
                renderCard={(request) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-700">
                          {request.employeeName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {LEAVE_TYPE_LABEL[request.type]}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(request)} />
                        <RowActions
                          onView={() => setViewing(request)}
                          onEdit={() => openEdit(request)}
                          onDelete={() => setDeleting(request)}
                        >
                          {leaveMenuItems(request)}
                        </RowActions>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <StatusBadge
                        label={LEAVE_STATUS_META[request.status].label}
                        tone={LEAVE_STATUS_META[request.status].tone}
                      />
                      <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                        {request.days} kun
                      </span>
                    </div>

                    <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Davr</dt>
                        <dd className="text-right text-slate-600">
                          {formatDate(request.startDate)} —{" "}
                          {formatDate(request.endDate)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">So'ralgan</dt>
                        <dd className="text-slate-600">
                          {formatDate(request.requestedDate)}
                        </dd>
                      </div>
                      {request.reason && (
                        <div className="flex justify-between gap-2">
                          <dt className="shrink-0 text-slate-400">Sabab</dt>
                          <dd className="truncate text-right text-slate-600">
                            {request.reason}
                          </dd>
                        </div>
                      )}
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
                itemLabel="so'rov"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <LeaveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={editing}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.employeeName ?? ""}
        subtitle={viewing ? LEAVE_TYPE_LABEL[viewing.type] : undefined}
        badges={
          viewing && (
            <StatusBadge
              label={LEAVE_STATUS_META[viewing.status].label}
              tone={LEAVE_STATUS_META[viewing.status].tone}
            />
          )
        }
        sections={
          viewing
            ? [
                {
                  fields: [
                    {
                      label: "Boshlanish",
                      value: formatDate(viewing.startDate),
                    },
                    { label: "Tugash", value: formatDate(viewing.endDate) },
                    {
                      label: "Jami kunlar",
                      value: (
                        <span className="font-bold text-slate-900">
                          {viewing.days} kun
                        </span>
                      ),
                    },
                    {
                      label: "So'ralgan sana",
                      value: formatDate(viewing.requestedDate),
                    },
                    { label: "Sabab", value: viewing.reason, full: true },
                  ],
                },
              ]
            : []
        }
        actions={
          viewing &&
          viewing.status === "pending" && (
            <Button
              variant="outline"
              onClick={() => {
                const request = viewing;
                setViewing(null);
                decide(request, "approved");
              }}
            >
              Tasdiqlash
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Ta'til so'rovini o'chirish"
        description={
          <>
            <b>{deleting?.employeeName}</b> so'rovi o'chiriladi va xodim holati
            qayta hisoblanadi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
