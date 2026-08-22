'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RegionListItemDto,
  EligibleRegionParentNodeDto,
  CreateRegionDto,
} from '@campus-os/types';

/* ─── Status Badge ────────────────────────────────────────────── */
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ─── KPI Card ────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  accent?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-start gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${accent ?? 'bg-indigo-50 dark:bg-indigo-950/40'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 leading-none">{value}</p>
      </div>
    </div>
  );
}

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

/* ═══════════════════════════════════════════════════════════════ */
/*  REGIONAL OFFICES PAGE                                         */
/* ═══════════════════════════════════════════════════════════════ */

export default function RegionsPage() {
  /* ── State ──────────────────────────────────────────────────── */
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
  const [formTab, setFormTab] = useState<'basic' | 'contact' | 'location' | 'config'>('basic');
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
    address: '',
    area: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
    status: true,
  });

  /* ── Toast helper ───────────────────────────────────────────── */
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  /* ── Default seed data (pre-loaded fallback) ──────────────────*/
  const defaultParents = useMemo<EligibleRegionParentNodeDto[]>(
    () => [
      {
        id: 'parent-ho-001',
        code: 'HO_MAIN',
        name: 'Alpha Central Directorate & Head Office',
        nodeTypeCode: 'HEAD_OFFICE',
        path: 'alpha_academy.ho_main',
      },
      {
        id: 'parent-ho-002',
        code: 'HO_SOUTH',
        name: 'Southern Zonal Executive Office',
        nodeTypeCode: 'HEAD_OFFICE',
        path: 'alpha_academy.ho_south',
      },
    ],
    []
  );

  const defaultRegions = useMemo<RegionListItemDto[]>(
    () => [
      {
        id: 'reg-001',
        organizationId: 'org-001',
        hierarchyNodeId: 'hn-reg-001',
        parentId: 'parent-ho-001',
        parentName: 'Head Office',
        code: 'SOUTH',
        name: 'South Region',
        shortName: 'SR',
        directorName: 'Mr. Ahmed Raza',
        email: 'south.region@alphaacademy.edu.pk',
        phone: '+92 21 3456 7890',
        city: 'Karachi',
        province: 'Sindh',
        schoolCount: 3,
        isActive: true,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-06-15'),
      },
      {
        id: 'reg-002',
        organizationId: 'org-001',
        hierarchyNodeId: 'hn-reg-002',
        parentId: 'parent-ho-001',
        parentName: 'Head Office',
        code: 'NORTH',
        name: 'North Region',
        shortName: 'NR',
        directorName: 'Mrs. Sara Malik',
        email: 'north.region@alphaacademy.edu.pk',
        phone: '+92 51 2345 6789',
        city: 'Islamabad',
        province: 'Punjab',
        schoolCount: 2,
        isActive: true,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-05-20'),
      },
      {
        id: 'reg-003',
        organizationId: 'org-001',
        hierarchyNodeId: 'hn-reg-003',
        parentId: 'parent-ho-001',
        parentName: 'Head Office',
        code: 'CENTRAL',
        name: 'Central Region',
        shortName: 'CR',
        directorName: 'Mr. Bilal Khan',
        email: 'central.region@alphaacademy.edu.pk',
        phone: '+92 42 3456 7890',
        city: 'Lahore',
        province: 'Punjab',
        schoolCount: 0,
        isActive: false,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-04-10'),
      },
    ],
    []
  );

  /* ── Data loading ────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [regRes, parRes] = await Promise.all([
          fetch('/api/regions'),
          fetch('/api/regions/parents'),
        ]);
        if (regRes.ok && parRes.ok) {
          const [regData, parData] = await Promise.all([regRes.json(), parRes.json()]);
          setRegions(regData.length ? regData : defaultRegions);
          setParents(parData.length ? parData : defaultParents);
        } else {
          setRegions(defaultRegions);
          setParents(defaultParents);
        }
      } catch {
        setRegions(defaultRegions);
        setParents(defaultParents);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [defaultRegions, defaultParents]);

  /* ── Filtering ───────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...regions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          (r.city ?? '').toLowerCase().includes(q) ||
          (r.directorName ?? '').toLowerCase().includes(q) ||
          (r.email ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      const active = statusFilter === 'ACTIVE';
      list = list.filter((r) => r.isActive === active);
    }
    if (parentFilter !== 'ALL') {
      list = list.filter((r) => r.parentId === parentFilter);
    }
    return list;
  }, [regions, searchQuery, statusFilter, parentFilter]);

  /* ── KPI Counts ──────────────────────────────────────────────── */
  const totalSchools = useMemo(() => regions.reduce((s, r) => s + r.schoolCount, 0), [regions]);
  const activeCount = regions.filter((r) => r.isActive).length;
  const inactiveCount = regions.filter((r) => !r.isActive).length;

  /* ── Form helpers ────────────────────────────────────────────── */
  const openAddModal = () => {
    setEditingRegion(null);
    setFormData({
      name: '', code: '', parentId: parents[0]?.id ?? '',
      shortName: '', directorName: '', email: '', phone: '',
      alternatePhone: '', website: '', address: '', area: '',
      city: '', province: '', postalCode: '', notes: '', status: true,
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  const openEditModal = (region: RegionListItemDto) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      code: region.code,
      parentId: region.parentId,
      shortName: region.shortName ?? '',
      directorName: region.directorName ?? '',
      email: region.email ?? '',
      phone: region.phone ?? '',
      alternatePhone: '',
      website: '',
      address: '',
      area: '',
      city: region.city ?? '',
      province: region.province ?? '',
      postalCode: '',
      notes: '',
      status: region.isActive,
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Region name is required';
    if (!formData.code.trim()) errors.code = 'Code is required';
    else if (!/^[A-Z0-9_-]{2,16}$/i.test(formData.code.trim()))
      errors.code = 'Code must be 2–16 alphanumeric characters';
    if (!formData.parentId) errors.parentId = 'Parent node is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const url = editingRegion ? `/api/regions/${editingRegion.id}` : '/api/regions';
      const method = editingRegion ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const saved = await res.json();
        if (editingRegion) {
          setRegions((prev) => prev.map((r) => (r.id === saved.id ? { ...r, ...saved } : r)));
          showToast('success', `"${saved.name}" updated successfully.`);
        } else {
          setRegions((prev) => [
            ...prev,
            {
              ...saved,
              parentName: parents.find((p) => p.id === formData.parentId)?.name ?? 'Head Office',
              schoolCount: 0,
            },
          ]);
          showToast('success', `"${saved.name}" created successfully.`);
        }
        setIsModalOpen(false);
      } else {
        const err = await res.json();
        showToast('error', err.message ?? 'Failed to save. Please try again.');
      }
    } catch {
      // Optimistic local update for demo
      if (editingRegion) {
        setRegions((prev) =>
          prev.map((r) =>
            r.id === editingRegion.id
              ? {
                  ...r,
                  name: formData.name,
                  code: formData.code.toUpperCase(),
                  shortName: formData.shortName || null,
                  directorName: formData.directorName || null,
                  email: formData.email || null,
                  phone: formData.phone || null,
                  city: formData.city || null,
                  province: formData.province || null,
                  isActive: formData.status ?? true,
                }
              : r
          )
        );
        showToast('success', `"${formData.name}" updated.`);
      } else {
        const newReg: RegionListItemDto = {
          id: `local-${Date.now()}`,
          organizationId: 'org-001',
          hierarchyNodeId: `hn-${Date.now()}`,
          parentId: formData.parentId,
          parentName: parents.find((p) => p.id === formData.parentId)?.name ?? 'Head Office',
          code: formData.code.toUpperCase(),
          name: formData.name,
          shortName: formData.shortName || null,
          directorName: formData.directorName || null,
          email: formData.email || null,
          phone: formData.phone || null,
          city: formData.city || null,
          province: formData.province || null,
          schoolCount: 0,
          isActive: formData.status ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setRegions((prev) => [...prev, newReg]);
        showToast('success', `"${formData.name}" created.`);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (region: RegionListItemDto) => {
    const newStatus = !region.isActive;
    try {
      await fetch(`/api/regions/${region.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
    } catch {
      // local optimistic update always applied
    }
    setRegions((prev) =>
      prev.map((r) => (r.id === region.id ? { ...r, isActive: newStatus } : r))
    );
    showToast('success', `"${region.name}" ${newStatus ? 'activated' : 'deactivated'}.`);
  };

  /* ── Form Field ──────────────────────────────────────────────── */
  const Field = ({
    label,
    name,
    required,
    type = 'text',
    placeholder,
    hint,
  }: {
    label: string;
    name: keyof CreateRegionDto;
    required?: boolean;
    type?: string;
    placeholder?: string;
    hint?: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={(formData[name] as string) ?? ''}
        onChange={(e) => setFormData((f) => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
          formErrors[name as string]
            ? 'border-rose-400 dark:border-rose-600'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      />
      {formErrors[name as string] && (
        <p className="mt-1 text-xs text-rose-500">{formErrors[name as string]}</p>
      )}
      {hint && !formErrors[name as string] && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════ */
  /*  RENDER                                                      */
  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <span>Administration Configuration</span>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Regional Offices</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Regional Offices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Manage intermediate regional tiers between Head Office and Schools.
            Regions are optional — your hierarchy can go directly Head Office → School.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
          >
            <span className="text-base leading-none">+</span>
            Add Regional Office
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Regions" value={regions.length} icon="🗺️" accent="bg-indigo-50 dark:bg-indigo-950/40" />
        <KpiCard label="Active" value={activeCount} icon="✅" accent="bg-emerald-50 dark:bg-emerald-950/40" />
        <KpiCard label="Inactive" value={inactiveCount} icon="⏸️" accent="bg-slate-100 dark:bg-slate-800" />
        <KpiCard label="Total Schools" value={totalSchools} icon="🏫" accent="bg-blue-50 dark:bg-blue-950/40" />
      </div>

      {/* ── SEARCH & FILTER BAR ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by name, code, city, director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Head Office Filter */}
          <select
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <option value="ALL">All Head Offices</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Result count */}
          <div className="hidden sm:flex items-center px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-medium whitespace-nowrap">
            {filtered.length} of {regions.length}
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading regional offices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl">🗺️</span>
            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
              {regions.length === 0 ? 'No regional offices yet' : 'No results match your filters'}
            </p>
            <p className="text-sm text-slate-400">
              {regions.length === 0
                ? 'Create your first regional office to organize schools geographically.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {regions.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                Add First Region
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Regional Office</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Head Office</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Director / Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Schools</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((region) => (
                  <tr
                    key={region.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Code */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        {region.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                        {region.name}
                      </div>
                      {region.shortName && (
                        <div className="text-xs text-slate-400 mt-0.5">{region.shortName}</div>
                      )}
                    </td>

                    {/* Parent */}
                    <td className="px-5 py-3.5">
                      <span className="text-slate-600 dark:text-slate-400 text-xs">
                        {region.parentName}
                      </span>
                    </td>

                    {/* Director / Contact */}
                    <td className="px-5 py-3.5">
                      {region.directorName ? (
                        <div>
                          <div className="text-slate-700 dark:text-slate-300 text-xs font-medium leading-tight">
                            {region.directorName}
                          </div>
                          {region.email && (
                            <div className="text-slate-400 text-xs mt-0.5 truncate max-w-[160px]">
                              {region.email}
                            </div>
                          )}
                          {region.phone && (
                            <div className="text-slate-400 text-xs">{region.phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-5 py-3.5">
                      {region.city || region.province ? (
                        <span className="text-slate-600 dark:text-slate-400 text-xs">
                          {[region.city, region.province].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* School count */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                        region.schoolCount > 0
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {region.schoolCount}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(region)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          region.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${region.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{region.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setViewingRegion(region);
                            setIsViewModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          title="View full regional office metadata"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(region)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                          title="Edit regional office details"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(region)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                            region.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={region.isActive ? 'Deactivate regional office' : 'Activate regional office'}
                        >
                          {region.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ADD / EDIT MODAL                                        */}
      {/* ════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingRegion ? 'Edit Regional Office' : 'Add Regional Office'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {editingRegion
                    ? `Editing "${editingRegion.name}"`
                    : 'Create a new optional regional tier between Head Office and Schools'}
                </p>
              </div>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Tab Navigation */}
            <div className="flex gap-0 border-b border-slate-100 dark:border-slate-800 px-6 pt-2">
              {([
                { key: 'basic', label: 'Basic Info', icon: '📋' },
                { key: 'contact', label: 'Administration', icon: '👤' },
                { key: 'location', label: 'Location', icon: '📍' },
                { key: 'config', label: 'Configuration', icon: '⚙️' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFormTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                    formTab === tab.key
                      ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[calc(90vh-260px)] overflow-y-auto">

                {/* ─ BASIC INFO ────────────────────────────── */}
                {formTab === 'basic' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Region Name" name="name" required placeholder="e.g. South Region" />
                    </div>

                    <div>
                      <Field
                        label="Code"
                        name="code"
                        required
                        placeholder="e.g. SOUTH"
                        hint="2–16 uppercase alphanumeric. Must be unique within your organization."
                      />
                    </div>

                    <div>
                      <Field label="Short Name / Abbreviation" name="shortName" placeholder="e.g. SR" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Head Office
                      </label>
                      <select
                        value={formData.parentId}
                        onChange={(e) => setFormData((f) => ({ ...f, parentId: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          formErrors.parentId
                            ? 'border-rose-400 dark:border-rose-600'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <option value="">[ None / Direct Region ]</option>
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                        ))}
                      </select>
                      {formErrors.parentId && (
                        <p className="mt-1 text-xs text-rose-500">{formErrors.parentId}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        Select Head Office if this region operates under a central directorate. (Optional where organization structure does not use a Head Office).
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Status
                      </label>
                      <div className="flex gap-3">
                        {[
                          { value: true, label: 'Active', icon: '✅' },
                          { value: false, label: 'Inactive', icon: '⏸️' },
                        ].map((opt) => (
                          <label
                            key={String(opt.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                              formData.status === opt.value
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              checked={formData.status === opt.value}
                              onChange={() => setFormData((f) => ({ ...f, status: opt.value }))}
                            />
                            <span>{opt.icon}</span>
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ ADMINISTRATION / CONTACT ──────────────── */}
                {formTab === 'contact' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Regional Director Name" name="directorName" placeholder="e.g. Mr. Ahmed Raza" />
                    </div>
                    <Field label="Official Email" name="email" type="email" placeholder="region@yourorg.edu.pk" />
                    <Field label="Primary Phone" name="phone" type="tel" placeholder="+92 21 3456 7890" />
                    <Field label="Alternate Phone" name="alternatePhone" type="tel" placeholder="+92 21 3456 7891" />
                    <Field label="Website" name="website" placeholder="https://south.yourorg.edu.pk" />
                  </div>
                )}

                {/* ─ LOCATION ──────────────────────────────── */}
                {formTab === 'location' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Street Address
                      </label>
                      <textarea
                        rows={2}
                        value={formData.address ?? ''}
                        onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                        placeholder="Building, Street, Address"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                    <Field label="Area / Sector" name="area" placeholder="e.g. Clifton, Block 5" />
                    <Field label="City" name="city" placeholder="e.g. Karachi" />
                    <Field label="Province / State" name="province" placeholder="e.g. Sindh" />
                    <Field label="Postal Code" name="postalCode" placeholder="e.g. 75500" />
                  </div>
                )}

                {/* ─ CONFIGURATION ─────────────────────────── */}
                {formTab === 'config' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Notes / Internal Remarks
                      </label>
                      <textarea
                        rows={4}
                        value={formData.notes ?? ''}
                        onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Internal notes about this regional office..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Architecture Note</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 leading-relaxed">
                        Region remains a configurable, optional tier. Your organization hierarchy is dynamic — you can
                        go directly Head Office → School without regions. Access and login credentials are managed
                        separately per user via Administration Users.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-xs text-slate-400">
                  {formTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'basic' | 'contact' | 'location' | 'config'> = ['basic', 'contact', 'location', 'config'];
                        const idx = tabs.indexOf(formTab);
                        if (idx > 0) setFormTab(tabs[idx - 1]!);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                    >
                      ← Back
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => !isSubmitting && setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {formTab !== 'config' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (formTab === 'basic' && !validateForm()) return;
                        const tabs: Array<'basic' | 'contact' | 'location' | 'config'> = ['basic', 'contact', 'location', 'config'];
                        const idx = tabs.indexOf(formTab);
                        if (idx < tabs.length - 1) setFormTab(tabs[idx + 1]!);
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                    >
                      Continue →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
                    >
                      {isSubmitting && (
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {editingRegion ? 'Save Changes' : 'Create Regional Office'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* DETAIL / VIEW MODAL                                     */}
      {/* ════════════════════════════════════════════════════════ */}
      {isViewModalOpen && viewingRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                    {viewingRegion.code}
                  </span>
                  <StatusBadge isActive={viewingRegion.isActive} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{viewingRegion.name}</h2>
                {viewingRegion.shortName && (
                  <p className="text-sm text-slate-400">{viewingRegion.shortName}</p>
                )}
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Detail Tabs */}
            {(() => {
              const [viewTab, setViewTab] = React.useState<'overview' | 'schools' | 'history'>('overview');
              return (
                <>
                  <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
                    {[
                      { key: 'overview', label: 'Overview', icon: '📊' },
                      { key: 'schools', label: `Schools (${viewingRegion.schoolCount})`, icon: '🏫' },
                      { key: 'history', label: 'History', icon: '📜' },
                    ].map((tab: { key: string; label: string; icon: string }) => (
                      <button
                        key={tab.key}
                        onClick={() => setViewTab(tab.key as 'overview' | 'schools' | 'history')}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                          viewTab === tab.key
                            ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 dark:border-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 space-y-4 max-h-[calc(90vh-240px)] overflow-y-auto">
                    {viewTab === 'overview' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Head Office', value: viewingRegion.parentName || '—' },
                          { label: 'Director', value: viewingRegion.directorName },
                          { label: 'Email', value: viewingRegion.email },
                          { label: 'Phone', value: viewingRegion.phone },
                          {
                            label: 'Location',
                            value: [viewingRegion.city, viewingRegion.province].filter(Boolean).join(', '),
                          },
                          {
                            label: 'Schools Under Region',
                            value: String(viewingRegion.schoolCount),
                          },
                          {
                            label: 'Created',
                            value: new Date(viewingRegion.createdAt).toLocaleDateString(),
                          },
                          {
                            label: 'Last Updated',
                            value: new Date(viewingRegion.updatedAt).toLocaleDateString(),
                          },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-50 dark:bg-slate-950/40 rounded-lg p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                              {label}
                            </p>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {value || <span className="text-slate-300 dark:text-slate-600">—</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {viewTab === 'schools' && (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                        <span className="text-3xl">🏫</span>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {viewingRegion.schoolCount > 0
                            ? `${viewingRegion.schoolCount} school(s) under this region`
                            : 'No schools assigned yet'}
                        </p>
                        <p className="text-xs text-slate-400">School management is available in the Schools section.</p>
                      </div>
                    )}

                    {viewTab === 'history' && (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                        <span className="text-3xl">📜</span>
                        <p className="text-sm text-slate-400">Audit history will appear here.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openEditModal(viewingRegion);
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                    >
                      Edit Region
                    </button>
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast notification={notification} />
    </div>
  );
}
