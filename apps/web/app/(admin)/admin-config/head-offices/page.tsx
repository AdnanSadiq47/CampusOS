'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeadOfficeListItemDto, CreateHeadOfficeDto, HeadOfficeDependenciesDto, ProvisionAccountDto } from '@campus-os/types';
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
import { Building2, CheckCircle2, Clock, Link2 } from 'lucide-react';
import { FormattedPhone, useContactPlaceholders } from '../../../../components/DisplayFormatters';

export default function HeadOfficesPage() {
  const contactPlaceholders = useContactPlaceholders({ schoolId: null });
  // Permissions
  const {
    permissions,
    canCreateHeadOffice,
    canViewHeadOffice,
    canEditHeadOffice,
    canChangeStatusHeadOffice,
    canDeleteHeadOffice,
  } = usePermissions();

  // State
  const [headOffices, setHeadOffices] = useState<HeadOfficeListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingHO, setEditingHO] = useState<HeadOfficeListItemDto | null>(null);
  const [viewingHO, setViewingHO] = useState<HeadOfficeListItemDto | null>(null);
  const [connectedUnitsHO, setConnectedUnitsHO] = useState<HeadOfficeListItemDto | null>(null);
  const [deletingHO, setDeletingHO] = useState<HeadOfficeListItemDto | null>(null);
  const [hoDependencies, setHoDependencies] = useState<HeadOfficeDependenciesDto | null>(null);
  const [isCheckingDeps, setIsCheckingDeps] = useState<boolean>(false);
  const [formTab, setFormTab] = useState<'basic' | 'contact' | 'location' | 'account'>('basic');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<CreateHeadOfficeDto>({
    name: '',
    code: '',
    shortName: '',
    description: '',
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
    status: true,
  });

  const [accountData, setAccountData] = useState<ProvisionAccountDto>({
    email: '',
    temporaryPassword: '',
    roleCode: 'HO_ADMIN',
    isActive: true,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch real head offices from database API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/head-offices', {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-id': '99999999-9999-9999-9999-999999999999',
          'x-user-permissions': permissions.join(','),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHeadOffices(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.message || 'Failed to load head offices from database');
      }
    } catch {
      showToast('error', 'Network error connecting to CampusOS API');
    } finally {
      setIsLoading(false);
    }
  }, [permissions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch real dependencies when deletingHO is selected
  useEffect(() => {
    if (deletingHO) {
      setIsCheckingDeps(true);
      fetch(`/api/head-offices/${deletingHO.id}/dependencies`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-id': '99999999-9999-9999-9999-999999999999',
          'x-user-permissions': permissions.join(','),
        },
      })
        .then((res) => res.json())
        .then((data: HeadOfficeDependenciesDto) => {
          setHoDependencies(data);
        })
        .catch(() => {
          setHoDependencies(null);
        })
        .finally(() => {
          setIsCheckingDeps(false);
        });
    } else {
      setHoDependencies(null);
    }
  }, [deletingHO, permissions]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      shortName: '',
      description: '',
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
      status: true,
    });
    setAccountData({
      email: '',
      temporaryPassword: '',
      roleCode: 'HO_ADMIN',
      isActive: true,
    });
    setFormErrors({});
    setFormTab('basic');
    setEditingHO(null);
  };

  // Open create modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (ho: HeadOfficeListItemDto) => {
    setEditingHO(ho);
    setFormData({
      name: ho.name,
      code: ho.code,
      shortName: ho.shortName || '',
      description: ho.description || '',
      directorName: ho.directorName || '',
      email: ho.email || '',
      phone: ho.phone || '',
      alternatePhone: ho.alternatePhone || '',
      website: ho.website || '',
      country: ho.country || 'Pakistan',
      province: ho.province || '',
      city: ho.city || '',
      area: ho.area || '',
      address: ho.address || '',
      postalCode: ho.postalCode || '',
      countryId: ho.countryId || '',
      stateId: ho.stateId || '',
      cityId: ho.cityId || '',
      areaId: ho.areaId || '',
      notes: ho.notes || '',
      status: ho.isActive,
    });
    setAccountData({
      email: ho.linkedAccount?.email || ho.email || '',
      temporaryPassword: '',
      roleCode: ho.linkedAccount?.roleCode || 'HO_ADMIN',
      isActive: ho.linkedAccount ? ho.linkedAccount.isActive : true,
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  // Open view modal
  const handleOpenViewModal = (ho: HeadOfficeListItemDto) => {
    setViewingHO(ho);
    setIsViewModalOpen(true);
  };

  // Filtered head offices list
  const filteredHeadOffices = useMemo(() => {
    return headOffices.filter((ho) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ho.name.toLowerCase().includes(q) ||
        ho.code.toLowerCase().includes(q) ||
        (ho.city && ho.city.toLowerCase().includes(q)) ||
        (ho.directorName && ho.directorName.toLowerCase().includes(q)) ||
        (ho.email && ho.email.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && ho.isActive) ||
        (statusFilter === 'INACTIVE' && !ho.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [headOffices, searchQuery, statusFilter]);

  // KPI Metrics
  const kpis = useMemo(() => {
    const total = headOffices.length;
    const active = headOffices.filter((ho) => ho.isActive).length;
    const inactive = total - active;
    const totalUnits = headOffices.reduce((sum, ho) => sum + (ho.connectedUnitsCount || 0), 0);
    return { total, active, inactive, totalUnits };
  }, [headOffices]);

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

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Head Office Name is required';
    if (!editingHO && !formData.code?.trim()) errors.code = 'Head Office Code is required';
    if (formData.code && !/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) {
      errors.code = 'Code can only contain letters, numbers, hyphens, and underscores';
    }

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

    // Auto-focus the tab containing errors
    if (errors.name || errors.code) setFormTab('basic');
    else if (errors.email || errors.phone || errors.alternatePhone || errors.website) setFormTab('contact');
    else if (errors.accountEmail) setFormTab('account');

    return Object.keys(errors).length === 0;
  };

  // Submit create or edit to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const cleanCode = formData.code.trim().toUpperCase();
      const cleanName = formData.name.trim();

      const accountPayload = accountData.email?.trim()
        ? {
            email: accountData.email.trim().toLowerCase(),
            temporaryPassword: accountData.temporaryPassword?.trim() || undefined,
            roleCode: accountData.roleCode || 'HO_ADMIN',
            isActive: accountData.isActive ?? true,
          }
        : undefined;

      if (editingHO) {
        // Real PATCH to Database
        const res = await fetch(`/api/head-offices/${editingHO.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': '11111111-1111-1111-1111-111111111111',
            'x-user-id': '99999999-9999-9999-9999-999999999999',
            'x-user-permissions': permissions.join(','),
          },
          body: JSON.stringify({
            name: cleanName,
            shortName: formData.shortName?.trim() || undefined,
            description: formData.description?.trim() || undefined,
            directorName: formData.directorName?.trim() || undefined,
            email: formData.email?.trim() || undefined,
            phone: formData.phone?.trim() || undefined,
            alternatePhone: formData.alternatePhone?.trim() || undefined,
            website: formData.website?.trim() || undefined,
            country: formData.country?.trim() || 'Pakistan',
            province: formData.province?.trim() || undefined,
            city: formData.city?.trim() || undefined,
            area: formData.area?.trim() || undefined,
            address: formData.address?.trim() || undefined,
            postalCode: formData.postalCode?.trim() || undefined,
            countryId: formData.countryId || undefined,
            stateId: formData.stateId || undefined,
            cityId: formData.cityId || undefined,
            areaId: formData.areaId || undefined,
            notes: formData.notes?.trim() || undefined,
            status: formData.status ?? true,
            account: accountPayload,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast('error', data.message || 'Failed to update head office');
          return;
        }

        showToast('success', `Head Office '${cleanName}' updated successfully.`);
      } else {
        // Real POST to Database
        const res = await fetch('/api/head-offices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': '11111111-1111-1111-1111-111111111111',
            'x-user-id': '99999999-9999-9999-9999-999999999999',
            'x-user-permissions': permissions.join(','),
          },
          body: JSON.stringify({
            name: cleanName,
            code: cleanCode,
            shortName: formData.shortName?.trim() || undefined,
            description: formData.description?.trim() || undefined,
            directorName: formData.directorName?.trim() || undefined,
            email: formData.email?.trim() || undefined,
            phone: formData.phone?.trim() || undefined,
            alternatePhone: formData.alternatePhone?.trim() || undefined,
            website: formData.website?.trim() || undefined,
            country: formData.country?.trim() || 'Pakistan',
            province: formData.province?.trim() || undefined,
            city: formData.city?.trim() || undefined,
            area: formData.area?.trim() || undefined,
            address: formData.address?.trim() || undefined,
            postalCode: formData.postalCode?.trim() || undefined,
            countryId: formData.countryId || undefined,
            stateId: formData.stateId || undefined,
            cityId: formData.cityId || undefined,
            areaId: formData.areaId || undefined,
            notes: formData.notes?.trim() || undefined,
            status: formData.status ?? true,
            account: accountPayload,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast('error', data.message || 'Failed to create head office');
          return;
        }

        showToast('success', `Head Office '${cleanName}' created successfully.`);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save head office');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real Toggle status in Database
  const handleToggleStatus = async (ho: HeadOfficeListItemDto) => {
    const nextStatus = !ho.isActive;
    try {
      const res = await fetch(`/api/head-offices/${ho.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-id': '99999999-9999-9999-9999-999999999999',
          'x-user-permissions': permissions.join(','),
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', data.message || 'Failed to change head office status');
        return;
      }

      showToast(
        'success',
        `Head Office '${ho.name}' is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`
      );
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Network error updating status');
    }
  };

  // Real Delete in Database with dependency protection
  const handleDeleteHeadOffice = async () => {
    if (!deletingHO) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/head-offices/${deletingHO.id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-id': '99999999-9999-9999-9999-999999999999',
          'x-user-permissions': permissions.join(','),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', data.message || 'Head office cannot be deleted due to dependencies.');
        return;
      }

      showToast('success', data.message || `Head Office '${deletingHO.name}' deleted successfully.`);
      setDeletingHO(null);
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Network error deleting head office');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-3 transition-all animate-in slide-in-from-bottom-5 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800 shadow-emerald-950/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-800 shadow-rose-950/50'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── 1. PAGE HEADER ──────────────────────────────────────── */}
      <AdminConfigPageHeader
        group="Organization Setup"
        title="Head Offices"
        description="Manage Head Offices and top-level administrative units for this organization."
        categoryNav={ORGANIZATION_SETUP_NAV}
        actionButtonText={canCreateHeadOffice ? "Add Head Office" : undefined}
        onAction={canCreateHeadOffice ? handleOpenAddModal : undefined}
      />

      {/* ── 2. KPI / SUMMARY CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Head Offices"
          value={kpis.total}
          icon={<Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          subtitle="Configured central directorates"
          variant="default"
        />
        <StatCard
          title="Active"
          value={kpis.active}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle="In active operation"
          variant="success"
        />
        <StatCard
          title="Inactive"
          value={kpis.inactive}
          icon={<Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
          subtitle="Suspended / dormant"
          variant="default"
        />
        <StatCard
          title="Connected Units"
          value={kpis.totalUnits}
          icon={<Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          subtitle="Regions + direct schools"
          variant="info"
        />
      </div>

      {/* ── 3. SEARCH & FILTERS BAR ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by code, name, city, director..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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

      {/* ── 4. TABLE SECTION ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-xs">Loading Head Offices from PostgreSQL...</p>
          </div>
        ) : filteredHeadOffices.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-3xl">🏢</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Head Offices Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No records match your filters. Try adjusting your search query or status filter.'
                : 'No Head Offices exist in this organization yet. Click "Add Head Office" above to create one.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Head Office</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Director / Head</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Connected Units</th>
                  <th className="py-3.5 px-4">Linked Account</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                {filteredHeadOffices.map((ho) => (
                  <tr
                    key={ho.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Name + ShortName */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>🏢</span>
                        <span>{ho.name}</span>
                      </div>
                      {ho.shortName && (
                        <div className="text-[11px] text-slate-400 mt-0.5 ml-6">Alias: {ho.shortName}</div>
                      )}
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                        {ho.code}
                      </span>
                    </td>

                    {/* Director / Contact */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {ho.directorName || '—'}
                      </div>
                      {ho.email && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {ho.email}
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{[ho.city, ho.province].filter(Boolean).join(', ') || '—'}</div>
                      <div className="text-[11px] text-slate-400">{ho.country || 'Pakistan'}</div>
                    </td>

                    {/* Connected Units */}
                    <td className="py-3 px-4 text-center">
                      <ConnectedCountPill
                        count={ho.connectedUnitsCount ?? 0}
                        label="Connected Units"
                        onClick={() => setConnectedUnitsHO(ho)}
                      />
                    </td>

                    {/* Linked Account */}
                    <td className="py-3 px-4">
                      {ho.linkedAccount ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {ho.linkedAccount.email}
                          </div>
                          <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                            {ho.linkedAccount.roleCode || 'HO_ADMIN'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unlinked</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(ho)}
                        disabled={!canChangeStatusHeadOffice}
                        title={`Click to ${ho.isActive ? 'deactivate' : 'activate'}`}
                        className={!canChangeStatusHeadOffice ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                      >
                        <StatusBadge status={ho.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <RowActions>
                        {canViewHeadOffice && (
                          <ViewAction onClick={() => handleOpenViewModal(ho)} />
                        )}
                        {canEditHeadOffice && (
                          <EditAction onClick={() => handleOpenEditModal(ho)} />
                        )}
                        {canDeleteHeadOffice && (
                          <DeleteAction onClick={() => setDeletingHO(ho)} />
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

      {/* ── 5. ADD / EDIT MODAL ─────────────────────────────────── */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="5xl"
        title={editingHO ? `Edit Head Office: ${editingHO.name}` : 'Add New Head Office'}
        subtitle={
          editingHO
            ? 'Update directorate details, contact coordinates, or IAM account.'
            : 'Register a central Head Office unit at the top of the organization hierarchy.'
        }
      >
        <div className="space-y-4">
          {/* Modal Form Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
            <button
              type="button"
              onClick={() => setFormTab('basic')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'basic'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              1. Basic Identity
            </button>
            <button
              type="button"
              onClick={() => setFormTab('contact')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'contact'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              2. Leadership & Contact
            </button>
            <button
              type="button"
              onClick={() => setFormTab('location')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'location'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              3. Location & Geography
            </button>
            <button
              type="button"
              onClick={() => setFormTab('account')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                formTab === 'account'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              4. IAM Account
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* TAB 1: BASIC */}
            {formTab === 'basic' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Head Office Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Central Directorate & Head Office"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                        formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HO_MAIN, HQ_ISB"
                      disabled={!!editingHO}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className={`w-full px-3 py-2 rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border ${
                        formErrors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        editingHO ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Short Name / Alias
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Central HQ"
                      value={formData.shortName || ''}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-5">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Active Status</div>
                      <div className="text-[10px] text-slate-400">Head Office operational state</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: !formData.status })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.status ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          formData.status ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Scope
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Governance mandate, operational responsibilities, or directorate scope..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT & LEADERSHIP */}
            {formTab === 'contact' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Director / Executive Head Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Mansoor Ali Khan"
                      value={formData.directorName || ''}
                      onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. directorate@alphaacademy.edu.pk"
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
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Phone
                    </label>
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
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Website
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://alphaacademy.edu.pk"
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

            {/* TAB 3: LOCATION */}
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
                    placeholder="Headquarters street address, sector, or building..."
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: ACCOUNT / IAM PROVISIONING */}
            {formTab === 'account' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>🔐</span> Centralized IAM Account Provisioning
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Provision or link an administrative user account for this Head Office in the canonical IAM system. Passwords are encrypted with Argon2id and never stored in plain text.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Username / Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. ho.admin@beaconhorizon.edu.pk"
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
                      Temporary Password {editingHO ? '(Leave blank to retain current)' : ''}
                    </label>
                    <input
                      type="password"
                      placeholder={editingHO ? '••••••••' : 'Enter temporary password'}
                      value={accountData.temporaryPassword}
                      onChange={(e) => setAccountData({ ...accountData, temporaryPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned IAM Role
                    </label>
                    <select
                      value={accountData.roleCode}
                      onChange={(e) => setAccountData({ ...accountData, roleCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="HO_ADMIN">Head Office Administrator (HO_ADMIN)</option>
                      <option value="ORG_ADMIN">Organization Administrator (ORG_ADMIN)</option>
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

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? 'Saving...' : editingHO ? 'Save Changes' : 'Create Head Office'}
              </button>
            </div>
          </form>
        </div>
      </AdminModal>

      {/* ── 6. VIEW DETAILS MODAL ───────────────────────────────── */}
      <AdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="5xl"
        title={viewingHO?.name || 'Head Office Details'}
        subtitle={`Code: ${viewingHO?.code || ''}`}
      >
        {viewingHO && (
          <div className="space-y-4 text-xs">
            {/* Identity Banner */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{viewingHO.name}</div>
                {viewingHO.shortName && (
                  <div className="text-slate-400 text-xs mt-0.5">Alias: {viewingHO.shortName}</div>
                )}
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  viewingHO.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {viewingHO.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Linked IAM Account */}
            {viewingHO.linkedAccount && (
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl space-y-2">
                <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🔐</span> Linked IAM Administrative Account
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Account Email:</span>{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingHO.linkedAccount.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span>{' '}
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{viewingHO.linkedAccount.roleCode || 'HO_ADMIN'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-medium">Director / Head:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingHO.directorName || '—'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Connected Units:</span>
                <div className="mt-0.5">
                  <button
                    type="button"
                    onClick={() => setConnectedUnitsHO(viewingHO)}
                    title="Click to view all connected units"
                    className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  >
                    🔗 {viewingHO.connectedUnitsCount ?? 0} {viewingHO.connectedUnitsCount === 1 ? 'Unit' : 'Units'} (View List ↗)
                  </button>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Email:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingHO.email || '—'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Phone:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  <FormattedPhone value={viewingHO.phone} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Website:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingHO.website ? (
                    <a
                      href={viewingHO.website.startsWith('http') ? viewingHO.website : `https://${viewingHO.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {viewingHO.website} ↗
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Location:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {[viewingHO.city, viewingHO.province, viewingHO.country].filter(Boolean).join(', ') || '—'}
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Audit Trail</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  Created By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingHO.createdByUser?.name || 'System User'}</span>
                </div>
                <div>
                  Created At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingHO.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  Updated By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingHO.updatedByUser?.name || 'System User'}</span>
                </div>
                <div>
                  Updated At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingHO.updatedAt).toLocaleString()}</span>
                </div>
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

      {/* ── 7. SAFE DELETE MODAL (Dependency Check) ─────────────── */}
      <AdminModal
        isOpen={!!deletingHO}
        onClose={() => setDeletingHO(null)}
        maxWidth="lg"
        title={`Delete Head Office: ${deletingHO?.name || ''}`}
        subtitle="Verify dependencies before deleting this organization unit."
      >
        {deletingHO && (
          <div className="space-y-4 text-xs">
            {isCheckingDeps ? (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <div className="animate-spin text-xl">⏳</div>
                <p>Checking database relationships and downstream nodes...</p>
              </div>
            ) : hoDependencies && !hoDependencies.canDelete ? (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⛔</span> Cannot Delete Head Office
                  </div>
                  <p className="text-[11px]">
                    This Head Office has connected downstream records in the database. You must reassign or remove them before this unit can be safely deleted.
                  </p>
                </div>

                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Blocking Dependencies:</div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                    {hoDependencies.dependencies.regions > 0 && (
                      <li>{hoDependencies.dependencies.regions} Connected Regional Directorate(s)</li>
                    )}
                    {hoDependencies.dependencies.schools > 0 && (
                      <li>{hoDependencies.dependencies.schools} Connected School Institution(s)</li>
                    )}
                    {hoDependencies.dependencies.campuses > 0 && (
                      <li>{hoDependencies.dependencies.campuses} Connected Branch / Campus Unit(s)</li>
                    )}
                    {hoDependencies.dependencies.userAssignments > 0 && (
                      <li>{hoDependencies.dependencies.userAssignments} Assigned User Membership(s)</li>
                    )}
                    {hoDependencies.message && <li>{hoDependencies.message}</li>}
                  </ul>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeletingHO(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span> Permanent Deletion Warning
                  </div>
                  <p className="text-[11px]">
                    Are you sure you want to permanently delete <strong>{deletingHO.name}</strong> ({deletingHO.code})? No connected downstream records were found.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingHO(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteHeadOffice}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* ── 8. CONNECTED UNITS POPUP MODAL ──────────────────────── */}
      {connectedUnitsHO && (
        <ConnectedUnitsModal
          isOpen={!!connectedUnitsHO}
          onClose={() => setConnectedUnitsHO(null)}
          parentEntityId={connectedUnitsHO.id}
          parentEntityName={connectedUnitsHO.name}
          parentEntityCode={connectedUnitsHO.code}
          parentEntityType="HEAD_OFFICE"
          hierarchyNodeId={connectedUnitsHO.hierarchyNodeId}
          expectedCount={connectedUnitsHO.connectedUnitsCount}
          zIndex={120}
        />
      )}
    </div>
  );
}
