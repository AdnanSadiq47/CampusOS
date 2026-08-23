'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminPreferences, findConfigItemByRoute } from '../lib/use-admin-preferences';
import { CONFIG_REGISTRY, ConfigItem } from '../lib/admin-config-registry';

export interface CategoryNavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface AdminConfigPageHeaderProps {
  section?: string;
  sectionHref?: string;
  group?: string;
  groupHref?: string;
  title: string;
  description: string;
  configItemId?: string;
  categoryNav?: CategoryNavItem[];
  actionButtonText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  showPersonalization?: boolean;
  children?: React.ReactNode;
}

// Map common group names to category filter keys in /admin-config
const GROUP_TO_CATEGORY_KEY: Record<string, string> = {
  'Organization Setup': 'org_setup',
  'Location & Geography': 'location_geography',
  'Academic Setup': 'academic_setup',
  'Student Setup': 'student_setup',
  'HR & Employee Setup': 'hr_setup',
  'Fee & Billing Setup': 'fee_billing_setup',
  'Payroll Setup': 'payroll_setup',
  'Library Setup': 'library_setup',
  'Transport Setup': 'transport_setup',
  'Exam & Assessment': 'exam_assessment',
  'Attendance & Devices': 'attendance_devices',
  'Communication Setup': 'communication_setup',
  'General / Shared Masters': 'general_shared_masters',
  'Users & Access': 'users_access',
};

// Standard category navigation sets
export const LOCATION_GEOGRAPHY_NAV: CategoryNavItem[] = [
  { label: 'Countries', href: '/admin-config/countries' },
  { label: 'States / Provinces', href: '/admin-config/states' },
  { label: 'Cities', href: '/admin-config/cities' },
  { label: 'Areas / Zones', href: '/admin-config/areas' },
];

export const ORGANIZATION_SETUP_NAV: CategoryNavItem[] = [
  { label: 'Head Offices', href: '/admin-config/head-offices' },
  { label: 'Regional Offices', href: '/admin-config/regions' },
  { label: 'School Types', href: '/admin-config/school-types' },
  { label: 'Schools', href: '/admin-config/schools' },
  { label: 'Branches / Campuses', href: '/admin-config/branches' },
];

export const ACADEMIC_SETUP_NAV: CategoryNavItem[] = [
  { label: 'Academic Years', href: '/admin-config/academic-years' },
  { label: 'Boards', href: '/admin-config/boards' },
  { label: 'Academic Levels / Stages', href: '/admin-config/academic-levels' },
  { label: 'Subjects', href: '/admin-config/subjects' },
  { label: 'Classes / Grades', href: '/admin-config/classes' },
  { label: 'Sections', href: '/admin-config/sections' },
  { label: 'Languages', href: '/admin-config/languages' },
];

export function AdminConfigPageHeader({
  section = 'Administration Configuration',
  sectionHref = '/admin-config',
  group = 'Organization Setup',
  groupHref,
  title,
  description,
  configItemId,
  categoryNav,
  actionButtonText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  showPersonalization = true,
  children,
}: AdminConfigPageHeaderProps) {
  const pathname = usePathname();
  const {
    favorites,
    quickActions,
    toggleFavorite,
    toggleQuickAction,
    recordRecent,
  } = useAdminPreferences();

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Find matching ConfigItem from Registry
  const configItem: ConfigItem | undefined = useMemo(() => {
    if (configItemId) {
      return CONFIG_REGISTRY.find((item) => item.id === configItemId);
    }
    if (pathname) {
      const match = findConfigItemByRoute(pathname);
      if (match) return match;
    }
    // Fallback match by name
    return CONFIG_REGISTRY.find(
      (item) => item.name.toLowerCase() === title.toLowerCase()
    );
  }, [configItemId, pathname, title]);

  // Record visit in Recently Used automatically
  useEffect(() => {
    if (configItem) {
      recordRecent(configItem.id);
    }
  }, [configItem, recordRecent]);

  const isFavorited = configItem ? favorites.includes(configItem.id) : false;
  const isInQuickActions = configItem ? quickActions.includes(configItem.id) : false;

  const handleFavoriteClick = () => {
    if (!configItem) return;
    const nextState = toggleFavorite(configItem.id);
    showToast(nextState ? `★ Added ${configItem.name} to Favorites` : `Removed ${configItem.name} from Favorites`);
  };

  const handleQuickActionClick = () => {
    if (!configItem) return;
    const nextState = toggleQuickAction(configItem.id);
    showToast(nextState ? `⚡ Added ${configItem.name} to Quick Actions` : `Removed ${configItem.name} from Quick Actions`);
  };

  const resolvedGroupHref =
    groupHref ||
    (GROUP_TO_CATEGORY_KEY[group]
      ? `/admin-config?category=${GROUP_TO_CATEGORY_KEY[group]}`
      : '/admin-config');

  return (
    <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-5">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Clickable Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex-wrap">
            <Link
              href={sectionHref}
              className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {section}
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link
              href={resolvedGroupHref}
              className="text-slate-600 dark:text-slate-300 hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {group}
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{title}</span>
          </nav>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h1>

            {/* Personalization Badges (Favorites & Quick Actions) */}
            {showPersonalization && configItem && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {/* Favorite Toggle Button */}
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    isFavorited
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-600 hover:border-amber-300 dark:hover:border-amber-700'
                  }`}
                >
                  <span className={isFavorited ? 'text-amber-500' : 'text-slate-400'}>
                    {isFavorited ? '★' : '☆'}
                  </span>
                  <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
                </button>

                {/* Quick Action Toggle Button */}
                <button
                  type="button"
                  onClick={handleQuickActionClick}
                  title={isInQuickActions ? 'Remove from Quick Actions' : 'Add to Quick Actions'}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    isInQuickActions
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <span className={isInQuickActions ? 'text-indigo-500' : 'text-slate-400'}>⚡</span>
                  <span>{isInQuickActions ? 'In Quick Actions' : 'Add to Quick Actions'}</span>
                </button>
              </div>
            )}
          </div>

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

      {/* Context-Aware Secondary Navigation Strip */}
      {categoryNav && categoryNav.length > 0 && (
        <div className="pt-2">
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
            {categoryNav.map((item) => {
              const isActive =
                item.active ??
                (pathname
                  ? pathname.replace(/\/$/, '') === item.href.replace(/\/$/, '')
                  : item.label.toLowerCase() === title.toLowerCase());
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
