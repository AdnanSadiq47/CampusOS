'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Zap } from 'lucide-react';
import { useAdminPreferences, findConfigItemByRoute } from '../lib/use-admin-preferences';
import { CONFIG_REGISTRY, ConfigItem } from '../lib/admin-config-registry';
import { SectionNavigation } from './SectionNavigation';
import { SECTION_NAV_REGISTRY } from '../lib/navigation-registry';

export interface CategoryNavItem {
  label: string;
  href: string;
  icon?: string;
  soon?: boolean;
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

// Standard category navigation sets derived from centralized navigation registry
export const LOCATION_GEOGRAPHY_NAV: CategoryNavItem[] = SECTION_NAV_REGISTRY.location_geography.items.map((i) => ({
  label: i.label,
  href: i.href,
  icon: i.icon,
  soon: i.soon,
}));

export const ORGANIZATION_SETUP_NAV: CategoryNavItem[] = SECTION_NAV_REGISTRY.org_setup.items.map((i) => ({
  label: i.label,
  href: i.href,
  icon: i.icon,
  soon: i.soon,
}));

export const ACADEMIC_SETUP_NAV: CategoryNavItem[] = SECTION_NAV_REGISTRY.academic_setup.items.map((i) => ({
  label: i.label,
  href: i.href,
  icon: i.icon,
  soon: i.soon,
}));

export const FORMS_SETUP_NAV: CategoryNavItem[] = SECTION_NAV_REGISTRY.forms_setup.items.map((i) => ({
  label: i.label,
  href: i.href,
  icon: i.icon,
  soon: i.soon,
}));

// Map common group names to category filter keys in /admin-config
const GROUP_TO_CATEGORY_KEY: Record<string, string> = {
  'Organization Setup': 'org_setup',
  'Location & Geography': 'location_geography',
  'Academic Setup': 'academic_setup',
  'Forms Setup': 'forms_setup',
  'Forms & Admission Setup': 'forms_setup',
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

export function AdminConfigPageHeader({
  section = 'Administration Configuration',
  sectionHref = '/admin-config',
  group = 'Forms & Admission Setup',
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
    <div className="space-y-2.5 sm:space-y-3 border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          {/* Clickable Breadcrumbs (Compact) */}
          <nav className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-wrap">
            <Link
              href={sectionHref}
              className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {section}
            </Link>
            <span>/</span>
            <Link
              href={resolvedGroupHref}
              className="text-slate-600 dark:text-slate-300 hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {group}
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-black">{title}</span>
          </nav>

          {/* Title and Personalization Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h1>

            {/* Personalization Badges (Favorites & Quick Actions) */}
            {showPersonalization && configItem && (
              <div className="flex items-center gap-1">
                {/* Favorite Toggle Button */}
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border ${
                    isFavorited
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-600'
                  }`}
                >
                  <Star className={`w-3 h-3 ${isFavorited ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                  <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                </button>

                {/* Quick Action Toggle Button */}
                <button
                  type="button"
                  onClick={handleQuickActionClick}
                  title={isInQuickActions ? 'Remove from Quick Actions' : 'Add to Quick Actions'}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border ${
                    isInQuickActions
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600'
                  }`}
                >
                  <Zap className={`w-3 h-3 ${isInQuickActions ? 'text-indigo-500 fill-indigo-400' : 'text-slate-400'}`} />
                  <span>{isInQuickActions ? 'In Quick Actions' : 'Quick Action'}</span>
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-normal">
            {description}
          </p>
        </div>

        {/* Action Buttons (Compact) */}
        <div className="flex items-center gap-2 flex-wrap">
          {children}

          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {secondaryActionText}
            </button>
          )}

          {actionButtonText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{actionButtonText.startsWith('+') ? actionButtonText : `+ ${actionButtonText}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Context-Aware Secondary Navigation Strip */}
      <SectionNavigation items={categoryNav} />
    </div>
  );
}
