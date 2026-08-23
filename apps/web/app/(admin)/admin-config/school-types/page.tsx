'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SchoolTypeListItemDto, CreateSchoolTypeDto } from '@campus-os/types';
import { AdminConfigPageHeader, ORGANIZATION_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';

export default function SchoolTypesPage() {
  // State
  const [schoolTypes, setSchoolTypes] = useState<SchoolTypeListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingType, setEditingType] = useState<SchoolTypeListItemDto | null>(null);
  const [viewingType, setViewingType] = useState<SchoolTypeListItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<CreateSchoolTypeDto>({
    name: '',
    code: '',
    description: '',
    status: true,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Seed default data for local preview
  const initialSeedSchoolTypes: SchoolTypeListItemDto[] = useMemo(
    () => [
      {
        id: 'st-1',
        organizationId: '11111111-1111-1111-1111-111111111111',
        code: 'SCH',
        name: 'School',
        description: 'General school institution offering primary and middle grade education',
        schoolCount: 12,
        isActive: true,
        createdAt: new Date('2026-01-10T09:00:00Z'),
        updatedAt: new Date('2026-01-10T09:00:00Z'),
      },
      {
        id: 'st-2',
        organizationId: '11111111-1111-1111-1111-111111111111',
        code: 'COL',
        name: 'College',
        description: 'Intermediate, higher secondary, and undergraduate college institution',
        schoolCount: 4,
        isActive: true,
        createdAt: new Date('2026-01-12T10:30:00Z'),
        updatedAt: new Date('2026-01-12T10:30:00Z'),
      },
      {
        id: 'st-3',
        organizationId: '11111111-1111-1111-1111-111111111111',
        code: 'UNI',
        name: 'University',
        description: 'Higher education degree-awarding university institution',
        schoolCount: 2,
        isActive: true,
        createdAt: new Date('2026-01-15T14:20:00Z'),
        updatedAt: new Date('2026-01-15T14:20:00Z'),
      },
      {
        id: 'st-4',
        organizationId: '11111111-1111-1111-1111-111111111111',
        code: 'ACA',
        name: 'Academy',
        description: 'Specialized preparatory academy and skill training center',
        schoolCount: 3,
        isActive: true,
        createdAt: new Date('2026-02-01T11:00:00Z'),
        updatedAt: new Date('2026-02-01T11:00:00Z'),
      },
      {
        id: 'st-5',
        organizationId: '11111111-1111-1111-1111-111111111111',
        code: 'K12',
        name: 'K-12 Comprehensive',
        description: 'Full K through 12 complete continuum educational institution',
        schoolCount: 5,
        isActive: true,
        createdAt: new Date('2026-02-15T08:45:00Z'),
        updatedAt: new Date('2026-02-15T08:45:00Z'),
      },
      {
        id: 'st-6',
        organizationId: '11111111-1111-1111-1111-111111111111',
        code: 'VOC',
        name: 'Vocational Institute',
        description: 'Technical and polytechnic vocational training center',
        schoolCount: 0,
        isActive: false,
        createdAt: new Date('2026-03-01T16:00:00Z'),
        updatedAt: new Date('2026-03-01T16:00:00Z'),
      },
    ],
    []
  );

  // Fetch school types
  const fetchData = async () => {
    setIsLoading(true);
    try {
      setSchoolTypes((prev) => (prev.length > 0 ? prev : initialSeedSchoolTypes));
    } catch {
      showToast('error', 'Failed to load school type records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered School Types
  const filteredSchoolTypes = useMemo(() => {
    return schoolTypes.filter((type) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        type.name.toLowerCase().includes(q) ||
        type.code.toLowerCase().includes(q) ||
        (type.description && type.description.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && type.isActive) ||
        (statusFilter === 'INACTIVE' && !type.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [schoolTypes, searchQuery, statusFilter]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = schoolTypes.length;
    const active = schoolTypes.filter((t) => t.isActive).length;
    const inactive = total - active;
    const totalSchools = schoolTypes.reduce((acc, t) => acc + (t.schoolCount || 0), 0);
    return { total, active, inactive, totalSchools };
  }, [schoolTypes]);

  // Modal open handlers
  const handleOpenAddModal = () => {
    setEditingType(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      status: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (type: SchoolTypeListItemDto) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || '',
      status: type.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'School Type Name is required';
    if (!formData.code?.trim()) errors.code = 'School Type Code is required';
    else if (!/^[A-Z0-9_-]+$/i.test(formData.code.trim())) {
      errors.code = 'Code must contain only alphanumeric characters, underscores or hyphens';
    }

    // Check duplicate code
    const cleanCode = formData.code.trim().toUpperCase();
    const isDuplicate = schoolTypes.some(
      (t) => t.code.toUpperCase() === cleanCode && (!editingType || t.id !== editingType.id)
    );
    if (isDuplicate) {
      errors.code = `A School Type with code '${cleanCode}' already exists`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form (Create / Update)
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

      if (editingType) {
        // Update
        const updatedList = schoolTypes.map((t) => {
          if (t.id === editingType.id) {
            return {
              ...t,
              name: cleanName,
              code: cleanCode,
              description: formData.description?.trim() || null,
              isActive: formData.status ?? true,
              updatedAt: new Date(),
            };
          }
          return t;
        });
        setSchoolTypes(updatedList);
        showToast('success', `School Type '${cleanName}' updated successfully`);
      } else {
        // Create new
        const newType: SchoolTypeListItemDto = {
          id: `st-${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          code: cleanCode,
          name: cleanName,
          description: formData.description?.trim() || null,
          schoolCount: 0,
          isActive: formData.status ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setSchoolTypes([newType, ...schoolTypes]);
        showToast('success', `School Type '${cleanName}' [${cleanCode}] created successfully`);
      }

      setIsModalOpen(false);
    } catch {
      showToast('error', 'Failed to save school type');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = (type: SchoolTypeListItemDto) => {
    const nextStatus = !type.isActive;
    const updated = schoolTypes.map((t) =>
      t.id === type.id ? { ...t, isActive: nextStatus, updatedAt: new Date() } : t
    );
    setSchoolTypes(updated);
    showToast(
      'success',
      `School Type '${type.name}' is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`
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
        group="Organization Setup"
        title="School Types"
        description="Manage institution types used when creating schools and educational institutions."
        categoryNav={ORGANIZATION_SETUP_NAV}
        actionButtonText="Add School Type"
        onAction={handleOpenAddModal}
      />

      {/* ── 2. KPI / SUMMARY CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Types */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Types
            </span>
            <span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
              🏷️
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.total}</div>
          <div className="mt-1 text-xs text-slate-400">Configured institution masters</div>
        </div>

        {/* Active Types */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Types
            </span>
            <span className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
              ✓
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.active}</div>
          <div className="mt-1 text-xs text-slate-400">Available for school creation</div>
        </div>

        {/* Inactive Types */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inactive Types
            </span>
            <span className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs">
              ⏸️
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-600 dark:text-slate-400">{kpis.inactive}</div>
          <div className="mt-1 text-xs text-slate-400">Archived or restricted</div>
        </div>

        {/* Referenced Schools */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Referenced Schools
            </span>
            <span className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
              🏫
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis.totalSchools}</div>
          <div className="mt-1 text-xs text-slate-400">Across all institution types</div>
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
              placeholder="Search by school type name, code, description..."
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
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredSchoolTypes.length}</span> of {schoolTypes.length} types
        </div>
      </div>

      {/* ── 4. DATA TABLE ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-xs">Loading school types...</p>
          </div>
        ) : filteredSchoolTypes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-2">🏷️</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">No School Types Found</div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No school types match your search criteria. Try adjusting filters.'
                : 'No school types configured yet. Add your first school type master.'}
            </div>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                + Add First School Type
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">School Type Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Schools</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSchoolTypes.map((type) => (
                  <tr
                    key={type.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {type.code}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{type.name}</div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {type.description || '—'}
                    </td>

                    {/* Schools Count */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <span>🏫</span>
                        <span>{type.schoolCount} {type.schoolCount === 1 ? 'School' : 'Schools'}</span>
                      </span>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(type)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          type.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${type.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{type.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setViewingType(type);
                            setIsViewModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          title="View school type details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(type)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                          title="Edit school type"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(type)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                            type.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={type.isActive ? 'Deactivate school type' : 'Activate school type'}
                        >
                          {type.isActive ? 'Deactivate' : 'Activate'}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingType ? `Edit School Type: ${editingType.name}` : 'Add New School Type'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingType ? 'Update institution type definition' : 'Create an institution classification master'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* School Type Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. School, College, University, Academy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border ${
                    formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SCH, COL, UNI, ACA, K12"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-950 border ${
                    formErrors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                />
                <p className="text-[10px] text-slate-400 mt-1">Uppercase unique identifier (e.g., SCH, COL, UNI)</p>
                {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide details about what educational level or institution scope this type covers..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</div>
                  <div className="text-[11px] text-slate-400">Active types can be selected when creating new schools</div>
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
                  {isSubmitting ? 'Saving...' : editingType ? 'Update School Type' : 'Create School Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. VIEW DETAILS MODAL ───────────────────────────────── */}
      {isViewModalOpen && viewingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {viewingType.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {viewingType.name}
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
                  {viewingType.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Associated Schools</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    🏢 {viewingType.schoolCount} Schools
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      viewingType.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${viewingType.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {viewingType.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Created: {new Date(viewingType.createdAt).toLocaleDateString()}</div>
                <div>Last Updated: {new Date(viewingType.updatedAt).toLocaleDateString()}</div>
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
