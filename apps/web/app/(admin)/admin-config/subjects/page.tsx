'use client';

import React, { useState, useMemo } from 'react';
import { SubjectListItemDto, SubjectType, SubjectCategory, ConfigScopeType } from '@campus-os/types';
import { AdminConfigPageHeader, ACADEMIC_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { ConfigScopeSelector } from '../../../../components/ConfigScopeSelector';

const DEFAULT_SUBJECTS: SubjectListItemDto[] = [
  {
    id: 'sub11111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Mathematics',
    shortName: 'MATH',
    code: 'MATH-101',
    type: 'Theory',
    category: 'Core',
    defaultMaxMarks: 100,
    defaultPassingMarks: 40,
    hasPractical: false,
    practicalMaxMarks: null,
    creditWeight: 4.0,
    sortOrder: 1,
    description: 'Foundational mathematics covering arithmetic, algebra, and geometry.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sub22222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'English Language & Literature',
    shortName: 'ENG',
    code: 'ENG-101',
    type: 'Theory',
    category: 'Language',
    defaultMaxMarks: 100,
    defaultPassingMarks: 40,
    hasPractical: false,
    practicalMaxMarks: null,
    creditWeight: 4.0,
    sortOrder: 2,
    description: 'English language skills, comprehension, creative writing, and grammar.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sub33333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Physics',
    shortName: 'PHY',
    code: 'PHY-201',
    type: 'Theory + Practical',
    category: 'Science',
    defaultMaxMarks: 100,
    defaultPassingMarks: 40,
    hasPractical: true,
    practicalMaxMarks: 25,
    creditWeight: 4.0,
    sortOrder: 3,
    description: 'Classical mechanics, thermodynamics, and laboratory experiments.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sub44444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Computer Science & Coding',
    shortName: 'CS',
    code: 'CS-301',
    type: 'Theory + Practical',
    category: 'Core',
    defaultMaxMarks: 100,
    defaultPassingMarks: 40,
    hasPractical: true,
    practicalMaxMarks: 30,
    creditWeight: 3.5,
    sortOrder: 4,
    description: 'Algorithms, Python programming, database concepts, and lab projects.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'sub55555-5555-5555-5555-555555555555',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Fine Arts & Design',
    shortName: 'ART',
    code: 'ART-105',
    type: 'Practical',
    category: 'Arts',
    defaultMaxMarks: 100,
    defaultPassingMarks: 40,
    hasPractical: true,
    practicalMaxMarks: 80,
    creditWeight: 2.0,
    sortOrder: 5,
    description: 'Visual arts, sketching, digital illustration, and portfolio evaluation.',
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
    branchNames: ['Main Campus (Gulshan)', 'Clifton Campus'],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

const SUBJECT_TYPES: SubjectType[] = ['Theory', 'Practical', 'Theory + Practical', 'Activity'];
const SUBJECT_CATEGORIES: SubjectCategory[] = [
  'Core',
  'Elective',
  'Language',
  'Science',
  'Commerce',
  'Arts',
  'Lab',
  'Activity',
  'Other',
];

export default function SubjectsPage() {
  const [items, setItems] = useState<SubjectListItemDto[]>(DEFAULT_SUBJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubjectListItemDto | null>(null);
  const [viewingItem, setViewingItem] = useState<SubjectListItemDto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    shortName: string;
    code: string;
    type: SubjectType;
    category: SubjectCategory;
    defaultMaxMarks: number;
    defaultPassingMarks: number;
    hasPractical: boolean;
    practicalMaxMarks: number;
    creditWeight: number;
    sortOrder: number;
    description: string;
    applyTo: ConfigScopeType;
    branchIds: string[];
    isActive: boolean;
  }>({
    name: '',
    shortName: '',
    code: '',
    type: 'Theory',
    category: 'Core',
    defaultMaxMarks: 100,
    defaultPassingMarks: 40,
    hasPractical: false,
    practicalMaxMarks: 25,
    creditWeight: 3.0,
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
        (item.shortName && item.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      const matchesCampus =
        campusFilter === 'ALL' ||
        item.applyTo === 'ALL_CAMPUSES' ||
        (item.branchIds && item.branchIds.includes(campusFilter));

      return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesCampus;
    });
  }, [items, searchQuery, statusFilter, typeFilter, categoryFilter, campusFilter]);

  const handleOpenAdd = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
    setFormData({
      name: '',
      shortName: '',
      code: '',
      type: 'Theory',
      category: 'Core',
      defaultMaxMarks: 100,
      defaultPassingMarks: 40,
      hasPractical: false,
      practicalMaxMarks: 25,
      creditWeight: 3.0,
      sortOrder: nextOrder,
      description: '',
      applyTo: 'ALL_CAMPUSES',
      branchIds: [],
      isActive: true,
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: SubjectListItemDto) => {
    setFormData({
      name: item.name,
      shortName: item.shortName || '',
      code: item.code || '',
      type: item.type,
      category: item.category,
      defaultMaxMarks: item.defaultMaxMarks || 100,
      defaultPassingMarks: item.defaultPassingMarks || 40,
      hasPractical: item.hasPractical,
      practicalMaxMarks: item.practicalMaxMarks || 25,
      creditWeight: item.creditWeight || 3.0,
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
          showToast(`Subject '${item.name}' ${nextState ? 'Activated' : 'Deactivated'}`);
          return { ...item, isActive: nextState, updatedAt: new Date() };
        }
        return item;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please fill Subject Name.');
      return;
    }

    if (formData.applyTo === 'SELECTED_CAMPUSES' && formData.branchIds.length === 0) {
      alert('Please select at least one Campus for Selected Campuses.');
      return;
    }

    const practicalMarks = formData.hasPractical ? Number(formData.practicalMaxMarks) || null : null;

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              name: formData.name.trim(),
              shortName: formData.shortName.trim() || null,
              code: formData.code.trim().toUpperCase() || null,
              type: formData.type,
              category: formData.category,
              defaultMaxMarks: Number(formData.defaultMaxMarks) || null,
              defaultPassingMarks: Number(formData.defaultPassingMarks) || null,
              hasPractical: formData.hasPractical,
              practicalMaxMarks: practicalMarks,
              creditWeight: Number(formData.creditWeight) || null,
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
      showToast(`Updated Subject '${formData.name}'`);
    } else {
      const newItem: SubjectListItemDto = {
        id: `sub_${Date.now()}`,
        organizationId: '11111111-1111-1111-1111-111111111111',
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || null,
        code: formData.code.trim().toUpperCase() || null,
        type: formData.type,
        category: formData.category,
        defaultMaxMarks: Number(formData.defaultMaxMarks) || null,
        defaultPassingMarks: Number(formData.defaultPassingMarks) || null,
        hasPractical: formData.hasPractical,
        practicalMaxMarks: practicalMarks,
        creditWeight: Number(formData.creditWeight) || null,
        sortOrder: Number(formData.sortOrder) || items.length + 1,
        description: formData.description.trim() || null,
        applyTo: formData.applyTo,
        branchIds: formData.branchIds,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setItems((prev) => [...prev, newItem].sort((a, b) => a.sortOrder - b.sortOrder));
      showToast(`Created Subject '${newItem.name}'`);
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
        title="Subjects"
        description="Master catalog of subjects, theory/practical classifications, subject categories, and default examination weightings."
        categoryNav={ACADEMIC_SETUP_NAV}
        actionButtonText="Add Subject"
        onAction={handleOpenAdd}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Subjects</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-xs">📖</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{items.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeCount} active operational</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Practical & Lab Subjects</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-xs">🔬</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {items.filter((i) => i.hasPractical).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Laboratory enabled</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">All-Campus Masters</span>
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
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xs">📍</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {items.filter((i) => i.applyTo === 'SELECTED_CAMPUSES').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Custom campus electives</p>
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
            placeholder="Search subjects by name, code (e.g. MATH-101, PHY-201)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Types</option>
            {SUBJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Categories</option>
            {SUBJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Campus Filter */}
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Campuses</option>
            <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa">Main Campus (Gulshan)</option>
            <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">Clifton Campus</option>
            <option value="cccccccc-cccc-cccc-cccc-cccccccccccc">DHA Phase 8 Campus</option>
          </select>

          {/* Status Filter */}
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
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Marks (Theory / Pract)</th>
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
                        <span>📖</span>
                        <span>{item.name}</span>
                        {item.shortName && (
                          <span className="text-slate-400 font-normal">({item.shortName})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{item.code || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                      {item.defaultMaxMarks || 100}
                      {item.hasPractical && item.practicalMaxMarks ? ` (${item.practicalMaxMarks}p)` : ''}
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
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    No subjects found matching your search and filter criteria.
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
          <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📖</span>
                <span>{editingItem ? 'Edit Subject' : 'Add Subject'}</span>
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Mathematics, Physics, Chemistry"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Short Name</label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="e.g. MATH, PHY"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Subject Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. MATH-101"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Subject Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {SUBJECT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Subject Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {SUBJECT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Default Marks & Practical Metadata */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Default Assessment Metadata</span>
                  <span className="text-[11px] text-slate-400">Defaults only (Overridable per exam/scheme)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">Default Max Marks</label>
                    <input
                      type="number"
                      value={formData.defaultMaxMarks}
                      onChange={(e) => setFormData({ ...formData, defaultMaxMarks: parseFloat(e.target.value) || 100 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">Passing Marks</label>
                    <input
                      type="number"
                      value={formData.defaultPassingMarks}
                      onChange={(e) => setFormData({ ...formData, defaultPassingMarks: parseFloat(e.target.value) || 40 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">Credit / Weight</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.creditWeight}
                      onChange={(e) => setFormData({ ...formData, creditWeight: parseFloat(e.target.value) || 1.0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">Sort Order *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Practical Toggle & Marks */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPractical}
                      onChange={(e) => setFormData({ ...formData, hasPractical: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Subject includes Laboratory / Practical Component
                    </span>
                  </label>

                  {formData.hasPractical && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Practical Max Marks:</span>
                      <input
                        type="number"
                        value={formData.practicalMaxMarks}
                        onChange={(e) => setFormData({ ...formData, practicalMaxMarks: parseFloat(e.target.value) || 25 })}
                        className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  )}
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
                  placeholder="Optional syllabus summary, prerequisites, or curriculum references..."
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
                  {editingItem ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Detail Modal ────────────────────────────────────────── */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Code</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingItem.code || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Type</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingItem.type}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Category</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingItem.category}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Max Marks</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingItem.defaultMaxMarks || 100}
                    {viewingItem.hasPractical && viewingItem.practicalMaxMarks ? ` (${viewingItem.practicalMaxMarks}p)` : ''}
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
