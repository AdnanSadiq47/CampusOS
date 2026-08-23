'use client';

import React from 'react';
import Link from 'next/link';

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
  categoryNav?: CategoryNavItem[];
  actionButtonText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
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

export function AdminConfigPageHeader({
  section = 'Administration Configuration',
  sectionHref = '/admin-config',
  group = 'Organization Setup',
  groupHref,
  title,
  description,
  categoryNav,
  actionButtonText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  children,
}: AdminConfigPageHeaderProps) {
  const resolvedGroupHref =
    groupHref ||
    (GROUP_TO_CATEGORY_KEY[group]
      ? `/admin-config?category=${GROUP_TO_CATEGORY_KEY[group]}`
      : '/admin-config');

  return (
    <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-5">
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

      {/* Context-Aware Secondary Navigation Strip */}
      {categoryNav && categoryNav.length > 0 && (
        <div className="pt-2">
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
            {categoryNav.map((item) => {
              const isActive = item.active ?? (item.label.toLowerCase() === title.toLowerCase());
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
