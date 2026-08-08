import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiResponse, LoginResponse, User } from "@shared/api";

const TOKEN_KEY = "orbis.token";

/**
 * Sessiya tokeni modul darajasida ham saqlanadi, chunki `fetchApi` (React
 * komponenti emas) uni har bir so'rovda sarlavhaga qo'shishi kerak.
 */
let currentToken: string | null =
  typeof localStorage === "undefined" ? null : localStorage.getItem(TOKEN_KEY);

export function getToken(): string | null {
  return currentToken;
}

function setToken(token: string | null): void {
  currentToken = token;
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Sessiya yaroqsiz bo'lganda (401) chaqiriladigan hodisa.
 * `fetchApi` React kontekstiga kira olmaydi, shuning uchun bog'lanish shu orqali.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {};
let isHandlingUnauthorized = false;

export function handleUnauthorized(): void {
  // Bir vaqtda faqat bir marta clearSession chaqirilishi uchun
  if (isHandlingUnauthorized) return;
  isHandlingUnauthorized = true;
  
  onUnauthorized();
  
  // Reset after a short delay to allow for navigation
  setTimeout(() => {
    isHandlingUnauthorized = false;
  }, 1000);
}

interface AuthContextValue {
  user: User | null;
  /** Boshlang'ich sessiya tekshiruvi tugaganini bildiradi. */
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    // Oldingi foydalanuvchining keshlangan ma'lumotlari qolib ketmasin.
    queryClient.clear();
  }, [queryClient]);

  // 401 kelganda avtomatik chiqish — sessiya muddati tugaganda ham ishlaydi.
  useEffect(() => {
    onUnauthorized = clearSession;
    return () => {
      onUnauthorized = () => {};
    };
  }, [clearSession]);

  // Sahifa yangilanganda saqlangan token bo'yicha foydalanuvchini tiklaymiz.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          // 401 — token yaroqsiz, retry qilish mantiqsiz
          throw new Error("Sessiya yaroqsiz");
        }
        
        const body: ApiResponse<User> = await response.json();
        if (!cancelled && body.success && body.data) {
          setUser(body.data);
        } else if (!cancelled) {
          clearSession();
        }
      } catch (error) {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async (login: string, password: string) => {
      // Content-Type sifatida `text/plain` — Vercel serverless runtime
      // `application/json` body'ni funksiyaga yetkazishdan oldin buzadi
      // (400 Bad Request). `text/plain` da body xom holicha serverga yetadi,
      // server (Express) o'zi JSON.parse qiladi. Bir xil sabab `use-api.ts` da.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ login, password }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? "Kirishda xatolik yuz berdi");
      }

      const { token, user: loggedIn } = (body as ApiResponse<LoginResponse>).data;
      
      // React Query keshini tozalash - eski ma'lumotlar qolmasligi uchun
      queryClient.clear();
      
      // Token va foydalanuvchini o'rnatish
      setToken(token);
      setUser(loggedIn);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    const token = getToken();
    // Serverdagi sessiyani ham yopamiz, lekin javobni kutmaymiz.
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth faqat AuthProvider ichida ishlatiladi");
  }
  return context;
}
