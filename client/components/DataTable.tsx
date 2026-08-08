import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  cell: (item: T) => ReactNode;
  align?: "left" | "right";
  /** Tor ekranlarda yashiriladigan ikkinchi darajali ustunlar uchun. */
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (item: T) => string;
  isLoading?: boolean;
  emptyText?: string;
  minWidth?: number;
}

/**
 * Barcha modullardagi ro'yxatlar uchun umumiy jadval:
 * yuklanish skeleti, bo'sh holat va gorizontal scroll bitta joyda hal qilingan.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyText = "Ma'lumot topilmadi.",
  minWidth = 720,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="inline-block min-w-full align-middle">
        <table className="w-full border-separate border-spacing-0 text-left" style={{ minWidth }}>
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[.08em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={cn(
                    "px-4 sm:px-6 py-3.5 font-semibold border-b border-slate-200 whitespace-nowrap",
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading
              ? Array.from({ length: 5 }, (_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-slate-100">
                    {columns.map((column) => (
                      <td
                        key={column.header}
                        className={cn("px-4 sm:px-6 py-4", column.className)}
                      >
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((item, rowIndex) => (
                  <tr 
                    key={rowKey(item)} 
                    className="animate-slide-up border-b border-slate-100 last:border-b-0 opacity-0 transition-all duration-150 hover:bg-slate-50 hover:shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                    style={{ animationDelay: `${rowIndex * 30}ms`, animationFillMode: 'forwards' }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.header}
                        className={cn(
                          "px-4 sm:px-6 py-4 align-middle",
                          column.align === "right" && "text-right",
                          column.className,
                        )}
                      >
                        {column.cell(item)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && rows.length === 0 && (
        <p className="p-10 text-center text-sm text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

interface CardGridProps<T> {
  rows: T[];
  rowKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  isLoading?: boolean;
  emptyText?: string;
}

/**
 * Jadvalning kartochka muqobili — bir xil ma'lumotni panjara ko'rinishida beradi.
 * Yuklanish skeleti va bo'sh holat jadval bilan bir xil.
 */
export function CardGrid<T>({
  rows,
  rowKey,
  renderCard,
  isLoading = false,
  emptyText = "Ma'lumot topilmadi.",
}: CardGridProps<T>) {
  if (isLoading) {
    return (
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="p-10 text-center text-sm text-slate-400">{emptyText}</p>
    );
  }

  return (
    <div className="stagger-children grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
      {rows.map((item) => (
        <div key={rowKey(item)}>{renderCard(item)}</div>
      ))}
    </div>
  );
}

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  /** "Jami 12 ta tranzaksiya" dagi ot — har bir modul o'zinikini beradi. */
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  page,
  pages,
  total,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
      <span>
        Jami {total} ta {itemLabel}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            Oldingi
          </button>
          <span className="px-2 tabular-nums text-slate-500">
            {page} / {pages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}
