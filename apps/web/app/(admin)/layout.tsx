import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h1 className="font-bold text-lg tracking-tight text-blue-600 dark:text-blue-400">CampusOS</h1>
            <p className="text-xs text-slate-500">Enterprise Admin Console</p>
          </div>

          <nav className="p-3 space-y-1 text-sm font-medium">
            <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">Visual Builders</div>
            <Link
              href="/builders/hierarchy"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span>🌳</span>
              <span>Hierarchy Tree</span>
            </Link>
            <Link
              href="/builders/entities"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span>📦</span>
              <span>Entity Builder</span>
            </Link>
            <Link
              href="/builders/forms"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span>📝</span>
              <span>Form Builder</span>
            </Link>
            <Link
              href="/builders/workflows"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span>⚡</span>
              <span>Workflow FSM</span>
            </Link>
            <Link
              href="/builders/navigation"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span>🧭</span>
              <span>Navigation Menus</span>
            </Link>

            <div className="pt-4 px-3 py-2 text-xs font-semibold uppercase text-slate-400">System Modules</div>
            <Link
              href="/modules"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span>🧩</span>
              <span>Pluggable Modules</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          Tenant: <span className="font-semibold text-slate-700 dark:text-slate-300">Alpha Academy</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
