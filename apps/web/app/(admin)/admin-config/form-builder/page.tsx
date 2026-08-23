'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminConfigPageHeader,
  FORMS_SETUP_NAV,
} from '../../../../components/AdminConfigPageHeader';
import { ResponsiveFilterToolbar } from '../../../../components/ResponsiveFilterToolbar';
import { ResponsiveActionMenu } from '../../../../components/ResponsiveActionMenu';
import { FormRuntimeRenderer } from '../../../../components/FormRuntimeRenderer';
import {
  HierarchyScopePickerModal,
  SelectedHierarchyState,
  getHierarchyScopeSummary,
} from '../../../../components/HierarchyScopePickerModal';
import {
  FormDefinitionListItemDto,
  FormPurpose,
  ConfigScopeType,
} from '@campus-os/types';

// Mock initial forms list for immediate UI rendering and interactive testing
const INITIAL_MOCK_FORMS: FormDefinitionListItemDto[] = [
  {
    id: 'f_prereg_2026',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Online Pre-Registration 2026-2027',
    code: 'FORM_PREREG_2026',
    formPurpose: 'PRE_REGISTRATION',
    description: 'Standard online pre-registration form collecting essential applicant & parent contact details.',
    ownerType: 'SCHOOL',
    applyTo: 'ALL_CAMPUSES',
    sourceOrigin: 'INHERITED',
    isInherited: false,
    canEdit: true,
    canToggleStatus: true,
    canAssign: true,
    currentVersionNumber: 1,
    currentVersionStatus: 'PUBLISHED',
    publishedVersionId: 'v_prereg_1',
    publishedVersionNumber: 1,
    totalVersionsCount: 1,
    isActive: true,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'f_adm_formal',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Comprehensive Formal Admission Package',
    code: 'FORM_ADM_COMPREHENSIVE',
    formPurpose: 'ADMISSION',
    description: 'Complete formal admission form including previous school history, transport, medical, and document uploads.',
    ownerType: 'SCHOOL',
    applyTo: 'ALL_CAMPUSES',
    sourceOrigin: 'INHERITED',
    isInherited: false,
    canEdit: true,
    canToggleStatus: true,
    canAssign: true,
    currentVersionNumber: 2,
    currentVersionStatus: 'DRAFT',
    publishedVersionId: 'v_adm_1',
    publishedVersionNumber: 1,
    totalVersionsCount: 2,
    isActive: true,
    createdAt: new Date('2026-01-12'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'f_gulshan_override',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Gulshan Campus Early Childhood Pre-Reg',
    code: 'FORM_GUL_PRE_REG',
    formPurpose: 'PRE_REGISTRATION',
    description: 'Campus-specific tailored pre-registration with playgroup & kindergarten special interview questions.',
    ownerType: 'CAMPUS',
    ownerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    applyTo: 'LOCAL_SCOPE',
    sourceOrigin: 'LOCAL',
    isInherited: false,
    canEdit: true,
    canToggleStatus: true,
    canAssign: false,
    currentVersionNumber: 1,
    currentVersionStatus: 'PUBLISHED',
    publishedVersionId: 'v_gul_1',
    publishedVersionNumber: 1,
    totalVersionsCount: 1,
    isActive: true,
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-22'),
  },
];

export default function FormBuilderPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormDefinitionListItemDto[]>(INITIAL_MOCK_FORMS);
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [governanceFilter, setGovernanceFilter] = useState('ALL');

  // Create Form Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormPurpose, setNewFormPurpose] = useState<FormPurpose>('PRE_REGISTRATION');
  const [hierarchyScopeState, setHierarchyScopeState] = useState<SelectedHierarchyState>({
    isEntireOrg: true,
    selectedHeadOfficeIds: [],
    selectedRegionIds: [],
    selectedSchoolIds: [],
    selectedCampusIds: [],
  });
  const [newFormScope, setNewFormScope] = useState<ConfigScopeType>('ALL_CAMPUSES');
  const [newFormBranchIds, setNewFormBranchIds] = useState<string[]>([]);
  const [showScopePickerModal, setShowScopePickerModal] = useState(false);
  const [newFormStarterOption, setNewFormStarterOption] = useState<'BLANK' | 'TEMPLATE' | 'COPY'>('BLANK');
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl_basic_prereg');
  const [copySourceFormId, setCopySourceFormId] = useState('');
  const [scopeValidationError, setScopeValidationError] = useState<string | null>(null);

  // Live Preview Modal state
  const [previewForm, setPreviewForm] = useState<FormDefinitionListItemDto | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Filter forms list
  const filteredForms = forms.filter((f) => {
    if (purposeFilter !== 'ALL' && f.formPurpose !== purposeFilter) return false;
    if (statusFilter !== 'ALL' && (statusFilter === 'ACTIVE' ? !f.isActive : f.isActive)) return false;
    if (governanceFilter !== 'ALL') {
      if (governanceFilter === 'SCHOOL' && f.ownerType !== 'SCHOOL') return false;
      if (governanceFilter === 'CAMPUS' && f.ownerType !== 'CAMPUS') return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormName.trim()) return;

    if (!hierarchyScopeState.isEntireOrg && newFormBranchIds.length === 0) {
      setScopeValidationError('Please select at least one location.');
      return;
    }

    const newId = `form_${Date.now()}`;
    const newRecord: FormDefinitionListItemDto = {
      id: newId,
      organizationId: '11111111-1111-1111-1111-111111111111',
      name: newFormName.trim(),
      code: `FORM_${newFormPurpose}_${Date.now().toString().slice(-4)}`,
      formPurpose: newFormPurpose,
      description: `Custom ${newFormPurpose.toLowerCase()} dynamic form.`,
      ownerType: 'SCHOOL',
      applyTo: newFormScope,
      branchIds: newFormBranchIds,
      sourceOrigin: 'LOCAL',
      isInherited: false,
      canEdit: true,
      canToggleStatus: true,
      canAssign: true,
      currentVersionNumber: 1,
      currentVersionStatus: 'DRAFT',
      publishedVersionId: null,
      publishedVersionNumber: null,
      totalVersionsCount: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setForms([newRecord, ...forms]);
    setShowCreateModal(false);
    setNewFormName('');
    setNewFormBranchIds([]);
    setHierarchyScopeState({
      isEntireOrg: true,
      selectedHeadOfficeIds: [],
      selectedRegionIds: [],
      selectedSchoolIds: [],
      selectedCampusIds: [],
    });
    setScopeValidationError(null);
    router.push(`/admin-config/form-builder/${newId}`);
  };

  const handleToggleStatus = (id: string) => {
    setForms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isActive: !f.isActive, updatedAt: new Date() } : f))
    );
  };

  const handlePublishForm = (id: string) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              currentVersionStatus: 'PUBLISHED',
              publishedVersionId: `v_pub_${Date.now()}`,
              publishedVersionNumber: f.currentVersionNumber,
              updatedAt: new Date(),
            }
          : f
      )
    );
  };

  const handleNewVersion = (id: string) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              currentVersionNumber: f.currentVersionNumber + 1,
              currentVersionStatus: 'DRAFT',
              totalVersionsCount: f.totalVersionsCount + 1,
              updatedAt: new Date(),
            }
          : f
      )
    );
  };

  return (
    <div className="space-y-6">
      <AdminConfigPageHeader
        group="Forms Setup"
        title="Form Builder"
        description="Design, customize, version, preview, and publish dynamic Pre-Registration and Admission application forms."
        configItemId="forms_builder"
        categoryNav={FORMS_SETUP_NAV}
        actionButtonText="+ Create Form"
        onAction={() => setShowCreateModal(true)}
      />

      {/* Filter Toolbar */}
      <ResponsiveFilterToolbar
        searchPlaceholder="Search forms by name or code..."
        searchTerm={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: 'purpose',
            label: 'Form Purpose',
            value: purposeFilter,
            options: [
              { label: 'All Purposes', value: 'ALL' },
              { label: 'Pre-Registration', value: 'PRE_REGISTRATION' },
              { label: 'Admission', value: 'ADMISSION' },
              { label: 'Custom Forms', value: 'CUSTOM' },
            ],
            onChange: setPurposeFilter,
          },
          {
            id: 'governance',
            label: 'Governance Scope',
            value: governanceFilter,
            options: [
              { label: 'All Scopes', value: 'ALL' },
              { label: 'School-wide (Universal)', value: 'SCHOOL' },
              { label: 'Campus Overrides', value: 'CAMPUS' },
            ],
            onChange: setGovernanceFilter,
          },
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active Forms', value: 'ACTIVE' },
              { label: 'Inactive / Archived', value: 'INACTIVE' },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* Forms Data Table / Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Form Name & Code</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Governance & Scope</th>
                <th className="py-3.5 px-4">Version & Lifecycle</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="text-3xl block mb-2">📝</span>
                    <p className="font-medium">No forms matching your filter criteria.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      + Create a new form
                    </button>
                  </td>
                </tr>
              ) : (
                filteredForms.map((form) => (
                  <tr key={form.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
                          {form.formPurpose === 'PRE_REGISTRATION' ? '⚡' : form.formPurpose === 'ADMISSION' ? '🏫' : '📄'}
                        </div>
                        <div>
                          <Link
                            href={`/admin-config/form-builder/${form.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors"
                          >
                            {form.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-400">{form.code}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        form.formPurpose === 'PRE_REGISTRATION'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : form.formPurpose === 'ADMISSION'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}>
                        {form.formPurpose.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          form.ownerType === 'CAMPUS'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {form.ownerType === 'CAMPUS' ? 'Local Campus Override' : 'School Level'}
                        </span>
                        <div>
                          <Link
                            href={`/admin-config/form-builder/${form.id}/applicability`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            title="View full applicability and inheritance hierarchy"
                          >
                            <span>📍</span>
                            <span>{form.applyTo === 'ALL_CAMPUSES' ? 'Entire Organization' : '67 Campuses'}</span>
                            <span className="text-[10px] text-slate-400">›</span>
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          v{form.currentVersionNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          form.currentVersionStatus === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {form.currentVersionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(form.id)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          form.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {form.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewForm(form)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Preview
                        </button>
                        <Link
                          href={`/admin-config/form-builder/${form.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors"
                        >
                          Edit in Builder
                        </Link>
                        <ResponsiveActionMenu
                          items={[
                            {
                              label: 'Create New Version',
                              icon: '⚡',
                              onClick: () => handleNewVersion(form.id),
                            },
                            {
                              label: 'Publish Current Draft',
                              icon: '🚀',
                              onClick: () => handlePublishForm(form.id),
                              disabled: form.currentVersionStatus === 'PUBLISHED',
                            },
                            {
                              label: 'Clone Form',
                              icon: '📋',
                              onClick: () => {
                                const cloneId = `form_${Date.now()}`;
                                setForms([
                                  {
                                    ...form,
                                    id: cloneId,
                                    name: `${form.name} (Copy)`,
                                    code: `${form.code}_COPY`,
                                    currentVersionStatus: 'DRAFT',
                                    publishedVersionId: null,
                                  },
                                  ...forms,
                                ]);
                              },
                            },
                            {
                              label: form.isActive ? 'Archive Form' : 'Restore Form',
                              icon: '📦',
                              onClick: () => handleToggleStatus(form.id),
                              variant: form.isActive ? 'danger' : 'default',
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

      {/* Create Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Dynamic Form</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Form Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Online Pre-Registration 2026"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Purpose *
                </label>
                <select
                  value={newFormPurpose}
                  onChange={(e) => setNewFormPurpose(e.target.value as FormPurpose)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="PRE_REGISTRATION">Pre-Registration</option>
                  <option value="ADMISSION">Admission</option>
                  <option value="CUSTOM">Custom Form</option>
                </select>
              </div>

              {/* ── Compact Apply Form To Preview & Scope Picker Opener ── */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Apply Form To *
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span className="text-base">{hierarchyScopeState.isEntireOrg ? '🌐' : '🏛️'}</span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {getHierarchyScopeSummary(hierarchyScopeState)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {hierarchyScopeState.isEntireOrg ? 'Universal dynamic inheritance' : 'Designated target locations'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScopePickerModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shrink-0"
                  >
                    {hierarchyScopeState.isEntireOrg ? 'Configure Scope' : 'Change'}
                  </button>
                </div>
              </div>

              {scopeValidationError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{scopeValidationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Starter Configuration
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewFormStarterOption('BLANK')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newFormStarterOption === 'BLANK'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">📄</span>
                    <span className="text-xs">Start Blank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFormStarterOption('TEMPLATE')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newFormStarterOption === 'TEMPLATE'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">📋</span>
                    <span className="text-xs">Use Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFormStarterOption('COPY')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newFormStarterOption === 'COPY'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">🔄</span>
                    <span className="text-xs">Copy Pre-Reg</span>
                  </button>
                </div>
              </div>

              {newFormStarterOption === 'TEMPLATE' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="tmpl_basic_prereg">Basic Pre-Registration (Minimal)</option>
                    <option value="tmpl_standard_prereg">Standard Pre-Registration (Complete)</option>
                    <option value="tmpl_detailed_admission">Comprehensive Admission Package</option>
                  </select>
                </div>
              )}

              {newFormStarterOption === 'COPY' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Select Source Pre-Registration Form
                  </label>
                  <select
                    value={copySourceFormId}
                    onChange={(e) => setCopySourceFormId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">-- Choose existing form --</option>
                    {forms
                      .filter((f) => f.formPurpose === 'PRE_REGISTRATION')
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} (v{f.currentVersionNumber})
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Canonical field identities will be preserved for automatic applicant data pre-filling.
                  </p>
                </div>
              )}

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
                  Create & Open Builder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Device Live Preview Modal */}
      {previewForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-start p-4 overflow-y-auto">
          <div className="w-full max-w-5xl flex items-center justify-between py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">{previewForm.name}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/20">
                v{previewForm.currentVersionNumber} Preview
              </span>
            </div>

            {/* Viewport Switcher */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                🖥️ Desktop (1440px)
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  previewDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                📱 Tablet (768px)
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                📱 Mobile (390px)
              </button>
            </div>

            <button
              onClick={() => setPreviewForm(null)}
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
                settings: { submitButtonText: 'Submit Test Application', saveDraftEnabled: true },
                rules: [
                  {
                    id: 'r_trn',
                    sourceFieldKey: 'fld_trn_req',
                    operator: 'EQUALS',
                    value: true,
                    action: 'SHOW',
                    targetFieldKey: 'fld_trn_pickup',
                  },
                ],
                sections: [
                  {
                    id: 'sec_std',
                    title: 'Student Basic Details',
                    showSectionHeading: true,
                    columns: 2,
                    sortOrder: 1,
                    fields: [
                      { instanceId: 'fld_fname', fieldDefinitionId: 'STD_FIRST_NAME', canonicalKey: 'STUDENT_FIRST_NAME', customLabel: 'Student First Name', isRequired: true, width: 'HALF', sortOrder: 1 },
                      { instanceId: 'fld_lname', fieldDefinitionId: 'STD_LAST_NAME', canonicalKey: 'STUDENT_LAST_NAME', customLabel: 'Student Last Name', isRequired: true, width: 'HALF', sortOrder: 2 },
                      { instanceId: 'fld_dob', fieldDefinitionId: 'STD_DOB', canonicalKey: 'STUDENT_DOB', customLabel: 'Date of Birth', isRequired: true, width: 'HALF', sortOrder: 3 },
                      { instanceId: 'fld_class', fieldDefinitionId: 'ACAD_CLASS_REF', canonicalKey: 'APPLYING_CLASS', customLabel: 'Applying Grade / Class', isRequired: true, width: 'HALF', masterBinding: 'CLASS', sortOrder: 4 },
                    ],
                  },
                  {
                    id: 'sec_parent',
                    title: 'Parent & Address Details',
                    showSectionHeading: true,
                    columns: 2,
                    sortOrder: 2,
                    fields: [
                      { instanceId: 'fld_fat_name', fieldDefinitionId: 'FAT_NAME', canonicalKey: 'FATHER_NAME', customLabel: 'Father Full Name', isRequired: true, width: 'HALF', sortOrder: 1 },
                      { instanceId: 'fld_fat_mob', fieldDefinitionId: 'FAT_MOBILE', canonicalKey: 'FATHER_MOBILE', customLabel: 'Primary Contact Mobile', isRequired: true, width: 'HALF', sortOrder: 2 },
                      { instanceId: 'fld_city', fieldDefinitionId: 'ADDR_CURR_CITY', canonicalKey: 'CURRENT_CITY', customLabel: 'City', isRequired: true, width: 'HALF', masterBinding: 'CITY', sortOrder: 3 },
                      { instanceId: 'fld_area', fieldDefinitionId: 'ADDR_CURR_AREA', canonicalKey: 'CURRENT_AREA', customLabel: 'Area / Catchment Zone', isRequired: false, width: 'HALF', masterBinding: 'AREA', sortOrder: 4 },
                    ],
                  },
                ],
              }}
              formTitle={previewForm.name}
              formPurpose={previewForm.formPurpose}
            />
          </div>
        </div>
      )}

      {/* Dedicated Mixed Multi-Level Hierarchy Scope Picker Modal */}
      <HierarchyScopePickerModal
        isOpen={showScopePickerModal}
        onClose={() => setShowScopePickerModal(false)}
        initialState={hierarchyScopeState}
        onApply={(newState, scopeType, branches) => {
          setHierarchyScopeState(newState);
          setNewFormScope(scopeType);
          setNewFormBranchIds(branches);
          setScopeValidationError(null);
        }}
      />
    </div>
  );
}
