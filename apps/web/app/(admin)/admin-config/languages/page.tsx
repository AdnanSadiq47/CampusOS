'use client';

import React, { useState, useMemo } from 'react';
import { LanguageListItemDto, ConfigScopeType } from '@campus-os/types';
import { AdminConfigPageHeader, ACADEMIC_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { ConfigScopeSelector } from '../../../../components/ConfigScopeSelector';
import { AssignedToDetailsModal } from '../../../../components/AssignedToDetailsModal';
import { useWorkingContext } from '../../../../lib/working-context';
import {
  StatCard,
  StatusBadge,
  RowActions,
  ViewAction,
  EditAction,
} from '../../../../design-system';
import { Languages, Globe, MapPin } from 'lucide-react';

const DEFAULT_LANGUAGES: LanguageListItemDto[] = [
  {
    id: 'lang1111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'English',
    code: 'EN',
    sortOrder: 1,
    description: 'Primary medium of instruction across all curricula.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'lang2222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Urdu',
    code: 'UR',
    sortOrder: 2,
    description: 'National language compulsory curriculum and literary studies.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'lang3333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Arabic',
    code: 'AR',
    sortOrder: 3,
    description: 'Islamic theology, Quranic comprehension, and foreign language elective.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'lang4444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Sindhi',
    code: 'SD',
    sortOrder: 4,
    description: 'Regional provincial language curriculum.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'lang5555-5555-5555-5555-555555555555',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'French',
    code: 'FR',
    sortOrder: 5,
    description: 'Foreign language elective offered for Cambridge and IB diploma tracks.',
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
    branchNames: ['Main Campus (Gulshan)', 'Clifton Campus'],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export default function LanguagesPage() {
  const { currentContext, isConfigEffectiveForContext, getConfigSourceLabel } = useWorkingContext();
  const [items, setItems] = useState<LanguageListItemDto[]>(DEFAULT_LANGUAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'CURRENT_CONTEXT' | 'ALL_CONFIGURATIONS'>('CURRENT_CONTEXT');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LanguageListItemDto | null>(null);
  const [viewingItem, setViewingItem] = useState<LanguageListItemDto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedItemForAssignedModal, setSelectedItemForAssignedModal] = useState<{
    name: string;
    isEntireOrg: boolean;
    branchIds: string[];
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    sortOrder: number;
    description: string;
    applyTo: ConfigScopeType;
    branchIds: string[];
    isActive: boolean;
  }>({
    name: '',
    code: '',
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

  // Scoped dataset based on viewMode
  const scopedItems = useMemo(() => {
    if (viewMode === 'ALL_CONFIGURATIONS') return items;
    return items.filter((item) => isConfigEffectiveForContext(item.applyTo, item.branchIds || []));
  }, [items, viewMode, isConfigEffectiveForContext]);

  const activeCount = useMemo(() => scopedItems.filter((i) => i.isActive).length, [scopedItems]);

  const filteredItems = useMemo(() => {
    return scopedItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [scopedItems, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
    setFormData({
      name: '',
      code: '',
      sortOrder: nextOrder,
      description: '',
      applyTo: 'ALL_CAMPUSES',
      branchIds: [],
      isActive: true,
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: LanguageListItemDto) => {
    setFormData({
      name: item.name,
      code: item.code || '',
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
          showToast(`Language '${item.name}' ${nextState ? 'Activated' : 'Deactivated'}`);
          return { ...item, isActive: nextState, updatedAt: new Date() };
        }
        return item;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please fill Language Name.');
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
              code: formData.code.trim().toUpperCase() || null,
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
      showToast(`Updated Language '${formData.name}'`);
    } else {
      const newItem: LanguageListItemDto = {
        id: `lang_${Date.now()}`,
        organizationId: '11111111-1111-1111-1111-111111111111',
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || null,
        sortOrder: Number(formData.sortOrder) || items.length + 1,
        description: formData.description.trim() || null,
        applyTo: formData.applyTo,
        branchIds: formData.branchIds,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setItems((prev) => [...prev, newItem].sort((a, b) => a.sortOrder - b.sortOrder));
      showToast(`Created Language '${newItem.name}'`);
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
        title="Languages"
        description="Master catalog of instruction mediums, national languages, and foreign language electives."
        categoryNav={ACADEMIC_SETUP_NAV}
        actionButtonText="Add Language"
        onAction={handleOpenAdd}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Effective Languages"
          value={scopedItems.length}
          icon={<Languages className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          subtitle={`${activeCount} active in ${viewMode === 'CURRENT_CONTEXT' ? currentContext.name : 'All Scopes'}`}
          variant="default"
        />
        <StatCard
          title="Universal Languages"
          value={scopedItems.filter((i) => i.applyTo === 'ALL_CAMPUSES').length}
          icon={<Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle="Dynamic inheritance enabled"
          variant="success"
        />
        <StatCard
          title="Campus-Specific"
          value={scopedItems.filter((i) => i.applyTo === 'SELECTED_CAMPUSES').length}
          icon={<MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          subtitle={`Assigned to ${viewMode === 'CURRENT_CONTEXT' ? currentContext.name : 'designated campuses'}`}
          variant="info"
        />
      </div>

      {/* Filter & View Mode Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search languages by name, code (e.g. English, EN, Urdu)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('CURRENT_CONTEXT')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'CURRENT_CONTEXT'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={`Show configurations effective for ${currentContext.name}`}
            >
              <span>📍</span>
              <span className="truncate max-w-[140px] sm:max-w-[180px]">{currentContext.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('ALL_CONFIGURATIONS')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'ALL_CONFIGURATIONS'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Show all configurations across the entire organization"
            >
              <span>🌐</span>
              <span>All Configurations ({items.length})</span>
            </button>
          </div>

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
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-center">Sort Order</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const scopeLabel = getConfigSourceLabel(item.applyTo, item.branchIds || []);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>🗣️</span>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{item.code || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {item.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedItemForAssignedModal({
                              name: item.name,
                              isEntireOrg: item.applyTo === 'ALL_CAMPUSES',
                              branchIds: item.branchIds || [],
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition-all shadow-xs ${
                            scopeLabel === 'Universal'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                              : scopeLabel === 'Direct'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                          }`}
                          title="See where this language is assigned"
                        >
                          <span>{scopeLabel === 'Universal' ? '🌐 Universal' : `📍 ${item.branchIds?.length || 0} Campuses`}</span>
                          <span className="text-[9px] opacity-70">›</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{item.sortOrder}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(item.id, e)}
                          title="Click to toggle status"
                          className="cursor-pointer"
                        >
                          <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <RowActions>
                          <ViewAction onClick={() => setViewingItem(item)} />
                          <EditAction onClick={() => handleOpenEdit(item)} />
                        </RowActions>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No languages found matching your search and filter criteria.
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
                <span>🗣️</span>
                <span>{editingItem ? 'Edit Language' : 'Add Language'}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Language Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. English, Urdu, Arabic, French"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Language Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. EN, UR, AR"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
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
                  placeholder="Optional notes regarding language curriculum or certification..."
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
                  {editingItem ? 'Save Changes' : 'Create Language'}
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
                <span className="text-xl">🗣️</span>
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
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Language Code</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingItem.code || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Sort Order</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingItem.sortOrder}</p>
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

      {/* Reusable Assigned To Details Modal Popup */}
      <AssignedToDetailsModal
        isOpen={!!selectedItemForAssignedModal}
        onClose={() => setSelectedItemForAssignedModal(null)}
        formName={selectedItemForAssignedModal?.name || ''}
        currentContextName={currentContext.name}
        currentContextCampusIds={currentContext.effectiveCampusIds}
        scopeState={{
          isEntireOrg: selectedItemForAssignedModal?.isEntireOrg ?? false,
          selectedHeadOfficeIds: [],
          selectedRegionIds: [],
          selectedSchoolIds: [],
          selectedCampusIds: selectedItemForAssignedModal?.branchIds || [],
        }}
      />
    </div>
  );
}
