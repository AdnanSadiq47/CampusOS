'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [selectedContext, setSelectedContext] = useState('Alpha Academy (Head Office + 2 Campuses)');

  const builderLinks = [
    { href: '/builders/hierarchy', label: 'Hierarchy Tree', icon: '🌳' },
    { href: '/builders/entities', label: 'Entity Builder', icon: '📦' },
    { href: '/builders/forms', label: 'Form Builder', icon: '📝' },
    { href: '/builders/workflows', label: 'Workflow FSM', icon: '⚡' },
    { href: '/builders/navigation', label: 'Navigation Menus', icon: '🧭' },
    { href: '/modules', label: 'Pluggable Modules', icon: '🧩' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* 1. Primary Horizontal Enterprise Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Organization Context */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:bg-indigo-700 transition-colors">
                C
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">CampusOS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Core
              </span>
            </Link>

            {/* Active Organization & Node Context Selector */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs">
              <span className="text-slate-400 font-medium">Tenant:</span>
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value)}
                aria-label="Active Organization & Assignment Context"
                className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Alpha Academy (Head Office + 2 Campuses)" className="dark:bg-slate-900">Alpha Academy (HO + South Region)</option>
                <option value="Beta University System (Campus Karachi)" className="dark:bg-slate-900">Beta University (Campus Karachi)</option>
              </select>
            </div>
          </div>

          {/* Center: Primary Module Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/builders/hierarchy"
              className={`px-3 py-2 rounded-md transition-colors ${
                pathname.startsWith('/builders')
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Platform Builders
            </Link>
            <Link
              href="/modules"
              className={`px-3 py-2 rounded-md transition-colors ${
                pathname === '/modules'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              System Modules
            </Link>
          </nav>

          {/* Right Header Utilities: Search, Notifications, User Menu */}
          <div className="flex items-center gap-3">
            {/* Global Search Bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-400 w-48 lg:w-64">
              <span>🔍</span>
              <span className="flex-1">Search entities, forms...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500">⌘K</kbd>
            </div>

            {/* Notifications Button */}
            <button
              aria-label="Notifications"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <span className="text-base">🔔</span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* User Profile Avatar & Multi-Node Assignment Indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="h-8 w-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                AH
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Ali Hassan</div>
                <div className="text-[10px] text-slate-400">Head Office • Accountant</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Context-Aware Secondary Sub-Navigation (Builders Strip) */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-2">Builders:</span>
            {builderLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
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
      </header>

      {/* 3. Main Enterprise Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
