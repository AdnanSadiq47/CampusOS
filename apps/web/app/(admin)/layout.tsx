'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import {
  MAIN_ERP_MODULES,
} from '../../lib/navigation-registry';
import { NavIcon } from '../../components/NavIcon';
import { WorkingContextPicker } from '../../components/WorkingContextPicker';
import { StudentCascadingMenu } from '../../components/StudentCascadingMenu';
import { WorkingContextProvider } from '../../lib/working-context';
import { PermissionsProvider } from '../../lib/permissions';
import { DisplayPreferencesProvider } from '../../components/DisplayFormatters';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMegaMenuId, setOpenMegaMenuId] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Close cascading menu when clicking outside or navigating
  useEffect(() => {
    setOpenMegaMenuId(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setOpenMegaMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdminRoute = pathname.startsWith('/admin-config') || pathname === '/schools';

  return (
    <WorkingContextProvider>
      <PermissionsProvider>
        <DisplayPreferencesProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans overflow-x-hidden">

      {/* ── HEADER CONTAINER (STICKY TOP-0 Z-30) ───────────────────────── */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">

        {/* ── ROW 1: TOP UTILITY HEADER (~44PX) ───────────────────────── */}
        <div className="border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-[1540px] mx-auto px-3 sm:px-6 h-11 sm:h-12 flex items-center justify-between gap-3">

            {/* Left: Mobile Toggle + Brand + Working Context Picker */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* CampusOS Brand */}
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

              {/* Working Context Picker */}
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

        {/* ── ROW 2: MAIN ERP MODULE HEADER (~40PX) ────────────────────── */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 overflow-visible relative z-30">
          <div className="max-w-[1540px] mx-auto px-3 sm:px-6 overflow-visible">
            <nav className="flex items-center gap-0.5 py-0.5 overflow-visible" ref={navContainerRef}>
              {MAIN_ERP_MODULES.map((mod) => {
                const isActive = mod.match(pathname);
                const isMegaOpen = openMegaMenuId === mod.id;

                if (mod.isMegaMenu) {
                  return (
                    <div
                      key={mod.id}
                      className="relative"
                      onMouseEnter={() => setOpenMegaMenuId(mod.id)}
                      onMouseLeave={() => setOpenMegaMenuId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMegaMenuId(isMegaOpen ? null : mod.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'border-blue-600 text-blue-900 dark:text-blue-200 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/50 font-bold'
                            : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        <NavIcon
                          name={mod.icon}
                          variant={isActive ? 'active' : 'default'}
                          className="w-4 h-4 shrink-0"
                        />
                        <span>{mod.label}</span>
                        <ChevronDown className={`w-3 h-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      </button>

                      {/* ── STUDENT CASCADING MENU (RIGHT-SIDE FLYOUT) ── */}
                      <StudentCascadingMenu
                        isOpen={isMegaOpen}
                        onClose={() => setOpenMegaMenuId(null)}
                      />
                    </div>
                  );
                }

                if (mod.soon) {
                  return (
                    <span
                      key={mod.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-default whitespace-nowrap"
                    >
                      <NavIcon
                        name={mod.icon}
                        variant="muted"
                        className="w-4 h-4 shrink-0"
                      />
                      <span>{mod.label}</span>
                    </span>
                  );
                }

                return (
                  <Link
                    key={mod.id}
                    href={mod.href}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-blue-600 text-blue-900 dark:text-blue-200 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/50 font-bold'
                        : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                    }`}
                  >
                    <NavIcon
                      name={mod.icon}
                      variant={isActive ? 'active' : 'default'}
                      className="w-4 h-4 shrink-0"
                    />
                    <span>{mod.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ── MOBILE ACCORDION DRAWER ─────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-2">
            {/* Mobile Working Context Picker */}
            <div className="p-1">
              <WorkingContextPicker />
            </div>

            {/* Mobile Main Links */}
            <div className="space-y-1 text-xs">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <NavIcon name="dashboard" className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              {/* Student Accordion */}
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <NavIcon name="student" className="w-3.5 h-3.5" />
                  <span>Student Operations</span>
                </div>
                <Link
                  href="/admissions/pre-admissions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-semibold hover:bg-blue-50"
                >
                  <NavIcon name="preadmissions" className="w-3.5 h-3.5" />
                  <span>Pre-Admissions</span>
                </Link>
                <Link
                  href="/admissions/tests"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-semibold hover:bg-blue-50"
                >
                  <NavIcon name="tests" className="w-3.5 h-3.5" />
                  <span>Tests</span>
                </Link>
              </div>

              {/* Administration Configuration */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <Link
                  href="/admin-config"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-blue-600"
                >
                  <Settings className="w-4 h-4" />
                  <span>Administration Configuration</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1540px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-5">
        {children}
      </main>
      </div>
        </DisplayPreferencesProvider>
      </PermissionsProvider>
    </WorkingContextProvider>
  );
}
