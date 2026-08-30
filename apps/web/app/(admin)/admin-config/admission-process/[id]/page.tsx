'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AdmissionProcessDto,
  AdmissionProcessStepConfig,
  AdmissionStepType,
  AdmissionStepCategory,
  ConfigScopeType,
} from '@campus-os/types';
import {
  AssignedToDetailsModal,
} from '../../../../../components/AssignedToDetailsModal';
import {
  HierarchyScopePickerModal,
  SelectedHierarchyState,
} from '../../../../../components/HierarchyScopePickerModal';

// Available Step Library Items for adding new steps
interface StepLibraryItem {
  stepType: AdmissionStepType;
  defaultName: string;
  category: AdmissionStepCategory;
  description: string;
  defaultRequired: boolean;
  requiresForm?: 'PRE_ADMISSION' | 'ADMISSION';
  isUnique?: boolean;
  isSystemTerminal?: boolean;
}

const STEP_LIBRARY: StepLibraryItem[] = [
  // 1. APPLICATION
  {
    stepType: 'PRE_ADMISSION',
    defaultName: 'Pre-Admission',
    category: 'APPLICATION',
    description: 'Initial student & parent application intake via public or internal form.',
    defaultRequired: true,
    requiresForm: 'PRE_ADMISSION',
    isUnique: true,
  },
  {
    stepType: 'APPLICATION_REVIEW',
    defaultName: 'Application Review',
    category: 'APPLICATION',
    description: 'Admissions team reviews student information, past records, and eligibility.',
    defaultRequired: true,
  },
  {
    stepType: 'DOCUMENT_VERIFICATION',
    defaultName: 'Document Verification',
    category: 'APPLICATION',
    description: 'Verification of birth certificates, prior transcripts, and B-Forms.',
    defaultRequired: true,
  },

  // 2. PAYMENT
  {
    stepType: 'APPLICATION_FEE',
    defaultName: 'Application / Registration Fee',
    category: 'PAYMENT',
    description: 'Collection of non-refundable application and registration processing fee.',
    defaultRequired: false,
  },

  // 3. ASSESSMENT
  {
    stepType: 'ASSESSMENT_TEST',
    defaultName: 'Test / Assessment',
    category: 'ASSESSMENT',
    description: 'Entrance examination, academic diagnostic test, or placement evaluation.',
    defaultRequired: true,
  },
  {
    stepType: 'INTERVIEW',
    defaultName: 'Interview',
    category: 'ASSESSMENT',
    description: 'Student and parent interaction with admissions panel or leadership.',
    defaultRequired: false,
  },

  // 4. DECISION
  {
    stepType: 'ADMISSION_DECISION',
    defaultName: 'Admission Decision',
    category: 'DECISION',
    description: 'Formal admission committee approval, conditional offer, or rejection.',
    defaultRequired: true,
  },
  {
    stepType: 'WAITING_LIST',
    defaultName: 'Waiting List',
    category: 'DECISION',
    description: 'Optional waiting pool queue when class or section capacity is reached.',
    defaultRequired: false,
  },

  // 5. CONFIRMATION
  {
    stepType: 'PARENT_CONFIRMATION',
    defaultName: 'Parent Confirmation',
    category: 'CONFIRMATION',
    description: 'Parent response (Accept, Decline, Need Time) to admission offer.',
    defaultRequired: false,
  },
  {
    stepType: 'SEAT_CONFIRMATION',
    defaultName: 'Seat Confirmation',
    category: 'CONFIRMATION',
    description: 'Formal reservation and lock of student seat in target grade/section.',
    defaultRequired: true,
  },
  {
    stepType: 'ADMISSION_FEE',
    defaultName: 'Admission Fee',
    category: 'CONFIRMATION',
    description: 'Payment of security deposit, admission fee, and first tuition installment.',
    defaultRequired: true,
  },
  {
    stepType: 'FINAL_ADMISSION_FORM',
    defaultName: 'Final Admission',
    category: 'CONFIRMATION',
    description: 'Comprehensive formal admission package with final guardian undertakings.',
    defaultRequired: true,
    requiresForm: 'ADMISSION',
    isUnique: true,
  },

  // 6. CONFIRMATION / TERMINAL
  {
    stepType: 'STUDENT_REGISTRATION',
    defaultName: 'Student Registration',
    category: 'CONFIRMATION',
    description: 'Terminal system step: creates official CampusOS Student record upon confirmed admission.',
    defaultRequired: true,
    isUnique: true,
    isSystemTerminal: true,
  },
];

// Published Forms Catalog (From Dynamic Form Builder)
const PUBLISHED_PRE_ADMISSION_FORMS = [
  { id: 'f_prereg_2026', versionId: 'v_prereg_1', name: 'Online Pre-Registration 2026-2027 (v1)' },
  { id: 'f_gulshan_override', versionId: 'v_gul_1', name: 'Gulshan Early Childhood Pre-Reg (v1)' },
];

const PUBLISHED_FINAL_ADMISSION_FORMS = [
  { id: 'f_adm_formal', versionId: 'v_adm_1', name: 'Formal Admission Package 2026–27 (v1)' },
  { id: 'f_adm_senior', versionId: 'v_adm_sr_1', name: 'Senior School / A-Level Admission Package (v1)' },
];

