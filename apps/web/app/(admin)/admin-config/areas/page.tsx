'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaListItemDto,
  CreateAreaDto,
  CountryListItemDto,
  StateListItemDto,
  CityListItemDto,
  GeographyDependenciesDto,
} from '@campus-os/types';
import { AdminConfigPageHeader, LOCATION_GEOGRAPHY_NAV } from '../../../../components/AdminConfigPageHeader';
import {
  StatCard,
  StatusBadge,
  RowActions,
  ViewAction,
  EditAction,
  StatusAction,
  DeleteAction,
} from '../../../../design-system';
import { AdminModal } from '../../../../components/ui/AdminModal';
import { Compass, CheckCircle2, AlertCircle, Search, RefreshCw } from 'lucide-react';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '99999999-9999-9999-9999-999999999999';

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaListItemDto[]>([]);
  const [countries, setCountries] = useState<CountryListItemDto[]>([]);
  const [states, setStates] = useState<StateListItemDto[]>([]);
  const [cities, setCities] = useState<CityListItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaListItemDto | null>(null);
  const [viewingArea, setViewingArea] = useState<AreaListItemDto | null>(null);

  // Form Cascading states
  const [formStates, setFormStates] = useState<StateListItemDto[]>([]);
  const [formCities, setFormCities] = useState<CityListItemDto[]>([]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<AreaListItemDto | null>(null);
  const [deleteDeps, setDeleteDeps] = useState<GeographyDependenciesDto | null>(null);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Countries on Mount
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/geography/countries?status=ACTIVE', {
          headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setCountries(data);
        }
      } catch (err) {
        console.error('Failed to load countries:', err);
      }
    }
    loadCountries();
  }, []);

  // 2. Fetch States for Filter
  useEffect(() => {
    async function loadStatesForFilter() {
      if (countryFilter === 'ALL') {
        setStates([]);
        setCities([]);
        return;
      }
      try {
        const res = await fetch(`/api/geography/states?countryId=${countryFilter}&status=ACTIVE`, {
          headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setStates(data);
        }
      } catch (err) {
        console.error('Failed to load states for filter:', err);
      }
    }
    loadStatesForFilter();
  }, [countryFilter]);

  // 3. Fetch Cities for Filter
  useEffect(() => {
    async function loadCitiesForFilter() {
      if (countryFilter === 'ALL') {
        setCities([]);
        return;
      }
      const url = stateFilter !== 'ALL'
        ? `/api/geography/cities?countryId=${countryFilter}&stateId=${stateFilter}&status=ACTIVE`
        : `/api/geography/cities?countryId=${countryFilter}&status=ACTIVE`;

      try {
        const res = await fetch(url, {
          headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setCities(data);
        }
      } catch (err) {
        console.error('Failed to load cities for filter:', err);
      }
    }
    loadCitiesForFilter();
  }, [countryFilter, stateFilter]);

  // 4. Fetch Cascading States for Form
  const loadStatesForFormCountry = useCallback(async (cId: string) => {
    if (!cId) {
      setFormStates([]);
      setFormCities([]);
      return;
    }
    try {
      const res = await fetch(`/api/geography/states?countryId=${cId}&status=ACTIVE`, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setFormStates(data);
      }
    } catch (err) {
      console.error('Failed to load form states:', err);
    }
  }, []);

  // 5. Fetch Cascading Cities for Form
  const loadCitiesForFormState = useCallback(async (cId: string, sId: string) => {
    if (!cId) {
      setFormCities([]);
      return;
    }
    const url = sId
      ? `/api/geography/cities?countryId=${cId}&stateId=${sId}&status=ACTIVE`
      : `/api/geography/cities?countryId=${cId}&status=ACTIVE`;
    try {
      const res = await fetch(url, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setFormCities(data);
      }
    } catch (err) {
      console.error('Failed to load form cities:', err);
    }
  }, []);

  // 6. Fetch Areas from real DB
  const loadAreas = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (countryFilter !== 'ALL') queryParams.append('countryId', countryFilter);
      if (stateFilter !== 'ALL') queryParams.append('stateId', stateFilter);
      if (cityFilter !== 'ALL') queryParams.append('cityId', cityFilter);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await fetch(`/api/geography/areas?${queryParams.toString()}`, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });

      if (!res.ok) throw new Error(`Failed to fetch areas: ${res.statusText}`);
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching areas:', err);
    } finally {
      setLoading(false);
    }
  }, [countryFilter, stateFilter, cityFilter, searchQuery, statusFilter]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  // Stats
  const totalCount = areas.length;
  const activeCount = useMemo(() => areas.filter((a) => a.isActive).length, [areas]);
  const inactiveCount = totalCount - activeCount;

  // Open Form Add
  const handleOpenAddModal = async () => {
    setEditingArea(null);
    const defaultCountryId = countries.length > 0 ? countries[0]?.id || '' : '';
    setFormData({
      countryId: countryFilter !== 'ALL' ? countryFilter : defaultCountryId,
      stateId: stateFilter !== 'ALL' ? stateFilter : '',
      cityId: cityFilter !== 'ALL' ? cityFilter : '',
      name: '',
      code: '',
      postalCode: '',
      sortOrder: (totalCount + 1) * 10,
      isActive: true,
    });
    setFormErrors({});
    if (defaultCountryId || countryFilter !== 'ALL') {
      const cId = countryFilter !== 'ALL' ? countryFilter : defaultCountryId;
      await loadStatesForFormCountry(cId);
      if (stateFilter !== 'ALL') {
        await loadCitiesForFormState(cId, stateFilter);
      }
    }
    setIsFormModalOpen(true);
  };

  // Open Form Edit
  const handleOpenEditModal = async (a: AreaListItemDto) => {
    setEditingArea(a);
    setFormData({
      countryId: a.countryId,
      stateId: a.stateId,
      cityId: a.cityId,
      name: a.name,
      code: a.code || '',
      postalCode: a.postalCode || '',
      sortOrder: a.sortOrder,
      isActive: a.isActive,
    });
    setFormErrors({});
    await loadStatesForFormCountry(a.countryId);
    await loadCitiesForFormState(a.countryId, a.stateId);
    setIsFormModalOpen(true);
  };

  // View Details
  const handleOpenViewModal = (a: AreaListItemDto) => {
    setViewingArea(a);
  };

  // Toggle Status
  const handleToggleStatus = async (a: AreaListItemDto) => {
    try {
      const res = await fetch(`/api/geography/areas/${a.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      if (res.ok) loadAreas();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = async (a: AreaListItemDto) => {
    setAreaToDelete(a);
    setIsDeleteModalOpen(true);
    setLoadingDeps(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/areas/${a.id}/dependencies`, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (res.ok) {
        const deps = await res.json();
        setDeleteDeps(deps);
      } else {
        throw new Error('Failed to inspect area dependencies');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error checking dependencies');
    } finally {
      setLoadingDeps(false);
    }
  };

  // Execute Safe Delete
  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/areas/${areaToDelete.id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to delete area');
      }
      setIsDeleteModalOpen(false);
      setAreaToDelete(null);
      loadAreas();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting area');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.countryId) errors.countryId = 'Parent country is required.';
    if (!formData.stateId) errors.stateId = 'Parent state/province is required.';
    if (!formData.cityId) errors.cityId = 'Parent city is required.';
    if (!formData.name?.trim()) errors.name = 'Area/Zone name is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingArea
        ? `/api/geography/areas/${editingArea.id}`
        : '/api/geography/areas';
      const method = editingArea ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save area');
      }

      setIsFormModalOpen(false);
      loadAreas();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save area' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminConfigPageHeader
        title="Location & Geography — Areas & Zones"
        description="Manage 3rd-level municipal sectors, neighborhoods, and postal code mappings."
        categoryNav={LOCATION_GEOGRAPHY_NAV}
        actionButtonText="+ Add Area / Sector"
        onAction={handleOpenAddModal}
      />

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Areas / Sectors"
          value={totalCount}
          icon={<Compass className="w-5 h-5 text-indigo-500" />}
          variant="primary"
        />
        <StatCard
          label="Active Areas"
          value={activeCount}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          variant="success"
        />
        <StatCard
          label="Inactive / Archived"
          value={inactiveCount}
          icon={<AlertCircle className="w-5 h-5 text-slate-400" />}
          variant="default"
        />
      </div>

      {/* 3. Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by area name, code, postal code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setStateFilter('ALL');
              setCityFilter('ALL');
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.iso2})
              </option>
            ))}
          </select>

          {states.length > 0 && (
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCityFilter('ALL');
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All States</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Cities</option>
              {cities.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Sort</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">State / Province</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Area / Sector Name</th>
                <th className="py-3 px-4">Postal Code</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading areas...</span>
                    </div>
                  </td>
                </tr>
              ) : areas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No areas/sectors found matching your criteria.
                  </td>
                </tr>
              ) : (
                areas.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{a.sortOrder}</td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{a.countryName || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{a.stateName || '—'}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{a.cityName || '—'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {a.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {a.postalCode || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(a)}
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        <StatusBadge status={a.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <RowActions>
                        <ViewAction onClick={() => handleOpenViewModal(a)} />
                        <EditAction onClick={() => handleOpenEditModal(a)} />
                        <StatusAction
                          status={a.isActive ? 'ACTIVE' : 'INACTIVE'}
                          onClick={() => handleToggleStatus(a)}
                        />
                        <DeleteAction onClick={() => handleOpenDeleteModal(a)} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Add / Edit Modal ────────────────────────────────────── */}
      <AdminModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingArea ? `Edit Area/Sector: ${editingArea.name}` : 'Add Area / Sector'}
        subtitle="Link municipal area/sector to country, state, and city."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
          {formErrors.submit && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400">
              {formErrors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Country <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.countryId}
                onChange={async (e) => {
                  const newCountryId = e.target.value;
                  setFormData({ ...formData, countryId: newCountryId, stateId: '', cityId: '' });
                  await loadStatesForFormCountry(newCountryId);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.iso2})
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
                onChange={async (e) => {
                  const newStateId = e.target.value;
                  setFormData({ ...formData, stateId: newStateId, cityId: '' });
                  await loadCitiesForFormState(formData.countryId, newStateId);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">Select State</option>
                {formStates.map((s) => (
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">Select City</option>
                {formCities.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
              {formErrors.cityId && <p className="text-rose-500 text-[10px]">{formErrors.cityId}</p>}
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Area / Sector Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Gulshan-e-Iqbal, Clifton, Sector F-6"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              {formErrors.name && <p className="text-rose-500 text-[10px]">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Postal / ZIP Code
              </label>
              <input
                type="text"
                value={formData.postalCode || ''}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="e.g. 75300, 44000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Area Code
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. GIQ, CLF"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sortOrder || 1}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingArea ? 'Update Area' : 'Create Area'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ── 6. View Details Modal ──────────────────────────────────── */}
      {viewingArea && (
        <AdminModal
          isOpen={!!viewingArea}
          onClose={() => setViewingArea(null)}
          title={`Area Details: ${viewingArea.name}`}
          subtitle="Authoritative canonical area/sector master record."
          maxWidth="lg"
        >
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Parent Country</span>
                <span className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">{viewingArea.countryName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">State / Province</span>
                <span className="font-semibold text-sm">{viewingArea.stateName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">City</span>
                <span className="font-semibold text-sm">{viewingArea.cityName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Postal Code</span>
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{viewingArea.postalCode || '—'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Master Configuration</h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Record UUID:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all">{viewingArea.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sort Order:</span>
                  <span className="font-semibold">{viewingArea.sortOrder}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operational Status:</span>
                  <StatusBadge status={viewingArea.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingArea(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ── 7. Safe Delete Modal ────────────────────────────────────── */}
      {isDeleteModalOpen && areaToDelete && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete Area/Sector: ${areaToDelete.name}`}
          subtitle="Dependency breakdown check before deletion."
          maxWidth="md"
        >
          <div className="p-6 space-y-4 text-xs">
            {loadingDeps ? (
              <div className="py-8 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500 mb-2" />
                <span>Checking linked records and dependencies...</span>
              </div>
            ) : deleteDeps ? (
              <>
                {deleteDeps.canDelete ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200">
                    <p className="font-semibold">Safe to Delete</p>
                    <p className="text-[11px] mt-1">This area master has 0 active dependencies and can be safely deleted.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Deletion Blocked — Active Dependencies Exist</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      {deleteDeps.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {deleteError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400">
                    {deleteError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={!deleteDeps.canDelete || isSubmitting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl disabled:opacity-40"
                  >
                    {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
