import { useState } from "react";
import { TrendPoint } from "@shared/api";
import { AreaChartSkeleton } from "@/components/ChartSkeleton";
import { formatNumber } from "@/lib/format";

/**
 * Oddiy va professional daromad/xarajat grafigi
 * Faqat 2 ta chiziq - yashil (daromad) va qizil (xarajat)
 */

const CHART_CONFIG = {
  incomeColor: '#10b981',      // yashil
  expenseColor: '#ef4444',     // qizil
  gridColor: 'rgba(148, 163, 184, 0.1)',
  textColor: '#64748b',
} as const;

export function RevenueChart({
  points,
  isLoading,
}: {
  points: TrendPoint[];
  isLoading?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [period, setPeriod] = useState<7 | 30 | 90>(7);

  if (isLoading) return <AreaChartSkeleton />;

  if (points.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-sm text-slate-500">Ma'lumotlar mavjud emas</p>
      </div>
    );
  }

  // Period bo'yicha filter qilish
  const filteredPoints = points.slice(-period);

  // Grafik o'lchamlari va masshtablash
  const maxIncome = Math.max(1, ...filteredPoints.map((p) => p.income));
  const maxExpense = Math.max(1, ...filteredPoints.map((p) => p.expense));
  const maxValue = Math.max(maxIncome, maxExpense);
  const chartMax = maxValue * 1.2; // 20% bo'sh joy
  
  const chartWidth = 100;
  const chartHeight = 100;
  const padding = { top: 10, bottom: 15, left: 0, right: 0 };
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Oddiy chiziq yasash
  const createPath = (dataKey: "income" | "expense") => {
    if (filteredPoints.length === 0) return "";

    return filteredPoints
      .map((point, index) => {
        const x = (index / Math.max(1, filteredPoints.length - 1)) * chartWidth;
        const y = padding.top + (1 - (point[dataKey] / chartMax)) * plotHeight;
        return index === 0 ? `M${x},${y}` : `L${x},${y}`;
      })
      .join(" ");
  };

  const incomePath = createPath("income");
  const expensePath = createPath("expense");

  const activePoint = hover !== null ? filteredPoints[hover] : null;

  // Million formatda ko'rsatish
  const formatMln = (value: number) => {
    const mln = (value / 1000000).toFixed(1);
    return `${mln} mln`;
  };

  return (
    <div className="w-full">
      {/* Sarlavha */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Savdo dinamikasi</h3>
          <p className="mt-1 text-sm text-slate-500">
            Tushum va sof foyda o'zgarishi
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <button 
            onClick={() => setPeriod(7)}
            className={`rounded-lg border px-3 py-2 transition-colors ${
              period === 7 
                ? 'border-slate-300 bg-slate-50 font-semibold' 
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            7 kun
          </button>
          <button 
            onClick={() => setPeriod(30)}
            className={`rounded-lg border px-3 py-2 transition-colors ${
              period === 30 
                ? 'border-slate-300 bg-slate-50 font-semibold' 
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            30 kun
          </button>
          <button 
            onClick={() => setPeriod(90)}
            className={`rounded-lg border px-3 py-2 transition-colors ${
              period === 90 
                ? 'border-slate-300 bg-slate-50 font-semibold' 
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            90 kun
          </button>
        </div>
      </div>

      {/* Grafik */}
      <div
        className="relative w-full"
        style={{ height: '280px' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid chiziqlari */}
        <div className="absolute inset-0">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute w-full border-t"
              style={{
                top: `${padding.top + (percent / 100) * plotHeight}%`,
                borderColor: CHART_CONFIG.gridColor,
              }}
            />
          ))}
        </div>

        {/* SVG grafik */}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full overflow-visible"
        >
          {/* Daromad chizig'i */}
          <path
            d={incomePath}
            fill="none"
            stroke={CHART_CONFIG.incomeColor}
            strokeWidth="0.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Xarajat chizig'i */}
          <path
            d={expensePath}
            fill="none"
            stroke={CHART_CONFIG.expenseColor}
            strokeWidth="0.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Nuqtalar hover qilganda */}
          {filteredPoints.map((point, index) => {
            const x = (index / Math.max(1, filteredPoints.length - 1)) * chartWidth;
            const incomeY = padding.top + (1 - (point.income / chartMax)) * plotHeight;
            const expenseY = padding.top + (1 - (point.expense / chartMax)) * plotHeight;
            const isActive = hover === index;
            
            return isActive ? (
              <g key={index}>
                <circle cx={x} cy={incomeY} r="2.5" fill={CHART_CONFIG.incomeColor} stroke="#fff" strokeWidth="1.5" />
                <circle cx={x} cy={expenseY} r="2.5" fill={CHART_CONFIG.expenseColor} stroke="#fff" strokeWidth="1.5" />
              </g>
            ) : null;
          })}

          {/* Hover chizig'i */}
          {hover !== null && (
            <line
              x1={(hover / Math.max(1, filteredPoints.length - 1)) * chartWidth}
              x2={(hover / Math.max(1, filteredPoints.length - 1)) * chartWidth}
              y1={padding.top}
              y2={chartHeight - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />
          )}

          {/* Hover zonalari */}
          {filteredPoints.map((_, index) => {
            const x = (index / Math.max(1, filteredPoints.length - 1)) * chartWidth;
            const prevX = index > 0 ? ((index - 1) / Math.max(1, filteredPoints.length - 1)) * chartWidth : 0;
            const nextX = index < filteredPoints.length - 1 ? ((index + 1) / Math.max(1, filteredPoints.length - 1)) * chartWidth : chartWidth;
            const zoneStart = Math.max(0, (x + prevX) / 2);
            const zoneEnd = Math.min(chartWidth, (x + nextX) / 2);
            
            return (
              <rect
                key={`zone-${index}`}
                x={zoneStart}
                y="0"
                width={zoneEnd - zoneStart}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHover(index)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {activePoint && (
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: `${Math.min(85, Math.max(15, (hover! / Math.max(1, filteredPoints.length - 1)) * 100))}%`,
              top: "20px",
            }}
          >
            <div className="relative -translate-x-1/2">
              <div className="rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                <div className="mb-2 text-center font-semibold">
                  {activePoint.label}-iyul
                </div>
                <div className="space-y-1 whitespace-nowrap">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHART_CONFIG.incomeColor }} />
                      Tushum
                    </span>
                    <span className="font-medium">{formatMln(activePoint.income)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHART_CONFIG.expenseColor }} />
                      Sof foyda
                    </span>
                    <span className="font-medium">{formatMln(activePoint.expense)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* X o'qi belgilari */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs text-slate-400">
          {filteredPoints.map((point, index) => {
            const day = parseInt(point.label);
            const showLabel = day === 1 || day === 7 || day === 13 || day === 19 || day === 25 || day === 31 || index === filteredPoints.length - 1;
            return showLabel ? (
              <span key={point.label}>{day}-iyl</span>
            ) : <span key={point.label} />;
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 flex justify-center gap-6 border-t border-slate-100 pt-4">
        <span className="flex items-center gap-2 text-sm text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHART_CONFIG.incomeColor }} />
          Tushum
        </span>
        <span className="flex items-center gap-2 text-sm text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHART_CONFIG.expenseColor }} />
          Sof foyda o'zgarishi
        </span>
      </div>
    </div>
  );
}
