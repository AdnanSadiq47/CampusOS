import React from 'react';

export interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'neutral' | 'negative';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

export function StatCard({
  label,
  title,
  value,
  icon,
  subtitle,
  trend,
  trendType = 'positive',
  variant = 'default',
  className,
}: StatCardProps) {
  const displayTitle = title || label;
  const displayTrend = trend || subtitle;

  const getBadgeStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${className || ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {displayTitle}
        </span>
        <div className={`p-2 rounded-xl border flex items-center justify-center text-sm ${getBadgeStyle()}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {displayTrend && (
          <span className={`text-[11px] font-semibold truncate ${
            trendType === 'positive'
              ? 'text-emerald-600 dark:text-emerald-400'
              : trendType === 'negative'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {displayTrend}
          </span>
        )}
      </div>
    </div>
  );
}

