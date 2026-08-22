'use client';

import React, { useState } from 'react';

interface ModuleItem {
  code: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  dependencies?: string[];
}

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleItem[]>([
    {
      code: 'academic_core',
      name: 'Academic Core Management',
      category: 'ACADEMIC',
      description: 'Configurable academic programs, terms, course catalogs, and class sections',
      enabled: true,
    },
    {
      code: 'fee_billing',
      name: 'Fee Billing & Collections',
      category: 'FINANCIAL',
      description: 'Fee structures, invoices, challan generation, and ledger posting bridge',
      enabled: true,
      dependencies: ['academic_core'],
    },
    {
      code: 'admissions',
      name: 'Admissions & Enrollment Pipeline',
      category: 'ADMINISTRATIVE',
      description: 'Online application forms, document verification workflows, and merit lists',
      enabled: false,
      dependencies: ['academic_core'],
    },
    {
      code: 'hostel_management',
      name: 'Hostel & Housing Management',
      category: 'ADMINISTRATIVE',
      description: 'Room allocations, occupancy tracking, fee billing, and mess billing',
      enabled: false,
    },
  ]);

  const toggleModule = (code: string) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.code === code) {
          return { ...m, enabled: !m.enabled };
        }
        return m;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pluggable Organization Modules</h2>
        <p className="text-sm text-slate-500">
          Enable or disable modular enterprise extensions. Disabling a module hides menus and suspends background jobs but never deletes historical data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.code}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {mod.category}
                </span>
                <button
                  onClick={() => toggleModule(mod.code)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    mod.enabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {mod.enabled ? '● Active' : '○ Disabled'}
                </button>
              </div>
              <h3 className="font-semibold text-base mt-2">{mod.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{mod.description}</p>
            </div>

            {mod.dependencies && mod.dependencies.length > 0 && (
              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                Prerequisites: <span className="font-mono">{mod.dependencies.join(', ')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
