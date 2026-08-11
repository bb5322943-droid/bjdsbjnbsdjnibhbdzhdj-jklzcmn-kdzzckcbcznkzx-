import {
  Eye,
  LayoutGrid,
  List,
  LucideIcon,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Sahifa sarlavhasi va o'ng tomondagi amallar. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="mb-7 flex flex-col justify-between gap-4 animate-fade-in sm:flex-row sm:items-end">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </section>
  );
}

/** To'q yashil asosiy ko'rsatkich kartochkasi. */
export function HeroStat({
  icon: Icon,
  value,
  label,
  isLoading,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  isLoading?: boolean;
}) {
  return (
    <article className="hover-lift rounded-xl border border-slate-200 bg-[#173f38] p-5 text-white">
      <Icon size={21} className="text-[#a4d6b5]" />
      {isLoading ? (
        <Skeleton className="mt-5 h-9 w-24 bg-white/20" />
      ) : (
        <p className="mt-5 text-3xl font-bold">{value}</p>
      )}
      <p className="mt-1 text-sm text-[#bdd1ca]">{label}</p>
    </article>
  );
}

/** Oq fondagi oddiy ko'rsatkich kartochkasi. */
export function StatTile({
  value,
  label,
  tone = "default",
  isLoading,
}: {
  value: string;
  label: string;
  tone?: "default" | "warning";
  isLoading?: boolean;
}) {
  return (
    <article className="hover-lift rounded-xl border border-slate-200 bg-white p-5">
      {isLoading ? (
        <Skeleton className="h-9 w-20" />
      ) : (
        <p
          className={cn(
            "text-3xl font-bold",
            tone === "warning" ? "text-[#cb8535]" : "text-slate-900",
          )}
        >
          {value}
        </p>
      )}
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </article>
  );
}

/** Tozalash tugmasi bilan qidiruv maydoni. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Qidirish",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-8 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#4f947f] focus:shadow-[0_0_0_3px_rgba(23,63,56,0.08)] sm:w-56"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Qidiruvni tozalash"
          className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export type ViewMode = "table" | "cards";

/** Jadval va kartochka ko'rinishi orasida almashtiruvchi tugma. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  const options: { value: ViewMode; icon: LucideIcon; label: string }[] = [
    { value: "table", icon: List, label: "Jadval ko'rinishi" },
    { value: "cards", icon: LayoutGrid, label: "Kartochka ko'rinishi" },
  ];

  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-label={label}
          aria-pressed={view === value}
          className={cn(
            "grid h-8 w-9 place-items-center rounded-md transition",
            view === value
              ? "bg-[#e8f1ee] text-[#175b4b]"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          <Icon size={17} />
        </button>
      ))}
    </div>
  );
}

/** Jadval qatoridagi "..." menyusi: tahrirlash va o'chirish. */
export function RowActions({
  onView,
  onReturn,
  onEdit,
  onDelete,
  returnText = "Qaytarish",
  editText = "Tahrirlash",
  deleteText = "O'chirish",
  children,
}: {
  /** Berilsa — menyuga "Batafsil ko'rish" bandi qo'shiladi. */
  onView?: () => void;
  /** Berilsa — menyuga "Qaytarish" bandi qo'shiladi. */
  onReturn?: () => void;
  /** Berilmasa — "Tahrirlash" bandi ko'rsatilmaydi (masalan, to'langan hujjat). */
  onEdit?: () => void;
  /** Berilmasa — "O'chirish" bandi ko'rsatilmaydi. */
  onDelete?: () => void;
  returnText?: string;
  editText?: string;
  deleteText?: string;
  /** Modulga xos qo'shimcha amallar. */
  children?: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Amallar"
        className="rounded-md p-1.5 text-slate-400 outline-none transition-all duration-150 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#4f947f] active:scale-[0.95]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onView && (
          <DropdownMenuItem onSelect={onView} className="gap-2">
            <Eye size={15} /> Batafsil ko'rish
          </DropdownMenuItem>
        )}
        {children}
        {onReturn && (
          <DropdownMenuItem onSelect={onReturn} className="gap-2">
            <RotateCcw size={15} /> {returnText}
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onSelect={onEdit} className="gap-2">
            <Pencil size={15} /> {editText}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onSelect={onDelete}
            className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <Trash2 size={15} /> {deleteText}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Kartochkadagi "ko'rish" tugmasi — menyuni ochmasdan tafsilotga o'tadi. */
export function ViewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Batafsil ko'rish"
      title="Batafsil ko'rish"
      className="rounded-md p-1.5 text-slate-400 outline-none transition hover:bg-slate-100 hover:text-[#2c8069] focus-visible:ring-2 focus-visible:ring-[#4f947f]"
    >
      <Eye size={17} />
    </button>
  );
}

/** So'rov muvaffaqiyatsiz bo'lganda ko'rsatiladigan holat. */
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-10 text-center animate-fade-in">
      <p className="text-sm font-semibold text-slate-600">
        Ma'lumotni yuklab bo'lmadi
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
        {message ?? "Serverga ulanishda muammo yuz berdi."}
      </p>
      <Button variant="outline" onClick={onRetry} className="mt-4 active:scale-[0.97]">
        Qayta urinish
      </Button>
    </div>
  );
}

/** Ranglangan holat yorlig'i. */
export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "red" | "blue" | "violet" | "slate";
}) {
  const tones = {
    green: "bg-[#e9f5ef] text-[#2d7d64]",
    amber: "bg-[#fff4e6] text-[#b5761f]",
    red: "bg-[#fdeceb] text-[#b8443a]",
    blue: "bg-[#eaf2fb] text-[#3f77ad]",
    violet: "bg-[#efedfb] text-[#6259ae]",
    slate: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}
