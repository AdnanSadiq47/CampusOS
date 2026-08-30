'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';
import { AlertTriangle, CheckCircle2, Info, XCircle, Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'There are no records matching your current filter criteria.',
  icon,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'p-10 text-center flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 text-2xl shadow-inner">
        {icon || <Inbox className="w-6 h-6 stroke-1.5" />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const configs = {
    info: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
    },
    error: {
      bg: 'bg-rose-50/80 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-200',
      icon: <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
    },
  };

  const conf = configs[variant];

  return (
    <div
      className={cn(
        'p-3 rounded-xl border flex items-start gap-2.5 text-xs',
        conf.bg,
        conf.border,
        conf.text,
        className
      )}
    >
      {conf.icon}
      <div className="space-y-0.5 flex-1">
        {title && <div className="font-bold">{title}</div>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
