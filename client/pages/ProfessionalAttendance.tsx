import { useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AttendanceRecord,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "@shared/api";
import { AttendanceDialog } from "@/components/AttendanceDialog";
import { QuickAttendance } from "@/components/QuickAttendance";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  useEmployees,
  useLeaveRequests,
  useLeaveStats,
  useUpdateLeaveRequest,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatDate, formatNumber, formatTime, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const ALL = "__all__";

const ATTENDANCE_META: Record<
  AttendanceRecord["status"],
  { label: string; tone: "green" | "amber" | "blue" | "red" | "slate"; icon: any }
> = {
  present: { label: "Kelgan", tone: "green", icon: UserCheck },
  late: { label: "Kechikkan", tone: "amber", icon: Clock },
  remote: { label: "Masofadan", tone: "blue", icon: MapPin },
  absent: { label: "Kelmagan", tone: "red", icon: CalendarX },
  leave: { label: "Ta'tilda", tone: "slate", icon: Calendar },
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

// Mock data - Backend bilan sinxronlash kerak
const mockDepartmentStats = [
  { department: "IT", present: 12, total: 15, percentage: 80 },
  { department: "Moliya", present: 8, total: 10, percentage: 80 },
  { department: "Sotuvlar", present: 18, total: 20, percentage: 90 },
  { department: "Marketing", present: 6, total: 8, percentage: 75 },
];

const mockTodayActivity = [
  { time: "08:55", employee: "Akmal Karimov", action: "Keldi", status: "present", details: "ID orqali" },
  { time: "09:15", employee: "Dilnoza Rahimova", action: "Kechikkan", status: "late", details: "15 daqiqa kechikdi" },
  { time: "09:00", employee: "Jasur Toshev", action: "Masofadan", status: "remote", details: "IP: 213.230.xxx" },
  { time: "—", employee: "Malika Nazarova", action: "Ta'tilda", status: "leave", details: "25.08 gacha" },
  { time: "—", employee: "Shohruh Islomov", action: "Kelmadi", status: "absent", details: "Sabab kiritilmagan" },
];

export default function ProfessionalAttendance() {
  const [tab, setTab] = useState("dashboard");
  const { data: leaveData } = useLeaveRequests({ status: "pending" });
  const pendingCount = leaveData?.data?.length || 0;

  return (
    <>
      <PageHeader
        title="Davomat Boshqaruvi"
        description="Professional davomat tizimi - real vaqt nazorati va hisobotlar"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Umumiy Ko'rinish</TabsTrigger>
          <TabsTrigger value="quick">Tezkor Davomat</TabsTrigger>
          <TabsTrigger value="attendance">Davomat Jurnali</TabsTrigger>
          <TabsTrigger value="leave">
            Ta'til So'rovlari
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="quick">
          <QuickAttendanceTab />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>
        <TabsContent value="leave">
          <LeaveTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function DashboardTab() {
  const { data: statsData, isLoading: statsLoading } = useAttendanceStats();
  const { data: employeesData } = useEmployees({ limit: 1000 });
  const stats = statsData?.data;
  const allEmployees = employeesData?.data ?? [];

  // Real xodimlar soni (backend dan)
  const totalEmployeesReal = allEmployees.length;
  
  // Departmentlar bo'yicha real hisoblash
  const departmentStats = mockDepartmentStats.map(dept => {
    const deptEmployees = allEmployees.filter(e => e.department === dept.department);
    const deptTotal = deptEmployees.length || dept.total;
    const deptPresent = Math.floor(deptTotal * (dept.percentage / 100));
    return {
      ...dept,
      total: deptTotal,
      present: deptPresent,
      percentage: Math.round((deptPresent / deptTotal) * 100),
    };
  });

  // Jami xodimlar: barcha departmentlardan
  const calculatedTotal = departmentStats.reduce((sum, d) => sum + d.total, 0);
  const calculatedPresent = departmentStats.reduce((sum, d) => sum + d.present, 0);
  const calculatedRate = calculatedTotal > 0 ? Math.round((calculatedPresent / calculatedTotal) * 100) : 0;

  // Status bo'yicha taqsimlash
  const presentCount = stats?.present || 0;
  const lateCount = stats?.late || 0;
  const remoteCount = stats?.remote || 0;
  const absentCount = stats?.absent || 0;
  const leaveCount = stats?.onLeave || 0;

  return (
    <>
      {/* Sana va Bo'lim filtri */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            <input
              type="date"
              defaultValue={todayISO()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4f947f] focus:outline-none"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Bo'limni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha bo'limlar</SelectItem>
              <SelectItem value="it">IT</SelectItem>
              <SelectItem value="finance">Moliya</SelectItem>
              <SelectItem value="sales">Sotuvlar</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Biometriya holati */}
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <Wifi size={16} className="text-green-600" />
            <span className="text-xs font-medium text-green-700">Turniket: Onlayn</span>
          </div>
        </div>
      </section>

      {/* Bir xil dizayndagi KPI kartalari */}
      <section className="grid gap-4 md:grid-cols-6">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Users size={20} className="text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">{calculatedTotal}</p>
                <p className="text-xs text-slate-500 mt-0.5">Jami Xodimlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">{calculatedRate}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Bugungi Davomat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">{calculatedPresent}</p>
                <p className="text-xs text-slate-500 mt-0.5">Ishda</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">{lateCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Kechikkan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">{absentCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Kelmagan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <MapPin size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">{remoteCount + leaveCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Masofiy/Ta'til</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Department Stats & Today's Activity */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Bo'limlar bo'yicha Davomat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">
                      {dept.department}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {dept.present}/{dept.total}
                      </span>
                      <Badge
                        variant={dept.percentage >= 85 ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          dept.percentage >= 85 
                            ? "bg-green-100 text-green-800" 
                            : dept.percentage >= 70
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {dept.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={dept.percentage} className="h-2" />
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Jami:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {calculatedPresent}/{calculatedTotal} ({calculatedRate}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Timer size={20} />
                Bugungi Faoliyat
              </CardTitle>
              <Button size="sm" variant="outline" className="h-8">
                <Download size={14} className="mr-1" />
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {mockTodayActivity.map((activity, index) => {
                const Icon = ATTENDANCE_META[activity.status as keyof typeof ATTENDANCE_META]?.icon || Clock;
                return (
                  <button
                    key={index}
                    onClick={() => toast.info(`${activity.employee}\n${activity.details}`)}
                    className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      activity.status === "present" && "bg-green-100 text-green-600",
                      activity.status === "late" && "bg-yellow-100 text-yellow-600", 
                      activity.status === "remote" && "bg-blue-100 text-blue-600",
                      activity.status === "leave" && "bg-purple-100 text-purple-600",
                      activity.status === "absent" && "bg-red-100 text-red-600"
                    )}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {activity.employee}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.action} • {activity.details}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {activity.time}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tez Harakatlar - Ixchamlashtirilgan */}
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Tez Harakatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button className="h-20 flex-col gap-2 bg-[#173f38] hover:bg-[#0f312b]">
                <UserCheck size={20} />
                <span className="text-xs">Davomat Belgilash</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <CalendarCheck size={20} />
                <span className="text-xs">Ta'til So'rovi</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-amber-200 bg-amber-50 hover:bg-amber-100"
                onClick={() => {
                  const lateEmployees = mockTodayActivity.filter(a => a.status === "late" || a.status === "absent");
                  toast.success(`${lateEmployees.length} ta xodimga xabar yuborildi`);
                }}
              >
                <Send size={20} className="text-amber-600" />
                <span className="text-xs text-amber-900">Eslatma Yuborish</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <FileText size={20} />
                <span className="text-xs">Hisobot (PDF)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function QuickAttendanceTab() {
  const { data: employeesData, isLoading } = useEmployees({ limit: 100 });
  const employees = employeesData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2b8169] mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Xodimlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Users size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Xodimlar topilmadi
        </h3>
        <p className="text-sm text-slate-500">
          Avval xodimlar qo'shing, keyin davomat belgilang.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Bugungi Davomat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Barcha xodimlar uchun tezkor davomat belgilash - {todayISO()}
        </p>
      </div>
      
      <QuickAttendance employees={employees} />
    </>
  );
}

function AttendanceTab() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [date, setDate] = useState(""); // Default sana bo'sh - barcha sanalar ko'rinadi
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: departmentsData } = useDepartments();
  const { data, isLoading, isError, error, refetch } = useAttendance({
    page,
    limit: 12,
    search: debouncedSearch,
    department: department === ALL ? undefined : department,
    status: status === ALL ? undefined : (status as AttendanceRecord["status"]),
    date: date || undefined, // Bo'sh string o'rniga undefined yuboramiz
  });

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
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <UserCheck size={16} className="text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {record.employeeName}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {record.department}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Sana",
      className: "hidden sm:table-cell",
      cell: (record) => (
        <span className="text-sm text-slate-600">
          {formatDate(record.date)}
        </span>
      ),
    },
    {
      header: "Kelgan Vaqt",
      className: "hidden lg:table-cell",
      cell: (record) => (
        <div className="text-sm">
          <span className="font-medium text-slate-900">
            {record.checkIn || "—"}
          </span>
          {record.checkIn && (
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(record.date + "T" + record.checkIn).getHours() > 9 ? "Kechikkan" : "O'z vaqtida"}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Ketgan Vaqt",
      className: "hidden lg:table-cell",
      cell: (record) => (
        <span className="text-sm font-medium text-slate-900">
          {record.checkOut || "—"}
        </span>
      ),
    },
    {
      header: "Ish Soati",
      align: "right",
      className: "hidden xl:table-cell",
      cell: (record) => (
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900">
            {record.hours > 0 ? `${record.hours}h` : "—"}
          </span>
          {record.hours > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {record.hours >= 8 ? "To'liq" : "Kam"}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Holat",
      cell: (record) => {
        const meta = ATTENDANCE_META[record.status];
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon size={16} className={cn(
              meta.tone === "green" && "text-green-600",
              meta.tone === "amber" && "text-yellow-600", 
              meta.tone === "blue" && "text-blue-600",
              meta.tone === "red" && "text-red-600",
              meta.tone === "slate" && "text-slate-600"
            )} />
            <StatusBadge
              label={meta.label}
              tone={meta.tone}
            />
          </div>
        );
      },
    },
    {
      header: "",
      align: "right",
      cell: (record) => (
        <RowActions
          onView={() => {}}
          onEdit={() => { setEditing(record); setDialogOpen(true); }}
          onDelete={() => {}}
        />
      ),
    },
  ];

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Davomat Jurnali</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Xodim yoki bo'lim qidirish..."
            />
            <input
              type="date"
              value={date}
              onChange={(event) => withPageReset(setDate)(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4f947f] focus:outline-none"
            />
            <Select
              value={department}
              onValueChange={withPageReset(setDepartment)}
            >
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holat</SelectItem>
                {Object.entries(ATTENDANCE_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ViewToggle view={view} onChange={setView} />
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw size={16} /> Yangilash
            </Button>
            <Button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="bg-[#173f38] hover:bg-[#0f312b]"
            >
              <Plus size={16} /> Davomat Qo'shish
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
                rows={records}
                rowKey={(record) => record.id}
                isLoading={isLoading}
                emptyText="Bu sana uchun davomat yozuvi topilmadi."
                minWidth={900}
              />
            ) : (
              <CardGrid
                rows={records}
                rowKey={(record) => record.id}
                isLoading={isLoading}
                emptyText="Bu sana uchun davomat yozuvi topilmadi."
                renderCard={(record) => {
                  const meta = ATTENDANCE_META[record.status];
                  const Icon = meta.icon;
                  
                  return (
                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <UserCheck size={18} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {record.employeeName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {record.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon size={16} className={cn(
                            meta.tone === "green" && "text-green-600",
                            meta.tone === "amber" && "text-yellow-600", 
                            meta.tone === "blue" && "text-blue-600",
                            meta.tone === "red" && "text-red-600",
                            meta.tone === "slate" && "text-slate-600"
                          )} />
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Kelgan</p>
                          <p className="font-medium text-slate-900">
                            {record.checkIn || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Ketgan</p>
                          <p className="font-medium text-slate-900">
                            {record.checkOut || "—"}
                          </p>
                        </div>
                      </div>

                      {record.hours > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Ish soati</span>
                            <span className="font-bold text-slate-900">
                              {record.hours} soat
                            </span>
                          </div>
                        </div>
                      )}
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
  return <div>Ta'til so'rovlari - Eskisidan import qilinadi</div>;
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Davomat Tahlili</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Analytics qismi rivojlantirilyapti...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}