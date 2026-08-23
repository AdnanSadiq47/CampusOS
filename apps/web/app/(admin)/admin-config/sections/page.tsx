'use client';

import React, { useState, useMemo } from 'react';
import { SectionListItemDto, ConfigScopeType } from '@campus-os/types';
import { AdminConfigPageHeader, ACADEMIC_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { ConfigScopeSelector } from '../../../../components/ConfigScopeSelector';

const DEFAULT_SECTIONS: SectionListItemDto[] = [
  {
    id: 'sec11111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Section A (Rose)',
    sortOrder: 1,
    description: 'Primary alphabetic section identifier.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sec22222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Section B (Tulip)',
    sortOrder: 2,
    description: 'Secondary alphabetic section identifier.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sec33333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Section C (Jasmine)',
    sortOrder: 3,
    description: 'Third alphabetic section identifier.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sec44444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Section Blue',
    sortOrder: 4,
    description: 'Color-coded classroom cohort identifier.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sec55555-5555-5555-5555-555555555555',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Section Red',
    sortOrder: 5,
    description: 'Color-coded classroom cohort identifier.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sec66666-6666-6666-6666-666666666666',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Section A-Level Accelerated',
    sortOrder: 6,
    description: 'Designated accelerated stream section for college campuses.',
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
    branchNames: ['Main Campus (Gulshan)', 'Clifton Campus'],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export default function SectionsPage() {
  const [items, setItems] = useState<SectionListItemDto[]>(DEFAULT_SECTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SectionListItemDto | null>(null);
  const [viewingItem, setViewingItem] = useState<SectionListItemDto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    sortOrder: number;
    description: string;
    applyTo: ConfigScopeType;
    branchIds: string[];
    isActive: boolean;
  }>({
    name: '',
    sortOrder: 1,
    description: '',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    isActive: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const activeCount = useMemo(() => items.filter((i) => i.isActive).length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      const matchesCampus =
        campusFilter === 'ALL' ||
        item.applyTo === 'ALL_CAMPUSES' ||
        (item.branchIds && item.branchIds.includes(campusFilter));

      return matchesSearch && matchesStatus && matchesCampus;
    });
  }, [items, searchQuery, statusFilter, campusFilter]);

  const handleOpenAdd = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
    setFormData({
      name: '',
      sortOrder: nextOrder,
      description: '',
      applyTo: 'ALL_CAMPUSES',
      branchIds: [],
      isActive: true,
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: SectionListItemDto) => {
    setFormData({
      name: item.name,
      sortOrder: item.sortOrder,
      description: item.description || '',
      applyTo: item.applyTo,
      branchIds: item.branchIds || [],
      isActive: item.isActive,
    });
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.isActive;
          showToast(`Section '${item.name}' ${nextState ? 'Activated' : 'Deactivated'}`);
          return { ...item, isActive: nextState, updatedAt: new Date() };
        }
        return item;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please fill Section Name.');
      return;
    }

    if (formData.applyTo === 'SELECTED_CAMPUSES' && formData.branchIds.length === 0) {
      alert('Please select at least one Campus for Selected Campuses.');
      return;
    }

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              name: formData.name.trim(),
              sortOrder: Number(formData.sortOrder) || item.sortOrder,
              description: formData.description.trim() || null,
              applyTo: formData.applyTo,
              branchIds: formData.branchIds,
              isActive: formData.isActive,
              updatedAt: new Date(),
            };
          }
          return item;
        })
      );
      showToast(`Updated Section '${formData.name}'`);
    } else {
      const newItem: SectionListItemDto = {
        id: `sec_${Date.now()}`,
        organizationId: '11111111-1111-1111-1111-111111111111',
        name: formData.name.trim(),
        sortOrder: Number(formData.sortOrder) || items.length + 1,
        description: formData.description.trim() || null,
        applyTo: formData.applyTo,
        branchIds: formData.branchIds,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setItems((prev) => [...prev, newItem].sort((a, b) => a.sortOrder - b.sortOrder));
      showToast(`Created Section '${newItem.name}'`);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <AdminConfigPageHeader
        group="Academic Setup"
        title="Sections"
        description="Reusable operational section names (Section A, B, Blue, Red) across classes and branch locations."
        categoryNav={ACADEMIC_SETUP_NAV}
        actionButtonText="Add Section"
        onAction={handleOpenAdd}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Sections</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-xs">🪑</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{items.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeCount} active operational</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">All-Campus Sections</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs">🌐</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {items.filter((i) => i.applyTo === 'ALL_CAMPUSES').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Dynamic inheritance enabled</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Selected Campuses</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-xs">📍</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {items.filter((i) => i.applyTo === 'SELECTED_CAMPUSES').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Campus-specific sections</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sections by name (e.g. Section A, Blue)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Campus Scopes</option>
            <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa">Main Campus (Gulshan)</option>
            <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">Clifton Campus</option>
            <option value="cccccccc-cccc-cccc-cccc-cccccccccccc">DHA Phase 8 Campus</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Section Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Campus Scope</th>
                <th className="py-3 px-4 text-center">Sort Order</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>🪑</span>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {item.applyTo === 'ALL_CAMPUSES' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          🌐 All Campuses
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          📍 {item.branchIds?.length || 0} Campuses
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{item.sortOrder}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(item.id, e)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        title="Click to toggle status"
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setViewingItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-medium cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No sections found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🪑</span>
                <span>{editingItem ? 'Edit Section' : 'Add Section'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Section Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Section A, Section Blue, Tulip"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Sort Order *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Scope Selector */}
              <ConfigScopeSelector
                applyTo={formData.applyTo}
                onChangeApplyTo={(val) => setFormData({ ...formData, applyTo: val })}
                selectedBranchIds={formData.branchIds}
                onChangeBranchIds={(ids) => setFormData({ ...formData, branchIds: ids })}
              />

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional section notes..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-4 -mx-5 -mb-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Detail Modal ────────────────────────────────────────── */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪑</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{viewingItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Sort Order</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingItem.sortOrder}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingItem.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Campus Applicability</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {viewingItem.applyTo === 'ALL_CAMPUSES'
                    ? '🌐 All Campuses (Dynamic Inheritance)'
                    : `📍 Selected Campuses (${viewingItem.branchNames?.length || viewingItem.branchIds?.length || 0})`}
                </p>
                {viewingItem.applyTo === 'SELECTED_CAMPUSES' && viewingItem.branchNames && viewingItem.branchNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {viewingItem.branchNames.map((b, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {viewingItem.description && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Description / Notes</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{viewingItem.description}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
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
