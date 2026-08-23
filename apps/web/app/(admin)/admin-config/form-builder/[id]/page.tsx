'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CLIENT_MASTER_FIELD_CATALOG, FIELD_CATEGORIES_INFO, FieldCategoryInfo } from '../../../../../lib/forms-catalog';
import { FormRuntimeRenderer } from '../../../../../components/FormRuntimeRenderer';
import {
  FormFieldInstance,
  FormSectionInstance,
  FormConditionalRule,
  FieldDefinitionDto,
  FormControlWidth,
} from '@campus-os/types';

// Types for Drag & Drop
type DragSource =
  | { type: 'LIBRARY_FIELD'; fieldDef: FieldDefinitionDto }
  | { type: 'CANVAS_FIELD'; sourceSectionId: string; instanceId: string; fieldInstance: FormFieldInstance }
  | { type: 'CANVAS_SECTION'; sectionId: string };

interface DropIndicator {
  targetSectionId: string;
  targetIndex: number; // insertion index in targetSection.fields
}

interface ToastMessage {
  id: string;
  text: string;
  undoAction?: () => void;
}

export default function FormBuilderEditorPage() {
  // Form definition metadata
  const [formName, setFormName] = useState('Online Pre-Registration 2026-2027');
  const [formPurpose] = useState('PRE_REGISTRATION');
  const [versionNumber] = useState(1);
  const [versionStatus, setVersionStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [isSaved, setIsSaved] = useState(true);

  // Field library search & filter
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
  const [activeSectionId, setActiveSectionId] = useState<string>('sec_student_details');
  const [inspectorTab, setInspectorTab] = useState<'PROPERTIES' | 'RULES' | 'VALIDATION'>('PROPERTIES');

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Move-to-section modal for mobile
  const [moveFieldModal, setMoveFieldModal] = useState<{ sectionId: string; instanceId: string } | null>(null);

  // Toast / Undo notification
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const isAddingRef = useRef(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Drag & Drop State
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);

  // Auto-scroll handler while dragging
  const handleDragOverContainer = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY;

    const threshold = 70;
    if (mouseY - rect.top < threshold) {
      container.scrollTop -= 12;
    } else if (rect.bottom - mouseY < threshold) {
      container.scrollTop += 12;
    }
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Set of all added canonical keys & field codes on canvas
  const { addedCanonicalKeys, addedFieldCodes } = useMemo(() => {
    const canonicals = new Set<string>();
    const codes = new Set<string>();
    for (const sec of sections) {
      for (const f of sec.fields) {
        if (f.canonicalKey) canonicals.add(f.canonicalKey);
        if (f.fieldDefinitionId) codes.add(f.fieldDefinitionId);
      }
    }
    return { addedCanonicalKeys: canonicals, addedFieldCodes: codes };
  }, [sections]);

  // Determine if a field from library is already added (and not explicitly repeatable)
  const isFieldAdded = (f: FieldDefinitionDto): boolean => {
    // Explicit repeatable categories/fields
    if (f.category === 'SIBLINGS' || f.category === 'PREVIOUS_EDUCATION' || f.category === 'DOCUMENTS') {
      return false;
    }
    if (f.canonicalKey && addedCanonicalKeys.has(f.canonicalKey)) return true;
    if (addedFieldCodes.has(f.code)) return true;
    return false;
  };

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

  // Currently selected field instance
  const selectedField = useMemo(() => {
    for (const sec of sections) {
      const f = sec.fields.find((field) => field.instanceId === selectedFieldId);
      if (f) return { field: f, sectionId: sec.id };
    }
    return null;
  }, [sections, selectedFieldId]);

  // Helper to create a new field instance from a field definition
  const createFieldInstance = (fieldDef: FieldDefinitionDto): FormFieldInstance => {
    const newInstanceId = `fld_${fieldDef.code.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    return {
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
  };

  // Helper to get grid classes for a field width
  const getWidthGridClass = (width?: FormControlWidth) => {
    if (width === 'QUARTER' || width === '25%') return 'col-span-12 sm:col-span-6 lg:col-span-3';
    if (width === 'HALF' || width === '50%') return 'col-span-12 sm:col-span-6';
    if (width === 'THREE_QUARTERS' || width === '75%') return 'col-span-12 sm:col-span-6 lg:col-span-9';
    if (width === 'FULL' || width === '100%') return 'col-span-12';
    return 'col-span-12 sm:col-span-6';
  };

  // ═════════════════════════════════════════════════════════════════
  // SINGLE-CLICK + ADD WITH PROTECTION
  // ═════════════════════════════════════════════════════════════════

  const handleAddFieldToActiveSection = (fieldDef: FieldDefinitionDto, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setTimeout(() => {
      isAddingRef.current = false;
    }, 250);

    if (isFieldAdded(fieldDef)) {
      setToast({
        id: `toast_${Date.now()}`,
        text: `"${fieldDef.name}" is already included in this form.`,
      });
      return;
    }

    const previousSections = JSON.parse(JSON.stringify(sections));
    const newField = createFieldInstance(fieldDef);

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

      // Add to active section or last section
      let targetSecId = activeSectionId;
      const secExists = prev.some((s) => s.id === targetSecId);
      if (!secExists) targetSecId = prev[prev.length - 1]!.id;

      return prev.map((s) => (s.id === targetSecId ? { ...s, fields: [...s.fields, newField] } : s));
    });

    setSelectedFieldId(newField.instanceId);
    setIsSaved(false);

    setToast({
      id: `toast_${Date.now()}`,
      text: `Added "${fieldDef.name}" to form`,
      undoAction: () => setSections(previousSections),
    });
  };

  // ═════════════════════════════════════════════════════════════════
  // DRAG & DROP HANDLERS
  // ═════════════════════════════════════════════════════════════════

  // Drag start from Library
  const handleDragStartFromLibrary = (e: React.DragEvent, fieldDef: FieldDefinitionDto) => {
    if (isFieldAdded(fieldDef)) {
      e.preventDefault();
      return;
    }
    setDragSource({ type: 'LIBRARY_FIELD', fieldDef });
    e.dataTransfer.setData('text/plain', fieldDef.code);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // Drag start from Canvas Field
  const handleDragStartFromCanvas = (
    e: React.DragEvent,
    sourceSectionId: string,
    instanceId: string,
    fieldInstance: FormFieldInstance
  ) => {
    e.stopPropagation();
    setDragSource({ type: 'CANVAS_FIELD', sourceSectionId, instanceId, fieldInstance });
    e.dataTransfer.setData('text/plain', instanceId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag start from Canvas Section
  const handleDragStartSection = (e: React.DragEvent, sectionId: string) => {
    setDragSource({ type: 'CANVAS_SECTION', sectionId });
    e.dataTransfer.setData('text/plain', sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag over a field to calculate insertion position
  const handleDragOverField = (e: React.DragEvent, targetSectionId: string, fieldIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragSource) return;

    if (dragSource.type === 'CANVAS_SECTION') {
      return;
    }

    const targetElem = e.currentTarget as HTMLElement;
    const rect = targetElem.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const isBottomHalf = offsetY > rect.height / 2;

    const insertionIndex = isBottomHalf ? fieldIndex + 1 : fieldIndex;
    setDropIndicator({ targetSectionId, targetIndex: insertionIndex });
    setDragOverSectionId(targetSectionId);
  };

  // Drag over an empty section or section container
  const handleDragOverSection = (e: React.DragEvent, sectionId: string, sectionIndex: number) => {
    e.preventDefault();
    if (!dragSource) return;

    if (dragSource.type === 'CANVAS_SECTION') {
      setDragOverSectionIndex(sectionIndex);
      return;
    }

    setDragOverSectionId(sectionId);
    const targetSec = sections.find((s) => s.id === sectionId);
    if (!targetSec || targetSec.fields.length === 0) {
      setDropIndicator({ targetSectionId: sectionId, targetIndex: 0 });
    }
  };

  // Drag end / cancel
  const handleDragEnd = () => {
    setDragSource(null);
    setDropIndicator(null);
    setDragOverSectionId(null);
    setDragOverSectionIndex(null);
  };

  // Drop onto Canvas
  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragSource) return;
    const previousSections = JSON.parse(JSON.stringify(sections));

    // Case 1: Dropping Section to Reorder Sections
    if (dragSource.type === 'CANVAS_SECTION') {
      if (dragOverSectionIndex !== null) {
        const fromIndex = sections.findIndex((s) => s.id === dragSource.sectionId);
        if (fromIndex !== -1 && fromIndex !== dragOverSectionIndex) {
          const updated = [...sections];
          const [movedSec] = updated.splice(fromIndex, 1);
          updated.splice(dragOverSectionIndex, 0, movedSec!);
          setSections(updated);
          setIsSaved(false);
          setToast({
            id: `toast_${Date.now()}`,
            text: `Reordered section "${movedSec!.title}"`,
            undoAction: () => setSections(previousSections),
          });
        }
      }
      handleDragEnd();
      return;
    }

    const targetSec = sections.find((s) => s.id === targetSectionId);
    if (!targetSec) {
      handleDragEnd();
      return;
    }

    const insertIndex = dropIndicator && dropIndicator.targetSectionId === targetSectionId
      ? dropIndicator.targetIndex
      : targetSec.fields.length;

    // Case 2: Dropping Library Field
    if (dragSource.type === 'LIBRARY_FIELD') {
      if (isFieldAdded(dragSource.fieldDef)) {
        setToast({
          id: `toast_${Date.now()}`,
          text: `"${dragSource.fieldDef.name}" is already included in this form.`,
        });
        handleDragEnd();
        return;
      }

      const newField = createFieldInstance(dragSource.fieldDef);

      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== targetSectionId) return sec;
          const newFields = [...sec.fields];
          newFields.splice(insertIndex, 0, newField);
          return { ...sec, fields: newFields };
        })
      );

      setSelectedFieldId(newField.instanceId);
      setActiveSectionId(targetSectionId);
      setIsSaved(false);

      setToast({
        id: `toast_${Date.now()}`,
        text: `Placed "${dragSource.fieldDef.name}" into "${targetSec.title}"`,
        undoAction: () => setSections(previousSections),
      });
    }

    // Case 3: Reordering or Moving Canvas Field across sections
    else if (dragSource.type === 'CANVAS_FIELD') {
      const { sourceSectionId, instanceId, fieldInstance } = dragSource;

      // Extract field from source section and insert into target section
      setSections((prev) => {
        // Step 1: Remove from source
        const withoutField = prev.map((sec) => {
          if (sec.id !== sourceSectionId) return sec;
          return {
            ...sec,
            fields: sec.fields.filter((f) => f.instanceId !== instanceId),
          };
        });

        // Step 2: Insert into target
        return withoutField.map((sec) => {
          if (sec.id !== targetSectionId) return sec;
          const newFields = [...sec.fields];
          // If moving within same section and source was before target, adjust index
          let adjustedIndex = insertIndex;
          if (sourceSectionId === targetSectionId) {
            const originalIndex = prev
              .find((s) => s.id === sourceSectionId)
              ?.fields.findIndex((f) => f.instanceId === instanceId);
            if (originalIndex !== undefined && originalIndex < insertIndex) {
              adjustedIndex = Math.max(0, insertIndex - 1);
            }
          }
          newFields.splice(adjustedIndex, 0, fieldInstance);
          return { ...sec, fields: newFields };
        });
      });

      setSelectedFieldId(instanceId);
      setActiveSectionId(targetSectionId);
      setIsSaved(false);

      const actionText =
        sourceSectionId === targetSectionId
          ? `Reordered "${fieldInstance.customLabel || 'Field'}"`
          : `Moved "${fieldInstance.customLabel || 'Field'}" to "${targetSec.title}"`;

      setToast({
        id: `toast_${Date.now()}`,
        text: actionText,
        undoAction: () => setSections(previousSections),
      });
    }

    handleDragEnd();
  };

  // ═════════════════════════════════════════════════════════════════
  // SECTION & FIELD MANAGEMENT
  // ═════════════════════════════════════════════════════════════════

  const handleAddSection = () => {
    const previousSections = JSON.parse(JSON.stringify(sections));
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
    setActiveSectionId(newSecId);
    setIsSaved(false);

    setToast({
      id: `toast_${Date.now()}`,
      text: `Created "${newSection.title}"`,
      undoAction: () => setSections(previousSections),
    });
  };

  const handleDeleteField = (sectionId: string, instanceId: string) => {
    const previousSections = JSON.parse(JSON.stringify(sections));
    const targetField = sections.find((s) => s.id === sectionId)?.fields.find((f) => f.instanceId === instanceId);

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

    setToast({
      id: `toast_${Date.now()}`,
      text: `Removed "${targetField?.customLabel || 'Field'}"`,
      undoAction: () => setSections(previousSections),
    });
  };

  const handleMoveFieldMobile = (sectionId: string, fieldIndex: number, direction: 'UP' | 'DOWN') => {
    const previousSections = JSON.parse(JSON.stringify(sections));
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

    setToast({
      id: `toast_${Date.now()}`,
      text: `Moved field ${direction.toLowerCase()}`,
      undoAction: () => setSections(previousSections),
    });
  };

  const handleMoveFieldToSectionMobile = (sourceSectionId: string, instanceId: string, targetSectionId: string) => {
    if (sourceSectionId === targetSectionId) return;
    const previousSections = JSON.parse(JSON.stringify(sections));

    const sourceSec = sections.find((s) => s.id === sourceSectionId);
    const fieldInstance = sourceSec?.fields.find((f) => f.instanceId === instanceId);
    if (!fieldInstance) return;

    setSections((prev) => {
      const without = prev.map((s) =>
        s.id === sourceSectionId ? { ...s, fields: s.fields.filter((f) => f.instanceId !== instanceId) } : s
      );
      return without.map((s) =>
        s.id === targetSectionId ? { ...s, fields: [...s.fields, fieldInstance] } : s
      );
    });

    setActiveSectionId(targetSectionId);
    setMoveFieldModal(null);
    setIsSaved(false);

    const targetSecTitle = sections.find((s) => s.id === targetSectionId)?.title || 'Target Section';
    setToast({
      id: `toast_${Date.now()}`,
      text: `Moved "${fieldInstance.customLabel || 'Field'}" to "${targetSecTitle}"`,
      undoAction: () => setSections(previousSections),
    });
  };

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

  return (
    <div className="space-y-4">
      {/* ── TOP BAR & ACTIONS ── */}
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
                className="font-bold text-base sm:text-lg text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
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
            onClick={() => setIsSaved(true)}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => {
              setVersionStatus('PUBLISHED');
              setIsSaved(true);
              setToast({
                id: `toast_${Date.now()}`,
                text: '🚀 Form Published Successfully!',
              });
            }}
            disabled={versionStatus === 'PUBLISHED'}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            {versionStatus === 'PUBLISHED' ? 'Published' : '🚀 Publish Form'}
          </button>
        </div>
      </div>

      {/* ── 3-PANEL VISUAL FORM BUILDER LAYOUT ── */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* ── LEFT PANEL: Master Field Library (3 cols) ── */}
        <div className="col-span-12 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Master Field Catalog
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Drag to Canvas or Click + Add</p>
            </div>
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
            {filteredLibrary.map((fld: FieldDefinitionDto) => {
              const added = isFieldAdded(fld);

              return (
                <div
                  key={fld.code}
                  draggable={!added}
                  onDragStart={(e) => handleDragStartFromLibrary(e, fld)}
                  onClick={(e) => {
                    if (!added) handleAddFieldToActiveSection(fld, e);
                  }}
                  className={`p-2.5 rounded-xl border transition-all select-none ${
                    added
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/30 opacity-60 cursor-not-allowed'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing group shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-400 text-xs select-none">⠿</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {fld.name}
                      </span>
                    </div>

                    {added ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span>
                        <span>Added</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleAddFieldToActiveSection(fld, e)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 transition-all"
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5 pl-4">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      fld.origin === 'CANONICAL'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : fld.origin === 'CUSTOM'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {fld.origin}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {fld.dataType}
                    </span>
                    {fld.masterBinding && (
                      <span className="text-[9px] text-indigo-500 font-medium">
                        🔗 {fld.masterBinding}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTER PANEL: Form Design Canvas (6 cols) ── */}
        <div
          ref={canvasContainerRef}
          onDragOver={handleDragOverContainer}
          className="col-span-12 lg:col-span-6 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner space-y-6 min-h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] overflow-y-auto"
        >
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

          {sections.map((section, secIndex) => {
            const isSectionActive = activeSectionId === section.id;
            const isDragOverSection = dragOverSectionId === section.id;

            return (
              <div
                key={section.id}
                onDragOver={(e) => handleDragOverSection(e, section.id, secIndex)}
                onDrop={(e) => handleDrop(e, section.id)}
                onClick={() => setActiveSectionId(section.id)}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-all ${
                  isDragOverSection && dragSource?.type !== 'CANVAS_SECTION'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                    : isSectionActive
                    ? 'border-slate-300 dark:border-slate-700'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* ── Section Header (Draggable) ── */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStartSection(e, section.id)}
                  className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-slate-400 hover:text-slate-600 text-sm font-bold" title="Drag to reorder section">
                      ⠿
                    </span>
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
                    <label className="hidden sm:flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500">
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
                      onClick={(e) => {
                        e.stopPropagation();
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
                      {section.repeatableConfig?.isRepeatable ? 'Repeatable' : '+ Make Repeatable'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSections((prev) => prev.filter((s) => s.id !== section.id));
                        setIsSaved(false);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded text-xs"
                      title="Delete Section"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* ── Section Fields Canvas Grid ── */}
                {section.fields.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
                    Drop fields here or click "+ Add" on any item in the left library.
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-3">
                    {section.fields.map((f, fIndex) => {
                      const isSelected = f.instanceId === selectedFieldId;
                      const gridColClass = getWidthGridClass(f.width);
                      const showDropBefore =
                        dropIndicator &&
                        dropIndicator.targetSectionId === section.id &&
                        dropIndicator.targetIndex === fIndex;
                      const showDropAfter =
                        dropIndicator &&
                        dropIndicator.targetSectionId === section.id &&
                        dropIndicator.targetIndex === fIndex + 1 &&
                        fIndex === section.fields.length - 1;

                      return (
                        <React.Fragment key={f.instanceId}>
                          {/* Visual Insertion Marker Before Field */}
                          {showDropBefore && (
                            <div className="col-span-12 py-1 flex items-center justify-center animate-in fade-in zoom-in-95">
                              <div className="w-full border-t-2 border-dashed border-indigo-500 relative flex items-center justify-center">
                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md">
                                  Drop Field Here
                                </span>
                              </div>
                            </div>
                          )}

                          {/* ── Field Card (Draggable) ── */}
                          <div
                            draggable
                            onDragStart={(e) => handleDragStartFromCanvas(e, section.id, f.instanceId, f)}
                            onDragOver={(e) => handleDragOverField(e, section.id, fIndex)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFieldId(f.instanceId);
                              setActiveSectionId(section.id);
                            }}
                            className={`${gridColClass} p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing relative group ${
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/30'
                                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-slate-400 group-hover:text-indigo-600 text-xs select-none">
                                  ⠿
                                </span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {f.customLabel}
                                  {f.isRequired && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
                                </span>
                              </div>

                              {/* Desktop / Mobile Action Buttons */}
                              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveFieldMobile(section.id, fIndex, 'UP');
                                  }}
                                  disabled={fIndex === 0}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs disabled:opacity-20"
                                  title="Move Up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveFieldMobile(section.id, fIndex, 'DOWN');
                                  }}
                                  disabled={fIndex === section.fields.length - 1}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs disabled:opacity-20"
                                  title="Move Down"
                                >
                                  ↓
                                </button>
                                {sections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMoveFieldModal({ sectionId: section.id, instanceId: f.instanceId });
                                    }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs text-slate-500"
                                    title="Move to another section"
                                  >
                                    ➡️
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteField(section.id, f.instanceId);
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded text-xs"
                                  title="Remove field"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <div className="h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 flex items-center text-xs text-slate-400 truncate">
                              {f.placeholder || f.fieldDefinitionId}
                            </div>

                            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 font-mono">
                              <span>{f.width || '50%'}</span>
                              {f.canonicalKey && <span className="truncate max-w-[120px]">Key: {f.canonicalKey}</span>}
                            </div>
                          </div>

                          {/* Visual Insertion Marker After Field */}
                          {showDropAfter && (
                            <div className="col-span-12 py-1 flex items-center justify-center animate-in fade-in zoom-in-95">
                              <div className="w-full border-t-2 border-dashed border-indigo-500 relative flex items-center justify-center">
                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md">
                                  Drop Field Here
                                </span>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
              Select any field on the canvas to inspect and customize its properties in real-time.
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
                <div className="space-y-4">
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

                  {/* ── FIELD WIDTH CONTROL (25% / 50% / 75% / 100%) ── */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
                      Desktop Field Width
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '25%', value: 'QUARTER', title: 'Quarter' },
                        { label: '50%', value: 'HALF', title: 'Half' },
                        { label: '75%', value: 'THREE_QUARTERS', title: 'Three-Quarter' },
                        { label: '100%', value: 'FULL', title: 'Full' },
                      ].map((w) => {
                        const isCurrent =
                          selectedField.field.width === w.value ||
                          selectedField.field.width === w.label;

                        return (
                          <button
                            key={w.label}
                            type="button"
                            onClick={() => handleUpdateFieldProperty('width', w.value as FormControlWidth)}
                            title={w.title}
                            className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              isCurrent
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {w.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Automatically expands to 100% on mobile devices.
                    </p>
                  </div>

                  {/* ── REQUIRED / OPTIONAL TOGGLE ── */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-100">
                      <input
                        type="checkbox"
                        checked={selectedField.field.isRequired}
                        onChange={(e) => handleUpdateFieldProperty('isRequired', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Required Field ({selectedField.field.isRequired ? 'Mandatory *' : 'Optional'})</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Conditional Rules */}
              {inspectorTab === 'RULES' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Define conditional rules to dynamically show/hide or require this field based on other responses.
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
                      Min Character Length
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
                      Max Character Length
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

      {/* ── MOBILE MOVE-TO-SECTION MODAL ── */}
      {moveFieldModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Move Field to Section</h3>
            <p className="text-xs text-slate-500">Select target section for this field:</p>
            <div className="space-y-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleMoveFieldToSectionMobile(moveFieldModal.sectionId, moveFieldModal.instanceId, s.id)}
                  disabled={s.id === moveFieldModal.sectionId}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${
                    s.id === moveFieldModal.sectionId
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMoveFieldModal(null)}
              className="w-full py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── MULTI-VIEWPORT REAL PREVIEW MODAL ── */}
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

      {/* ── FLOATING UNDO TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <span className="text-xs">{toast.text}</span>
          {toast.undoAction && (
            <button
              type="button"
              onClick={() => {
                toast.undoAction?.();
                setToast(null);
              }}
              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold uppercase tracking-wider"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
