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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-400">CampusOS / System Architecture</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Feature Flag Matrix
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pluggable Organization Modules</h1>
          <p className="text-sm text-slate-500">
            Enable or disable modular domain extensions with automated dependency validation. Disabling a module hides navigation and guards endpoints without deleting historical audit ledgers.
          </p>
        </div>
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
