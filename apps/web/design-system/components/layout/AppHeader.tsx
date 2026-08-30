'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { WorkingContextPicker } from '../../../components/WorkingContextPicker';
import { MainNavigation } from './MainNavigation';

export interface AppHeaderProps {
  showNavigation?: boolean;
  className?: string;
}

export function UtilityHeader({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin-config') || pathname === '/schools';

  return (
    <div className={`w-full border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
      <div className="max-w-[1540px] mx-auto px-3 sm:px-6 h-11 sm:h-12 flex items-center justify-between gap-3">
        {/* Left: Brand + Working Context Picker */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="h-6 w-6 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">CampusOS</span>
              <span className="hidden sm:inline text-[9px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                Core
              </span>
            </div>
          </Link>

          <div className="hidden sm:block">
            <WorkingContextPicker />
          </div>
        </div>

        {/* Right Utilities: Search + Notifications + Admin Config + User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 w-36 lg:w-48 cursor-text shadow-2xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="flex-1 truncate text-[11px]">Search...</span>
            <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-[9px] font-mono text-slate-500">⌘K</kbd>
          </div>

          {/* Notification Bell */}
          <button aria-label="Notifications" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Compact Admin Config Access Button */}
          <Link
            href="/admin-config"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isAdminRoute
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Administration Configuration Control Center"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Config</span>
          </Link>

          {/* User Profile Dropdown Badge */}
          <div className="flex items-center gap-2 pl-1.5 border-l border-slate-200 dark:border-slate-700">
            <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
              AH
            </div>
            <div className="hidden xl:flex flex-col text-left leading-tight">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Ali Hassan</div>
              <div className="text-[9px] text-slate-400">Admin Lead</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:block" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppHeader({ showNavigation = true, className = '' }: AppHeaderProps) {
  return (
    <header className={`sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs ${className}`}>
      <UtilityHeader />
      {showNavigation && <MainNavigation />}
    </header>
  );
}
