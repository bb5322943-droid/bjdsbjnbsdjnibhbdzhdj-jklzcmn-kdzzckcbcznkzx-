import { RequestHandler } from "express";
import { z } from "zod";
import {
  ApiResponse,
  AttendanceRecord,
  AttendanceStats,
  Employee,
  LeaveRequest,
  LeaveStats,
} from "@shared/api";
import {
  attendance,
  employees,
  leaveRequests,
  logActivity,
  nextId,
  removeById,
} from "../data/store";
import { attendanceStats, leaveStats, todayISO } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  paramId,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const ATTENDANCE_STATUSES = ["present", "late", "remote", "absent", "leave"] as const;
const LEAVE_TYPES = ["vacation", "sick", "unpaid", "personal"] as const;
const LEAVE_STATUSES = ["pending", "approved", "rejected"] as const;

// ------------------------------------------------------------------ Davomat

const attendanceQuerySchema = paginationSchema.extend({
  employeeId: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(ATTENDANCE_STATUSES).optional().catch(undefined),
  date: z.string().optional(),
});

export const getAttendanceStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<AttendanceStats> = {
    success: true,
    data: attendanceStats(),
  };
  res.json(response);
};

export const getAttendance: RequestHandler = (req, res) => {
  const query = attendanceQuerySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = attendance.filter((record) => {
    if (
      search &&
      !record.employeeName.toLowerCase().includes(search) &&
      !record.department.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (query.employeeId && record.employeeId !== query.employeeId) return false;
    if (query.department && record.department !== query.department) return false;
    if (query.status && record.status !== query.status) return false;
    if (query.date && record.date !== query.date) return false;
    return true;
  });

  res.json(paginate(filtered, query.page, query.limit));
};

const markSchema = z.object({
  employeeId: z.string().trim().min(1, "xodim tanlanishi shart"),
  status: z.enum(ATTENDANCE_STATUSES),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD ko'rinishida bo'lishi kerak")
    .optional(),
  checkIn: z.string().trim().catch(""),
  checkOut: z.string().trim().catch(""),
  note: z.string().trim().catch(""),
});

/** Davomatni belgilash — o'sha kunda yozuv bo'lsa yangilanadi, bo'lmasa yaratiladi. */
export const markAttendance: RequestHandler = (req, res) => {
  const parsed = markSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const employee = employees.find((e) => e.id === parsed.data.employeeId);
  if (!employee) return sendNotFound(res, "Xodim topilmadi");

  const date = parsed.data.date ?? todayISO();
  const worked = ["present", "late", "remote"].includes(parsed.data.status);

  const existing = attendance.find(
    (record) => record.employeeId === employee.id && record.date === date,
  );

  const payload = {
    status: parsed.data.status,
    checkIn: worked ? parsed.data.checkIn || "09:00" : "",
    checkOut: worked ? parsed.data.checkOut || "18:00" : "",
    hours: worked ? 8 : 0,
    note: parsed.data.note,
  };

  let record: AttendanceRecord;
  if (existing) {
    Object.assign(existing, payload);
    record = existing;
  } else {
    record = {
      id: nextId(),
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      date,
      ...payload,
    };
    attendance.unshift(record);
  }

  logActivity({
    action: "Davomat belgilandi",
    details: `${employee.name} · ${date}`,
    icon: "UsersRound",
  });

  const response: ApiResponse<AttendanceRecord> = {
    success: true,
    data: record,
    message: "Davomat saqlandi",
  };
  res.json(response);
};

/** Barcha davomat yozuvlarini o'chirish */
export const clearAllAttendance: RequestHandler = (_req, res) => {
  const count = attendance.length;
  attendance.length = 0; // Massivni tozalash
  
  logActivity({
    action: "Barcha davomat yozuvlari o'chirildi",
    details: `${count} ta yozuv tozalandi`,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: `${count} ta davomat yozuvi o'chirildi`,
  };
  res.json(response);
};

// ------------------------------------------------------------------- Ta'til

const leaveQuerySchema = paginationSchema.extend({
  employeeId: z.string().optional(),
  type: z.enum(LEAVE_TYPES).optional().catch(undefined),
  status: z.enum(LEAVE_STATUSES).optional().catch(undefined),
});

const leaveSchema = z.object({
  employeeId: z.string().trim().min(1, "xodim tanlanishi shart"),
  type: z.enum(LEAVE_TYPES),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "boshlanish sanasi YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "tugash sanasi YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  reason: z.string().trim().catch(""),
  status: z.enum(LEAVE_STATUSES).optional(),
});

/** Ikki sana orasidagi kunlar soni (ikkala chekka ham hisobga olinadi). */
function daysBetween(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Tasdiqlangan ta'til bugungi kunni qamrasa, xodim holati mos ravishda o'zgaradi.
 * Aks holda u yana "ishda" holatiga qaytadi.
 */
function syncEmployeeStatus(employee: Employee): void {
  const today = todayISO();
  const active = leaveRequests.find(
    (request) =>
      request.employeeId === employee.id &&
      request.status === "approved" &&
      request.startDate <= today &&
      request.endDate >= today,
  );

  if (!active) {
    employee.status = "active";
    return;
  }
  employee.status = active.type === "sick" ? "sick_leave" : "vacation";
}

export const getLeaveStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<LeaveStats> = { success: true, data: leaveStats() };
  res.json(response);
};

export const getLeaveRequests: RequestHandler = (req, res) => {
  const query = leaveQuerySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = leaveRequests
    .filter((request) => {
      if (
        search &&
        !request.employeeName.toLowerCase().includes(search) &&
        !request.reason.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (query.employeeId && request.employeeId !== query.employeeId) return false;
      if (query.type && request.type !== query.type) return false;
      if (query.status && request.status !== query.status) return false;
      return true;
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  res.json(paginate(filtered, query.page, query.limit));
};

export const createLeaveRequest: RequestHandler = (req, res) => {
  const parsed = leaveSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const employee = employees.find((e) => e.id === parsed.data.employeeId);
  if (!employee) return sendNotFound(res, "Xodim topilmadi");

  if (parsed.data.endDate < parsed.data.startDate) {
    return res
      .status(400)
      .json({ success: false, message: "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas" });
  }

  const newRequest: LeaveRequest = {
    id: nextId(),
    employeeId: employee.id,
    employeeName: employee.name,
    type: parsed.data.type,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    days: daysBetween(parsed.data.startDate, parsed.data.endDate),
    status: parsed.data.status ?? "pending",
    reason: parsed.data.reason,
    requestedDate: todayISO(),
  };

  leaveRequests.unshift(newRequest);
  if (newRequest.status === "approved") syncEmployeeStatus(employee);

  logActivity({
    action: "Ta'til so'rovi yuborildi",
    details: `${employee.name} · ${newRequest.days} kun`,
    icon: "CalendarDays",
  });

  const response: ApiResponse<LeaveRequest> = {
    success: true,
    data: newRequest,
    message: "Ta'til so'rovi yaratildi",
  };
  res.status(201).json(response);
};

export const updateLeaveRequest: RequestHandler = (req, res) => {
  const parsed = leaveSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const request = leaveRequests.find((r) => r.id === paramId(req));
  if (!request) return sendNotFound(res, "Ta'til so'rovi topilmadi");

  const previousStatus = request.status;
  Object.assign(request, parsed.data);

  if (parsed.data.startDate || parsed.data.endDate) {
    if (request.endDate < request.startDate) {
      return res
        .status(400)
        .json({ success: false, message: "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas" });
    }
    request.days = daysBetween(request.startDate, request.endDate);
  }

  // Tasdiqlash yoki rad etish xodimning joriy holatiga ta'sir qiladi.
  const employee = employees.find((e) => e.id === request.employeeId);
  if (employee) syncEmployeeStatus(employee);

  const statusChanged = previousStatus !== request.status;
  logActivity({
    action:
      statusChanged && request.status === "approved"
        ? "Ta'til so'rovi tasdiqlandi"
        : statusChanged && request.status === "rejected"
          ? "Ta'til so'rovi rad etildi"
          : "Ta'til so'rovi yangilandi",
    details: `${request.employeeName} · ${request.days} kun`,
    icon: "CalendarDays",
  });

  const response: ApiResponse<LeaveRequest> = {
    success: true,
    data: request,
    message: "Ta'til so'rovi yangilandi",
  };
  res.json(response);
};

export const deleteLeaveRequest: RequestHandler = (req, res) => {
  const removed = removeById(leaveRequests, paramId(req));
  if (!removed) return sendNotFound(res, "Ta'til so'rovi topilmadi");

  // So'rov o'chirilgach xodim holati qayta hisoblanadi.
  const employee = employees.find((e) => e.id === removed.employeeId);
  if (employee) syncEmployeeStatus(employee);

  logActivity({
    action: "Ta'til so'rovi o'chirildi",
    details: removed.employeeName,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Ta'til so'rovi o'chirildi",
  };
  res.json(response);
};
