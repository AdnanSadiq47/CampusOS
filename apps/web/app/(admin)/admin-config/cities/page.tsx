'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CityListItemDto,
  CreateCityDto,
  CountryListItemDto,
  StateListItemDto,
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
import { Building, CheckCircle2, AlertCircle, Search, RefreshCw } from 'lucide-react';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '99999999-9999-9999-9999-999999999999';

export default function CitiesPage() {
  const [cities, setCities] = useState<CityListItemDto[]>([]);
  const [countries, setCountries] = useState<CountryListItemDto[]>([]);
  const [states, setStates] = useState<StateListItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityListItemDto | null>(null);
  const [viewingCity, setViewingCity] = useState<CityListItemDto | null>(null);

  // Form Cascading states
  const [formStates, setFormStates] = useState<StateListItemDto[]>([]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<CityListItemDto | null>(null);
  const [deleteDeps, setDeleteDeps] = useState<GeographyDependenciesDto | null>(null);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateCityDto>({
    countryId: '',
    stateId: '',
    name: '',
    code: '',
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

  // 3. Fetch States for Form Modal
  const loadStatesForCountry = useCallback(async (cId: string) => {
    if (!cId) {
      setFormStates([]);
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

  // 4. Fetch Cities from real DB
  const loadCities = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (countryFilter !== 'ALL') queryParams.append('countryId', countryFilter);
      if (stateFilter !== 'ALL') queryParams.append('stateId', stateFilter);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await fetch(`/api/geography/cities?${queryParams.toString()}`, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });

      if (!res.ok) throw new Error(`Failed to fetch cities: ${res.statusText}`);
      const data = await res.json();
      setCities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  }, [countryFilter, stateFilter, searchQuery, statusFilter]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  // Stats
  const totalCount = cities.length;
  const activeCount = useMemo(() => cities.filter((c) => c.isActive).length, [cities]);
  const inactiveCount = totalCount - activeCount;

  // Open Form Add
  const handleOpenAddModal = async () => {
    setEditingCity(null);
    const defaultCountryId = countries.length > 0 ? countries[0]?.id || '' : '';
    setFormData({
      countryId: countryFilter !== 'ALL' ? countryFilter : defaultCountryId,
      stateId: stateFilter !== 'ALL' ? stateFilter : '',
      name: '',
      code: '',
      sortOrder: (totalCount + 1) * 10,
      isActive: true,
    });
    setFormErrors({});
    if (defaultCountryId || countryFilter !== 'ALL') {
      await loadStatesForCountry(countryFilter !== 'ALL' ? countryFilter : defaultCountryId);
    }
    setIsFormModalOpen(true);
  };

  // Open Form Edit
  const handleOpenEditModal = async (c: CityListItemDto) => {
    setEditingCity(c);
    setFormData({
      countryId: c.countryId,
      stateId: c.stateId,
      name: c.name,
      code: c.code || '',
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setFormErrors({});
    await loadStatesForCountry(c.countryId);
    setIsFormModalOpen(true);
  };

  // View Details
  const handleOpenViewModal = (c: CityListItemDto) => {
    setViewingCity(c);
  };

  // Toggle Status
  const handleToggleStatus = async (c: CityListItemDto) => {
    try {
      const res = await fetch(`/api/geography/cities/${c.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (res.ok) loadCities();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = async (c: CityListItemDto) => {
    setCityToDelete(c);
    setIsDeleteModalOpen(true);
    setLoadingDeps(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/cities/${c.id}/dependencies`, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (res.ok) {
        const deps = await res.json();
        setDeleteDeps(deps);
      } else {
        throw new Error('Failed to inspect city dependencies');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error checking dependencies');
    } finally {
      setLoadingDeps(false);
    }
  };

  // Execute Safe Delete
  const handleConfirmDelete = async () => {
    if (!cityToDelete) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/cities/${cityToDelete.id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to delete city');
      }
      setIsDeleteModalOpen(false);
      setCityToDelete(null);
      loadCities();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting city');
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
    if (!formData.name?.trim()) errors.name = 'City name is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingCity
        ? `/api/geography/cities/${editingCity.id}`
        : '/api/geography/cities';
      const method = editingCity ? 'PATCH' : 'POST';

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
        throw new Error(errJson.message || 'Failed to save city');
      }

      setIsFormModalOpen(false);
      loadCities();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save city' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminConfigPageHeader
        title="Location & Geography — Cities Master"
        description="Manage 2nd-level administrative divisions linked hierarchically to Country and State."
        categoryNav={LOCATION_GEOGRAPHY_NAV}
        actionButtonText="+ Add City"
        onAction={handleOpenAddModal}
      />

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Municipal Cities"
          value={totalCount}
          icon={<Building className="w-5 h-5 text-indigo-500" />}
          variant="primary"
        />
        <StatCard
          label="Active Cities"
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
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city name or code..."
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
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All States / Provinces</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
                <th className="py-3 px-4">Parent Country</th>
                <th className="py-3 px-4">Parent State/Province</th>
                <th className="py-3 px-4">City Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading cities...</span>
                    </div>
                  </td>
                </tr>
              ) : cities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No cities found matching your criteria.
                  </td>
                </tr>
              ) : (
                cities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{c.sortOrder}</td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{c.countryName || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.stateName || '—'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {c.code || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <RowActions>
                        <ViewAction onClick={() => handleOpenViewModal(c)} />
                        <EditAction onClick={() => handleOpenEditModal(c)} />
                        <StatusAction
                          status={c.isActive ? 'ACTIVE' : 'INACTIVE'}
                          onClick={() => handleToggleStatus(c)}
                        />
                        <DeleteAction onClick={() => handleOpenDeleteModal(c)} />
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
        title={editingCity ? `Edit City: ${editingCity.name}` : 'Add Municipal City'}
        subtitle="Link municipal city authority to country and state/province."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
          {formErrors.submit && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400">
              {formErrors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Parent Country <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.countryId}
                onChange={async (e) => {
                  const newCountryId = e.target.value;
                  setFormData({ ...formData, countryId: newCountryId, stateId: '' });
                  await loadStatesForCountry(newCountryId);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">Select Sovereign Country</option>
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
                Parent State / Province <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.stateId}
                onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">Select State / Province</option>
                {formStates.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {formErrors.stateId && <p className="text-rose-500 text-[10px]">{formErrors.stateId}</p>}
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                City Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Karachi, Lahore, Islamabad"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              {formErrors.name && <p className="text-rose-500 text-[10px]">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                City Code
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. KHI, LHE, ISB"
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
              {isSubmitting ? 'Saving...' : editingCity ? 'Update City' : 'Create City'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ── 6. View Details Modal ──────────────────────────────────── */}
      {viewingCity && (
        <AdminModal
          isOpen={!!viewingCity}
          onClose={() => setViewingCity(null)}
          title={`City Details: ${viewingCity.name}`}
          subtitle="Authoritative canonical city master record."
          maxWidth="lg"
        >
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Parent Country</span>
                <span className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">{viewingCity.countryName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">State / Province</span>
                <span className="font-semibold text-sm">{viewingCity.stateName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">City Code</span>
                <span className="font-mono font-bold text-sm">{viewingCity.code || '—'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Master Configuration</h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Record UUID:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all">{viewingCity.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sort Order:</span>
                  <span className="font-semibold">{viewingCity.sortOrder}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operational Status:</span>
                  <StatusBadge status={viewingCity.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingCity(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ── 7. Safe Delete Modal ────────────────────────────────────── */}
      {isDeleteModalOpen && cityToDelete && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete City: ${cityToDelete.name}`}
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
                    <p className="text-[11px] mt-1">This city master has 0 active dependencies and can be safely deleted.</p>
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
