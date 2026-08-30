'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3.5', className)}>
      {(title || description) && (
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          {title && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function FormGrid({
  cols = 2,
  children,
  className,
}: {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function FormField({
  label,
  required = false,
  error,
  helpText,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-rose-500 font-bold">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
      {helpText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{helpText}</p>
      )}
    </div>
  );
}
