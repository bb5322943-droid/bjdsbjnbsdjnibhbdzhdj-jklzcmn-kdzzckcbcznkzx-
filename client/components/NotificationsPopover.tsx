import { useEffect, useState } from "react";
import { Bell, CircleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAlerts } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "orbis:seen-alerts";

/** O'qilgan ogohlantirish ID'larini brauzerda saqlaydi. */
function loadSeen(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    // Buzilgan yoki mavjud bo'lmagan qiymat — bo'sh ro'yxatdan boshlaymiz.
    return [];
  }
}

function saveSeen(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Xotira to'lgan yoki bloklangan bo'lsa — o'qilgan holat shu sessiyada qoladi.
  }
}

/** Header'dagi qo'ng'iroq belgisi — jonli ogohlantirishlarni ko'rsatadi. */
export function NotificationsPopover() {
  const { data } = useAlerts();
  const alerts = data?.data ?? [];

  const [seen, setSeen] = useState<string[]>(loadSeen);

  const activeIds = alerts.map((alert) => alert.id);
  // O'qilgan ogohlantirish ro'yxatdan yashiriladi — foydalanuvchi faqat yangilarini ko'radi.
  const unread = alerts.filter((alert) => !seen.includes(alert.id));

  /**
   * Muammo bartaraf etilib, keyin qaytadan paydo bo'lsa uni yana yangi deb
   * ko'rsatishimiz kerak — shuning uchun endi mavjud bo'lmagan ID'larni tozalaymiz.
   */
  useEffect(() => {
    if (alerts.length === 0) return;
    const pruned = seen.filter((id) => activeIds.includes(id));
    if (pruned.length !== seen.length) {
      setSeen(pruned);
      saveSeen(pruned);
    }
    // Faqat ogohlantirishlar ro'yxati o'zgarganda ishlaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds.join("|")]);

  /** Barcha joriy ogohlantirishlarni o'qilgan deb belgilaydi. */
  const markAllRead = () => {
    const next = [...new Set([...seen, ...activeIds])];
    setSeen(next);
    saveSeen(next);
  };

  return (
    <Popover>
      <PopoverTrigger
        aria-label={
          unread.length > 0
            ? `Bildirishnomalar, ${unread.length} ta o'qilmagan`
            : "Bildirishnomalar"
        }
        className="relative rounded-lg p-2 text-slate-500 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4f947f]"
      >
        <Bell size={20} />
        {unread.length > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e8745a] ring-2 ring-white" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-slate-800">Bildirishnomalar</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {unread.length === 0
                ? "Yangi bildirishnoma yo'q"
                : `${unread.length} ta yangi ogohlantirish`}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="shrink-0 whitespace-nowrap text-xs font-bold text-[#21735e] transition hover:text-[#175b4b]"
            >
              Hammasini o'qish
            </button>
          )}
        </div>
        {unread.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            {alerts.length === 0
              ? "Barcha ko'rsatkichlar me'yorda."
              : "Barcha ogohlantirishlar o'qildi."}
          </p>
        ) : (
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {unread.map((alert) => (
              <Link
                key={alert.id}
                to={alert.actionUrl}
                className="flex gap-3 px-4 py-3 transition hover:bg-slate-50"
              >
                <CircleAlert
                  size={18}
                  className={cn(
                    "mt-0.5 shrink-0",
                    alert.type === "warning"
                      ? "text-[#d9953e]"
                      : "text-[#7165c5]",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {alert.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
