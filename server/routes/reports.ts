import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, ReportSummary } from "@shared/api";
import { reportSummary, todayISO } from "../data/metrics";

/** Davr berilmasa joriy yilning boshidan bugungacha olinadi. */
const periodSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(`${new Date().getFullYear()}-01-01`),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(todayISO()),
});

export const getReportSummary: RequestHandler = (req, res) => {
  const { from, to } = periodSchema.parse(req.query);

  // Chalkash davr berilsa sanalarni almashtiramiz — bo'sh hisobot chiqmasin.
  const [start, end] = from <= to ? [from, to] : [to, from];

  const response: ApiResponse<ReportSummary> = {
    success: true,
    data: reportSummary(start, end),
  };
  res.json(response);
};

/** Yig'ma hisobotni CSV holida yuklab beradi. */
export const exportReport: RequestHandler = (req, res) => {
  const { from, to } = periodSchema.parse(req.query);
  const [start, end] = from <= to ? [from, to] : [to, from];
  const summary = reportSummary(start, end);

  const escape = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const lines: string[] = [
    [escape("Hisobot davri"), escape(`${start} — ${end}`)].join(","),
    "",
    [escape("Ko'rsatkich"), escape("Qiymat")].join(","),
    [escape("Jami daromad"), escape(summary.totalIncome)].join(","),
    [escape("Jami xarajat"), escape(summary.totalExpense)].join(","),
    [escape("Sof foyda"), escape(summary.netProfit)].join(","),
    [escape("Rentabellik, %"), escape(summary.margin)].join(","),
    [escape("Buyurtmalar soni"), escape(summary.ordersCount)].join(","),
    [escape("Buyurtmalar qiymati"), escape(summary.ordersValue)].join(","),
    [escape("Xaridlar qiymati"), escape(summary.purchasesValue)].join(","),
    [escape("Yangi mijozlar"), escape(summary.newCustomers)].join(","),
    "",
    [escape("Kategoriya"), escape("Daromad"), escape("Xarajat")].join(","),
    ...summary.byCategory.map((row) =>
      [escape(row.label), escape(row.income), escape(row.expense)].join(","),
    ),
    "",
    [escape("Mahsulot"), escape("Miqdor"), escape("Summa")].join(","),
    ...summary.topProducts.map((row) =>
      [escape(row.label), escape(row.count), escape(row.value)].join(","),
    ),
  ];

  const filename = `hisobot-${start}_${end}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // BOM — Excel UTF-8 ni to'g'ri o'qishi uchun.
  res.send("﻿" + lines.join("\r\n"));
};
