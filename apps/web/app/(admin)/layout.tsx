'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [selectedContext, setSelectedContext] = useState('Alpha Academy (Head Office + 2 Campuses)');

  // Primary top-level navigation sections
  const primaryNav = [
    {
      href: '/admin-config',
      label: 'Admin Config',
      icon: '🏛️',
      match: (p: string) => p.startsWith('/admin-config') || p === '/schools',
    },
    {
      href: '/builders/hierarchy',
      label: 'Platform Builders',
      icon: '🔧',
      match: (p: string) => p.startsWith('/builders'),
    },
    {
      href: '/modules',
      label: 'System Modules',
      icon: '🧩',
      match: (p: string) => p === '/modules',
    },
  ];

  // Administration Configuration sub-navigation
  const adminConfigLinks = [
    { href: '/admin-config/head-offices', label: 'Head Office', icon: '🏢', soon: false },
    { href: '/admin-config/regions', label: 'Regional Offices', icon: '🗺️', soon: false },
    { href: '/admin-config/schools', label: 'Schools', icon: '🏫', soon: false },
    { href: '/admin-config/branches', label: 'Branches', icon: '🌿', soon: false },
    { href: '/admin-config/school-types', label: 'School Types', icon: '📋', soon: false },
    { href: '/admin-config/admin-users', label: 'Admin Users', icon: '👥', soon: true },
  ];

  // Builder strip links (shown for Platform Builders section)
  const builderLinks = [
    { href: '/builders/hierarchy', label: 'Hierarchy Tree', icon: '🌳' },
    { href: '/builders/entities', label: 'Entity Builder', icon: '📦' },
    { href: '/builders/forms', label: 'Form Builder', icon: '📝' },
    { href: '/builders/workflows', label: 'Workflow FSM', icon: '⚡' },
    { href: '/builders/navigation', label: 'Navigation Menus', icon: '🧭' },
  ];

  const isInAdminConfig =
    pathname.startsWith('/admin-config') || pathname === '/schools';
  const isInBuilders = pathname.startsWith('/builders');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">

      {/* ── PRIMARY ENTERPRISE HEADER ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:bg-indigo-700 transition-colors">
                C
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">CampusOS</span>
              <span className="hidden sm:inline text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Core
              </span>
            </Link>

            {/* Tenant Context Selector */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs">
              <span className="text-slate-400 font-medium">Org:</span>
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value)}
                aria-label="Active Organization Context"
                className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="Alpha Academy (Head Office + 2 Campuses)" className="dark:bg-slate-900">Alpha Academy (HO + South Region)</option>
                <option value="Beta University System (Campus Karachi)" className="dark:bg-slate-900">Beta University (Campus Karachi)</option>
              </select>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 text-sm font-medium">
            {primaryNav.map((item) => {
              const isActive = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-400 w-44 lg:w-56 cursor-text">
              <span>🔍</span>
              <span className="flex-1">Search...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[9px] font-mono text-slate-500">⌘K</kbd>
            </div>

            <button aria-label="Notifications" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <span className="text-base">🔔</span>
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="h-7 w-7 rounded-full bg-indigo-700 dark:bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                AH
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">Ali Hassan</div>
                <div className="text-[10px] text-slate-400 leading-none mt-0.5">Head Office • Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTEXT-AWARE SECONDARY STRIP ─────────────────────────── */}
        {isInAdminConfig && (
          <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-1 overflow-x-auto py-0 scrollbar-none">
                {/* Section label */}
                <div className="flex items-center gap-1.5 pr-3 mr-1 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 py-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Admin Config</span>
                </div>
                {adminConfigLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href === '/admin-config/schools' && pathname === '/schools');
                  return (
                    <Link
                      key={link.href}
                      href={link.soon ? '#' : link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 dark:border-indigo-400'
                          : link.soon
                          ? 'border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      onClick={link.soon ? (e) => e.preventDefault() : undefined}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                      {link.soon && (
                        <span className="px-1 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium">Soon</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isInBuilders && (
          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
                <div className="flex items-center gap-1.5 pr-3 mr-1 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Builders</span>
                </div>
                {builderLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
