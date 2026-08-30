'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  PreAdmissionApplicationDto,
  PreAdmissionStatus,
  PreAdmissionSource,
  PreAdmissionVerificationStatus,
  DuplicateComparisonResultDto,
  FormSchemaPayload,
  ListColumnDefinitionDto,
  PreAdmissionsListViewConfigDto,
  ApplicationDocumentDto,
  ApplicationFeePaymentDto,
  ApplicationReviewSummaryDto,
  ApplicationFeeVoucherDto,
  BankStatementRowDto,
  BulkReconciliationResultDto,
  SystemCheckResponseDto,
  SystemCheckItemDto,
  BulkHumanVerifyResponseDto,
} from '@campus-os/types';
import { FormRuntimeRenderer } from '../../../../components/FormRuntimeRenderer';
import { SectionNavigation } from '../../../../components/SectionNavigation';
import { useContactPlaceholders } from '../../../../components/DisplayFormatters';
import { useWorkingContext, ALL_CAMPUSES_METADATA } from '../../../../lib/working-context';
import { StatCard } from '../../../../design-system';
import {
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
  Plus,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Search,
  Eye,
  FileText,
  Inbox,
} from 'lucide-react';

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

// Verification status badge helper
function getVerificationStatusBadge(status?: PreAdmissionVerificationStatus) {
  switch (status) {
    case 'STAFF_VERIFIED':
      return { label: 'Verified', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' };
    case 'AUTO_VERIFIED':
      return { label: 'Auto Verified', bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800', dot: 'bg-teal-500' };
    case 'NEEDS_REVIEW':
      return { label: 'Needs Review', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500' };
    case 'POSSIBLE_DUPLICATE':
      return { label: 'Duplicate Warning', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', dot: 'bg-purple-500' };
    case 'INVALID':
      return { label: 'Invalid Data', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', dot: 'bg-rose-500' };
    case 'REJECTED':
      return { label: 'Rejected', bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800', dot: 'bg-red-500' };
    case 'UNVERIFIED':
    default:
      return { label: 'Unverified', bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', dot: 'bg-slate-400' };
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

// Helper to classify an application into exactly one of the 3 verification views
function getApplicationVerificationView(
  app: PreAdmissionApplicationDto
): 'PENDING_VERIFICATION' | 'NEEDS_REVIEW' | 'VERIFIED' {
  // 1. Human Verified ONLY
  if (app.verificationStatus === 'STAFF_VERIFIED' || (app as any).isHumanVerified === true) {
    return 'VERIFIED';
  }

  // 2. Needs Review (has unresolved issue)
  const isFlaggedStatus =
    app.verificationStatus === 'NEEDS_REVIEW' ||
    app.verificationStatus === 'POSSIBLE_DUPLICATE' ||
    app.verificationStatus === 'INVALID' ||
    app.verificationStatus === 'REJECTED';

  const issues = app.verificationIssues || (app as any).issues || [];
  const hasIssuesList = Boolean(issues.length > 0);
  const isDuplicateFlag = (app as any).isDuplicate === true;
  const hasFeeMismatch = app.feeStatus === 'MISMATCH' || (app as any).hasFeeMismatch === true;
  const isSystemNeedsReview = (app as any).systemResult === 'NEEDS_REVIEW';

  if (isFlaggedStatus || hasIssuesList || isDuplicateFlag || hasFeeMismatch || isSystemNeedsReview) {
    return 'NEEDS_REVIEW';
  }

  // 3. Pending Verification (Human verification not completed yet and no unresolved review issue)
  return 'PENDING_VERIFICATION';
}

// Canonical Default columns configuration with Codes & Canonical Keys
const INITIAL_COLUMNS: ListColumnDefinitionDto[] = [
  { id: 'col_app_no', key: 'applicationNumber', label: 'Application No.', code: 'SYS_APP_NUM', category: 'SYSTEM', isVisible: true, isPinned: true, sortOrder: 1, width: '130px', dataType: 'string', isActive: true },
  { id: 'col_student', key: 'studentName', label: 'Student', code: 'STD_NAME', canonicalKey: 'STUDENT_NAME', category: 'CANONICAL', isVisible: true, isPinned: true, sortOrder: 2, width: '160px', dataType: 'string', isActive: true },
  { id: 'col_ver_status', key: 'verificationStatus', label: 'Verification', code: 'SYS_VER_STATUS', category: 'SYSTEM', isVisible: true, sortOrder: 3, dataType: 'badge', isActive: true },
  { id: 'col_form', key: 'formName', label: 'Form', code: 'SYS_FORM_NAME', category: 'SYSTEM', isVisible: true, sortOrder: 4, dataType: 'string', isActive: true },
  { id: 'col_class', key: 'className', label: 'Applying For', code: 'SYS_CLASS_NAME', category: 'SYSTEM', isVisible: true, sortOrder: 5, dataType: 'string', isActive: true },
  { id: 'col_campus', key: 'campusName', label: 'School / Campus', code: 'SYS_CAMPUS_NAME', category: 'SYSTEM', isVisible: true, sortOrder: 6, dataType: 'string', isActive: true },
  { id: 'col_source', key: 'source', label: 'Source', code: 'SYS_SOURCE', category: 'SYSTEM', isVisible: true, sortOrder: 7, dataType: 'badge', isActive: true },
  { id: 'col_curr_step', key: 'currentStepName', label: 'Current Step', code: 'SYS_CURR_STEP', category: 'SYSTEM', isVisible: true, sortOrder: 8, dataType: 'badge', isActive: true },
  { id: 'col_status', key: 'status', label: 'Status', code: 'SYS_STATUS', category: 'SYSTEM', isVisible: true, sortOrder: 9, dataType: 'badge', isActive: true },
  { id: 'col_submitted', key: 'submittedAt', label: 'Submitted On', code: 'SYS_SUBMITTED_AT', category: 'SYSTEM', isVisible: true, sortOrder: 10, dataType: 'date', isActive: true },
  // Canonical fields
  { id: 'col_father', key: 'fatherOrGuardianName', label: 'Father Name', code: 'FAT_NAME', canonicalKey: 'FATHER_NAME', category: 'CANONICAL', isVisible: true, sortOrder: 11, dataType: 'string', isActive: true },
  { id: 'col_mobile', key: 'primaryMobile', label: 'Mobile Number', code: 'FAT_MOBILE', canonicalKey: 'FATHER_MOBILE', category: 'CANONICAL', isVisible: true, sortOrder: 12, dataType: 'string', isActive: true },
  { id: 'col_cnic', key: 'fatherCnic', label: 'Father CNIC', code: 'FAT_CNIC', canonicalKey: 'FATHER_CNIC', category: 'CANONICAL', isVisible: false, sortOrder: 13, dataType: 'string', isActive: true },
  { id: 'col_dob', key: 'dateOfBirth', label: 'Date of Birth', code: 'STD_DOB', canonicalKey: 'STUDENT_DOB', category: 'CANONICAL', isVisible: false, sortOrder: 14, dataType: 'date', isActive: true },
  { id: 'col_gender', key: 'gender', label: 'Gender', code: 'STD_GENDER', canonicalKey: 'GENDER', category: 'CANONICAL', isVisible: false, sortOrder: 15, dataType: 'string', isActive: true },
  { id: 'col_email', key: 'primaryEmail', label: 'Email', code: 'EMAIL', canonicalKey: 'EMAIL', category: 'CANONICAL', isVisible: false, sortOrder: 16, dataType: 'string', isActive: true },
  { id: 'col_prev_school', key: 'previousSchool', label: 'Previous School', code: 'PREV_SCH', canonicalKey: 'PREVIOUS_SCHOOL', category: 'CANONICAL', isVisible: false, sortOrder: 17, dataType: 'string', isActive: true },
  // Custom Fields (From Field Library)
  { id: 'col_custom_sibling', key: 'siblingDiscountEligible', label: 'Sibling Discount Eligible', code: 'CUST_SIBLING_DISC', category: 'CUSTOM', isVisible: false, sortOrder: 18, dataType: 'boolean', isActive: true },
  { id: 'col_custom_transport', key: 'transportRequired', label: 'Transport Required', code: 'CUST_TRANSPORT_REQ', category: 'CUSTOM', isVisible: false, sortOrder: 19, dataType: 'boolean', isActive: true },
  { id: 'col_custom_emergency', key: 'emergencyContactPhone', label: 'Emergency Contact Phone', code: 'CUST_EMERGENCY_PHONE', category: 'CUSTOM', isVisible: false, sortOrder: 20, dataType: 'string', isActive: true },
  // Dynamic Operational Status columns
  { id: 'col_test_status', key: 'testStatus', label: 'Test Status', code: 'OP_TEST_STATUS', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 21, dataType: 'badge', isActive: true },
  { id: 'col_test_date', key: 'testDate', label: 'Test Date', code: 'OP_TEST_DATE', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 22, dataType: 'date', isActive: true },
  { id: 'col_test_result', key: 'testResult', label: 'Test Result', code: 'OP_TEST_RESULT', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 23, dataType: 'string', isActive: true },
  { id: 'col_interview_status', key: 'interviewStatus', label: 'Interview Status', code: 'OP_INT_STATUS', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 24, dataType: 'badge', isActive: true },
  { id: 'col_interview_date', key: 'interviewDate', label: 'Interview Date', code: 'OP_INT_DATE', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 25, dataType: 'date', isActive: true },
  { id: 'col_decision', key: 'decisionOutcome', label: 'Decision', code: 'OP_DECISION', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 26, dataType: 'badge', isActive: true },
  { id: 'col_fee_status', key: 'feeStatus', label: 'Payment Status', code: 'OP_FEE_STATUS', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 27, dataType: 'badge', isActive: true },
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
        { instanceId: 'fld_fat_cnic', fieldDefinitionId: 'FAT_CNIC', canonicalKey: 'FATHER_CNIC', customLabel: 'Father / Guardian CNIC', isRequired: false, width: 'HALF', sortOrder: 3 },
        { instanceId: 'fld_email', fieldDefinitionId: 'EMAIL', canonicalKey: 'EMAIL', customLabel: 'Primary Email Address', isRequired: false, width: 'HALF', sortOrder: 4 },
        { instanceId: 'fld_prev_sch', fieldDefinitionId: 'PREV_SCH', canonicalKey: 'PREVIOUS_SCHOOL', customLabel: 'Previous School Attended', isRequired: false, width: 'HALF', sortOrder: 5 },
      ],
    },
  ],
};

export default function PreAdmissionsListPage() {
  const { currentContext, isCampusInEffectiveScope, getAuthorizedCampusesForWrite } = useWorkingContext();
  const [editingApp, setEditingApp] = useState<PreAdmissionApplicationDto | null>(null);
  const activeAdmissionSchoolId =
    (editingApp as any)?.schoolId ||
    (currentContext?.type === 'SCHOOL'
      ? currentContext.id
      : currentContext?.type === 'CAMPUS'
      ? ALL_CAMPUSES_METADATA.find((c) => c.id === currentContext.id)?.schoolId
      : null);
  const contactPlaceholders = useContactPlaceholders({ schoolId: activeAdmissionSchoolId });
  const [applications, setApplications] = useState<PreAdmissionApplicationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [processFilter, setProcessFilter] = useState<string>('ALL');
  const [selectedVerificationView, setSelectedVerificationView] = useState<
    'PENDING_VERIFICATION' | 'NEEDS_REVIEW' | 'VERIFIED'
  >('PENDING_VERIFICATION');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Pagination & Rows Per Page State
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Row Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Client-Side Portal Mount State
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic List Columns State
  const [columns, setColumns] = useState<ListColumnDefinitionDto[]>(INITIAL_COLUMNS);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configCategoryTab, setConfigCategoryTab] = useState<'ALL' | 'SYSTEM' | 'CANONICAL' | 'CUSTOM' | 'DYNAMIC_STATUS'>('ALL');
  const [columnSearch, setColumnSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'SELECTED_ONLY'>('ALL');
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);

  // ── Verification Center Drawer State (Three Primary Tabs: Application Fee | System Check | Human Verification) ──
  const [showVerificationCenter, setShowVerificationCenter] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [systemCheckData, setSystemCheckData] = useState<SystemCheckResponseDto | null>(null);
  const [verificationCenterTab, setVerificationCenterTab] = useState<'APPLICATION_FEE' | 'SYSTEM_CHECK' | 'HUMAN_VERIFICATION'>('APPLICATION_FEE');

  // Tab 1: Application Fee State
  const [feeFilter, setFeeFilter] = useState<'ALL' | 'READY' | 'NEEDS_REVIEW' | 'VERIFIED' | 'UNPAID' | 'NOT_REQUIRED'>('ALL');
  const [feeSearch, setFeeSearch] = useState('');
  const [feeSelectedIds, setFeeSelectedIds] = useState<Set<string>>(new Set());
  const [showFeeConfirmModal, setShowFeeConfirmModal] = useState(false);
  const [pendingFeeConfirmIds, setPendingFeeConfirmIds] = useState<string[]>([]);
  const [isBulkFeeVerifying, setIsBulkFeeVerifying] = useState(false);

  // Tab 2: System Check State
  const [systemCheckFilter, setSystemCheckFilter] = useState<
    'ALL' | 'DATA_CLEAR' | 'DATA_REVIEW' | 'DOCS_CLEAR' | 'DOCS_REVIEW' | 'FEE_CLEAR' | 'FEE_REVIEW' | 'READY' | 'NEEDS_REVIEW'
  >('ALL');
  const [systemCheckSearch, setSystemCheckSearch] = useState('');

  // Tab 3: Human Verification State
  const [humanVerifySelectedIds, setHumanVerifySelectedIds] = useState<Set<string>>(new Set());
  const [humanVerifySearch, setHumanVerifySearch] = useState('');
  const [showHumanConfirmModal, setShowHumanConfirmModal] = useState(false);
  const [pendingConfirmAppIds, setPendingConfirmAppIds] = useState<string[]>([]);
  const [isBulkHumanVerifying, setIsBulkHumanVerifying] = useState(false);

  // Single Application Verification Resolution Panel State
  const [selectedAppForResolution, setSelectedAppForResolution] = useState<PreAdmissionApplicationDto | null>(null);
  const [reviewSource, setReviewSource] = useState<'VERIFICATION_CENTER' | 'MAIN_TABLE' | null>(null);
  const [isMarkingVerified, setIsMarkingVerified] = useState(false);
  const [isSettingInactive, setIsSettingInactive] = useState(false);
  const [isRemovingApp, setIsRemovingApp] = useState(false);
  const [inactiveReason, setInactiveReason] = useState('Duplicate / Parent No Longer Interested');
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [removeReason, setRemoveReason] = useState('Duplicate entry / Cancelled by applicant');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<PreAdmissionStatus>('SUBMITTED');
  const [statusChangeNotes, setStatusChangeNotes] = useState('');

  // Side-by-Side Duplicate Compare Modal State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareData, setCompareData] = useState<DuplicateComparisonResultDto | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Human Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideAppId, setOverrideAppId] = useState<string | null>(null);
  const [overrideAction, setOverrideAction] = useState<'VERIFY_ANYWAY' | 'KEEP_FOR_REVIEW' | 'REJECT'>('VERIFY_ANYWAY');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // ── Unified Application Review (Data + Documents + Fee) State ──
  const [activeReviewTab, setActiveReviewTab] = useState<'DATA' | 'DOCUMENTS' | 'FEE'>('DATA');
  const [reviewData, setReviewData] = useState<{
    application: PreAdmissionApplicationDto;
    policy: any;
    documents: ApplicationDocumentDto[];
    feePayment: ApplicationFeePaymentDto;
    reviewSummary: ApplicationReviewSummaryDto;
  } | null>(null);
  const [isLoadingReviewData, setIsLoadingReviewData] = useState(false);

  // Document Verification State
  const [selectedDocForAction, setSelectedDocForAction] = useState<ApplicationDocumentDto | null>(null);
  const [docActionType, setDocActionType] = useState<'VERIFY' | 'REJECT' | 'REQUEST_REUPLOAD' | 'OVERRIDE'>('VERIFY');
  const [docActionReason, setDocActionReason] = useState('');
  const [showDocActionModal, setShowDocActionModal] = useState(false);
  const [isDocActionLoading, setIsDocActionLoading] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState<ApplicationDocumentDto | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<ApplicationDocumentDto | null>(null);
  const [activeDocApplicant, setActiveDocApplicant] = useState<PreAdmissionApplicationDto | null>(null);
  const [documentDialogSource, setDocumentDialogSource] = useState<'PRE_ADMISSIONS' | 'VERIFICATION_CENTER' | 'APPLICATION_REVIEW' | null>(null);
  const [isUploadingNewVersion, setIsUploadingNewVersion] = useState(false);
  const [uploadNewVersionReason, setUploadNewVersionReason] = useState('');

  // Fee Verification State
  const [showFeeSubmitModal, setShowFeeSubmitModal] = useState(false);
  const [feeSubmitForm, setFeeSubmitForm] = useState({
    amount: 2500,
    paymentMethod: 'ONLINE_TRANSFER' as any,
    transactionReference: '',
    payerName: '',
    payerMobile: '',
    paymentDate: '2026-08-25',
    receiptFileUrl: 'https://cdn.campus-os.local/receipts/rec-2026-001.png',
  });
  const [isFeeSubmitting, setIsFeeSubmitting] = useState(false);
  const [showFeeVerifyModal, setShowFeeVerifyModal] = useState(false);
  const [feeVerifyAction, setFeeVerifyAction] = useState<'VERIFY' | 'MISMATCH' | 'WAIVE'>('VERIFY');
  const [feeVerifyReason, setFeeVerifyReason] = useState('');
  const [isFeeVerifying, setIsFeeVerifying] = useState(false);

  // Fee Voucher Modal State
  const [voucherData, setVoucherData] = useState<ApplicationFeeVoucherDto | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [isLoadingVoucher, setIsLoadingVoucher] = useState(false);

  // Bank Statement Reconciliation Modal State
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<BulkReconciliationResultDto | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Operational Data Edit Modal State
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    studentName: '',
    fatherOrGuardianName: '',
    primaryMobile: '',
    fatherCnic: '',
    primaryEmail: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    correctionReason: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // New Pre-Admission Staff Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedCampusId, setSelectedCampusId] = useState('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  const [selectedClassId, setSelectedClassId] = useState('cls-g3');
  const [selectedAcademicYearId] = useState('ay_2026_2027');
  const [selectedFormId, setSelectedFormId] = useState('f_prereg_2026');
  const [staffModalStep, setStaffModalStep] = useState<'CONTEXT' | 'FORM'>('CONTEXT');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronized Dual Scrollbar Refs
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  // Reset page-level campus filter if active working context narrows and excludes it
  useEffect(() => {
    if (campusFilter !== 'ALL' && !isCampusInEffectiveScope(campusFilter)) {
      setCampusFilter('ALL');
    }
  }, [currentContext, campusFilter, isCampusInEffectiveScope]);

  // Modal Scroll Lock Effect (Prevents background page scrolling when any modal is open)
  useEffect(() => {
    const isAnyModalOpen =
      showVerificationCenter ||
      !!selectedAppForResolution ||
      showFeeConfirmModal ||
      showHumanConfirmModal ||
      showCompareModal ||
      showConfigModal ||
      showNewModal ||
      !!previewingDoc ||
      !!uploadingDoc ||
      showDocActionModal ||
      showFeeSubmitModal ||
      showFeeVerifyModal ||
      showVoucherModal ||
      showReconcileModal ||
      showOverrideModal ||
      showEditDataModal ||
      statusChangeModal ||
      showInactiveModal ||
      showRemoveModal;

    const originalOverflow = document.body.style.overflow;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [
    showVerificationCenter,
    selectedAppForResolution,
    showHumanConfirmModal,
    showCompareModal,
    showConfigModal,
    showNewModal,
    previewingDoc,
    uploadingDoc,
    showDocActionModal,
    showFeeSubmitModal,
    showFeeVerifyModal,
    showVoucherModal,
    showReconcileModal,
    showOverrideModal,
    showEditDataModal,
    statusChangeModal,
    showInactiveModal,
    showRemoveModal,
  ]);

  // Diagnostic state logger for modal stack
  useEffect(() => {
    console.log('[MODAL-STACK-DIAGNOSTIC]', {
      showVerificationCenter,
      selectedAppForResolution: selectedAppForResolution ? selectedAppForResolution.applicationNumber : null,
      reviewSource,
      previewingDoc: previewingDoc ? previewingDoc.documentName : null,
      uploadingDoc: uploadingDoc ? uploadingDoc.documentName : null,
      documentDialogSource,
    });
  }, [showVerificationCenter, selectedAppForResolution, reviewSource, previewingDoc, uploadingDoc, documentDialogSource]);

  // Hierarchical Escape Key Handler (Closes only the topmost active layer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Level 3 (Nested Sub-Modals)
        if (previewingDoc) {
          handleCloseDocumentPreview();
          return;
        }
        if (uploadingDoc) {
          handleCloseUploadDocument();
          return;
        }
        if (showDocActionModal) {
          setShowDocActionModal(false);
          return;
        }
        if (showFeeSubmitModal) {
          setShowFeeSubmitModal(false);
          return;
        }
        if (showFeeVerifyModal) {
          setShowFeeVerifyModal(false);
          return;
        }
        if (showVoucherModal) {
          setShowVoucherModal(false);
          return;
        }
        if (showReconcileModal) {
          setShowReconcileModal(false);
          return;
        }
        if (showOverrideModal) {
          setShowOverrideModal(false);
          return;
        }
        if (showEditDataModal) {
          setShowEditDataModal(false);
          return;
        }
        if (statusChangeModal) {
          setStatusChangeModal(false);
          return;
        }
        if (showInactiveModal) {
          setShowInactiveModal(false);
          return;
        }
        if (showRemoveModal) {
          setShowRemoveModal(false);
          return;
        }

        // Level 2 (Primary Dialogs)
        if (showFeeConfirmModal) {
          setShowFeeConfirmModal(false);
          return;
        }
        if (showHumanConfirmModal) {
          setShowHumanConfirmModal(false);
          return;
        }
        if (selectedAppForResolution) {
          handleCloseReview();
          return;
        }
        if (showCompareModal) {
          setShowCompareModal(false);
          return;
        }
        if (showConfigModal) {
          setShowConfigModal(false);
          return;
        }
        if (showNewModal) {
          setShowNewModal(false);
          return;
        }

        // Level 1 (Verification Center Drawer)
        if (showVerificationCenter) {
          setShowVerificationCenter(false);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    previewingDoc,
    showDocActionModal,
    showFeeSubmitModal,
    showFeeVerifyModal,
    showVoucherModal,
    showReconcileModal,
    showOverrideModal,
    showEditDataModal,
    statusChangeModal,
    showInactiveModal,
    showRemoveModal,
    showFeeConfirmModal,
    showHumanConfirmModal,
    selectedAppForResolution,
    showCompareModal,
    showConfigModal,
    showNewModal,
    showVerificationCenter,
  ]);

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
          if (data && data.columns && data.columns.length > 0 && data.columns.some((c) => c.isVisible)) {
            setColumns(data.columns);
          }
          if (data && data.rowsPerPage) {
            setPageSize(data.rowsPerPage);
          }
        }
      } catch (err) {
        console.error('Failed to load list view config:', err);
      }
    };
    fetchConfig();
  }, []);

  // Fetch pre-admissions with active Working Context
  const fetchApplications = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.append('contextNodeId', currentContext.id);
      params.append('contextNodeType', currentContext.type);
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      if (campusFilter !== 'ALL') params.append('campusId', campusFilter);
      if (classFilter !== 'ALL') params.append('classId', classFilter);
      if (processFilter !== 'ALL') params.append('processDefinitionId', processFilter);

      const res = await fetch(`http://localhost:4000/admissions/pre-admissions?${params.toString()}`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Server returned status ${res.status}`);
      }
      const data = await res.json();
      setApplications(data.items || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchApplications();
  }, [currentContext.id, search, statusFilter, sourceFilter, campusFilter, classFilter, processFilter]);

  // Live counts for the 3 working verification views
  const verificationCounts = useMemo(() => {
    const scoped = applications.filter((app) => isCampusInEffectiveScope(app.campusId));
    let pending = 0;
    let review = 0;
    let verified = 0;

    for (const app of scoped) {
      const v = getApplicationVerificationView(app);
      if (v === 'PENDING_VERIFICATION') pending++;
      else if (v === 'NEEDS_REVIEW') review++;
      else if (v === 'VERIFIED') verified++;
    }

    return {
      pendingVerification: pending,
      needsReview: review,
      verified,
      total: scoped.length,
    };
  }, [applications, isCampusInEffectiveScope]);

  // Filtered applications considering effective working context scope, verification view, and local verification filter
  const filteredApplications = useMemo(() => {
    let result = applications.filter((app) => isCampusInEffectiveScope(app.campusId));
    // 1. Filter by the active verification view tab
    result = result.filter((app) => getApplicationVerificationView(app) === selectedVerificationView);

    // 2. Filter by dropdown verification filter if specified
    if (verificationFilter !== 'ALL') {
      result = result.filter((a) => a.verificationStatus === verificationFilter);
    }
    return result;
  }, [applications, selectedVerificationView, verificationFilter, isCampusInEffectiveScope]);

  // ── Verification Center Filtered Items ──
  const filteredSystemCheckItems = useMemo(() => {
    if (!systemCheckData?.items) return [];
    let list = systemCheckData.items;

    // Filter by breakdown / summary selection
    if (systemCheckFilter === 'READY') {
      list = list.filter((i) => i.systemResult === 'READY');
    } else if (systemCheckFilter === 'NEEDS_REVIEW') {
      list = list.filter((i) => i.systemResult === 'NEEDS_REVIEW');
    } else if (systemCheckFilter === 'DATA_CLEAR') {
      list = list.filter((i) => i.dataCheckStatus === 'CLEAR');
    } else if (systemCheckFilter === 'DATA_REVIEW') {
      list = list.filter((i) => i.dataCheckStatus === 'NEEDS_REVIEW');
    } else if (systemCheckFilter === 'DOCS_CLEAR') {
      list = list.filter((i) => i.docsCheckStatus === 'CLEAR');
    } else if (systemCheckFilter === 'DOCS_REVIEW') {
      list = list.filter((i) => i.docsCheckStatus === 'NEEDS_REVIEW');
    } else if (systemCheckFilter === 'FEE_CLEAR') {
      list = list.filter((i) => i.feeCheckStatus === 'CLEAR');
    } else if (systemCheckFilter === 'FEE_REVIEW') {
      list = list.filter((i) => i.feeCheckStatus === 'NEEDS_REVIEW');
    }

    // Search filter
    if (systemCheckSearch.trim()) {
      const q = systemCheckSearch.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.applicationNumber.toLowerCase().includes(q) ||
          i.fatherOrGuardianName.toLowerCase().includes(q) ||
          i.className.toLowerCase().includes(q) ||
          i.campusName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [systemCheckData, systemCheckFilter, systemCheckSearch]);

  const filteredFeeItems = useMemo(() => {
    if (!systemCheckData?.items) return [];
    let list = systemCheckData.items;

    if (feeSearch.trim()) {
      const q = feeSearch.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.applicationNumber.toLowerCase().includes(q) ||
          i.fatherOrGuardianName.toLowerCase().includes(q) ||
          i.className.toLowerCase().includes(q) ||
          i.campusName.toLowerCase().includes(q) ||
          (i.transactionReference && i.transactionReference.toLowerCase().includes(q))
      );
    }

    if (feeFilter === 'READY') {
      list = list.filter((i) => i.isEligibleForBulkFeeVerify);
    } else if (feeFilter === 'NEEDS_REVIEW') {
      list = list.filter(
        (i) =>
          i.systemFeeResult === 'NEEDS_REVIEW' ||
          i.humanFeeStatus === 'MISMATCH' ||
          (i.systemFeeIssues && i.systemFeeIssues.length > 0)
      );
    } else if (feeFilter === 'VERIFIED') {
      list = list.filter((i) => i.humanFeeStatus === 'PAID_VERIFIED');
    } else if (feeFilter === 'UNPAID') {
      list = list.filter((i) => i.humanFeeStatus === 'UNPAID' || i.systemFeeResult === 'UNPAID');
    } else if (feeFilter === 'NOT_REQUIRED') {
      list = list.filter((i) => i.humanFeeStatus === 'NOT_REQUIRED' || i.feeCheckStatus === 'NOT_REQUIRED');
    }

    return list;
  }, [systemCheckData, feeSearch, feeFilter]);

  const feeReadyCount = useMemo(() => {
    if (!systemCheckData?.items) return 0;
    return systemCheckData.items.filter((i) => i.isEligibleForBulkFeeVerify).length;
  }, [systemCheckData]);

  const filteredHumanVerifyItems = useMemo(() => {
    if (!systemCheckData?.items) return [];
    let list = systemCheckData.items;

    if (humanVerifySearch.trim()) {
      const q = humanVerifySearch.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.applicationNumber.toLowerCase().includes(q) ||
          i.fatherOrGuardianName.toLowerCase().includes(q) ||
          i.className.toLowerCase().includes(q) ||
          i.campusName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [systemCheckData, humanVerifySearch]);

  // Compute live KPI summary strictly from working context scoped records
  const liveSummary = useMemo(() => {
    const scoped = applications.filter((app) => isCampusInEffectiveScope(app.campusId));
    return {
      totalPreAdmissions: scoped.length,
      newSubmitted: scoped.filter((a) => a.status === 'SUBMITTED').length,
      inProcess: scoped.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'ON_HOLD').length,
      completed: scoped.filter((a) => a.status === 'COMPLETED' || a.status === 'APPROVED').length,
    };
  }, [applications, isCampusInEffectiveScope]);

  const availableFilterCampuses = useMemo(() => {
    return ALL_CAMPUSES_METADATA.filter((c) => isCampusInEffectiveScope(c.id));
  }, [isCampusInEffectiveScope]);

  // Paginated records
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredApplications.length / pageSize) || 1;

  // Row Selection Handlers
  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllPage = () => {
    if (paginatedApplications.every((a) => selectedIds.has(a.id))) {
      const next = new Set(selectedIds);
      paginatedApplications.forEach((a) => next.delete(a.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedApplications.forEach((a) => next.add(a.id));
      setSelectedIds(next);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Re-scan or refresh verification drawer if open when working context changes
  useEffect(() => {
    if (showVerificationCenter) {
      handleOpenVerificationCenter();
    }
  }, [currentContext.id]);

  // ── Verification Center Actions ──
  const handleOpenVerificationCenter = async (selectedOnly = false) => {
    setVerificationLoading(true);
    setShowVerificationCenter(true);
    setSystemCheckFilter('ALL');
    setSystemCheckSearch('');
    setHumanVerifySearch('');
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/system-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationIds: selectedOnly && selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const data: SystemCheckResponseDto = await res.json();
        setSystemCheckData(data);
        setHumanVerifySelectedIds(new Set());
      }
    } catch (err) {
      console.error('Error running system check:', err);
    } finally {
      setVerificationLoading(false);
    }
  };

  const refreshVerificationData = async () => {
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/system-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const data: SystemCheckResponseDto = await res.json();
        setSystemCheckData(data);
      }
    } catch (err) {
      console.error('Error refreshing verification data in background:', err);
    }
  };

  const handleSelectAllReady = () => {
    if (!systemCheckData?.items) return;
    const readyIds = systemCheckData.items
      .filter((i) => i.systemResult === 'READY' && i.humanVerificationStatus !== 'VERIFIED')
      .map((i) => i.id);
    setHumanVerifySelectedIds(new Set(readyIds));
  };

  const handleToggleSelectHumanVerifyRow = (id: string) => {
    const next = new Set(humanVerifySelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHumanVerifySelectedIds(next);
  };

  const handleOpenConfirmModal = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setPendingConfirmAppIds(ids);
    setShowHumanConfirmModal(true);
  };

  const handleConfirmHumanVerify = async () => {
    if (pendingConfirmAppIds.length === 0) return;
    setIsBulkHumanVerifying(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/bulk-human-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationIds: pendingConfirmAppIds,
          verifiedBy: 'Admissions Officer (Admin)',
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const result: BulkHumanVerifyResponseDto = await res.json();
        setNotificationMsg({
          type: 'success',
          text: `Successfully verified ${result.verifiedCount} applications. Status is now Human Verified, advancing them in their configured Admission Journey.`,
        });
        setShowHumanConfirmModal(false);
        setPendingConfirmAppIds([]);
        setHumanVerifySelectedIds(new Set());
        // Refresh scan data and list in place without wiping active tabs or filters
        await refreshVerificationData();
        await fetchApplications();
      }
    } catch (err) {
      console.error('Error bulk verifying applications:', err);
    } finally {
      setIsBulkHumanVerifying(false);
    }
  };

  const fetchReviewData = async (appId: string) => {
    setIsLoadingReviewData(true);
    try {
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${appId}/review`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReviewData(data);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
    } finally {
      setIsLoadingReviewData(false);
    }
  };

  const handleOpenResolutionPanel = (
    app: PreAdmissionApplicationDto,
    source: 'VERIFICATION_CENTER' | 'MAIN_TABLE' = 'MAIN_TABLE'
  ) => {
    setSelectedAppForResolution(app);
    setReviewSource(source);
    setActiveReviewTab('DATA');
    fetchReviewData(app.id);
  };

  const handleCloseReview = () => {
    setSelectedAppForResolution(null);
    setReviewData(null);
    setReviewSource(null);
  };

  // Unified Document Dialog Handlers across all entry points
  const handleOpenDocumentPreview = (
    doc: ApplicationDocumentDto,
    applicant?: PreAdmissionApplicationDto | null,
    source: 'PRE_ADMISSIONS' | 'VERIFICATION_CENTER' | 'APPLICATION_REVIEW' = 'APPLICATION_REVIEW'
  ) => {
    setDocumentDialogSource(source);
    setActiveDocApplicant(applicant || selectedAppForResolution || null);
    setPreviewingDoc(doc);
  };

  const handleCloseDocumentPreview = () => {
    setPreviewingDoc(null);
    setDocumentDialogSource(null);
    setActiveDocApplicant(null);
  };

  const handleOpenUploadDocument = (
    doc: ApplicationDocumentDto,
    applicant?: PreAdmissionApplicationDto | null,
    source: 'PRE_ADMISSIONS' | 'VERIFICATION_CENTER' | 'APPLICATION_REVIEW' = 'APPLICATION_REVIEW'
  ) => {
    setDocumentDialogSource(source);
    setActiveDocApplicant(applicant || selectedAppForResolution || null);
    setUploadingDoc(doc);
  };

  const handleCloseUploadDocument = () => {
    setUploadingDoc(null);
    setUploadNewVersionReason('');
    setDocumentDialogSource(null);
    setActiveDocApplicant(null);
  };

  const handleDocumentAction = async (docId: string, action: string, reason?: string) => {
    setIsDocActionLoading(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/documents/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          documentId: docId,
          action,
          reason,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        setNotificationMsg({
          type: 'success',
          text: `Document action '${action}' recorded successfully.`,
        });
        setShowDocActionModal(false);
        setDocActionReason('');
        if (selectedAppForResolution) {
          await fetchReviewData(selectedAppForResolution.id);
        }
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error recording document action:', err);
    } finally {
      setIsDocActionLoading(false);
    }
  };

  const handleUploadDocumentVersion = async (appId: string, docCode: string) => {
    setIsUploadingNewVersion(true);
    try {
      const targetVersion = (uploadingDoc?.version || 1) + 1;
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${appId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          documentCode: docCode,
          fileName: `Applicant_${docCode.toUpperCase()}_v${targetVersion}.pdf`,
          fileUrl: `https://cdn.campus-os.local/uploads/${appId}/${docCode}_v${targetVersion}.pdf`,
          fileSize: 1024 * 512,
          mimeType: 'application/pdf',
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        setNotificationMsg({
          type: 'success',
          text: `New version (v${targetVersion}) for document '${docCode}' uploaded successfully. System advisory re-scan completed.`,
        });
        handleCloseUploadDocument();
        if (selectedAppForResolution?.id === appId) {
          await fetchReviewData(appId);
        }
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error uploading document version:', err);
    } finally {
      setIsUploadingNewVersion(false);
    }
  };

  // Handle Single Fee Verification
  const handleVerifySingleFee = async (appId: string) => {
    try {
      setIsBulkFeeVerifying(true);
      await fetch('http://localhost:4000/admissions/verification/bulk-fee-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
        },
        body: JSON.stringify({
          applicationIds: [appId],
          verifiedBy: 'Admissions Staff',
        }),
      });
      setNotificationMsg({
        type: 'success',
        text: 'Application fee verified successfully.',
      });
      await handleOpenVerificationCenter();
      await fetchApplications();
    } catch (err) {
      console.error('Failed to verify fee:', err);
    } finally {
      setIsBulkFeeVerifying(false);
    }
  };

  // Handle Bulk Fee Verification
  const handleConfirmBulkFeeVerify = async () => {
    if (pendingFeeConfirmIds.length === 0) return;
    try {
      setIsBulkFeeVerifying(true);
      const res = await fetch('http://localhost:4000/admissions/verification/bulk-fee-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
        },
        body: JSON.stringify({
          applicationIds: pendingFeeConfirmIds,
          verifiedBy: 'Admissions Staff',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationMsg({
          type: 'success',
          text: `Successfully verified Application Fee for ${data.verifiedCount || pendingFeeConfirmIds.length} applicants.`,
        });
      }
      setShowFeeConfirmModal(false);
      setFeeSelectedIds(new Set());
      setPendingFeeConfirmIds([]);
      await handleOpenVerificationCenter();
      await fetchApplications();
    } catch (err) {
      console.error('Failed to bulk verify fees:', err);
    } finally {
      setIsBulkFeeVerifying(false);
    }
  };

  // Handle View Slip
  const handleViewPaymentSlip = (item: SystemCheckItemDto) => {
    const applicant = applications.find((a) => a.id === item.id) || ({
      id: item.id,
      applicationNumber: item.applicationNumber,
      studentName: item.studentName,
      fatherOrGuardianName: item.fatherOrGuardianName,
      campusId: item.campusId,
      campusName: item.campusName,
      classId: item.classId,
      className: item.className,
      academicYearId: item.academicYearId,
      status: 'SUBMITTED',
      verificationStatus: 'UNVERIFIED',
      submittedAt: new Date().toISOString(),
      primaryMobile: '0300-1234567',
    } as any);

    const feeDoc: ApplicationDocumentDto = {
      id: item.receiptDocId || `fee-doc-${item.id}`,
      organizationId: '11111111-1111-1111-1111-111111111111',
      schoolId: '11111111-1111-1111-1111-111111111111',
      campusId: item.campusId,
      applicationId: item.id,
      documentCode: item.receiptDocCode || 'DOC_FEE_RECEIPT',
      documentName: 'Application Fee Payment Slip',
      fileKey: `receipts/${item.applicationNumber}.pdf`,
      fileName: item.receiptFileUrl || `fee_receipt_${item.applicationNumber}.pdf`,
      fileUrl: item.receiptFileUrl || `https://campus-storage.local/fees/receipt_${item.applicationNumber}.pdf`,
      fileSize: 245000,
      mimeType: 'application/pdf',
      isRequired: true,
      version: 1,
      staffVerificationStatus: item.humanFeeStatus === 'PAID_VERIFIED' ? 'STAFF_VERIFIED' : 'UNVERIFIED',
      systemVerificationStatus: item.systemFeeIssues?.includes('Slip Unreadable') ? 'UNREADABLE' : 'MATCHED',
      systemCheckRemarks: item.systemFeeIssues?.length
        ? item.systemFeeIssues.join('; ')
        : `Verified payment slip for ${item.studentName}. Amount: Rs. ${(item.parentPaidAmount || item.requiredFeeAmount || 2000).toLocaleString()}. Txn: ${item.transactionReference || 'N/A'}.`,
      uploadedAt: item.paymentDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    handleOpenDocumentPreview(feeDoc, applicant, 'VERIFICATION_CENTER');
  };

  const handleSubmitFeeEvidence = async (appId: string) => {
    setIsFeeSubmitting(true);
    try {
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${appId}/fee/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          ...feeSubmitForm,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        setNotificationMsg({
          type: 'success',
          text: 'Payment evidence submitted successfully. Awaiting staff verification.',
        });
        setShowFeeSubmitModal(false);
        await fetchReviewData(appId);
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error submitting fee evidence:', err);
    } finally {
      setIsFeeSubmitting(false);
    }
  };

  const handleVerifyFee = async (paymentId: string, action: string, reason?: string) => {
    setIsFeeVerifying(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/fee-payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          paymentId,
          action,
          reason,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        setNotificationMsg({
          type: 'success',
          text: `Fee payment action '${action}' recorded successfully.`,
        });
        setShowFeeVerifyModal(false);
        setFeeVerifyReason('');
        if (selectedAppForResolution) {
          await fetchReviewData(selectedAppForResolution.id);
        }
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error verifying fee:', err);
    } finally {
      setIsFeeVerifying(false);
    }
  };

  const handleOpenVoucher = async (appId: string) => {
    setIsLoadingVoucher(true);
    setShowVoucherModal(true);
    try {
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${appId}/fee/voucher`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVoucherData(data);
      }
    } catch (err) {
      console.error('Error generating voucher:', err);
    } finally {
      setIsLoadingVoucher(false);
    }
  };

  const handleOpenStatementReconcile = async () => {
    setShowReconcileModal(true);
    setIsReconciling(true);
    try {
      // Sample statement with matching reference
      const sampleRows: BankStatementRowDto[] = [
        {
          transactionId: 'TXN-001',
          date: '2026-08-25',
          description: 'ONLINE DEPOSIT ADM FEE APP-2026-0014',
          reference: 'TXN-998811',
          amount: 2500,
          sender: 'Parent Transfer',
        },
        {
          transactionId: 'TXN-002',
          date: '2026-08-25',
          description: 'IBFT PAYMENT VCH-APP-2026-0012-7891',
          reference: 'TXN-774422',
          amount: 2500,
          sender: 'IBFT Banking',
        },
        {
          transactionId: 'TXN-003',
          date: '2026-08-25',
          description: 'MISC UNIDENTIFIED TRANSFER',
          reference: 'TXN-000000',
          amount: 1500,
          sender: 'Unknown',
        },
      ];

      const res = await fetch('http://localhost:4000/admissions/fee/reconcile-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          statementRows: sampleRows,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReconcileResult(data);
      }
    } catch (err) {
      console.error('Error reconciling bank statement:', err);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleConfirmReconciliations = async (matchedPaymentIds: string[]) => {
    try {
      const res = await fetch('http://localhost:4000/admissions/fee/confirm-reconciliations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          matchedPaymentIds,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationMsg({
          type: 'success',
          text: `Confirmed ${data.confirmedCount} matched fee payments. Applications updated and advanced!`,
        });
        setShowReconcileModal(false);
        if (selectedAppForResolution) {
          await fetchReviewData(selectedAppForResolution.id);
        }
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error confirming reconciliations:', err);
    }
  };

  const handleMarkSingleVerified = async (appId: string, notes?: string) => {
    setIsMarkingVerified(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/mark-verified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationId: appId,
          notes,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotificationMsg({
          type: 'success',
          text: `Application ${updated.applicationNumber} marked as Verified. Exited verification queue.`,
        });
        handleCloseReview();
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error marking verified:', err);
    } finally {
      setIsMarkingVerified(false);
    }
  };

  const [isBulkMarkingVerified, setIsBulkMarkingVerified] = useState(false);

  const handleBulkMarkVerified = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setIsBulkMarkingVerified(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/bulk-mark-verified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationIds: ids,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationMsg({
          type: 'success',
          text: `Marked ${data.verifiedCount} applications as Verified. They have exited the Verification Queue and eligible candidates are now ready for Test Scheduling.`,
        });
        setSelectedIds(new Set());
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error bulk marking verified:', err);
    } finally {
      setIsBulkMarkingVerified(false);
    }
  };

  const handleSetSingleInactive = async (appId: string, reason?: string) => {
    setIsSettingInactive(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/set-inactive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationId: appId,
          reason,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotificationMsg({
          type: 'success',
          text: `Application ${updated.applicationNumber} set to INACTIVE.`,
        });
        setShowInactiveModal(false);
        handleCloseReview();
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error setting inactive:', err);
    } finally {
      setIsSettingInactive(false);
    }
  };

  const handleRemoveApplication = async (appId: string, reason: string) => {
    setIsRemovingApp(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationId: appId,
          reason,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        setNotificationMsg({
          type: 'success',
          text: `Pre-Admission application removed/archived successfully.`,
        });
        setShowRemoveModal(false);
        handleCloseReview();
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error removing application:', err);
    } finally {
      setIsRemovingApp(false);
    }
  };

  const handleChangeStatus = async (appId: string, status: PreAdmissionStatus, notes?: string) => {
    try {
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          status,
          reviewNotes: notes,
        }),
      });
      if (res.ok) {
        setNotificationMsg({
          type: 'success',
          text: `Application status changed to ${status}.`,
        });
        setStatusChangeModal(false);
        if (selectedAppForResolution) {
          setSelectedAppForResolution((prev) => (prev ? { ...prev, status } : null));
        }
        await fetchApplications();
        if (showVerificationCenter) await refreshVerificationData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleOpenCompare = async (appId: string, duplicateAppId: string) => {
    setCompareLoading(true);
    setShowCompareModal(true);
    try {
      const res = await fetch(`http://localhost:4000/admissions/verification/compare/${appId}/${duplicateAppId}`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
      });
      if (res.ok) {
        const data: DuplicateComparisonResultDto = await res.json();
        setCompareData(data);
      }
    } catch (err) {
      console.error('Error loading duplicate comparison:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleOpenOverride = (appId: string, action: 'VERIFY_ANYWAY' | 'KEEP_FOR_REVIEW' | 'REJECT') => {
    setOverrideAppId(appId);
    setOverrideAction(action);
    setOverrideReason('');
    setShowOverrideModal(true);
  };

  const handleSubmitOverride = async () => {
    if (!overrideAppId || !overrideReason.trim()) return;
    setOverrideLoading(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationId: overrideAppId,
          overrideReason: overrideReason.trim(),
          action: overrideAction,
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        setShowOverrideModal(false);
        setNotificationMsg({
          type: 'success',
          text: `Verification status updated successfully with human override audit.`,
        });
        if (showCompareModal) setShowCompareModal(false);
        handleCloseReview();
        await refreshVerificationData();
        await fetchApplications();
      }
    } catch (err) {
      console.error('Error overriding verification:', err);
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleOpenEditData = (app: PreAdmissionApplicationDto) => {
    setEditingApp(app);
    setEditFormData({
      studentName: app.studentName || '',
      fatherOrGuardianName: app.fatherOrGuardianName || '',
      primaryMobile: app.primaryMobile || '',
      fatherCnic: app.fatherCnic || (app.submissionData?.fatherCnic as string) || '',
      primaryEmail: app.primaryEmail || '',
      dateOfBirth: app.dateOfBirth || '',
      gender: (app.gender || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
      correctionReason: '',
    });
    setShowEditDataModal(true);
  };

  const handleSubmitEditData = async () => {
    if (!editingApp) return;
    setEditLoading(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/verification/edit-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
        body: JSON.stringify({
          applicationId: editingApp.id,
          studentName: editFormData.studentName,
          fatherOrGuardianName: editFormData.fatherOrGuardianName,
          primaryMobile: editFormData.primaryMobile,
          fatherCnic: editFormData.fatherCnic,
          primaryEmail: editFormData.primaryEmail,
          dateOfBirth: editFormData.dateOfBirth,
          gender: editFormData.gender,
          correctionReason: editFormData.correctionReason || 'Data corrected during verification review',
          contextNodeId: currentContext.id,
          contextNodeType: currentContext.type,
        }),
      });
      if (res.ok) {
        setShowEditDataModal(false);
        setNotificationMsg({
          type: 'success',
          text: `Application data corrected without overwriting original immutable snapshot.`,
        });
        if (selectedAppForResolution?.id === editingApp.id) {
          handleCloseReview();
        }
        await refreshVerificationData();
        await fetchApplications();
      }
    } catch (err) {
      console.error('Error correcting operational data:', err);
    } finally {
      setEditLoading(false);
    }
  };

  // Staff Submit Pre-Admission Form
  const handleStaffFormSubmit = async (values: Record<string, any>) => {
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
          academicYearId: selectedAcademicYearId,
          classId: selectedClassId,
          formDefinitionId: selectedFormId,
          source: 'STAFF_ENTRY',
          formData: values,
        }),
      });

      if (!res.ok) throw new Error('Submission failed');
      const created = await res.json();
      setShowNewModal(false);
      setNotificationMsg({
        type: 'success',
        text: `Pre-Admission ${created.applicationNumber} created successfully for ${created.studentName}.`,
      });
      fetchApplications();
    } catch (err) {
      console.error('Error creating pre-admission:', err);
    }
  };

  // ── Column Configuration Modal Logic ──
  const handleSaveColumns = async (updated: ListColumnDefinitionDto[], rowsPerPg = pageSize) => {
    setColumns(updated);
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
          columns: updated,
          viewType: 'PERSONAL',
          rowsPerPage: rowsPerPg,
        }),
      });
    } catch (err) {
      console.error('Failed to persist column preferences:', err);
    }
  };

  const handleToggleColumn = (id: string) => {
    const updated = columns.map((col) => (col.id === id ? { ...col, isVisible: !col.isVisible } : col));
    setColumns(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = columns.map((col) => (col.id === id ? { ...col, isPinned: !col.isPinned } : col));
    setColumns(updated);
  };

  const handleMoveColumn = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= columns.length) return;
    const next = [...columns];
    const item = next.splice(index, 1)[0]!;
    next.splice(newIdx, 0, item);
    const reordered = next.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    setColumns(reordered);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === dropIndex) return;
    const next = [...columns];
    const item = next.splice(draggedColIndex, 1)[0]!;
    next.splice(dropIndex, 0, item);
    const reordered = next.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    setColumns(reordered);
    setDraggedColIndex(null);
  };

  // Counts for column configuration
  const counts = useMemo(() => {
    const all = columns.length;
    const selected = columns.filter((c) => c.isVisible).length;
    const system = columns.filter((c) => c.category === 'SYSTEM').length;
    const canonical = columns.filter((c) => c.category === 'CANONICAL').length;
    const custom = columns.filter((c) => c.category === 'CUSTOM').length;
    const operational = columns.filter((c) => c.category === 'DYNAMIC_STATUS').length;
    return { all, selected, system, canonical, custom, operational };
  }, [columns]);

  // Filter candidate columns in config modal
  const candidateColumns = useMemo(() => {
    return columns.filter((col) => {
      if (configCategoryTab !== 'ALL' && col.category !== configCategoryTab) return false;
      if (viewFilter === 'SELECTED_ONLY' && !col.isVisible) return false;
      if (columnSearch.trim()) {
        const q = columnSearch.toLowerCase();
        const matchesLabel = col.label.toLowerCase().includes(q);
        const matchesCode = col.code?.toLowerCase().includes(q) || false;
        const matchesCanonical = col.canonicalKey?.toLowerCase().includes(q) || false;
        return matchesLabel || matchesCode || matchesCanonical;
      }
      return true;
    });
  }, [columns, configCategoryTab, viewFilter, columnSearch]);

  const handleSelectAllMatching = () => {
    const matchingIds = new Set(candidateColumns.map((c) => c.id));
    const updated = columns.map((col) => (matchingIds.has(col.id) ? { ...col, isVisible: true } : col));
    setColumns(updated);
  };

  const handleClearAllMatching = () => {
    const matchingIds = new Set(candidateColumns.map((c) => c.id));
    const updated = columns.map((col) => (matchingIds.has(col.id) ? { ...col, isVisible: false } : col));
    setColumns(updated);
  };

  const visibleColumns = useMemo(() => {
    const vis = columns.filter((col) => col.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
    return vis.length > 0 ? vis : INITIAL_COLUMNS.filter((c) => c.isVisible);
  }, [columns]);

  // Render cell content based on column definition
  const renderCellContent = (app: PreAdmissionApplicationDto, col: ListColumnDefinitionDto) => {
    switch (col.key) {
      case 'applicationNumber':
        return (
          <Link
            href={`/admissions/pre-admissions/${app.id}`}
            className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {app.applicationNumber}
          </Link>
        );
      case 'studentName': {
        const issues = app.verificationIssues || (app as any).issues || [];
        const isDuplicate =
          app.verificationStatus === 'POSSIBLE_DUPLICATE' ||
          (app as any).isDuplicate === true ||
          issues.some((i: any) => i.code === 'POSSIBLE_DUPLICATE');
        const isInvalid =
          app.verificationStatus === 'INVALID' ||
          issues.some((i: any) => i.code === 'INVALID_MOBILE' || i.code === 'INVALID_DATA');
        const hasReviewIssue =
          app.verificationStatus === 'NEEDS_REVIEW' ||
          (issues.length > 0 && !isDuplicate && !isInvalid);

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white truncate">{app.studentName}</span>
              {isDuplicate && (
                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[9px] font-bold border border-purple-200 dark:border-purple-800">
                  Duplicate
                </span>
              )}
              {isInvalid && (
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[9px] font-bold border border-rose-200 dark:border-rose-800">
                  Invalid Data
                </span>
              )}
              {hasReviewIssue && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] font-bold border border-amber-200 dark:border-amber-800">
                  Review
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 truncate">{app.fatherOrGuardianName}</span>
          </div>
        );
      }
      case 'verificationStatus': {
        const vBadge = getVerificationStatusBadge(app.verificationStatus);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenResolutionPanel(app, 'MAIN_TABLE');
            }}
            title="Click to open Verification Resolution panel / actions"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer shadow-2xs hover:shadow-xs ${vBadge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${vBadge.dot}`} />
            <span>{vBadge.label}</span>
          </button>
        );
      }
      case 'source': {
        const badge = getSourceBadge(app.source);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
        );
      }
      case 'status': {
        const badge = getStatusBadge(app.status);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenResolutionPanel(app, 'MAIN_TABLE');
            }}
            title="Click to view details or change status"
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer ${badge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            <span>{badge.label}</span>
          </button>
        );
      }
      case 'currentStepName': {
        const step =
          app.verificationStatus === 'UNVERIFIED'
            ? 'Verification'
            : app.currentStepName || 'Verification';
        return (
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
            {step}
          </span>
        );
      }
      case 'submittedAt':
        return <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">{new Date(app.submittedAt).toLocaleDateString('en-GB')}</span>;
      case 'dateOfBirth':
        return <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">{app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString('en-GB') : '—'}</span>;
      case 'testDate':
        return <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">{app.testDate ? new Date(app.testDate).toLocaleDateString('en-GB') : '—'}</span>;
      case 'interviewDate':
        return <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">{app.interviewDate ? new Date(app.interviewDate).toLocaleDateString('en-GB') : '—'}</span>;
      case 'feeStatus':
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${app.feeStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
            {app.feeStatus || 'UNPAID'}
          </span>
        );
      default: {
        const rawVal = (app as any)[col.key] ?? app.submissionData?.[col.key] ?? app.customFieldsData?.[col.key];
        return <span className="text-slate-700 dark:text-slate-300">{rawVal !== undefined && rawVal !== '' ? String(rawVal) : '—'}</span>;
      }
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto px-3 sm:px-6 text-slate-900 dark:text-slate-100">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-0.5">
            <span>Admissions</span>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pre-Admissions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Pre-Admissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage incoming applications, verify submitted data, and follow candidate journeys to test scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Master Verify Applications Action */}
          <button
            type="button"
            onClick={() => handleOpenVerificationCenter(false)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Applications</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Columns ({counts.selected})</span>
          </button>

          <Link
            href="/admin-config/admission-process"
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Workflow className="w-3.5 h-3.5 text-slate-500" />
            <span>Admission Process</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setStaffModalStep('CONTEXT');
              setShowNewModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Pre-Admission</span>
          </button>
        </div>
      </div>

      {/* Operational Workflow Context Nav */}
      <SectionNavigation section="preadmission_ops" className="pb-1" />

      {/* Notification Alert */}
      {notificationMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${notificationMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'}`}>
          <div className="flex items-center gap-2">
            <span>{notificationMsg.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{notificationMsg.text}</span>
          </div>
          <button type="button" onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* 2. Compact KPI Cards (4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatCard
          title="Total Pre-Admissions"
          value={liveSummary.totalPreAdmissions}
          icon={<FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          subtitle="Active Catalog"
          variant="default"
        />
        <StatCard
          title="New / Submitted"
          value={liveSummary.newSubmitted}
          icon={<Inbox className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          subtitle="Awaiting Verification"
          variant="info"
        />
        <StatCard
          title="In Process"
          value={liveSummary.inProcess}
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          subtitle="Active Journey"
          variant="warning"
        />
        <StatCard
          title="Completed"
          value={liveSummary.completed}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle="Enrolled / Approved"
          variant="success"
        />
      </div>

      {/* 3. Filters Toolbar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by app no, student, guardian, mobile, CNIC..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
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
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="ALL">All Verification</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="STAFF_VERIFIED">Verified (Staff)</option>
              <option value="AUTO_VERIFIED">Auto Verified</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="POSSIBLE_DUPLICATE">Duplicate Warning</option>
              <option value="INVALID">Invalid Data</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
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
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {showMoreFilters ? '▲ Fewer' : '▼ More'}
            </button>
          </div>
        </div>

        {/* More Filters Extended Panel */}
        {showMoreFilters && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Campus / Location
              </label>
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="ALL">All Authorized Campuses ({availableFilterCampuses.length})</option>
                {availableFilterCampuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Applying Class
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="ALL">All Classes</option>
                <option value="cls-ey1">Playgroup (EY-1)</option>
                <option value="cls-kg">Kindergarten (KG)</option>
                <option value="cls-g1">Grade 1</option>
                <option value="cls-g3">Grade 3</option>
                <option value="cls-g5">Grade 5</option>
                <option value="cls-g6">Grade 6</option>
                <option value="cls-g7">Grade 7</option>
                <option value="cls-g9">Grade 9 (O-Levels)</option>
                <option value="cls-a1">A-Levels Year 1</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Admission Process
              </label>
              <select
                value={processFilter}
                onChange={(e) => setProcessFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
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

      {/* Floating Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-2xl bg-indigo-900 text-white flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-700 text-[11px] font-mono">
              {selectedIds.size} Selected
            </span>
            <span className="hidden sm:inline text-indigo-100">Applications ready for verification action</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkMarkingVerified}
              onClick={() => handleBulkMarkVerified(Array.from(selectedIds))}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isBulkMarkingVerified ? 'Verifying...' : `Mark Verified (${selectedIds.size})`}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenVerificationCenter(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-800 text-indigo-100 hover:bg-indigo-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-700"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Verification Center</span>
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 text-xs text-indigo-300 hover:text-white font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 3 Working Verification Views */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1. Pending Verification */}
          <button
            type="button"
            onClick={() => {
              setSelectedVerificationView('PENDING_VERIFICATION');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedVerificationView === 'PENDING_VERIFICATION'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Verification</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                selectedVerificationView === 'PENDING_VERIFICATION'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                  : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {verificationCounts.pendingVerification}
            </span>
          </button>

          {/* 2. Needs Review */}
          <button
            type="button"
            onClick={() => {
              setSelectedVerificationView('NEEDS_REVIEW');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedVerificationView === 'NEEDS_REVIEW'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Review</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                selectedVerificationView === 'NEEDS_REVIEW'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                  : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {verificationCounts.needsReview}
            </span>
          </button>

          {/* 3. Verified (Human Verified ONLY) */}
          <button
            type="button"
            onClick={() => {
              setSelectedVerificationView('VERIFIED');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedVerificationView === 'VERIFIED'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                selectedVerificationView === 'VERIFIED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                  : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {verificationCounts.verified}
            </span>
          </button>
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-3 hidden sm:block">
          {selectedVerificationView === 'PENDING_VERIFICATION' && (
            <span className="text-indigo-600 dark:text-indigo-400">● Clean applications awaiting human verification</span>
          )}
          {selectedVerificationView === 'NEEDS_REVIEW' && (
            <span className="text-amber-600 dark:text-amber-400">● Flagged applications with review issues</span>
          )}
          {selectedVerificationView === 'VERIFIED' && (
            <span className="text-emerald-600 dark:text-emerald-400">● Human staff approved applications only</span>
          )}
        </div>
      </div>

      {/* Top Pagination Toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2 font-medium">
          <span>Showing <b>{paginatedApplications.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</b> to <b>{Math.min(currentPage * pageSize, filteredApplications.length)}</b> of <b>{filteredApplications.length}</b> applications</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                setCurrentPage(1);
                handleSaveColumns(columns, newSize);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 font-bold"
            >
              ‹
            </button>
            <span className="px-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 font-bold"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* 4A. Mobile Card View (< sm screens) */}
      <div className="sm:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse">
            Loading pre-admissions...
          </div>
        ) : fetchError ? (
          <div className="p-6 text-center text-xs bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
            <p className="font-bold text-xs mb-1">Unable to Load</p>
            <p className="text-[11px] mb-2">{fetchError}</p>
            <button
              type="button"
              onClick={() => fetchApplications()}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No pre-admissions found matching your criteria.
          </div>
        ) : (
          paginatedApplications.map((app) => {
            const statusBadge = getStatusBadge(app.status);
            const vBadge = getVerificationStatusBadge(app.verificationStatus);
            const sourceBadge = getSourceBadge(app.source);
            return (
              <div
                key={app.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(app.id)}
                      onChange={() => handleToggleSelectRow(app.id)}
                      className="rounded text-indigo-600 h-3.5 w-3.5"
                    />
                    <span className="font-mono font-bold text-xs text-indigo-600">{app.applicationNumber}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${vBadge.bg}`}>
                    {vBadge.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{app.studentName}</h3>
                  <p className="text-[11px] text-slate-500">{app.className} · {app.campusName}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${sourceBadge.bg}`}>
                      {sourceBadge.label}
                    </span>
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditData(app)}
                      className="px-2 py-0.8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px]"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/admissions/pre-admissions/${app.id}`}
                      className="px-2.5 py-0.8 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded text-[11px]"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4B. Desktop / Tablet Pre-Admissions Table with Synchronized Scrollbar, Sticky Header & Pinned Columns */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Synchronized Horizontal Scrollbar */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto h-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800"
        >
          <div style={{ width: '1800px', height: '1px' }} />
        </div>

        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto max-h-[620px] overflow-y-auto"
        >
          <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
            <thead className="bg-slate-50 dark:bg-slate-800/95 sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-slate-400 tracking-wider text-[10px]">
              <tr>
                {/* Checkbox Column */}
                <th className="py-2.5 px-3 sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedApplications.length > 0 && paginatedApplications.every((a) => selectedIds.has(a.id))}
                    onChange={handleSelectAllPage}
                    className="rounded text-indigo-600 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>

                {visibleColumns.map((col, cIdx) => (
                  <th
                    key={col.id}
                    className={`py-2.5 px-3 whitespace-nowrap ${
                      col.isPinned
                        ? cIdx === 0
                          ? 'sticky left-10 z-20 bg-slate-50 dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                          : 'sticky left-[140px] z-20 bg-slate-50 dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {col.isPinned && <span className="text-[9px] text-indigo-500">📌</span>}
                      <span>{col.label}</span>
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-4 text-right whitespace-nowrap sticky right-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                      Loading pre-admissions...
                    </p>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="py-12 text-center">
                    <div className="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 space-y-2">
                      <span className="text-2xl block">⚠️</span>
                      <p className="font-bold text-xs">Unable to Load Pre-Admissions</p>
                      <p className="text-[11px] opacity-90">
                        {fetchError.includes('Access Denied') || fetchError.includes('Forbidden')
                          ? 'This location or resource is outside your authorized scope.'
                          : 'Unable to connect to the admissions server. Please verify your connection or retry.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => fetchApplications()}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Retry Fetch
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="py-16 text-center text-slate-400">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl mb-2">
                        📋
                      </div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                        No Pre-Admissions Found
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                        There are currently no pre-admission applications for this working context ({currentContext.name}).
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Row Checkbox */}
                    <td className="py-2.5 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => handleToggleSelectRow(app.id)}
                        className="rounded text-indigo-600 h-3.5 w-3.5 cursor-pointer"
                      />
                    </td>

                    {visibleColumns.map((col, cIdx) => (
                      <td
                        key={col.id}
                        className={`py-2.5 px-3 whitespace-nowrap ${
                          col.isPinned
                            ? cIdx === 0
                              ? 'sticky left-10 z-10 bg-white dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                              : 'sticky left-[140px] z-10 bg-white dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                            : ''
                        }`}
                      >
                        {renderCellContent(app, col)}
                      </td>
                    ))}

                    {/* Sticky Actions */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap sticky right-0 z-10 bg-white dark:bg-slate-900 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditData(app)}
                          className="px-2 py-0.8 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/admissions/pre-admissions/${app.id}`}
                          className="px-2.5 py-0.8 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] transition-colors"
                        >
                          View →
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

      {/* Bottom Pagination Toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
        <div>
          <span>Showing <b>{paginatedApplications.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</b> to <b>{Math.min(currentPage * pageSize, filteredApplications.length)}</b> of <b>{filteredApplications.length}</b> records</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 font-bold text-[11px]"
          >
            « First
          </button>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 font-bold text-[11px]"
          >
            ‹ Prev
          </button>
          <span className="px-2 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 font-bold text-[11px]"
          >
            Next ›
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 font-bold text-[11px]"
          >
            Last »
          </button>
        </div>
      </div>

      {/* ── GLOBAL OVERLAYS (PORTALLED TO DOCUMENT.BODY FOR FULL VIEWPORT COVERAGE) ── */}
      {mounted &&
        createPortal(
          <>
            {/* ── 5. VERIFICATION CENTER DRAWER / MODAL (LEVEL 1: z-40) ── */}
            {showVerificationCenter && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-xs flex justify-end overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVerificationCenter(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-4xl h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Verification Center
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
                        Scope: {currentContext.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automated System Check across Data, Documents & Fee + Human Staff Verification.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVerificationCenter(false)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* ── COMPACT TOP SUMMARY METRICS (ONE HORIZONTAL ROW) ── */}
              {systemCheckData?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                  {/* 1. Applications Checked */}
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCenterTab('SYSTEM_CHECK');
                      setSystemCheckFilter('ALL');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      systemCheckFilter === 'ALL' && verificationCenterTab === 'SYSTEM_CHECK'
                        ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs shrink-0">📊</span>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Applications Checked</span>
                        <span className="text-[10px] text-slate-400">All records</span>
                      </div>
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white pl-2">
                      {systemCheckData.summary.totalApplications}
                    </span>
                  </button>

                  {/* 2. Ready for Human Verification */}
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCenterTab('SYSTEM_CHECK');
                      setSystemCheckFilter('READY');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      systemCheckFilter === 'READY' && verificationCenterTab === 'SYSTEM_CHECK'
                        ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs shrink-0">✨</span>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Ready for Human</span>
                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">System clear</span>
                      </div>
                    </div>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 pl-2">
                      {systemCheckData.summary.readyCount}
                    </span>
                  </button>

                  {/* 3. Needs Review */}
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCenterTab('SYSTEM_CHECK');
                      setSystemCheckFilter('NEEDS_REVIEW');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      systemCheckFilter === 'NEEDS_REVIEW' && verificationCenterTab === 'SYSTEM_CHECK'
                        ? 'border-amber-500 bg-white dark:bg-slate-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs shrink-0">⚠️</span>
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Needs Review</span>
                        <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Flagged issues</span>
                      </div>
                    </div>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 pl-2">
                      {systemCheckData.summary.needsReviewCount}
                    </span>
                  </button>
                </div>
              )}

              {/* ── THREE MAIN PRIMARY NAVIGATION TABS (ORDER: Application Fee | System Check | Human Verification) ── */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60">
                {/* 1. Application Fee */}
                <button
                  type="button"
                  onClick={() => setVerificationCenterTab('APPLICATION_FEE')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    verificationCenterTab === 'APPLICATION_FEE'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Application Fee</span>
                  {systemCheckData?.summary && (
                    <span className="px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                      {systemCheckData.items.filter((i) => i.feeCheckStatus !== 'NOT_REQUIRED').length}
                    </span>
                  )}
                </button>

                {/* 2. System Check */}
                <button
                  type="button"
                  onClick={() => setVerificationCenterTab('SYSTEM_CHECK')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    verificationCenterTab === 'SYSTEM_CHECK'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>System Check</span>
                  {systemCheckData?.summary && (
                    <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      {systemCheckData.summary.totalApplications}
                    </span>
                  )}
                </button>

                {/* 3. Human Verification */}
                <button
                  type="button"
                  onClick={() => setVerificationCenterTab('HUMAN_VERIFICATION')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    verificationCenterTab === 'HUMAN_VERIFICATION'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Human Verification</span>
                  {systemCheckData?.summary && (
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      {systemCheckData.summary.readyCount} Ready
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {verificationLoading ? (
                <div className="py-24 text-center text-slate-400 space-y-2">
                  <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    Running automated system checks across Data, Documents & Fee...
                  </p>
                  <p className="text-[11px] text-slate-400">Verifying duplicates and scanning admission requirements</p>
                </div>
              ) : !systemCheckData ? (
                <div className="py-16 text-center text-slate-400">
                  <span className="text-3xl block mb-2">📋</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300">No verification data available.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenVerificationCenter()}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Run System Check
                  </button>
                </div>
              ) : verificationCenterTab === 'APPLICATION_FEE' ? (
                /* ══════════════════════════════════════════════════════════════════
                   TAB 1: APPLICATION FEE VERIFICATION
                   ══════════════════════════════════════════════════════════════════ */
                <div className="space-y-3.5">
                  {/* Advisory Notice */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">💳</span>
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold block">Application Fee Verification</span>
                      <span>
                        Review payment proofs, amounts, transaction references, and slips submitted by parents. Human fee verification confirms payment but does <b>not</b> mark the applicant overall verified.
                      </span>
                    </div>
                  </div>

                  {/* Filter Toolbar & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(
                        [
                          { id: 'ALL', label: 'All', count: systemCheckData.items.length },
                          { id: 'READY', label: 'Ready', count: feeReadyCount },
                          {
                            id: 'NEEDS_REVIEW',
                            label: 'Needs Review',
                            count: systemCheckData.items.filter(
                              (i) =>
                                i.systemFeeResult === 'NEEDS_REVIEW' ||
                                i.humanFeeStatus === 'MISMATCH' ||
                                (i.systemFeeIssues && i.systemFeeIssues.length > 0)
                            ).length,
                          },
                          {
                            id: 'VERIFIED',
                            label: 'Verified',
                            count: systemCheckData.items.filter((i) => i.humanFeeStatus === 'PAID_VERIFIED').length,
                          },
                          {
                            id: 'UNPAID',
                            label: 'Unpaid',
                            count: systemCheckData.items.filter(
                              (i) => i.humanFeeStatus === 'UNPAID' || i.systemFeeResult === 'UNPAID'
                            ).length,
                          },
                          {
                            id: 'NOT_REQUIRED',
                            label: 'N/A',
                            count: systemCheckData.items.filter(
                              (i) => i.humanFeeStatus === 'NOT_REQUIRED' || i.feeCheckStatus === 'NOT_REQUIRED'
                            ).length,
                          },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFeeFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            feeFilter === f.id
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>{f.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              feeFilter === f.id ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {f.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search applicant / app no / txn..."
                          value={feeSearch}
                          onChange={(e) => setFeeSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-48 sm:w-56 focus:outline-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions Header Bar */}
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const readyItems = filteredFeeItems.filter((i) => i.isEligibleForBulkFeeVerify);
                          const next = new Set(feeSelectedIds);
                          const allReadySelected = readyItems.length > 0 && readyItems.every((i) => next.has(i.id));
                          if (allReadySelected) {
                            readyItems.forEach((i) => next.delete(i.id));
                          } else {
                            readyItems.forEach((i) => next.add(i.id));
                          }
                          setFeeSelectedIds(next);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select All Ready ({feeReadyCount})</span>
                      </button>

                      {feeSelectedIds.size > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFeeConfirmIds(Array.from(feeSelectedIds));
                            setShowFeeConfirmModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify Selected Fees ({feeSelectedIds.size})</span>
                        </button>
                      )}
                    </div>

                    {feeReadyCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const readyIds = systemCheckData.items
                            .filter((i) => i.isEligibleForBulkFeeVerify)
                            .map((i) => i.id);
                          setPendingFeeConfirmIds(readyIds);
                          setShowFeeConfirmModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Verify All Ready Fees ({feeReadyCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Compact Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 w-8">
                              <input
                                type="checkbox"
                                checked={
                                  filteredFeeItems.length > 0 &&
                                  filteredFeeItems
                                    .filter((i) => i.isEligibleForBulkFeeVerify)
                                    .every((i) => feeSelectedIds.has(i.id))
                                }
                                onChange={() => {
                                  const readyItems = filteredFeeItems.filter((i) => i.isEligibleForBulkFeeVerify);
                                  const next = new Set(feeSelectedIds);
                                  const allSelected = readyItems.length > 0 && readyItems.every((i) => next.has(i.id));
                                  if (allSelected) {
                                    readyItems.forEach((i) => next.delete(i.id));
                                  } else {
                                    readyItems.forEach((i) => next.add(i.id));
                                  }
                                  setFeeSelectedIds(next);
                                }}
                                className="rounded text-blue-600 cursor-pointer"
                              />
                            </th>
                            <th className="py-2.5 px-3">Applicant</th>
                            <th className="py-2.5 px-3 font-mono">App No.</th>
                            <th className="py-2.5 px-3">Campus / Class</th>
                            <th className="py-2.5 px-3 text-right">Required Fee</th>
                            <th className="py-2.5 px-3 text-right">Parent Entered</th>
                            <th className="py-2.5 px-3">Payment Date</th>
                            <th className="py-2.5 px-3 font-mono">Transaction ID</th>
                            <th className="py-2.5 px-3 text-center">Payment Slip</th>
                            <th className="py-2.5 px-3">System Fee Check</th>
                            <th className="py-2.5 px-3">Human Fee Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredFeeItems.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="py-12 text-center text-slate-400">
                                No fee payment records found matching criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredFeeItems.map((item) => {
                              const isSelected = feeSelectedIds.has(item.id);
                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                                    isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="checkbox"
                                      disabled={!item.isEligibleForBulkFeeVerify}
                                      checked={isSelected}
                                      onChange={() => {
                                        const next = new Set(feeSelectedIds);
                                        if (next.has(item.id)) next.delete(item.id);
                                        else next.add(item.id);
                                        setFeeSelectedIds(next);
                                      }}
                                      className="rounded text-blue-600 disabled:opacity-30 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="font-bold text-slate-900 dark:text-white block">{item.studentName}</span>
                                    <span className="text-[10px] text-slate-400">{item.fatherOrGuardianName}</span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                    {item.applicationNumber}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 block">{item.campusName}</span>
                                    <span className="text-[10px] text-slate-400">{item.className}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {item.requiredFeeAmount ? `Rs. ${item.requiredFeeAmount.toLocaleString()}` : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    {item.parentPaidAmount ? `Rs. ${item.parentPaidAmount.toLocaleString()}` : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                                    {item.paymentDate || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[10px]">
                                    {item.transactionReference || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {item.receiptFileUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => handleViewPaymentSlip(item)}
                                        className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 font-bold text-[10px] border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>View Slip</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium italic">Missing</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {item.systemFeeResult === 'CLEAR' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        Clear ✓
                                      </span>
                                    ) : item.systemFeeResult === 'NEEDS_REVIEW' ? (
                                      <div className="space-y-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                                          Needs Review
                                        </span>
                                        {item.systemFeeIssues?.map((iss) => (
                                          <span key={iss} className="block text-[9px] text-amber-600 font-medium">
                                            {iss}
                                          </span>
                                        ))}
                                      </div>
                                    ) : item.systemFeeResult === 'NOT_REQUIRED' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        N/A
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                        Unpaid
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {item.humanFeeStatus === 'PAID_VERIFIED' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300">
                                        Verified ✓
                                      </span>
                                    ) : item.humanFeeStatus === 'WAIVED' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-300">
                                        Waived
                                      </span>
                                    ) : item.humanFeeStatus === 'MISMATCH' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300">
                                        Mismatch
                                      </span>
                                    ) : item.humanFeeStatus === 'NOT_REQUIRED' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        N/A
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300">
                                        Pending Check
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    {item.humanFeeStatus !== 'PAID_VERIFIED' &&
                                    item.humanFeeStatus !== 'WAIVED' &&
                                    item.humanFeeStatus !== 'NOT_REQUIRED' ? (
                                      <button
                                        type="button"
                                        disabled={isBulkFeeVerifying}
                                        onClick={() => handleVerifySingleFee(item.id)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs cursor-pointer transition-colors"
                                      >
                                        Verify Fee ✓
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const app = applications.find((a) => a.id === item.id);
                                          if (app) handleOpenResolutionPanel(app, 'VERIFICATION_CENTER');
                                        }}
                                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] cursor-pointer transition-colors"
                                      >
                                        Review
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : verificationCenterTab === 'SYSTEM_CHECK' ? (
                /* ══════════════════════════════════════════════════════════════════
                   TAB 1: SYSTEM CHECK (Advisory Only — Checks Data, Docs, Fee)
                   ══════════════════════════════════════════════════════════════════ */
                <div className="space-y-4">
                  {/* Advisory Notice */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">ℹ️</span>
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold block">System Check is automated & advisory only.</span>
                      <span>
                        It evaluates <b>Data</b>, <b>Documents</b>, and <b>Application Fee</b> rules.
                        System Clear indicates <b>Ready for Human Verification</b> and does NOT mark an applicant as Verified.
                      </span>
                    </div>
                  </div>

                  {/* ── 3-AREA BREAKDOWN WITH CLICKABLE COUNTS ── */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                      3-Area Automated Breakdown (Click any count to filter students)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Area 1: Data Check */}
                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                            <span>📝</span> Data Check
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Mobile · Duplicate · CNIC</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSystemCheckFilter('DATA_CLEAR')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              systemCheckFilter === 'DATA_CLEAR'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Click to view Data Clear applications"
                          >
                            <span>Clear</span>
                            <span className="font-mono text-[11px] font-black">{systemCheckData.summary.dataClearCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSystemCheckFilter('DATA_REVIEW')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              systemCheckFilter === 'DATA_REVIEW'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 hover:bg-amber-100'
                            }`}
                            title="Click to view Data Review issues"
                          >
                            <span>Needs Review</span>
                            <span className="font-mono text-[11px] font-black">{systemCheckData.summary.dataReviewCount}</span>
                          </button>
                        </div>
                      </div>

                      {/* Area 2: Documents Check */}
                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                            <span>📄</span> Documents Check
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">B-Form · Birth Cert · Reports</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSystemCheckFilter('DOCS_CLEAR')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              systemCheckFilter === 'DOCS_CLEAR'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Click to view Documents Clear applications"
                          >
                            <span>Clear</span>
                            <span className="font-mono text-[11px] font-black">{systemCheckData.summary.docsClearCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSystemCheckFilter('DOCS_REVIEW')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              systemCheckFilter === 'DOCS_REVIEW'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 hover:bg-amber-100'
                            }`}
                            title="Click to view Document Issues"
                          >
                            <span>Needs Review</span>
                            <span className="font-mono text-[11px] font-black">{systemCheckData.summary.docsReviewCount}</span>
                          </button>
                        </div>
                      </div>

                      {/* Area 3: Application Fee Check */}
                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                            <span>💳</span> Application Fee
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Paid · Waived · Policy</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSystemCheckFilter('FEE_CLEAR')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              systemCheckFilter === 'FEE_CLEAR'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Click to view Fee Clear applications"
                          >
                            <span>Clear / Paid</span>
                            <span className="font-mono text-[11px] font-black">{systemCheckData.summary.feeClearCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSystemCheckFilter('FEE_REVIEW')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              systemCheckFilter === 'FEE_REVIEW'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 hover:bg-amber-100'
                            }`}
                            title="Click to view Fee Issues"
                          >
                            <span>Needs Review</span>
                            <span className="font-mono text-[11px] font-black">{systemCheckData.summary.feeReviewCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Filter Banner & Search */}
                  <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      {systemCheckFilter !== 'ALL' && (
                        <div className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-2">
                          <span>
                            Filtered by:{' '}
                            <b>
                              {systemCheckFilter === 'READY' && 'Ready for Human Verification'}
                              {systemCheckFilter === 'NEEDS_REVIEW' && 'Needs Review'}
                              {systemCheckFilter === 'DATA_CLEAR' && 'Data (Clear)'}
                              {systemCheckFilter === 'DATA_REVIEW' && 'Data (Needs Review)'}
                              {systemCheckFilter === 'DOCS_CLEAR' && 'Documents (Clear)'}
                              {systemCheckFilter === 'DOCS_REVIEW' && 'Documents (Needs Review)'}
                              {systemCheckFilter === 'FEE_CLEAR' && 'Fee (Clear / Paid)'}
                              {systemCheckFilter === 'FEE_REVIEW' && 'Fee (Needs Review)'}
                            </b>{' '}
                            ({filteredSystemCheckItems.length} records)
                          </span>
                          <button
                            type="button"
                            onClick={() => setSystemCheckFilter('ALL')}
                            className="hover:text-rose-600 text-xs font-bold cursor-pointer"
                            title="Show all records"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      <input
                        type="text"
                        value={systemCheckSearch}
                        onChange={(e) => setSystemCheckSearch(e.target.value)}
                        placeholder="Search student or app no..."
                        className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* System Check Scanned Items List */}
                  <div className="space-y-2.5">
                    {filteredSystemCheckItems.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <span className="text-3xl block mb-2">🎉</span>
                        <p className="font-bold text-slate-700 dark:text-slate-300">No applications matching this filter.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSystemCheckFilter('ALL');
                            setSystemCheckSearch('');
                          }}
                          className="mt-2 text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                        >
                          Reset filters to show all
                        </button>
                      </div>
                    ) : (
                      filteredSystemCheckItems.map((item) => {
                        const originalApp = applications.find((a) => a.id === item.id);
                        const isReady = item.systemResult === 'READY';
                        const isHumanVerified = item.humanVerificationStatus === 'VERIFIED';

                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                              isHumanVerified
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/10'
                                : isReady
                                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20'
                                : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                    {item.applicationNumber}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {item.studentName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({item.className} · {item.campusName})
                                  </span>

                                  {/* System Result Badge */}
                                  {isReady ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                      <span>✨</span> Ready for Human Verification
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                      <span>⚠️</span> Needs Review
                                    </span>
                                  )}

                                  {/* Human Status Badge */}
                                  {isHumanVerified ? (
                                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold text-[9px]">
                                      ✓ Human Verified
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[9px]">
                                      Pending Verification
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                  <span>Guardian: <b>{item.fatherOrGuardianName}</b></span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {originalApp && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenResolutionPanel(originalApp, 'VERIFICATION_CENTER')}
                                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-2xs"
                                  >
                                    Review Details →
                                  </button>
                                )}

                                {!isHumanVerified && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConfirmModal([item.id])}
                                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                                  >
                                    <span>✓</span> Verify
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 3 Area Status Badges */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
                              {/* Data Status */}
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                                  item.dataCheckStatus === 'CLEAR'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                <span>Data:</span>
                                <b>{item.dataCheckStatus === 'CLEAR' ? 'Clear' : 'Needs Review'}</b>
                              </span>

                              {/* Documents Status */}
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                                  item.docsCheckStatus === 'CLEAR'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                <span>Docs:</span>
                                <b>{item.docsCheckStatus === 'CLEAR' ? `${item.docsVerifiedRatio} Clear` : 'Needs Review'}</b>
                              </span>

                              {/* Fee Status */}
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                                  item.feeCheckStatus === 'CLEAR'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                <span>Fee:</span>
                                <b>{item.feeStatusBadge || (item.feeCheckStatus === 'CLEAR' ? 'Clear' : 'Pending')}</b>
                              </span>

                              {/* Issue Badges */}
                              {item.issueBadges && item.issueBadges.map((badge, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* ══════════════════════════════════════════════════════════════════
                   TAB 2: HUMAN VERIFICATION (Bulk + Individual Staff Approval)
                   ══════════════════════════════════════════════════════════════════ */
                <div className="space-y-4">
                  {/* Top Action Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAllReady}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Select All Ready ({systemCheckData.summary.readyCount})</span>
                      </button>

                      <button
                        type="button"
                        disabled={humanVerifySelectedIds.size === 0 || isBulkHumanVerifying}
                        onClick={() => handleOpenConfirmModal(Array.from(humanVerifySelectedIds))}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify Selected ({humanVerifySelectedIds.size})</span>
                      </button>

                      {humanVerifySelectedIds.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setHumanVerifySelectedIds(new Set())}
                          className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    <div className="relative w-full sm:w-56">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      <input
                        type="text"
                        value={humanVerifySearch}
                        onChange={(e) => setHumanVerifySearch(e.target.value)}
                        placeholder="Search applicants..."
                        className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Human Verification Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/95 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-slate-400 tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  filteredHumanVerifyItems.length > 0 &&
                                  filteredHumanVerifyItems.every((i) => humanVerifySelectedIds.has(i.id))
                                }
                                onChange={() => {
                                  if (filteredHumanVerifyItems.every((i) => humanVerifySelectedIds.has(i.id))) {
                                    const next = new Set(humanVerifySelectedIds);
                                    filteredHumanVerifyItems.forEach((i) => next.delete(i.id));
                                    setHumanVerifySelectedIds(next);
                                  } else {
                                    const next = new Set(humanVerifySelectedIds);
                                    filteredHumanVerifyItems.forEach((i) => next.add(i.id));
                                    setHumanVerifySelectedIds(next);
                                  }
                                }}
                                className="rounded text-indigo-600 h-3.5 w-3.5 cursor-pointer"
                              />
                            </th>
                            <th className="py-2.5 px-3">Application No.</th>
                            <th className="py-2.5 px-3">Student</th>
                            <th className="py-2.5 px-3">Class & Campus</th>
                            <th className="py-2.5 px-3">Data</th>
                            <th className="py-2.5 px-3">Documents</th>
                            <th className="py-2.5 px-3">Application Fee</th>
                            <th className="py-2.5 px-3">Issues</th>
                            <th className="py-2.5 px-3">System Result</th>
                            <th className="py-2.5 px-3">Human Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                          {filteredHumanVerifyItems.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="py-12 text-center text-slate-400">
                                No applications found.
                              </td>
                            </tr>
                          ) : (
                            filteredHumanVerifyItems.map((item) => {
                              const originalApp = applications.find((a) => a.id === item.id);
                              const isSelected = humanVerifySelectedIds.has(item.id);
                              const isHumanVerified = item.humanVerificationStatus === 'VERIFIED';
                              const isReady = item.systemResult === 'READY';

                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                                    isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectHumanVerifyRow(item.id)}
                                      className="rounded text-indigo-600 h-3.5 w-3.5 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                    {item.applicationNumber}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900 dark:text-white">{item.studentName}</span>
                                      <span className="text-[10px] text-slate-400">{item.fatherOrGuardianName}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {item.className}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">{item.campusName}</span>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        item.dataCheckStatus === 'CLEAR'
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                      }`}
                                    >
                                      {item.dataCheckStatus === 'CLEAR' ? 'Clear' : 'Review'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        item.docsCheckStatus === 'CLEAR'
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                      }`}
                                    >
                                      {item.docsCheckStatus === 'CLEAR' ? `${item.docsVerifiedRatio} Clear` : 'Needs Review'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        item.feeCheckStatus === 'CLEAR'
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                      }`}
                                    >
                                      {item.feeStatusBadge || (item.feeCheckStatus === 'CLEAR' ? 'Clear' : 'Pending')}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-1 flex-wrap max-w-[140px]">
                                      {item.issueBadges && item.issueBadges.length > 0 ? (
                                        item.issueBadges.map((b, bIdx) => (
                                          <span
                                            key={bIdx}
                                            className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[9px] font-bold whitespace-nowrap"
                                          >
                                            {b}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-slate-400">—</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        isReady
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                      }`}
                                    >
                                      {isReady ? 'READY' : 'NEEDS REVIEW'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isHumanVerified
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      }`}
                                    >
                                      {isHumanVerified ? 'Verified' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {originalApp && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenResolutionPanel(originalApp, 'VERIFICATION_CENTER')}
                                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-[10px] cursor-pointer"
                                        >
                                          Review
                                        </button>
                                      )}
                                      {!isHumanVerified && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenConfirmModal([item.id])}
                                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer shadow-2xs"
                                        >
                                          Verify
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 max-w-lg">
                Human verified applications move to the next applicable step in their configured Admission Journey.
              </span>
              <button
                type="button"
                onClick={() => setShowVerificationCenter(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                Close Verification Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5A-FEE. BULK APPLICATION FEE VERIFICATION CONFIRMATION MODAL (LEVEL 2: z-50) ── */}
      {showFeeConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFeeConfirmModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                💳
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Verify Application Fee Payments
                </h3>
                <p className="text-xs text-slate-400">
                  Staff confirmation of fee payment receipt
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 space-y-2.5 text-xs text-blue-900 dark:text-blue-200">
              <p className="font-bold text-slate-900 dark:text-white">
                You are about to verify fee payment for{' '}
                <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                  {pendingFeeConfirmIds.length}
                </span>{' '}
                applicant{pendingFeeConfirmIds.length > 1 ? 's' : ''}.
              </p>

              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <span>✓</span>
                  <span>Required amount matched</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <span>✓</span>
                  <span>Parent payment details available</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <span>✓</span>
                  <span>Transaction / reference available</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <span>✓</span>
                  <span>Payment evidence slip available</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <span>✓</span>
                  <span>No unresolved fee issue</span>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60 text-[10px] space-y-0.5 text-slate-500 dark:text-slate-400">
                <div>
                  Verified By:{' '}
                  <b className="text-slate-800 dark:text-slate-200">Admissions Officer (Admin)</b>
                </div>
                <div>
                  Date & Time:{' '}
                  <b className="text-slate-800 dark:text-slate-200 font-mono">
                    {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </b>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Fee verification confirms payment and allows applicants to proceed smoothly in System Check and Human Verification.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFeeConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkFeeVerifying}
                onClick={handleConfirmBulkFeeVerify}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>
                  {isBulkFeeVerifying
                    ? 'Verifying...'
                    : `Confirm Fee Verification – ${pendingFeeConfirmIds.length}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5A. HUMAN VERIFICATION CONFIRMATION MODAL (LEVEL 2: z-50) ── */}
      {showHumanConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHumanConfirmModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                🛡️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Human Verification
                </h3>
                <p className="text-xs text-slate-400">
                  Staff confirmation of applicant verification status
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                You are about to verify <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{pendingConfirmAppIds.length}</span> application{pendingConfirmAppIds.length > 1 ? 's' : ''}.
              </p>

              <div className="space-y-1 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span><b>Data:</b> Checked & Staff Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span><b>Documents:</b> Checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span><b>Application Fee:</b> Checked / N/A</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] space-y-0.5 text-slate-400">
                <div>Verified By: <b className="text-slate-700 dark:text-slate-300">Admissions Officer (Admin)</b></div>
                <div>Date & Time: <b className="text-slate-700 dark:text-slate-300">{new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</b></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Human verified applications move to the next applicable step in their configured Admission Journey.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHumanConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkHumanVerifying}
                onClick={handleConfirmHumanVerify}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>{isBulkHumanVerifying ? 'Verifying...' : `Confirm Verification – ${pendingConfirmAppIds.length}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B. UNIFIED APPLICATION REVIEW MODAL (LEVEL 2: z-50) ── */}
      {selectedAppForResolution && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseReview();
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col justify-between ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Review Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">📋</span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Application Review
                  </h3>
                  <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {selectedAppForResolution.applicationNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
                    Scope: {selectedAppForResolution.campusName}
                  </span>
                  {reviewSource === 'VERIFICATION_CENTER' && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                      <span>🛡️</span> Verification Center
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                  <span>Student: <b>{selectedAppForResolution.studentName}</b></span>
                  <span>·</span>
                  <span>Applying: <b>{selectedAppForResolution.className}</b></span>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-[10px] text-slate-700 dark:text-slate-300">
                    Step: {selectedAppForResolution.currentStepName || 'Application Review'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseReview}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Review Progress & Test Eligibility Banner */}
            {reviewData?.reviewSummary && (
              <div className={`p-3 rounded-2xl border flex items-center justify-between flex-wrap gap-2 text-xs ${
                reviewData.reviewSummary.isTestEligible
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{reviewData.reviewSummary.isTestEligible ? '🎉' : '⏳'}</span>
                  <div>
                    <span className="font-bold block">
                      {reviewData.reviewSummary.isTestEligible
                        ? 'Ready for Test / Assessment Scheduling'
                        : 'Review Requirements Incomplete'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Data: {reviewData.reviewSummary.dataStatus} · Docs: {reviewData.reviewSummary.documentsVerifiedCount}/{reviewData.reviewSummary.documentsRequiredCount} · Fee: {reviewData.reviewSummary.feeStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 font-extrabold text-[10px] shadow-xs">
                    {reviewData.reviewSummary.progressFraction}
                  </span>
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {reviewData.reviewSummary.testCandidateIndicator.feeBadge}
                  </span>
                </div>
              </div>
            )}

            {/* Sub-Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setActiveReviewTab('DATA')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeReviewTab === 'DATA'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>👤</span>
                <span>1. Data Verification</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                  {selectedAppForResolution.verificationStatus === 'STAFF_VERIFIED' || selectedAppForResolution.verificationStatus === 'AUTO_VERIFIED' ? '✓' : 'Pending'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReviewTab('DOCUMENTS')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeReviewTab === 'DOCUMENTS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>📂</span>
                <span>2. Documents Verification</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                  {reviewData?.reviewSummary ? `${reviewData.reviewSummary.documentsVerifiedCount}/${reviewData.reviewSummary.documentsRequiredCount}` : '...'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReviewTab('FEE')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeReviewTab === 'FEE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>💳</span>
                <span>3. Application Fee</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                  {reviewData?.feePayment?.paymentStatus || 'Pending'}
                </span>
              </button>
            </div>

            {/* Sub-Tab Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs max-h-[50vh]">
              {/* TAB 1: DATA VERIFICATION */}
              {activeReviewTab === 'DATA' && (
                <div className="space-y-4">
                  {/* Automated Verification Checks */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                      Automated Data Verification Checks
                    </span>

                    {selectedAppForResolution.verificationIssues && selectedAppForResolution.verificationIssues.length > 0 ? (
                      <div className="space-y-2">
                        {selectedAppForResolution.verificationIssues.map((iss, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-start gap-2 ${
                              iss.severity === 'ERROR'
                                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                                : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200'
                            }`}
                          >
                            <span className="text-base shrink-0">{iss.severity === 'ERROR' ? '❌' : '⚠️'}</span>
                            <div className="space-y-1">
                              <p className="font-bold">{iss.message}</p>
                              {iss.field && (
                                <span className="text-[10px] opacity-80 block">
                                  Affected Field: <b>{iss.field}</b>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                        <span className="text-base">✓</span>
                        <span className="font-bold">System data verification clean. No automated issues detected.</span>
                      </div>
                    )}
                  </div>

                  {/* Submitted Profile Details */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                      Submitted Profile Details
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Guardian Name</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAppForResolution.fatherOrGuardianName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Guardian CNIC</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAppForResolution.fatherCnic || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Primary Mobile</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAppForResolution.primaryMobile || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Primary Email</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAppForResolution.primaryEmail || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAppForResolution.dateOfBirth ? new Date(selectedAppForResolution.dateOfBirth).toLocaleDateString('en-GB') : '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Gender</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAppForResolution.gender || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                      Data Verification Actions
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        disabled={isMarkingVerified || selectedAppForResolution.verificationStatus === 'STAFF_VERIFIED' || selectedAppForResolution.verificationStatus === 'AUTO_VERIFIED'}
                        onClick={() => handleMarkSingleVerified(selectedAppForResolution.id)}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <span>✓</span>
                        <span>{isMarkingVerified ? 'Verifying...' : 'Mark Verified'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditData(selectedAppForResolution)}
                        className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span>✏️</span>
                        <span>Edit Data</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenOverride(selectedAppForResolution.id, 'VERIFY_ANYWAY')}
                        className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span>⚡</span>
                        <span>Override Warning</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNewStatus(selectedAppForResolution.status);
                          setStatusChangeModal(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span>🔄</span>
                        <span>Change Status</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {selectedAppForResolution.verificationStatus === 'POSSIBLE_DUPLICATE' && (
                        <button
                          type="button"
                          onClick={() => handleOpenCompare(selectedAppForResolution.id, (selectedAppForResolution as any).duplicateId || selectedAppForResolution.id)}
                          className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold text-[11px] cursor-pointer"
                        >
                          Compare Duplicate
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenOverride(selectedAppForResolution.id, 'KEEP_FOR_REVIEW')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                      >
                        Mark Needs Review
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowInactiveModal(true)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                      >
                        Set Inactive...
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRemoveModal(true)}
                        className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-semibold text-[11px] cursor-pointer"
                      >
                        🗑️ Remove Application
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTS VERIFICATION */}
              {activeReviewTab === 'DOCUMENTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        Required & Supporting Documents
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Configured per school review policy with AI/System advisory checks.
                      </span>
                    </div>
                    {reviewData?.reviewSummary && (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200">
                        {reviewData.reviewSummary.documentsVerifiedCount} of {reviewData.reviewSummary.documentsRequiredCount} Verified
                      </span>
                    )}
                  </div>

                  {isLoadingReviewData ? (
                    <div className="py-8 text-center text-slate-400">Loading documents...</div>
                  ) : !reviewData?.documents || reviewData.documents.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">No documents configured for this admission scope.</div>
                  ) : (
                    <div className="space-y-3">
                      {reviewData.documents.map((doc) => {
                        const isVerified = doc.staffVerificationStatus === 'STAFF_VERIFIED';
                        const isRejected = doc.staffVerificationStatus === 'REJECTED';
                        const isReupload = doc.staffVerificationStatus === 'REUPLOAD_REQUESTED';
                        const isWarning = doc.systemVerificationStatus === 'POSSIBLE_MISMATCH' || doc.systemVerificationStatus === 'UNREADABLE';

                        return (
                          <div
                            key={doc.id}
                            className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                              isVerified
                                ? 'bg-emerald-50/20 border-emerald-200 dark:border-emerald-800'
                                : isRejected
                                ? 'bg-rose-50/20 border-rose-200 dark:border-rose-800'
                                : isReupload
                                ? 'bg-amber-50/20 border-amber-200 dark:border-amber-800'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {doc.documentName}
                                    </span>
                                    {doc.isRequired && (
                                      <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 text-[9px] font-bold">
                                        REQUIRED
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      v{doc.version}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block">
                                    {doc.fileName || 'No file attached'} · {Math.round((doc.fileSize || 0) / 1024)} KB
                                  </span>
                                </div>
                              </div>

                              {/* Status Badges */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* System Advisory Badge */}
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                                  doc.systemVerificationStatus === 'MATCHED'
                                    ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300'
                                    : doc.systemVerificationStatus === 'POSSIBLE_MISMATCH'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                                    : doc.systemVerificationStatus === 'UNREADABLE'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  AI Advisory: {doc.systemVerificationStatus}
                                </span>

                                {/* Staff Verification Badge */}
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                                  isVerified
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200'
                                    : isRejected
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900 dark:text-rose-200'
                                    : isReupload
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  Staff: {doc.staffVerificationStatus}
                                </span>
                              </div>
                            </div>

                            {/* Remarks & Advisory Notes */}
                            {doc.systemCheckRemarks && (
                              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                <span className="text-xs shrink-0">💡</span>
                                <span>{doc.systemCheckRemarks}</span>
                              </div>
                            )}

                            {/* Action Buttons for Document */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocumentPreview(doc, selectedAppForResolution, 'APPLICATION_REVIEW')}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <span>👁️</span>
                                  <span>View Document</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUploadDocument(doc, selectedAppForResolution, 'APPLICATION_REVIEW')}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <span>⬆️</span>
                                  <span>Upload New Version</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDocumentAction(doc.id, 'VERIFY')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <span>✓</span>
                                  <span>Verify</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDocForAction(doc);
                                    setDocActionType('REQUEST_REUPLOAD');
                                    setShowDocActionModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[11px] cursor-pointer"
                                >
                                  Request Re-upload
                                </button>
                                {isWarning && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDocForAction(doc);
                                      setDocActionType('OVERRIDE');
                                      setShowDocActionModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] cursor-pointer"
                                  >
                                    Override Warning...
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDocForAction(doc);
                                    setDocActionType('REJECT');
                                    setShowDocActionModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: APPLICATION FEE */}
              {activeReviewTab === 'FEE' && (
                <div className="space-y-4">
                  {/* School Policy Banner Card */}
                  {reviewData?.policy?.feePolicy && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                            Campus Application Fee Policy
                          </span>
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {reviewData.policy.feePolicy.feeName}: {reviewData.policy.feePolicy.currency} {reviewData.policy.feePolicy.amount.toLocaleString()}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          reviewData.policy.feePolicy.collectionRule === 'PAYMENT_REQUIRED_BEFORE_TEST'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200'
                        }`}>
                          Rule: {reviewData.policy.feePolicy.collectionRule === 'PAYMENT_REQUIRED_BEFORE_TEST' ? 'Payment Required Before Test' : 'Payment Allowed on Test Day'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {reviewData.policy.feePolicy.instructions}
                      </p>
                      <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Bank / IBAN</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {reviewData.policy.feePolicy.bankDetails?.bankName || 'Meezan Bank'} · {reviewData.policy.feePolicy.bankDetails?.iban || 'PK36MEZN00012345678901'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">EasyPaisa / JazzCash Till</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            Till #{reviewData.policy.feePolicy.mobileWalletDetails?.tillNumber || '987654'} ({reviewData.policy.feePolicy.mobileWalletDetails?.accountTitle || 'Beacon Horizon Admissions'})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Status & Evidence Details */}
                  {reviewData?.feePayment && (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Current Payment Status
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2.5 py-1 rounded-full font-black text-xs border ${
                              reviewData.feePayment.paymentStatus === 'PAID_VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200'
                                : reviewData.feePayment.paymentStatus === 'SUBMITTED'
                                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200'
                                : reviewData.feePayment.paymentStatus === 'WAIVED'
                                ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200'
                                : reviewData.feePayment.paymentStatus === 'MISMATCH'
                                ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900 dark:text-rose-200'
                                : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200'
                            }`}>
                              {reviewData.feePayment.paymentStatus}
                            </span>
                            {reviewData.feePayment.voucherReference && (
                              <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                {reviewData.feePayment.voucherReference}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenVoucher(selectedAppForResolution.id)}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-xs"
                          >
                            <span>🖨️</span>
                            <span>Print Voucher</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowFeeSubmitModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span>💳</span>
                            <span>Submit Payment</span>
                          </button>
                        </div>
                      </div>

                      {/* Submitted Evidence Details */}
                      {reviewData.feePayment.transactionReference ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Method</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.feePayment.paymentMethod || 'Online'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Transaction Ref / TID</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{reviewData.feePayment.transactionReference}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Amount Paid</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.feePayment.currency} {reviewData.feePayment.amount}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Payer Name</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.feePayment.payerName || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Payment Date</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.feePayment.paymentDate || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Verification Note</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.feePayment.verificationNotes || '—'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          No payment evidence submitted yet. Candidate may submit online or deposit at bank using voucher.
                        </div>
                      )}

                      {/* Staff Fee Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Staff Payment Decision
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerifyFee(reviewData.feePayment.id, 'VERIFY')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>✓</span>
                            <span>Verify Paid</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFeeVerifyAction('MISMATCH');
                              setShowFeeVerifyModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer"
                          >
                            Report Mismatch
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFeeVerifyAction('WAIVE');
                              setShowFeeVerifyModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs cursor-pointer"
                          >
                            Waive Fee...
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bulk Bank Statement Import Button */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      Bulk reconcile payments against bank statement CSV / export?
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenStatementReconcile}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🔄</span>
                      <span>Reconcile Bank Statement</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Application Review is unified across Data, Documents, and Fee policies.
              </span>
              <button
                type="button"
                onClick={handleCloseReview}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <span>{reviewSource === 'VERIFICATION_CENTER' ? '← Return to Verification Center' : 'Close Review'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B-1. DOCUMENT ACTION MODAL (LEVEL 3: z-60) ── */}
      {showDocActionModal && selectedDocForAction && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDocActionModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {docActionType === 'OVERRIDE' ? 'Override System Advisory Warning' : docActionType === 'REQUEST_REUPLOAD' ? 'Request Document Re-upload' : 'Reject Document'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Document: <b>{selectedDocForAction.documentName}</b>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {docActionType === 'OVERRIDE' ? 'Mandatory Override Reason *' : 'Staff Reason / Instructions *'}
              </label>
              <textarea
                value={docActionReason}
                onChange={(e) => setDocActionReason(e.target.value)}
                placeholder={docActionType === 'OVERRIDE' ? 'e.g. Official manual seal inspected in person; document authentic.' : 'e.g. Image blurry, please upload clear high-res scan.'}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDocActionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDocActionLoading || !docActionReason.trim()}
                onClick={() => handleDocumentAction(selectedDocForAction.id, docActionType, docActionReason)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs cursor-pointer"
              >
                {isDocActionLoading ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B-2. SHARED DOCUMENT PREVIEW DIALOG (LEVEL 3: z-60) ── */}
      {previewingDoc && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDocumentPreview();
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {previewingDoc.documentName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
                    Document Preview
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap font-mono">
                  <span>{previewingDoc.fileName || `${previewingDoc.documentCode}.pdf`}</span>
                  <span>·</span>
                  <span>v{previewingDoc.version}</span>
                  {(activeDocApplicant || selectedAppForResolution) && (
                    <>
                      <span>·</span>
                      <span className="font-sans font-bold text-slate-600 dark:text-slate-300">
                        {(activeDocApplicant || selectedAppForResolution)?.applicationNumber} ({(activeDocApplicant || selectedAppForResolution)?.studentName})
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDocumentPreview}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700">
              <span className="text-4xl block">📄</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Official Document Preview Simulator
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {previewingDoc.systemCheckRemarks || 'Document scan verified against applicant records.'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Documents Verification · Step 2 of 4
              </span>
              <button
                type="button"
                onClick={handleCloseDocumentPreview}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B-2B. SHARED UPLOAD NEW DOCUMENT VERSION DIALOG (LEVEL 3: z-60) ── */}
      {uploadingDoc && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseUploadDocument();
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Upload New Version
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
                    v{uploadingDoc.version + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                  <span>Document: <b>{uploadingDoc.documentName}</b></span>
                  {(activeDocApplicant || selectedAppForResolution) && (
                    <>
                      <span>·</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {(activeDocApplicant || selectedAppForResolution)?.applicationNumber}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseUploadDocument}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Current Active File:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{uploadingDoc.fileName || 'None'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">New Version Target:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    Applicant_{uploadingDoc.documentCode.toUpperCase()}_v{uploadingDoc.version + 1}.pdf
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Upload Reason / Staff Notes
                </label>
                <input
                  type="text"
                  value={uploadNewVersionReason}
                  onChange={(e) => setUploadNewVersionReason(e.target.value)}
                  placeholder="e.g. Received updated scan with legible seal from parent"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseUploadDocument}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingNewVersion}
                onClick={() => handleUploadDocumentVersion((activeDocApplicant?.id || selectedAppForResolution?.id || ''), uploadingDoc.documentCode)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{isUploadingNewVersion ? 'Uploading...' : 'Upload & Re-Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B-3. SUBMIT FEE EVIDENCE MODAL (LEVEL 3: z-60) ── */}
      {showFeeSubmitModal && selectedAppForResolution && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFeeSubmitModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit Payment Evidence
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedAppForResolution.applicationNumber} ({selectedAppForResolution.studentName})
                </span>
              </div>
              <button type="button" onClick={() => setShowFeeSubmitModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Method *</label>
                <select
                  value={feeSubmitForm.paymentMethod}
                  onChange={(e) => setFeeSubmitForm({ ...feeSubmitForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="ONLINE_TRANSFER">Online Bank Transfer (IBFT)</option>
                  <option value="BANK_DEPOSIT">Bank Branch Deposit (Voucher)</option>
                  <option value="EASYPAISA">EasyPaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="CASH_DESK">Campus Cash Counter</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Transaction Ref / Deposit TID *</label>
                <input
                  type="text"
                  value={feeSubmitForm.transactionReference}
                  onChange={(e) => setFeeSubmitForm({ ...feeSubmitForm, transactionReference: e.target.value })}
                  placeholder="e.g. TXN-998811 or Deposit Slip No"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payer Name</label>
                  <input
                    type="text"
                    value={feeSubmitForm.payerName}
                    onChange={(e) => setFeeSubmitForm({ ...feeSubmitForm, payerName: e.target.value })}
                    placeholder={selectedAppForResolution.fatherOrGuardianName}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={feeSubmitForm.paymentDate}
                    onChange={(e) => setFeeSubmitForm({ ...feeSubmitForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowFeeSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isFeeSubmitting || !feeSubmitForm.transactionReference.trim()}
                onClick={() => handleSubmitFeeEvidence(selectedAppForResolution.id)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs cursor-pointer"
              >
                {isFeeSubmitting ? 'Submitting...' : 'Submit Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B-4. FEE VERIFY / WAIVE MODAL (LEVEL 3: z-60) ── */}
      {showFeeVerifyModal && reviewData?.feePayment && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFeeVerifyModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {feeVerifyAction === 'WAIVE' ? 'Waive Application Fee' : 'Report Fee Mismatch'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {feeVerifyAction === 'WAIVE'
                  ? 'Fee waiver requires an administrative audit reason.'
                  : 'Report mismatch if transaction reference or amount does not match bank records.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Reason *
              </label>
              <textarea
                value={feeVerifyReason}
                onChange={(e) => setFeeVerifyReason(e.target.value)}
                placeholder={feeVerifyAction === 'WAIVE' ? 'e.g. Approved scholarship applicant / staff ward exemption.' : 'e.g. Amount deposited was PKR 1,500 instead of PKR 2,500.'}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowFeeVerifyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isFeeVerifying || !feeVerifyReason.trim()}
                onClick={() => handleVerifyFee(reviewData.feePayment.id, feeVerifyAction, feeVerifyReason)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs cursor-pointer"
              >
                {isFeeVerifying ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B-5. PRINTABLE FEE VOUCHER MODAL (LEVEL 3: z-60) ── */}
      {showVoucherModal && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVoucherModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Official Application Fee Voucher
                </h3>
                <span className="text-xs text-slate-400">
                  Standard 3-part bank deposit challan (Bank Copy · School Copy · Student Copy)
                </span>
              </div>
              <button type="button" onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-slate-600 text-base cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {isLoadingVoucher ? (
                <div className="py-12 text-center text-slate-400">Generating voucher slip...</div>
              ) : !voucherData ? (
                <div className="py-12 text-center text-slate-400">No voucher data available.</div>
              ) : (
                <div className="space-y-4 border border-slate-300 dark:border-slate-700 p-4 rounded-2xl bg-white dark:bg-slate-900">
                  {/* Voucher Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                        {voucherData.campusName}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        Application Fee Deposit Challan · Issued {voucherData.issueDate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-indigo-600 block">
                        {voucherData.voucherReference}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Due Date: {voucherData.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* 3 Slip Copies Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Bank Copy', 'School Copy', 'Student Copy'].map((copyName, cIdx) => (
                      <div key={cIdx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-[10px]">
                        <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-1">
                          <span className="text-indigo-600 uppercase font-black">{copyName}</span>
                          <span>{voucherData.currency} {voucherData.amount}</span>
                        </div>
                        <div className="space-y-1">
                          <div><span className="text-slate-400">App No:</span> <b>{voucherData.applicationNumber}</b></div>
                          <div><span className="text-slate-400">Student:</span> <b>{voucherData.studentName}</b></div>
                          <div><span className="text-slate-400">Class:</span> <b>{voucherData.className}</b></div>
                          <div><span className="text-slate-400">Bank:</span> <b>{voucherData.bankAccountDetails?.bankName || 'Meezan Bank'}</b></div>
                          <div><span className="text-slate-400">Account:</span> <span className="font-mono">{voucherData.bankAccountDetails?.accountNumber || 'PK36MEZN00012345678901'}</span></div>
                        </div>
                        <div className="pt-2 border-t border-slate-200 text-center font-mono text-[9px] text-slate-400">
                          {voucherData.voucherReference}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5B-6. BANK STATEMENT IMPORT & RECONCILIATION MODAL (LEVEL 3: z-60) ── */}
      {showReconcileModal && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReconcileModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col justify-between ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bank Statement Payment Reconciliation
                </h3>
                <span className="text-xs text-slate-400">
                  Automated confidence matching against pending application fees.
                </span>
              </div>
              <button type="button" onClick={() => setShowReconcileModal(false)} className="text-slate-400 hover:text-slate-600 text-base cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {isReconciling ? (
                <div className="py-12 text-center text-slate-400">Reconciling statement entries...</div>
              ) : !reconcileResult ? (
                <div className="py-12 text-center text-slate-400">No reconciliation result available.</div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">Total Rows</span>
                      <span className="text-base font-black text-slate-800 dark:text-slate-200">{reconcileResult.totalRows}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-600 block font-bold">Matched</span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{reconcileResult.matchedCount}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-amber-600 block font-bold">Possible</span>
                      <span className="text-base font-black text-amber-700 dark:text-amber-300">{reconcileResult.possibleMatchCount}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">Unmatched</span>
                      <span className="text-base font-black text-slate-800 dark:text-slate-200">{reconcileResult.unmatchedCount}</span>
                    </div>
                  </div>

                  {/* Reconciled Items List */}
                  <div className="space-y-2">
                    {reconcileResult.items.map((it, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          it.matchStatus === 'MATCHED'
                            ? 'bg-emerald-50/40 border-emerald-200 dark:border-emerald-800'
                            : it.matchStatus === 'POSSIBLE_MATCH'
                            ? 'bg-amber-50/40 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {it.statementRow.reference || it.statementRow.transactionId}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              PKR {it.statementRow.amount}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold ${
                              it.matchStatus === 'MATCHED'
                                ? 'bg-emerald-200 text-emerald-900'
                                : it.matchStatus === 'POSSIBLE_MATCH'
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-slate-200 text-slate-800'
                            }`}>
                              {it.matchStatus} ({it.confidence}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {it.statementRow.description}
                          </p>
                          {it.matchedStudentName && (
                            <span className="text-[11px] font-semibold text-indigo-600 block">
                              Matched Candidate: {it.matchedStudentName} ({it.matchedApplicationNumber})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowReconcileModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              {reconcileResult && reconcileResult.matchedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const ids = reconcileResult.items
                      .filter((x) => x.matchedPaymentId)
                      .map((x) => x.matchedPaymentId!);
                    handleConfirmReconciliations(ids);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm All Matched ({reconcileResult.matchedCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 5C. SET INACTIVE MODAL (LEVEL 3: z-60) ── */}
      {showInactiveModal && selectedAppForResolution && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInactiveModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Set Application to Inactive</h3>
              <button type="button" onClick={() => setShowInactiveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Setting this application to <b>INACTIVE</b> will remove it from active verification queues and test scheduling eligibility. The record will remain preserved in the audit log.
              </p>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Reason *</label>
                <select
                  value={inactiveReason}
                  onChange={(e) => setInactiveReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="Duplicate entry">Duplicate entry</option>
                  <option value="Parent no longer interested">Parent no longer interested</option>
                  <option value="Dummy / Test record">Dummy / Test record</option>
                  <option value="Application withdrawn">Application withdrawn</option>
                  <option value="Other administrative reason">Other administrative reason</option>
                </select>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInactiveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSettingInactive}
                onClick={() => handleSetSingleInactive(selectedAppForResolution.id, inactiveReason)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 rounded-xl shadow-xs cursor-pointer"
              >
                {isSettingInactive ? 'Saving...' : 'Confirm Inactive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5D. REMOVE APPLICATION MODAL (LEVEL 3: z-60) ── */}
      {showRemoveModal && selectedAppForResolution && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRemoveModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-600">Remove / Soft-Delete Application</h3>
              <button type="button" onClick={() => setShowRemoveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Are you sure you want to remove <b>{selectedAppForResolution.applicationNumber} ({selectedAppForResolution.studentName})</b>? This action will archive the application and mark it CANCELLED.
              </p>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Mandatory Deletion Reason *</label>
                <input
                  type="text"
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="e.g. Duplicate test application submitted in error"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingApp || !removeReason.trim()}
                onClick={() => handleRemoveApplication(selectedAppForResolution.id, removeReason)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
              >
                {isRemovingApp ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5E. STATUS CHANGE MODAL (LEVEL 3: z-60) ── */}
      {statusChangeModal && selectedAppForResolution && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStatusChangeModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Application Status</h3>
              <button type="button" onClick={() => setStatusChangeModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Select New Status *</label>
                <select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={statusChangeNotes}
                  onChange={(e) => setStatusChangeNotes(e.target.value)}
                  placeholder="Reason for status update..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusChangeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleChangeStatus(selectedAppForResolution.id, selectedNewStatus, statusChangeNotes)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. SIDE-BY-SIDE DUPLICATE COMPARE MODAL (LEVEL 3: z-60) ── */}
      {showCompareModal && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCompareModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col justify-between ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 text-lg">⚖️</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Side-by-Side Duplicate Comparison
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Compare incoming submission against existing application to verify identical student or sibling record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {compareLoading ? (
                <div className="py-12 text-center text-slate-400">Loading comparison details...</div>
              ) : !compareData ? (
                <div className="py-12 text-center text-slate-400">No comparison data available.</div>
              ) : (
                <>
                  {/* Matched Summary Banner */}
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 dark:text-purple-200">
                        {compareData.duplicateConfidence === 'EXACT_DUPLICATE' ? 'Exact Duplicate Match' : 'Possible Duplicate Candidate'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px] font-extrabold">
                        {compareData.duplicateConfidence}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {compareData.matchedReasons.map((r, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 text-[10px] font-bold">
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-bold text-slate-400 text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 w-1/3">Field</th>
                          <th className="py-2.5 px-3 w-1/3 text-indigo-600 dark:text-indigo-400 font-black">
                            Current Submission ({compareData.currentApplication.applicationNumber})
                          </th>
                          <th className="py-2.5 px-3 w-1/3 text-slate-700 dark:text-slate-300">
                            Existing Application ({compareData.existingApplication.applicationNumber})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                        {compareData.comparisonFields.map((f, idx) => (
                          <tr key={idx} className={f.isMatch ? 'bg-purple-50/30 dark:bg-purple-950/20' : ''}>
                            <td className="py-2 px-3 font-semibold text-slate-500 flex items-center justify-between">
                              <span>{f.fieldLabel}</span>
                              {f.isMatch && <span className="text-[10px] text-purple-600 font-bold">MATCH</span>}
                            </td>
                            <td className={`py-2 px-3 font-bold ${f.isMatch ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-200'}`}>
                              {String(f.currentValue || '—')}
                            </td>
                            <td className={`py-2 px-3 ${f.isMatch ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                              {String(f.existingValue || '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close Comparison
              </button>

              {compareData && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenOverride(compareData.currentApplication.id, 'REJECT')}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
                  >
                    Reject Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenOverride(compareData.currentApplication.id, 'VERIFY_ANYWAY')}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Verify Anyway (Override)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. HUMAN OVERRIDE MODAL (LEVEL 3: z-60) ── */}
      {showOverrideModal && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOverrideModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {overrideAction === 'VERIFY_ANYWAY' ? 'Verify Application with Override' : overrideAction === 'REJECT' ? 'Reject Application' : 'Hold Application for Review'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Please provide a mandatory audit reason for this verification decision.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Audit Reason *
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Parent confirmed in person; distinct twin applicant with verified birth certificate..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={overrideLoading || !overrideReason.trim()}
                onClick={handleSubmitOverride}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs cursor-pointer"
              >
                {overrideLoading ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. OPERATIONAL DATA EDIT MODAL (LEVEL 3: z-60) ── */}
      {showEditDataModal && editingApp && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditDataModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 my-6 ring-1 ring-slate-900/10 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Correct Application Data ({editingApp.applicationNumber})
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Edit operational values. The original submitted form snapshot will be preserved immutably.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={editFormData.studentName}
                  onChange={(e) => setEditFormData({ ...editFormData, studentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Father / Guardian Name *
                </label>
                <input
                  type="text"
                  value={editFormData.fatherOrGuardianName}
                  onChange={(e) => setEditFormData({ ...editFormData, fatherOrGuardianName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Primary Mobile Number *
                </label>
                <input
                  type="text"
                  value={editFormData.primaryMobile}
                  onChange={(e) => setEditFormData({ ...editFormData, primaryMobile: e.target.value })}
                  placeholder={contactPlaceholders.mobile}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Father / Guardian CNIC
                </label>
                <input
                  type="text"
                  value={editFormData.fatherCnic}
                  onChange={(e) => setEditFormData({ ...editFormData, fatherCnic: e.target.value })}
                  placeholder={contactPlaceholders.cnic}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Primary Email
                </label>
                <input
                  type="email"
                  value={editFormData.primaryEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, primaryEmail: e.target.value })}
                  placeholder="parent@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Correction Reason
                </label>
                <input
                  type="text"
                  value={editFormData.correctionReason}
                  onChange={(e) => setEditFormData({ ...editFormData, correctionReason: e.target.value })}
                  placeholder="e.g. Corrected spelling from official birth certificate"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditDataModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editLoading || !editFormData.studentName.trim() || !editFormData.primaryMobile.trim()}
                onClick={handleSubmitEditData}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs cursor-pointer"
              >
                {editLoading ? 'Saving...' : 'Save Corrections'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. CONFIGURE LIST MODAL / DRAWER (LEVEL 2: z-50) ── */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfigModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Pre-Admissions Columns</h3>
                <p className="text-xs text-slate-400">
                  Select, reorder, or pin columns. {counts.selected} of {counts.all} columns selected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Search Bar */}
            <div className="shrink-0">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  placeholder="Search available columns by label, code, or canonical key..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* 2. Category Filters with Dynamic Counts & View Filter */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0 flex-wrap text-[11px]">
              {/* Category Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: `All Fields ${counts.all}` },
                  { id: 'SYSTEM', label: `System ${counts.system}` },
                  { id: 'CANONICAL', label: `Canonical ${counts.canonical}` },
                  { id: 'CUSTOM', label: `Custom Fields ${counts.custom}` },
                  { id: 'DYNAMIC_STATUS', label: `Operational ${counts.operational}` },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setConfigCategoryTab(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      configCategoryTab === cat.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* View Filter (All vs Selected Only) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewFilter('ALL')}
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                    viewFilter === 'ALL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('SELECTED_ONLY')}
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                    viewFilter === 'SELECTED_ONLY' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Selected Only ({counts.selected})
                </button>
              </div>
            </div>

            {/* 3. Bulk Selection Toolbar */}
            <div className="flex items-center justify-between text-[11px] px-1 shrink-0 text-slate-500">
              <span>Showing {candidateColumns.length} matching columns</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllMatching}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAllMatching}
                  className="font-bold text-slate-600 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* 4. Column List with Drag Handles, Up/Down, and Pin / Unpin */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs max-h-[340px]">
              {candidateColumns.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No matching columns found for &quot;{columnSearch}&quot;.
                </div>
              ) : (
                candidateColumns.map((col) => {
                  const globalIdx = columns.findIndex((x) => x.id === col.id);
                  return (
                    <div
                      key={col.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, globalIdx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, globalIdx)}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        col.isVisible
                          ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs'
                          : 'border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Drag Handle */}
                        <span
                          className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing text-sm select-none"
                          title="Drag to reorder"
                        >
                          ⠿
                        </span>

                        {/* Visibility Checkbox */}
                        <input
                          type="checkbox"
                          checked={col.isVisible}
                          onChange={() => handleToggleColumn(col.id)}
                          className="h-4 w-4 text-indigo-600 rounded cursor-pointer shrink-0"
                        />

                        {/* Column Name & Metadata */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {col.label}
                            </span>
                            {col.isPinned && (
                              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">
                                Pinned
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {col.category} {col.code ? `· ${col.code}` : ''} {col.canonicalKey ? `· ${col.canonicalKey}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Actions: Pin Toggle & Up/Down Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Pin Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePin(col.id)}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            col.isPinned
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={col.isPinned ? 'Unpin column' : 'Pin column to left'}
                        >
                          📌
                        </button>

                        {/* Move Up / Down */}
                        <button
                          type="button"
                          disabled={globalIdx === 0}
                          onClick={() => handleMoveColumn(globalIdx, 'UP')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer text-slate-500"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={globalIdx === columns.length - 1}
                          onClick={() => handleMoveColumn(globalIdx, 'DOWN')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer text-slate-500"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Column View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. NEW PRE-ADMISSION (LEVEL 2: z-50) ── */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
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
                      {getAuthorizedCampusesForWrite().map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.schoolName})
                        </option>
                      ))}
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
                      <option value="cls-g6">Grade 6</option>
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
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Continue to Form →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
          </>,
          document.body
        )}
    </div>
  );
}
