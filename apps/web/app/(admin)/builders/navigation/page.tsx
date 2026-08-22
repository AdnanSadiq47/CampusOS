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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Navigation & Menu Builder</h2>
          <p className="text-sm text-slate-500">
            Configure dynamic portal navigation bars, custom route paths, and role-based visibility filters.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
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
