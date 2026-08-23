'use client';

import React, { useState } from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (val: string) => void;
}

interface ResponsiveFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onReset?: () => void;
  resultsCount?: number;
  totalCount?: number;
  children?: React.ReactNode;
}

export function ResponsiveFilterToolbar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onReset,
  resultsCount,
  totalCount,
  children,
}: ResponsiveFilterToolbarProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Count how many non-default filters are active
  const activeFilterCount = filters.filter(
    (f) => f.value && f.value !== 'ALL' && f.value !== ''
  ).length;

  return (
    <div className="space-y-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span>🔍</span>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[38px]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Desktop Filter Dropdowns */}
        <div className="hidden lg:flex items-center gap-2 flex-wrap">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium whitespace-nowrap">{filter.label}:</span>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                aria-label={filter.label}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-h-[36px]"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {children}

          {onReset && (activeFilterCount > 0 || searchTerm) && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium transition-colors min-h-[36px]"
            >
              Reset
            </button>
          )}
        </div>

        {/* Mobile / Tablet Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between gap-2">
          {resultsCount !== undefined && totalCount !== undefined && (
            <span className="text-xs text-slate-500 font-medium">
              Showing {resultsCount} of {totalCount}
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {filters.length > 0 && (
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors min-h-[38px] ${
                  activeFilterCount > 0 || isMobileFiltersOpen
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>⚙️</span>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            {children}
          </div>
        </div>
      </div>

      {/* Mobile Expandable Filter Panel */}
      {isMobileFiltersOpen && filters.length > 0 && (
        <div className="lg:hidden pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  aria-label={filter.label}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[38px]"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
              >
                Reset All Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="ml-auto px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
