import { AdmissionStepType } from './admission-process.js';
import { WorkingContextNodeType } from './hierarchy.js';

export type AdmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'ON_HOLD'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'ENROLLED';

export type PreAdmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'INACTIVE';

export type PreAdmissionSource =
  | 'ONLINE'
  | 'STAFF_ENTRY'
  | 'WALK_IN'
  | 'IMPORT'
  | 'OTHER';

export type AdmissionGender = 'MALE' | 'FEMALE' | 'OTHER';

export type JourneyStepStatus =
  | 'NOT_STARTED'
  | 'READY'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'ON_HOLD'
  | 'FAILED'
  | 'CANCELLED'
  | 'CURRENT' // alias for IN_PROGRESS / active step
  | 'UPCOMING'; // alias for NOT_STARTED

export type PreAdmissionVerificationStatus =
  | 'UNVERIFIED'
  | 'AUTO_VERIFIED'
  | 'STAFF_VERIFIED'
  | 'NEEDS_REVIEW'
  | 'POSSIBLE_DUPLICATE'
  | 'INVALID'
  | 'REJECTED'
  | 'INACTIVE';

export interface VerificationIssue {
  code:
    | 'MISSING_REQUIRED'
    | 'INVALID_CNIC'
    | 'INVALID_MOBILE'
    | 'INVALID_EMAIL'
    | 'INVALID_DOB'
    | 'SUSPICIOUS_DUMMY_DATA'
    | 'POSSIBLE_DUPLICATE'
    | 'EXACT_DUPLICATE';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  field?: string;
  message: string;
  matchedApplicationId?: string;
  matchedApplicationNumber?: string;
  matchedReasons?: string[];
}

export interface AdmissionJourneyStepProgress {
  stepId: string;
  stepType: AdmissionStepType;
  displayName: string;
  sortOrder: number;
  isRequired: boolean;
  state: JourneyStepStatus;
  completedAt?: Date | string;
  completedBy?: string;
  remarks?: string;
  attachedFormName?: string;
}

export interface AdmissionJourneyDto {
  applicationId: string;
  processDefinitionId: string;
  processVersionId: string;
  processName: string;
  processVersionNumber: number;
  steps: AdmissionJourneyStepProgress[];
  currentStepId: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'HELD' | 'CANCELLED';
  startedAt: Date | string;
  updatedAt: Date | string;
}

