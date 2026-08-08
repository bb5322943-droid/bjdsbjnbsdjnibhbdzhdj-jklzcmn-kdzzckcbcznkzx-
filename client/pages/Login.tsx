import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Command,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { branding } from "@/config/branding";

/** Chap ustundagi qisqa qiymat taklifi. */
const HIGHLIGHTS = [
  {
    icon: BarChart3,
    title: "Yagona boshqaruv paneli",
    text: "Moliya, savdo va ombor ko'rsatkichlari bir ekranda.",
  },
  {
    icon: Warehouse,
    title: "Real vaqtdagi ombor",
    text: "Buyurtma tasdiqlansa qoldiq avtomatik yangilanadi.",
  },
  {
    icon: ShieldCheck,
    title: "Rolga asoslangan kirish",
    text: "Har bir xodim faqat o'z bo'limini ko'radi.",
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Kirishdan oldin qaysi sahifaga borilmoqchi bo'lgan bo'lsa, o'shanga qaytariladi. */
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!loginValue.trim() || !password) {
      setError("Login va parolni kiriting");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginValue.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirishda xatolik yuz berdi");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#f7f8f7] lg:grid-cols-2">
      {/* Chap ustun — brend va qiymat taklifi (faqat katta ekranlarda) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#173f38] p-10 text-white lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5"
        />

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 overflow-hidden">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} className="h-11 w-11 object-contain" />
            ) : (
              <Command size={22} strokeWidth={2.5} />
            )}
          </span>
          <span>
            <strong className="block text-lg leading-5">{branding.name}</strong>
            <span className="text-xs font-medium tracking-wide text-[#a4d6b5]">
              {branding.tagline}
            </span>
          </span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight xl:text-4xl">
            Butun biznesingiz bitta tizimda
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#b6ccc5]">
            Buyurtmadan omborgacha, ish haqidan hisobotgacha — barcha jarayonlar
            o'zaro bog'langan holda boshqariladi.
          </p>

          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-[#a4d6b5]">
                  <Icon size={19} />
                </span>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-0.5 text-sm text-[#b6ccc5]">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[#8fada5]">
          © {new Date().getFullYear()} {branding.fullName} Platform
        </p>
      </aside>

      {/* O'ng ustun — kirish formasi */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          {/* Mobil ekranda brend shu yerda ko'rinadi */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span
              className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm overflow-hidden"
              style={{ backgroundColor: branding.logoUrl ? 'transparent' : branding.colors.primary }}
            >
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.name} className="h-11 w-11 object-contain" />
              ) : (
                <Command size={22} strokeWidth={2.5} />
              )}
            </span>
            <span>
              <strong className="block text-lg leading-5 text-slate-900">{branding.name}</strong>
              <span className="text-xs font-medium tracking-wide text-slate-400">
                {branding.tagline}
              </span>
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tizimga kirish
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Davom etish uchun hisob ma'lumotlaringizni kiriting.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <div className="relative">
                <User
                  size={17}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  id="login"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={loginValue}
                  onChange={(event) => {
                    setLoginValue(event.target.value);
                    setError("");
                  }}
                  placeholder="foydalanuvchi_nomi"
                  aria-invalid={Boolean(error)}
                  className={cn("pl-10", error && "border-red-400 focus-visible:ring-red-400")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Lock
                  size={17}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  aria-invalid={Boolean(error)}
                  className={cn(
                    "pl-10 pr-10",
                    error && "border-red-400 focus-visible:ring-red-400",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full bg-[#173f38] text-[15px] hover:bg-[#0f312b]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Tekshirilmoqda...
                </>
              ) : (
                "Kirish"
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
