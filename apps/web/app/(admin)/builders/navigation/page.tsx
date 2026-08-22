'use client';

import React, { useState } from 'react';

export default function NavigationBuilderPage() {
  const [menuItems] = useState([
    { id: '1', label: 'Dashboard', icon: '📊', path: '/dashboard', perms: [] },
    { id: '2', label: 'Academic Programs', icon: '🎓', path: '/academics/programs', perms: ['academic:program:read'] },
    { id: '3', label: 'Student Admissions', icon: '📋', path: '/admissions', perms: ['admission:applicant:read'] },
    { id: '4', label: 'Fee Billing & Invoices', icon: '💳', path: '/finance/invoices', perms: ['finance:invoice:read'] },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-400">CampusOS / Platform Builders</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Interactive Builder Studio
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Navigation & Menu Builder</h1>
          <p className="text-sm text-slate-500">
            Configure dynamic portal navigation bars, custom route paths, and role-based visibility filters.
          </p>
        </div>
        <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
          + Add Menu Item
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm">Main Sidebar Menu Order & Permission Rules</h3>

        <div className="space-y-2">
          {menuItems.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-mono text-xs">{idx + 1}</span>
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                <span className="text-xs font-mono text-slate-400">({item.path})</span>
              </div>
              <div className="flex items-center gap-2">
                {item.perms.length > 0 ? (
                  item.perms.map((p) => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Public for Authenticated</span>
                )}
                <button className="text-xs text-blue-600 hover:underline ml-4">Configure</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
