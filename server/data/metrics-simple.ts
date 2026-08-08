import { ReportSummary, ProfitLossRow } from "@shared/api";
import { transactions } from "./store";

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function reportSummary(from: string, to: string): ReportSummary {
  const allTransactions = transactions; // Massiv, funksiya emas
  
  // Daromad va xarajatlarni hisoblash
  let totalIncome = 0;
  let totalExpense = 0;
  
  for (const t of allTransactions) {
    if (t.date >= from && t.date <= to) {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    }
  }

  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome === 0 ? 0 : Math.round((netProfit / totalIncome) * 100);

  // Kategoriya kesimi
  const categoryMap = new Map<string, { income: number; expense: number }>();
  
  for (const t of allTransactions) {
    if (t.date >= from && t.date <= to) {
      const existing = categoryMap.get(t.category) || { income: 0, expense: 0 };
      if (t.type === "income") {
        existing.income += t.amount;
      } else {
        existing.expense += t.amount;
      }
      categoryMap.set(t.category, existing);
    }
  }

  const byCategory: ProfitLossRow[] = Array.from(categoryMap.entries())
    .map(([label, data]) => ({
      label,
      income: data.income,
      expense: data.expense,
    }))
    .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

  return {
    period: { from, to },
    totalIncome,
    totalExpense,
    netProfit,
    margin,
    ordersCount: 5, // Oddiy qiymat
    ordersValue: 50000000, // 50 mln
    purchasesValue: 30000000, // 30 mln 
    newCustomers: 3,
    byCategory,
    monthly: [], // Bo'sh
    topProducts: [
      { label: "Samsung Galaxy S24", count: 15, value: 187500000 },
      { label: "iPhone 15", count: 12, value: 226800000 },
      { label: "MacBook Air M3", count: 8, value: 198400000 },
    ],
    topCustomers: [
      { label: "Texno Park do'koni", count: 2, value: 25000000 },
      { label: "Smart Electronics", count: 1, value: 18900000 },
      { label: "Digital Life", count: 2, value: 12500000 },
    ],
  };
}