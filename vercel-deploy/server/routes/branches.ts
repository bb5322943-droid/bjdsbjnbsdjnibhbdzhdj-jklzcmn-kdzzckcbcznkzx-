import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Branch, BranchStats } from "@shared/api";
import { active, branches, logActivity, nextId, softRemove } from "../data/store";
import {
  paginate,
  paginationSchema,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const branchSchema = z.object({
  name: z.string().trim().min(1, "filial nomi kiritilishi shart"),
  type: z.enum(["head_office", "branch"]).catch("branch"),
  region: z.string().trim().catch(""),
  address: z.string().trim().catch(""),
  phone: z.string().trim().catch(""),
  manager: z.string().trim().catch(""),
  note: z.string().trim().catch(""),
  status: z.enum(["active", "inactive"]).optional(),
});

const querySchema = paginationSchema.extend({
  type: z.enum(["head_office", "branch"]).optional().catch(undefined),
  region: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional().catch(undefined),
});

export const getBranchStats: RequestHandler = (_req, res) => {
  const list = active(branches);
  const stats: BranchStats = {
    totalBranches: list.length,
    activeBranches: list.filter((b) => b.status === "active").length,
    regions: new Set(list.map((b) => b.region).filter(Boolean)).size,
  };
  const response: ApiResponse<BranchStats> = { success: true, data: stats };
  res.json(response);
};

export const getBranches: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(branches).filter((b) => {
    if (
      search &&
      !b.name.toLowerCase().includes(search) &&
      !b.manager.toLowerCase().includes(search) &&
      !b.region.toLowerCase().includes(search) &&
      !b.phone.includes(search)
    ) {
      return false;
    }
    if (query.type && b.type !== query.type) return false;
    if (query.region && b.region !== query.region) return false;
    if (query.status && b.status !== query.status) return false;
    return true;
  });

  // Bosh ofis doim birinchi ko'rinsin.
  filtered.sort((a, b) => {
    if (a.type !== b.type) return a.type === "head_office" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  res.json(paginate(filtered, query.page, query.limit));
};

export const createBranch: RequestHandler = (req, res) => {
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  // Nom bo'yicha takrorlanishni oldini olamiz.
  if (active(branches).some((b) => b.name.toLowerCase() === parsed.data.name.toLowerCase())) {
    return res
      .status(409)
      .json({ success: false, message: "Bu nom bilan filial allaqachon mavjud" });
  }

  // Bosh ofis yagona bo'ladi — ikkinchisi qo'shilsa oddiy filialga aylantiriladi.
  const type =
    parsed.data.type === "head_office" &&
    active(branches).some((b) => b.type === "head_office")
      ? "branch"
      : parsed.data.type;

  const newBranch: Branch = {
    id: nextId(),
    name: parsed.data.name,
    type,
    region: parsed.data.region,
    address: parsed.data.address,
    phone: parsed.data.phone,
    manager: parsed.data.manager,
    status: parsed.data.status ?? "active",
    createdDate: new Date().toISOString().split("T")[0],
    note: parsed.data.note,
  };

  branches.unshift(newBranch);
  logActivity({
    action: "Yangi filial qo'shildi",
    details: newBranch.name,
    icon: "Building2",
  });

  const response: ApiResponse<Branch> = {
    success: true,
    data: newBranch,
    message: "Filial muvaffaqiyatli qo'shildi",
  };
  res.status(201).json(response);
};

export const updateBranch: RequestHandler = (req, res) => {
  const parsed = branchSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const branch = branches.find((b) => b.id === req.params.id && !b.deletedAt);
  if (!branch) return sendNotFound(res, "Filial topilmadi");

  // Bosh ofisga o'tkazish faqat boshqa bosh ofis bo'lmasa mumkin.
  if (
    parsed.data.type === "head_office" &&
    branch.type !== "head_office" &&
    active(branches).some((b) => b.type === "head_office")
  ) {
    return res
      .status(409)
      .json({ success: false, message: "Bosh ofis allaqachon mavjud" });
  }

  Object.assign(branch, parsed.data);

  logActivity({
    action: "Filial ma'lumotlari yangilandi",
    details: branch.name,
    icon: "PenLine",
  });

  const response: ApiResponse<Branch> = {
    success: true,
    data: branch,
    message: "Filial ma'lumotlari yangilandi",
  };
  res.json(response);
};

export const deleteBranch: RequestHandler = (req, res) => {
  const branch = branches.find((b) => b.id === req.params.id && !b.deletedAt);
  if (!branch) return sendNotFound(res, "Filial topilmadi");

  // Bosh ofis o'chirilmaydi — kompaniyaning markaziy joyi.
  if (branch.type === "head_office") {
    return res
      .status(409)
      .json({ success: false, message: "Bosh ofisni o'chirib bo'lmaydi" });
  }

  softRemove(branches, branch.id);
  logActivity({
    action: "Filial o'chirildi",
    details: branch.name,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Filial o'chirildi",
  };
  res.json(response);
};