export interface PreAdmissionApplicationDto {
  id: string;
  organizationId: string;
  applicationNumber: string;
  studentName: string;
  gender: AdmissionGender;
  dateOfBirth: string; // YYYY-MM-DD
  fatherOrGuardianName: string;
  fatherCnic?: string;
  primaryMobile: string;
  primaryEmail?: string;
  schoolId: string;
  schoolName: string;
  campusId: string;
  campusName: string;
  regionId?: string;
  regionName?: string;
  headOfficeId?: string;
  headOfficeName?: string;
  academicYearId: string;
  academicYearName: string;
  academicLevelId?: string;
  academicLevelName?: string;
  classId: string;
  className: string;
  boardId?: string;
  boardName?: string;
  formDefinitionId: string;
  formName: string;
  publishedFormVersionId: string;
  formVersionNumber: number;
  source: PreAdmissionSource;
  status: PreAdmissionStatus;
  verificationStatus: PreAdmissionVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  verificationMethod?: 'AUTO' | 'STAFF' | 'OVERRIDE';
  verificationOverrideReason?: string;
  verificationIssues?: VerificationIssue[];
  originalSubmissionSnapshot?: Record<string, any>;
  isCorrected?: boolean;
  submittedAt: Date | string;
  submittedByUserId?: string;
  submittedByRole?: string;
  submissionData: Record<string, any>;
  customFieldsData?: Record<string, any>;
  processDefinitionId?: string | null;
  processName?: string | null;
  processVersionId?: string | null;
  processVersionNumber?: number | null;
  currentStepId?: string | null;
  currentStepName?: string | null;
  currentStepType?: AdmissionStepType | null;
  journeyStatus: 'NO_PROCESS' | 'IN_PROGRESS' | 'COMPLETED' | 'HELD' | 'CANCELLED';
  journey?: AdmissionJourneyDto | null;
  // Dynamic Operational / Derived Column Data
  testDate?: string;
  testStatus?: string;
  testResult?: string;
  interviewDate?: string;
  interviewStatus?: string;
  decisionOutcome?: string;
  feeStatus?: string;
  applicationReview?: ApplicationReviewSummaryDto;
  feePayment?: ApplicationFeePaymentDto;
  documents?: ApplicationDocumentDto[];
  auditEvents?: {
    id: string;
    eventType: string;
    description: string;
    actor: string;
    timestamp: Date | string;
  }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Verification Center DTOs
export interface VerificationScanSummaryDto {
  totalScanned: number;
  looksGoodCount: number;
  needsReviewCount: number;
  possibleDuplicatesCount: number;
  invalidMissingDataCount: number;
}

export interface ApplicationVerificationScanItemDto {
  id: string;
  applicationNumber: string;
  studentName: string;
  className: string;
  campusName: string;
  fatherOrGuardianName: string;
  primaryMobile: string;
  fatherCnic?: string;
  dateOfBirth?: string;
  submittedAt: Date | string;
  source: PreAdmissionSource;
  currentVerificationStatus: PreAdmissionVerificationStatus;
  computedStatus: 'CLEAN' | 'NEEDS_REVIEW' | 'POSSIBLE_DUPLICATE' | 'INVALID';
  issues: VerificationIssue[];
  matchedDuplicates?: {
    applicationId: string;
    applicationNumber: string;
    studentName: string;
    className: string;
    campusName: string;
    fatherOrGuardianName: string;
    fatherCnic?: string;
    primaryMobile: string;
    dateOfBirth?: string;
    submittedAt: Date | string;
    reasons: string[];
    isExactMatch: boolean;
  }[];
}

export interface VerifyApplicationsScanResultDto {
  summary: VerificationScanSummaryDto;
  items: ApplicationVerificationScanItemDto[];
}

export interface VerifyApplicationsScanRequestDto {
  applicationIds?: string[];
  filter?: PreAdmissionsFilterDto;
}

export interface BulkVerifyCleanRequestDto {
  applicationIds?: string[];
}

export interface HumanOverrideVerificationDto {
  applicationId: string;
  overrideReason: string;
  action: 'VERIFY_ANYWAY' | 'KEEP_FOR_REVIEW' | 'REJECT';
}

export interface EditOperationalDataDto {
  applicationId: string;
  studentName?: string;
  fatherOrGuardianName?: string;
  fatherCnic?: string;
  primaryMobile?: string;
  primaryEmail?: string;
  dateOfBirth?: string;
  gender?: AdmissionGender;
  submissionData?: Record<string, any>;
  customFieldsData?: Record<string, any>;
  correctionReason?: string;
}

export interface DuplicateFieldComparisonDto {
  fieldKey: string;
  fieldLabel: string;
  currentValue: any;
  existingValue: any;
  isMatch: boolean;
}

export interface DuplicateComparisonResultDto {
  currentApplication: PreAdmissionApplicationDto;
  existingApplication: PreAdmissionApplicationDto;
  comparisonFields: DuplicateFieldComparisonDto[];
  duplicateConfidence: 'EXACT_DUPLICATE' | 'HIGH_CONFIDENCE' | 'POSSIBLE_DUPLICATE';
  matchedReasons: string[];
}

// Backward compatibility alias
export type AdmissionApplicationListItemDto = PreAdmissionApplicationDto;

export interface PreAdmissionsSummaryDto {
  totalPreAdmissions: number;
  totalApplications?: number; // Backward compat
  newSubmitted: number;
  inProcess: number;
  completed: number;
  pendingReview?: number;
  approved?: number;
  enrolled?: number;
}

// Backward compatibility alias
export type AdmissionApplicationsSummaryDto = PreAdmissionsSummaryDto;

export interface PreAdmissionsFilterDto {
  search?: string;
  status?: PreAdmissionStatus | 'ALL';
  currentStep?: string;
  academicYearId?: string;
  classId?: string;
  campusId?: string;
  schoolId?: string;
  regionId?: string;
  contextNodeId?: string;
  contextNodeType?: WorkingContextNodeType;
  formDefinitionId?: string;
  processDefinitionId?: string;
  verificationStatus?: PreAdmissionVerificationStatus | 'PENDING_VERIFICATION' | 'VERIFIED' | 'ALL';
  source?: PreAdmissionSource | 'ALL';
  page?: number;
  limit?: number;
  sortBy?: 'submittedAt' | 'applicationNumber' | 'studentName' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Backward compatibility alias
export type AdmissionApplicationsFilterDto = PreAdmissionsFilterDto;

export interface PaginatedPreAdmissionsDto {
  items: PreAdmissionApplicationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: PreAdmissionsSummaryDto;
}

// Backward compatibility alias
export type PaginatedAdmissionApplicationsDto = PaginatedPreAdmissionsDto;

export interface CreatePreAdmissionDto {
  campusId: string;
  schoolId?: string;
  academicYearId: string;
  classId: string;
  formDefinitionId: string;
  publishedFormVersionId?: string;
  source?: PreAdmissionSource;
  formData: Record<string, any>;
  contextNodeId?: string;
  contextNodeType?: WorkingContextNodeType;
  // Canonical overrides if parsed from form
  studentName?: string;
  dateOfBirth?: string;
  gender?: AdmissionGender;
  fatherOrGuardianName?: string;
  primaryMobile?: string;
  primaryEmail?: string;
}

export interface AssignAdmissionProcessDto {
  processDefinitionId: string;
}

// Dynamic List View Configuration Models
export type ListColumnCategory = 'SYSTEM' | 'CANONICAL' | 'CUSTOM' | 'DYNAMIC_STATUS';

export interface ListColumnDefinitionDto {
  id: string;
  key: string;
  label: string;
  code?: string;
  canonicalKey?: string;
  category: ListColumnCategory;
  isVisible: boolean;
  isPinned?: boolean;
  sortOrder: number;
  width?: string;
  dataType?: 'string' | 'number' | 'date' | 'badge' | 'boolean';
  isActive?: boolean;
}

export interface PreAdmissionsListViewConfigDto {
  id: string;
  organizationId: string;
  viewType: 'ORGANIZATION_DEFAULT' | 'ROLE_DEFAULT' | 'PERSONAL';
  name: string;
  columns: ListColumnDefinitionDto[];
  rowsPerPage?: number;
  updatedAt: Date | string;
}

export interface SaveUserListViewConfigDto {
  columns: ListColumnDefinitionDto[];
  viewType?: 'ORGANIZATION_DEFAULT' | 'ROLE_DEFAULT' | 'PERSONAL';
  rowsPerPage?: number;
}

// ─────────────────────────────────────────────────────────────
// 1. APPLICATION REVIEW: DOCUMENT VERIFICATION TYPES
// ─────────────────────────────────────────────────────────────

export type SystemDocumentVerificationStatus =
  | 'PENDING'
  | 'CHECKED'
  | 'MATCHED'
  | 'POSSIBLE_MISMATCH'
  | 'UNREADABLE'
  | 'REVIEW_REQUIRED';

export type StaffDocumentVerificationStatus =
  | 'UNVERIFIED'
  | 'STAFF_VERIFIED'
  | 'REJECTED'
  | 'REUPLOAD_REQUESTED';

export interface RequiredDocumentConfigDto {
  code: string;
  name: string;
  isRequired: boolean;
  instructions?: string;
  allowedFileTypes?: string[];
  maxSizeBytes?: number;
}

export interface ApplicationDocumentDto {
  id: string;
  organizationId: string;
  schoolId: string;
  campusId: string;
  applicationId: string;
  documentCode: string;
  documentName: string;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isRequired: boolean;
  systemVerificationStatus: SystemDocumentVerificationStatus;
  systemCheckRemarks?: string;
  extractedData?: {
    name?: string;
    cnicOrBForm?: string;
    dateOfBirth?: string;
    fatherName?: string;
    confidenceScore?: number;
    matchWithApplication?: boolean;
    issues?: string[];
  };
  staffVerificationStatus: StaffDocumentVerificationStatus;
  staffNotes?: string;
  overrideReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  version: number;
  uploadedAt: Date | string;
  updatedAt: Date | string;
}

export interface UploadDocumentDto {
  applicationId: string;
  documentCode: string;
  documentName?: string;
  fileName: string;
  fileUrl: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  isRequired?: boolean;
}

export interface VerifyDocumentDto {
  documentId: string;
  action: 'VERIFY' | 'REJECT' | 'REQUEST_REUPLOAD' | 'OVERRIDE';
  reason?: string;
  staffNotes?: string;
}

// ─────────────────────────────────────────────────────────────
// 2. APPLICATION REVIEW: DYNAMIC APPLICATION FEE TYPES
// ─────────────────────────────────────────────────────────────

export type ApplicationFeeCollectionRule =
  | 'PAYMENT_REQUIRED_BEFORE_TEST'
  | 'PAYMENT_ALLOWED_ON_TEST_DAY';

export type ApplicationFeePaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'PAID_VERIFIED'
  | 'MISMATCH'
  | 'WAIVED';

export type ApplicationFeePaymentMethod =
  | 'BANK_TRANSFER'
  | 'EASYPAISA'
  | 'JAZZCASH'
  | 'CASH_AT_CAMPUS'
  | 'ONLINE_GATEWAY'
  | 'CHEQUE'
  | 'OTHER';

export interface ApplicationFeePolicyDto {
  feeEnabled: boolean;
  feeName: string;
  amount: number;
  currency: string;
  collectionRule: ApplicationFeeCollectionRule;
  paymentInstructions: string;
  bankAccountDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchCode?: string;
  };
  mobileWallets?: {
    easypaisa?: string;
    jazzcash?: string;
    title?: string;
  };
  qrCodeUrl?: string;
  voucherEnabled: boolean;
  paymentVerificationRequired: boolean;
}

export interface ApplicationFeePaymentDto {
  id: string;
  organizationId: string;
  schoolId: string;
  campusId: string;
  applicationId: string;
  applicationNumber: string;
  studentName: string;
  feeName: string;
  amount: number;
  currency: string;
  collectionRule: ApplicationFeeCollectionRule;
  paymentStatus: ApplicationFeePaymentStatus;
  paymentMethod?: ApplicationFeePaymentMethod;
  transactionReference?: string;
  voucherReference?: string;
  paymentDate?: string;
  receiptFileUrl?: string;
  payerName?: string;
  payerMobile?: string;
  submittedAt?: Date | string;
  verifiedAt?: Date | string;
  verifiedBy?: string;
  verificationNotes?: string;
  waiverReason?: string;
  waivedBy?: string;
  waivedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SubmitFeePaymentDto {
  applicationId: string;
  amount: number;
  paymentMethod: ApplicationFeePaymentMethod;
  transactionReference: string;
  paymentDate?: string;
  receiptFileUrl?: string;
  payerName?: string;
  payerMobile?: string;
  notes?: string;
}

export interface VerifyFeePaymentDto {
  paymentId: string;
  action: 'VERIFY' | 'MISMATCH' | 'WAIVE';
  reason?: string;
  notes?: string;
}

export interface ApplicationFeeVoucherDto {
  applicationId: string;
  applicationNumber: string;
  studentName: string;
  fatherName: string;
  campusName: string;
  className: string;
  feeName: string;
  amount: number;
  currency: string;
  voucherReference: string;
  issueDate: string;
  dueDate: string;
  collectionRule: ApplicationFeeCollectionRule;
  bankAccountDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  qrCodeUrl?: string;
  paymentInstructions: string;
}

// ─────────────────────────────────────────────────────────────
// 3. APPLICATION REVIEW: BANK STATEMENT RECONCILIATION TYPES
// ─────────────────────────────────────────────────────────────

export interface BankStatementRowDto {
  transactionId: string;
  reference: string;
  date: string;
  amount: number;
  description?: string;
  sender?: string;
}

export interface ReconciliationMatchItemDto {
  statementRow: BankStatementRowDto;
  matchStatus: 'MATCHED' | 'POSSIBLE_MATCH' | 'UNMATCHED';
  matchedApplicationId?: string;
  matchedApplicationNumber?: string;
  matchedStudentName?: string;
  matchedPaymentId?: string;
  confidence: number;
  matchReasons: string[];
}

export interface BulkReconciliationResultDto {
  totalRows: number;
  matchedCount: number;
  possibleMatchCount: number;
  unmatchedCount: number;
  items: ReconciliationMatchItemDto[];
}

// ─────────────────────────────────────────────────────────────
// 4. UNIFIED APPLICATION REVIEW SUMMARY DTO
// ─────────────────────────────────────────────────────────────

export interface ApplicationReviewSummaryDto {
  overallStatus: 'READY_FOR_TEST' | 'NEEDS_ATTENTION' | 'IN_PROGRESS' | 'COMPLETED';
  progressFraction: string; // e.g. '2/3 Complete'
  dataStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'INVALID' | 'UNVERIFIED';
  documentsStatus: 'ALL_VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_REQUIRED';
  documentsVerifiedCount: number;
  documentsRequiredCount: number;
  documentsTotalCount: number;
  feeStatus: ApplicationFeePaymentStatus;
  feeAmount: number;
  feeCurrency: string;
  feeCollectionRule: ApplicationFeeCollectionRule;
  isTestEligible: boolean;
  testEligibilityReason: string;
  testCandidateIndicator: {
    reviewBadge: string; // e.g. 'Review ✓'
    feeBadge: string; // e.g. 'Fee ✓ Paid' | 'Fee ⏳ Test-Day Payment' | 'Fee ⏳ Pending'
    isReady: boolean;
  };
}

// ─────────────────────────────────────────────────────────────
// 5. APPLICATION FEE RULE CONFIGURATION DTOs
// ─────────────────────────────────────────────────────────────

export interface ApplicationFeeRuleDto {
  id: string;
  organizationId: string;
  schoolId?: string;
  schoolName?: string;
  academicYearId: string;
  academicYearName?: string;
  campusIds: string[];
  campusNames?: string[];
  classIds: string[];
  classNames?: string[];
  feeAmount: number;
  currency: string;
  instructions: string;
  bankDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  mobileWalletDetails?: {
    provider: string;
    tillNumber: string;
    accountTitle: string;
  };
  collectionRule: ApplicationFeeCollectionRule;
  feeNotRequired: boolean;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateApplicationFeeRuleDto {
  schoolId?: string;
  academicYearId: string;
  campusIds: string[];
  classIds: string[];
  feeAmount: number;
  currency?: string;
  instructions?: string;
  bankDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  mobileWalletDetails?: {
    provider: string;
    tillNumber: string;
    accountTitle: string;
  };
  collectionRule?: ApplicationFeeCollectionRule;
  feeNotRequired?: boolean;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  contextNodeId?: string;
  contextNodeType?: WorkingContextNodeType;
}

export interface ResolveApplicationFeeDto {
  academicYearId: string;
  campusId: string;
  classId: string;
}

export interface ApplicationFeeSnapshotDto {
  ruleId?: string;
  feeAmount: number;
  currency: string;
  instructions: string;
  collectionRule: ApplicationFeeCollectionRule;
  feeNotRequired: boolean;
  bankDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  mobileWalletDetails?: {
    provider: string;
    tillNumber: string;
    accountTitle: string;
  };
  snapshottedAt: string;
}

// ─────────────────────────────────────────────────────────────
// 6. SYSTEM CHECK & HUMAN VERIFICATION MASTER DTOs
// ─────────────────────────────────────────────────────────────

export type VerificationMainViewTab = 'PENDING' | 'NEEDS_REVIEW' | 'VERIFIED';

export interface SystemCheckSummaryCountsDto {
  totalApplications: number;
  totalScanned?: number;
  readyCount: number;
  readyForHumanVerification?: number;
  needsReviewCount: number;
  dataClearCount: number;
  dataReviewCount: number;
  docsClearCount: number;
  docsReviewCount: number;
  feeClearCount: number;
  feeReviewCount: number;
}

export interface BulkVerifyFeePaymentsDto {
  paymentIds?: string[];
  applicationIds?: string[];
  verifiedBy: string;
  notes?: string;
}

export interface BulkVerifyFeePaymentsResponseDto {
  verifiedCount: number;
  verifiedPaymentIds: string[];
  verifiedBy: string;
  verifiedAt: string;
}

export interface SystemCheckItemDto {
  id: string;
  applicationNumber: string;
  studentName: string;
  fatherOrGuardianName: string;
  campusId: string;
  campusName: string;
  classId: string;
  className: string;
  academicYearId: string;
  dataCheckStatus: 'CLEAR' | 'NEEDS_REVIEW';
  docsCheckStatus: 'CLEAR' | 'NEEDS_REVIEW' | 'NOT_REQUIRED';
  docsVerifiedRatio: string; // e.g. '3/3' or '2/3'
  feeCheckStatus: 'CLEAR' | 'NEEDS_REVIEW' | 'NOT_REQUIRED';
  feeStatusBadge: string; // e.g. 'Paid', 'Pending', 'Waived', 'N/A'
  systemResult: 'READY' | 'NEEDS_REVIEW';
  humanVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW';
  issueBadges: string[];
  issues: VerificationIssue[];
  isEligibleForBulkHumanVerify: boolean;

