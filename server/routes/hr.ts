import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Employee, HRStats } from "@shared/api";
import { active, employees, logActivity, nextId, softRemove } from "../data/store";
import { hrBreakdown, hrStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  paramId,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const employeeSchema = z.object({
  name: z.string().trim().min(1, "F.I.Sh. kiritilishi shart"),
  position: z.string().trim().min(1, "lavozim kiritilishi shart"),
  department: z.string().trim().min(1).catch("Boshqa"),
  salary: z.coerce.number().min(0, "maosh manfiy bo'lishi mumkin emas").catch(0),
  email: z.string().trim().email("email formati noto'g'ri"),
  phone: z.string().trim().catch(""),
  status: z.enum(["active", "vacation", "sick_leave"]).optional(),
});

const querySchema = paginationSchema.extend({
  department: z.string().optional(),
  status: z.enum(["active", "vacation", "sick_leave"]).optional().catch(undefined),
});

export const getHRStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<HRStats> = { success: true, data: hrStats() };
  res.json(response);
};

/** Bo'lim bo'yicha xodim soni, maosh fondi va o'rtacha maosh. */
export const getHRBreakdown: RequestHandler = (_req, res) => {
  res.json({ success: true, data: hrBreakdown() });
};

export const getEmployees: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(employees).filter((e) => {
    if (
      search &&
      !e.name.toLowerCase().includes(search) &&
      !e.position.toLowerCase().includes(search) &&
      !e.department.toLowerCase().includes(search) &&
      !e.email.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (query.department && e.department !== query.department) return false;
    if (query.status && e.status !== query.status) return false;
    return true;
  });

  res.json(paginate(filtered, query.page, query.limit));
};

/** Mavjud bo'limlar ro'yxati — filtr uchun. */
export const getDepartments: RequestHandler = (_req, res) => {
  const departments = [...new Set(employees.map((e) => e.department))].sort();
  res.json({ success: true, data: departments });
};

export const createEmployee: RequestHandler = (req, res) => {
  const parsed = employeeSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  // Email bo'yicha takrorlanishni oldini olamiz — bu xodimning yagona identifikatori.
  if (active(employees).some((e) => e.email.toLowerCase() === parsed.data.email.toLowerCase())) {
    return res
      .status(409)
      .json({ success: false, message: "Bu email bilan xodim allaqachon mavjud" });
  }

  const newEmployee: Employee = {
    id: nextId(),
    name: parsed.data.name,
    position: parsed.data.position,
    department: parsed.data.department,
    status: parsed.data.status ?? "active",
    salary: parsed.data.salary,
    hireDate: new Date().toISOString().split("T")[0],
    email: parsed.data.email,
    phone: parsed.data.phone,
  };

  employees.unshift(newEmployee);
  logActivity({
    action: "Yangi xodim qo'shildi",
    details: `${newEmployee.name} · ${newEmployee.position}`,
    icon: "UserPlus",
  });

  const response: ApiResponse<Employee> = {
    success: true,
    data: newEmployee,
    message: "Xodim muvaffaqiyatli qo'shildi",
  };
  res.status(201).json(response);
};

export const updateEmployee: RequestHandler = (req, res) => {
  const parsed = employeeSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const employee = employees.find((e) => e.id === req.params.id && !e.deletedAt);
  if (!employee) return sendNotFound(res, "Xodim topilmadi");

  if (
    parsed.data.email &&
    active(employees).some(
      (e) => e.id !== employee.id && e.email.toLowerCase() === parsed.data.email!.toLowerCase(),
    )
  ) {
    return res
      .status(409)
      .json({ success: false, message: "Bu email boshqa xodimga biriktirilgan" });
  }

  Object.assign(employee, parsed.data);
  logActivity({
    action: "Xodim ma'lumotlari yangilandi",
    details: employee.name,
    icon: "PenLine",
  });

  const response: ApiResponse<Employee> = {
    success: true,
    data: employee,
    message: "Xodim ma'lumotlari yangilandi",
  };
  res.json(response);
};

export const deleteEmployee: RequestHandler = (req, res) => {
  const removed = softRemove(employees, paramId(req));
  if (!removed) return sendNotFound(res, "Xodim topilmadi");

  logActivity({
    action: "Xodim o'chirildi",
    details: removed.name,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Xodim o'chirildi",
  };
  res.json(response);
};
