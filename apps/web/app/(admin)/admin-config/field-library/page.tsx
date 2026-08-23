'use client';

import React, { useState, useMemo } from 'react';
import {
  AdminConfigPageHeader,
  FORMS_SETUP_NAV,
} from '../../../../components/AdminConfigPageHeader';
import { ResponsiveFilterToolbar } from '../../../../components/ResponsiveFilterToolbar';
import { CLIENT_MASTER_FIELD_CATALOG, FIELD_CATEGORIES_INFO } from '../../../../lib/forms-catalog';
import {
  FieldCategory,
  FieldDataType,
  FieldDefinitionDto,
} from '@campus-os/types';

export default function FieldLibraryPage() {
  const [fields, setFields] = useState<FieldDefinitionDto[]>(CLIENT_MASTER_FIELD_CATALOG);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState('ALL');

  // Custom Field Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<FieldCategory>('STUDENT_BASIC');
  const [customDataType, setCustomDataType] = useState<FieldDataType>('TEXT');
  const [customLabel, setCustomLabel] = useState('');
  const [customPlaceholder, setCustomPlaceholder] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Filtered fields list
  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
      if (originFilter !== 'ALL' && f.origin !== originFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.defaultLabel.toLowerCase().includes(q) ||
          (f.canonicalKey && f.canonicalKey.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [fields, categoryFilter, originFilter, search]);

  // Duplicate Canonical Detection
  const handleNameChange = (name: string) => {
    setCustomName(name);
    if (!customLabel) setCustomLabel(name);

    const clean = name.trim().toLowerCase();
    if (clean.includes('dob') || clean.includes('birth') || clean.includes('date of birth')) {
      setDuplicateWarning(
        "A canonical system field 'Date of Birth' (STUDENT_DOB) already exists. We recommend using the canonical field for automated age eligibility and ERP synchronization."
      );
    } else if (clean.includes('father mobile') || clean.includes('father phone') || clean.includes('sms mobile')) {
      setDuplicateWarning(
        "A canonical field 'Father Mobile' / 'Primary Contact Mobile' already exists. We recommend using the canonical field for SMS alerts."
      );
    } else if (clean.includes('cnic') || clean.includes('national id')) {
      setDuplicateWarning(
        "A canonical field 'Father CNIC' / 'National ID' already exists. We recommend selecting it from the library."
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newField: FieldDefinitionDto = {
      id: `cust_${Date.now()}`,
      code: `CUST_${customName.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
      name: customName.trim(),
      category: customCategory,
      origin: 'CUSTOM',
      dataType: customDataType,
      defaultLabel: customLabel.trim() || customName.trim(),
      defaultPlaceholder: customPlaceholder.trim() || undefined,
      isSystemProtected: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setFields([newField, ...fields]);
    setShowCreateModal(false);
    setCustomName('');
    setCustomLabel('');
    setCustomPlaceholder('');
    setDuplicateWarning(null);
  };

  return (
    <div className="space-y-6">
      <AdminConfigPageHeader
        group="Forms Setup"
        title="Field Library"
        description="Comprehensive catalog of 80+ canonical, standard, and custom form fields with ERP smart bindings."
        configItemId="forms_field_library"
        categoryNav={FORMS_SETUP_NAV}
        actionButtonText="+ Add Custom Field"
        onAction={() => setShowCreateModal(true)}
      />

      {/* Filter Toolbar */}
      <ResponsiveFilterToolbar
        searchPlaceholder="Search fields by name, code, or canonical concept..."
        searchTerm={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: 'category',
            label: 'Category',
            value: categoryFilter,
            options: [
              { label: 'All Categories', value: 'ALL' },
              ...FIELD_CATEGORIES_INFO.map((cat) => ({
                label: `${cat.icon} ${cat.name}`,
                value: cat.key,
              })),
            ],
            onChange: setCategoryFilter,
          },
          {
            id: 'origin',
            label: 'Field Origin',
            value: originFilter,
            options: [
              { label: 'All Origins', value: 'ALL' },
              { label: 'Canonical (Core Concept)', value: 'CANONICAL' },
              { label: 'Standard (Optional Master)', value: 'STANDARD' },
              { label: 'Custom (School Defined)', value: 'CUSTOM' },
            ],
            onChange: setOriginFilter,
          },
        ]}
      />

      {/* Field Library Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFields.map((fld) => {
          const categoryInfo = FIELD_CATEGORIES_INFO.find((c) => c.key === fld.category);

          return (
            <div
              key={fld.code}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryInfo?.icon || '📝'}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {categoryInfo?.name || fld.category}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    fld.origin === 'CANONICAL'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : fld.origin === 'CUSTOM'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {fld.origin}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{fld.name}</h3>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-slate-400 font-normal">Label:</span> {fld.defaultLabel}
                  </div>
                  {fld.masterBinding && (
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                      <span>🔗 Smart ERP Master:</span>
                      <span className="font-mono">{fld.masterBinding}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{fld.code}</span>
                <span className="uppercase text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {fld.dataType}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Field Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Custom Field</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomField} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Field Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scholarship Exam Roll Number"
                  value={customName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Duplicate Concept Warning Alert */}
              {duplicateWarning && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <span className="text-lg shrink-0">⚠️</span>
                  <span>{duplicateWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as FieldCategory)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    {FIELD_CATEGORIES_INFO.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Data Type *
                  </label>
                  <select
                    value={customDataType}
                    onChange={(e) => setCustomDataType(e.target.value as FieldDataType)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="TEXT">Short Text</option>
                    <option value="TEXTAREA">Paragraph / Long Text</option>
                    <option value="NUMBER">Number (Integer)</option>
                    <option value="DECIMAL">Decimal / Percentage</option>
                    <option value="DATE">Date Picker</option>
                    <option value="DROPDOWN">Dropdown List</option>
                    <option value="CHECKBOX">Checkbox (Yes/No)</option>
                    <option value="FILE_UPLOAD">File Upload</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Default Display Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scholarship Exam Roll Number"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Placeholder (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SCH-2026-001"
                  value={customPlaceholder}
                  onChange={(e) => setCustomPlaceholder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20"
                >
                  Add to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
