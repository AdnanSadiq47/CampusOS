'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PreAdmissionApplicationDto,
  PreAdmissionsSummaryDto,
  PreAdmissionStatus,
  PreAdmissionSource,
  FormSchemaPayload,
  ListColumnDefinitionDto,
  PreAdmissionsListViewConfigDto,
} from '@campus-os/types';
import { FormRuntimeRenderer } from '../../../../components/FormRuntimeRenderer';

// Status badge styling helper
function getStatusBadge(status: PreAdmissionStatus) {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'SUBMITTED':
      return {
        label: 'Submitted',
        bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500',
      };
    case 'ON_HOLD':
      return {
        label: 'On Hold',
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'APPROVED':
      return {
        label: 'Approved',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-slate-100 text-slate-500 border-slate-200',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

// Source badge helper
function getSourceBadge(source: PreAdmissionSource) {
  switch (source) {
    case 'ONLINE':
      return { label: 'Online', icon: '🌐', bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
    case 'STAFF_ENTRY':
      return { label: 'Staff Entry', icon: '👤', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    case 'WALK_IN':
      return { label: 'Walk-in', icon: '🚶', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    case 'IMPORT':
      return { label: 'Import', icon: '📥', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    default:
      return { label: source, icon: '📋', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

// Default columns configuration
const INITIAL_COLUMNS: ListColumnDefinitionDto[] = [
  { id: 'col_app_no', key: 'applicationNumber', label: 'Application No.', category: 'SYSTEM', isVisible: true, isPinned: true, sortOrder: 1, width: '140px', dataType: 'string' },
  { id: 'col_form', key: 'formName', label: 'Form', category: 'SYSTEM', isVisible: true, sortOrder: 2, dataType: 'string' },
  { id: 'col_student', key: 'studentName', label: 'Student', category: 'CANONICAL', isVisible: true, sortOrder: 3, dataType: 'string' },
  { id: 'col_class', key: 'className', label: 'Applying For', category: 'SYSTEM', isVisible: true, sortOrder: 4, dataType: 'string' },
  { id: 'col_campus', key: 'campusName', label: 'School / Campus', category: 'SYSTEM', isVisible: true, sortOrder: 5, dataType: 'string' },
  { id: 'col_source', key: 'source', label: 'Source', category: 'SYSTEM', isVisible: true, sortOrder: 6, dataType: 'badge' },
  { id: 'col_curr_step', key: 'currentStepName', label: 'Current Step', category: 'SYSTEM', isVisible: true, sortOrder: 7, dataType: 'badge' },
  { id: 'col_status', key: 'status', label: 'Status', category: 'SYSTEM', isVisible: true, sortOrder: 8, dataType: 'badge' },
  { id: 'col_submitted', key: 'submittedAt', label: 'Submitted On', category: 'SYSTEM', isVisible: true, sortOrder: 9, dataType: 'date' },
  { id: 'col_dob', key: 'dateOfBirth', label: 'Date of Birth', category: 'CANONICAL', isVisible: false, sortOrder: 10, dataType: 'date' },
  { id: 'col_gender', key: 'gender', label: 'Gender', category: 'CANONICAL', isVisible: false, sortOrder: 11, dataType: 'string' },
  { id: 'col_father', key: 'fatherOrGuardianName', label: 'Father Name', category: 'CANONICAL', isVisible: false, sortOrder: 12, dataType: 'string' },
  { id: 'col_mobile', key: 'primaryMobile', label: 'Mobile Number', category: 'CANONICAL', isVisible: false, sortOrder: 13, dataType: 'string' },
  { id: 'col_email', key: 'primaryEmail', label: 'Email', category: 'CANONICAL', isVisible: false, sortOrder: 14, dataType: 'string' },
  { id: 'col_prev_school', key: 'previousSchool', label: 'Previous School', category: 'CANONICAL', isVisible: false, sortOrder: 15, dataType: 'string' },
  { id: 'col_custom_sibling', key: 'siblingDiscountEligible', label: 'Sibling Discount Eligible', category: 'CUSTOM', isVisible: false, sortOrder: 16, dataType: 'boolean' },
  { id: 'col_test_status', key: 'testStatus', label: 'Test Status', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 17, dataType: 'badge' },
  { id: 'col_test_date', key: 'testDate', label: 'Test Date', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 18, dataType: 'date' },
  { id: 'col_interview_status', key: 'interviewStatus', label: 'Interview Status', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 19, dataType: 'badge' },
  { id: 'col_decision', key: 'decisionOutcome', label: 'Decision', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 20, dataType: 'badge' },
  { id: 'col_fee_status', key: 'feeStatus', label: 'Payment Status', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 21, dataType: 'badge' },
];

const DEFAULT_PRE_ADM_SCHEMA: FormSchemaPayload = {
  settings: { submitButtonText: 'Submit Pre-Admission', saveDraftEnabled: true },
  rules: [],
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
        { instanceId: 'fld_gender', fieldDefinitionId: 'STD_GENDER', canonicalKey: 'GENDER', customLabel: 'Gender', isRequired: true, width: 'HALF', sortOrder: 3 },
        { instanceId: 'fld_dob', fieldDefinitionId: 'STD_DOB', canonicalKey: 'STUDENT_DOB', customLabel: 'Date of Birth', isRequired: true, width: 'HALF', sortOrder: 4 },
      ],
    },
    {
      id: 'sec_parent',
      title: 'Parent & Contact Information',
      showSectionHeading: true,
      columns: 2,
      sortOrder: 2,
      fields: [
        { instanceId: 'fld_fat_name', fieldDefinitionId: 'FAT_NAME', canonicalKey: 'FATHER_NAME', customLabel: 'Father / Guardian Full Name', isRequired: true, width: 'HALF', sortOrder: 1 },
        { instanceId: 'fld_fat_mob', fieldDefinitionId: 'FAT_MOBILE', canonicalKey: 'FATHER_MOBILE', customLabel: 'Primary Mobile Number', isRequired: true, width: 'HALF', sortOrder: 2 },
        { instanceId: 'fld_email', fieldDefinitionId: 'EMAIL', canonicalKey: 'EMAIL', customLabel: 'Primary Email Address', isRequired: false, width: 'HALF', sortOrder: 3 },
        { instanceId: 'fld_prev_sch', fieldDefinitionId: 'PREV_SCH', canonicalKey: 'PREVIOUS_SCHOOL', customLabel: 'Previous School Attended', isRequired: false, width: 'HALF', sortOrder: 4 },
      ],
    },
  ],
};

export default function PreAdmissionsListPage() {
  const [applications, setApplications] = useState<PreAdmissionApplicationDto[]>([]);
  const [summary, setSummary] = useState<PreAdmissionsSummaryDto>({
    totalPreAdmissions: 6,
    newSubmitted: 2,
    inProcess: 3,
    completed: 1,
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [processFilter, setProcessFilter] = useState<string>('ALL');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Dynamic List Columns State
  const [columns, setColumns] = useState<ListColumnDefinitionDto[]>(INITIAL_COLUMNS);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configCategoryTab, setConfigCategoryTab] = useState<'ALL' | 'SYSTEM' | 'CANONICAL' | 'CUSTOM' | 'DYNAMIC_STATUS'>('ALL');

  // New Pre-Admission Staff Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedCampusId, setSelectedCampusId] = useState('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  const [selectedClassId, setSelectedClassId] = useState('cls-g3');
  const [selectedAcademicYearId] = useState('ay_2026_2027');
  const [selectedFormId, setSelectedFormId] = useState('f_prereg_2026');
  const [staffModalStep, setStaffModalStep] = useState<'CONTEXT' | 'FORM'>('CONTEXT');
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

  // Fetch list view config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('http://localhost:4000/admissions/list-view-config', {
          headers: {
            'x-tenant-id': '11111111-1111-1111-1111-111111111111',
            'x-user-role': 'ADMIN',
          },
        });
        if (res.ok) {
          const data: PreAdmissionsListViewConfigDto = await res.json();
          if (data.columns && data.columns.length > 0) {
            setColumns(data.columns);
          }
        }
      } catch (e) {
        // Fallback to initial
      }
    };
    fetchConfig();
  }, []);

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      if (campusFilter !== 'ALL') params.append('campusId', campusFilter);
      if (classFilter !== 'ALL') params.append('classId', classFilter);
      if (processFilter !== 'ALL') params.append('processDefinitionId', processFilter);

      const res = await fetch(`http://localhost:4000/admissions/pre-admissions?${params.toString()}`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setApplications(data.items || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [search, statusFilter, sourceFilter, campusFilter, classFilter, processFilter]);

  const handleSaveColumns = async (newColumns: ListColumnDefinitionDto[]) => {
    setColumns(newColumns);
    setShowConfigModal(false);
    try {
      await fetch('http://localhost:4000/admissions/list-view-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          id: 'cfg_default',
          organizationId: '11111111-1111-1111-1111-111111111111',
          viewType: 'ORGANIZATION_DEFAULT',
          name: 'Default Operational View',
          columns: newColumns,
        }),
      });
    } catch (e) {
      // Offline fallback
    }
  };

  const handleMoveColumn = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const reordered = [...columns];
    const temp = reordered[index]!;
    reordered[index] = reordered[targetIndex]!;
    reordered[targetIndex] = temp;
    reordered.forEach((c, idx) => {
      c.sortOrder = idx + 1;
    });
    setColumns(reordered);
  };

  const handleToggleColumn = (colId: string) => {
    setColumns(
      columns.map((c) => {
        if (c.id === colId) {
          return { ...c, isVisible: !c.isVisible };
        }
        return c;
      })
    );
  };

  const handleStaffFormSubmit = async (formData: Record<string, any>) => {
    try {
      const res = await fetch('http://localhost:4000/admissions/pre-admissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          campusId: selectedCampusId,
          classId: selectedClassId,
          academicYearId: selectedAcademicYearId,
          formDefinitionId: selectedFormId,
          publishedFormVersionId: 'v_prereg_1',
          source: 'STAFF_ENTRY',
          formData,
        }),
      });

      if (res.ok) {
        const newApp = await res.json();
        setShowNewModal(false);
        setStaffModalStep('CONTEXT');
        setCreateSuccessMsg(`Pre-Admission ${newApp.applicationNumber} created successfully! Process initialized.`);
        setTimeout(() => setCreateSuccessMsg(null), 4500);
        fetchApplications();
      }
    } catch (e) {
      alert('Failed to submit pre-admission application.');
    }
  };

  const visibleColumns = columns.filter((c) => c.isVisible);

  // Dynamic cell value resolver
  const renderCellContent = (app: PreAdmissionApplicationDto, col: ListColumnDefinitionDto) => {
    switch (col.key) {
      case 'applicationNumber':
        return (
          <Link href={`/admissions/pre-admissions/${app.id}`} className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            {app.applicationNumber}
          </Link>
        );
      case 'formName':
        return <span className="font-semibold text-slate-800 dark:text-slate-200">{app.formName}</span>;
      case 'studentName':
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white block">{app.studentName}</span>
            <span className="text-[10px] text-slate-400">DOB: {app.dateOfBirth} · {app.gender}</span>
          </div>
        );
      case 'className':
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{app.className}</span>
            <span className="text-[10px] text-slate-400">2026–2027</span>
          </div>
        );
      case 'campusName':
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{app.campusName}</span>
            <span className="text-[10px] text-slate-400">{app.schoolName}</span>
          </div>
        );
      case 'source': {
        const sourceBadge = getSourceBadge(app.source);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceBadge.bg}`}>
            <span>{sourceBadge.icon}</span>
            <span>{sourceBadge.label}</span>
          </span>
        );
      }
      case 'currentStepName':
        return app.currentStepName ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>{app.currentStepName}</span>
          </span>
        ) : (
          <span className="text-slate-400 italic">No Process</span>
        );
      case 'status': {
        const statusBadge = getStatusBadge(app.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            <span>{statusBadge.label}</span>
          </span>
        );
      }
      case 'submittedAt':
        return (
          <span className="text-slate-500 font-mono text-[11px]">
            {new Date(app.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      case 'fatherOrGuardianName':
        return <span className="text-slate-700 dark:text-slate-300 font-medium">{app.fatherOrGuardianName}</span>;
      case 'primaryMobile':
        return <span className="font-mono text-slate-700 dark:text-slate-300">{app.primaryMobile}</span>;
      case 'primaryEmail':
        return <span className="text-slate-600 dark:text-slate-400">{app.primaryEmail || '—'}</span>;
      case 'dateOfBirth':
        return <span className="font-mono text-slate-700">{app.dateOfBirth}</span>;
      case 'gender':
        return <span className="text-slate-700 font-medium">{app.gender}</span>;
      case 'previousSchool':
        return <span className="text-slate-600">{app.submissionData?.previousSchool || '—'}</span>;
      case 'siblingDiscountEligible':
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${app.customFieldsData?.siblingDiscountEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
            {app.customFieldsData?.siblingDiscountEligible ? 'Yes' : 'No'}
          </span>
        );
      case 'testStatus':
        return (
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {app.testStatus || '—'}
          </span>
        );
      case 'testDate':
        return <span className="font-mono text-[11px] text-slate-600">{app.testDate || '—'}</span>;
      case 'interviewStatus':
        return <span className="text-[11px] font-semibold text-slate-700">{app.interviewStatus || '—'}</span>;
      case 'decisionOutcome':
        return <span className="text-[11px] font-bold text-emerald-600">{app.decisionOutcome || '—'}</span>;
      case 'feeStatus':
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${app.feeStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
            {app.feeStatus || 'UNPAID'}
          </span>
        );
      default: {
        const rawVal = (app as any)[col.key] ?? app.submissionData?.[col.key] ?? app.customFieldsData?.[col.key];
        return <span className="text-slate-600">{rawVal !== undefined ? String(rawVal) : '—'}</span>;
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Admissions</span>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pre-Admissions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pre-Admissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manage student applications and follow their admission journey from initial submission to final admission.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>⚙</span>
            <span>Configure List</span>
          </button>

          <Link
            href="/admin-config/admission-process"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-colors"
          >
            ⚡ Configure Processes
          </Link>
          <button
            type="button"
            onClick={() => {
              setStaffModalStep('CONTEXT');
              setShowNewModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span>
            <span>New Pre-Admission</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {createSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>✓</span>
          <span>{createSuccessMsg}</span>
        </div>
      )}

      {/* 2. KPI Cards (4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Pre-Admissions
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary.totalPreAdmissions}
            </span>
            <span className="text-xs text-slate-400 font-semibold">All Time</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block">
            New / Submitted
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {summary.newSubmitted}
            </span>
            <span className="text-xs text-blue-400 font-semibold">Awaiting Action</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 block">
            In Process
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {summary.inProcess}
            </span>
            <span className="text-xs text-indigo-400 font-semibold">Active Journey</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
            Completed
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.completed}
            </span>
            <span className="text-xs text-emerald-500 font-semibold">Enrolled</span>
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by application no, student name, father name, mobile, or form..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="ALL">All Sources</option>
              <option value="ONLINE">🌐 Online</option>
              <option value="STAFF_ENTRY">👤 Staff Entry</option>
              <option value="WALK_IN">🚶 Walk-in</option>
              <option value="IMPORT">📥 Import</option>
            </select>

            <button
              type="button"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {showMoreFilters ? '▲ Fewer Filters' : '▼ More Filters'}
            </button>
          </div>
        </div>

        {/* More Filters Extended Panel */}
        {showMoreFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Campus / Location
              </label>
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="ALL">All Campuses</option>
                <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">Clifton Campus</option>
                <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa">Main Campus (Gulshan)</option>
                <option value="cccccccc-cccc-cccc-cccc-cccccccccccc">DHA Phase 6 Campus</option>
                <option value="dddddddd-dddd-dddd-dddd-dddddddddddd">PECHS Senior Campus</option>
                <option value="ffffffff-ffff-ffff-ffff-ffffffffffff">Islamabad Capital Campus</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Applying Class
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="ALL">All Classes</option>
                <option value="cls-ey1">Playgroup (EY-1)</option>
                <option value="cls-kg">Kindergarten (KG)</option>
                <option value="cls-g1">Grade 1</option>
                <option value="cls-g3">Grade 3</option>
                <option value="cls-g5">Grade 5</option>
                <option value="cls-g7">Grade 7</option>
                <option value="cls-g9">Grade 9 (O-Levels)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Admission Process
              </label>
              <select
                value={processFilter}
                onChange={(e) => setProcessFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="ALL">All Processes</option>
                <option value="proc_general_k12">General Admission Process</option>
                <option value="proc_simple_adm">Simple Direct Admission</option>
                <option value="proc_alevel_detailed">A-Level Comprehensive Track</option>
                <option value="NO_PROCESS">No Process Assigned</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. Pre-Admissions Table (Desktop/Tablet) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-slate-400 tracking-wider text-[10px]">
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.id} className="py-3.5 px-4">
                    {col.label}
                  </th>
                ))}
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                      Loading pre-admissions...
                    </p>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-slate-400">
                    <span className="text-3xl block mb-2">📋</span>
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No pre-admissions found matching your criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {visibleColumns.map((col) => (
                      <td key={col.id} className="py-3.5 px-4">
                        {renderCellContent(app, col)}
                      </td>
                    ))}

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admissions/pre-admissions/${app.id}`}
                          className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 font-bold transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. CONFIGURE LIST MODAL / DRAWER ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Pre-Admissions Columns</h3>
                <p className="text-xs text-slate-400">Choose visible columns and rearrange their display order.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0 overflow-x-auto text-[11px]">
              {(['ALL', 'SYSTEM', 'CANONICAL', 'CUSTOM', 'DYNAMIC_STATUS'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setConfigCategoryTab(cat)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    configCategoryTab === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Fields' : cat === 'SYSTEM' ? 'System' : cat === 'CANONICAL' ? 'Canonical' : cat === 'CUSTOM' ? 'Custom Fields' : 'Operational Status'}
                </button>
              ))}
            </div>

            {/* Column List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {columns
                .filter((c) => configCategoryTab === 'ALL' || c.category === configCategoryTab)
                .map((col) => {
                  const globalIdx = columns.findIndex((x) => x.id === col.id);
                  return (
                    <div
                      key={col.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={col.isVisible}
                          onChange={() => handleToggleColumn(col.id)}
                          className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{col.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{col.category} · {col.key}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={globalIdx === 0}
                          onClick={() => handleMoveColumn(globalIdx, 'UP')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={globalIdx === columns.length - 1}
                          onClick={() => handleMoveColumn(globalIdx, 'DOWN')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setColumns(INITIAL_COLUMNS)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Reset to Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveColumns(columns)}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
                >
                  Save Column View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. NEW PRE-ADMISSION (STAFF FLOW MODAL) ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">New Pre-Admission (Staff Entry)</h3>
                <p className="text-xs text-slate-400">
                  {staffModalStep === 'CONTEXT' ? 'Step 1: Choose Campus & Target Class' : 'Step 2: Fill Dynamic Pre-Admission Form'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {staffModalStep === 'CONTEXT' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Campus / Branch *
                    </label>
                    <select
                      value={selectedCampusId}
                      onChange={(e) => setSelectedCampusId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">Clifton Campus (Beacon Horizon Public School)</option>
                      <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa">Main Campus Gulshan (Beacon Horizon Public School)</option>
                      <option value="cccccccc-cccc-cccc-cccc-cccccccccccc">DHA Phase 6 Campus (Beacon Horizon Public School)</option>
                      <option value="dddddddd-dddd-dddd-dddd-dddddddddddd">PECHS Senior Campus (City Grammar School)</option>
                      <option value="ffffffff-ffff-ffff-ffff-ffffffffffff">Islamabad Capital Campus (Horizon Heights)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Applying Class *
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      <option value="cls-ey1">Playgroup (EY-1)</option>
                      <option value="cls-kg">Kindergarten (KG)</option>
                      <option value="cls-g1">Grade 1</option>
                      <option value="cls-g3">Grade 3</option>
                      <option value="cls-g5">Grade 5</option>
                      <option value="cls-g7">Grade 7</option>
                      <option value="cls-g9">Grade 9 (O-Levels)</option>
                      <option value="cls-a1">A-Levels Year 1</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Pre-Admission Form
                    </label>
                    <select
                      value={selectedFormId}
                      onChange={(e) => setSelectedFormId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      <option value="f_prereg_2026">Online Pre-Registration 2026–2027 (Published v1)</option>
                      <option value="f_gulshan_override">Gulshan Early Childhood Pre-Reg (Published v1)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Resolved from Dynamic Form Builder based on authorized scope and purpose = PRE_ADMISSION.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FormRuntimeRenderer
                    schema={DEFAULT_PRE_ADM_SCHEMA}
                    formTitle="Online Pre-Registration 2026–2027"
                    formPurpose="PRE_ADMISSION"
                    onSubmit={handleStaffFormSubmit}
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              {staffModalStep === 'FORM' ? (
                <button
                  type="button"
                  onClick={() => setStaffModalStep('CONTEXT')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ← Back to Context
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                {staffModalStep === 'CONTEXT' && (
                  <button
                    type="button"
                    onClick={() => setStaffModalStep('FORM')}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
                  >
                    Continue to Form →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
