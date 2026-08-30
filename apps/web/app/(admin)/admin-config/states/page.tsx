'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StateListItemDto,
  CreateStateDto,
  CountryListItemDto,
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
import { Map, CheckCircle2, AlertCircle, Search, RefreshCw } from 'lucide-react';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '99999999-9999-9999-9999-999999999999';

export default function StatesPage() {
  const [states, setStates] = useState<StateListItemDto[]>([]);
  const [countries, setCountries] = useState<CountryListItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateListItemDto | null>(null);
  const [viewingState, setViewingState] = useState<StateListItemDto | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stateToDelete, setStateToDelete] = useState<StateListItemDto | null>(null);
  const [deleteDeps, setDeleteDeps] = useState<GeographyDependenciesDto | null>(null);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateStateDto>({
    countryId: '',
    name: '',
    code: '',
    type: 'Province',
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

  // 2. Fetch States from real DB
  const loadStates = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (countryFilter !== 'ALL') queryParams.append('countryId', countryFilter);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await fetch(`/api/geography/states?${queryParams.toString()}`, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });

      if (!res.ok) throw new Error(`Failed to fetch states: ${res.statusText}`);
      const data = await res.json();
      setStates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching states:', err);
    } finally {
      setLoading(false);
    }
  }, [countryFilter, searchQuery, statusFilter]);

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  // Stats
  const totalCount = states.length;
  const activeCount = useMemo(() => states.filter((s) => s.isActive).length, [states]);
  const inactiveCount = totalCount - activeCount;

  // Open Form Add
  const handleOpenAddModal = () => {
    setEditingState(null);
    const defaultCountryId = countries.length > 0 ? countries[0]?.id || '' : '';
    setFormData({
      countryId: countryFilter !== 'ALL' ? countryFilter : defaultCountryId,
      name: '',
      code: '',
      type: 'Province',
      sortOrder: (totalCount + 1) * 10,
      isActive: true,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Form Edit
  const handleOpenEditModal = (s: StateListItemDto) => {
    setEditingState(s);
    setFormData({
      countryId: s.countryId,
      name: s.name,
      code: s.code || '',
      type: s.type || 'Province',
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // View Details
  const handleOpenViewModal = (s: StateListItemDto) => {
    setViewingState(s);
  };

  // Toggle Status
  const handleToggleStatus = async (s: StateListItemDto) => {
    try {
      const res = await fetch(`/api/geography/states/${s.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (res.ok) loadStates();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = async (s: StateListItemDto) => {
    setStateToDelete(s);
    setIsDeleteModalOpen(true);
    setLoadingDeps(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/states/${s.id}/dependencies`, {
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (res.ok) {
        const deps = await res.json();
        setDeleteDeps(deps);
      } else {
        throw new Error('Failed to inspect state dependencies');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error checking dependencies');
    } finally {
      setLoadingDeps(false);
    }
  };

  // Execute Safe Delete
  const handleConfirmDelete = async () => {
    if (!stateToDelete) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/states/${stateToDelete.id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': TENANT_ID, 'x-user-id': USER_ID },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to delete state');
      }
      setIsDeleteModalOpen(false);
      setStateToDelete(null);
      loadStates();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting state');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.countryId) errors.countryId = 'Parent country is required.';
    if (!formData.name?.trim()) errors.name = 'State/Province name is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingState
        ? `/api/geography/states/${editingState.id}`
        : '/api/geography/states';
      const method = editingState ? 'PATCH' : 'POST';

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
        throw new Error(errJson.message || 'Failed to save state');
      }

      setIsFormModalOpen(false);
      loadStates();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save state' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminConfigPageHeader
        title="Location & Geography — States & Provinces"
        description="Manage 1st-level administrative divisions linked authority to sovereign countries."
        categoryNav={LOCATION_GEOGRAPHY_NAV}
        actionButtonText="+ Add State / Province"
        onAction={handleOpenAddModal}
      />

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total States / Provinces"
          value={totalCount}
          icon={<Map className="w-5 h-5 text-indigo-500" />}
          variant="primary"
        />
        <StatCard
          label="Active States"
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
            placeholder="Search by state name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.iso2})
              </option>
            ))}
          </select>

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
                <th className="py-3 px-4">State / Province Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
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
                      <span>Loading states...</span>
                    </div>
                  </td>
                </tr>
              ) : states.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No states/provinces found matching your criteria.
                  </td>
                </tr>
              ) : (
                states.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{s.sortOrder}</td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {s.countryName || '—'} {s.countryIso2 ? `(${s.countryIso2})` : ''}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Map className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {s.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {s.code || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.type}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s)}
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <RowActions>
                        <ViewAction onClick={() => handleOpenViewModal(s)} />
                        <EditAction onClick={() => handleOpenEditModal(s)} />
                        <StatusAction
                          status={s.isActive ? 'ACTIVE' : 'INACTIVE'}
                          onClick={() => handleToggleStatus(s)}
                        />
                        <DeleteAction onClick={() => handleOpenDeleteModal(s)} />
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
        title={editingState ? `Edit State/Province: ${editingState.name}` : 'Add State / Province'}
        subtitle="Link 1st-level administrative division to a canonical sovereign country."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
          {formErrors.submit && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400">
              {formErrors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Parent Country <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
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

            <div className="sm:col-span-2 space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                State / Province Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sindh, Punjab, California"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              {formErrors.name && <p className="text-rose-500 text-[10px]">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                State Code
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SD, PB, CA"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Division Type
              </label>
              <select
                value={formData.type || 'Province'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="Province">Province</option>
                <option value="State">State</option>
                <option value="Territory">Territory</option>
                <option value="Emirate">Emirate</option>
                <option value="Governorate">Governorate</option>
                <option value="Region">Region</option>
              </select>
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
              {isSubmitting ? 'Saving...' : editingState ? 'Update State' : 'Create State'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ── 6. View Details Modal ──────────────────────────────────── */}
      {viewingState && (
        <AdminModal
          isOpen={!!viewingState}
          onClose={() => setViewingState(null)}
          title={`State/Province Details: ${viewingState.name}`}
          subtitle="Authoritative canonical state/province master record."
          maxWidth="lg"
        >
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Parent Country</span>
                <span className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">{viewingState.countryName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Division Code</span>
                <span className="font-mono font-bold text-sm">{viewingState.code || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Division Type</span>
                <span className="font-semibold text-sm">{viewingState.type}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Master Configuration</h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Record UUID:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all">{viewingState.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sort Order:</span>
                  <span className="font-semibold">{viewingState.sortOrder}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operational Status:</span>
                  <StatusBadge status={viewingState.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingState(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ── 7. Safe Delete Modal ────────────────────────────────────── */}
      {isDeleteModalOpen && stateToDelete && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete State/Province: ${stateToDelete.name}`}
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
                    <p className="text-[11px] mt-1">This state master has 0 active dependencies and can be safely deleted.</p>
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
