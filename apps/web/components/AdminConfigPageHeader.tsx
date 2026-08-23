'use client';

import React from 'react';

interface AdminConfigPageHeaderProps {
  section?: string;
  group?: string;
  title: string;
  description: string;
  actionButtonText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
}

export function AdminConfigPageHeader({
  section = 'Administration Configuration',
  group = 'Organization Setup',
  title,
  description,
  actionButtonText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  children,
}: AdminConfigPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <span>{section}</span>
          <span>/</span>
          <span>{group}</span>
          <span>/</span>
          <span>{title}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {children}

        {secondaryActionText && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-all cursor-pointer shadow-sm"
          >
            {secondaryActionText}
          </button>
        )}

        {actionButtonText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>{actionButtonText}</span>
          </button>
        )}
      </div>
    </div>
  );
}
