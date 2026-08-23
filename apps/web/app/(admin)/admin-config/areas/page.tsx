'use client';

import React, { useState, useMemo } from 'react';
import { AreaListItemDto, CreateAreaDto } from '@campus-os/types';
import { AdminConfigPageHeader, LOCATION_GEOGRAPHY_NAV } from '../../../../components/AdminConfigPageHeader';

/* ─── Mock Hierarchy Datasets ─── */
const MOCK_COUNTRIES = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Pakistan', iso2: 'PK' },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'United States', iso2: 'US' },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'United Kingdom', iso2: 'GB' },
  { id: 'c4444444-4444-4444-4444-444444444444', name: 'United Arab Emirates', iso2: 'AE' },
];

const MOCK_STATES = [
  { id: 's1111111-1111-1111-1111-111111111111', countryId: 'c1111111-1111-1111-1111-111111111111', name: 'Sindh' },
  { id: 's2222222-2222-2222-2222-222222222222', countryId: 'c1111111-1111-1111-1111-111111111111', name: 'Punjab' },
  { id: 's5555555-5555-5555-5555-555555555555', countryId: 'c2222222-2222-2222-2222-222222222222', name: 'California' },
];

const MOCK_CITIES = [
  { id: 'ct111111-1111-1111-1111-111111111111', countryId: 'c1111111-1111-1111-1111-111111111111', stateId: 's1111111-1111-1111-1111-111111111111', name: 'Karachi' },
  { id: 'ct222222-2222-2222-2222-222222222222', countryId: 'c1111111-1111-1111-1111-111111111111', stateId: 's1111111-1111-1111-1111-111111111111', name: 'Hyderabad' },
  { id: 'ct333333-3333-3333-3333-333333333333', countryId: 'c1111111-1111-1111-1111-111111111111', stateId: 's2222222-2222-2222-2222-222222222222', name: 'Lahore' },
  { id: 'ct555555-5555-5555-5555-555555555555', countryId: 'c2222222-2222-2222-2222-222222222222', stateId: 's5555555-5555-5555-5555-555555555555', name: 'Los Angeles' },
];

