'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SectionNavKey,
  NavLinkItem,
  SECTION_NAV_REGISTRY,
  resolveSectionNavForRoute,
} from '../lib/navigation-registry';
import { NavIcon } from './NavIcon';

export interface SectionNavigationProps {
  section?: SectionNavKey;
  items?: (NavLinkItem | { label: string; href: string; icon?: string; soon?: boolean; active?: boolean })[];
  className?: string;
}

export function SectionNavigation({ section, items, className = '' }: SectionNavigationProps) {
  const pathname = usePathname();

  // Resolve items: explicit items prop -> section key prop -> automatic route resolution
  let navItems: (NavLinkItem | { label: string; href: string; icon?: string; soon?: boolean; active?: boolean })[] = [];

  if (items && items.length > 0) {
    navItems = items;
  } else if (section && SECTION_NAV_REGISTRY[section]) {
    navItems = SECTION_NAV_REGISTRY[section].items;
  } else if (pathname) {
    const resolved = resolveSectionNavForRoute(pathname);
    if (resolved) {
      navItems = resolved.items;
    }
  }

  if (!navItems || navItems.length === 0) {
    return null;
  }

  return (
    <div className={`overflow-x-auto scrollbar-none py-1 -mx-1 px-1 ${className}`}>
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 flex-nowrap min-h-[38px]">
        {navItems.map((item) => {
          const isExactMatch =
            pathname.replace(/\/$/, '') === item.href.replace(/\/$/, '');
          const isNestedMatch =
            item.href !== '/admin-config' &&
            item.href !== '/' &&
            pathname.startsWith(item.href + '/');
          const isActive = (item as any).active ?? (isExactMatch || isNestedMatch);

          if (item.soon) {
            return (
              <span
                key={item.href + item.label}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap text-slate-400 dark:text-slate-600 flex items-center gap-1.5 cursor-not-allowed opacity-60"
              >
                {item.icon && <NavIcon name={item.icon} className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700/80'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              {item.icon && <NavIcon name={item.icon} className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
