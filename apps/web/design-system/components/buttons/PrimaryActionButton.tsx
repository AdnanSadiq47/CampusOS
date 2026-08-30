'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';
import { Plus, Loader2 } from 'lucide-react';

export type PrimaryActionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'outline'
  | 'ghost';

export type PrimaryActionButtonSize = 'sm' | 'md' | 'lg';

export interface PrimaryActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: PrimaryActionButtonVariant;
  size?: PrimaryActionButtonSize;
  icon?: React.ReactNode;
  showIcon?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<PrimaryActionButtonVariant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-200 dark:shadow-none border border-transparent',
  secondary:
    'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
  success:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-200 dark:shadow-none border border-transparent',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-200 dark:shadow-none border border-transparent',
  warning:
    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm border border-transparent',
  neutral:
    'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 border border-transparent',
  outline:
    'bg-transparent hover:bg-indigo-50 active:bg-indigo-100 text-indigo-600 border border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50',
  ghost:
    'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 border border-transparent',
};

const SIZE_CLASSES: Record<PrimaryActionButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-xs font-semibold gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm font-semibold gap-2.5 rounded-xl',
};

export const PrimaryActionButton = React.forwardRef<
  HTMLButtonElement,
  PrimaryActionButtonProps
>(
  (
    {
      label,
      variant = 'primary',
      size = 'md',
      icon,
      showIcon = true,
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : showIcon ? (
          icon || <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : null}
        <span>{label}</span>
      </button>
    );
  }
);

PrimaryActionButton.displayName = 'PrimaryActionButton';
