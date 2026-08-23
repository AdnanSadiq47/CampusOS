'use client';

import React, { useState, useMemo } from 'react';
import { ClassListItemDto, ConfigScopeType } from '@campus-os/types';
import { AdminConfigPageHeader, ACADEMIC_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { ConfigScopeSelector } from '../../../../components/ConfigScopeSelector';

const DEFAULT_SUBJECTS_CATALOG = [
  { id: 's1', name: 'Mathematics' },
  { id: 's2', name: 'English Language' },
  { id: 's3', name: 'Urdu Literature' },
  { id: 's4', name: 'General Science' },
  { id: 's5', name: 'Social Studies' },
  { id: 's6', name: 'Physics' },
  { id: 's7', name: 'Chemistry' },
  { id: 's8', name: 'Biology' },
  { id: 's9', name: 'Computer Science' },
  { id: 's10', name: 'Art & Design' },
  { id: 's11', name: 'French' },
];

const DEFAULT_LEVELS_CATALOG = [
  { id: 'lvl1', name: 'Early Years / Pre-School' },
  { id: 'lvl2', name: 'Primary Stage' },
  { id: 'lvl3', name: 'Middle Stage' },
  { id: 'lvl4', name: 'Secondary / High School' },
  { id: 'lvl5', name: 'Higher Secondary / College' },
];

const DEFAULT_CLASSES: ClassListItemDto[] = [
  {
    id: 'cls11111-1111-1111-1111-111111111111',
    organizationId: '11111111-1111-1111-1111-111111111111',
    levelId: 'lvl1',
    levelName: 'Early Years / Pre-School',
    name: 'Kindergarten / KG',
    shortName: 'KG',
    code: 'CLS-KG',
    fromAge: 4.5,
    toAge: 6.0,
    compulsorySubjectIds: ['s2', 's3', 's10'],
    compulsorySubjectNames: ['English Language', 'Urdu Literature', 'Art & Design'],
    optionalSubjectIds: [],
    optionalSubjectNames: [],
    totalSubjectsCount: 3,
    sortOrder: 1,
    description: 'Pre-school kindergarten stage with early literacy and motor skills.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'cls22222-2222-2222-2222-222222222222',
    organizationId: '11111111-1111-1111-1111-111111111111',
    levelId: 'lvl2',
    levelName: 'Primary Stage',
    name: 'Grade 1',
    shortName: 'G1',
    code: 'CLS-G1',
    fromAge: 5.5,
    toAge: 7.0,
    compulsorySubjectIds: ['s1', 's2', 's3', 's4'],
    compulsorySubjectNames: ['Mathematics', 'English Language', 'Urdu Literature', 'General Science'],
    optionalSubjectIds: ['s10'],
    optionalSubjectNames: ['Art & Design'],
    totalSubjectsCount: 5,
    sortOrder: 2,
    description: 'Elementary primary entry class.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'cls33333-3333-3333-3333-333333333333',
    organizationId: '11111111-1111-1111-1111-111111111111',
    levelId: 'lvl2',
    levelName: 'Primary Stage',
    name: 'Grade 5',
    shortName: 'G5',
    code: 'CLS-G5',
    fromAge: 9.5,
    toAge: 11.0,
    compulsorySubjectIds: ['s1', 's2', 's3', 's4', 's5'],
    compulsorySubjectNames: ['Mathematics', 'English Language', 'Urdu Literature', 'General Science', 'Social Studies'],
    optionalSubjectIds: ['s9', 's10'],
    optionalSubjectNames: ['Computer Science', 'Art & Design'],
    totalSubjectsCount: 7,
    sortOrder: 3,
    description: 'Final year of primary school before middle stage transition.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'cls44444-4444-4444-4444-444444444444',
    organizationId: '11111111-1111-1111-1111-111111111111',
    levelId: 'lvl4',
    levelName: 'Secondary / High School',
    name: 'Grade 10 / Matric',
    shortName: 'G10',
    code: 'CLS-G10',
    fromAge: 14.0,
    toAge: 16.5,
    compulsorySubjectIds: ['s1', 's2', 's3', 's6', 's7'],
    compulsorySubjectNames: ['Mathematics', 'English Language', 'Urdu Literature', 'Physics', 'Chemistry'],
    optionalSubjectIds: ['s8', 's9'],
    optionalSubjectNames: ['Biology', 'Computer Science'],
    totalSubjectsCount: 7,
    sortOrder: 4,
    description: 'Matriculation graduating secondary class.',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'cls55555-5555-5555-5555-555555555555',
    organizationId: '11111111-1111-1111-1111-111111111111',
    levelId: 'lvl5',
    levelName: 'Higher Secondary / College',
    name: 'A-Levels Year 1 (AS)',
    shortName: 'A1',
    code: 'CLS-A1',
    fromAge: 16.0,
    toAge: 18.5,
    compulsorySubjectIds: ['s2'],
    compulsorySubjectNames: ['English Language'],
    optionalSubjectIds: ['s1', 's6', 's7', 's8', 's9', 's11'],
    optionalSubjectNames: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'French'],
    totalSubjectsCount: 7,
    sortOrder: 5,
    description: 'Advanced Level British curriculum for college campuses.',
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
    branchNames: ['Main Campus (Gulshan)', 'Clifton Campus'],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export default function ClassesPage() {
  const [items, setItems] = useState<ClassListItemDto[]>(DEFAULT_CLASSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassListItemDto | null>(null);
  const [viewingItem, setViewingItem] = useState<ClassListItemDto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    levelId: string;
    name: string;
    shortName: string;
    code: string;
    fromAge: string;
    toAge: string;
    compulsorySubjectIds: string[];
    optionalSubjectIds: string[];
    sortOrder: number;
    description: string;
    applyTo: ConfigScopeType;
    branchIds: string[];
    isActive: boolean;
  }>({
    levelId: 'lvl2',
    name: '',
    shortName: '',
    code: '',
    fromAge: '',
    toAge: '',
    compulsorySubjectIds: [],
    optionalSubjectIds: [],
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
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.levelName && item.levelName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLevel = levelFilter === 'ALL' || item.levelId === levelFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      const matchesCampus =
        campusFilter === 'ALL' ||
        item.applyTo === 'ALL_CAMPUSES' ||
        (item.branchIds && item.branchIds.includes(campusFilter));

      return matchesSearch && matchesLevel && matchesStatus && matchesCampus;
    });
  }, [items, searchQuery, levelFilter, statusFilter, campusFilter]);

  const handleOpenAdd = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
    setFormData({
      levelId: DEFAULT_LEVELS_CATALOG[1]?.id || 'lvl2',
      name: '',
      shortName: '',
      code: '',
      fromAge: '',
      toAge: '',
      compulsorySubjectIds: [],
      optionalSubjectIds: [],
      sortOrder: nextOrder,
      description: '',
      applyTo: 'ALL_CAMPUSES',
      branchIds: [],
      isActive: true,
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: ClassListItemDto) => {
    setFormData({
      levelId: item.levelId,
      name: item.name,
      shortName: item.shortName || '',
      code: item.code || '',
      fromAge: item.fromAge !== null && item.fromAge !== undefined ? String(item.fromAge) : '',
      toAge: item.toAge !== null && item.toAge !== undefined ? String(item.toAge) : '',
      compulsorySubjectIds: item.compulsorySubjectIds || [],
      optionalSubjectIds: item.optionalSubjectIds || [],
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
          showToast(`Class '${item.name}' ${nextState ? 'Activated' : 'Deactivated'}`);
          return { ...item, isActive: nextState, updatedAt: new Date() };
        }
        return item;
      })
    );
  };

  const toggleCompulsorySubject = (subjectId: string) => {
    if (formData.compulsorySubjectIds.includes(subjectId)) {
      setFormData({
        ...formData,
        compulsorySubjectIds: formData.compulsorySubjectIds.filter((id) => id !== subjectId),
      });
    } else {
      // Remove from optional if present
      setFormData({
        ...formData,
        compulsorySubjectIds: [...formData.compulsorySubjectIds, subjectId],
        optionalSubjectIds: formData.optionalSubjectIds.filter((id) => id !== subjectId),
      });
    }
  };

  const toggleOptionalSubject = (subjectId: string) => {
    if (formData.optionalSubjectIds.includes(subjectId)) {
      setFormData({
        ...formData,
        optionalSubjectIds: formData.optionalSubjectIds.filter((id) => id !== subjectId),
      });
    } else {
      // Remove from compulsory if present
      setFormData({
        ...formData,
        optionalSubjectIds: [...formData.optionalSubjectIds, subjectId],
        compulsorySubjectIds: formData.compulsorySubjectIds.filter((id) => id !== subjectId),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.levelId) {
      alert('Please fill Class Name and select an Academic Level.');
      return;
    }

    const fromAgeNum = formData.fromAge ? parseFloat(formData.fromAge) : null;
    const toAgeNum = formData.toAge ? parseFloat(formData.toAge) : null;

    if (fromAgeNum !== null && toAgeNum !== null && fromAgeNum > toAgeNum) {
      alert('From Age must be less than or equal to To Age.');
      return;
    }

    if (formData.applyTo === 'SELECTED_CAMPUSES' && formData.branchIds.length === 0) {
      alert('Please select at least one Campus for Selected Campuses.');
      return;
    }

    const levelObj = DEFAULT_LEVELS_CATALOG.find((l) => l.id === formData.levelId);
    const compNames = formData.compulsorySubjectIds.map(
      (id) => DEFAULT_SUBJECTS_CATALOG.find((s) => s.id === id)?.name || id
    );
    const optNames = formData.optionalSubjectIds.map(
      (id) => DEFAULT_SUBJECTS_CATALOG.find((s) => s.id === id)?.name || id
    );

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              levelId: formData.levelId,
              levelName: levelObj?.name || item.levelName,
              name: formData.name.trim(),
              shortName: formData.shortName.trim() || null,
              code: formData.code.trim().toUpperCase() || null,
              fromAge: fromAgeNum,
              toAge: toAgeNum,
              compulsorySubjectIds: formData.compulsorySubjectIds,
              compulsorySubjectNames: compNames,
              optionalSubjectIds: formData.optionalSubjectIds,
              optionalSubjectNames: optNames,
              totalSubjectsCount: compNames.length + optNames.length,
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
      showToast(`Updated Class '${formData.name}'`);
    } else {
      const newItem: ClassListItemDto = {
        id: `cls_${Date.now()}`,
        organizationId: '11111111-1111-1111-1111-111111111111',
        levelId: formData.levelId,
        levelName: levelObj?.name || 'Primary Stage',
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || null,
        code: formData.code.trim().toUpperCase() || null,
        fromAge: fromAgeNum,
        toAge: toAgeNum,
        compulsorySubjectIds: formData.compulsorySubjectIds,
        compulsorySubjectNames: compNames,
        optionalSubjectIds: formData.optionalSubjectIds,
        optionalSubjectNames: optNames,
        totalSubjectsCount: compNames.length + optNames.length,
        sortOrder: Number(formData.sortOrder) || items.length + 1,
        description: formData.description.trim() || null,
        applyTo: formData.applyTo,
        branchIds: formData.branchIds,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setItems((prev) => [...prev, newItem].sort((a, b) => a.sortOrder - b.sortOrder));
      showToast(`Created Class '${newItem.name}'`);
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
        title="Classes / Grades"
        description="Configure academic grades under stages, optional age eligibility criteria, and default compulsory/elective subject mappings."
        categoryNav={ACADEMIC_SETUP_NAV}
        actionButtonText="Add Class"
        onAction={handleOpenAdd}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Classes / Grades</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-xs">🏫</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{items.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeCount} active operational</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">All-Campus Classes</span>
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
          <p className="text-[11px] text-slate-400 mt-0.5">Custom campus grades</p>
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
            placeholder="Search classes by name, code (e.g. Grade 1, Grade 5, G10)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Academic Stages</option>
            {DEFAULT_LEVELS_CATALOG.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Campus Filter */}
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
                <th className="py-3 px-4">Class / Grade</th>
                <th className="py-3 px-4">Academic Stage</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Age Range</th>
                <th className="py-3 px-4">Mapped Subjects</th>
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
                        <span>🏫</span>
                        <span>{item.name}</span>
                        {item.shortName && <span className="text-slate-400 font-normal">({item.shortName})</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{item.levelName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{item.code || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {item.fromAge || item.toAge ? (
                        <span>
                          {item.fromAge ?? '0'} – {item.toAge ?? '∞'} yrs
                        </span>
                      ) : (
                        <span className="text-slate-400">Any Age</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        📚 {item.totalSubjectsCount || 0} Subjects
                      </span>
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
                    No classes found matching your search and filter criteria.
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
                <span>🏫</span>
                <span>{editingItem ? 'Edit Class / Grade' : 'Add Class / Grade'}</span>
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Class / Grade Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Grade 1, Grade 5, Class 10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Academic Stage *</label>
                  <select
                    value={formData.levelId}
                    onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {DEFAULT_LEVELS_CATALOG.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Short Name</label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="e.g. G5, A1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Class Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. CLS-G5"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">From Age (Yrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.fromAge}
                    onChange={(e) => setFormData({ ...formData, fromAge: e.target.value })}
                    placeholder="e.g. 5.5"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">To Age (Yrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.toAge}
                    onChange={(e) => setFormData({ ...formData, toAge: e.target.value })}
                    placeholder="e.g. 7.0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Compulsory & Optional Subject Mapping Section */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Default Subject Curriculum Mappings</h4>
                  <p className="text-[11px] text-slate-400">
                    Assign default compulsory and elective subjects for this grade level.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Compulsory Subjects List */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                      <span>📌 Compulsory Subjects ({formData.compulsorySubjectIds.length})</span>
                    </span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {DEFAULT_SUBJECTS_CATALOG.map((sub) => {
                        const isComp = formData.compulsorySubjectIds.includes(sub.id);
                        return (
                          <label
                            key={sub.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                              isComp
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isComp}
                              onChange={() => toggleCompulsorySubject(sub.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span>{sub.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Subjects List */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                      <span>✨ Optional / Elective Subjects ({formData.optionalSubjectIds.length})</span>
                    </span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {DEFAULT_SUBJECTS_CATALOG.map((sub) => {
                        const isOpt = formData.optionalSubjectIds.includes(sub.id);
                        return (
                          <label
                            key={sub.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                              isOpt
                                ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isOpt}
                              onChange={() => toggleOptionalSubject(sub.id)}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                            />
                            <span>{sub.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scope Selector */}
              <ConfigScopeSelector
                applyTo={formData.applyTo}
                onChangeApplyTo={(val) => setFormData({ ...formData, applyTo: val })}
                selectedBranchIds={formData.branchIds}
                onChangeBranchIds={(ids) => setFormData({ ...formData, branchIds: ids })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Description / Notes</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional notes regarding class curriculum or milestones..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
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
                  {editingItem ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Detail Modal ────────────────────────────────────────── */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏫</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{viewingItem.name}</h3>
                  <p className="text-[11px] text-slate-400">{viewingItem.levelName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Class Code</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingItem.code || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Age Range</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingItem.fromAge || viewingItem.toAge
                      ? `${viewingItem.fromAge ?? '0'} – ${viewingItem.toAge ?? '∞'} Years`
                      : 'Any Age'}
                  </p>
                </div>
              </div>

              {/* Compulsory Subjects */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Compulsory Subjects ({viewingItem.compulsorySubjectNames?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {viewingItem.compulsorySubjectNames && viewingItem.compulsorySubjectNames.length > 0 ? (
                    viewingItem.compulsorySubjectNames.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">None configured</span>
                  )}
                </div>
              </div>

              {/* Optional Subjects */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Optional / Elective Subjects ({viewingItem.optionalSubjectNames?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {viewingItem.optionalSubjectNames && viewingItem.optionalSubjectNames.length > 0 ? (
                    viewingItem.optionalSubjectNames.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">None configured</span>
                  )}
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
