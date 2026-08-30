'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CountryListItemDto,
  CreateCountryDto,
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
import { Globe, CheckCircle2, AlertCircle, Search, RefreshCw } from 'lucide-react';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '99999999-9999-9999-9999-999999999999';

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryListItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryListItemDto | null>(null);
  const [viewingCountry, setViewingCountry] = useState<CountryListItemDto | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<CountryListItemDto | null>(null);
  const [deleteDeps, setDeleteDeps] = useState<GeographyDependenciesDto | null>(null);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Countries from real DB
  const loadCountries = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await fetch(`/api/geography/countries?${queryParams.toString()}`, {
        headers: {
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch countries: ${res.statusText}`);
      }
      const data = await res.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching countries:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  // Statistics
  const totalCount = countries.length;
  const activeCount = useMemo(() => countries.filter((c) => c.isActive).length, [countries]);
  const inactiveCount = totalCount - activeCount;

  // Open Form for Add
  const handleOpenAddModal = () => {
    setEditingCountry(null);
    setFormData({
      name: '',
      iso2: '',
      iso3: '',
      numericCode: '',
      dialCode: '',
      currencyCode: '',
      currencySymbol: '',
      nationality: '',
      sortOrder: (totalCount + 1) * 10,
      isActive: true,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (c: CountryListItemDto) => {
    setEditingCountry(c);
    setFormData({
      name: c.name,
      iso2: c.iso2,
      iso3: c.iso3 || '',
      numericCode: c.numericCode || '',
      dialCode: c.dialCode || '',
      currencyCode: c.currencyCode || '',
      currencySymbol: c.currencySymbol || '',
      nationality: c.nationality || '',
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // View Details
  const handleOpenViewModal = (c: CountryListItemDto) => {
    setViewingCountry(c);
  };

  // Toggle Status
  const handleToggleStatus = async (c: CountryListItemDto) => {
    try {
      const res = await fetch(`/api/geography/countries/${c.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (res.ok) {
        loadCountries();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = async (c: CountryListItemDto) => {
    setCountryToDelete(c);
    setIsDeleteModalOpen(true);
    setLoadingDeps(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/countries/${c.id}/dependencies`, {
        headers: {
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
      });
      if (res.ok) {
        const deps = await res.json();
        setDeleteDeps(deps);
      } else {
        throw new Error('Failed to inspect country dependencies');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error checking dependencies');
    } finally {
      setLoadingDeps(false);
    }
  };

  // Execute Safe Delete
  const handleConfirmDelete = async () => {
    if (!countryToDelete) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/geography/countries/${countryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': TENANT_ID,
          'x-user-id': USER_ID,
        },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to delete country');
      }
      setIsDeleteModalOpen(false);
      setCountryToDelete(null);
      loadCountries();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting country');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Submit (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Country name is required.';
    if (!formData.iso2?.trim()) errors.iso2 = 'ISO Alpha-2 code is required.';
    else if (formData.iso2.trim().length !== 2) errors.iso2 = 'ISO Alpha-2 code must be exactly 2 letters.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingCountry
        ? `/api/geography/countries/${editingCountry.id}`
        : '/api/geography/countries';
      const method = editingCountry ? 'PATCH' : 'POST';

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
        throw new Error(errJson.message || 'Failed to save country');
      }

      setIsFormModalOpen(false);
      loadCountries();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save country' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminConfigPageHeader
        title="Location & Geography — Sovereign Countries"
        description="Manage sovereign country masters, ISO codes, currencies, and global phone standards."
        categoryNav={LOCATION_GEOGRAPHY_NAV}
        actionButtonText="+ Add Country"
        onAction={handleOpenAddModal}
      />

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Sovereign Countries"
          value={totalCount}
          icon={<Globe className="w-5 h-5 text-indigo-500" />}
          variant="primary"
        />
        <StatCard
          label="Active Countries"
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
            placeholder="Search by country name, ISO, or dial code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
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
                <th className="py-3 px-4">Country Name</th>
                <th className="py-3 px-4">ISO-2 / ISO-3</th>
                <th className="py-3 px-4">Dial Code</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Nationality</th>
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
                      <span>Loading canonical countries...</span>
                    </div>
                  </td>
                </tr>
              ) : countries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No countries found matching your criteria.
                  </td>
                </tr>
              ) : (
                countries.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{c.sortOrder}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {c.iso2} {c.iso3 ? `(${c.iso3})` : ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {c.dialCode || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {c.currencyCode ? `${c.currencyCode} (${c.currencySymbol || ''})` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {c.nationality || '—'}
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
        title={editingCountry ? `Edit Country: ${editingCountry.name}` : 'Add Sovereign Country'}
        subtitle="Configure sovereign country ISO standards, dial codes, and currency."
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
                Country Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pakistan, United States"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
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
                placeholder="e.g. +92, +1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Numeric Code
              </label>
              <input
                type="text"
                value={formData.numericCode || ''}
                onChange={(e) => setFormData({ ...formData, numericCode: e.target.value })}
                placeholder="e.g. 586, 840"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Currency Code
              </label>
              <input
                type="text"
                maxLength={3}
                value={formData.currencyCode || ''}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })}
                placeholder="e.g. PKR, USD"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currencySymbol || ''}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="e.g. Rs, $, £"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality || ''}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="e.g. Pakistani, American"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
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
              {isSubmitting ? 'Saving...' : editingCountry ? 'Update Country' : 'Create Country'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ── 6. View Details Modal ──────────────────────────────────── */}
      {viewingCountry && (
        <AdminModal
          isOpen={!!viewingCountry}
          onClose={() => setViewingCountry(null)}
          title={`Country Details: ${viewingCountry.name}`}
          subtitle="Authoritative canonical sovereign country master record."
          maxWidth="lg"
        >
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ISO Alpha-2</span>
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{viewingCountry.iso2}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ISO Alpha-3</span>
                <span className="font-mono font-bold text-sm">{viewingCountry.iso3 || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Dial Code</span>
                <span className="font-mono font-bold text-sm">{viewingCountry.dialCode || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Numeric Code</span>
                <span className="font-mono font-bold text-sm">{viewingCountry.numericCode || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Currency</span>
                <span className="font-semibold text-sm">{viewingCountry.currencyCode ? `${viewingCountry.currencyCode} (${viewingCountry.currencySymbol || ''})` : '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nationality</span>
                <span className="font-semibold text-sm">{viewingCountry.nationality || '—'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Master Configuration</h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Record UUID:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all">{viewingCountry.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sort Order:</span>
                  <span className="font-semibold">{viewingCountry.sortOrder}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operational Status:</span>
                  <StatusBadge status={viewingCountry.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingCountry(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ── 7. Safe Delete Modal ────────────────────────────────────── */}
      {isDeleteModalOpen && countryToDelete && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete Country: ${countryToDelete.name}`}
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
                    <p className="text-[11px] mt-1">This country master has 0 active dependencies and can be safely deleted.</p>
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
