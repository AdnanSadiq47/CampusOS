'use client';

import React from 'react';
import { AdminConfigPageHeader, ORGANIZATION_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { DisplayPreferencesSettingsPanel } from '../../../../components/DisplayFormatters';

export default function DisplayPreferencesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <AdminConfigPageHeader
        title="Display & Formatting Standards"
        description="Configure institution-wide and school-specific presentation standards for Mobile numbers, Landline telephones, and CNIC national identities."
        categoryNav={ORGANIZATION_SETUP_NAV}
        configItemId="org_display_preferences"
      />

      <div className="space-y-6">
        <DisplayPreferencesSettingsPanel
          title="CampusOS Global Display Format Configuration"
          subtitle="All ERP modules, reports, view pages, student registries, and parent records automatically inherit these presentation preferences without modifying underlying canonical identities."
        />

        <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl p-5 text-xs text-slate-700 dark:text-slate-300 space-y-3">
          <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2 text-sm">
            <span>🛡️</span>
            <span>CampusOS Canonical Identity & Formatting Invariant</span>
          </div>
          <p className="leading-relaxed">
            CampusOS enforces a strict architectural separation between <strong>Canonical Identity Persistence</strong> and <strong>Visual Display Presentation</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 ml-1">
            <li>
              <strong>Mobile Numbers:</strong> Persisted in stable canonical form (<code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded font-mono">923XXXXXXXXX</code>). Changing display format alters rendering in UI and print reports without rewriting database identities.
            </li>
            <li>
              <strong>Landline / PTCL:</strong> Country-aware area code normalization (<code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded font-mono">92 + Area Code + Subscriber</code>). Separate from mobile rules.
            </li>
            <li>
              <strong>CNIC National Identity:</strong> Stored as an exact 13-digit logical identity (<code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded font-mono">4210112345671</code>). Dashed and plain inputs match the same record during search, CSV/Excel imports, and parent portal logins.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
