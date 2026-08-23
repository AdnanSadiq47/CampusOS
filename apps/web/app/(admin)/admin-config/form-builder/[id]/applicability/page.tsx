'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  SAMPLE_AUTHORIZED_HIERARCHY,
  resolveEffectiveCoverageDetails,
  getHierarchyScopeSummary,
  SelectedHierarchyState,
  EffectiveCoverageItem,
} from '@/components/HierarchyScopePickerModal';
import { getFormDefinitionById } from '@/lib/forms-catalog';

export default function FormApplicabilityDetailsPage() {
  const params = useParams();
  const formId = (params?.id as string) || 'f_prereg_2026';

  const [form, setForm] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DIRECT' | 'INHERITED' | 'UNIVERSAL'>('ALL');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Simulated scope state (in production, retrieved from form.scope / configScopeBranches)
  const [scopeState, setScopeState] = useState<SelectedHierarchyState>({
    isEntireOrg: false,
    selectedHeadOfficeIds: ['ho_aps'],
    selectedRegionIds: ['reg_south'],
    selectedSchoolIds: ['sch_beta'],
    selectedCampusIds: ['44444444-5555-6666-7777-888888888888'],
  });

  useEffect(() => {
    const loaded = getFormDefinitionById(formId);
    if (loaded) {
      setForm(loaded);
      if (loaded.applyTo === 'ALL_CAMPUSES') {
        setScopeState({
          isEntireOrg: true,
          selectedHeadOfficeIds: [],
          selectedRegionIds: [],
          selectedSchoolIds: [],
          selectedCampusIds: [],
        });
      }
    } else {
      setForm({
        id: formId,
        name: 'Pre-Registration Form 2026',
        code: 'FORM-PREREG-2026',
        formPurpose: 'ADMISSION',
        status: 'PUBLISHED',
        versionNumber: 1,
        applyTo: 'SELECTED_CAMPUSES',
      });
    }
  }, [formId]);

  // Compute effective coverage
  const effectiveCoverage: EffectiveCoverageItem[] = useMemo(() => {
    return resolveEffectiveCoverageDetails(scopeState, SAMPLE_AUTHORIZED_HIERARCHY);
  }, [scopeState]);

  // Filtering & Search
  const filteredCoverage = useMemo(() => {
    return effectiveCoverage.filter((item) => {
      if (filterType !== 'ALL' && item.coverageType !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.campusName.toLowerCase().includes(q) ||
          item.schoolName.toLowerCase().includes(q) ||
          (item.regionName && item.regionName.toLowerCase().includes(q)) ||
          (item.headOfficeName && item.headOfficeName.toLowerCase().includes(q)) ||
          item.appliedVia.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [effectiveCoverage, filterType, search]);

  // Pagination
  const totalPages = Math.ceil(filteredCoverage.length / pageSize) || 1;
  const paginatedCoverage = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCoverage.slice(start, start + pageSize);
  }, [filteredCoverage, currentPage, pageSize]);

  const totalExplicit =
    (scopeState.isEntireOrg ? 1 : 0) +
    scopeState.selectedHeadOfficeIds.length +
    scopeState.selectedRegionIds.length +
    scopeState.selectedSchoolIds.length +
    scopeState.selectedCampusIds.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/admin-config" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Administration Configuration
        </Link>
        <span>›</span>
        <span className="text-slate-400">Forms Setup</span>
        <span>›</span>
        <Link href="/admin-config/form-builder" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Form Builder
        </Link>
        <span>›</span>
        <Link href={`/admin-config/form-builder/${formId}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
          {form?.name || 'Form'}
        </Link>
        <span>›</span>
        <span className="text-slate-900 dark:text-white font-bold">Applicability</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Applicability Details
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {form?.status || 'PUBLISHED'}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            See exactly where <strong className="text-slate-900 dark:text-white">{form?.name}</strong> is assigned and where it applies through hierarchy inheritance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin-config/form-builder"
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 shadow-sm transition-all"
          >
            ← Back to Form Builder
          </Link>
          <Link
            href={`/admin-config/form-builder/${formId}`}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            Edit Form Schema
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Explicit Targets</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {scopeState.isEntireOrg ? 'Universal' : totalExplicit}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Directly configured</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Head Offices</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {scopeState.isEntireOrg ? 'All' : scopeState.selectedHeadOfficeIds.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Targeted</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Regions</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {scopeState.isEntireOrg ? 'All' : scopeState.selectedRegionIds.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Targeted</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Schools</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {scopeState.isEntireOrg ? 'All' : scopeState.selectedSchoolIds.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Targeted</span>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">Effective Campuses</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {effectiveCoverage.length}
          </span>
          <span className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-0.5 block">Active Reach</span>
        </div>
      </div>

      {/* Assignment Summary Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">Assignment Mode</span>
            <h3 className="text-lg font-bold">
              {scopeState.isEntireOrg ? 'Entire Organization (Universal Scope)' : 'Mixed Hierarchy Scope'}
            </h3>
          </div>
          <div className="text-xs font-medium text-slate-300">
            Future Inheritance:{' '}
            <strong className="text-emerald-400">
              {scopeState.isEntireOrg ? 'Enabled (Dynamic Descendants)' : 'Inherits to Selected Branch Trees'}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Explicitly Target Units:</span>
            <span className="font-semibold text-slate-100 mt-0.5 block">
              {getHierarchyScopeSummary(scopeState)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Resolved Effective Reach:</span>
            <span className="font-semibold text-indigo-300 mt-0.5 block">
              {effectiveCoverage.length} Campuses currently eligible for live admissions & pre-registration.
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Explicitly Assigned Hierarchy Units */}
      {!scopeState.isEntireOrg && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏛️</span>
                <span>Explicitly Assigned Hierarchy Units</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organizational units configured directly as form scope targets.
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300">
              {totalExplicit} Units
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Head Offices */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Head Offices ({scopeState.selectedHeadOfficeIds.length})
              </span>
              {scopeState.selectedHeadOfficeIds.length === 0 ? (
                <span className="text-xs text-slate-400 italic">None selected</span>
              ) : (
                scopeState.selectedHeadOfficeIds.map((id) => (
                  <div key={id} className="text-xs font-medium text-slate-800 dark:text-slate-200 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    🏛️ {id === 'ho_aps' ? 'Army Public Schools Directorate' : 'Central Head Office'}
                  </div>
                ))
              )}
            </div>

            {/* Regions */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Regions ({scopeState.selectedRegionIds.length})
              </span>
              {scopeState.selectedRegionIds.length === 0 ? (
                <span className="text-xs text-slate-400 italic">None selected</span>
              ) : (
                scopeState.selectedRegionIds.map((id) => (
                  <div key={id} className="text-xs font-medium text-slate-800 dark:text-slate-200 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    🗺️ {id === 'reg_south' ? 'Region South (Sindh & Balochistan)' : 'Region North (Punjab)'}
                  </div>
                ))
              )}
            </div>

            {/* Schools */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Schools ({scopeState.selectedSchoolIds.length})
              </span>
              {scopeState.selectedSchoolIds.length === 0 ? (
                <span className="text-xs text-slate-400 italic">None selected</span>
              ) : (
                scopeState.selectedSchoolIds.map((id) => (
                  <div key={id} className="text-xs font-medium text-slate-800 dark:text-slate-200 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    🏫 {id === 'sch_beta' ? 'Bloomfield Hall School Beta' : 'Beaconhouse School Alpha'}
                  </div>
                ))
              )}
            </div>

            {/* Direct Campuses */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Direct Campuses ({scopeState.selectedCampusIds.length})
              </span>
              {scopeState.selectedCampusIds.length === 0 ? (
                <span className="text-xs text-slate-400 italic">None selected</span>
              ) : (
                scopeState.selectedCampusIds.map((id) => (
                  <div key={id} className="text-xs font-medium text-slate-800 dark:text-slate-200 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    📍 Main Campus (Saddar)
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Effective Coverage Table (Where does it apply?) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📍</span>
              <span>Effective Coverage ({effectiveCoverage.length} Campuses)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              List of all active campuses where students and parents will access this form.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search campus, school, region..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-60"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1.5 text-xs text-slate-400">✕</button>
              )}
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              {(['ALL', 'DIRECT', 'INHERITED'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setFilterType(mode);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    filterType === mode
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {mode === 'ALL' ? 'All' : mode === 'DIRECT' ? 'Direct' : 'Inherited'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-3">Campus Name</th>
                <th className="py-3 px-3">School</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3">Head Office</th>
                <th className="py-3 px-3">Applied Via</th>
                <th className="py-3 px-3 text-right">Coverage Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedCoverage.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    No campuses found matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedCoverage.map((item) => (
                  <tr key={item.campusId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      📍 {item.campusName}
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {item.schoolName}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {item.regionName || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {item.headOfficeName || '—'}
                    </td>
                    <td className="py-3 px-3 font-medium text-indigo-600 dark:text-indigo-400">
                      {item.appliedVia}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.coverageType === 'DIRECT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.coverageType === 'UNIVERSAL'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {item.coverageType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing {paginatedCoverage.length} of {filteredCoverage.length} campuses</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs border border-slate-200 dark:border-slate-700"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100"
            >
              Previous
            </button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
