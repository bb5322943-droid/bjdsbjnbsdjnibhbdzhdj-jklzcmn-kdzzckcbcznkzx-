import { RequestHandler } from "express";
import { z } from "zod";
import { Activity, Alert, ApiResponse, DashboardStats, TrendPoint } from "@shared/api";
import { activities, deals, products } from "../data/store";
import { dashboardStats, isLowStock, revenueTrend } from "../data/metrics";

export const getDashboardStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<DashboardStats> = {
    success: true,
    data: dashboardStats(),
  };
  res.json(response);
};

/** Grafik uchun joriy oy bo'yicha kunlik kirim/chiqim. */
export const getRevenueTrend: RequestHandler = (_req, res) => {
  const response: ApiResponse<TrendPoint[]> = {
    success: true,
    data: revenueTrend(),
  };
  res.json(response);
};

export const getRecentActivities: RequestHandler = (req, res) => {
  const limit = z.coerce.number().int().min(1).max(50).catch(10).parse(req.query.limit);

  const response: ApiResponse<Activity[]> = {
    success: true,
    data: activities.slice(0, limit),
  };
  res.json(response);
};

/**
 * Ogohlantirishlar statik emas — jonli ma'lumotdan hisoblanadi.
 * Muammo bartaraf etilsa, ogohlantirish ro'yxatdan o'zi yo'qoladi.
 */
export const getAlerts: RequestHandler = (_req, res) => {
  const alerts: Alert[] = [];

  const lowStock = products.filter(isLowStock);
  if (lowStock.length > 0) {
    alerts.push({
      id: "low-stock",
      type: "warning",
      title: "Tanqis mahsulotlar",
      description: `${lowStock.length} mahsulot minimal qoldiq chegarasidan past.`,
      actionText: "Omborni ochish",
      actionUrl: "/warehouse",
    });
  }

  // Yopilish sanasi o'tib ketgan, lekin hali yopilmagan bitimlar.
  const today = new Date().toISOString().split("T")[0];
  const overdue = deals.filter(
    (d) =>
      d.expectedCloseDate < today &&
      d.status !== "closed_won" &&
      d.status !== "closed_lost",
  );
  if (overdue.length > 0) {
    alerts.push({
      id: "overdue-deals",
      type: "warning",
      title: "Muddati o'tgan bitimlar",
      description: `${overdue.length} ta bitimning kutilayotgan yopilish sanasi o'tib ketdi.`,
      actionText: "Savdo bo'limiga o'tish",
      actionUrl: "/crm",
    });
  }

  // Yaqin 7 kun ichida yopilishi kutilayotgan bitimlar.
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const closingSoon = deals.filter(
    (d) =>
      d.expectedCloseDate >= today &&
      d.expectedCloseDate <= weekAhead &&
      (d.status === "proposal" || d.status === "negotiation"),
  );
  if (closingSoon.length > 0) {
    alerts.push({
      id: "closing-soon",
      type: "info",
      title: "Yopilish arafasidagi bitimlar",
      description: `${closingSoon.length} ta bitim shu hafta yopilishi kutilmoqda.`,
      actionText: "Bitimlarni ko'rish",
      actionUrl: "/crm",
    });
  }

  const response: ApiResponse<Alert[]> = { success: true, data: alerts };
  res.json(response);
};
