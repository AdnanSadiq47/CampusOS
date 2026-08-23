'use client';

import React, { useState, useMemo } from 'react';
import { CountryListItemDto, CreateCountryDto } from '@campus-os/types';
import { AdminConfigPageHeader, LOCATION_GEOGRAPHY_NAV } from '../../../../components/AdminConfigPageHeader';

/* ─── Mock initial fallback dataset for offline/client preview ─── */
const DEFAULT_COUNTRIES: CountryListItemDto[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Pakistan',
    iso2: 'PK',
    iso3: 'PAK',
    numericCode: '586',
    dialCode: '+92',
    currencyCode: 'PKR',
    currencySymbol: 'Rs',
    nationality: 'Pakistani',
    sortOrder: 1,
    isActive: true,
    stateCount: 5,
    cityCount: 140,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'United States',
    iso2: 'US',
    iso3: 'USA',
    numericCode: '840',
    dialCode: '+1',
    currencyCode: 'USD',
    currencySymbol: '$',
    nationality: 'American',
    sortOrder: 2,
    isActive: true,
    stateCount: 50,
    cityCount: 300,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'United Kingdom',
    iso2: 'GB',
    iso3: 'GBR',
    numericCode: '826',
    dialCode: '+44',
    currencyCode: 'GBP',
    currencySymbol: '£',
    nationality: 'British',
    sortOrder: 3,
    isActive: true,
    stateCount: 4,
    cityCount: 80,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'United Arab Emirates',
    iso2: 'AE',
    iso3: 'ARE',
    numericCode: '784',
    dialCode: '+971',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    nationality: 'Emirati',
    sortOrder: 4,
    isActive: true,
    stateCount: 7,
    cityCount: 25,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Saudi Arabia',
    iso2: 'SA',
    iso3: 'SAU',
    numericCode: '682',
    dialCode: '+966',
    currencyCode: 'SAR',
    currencySymbol: '﷼',
    nationality: 'Saudi',
    sortOrder: 5,
    isActive: true,
    stateCount: 13,
    cityCount: 45,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export default function CountriesPage() {
  const [countriesList, setCountriesList] = useState<CountryListItemDto[]>(DEFAULT_COUNTRIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingCountry, setEditingCountry] = useState<CountryListItemDto | null>(null);
  const [viewingCountry, setViewingCountry] = useState<CountryListItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateCountryDto>({
    name: '',
    iso2: '',
    iso3: '',
    numericCode: '',
    dialCode: '',
    currencyCode: '',
    currencySymbol: '',
    nationality: '',
    sortOrder: 1,
    isActive: true,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // KPI Calculations
  const totalCount = countriesList.length;
  const activeCount = useMemo(() => countriesList.filter((c) => c.isActive).length, [countriesList]);
  const inactiveCount = totalCount - activeCount;

  // Filtered List
  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return countriesList.filter((c) => {
      if (statusFilter !== 'ALL') {
        const wantActive = statusFilter === 'ACTIVE';
        if (c.isActive !== wantActive) return false;
      }
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.iso2.toLowerCase().includes(query) ||
        (c.iso3 && c.iso3.toLowerCase().includes(query)) ||
        (c.dialCode && c.dialCode.toLowerCase().includes(query)) ||
        (c.currencyCode && c.currencyCode.toLowerCase().includes(query))
      );
    });
  }, [countriesList, searchQuery, statusFilter]);

  const openCreateModal = () => {
    setEditingCountry(null);
    const maxSort = countriesList.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0);
    setFormData({
      name: '',
      iso2: '',
      iso3: '',
      numericCode: '',
      dialCode: '',
      currencyCode: '',
      currencySymbol: '',
      nationality: '',
      sortOrder: maxSort + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (country: CountryListItemDto) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      iso2: country.iso2,
      iso3: country.iso3 || '',
      numericCode: country.numericCode || '',
      dialCode: country.dialCode || '',
      currencyCode: country.currencyCode || '',
      currencySymbol: country.currencySymbol || '',
      nationality: country.nationality || '',
      sortOrder: country.sortOrder,
      isActive: country.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openViewModal = (country: CountryListItemDto) => {
    setViewingCountry(country);
    setIsViewModalOpen(true);
  };

  const handleToggleStatus = (country: CountryListItemDto) => {
    const updated = countriesList.map((c) =>
      c.id === country.id ? { ...c, isActive: !c.isActive, updatedAt: new Date() } : c
    );
    setCountriesList(updated);
    showNotification(
      'success',
      `Country '${country.name}' ${country.isActive ? 'deactivated' : 'activated'} successfully.`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Country name is required.';
    if (!formData.iso2.trim()) errors.iso2 = 'ISO Alpha-2 code is required.';
    else if (formData.iso2.trim().length !== 2) errors.iso2 = 'ISO-2 code must be exactly 2 characters.';

    // Duplicate ISO2 check
    const duplicate = countriesList.find(
      (c) =>
        c.iso2.toUpperCase() === formData.iso2.trim().toUpperCase() &&
        (!editingCountry || c.id !== editingCountry.id)
    );
    if (duplicate) errors.iso2 = `Country with ISO-2 code '${formData.iso2.toUpperCase()}' already exists.`;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (editingCountry) {
        setCountriesList((prev) =>
          prev.map((c) =>
            c.id === editingCountry.id
              ? {
                  ...c,
                  name: formData.name.trim(),
                  iso2: formData.iso2.trim().toUpperCase(),
                  iso3: formData.iso3?.trim().toUpperCase() || null,
                  numericCode: formData.numericCode?.trim() || null,
                  dialCode: formData.dialCode?.trim() || null,
                  currencyCode: formData.currencyCode?.trim().toUpperCase() || null,
                  currencySymbol: formData.currencySymbol?.trim() || null,
                  nationality: formData.nationality?.trim() || null,
                  sortOrder: Number(formData.sortOrder) || 1,
                  isActive: formData.isActive ?? true,
                  updatedAt: new Date(),
                }
              : c
          )
        );
        showNotification('success', `Country '${formData.name}' updated successfully.`);
      } else {
        const newCountry: CountryListItemDto = {
          id: `c_${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          name: formData.name.trim(),
          iso2: formData.iso2.trim().toUpperCase(),
          iso3: formData.iso3?.trim().toUpperCase() || null,
          numericCode: formData.numericCode?.trim() || null,
          dialCode: formData.dialCode?.trim() || null,
          currencyCode: formData.currencyCode?.trim().toUpperCase() || null,
          currencySymbol: formData.currencySymbol?.trim() || null,
          nationality: formData.nationality?.trim() || null,
          sortOrder: Number(formData.sortOrder) || 1,
          isActive: formData.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCountriesList((prev) => [...prev, newCountry].sort((a, b) => a.sortOrder - b.sortOrder));
        showNotification('success', `Country '${formData.name}' created successfully.`);
      }
      setIsSubmitting(false);
      setIsModalOpen(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <AdminConfigPageHeader
        section="Administration Configuration"
        group="Location & Geography"
        title="Countries"
        description="Manage international sovereign countries, ISO codes, dial codes, and currency standards."
        categoryNav={LOCATION_GEOGRAPHY_NAV}
        actionButtonText="+ Add Country"
        onAction={openCreateModal}
      />

      {/* ── 2. KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl">
            🌍
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Countries</p>
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

      {/* ── 3. Search & Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by country name, ISO code, dial code, currency..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                <th className="py-3 px-4">Country Name</th>
                <th className="py-3 px-4">ISO-2 / ISO-3</th>
                <th className="py-3 px-4">Dial Code</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Nationality</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <tr key={country.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{country.sortOrder}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {country.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {country.iso2}
                        </span>
                        {country.iso3 && (
                          <span className="text-[10px] text-slate-400">({country.iso3})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {country.dialCode || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {country.currencyCode ? `${country.currencyCode} (${country.currencySymbol || ''})` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {country.nationality || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(country)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          country.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                        title="Toggle Active/Inactive"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${country.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{country.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openViewModal(country)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(country)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(country)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                            country.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {country.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No countries found matching your search.
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
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCountry ? `Edit Country: ${editingCountry.name}` : 'Add New Country'}
                </h3>
                <p className="text-xs text-slate-500">Configure sovereign country ISO standards and currency.</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Country Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pakistan, United States"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {formErrors.name && <p className="text-rose-500 text-[10px]">{formErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    ISO Alpha-2 Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.iso2}
                    onChange={(e) => setFormData({ ...formData, iso2: e.target.value.toUpperCase() })}
                    placeholder="e.g. PK, US, GB"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {formErrors.iso2 && <p className="text-rose-500 text-[10px]">{formErrors.iso2}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    ISO Alpha-3 Code
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.iso3 || ''}
                    onChange={(e) => setFormData({ ...formData, iso3: e.target.value.toUpperCase() })}
                    placeholder="e.g. PAK, USA, GBR"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Dial Code
                  </label>
                  <input
                    type="text"
                    value={formData.dialCode || ''}
                    onChange={(e) => setFormData({ ...formData, dialCode: e.target.value })}
                    placeholder="e.g. +92, +1, +44"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.currencyCode || ''}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. PKR, USD, GBP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.currencySymbol || ''}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                    placeholder="e.g. Rs, $, £, د.إ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Nationality Name
                  </label>
                  <input
                    type="text"
                    value={formData.nationality || ''}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="e.g. Pakistani, American"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                  {isSubmitting ? 'Saving...' : editingCountry ? 'Save Changes' : 'Create Country'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. View Details Modal ──────────────────────────────────── */}
      {isViewModalOpen && viewingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {viewingCountry.iso2}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingCountry.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {viewingCountry.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingCountry.name}</h3>
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
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">ISO Alpha-3</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {viewingCountry.iso3 || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Dial Code</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {viewingCountry.dialCode || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Currency</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {viewingCountry.currencyCode ? `${viewingCountry.currencyCode} (${viewingCountry.currencySymbol || ''})` : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Nationality</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingCountry.nationality || '—'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase">Sort Sequence</p>
                  <p className="text-base font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    #{viewingCountry.sortOrder}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Last Updated</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {new Date(viewingCountry.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewingCountry);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Edit Country
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
