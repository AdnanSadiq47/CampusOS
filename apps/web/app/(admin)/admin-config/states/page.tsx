'use client';

import React, { useState, useMemo } from 'react';
import { StateListItemDto, CreateStateDto } from '@campus-os/types';
import { AdminConfigPageHeader, LOCATION_GEOGRAPHY_NAV } from '../../../../components/AdminConfigPageHeader';

/* ─── Mock initial fallback dataset ─── */
const MOCK_COUNTRIES: { id: string; name: string; iso2: string }[] = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Pakistan', iso2: 'PK' },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'United States', iso2: 'US' },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'United Kingdom', iso2: 'GB' },
  { id: 'c4444444-4444-4444-4444-444444444444', name: 'United Arab Emirates', iso2: 'AE' },
  { id: 'c5555555-5555-5555-5555-555555555555', name: 'Saudi Arabia', iso2: 'SA' },
];

const DEFAULT_STATES: StateListItemDto[] = [
  {
    id: 's1111111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    countryIso2: 'PK',
    name: 'Sindh',
    code: 'SD',
    type: 'Province',
    sortOrder: 1,
    isActive: true,
    cityCount: 30,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 's2222222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    countryIso2: 'PK',
    name: 'Punjab',
    code: 'PB',
    type: 'Province',
    sortOrder: 2,
    isActive: true,
    cityCount: 40,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 's3333333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    countryIso2: 'PK',
    name: 'Khyber Pakhtunkhwa',
    code: 'KP',
    type: 'Province',
    sortOrder: 3,
    isActive: true,
    cityCount: 35,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 's4444444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    countryIso2: 'PK',
    name: 'Islamabad Capital Territory',
    code: 'ICT',
    type: 'Territory',
    sortOrder: 4,
    isActive: true,
    cityCount: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 's5555555-5555-5555-5555-555555555555',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c2222222-2222-2222-2222-222222222222',
    countryName: 'United States',
    countryIso2: 'US',
    name: 'California',
    code: 'CA',
    type: 'State',
    sortOrder: 1,
    isActive: true,
    cityCount: 50,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 's6666666-6666-6666-6666-666666666666',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c4444444-4444-4444-4444-444444444444',
    countryName: 'United Arab Emirates',
    countryIso2: 'AE',
    name: 'Dubai',
    code: 'DXB',
    type: 'Emirate',
    sortOrder: 1,
    isActive: true,
    cityCount: 5,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

const STATE_TYPES = [
  'Province',
  'State',
  'Territory',
  'Region',
  'Emirate',
  'Governorate',
  'Other',
];

export default function StatesPage() {
  const [statesList, setStatesList] = useState<StateListItemDto[]>(DEFAULT_STATES);
  const [countriesList] = useState(MOCK_COUNTRIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingState, setEditingState] = useState<StateListItemDto | null>(null);
  const [viewingState, setViewingState] = useState<StateListItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateStateDto>({
    countryId: '',
    name: '',
    code: '',
    type: 'Province',
    sortOrder: 1,
    isActive: true,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const totalCount = statesList.length;
  const activeCount = useMemo(() => statesList.filter((s) => s.isActive).length, [statesList]);
  const inactiveCount = totalCount - activeCount;

  // Filtered list
  const filteredStates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return statesList.filter((s) => {
      if (countryFilter !== 'ALL' && s.countryId !== countryFilter) return false;
      if (statusFilter !== 'ALL') {
        const wantActive = statusFilter === 'ACTIVE';
        if (s.isActive !== wantActive) return false;
      }
      if (!query) return true;
      return (
        s.name.toLowerCase().includes(query) ||
        (s.code && s.code.toLowerCase().includes(query)) ||
        (s.countryName && s.countryName.toLowerCase().includes(query)) ||
        s.type.toLowerCase().includes(query)
      );
    });
  }, [statesList, searchQuery, countryFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingState(null);
    const defaultCountry = countryFilter !== 'ALL' ? countryFilter : countriesList[0]?.id || '';
    const maxSort = statesList
      .filter((s) => s.countryId === defaultCountry)
      .reduce((max, s) => Math.max(max, s.sortOrder || 0), 0);

    setFormData({
      countryId: defaultCountry,
      name: '',
      code: '',
      type: 'Province',
      sortOrder: maxSort + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (state: StateListItemDto) => {
    setEditingState(state);
    setFormData({
      countryId: state.countryId,
      name: state.name,
      code: state.code || '',
      type: state.type || 'Province',
      sortOrder: state.sortOrder,
      isActive: state.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openViewModal = (state: StateListItemDto) => {
    setViewingState(state);
    setIsViewModalOpen(true);
  };

  const handleToggleStatus = (state: StateListItemDto) => {
    const updated = statesList.map((s) =>
      s.id === state.id ? { ...s, isActive: !s.isActive, updatedAt: new Date() } : s
    );
    setStatesList(updated);
    showNotification(
      'success',
      `State/Province '${state.name}' ${state.isActive ? 'deactivated' : 'activated'} successfully.`
    );
  };

  const handleCountryChangeInForm = (newCountryId: string) => {
    const maxSort = statesList
      .filter((s) => s.countryId === newCountryId)
      .reduce((max, s) => Math.max(max, s.sortOrder || 0), 0);
    setFormData((prev) => ({
      ...prev,
      countryId: newCountryId,
      sortOrder: maxSort + 1,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.countryId) errors.countryId = 'Country is required.';
    if (!formData.name.trim()) errors.name = 'State/Province name is required.';

    // Duplicate check within Country
    const duplicate = statesList.find(
      (s) =>
        s.countryId === formData.countryId &&
        s.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (!editingState || s.id !== editingState.id)
    );
    if (duplicate) errors.name = `State/Province '${formData.name}' already exists in the selected Country.`;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const parentCountry = countriesList.find((c) => c.id === formData.countryId);

      if (editingState) {
        setStatesList((prev) =>
          prev.map((s) =>
            s.id === editingState.id
              ? {
                  ...s,
                  countryId: formData.countryId,
                  countryName: parentCountry?.name || s.countryName,
                  countryIso2: parentCountry?.iso2 || s.countryIso2,
                  name: formData.name.trim(),
                  code: formData.code?.trim().toUpperCase() || null,
                  type: formData.type || 'Province',
                  sortOrder: Number(formData.sortOrder) || 1,
                  isActive: formData.isActive ?? true,
                  updatedAt: new Date(),
                }
              : s
          )
        );
        showNotification('success', `State/Province '${formData.name}' updated successfully.`);
      } else {
        const newState: StateListItemDto = {
          id: `s_${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          countryId: formData.countryId,
          countryName: parentCountry?.name,
          countryIso2: parentCountry?.iso2,
          name: formData.name.trim(),
          code: formData.code?.trim().toUpperCase() || null,
          type: formData.type || 'Province',
          sortOrder: Number(formData.sortOrder) || 1,
          isActive: formData.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setStatesList((prev) => [...prev, newState].sort((a, b) => a.sortOrder - b.sortOrder));
        showNotification('success', `State/Province '${formData.name}' created successfully.`);
      }
      setIsSubmitting(false);
      setIsModalOpen(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6 max-w-7xl mx-auto">
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <AdminConfigPageHeader
        section="Administration Configuration"
        group="Location & Geography"
        title="States / Provinces"
        description="Manage regional subdivisions, federal states, provinces, emirates, and administrative territories."
        categoryNav={LOCATION_GEOGRAPHY_NAV}
        actionButtonText="+ Add State / Province"
        onAction={openCreateModal}
      />

      {/* ── 2. KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl">
            🗺️
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total States/Provinces</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-xl">
            ✅
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl">
            ⏸️
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-0.5">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Filters ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by state/province name, code, country..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Countries</option>
            {countriesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.iso2})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses ({totalCount})</option>
            <option value="ACTIVE">Active ({activeCount})</option>
            <option value="INACTIVE">Inactive ({inactiveCount})</option>
          </select>
        </div>
      </div>

      {/* ── 4. Main Data Table ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 w-16 text-center">Sort</th>
                <th className="py-3 px-4">State / Province</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <tr key={state.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{state.sortOrder}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {state.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {state.code || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                        <span>🌍</span> {state.countryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {state.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(state)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          state.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${state.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{state.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openViewModal(state)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(state)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(state)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                            state.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {state.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No states/provinces found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Add / Edit Modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingState ? `Edit State/Province: ${editingState.name}` : 'Add State / Province'}
                </h3>
                <p className="text-xs text-slate-500">Configure regional administrative subdivision under a country.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[65vh] text-xs">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.countryId}
                    onChange={(e) => handleCountryChangeInForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Country</option>
                    {countriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.iso2})
                      </option>
                    ))}
                  </select>
                  {formErrors.countryId && <p className="text-rose-500 text-[10px]">{formErrors.countryId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    State / Province Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sindh, Punjab, California, Dubai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {formErrors.name && <p className="text-rose-500 text-[10px]">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Code / Abbreviation
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SD, PB, CA, DXB"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Subdivision Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {STATE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingState ? 'Save Changes' : 'Create State / Province'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. View Modal ─────────────────────────────────────────── */}
      {isViewModalOpen && viewingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {viewingState.code && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {viewingState.code}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingState.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {viewingState.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingState.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh] text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Country</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingState.countryName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Subdivision Type</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingState.type}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase">Sort Sequence</p>
                  <p className="text-base font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    #{viewingState.sortOrder}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Last Updated</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {new Date(viewingState.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewingState);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Edit State
              </button>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
