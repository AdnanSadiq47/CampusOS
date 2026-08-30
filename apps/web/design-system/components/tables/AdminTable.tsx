'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export type TableDensity = 'compact' | 'normal' | 'comfortable';

export interface AdminTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
}

export function AdminTable({
  density = 'normal',
  className,
  children,
  ...props
}: AdminTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className={cn(
            'w-full text-left border-collapse text-xs',
            density === 'compact' && '[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3',
            density === 'normal' && '[&_td]:py-3.5 [&_td]:px-4 [&_th]:py-3 [&_th]:px-4',
            density === 'comfortable' && '[&_td]:py-4.5 [&_td]:px-5 [&_th]:py-3.5 [&_th]:px-5',
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function AdminTableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead className={cn('bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider', className)}>
      <tr>{children}</tr>
    </thead>
  );
}

export interface AdminTableThProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export function AdminTableTh({
  children,
  className,
  ...props
}: AdminTableThProps) {
  return (
    <th className={cn('font-semibold', className)} {...props}>
      {children}
    </th>
  );
}

export function AdminTableBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-slate-100 dark:divide-slate-900', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export interface AdminTableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {}

export function AdminTableRow({
  children,
  className,
  onClick,
  ...props
}: AdminTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export interface AdminTableTdProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function AdminTableTd({
  children,
  className,
  ...props
}: AdminTableTdProps) {
  return (
    <td
      className={cn('text-slate-700 dark:text-slate-300 font-normal', className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function AdminPagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 10,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <div>
        Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(totalRecords, (currentPage - 1) * pageSize + 1)}</span> to{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(totalRecords, currentPage * pageSize)}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">{totalRecords}</span> entries
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2.5 font-semibold text-slate-700 dark:text-slate-300">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
