import { Skeleton } from "@/components/ui/skeleton";

/**
 * Professional chart skeleton loaders for different chart types
 */

export function AreaChartSkeleton() {
  return (
    <div className="h-[280px] animate-fade-in">
      {/* Enhanced grid lines skeleton */}
      <div className="space-y-[58px] h-[240px] relative">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      
      {/* Professional chart area skeleton */}
      <div className="relative -mt-[240px] h-[240px] overflow-hidden">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            {/* Animated gradient */}
            <linearGradient id="skeleton-shimmer" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.6">
                <animate attributeName="stop-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            
            {/* Area gradient skeleton */}
            <linearGradient id="area-skeleton-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Multiple animated paths for realistic chart appearance */}
          <path
            d="M0,85 Q15,65 30,75 T60,60 T100,45"
            fill="url(#area-skeleton-gradient)"
            stroke="url(#skeleton-shimmer)"
            strokeWidth="2.5"
            className="drop-shadow-sm"
          />
          
          <path
            d="M0,75 Q20,85 40,70 T80,80 T100,65"
            fill="none"
            stroke="url(#skeleton-shimmer)"
            strokeWidth="2"
            opacity="0.7"
          />
          
          {/* Animated data points */}
          {[5, 20, 35, 50, 65, 80, 95].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={80 - Math.sin(i * 0.5) * 20}
              r="3"
              fill="#e2e8f0"
              className="animate-pulse"
              style={{ 
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
          
          {/* Shimmer effect overlay */}
          <rect x="0" y="0" width="100" height="100" fill="url(#skeleton-shimmer)" opacity="0.2">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-100,0;100,0;-100,0"
              dur="3s"
              repeatCount="indefinite"
            />
          </rect>
        </svg>
      </div>
      
      {/* Enhanced X-axis labels skeleton */}
      <div className="flex justify-between pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-8 bg-slate-200 rounded animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      
      {/* Y-axis value skeleton */}
      <div className="absolute top-0 right-0">
        <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function DonutChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8 animate-fade-in">
      {/* Enhanced donut skeleton */}
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 100 100" className="-rotate-90">
          <defs>
            <linearGradient id="donut-shimmer" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc">
                <animate attributeName="stop-color" values="#f8fafc;#e2e8f0;#f8fafc" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#e2e8f0">
                <animate attributeName="stop-color" values="#e2e8f0;#cbd5e1;#e2e8f0" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#f8fafc">
                <animate attributeName="stop-color" values="#f8fafc;#e2e8f0;#f8fafc" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="12"
            className="drop-shadow-sm"
          />
          
          {/* Animated segments */}
          {[0, 25, 60, 85].map((offset, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#donut-shimmer)"
              strokeWidth="12"
              strokeDasharray={`${20 + i * 8} 264`}
              strokeDashoffset={-offset}
              style={{ 
                animationDelay: `${i * 0.3}s`,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}
            >
              <animate
                attributeName="stroke-dashoffset"
                values={`${-offset};${-offset - 10};${-offset}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
        
        {/* Center content skeleton */}
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
          <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Enhanced legend skeleton */}
      <div className="w-full space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div 
              className="h-3 w-3 rounded-full bg-slate-200 animate-pulse shadow-sm"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
            <div 
              className="h-4 flex-1 bg-slate-200 rounded animate-pulse"
              style={{ 
                width: `${60 + Math.random() * 40}%`,
                animationDelay: `${i * 0.15}s`
              }}
            />
            <div 
              className="h-4 w-10 bg-slate-200 rounded animate-pulse"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-5 animate-fade-in">
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div 
              className="h-4 bg-slate-200 rounded animate-pulse"
              style={{ 
                width: `${60 + Math.random() * 40}%`,
                animationDelay: `${i * 0.15}s`
              }}
            />
            <div 
              className="h-4 w-16 bg-slate-200 rounded animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div 
              className="h-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse shadow-sm"
              style={{ 
                width: `${30 + Math.random() * 50}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.5s'
              }}
            />
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12"
              style={{ 
                width: '30px',
                animation: 'shimmer 2s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 animate-fade-in hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300">
      <div className="mb-5 flex items-start justify-between">
        <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse shadow-sm" />
        <div className="text-right space-y-2">
          <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
          <div 
            className="h-3 w-20 bg-slate-200 rounded animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <div 
          className="h-4 w-24 bg-slate-200 rounded animate-pulse"
          style={{ animationDelay: '0.1s' }}
        />
        <div className="flex items-baseline gap-2">
          <div 
            className="h-8 w-32 bg-slate-200 rounded animate-pulse"
            style={{ animationDelay: '0.3s' }}
          />
          <div 
            className="h-4 w-12 bg-slate-200 rounded animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>

      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ animation: 'shimmer 2s ease-in-out infinite' }} />
    </div>
  );
}