'use client';

import React, { useState, useMemo } from 'react';
import { PostalCodeListItemDto, CreatePostalCodeDto } from '@campus-os/types';
import { AdminConfigPageHeader } from '../../../../components/AdminConfigPageHeader';

/* ─── Mock Hierarchy Datasets ─── */
const MOCK_COUNTRIES = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Pakistan', iso2: 'PK' },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'United States', iso2: 'US' },
];

const MOCK_STATES = [
  { id: 's1111111-1111-1111-1111-111111111111', countryId: 'c1111111-1111-1111-1111-111111111111', name: 'Sindh' },
  { id: 's2222222-2222-2222-2222-222222222222', countryId: 'c1111111-1111-1111-1111-111111111111', name: 'Punjab' },
  { id: 's5555555-5555-5555-5555-555555555555', countryId: 'c2222222-2222-2222-2222-222222222222', name: 'California' },
];

const MOCK_CITIES = [
  { id: 'ct111111-1111-1111-1111-111111111111', countryId: 'c1111111-1111-1111-1111-111111111111', stateId: 's1111111-1111-1111-1111-111111111111', name: 'Karachi' },
  { id: 'ct333333-3333-3333-3333-333333333333', countryId: 'c1111111-1111-1111-1111-111111111111', stateId: 's2222222-2222-2222-2222-222222222222', name: 'Lahore' },
  { id: 'ct555555-5555-5555-5555-555555555555', countryId: 'c2222222-2222-2222-2222-222222222222', stateId: 's5555555-5555-5555-5555-555555555555', name: 'Los Angeles' },
];

const MOCK_AREAS = [
  { id: 'a1111111-1111-1111-1111-111111111111', cityId: 'ct111111-1111-1111-1111-111111111111', name: 'Gulshan-e-Iqbal' },
  { id: 'a2222222-2222-2222-2222-222222222222', cityId: 'ct111111-1111-1111-1111-111111111111', name: 'Clifton & DHA' },
  { id: 'a3333333-3333-3333-3333-333333333333', cityId: 'ct333333-3333-3333-3333-333333333333', name: 'Gulberg & Model Town' },
  { id: 'a4444444-4444-4444-4444-444444444444', cityId: 'ct555555-5555-5555-5555-555555555555', name: 'Downtown & Civic Center' },
];

