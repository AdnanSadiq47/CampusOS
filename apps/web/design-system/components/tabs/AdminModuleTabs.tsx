'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@campus-os/ui-kit';

export interface AdminTabItem {
  id?: string;
  label: string;
  href: string;
  icon?: React.ReactNode | string;
  count?: number;
  active?: boolean;
  soon?: boolean;
  disabled?: boolean;
}

export interface AdminModuleTabsProps {
  tabs: AdminTabItem[];
  className?: string;
}

export function AdminModuleTabs({ tabs, className }: AdminModuleTabsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto no-scrollbar',
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.active;
        const isDisabled = tab.disabled;

        return (
          <Link
            key={tab.id || idx}
            href={isDisabled ? '#' : tab.href}
            aria-disabled={isDisabled}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap select-none',
              isActive
                ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60',
              isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            {tab.icon && (
              <span className="text-sm">
                {typeof tab.icon === 'string' ? tab.icon : tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
            {tab.soon && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