  // ── Application Fee Verification Dimension ──
  feePaymentId?: string;
  requiredFeeAmount?: number;
  parentPaidAmount?: number;
  paymentMethod?: string;
  transactionReference?: string;
  paymentDate?: string;
  receiptFileUrl?: string;
  receiptDocCode?: string;
  receiptDocId?: string;
  slipDetectedAmount?: number;
  systemFeeResult?: 'CLEAR' | 'NEEDS_REVIEW' | 'UNPAID' | 'NOT_REQUIRED';
  systemFeeIssues?: string[];
  humanFeeStatus?: 'PENDING' | 'PAID_VERIFIED' | 'WAIVED' | 'MISMATCH' | 'NOT_REQUIRED' | 'UNPAID';
  isEligibleForBulkFeeVerify?: boolean;
}

export interface SystemCheckResponseDto {
  summary: SystemCheckSummaryCountsDto;
  items: SystemCheckItemDto[];
  scannedAt: string;
}

export interface BulkHumanVerifyDto {
  applicationIds: string[];
  verifiedBy: string;
  notes?: string;
  contextNodeId?: string;
  contextNodeType?: WorkingContextNodeType;
}

export interface BulkHumanVerifyResponseDto {
  verifiedCount: number;
  verifiedApplicationIds: string[];
  skippedFlaggedApplicationIds?: string[];
  verifiedBy: string;
  verifiedAt: string;
  advancedToStepNames: Record<string, string>;
}


