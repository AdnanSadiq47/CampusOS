'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HeadOfficeListItemDto, CreateHeadOfficeDto } from '@campus-os/types';
import { AdminConfigPageHeader } from '../../../../components/AdminConfigPageHeader';

export default function HeadOfficesPage() {
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
  const [formTab, setFormTab] = useState<'basic' | 'contact' | 'location'>('basic');
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
    notes: '',
    status: true,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Seed default data for local preview
  const initialSeedHeadOffices: HeadOfficeListItemDto[] = useMemo(
    () => [
      {
        id: 'ho-1',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-ho-1',
        code: 'HO_MAIN',
        name: 'Alpha Central Directorate & Head Office',
        shortName: 'Central HQ',
        description: 'Main corporate headquarters and central academic directorate',
        directorName: 'Prof. Dr. Mansoor Ali Khan',
        email: 'directorate@alphaacademy.edu.pk',
        phone: '+92 51 8443322',
        city: 'Islamabad',
        province: 'Federal Capital',
        country: 'Pakistan',
        connectedUnitsCount: 5,
        regionCount: 2,
        schoolCount: 3,
        isActive: true,
        createdAt: new Date('2026-01-05T08:00:00Z'),
        updatedAt: new Date('2026-01-05T08:00:00Z'),
      },
      {
        id: 'ho-2',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-ho-2',
        code: 'HO_SOUTH',
        name: 'Southern Zonal Executive Office',
        shortName: 'South HQ',
        description: 'Executive governance center for Sindh and Balochistan territories',
        directorName: 'Syeda Fatima Bukhari',
        email: 'south.hq@alphaacademy.edu.pk',
        phone: '+92 21 35890123',
        city: 'Karachi',
        province: 'Sindh',
        country: 'Pakistan',
        connectedUnitsCount: 3,
        regionCount: 1,
        schoolCount: 2,
        isActive: true,
        createdAt: new Date('2026-01-15T10:30:00Z'),
        updatedAt: new Date('2026-01-15T10:30:00Z'),
      },
    ],
    []
  );

  // Fetch head offices
  const fetchData = async () => {
    setIsLoading(true);
    try {
      setHeadOffices((prev) => (prev.length > 0 ? prev : initialSeedHeadOffices));
    } catch {
      showToast('error', 'Failed to load head office records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Head Offices
  const filteredHeadOffices = useMemo(() => {
    return headOffices.filter((ho) => {
      const q = searchQuery.trim().toLowerCase();
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

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = headOffices.length;
    const active = headOffices.filter((h) => h.isActive).length;
    const inactive = total - active;
    const totalConnectedUnits = headOffices.reduce((acc, h) => acc + (h.connectedUnitsCount || 0), 0);
    return { total, active, inactive, totalConnectedUnits };
  }, [headOffices]);

  // Modal open handlers
  const handleOpenAddModal = () => {
    setEditingHO(null);
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
      notes: '',
      status: true,
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

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
      alternatePhone: '',
      website: '',
      country: ho.country || 'Pakistan',
      province: ho.province || '',
      city: ho.city || '',
      area: '',
      address: '',
      postalCode: '',
      notes: '',
      status: ho.isActive,
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Head Office Name is required';
    if (!formData.code?.trim()) errors.code = 'Head Office Code is required';
    else if (!/^[A-Z0-9_-]+$/i.test(formData.code.trim())) {
      errors.code = 'Code must contain only alphanumeric characters, underscores or hyphens';
    }

    const cleanCode = formData.code.trim().toUpperCase();
    const isDuplicate = headOffices.some(
      (h) => h.code.toUpperCase() === cleanCode && (!editingHO || h.id !== editingHO.id)
    );
    if (isDuplicate) {
      errors.code = `A Head Office with code '${cleanCode}' already exists`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('error', 'Please resolve form validation errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanCode = formData.code.trim().toUpperCase();
      const cleanName = formData.name.trim();

      if (editingHO) {
        // Update
        const updatedList = headOffices.map((h) => {
          if (h.id === editingHO.id) {
            return {
              ...h,
              name: cleanName,
              code: cleanCode,
              shortName: formData.shortName?.trim() || null,
              description: formData.description?.trim() || null,
              directorName: formData.directorName?.trim() || null,
              email: formData.email?.trim() || null,
              phone: formData.phone?.trim() || null,
              city: formData.city?.trim() || null,
              province: formData.province?.trim() || null,
              country: formData.country?.trim() || 'Pakistan',
              isActive: formData.status ?? true,
              updatedAt: new Date(),
            };
          }
          return h;
        });
        setHeadOffices(updatedList);
        showToast('success', `Head Office '${cleanName}' updated successfully`);
      } else {
        // Create new
        const newHO: HeadOfficeListItemDto = {
          id: `ho-${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          hierarchyNodeId: `node-ho-${Date.now()}`,
          code: cleanCode,
          name: cleanName,
          shortName: formData.shortName?.trim() || null,
          description: formData.description?.trim() || null,
          directorName: formData.directorName?.trim() || null,
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          city: formData.city?.trim() || null,
          province: formData.province?.trim() || null,
          country: formData.country?.trim() || 'Pakistan',
          connectedUnitsCount: 0,
          regionCount: 0,
          schoolCount: 0,
          isActive: formData.status ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setHeadOffices([newHO, ...headOffices]);
        showToast('success', `Head Office '${cleanName}' [${cleanCode}] created successfully`);
      }

      setIsModalOpen(false);
    } catch {
      showToast('error', 'Failed to save head office');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = (ho: HeadOfficeListItemDto) => {
    const nextStatus = !ho.isActive;
    const updated = headOffices.map((h) =>
      h.id === ho.id ? { ...h, isActive: nextStatus, updatedAt: new Date() } : h
    );
    setHeadOffices(updated);
    showToast(
      'success',
      `Head Office '${ho.name}' is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`
    );
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
        title="Head Offices"
        description="Manage Head Offices and top-level administrative units for this organization."
        actionButtonText="Add Head Office"
        onAction={handleOpenAddModal}
      />

      {/* ── 2. KPI / SUMMARY CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Head Offices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Head Offices
            </span>
            <span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
              🏢
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.total}</div>
          <div className="mt-1 text-xs text-slate-400">Configured central directorates</div>
        </div>

        {/* Active Head Offices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active
            </span>
            <span className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
              ✓
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.active}</div>
          <div className="mt-1 text-xs text-slate-400">In active operation</div>
        </div>

        {/* Inactive Head Offices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inactive
            </span>
            <span className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs">
              ⏸️
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-600 dark:text-slate-400">{kpis.inactive}</div>
          <div className="mt-1 text-xs text-slate-400">Suspended / Archived</div>
        </div>

        {/* Connected Units */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Connected Units
            </span>
            <span className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
              🌿
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis.totalConnectedUnits}</div>
          <div className="mt-1 text-xs text-slate-400">Child regions & schools</div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER BAR ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by head office name, code, city, director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredHeadOffices.length}</span> of {headOffices.length} head offices
        </div>
      </div>

      {/* ── 4. DATA TABLE ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-xs">Loading head offices...</p>
          </div>
        ) : filteredHeadOffices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-2">🏢</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">No Head Offices Found</div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No head offices match your search criteria. Try adjusting filters.'
                : 'No head offices configured yet. (Note: Head Office is optional in CampusOS).'}
            </div>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                + Add First Head Office
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Head Office Name</th>
                  <th className="py-3 px-4">Director / Leadership</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Connected Units</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHeadOffices.map((ho) => (
                  <tr
                    key={ho.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {ho.code}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{ho.name}</div>
                      {ho.shortName && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{ho.shortName}</div>
                      )}
                    </td>

                    {/* Director / Leadership */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {ho.directorName || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {ho.email || ho.phone || 'No contact specified'}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {ho.city || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {[ho.province, ho.country].filter(Boolean).join(', ')}
                      </div>
                    </td>

                    {/* Connected Units */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <span>🌿</span>
                        <span>{ho.connectedUnitsCount} Units ({ho.regionCount} Reg, {ho.schoolCount} Sch)</span>
                      </span>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(ho)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          ho.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${ho.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{ho.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setViewingHO(ho);
                            setIsViewModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          title="View head office details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(ho)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                          title="Edit head office"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(ho)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                            ho.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={ho.isActive ? 'Deactivate head office' : 'Activate head office'}
                        >
                          {ho.isActive ? 'Deactivate' : 'Activate'}
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

      {/* ── 5. ADD / EDIT MODAL ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingHO ? `Edit Head Office: ${editingHO.name}` : 'Add New Head Office'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingHO ? 'Update central directorate and headquarters configuration' : 'Configure a top-level institutional administrative headquarters'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 pt-2">
              <button
                type="button"
                onClick={() => setFormTab('basic')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  formTab === 'basic'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                1. Basic Info
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
                2. Contact & Leadership
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
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Official Phone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +92 51 8443322"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Official Website
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. https://alphaacademy.edu.pk"
                        value={formData.website || ''}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOCATION */}
              {formTab === 'location' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="Pakistan"
                        value={formData.country || 'Pakistan'}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Province / State</label>
                      <input
                        type="text"
                        placeholder="e.g. Punjab, Sindh, Federal"
                        value={formData.province || ''}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Islamabad, Lahore, Karachi"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

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
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingHO ? 'Update Head Office' : 'Create Head Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. VIEW DETAILS MODAL ───────────────────────────────── */}
      {isViewModalOpen && viewingHO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {viewingHO.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {viewingHO.name}
                </h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Description</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {viewingHO.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Director / Leadership</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{viewingHO.directorName || '—'}</div>
                  <div className="text-slate-500">{viewingHO.email || '—'}</div>
                  <div className="text-slate-500">{viewingHO.phone || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Location</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{viewingHO.city || '—'}</div>
                  <div className="text-slate-500">{[viewingHO.province, viewingHO.country].filter(Boolean).join(', ')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Connected Units</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    🌿 {viewingHO.connectedUnitsCount} Units ({viewingHO.regionCount} Reg, {viewingHO.schoolCount} Sch)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      viewingHO.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${viewingHO.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {viewingHO.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Created: {new Date(viewingHO.createdAt).toLocaleDateString()}</div>
                <div>Last Updated: {new Date(viewingHO.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
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