const DEFAULT_POSTAL_CODES: PostalCodeListItemDto[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    stateId: 's1111111-1111-1111-1111-111111111111',
    stateName: 'Sindh',
    cityId: 'ct111111-1111-1111-1111-111111111111',
    cityName: 'Karachi',
    areaId: 'a1111111-1111-1111-1111-111111111111',
    areaName: 'Gulshan-e-Iqbal',
    postalCode: '75300',
    description: 'Gulshan Block 1 to 13 General Post Office Delivery',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    stateId: 's1111111-1111-1111-1111-111111111111',
    stateName: 'Sindh',
    cityId: 'ct111111-1111-1111-1111-111111111111',
    areaId: 'a2222222-2222-2222-2222-222222222222',
    areaName: 'Clifton & DHA',
    postalCode: '75600',
    description: 'Clifton Post Office & DHA Commercial Area',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c1111111-1111-1111-1111-111111111111',
    countryName: 'Pakistan',
    stateId: 's2222222-2222-2222-2222-222222222222',
    stateName: 'Punjab',
    cityId: 'ct333333-3333-3333-3333-333333333333',
    cityName: 'Lahore',
    areaId: 'a3333333-3333-3333-3333-333333333333',
    areaName: 'Gulberg & Model Town',
    postalCode: '54660',
    description: 'Gulberg Central Campus District',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'p4444444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    countryId: 'c2222222-2222-2222-2222-222222222222',
    countryName: 'United States',
    stateId: 's5555555-5555-5555-5555-555555555555',
    stateName: 'California',
    cityId: 'ct555555-5555-5555-5555-555555555555',
    cityName: 'Los Angeles',
    areaId: 'a4444444-4444-4444-4444-444444444444',
    areaName: 'Downtown & Civic Center',
    postalCode: '90012',
    description: 'Downtown Los Angeles Main Center',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export default function PostalCodesPage() {
  const [postalCodesList, setPostalCodesList] = useState<PostalCodeListItemDto[]>(DEFAULT_POSTAL_CODES);
  const [countriesList] = useState(MOCK_COUNTRIES);
  const [statesList] = useState(MOCK_STATES);
  const [citiesList] = useState(MOCK_CITIES);
  const [areasList] = useState(MOCK_AREAS);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingPostalCode, setEditingPostalCode] = useState<PostalCodeListItemDto | null>(null);
  const [viewingPostalCode, setViewingPostalCode] = useState<PostalCodeListItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreatePostalCodeDto>({
    countryId: '',
    stateId: '',
    cityId: '',
    areaId: '',
    postalCode: '',
    description: '',
    isActive: true,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const totalCount = postalCodesList.length;
  const activeCount = useMemo(() => postalCodesList.filter((p) => p.isActive).length, [postalCodesList]);
  const inactiveCount = totalCount - activeCount;

  // Filter available cities for filter bar
  const filterCitiesOptions = useMemo(() => {
    if (countryFilter === 'ALL') return citiesList;
    return citiesList.filter((c) => c.countryId === countryFilter);
  }, [countryFilter, citiesList]);

  // Form cascading options
  const formStatesOptions = useMemo(() => {
    if (!formData.countryId) return [];
    return statesList.filter((s) => s.countryId === formData.countryId);
  }, [formData.countryId, statesList]);

  const formCitiesOptions = useMemo(() => {
    return citiesList.filter((c) => {
      if (formData.countryId && c.countryId !== formData.countryId) return false;
      if (formData.stateId && c.stateId !== formData.stateId) return false;
      return true;
    });
  }, [formData.countryId, formData.stateId, citiesList]);

  const formAreasOptions = useMemo(() => {
    if (!formData.cityId) return [];
    return areasList.filter((a) => a.cityId === formData.cityId);
  }, [formData.cityId, areasList]);

  const filteredPostalCodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return postalCodesList.filter((p) => {
      if (countryFilter !== 'ALL' && p.countryId !== countryFilter) return false;
      if (cityFilter !== 'ALL' && p.cityId !== cityFilter) return false;
      if (statusFilter !== 'ALL') {
        const wantActive = statusFilter === 'ACTIVE';
        if (p.isActive !== wantActive) return false;
      }
      if (!query) return true;
      return (
        p.postalCode.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.cityName && p.cityName.toLowerCase().includes(query)) ||
        (p.areaName && p.areaName.toLowerCase().includes(query)) ||
        (p.countryName && p.countryName.toLowerCase().includes(query))
      );
    });
  }, [postalCodesList, searchQuery, countryFilter, cityFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingPostalCode(null);
    const defaultCountry = countryFilter !== 'ALL' ? countryFilter : countriesList[0]?.id || '';
    const availableCities = citiesList.filter((c) => c.countryId === defaultCountry);
    const defaultCity = cityFilter !== 'ALL' ? cityFilter : availableCities[0]?.id || '';
    const matchedCity = citiesList.find((c) => c.id === defaultCity);

    setFormData({
      countryId: defaultCountry,
      stateId: matchedCity?.stateId || '',
      cityId: defaultCity,
      areaId: '',
      postalCode: '',
      description: '',
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (pc: PostalCodeListItemDto) => {
    setEditingPostalCode(pc);
    setFormData({
      countryId: pc.countryId,
      stateId: pc.stateId || '',
      cityId: pc.cityId,
      areaId: pc.areaId || '',
      postalCode: pc.postalCode,
      description: pc.description || '',
      isActive: pc.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openViewModal = (pc: PostalCodeListItemDto) => {
    setViewingPostalCode(pc);
    setIsViewModalOpen(true);
  };

  const handleToggleStatus = (pc: PostalCodeListItemDto) => {
    const updated = postalCodesList.map((p) =>
      p.id === pc.id ? { ...p, isActive: !p.isActive, updatedAt: new Date() } : p
    );
    setPostalCodesList(updated);
    showNotification(
      'success',
      `Postal code '${pc.postalCode}' ${pc.isActive ? 'deactivated' : 'activated'} successfully.`
    );
  };

  const handleCityChangeInForm = (newCityId: string) => {
    const matchedCity = citiesList.find((c) => c.id === newCityId);
    setFormData((prev) => ({
      ...prev,
      cityId: newCityId,
      countryId: matchedCity?.countryId || prev.countryId,
      stateId: matchedCity?.stateId || prev.stateId,
      areaId: '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.countryId) errors.countryId = 'Country is required.';
    if (!formData.cityId) errors.cityId = 'City is required.';
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal / ZIP code is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const parentCountry = countriesList.find((c) => c.id === formData.countryId);
      const parentState = statesList.find((s) => s.id === formData.stateId);
      const parentCity = citiesList.find((c) => c.id === formData.cityId);
      const parentArea = areasList.find((a) => a.id === formData.areaId);

      if (editingPostalCode) {
        setPostalCodesList((prev) =>
          prev.map((p) =>
            p.id === editingPostalCode.id
              ? {
                  ...p,
                  countryId: formData.countryId,
                  countryName: parentCountry?.name || p.countryName,
                  stateId: formData.stateId || null,
                  stateName: parentState?.name || null,
                  cityId: formData.cityId,
                  cityName: parentCity?.name || p.cityName,
                  areaId: formData.areaId || null,
                  areaName: parentArea?.name || null,
                  postalCode: formData.postalCode.trim(),
                  description: formData.description?.trim() || null,
                  isActive: formData.isActive ?? true,
                  updatedAt: new Date(),
                }
              : p
          )
        );
        showNotification('success', `Postal Code '${formData.postalCode}' updated successfully.`);
      } else {
        const newPC: PostalCodeListItemDto = {
          id: `p_${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          countryId: formData.countryId,
          countryName: parentCountry?.name,
          stateId: formData.stateId || null,
          stateName: parentState?.name || null,
          cityId: formData.cityId,
          cityName: parentCity?.name,
          areaId: formData.areaId || null,
          areaName: parentArea?.name || null,
          postalCode: formData.postalCode.trim(),
          description: formData.description?.trim() || null,
          isActive: formData.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setPostalCodesList((prev) => [...prev, newPC]);
        showNotification('success', `Postal Code '${formData.postalCode}' created successfully.`);
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
        title="Postal Codes"
        description="Manage postal/ZIP codes and delivery zone mappings across municipal operational areas."
        actionButtonText="+ Add Postal Code"
        onAction={openCreateModal}
      />

      {/* ── 2. KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl">
            📮
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Postal Codes</p>
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
            placeholder="Search by postal code, description, area, city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
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
                <th className="py-3 px-4">Postal / ZIP Code</th>
                <th className="py-3 px-4">Description / Coverage</th>
                <th className="py-3 px-4">Area / Zone</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPostalCodes.length > 0 ? (
                filteredPostalCodes.map((pc) => (
                  <tr key={pc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {pc.postalCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {pc.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {pc.areaName || 'All City Areas'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {pc.cityName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                        <span>🌍</span> {pc.countryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(pc)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          pc.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${pc.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{pc.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openViewModal(pc)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(pc)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(pc)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                            pc.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {pc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No postal codes found matching your search.
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
                  {editingPostalCode ? `Edit Postal Code: ${editingPostalCode.postalCode}` : 'Add Postal Code'}
                </h3>
                <p className="text-xs text-slate-500">Configure postal delivery ZIP code mapping under municipal city.</p>
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
                    onChange={(e) => setFormData({ ...formData, countryId: e.target.value, stateId: '', cityId: '', areaId: '' })}
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      State / Province
                    </label>
                    <select
                      value={formData.stateId || ''}
                      onChange={(e) => setFormData({ ...formData, stateId: e.target.value, cityId: '', areaId: '' })}
                      disabled={!formData.countryId}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                    >
                      <option value="">Select State (Optional)</option>
                      {formStatesOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.cityId}
                      onChange={(e) => handleCityChangeInForm(e.target.value)}
                      disabled={!formData.countryId}
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
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Area / Zone (Optional)
                  </label>
                  <select
                    value={formData.areaId || ''}
                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                    disabled={!formData.cityId}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  >
                    <option value="">All Areas in City</option>
                    {formAreasOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Postal / ZIP Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="e.g. 75300, 90012, SW1A 1AA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {formErrors.postalCode && <p className="text-rose-500 text-[10px]">{formErrors.postalCode}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Description / Locality Coverage
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Gulshan Block 1 to 13 General Post Office"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20"
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
                  {isSubmitting ? 'Saving...' : editingPostalCode ? 'Save Changes' : 'Create Postal Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. View Modal ─────────────────────────────────────────── */}
      {isViewModalOpen && viewingPostalCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {viewingPostalCode.postalCode}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingPostalCode.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {viewingPostalCode.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingPostalCode.description || viewingPostalCode.postalCode}</h3>
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
                    {viewingPostalCode.countryName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">City</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingPostalCode.cityName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">State / Province</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingPostalCode.stateName || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Area / Zone</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingPostalCode.areaName || 'All City Areas'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Postal Code</p>
                  <p className="text-base font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    {viewingPostalCode.postalCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Last Updated</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {new Date(viewingPostalCode.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewingPostalCode);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Edit Postal Code
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
