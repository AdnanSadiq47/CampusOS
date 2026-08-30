'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@campus-os/ui-kit';
import { Star, Zap, ChevronRight } from 'lucide-react';
import { PrimaryActionButton } from '../buttons/PrimaryActionButton';

export interface AdminPageHeaderProps {
  section?: string;
  sectionHref?: string;
  group?: string;
  groupHref?: string;
  title: string;
  description?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isQuickAction?: boolean;
  onToggleQuickAction?: () => void;
  actionButtonText?: string;
  onAction?: () => void;
  actionButtonVariant?: any;
  actionButtonIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  section = 'Administration Configuration',
  sectionHref = '/admin-config',
  group,
  groupHref,
  title,
  description,
  isFavorite = false,
  onToggleFavorite,
  isQuickAction = false,
  onToggleQuickAction,
  actionButtonText,
  onAction,
  actionButtonVariant = 'primary',
  actionButtonIcon,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium flex-wrap">
        <Link
          href={sectionHref}
          className="hover:text-indigo-600 transition-colors uppercase tracking-wider font-semibold text-[11px]"
        >
          {section}
        </Link>
        {group && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {groupHref ? (
              <Link
                href={groupHref}
                className="hover:text-indigo-600 transition-colors uppercase tracking-wider font-semibold text-[11px]"
              >
                {group}
              </Link>
            ) : (
              <span className="uppercase tracking-wider font-semibold text-[11px]">
                {group}
              </span>
            )}
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
          {title}
        </span>
      </div>

      {/* 2. Title, Badges & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors cursor-pointer',
                  isFavorite
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800'
                )}
              >
                <Star
                  className={cn(
                    'w-3 h-3',
                    isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                  )}
                />
                <span>Favorite</span>
              </button>
            )}
            {onToggleQuickAction && (
              <button
                type="button"
                onClick={onToggleQuickAction}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors cursor-pointer',
                  isQuickAction
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-400'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800'
                )}
              >
                <Zap
                  className={cn(
                    'w-3 h-3',
                    isQuickAction
                      ? 'fill-indigo-500 text-indigo-600'
                      : 'text-slate-400'
                  )}
                />
                <span>In Quick Actions</span>
              </button>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Right side primary action */}
        {actionButtonText && onAction && (
          <div className="flex-shrink-0">
            <PrimaryActionButton
              label={actionButtonText}
              onClick={onAction}
              variant={actionButtonVariant}
              icon={actionButtonIcon}
            />
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
