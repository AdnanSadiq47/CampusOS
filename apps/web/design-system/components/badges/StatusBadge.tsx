'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';

export type StatusVariant =
  | 'Active'
  | 'Inactive'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Draft'
  | 'Archived'
  | 'Suspended';

export interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  active: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  inactive: {
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  approved: {
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  draft: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  archived: {
    bg: 'bg-slate-100 dark:bg-slate-900',
    text: 'text-slate-500 dark:text-slate-500',
    border: 'border-slate-300 dark:border-slate-800',
    dot: 'bg-slate-400',
  },
  suspended: {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

const DEFAULT_CONFIG = {
  bg: 'bg-slate-100 dark:bg-slate-850',
  text: 'text-slate-600 dark:text-slate-400',
  border: 'border-slate-200 dark:border-slate-700',
  dot: 'bg-slate-400',
};

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const key = (status || 'inactive').toLowerCase();
  const conf = STATUS_CONFIG[key] || DEFAULT_CONFIG;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        conf.bg,
        conf.text,
        conf.border,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', conf.dot)} />}
      <span>{status}</span>
    </span>
  );
}
