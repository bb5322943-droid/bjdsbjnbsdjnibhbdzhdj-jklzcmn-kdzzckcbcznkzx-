import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, CRMStats, Deal, FunnelStage } from "@shared/api";
import { active, deals, logActivity, nextId, softRemove } from "../data/store";
import { crmBreakdown, crmStats, dealFunnel } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  paramId,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const DEAL_STATUSES = [
  "new_lead",
  "negotiation",
  "proposal",
  "closed_won",
  "closed_lost",
] as const;

const dealSchema = z.object({
  clientName: z.string().trim().min(1, "mijoz nomi kiritilishi shart"),
  value: z.coerce.number().positive("bitim summasi noldan katta bo'lishi kerak"),
  description: z.string().trim().catch(""),
  expectedCloseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  assignedTo: z.string().trim().min(1, "mas'ul xodim tanlanishi shart"),
  status: z.enum(DEAL_STATUSES).optional(),
});

const querySchema = paginationSchema.extend({
  status: z.enum(DEAL_STATUSES).optional().catch(undefined),
  assignedTo: z.string().optional(),
});

export const getCRMStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<CRMStats> = { success: true, data: crmStats() };
  res.json(response);
};

/** Top mijozlar, mas'ul kesimi, konversiya va yaqin/muddati o'tgan bitimlar. */
export const getCRMBreakdown: RequestHandler = (_req, res) => {
  res.json({ success: true, data: crmBreakdown() });
};

/** Savdo voronkasi bosqichlari bo'yicha taqsimot. */
export const getDealFunnel: RequestHandler = (_req, res) => {
  const response: ApiResponse<FunnelStage[]> = {
    success: true,
    data: dealFunnel(),
  };
  res.json(response);
};

export const getDeals: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(deals).filter((d) => {
    if (
      search &&
      !d.clientName.toLowerCase().includes(search) &&
      !d.description.toLowerCase().includes(search) &&
      !d.assignedTo.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (query.status && d.status !== query.status) return false;
    if (query.assignedTo && d.assignedTo !== query.assignedTo) return false;
    return true;
  });

  res.json(paginate(filtered, query.page, query.limit));
};

export const createDeal: RequestHandler = (req, res) => {
  const parsed = dealSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const newDeal: Deal = {
    id: nextId(),
    clientName: parsed.data.clientName,
    status: parsed.data.status ?? "new_lead",
    value: parsed.data.value,
    description: parsed.data.description,
    createdDate: new Date().toISOString().split("T")[0],
    expectedCloseDate: parsed.data.expectedCloseDate,
    assignedTo: parsed.data.assignedTo,
  };

  deals.unshift(newDeal);
  logActivity({
    action: "Yangi bitim yaratildi",
    details: `${newDeal.clientName} · ${newDeal.value.toLocaleString("uz-UZ")} so'm`,
    icon: "Handshake",
  });

  const response: ApiResponse<Deal> = {
    success: true,
    data: newDeal,
    message: "Bitim muvaffaqiyatli yaratildi",
  };
  res.status(201).json(response);
};

export const updateDeal: RequestHandler = (req, res) => {
  const parsed = dealSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const deal = deals.find((d) => d.id === req.params.id && !d.deletedAt);
  if (!deal) return sendNotFound(res, "Bitim topilmadi");

  const previousStatus = deal.status;
  Object.assign(deal, parsed.data);

  // Bitim yopilgani — voronkadagi eng muhim hodisa, jurnalda alohida ko'rsatiladi.
  if (previousStatus !== deal.status && deal.status === "closed_won") {
    logActivity({
      action: "Bitim muvaffaqiyatli yopildi",
      details: `${deal.clientName} · ${deal.value.toLocaleString("uz-UZ")} so'm`,
      icon: "Handshake",
    });
  } else {
    logActivity({
      action: "Bitim yangilandi",
      details: deal.clientName,
      icon: "PenLine",
    });
  }

  const response: ApiResponse<Deal> = {
    success: true,
    data: deal,
    message: "Bitim ma'lumotlari yangilandi",
  };
  res.json(response);
};

export const deleteDeal: RequestHandler = (req, res) => {
  const removed = softRemove(deals, paramId(req));
  if (!removed) return sendNotFound(res, "Bitim topilmadi");

  logActivity({
    action: "Bitim o'chirildi",
    details: removed.clientName,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Bitim o'chirildi",
  };
  res.json(response);
};
