'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RegionListItemDto,
  EligibleRegionParentNodeDto,
  CreateRegionDto,
  RegionDependenciesDto,
  ProvisionAccountDto,
} from '@campus-os/types';
import { AdminConfigPageHeader, ORGANIZATION_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { GeographyLocationFields } from '../../../../components/GeographySelectors';
import { AdminModal } from '../../../../components/ui/AdminModal';
import { ConnectedUnitsModal } from '../../../../components/ConnectedUnitsModal';
import { usePermissions } from '../../../../lib/permissions';
import { validateSingleField, SemanticDataType } from '../../../../lib/form-validation';
import {
  StatCard,
  StatusBadge,
  ConnectedCountPill,
  RowActions,
  ViewAction,
  EditAction,
  DeleteAction,
} from '../../../../design-system';
import { Globe, CheckCircle2, Clock, School } from 'lucide-react';
import { FormattedPhone, useContactPlaceholders } from '../../../../components/DisplayFormatters';

/* ─── Toast Notification ─────────────────────────────────────── */
function Toast({
  notification,
}: {
  notification: { type: 'success' | 'error'; message: string } | null;
}) {
  if (!notification) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 ${
        notification.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          : 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
      }`}
    >
      <span className="text-lg">{notification.type === 'success' ? '✅' : '❌'}</span>
      {notification.message}
    </div>
  );
}

export default function RegionsPage() {
  const contactPlaceholders = useContactPlaceholders({ schoolId: null });
  const {
    permissions,
    canCreateRegion,
    canViewRegion,
    canEditRegion,
    canChangeStatusRegion,
    canDeleteRegion,
  } = usePermissions();

  const [regions, setRegions] = useState<RegionListItemDto[]>([]);
  const [parents, setParents] = useState<EligibleRegionParentNodeDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [parentFilter, setParentFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingRegion, setEditingRegion] = useState<RegionListItemDto | null>(null);
  const [viewingRegion, setViewingRegion] = useState<RegionListItemDto | null>(null);
  const [connectedUnitsRegion, setConnectedUnitsRegion] = useState<RegionListItemDto | null>(null);
  const [deletingRegion, setDeletingRegion] = useState<RegionListItemDto | null>(null);
  const [regionDependencies, setRegionDependencies] = useState<RegionDependenciesDto | null>(null);
  const [isCheckingDeps, setIsCheckingDeps] = useState<boolean>(false);

  const [formTab, setFormTab] = useState<'basic' | 'contact' | 'location' | 'account'>('basic');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<CreateRegionDto>({
    name: '',
    code: '',
    parentId: '',
    shortName: '',
    directorName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    country: 'Pakistan',
    province: '',
    city: '',
    area: '',
    address: '',
    postalCode: '',
    countryId: '',
    stateId: '',
    cityId: '',
    areaId: '',
    notes: '',
    isActive: true,
  });

  const [accountData, setAccountData] = useState<ProvisionAccountDto>({
    email: '',
    temporaryPassword: '',
    roleCode: 'REGION_ADMIN',
    isActive: true,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getHeaders = useCallback(() => ({
    'x-tenant-id': '11111111-1111-1111-1111-111111111111',
    'x-user-id': '99999999-9999-9999-9999-999999999999',
    'x-user-permissions': permissions.join(','),
  }), [permissions]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [regRes, parRes] = await Promise.all([
        fetch('/api/regions', { headers: getHeaders() }),
        fetch('/api/regions/parents', { headers: getHeaders() }),
      ]);

      if (regRes.ok) {
        const data = await regRes.json();
        setRegions(Array.isArray(data) ? data : []);
      }
      if (parRes.ok) {
        const parData = await parRes.json();
        setParents(Array.isArray(parData) ? parData : []);
      }
    } catch {
      showToast('error', 'Failed to load regional data from database');
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch dependencies when deletingRegion is selected
  useEffect(() => {
    if (deletingRegion) {
      setIsCheckingDeps(true);
      fetch(`/api/regions/${deletingRegion.id}/dependencies`, {
        headers: getHeaders(),
      })
        .then((res) => res.json())
        .then((data: RegionDependenciesDto) => {
          setRegionDependencies(data);
        })
        .catch(() => {
          setRegionDependencies(null);
        })
        .finally(() => {
          setIsCheckingDeps(false);
        });
    } else {
      setRegionDependencies(null);
    }
  }, [deletingRegion, getHeaders]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      parentId: parents[0]?.id || '',
      shortName: '',
      directorName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      website: '',
      country: 'Pakistan',
      province: '',
      city: '',
      area: '',
      address: '',
      postalCode: '',
      countryId: '',
      stateId: '',
      cityId: '',
      areaId: '',
      notes: '',
      isActive: true,
    });
    setAccountData({
      email: '',
      temporaryPassword: '',
      roleCode: 'REGION_ADMIN',
      isActive: true,
    });
    setFormErrors({});
    setFormTab('basic');
    setEditingRegion(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (region: RegionListItemDto) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      code: region.code,
      parentId: region.parentId || '',
      shortName: region.shortName || '',
      directorName: region.directorName || '',
      email: region.email || '',
      phone: region.phone || '',
      alternatePhone: region.alternatePhone || '',
      website: region.website || '',
      country: region.country || 'Pakistan',
      province: region.province || '',
      city: region.city || '',
      area: region.area || '',
      address: region.address || '',
      postalCode: region.postalCode || '',
      countryId: region.countryId || '',
      stateId: region.stateId || '',
      cityId: region.cityId || '',
      areaId: region.areaId || '',
      notes: region.notes || '',
      isActive: region.isActive,
    });
    setAccountData({
      email: region.linkedAccount?.email || region.email || '',
      temporaryPassword: '',
      roleCode: region.linkedAccount?.roleCode || 'REGION_ADMIN',
      isActive: region.linkedAccount ? region.linkedAccount.isActive : true,
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  const filteredRegions = useMemo(() => {
    return regions.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.directorName && r.directorName.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && r.isActive) ||
        (statusFilter === 'INACTIVE' && !r.isActive);

      const matchesParent =
        parentFilter === 'ALL' || r.parentId === parentFilter;

      return matchesSearch && matchesStatus && matchesParent;
    });
  }, [regions, searchQuery, statusFilter, parentFilter]);

  const kpis = useMemo(() => {
    const total = regions.length;
    const active = regions.filter((r) => r.isActive).length;
    const totalSchools = regions.reduce((sum, r) => sum + (r.schoolCount || 0), 0);
    return { total, active, inactive: total - active, totalSchools };
  }, [regions]);

  // Field Blur Validation
  const handleFieldBlur = (field: string, type: SemanticDataType, value: unknown, required = false) => {
    const err = validateSingleField(type, value, required);
    if (err) {
      setFormErrors((prev) => ({ ...prev, [field]: err }));
    } else {
      setFormErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Region Name is required';
    if (!editingRegion && !formData.code.trim()) errors.code = 'Region Code is required';
    if (!editingRegion && !formData.parentId) errors.parentId = 'Parent Head Office is required';

    if (formData.email?.trim()) {
      const emailErr = validateSingleField('EMAIL', formData.email);
      if (emailErr) errors.email = emailErr;
    }
    if (formData.phone?.trim()) {
      const phoneErr = validateSingleField('PHONE', formData.phone);
      if (phoneErr) errors.phone = phoneErr;
    }
    if (formData.alternatePhone?.trim()) {
      const altPhoneErr = validateSingleField('PHONE', formData.alternatePhone);
      if (altPhoneErr) errors.alternatePhone = altPhoneErr;
    }
    if (formData.website?.trim()) {
      const urlErr = validateSingleField('URL', formData.website);
      if (urlErr) errors.website = urlErr;
    }
    if (accountData.email?.trim()) {
      const accEmailErr = validateSingleField('EMAIL', accountData.email);
      if (accEmailErr) errors.accountEmail = accEmailErr;
    }

    setFormErrors(errors);

    // Auto-focus tab with errors
    if (errors.name || errors.code || errors.parentId) setFormTab('basic');
    else if (errors.email || errors.phone || errors.alternatePhone || errors.website) setFormTab('contact');
    else if (errors.accountEmail) setFormTab('account');

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const accountPayload = accountData.email?.trim()
        ? {
            email: accountData.email.trim().toLowerCase(),
            temporaryPassword: accountData.temporaryPassword?.trim() || undefined,
            roleCode: accountData.roleCode || 'REGION_ADMIN',
            isActive: accountData.isActive ?? true,
          }
        : undefined;

      if (editingRegion) {
        const res = await fetch(`/api/regions/${editingRegion.id}`, {
          method: 'PATCH',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            account: accountPayload,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast('error', data.message || 'Failed to update regional office');
          return;
        }
        showToast('success', `Regional Office '${formData.name}' updated successfully.`);
      } else {
        const res = await fetch('/api/regions', {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            account: accountPayload,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast('error', data.message || 'Failed to create regional office');
          return;
        }
        showToast('success', `Regional Office '${formData.name}' created successfully.`);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch {
      showToast('error', 'Error saving regional office to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (region: RegionListItemDto) => {
    const nextStatus = !region.isActive;
    try {
      const res = await fetch(`/api/regions/${region.id}/status`, {
        method: 'PATCH',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (res.ok) {
        showToast('success', `Region '${region.name}' is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`);
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.message || 'Failed to toggle region status');
      }
    } catch {
      showToast('error', 'Network error toggling status');
    }
  };

  const handleDeleteRegion = async () => {
    if (!deletingRegion) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/regions/${deletingRegion.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('success', data.message || `Region '${deletingRegion.name}' deleted successfully.`);
        setDeletingRegion(null);
        await fetchData();
      } else {
        showToast('error', data.message || 'Region cannot be deleted due to dependencies.');
      }
    } catch {
      showToast('error', 'Network error deleting region');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toast notification={notification} />

      <AdminConfigPageHeader
        group="Organization Setup"
        title="Regional Offices"
        description="Manage regional directorates, intermediate governance layers, and territorial divisions."
        categoryNav={ORGANIZATION_SETUP_NAV}
        actionButtonText={canCreateRegion ? 'Add Regional Office' : undefined}
        onAction={canCreateRegion ? handleOpenAddModal : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Regional Offices" value={kpis.total} icon={<Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />} variant="default" />
        <StatCard title="Active Regions" value={kpis.active} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} variant="success" />
        <StatCard title="Inactive Regions" value={kpis.inactive} icon={<Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />} variant="default" />
        <StatCard title="Total Schools Supervised" value={kpis.totalSchools} icon={<School className="w-5 h-5 text-blue-600 dark:text-blue-400" />} variant="info" />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search regions by code, name, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Parent Units</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData()}
            title="Refresh list"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-xs">Loading Regional Offices from PostgreSQL...</p>
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-3xl">🌐</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Regional Offices Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No regional offices exist or match your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Region Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Parent Head Office</th>
                  <th className="py-3.5 px-4">Director / Head</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Connected Units</th>
                  <th className="py-3.5 px-4">Linked Account</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                {filteredRegions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>🌐</span>
                        <span>{r.name}</span>
                      </div>
                      {r.shortName && <div className="text-[11px] text-slate-400 ml-6">{r.shortName}</div>}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {r.code}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>🏢 {r.parentName || 'Head Office'}</div>
                      {r.parentCode && <div className="text-[10px] text-slate-400">({r.parentCode})</div>}
                    </td>

                    <td className="py-3 px-4">
                      <div>{r.directorName || '—'}</div>
                      {r.email && <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{r.email}</div>}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{[r.city, r.province].filter(Boolean).join(', ') || '—'}</div>
                      <div className="text-[11px] text-slate-400">{r.country || 'Pakistan'}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <ConnectedCountPill
                        count={r.schoolCount ?? 0}
                        label="Connected Schools"
                        onClick={() => setConnectedUnitsRegion(r)}
                      />
                    </td>

                    <td className="py-3 px-4">
                      {r.linkedAccount ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {r.linkedAccount.email}
                          </div>
                          <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                            {r.linkedAccount.roleCode || 'REGION_ADMIN'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unlinked</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(r)}
                        disabled={!canChangeStatusRegion}
                        className={!canChangeStatusRegion ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                      >
                        <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <RowActions>
                        {canViewRegion && (
                          <ViewAction
                            onClick={() => {
                              setViewingRegion(r);
                              setIsViewModalOpen(true);
                            }}
                          />
                        )}
                        {canEditRegion && (
                          <EditAction onClick={() => handleOpenEditModal(r)} />
                        )}
                        {canDeleteRegion && (
                          <DeleteAction onClick={() => setDeletingRegion(r)} />
                        )}
                      </RowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="5xl"
        title={editingRegion ? `Edit Regional Office: ${editingRegion.name}` : 'Add New Regional Office'}
        subtitle="Configure intermediate governance units and administrative accounts."
      >
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
            <button
              type="button"
              onClick={() => setFormTab('basic')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'basic' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
              }`}
            >
              1. Basic Identity
            </button>
            <button
              type="button"
              onClick={() => setFormTab('contact')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'contact' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
              }`}
            >
              2. Leadership & Contact
            </button>
            <button
              type="button"
              onClick={() => setFormTab('location')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'location' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
              }`}
            >
              3. Location
            </button>
            <button
              type="button"
              onClick={() => setFormTab('account')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'account' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
              }`}
            >
              4. IAM Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formTab === 'basic' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Regional Office Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. South Regional Directorate"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. REG_SOUTH_01"
                      disabled={!!editingRegion}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Parent Head Office <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="">-- Select Parent Head Office --</option>
                      {parents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Short Name / Alias
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. South Region"
                      value={formData.shortName || ''}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {formTab === 'contact' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Director Name</label>
                    <input
                      type="text"
                      value={formData.directorName || ''}
                      onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="e.g. south.region@beaconhorizon.edu.pk"
                      value={formData.email || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) handleFieldBlur('email', 'EMAIL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('email', 'EMAIL', formData.email)}
                      className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                        formErrors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                      } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.email}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder={contactPlaceholders.landline}
                      value={formData.phone || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (formErrors.phone) handleFieldBlur('phone', 'PHONE', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('phone', 'PHONE', formData.phone)}
                      className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                        formErrors.phone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                      } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Website</label>
                    <input
                      type="text"
                      placeholder="e.g. https://south.beaconhorizon.edu.pk"
                      value={formData.website || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, website: e.target.value });
                        if (formErrors.website) handleFieldBlur('website', 'URL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('website', 'URL', formData.website)}
                      className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                        formErrors.website ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                      } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                    />
                    {formErrors.website && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.website}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formTab === 'location' && (
              <div className="space-y-4 text-xs">
                <GeographyLocationFields
                  country={formData.country || 'Pakistan'}
                  countryId={formData.countryId || ''}
                  province={formData.province || ''}
                  stateId={formData.stateId || ''}
                  city={formData.city || ''}
                  cityId={formData.cityId || ''}
                  area={formData.area || ''}
                  areaId={formData.areaId || ''}
                  postalCode={formData.postalCode || ''}
                  onCountryChange={(country) => setFormData((prev) => ({ ...prev, country }))}
                  onCountryIdChange={(countryId) => setFormData((prev) => ({ ...prev, countryId }))}
                  onProvinceChange={(province) => setFormData((prev) => ({ ...prev, province }))}
                  onStateIdChange={(stateId) => setFormData((prev) => ({ ...prev, stateId }))}
                  onCityChange={(city) => setFormData((prev) => ({ ...prev, city }))}
                  onCityIdChange={(cityId) => setFormData((prev) => ({ ...prev, cityId }))}
                  onAreaChange={(area) => setFormData((prev) => ({ ...prev, area }))}
                  onAreaIdChange={(areaId) => setFormData((prev) => ({ ...prev, areaId }))}
                  onPostalCodeChange={(postalCode) => setFormData((prev) => ({ ...prev, postalCode }))}
                  showAreaAndPostal={true}
                />
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            )}

            {formTab === 'account' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>🔐</span> Centralized IAM Regional Account
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Provision or link an administrative user account for this Regional Directorate. Passwords are encrypted with Argon2id.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Username / Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. south.admin@beaconhorizon.edu.pk"
                      value={accountData.email}
                      onChange={(e) => {
                        setAccountData({ ...accountData, email: e.target.value });
                        if (formErrors.accountEmail) handleFieldBlur('accountEmail', 'EMAIL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('accountEmail', 'EMAIL', accountData.email)}
                      className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                        formErrors.accountEmail ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                      } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                    />
                    {formErrors.accountEmail && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.accountEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Temporary Password {editingRegion ? '(Leave blank to retain current)' : ''}
                    </label>
                    <input
                      type="password"
                      placeholder={editingRegion ? '••••••••' : 'Enter temporary password'}
                      value={accountData.temporaryPassword}
                      onChange={(e) => setAccountData({ ...accountData, temporaryPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Role</label>
                    <select
                      value={accountData.roleCode}
                      onChange={(e) => setAccountData({ ...accountData, roleCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer"
                    >
                      <option value="REGION_ADMIN">Regional Office Administrator (REGION_ADMIN)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-5">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Account Active</div>
                      <div className="text-[10px] text-slate-400">Allow login to portal</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccountData({ ...accountData, isActive: !accountData.isActive })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        accountData.isActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          accountData.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? 'Saving...' : editingRegion ? 'Save Changes' : 'Create Regional Office'}
              </button>
            </div>
          </form>
        </div>
      </AdminModal>

      {/* View Modal */}
      <AdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="5xl"
        title={viewingRegion?.name || 'Regional Office Details'}
        subtitle={`Code: ${viewingRegion?.code || ''}`}
      >
        {viewingRegion && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{viewingRegion.name}</div>
                <div className="text-slate-400 mt-0.5">Parent: 🏢 {viewingRegion.parentName} ({viewingRegion.parentCode})</div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  viewingRegion.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {viewingRegion.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {viewingRegion.linkedAccount && (
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl space-y-2">
                <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🔐</span> Linked IAM Administrative Account
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Account Email:</span>{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingRegion.linkedAccount.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span>{' '}
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{viewingRegion.linkedAccount.roleCode || 'REGION_ADMIN'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-medium">Director / Head:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingRegion.directorName || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Connected Units:</span>
                <div className="mt-0.5">
                  <button
                    type="button"
                    onClick={() => setConnectedUnitsRegion(viewingRegion)}
                    title="Click to view connected schools"
                    className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  >
                    🔗 {viewingRegion.schoolCount || 0} {viewingRegion.schoolCount === 1 ? 'School' : 'Schools'} (View List ↗)
                  </button>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Phone:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  <FormattedPhone value={viewingRegion.phone} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Email:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{viewingRegion.email || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Website:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingRegion.website ? (
                    <a
                      href={viewingRegion.website.startsWith('http') ? viewingRegion.website : `https://${viewingRegion.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {viewingRegion.website} ↗
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Location:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {[viewingRegion.city, viewingRegion.province, viewingRegion.country].filter(Boolean).join(', ') || '—'}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Audit Trail</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>Created By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingRegion.createdByUser?.name || 'System User'}</span></div>
                <div>Created At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingRegion.createdAt).toLocaleString()}</span></div>
                <div>Updated By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingRegion.updatedByUser?.name || 'System User'}</span></div>
                <div>Updated At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingRegion.updatedAt).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Delete Modal */}
      <AdminModal
        isOpen={!!deletingRegion}
        onClose={() => setDeletingRegion(null)}
        maxWidth="lg"
        title={`Delete Region: ${deletingRegion?.name || ''}`}
        subtitle="Verify dependencies before deleting."
      >
        {deletingRegion && (
          <div className="space-y-4 text-xs">
            {isCheckingDeps ? (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <div className="animate-spin text-xl">⏳</div>
                <p>Checking database relationships and downstream schools...</p>
              </div>
            ) : regionDependencies && !regionDependencies.canDelete ? (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⛔</span> Cannot Delete Regional Office
                  </div>
                  <p className="text-[11px]">
                    This region has downstream connected schools in the database.
                  </p>
                </div>
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold">Blocking Dependencies:</div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                    {regionDependencies.dependencies.schools > 0 && (
                      <li>{regionDependencies.dependencies.schools} Connected School Institution(s)</li>
                    )}
                    {regionDependencies.dependencies.campuses > 0 && (
                      <li>{regionDependencies.dependencies.campuses} Connected Branch / Campus Unit(s)</li>
                    )}
                    {regionDependencies.message && <li>{regionDependencies.message}</li>}
                  </ul>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeletingRegion(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span> Permanent Deletion Warning
                  </div>
                  <p className="text-[11px] mt-1">
                    Are you sure you want to permanently delete <strong>{deletingRegion.name}</strong> ({deletingRegion.code})?
                  </p>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingRegion(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteRegion}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* Connected Units Popup Modal */}
      {connectedUnitsRegion && (
        <ConnectedUnitsModal
          isOpen={!!connectedUnitsRegion}
          onClose={() => setConnectedUnitsRegion(null)}
          parentEntityId={connectedUnitsRegion.id}
          parentEntityName={connectedUnitsRegion.name}
          parentEntityCode={connectedUnitsRegion.code}
          parentEntityType="REGIONAL_OFFICE"
          hierarchyNodeId={connectedUnitsRegion.hierarchyNodeId}
          expectedCount={connectedUnitsRegion.schoolCount}
          zIndex={120}
        />
      )}
    </div>
  );
}
