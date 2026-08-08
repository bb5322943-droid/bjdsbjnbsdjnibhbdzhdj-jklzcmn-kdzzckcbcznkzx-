import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Customer, CustomerStats } from "@shared/api";
import {
  active,
  customers,
  deals,
  logActivity,
  nextId,
  orders,
  softRemove,
} from "../data/store";
import { customerStats } from "../data/metrics";
import {
  paginate,
  paginationSchema,
  sendNotFound,
  sendValidationError,
} from "../lib/http";

const customerSchema = z.object({
  name: z.string().trim().min(1, "mijoz nomi kiritilishi shart"),
  type: z.enum(["company", "individual"]).catch("company"),
  contactPerson: z.string().trim().catch(""),
  phone: z.string().trim().catch(""),
  email: z.string().trim().email("email formati noto'g'ri").or(z.literal("")).catch(""),
  region: z.string().trim().catch(""),
  address: z.string().trim().catch(""),
  note: z.string().trim().catch(""),
  status: z.enum(["active", "inactive"]).optional(),
});

const querySchema = paginationSchema.extend({
  type: z.enum(["company", "individual"]).optional().catch(undefined),
  region: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional().catch(undefined),
});

export const getCustomerStats: RequestHandler = (_req, res) => {
  const response: ApiResponse<CustomerStats> = { success: true, data: customerStats() };
  res.json(response);
};

export const getCustomers: RequestHandler = (req, res) => {
  const query = querySchema.parse(req.query);
  const search = query.search.toLowerCase();

  const filtered = active(customers).filter((c) => {
    if (
      search &&
      !c.name.toLowerCase().includes(search) &&
      !c.contactPerson.toLowerCase().includes(search) &&
      !c.email.toLowerCase().includes(search) &&
      !c.phone.includes(search)
    ) {
      return false;
    }
    if (query.type && c.type !== query.type) return false;
    if (query.region && c.region !== query.region) return false;
    if (query.status && c.status !== query.status) return false;
    return true;
  });

  res.json(paginate(filtered, query.page, query.limit));
};

/** Filtr ro'yxatlari uchun mavjud hududlar. */
export const getCustomerRegions: RequestHandler = (_req, res) => {
  const regions = [...new Set(customers.map((c) => c.region).filter(Boolean))].sort();
  res.json({ success: true, data: regions });
};

/** Bitta mijoz + unga bog'liq buyurtma va bitimlar tarixi. */
export const getCustomerDetail: RequestHandler = (req, res) => {
  const customer = customers.find((c) => c.id === req.params.id && !c.deletedAt);
  if (!customer) return sendNotFound(res, "Mijoz topilmadi");

  const customerOrders = active(orders)
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate));

  res.json({
    success: true,
    data: {
      customer,
      orders: customerOrders,
      deals: active(deals).filter((d) => d.clientName === customer.name),
      totalSpent: customerOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0),
    },
  });
};

export const createCustomer: RequestHandler = (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  // Nom bo'yicha takrorlanishni oldini olamiz — bitimlar mijozni nomi orqali topadi.
  if (active(customers).some((c) => c.name.toLowerCase() === parsed.data.name.toLowerCase())) {
    return res
      .status(409)
      .json({ success: false, message: "Bu nom bilan mijoz allaqachon mavjud" });
  }

  const newCustomer: Customer = {
    id: nextId(),
    name: parsed.data.name,
    type: parsed.data.type,
    contactPerson: parsed.data.contactPerson,
    phone: parsed.data.phone,
    email: parsed.data.email,
    region: parsed.data.region,
    address: parsed.data.address,
    status: parsed.data.status ?? "active",
    createdDate: new Date().toISOString().split("T")[0],
    note: parsed.data.note,
  };

  customers.unshift(newCustomer);
  logActivity({
    action: "Yangi mijoz qo'shildi",
    details: newCustomer.name,
    icon: "UserPlus",
  });

  const response: ApiResponse<Customer> = {
    success: true,
    data: newCustomer,
    message: "Mijoz muvaffaqiyatli qo'shildi",
  };
  res.status(201).json(response);
};

export const updateCustomer: RequestHandler = (req, res) => {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const customer = customers.find((c) => c.id === req.params.id && !c.deletedAt);
  if (!customer) return sendNotFound(res, "Mijoz topilmadi");

  const previousName = customer.name;
  Object.assign(customer, parsed.data);

  // Nom o'zgarsa, bog'liq hujjatlardagi nusxa ham yangilanishi kerak.
  if (parsed.data.name && parsed.data.name !== previousName) {
    orders
      .filter((o) => o.customerId === customer.id)
      .forEach((o) => {
        o.customerName = customer.name;
      });
    deals
      .filter((d) => d.clientName === previousName)
      .forEach((d) => {
        d.clientName = customer.name;
      });
  }

  logActivity({
    action: "Mijoz ma'lumotlari yangilandi",
    details: customer.name,
    icon: "PenLine",
  });

  const response: ApiResponse<Customer> = {
    success: true,
    data: customer,
    message: "Mijoz ma'lumotlari yangilandi",
  };
  res.json(response);
};

export const deleteCustomer: RequestHandler = (req, res) => {
  const customer = customers.find((c) => c.id === req.params.id && !c.deletedAt);
  if (!customer) return sendNotFound(res, "Mijoz topilmadi");

  // Buyurtmasi bor mijozni o'chirish hujjatlarni yetim qoldiradi — arxivlash tavsiya etiladi.
  const linkedOrders = active(orders).filter((o) => o.customerId === customer.id).length;
  if (linkedOrders > 0) {
    return res.status(409).json({
      success: false,
      message: `Bu mijozda ${linkedOrders} ta buyurtma bor. Avval buyurtmalarni o'chiring yoki mijozni arxivga o'tkazing.`,
    });
  }

  softRemove(customers, customer.id);
  logActivity({
    action: "Mijoz o'chirildi",
    details: customer.name,
    icon: "Trash2",
  });

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Mijoz o'chirildi",
  };
  res.json(response);
};
