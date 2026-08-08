import { ReactNode, useState } from "react";
import { DonutChartSkeleton, BarListSkeleton } from "@/components/ChartSkeleton";
import { cn } from "@/lib/utils";
import { CATEGORICAL } from "@/lib/chart-colors";
import { formatNumber } from "@/lib/format";

/** Kartochka o'ramchasi — sarlavha va ixtiyoriy o'ng burchak elementi bilan. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group rounded-xl border border-slate-200 bg-white p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="animate-fade-in">
        {children}
      </div>
    </article>
  );
}

export interface BarRow {
  label: string;
  /** Bar uzunligini belgilaydigan qiymat. */
  value: number;
  /** O'ngda ko'rsatiladigan matn (formatlangan). Berilmasa `value` ko'rsatiladi. */
  display?: string;
  /** Yorliq ostidagi qo'shimcha izoh. */
  hint?: string;
}

/**
 * Gorizontal bar ro'yxati — "top mijozlar", "bo'limlar", "kategoriyalar" kabi
 * taqsimotlar uchun. Bar eng katta qiymatga nisbatan masshtablanadi.
 */
export function BarList({
  rows,
  isLoading,
  color = CATEGORICAL[0],
  emptyText = "Ma'lumot yo'q.",
}: {
  rows: BarRow[];
  isLoading?: boolean;
  color?: string;
  emptyText?: string;
}) {
  if (isLoading) {
    return <BarListSkeleton rows={rows.length > 0 ? rows.length : 5} />;
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">{emptyText}</p>
        <p className="text-xs text-slate-400">Ma'lumotlar mavjud bo'lganda ko'rsatiladi</p>
      </div>
    );
  }

  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div 
          key={row.label}
          className="group animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
              {row.label}
            </span>
            <span className="shrink-0 font-bold text-slate-800 tabular-nums group-hover:text-slate-900 transition-colors">
              {row.display ?? formatNumber(row.value)}
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{
                width: `${(row.value / max) * 100}%`,
                backgroundColor: color,
                boxShadow: `0 1px 3px ${color}20`,
              }}
            />
            {/* Shine effect on hover */}
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ width: '20px', animation: 'shine 1.5s ease-in-out infinite' }}
            />
          </div>
          {row.hint && (
            <p className="mt-1.5 text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
              {row.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Donut diagramma (SVG) — bir nechta bo'lakning nisbatini ko'rsatadi.
 * Kichik bo'lganda ham o'qiladigan: markazda jami, yonida izohli ro'yxat.
 */
export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  isLoading,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
  isLoading?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);

  if (isLoading) return <DonutChartSkeleton />;

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19a9 9 0 1 0-5.8-1.5m5.8 1.5-1.5-1.5m1.5 1.5V10a5 5 0 0 1 10 0l-5 5-5 5z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">Kategoriya ma'lumotlari yo'q</p>
        <p className="text-xs text-slate-400">Xarajatlar qo'shilganda taqsimot ko'rsatiladi</p>
      </div>
    );
  }

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const GAP = 1.5; // Professional spacing between segments

  let offset = 0;
  const arcs = segments
    .filter((segment) => segment.value > 0)
    .map((segment, index) => {
      const fraction = total === 0 ? 0 : segment.value / total;
      const length = fraction * circumference;
      const arc = {
        ...segment,
        dash: Math.max(length - GAP, length * 0.4),
        offset,
        percent: Math.round(fraction * 100),
        index,
      };
      offset += length;
      return arc;
    });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8 animate-fade-in">
      <div className="relative shrink-0 group">
        <svg
          width="140"
          height="140"
          viewBox="0 0 100 100"
          className="-rotate-90 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Background ring with subtle gradient */}
          <defs>
            <linearGradient id="bg-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
          </defs>
          
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#bg-gradient)"
            strokeWidth="12"
            className="drop-shadow-sm"
          />
          
          {/* Enhanced arcs with shadow effects */}
          {arcs.map((arc) => (
            <g key={arc.label}>
              {/* Shadow layer */}
              <circle
                cx="50"
                cy="50.5"
                r={radius}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="12"
                strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                strokeDashoffset={-arc.offset}
                className="blur-sm"
              />
              {/* Main arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth="12"
                strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                strokeDashoffset={-arc.offset}
                onMouseEnter={() => setHover(arc.label)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
                style={{
                  opacity: hover && hover !== arc.label ? 0.4 : 1,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: hover === arc.label ? "brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.1))" : "none",
                  strokeWidth: hover === arc.label ? "14" : "12",
                }}
              />
            </g>
          ))}
        </svg>
        
        {/* Enhanced center content */}
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
            {centerValue && (
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs font-medium text-slate-500 mt-1">{centerLabel}</span>
            )}
          </div>
        )}

        {/* Hover tooltip */}
        {hover && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-fade-in">
            <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
              {arcs.find(arc => arc.label === hover)?.percent}%
            </div>
          </div>
        )}
      </div>

      {/* Enhanced legend */}
      <div className="w-full space-y-3">
        {arcs.map((arc, index) => (
          <div
            key={arc.label}
            onMouseEnter={() => setHover(arc.label)}
            onMouseLeave={() => setHover(null)}
            className="group flex items-center gap-3 rounded-lg p-2 -m-2 transition-all duration-200 hover:bg-slate-50 cursor-pointer"
            style={{ 
              opacity: hover && hover !== arc.label ? 0.5 : 1,
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="relative">
              <span
                className="block h-3 w-3 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-110 shadow-sm"
                style={{ backgroundColor: arc.color }}
              />
              {hover === arc.label && (
                <span 
                  className="absolute inset-0 h-3 w-3 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: arc.color }}
                />
              )}
            </div>
            <span className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors flex-1">
              {arc.label}
            </span>
            <span className="shrink-0 font-bold tabular-nums text-slate-800 group-hover:text-slate-900 transition-colors text-sm">
              {arc.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
