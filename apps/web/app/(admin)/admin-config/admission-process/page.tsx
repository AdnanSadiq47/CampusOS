'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminConfigPageHeader,
  FORMS_SETUP_NAV,
} from '../../../../components/AdminConfigPageHeader';
import { ResponsiveFilterToolbar } from '../../../../components/ResponsiveFilterToolbar';
import { ResponsiveActionMenu } from '../../../../components/ResponsiveActionMenu';
import {
  HierarchyScopePickerModal,
  SelectedHierarchyState,
  getHierarchyScopeSummary,
} from '../../../../components/HierarchyScopePickerModal';
import { AssignedToDetailsModal } from '../../../../components/AssignedToDetailsModal';
import {
  AdmissionProcessDto,
  AdmissionProcessStarterTemplate,
  AdmissionProcessStatus,
} from '@campus-os/types';
import { StatusBadge } from '../../../../design-system';

const INITIAL_PROCESSES: AdmissionProcessDto[] = [
  {
    id: 'proc_general_k12',
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
        attachedFormName: 'Online Admission 2026–27',
      },
      {
        id: 's2',
        stepType: 'APPLICATION_REVIEW',
        displayName: 'Application Review',
        category: 'APPLICATION',
        isRequired: true,
        sortOrder: 2,
        responsibleRole: 'Admissions Officer',
      },
      {
        id: 's3',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 3,
        attachedFormDefinitionId: 'f_adm_formal',
        attachedFormName: 'Formal Admission Package',
      },
      {
        id: 's4',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 4,
        isSystemTerminal: true,
      },
    ],
    totalStepsCount: 4,
    createdAt: new Date('2026-08-20T10:00:00Z'),
    updatedAt: new Date('2026-08-20T10:00:00Z'),
  },
  {
    id: 'proc_simple_adm',
    organizationId: '11111111-1111-1111-1111-111111111111',
    code: 'AP-SMP-2026',
    name: 'Simple Direct Admission',
    description: 'Direct admission for junior school without multi-stage tests or pre-admission forms.',
    starterTemplate: 'SIMPLE',
    status: 'ACTIVE',
    currentVersionNumber: 1,
    publishedVersionId: 'ver_proc_smp_v1',
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd'],
    branchNames: ['Clifton Campus', 'PECHS Senior Campus'],
    ownerType: 'SCHOOL',
    ownerId: 'sch-1',
    sourceOrigin: 'LOCAL',
    isInherited: false,
    canEdit: true,
    canActivate: true,
    steps: [
      {
        id: 's_smp_1',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 1,
        attachedFormDefinitionId: 'f_adm_formal',
        attachedFormName: 'Formal Admission Package',
      },
      {
        id: 's_smp_2',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 2,
        isSystemTerminal: true,
      },
    ],
    totalStepsCount: 2,
    createdAt: new Date('2026-08-22T12:00:00Z'),
    updatedAt: new Date('2026-08-22T12:00:00Z'),
  },
  {
    id: 'proc_alevel_detailed',
    organizationId: '11111111-1111-1111-1111-111111111111',
    code: 'AP-ALV-2026',
    name: 'A-Level Comprehensive Admission',
    description: 'Multi-stage admission process with entrance testing, interview, document verification, and seat confirmation.',
    starterTemplate: 'DETAILED',
    status: 'DRAFT',
    currentVersionNumber: 1,
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc'],
    branchNames: ['Main Campus (Gulshan)', 'DHA Phase 6 Campus'],
    ownerType: 'HEAD_OFFICE',
    ownerId: 'ho_main',
    sourceOrigin: 'LOCAL',
    isInherited: false,
    canEdit: true,
    canActivate: true,
    steps: [
      { id: 'ad1', stepType: 'PRE_ADMISSION', displayName: 'Online Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1, attachedFormName: 'Online Admission 2026–27' },
      { id: 'ad2', stepType: 'APPLICATION_REVIEW', displayName: 'Application Review', category: 'APPLICATION', isRequired: true, sortOrder: 2 },
      { id: 'ad3', stepType: 'DOCUMENT_VERIFICATION', displayName: 'Document Verification', category: 'APPLICATION', isRequired: true, sortOrder: 3 },
      { id: 'ad4', stepType: 'REGISTRATION_FEE', displayName: 'Registration Fee', category: 'CONFIRMATION', isRequired: false, sortOrder: 4 },
      { id: 'ad5', stepType: 'ASSESSMENT_TEST', displayName: 'Entrance Test', category: 'ASSESSMENT', isRequired: true, sortOrder: 5 },
      { id: 'ad6', stepType: 'INTERVIEW', displayName: 'Interview', category: 'ASSESSMENT', isRequired: false, sortOrder: 6 },
      { id: 'ad7', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission Form', category: 'CONFIRMATION', isRequired: true, sortOrder: 7, attachedFormName: 'Formal Admission Package' },
      { id: 'ad8', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'REGISTRATION', isRequired: true, sortOrder: 8, isSystemTerminal: true },
    ],
    totalStepsCount: 8,
    createdAt: new Date('2026-08-23T14:00:00Z'),
    updatedAt: new Date('2026-08-23T14:00:00Z'),
  },
];

export default function AdmissionProcessPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<AdmissionProcessDto[]>(INITIAL_PROCESSES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Process Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessDesc, setNewProcessDesc] = useState('');
  const [starterTemplate, setStarterTemplate] = useState<AdmissionProcessStarterTemplate>('STANDARD');
  const [hierarchyScopeState, setHierarchyScopeState] = useState<SelectedHierarchyState>({
    isEntireOrg: true,
    selectedHeadOfficeIds: [],
    selectedRegionIds: [],
    selectedSchoolIds: [],
    selectedCampusIds: [],
  });
  const [showScopePickerModal, setShowScopePickerModal] = useState(false);
  const [selectedProcessForAssignedModal, setSelectedProcessForAssignedModal] = useState<AdmissionProcessDto | null>(null);

  // Preview Journey Modal
  const [previewProcess, setPreviewProcess] = useState<AdmissionProcessDto | null>(null);

  // Fetch from API
  const fetchProcesses = async () => {
    try {
      const res = await fetch('http://localhost:4000/admin/admission-processes', {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProcesses(data);
        }
      }
    } catch (e) {
      // Keep initial processes
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const filteredProcesses = processes.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessName.trim()) return;

    const newId = `proc_${Date.now()}`;
    const newProc: AdmissionProcessDto = {
      id: newId,
      organizationId: '11111111-1111-1111-1111-111111111111',
      code: `AP-${String(processes.length + 1).padStart(3, '0')}`,
      name: newProcessName.trim(),
      description: newProcessDesc.trim(),
      starterTemplate,
      status: 'DRAFT',
      currentVersionNumber: 1,
      applyTo: hierarchyScopeState.isEntireOrg ? 'ALL_CAMPUSES' : 'SELECTED_CAMPUSES',
      branchIds: hierarchyScopeState.selectedCampusIds,
      ownerType: 'HEAD_OFFICE',
      sourceOrigin: 'LOCAL',
      isInherited: false,
      canEdit: true,
      canActivate: true,
      steps: [
        {
          id: 'step_1',
          stepType: 'FINAL_ADMISSION_FORM',
          displayName: 'Final Admission Form',
          category: 'CONFIRMATION',
          isRequired: true,
          sortOrder: 1,
          attachedFormDefinitionId: 'f_adm_formal',
          attachedFormName: 'Formal Admission Package',
        },
        {
          id: 'step_2',
          stepType: 'STUDENT_REGISTRATION',
          displayName: 'Student Registration',
          category: 'REGISTRATION',
          isRequired: true,
          sortOrder: 2,
          isSystemTerminal: true,
        },
      ],
      totalStepsCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProcesses([newProc, ...processes]);
    setShowCreateModal(false);
    router.push(`/admin-config/admission-process/${newId}`);
  };

  const handleToggleStatus = async (procId: string, currentStatus: AdmissionProcessStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setProcesses(
      processes.map((p) => (p.id === procId ? { ...p, status: nextStatus, updatedAt: new Date() } : p))
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <AdminConfigPageHeader
        group="Forms & Admission Setup"
        title="Admission Process"
        description="Create and manage the admission steps used by your schools and campuses."
        configItemId="forms_admission_process"
        categoryNav={FORMS_SETUP_NAV}
        actionButtonText="+ Create Admission Process"
        onAction={() => setShowCreateModal(true)}
      />

      {/* 2. Filter Toolbar */}
      <ResponsiveFilterToolbar
        searchPlaceholder="Search admission processes by name or code..."
        searchTerm={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Inactive', value: 'INACTIVE' },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* 3. Processes Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Process Name & Code</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Steps in Journey</th>
                <th className="py-3.5 px-4">Template</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="text-3xl block mb-2">⚡</span>
                    <p className="font-medium">No admission processes match your search filter.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      + Create Admission Process
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Process Name & Code */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
                          ⚡
                        </div>
                        <div>
                          <Link
                            href={`/admin-config/admission-process/${proc.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors"
                          >
                            {proc.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-400">{proc.code}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-400">v{proc.currentVersionNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned To (Interactive Clickable) */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedProcessForAssignedModal(proc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer group"
                        title="Click to view assigned hierarchy and effective campuses"
                      >
                        <span>{proc.applyTo === 'ALL_CAMPUSES' ? '🌐' : '📍'}</span>
                        <span>
                          {proc.applyTo === 'ALL_CAMPUSES'
                            ? 'All Campuses'
                            : `${proc.branchIds?.length || 2} Campuses`}
                        </span>
                        <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform text-[10px]">
                          ›
                        </span>
                      </button>
                    </td>

                    {/* Steps in Journey */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <span>{proc.steps?.length || proc.totalStepsCount || 2} Steps</span>
                      </span>
                    </td>

                    {/* Starter Template */}
                    <td className="py-4 px-4">
                      <span className="text-xs text-slate-500 font-medium capitalize">
                        {proc.starterTemplate.toLowerCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={proc.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewProcess(proc)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Preview
                        </button>
                        <Link
                          href={`/admin-config/admission-process/${proc.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors"
                        >
                          Configure Steps
                        </Link>
                        <ResponsiveActionMenu
                          items={[
                            {
                              label: proc.status === 'ACTIVE' ? 'Deactivate Process' : 'Activate Process',
                              icon: proc.status === 'ACTIVE' ? '⏸️' : '🚀',
                              onClick: () => handleToggleStatus(proc.id, proc.status),
                            },
                            {
                              label: 'Clone Process',
                              icon: '📋',
                              onClick: () => {
                                const cloneId = `proc_${Date.now()}`;
                                setProcesses([
                                  {
                                    ...proc,
                                    id: cloneId,
                                    name: `${proc.name} (Copy)`,
                                    code: `${proc.code}-COPY`,
                                    status: 'DRAFT',
                                  },
                                  ...processes,
                                ]);
                              },
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE ADMISSION PROCESS MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Admission Process</h3>
                <p className="text-xs text-slate-400">Configure the sequence of admission steps for your campuses.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Process Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Admission 2026–27"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief description of this admission workflow"
                  value={newProcessDesc}
                  onChange={(e) => setNewProcessDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Starter Template Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Starter Journey *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      starterTemplate === 'SIMPLE'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <input
                        type="radio"
                        name="starter"
                        value="SIMPLE"
                        checked={starterTemplate === 'SIMPLE'}
                        onChange={() => setStarterTemplate('SIMPLE')}
                      />
                      <span>Simple (2 Steps)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Final Admission Form → Student Registration.
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      starterTemplate === 'STANDARD'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <input
                        type="radio"
                        name="starter"
                        value="STANDARD"
                        checked={starterTemplate === 'STANDARD'}
                        onChange={() => setStarterTemplate('STANDARD')}
                      />
                      <span>Standard (4 Steps)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pre-Admission → Review → Final Admission → Registration.
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      starterTemplate === 'DETAILED'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <input
                        type="radio"
                        name="starter"
                        value="DETAILED"
                        checked={starterTemplate === 'DETAILED'}
                        onChange={() => setStarterTemplate('DETAILED')}
                      />
                      <span>Detailed (12 Steps)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pre-Admission → Docs → Test → Interview → Approval → Admission.
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      starterTemplate === 'CUSTOM'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <input
                        type="radio"
                        name="starter"
                        value="CUSTOM"
                        checked={starterTemplate === 'CUSTOM'}
                        onChange={() => setStarterTemplate('CUSTOM')}
                      />
                      <span>Custom Blank</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Start blank and add steps from the step library.
                    </p>
                  </label>
                </div>
              </div>

              {/* Assigned To Preview & Opener */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned To *
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span className="text-base">{hierarchyScopeState.isEntireOrg ? '🌐' : '🏛️'}</span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {getHierarchyScopeSummary(hierarchyScopeState)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScopePickerModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                  >
                    Configure Scope
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Create & Configure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGNED TO POPUP (REUSED COMPONENT) ── */}
      {selectedProcessForAssignedModal && (
        <AssignedToDetailsModal
          isOpen={true}
          onClose={() => setSelectedProcessForAssignedModal(null)}
          formName={`${selectedProcessForAssignedModal.name} (${selectedProcessForAssignedModal.code})`}
          scopeState={{
            isEntireOrg: selectedProcessForAssignedModal.applyTo === 'ALL_CAMPUSES',
            selectedHeadOfficeIds: [],
            selectedRegionIds: [],
            selectedSchoolIds: [],
            selectedCampusIds: selectedProcessForAssignedModal.branchIds || [],
          }}
        />
      )}

      {/* ── HIERARCHY SCOPE PICKER MODAL ── */}
      {showScopePickerModal && (
        <HierarchyScopePickerModal
          isOpen={showScopePickerModal}
          onClose={() => setShowScopePickerModal(false)}
          initialState={hierarchyScopeState}
          onApply={(newState) => {
            setHierarchyScopeState(newState);
            setShowScopePickerModal(false);
          }}
        />
      )}

      {/* ── PREVIEW JOURNEY MODAL ── */}
      {previewProcess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Preview Admission Journey</h3>
                <p className="text-xs text-slate-400">{previewProcess.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProcess(null)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Configured Steps Sequence
              </span>
              <div className="space-y-2">
                {previewProcess.steps?.map((st, idx) => (
                  <div key={st.id || idx}>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">{idx + 1}.</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{st.displayName}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          st.isRequired ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st.isRequired ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    {idx < (previewProcess.steps?.length || 0) - 1 && (
                      <div className="text-center text-slate-300 dark:text-slate-600 py-0.5 text-xs">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewProcess(null)}
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