const DEFAULT_AREAS: AreaListItemDto[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    stateId: 's1111111-1111-1111-1111-111111111111',
    stateName: 'Sindh',
    cityId: 'ct111111-1111-1111-1111-111111111111',
    cityName: 'Karachi',
    name: 'Gulshan-e-Iqbal',
    code: 'GIQ',
    postalCode: '75300',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    stateId: 's1111111-1111-1111-1111-111111111111',
    stateName: 'Sindh',
    cityId: 'ct111111-1111-1111-1111-111111111111',
    cityName: 'Karachi',
    name: 'Clifton & DHA',
    code: 'CLF',
    postalCode: '75600',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    stateId: 's2222222-2222-2222-2222-222222222222',
    stateName: 'Punjab',
    cityId: 'ct333333-3333-3333-3333-333333333333',
    cityName: 'Lahore',
    name: 'Gulberg & Model Town',
    code: 'GLB',
    postalCode: '54660',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c2222222-2222-2222-2222-222222222222',
    countryName: 'United States',
    stateId: 's5555555-5555-5555-5555-555555555555',
    stateName: 'California',
    cityId: 'ct555555-5555-5555-5555-555555555555',
    cityName: 'Los Angeles',
    name: 'Downtown & Civic Center',
    code: 'DTN',
    postalCode: '90012',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export default function AreasPage() {
  const [areasList, setAreasList] = useState<AreaListItemDto[]>(DEFAULT_AREAS);
  const [countriesList] = useState(MOCK_COUNTRIES);
  const [statesList] = useState(MOCK_STATES);
  const [citiesList] = useState(MOCK_CITIES);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingArea, setEditingArea] = useState<AreaListItemDto | null>(null);
  const [viewingArea, setViewingArea] = useState<AreaListItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateAreaDto>({
    countryId: '',
    stateId: '',
    cityId: '',
    name: '',
    code: '',
    postalCode: '',
    sortOrder: 1,
    isActive: true,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const totalCount = areasList.length;
  const activeCount = useMemo(() => areasList.filter((a) => a.isActive).length, [areasList]);
  const inactiveCount = totalCount - activeCount;

  // Cascading options for filters
  const filterStatesOptions = useMemo(() => {
    if (countryFilter === 'ALL') return statesList;
    return statesList.filter((s) => s.countryId === countryFilter);
  }, [countryFilter, statesList]);

  const filterCitiesOptions = useMemo(() => {
    return citiesList.filter((c) => {
      if (countryFilter !== 'ALL' && c.countryId !== countryFilter) return false;
      if (stateFilter !== 'ALL' && c.stateId !== stateFilter) return false;
      return true;
    });
  }, [countryFilter, stateFilter, citiesList]);

  // Cascading options for form
  const formStatesOptions = useMemo(() => {
    if (!formData.countryId) return [];
    return statesList.filter((s) => s.countryId === formData.countryId);
  }, [formData.countryId, statesList]);

  const formCitiesOptions = useMemo(() => {
    if (!formData.stateId) return [];
    return citiesList.filter((c) => c.stateId === formData.stateId);
  }, [formData.stateId, citiesList]);

  // Real-time Search: Searches Area Name, Code, Postal/ZIP Code, City, State, Country
  const filteredAreas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return areasList.filter((a) => {
      if (countryFilter !== 'ALL' && a.countryId !== countryFilter) return false;
      if (stateFilter !== 'ALL' && a.stateId !== stateFilter) return false;
      if (cityFilter !== 'ALL' && a.cityId !== cityFilter) return false;
      if (statusFilter !== 'ALL') {
        const wantActive = statusFilter === 'ACTIVE';
        if (a.isActive !== wantActive) return false;
      }
      if (!query) return true;
      return (
        a.name.toLowerCase().includes(query) ||
        (a.code && a.code.toLowerCase().includes(query)) ||
        (a.postalCode && a.postalCode.toLowerCase().includes(query)) ||
        (a.cityName && a.cityName.toLowerCase().includes(query)) ||
        (a.stateName && a.stateName.toLowerCase().includes(query)) ||
        (a.countryName && a.countryName.toLowerCase().includes(query))
      );
    });
  }, [areasList, searchQuery, countryFilter, stateFilter, cityFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingArea(null);
    const defaultCountry = countryFilter !== 'ALL' ? countryFilter : countriesList[0]?.id || '';
    const availableStates = statesList.filter((s) => s.countryId === defaultCountry);
    const defaultState = stateFilter !== 'ALL' ? stateFilter : availableStates[0]?.id || '';
    const availableCities = citiesList.filter((c) => c.stateId === defaultState);
    const defaultCity = cityFilter !== 'ALL' ? cityFilter : availableCities[0]?.id || '';

    const maxSort = areasList
      .filter((a) => a.cityId === defaultCity)
      .reduce((max, a) => Math.max(max, a.sortOrder || 0), 0);

    setFormData({
      countryId: defaultCountry,
      stateId: defaultState,
      cityId: defaultCity,
      name: '',
      code: '',
      postalCode: '',
      sortOrder: maxSort + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (area: AreaListItemDto) => {
    setEditingArea(area);
    setFormData({
      countryId: area.countryId,
      stateId: area.stateId,
      cityId: area.cityId,
      name: area.name,
      code: area.code || '',
      postalCode: area.postalCode || '',
      sortOrder: area.sortOrder,
      isActive: area.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openViewModal = (area: AreaListItemDto) => {
    setViewingArea(area);
    setIsViewModalOpen(true);
  };

  const handleToggleStatus = (area: AreaListItemDto) => {
    const updated = areasList.map((a) =>
      a.id === area.id ? { ...a, isActive: !a.isActive, updatedAt: new Date() } : a
    );
    setAreasList(updated);
    showNotification(
      'success',
      `Area/Zone '${area.name}' ${area.isActive ? 'deactivated' : 'activated'} successfully.`
    );
  };

  const handleCountryChangeInForm = (newCountryId: string) => {
    const availableStates = statesList.filter((s) => s.countryId === newCountryId);
    const firstStateId = availableStates[0]?.id || '';
    const availableCities = citiesList.filter((c) => c.stateId === firstStateId);
    const firstCityId = availableCities[0]?.id || '';
    setFormData((prev) => ({
      ...prev,
      countryId: newCountryId,
      stateId: firstStateId,
      cityId: firstCityId,
    }));
  };

  const handleStateChangeInForm = (newStateId: string) => {
    const availableCities = citiesList.filter((c) => c.stateId === newStateId);
    const firstCityId = availableCities[0]?.id || '';
    setFormData((prev) => ({
      ...prev,
      stateId: newStateId,
      cityId: firstCityId,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.countryId) errors.countryId = 'Country is required.';
    if (!formData.stateId) errors.stateId = 'State/Province is required.';
    if (!formData.cityId) errors.cityId = 'City is required.';
    if (!formData.name.trim()) errors.name = 'Area/Zone name is required.';

    // Duplicate check within City
    const duplicate = areasList.find(
      (a) =>
        a.cityId === formData.cityId &&
        a.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (!editingArea || a.id !== editingArea.id)
    );
    if (duplicate) errors.name = `Area/Zone '${formData.name}' already exists in the selected City.`;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const parentCountry = countriesList.find((c) => c.id === formData.countryId);
      const parentState = statesList.find((s) => s.id === formData.stateId);
      const parentCity = citiesList.find((c) => c.id === formData.cityId);

      if (editingArea) {
        setAreasList((prev) =>
          prev.map((a) =>
            a.id === editingArea.id
              ? {
                  ...a,
                  countryId: formData.countryId,
                  countryName: parentCountry?.name || a.countryName,
                  stateId: formData.stateId,
                  stateName: parentState?.name || a.stateName,
                  cityId: formData.cityId,
                  cityName: parentCity?.name || a.cityName,
                  name: formData.name.trim(),
                  code: formData.code?.trim().toUpperCase() || null,
                  postalCode: formData.postalCode?.trim() || null,
                  sortOrder: Number(formData.sortOrder) || 1,
                  isActive: formData.isActive ?? true,
                  updatedAt: new Date(),
                }
              : a
          )
        );
        showNotification('success', `Area/Zone '${formData.name}' updated successfully.`);
      } else {
        const newArea: AreaListItemDto = {
          id: `a_${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          countryId: formData.countryId,
          countryName: parentCountry?.name,
          stateId: formData.stateId,
          stateName: parentState?.name,
          cityId: formData.cityId,
          cityName: parentCity?.name,
          name: formData.name.trim(),
          code: formData.code?.trim().toUpperCase() || null,
          postalCode: formData.postalCode?.trim() || null,
          sortOrder: Number(formData.sortOrder) || 1,
          isActive: formData.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setAreasList((prev) => [...prev, newArea].sort((a, b) => a.sortOrder - b.sortOrder));
        showNotification('success', `Area/Zone '${formData.name}' created successfully.`);
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

      {/* ── 1. Header with Clickable Breadcrumb & Secondary Navigation ── */}
      <AdminConfigPageHeader
        section="Administration Configuration"
        group="Location & Geography"
        title="Areas / Zones"
        description="Manage local neighborhood areas, school zoning sectors, and postal/ZIP code coverage."
        categoryNav={LOCATION_GEOGRAPHY_NAV}
        actionButtonText="+ Add Area / Zone"
        onAction={openCreateModal}
      />

      {/* ── 2. KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl">
            📍
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Areas / Zones</p>
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
            placeholder="Search by area name, postal code (e.g. 75300), area code, city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setStateFilter('ALL');
              setCityFilter('ALL');
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Countries</option>
            {countriesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCityFilter('ALL');
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All States / Provinces</option>
            {filterStatesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Cities</option>
            {filterCitiesOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
                <th className="py-3 px-4">Area / Zone</th>
                <th className="py-3 px-4">Postal / ZIP Code</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">State / Province</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredAreas.length > 0 ? (
                filteredAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{area.sortOrder}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {area.name}
                      </div>
                      {area.code && (
                        <div className="text-[10px] font-mono text-slate-400">Code: {area.code}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {area.postalCode ? (
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {area.postalCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {area.cityName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {area.stateName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                        <span>🌍</span> {area.countryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(area)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          area.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${area.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{area.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openViewModal(area)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(area)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(area)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                            area.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {area.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No areas/zones found matching your search.
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
                  {editingArea ? `Edit Area/Zone: ${editingArea.name}` : 'Add Area / Zone'}
                </h3>
                <p className="text-xs text-slate-500">Configure local neighborhood zone and postal code under a city.</p>
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
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.countryId && <p className="text-rose-500 text-[10px]">{formErrors.countryId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    State / Province <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.stateId}
                    onChange={(e) => handleStateChangeInForm(e.target.value)}
                    disabled={!formData.countryId}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  >
                    <option value="">Select State / Province</option>
                    {formStatesOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.stateId && <p className="text-rose-500 text-[10px]">{formErrors.stateId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.cityId}
                    onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                    disabled={!formData.stateId}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  >
                    <option value="">Select City</option>
                    {formCitiesOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.cityId && <p className="text-rose-500 text-[10px]">{formErrors.cityId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Area / Zone Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Gulshan-e-Iqbal, Clifton, Downtown"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {formErrors.name && <p className="text-rose-500 text-[10px]">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Area Code
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. GIQ, CLF"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.postalCode || ''}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="e.g. 75300, 90012"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
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
                  {isSubmitting ? 'Saving...' : editingArea ? 'Save Changes' : 'Create Area / Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. View Modal ─────────────────────────────────────────── */}
      {isViewModalOpen && viewingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {viewingArea.postalCode && (
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      📮 {viewingArea.postalCode}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingArea.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {viewingArea.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingArea.name}</h3>
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
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingArea.countryName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">State / Province</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingArea.stateName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">City</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingArea.cityName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Postal / ZIP Code</p>
                  <p className="text-xs font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {viewingArea.postalCode || '—'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase">Sort Sequence</p>
                  <p className="text-base font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    #{viewingArea.sortOrder}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Last Updated</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {new Date(viewingArea.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewingArea);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Edit Area
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
