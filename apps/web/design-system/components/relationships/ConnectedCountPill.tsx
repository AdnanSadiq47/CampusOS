'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';
import { Link2 } from 'lucide-react';

export interface ConnectedCountPillProps {
  count: number;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ConnectedCountPill({
  count = 0,
  label,
  onClick,
  disabled = false,
  className,
}: ConnectedCountPillProps) {
  const isClickable = !!onClick && !disabled;

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={disabled || !isClickable}
      title={label || `Click to view ${count} connected units`}
      className={cn(
        'inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs transition-colors border select-none',
        count > 0
          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800',
        isClickable && 'hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer shadow-xs',
        !isClickable && 'cursor-default',
        className
      )}
    >
      <Link2 className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
      <span>{count}</span>
    </button>
  );
}
