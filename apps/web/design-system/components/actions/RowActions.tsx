'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';
import { Eye, Edit2, Trash2, MoreHorizontal } from 'lucide-react';

export interface RowActionsProps {
  children?: React.ReactNode;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  disabled?: boolean;
  customActions?: React.ReactNode;
  className?: string;
}

export function RowActions({
  children,
  onView,
  onEdit,
  onDelete,
  canView = true,
  canEdit = true,
  canDelete = true,
  viewTitle = 'View details',
  editTitle = 'Edit',
  deleteTitle = 'Delete',
  disabled = false,
  customActions,
  className,
}: RowActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-1.5', className)}>
      {children}
      {canView && onView && (
        <button
          type="button"
          onClick={onView}
          disabled={disabled}
          title={viewTitle}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}

      {canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          title={editTitle}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}

      {canDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          title={deleteTitle}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {customActions}
    </div>
  );
}

export interface IndividualActionProps {
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export function ViewAction({ onClick, title = 'View details', disabled, className }: IndividualActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-7 w-7 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <Eye className="w-3.5 h-3.5" />
    </button>
  );
}

export function EditAction({ onClick, title = 'Edit', disabled, className }: IndividualActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-7 w-7 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <Edit2 className="w-3.5 h-3.5" />
    </button>
  );
}

export function DeleteAction({ onClick, title = 'Delete', disabled, className }: IndividualActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-7 w-7 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

export interface StatusActionProps extends IndividualActionProps {
  status: 'ACTIVE' | 'INACTIVE' | boolean;
}

export function StatusAction({
  status,
  onClick,
  disabled,
  className,
}: StatusActionProps) {
  const isActive = status === 'ACTIVE' || status === true;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={isActive ? 'Deactivate' : 'Activate'}
      className={cn(
        'px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer disabled:opacity-50',
        isActive
          ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
        className
      )}
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}

export function MoreActionsMenu({
  onClick,
  title = 'More actions',
  disabled,
  className,
}: IndividualActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-7 w-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <MoreHorizontal className="w-3.5 h-3.5" />
    </button>
  );
}


