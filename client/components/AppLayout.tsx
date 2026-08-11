import {
  Building2,
  Calculator,
  CalendarCheck,
  ChartColumn,
  ChartNoAxesCombined,
  ChevronDown,
  Command,
  Contact,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Menu,
  Package,
  Receipt,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  User,
  UsersRound,
  WalletCards,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import { PermissionModule, UserRole } from "@shared/api";
import { branding } from "@/config/branding";

/**
 * Yon menyu bo'limlari — mantiqiy guruhlarga ajratilgan.
 * Har bandda `module` — foydalanuvchi roli shu modulni ko'ra olmasa,
 * band menyuda ko'rsatilmaydi (TZ 12-bo'lim, RBAC).
 */
const navigationGroups: {
  title: string;
  items: { label: string; to: string; icon: LucideIcon; module: PermissionModule }[];
}[] = [
  {
    title: "Boshqaruv",
    items: [
      { label: "Boshqaruv paneli", to: "/", icon: LayoutDashboard, module: "dashboard" },
      { label: "Moliya", to: "/finance", icon: WalletCards, module: "finance" },
    ],
  },
  {
    title: "Savdo",
    items: [
      { label: "Sotuv", to: "/sales", icon: ShoppingCart, module: "sales" },
      { label: "Kassa", to: "/pos", icon: CreditCard, module: "sales" },
      { label: "Buyurtmalar", to: "/orders", icon: Package, module: "crm" },
      { label: "Bitimlar", to: "/crm", icon: ChartNoAxesCombined, module: "crm" },
      { label: "Mijozlar", to: "/customers", icon: Contact, module: "crm" },
      { label: "Qarzlar", to: "/debts", icon: Calculator, module: "crm" },
      { label: "To'lovlar", to: "/payments", icon: Receipt, module: "crm" },
    ],
  },
  {
    title: "Ta'minot",
    items: [
      { label: "Ombor", to: "/warehouse", icon: Warehouse, module: "warehouse" },
      { label: "Mahsulotlar", to: "/products", icon: Package, module: "warehouse" },
      { label: "Xaridlar", to: "/purchases", icon: ShoppingBag, module: "warehouse" },
      { label: "Ta'minotchilar", to: "/suppliers", icon: Truck, module: "warehouse" },
    ],
  },
  {
    title: "Tashkilot",
    items: [
      { label: "Xodimlar", to: "/hr", icon: UsersRound, module: "hr" },
      { label: "Davomat va ta'til", to: "/attendance", icon: CalendarCheck, module: "hr" },
      { label: "Ish haqi", to: "/payroll", icon: WalletCards, module: "hr" },
      { label: "Filiallar", to: "/branches", icon: Building2, module: "dashboard" },
    ],
  },
  {
    title: "Tizim",
    items: [
      { label: "Hisobotlar", to: "/reports", icon: ChartColumn, module: "reports" },
      { label: "Foydalanuvchilar", to: "/users", icon: ShieldCheck, module: "users" },
      { label: "Audit jurnali", to: "/audit", icon: ScrollText, module: "audit" },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/": "Boshqaruv paneli",
  "/finance": "Moliya",
  "/hr": "Xodimlar",
  "/warehouse": "Ombor",
  "/products": "Mahsulotlar",
  "/crm": "Bitimlar",
  "/orders": "Buyurtmalar",
  "/customers": "Mijozlar",
  "/suppliers": "Ta'minotchilar",
  "/purchases": "Xaridlar",
  "/attendance": "Davomat va ta'til",
  "/users": "Foydalanuvchilar",
  "/reports": "Hisobotlar",
  "/audit": "Audit jurnali",
  "/branches": "Filiallar",
  "/debts": "Qarzlar",
  "/payments": "To'lovlar",
  "/pos": "Kassa",
};

/**
 * Doimiy layout — barcha sahifalar shu route ostida joylashadi va sahifa
 * almashganda faqat `Outlet` ichidagi qism yangilanadi.
 * Sidebar DOM'i saqlanib qolgani uchun uning skroll holati ham yo'qolmaydi.
 */
/** Rol kodini header'da ko'rsatiladigan nomga aylantiradi. */
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Rahbar",
  accountant: "Buxgalter",
  warehouse: "Ombor xodimi",
  sales: "Sotuv menejeri",
  viewer: "Kuzatuvchi",
  cashier: "Kassir",
  hr_manager: "HR menejeri",
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] ?? "ERP tizimi";

  // ⌘K / Ctrl+K — istalgan sahifadan global qidiruvni ochadi.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Tizimdan chiqdingiz");
    navigate("/login", { replace: true });
  };

  /** "Sardor Mahmudov" → "SM" */
  const initials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  // Foydalanuvchi ko'ra oladigan bandlar — rol matritsasi asosida.
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !user || hasPermission(user.role, item.module, "view"),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const sidebar = (
    <aside className="flex h-full w-[268px] flex-col border-r border-slate-200 bg-white px-4 py-5">
      <Link
        to="/"
        className="group mb-7 flex items-center gap-3 px-2"
        onClick={() => setOpen(false)}
      >
        <span 
          className="grid h-10 w-10 place-items-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105 overflow-hidden"
          style={{ 
            backgroundColor: branding.logoUrl ? 'transparent' : branding.colors.logoBackground, 
            color: branding.colors.logoText 
          }}
        >
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-10 w-10 object-contain" />
          ) : (
            <Command size={branding.logoIconSize} strokeWidth={branding.logoIconStrokeWidth} />
          )}
        </span>
        <span>
          <strong className="block text-[17px] leading-5 text-slate-900">
            {branding.name}
          </strong>
          <span className="text-xs font-medium tracking-wide text-slate-400">
            {branding.tagline}
          </span>
        </span>
      </Link>
      <nav className="sidebar-scroll flex-1 space-y-6 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">
              {group.title}
            </p>
            {group.items.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-[#e8f1ee] text-[#175b4b]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`
                }
              >
                <Icon size={19} strokeWidth={1.9} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-slate-800">
      <div className="fixed inset-y-0 left-0 z-40 hidden animate-fade-in lg:block">
        {sidebar}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Menyuni yopish"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full animate-slide-down shadow-2xl">
            {sidebar}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-5 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 flex h-[73px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              aria-label="Menyuni ochish"
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-slate-500 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-slate-400">
                {branding.name} / {title}
              </p>
              <h1 className="mt-0.5 text-lg font-bold text-slate-900">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 transition hover:border-slate-300 md:flex"
            >
              <Search size={17} /> Qidirish{" "}
              <kbd className="rounded border bg-slate-50 px-1 text-[10px]">
                ⌘ K
              </kbd>
            </button>
            <button
              aria-label="Qidirish"
              onClick={() => setCommandOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 md:hidden"
            >
              <Search size={20} />
            </button>

            <NotificationsPopover />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-0.5 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4f947f] sm:pr-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e0b19d] text-xs font-bold text-[#623a2a]">
                  {user ? initials(user.name) : "—"}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold text-slate-700">
                    {user?.name ?? "Foydalanuvchi"}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {user ? ROLE_LABELS[user.role] : ""}
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  className="hidden text-slate-400 sm:block"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block">{user?.name}</span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-400">
                    {user?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2">
                  <Link to="/users">
                    <User size={15} /> Foydalanuvchilar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2">
                  <Link to="/branches">
                    <Building2 size={15} /> Filiallar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  <LogOut size={15} /> Tizimdan chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {/* POS sahifasi o'z layout ni o'zi boshqaradi — padding olib tashlanadi */}
        <main className={
          location.pathname === "/pos"
            ? "overflow-hidden"
            : "mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9"
        }>
          <Outlet />
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