export default function AdmissionProcessBuilderPage() {
  const params = useParams();
  const processId = String(params.id || 'proc_general_k12');

  const [process, setProcess] = useState<AdmissionProcessDto>({
    id: processId,
    organizationId: '11111111-1111-1111-1111-111111111111',
    code: 'AP-GEN-2026',
    name: 'General Admission Process',
    description: 'Standard K-12 admissions workflow with pre-admission, officer review, final admission and registration.',
    starterTemplate: 'STANDARD',
    status: 'ACTIVE',
    currentVersionNumber: 1,
    publishedVersionId: 'ver_proc_gen_v1',
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    branchNames: [],
    ownerType: 'HEAD_OFFICE',
    ownerId: 'ho_main',
    sourceOrigin: 'LOCAL',
    isInherited: false,
    canEdit: true,
    canActivate: true,
    steps: [
      {
        id: 's1',
        stepType: 'PRE_ADMISSION',
        displayName: 'Pre-Admission Application',
        category: 'APPLICATION',
        isRequired: true,
        sortOrder: 1,
        attachedFormDefinitionId: 'f_prereg_2026',
        attachedFormVersionId: 'v_prereg_1',
        attachedFormName: 'Online Pre-Registration 2026-2027 (v1)',
        autoMoveToNext: true,
      },
      {
        id: 's2',
        stepType: 'APPLICATION_REVIEW',
        displayName: 'Application Review',
        category: 'APPLICATION',
        isRequired: true,
        sortOrder: 2,
        responsibleRole: 'Admissions Officer',
        autoMoveToNext: true,
        allowHold: true,
        allowReject: true,
      },
      {
        id: 's3',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 3,
        attachedFormDefinitionId: 'f_adm_formal',
        attachedFormVersionId: 'v_adm_1',
        attachedFormName: 'Formal Admission Package 2026–27 (v1)',
        autoMoveToNext: true,
      },
      {
        id: 's4',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 4,
        isSystemTerminal: true,
        autoMoveToNext: false,
      },
    ],
    totalStepsCount: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [steps, setSteps] = useState<AdmissionProcessStepConfig[]>(process.steps);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [stepSearch, setStepSearch] = useState('');
  const [stepCategoryFilter, setStepCategoryFilter] = useState<'ALL' | 'APPLICATION' | 'PAYMENT' | 'ASSESSMENT' | 'DECISION' | 'CONFIRMATION'>('ALL');
  const [addStepFeedback, setAddStepFeedback] = useState<string | null>(null);

  // Step Settings Modal
  const [editingStep, setEditingStep] = useState<AdmissionProcessStepConfig | null>(null);
  const [showMoreStepSettings, setShowMoreStepSettings] = useState(false);

  // Remove Step Confirmation Modal
  const [stepToRemove, setStepToRemove] = useState<AdmissionProcessStepConfig | null>(null);

  // Activate Review Modal
  const [showActivateReviewModal, setShowActivateReviewModal] = useState(false);

  // Feedback & Modals
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [showAssignedModal, setShowAssignedModal] = useState(false);
  const [showScopePickerModal, setShowScopePickerModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Hierarchy State
  const [hierarchyScopeState, setHierarchyScopeState] = useState<SelectedHierarchyState>({
    isEntireOrg: true,
    selectedHeadOfficeIds: [],
    selectedRegionIds: [],
    selectedSchoolIds: [],
    selectedCampusIds: [],
  });

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load process & draft persistence
  useEffect(() => {
    // 1. Try restoring from localStorage first
    const draftKey = `campusos_proc_draft_${processId}`;
    const savedDraft = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          setProcess(parsed);
          setSteps(parsed.steps);
          setHierarchyScopeState({
            isEntireOrg: parsed.applyTo === 'ALL_CAMPUSES',
            selectedHeadOfficeIds: [],
            selectedRegionIds: [],
            selectedSchoolIds: [],
            selectedCampusIds: parsed.branchIds || [],
          });
          return;
        }
      } catch (e) {
        // Fallback to fetch
      }
    }

    // 2. Fetch from backend
    const loadProcess = async () => {
      try {
        const res = await fetch(`http://localhost:4000/admin/admission-processes/${processId}`, {
          headers: {
            'x-tenant-id': '11111111-1111-1111-1111-111111111111',
            'x-user-role': 'ADMIN',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setProcess(data);
          setSteps(data.steps || []);
          setHierarchyScopeState({
            isEntireOrg: data.applyTo === 'ALL_CAMPUSES',
            selectedHeadOfficeIds: [],
            selectedRegionIds: [],
            selectedSchoolIds: [],
            selectedCampusIds: data.branchIds || [],
          });
        }
      } catch (e) {
        // Fallback to default state
      }
    };
    loadProcess();
  }, [processId]);

  // Step manipulation handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index - 1]!;
    newSteps[index - 1] = newSteps[index]!;
    newSteps[index] = temp;
    reindexSteps(newSteps);
  };

  const handleMoveDown = (index: number) => {
    // Cannot move below terminal step
    if (index >= steps.length - 2) return;
    const newSteps = [...steps];
    const temp = newSteps[index + 1]!;
    newSteps[index + 1] = newSteps[index]!;
    newSteps[index] = temp;
    reindexSteps(newSteps);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    const step = steps[index];
    if (step?.isSystemTerminal) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const targetStep = steps[targetIndex];
    if (targetStep?.isSystemTerminal) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const targetStep = steps[targetIndex];
    if (targetStep?.isSystemTerminal) return;

    const newSteps = [...steps];
    const [draggedItem] = newSteps.splice(draggedIndex, 1);
    if (!draggedItem) return;

    newSteps.splice(targetIndex, 0, draggedItem);
    reindexSteps(newSteps);
    setDraggedIndex(null);
  };

  const confirmRemoveStep = () => {
    if (!stepToRemove) return;
    if (stepToRemove.isSystemTerminal) {
      setStepToRemove(null);
      return;
    }
    const newSteps = steps.filter((s) => s.id !== stepToRemove.id);
    reindexSteps(newSteps);
    setStepToRemove(null);
  };

  const reindexSteps = (newSteps: AdmissionProcessStepConfig[]) => {
    const updated = newSteps.map((s, idx) => ({
      ...s,
      sortOrder: idx + 1,
    }));
    setSteps(updated);

    // Auto-update draft persistence
    const updatedProc = { ...process, steps: updated, totalStepsCount: updated.length };
    setProcess(updatedProc);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`campusos_proc_draft_${processId}`, JSON.stringify(updatedProc));
    }
  };

  const handleAddStepFromLibrary = (item: StepLibraryItem) => {
    // Check for duplicate protection
    if (item.stepType === 'STUDENT_REGISTRATION') {
      setAddStepFeedback('Student Registration is already included as the final step.');
      return;
    }
    if (item.isUnique && steps.some((s) => s.stepType === item.stepType)) {
      setAddStepFeedback(`"${item.defaultName}" is already included in this admission journey.`);
      return;
    }

    setAddStepFeedback(null);
    const newStepId = `step_${Date.now()}`;
    const newStep: AdmissionProcessStepConfig = {
      id: newStepId,
      stepType: item.stepType,
      displayName: item.defaultName,
      category: item.category,
      isRequired: item.defaultRequired,
      sortOrder: steps.length, // inserted before terminal
      autoMoveToNext: true,
      allowHold: item.category === 'APPLICATION' || item.category === 'ASSESSMENT',
      allowReject: item.category === 'APPLICATION' || item.category === 'ASSESSMENT',
      attachedFormDefinitionId:
        item.stepType === 'PRE_ADMISSION'
          ? PUBLISHED_PRE_ADMISSION_FORMS[0]?.id
          : item.stepType === 'FINAL_ADMISSION_FORM'
          ? PUBLISHED_FINAL_ADMISSION_FORMS[0]?.id
          : undefined,
      attachedFormVersionId:
        item.stepType === 'PRE_ADMISSION'
          ? PUBLISHED_PRE_ADMISSION_FORMS[0]?.versionId
          : item.stepType === 'FINAL_ADMISSION_FORM'
          ? PUBLISHED_FINAL_ADMISSION_FORMS[0]?.versionId
          : undefined,
      attachedFormName:
        item.stepType === 'PRE_ADMISSION'
          ? PUBLISHED_PRE_ADMISSION_FORMS[0]?.name
          : item.stepType === 'FINAL_ADMISSION_FORM'
          ? PUBLISHED_FINAL_ADMISSION_FORMS[0]?.name
          : undefined,
    };

    // Insert right before terminal registration step
    const withoutTerminal = steps.filter((s) => !s.isSystemTerminal);
    const terminalStep = steps.find((s) => s.isSystemTerminal) || {
      id: 'step_terminal_reg',
      stepType: 'STUDENT_REGISTRATION',
      displayName: 'Student Registration',
      category: 'REGISTRATION',
      isRequired: true,
      sortOrder: withoutTerminal.length + 2,
      isSystemTerminal: true,
    };

    const combined = [...withoutTerminal, newStep, terminalStep];
    reindexSteps(combined);
    setShowAddStepModal(false);
    setEditingStep(newStep);
  };

  // Validation logic
  const validateJourney = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (steps.length === 0) {
      errors.push('The process must have at least one step.');
      return { isValid: false, errors };
    }

    const regSteps = steps.filter((s) => s.stepType === 'STUDENT_REGISTRATION');
    if (regSteps.length === 0) {
      errors.push('Process must include the "Student Registration" final step.');
    } else if (regSteps.length > 1) {
      errors.push('Only one "Student Registration" step is permitted.');
    }

    const lastStep = steps[steps.length - 1]!;
    if (lastStep.stepType !== 'STUDENT_REGISTRATION') {
      errors.push('"Student Registration" must be the final step in the admission journey.');
    }

    const admFormSteps = steps.filter((s) => s.stepType === 'FINAL_ADMISSION_FORM');
    if (admFormSteps.length === 0) {
      errors.push('Process must include a "Final Admission Form" step before Student Registration.');
    } else {
      for (const s of admFormSteps) {
        if (!s.attachedFormDefinitionId) {
          errors.push(`"${s.displayName}" requires an attached Published Admission Form.`);
        }
      }
    }

    const preAdmSteps = steps.filter((s) => s.stepType === 'PRE_ADMISSION');
    for (const s of preAdmSteps) {
      if (!s.attachedFormDefinitionId) {
        errors.push(`"${s.displayName}" requires an attached Published Pre-Admission Form.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSaveDraft = async () => {
    setValidationErrors([]);
    const updatedProc: AdmissionProcessDto = {
      ...process,
      steps,
      totalStepsCount: steps.length,
      applyTo: hierarchyScopeState.isEntireOrg ? 'ALL_CAMPUSES' : 'SELECTED_CAMPUSES',
      branchIds: hierarchyScopeState.selectedCampusIds,
      updatedAt: new Date(),
    };
    setProcess(updatedProc);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`campusos_proc_draft_${processId}`, JSON.stringify(updatedProc));
    }

    try {
      await fetch(`http://localhost:4000/admin/admission-processes/${processId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify(updatedProc),
      });
    } catch (e) {
      // Offline fallback ok
    }

    setSaveSuccessMessage('Draft saved successfully.');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleInitiateActivate = () => {
    const res = validateJourney();
    if (!res.isValid) {
      setValidationErrors(res.errors);
      return;
    }
    setValidationErrors([]);
    setShowActivateReviewModal(true);
  };

  const handleConfirmActivate = async () => {
    const nextVersion = process.currentVersionNumber + 1;
    const updatedProc: AdmissionProcessDto = {
      ...process,
      steps,
      totalStepsCount: steps.length,
      status: 'ACTIVE',
      currentVersionNumber: nextVersion,
      applyTo: hierarchyScopeState.isEntireOrg ? 'ALL_CAMPUSES' : 'SELECTED_CAMPUSES',
      branchIds: hierarchyScopeState.selectedCampusIds,
      updatedAt: new Date(),
    };
    setProcess(updatedProc);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`campusos_proc_draft_${processId}`, JSON.stringify(updatedProc));
    }

    try {
      await fetch(`http://localhost:4000/admin/admission-processes/${processId}/activate`, {
        method: 'PATCH',
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
      });
    } catch (e) {
      // Mock activation ok
    }

    setShowActivateReviewModal(false);
    setSaveSuccessMessage(`Admission Process Activated! Version v${nextVersion} is now live.`);
    setTimeout(() => setSaveSuccessMessage(null), 4500);
  };

  const filteredStepLibrary = STEP_LIBRARY.filter((item) => {
    if (stepCategoryFilter !== 'ALL' && item.category !== stepCategoryFilter) return false;
    if (stepSearch.trim()) {
      const q = stepSearch.toLowerCase().trim();
      return (
        item.defaultName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.stepType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const preAdmForm = steps.find((s) => s.stepType === 'PRE_ADMISSION');
  const finalAdmForm = steps.find((s) => s.stepType === 'FINAL_ADMISSION_FORM');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 1. Breadcrumbs & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/admin-config/admission-process" className="hover:text-indigo-600">
              Admission Process
            </Link>
            <span>/</span>
            <span className="font-mono">{process.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {process.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                process.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {process.status} · v{process.currentVersionNumber}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Preview Journey
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleInitiateActivate}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            Activate Process
          </button>
        </div>
      </div>

      {/* 2. Assigned To Header Pill */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Assigned To:
          </span>
          <button
            type="button"
            onClick={() => setShowAssignedModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer transition-colors"
          >
            <span>{hierarchyScopeState.isEntireOrg ? '🌐 All Campuses' : `📍 ${hierarchyScopeState.selectedCampusIds.length || 2} Campuses`}</span>
            <span className="text-slate-400 text-xs">›</span>
          </button>
        </div>

        {process.canEdit && (
          <button
            type="button"
            onClick={() => setShowScopePickerModal(true)}
            className="px-3 py-1 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
          >
            Change Assignment
          </button>
        )}
      </div>

      {/* Feedback Alerts */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>✓</span>
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-1.5 animate-in fade-in">
          <div className="font-bold flex items-center gap-1.5">
            <span>⚠️</span>
            <span>Please resolve the following before activating this process:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-2">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Vertical Journey Canvas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Admission Steps ({steps.length})
          </h2>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Drag using ⠿ or use Move Up/Down to reorder
          </span>
        </div>

        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const isTerminal = step.isSystemTerminal;
            return (
              <div
                key={step.id}
                draggable={!isTerminal}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
              >
                {/* Step Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isTerminal
                      ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Drag Handle + Number + Details */}
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Drag Handle */}
                      {!isTerminal ? (
                        <span
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing text-base select-none px-0.5 pt-0.5 sm:pt-0"
                          title="Drag to reorder"
                        >
                          ⠿
                        </span>
                      ) : (
                        <span className="w-4" />
                      )}

                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isTerminal
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {step.displayName}
                          </span>

                          {isTerminal ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                              Final Step
                            </span>
                          ) : !step.isRequired ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Optional
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              Required
                            </span>
                          )}
                        </div>

                        {/* Secondary info / attached form */}
                        {isTerminal ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Student record will be created after successful admission.
                          </p>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            {step.attachedFormName && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                <span>📄</span>
                                <span>{step.attachedFormName}</span>
                              </span>
                            )}
                            {step.responsibleRole && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                <span>👤</span>
                                <span>{step.responsibleRole}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {!isTerminal && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingStep(step)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-20 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx >= steps.length - 2}
                            onClick={() => handleMoveDown(idx)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-20 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => setStepToRemove(step)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs cursor-pointer transition-colors"
                            title="Remove Step"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Downward Connector Arrow */}
                {idx < steps.length - 1 && (
                  <div className="text-center py-1 text-slate-300 dark:text-slate-700 font-bold text-sm">
                    ↓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Step Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setAddStepFeedback(null);
              setShowAddStepModal(true);
            }}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white/50 dark:bg-slate-900/50 hover:bg-indigo-50/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Add Step</span>
          </button>
        </div>
      </div>

      {/* ── ADD STEP LIBRARY MODAL ── */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Step to Journey</h3>
                <p className="text-xs text-slate-400">Select an admission stage from the step library.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStepModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addStepFeedback && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{addStepFeedback}</span>
              </div>
            )}

            {/* Search & Category Filter */}
            <div className="space-y-2.5 shrink-0">
              <input
                type="text"
                value={stepSearch}
                onChange={(e) => setStepSearch(e.target.value)}
                placeholder="Search step types..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'APPLICATION', label: 'Application' },
                  { id: 'PAYMENT', label: 'Payment' },
                  { id: 'ASSESSMENT', label: 'Assessment' },
                  { id: 'DECISION', label: 'Decision' },
                  { id: 'CONFIRMATION', label: 'Confirmation' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setStepCategoryFilter(cat.id as any)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      stepCategoryFilter === cat.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Library List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {filteredStepLibrary.map((item) => {
                const isAlreadyAdded = item.isUnique && steps.some((s) => s.stepType === item.stepType);
                return (
                  <div
                    key={item.stepType}
                    onClick={() => {
                      if (!isAlreadyAdded) handleAddStepFromLibrary(item);
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isAlreadyAdded
                        ? 'opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 cursor-pointer'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">{item.defaultName}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>

                    {isAlreadyAdded ? (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold whitespace-nowrap shrink-0">
                        Already Added
                      </span>
                    ) : (
                      <span className="text-indigo-600 font-extrabold text-xs ml-3 whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                        + Add
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowAddStepModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP SETTINGS MODAL (PROGRESSIVE DISCLOSURE) ── */}
      {editingStep && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Step Settings</h3>
                <p className="text-xs text-slate-400">{editingStep.displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStep(null)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* 1. Display Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Step Name *
                </label>
                <input
                  type="text"
                  value={editingStep.displayName}
                  onChange={(e) => setEditingStep({ ...editingStep, displayName: e.target.value })}
                  placeholder="e.g. Entrance Test"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              {/* 2. Step Requirement (Radio) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Step Requirement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStep({ ...editingStep, isRequired: true })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editingStep.isRequired
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">Required</span>
                    <span className="text-[10px] text-slate-400">Cannot be skipped</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStep({ ...editingStep, isRequired: false })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !editingStep.isRequired
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">Optional</span>
                    <span className="text-[10px] text-slate-400">Can be skipped by staff</span>
                  </button>
                </div>
              </div>

              {/* 3. Who Handles This? */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Who Handles This?
                </label>
                <select
                  value={editingStep.responsibleRole || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, responsibleRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <option value="">Use Default Admission Permissions</option>
                  <option value="Admissions Officer">Admissions Officer</option>
                  <option value="Principal / Vice Principal">Principal / Vice Principal</option>
                  <option value="Registrar">Registrar</option>
                  <option value="Academic Coordinator">Academic Coordinator</option>
                  <option value="Teacher / Evaluator">Teacher / Evaluator</option>
                  <option value="Accounts / Finance">Accounts / Finance</option>
                </select>
              </div>

              {/* 4. STEP-SPECIFIC CONFIGURATION PANELS */}

              {/* 4A. FEE CONFIGURATION (APPLICATION_FEE & ADMISSION_FEE) */}
              {(editingStep.stepType === 'APPLICATION_FEE' || editingStep.stepType === 'ADMISSION_FEE') && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      💰 Fee & Payment Settings
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Finance Foundation</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Fee Title *
                      </label>
                      <input
                        type="text"
                        value={editingStep.feeConfig?.feeName || (editingStep.stepType === 'APPLICATION_FEE' ? 'Registration Processing Fee' : 'Admission Security Deposit')}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            feeConfig: {
                              feeRequired: true,
                              feeName: e.target.value,
                              amount: editingStep.feeConfig?.amount ?? (editingStep.stepType === 'APPLICATION_FEE' ? 2000 : 25000),
                              currency: editingStep.feeConfig?.currency || 'PKR',
                              paymentRequiredBeforeNextStep: editingStep.feeConfig?.paymentRequiredBeforeNextStep ?? true,
                              allowWaiver: editingStep.feeConfig?.allowWaiver ?? true,
                              allowDiscount: editingStep.feeConfig?.allowDiscount ?? false,
                              receiptRequired: editingStep.feeConfig?.receiptRequired ?? true,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Amount ({editingStep.feeConfig?.currency || 'PKR'}) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editingStep.feeConfig?.amount ?? (editingStep.stepType === 'APPLICATION_FEE' ? 2000 : 25000)}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            feeConfig: {
                              feeRequired: true,
                              feeName: editingStep.feeConfig?.feeName || (editingStep.stepType === 'APPLICATION_FEE' ? 'Registration Processing Fee' : 'Admission Security Deposit'),
                              amount: Number(e.target.value) || 0,
                              currency: editingStep.feeConfig?.currency || 'PKR',
                              paymentRequiredBeforeNextStep: editingStep.feeConfig?.paymentRequiredBeforeNextStep ?? true,
                              allowWaiver: editingStep.feeConfig?.allowWaiver ?? true,
                              allowDiscount: editingStep.feeConfig?.allowDiscount ?? false,
                              receiptRequired: editingStep.feeConfig?.receiptRequired ?? true,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px]">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Payment Required Before Next Step
                      </span>
                      <input
                        type="checkbox"
                        checked={editingStep.feeConfig?.paymentRequiredBeforeNextStep ?? true}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            feeConfig: {
                              ...editingStep.feeConfig!,
                              feeRequired: true,
                              feeName: editingStep.feeConfig?.feeName || 'Admission Fee',
                              amount: editingStep.feeConfig?.amount ?? 2000,
                              currency: editingStep.feeConfig?.currency || 'PKR',
                              paymentRequiredBeforeNextStep: e.target.checked,
                              allowWaiver: editingStep.feeConfig?.allowWaiver ?? true,
                              allowDiscount: editingStep.feeConfig?.allowDiscount ?? false,
                              receiptRequired: editingStep.feeConfig?.receiptRequired ?? true,
                            },
                          })
                        }
                        className="h-4 w-4 text-amber-600 rounded cursor-pointer"
                      />
                    </label>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingStep.feeConfig?.allowWaiver ?? true}
                          onChange={(e) =>
                            setEditingStep({
                              ...editingStep,
                              feeConfig: { ...editingStep.feeConfig!, allowWaiver: e.target.checked },
                            })
                          }
                          className="h-3.5 w-3.5 text-amber-600 rounded"
                        />
                        <span>Allow Waiver</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingStep.feeConfig?.allowDiscount ?? false}
                          onChange={(e) =>
                            setEditingStep({
                              ...editingStep,
                              feeConfig: { ...editingStep.feeConfig!, allowDiscount: e.target.checked },
                            })
                          }
                          className="h-3.5 w-3.5 text-amber-600 rounded"
                        />
                        <span>Allow Discount</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingStep.feeConfig?.receiptRequired ?? true}
                          onChange={(e) =>
                            setEditingStep({
                              ...editingStep,
                              feeConfig: { ...editingStep.feeConfig!, receiptRequired: e.target.checked },
                            })
                          }
                          className="h-3.5 w-3.5 text-amber-600 rounded"
                        />
                        <span>Receipt Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 4B. TEST / ASSESSMENT CONFIGURATION */}
              {editingStep.stepType === 'ASSESSMENT_TEST' && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                      📝 Assessment & Test Settings
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Stage Rules</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Assessment Mode *
                    </label>
                    <select
                      value={editingStep.testConfig?.mode || 'PAPER_BASED'}
                      onChange={(e) =>
                        setEditingStep({
                          ...editingStep,
                          testConfig: {
                            testRequired: true,
                            assessmentName: editingStep.testConfig?.assessmentName || editingStep.displayName,
                            mode: e.target.value as any,
                            passMarks: editingStep.testConfig?.passMarks ?? 50,
                            totalMarks: editingStep.testConfig?.totalMarks ?? 100,
                            resultPublishingRule: editingStep.testConfig?.resultPublishingRule || 'AFTER_STAFF_APPROVAL',
                            allowRetest: editingStep.testConfig?.allowRetest ?? false,
                            maxAttempts: editingStep.testConfig?.maxAttempts ?? 1,
                            resultVisibleToParent: editingStep.testConfig?.resultVisibleToParent ?? true,
                            sendResultNotification: editingStep.testConfig?.sendResultNotification ?? true,
                          },
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      <option value="PAPER_BASED">📄 Paper Based</option>
                      <option value="COMPUTER_BASED">💻 Computer Based</option>
                      <option value="ONLINE">🌐 Online</option>
                      <option value="HYBRID">🔀 Hybrid</option>
                    </select>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                      {editingStep.testConfig?.mode === 'COMPUTER_BASED'
                        ? 'Student takes the assessment on CampusOS using a computer at the school/campus.'
                        : editingStep.testConfig?.mode === 'ONLINE'
                        ? 'Student can take the assessment remotely through an authorized online assessment.'
                        : editingStep.testConfig?.mode === 'HYBRID'
                        ? 'School can choose Paper, Computer Based, or Online when scheduling each assessment.'
                        : 'Traditional paper examination conducted at a physical venue.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Total Marks
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editingStep.testConfig?.totalMarks ?? 100}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            testConfig: {
                              ...editingStep.testConfig!,
                              testRequired: true,
                              assessmentName: editingStep.displayName,
                              mode: editingStep.testConfig?.mode || 'PAPER_BASED',
                              resultPublishingRule: editingStep.testConfig?.resultPublishingRule || 'AFTER_STAFF_APPROVAL',
                              totalMarks: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Pass Marks / Cutoff
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editingStep.testConfig?.passMarks ?? 50}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            testConfig: {
                              ...editingStep.testConfig!,
                              testRequired: true,
                              assessmentName: editingStep.displayName,
                              mode: editingStep.testConfig?.mode || 'PAPER_BASED',
                              resultPublishingRule: editingStep.testConfig?.resultPublishingRule || 'AFTER_STAFF_APPROVAL',
                              passMarks: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Result Publishing Rule *
                    </label>
                    <select
                      value={editingStep.testConfig?.resultPublishingRule || 'AFTER_STAFF_APPROVAL'}
                      onChange={(e) =>
                        setEditingStep({
                          ...editingStep,
                          testConfig: {
                            ...editingStep.testConfig!,
                            testRequired: true,
                            assessmentName: editingStep.testConfig?.assessmentName || editingStep.displayName,
                            mode: editingStep.testConfig?.mode || 'PAPER_BASED',
                            resultPublishingRule: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      <option value="AUTOMATIC_AFTER_EVALUATION">Automatic After Evaluation</option>
                      <option value="AFTER_STAFF_APPROVAL">Publish After Staff Approval</option>
                      <option value="MANUAL_PUBLISH">Manual Publish</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 4C. INTERVIEW CONFIGURATION */}
              {editingStep.stepType === 'INTERVIEW' && (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                      👥 Interview & Evaluation Settings
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Interview Panel</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Interview Mode *
                      </label>
                      <select
                        value={editingStep.interviewConfig?.mode || 'PHYSICAL'}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            interviewConfig: {
                              interviewRequired: true,
                              mode: e.target.value as any,
                              durationMinutes: editingStep.interviewConfig?.durationMinutes ?? 20,
                              meetingProvider: editingStep.interviewConfig?.meetingProvider || 'GOOGLE_MEET',
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                      >
                        <option value="PHYSICAL">🏫 In-Person / Physical Venue</option>
                        <option value="ONLINE">🌐 Online Video Meeting</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Slot Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={editingStep.interviewConfig?.durationMinutes ?? 20}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            interviewConfig: {
                              interviewRequired: true,
                              mode: editingStep.interviewConfig?.mode || 'PHYSICAL',
                              durationMinutes: Number(e.target.value) || 20,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Evaluation Form (Dynamic Form Builder)
                    </label>
                    <select
                      value={editingStep.interviewConfig?.attachedEvaluationFormId || ''}
                      onChange={(e) =>
                        setEditingStep({
                          ...editingStep,
                          interviewConfig: {
                            ...editingStep.interviewConfig!,
                            interviewRequired: true,
                            mode: editingStep.interviewConfig?.mode || 'PHYSICAL',
                            attachedEvaluationFormId: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      <option value="">Standard Rubric / Notes Only</option>
                      <option value="f_interview_eval">Admission Interview Evaluation Rubric (v1)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 4D. ADMISSION DECISION CONFIGURATION */}
              {editingStep.stepType === 'ADMISSION_DECISION' && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                      ⚖️ Admission Decision Settings
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Committee Governance</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Allowed Outcomes
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {['APPROVED', 'APPROVED_WITH_CONDITION', 'WAITING_LIST', 'ON_HOLD', 'REJECTED', 'WITHDRAWN'].map((oc) => (
                        <label key={oc} className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingStep.decisionConfig?.allowedOutcomes?.includes(oc as any) ?? true}
                            onChange={(e) => {
                              const current = editingStep.decisionConfig?.allowedOutcomes || ['APPROVED', 'APPROVED_WITH_CONDITION', 'WAITING_LIST', 'REJECTED'];
                              const next = e.target.checked ? [...current, oc as any] : current.filter((x) => x !== oc);
                              setEditingStep({
                                ...editingStep,
                                decisionConfig: {
                                  allowedOutcomes: next,
                                  requireHumanConfirmation: editingStep.decisionConfig?.requireHumanConfirmation ?? true,
                                },
                              });
                            }}
                            className="h-3.5 w-3.5 text-emerald-600 rounded"
                          />
                          <span className="text-[10px] font-semibold">{oc.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] cursor-pointer">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Require Human Confirmation (No Auto-Reject)
                    </span>
                    <input
                      type="checkbox"
                      checked={editingStep.decisionConfig?.requireHumanConfirmation ?? true}
                      onChange={(e) =>
                        setEditingStep({
                          ...editingStep,
                          decisionConfig: {
                            allowedOutcomes: editingStep.decisionConfig?.allowedOutcomes || ['APPROVED', 'REJECTED'],
                            requireHumanConfirmation: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {/* 4E. PARENT CONFIRMATION CONFIGURATION */}
              {editingStep.stepType === 'PARENT_CONFIRMATION' && (
                <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200">
                      ✉️ Parent Offer Response Settings
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Offer Lifecycle</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Offer Expiry (Days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editingStep.confirmationConfig?.expiryDays ?? 7}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            confirmationConfig: {
                              allowedResponses: ['ACCEPT', 'DECLINE', 'NEED_MORE_TIME'],
                              expiryDays: Number(e.target.value) || 7,
                              autoReminderEnabled: editingStep.confirmationConfig?.autoReminderEnabled ?? true,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Auto-Reminders
                      </label>
                      <select
                        value={String(editingStep.confirmationConfig?.autoReminderEnabled ?? true)}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            confirmationConfig: {
                              allowedResponses: ['ACCEPT', 'DECLINE', 'NEED_MORE_TIME'],
                              expiryDays: editingStep.confirmationConfig?.expiryDays ?? 7,
                              autoReminderEnabled: e.target.value === 'true',
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                      >
                        <option value="true">Enabled (48h & 24h Before Expiry)</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 4F. Attached Dynamic Form Selection (PRE_ADMISSION & FINAL_ADMISSION_FORM) */}
              {(editingStep.stepType === 'PRE_ADMISSION' || editingStep.stepType === 'FINAL_ADMISSION_FORM') && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                      {editingStep.stepType === 'PRE_ADMISSION' ? 'Pre-Admission Form *' : 'Final Admission Form *'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Dynamic Form Builder</span>
                  </div>

                  <select
                    value={editingStep.attachedFormDefinitionId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const catalog =
                        editingStep.stepType === 'PRE_ADMISSION'
                          ? PUBLISHED_PRE_ADMISSION_FORMS
                          : PUBLISHED_FINAL_ADMISSION_FORMS;
                      const found = catalog.find((f) => f.id === selectedId);
                      setEditingStep({
                        ...editingStep,
                        attachedFormDefinitionId: selectedId,
                        attachedFormVersionId: found?.versionId,
                        attachedFormName: found?.name,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">Select Existing Form...</option>
                    {(editingStep.stepType === 'PRE_ADMISSION'
                      ? PUBLISHED_PRE_ADMISSION_FORMS
                      : PUBLISHED_FINAL_ADMISSION_FORMS
                    ).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>

                  {editingStep.stepType === 'FINAL_ADMISSION_FORM' && (
                    <label className="flex items-center justify-between pt-1 text-[11px] cursor-pointer">
                      <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                        Prefill Matching Data from Pre-Admission
                      </span>
                      <input
                        type="checkbox"
                        checked={editingStep.finalAdmissionConfig?.prefillFromPreAdmission ?? true}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            finalAdmissionConfig: {
                              attachedFormDefinitionId: editingStep.attachedFormDefinitionId,
                              prefillFromPreAdmission: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </label>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Only published, eligible forms of matching purpose created in Dynamic Form Builder are selectable.
                  </p>
                </div>
              )}

              {/* 5. Progressive Disclosure: More Settings */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMoreStepSettings(!showMoreStepSettings)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{showMoreStepSettings ? '▲ Hide Advanced Settings' : '▼ More Settings'}</span>
                </button>

                {showMoreStepSettings && (
                  <div className="mt-3 space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 animate-in fade-in">
                    {/* Assessment Specific Advanced Policies */}
                    {editingStep.stepType === 'ASSESSMENT_TEST' && (
                      <div className="space-y-2.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Assessment Policies
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Allow Retest</span>
                          <input
                            type="checkbox"
                            checked={editingStep.testConfig?.allowRetest ?? false}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                testConfig: {
                                  ...editingStep.testConfig!,
                                  allowRetest: e.target.checked,
                                },
                              })
                            }
                            className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>

                        {editingStep.testConfig?.allowRetest && (
                          <div className="flex items-center justify-between pl-2">
                            <span className="text-slate-600 dark:text-slate-300 text-[11px]">Maximum Retest Attempts</span>
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={editingStep.testConfig?.maxAttempts ?? 2}
                              onChange={(e) =>
                                setEditingStep({
                                  ...editingStep,
                                  testConfig: {
                                    ...editingStep.testConfig!,
                                    maxAttempts: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Result visible to parent</span>
                          <input
                            type="checkbox"
                            checked={editingStep.testConfig?.resultVisibleToParent ?? true}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                testConfig: {
                                  ...editingStep.testConfig!,
                                  resultVisibleToParent: e.target.checked,
                                },
                              })
                            }
                            className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Send result notification</span>
                          <input
                            type="checkbox"
                            checked={editingStep.testConfig?.sendResultNotification ?? true}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                testConfig: {
                                  ...editingStep.testConfig!,
                                  sendResultNotification: e.target.checked,
                                },
                              })
                            }
                            className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Auto Continue */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          Auto Continue
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Automatically continue to the next step after successful completion
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingStep.autoMoveToNext ?? true}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, autoMoveToNext: e.target.checked })
                        }
                        className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Allow Hold */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Allow Hold</span>
                      <input
                        type="checkbox"
                        checked={editingStep.allowHold ?? false}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, allowHold: e.target.checked })
                        }
                        className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Allow Reject */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Allow Reject</span>
                      <input
                        type="checkbox"
                        checked={editingStep.allowReject ?? false}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, allowReject: e.target.checked })
                        }
                        className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Internal Instructions */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Internal Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={editingStep.instructions || ''}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, instructions: e.target.value })
                        }
                        placeholder="Internal guidelines for staff when completing this step"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    {/* Notification Toggles */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Notifications
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">
                          Applicant / Parent Notification
                        </span>
                        <input
                          type="checkbox"
                          checked={editingStep.notifications?.notifyApplicant ?? true}
                          onChange={(e) =>
                            setEditingStep({
                              ...editingStep,
                              notifications: {
                                notifyApplicant: e.target.checked,
                                notifyInternalTeam: editingStep.notifications?.notifyInternalTeam ?? false,
                              },
                            })
                          }
                          className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">
                          Internal Team Notification
                        </span>
                        <input
                          type="checkbox"
                          checked={editingStep.notifications?.notifyInternalTeam ?? false}
                          onChange={(e) =>
                            setEditingStep({
                              ...editingStep,
                              notifications: {
                                notifyApplicant: editingStep.notifications?.notifyApplicant ?? true,
                                notifyInternalTeam: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingStep(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = steps.map((s) => (s.id === editingStep.id ? editingStep : s));
                  reindexSteps(updated);
                  setEditingStep(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE STEP CONFIRMATION MODAL ── */}
      {stepToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Remove &quot;{stepToRemove.displayName}&quot;?
              </h3>
              <p className="text-xs text-slate-500">
                This step will be removed from this draft process. You can add it back later from the step library.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStepToRemove(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveStep}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm cursor-pointer"
              >
                Remove Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVATE REVIEW CONFIRMATION MODAL ── */}
      {showActivateReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to Activate?</h3>
              <p className="text-xs font-medium text-slate-500">{process.name} ({process.code})</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Journey Summary ({steps.length} Steps)
                </span>
                <div className="space-y-1">
                  {steps.map((st, i) => (
                    <div key={st.id} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-slate-400">{i + 1}.</span>
                      <span className="font-semibold">{st.displayName}</span>
                      {st.isSystemTerminal && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-bold">
                          Final Step
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {preAdmForm?.attachedFormName && (
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Pre-Admission Form:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{preAdmForm.attachedFormName}</span>
                </div>
              )}

              {finalAdmForm?.attachedFormName && (
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Final Admission Form:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{finalAdmForm.attachedFormName}</span>
                </div>
              )}

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Assigned To:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {hierarchyScopeState.isEntireOrg ? '🌐 All Campuses' : `📍 ${hierarchyScopeState.selectedCampusIds.length || 2} Campuses`}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                ℹ️ New admissions will use this process version (v{process.currentVersionNumber + 1}). Existing admission journeys will remain on their current version.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowActivateReviewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivate}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Activate Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGNED TO POPUP (REUSED COMPONENT) ── */}
      {showAssignedModal && (
        <AssignedToDetailsModal
          isOpen={true}
          onClose={() => setShowAssignedModal(false)}
          formName={`${process.name} (${process.code})`}
          scopeState={hierarchyScopeState}
        />
      )}

      {/* ── HIERARCHY SCOPE PICKER MODAL (CHANGE ASSIGNMENT) ── */}
      {showScopePickerModal && (
        <HierarchyScopePickerModal
          isOpen={showScopePickerModal}
          onClose={() => setShowScopePickerModal(false)}
          initialState={hierarchyScopeState}
          onApply={(newState) => {
            setHierarchyScopeState(newState);
            setShowScopePickerModal(false);
            const updatedProc: AdmissionProcessDto = {
              ...process,
              applyTo: (newState.isEntireOrg ? 'ALL_CAMPUSES' : 'SELECTED_CAMPUSES') as ConfigScopeType,
              branchIds: newState.selectedCampusIds,
            };
            setProcess(updatedProc);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`campusos_proc_draft_${processId}`, JSON.stringify(updatedProc));
            }
          }}
        />
      )}

      {/* ── PREVIEW JOURNEY MODAL ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Preview Admission Journey</h3>
                <p className="text-xs text-slate-400">{process.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Configured Steps Sequence ({steps.length})
              </span>
              <div className="space-y-2">
                {steps.map((st, idx) => (
                  <div key={st.id || idx}>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">{idx + 1}.</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{st.displayName}</span>
                        </div>
                        {st.attachedFormName && (
                          <div className="text-[10px] text-slate-500 pl-5">
                            📄 {st.attachedFormName}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          st.isSystemTerminal
                            ? 'bg-purple-100 text-purple-700 font-bold'
                            : st.isRequired
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {st.isSystemTerminal ? 'Final Step' : st.isRequired ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="text-center text-slate-300 dark:text-slate-600 py-0.5 text-xs">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
