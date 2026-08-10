import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import { PermissionModule, UserRole } from "@shared/api";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Finance from "./pages/Finance";
import HR from "./pages/HR";
import Warehouse from "./pages/Warehouse";
import WarehouseDetail from "./pages/WarehouseDetail";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import POS from "./pages/POS";
import CRM from "./pages/CRM";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Invoices from "./pages/Invoices";
import ProfessionalAttendance from "./pages/ProfessionalAttendance";
import Payroll from "./pages/Payroll";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Branches from "./pages/Branches";
import AuditLog from "./pages/AuditLog";
import Debts from "./pages/Debts";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30 soniya — sahifalar orasida qayta so'rov ketmasin
      retry: 1,               // Tarmoq xatosida 1 marta qayta urining
      retryDelay: 1000,
    },
  },
});

/** Sessiya tekshirilayotganda ko'rsatiladigan oraliq holat. */
function AuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f8f7]">
      <Loader2 size={28} className="animate-spin text-[#2c8069]" />
      <span className="sr-only">Yuklanmoqda</span>
    </div>
  );
}

/** Kirmagan foydalanuvchini login sahifasiga yo'naltiradi. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoading />;
  
  if (!user) {
    // Qaysi sahifaga kirmoqchi bo'lganini eslab qolamiz — kirgach o'sha yerga qaytadi.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * Sahifani modul ruxsati bo'yicha himoyalaydi.
 * Foydalanuvchi rolida modul ko'rish huquqi bo'lmasa, unga ochiq birinchi
 * sahifaga yo'naltiriladi (URL orqali to'g'ridan-to'g'ri kirishni ham bloklaydi).
 */
function M({
  m: module,
  children,
}: {
  m: PermissionModule;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (user && !hasPermission(user.role, module, "view")) {
    return <Navigate to={firstAllowedPath(user.role)} replace />;
  }
  return <>{children}</>;
}

/** Rol ochadigan birinchi sahifa yo'li. */
function firstAllowedPath(role: UserRole): string {
  const order: [PermissionModule, string][] = [
    ["dashboard", "/"],
    ["sales", "/pos"],
    ["crm", "/orders"],
    ["warehouse", "/warehouse"],
    ["finance", "/finance"],
    ["hr", "/hr"],
    ["reports", "/reports"],
    ["users", "/users"],
    ["audit", "/audit"],
  ];
  for (const [module, path] of order) {
    if (hasPermission(role, module, "view")) return path;
  }
  return "/login";
}

/** Allaqachon kirgan foydalanuvchi login sahifasini ko'rmasligi kerak. */
function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <RedirectIfAuthenticated>
          <Login />
        </RedirectIfAuthenticated>
      }
    />

    {/*
      Barcha ichki sahifalar bitta himoyalangan layout ostida — shu sababli
      sahifa almashganda sidebar qayta yaratilmaydi va skroll holati saqlanadi.
    */}
    <Route
      element={
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      }
    >
      <Route index element={<Index />} />
      <Route path="finance" element={<M m="finance"><Finance /></M>} />
      <Route path="hr" element={<M m="hr"><HR /></M>} />
      <Route path="warehouse" element={<M m="warehouse"><Warehouse /></M>} />
      <Route path="warehouse/:warehouseId" element={<M m="warehouse"><WarehouseDetail /></M>} />
      <Route path="products" element={<M m="warehouse"><Products /></M>} />
      <Route path="sales" element={<M m="sales"><Sales /></M>} />
      <Route path="pos" element={<M m="sales"><POS /></M>} />
      <Route path="crm" element={<M m="crm"><CRM /></M>} />
      <Route path="orders" element={<M m="crm"><Orders /></M>} />
      <Route path="customers" element={<M m="crm"><Customers /></M>} />
      <Route path="suppliers" element={<M m="warehouse"><Suppliers /></M>} />
      <Route path="purchases" element={<M m="warehouse"><Purchases /></M>} />
      <Route path="invoices" element={<M m="crm"><Invoices /></M>} />
      <Route path="debts" element={<M m="crm"><Debts /></M>} />
      <Route path="payments" element={<M m="crm"><Payments /></M>} />
      <Route path="attendance" element={<M m="hr"><ProfessionalAttendance /></M>} />
      <Route path="payroll" element={<M m="hr"><Payroll /></M>} />
      <Route path="users" element={<M m="users"><Users /></M>} />
      <Route path="audit" element={<M m="audit"><AuditLog /></M>} />
      <Route path="reports" element={<M m="reports"><Reports /></M>} />
      <Route path="branches" element={<Branches />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SpeedInsights />
      {/*
        v7 xatti-harakatiga oldindan o'tamiz: holat yangilanishlari
        `startTransition` ichida bo'ladi va splat route'lardagi nisbiy
        yo'llar v7 qoidasi bo'yicha hisoblanadi.
      */}
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
