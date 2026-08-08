import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Payroll, PayrollStats } from "@shared/api";
import {
  active,
  employees,
  logActivity,
  nextId,
  payrolls,
  softRemove,
} from "../data/store";
import { computePayroll, payrollStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  paramId,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const PAYROLL_STATUSES = ["draft", "approved", "paid"] as const;

/** Joriy oy "YYYY-MM" ko'rinishida. */
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const querySchema = paginationSchema.extend({
  period: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(PAYROLL_STATUSES).optional().catch(undefined),
});

export const getPayrollStats: RequestHandler = (req, res) => {
  const period = typeof req.query.period === "string" ? req.query.period : undefined;
  const response: ApiResponse<PayrollStats> = {
    success: true,
    data: payrollStats(period),
  };
  res.json(response);
};

export const getPayrolls: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(payrolls)
    .filter((p) => {
      if (
        search &&
        !p.employeeName.toLowerCase().includes(search) &&
        !p.department.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (query.period && p.period !== query.period) return false;
      if (query.department && p.department !== query.department) return false;
      if (query.status && p.status !== query.status) return false;
      return true;
    })
    .sort((a, b) => b.period.localeCompare(a.period) || a.employeeName.localeCompare(b.employeeName));

  res.json(paginate(filtered, query.page, query.limit));
};

/** Mavjud hisob davrlari — filtr ro'yxati uchun. */
export const getPayrollPeriods: RequestHandler = (_req, res) => {
  const periods = [...new Set(active(payrolls).map((p) => p.period))].sort((a, b) =>
    b.localeCompare(a),
  );
  // Joriy oy hali hisoblanmagan bo'lsa ham ro'yxatda turishi kerak.
  const current = currentPeriod();
  if (!periods.includes(current)) periods.unshift(current);
  res.json({ success: true, data: periods });
};

const calculateSchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "davr YYYY-MM ko'rinishida bo'lishi kerak")
    .optional(),
  employeeId: z.string().trim().optional(),
});

/**
 * Ish haqini hisoblaydi. Har bir faol xodim uchun (yoki bittasi uchun) davomatga
 * asoslanib qiymatlarni chiqaradi. Shu davr uchun avval hisoblangan yozuv bo'lsa,
 * u qayta yozilmaydi — takroriy hisoblash dublikat yaratmaydi.
 */
export const calculatePayroll: RequestHandler = (req, res) => {
  const parsed = calculateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const period = parsed.data.period ?? currentPeriod();

  let targets = active(employees);
  if (parsed.data.employeeId) {
    targets = targets.filter((e) => e.id === parsed.data.employeeId);
    if (targets.length === 0) return sendNotFound(res, "Xodim topilmadi");
  }

  const created: Payroll[] = [];
  let skipped = 0;

  for (const employee of targets) {
    const exists = active(payrolls).some(
      (p) => p.employeeId === employee.id && p.period === period,
    );
    if (exists) {
      skipped++;
      continue;
    }

    const computed = computePayroll(employee, period);
    const record: Payroll = {
      ...computed,
      id: nextId(),
      status: "draft",
      createdDate: new Date().toISOString().split("T")[0],
      note: "",
    };
    payrolls.unshift(record);
    created.push(record);
  }

  if (created.length > 0) {
    logActivity({
      action: "Ish haqi hisoblandi",
      details: `${period} · ${created.length} ta xodim`,
      icon: "WalletCards",
    });
  }

  const message =
    created.length === 0
      ? "Bu davr uchun barcha xodimlarga ish haqi allaqachon hisoblangan"
      : `${created.length} ta xodim uchun ish haqi hisoblandi${
          skipped > 0 ? ` (${skipped} tasi allaqachon mavjud)` : ""
        }`;

  const response: ApiResponse<Payroll[]> = { success: true, data: created, message };
  res.status(201).json(response);
};

const updateSchema = z.object({
  bonus: z.coerce.number().min(0, "bonus manfiy bo'lishi mumkin emas").optional(),
  penalty: z.coerce.number().min(0, "jarima manfiy bo'lishi mumkin emas").optional(),
  status: z.enum(PAYROLL_STATUSES).optional(),
  note: z.string().trim().optional(),
});

/**
 * Ish haqini yangilaydi. Bonus yoki jarima o'zgarsa, soliq va yakuniy summa
 * qayta hisoblanadi. To'langan yozuvni tahrirlab bo'lmaydi (moliyaviy yaxlitlik).
 */
export const updatePayroll: RequestHandler = (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const payroll = payrolls.find((p) => p.id === paramId(req) && !p.deletedAt);
  if (!payroll) return sendNotFound(res, "Ish haqi yozuvi topilmadi");

  if (payroll.status === "paid" && parsed.data.status !== "paid") {
    return res.status(409).json({
      success: false,
      message: "To'langan ish haqini o'zgartirib bo'lmaydi",
    });
  }

  // Bonus/jarima o'zgarsa, xodimning joriy maoshidan qayta hisoblaymiz.
  if (parsed.data.bonus !== undefined || parsed.data.penalty !== undefined) {
    const employee = active(employees).find((e) => e.id === payroll.employeeId);
    const recomputed = computePayroll(
      {
        id: payroll.employeeId,
        name: payroll.employeeName,
        department: payroll.department,
        salary: employee?.salary ?? payroll.baseSalary,
      },
      payroll.period,
      {
        bonus: parsed.data.bonus ?? payroll.bonus,
        penalty: parsed.data.penalty ?? payroll.penalty,
      },
    );
    payroll.bonus = recomputed.bonus;
    payroll.penalty = recomputed.penalty;
    payroll.tax = recomputed.tax;
    payroll.netSalary = recomputed.netSalary;
  }

  if (parsed.data.status) payroll.status = parsed.data.status;
  if (parsed.data.note !== undefined) payroll.note = parsed.data.note;

  logActivity({
    action:
      parsed.data.status === "paid"
        ? "Ish haqi to'landi"
        : "Ish haqi yangilandi",
    details: `${payroll.employeeName} · ${payroll.period}`,
    icon: parsed.data.status === "paid" ? "WalletCards" : "PenLine",
  });

  const response: ApiResponse<Payroll> = {
    success: true,
    data: payroll,
    message: "Ish haqi yangilandi",
  };
  res.json(response);
};

export const deletePayroll: RequestHandler = (req, res) => {
  const payroll = payrolls.find((p) => p.id === paramId(req) && !p.deletedAt);
  if (!payroll) return sendNotFound(res, "Ish haqi yozuvi topilmadi");

  if (payroll.status === "paid") {
    return res.status(409).json({
      success: false,
      message: "To'langan ish haqini o'chirib bo'lmaydi",
    });
  }

  softRemove(payrolls, paramId(req));
  logActivity({
    action: "Ish haqi o'chirildi",
    details: `${payroll.employeeName} · ${payroll.period}`,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Ish haqi yozuvi o'chirildi",
  };
  res.json(response);
};
