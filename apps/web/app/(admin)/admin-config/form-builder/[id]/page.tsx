'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CLIENT_MASTER_FIELD_CATALOG, FIELD_CATEGORIES_INFO, FieldCategoryInfo } from '../../../../../lib/forms-catalog';
import { FormRuntimeRenderer } from '../../../../../components/FormRuntimeRenderer';
import {
  FormFieldInstance,
  FormSectionInstance,
  FormConditionalRule,
  FieldDefinitionDto,
} from '@campus-os/types';

export default function FormBuilderEditorPage() {
  // Form definition state
  const [formName, setFormName] = useState('Online Pre-Registration 2026-2027');
  const [formPurpose] = useState('PRE_REGISTRATION');
  const [versionNumber] = useState(1);
  const [versionStatus, setVersionStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [isSaved, setIsSaved] = useState(true);

  // Field library state
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string>('ALL');

  // Canvas schema payload
  const [sections, setSections] = useState<FormSectionInstance[]>([
    {
      id: 'sec_student_details',
      title: 'Student Basic Details',
      description: 'Official student biographical information.',
      showSectionHeading: true,
      columns: 2,
      sortOrder: 1,
      fields: [
        {
          instanceId: 'fld_first_name',
          fieldDefinitionId: 'STD_FIRST_NAME',
          canonicalKey: 'STUDENT_FIRST_NAME',
          customLabel: 'Student First Name',
          placeholder: 'Enter first name',
          width: 'HALF',
          isRequired: true,
          sortOrder: 1,
        },
        {
          instanceId: 'fld_last_name',
          fieldDefinitionId: 'STD_LAST_NAME',
          canonicalKey: 'STUDENT_LAST_NAME',
          customLabel: 'Student Last Name',
          placeholder: 'Enter last name',
          width: 'HALF',
          isRequired: true,
          sortOrder: 2,
        },
        {
          instanceId: 'fld_dob',
          fieldDefinitionId: 'STD_DOB',
          canonicalKey: 'STUDENT_DOB',
          customLabel: 'Date of Birth',
          width: 'HALF',
          isRequired: true,
          sortOrder: 3,
        },
        {
          instanceId: 'fld_class',
          fieldDefinitionId: 'ACAD_CLASS_REF',
          canonicalKey: 'APPLYING_CLASS',
          customLabel: 'Applying Class / Grade',
          width: 'HALF',
          isRequired: true,
          masterBinding: 'CLASS',
          sortOrder: 4,
        },
      ],
    },
    {
      id: 'sec_parent_details',
      title: 'Parent / Guardian & Contact',
      description: 'Contact coordinates for SMS alerts and official communication.',
      showSectionHeading: true,
      columns: 2,
      sortOrder: 2,
      fields: [
        {
          instanceId: 'fld_fat_name',
          fieldDefinitionId: 'FAT_NAME',
          canonicalKey: 'FATHER_NAME',
          customLabel: 'Father Full Name',
          width: 'HALF',
          isRequired: true,
          sortOrder: 1,
        },
        {
          instanceId: 'fld_fat_mobile',
          fieldDefinitionId: 'CNT_PRIMARY_MOBILE',
          canonicalKey: 'PRIMARY_CONTACT_MOBILE',
          customLabel: 'Primary Contact Mobile (SMS Alerts)',
          placeholder: '+92 300 1234567',
          width: 'HALF',
          isRequired: true,
          sortOrder: 2,
        },
        {
          instanceId: 'fld_city',
          fieldDefinitionId: 'ADDR_CURR_CITY',
          canonicalKey: 'CURRENT_CITY',
          customLabel: 'City',
          width: 'HALF',
          isRequired: true,
          masterBinding: 'CITY',
          sortOrder: 3,
        },
      ],
    },
  ]);

  const [conditionalRules] = useState<FormConditionalRule[]>([]);

  // Selected Field / Section for Inspector
  const [selectedFieldId, setSelectedFieldId] = useState<string>('fld_first_name');
  const [inspectorTab, setInspectorTab] = useState<'PROPERTIES' | 'RULES' | 'VALIDATION'>('PROPERTIES');

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Filtered Field Library
  const filteredLibrary = useMemo(() => {
    return CLIENT_MASTER_FIELD_CATALOG.filter((f: FieldDefinitionDto) => {
      if (selectedLibraryCategory !== 'ALL' && f.category !== selectedLibraryCategory) return false;
      if (librarySearch.trim()) {
        const q = librarySearch.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q) || f.defaultLabel.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedLibraryCategory, librarySearch]);

  // Find currently selected field instance across sections
  const selectedField = useMemo(() => {
    for (const sec of sections) {
      const f = sec.fields.find((field) => field.instanceId === selectedFieldId);
      if (f) return { field: f, sectionId: sec.id };
    }
    return null;
  }, [sections, selectedFieldId]);

  // Add field from library to active or last section
  const handleAddFieldToCanvas = (fieldDef: FieldDefinitionDto) => {
    const newInstanceId = `fld_${fieldDef.code.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const newField: FormFieldInstance = {
      instanceId: newInstanceId,
      fieldDefinitionId: fieldDef.code,
      canonicalKey: fieldDef.canonicalKey || undefined,
      customLabel: fieldDef.defaultLabel,
      placeholder: fieldDef.defaultPlaceholder || undefined,
      helpText: fieldDef.defaultHelpText || undefined,
      width: 'HALF',
      isRequired: fieldDef.defaultValidation?.required || false,
      sortOrder: 99,
      options: fieldDef.defaultOptions,
      masterBinding: fieldDef.masterBinding || undefined,
      validation: fieldDef.defaultValidation,
    };

    setSections((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: `sec_${Date.now()}`,
            title: 'General Details',
            showSectionHeading: true,
            columns: 2,
            sortOrder: 1,
            fields: [newField],
          },
        ];
      }
      const updated = [...prev];
      const targetSec = updated[updated.length - 1]!;
      targetSec.fields.push(newField);
      return updated;
    });

    setSelectedFieldId(newInstanceId);
    setIsSaved(false);
  };

  // Add a new section to canvas
  const handleAddSection = () => {
    const newSecId = `sec_${Date.now()}`;
    const newSection: FormSectionInstance = {
      id: newSecId,
      title: `New Section ${sections.length + 1}`,
      description: 'Enter section instructions here.',
      showSectionHeading: true,
      columns: 2,
      sortOrder: sections.length + 1,
      fields: [],
    };
    setSections([...sections, newSection]);
    setIsSaved(false);
  };

  // Delete field from canvas
  const handleDeleteField = (sectionId: string, instanceId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          fields: sec.fields.filter((f) => f.instanceId !== instanceId),
        };
      })
    );
    if (selectedFieldId === instanceId) {
      setSelectedFieldId('');
    }
    setIsSaved(false);
  };

  // Move field up/down within section
  const handleMoveField = (sectionId: string, fieldIndex: number, direction: 'UP' | 'DOWN') => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const newFields = [...sec.fields];
        const targetIndex = direction === 'UP' ? fieldIndex - 1 : fieldIndex + 1;
        if (targetIndex < 0 || targetIndex >= newFields.length) return sec;

        const temp = newFields[fieldIndex]!;
        newFields[fieldIndex] = newFields[targetIndex]!;
        newFields[targetIndex] = temp;
        return { ...sec, fields: newFields };
      })
    );
    setIsSaved(false);
  };

  // Update selected field property
  const handleUpdateFieldProperty = (key: keyof FormFieldInstance, value: any) => {
    if (!selectedField) return;
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== selectedField.sectionId) return sec;
        return {
          ...sec,
          fields: sec.fields.map((f) => (f.instanceId === selectedField.field.instanceId ? { ...f, [key]: value } : f)),
        };
      })
    );
    setIsSaved(false);
  };

  // Save draft
  const handleSaveDraft = () => {
    setIsSaved(true);
  };

  // Publish version
  const handlePublish = () => {
    setVersionStatus('PUBLISHED');
    setIsSaved(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin-config/form-builder"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setIsSaved(false);
                }}
                className="font-bold text-lg text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
              />
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                versionStatus === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                v{versionNumber} {versionStatus}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{formPurpose.replace('_', ' ')}</span>
              <span>•</span>
              <span>{isSaved ? '✓ Saved' : '● Unsaved changes'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>👁️</span>
            <span>Real Preview</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={versionStatus === 'PUBLISHED'}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            {versionStatus === 'PUBLISHED' ? 'Published' : '🚀 Publish Form'}
          </button>
        </div>
      </div>

      {/* 3-Panel Visual Form Builder Layout */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* ── LEFT PANEL: Master Field Library (3 cols) ── */}
        <div className="col-span-12 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Master Field Catalog
            </h3>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full font-bold">
              {filteredLibrary.length}
            </span>
          </div>

          <input
            type="text"
            placeholder="Search fields..."
            value={librarySearch}
            onChange={(e) => setLibrarySearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <select
            value={selectedLibraryCategory}
            onChange={(e) => setSelectedLibraryCategory(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="ALL">All Categories ({CLIENT_MASTER_FIELD_CATALOG.length})</option>
            {FIELD_CATEGORIES_INFO.map((cat: FieldCategoryInfo) => (
              <option key={cat.key} value={cat.key}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <div className="space-y-2 pt-1">
            {filteredLibrary.map((fld: FieldDefinitionDto) => (
              <div
                key={fld.code}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all group cursor-pointer"
                onClick={() => handleAddFieldToCanvas(fld)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600">
                    {fld.name}
                  </span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 text-indigo-600 hover:text-indigo-800 text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 transition-opacity"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    fld.origin === 'CANONICAL'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {fld.origin}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {fld.dataType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER PANEL: Form Design Canvas (6 cols) ── */}
        <div className="col-span-12 lg:col-span-6 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-inner space-y-6 min-h-[calc(100vh-200px)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interactive Form Canvas
            </span>
            <button
              type="button"
              onClick={handleAddSection}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <span>+</span>
              <span>Add Section</span>
            </button>
          </div>

          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4"
            >
              {/* Section Header Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections((prev) =>
                        prev.map((s) => (s.id === section.id ? { ...s, title: val } : s))
                      );
                      setIsSaved(false);
                    }}
                    placeholder="Section Title"
                    className="font-bold text-sm text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full max-w-xs"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500">
                    <input
                      type="checkbox"
                      checked={section.showSectionHeading}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSections((prev) =>
                          prev.map((s) => (s.id === section.id ? { ...s, showSectionHeading: checked } : s))
                        );
                        setIsSaved(false);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Show Title</span>
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const isRep = !section.repeatableConfig?.isRepeatable;
                      setSections((prev) =>
                        prev.map((s) =>
                          s.id === section.id
                            ? {
                                ...s,
                                repeatableConfig: {
                                  isRepeatable: isRep,
                                  addButtonText: '+ Add Entry',
                                  maxEntries: 5,
                                },
                              }
                            : s
                        )
                      );
                      setIsSaved(false);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                      section.repeatableConfig?.isRepeatable
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {section.repeatableConfig?.isRepeatable ? 'Repeatable Group' : 'Make Repeatable'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSections((prev) => prev.filter((s) => s.id !== section.id));
                      setIsSaved(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Section"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Section Fields Canvas */}
              {section.fields.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
                  Click "+ Add" on any field in the left library to place it here.
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-3">
                  {section.fields.map((f, fIndex) => {
                    const isSelected = f.instanceId === selectedFieldId;
                    const widthClass = f.width === 'FULL' ? 'col-span-12' : 'col-span-12 sm:col-span-6';

                    return (
                      <div
                        key={f.instanceId}
                        onClick={() => setSelectedFieldId(f.instanceId)}
                        className={`${widthClass} p-3 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {f.customLabel}
                            {f.isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(section.id, fIndex, 'UP');
                              }}
                              disabled={fIndex === 0}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs disabled:opacity-30"
                              title="Move Up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(section.id, fIndex, 'DOWN');
                              }}
                              disabled={fIndex === section.fields.length - 1}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs disabled:opacity-30"
                              title="Move Down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteField(section.id, f.instanceId);
                              }}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded text-xs"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 flex items-center text-xs text-slate-400">
                          {f.placeholder || f.fieldDefinitionId}
                        </div>

                        {f.canonicalKey && (
                          <span className="text-[9px] font-mono text-slate-400 mt-1 block">
                            Key: {f.canonicalKey}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── RIGHT PANEL: Field Properties Inspector (3 cols) ── */}
        <div className="col-span-12 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Field Inspector
            </h3>
            {selectedField && (
              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 px-2 py-0.5 rounded">
                {selectedField.field.instanceId}
              </span>
            )}
          </div>

          {!selectedField ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Select any field on the canvas to inspect and edit its properties.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progressive Disclosure Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                {(['PROPERTIES', 'RULES', 'VALIDATION'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setInspectorTab(tab)}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
                      inspectorTab === tab
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'PROPERTIES' ? 'Basic' : tab === 'RULES' ? 'Rules' : 'Validation'}
                  </button>
                ))}
              </div>

              {/* Tab 1: Basic Properties */}
              {inspectorTab === 'PROPERTIES' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Display Label *
                    </label>
                    <input
                      type="text"
                      value={selectedField.field.customLabel || ''}
                      onChange={(e) => handleUpdateFieldProperty('customLabel', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={selectedField.field.placeholder || ''}
                      onChange={(e) => handleUpdateFieldProperty('placeholder', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Help Text / Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={selectedField.field.helpText || ''}
                      onChange={(e) => handleUpdateFieldProperty('helpText', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Width on Desktop
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateFieldProperty('width', 'HALF')}
                        className={`py-1.5 rounded-lg border text-xs font-bold ${
                          selectedField.field.width === 'HALF'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        50% (Half)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateFieldProperty('width', 'FULL')}
                        className={`py-1.5 rounded-lg border text-xs font-bold ${
                          selectedField.field.width === 'FULL'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        100% (Full)
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={selectedField.field.isRequired}
                        onChange={(e) => handleUpdateFieldProperty('isRequired', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Mandatory / Required</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Conditional Rules */}
              {inspectorTab === 'RULES' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Define conditional behavior based on other fields in the form.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-600">Sample Rule Active:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      SHOW this field when Transport Required is checked.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Advanced Validation */}
              {inspectorTab === 'VALIDATION' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Min Length
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2"
                      value={selectedField.field.validation?.minLength || ''}
                      onChange={(e) =>
                        handleUpdateFieldProperty('validation', {
                          ...selectedField.field.validation,
                          minLength: Number(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Max Length
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={selectedField.field.validation?.maxLength || ''}
                      onChange={(e) =>
                        handleUpdateFieldProperty('validation', {
                          ...selectedField.field.validation,
                          maxLength: Number(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Viewport Real Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-start p-4 overflow-y-auto">
          <div className="w-full max-w-5xl flex items-center justify-between py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">{formName}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/20">
                Interactive Preview
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                🖥️ Desktop (1440px)
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  previewDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                📱 Tablet (768px)
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                📱 Mobile (390px)
              </button>
            </div>

            <button
              onClick={() => setShowPreviewModal(false)}
              className="p-2 text-slate-300 hover:text-white text-xl font-bold"
            >
              ✕
            </button>
          </div>

          <div
            className={`w-full transition-all duration-300 my-auto ${
              previewDevice === 'desktop'
                ? 'max-w-4xl'
                : previewDevice === 'tablet'
                ? 'max-w-2xl'
                : 'max-w-sm'
            }`}
          >
            <FormRuntimeRenderer
              schema={{
                settings: { submitButtonText: 'Submit Application', saveDraftEnabled: true },
                rules: conditionalRules,
                sections,
              }}
              formTitle={formName}
              formPurpose={formPurpose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
