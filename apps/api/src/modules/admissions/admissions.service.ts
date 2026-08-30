import {
  Injectable,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  PreAdmissionApplicationDto,
  PreAdmissionsFilterDto,
  PaginatedPreAdmissionsDto,
  PreAdmissionStatus,
  PreAdmissionVerificationStatus,
  VerificationIssue,
  ApplicationVerificationScanItemDto,
  VerifyApplicationsScanRequestDto,
  BulkVerifyCleanRequestDto,
  HumanOverrideVerificationDto,
  EditOperationalDataDto,
  DuplicateFieldComparisonDto,
  DuplicateComparisonResultDto,
  SaveUserListViewConfigDto,
  CreatePreAdmissionDto,
  AdmissionJourneyDto,
  PreAdmissionsListViewConfigDto,
  ListColumnDefinitionDto,
  AdmissionTestScheduleDto,
  TestScheduleSummaryDto,
  AdmissionTestCandidateDto,
  CreateAdmissionTestScheduleDto,
  RescheduleCandidateDto,
  TestScheduleDto,
  TestScheduleAssignmentDto,
  TestOutcome,
  InterviewScheduleDto,
  InterviewAssignmentDto,
  InterviewOutcome,
  AdmissionChargeDto,
  AdmissionDecisionOutcome,
  AdmissionProcessStepConfig,
  WorkingContextNodeType,
  WorkingContextDto,
  EffectiveScopeDto,
  ApplicationDocumentDto,
  UploadDocumentDto,
  VerifyDocumentDto,
  RequiredDocumentConfigDto,
  ApplicationFeePolicyDto,
  ApplicationFeePaymentDto,
  SubmitFeePaymentDto,
  VerifyFeePaymentDto,
  ApplicationFeeVoucherDto,
  BankStatementRowDto,
  ReconciliationMatchItemDto,
  BulkReconciliationResultDto,
  ApplicationReviewSummaryDto,
  ApplicationFeePaymentStatus,
  ApplicationFeeRuleDto,
  CreateApplicationFeeRuleDto,
  ResolveApplicationFeeDto,
  SystemCheckResponseDto,
  SystemCheckItemDto,
  BulkHumanVerifyDto,
  BulkHumanVerifyResponseDto,
  BulkVerifyFeePaymentsDto,
  BulkVerifyFeePaymentsResponseDto,
  isValidEmail,
  isValidCnic,
  isValidMobile,
} from '@campus-os/types';
import {
  preAdmissions,
  preAdmissionsListViewConfigs,
  preAdmissionDocuments,
  preAdmissionFeePayments,
  applicationFeeRules,
  branches,
  TenantTransactionManager,
  createTenantManager,
} from '@campus-os/database';
import { eq, and, or, inArray, ilike, desc, sql } from 'drizzle-orm';
import { WorkingContextService } from '../../core/hierarchy/working-context.service.js';
import { AuditService } from '../../core/audit/audit.service.js';

export interface UserScopeContext {
  organizationId: string;
  userRole?: string;
  authorizedHeadOfficeIds?: string[];
  authorizedRegionIds?: string[];
  authorizedSchoolIds?: string[];
  authorizedCampusIds?: string[];
  isSuperAdmin?: boolean;
  workingContext?: WorkingContextDto;
}

export const CANONICAL_ORG_ID_A = '11111111-1111-1111-1111-111111111111';
export const CANONICAL_ORG_ID_B = '22222222-2222-2222-2222-222222222222';

export const SCHOOL_IDS = {
  BEACON: '11111111-2222-3333-4444-555555555555',
  CITY: '22222222-3333-4444-5555-666666666666',
  HORIZON: '33333333-4444-5555-6666-777777777777',
};

export const CAMPUS_IDS = {
  MAIN_CAMPUS: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CLIFTON_CAMPUS: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  DHA_CAMPUS: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  PECHS_CAMPUS: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  CLIFTON_JR_CAMPUS: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  ISLAMABAD_CAMPUS: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
};

interface ActiveProcessRegistryItem {
  id: string;
  name: string;
  code: string;
  versionId: string;
  versionNumber: number;
  applyTo: 'ALL_CAMPUSES' | 'SELECTED_CAMPUSES';
  branchIds: string[];
  schoolId?: string;
  steps: AdmissionProcessStepConfig[];
}

const ACTIVE_PROCESS_CATALOG: ActiveProcessRegistryItem[] = [
  {
    id: 'proc_general_k12',
    name: 'General Admission Process',
    code: 'AP-GEN-2026',
    versionId: 'ver_proc_gen_v1',
    versionNumber: 1,
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    steps: [
      { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission Application', category: 'APPLICATION', isRequired: true, sortOrder: 1, attachedFormName: 'Online Pre-Registration 2026–2027' },
      { id: 's2', stepType: 'APPLICATION_REVIEW', displayName: 'Verification', category: 'APPLICATION', isRequired: true, sortOrder: 2 },
      { id: 's_test_1', stepType: 'ASSESSMENT_TEST', displayName: 'Entrance Test', category: 'ASSESSMENT', isRequired: true, sortOrder: 3, testConfig: { testRequired: true, assessmentName: 'Entrance Test', mode: 'HYBRID', passMarks: 50, totalMarks: 100, resultPublishingRule: 'AFTER_STAFF_APPROVAL' } },
      { id: 's_int_1', stepType: 'INTERVIEW', displayName: 'Candidate Interview', category: 'ASSESSMENT', isRequired: true, sortOrder: 4 },
      { id: 's_dec_1', stepType: 'ADMISSION_DECISION', displayName: 'Admission Decision', category: 'DECISION', isRequired: true, sortOrder: 5 },
      { id: 's3', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission Form', category: 'CONFIRMATION', isRequired: true, sortOrder: 6, attachedFormName: 'Formal Admission Package 2026–27' },
      { id: 's4', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 7, isSystemTerminal: true },
    ],
  },
  {
    id: 'proc_simple_adm',
    name: 'Simple Direct Admission',
    code: 'AP-SMP-2026',
    versionId: 'ver_proc_smp_v1',
    versionNumber: 1,
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: [CAMPUS_IDS.CLIFTON_JR_CAMPUS, CAMPUS_IDS.PECHS_CAMPUS],
    steps: [
      { id: 's_smp_1', stepType: 'PRE_ADMISSION', displayName: 'Online Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1, attachedFormName: 'Online Pre-Registration 2026–2027' },
      { id: 's_smp_2', stepType: 'APPLICATION_REVIEW', displayName: 'Verification', category: 'APPLICATION', isRequired: true, sortOrder: 2 },
      { id: 's_smp_3', stepType: 'DOCUMENT_VERIFICATION', displayName: 'Document Verification', category: 'CONFIRMATION', isRequired: true, sortOrder: 3 },
      { id: 's_smp_4', stepType: 'ADMISSION_FEE', displayName: 'Admission Fee Payment', category: 'PAYMENT', isRequired: true, sortOrder: 4 },
      { id: 's_smp_5', stepType: 'STUDENT_REGISTRATION', displayName: 'Enrollment', category: 'SYSTEM', isRequired: true, sortOrder: 5, isSystemTerminal: true },
    ],
  },
  {
    id: 'proc_alevel_detailed',
    name: 'A-Level Comprehensive Admission',
    code: 'AP-ALV-2026',
    versionId: 'ver_proc_alv_v1',
    versionNumber: 1,
    applyTo: 'SELECTED_CAMPUSES',
    schoolId: SCHOOL_IDS.HORIZON,
    branchIds: [CAMPUS_IDS.ISLAMABAD_CAMPUS],
    steps: [
      { id: 'ad1', stepType: 'PRE_ADMISSION', displayName: 'Online Application & O-Level Transcripts', category: 'APPLICATION', isRequired: true, sortOrder: 1, attachedFormName: 'A-Level Pre-Registration 2026' },
      { id: 'ad2', stepType: 'APPLICATION_REVIEW', displayName: 'Verification', category: 'APPLICATION', isRequired: true, sortOrder: 2 },
      { id: 'ad3', stepType: 'DOCUMENT_VERIFICATION', displayName: 'Equivalence & Statement of Entry', category: 'CONFIRMATION', isRequired: true, sortOrder: 3 },
      { id: 'ad4', stepType: 'ASSESSMENT_TEST', displayName: 'Placement Assessment', category: 'ASSESSMENT', isRequired: true, sortOrder: 4, testConfig: { testRequired: true, assessmentName: 'A-Level Placement Test', mode: 'HYBRID', passMarks: 60, totalMarks: 100, resultPublishingRule: 'AFTER_STAFF_APPROVAL' } },
      { id: 'ad5', stepType: 'INTERVIEW', displayName: 'Dean Panel Interview', category: 'ASSESSMENT', isRequired: true, sortOrder: 5 },
      { id: 'ad6', stepType: 'ADMISSION_DECISION', displayName: 'Conditional Offer Letter', category: 'DECISION', isRequired: true, sortOrder: 6 },
      { id: 'ad7', stepType: 'ADMISSION_FEE', displayName: 'Security Deposit & Admission Fee', category: 'PAYMENT', isRequired: true, sortOrder: 7 },
      { id: 'ad8', stepType: 'STUDENT_REGISTRATION', displayName: 'Student ID Generation', category: 'SYSTEM', isRequired: true, sortOrder: 8, isSystemTerminal: true },
    ],
  },
];

export function resolveNextProcessStep(
  app: any,
  completedStepTypeOrId?: string
): {
  stepId: string | null;
  stepName: string | null;
  stepType: string | null;
  isTerminal?: boolean;
} {
  const proc =
    ACTIVE_PROCESS_CATALOG.find((p) => p.id === app.processDefinitionId) ||
    ACTIVE_PROCESS_CATALOG[0];

  if (!proc || !proc.steps || proc.steps.length === 0) {
    return { stepId: null, stepName: null, stepType: null };
  }

  // If unverified and no completed step specified, stay at verification
  if (!completedStepTypeOrId && app.verificationStatus === 'UNVERIFIED') {
    const reviewStep = proc.steps.find((s) => s.stepType === 'APPLICATION_REVIEW') || proc.steps[0];
    return {
      stepId: reviewStep?.id || null,
      stepName: reviewStep?.displayName || 'Verification',
      stepType: reviewStep?.stepType || 'APPLICATION_REVIEW',
    };
  }

  let currentIndex = -1;
  if (completedStepTypeOrId) {
    const target = completedStepTypeOrId.toLowerCase();
    currentIndex = proc.steps.findIndex(
      (s) =>
        s.id.toLowerCase() === target ||
        s.stepType.toLowerCase() === target ||
        (target === 'verification' && s.stepType === 'APPLICATION_REVIEW') ||
        (target === 'test' && s.stepType === 'ASSESSMENT_TEST') ||
        (target === 'assessment' && s.stepType === 'ASSESSMENT_TEST') ||
        (target === 'interview' && s.stepType === 'INTERVIEW') ||
        (target === 'decision' && s.stepType === 'ADMISSION_DECISION')
    );
  }

  if (currentIndex === -1 && app.currentStepId) {
    currentIndex = proc.steps.findIndex((s) => s.id === app.currentStepId);
  }

  if (currentIndex === -1 && app.currentStepType) {
    currentIndex = proc.steps.findIndex((s) => s.stepType === app.currentStepType);
  }

  // Find next enabled/required step after currentIndex
  const startSearch = currentIndex >= 0 ? currentIndex + 1 : 2;
  for (let i = startSearch; i < proc.steps.length; i++) {
    const step = proc.steps[i];
    if (step && step.isRequired !== false) {
      return {
        stepId: step.id,
        stepName: step.displayName,
        stepType: step.stepType,
        isTerminal: step.isSystemTerminal || false,
      };
    }
  }

  // If no subsequent step found, journey complete
  return {
    stepId: null,
    stepName: 'Completed / Enrolled',
    stepType: 'COMPLETED',
    isTerminal: true,
  };
}

export function resolveNextStepAfterVerification(app: any): {
  stepId: string | null;
  stepName: string | null;
  stepType: string | null;
} {
  return resolveNextProcessStep(app, 'APPLICATION_REVIEW');
}

// ─────────────────────────────────────────────────────────────
// APPLICATION REVIEW: SCHOOL POLICIES & HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

export interface SchoolApplicationReviewPolicy {
  schoolId: string;
  documents: RequiredDocumentConfigDto[];
  feePolicy: ApplicationFeePolicyDto;
}

export const SCHOOL_REVIEW_POLICIES: Record<string, SchoolApplicationReviewPolicy> = {
  // Beacon Horizon Public School (School A - Payment Required Before Test)
  [SCHOOL_IDS.BEACON]: {
    schoolId: SCHOOL_IDS.BEACON,
    documents: [
      { code: 'DOC_BFORM', name: 'Student B-Form / Birth Certificate', isRequired: true, instructions: 'Official NADRA B-Form or computerized Birth Certificate' },
      { code: 'DOC_FATHER_CNIC', name: 'Father / Guardian CNIC', isRequired: true, instructions: 'Front and back of father or guardian computerized CNIC' },
      { code: 'DOC_STUDENT_PHOTO', name: 'Student Photograph', isRequired: false, instructions: 'Recent passport-sized photo with blue or white background' },
    ],
    feePolicy: {
      feeEnabled: true,
      feeName: 'Pre-Admission Application Processing Fee',
      amount: 2000,
      currency: 'PKR',
      collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
      paymentInstructions: 'Please transfer PKR 2,000 to our Meezan Bank account or via EasyPaisa/JazzCash before the test date.',
      bankAccountDetails: {
        bankName: 'Meezan Bank Ltd',
        accountTitle: 'Alpha Academy Collection - Beacon Campus',
        accountNumber: '0102-0103456789',
        iban: 'PK45MEZN0001020103456789',
        branchCode: '0102',
      },
      mobileWallets: {
        easypaisa: '0300-1234567',
        jazzcash: '0301-7654321',
        title: 'Alpha Academy Admissions',
      },
      qrCodeUrl: '/assets/qr-meezan-beacon.png',
      voucherEnabled: true,
      paymentVerificationRequired: true,
    },
  },
  // City Grammar School (School B - Payment Allowed on Test Day)
  [SCHOOL_IDS.CITY]: {
    schoolId: SCHOOL_IDS.CITY,
    documents: [
      { code: 'DOC_BFORM', name: 'Student B-Form', isRequired: true, instructions: 'Computerized B-Form copy' },
      { code: 'DOC_FATHER_CNIC', name: 'Father CNIC', isRequired: true, instructions: 'Valid Father CNIC' },
      { code: 'DOC_BIRTH_CERT', name: 'Birth Certificate', isRequired: true, instructions: 'NADRA or Union Council certified birth record' },
      { code: 'DOC_PREV_RESULT', name: 'Previous Academic Progress Report', isRequired: false, instructions: 'Last term report card if transferring from another school' },
    ],
    feePolicy: {
      feeEnabled: true,
      feeName: 'Pre-Admission Assessment Fee',
      amount: 1500,
      currency: 'PKR',
      collectionRule: 'PAYMENT_ALLOWED_ON_TEST_DAY',
      paymentInstructions: 'You may pay PKR 1,500 online or directly at the campus accounting desk on the day of the Entrance Test.',
      bankAccountDetails: {
        bankName: 'Habib Bank Limited (HBL)',
        accountTitle: 'City Grammar School Admissions',
        accountNumber: '1234-5678901234',
        iban: 'PK64HABB0012345678901234',
        branchCode: '1234',
      },
      mobileWallets: {
        easypaisa: '0312-9876543',
        title: 'City Grammar Admissions',
      },
      qrCodeUrl: '/assets/qr-hbl-city.png',
      voucherEnabled: true,
      paymentVerificationRequired: true,
    },
  },
  // Horizon Heights International (School C - Application Fee Disabled)
  [SCHOOL_IDS.HORIZON]: {
    schoolId: SCHOOL_IDS.HORIZON,
    documents: [
      { code: 'DOC_OLEV_TRANSCRIPT', name: 'O-Level Statement of Results', isRequired: true, instructions: 'Cambridge / Edexcel official statement of results' },
      { code: 'DOC_EQUIV_CERT', name: 'IBCC Equivalence Certificate', isRequired: true, instructions: 'Inter Board Coordination Commission (IBCC) certificate' },
      { code: 'DOC_PASSPORT', name: 'Applicant Passport Copy', isRequired: false, instructions: 'Valid passport info page if international student' },
    ],
    feePolicy: {
      feeEnabled: false,
      feeName: 'Application Processing Fee',
      amount: 0,
      currency: 'PKR',
      collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
      paymentInstructions: 'Application fee is waived for Horizon Heights candidates.',
      bankAccountDetails: {
        bankName: 'Standard Chartered Bank',
        accountTitle: 'Horizon International',
        accountNumber: '0000-00000000',
        iban: 'PK00SCBL00000000000000',
      },
      voucherEnabled: false,
      paymentVerificationRequired: false,
    },
  },
};

export function resolveApplicationReviewPolicyForScope(
  campusId?: string,
  schoolId?: string
): SchoolApplicationReviewPolicy {
  let resolvedSchoolId = schoolId;
  if (!resolvedSchoolId && campusId) {
    if ([CAMPUS_IDS.MAIN_CAMPUS, CAMPUS_IDS.CLIFTON_CAMPUS, CAMPUS_IDS.DHA_CAMPUS].includes(campusId)) {
      resolvedSchoolId = SCHOOL_IDS.BEACON;
    } else if ([CAMPUS_IDS.PECHS_CAMPUS, CAMPUS_IDS.CLIFTON_JR_CAMPUS].includes(campusId)) {
      resolvedSchoolId = SCHOOL_IDS.CITY;
    } else if (campusId === CAMPUS_IDS.ISLAMABAD_CAMPUS) {
      resolvedSchoolId = SCHOOL_IDS.HORIZON;
    }
  }

  return (
    SCHOOL_REVIEW_POLICIES[resolvedSchoolId || ''] ||
    SCHOOL_REVIEW_POLICIES[SCHOOL_IDS.BEACON]!
  );
}

export function performSystemDocumentCheck(doc: {
  documentCode: string;
  fileName: string;
  fileSize?: number;
  studentName?: string;
  fatherCnic?: string;
}): {
  status: 'PENDING' | 'CHECKED' | 'MATCHED' | 'POSSIBLE_MISMATCH' | 'UNREADABLE' | 'REVIEW_REQUIRED';
  remarks: string;
  extractedData: any;
} {
  const fileNameLower = (doc.fileName || '').toLowerCase();
  
  if (fileNameLower.includes('corrupt') || fileNameLower.includes('unreadable') || (doc.fileSize && doc.fileSize < 500)) {
    return {
      status: 'UNREADABLE',
      remarks: 'File appears damaged, unreadable, or insufficient resolution (advisory).',
      extractedData: { confidenceScore: 20, matchWithApplication: false, issues: ['UNREADABLE_IMAGE'] },
    };
  }

  if (
    fileNameLower.includes('mismatch') ||
    fileNameLower.includes('dummy') ||
    fileNameLower.includes('sample') ||
    fileNameLower.includes('blurry') ||
    fileNameLower.includes('lowres')
  ) {
    return {
      status: 'POSSIBLE_MISMATCH',
      remarks: 'Low resolution scan or advisory mismatch detected.',
      extractedData: {
        name: 'Mismatched Name Sample',
        cnicOrBForm: '42101-0000000-0',
        confidenceScore: 65,
        matchWithApplication: false,
        issues: ['NAME_MISMATCH', 'CNIC_MISMATCH'],
      },
    };
  }

  return {
    status: 'MATCHED',
    remarks: 'Document is readable and extracted metadata matches application profile.',
    extractedData: {
      name: doc.studentName || 'Student Name Verified',
      cnicOrBForm: doc.fatherCnic || '42201-1234567-1',
      confidenceScore: 96,
      matchWithApplication: true,
      issues: [],
    },
  };
}

export function computeApplicationReviewSummary(
  app: any,
  feePayment?: any,
  docs?: any[]
): ApplicationReviewSummaryDto {
  const policy = resolveApplicationReviewPolicyForScope(app.campusId, app.schoolId);
  const requiredDocs = policy.documents.filter((d) => d.isRequired);

  // 1. Data Verification Status (HUMAN VERIFIED ONLY)
  const isDataVerified = app.verificationStatus === 'STAFF_VERIFIED';
  
  let dataStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'INVALID' | 'UNVERIFIED' = 'UNVERIFIED';
  if (isDataVerified) dataStatus = 'VERIFIED';
  else if (app.verificationStatus === 'INVALID') dataStatus = 'INVALID';
  else if (app.verificationStatus === 'NEEDS_REVIEW' || app.verificationStatus === 'POSSIBLE_DUPLICATE') dataStatus = 'NEEDS_REVIEW';

  // 2. Documents Verification Status
  const requiredDocCodes = new Set(requiredDocs.map((d) => d.code));
  const verifiedDocsCount = docs && docs.length > 0
    ? docs.filter((d) => requiredDocCodes.has(d.documentCode) && d.staffVerificationStatus === 'STAFF_VERIFIED').length
    : (isDataVerified ? requiredDocs.length : 0);

  const totalDocsCount = docs && docs.length > 0 ? docs.length : requiredDocs.length;
  const hasRejectedRequiredDoc = docs && docs.length > 0 && docs.some((d) => d.staffVerificationStatus === 'REJECTED' || d.staffVerificationStatus === 'REUPLOAD_REQUESTED');

  let documentsStatus: 'ALL_VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_REQUIRED' = 'PENDING';
  if (requiredDocs.length === 0) {
    documentsStatus = 'NOT_REQUIRED';
  } else if (hasRejectedRequiredDoc) {
    documentsStatus = 'REJECTED';
  } else if (verifiedDocsCount >= requiredDocs.length) {
    documentsStatus = 'ALL_VERIFIED';
  }

  // 3. Application Fee Status
  let feeStatus: ApplicationFeePaymentStatus = 'PENDING';
  if (!policy.feePolicy.feeEnabled) {
    feeStatus = 'NOT_REQUIRED';
  } else if (feePayment?.paymentStatus) {
    feeStatus = feePayment.paymentStatus;
  } else if (app.feeStatus === 'PAID' || app.feeStatus === 'PAID_VERIFIED' || app.feeStatus === 'WAIVED') {
    feeStatus = app.feeStatus === 'WAIVED' ? 'WAIVED' : 'PAID_VERIFIED';
  } else if (isDataVerified && !feePayment) {
    feeStatus = 'PAID_VERIFIED';
  }

  // 4. Test Eligibility Evaluation
  const isDocsSatisfied = documentsStatus === 'ALL_VERIFIED' || documentsStatus === 'NOT_REQUIRED';
  
  let isFeeSatisfied = false;
  let feeEligibilityReason = '';

  if (feeStatus === 'NOT_REQUIRED') {
    isFeeSatisfied = true;
    feeEligibilityReason = 'Fee not required';
  } else if (feeStatus === 'PAID_VERIFIED' || feeStatus === 'WAIVED') {
    isFeeSatisfied = true;
    feeEligibilityReason = feeStatus === 'WAIVED' ? 'Fee waived' : 'Fee paid & verified';
  } else if (policy.feePolicy.collectionRule === 'PAYMENT_ALLOWED_ON_TEST_DAY') {
    isFeeSatisfied = true;
    feeEligibilityReason = 'Payment allowed on test day';
  } else {
    isFeeSatisfied = false;
    feeEligibilityReason = 'Payment required before test';
  }

  const isTestEligible = isDataVerified && isDocsSatisfied && isFeeSatisfied;

  // 5. Progress Fraction
  let completedSections = 0;
  if (isDataVerified) completedSections++;
  if (isDocsSatisfied) completedSections++;
  if (feeStatus === 'PAID_VERIFIED' || feeStatus === 'WAIVED' || feeStatus === 'NOT_REQUIRED') {
    completedSections++;
  }

  const progressFraction = `${completedSections}/3 Complete`;

  // 6. Overall Review Status
  let overallStatus: 'READY_FOR_TEST' | 'NEEDS_ATTENTION' | 'IN_PROGRESS' | 'COMPLETED' = 'IN_PROGRESS';
  if (app.status === 'COMPLETED') {
    overallStatus = 'COMPLETED';
  } else if (isTestEligible) {
    overallStatus = 'READY_FOR_TEST';
  } else if (dataStatus === 'NEEDS_REVIEW' || dataStatus === 'INVALID' || documentsStatus === 'REJECTED' || feeStatus === 'MISMATCH') {
    overallStatus = 'NEEDS_ATTENTION';
  }

  // 7. Compact Test Candidate Badges
  const reviewBadge = 'Review ✓';
  let feeBadge = 'Fee ⏳ Pending';
  if (feeStatus === 'PAID_VERIFIED' || feeStatus === 'WAIVED') {
    feeBadge = feeStatus === 'WAIVED' ? 'Fee ✓ Waived' : 'Fee ✓ Paid';
  } else if (feeStatus === 'NOT_REQUIRED') {
    feeBadge = 'Fee: N/A';
  } else if (policy.feePolicy.collectionRule === 'PAYMENT_ALLOWED_ON_TEST_DAY') {
    feeBadge = 'Fee ⏳ Test-Day Payment';
  }

  return {
    overallStatus,
    progressFraction,
    dataStatus,
    documentsStatus,
    documentsVerifiedCount: verifiedDocsCount,
    documentsRequiredCount: requiredDocs.length,
    documentsTotalCount: totalDocsCount,
    feeStatus,
    feeAmount: policy.feePolicy.amount,
    feeCurrency: policy.feePolicy.currency,
    feeCollectionRule: policy.feePolicy.collectionRule,
    isTestEligible,
    testEligibilityReason: isTestEligible
      ? 'All review criteria satisfied for Test stage'
      : !isDataVerified
      ? 'Data unverified'
      : !isDocsSatisfied
      ? 'Required documents pending'
      : feeEligibilityReason,
    testCandidateIndicator: {
      reviewBadge,
      feeBadge,
      isReady: isTestEligible,
    },
  };
}

@Injectable()
export class AdmissionsService {
  public testSchedules: TestScheduleDto[] = [];
  public testAssignments: TestScheduleAssignmentDto[] = [];
  public interviewSchedules: InterviewScheduleDto[] = [];
  public interviewAssignments: InterviewAssignmentDto[] = [];
  public charges: AdmissionChargeDto[] = [];

  private readonly txManager: TenantTransactionManager;
  private readonly auditService: AuditService;
  public readonly workingContextService: WorkingContextService;

  constructor(
    @Optional() txManagerOrContextService?: TenantTransactionManager | WorkingContextService,
    @Optional() auditService?: AuditService,
    @Optional() workingContextService?: WorkingContextService
  ) {
    if (txManagerOrContextService && ('resolveEffectiveScope' in (txManagerOrContextService as any) || (txManagerOrContextService as any) instanceof WorkingContextService)) {
      this.txManager = createTenantManager();
      this.auditService = new AuditService(this.txManager);
      this.workingContextService = txManagerOrContextService as WorkingContextService;
    } else {
      this.txManager = (txManagerOrContextService as TenantTransactionManager) || createTenantManager();
      this.auditService = auditService || new AuditService(this.txManager);
      this.workingContextService = workingContextService || new WorkingContextService();
    }
    this.seedNonPreAdmissionModules();
  }

  private seedNonPreAdmissionModules() {
    const orgId = CANONICAL_ORG_ID_A;
    const now = new Date();

    this.testSchedules.push(
      {
        id: 'ts_clifton_g6',
        organizationId: orgId,
        scheduleCode: 'TST-2026-0041',
        name: 'Entrance Test — Grade 6',
        processDefinitionId: 'proc_general_k12',
        processVersionId: 'ver_proc_gen_v1',
        processStepId: 's_test_1',
        processStepName: 'Entrance Test',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Year 2026–2027',
        classIds: ['cls-g6'],
        classNames: ['Grade 6'],
        mode: 'PAPER_BASED',
        date: '2026-08-26',
        reportingTime: '09:30',
        startTime: '10:00',
        endTime: '11:30',
        durationMinutes: 90,
        venueType: 'CAMPUS',
        venueCampusId: CAMPUS_IDS.CLIFTON_CAMPUS,
        venueCampusName: 'Clifton Campus',
        venueBuilding: 'Academic Block B',
        venueRoom: 'Room 204',
        venueInstructions: 'Arrive 30 minutes prior with physical Admit Card and stationery.',
        totalMarks: 100,
        passMarks: 50,
        resultPublishingRule: 'AFTER_STAFF_APPROVAL',
        status: 'SCHEDULED',
        totalCandidatesCount: 48,
        attendedCount: 0,
        passedCount: 0,
        failedCount: 0,
        resultsStatus: 'Not Started',
        createdBy: 'Admin Lead',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ts_g3_diagnostic',
        organizationId: orgId,
        scheduleCode: 'TST-2026-0042',
        name: 'Diagnostic Assessment — Grade 3',
        processDefinitionId: 'proc_general_k12',
        processVersionId: 'ver_proc_gen_v1',
        processStepId: 's_test_1',
        processStepName: 'Diagnostic Assessment',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Year 2026–2027',
        classIds: ['cls-g3'],
        classNames: ['Grade 3'],
        mode: 'COMPUTER_BASED',
        date: '2026-08-28',
        reportingTime: '09:00',
        startTime: '09:30',
        endTime: '10:30',
        durationMinutes: 60,
        venueType: 'CAMPUS',
        venueCampusId: CAMPUS_IDS.MAIN_CAMPUS,
        venueCampusName: 'Main Campus (Gulshan)',
        venueBuilding: 'IT Center',
        venueRoom: 'Computer Lab 1',
        venueInstructions: 'CampusOS secure browser login will be provided on-screen.',
        totalMarks: 50,
        passMarks: 30,
        resultPublishingRule: 'AUTOMATIC_AFTER_EVALUATION',
        status: 'SCHEDULED',
        totalCandidatesCount: 32,
        attendedCount: 0,
        passedCount: 0,
        failedCount: 0,
        resultsStatus: 'Not Started',
        createdBy: 'Admissions Officer',
        createdAt: now,
        updatedAt: now,
      }
    );

    this.testAssignments.push(
      {
        id: 't_cand_1',
        testScheduleId: 'ts_clifton_g6',
        testScheduleCode: 'TST-2026-0041',
        testName: 'Entrance Test — Grade 6',
        preAdmissionId: 'app_121',
        applicationNumber: 'APP-2026-00121',
        studentName: 'Ahmed Ali Khan',
        className: 'Grade 6',
        classId: 'cls-g6',
        applicantCampusId: CAMPUS_IDS.CLIFTON_CAMPUS,
        applicantCampusName: 'Clifton Campus',
        venueCampusId: CAMPUS_IDS.CLIFTON_CAMPUS,
        venueCampusName: 'Clifton Campus',
        venueRoom: 'Room 204',
        scheduledDate: '2026-08-26',
        reportingTime: '09:30',
        scheduledTime: '10:00',
        durationMinutes: 90,
        mode: 'PAPER_BASED',
        status: 'SCHEDULED',
        resultStatus: 'DRAFT',
        createdAt: now,
        updatedAt: now,
      }
    );

    this.interviewSchedules.push({
      id: 'is_clifton_panel',
      organizationId: orgId,
      date: '2026-09-08',
      startTime: '09:00',
      endTime: '12:00',
      campusId: CAMPUS_IDS.CLIFTON_CAMPUS,
      campusName: 'Clifton Campus',
      venueRoom: 'Executive Conference Room',
      mode: 'PHYSICAL',
      interviewerRole: 'Principal / Vice Principal',
      interviewerName: 'Dr. Tariq Mehmood',
      totalSlots: 6,
      bookedSlots: 1,
      slots: [
        { id: 'slot_1', startTime: '09:00', endTime: '09:20', isBooked: true, applicationId: 'app_121', studentName: 'Ahmed Ali' },
        { id: 'slot_2', startTime: '09:20', endTime: '09:40', isBooked: false },
        { id: 'slot_3', startTime: '09:40', endTime: '10:00', isBooked: false },
      ],
      createdAt: now,
    });
  }

  private async ensureInitialSeed(tx: any, orgId: string) {
    const existing = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(preAdmissions)
      .where(eq(preAdmissions.organizationId, orgId));

    if (Number(existing[0]?.count) > 0) {
      return;
    }

    const schoolsList = [
      {
        id: SCHOOL_IDS.BEACON,
        name: 'Beacon Horizon Public School',
        campuses: [
          { id: CAMPUS_IDS.MAIN_CAMPUS, name: 'Main Campus (Gulshan)' },
          { id: CAMPUS_IDS.CLIFTON_CAMPUS, name: 'Clifton Campus' },
          { id: CAMPUS_IDS.DHA_CAMPUS, name: 'DHA Phase 6 Campus' },
        ],
      },
      {
        id: SCHOOL_IDS.CITY,
        name: 'City Grammar School',
        campuses: [
          { id: CAMPUS_IDS.PECHS_CAMPUS, name: 'PECHS Senior Campus' },
          { id: CAMPUS_IDS.CLIFTON_JR_CAMPUS, name: 'Clifton Junior Campus' },
        ],
      },
      {
        id: SCHOOL_IDS.HORIZON,
        name: 'Horizon Heights International',
        campuses: [
          { id: CAMPUS_IDS.ISLAMABAD_CAMPUS, name: 'Islamabad Capital Campus' },
        ],
      },
    ];

    const academicYearsList = [
      { id: 'ay_2026_2027', name: 'Academic Year 2026–2027' },
      { id: 'ay_2025_2026', name: 'Academic Year 2025–2026' },
    ];

    const classesList = [
      { id: 'cls-ey1', name: 'Playgroup (EY-1)' },
      { id: 'cls-kg', name: 'Kindergarten (KG)' },
      { id: 'cls-g1', name: 'Grade 1' },
      { id: 'cls-g3', name: 'Grade 3' },
      { id: 'cls-g5', name: 'Grade 5' },
      { id: 'cls-g7', name: 'Grade 7' },
      { id: 'cls-g9', name: 'Grade 9 (O-Levels)' },
      { id: 'cls-a1', name: 'A-Levels Year 1' },
    ];

    const studentProfiles = [
      { name: 'Ahmed Ali', gender: 'MALE', dob: '2018-03-12', father: 'Muhammad Ali', mobile: '0300-1234567', email: 'm.ali@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Fatima Zahra', gender: 'FEMALE', dob: '2019-07-24', father: 'Tariq Mehmood', mobile: '0321-9876543', email: 'tariq.m@example.com', status: 'SUBMITTED', source: 'STAFF_ENTRY' },
      { name: 'Zainab Qureshi', gender: 'FEMALE', dob: '2016-11-05', father: 'Farhan Qureshi', mobile: '0333-5551234', email: 'f.qureshi@example.com', status: 'IN_PROGRESS', source: 'WALK_IN' },
      { name: 'Bilal Khan', gender: 'MALE', dob: '2015-05-18', father: 'Imran Khan', mobile: '0345-4447890', email: 'imran.k@example.com', status: 'ON_HOLD', source: 'ONLINE' },
      { name: 'Areeba Hassan', gender: 'FEMALE', dob: '2014-09-30', father: 'Hassan Raza', mobile: '0301-2223344', email: 'hassan.r@example.com', status: 'COMPLETED', source: 'ONLINE' },
      { name: 'Mustafa Siddiqui', gender: 'MALE', dob: '2020-01-15', father: 'Adnan Siddiqui', mobile: '0312-8889900', email: 'adnan.s@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Hamza Tariq', gender: 'MALE', dob: '2017-08-14', father: 'Tariq Aziz', mobile: '0302-3334455', email: 'tariq.aziz@example.com', status: 'APPROVED', source: 'STAFF_ENTRY' },
      { name: 'Maryam Nawaz', gender: 'FEMALE', dob: '2018-12-01', father: 'Nawaz Sharif', mobile: '0323-4445566', email: 'nawaz.s@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Usman Farooq', gender: 'MALE', dob: '2016-04-20', father: 'Farooq Ahmed', mobile: '0344-5556677', email: 'farooq.a@example.com', status: 'APPROVED', source: 'WALK_IN' },
      { name: 'Ayesha Siddiqua', gender: 'FEMALE', dob: '2019-02-28', father: 'Siddiq Jan', mobile: '0305-6667788', email: 'siddiq.j@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Saad Rafique', gender: 'MALE', dob: '2015-10-10', father: 'Rafique Khan', mobile: '0334-7778899', email: 'rafique.k@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Mahnoor Baloch', gender: 'FEMALE', dob: '2017-06-05', father: 'Mir Baloch', mobile: '0313-8889900', email: 'mir.b@example.com', status: 'COMPLETED', source: 'STAFF_ENTRY' },
      { name: 'Ibrahim Memon', gender: 'MALE', dob: '2020-09-18', father: 'Iqbal Memon', mobile: '0324-9990011', email: 'iqbal.m@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Hania Amir', gender: 'FEMALE', dob: '2018-05-14', father: 'Amir Liaquat', mobile: '0346-0001122', email: 'amir.l@example.com', status: 'ON_HOLD', source: 'ONLINE' },
      { name: 'Daniyal Zafar', gender: 'MALE', dob: '2014-11-22', father: 'Zafar Iqbal', mobile: '0306-1112233', email: 'zafar.i@example.com', status: 'APPROVED', source: 'WALK_IN' },
      { name: 'Eshal Fatima', gender: 'FEMALE', dob: '2019-03-09', father: 'Kashif Ali', mobile: '0335-2223344', email: 'kashif.a@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Zohaib Hassan', gender: 'MALE', dob: '2016-07-19', father: 'Hassan Nisar', mobile: '0314-3334455', email: 'hassan.n@example.com', status: 'SUBMITTED', source: 'STAFF_ENTRY' },
      { name: 'Manahil Khan', gender: 'FEMALE', dob: '2017-01-30', father: 'Asim Khan', mobile: '0325-4445566', email: 'asim.k@example.com', status: 'APPROVED', source: 'ONLINE' },
      { name: 'Rayyan Shah', gender: 'MALE', dob: '2018-10-12', father: 'Syed Shah', mobile: '0347-5556677', email: 'syed.shah@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Anaya Rehman', gender: 'FEMALE', dob: '2020-04-05', father: 'Rehman Malik', mobile: '0307-6667788', email: 'rehman.m@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Shahmeer Ali', gender: 'MALE', dob: '2015-08-16', father: 'Zahid Hussain', mobile: '0336-7778899', email: 'zahid.h@example.com', status: 'APPROVED', source: 'WALK_IN' },
      { name: 'Rameen Tariq', gender: 'FEMALE', dob: '2019-12-25', father: 'Tariq Jamil', mobile: '0315-8889900', email: 'tariq.j@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Zaviyar Abbasi', gender: 'MALE', dob: '2017-03-14', father: 'Hamza Abbasi', mobile: '0326-9990011', email: 'hamza.a@example.com', status: 'SUBMITTED', source: 'STAFF_ENTRY' },
      { name: 'Mirha Bilal', gender: 'FEMALE', dob: '2018-09-08', father: 'Bilal Saeed', mobile: '0348-0001122', email: 'bilal.s@example.com', status: 'COMPLETED', source: 'ONLINE' },
      { name: 'Farhan Zaidi', gender: 'MALE', dob: '2016-02-17', father: 'Ali Zaidi', mobile: '0308-1112233', email: 'ali.z@example.com', status: 'APPROVED', source: 'ONLINE' },
      { name: 'Kinza Hashmi', gender: 'FEMALE', dob: '2014-06-29', father: 'Sohail Hashmi', mobile: '0337-2223344', email: 'sohail.h@example.com', status: 'ON_HOLD', source: 'WALK_IN' },
      { name: 'Aariz Sheikh', gender: 'MALE', dob: '2020-11-11', father: 'Salman Sheikh', mobile: '0316-3334455', email: 'salman.s@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Alizeh Shah', gender: 'FEMALE', dob: '2017-07-07', father: 'Khurram Shah', mobile: '0327-4445566', email: 'khurram.s@example.com', status: 'IN_PROGRESS', source: 'STAFF_ENTRY' },
      { name: 'Rohaan Dar', gender: 'MALE', dob: '2018-04-18', father: 'Ishaq Dar', mobile: '0349-5556677', email: 'ishaq.d@example.com', status: 'APPROVED', source: 'ONLINE' },
      { name: 'Hoorain Fatima', gender: 'FEMALE', dob: '2019-10-02', father: 'Waseem Akram', mobile: '0309-6667788', email: 'waseem.a@example.com', status: 'SUBMITTED', source: 'ONLINE' },
    ];

    const allCampuses = schoolsList.flatMap((s) => s.campuses.map((c) => ({ ...c, schoolId: s.id })));

    for (let idx = 0; idx < studentProfiles.length; idx++) {
      const p = studentProfiles[idx]!;
      const appNum = 121 + idx;
      const appNo = `APP-2026-${String(appNum).padStart(5, '0')}`;

      const campusObj = allCampuses[idx % allCampuses.length]!;
      const academicYear = academicYearsList[idx % academicYearsList.length]!;
      const cls = classesList[idx % classesList.length]!;

      const appliedDate = new Date();
      appliedDate.setDate(appliedDate.getDate() - (idx % 25));

      const isTestStageCandidate = idx === 0 || idx === 8;
      const isFlaggedDummy = idx === 24;
      const isFlaggedDuplicate = idx === 25;
      const isFlaggedInvalid = idx === 26;

      let studentName = p.name;
      let primaryMobile = p.mobile;
      let fatherCnic = `42101-${String(1000000 + idx).slice(0, 7)}-${(idx % 9) + 1}`;
      let verificationStatus: PreAdmissionVerificationStatus =
        p.status === 'APPROVED' || p.status === 'COMPLETED' || isTestStageCandidate ? 'STAFF_VERIFIED' : 'UNVERIFIED';

      const verificationIssues: any[] = [];
      if (isFlaggedDummy) {
        studentName = 'test applicant';
        primaryMobile = '12345';
        verificationStatus = 'NEEDS_REVIEW';
        verificationIssues.push({ code: 'SUSPICIOUS_DUMMY_DATA', severity: 'WARNING', field: 'studentName', message: 'Name appears to be sample data' });
      } else if (isFlaggedDuplicate) {
        studentName = 'Ahmed Ali';
        fatherCnic = '42101-1000000-1';
        verificationStatus = 'POSSIBLE_DUPLICATE';
        verificationIssues.push({ code: 'POSSIBLE_DUPLICATE', severity: 'WARNING', field: 'studentName', message: 'Matches Ahmed Ali' });
      } else if (isFlaggedInvalid) {
        primaryMobile = '999';
        verificationStatus = 'INVALID';
        verificationIssues.push({ code: 'INVALID_MOBILE', severity: 'ERROR', field: 'primaryMobile', message: 'Phone format error' });
      }

      const processMatch = isTestStageCandidate
        ? ACTIVE_PROCESS_CATALOG[0]!
        : this.resolveProcessForScope(campusObj.id, campusObj.schoolId);

      const rawSubmission = {
        studentFirstName: studentName.split(' ')[0],
        studentLastName: studentName.split(' ').slice(1).join(' ') || 'Student',
        fatherName: p.father,
        primaryMobile,
        fatherCnic,
        dateOfBirth: p.dob,
        gender: p.gender,
        primaryEmail: p.email,
      };

      const [insertedApp] = await tx.insert(preAdmissions).values({
        organizationId: orgId,
        schoolId: campusObj.schoolId,
        campusId: campusObj.id,
        applicationNumber: appNo,
        academicYearId: academicYear.id,
        academicYearName: academicYear.name,
        classId: cls.id,
        className: cls.name,
        formDefinitionId: 'f_prereg_2026',
        formName: 'Online Pre-Registration 2026–2027',
        publishedFormVersionId: 'v1.0',
        formVersionNumber: 1,
        studentName,
        gender: p.gender as any,
        dateOfBirth: p.dob,
        fatherOrGuardianName: p.father,
        fatherCnic,
        primaryMobile,
        primaryEmail: p.email,
        source: p.source as any,
        status: p.status,
        verificationStatus,
        verificationIssues,
        isCorrected: false,
        submissionData: rawSubmission,
        originalSubmissionSnapshot: rawSubmission,
        customFieldsData: {},
        processDefinitionId: processMatch?.id || null,
        processName: processMatch?.name || null,
        processVersionId: processMatch?.versionId || null,
        currentStepId: isTestStageCandidate ? 's_test_1' : 's2',
        currentStepName: isTestStageCandidate ? 'Entrance Test' : 'Verification',
        currentStepType: isTestStageCandidate ? 'ASSESSMENT_TEST' : 'APPLICATION_REVIEW',
        journeyStatus: p.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        submittedAt: appliedDate,
      }).returning();

      if (insertedApp) {
        const reviewPolicy = resolveApplicationReviewPolicyForScope(campusObj.id, campusObj.schoolId);

        // Seed documents
        for (const docConfig of reviewPolicy.documents) {
          const isDocVerified = isTestStageCandidate || p.status === 'APPROVED' || p.status === 'COMPLETED' || appNo === 'APP-2026-00124';
          const hasMismatch = isFlaggedDummy && docConfig.code === 'DOC_BFORM';

          await tx.insert(preAdmissionDocuments).values({
            organizationId: orgId,
            schoolId: campusObj.schoolId,
            campusId: campusObj.id,
            applicationId: insertedApp.id,
            documentCode: docConfig.code,
            documentName: docConfig.name,
            fileKey: `uploads/${insertedApp.id}/${docConfig.code}.pdf`,
            fileUrl: `/api/admissions/documents/preview/${insertedApp.id}/${docConfig.code}`,
            fileName: `${studentName.replace(/\s+/g, '_')}_${docConfig.code}.pdf`,
            fileSize: 1024 * 350,
            mimeType: 'application/pdf',
            isRequired: docConfig.isRequired,
            systemVerificationStatus: hasMismatch ? 'POSSIBLE_MISMATCH' : 'MATCHED',
            systemCheckRemarks: hasMismatch ? 'Advisory: Extracted data differs from application form' : 'Advisory: File verified readable and matched',
            extractedData: { name: studentName, cnic: fatherCnic, confidenceScore: hasMismatch ? 60 : 95 },
            staffVerificationStatus: isDocVerified ? 'STAFF_VERIFIED' : (hasMismatch ? 'UNVERIFIED' : (docConfig.isRequired ? 'STAFF_VERIFIED' : 'UNVERIFIED')),
            staffNotes: isDocVerified ? 'Verified during initial intake' : undefined,
            verifiedBy: isDocVerified ? 'Admissions Officer' : undefined,
            verifiedAt: isDocVerified ? new Date() : undefined,
            version: 1,
          });
        }

        // Seed Application Fee Payment
        const feePol = reviewPolicy.feePolicy;
        const isScenarioA_Verified = idx === 0 || isTestStageCandidate || p.status === 'APPROVED' || p.status === 'COMPLETED';
        const isScenarioA_Ready = idx === 1;
        const isScenarioB_Mismatch = idx === 2;
        const isScenarioC_MissingSlip = idx === 3;
        const isScenarioD_UnreadableSlip = idx === 4;

        let seedFeeAmount = feePol.amount;
        let seedReceiptUrl: string | undefined = `/api/admissions/documents/preview/${insertedApp.id}/DOC_FEE_RECEIPT`;
        let seedStatus: ApplicationFeePaymentStatus = 'PENDING';
        let seedTxn = `TXN-MEZ-${100000 + idx}`;
        let seedDate = '2026-08-20';

        if (isScenarioA_Verified) {
          seedStatus = 'PAID_VERIFIED';
        } else if (isScenarioA_Ready) {
          seedStatus = 'SUBMITTED';
          seedDate = '2026-08-21';
        } else if (isScenarioB_Mismatch) {
          seedFeeAmount = 1500; // Mismatch with required 2000
          seedDate = '2026-08-22';
        } else if (isScenarioC_MissingSlip) {
          seedReceiptUrl = undefined; // Slip Missing
          seedDate = '2026-08-23';
        } else if (isScenarioD_UnreadableSlip) {
          seedReceiptUrl = `/api/admissions/documents/preview/${insertedApp.id}/DOC_FEE_RECEIPT_UNREADABLE`;
          seedDate = '2026-08-24';
          // Also insert unreadable fee doc
          await tx.insert(preAdmissionDocuments).values({
            organizationId: orgId,
            schoolId: campusObj.schoolId,
            campusId: campusObj.id,
            applicationId: insertedApp.id,
            documentCode: 'DOC_FEE_RECEIPT',
            documentName: 'Application Fee Payment Slip',
            fileKey: `uploads/${insertedApp.id}/DOC_FEE_RECEIPT.pdf`,
            fileUrl: seedReceiptUrl,
            fileName: `${studentName.replace(/\s+/g, '_')}_FeeReceipt.pdf`,
            fileSize: 1024 * 220,
            mimeType: 'application/pdf',
            isRequired: true,
            systemVerificationStatus: 'UNREADABLE',
            systemCheckRemarks: 'Advisory: Image blur / unreadable text; human inspection required',
            staffVerificationStatus: 'UNVERIFIED',
            version: 1,
          });
        }

        await tx.insert(preAdmissionFeePayments).values({
          organizationId: orgId,
          schoolId: campusObj.schoolId,
          campusId: campusObj.id,
          applicationId: insertedApp.id,
          feeName: feePol.feeName,
          amount: seedFeeAmount,
          currency: feePol.currency,
          collectionRule: feePol.collectionRule,
          paymentStatus: !feePol.feeEnabled ? 'NOT_REQUIRED' : seedStatus,
          paymentMethod: 'BANK_TRANSFER',
          transactionReference: seedTxn,
          voucherReference: `VCH-${appNo}-${1000 + idx}`,
          paymentDate: seedDate,
          receiptFileUrl: seedReceiptUrl,
          payerName: p.father,
          verifiedBy: isScenarioA_Verified ? 'Accounts Officer' : undefined,
          verifiedAt: isScenarioA_Verified ? new Date() : undefined,
        });
      }
    }
  }

  private resolveClassName(classId: string): string {
    const classNames: Record<string, string> = {
      'cls-ey1': 'Playgroup (EY-1)',
      'cls-kg': 'Kindergarten (KG)',
      'cls-g1': 'Grade 1',
      'cls-g2': 'Grade 2',
      'cls-g3': 'Grade 3',
      'cls-g4': 'Grade 4',
      'cls-g5': 'Grade 5',
      'cls-g6': 'Grade 6',
      'cls-g7': 'Grade 7',
      'cls-g8': 'Grade 8',
      'cls-g9': 'Grade 9 (O-Levels)',
      'cls-a1': 'A-Levels Year 1',
    };
    return classNames[classId] || 'Selected Grade';
  }

  private resolveProcessForScope(campusId: string, schoolId?: string): ActiveProcessRegistryItem | null {
    const directCampusMatch = ACTIVE_PROCESS_CATALOG.find(
      (p) => p.applyTo === 'SELECTED_CAMPUSES' && p.branchIds.includes(campusId)
    );
    if (directCampusMatch) return directCampusMatch;

    if (schoolId) {
      const schoolMatch = ACTIVE_PROCESS_CATALOG.find(
        (p) => p.applyTo === 'SELECTED_CAMPUSES' && p.schoolId === schoolId
      );
      if (schoolMatch) return schoolMatch;
    }

    const universal = ACTIVE_PROCESS_CATALOG.find((p) => p.applyTo === 'ALL_CAMPUSES');
    return universal || null;
  }

  private mapRowToDto(r: any): PreAdmissionApplicationDto {
    const campusMap: Record<
      string,
      { name: string; schoolName: string; regionId: string; regionName: string; headOfficeId: string; headOfficeName: string }
    > = {
      [CAMPUS_IDS.MAIN_CAMPUS]: {
        name: 'Main Campus (Gulshan)',
        schoolName: 'Beacon Horizon Public School',
        regionId: 'reg_south',
        regionName: 'Southern Region',
        headOfficeId: 'ho_alpha',
        headOfficeName: 'Alpha Academy Head Office',
      },
      [CAMPUS_IDS.CLIFTON_CAMPUS]: {
        name: 'Clifton Campus',
        schoolName: 'Beacon Horizon Public School',
        regionId: 'reg_south',
        regionName: 'Southern Region',
        headOfficeId: 'ho_alpha',
        headOfficeName: 'Alpha Academy Head Office',
      },
      [CAMPUS_IDS.DHA_CAMPUS]: {
        name: 'DHA Phase 6 Campus',
        schoolName: 'Beacon Horizon Public School',
        regionId: 'reg_south',
        regionName: 'Southern Region',
        headOfficeId: 'ho_alpha',
        headOfficeName: 'Alpha Academy Head Office',
      },
      [CAMPUS_IDS.PECHS_CAMPUS]: {
        name: 'PECHS Senior Campus',
        schoolName: 'City Grammar School',
        regionId: 'reg_south',
        regionName: 'Southern Region',
        headOfficeId: 'ho_alpha',
        headOfficeName: 'Alpha Academy Head Office',
      },
      [CAMPUS_IDS.CLIFTON_JR_CAMPUS]: {
        name: 'Clifton Junior Campus',
        schoolName: 'City Grammar School',
        regionId: 'reg_south',
        regionName: 'Southern Region',
        headOfficeId: 'ho_alpha',
        headOfficeName: 'Alpha Academy Head Office',
      },
      [CAMPUS_IDS.ISLAMABAD_CAMPUS]: {
        name: 'Islamabad Capital Campus',
        schoolName: 'Horizon Heights International',
        regionId: 'reg_north',
        regionName: 'Northern Region',
        headOfficeId: 'ho_alpha',
        headOfficeName: 'Alpha Academy Head Office',
      },
    };

    const cInfo = campusMap[r.campusId] || {
      name: 'Selected Campus',
      schoolName: 'Beacon Horizon Public School',
      regionId: 'reg_south',
      regionName: 'Southern Region',
      headOfficeId: 'ho_alpha',
      headOfficeName: 'Alpha Academy Head Office',
    };

    return {
      id: r.id,
      organizationId: r.organizationId,
      schoolId: r.schoolId,
      schoolName: cInfo.schoolName,
      campusId: r.campusId,
      campusName: cInfo.name,
      regionId: cInfo.regionId,
      regionName: cInfo.regionName,
      headOfficeId: cInfo.headOfficeId,
      headOfficeName: cInfo.headOfficeName,
      applicationNumber: r.applicationNumber,
      academicYearId: r.academicYearId,
      academicYearName: r.academicYearName || 'Academic Year 2026–2027',
      classId: r.classId,
      className: r.className || 'Target Grade',
      boardId: r.boardId || undefined,
      boardName: r.boardName || undefined,
      formDefinitionId: r.formDefinitionId,
      formName: r.formName || 'Online Pre-Registration 2026–2027',
      publishedFormVersionId: r.publishedFormVersionId || undefined,
      formVersionNumber: r.formVersionNumber || 1,
      studentName: r.studentName,
      gender: r.gender,
      dateOfBirth: r.dateOfBirth,
      fatherOrGuardianName: r.fatherOrGuardianName,
      fatherCnic: r.fatherCnic || undefined,
      primaryMobile: r.primaryMobile,
      primaryEmail: r.primaryEmail || undefined,
      source: r.source,
      status: r.status,
      verificationStatus: r.verificationStatus,
      verifiedBy: r.verifiedBy || undefined,
      verifiedAt: r.verifiedAt || undefined,
      verificationMethod: r.verificationMethod || undefined,
      verificationOverrideReason: r.verificationOverrideReason || undefined,
      verificationIssues: (r.verificationIssues as VerificationIssue[]) || [],
      isCorrected: r.isCorrected || false,
      submissionData: r.submissionData || {},
      originalSubmissionSnapshot: r.originalSubmissionSnapshot || r.submissionData || {},
      customFieldsData: r.customFieldsData || {},
      processDefinitionId: r.processDefinitionId || undefined,
      processName: r.processName || undefined,
      processVersionId: r.processVersionId || undefined,
      processVersionNumber: r.processVersionNumber || undefined,
      currentStepId: r.currentStepId || undefined,
      currentStepName: r.currentStepName || undefined,
      currentStepType: r.currentStepType || undefined,
      journeyStatus: r.journeyStatus,
      journey: (r.journeyData as AdmissionJourneyDto) || undefined,
      submittedAt: r.submittedAt || r.createdAt,
      submittedByUserId: r.submittedByUserId || undefined,
      submittedByRole: r.submittedByRole || undefined,
      applicationReview: computeApplicationReviewSummary(r, r.feePayment, r.documents),
      feePayment: r.feePayment || undefined,
      documents: r.documents || undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  // -------------------------------------------------------------
  // Working Context Engine API
  // -------------------------------------------------------------
  public getAuthorizedWorkingContexts(userScope: UserScopeContext) {
    return this.workingContextService.listAuthorizedContexts(userScope);
  }

  public getEffectiveScope(
    userScope: UserScopeContext,
    contextNodeId?: string,
    contextNodeType?: WorkingContextNodeType
  ): EffectiveScopeDto {
    return this.workingContextService.resolveEffectiveScope(userScope, contextNodeId, contextNodeType);
  }

  // -------------------------------------------------------------
  // Pre-Admissions List (PostgreSQL / Drizzle Persisted)
  // -------------------------------------------------------------
  public async getPreAdmissions(
    filter: PreAdmissionsFilterDto = {},
    userScope?: UserScopeContext
  ): Promise<PaginatedPreAdmissionsDto> {
    const orgId = userScope?.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope || { organizationId: orgId },
        filter.contextNodeId,
        filter.contextNodeType
      );

      const effectiveCampusIds = effectiveScope.effectiveCampusIds;
      if (!effectiveCampusIds || effectiveCampusIds.length === 0) {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: filter.limit || 25,
          totalPages: 0,
          summary: {
            totalPreAdmissions: 0,
            totalApplications: 0,
            newSubmitted: 0,
            inProcess: 0,
            completed: 0,
            pendingReview: 0,
            approved: 0,
            enrolled: 0,
          },
        };
      }

      await this.ensureInitialSeed(tx, orgId);

      const conditions = [
        eq(preAdmissions.organizationId, orgId),
        inArray(preAdmissions.campusId, effectiveCampusIds),
      ];

      if (filter.status && filter.status !== 'ALL') {
        conditions.push(eq(preAdmissions.status, filter.status));
      }
      if (filter.source && filter.source !== 'ALL') {
        conditions.push(eq(preAdmissions.source, filter.source));
      }
      if (filter.campusId && filter.campusId !== 'ALL') {
        conditions.push(eq(preAdmissions.campusId, filter.campusId));
      }
      if (filter.classId && filter.classId !== 'ALL') {
        conditions.push(eq(preAdmissions.classId, filter.classId));
      }
      if (filter.academicYearId && filter.academicYearId !== 'ALL') {
        conditions.push(eq(preAdmissions.academicYearId, filter.academicYearId));
      }
      if (filter.processDefinitionId && filter.processDefinitionId !== 'ALL') {
        conditions.push(eq(preAdmissions.processDefinitionId, filter.processDefinitionId));
      }
      if (filter.verificationStatus && filter.verificationStatus !== 'ALL') {
        if (filter.verificationStatus === 'PENDING_VERIFICATION') {
          conditions.push(
            and(
              eq(preAdmissions.verificationStatus, 'UNVERIFIED'),
              sql`jsonb_array_length(${preAdmissions.verificationIssues}) = 0`
            )!
          );
        } else if (filter.verificationStatus === 'VERIFIED') {
          conditions.push(eq(preAdmissions.verificationStatus, 'STAFF_VERIFIED'));
        } else {
          conditions.push(eq(preAdmissions.verificationStatus, filter.verificationStatus));
        }
      }
      if (filter.search?.trim()) {
        const term = `%${filter.search.trim()}%`;
        conditions.push(
          or(
            ilike(preAdmissions.studentName, term),
            ilike(preAdmissions.applicationNumber, term),
            ilike(preAdmissions.primaryMobile, term),
            ilike(preAdmissions.fatherOrGuardianName, term),
            ilike(preAdmissions.primaryEmail, term)
          )!
        );
      }

      const page = Math.max(1, filter.page || 1);
      const limit = Math.min(500, Math.max(1, filter.limit || 25));
      const offset = (page - 1) * limit;

      // 1. High-performance aggregate summary counts (single SQL roundtrip, index-backed)
      const [summaryRow] = await tx
        .select({
          total: sql<number>`count(*)::int`,
          newSubmitted: sql<number>`count(*) filter (where ${preAdmissions.status} = 'SUBMITTED')::int`,
          inProcess: sql<number>`count(*) filter (where ${preAdmissions.status} in ('IN_PROGRESS', 'ON_HOLD'))::int`,
          completed: sql<number>`count(*) filter (where ${preAdmissions.status} in ('COMPLETED', 'APPROVED'))::int`,
          pendingReview: sql<number>`count(*) filter (where ${preAdmissions.verificationStatus} = 'NEEDS_REVIEW')::int`,
          approved: sql<number>`count(*) filter (where ${preAdmissions.status} = 'APPROVED')::int`,
          enrolled: sql<number>`count(*) filter (where ${preAdmissions.status} = 'COMPLETED')::int`,
        })
        .from(preAdmissions)
        .where(and(...conditions));

      const total = Number(summaryRow?.total || 0);
      const totalPages = Math.ceil(total / limit) || 1;

      // 2. Strict server-side bounded pagination query
      const paginatedRows = await tx
        .select()
        .from(preAdmissions)
        .where(and(...conditions))
        .orderBy(desc(preAdmissions.submittedAt))
        .limit(limit)
        .offset(offset);

      const items: PreAdmissionApplicationDto[] = paginatedRows.map((r: any) => this.mapRowToDto(r));

      const summary = {
        totalPreAdmissions: total,
        totalApplications: total,
        newSubmitted: Number(summaryRow?.newSubmitted || 0),
        inProcess: Number(summaryRow?.inProcess || 0),
        completed: Number(summaryRow?.completed || 0),
        pendingReview: Number(summaryRow?.pendingReview || 0),
        approved: Number(summaryRow?.approved || 0),
        enrolled: Number(summaryRow?.enrolled || 0),
      };

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        summary,
      };
    });
  }

  // -------------------------------------------------------------
  // Pre-Admission Detail (PostgreSQL Persisted + Context Guard)
  // -------------------------------------------------------------
  public async getPreAdmissionById(
    id: string,
    userScope?: UserScopeContext,
    contextNodeId?: string,
    contextNodeType?: WorkingContextNodeType
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope?.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      await this.ensureInitialSeed(tx, orgId);

      const [row] = await tx
        .select()
        .from(preAdmissions)
        .where(
          and(
            eq(preAdmissions.organizationId, orgId),
            or(eq(preAdmissions.id, id), eq(preAdmissions.applicationNumber, id))
          )
        );

      if (!row) {
        throw new NotFoundException(`Pre-admission application '${id}' not found.`);
      }

      if (userScope) {
        const effectiveScope = this.workingContextService.resolveEffectiveScope(
          userScope,
          contextNodeId || userScope.workingContext?.nodeId,
          contextNodeType || userScope.workingContext?.nodeType
        );
        if (!effectiveScope.effectiveCampusIds.includes(row.campusId)) {
          throw new ForbiddenException(
            `Access Denied: Application '${id}' belongs to campus '${row.campusId}', which is outside your active working context '${effectiveScope.selectedNodeName}'.`
          );
        }
      }

      return this.mapRowToDto(row);
    });
  }

  // -------------------------------------------------------------
  // Create Pre-Admission (PostgreSQL Persisted + Ownership Checks)
  // -------------------------------------------------------------
  public async createPreAdmission(
    dto: CreatePreAdmissionDto,
    userScope?: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope?.organizationId || CANONICAL_ORG_ID_A;

    if (!dto.campusId) {
      throw new BadRequestException('Campus is required for Pre-Admission.');
    }

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      await this.ensureInitialSeed(tx, orgId);

      if (userScope) {
        const effectiveScope = this.workingContextService.resolveEffectiveScope(
          userScope,
          dto.contextNodeId || userScope.workingContext?.nodeId,
          dto.contextNodeType || userScope.workingContext?.nodeType
        );
        if (!effectiveScope.effectiveCampusIds.includes(dto.campusId)) {
          throw new ForbiddenException(
            `Cannot create pre-admission for campus '${dto.campusId}'. It is outside your active working context '${effectiveScope.selectedNodeName}'.`
          );
        }
      }

      const [branch] = await tx
        .select()
        .from(branches)
        .where(and(eq(branches.organizationId, orgId), eq(branches.id, dto.campusId)));

      let schoolId = branch?.schoolId || dto.schoolId;
      if (!schoolId) {
        const campusMap: Record<string, string> = {
          [CAMPUS_IDS.MAIN_CAMPUS]: SCHOOL_IDS.BEACON,
          [CAMPUS_IDS.CLIFTON_CAMPUS]: SCHOOL_IDS.BEACON,
          [CAMPUS_IDS.DHA_CAMPUS]: SCHOOL_IDS.BEACON,
          [CAMPUS_IDS.PECHS_CAMPUS]: SCHOOL_IDS.CITY,
          [CAMPUS_IDS.ISLAMABAD_CAMPUS]: SCHOOL_IDS.HORIZON,
        };
        schoolId = campusMap[dto.campusId] || SCHOOL_IDS.BEACON;
      }

      if (dto.schoolId && branch && branch.schoolId && dto.schoolId !== branch.schoolId) {
        throw new BadRequestException(
          `Invalid Organizational Scope: Campus '${dto.campusId}' belongs to school '${branch.schoolId}', but '${dto.schoolId}' was provided.`
        );
      }

      const [maxRow] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(preAdmissions)
        .where(eq(preAdmissions.organizationId, orgId));
      const nextSeq = (Number(maxRow?.count) || 0) + 151;
      const appNo = `PA-2026-${String(nextSeq).padStart(5, '0')}`;

      const raw = dto.formData || {};
      const studentFirstName = (dto as any).studentFirstName || raw.studentFirstName || raw.STUDENT_FIRST_NAME || dto.studentName?.split(' ')[0] || 'Applicant';
      const studentLastName = (dto as any).studentLastName || raw.studentLastName || raw.STUDENT_LAST_NAME || dto.studentName?.split(' ').slice(1).join(' ') || 'Student';
      const studentName = dto.studentName || `${studentFirstName} ${studentLastName}`.trim();
      const gender = dto.gender || raw.gender || raw.GENDER || 'MALE';
      const dateOfBirth = dto.dateOfBirth || raw.dateOfBirth || raw.STD_DOB || '2018-01-01';
      const fatherOrGuardianName = dto.fatherOrGuardianName || raw.fatherName || raw.FATHER_NAME || raw.FAT_NAME || 'Parent / Guardian';
      const fatherCnic = (raw.fatherCnic || raw.FAT_CNIC || raw.FATHER_CNIC || null) as string | null;
      const primaryMobile = dto.primaryMobile || raw.primaryMobile || raw.FATHER_MOBILE || raw.FAT_MOBILE || '0300-0000000';
      const primaryEmail = dto.primaryEmail || raw.primaryEmail || raw.EMAIL || null;

      const canonicalKeys = new Set([
        'studentFirstName', 'studentLastName', 'STUDENT_FIRST_NAME', 'STUDENT_LAST_NAME',
        'gender', 'GENDER', 'dateOfBirth', 'STD_DOB', 'fatherName', 'FATHER_NAME', 'FAT_NAME',
        'fatherCnic', 'FAT_CNIC', 'FATHER_CNIC', 'primaryMobile', 'FATHER_MOBILE', 'FAT_MOBILE',
        'primaryEmail', 'EMAIL', 'previousSchool', 'PREV_SCH',
      ]);
      const customFieldsData: Record<string, any> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (!canonicalKeys.has(k)) customFieldsData[k] = v;
      }

      const verificationIssues: any[] = [];
      let initialVerStatus: PreAdmissionVerificationStatus = 'UNVERIFIED';

      if (primaryMobile && !isValidMobile(primaryMobile)) {
        verificationIssues.push({
          code: 'INVALID_MOBILE',
          severity: 'ERROR',
          field: 'primaryMobile',
          message: `Phone number format invalid (Received: ${primaryMobile}). Expected valid mobile number.`,
        });
      }

      if (primaryEmail && !isValidEmail(primaryEmail)) {
        verificationIssues.push({
          code: 'INVALID_EMAIL',
          severity: 'ERROR',
          field: 'primaryEmail',
          message: `Invalid email address format (Received: ${primaryEmail}).`,
        });
      }

      if (fatherCnic && !isValidCnic(fatherCnic)) {
        verificationIssues.push({
          code: 'INVALID_CNIC',
          severity: 'ERROR',
          field: 'fatherCnic',
          message: `Invalid CNIC format. Expected 13 digits (Received: ${fatherCnic}).`,
        });
      }

      if (['test', 'asdf', 'abc', 'dummy', 'fake'].some((d) => studentName.toLowerCase().includes(d))) {
        verificationIssues.push({
          code: 'SUSPICIOUS_DUMMY_DATA',
          severity: 'WARNING',
          field: 'studentName',
          message: 'Student name appears to be sample or test data.',
        });
      }

      const existingMatches = await tx
        .select()
        .from(preAdmissions)
        .where(
          and(
            eq(preAdmissions.organizationId, orgId),
            or(
              ilike(preAdmissions.studentName, studentName),
              eq(preAdmissions.primaryMobile, primaryMobile),
              fatherCnic ? eq(preAdmissions.fatherCnic, fatherCnic) : sql`1=0`
            )
          )
        );

      if (existingMatches.length > 0 && existingMatches[0]) {
        const match = existingMatches[0];
        verificationIssues.push({
          code: 'POSSIBLE_DUPLICATE',
          severity: 'WARNING',
          field: 'studentName',
          message: `Potential duplicate with Application #${match.applicationNumber} (${match.studentName}).`,
          matchedApplicationId: match.id,
          matchedApplicationNumber: match.applicationNumber,
          matchedReasons: ['Matching Name or Phone Number'],
        });
      }

      if (verificationIssues.some((i) => i.severity === 'ERROR' || i.code === 'POSSIBLE_DUPLICATE')) {
        initialVerStatus = verificationIssues.some((i) => i.code === 'POSSIBLE_DUPLICATE') ? 'POSSIBLE_DUPLICATE' : 'NEEDS_REVIEW';
      } else if (verificationIssues.length === 0) {
        initialVerStatus = 'AUTO_VERIFIED';
      }

      const processBinding = this.resolveProcessForScope(dto.campusId, schoolId);

      const [inserted] = await tx
        .insert(preAdmissions)
        .values({
          organizationId: orgId,
          schoolId,
          campusId: dto.campusId,
          applicationNumber: appNo,
          academicYearId: dto.academicYearId || 'ay_2026_2027',
          academicYearName: 'Academic Year 2026–2027',
          classId: dto.classId || 'cls-g1',
          className: this.resolveClassName(dto.classId || 'cls-g1'),
          formDefinitionId: dto.formDefinitionId || 'f_prereg_2026',
          formName: dto.formDefinitionId === 'f_prereg_2026' ? 'Online Pre-Registration 2026–2027' : 'Formal Admission Package',
          publishedFormVersionId: dto.publishedFormVersionId || 'v1.0',
          formVersionNumber: 1,
          studentName,
          gender: gender as any,
          dateOfBirth,
          fatherOrGuardianName,
          fatherCnic,
          primaryMobile,
          primaryEmail,
          source: (dto.source || 'ONLINE') as any,
          status: 'SUBMITTED',
          verificationStatus: initialVerStatus,
          verificationIssues,
          isCorrected: false,
          submissionData: raw,
          originalSubmissionSnapshot: { ...raw, ...dto, studentFirstName, studentLastName, studentName, fatherOrGuardianName, primaryMobile },
          customFieldsData,
          processDefinitionId: processBinding?.id || null,
          processName: processMatchName(processBinding),
          processVersionId: processBinding?.versionId || null,
          processVersionNumber: processBinding?.versionNumber || null,
          currentStepId: processBinding?.steps?.[0]?.id || null,
          currentStepName: processBinding?.steps?.[0]?.displayName || null,
          currentStepType: processBinding?.steps?.[0]?.stepType || null,
          journeyStatus: processBinding ? 'IN_PROGRESS' : 'NO_PROCESS',
          submittedAt: new Date(),
        })
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'CREATE',
          entityType: 'pre_admission',
          entityId: inserted!.id,
          afterState: inserted,
        },
        tx
      );

      return this.mapRowToDto(inserted);
    });
  }

  // -------------------------------------------------------------
  // Edit Operational Data (Preserves Immutable Snapshot)
  // -------------------------------------------------------------
  public async editOperationalData(
    dto: EditOperationalDataDto,
    userScope: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)));

      if (!existing) {
        throw new NotFoundException(`Application '${dto.applicationId}' not found.`);
      }

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(existing.campusId)) {
        throw new ForbiddenException(
          `Access Denied: Application '${dto.applicationId}' is outside your active working context.`
        );
      }

      // Re-evaluate issues after correction
      const currentIssues = ((existing.verificationIssues as VerificationIssue[]) || []).filter((issue) => {
        if (issue.code === 'INVALID_CNIC' || (issue.field === 'fatherCnic' && dto.fatherCnic)) {
          const cnic = (dto.fatherCnic !== undefined ? dto.fatherCnic : existing.fatherCnic) || '';
          if (/^\d{5}-\d{7}-\d{1}$/.test(cnic.trim())) return false; // Resolved
        }
        if (issue.code === 'INVALID_MOBILE' || (issue.field === 'primaryMobile' && dto.primaryMobile)) {
          const mobile = (dto.primaryMobile !== undefined ? dto.primaryMobile : existing.primaryMobile) || '';
          if (/^03\d{2}-?\d{7}$/.test(mobile.trim())) return false; // Resolved
        }
        return true;
      });

      let updatedVerificationStatus = existing.verificationStatus;
      if (currentIssues.length === 0 && (existing.verificationStatus === 'INVALID' || existing.verificationStatus === 'NEEDS_REVIEW' || existing.verificationStatus === 'UNVERIFIED')) {
        updatedVerificationStatus = 'STAFF_VERIFIED';
      }

      const currentSubData = (existing.submissionData as Record<string, any>) || {};
      const updatedSubData = {
        ...currentSubData,
        studentName: dto.studentName ? dto.studentName.trim() : existing.studentName,
        fatherOrGuardianName: dto.fatherOrGuardianName ? dto.fatherOrGuardianName.trim() : existing.fatherOrGuardianName,
        primaryMobile: dto.primaryMobile ? dto.primaryMobile.trim() : existing.primaryMobile,
        fatherCnic: dto.fatherCnic !== undefined ? dto.fatherCnic : existing.fatherCnic,
        primaryEmail: dto.primaryEmail !== undefined ? dto.primaryEmail : existing.primaryEmail,
        dateOfBirth: dto.dateOfBirth ? dto.dateOfBirth : existing.dateOfBirth,
        gender: dto.gender ? dto.gender : existing.gender,
      };

      const [updated] = await tx
        .update(preAdmissions)
        .set({
          studentName: dto.studentName ? dto.studentName.trim() : existing.studentName,
          fatherOrGuardianName: dto.fatherOrGuardianName ? dto.fatherOrGuardianName.trim() : existing.fatherOrGuardianName,
          primaryMobile: dto.primaryMobile ? dto.primaryMobile.trim() : existing.primaryMobile,
          fatherCnic: dto.fatherCnic !== undefined ? dto.fatherCnic : existing.fatherCnic,
          primaryEmail: dto.primaryEmail !== undefined ? dto.primaryEmail : existing.primaryEmail,
          dateOfBirth: dto.dateOfBirth ? dto.dateOfBirth : existing.dateOfBirth,
          gender: dto.gender ? dto.gender : existing.gender,
          submissionData: updatedSubData,
          verificationIssues: currentIssues,
          verificationStatus: updatedVerificationStatus,
          isCorrected: true,
          updatedAt: new Date(),
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'UPDATE_OPERATIONAL_DATA',
          entityType: 'pre_admission',
          entityId: dto.applicationId,
          beforeState: existing,
          afterState: updated,
          diff: { reason: { before: '', after: dto.correctionReason || 'Data corrected during verification review' } },
        },
        tx
      );

      return this.mapRowToDto(updated);
    });
  }

  // -------------------------------------------------------------
  // Mark Application as Verified
  // -------------------------------------------------------------
  public async markApplicationVerified(
    dto: { applicationId: string; notes?: string },
    userScope: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)));

      if (!app) {
        throw new NotFoundException(`Application '${dto.applicationId}' not found.`);
      }

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(
          `Access Denied: Application '${dto.applicationId}' is outside your active working context.`
        );
      }

      const now = new Date();
      let newStatus: PreAdmissionStatus = app.status as any;
      if (newStatus === 'SUBMITTED') {
        newStatus = 'IN_PROGRESS';
      }

      const nextStepInfo = resolveNextStepAfterVerification(app);

      const [updated] = await tx
        .update(preAdmissions)
        .set({
          status: newStatus,
          verificationStatus: 'STAFF_VERIFIED',
          verifiedBy: userScope.userRole || 'Admissions Staff',
          verifiedAt: now,
          verificationMethod: 'STAFF',
          verificationOverrideReason: dto.notes || null,
          currentStepId: nextStepInfo.stepId || app.currentStepId,
          currentStepName: nextStepInfo.stepName || app.currentStepName,
          currentStepType: nextStepInfo.stepType || app.currentStepType,
          journeyStatus: 'IN_PROGRESS',
          updatedAt: now,
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)))
        .returning();

      // Ensure any unverified documents are approved by staff action
      await tx
        .update(preAdmissionDocuments)
        .set({
          staffVerificationStatus: 'STAFF_VERIFIED',
          verifiedBy: userScope.userRole || 'Admissions Staff',
          verifiedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(preAdmissionDocuments.organizationId, orgId),
            eq(preAdmissionDocuments.applicationId, dto.applicationId),
            eq(preAdmissionDocuments.staffVerificationStatus, 'UNVERIFIED')
          )
        );

      // Ensure any pending fee payment is marked verified by staff action
      await tx
        .update(preAdmissionFeePayments)
        .set({
          paymentStatus: 'PAID_VERIFIED',
          verifiedBy: userScope.userRole || 'Admissions Staff',
          verifiedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(preAdmissionFeePayments.organizationId, orgId),
            eq(preAdmissionFeePayments.applicationId, dto.applicationId),
            eq(preAdmissionFeePayments.paymentStatus, 'PENDING')
          )
        );

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'MARK_VERIFIED',
          entityType: 'pre_admission',
          entityId: dto.applicationId,
          beforeState: app,
          afterState: updated,
          diff: {
            verificationStatus: { before: app.verificationStatus, after: 'STAFF_VERIFIED' },
            notes: { before: '', after: dto.notes || '' },
          },
        },
        tx
      );

      return this.mapRowToDto(updated);
    });
  }

  // -------------------------------------------------------------
  // Bulk Mark Applications as Verified
  // -------------------------------------------------------------
  public async bulkMarkApplicationsVerified(
    dto: { applicationIds: string[]; notes?: string },
    userScope: UserScopeContext
  ): Promise<{ verifiedCount: number; updatedApplicationIds: string[]; message: string }> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    const requestedIds = dto.applicationIds || [];

    if (requestedIds.length === 0) {
      return { verifiedCount: 0, updatedApplicationIds: [], message: 'No applications selected.' };
    }

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );

      const targetApps = await tx
        .select()
        .from(preAdmissions)
        .where(
          and(
            eq(preAdmissions.organizationId, orgId),
            inArray(preAdmissions.id, requestedIds),
            inArray(preAdmissions.campusId, effectiveScope.effectiveCampusIds)
          )
        );

      const eligibleApps = targetApps.filter((a) => {
        const isNotInactive = a.status !== 'INACTIVE' && a.verificationStatus !== 'INACTIVE' && a.status !== 'CANCELLED';
        return isNotInactive;
      });

      if (eligibleApps.length === 0) {
        return { verifiedCount: 0, updatedApplicationIds: [], message: 'No eligible active applications found to verify.' };
      }

      const now = new Date();
      const updatedIds: string[] = [];

      for (const app of eligibleApps) {
        const nextStepInfo = resolveNextStepAfterVerification(app);
        const newStatus = app.status === 'SUBMITTED' ? 'IN_PROGRESS' : app.status;

        const [upd] = await tx
          .update(preAdmissions)
          .set({
            status: newStatus,
            verificationStatus: 'STAFF_VERIFIED',
            verifiedBy: userScope.userRole || 'Admissions Staff',
            verifiedAt: now,
            verificationMethod: 'STAFF',
            verificationOverrideReason: dto.notes || null,
            currentStepId: nextStepInfo.stepId || app.currentStepId,
            currentStepName: nextStepInfo.stepName || app.currentStepName,
            currentStepType: nextStepInfo.stepType || app.currentStepType,
            journeyStatus: 'IN_PROGRESS',
            updatedAt: now,
          })
          .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, app.id)))
          .returning();

        if (upd) {
          updatedIds.push(upd.id);

          await tx
            .update(preAdmissionDocuments)
            .set({
              staffVerificationStatus: 'STAFF_VERIFIED',
              verifiedBy: userScope.userRole || 'Admissions Staff',
              verifiedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(preAdmissionDocuments.organizationId, orgId),
                eq(preAdmissionDocuments.applicationId, app.id),
                eq(preAdmissionDocuments.staffVerificationStatus, 'UNVERIFIED')
              )
            );

          await tx
            .update(preAdmissionFeePayments)
            .set({
              paymentStatus: 'PAID_VERIFIED',
              verifiedBy: userScope.userRole || 'Admissions Staff',
              verifiedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(preAdmissionFeePayments.organizationId, orgId),
                eq(preAdmissionFeePayments.applicationId, app.id),
                eq(preAdmissionFeePayments.paymentStatus, 'PENDING')
              )
            );
          await this.auditService.logEvent(
            {
              organizationId: orgId,
              actorId: '99999999-9999-9999-9999-999999999999',
              actorEmail: 'admin@campus-os.local',
              module: 'ADMISSIONS',
              action: 'BULK_MARK_VERIFIED',
              entityType: 'pre_admission',
              entityId: app.id,
              beforeState: app,
              afterState: upd,
              diff: {
                verificationStatus: { before: app.verificationStatus, after: 'STAFF_VERIFIED' },
                notes: { before: '', after: dto.notes || 'Bulk verified' },
              },
            },
            tx
          );
        }
      }

      return {
        verifiedCount: updatedIds.length,
        updatedApplicationIds: updatedIds,
        message: `Successfully verified ${updatedIds.length} application(s).`,
      };
    });
  }

  // -------------------------------------------------------------
  // Set Application Inactive
  // -------------------------------------------------------------
  public async setApplicationInactive(
    dto: { applicationId: string; reason?: string },
    userScope: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)));

      if (!app) {
        throw new NotFoundException(`Application '${dto.applicationId}' not found.`);
      }

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(
          `Access Denied: Application '${dto.applicationId}' is outside your active working context.`
        );
      }

      const now = new Date();
      const [updated] = await tx
        .update(preAdmissions)
        .set({
          status: 'INACTIVE',
          verificationStatus: 'INACTIVE',
          updatedAt: now,
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'SET_INACTIVE',
          entityType: 'pre_admission',
          entityId: dto.applicationId,
          beforeState: app,
          afterState: updated,
          diff: {
            status: { before: app.status, after: 'INACTIVE' },
            reason: { before: '', after: dto.reason || 'Application marked inactive' },
          },
        },
        tx
      );

      return this.mapRowToDto(updated);
    });
  }

  // -------------------------------------------------------------
  // Remove Pre-Admission (Soft Delete Archive)
  // -------------------------------------------------------------
  public async removePreAdmission(
    dto: { applicationId: string; reason: string },
    userScope: UserScopeContext
  ): Promise<{ success: boolean; id: string }> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)));

      if (!app) {
        throw new NotFoundException(`Application '${dto.applicationId}' not found.`);
      }

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(
          `Access Denied: Application '${dto.applicationId}' is outside your active working context.`
        );
      }

      if (!dto.reason || dto.reason.trim() === '') {
        throw new BadRequestException('A reason is required to remove an application.');
      }

      const now = new Date();
      const [updated] = await tx
        .update(preAdmissions)
        .set({
          status: 'CANCELLED',
          verificationStatus: 'INACTIVE',
          updatedAt: now,
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'REMOVE_APPLICATION',
          entityType: 'pre_admission',
          entityId: dto.applicationId,
          beforeState: app,
          afterState: updated,
          diff: {
            status: { before: app.status, after: 'CANCELLED' },
            reason: { before: '', after: dto.reason },
          },
        },
        tx
      );

      return { success: true, id: dto.applicationId };
    });
  }

  // -------------------------------------------------------------
  // Human Override Verification
  // -------------------------------------------------------------
  public async humanOverrideVerification(
    dto: HumanOverrideVerificationDto,
    userScope: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)));

      if (!app) {
        throw new NotFoundException(`Application '${dto.applicationId}' not found.`);
      }

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(
          `Access Denied: Application '${dto.applicationId}' is outside your active working context.`
        );
      }

      if (!dto.overrideReason || dto.overrideReason.trim() === '') {
        throw new BadRequestException('An override reason is required.');
      }

      const now = new Date();
      let newVerificationStatus: PreAdmissionVerificationStatus = app.verificationStatus as any;
      let newStatus: PreAdmissionStatus = app.status as any;

      if (dto.action === 'VERIFY_ANYWAY') {
        newVerificationStatus = 'STAFF_VERIFIED';
        if (newStatus === 'SUBMITTED') newStatus = 'IN_PROGRESS';
      } else if (dto.action === 'REJECT') {
        newStatus = 'REJECTED';
        newVerificationStatus = 'REJECTED';
      } else if (dto.action === 'KEEP_FOR_REVIEW') {
        newVerificationStatus = 'NEEDS_REVIEW';
      }

      const [updated] = await tx
        .update(preAdmissions)
        .set({
          status: newStatus,
          verificationStatus: newVerificationStatus,
          verifiedBy: userScope.userRole || 'Admissions Staff',
          verifiedAt: now,
          verificationMethod: 'OVERRIDE',
          verificationOverrideReason: dto.overrideReason,
          updatedAt: now,
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'HUMAN_OVERRIDE_VERIFICATION',
          entityType: 'pre_admission',
          entityId: dto.applicationId,
          beforeState: app,
          afterState: updated,
          diff: { action: { before: '', after: dto.action }, reason: { before: '', after: dto.overrideReason } },
        },
        tx
      );

      return this.mapRowToDto(updated);
    });
  }

  public overrideVerification(dto: HumanOverrideVerificationDto, userScope: UserScopeContext) {
    return this.humanOverrideVerification(dto, userScope);
  }

  // -------------------------------------------------------------
  // Bulk Verification of Clean Applications
  // -------------------------------------------------------------
  public async bulkVerifyCleanApplications(
    dto: BulkVerifyCleanRequestDto,
    userScope: UserScopeContext
  ): Promise<{ verifiedCount: number; advancedApplicationIds: string[]; remainingFlaggedCount: number }> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    const requestedIds = dto.applicationIds || [];

    if (requestedIds.length === 0) {
      return { verifiedCount: 0, advancedApplicationIds: [], remainingFlaggedCount: 0 };
    }

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );

      const targetApps = await tx
        .select()
        .from(preAdmissions)
        .where(
          and(
            eq(preAdmissions.organizationId, orgId),
            inArray(preAdmissions.id, requestedIds),
            inArray(preAdmissions.campusId, effectiveScope.effectiveCampusIds)
          )
        );

      const eligibleIds = targetApps
        .filter((a) => {
          const issues = (a.verificationIssues as VerificationIssue[]) || [];
          const isClean = issues.length === 0 && a.verificationStatus !== 'POSSIBLE_DUPLICATE' && a.verificationStatus !== 'INVALID';
          const isNotAlreadyVerified = a.verificationStatus !== 'STAFF_VERIFIED' && a.verificationStatus !== 'AUTO_VERIFIED' && a.verificationStatus !== 'VERIFIED';
          const isNotInactive = a.status !== 'INACTIVE' && a.verificationStatus !== 'INACTIVE' && a.status !== 'CANCELLED';
          return isClean && isNotAlreadyVerified && isNotInactive;
        })
        .map((a) => a.id);

      if (eligibleIds.length === 0) {
        return { verifiedCount: 0, advancedApplicationIds: [], remainingFlaggedCount: targetApps.length };
      }

      await tx
        .update(preAdmissions)
        .set({
          verificationStatus: 'STAFF_VERIFIED',
          verifiedBy: userScope.userRole || 'Admissions Staff',
          verifiedAt: new Date(),
          verificationMethod: 'STAFF',
          updatedAt: new Date(),
        })
        .where(and(eq(preAdmissions.organizationId, orgId), inArray(preAdmissions.id, eligibleIds)));

      return {
        verifiedCount: eligibleIds.length,
        advancedApplicationIds: eligibleIds,
        remainingFlaggedCount: targetApps.length - eligibleIds.length,
      };
    });
  }

  public async scanApplicationsForVerification(
    dto: VerifyApplicationsScanRequestDto & {
      filterTab?: string;
      filter?: any;
      contextNodeId?: string;
      contextNodeType?: WorkingContextNodeType;
    },
    userScope: UserScopeContext
  ): Promise<any> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        dto.filter?.contextNodeId || dto.contextNodeId || userScope.workingContext?.nodeId,
        dto.filter?.contextNodeType || dto.contextNodeType || userScope.workingContext?.nodeType
      );

      let baseWhere = and(
        eq(preAdmissions.organizationId, orgId),
        inArray(preAdmissions.campusId, effectiveScope.effectiveCampusIds)
      );

      if (dto.applicationIds && dto.applicationIds.length > 0) {
        baseWhere = and(baseWhere, inArray(preAdmissions.id, dto.applicationIds));
      }

      const rows = await tx
        .select()
        .from(preAdmissions)
        .where(baseWhere);

      const allItems: ApplicationVerificationScanItemDto[] = rows.map((r: any) => {
        const dtoItem = this.mapRowToDto(r);
        const issues: VerificationIssue[] = (r.verificationIssues as VerificationIssue[]) || [];
        const isVerified = r.verificationStatus === 'STAFF_VERIFIED' || r.verificationStatus === 'AUTO_VERIFIED' || r.verificationStatus === 'VERIFIED';
        const isInactive = r.status === 'INACTIVE' || r.verificationStatus === 'INACTIVE' || r.status === 'CANCELLED';
        const isClean = issues.length === 0;

        let computedStatus: 'CLEAN' | 'NEEDS_REVIEW' | 'POSSIBLE_DUPLICATE' | 'INVALID' | 'VERIFIED' | 'INACTIVE' = 'CLEAN';
        if (isInactive) {
          computedStatus = 'INACTIVE';
        } else if (isVerified) {
          computedStatus = 'VERIFIED';
        } else if (r.verificationStatus === 'POSSIBLE_DUPLICATE') {
          computedStatus = 'POSSIBLE_DUPLICATE';
        } else if (r.verificationStatus === 'INVALID' || issues.some((i: any) => i.severity === 'ERROR')) {
          computedStatus = 'INVALID';
        } else if (!isClean) {
          computedStatus = 'NEEDS_REVIEW';
        } else {
          computedStatus = 'CLEAN';
        }

        return {
          id: r.id,
          applicationNumber: r.applicationNumber,
          studentName: r.studentName,
          className: dtoItem.className || 'Grade',
          campusName: dtoItem.campusName || 'Campus',
          fatherOrGuardianName: r.fatherOrGuardianName,
          primaryMobile: r.primaryMobile,
          fatherCnic: r.fatherCnic || undefined,
          dateOfBirth: r.dateOfBirth,
          submittedAt: r.submittedAt || r.createdAt,
          source: r.source,
          currentVerificationStatus: r.verificationStatus,
          computedStatus: computedStatus as any,
          issues,
          matchedDuplicates: [],
        };
      });

      const cleanCount = allItems.filter((i) => i.computedStatus === 'CLEAN').length;
      const needsReviewCount = allItems.filter((i) => i.computedStatus === 'NEEDS_REVIEW').length;
      const duplicatesCount = allItems.filter((i) => i.computedStatus === 'POSSIBLE_DUPLICATE').length;
      const invalidCount = allItems.filter((i) => i.computedStatus === 'INVALID').length;
      const verifiedCount = allItems.filter((i) => (i.computedStatus as any) === 'VERIFIED').length;
      const inactiveCount = allItems.filter((i) => (i.computedStatus as any) === 'INACTIVE').length;
      const needsActionCount = cleanCount + needsReviewCount + duplicatesCount + invalidCount;

      let filteredItems = allItems;
      const filterTab = (dto as any).filterTab || (dto as any).tab || 'NEEDS_ACTION';

      if (filterTab === 'NEEDS_ACTION') {
        filteredItems = allItems.filter((i) => (i.computedStatus as any) !== 'VERIFIED' && (i.computedStatus as any) !== 'INACTIVE');
      } else if (filterTab === 'CLEAN' || filterTab === 'LOOKS_GOOD') {
        filteredItems = allItems.filter((i) => i.computedStatus === 'CLEAN');
      } else if (filterTab === 'NEEDS_REVIEW' || filterTab === 'REVIEW') {
        filteredItems = allItems.filter((i) => i.computedStatus === 'NEEDS_REVIEW');
      } else if (filterTab === 'DUPLICATES' || filterTab === 'POSSIBLE_DUPLICATE') {
        filteredItems = allItems.filter((i) => i.computedStatus === 'POSSIBLE_DUPLICATE');
      } else if (filterTab === 'INVALID') {
        filteredItems = allItems.filter((i) => i.computedStatus === 'INVALID');
      } else if (filterTab === 'VERIFIED') {
        filteredItems = allItems.filter((i) => (i.computedStatus as any) === 'VERIFIED');
      } else if (filterTab === 'INACTIVE') {
        filteredItems = allItems.filter((i) => (i.computedStatus as any) === 'INACTIVE');
      } else if (filterTab === 'ALL') {
        filteredItems = allItems;
      }

      return {
        summary: {
          totalScanned: allItems.length,
          needsActionCount,
          looksGoodCount: cleanCount,
          needsReviewCount,
          possibleDuplicatesCount: duplicatesCount,
          invalidMissingDataCount: invalidCount,
          verifiedCount,
          inactiveCount,
        },
        items: filteredItems,
      };
    });
  }

  // -------------------------------------------------------------
  // Duplicate Application Comparison
  // -------------------------------------------------------------
  public async getDuplicateComparison(
    appId: string,
    duplicateAppId: string,
    userScope: UserScopeContext
  ): Promise<DuplicateComparisonResultDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    const currentApp = await this.getPreAdmissionById(appId, userScope);

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [existingRow] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, duplicateAppId)));

      if (!existingRow) {
        throw new NotFoundException(`Reference duplicate application '${duplicateAppId}' not found.`);
      }

      const existingApp = this.mapRowToDto(existingRow);

    const norm = (val: any) => String(val || '').trim().toLowerCase();

    const comparisonFields: DuplicateFieldComparisonDto[] = [
      {
        fieldKey: 'studentName',
        fieldLabel: 'Student Name',
        currentValue: currentApp.studentName,
        existingValue: existingApp.studentName,
        isMatch: norm(currentApp.studentName) === norm(existingApp.studentName),
      },
      {
        fieldKey: 'dateOfBirth',
        fieldLabel: 'Date of Birth',
        currentValue: currentApp.dateOfBirth,
        existingValue: existingApp.dateOfBirth,
        isMatch: currentApp.dateOfBirth === existingApp.dateOfBirth,
      },
      {
        fieldKey: 'gender',
        fieldLabel: 'Gender',
        currentValue: currentApp.gender,
        existingValue: existingApp.gender,
        isMatch: currentApp.gender === existingApp.gender,
      },
      {
        fieldKey: 'fatherOrGuardianName',
        fieldLabel: 'Father / Guardian Name',
        currentValue: currentApp.fatherOrGuardianName,
        existingValue: existingApp.fatherOrGuardianName,
        isMatch: norm(currentApp.fatherOrGuardianName) === norm(existingApp.fatherOrGuardianName),
      },
      {
        fieldKey: 'primaryMobile',
        fieldLabel: 'Primary Mobile',
        currentValue: currentApp.primaryMobile,
        existingValue: existingApp.primaryMobile,
        isMatch: currentApp.primaryMobile.replace(/[^0-9]/g, '') === existingApp.primaryMobile.replace(/[^0-9]/g, ''),
      },
      {
        fieldKey: 'primaryEmail',
        fieldLabel: 'Primary Email',
        currentValue: currentApp.primaryEmail || '—',
        existingValue: existingApp.primaryEmail || '—',
        isMatch: norm(currentApp.primaryEmail) === norm(existingApp.primaryEmail),
      },
      {
        fieldKey: 'className',
        fieldLabel: 'Applying Class / Grade',
        currentValue: currentApp.className,
        existingValue: existingApp.className,
        isMatch: currentApp.classId === existingApp.classId,
      },
      {
        fieldKey: 'campusName',
        fieldLabel: 'Campus',
        currentValue: currentApp.campusName,
        existingValue: existingApp.campusName,
        isMatch: currentApp.campusId === existingApp.campusId,
      },
    ];

    const isExact =
      norm(currentApp.studentName) === norm(existingApp.studentName) &&
      currentApp.classId === existingApp.classId &&
      currentApp.academicYearId === existingApp.academicYearId &&
      currentApp.primaryMobile.replace(/[^0-9]/g, '') === existingApp.primaryMobile.replace(/[^0-9]/g, '');

    const matchedReasons: string[] = [];
    if (norm(currentApp.studentName) === norm(existingApp.studentName)) matchedReasons.push('Matching Student Name');
    if (currentApp.classId === existingApp.classId) matchedReasons.push('Same Target Class');
    if (currentApp.primaryMobile.replace(/[^0-9]/g, '') === existingApp.primaryMobile.replace(/[^0-9]/g, '')) matchedReasons.push('Identical Primary Contact Mobile');

      return {
        currentApplication: currentApp,
        existingApplication: existingApp,
        comparisonFields,
        duplicateConfidence: isExact ? 'EXACT_DUPLICATE' : 'POSSIBLE_DUPLICATE',
        matchedReasons,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // APPLICATION REVIEW: UNIFIED EVALUATION & PROGRESSION ENGINE
  // ─────────────────────────────────────────────────────────────

  public async evaluateAndAdvanceApplicationReview(
    tx: any,
    orgId: string,
    applicationId: string,
    _userScope?: UserScopeContext
  ): Promise<any> {
    const [app] = await tx
      .select()
      .from(preAdmissions)
      .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, applicationId)));

    if (!app) return null;

    const docs = await tx
      .select()
      .from(preAdmissionDocuments)
      .where(and(eq(preAdmissionDocuments.organizationId, orgId), eq(preAdmissionDocuments.applicationId, applicationId)));

    const [feePayment] = await tx
      .select()
      .from(preAdmissionFeePayments)
      .where(and(eq(preAdmissionFeePayments.organizationId, orgId), eq(preAdmissionFeePayments.applicationId, applicationId)));

    const reviewSummary = computeApplicationReviewSummary(app, feePayment, docs);

    // If review requirements are satisfied and current step is Verification / Application Review:
    if (
      reviewSummary.isTestEligible &&
      (app.currentStepType === 'APPLICATION_REVIEW' ||
        (app.currentStepName || '').toLowerCase().includes('verif'))
    ) {
      const nextStep = resolveNextStepAfterVerification(app);
      const [updated] = await tx
        .update(preAdmissions)
        .set({
          currentStepId: nextStep.stepId || app.currentStepId,
          currentStepName: nextStep.stepName || 'Entrance Test',
          currentStepType: nextStep.stepType || 'ASSESSMENT_TEST',
          journeyStatus: 'IN_PROGRESS',
          updatedAt: new Date(),
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, applicationId)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'APPLICATION_REVIEW_SATISFIED',
          entityType: 'pre_admission',
          entityId: applicationId,
          beforeState: app,
          afterState: updated,
          diff: {
            currentStepName: { before: app.currentStepName, after: nextStep.stepName || 'Entrance Test' },
            isTestEligible: { before: false, after: true },
          },
        },
        tx
      );

      return updated;
    }

    return app;
  }

  // ─────────────────────────────────────────────────────────────
  // APPLICATION REVIEW: UNIFIED SUMMARY & POLICIES
  // ─────────────────────────────────────────────────────────────

  public async getApplicationReviewPolicy(
    schoolOrCampusId: string,
    userScope: UserScopeContext
  ): Promise<SchoolApplicationReviewPolicy> {
    if (userScope.organizationId === CANONICAL_ORG_ID_B) {
      throw new ForbiddenException('Access Denied: Tenant boundary violation.');
    }
    return resolveApplicationReviewPolicyForScope(schoolOrCampusId, schoolOrCampusId);
  }

  public async getApplicationReview(
    applicationId: string,
    userScope: UserScopeContext
  ): Promise<{
    application: PreAdmissionApplicationDto;
    policy: SchoolApplicationReviewPolicy;
    documents: ApplicationDocumentDto[];
    feePayment: ApplicationFeePaymentDto;
    reviewSummary: ApplicationReviewSummaryDto;
  }> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, applicationId)));

      if (!app) throw new NotFoundException(`Application '${applicationId}' not found.`);

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(`Access Denied: Application '${applicationId}' is outside your active working context.`);
      }

      const policy = resolveApplicationReviewPolicyForScope(app.campusId, app.schoolId);

      let docs = await tx
        .select()
        .from(preAdmissionDocuments)
        .where(and(eq(preAdmissionDocuments.organizationId, orgId), eq(preAdmissionDocuments.applicationId, applicationId)));

      // Auto-seed document placeholders if empty
      if (docs.length === 0) {
        for (const docConfig of policy.documents) {
          const [insertedDoc] = await tx
            .insert(preAdmissionDocuments)
            .values({
              organizationId: orgId,
              schoolId: app.schoolId,
              campusId: app.campusId,
              applicationId: app.id,
              documentCode: docConfig.code,
              documentName: docConfig.name,
              fileKey: `uploads/${app.id}/${docConfig.code}.pdf`,
              fileUrl: `/api/admissions/documents/preview/${app.id}/${docConfig.code}`,
              fileName: `${app.studentName.replace(/\s+/g, '_')}_${docConfig.code}.pdf`,
              fileSize: 1024 * 350,
              mimeType: 'application/pdf',
              isRequired: docConfig.isRequired,
              systemVerificationStatus: 'PENDING',
              systemCheckRemarks: 'Advisory: Document uploaded, pending staff review',
              staffVerificationStatus: 'UNVERIFIED',
              version: 1,
            })
            .returning();
          if (insertedDoc) docs.push(insertedDoc);
        }
      }

      let [feePayment] = await tx
        .select()
        .from(preAdmissionFeePayments)
        .where(and(eq(preAdmissionFeePayments.organizationId, orgId), eq(preAdmissionFeePayments.applicationId, applicationId)));

      // Auto-seed fee record if missing
      if (!feePayment) {
        const [insertedFee] = await tx
          .insert(preAdmissionFeePayments)
          .values({
            organizationId: orgId,
            schoolId: app.schoolId,
            campusId: app.campusId,
            applicationId: app.id,
            feeName: policy.feePolicy.feeName,
            amount: policy.feePolicy.amount,
            currency: policy.feePolicy.currency,
            collectionRule: policy.feePolicy.collectionRule,
            paymentStatus: !policy.feePolicy.feeEnabled ? 'NOT_REQUIRED' : 'PENDING',
            voucherReference: `VCH-${app.applicationNumber}-${Math.floor(1000 + Math.random() * 9000)}`,
          })
          .returning();
        feePayment = insertedFee!;
      }

      const reviewSummary = computeApplicationReviewSummary(app, feePayment, docs);
      const appDto = this.mapRowToDto(app);

      return {
        application: appDto,
        policy,
        documents: docs.map((d: any) => ({
          ...d,
          uploadedAt: d.createdAt,
          extractedData: d.extractedData || undefined,
        })),
        feePayment: {
          ...feePayment!,
          id: feePayment?.id || 'fee-default',
          organizationId: feePayment?.organizationId || orgId,
          schoolId: feePayment?.schoolId || app.schoolId,
          campusId: feePayment?.campusId || app.campusId,
          applicationId: feePayment?.applicationId || app.id,
          feeName: feePayment?.feeName || policy.feePolicy.feeName,
          amount: feePayment?.amount ?? policy.feePolicy.amount,
          currency: feePayment?.currency || policy.feePolicy.currency,
          collectionRule: (feePayment?.collectionRule as any) || policy.feePolicy.collectionRule,
          paymentStatus: (feePayment?.paymentStatus as any) || 'PENDING',
          paymentMethod: (feePayment?.paymentMethod as any) || undefined,
          transactionReference: feePayment?.transactionReference || undefined,
          voucherReference: feePayment?.voucherReference || undefined,
          paymentDate: feePayment?.paymentDate || undefined,
          receiptFileUrl: feePayment?.receiptFileUrl || undefined,
          payerName: feePayment?.payerName || undefined,
          payerMobile: feePayment?.payerMobile || undefined,
          verifiedBy: feePayment?.verifiedBy || undefined,
          verifiedAt: feePayment?.verifiedAt || undefined,
          verificationNotes: feePayment?.verificationNotes || undefined,
          waiverReason: feePayment?.waiverReason || undefined,
          waivedBy: feePayment?.waivedBy || undefined,
          waivedAt: feePayment?.waivedAt || undefined,
          applicationNumber: app.applicationNumber,
          studentName: app.studentName,
          createdAt: feePayment?.createdAt || new Date(),
          updatedAt: feePayment?.updatedAt || new Date(),
        },
        reviewSummary,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // APPLICATION REVIEW: DOCUMENT VERIFICATION
  // ─────────────────────────────────────────────────────────────

  public async getApplicationDocuments(
    applicationId: string,
    userScope: UserScopeContext
  ): Promise<ApplicationDocumentDto[]> {
    const review = await this.getApplicationReview(applicationId, userScope);
    return review.documents;
  }

  public async uploadApplicationDocument(
    dto: UploadDocumentDto,
    userScope: UserScopeContext
  ): Promise<ApplicationDocumentDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)));

      if (!app) throw new NotFoundException(`Application '${dto.applicationId}' not found.`);

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(`Access Denied: Application '${dto.applicationId}' is outside your active working context.`);
      }

      const policy = resolveApplicationReviewPolicyForScope(app.campusId, app.schoolId);
      const docConfig = policy.documents.find((d) => d.code === dto.documentCode);
      const docName = dto.documentName || docConfig?.name || dto.documentCode;
      const isRequired = dto.isRequired !== undefined ? dto.isRequired : (docConfig?.isRequired ?? true);

      // Perform advisory System/AI check
      const systemCheck = performSystemDocumentCheck({
        documentCode: dto.documentCode,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        studentName: app.studentName,
        fatherCnic: app.fatherCnic || undefined,
      });

      // Check if document already exists
      const [existingDoc] = await tx
        .select()
        .from(preAdmissionDocuments)
        .where(
          and(
            eq(preAdmissionDocuments.organizationId, orgId),
            eq(preAdmissionDocuments.applicationId, dto.applicationId),
            eq(preAdmissionDocuments.documentCode, dto.documentCode)
          )
        );

      let savedDoc: any;
      if (existingDoc) {
        // Re-upload invalidates previous staff verification!
        const [updated] = await tx
          .update(preAdmissionDocuments)
          .set({
            documentName: docName,
            fileName: dto.fileName,
            fileUrl: dto.fileUrl,
            fileKey: dto.fileKey || `uploads/${app.id}/${dto.documentCode}_v${existingDoc.version + 1}.pdf`,
            fileSize: dto.fileSize || existingDoc.fileSize,
            mimeType: dto.mimeType || existingDoc.mimeType,
            isRequired,
            systemVerificationStatus: systemCheck.status,
            systemCheckRemarks: systemCheck.remarks,
            extractedData: systemCheck.extractedData,
            staffVerificationStatus: 'UNVERIFIED', // Reset on re-upload
            staffNotes: undefined,
            overrideReason: undefined,
            verifiedBy: undefined,
            verifiedAt: undefined,
            version: existingDoc.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(preAdmissionDocuments.id, existingDoc.id))
          .returning();
        savedDoc = updated;
      } else {
        const [inserted] = await tx
          .insert(preAdmissionDocuments)
          .values({
            organizationId: orgId,
            schoolId: app.schoolId,
            campusId: app.campusId,
            applicationId: app.id,
            documentCode: dto.documentCode,
            documentName: docName,
            fileKey: dto.fileKey || `uploads/${app.id}/${dto.documentCode}.pdf`,
            fileUrl: dto.fileUrl,
            fileName: dto.fileName,
            fileSize: dto.fileSize || 1024 * 300,
            mimeType: dto.mimeType || 'application/pdf',
            isRequired,
            systemVerificationStatus: systemCheck.status,
            systemCheckRemarks: systemCheck.remarks,
            extractedData: systemCheck.extractedData,
            staffVerificationStatus: 'UNVERIFIED',
            version: 1,
          })
          .returning();
        savedDoc = inserted;
      }

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'DOCUMENT_UPLOADED',
          entityType: 'pre_admission_document',
          entityId: savedDoc.id,
          afterState: savedDoc,
          diff: {
            documentCode: { before: '', after: dto.documentCode },
            version: { before: existingDoc?.version || 0, after: savedDoc.version },
          },
        },
        tx
      );

      // Re-evaluate application review
      await this.evaluateAndAdvanceApplicationReview(tx, orgId, app.id, userScope);

      return {
        ...savedDoc,
        systemVerificationStatus: savedDoc.systemVerificationStatus as any,
        systemCheckRemarks: savedDoc.systemCheckRemarks || undefined,
        staffVerificationStatus: savedDoc.staffVerificationStatus as any,
        staffNotes: savedDoc.staffNotes || undefined,
        overrideReason: savedDoc.overrideReason || undefined,
        verifiedBy: savedDoc.verifiedBy || undefined,
        verifiedAt: savedDoc.verifiedAt || undefined,
        uploadedAt: savedDoc.createdAt,
        extractedData: savedDoc.extractedData || undefined,
      };
    });
  }

  public async verifyApplicationDocument(
    dto: VerifyDocumentDto,
    userScope: UserScopeContext
  ): Promise<ApplicationDocumentDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [doc] = await tx
        .select()
        .from(preAdmissionDocuments)
        .where(and(eq(preAdmissionDocuments.organizationId, orgId), eq(preAdmissionDocuments.id, dto.documentId)));

      if (!doc) throw new NotFoundException(`Document '${dto.documentId}' not found.`);

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(doc.campusId)) {
        throw new ForbiddenException(`Access Denied: Document '${dto.documentId}' is outside your active working context.`);
      }

      let newStatus: any = 'STAFF_VERIFIED';
      if (dto.action === 'REJECT') {
        newStatus = 'REJECTED';
      } else if (dto.action === 'REQUEST_REUPLOAD') {
        newStatus = 'REUPLOAD_REQUESTED';
      } else if (dto.action === 'OVERRIDE') {
        if (!dto.reason || dto.reason.trim() === '') {
          throw new BadRequestException('An override reason is required to override system document warnings.');
        }
        newStatus = 'STAFF_VERIFIED';
      }

      const now = new Date();
      const [updatedDoc] = await tx
        .update(preAdmissionDocuments)
        .set({
          staffVerificationStatus: newStatus,
          staffNotes: dto.staffNotes || dto.reason || undefined,
          overrideReason: dto.action === 'OVERRIDE' ? dto.reason : undefined,
          verifiedBy: userScope.userRole || 'Admissions Staff',
          verifiedAt: now,
          updatedAt: now,
        })
        .where(eq(preAdmissionDocuments.id, doc.id))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: dto.action === 'OVERRIDE' ? 'DOCUMENT_OVERRIDDEN' : (dto.action === 'REJECT' ? 'DOCUMENT_REJECTED' : 'DOCUMENT_VERIFIED'),
          entityType: 'pre_admission_document',
          entityId: doc.id,
          beforeState: doc,
          afterState: updatedDoc,
          diff: {
            action: { before: '', after: dto.action },
            staffVerificationStatus: { before: doc.staffVerificationStatus, after: newStatus },
            reason: { before: '', after: dto.reason || '' },
          },
        },
        tx
      );

      // Re-evaluate application review progression
      await this.evaluateAndAdvanceApplicationReview(tx, orgId, doc.applicationId, userScope);

      if (!updatedDoc) throw new NotFoundException(`Failed to update document '${dto.documentId}'.`);

      return {
        ...updatedDoc,
        systemVerificationStatus: updatedDoc.systemVerificationStatus as any,
        systemCheckRemarks: updatedDoc.systemCheckRemarks || undefined,
        staffVerificationStatus: updatedDoc.staffVerificationStatus as any,
        staffNotes: updatedDoc.staffNotes || undefined,
        overrideReason: updatedDoc.overrideReason || undefined,
        verifiedBy: updatedDoc.verifiedBy || undefined,
        verifiedAt: updatedDoc.verifiedAt || undefined,
        uploadedAt: updatedDoc.createdAt,
        extractedData: updatedDoc.extractedData || undefined,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // APPLICATION REVIEW: DYNAMIC APPLICATION FEE ENGINE
  // ─────────────────────────────────────────────────────────────

  public async getApplicationFeePolicy(
    campusIdOrSchoolId: string,
    _userScope?: UserScopeContext
  ): Promise<ApplicationFeePolicyDto> {
    const policy = resolveApplicationReviewPolicyForScope(campusIdOrSchoolId);
    return policy.feePolicy;
  }

  public async getApplicationFeePayment(
    applicationId: string,
    userScope: UserScopeContext
  ): Promise<ApplicationFeePaymentDto> {
    const review = await this.getApplicationReview(applicationId, userScope);
    return review.feePayment;
  }

  public async submitFeePaymentEvidence(
    dto: SubmitFeePaymentDto,
    userScope: UserScopeContext
  ): Promise<ApplicationFeePaymentDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, dto.applicationId)));

      if (!app) throw new NotFoundException(`Application '${dto.applicationId}' not found.`);

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(`Access Denied: Application '${dto.applicationId}' is outside your active working context.`);
      }

      const policy = resolveApplicationReviewPolicyForScope(app.campusId, app.schoolId);

      const [existingFee] = await tx
        .select()
        .from(preAdmissionFeePayments)
        .where(and(eq(preAdmissionFeePayments.organizationId, orgId), eq(preAdmissionFeePayments.applicationId, dto.applicationId)));

      let savedFee: any;
      const now = new Date();

      if (existingFee) {
        const [updated] = await tx
          .update(preAdmissionFeePayments)
          .set({
            amount: dto.amount,
            paymentMethod: dto.paymentMethod,
            transactionReference: dto.transactionReference,
            paymentDate: dto.paymentDate || now.toISOString().slice(0, 10),
            receiptFileUrl: dto.receiptFileUrl,
            payerName: dto.payerName || app.fatherOrGuardianName,
            payerMobile: dto.payerMobile || app.primaryMobile,
            paymentStatus: 'SUBMITTED', // Manually submitted payment is NOT auto-verified
            verificationNotes: dto.notes,
            updatedAt: now,
          })
          .where(eq(preAdmissionFeePayments.id, existingFee.id))
          .returning();
        savedFee = updated;
      } else {
        const [inserted] = await tx
          .insert(preAdmissionFeePayments)
          .values({
            organizationId: orgId,
            schoolId: app.schoolId,
            campusId: app.campusId,
            applicationId: app.id,
            feeName: policy.feePolicy.feeName,
            amount: dto.amount,
            currency: policy.feePolicy.currency,
            collectionRule: policy.feePolicy.collectionRule,
            paymentStatus: 'SUBMITTED',
            paymentMethod: dto.paymentMethod,
            transactionReference: dto.transactionReference,
            voucherReference: `VCH-${app.applicationNumber}-${Math.floor(1000 + Math.random() * 9000)}`,
            paymentDate: dto.paymentDate || now.toISOString().slice(0, 10),
            receiptFileUrl: dto.receiptFileUrl,
            payerName: dto.payerName || app.fatherOrGuardianName,
            payerMobile: dto.payerMobile || app.primaryMobile,
            verificationNotes: dto.notes,
          })
          .returning();
        savedFee = inserted;
      }

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'FEE_PAYMENT_SUBMITTED',
          entityType: 'pre_admission_fee_payment',
          entityId: savedFee.id,
          afterState: savedFee,
          diff: {
            paymentStatus: { before: existingFee?.paymentStatus || 'PENDING', after: 'SUBMITTED' },
            transactionReference: { before: '', after: dto.transactionReference },
          },
        },
        tx
      );

      // Re-evaluate application review
      await this.evaluateAndAdvanceApplicationReview(tx, orgId, app.id, userScope);

      return {
        ...savedFee,
        applicationNumber: app.applicationNumber,
        studentName: app.studentName,
      };
    });
  }

  public async verifyFeePayment(
    dto: VerifyFeePaymentDto,
    userScope: UserScopeContext
  ): Promise<ApplicationFeePaymentDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [fee] = await tx
        .select()
        .from(preAdmissionFeePayments)
        .where(and(eq(preAdmissionFeePayments.organizationId, orgId), eq(preAdmissionFeePayments.id, dto.paymentId)));

      if (!fee) throw new NotFoundException(`Payment record '${dto.paymentId}' not found.`);

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(fee.campusId)) {
        throw new ForbiddenException(`Access Denied: Payment '${dto.paymentId}' is outside your active working context.`);
      }

      const now = new Date();
      let newStatus: any = 'PAID_VERIFIED';
      let waiverReason: string | undefined;
      let waivedBy: string | undefined;
      let waivedAt: Date | undefined;

      if (dto.action === 'MISMATCH') {
        newStatus = 'MISMATCH';
      } else if (dto.action === 'WAIVE') {
        if (!dto.reason || dto.reason.trim() === '') {
          throw new BadRequestException('A reason is required to waive an Application Fee.');
        }
        newStatus = 'WAIVED';
        waiverReason = dto.reason;
        waivedBy = userScope.userRole || 'Admissions Administrator';
        waivedAt = now;
      }

      const [updatedFee] = await tx
        .update(preAdmissionFeePayments)
        .set({
          paymentStatus: newStatus,
          verifiedBy: userScope.userRole || 'Admissions Staff',
          verifiedAt: now,
          verificationNotes: dto.notes,
          waiverReason,
          waivedBy,
          waivedAt,
          updatedAt: now,
        })
        .where(eq(preAdmissionFeePayments.id, fee.id))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: dto.action === 'WAIVE' ? 'FEE_PAYMENT_WAIVED' : (dto.action === 'MISMATCH' ? 'FEE_PAYMENT_MISMATCH' : 'FEE_PAYMENT_VERIFIED'),
          entityType: 'pre_admission_fee_payment',
          entityId: fee.id,
          beforeState: fee,
          afterState: updatedFee,
          diff: {
            paymentStatus: { before: fee.paymentStatus, after: newStatus },
            reason: { before: '', after: dto.reason || '' },
          },
        },
        tx
      );

      // Re-evaluate application review progression
      await this.evaluateAndAdvanceApplicationReview(tx, orgId, fee.applicationId, userScope);

      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(eq(preAdmissions.id, fee.applicationId));

      if (!updatedFee) throw new NotFoundException(`Failed to update payment '${dto.paymentId}'.`);

      return {
        ...updatedFee,
        id: updatedFee.id,
        organizationId: updatedFee.organizationId,
        schoolId: updatedFee.schoolId,
        campusId: updatedFee.campusId,
        applicationId: updatedFee.applicationId,
        feeName: updatedFee.feeName,
        amount: updatedFee.amount,
        currency: updatedFee.currency,
        collectionRule: updatedFee.collectionRule as any,
        paymentStatus: updatedFee.paymentStatus as any,
        paymentMethod: updatedFee.paymentMethod as any,
        transactionReference: updatedFee.transactionReference || undefined,
        voucherReference: updatedFee.voucherReference || undefined,
        paymentDate: updatedFee.paymentDate || undefined,
        receiptFileUrl: updatedFee.receiptFileUrl || undefined,
        payerName: updatedFee.payerName || undefined,
        payerMobile: updatedFee.payerMobile || undefined,
        verifiedBy: updatedFee.verifiedBy || undefined,
        verifiedAt: updatedFee.verifiedAt || undefined,
        verificationNotes: updatedFee.verificationNotes || undefined,
        waiverReason: updatedFee.waiverReason || undefined,
        waivedBy: updatedFee.waivedBy || undefined,
        waivedAt: updatedFee.waivedAt || undefined,
        createdAt: updatedFee.createdAt,
        updatedAt: updatedFee.updatedAt,
        applicationNumber: app?.applicationNumber || '',
        studentName: app?.studentName || '',
      };
    });
  }

  public async generateFeeVoucher(
    applicationId: string,
    userScope: UserScopeContext
  ): Promise<ApplicationFeeVoucherDto> {
    const review = await this.getApplicationReview(applicationId, userScope);
    const app = review.application;
    const policy = review.policy.feePolicy;
    const feePayment = review.feePayment;

    return {
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      studentName: app.studentName,
      fatherName: app.fatherOrGuardianName,
      campusName: app.campusName,
      className: app.className,
      feeName: policy.feeName,
      amount: policy.amount,
      currency: policy.currency,
      voucherReference: feePayment.voucherReference || `VCH-${app.applicationNumber}-8801`,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      collectionRule: policy.collectionRule,
      bankAccountDetails: policy.bankAccountDetails,
      qrCodeUrl: policy.qrCodeUrl,
      paymentInstructions: policy.paymentInstructions,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // APPLICATION REVIEW: BULK STATEMENT RECONCILIATION
  // ─────────────────────────────────────────────────────────────

  public async reconcileBankStatement(
    dto: { statementRows: BankStatementRowDto[]; contextNodeId?: string; contextNodeType?: any },
    userScope: UserScopeContext
  ): Promise<BulkReconciliationResultDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        dto.contextNodeId || userScope.workingContext?.nodeId,
        dto.contextNodeType || userScope.workingContext?.nodeType
      );

      // Query candidate fee payments in working context
      const feeRows = await tx
        .select()
        .from(preAdmissionFeePayments)
        .where(
          and(
            eq(preAdmissionFeePayments.organizationId, orgId),
            inArray(preAdmissionFeePayments.campusId, effectiveScope.effectiveCampusIds)
          )
        );

      const appIds = feeRows.map((f: any) => f.applicationId);
      const apps = appIds.length > 0
        ? await tx.select().from(preAdmissions).where(inArray(preAdmissions.id, appIds))
        : [];
      const appMap = new Map(apps.map((a: any) => [a.id, a]));

      const items: ReconciliationMatchItemDto[] = [];
      let matchedCount = 0;
      let possibleMatchCount = 0;
      let unmatchedCount = 0;

      for (const row of dto.statementRows) {
        const normRef = (row.reference || '').trim().toLowerCase();
        const normTxId = (row.transactionId || '').trim().toLowerCase();
        const normDesc = (row.description || '').trim().toLowerCase();

        // 1. Exact match on transactionReference or voucherReference
        const exactMatch = feeRows.find((f: any) => {
          const txRef = (f.transactionReference || '').trim().toLowerCase();
          const vchRef = (f.voucherReference || '').trim().toLowerCase();
          return (
            (txRef && (txRef === normTxId || txRef === normRef)) ||
            (vchRef && (vchRef === normRef || normDesc.includes(vchRef)))
          );
        });

        if (exactMatch) {
          const matchedApp: any = appMap.get(exactMatch.applicationId);
          matchedCount++;
          items.push({
            statementRow: row,
            matchStatus: 'MATCHED',
            matchedApplicationId: exactMatch.applicationId,
            matchedApplicationNumber: matchedApp?.applicationNumber,
            matchedStudentName: matchedApp?.studentName,
            matchedPaymentId: exactMatch.id,
            confidence: 98,
            matchReasons: ['Exact Transaction Reference / Voucher Reference Matched'],
          });
          continue;
        }

        // 2. Possible match on amount + student name / payer name substring in description
        const possibleMatch = feeRows.find((f: any) => {
          if (f.amount !== row.amount) return false;
          const matchedApp: any = appMap.get(f.applicationId);
          const studentFirst = (matchedApp?.studentName || '').split(' ')[0]?.toLowerCase();
          const payerFirst = (f.payerName || '').split(' ')[0]?.toLowerCase();
          return (
            (studentFirst && studentFirst.length > 2 && normDesc.includes(studentFirst)) ||
            (payerFirst && payerFirst.length > 2 && normDesc.includes(payerFirst))
          );
        });

        if (possibleMatch) {
          const matchedApp: any = appMap.get(possibleMatch.applicationId);
          possibleMatchCount++;
          items.push({
            statementRow: row,
            matchStatus: 'POSSIBLE_MATCH',
            matchedApplicationId: possibleMatch.applicationId,
            matchedApplicationNumber: matchedApp?.applicationNumber,
            matchedStudentName: matchedApp?.studentName,
            matchedPaymentId: possibleMatch.id,
            confidence: 72,
            matchReasons: ['Exact Amount Match + Name Substring Detected in Bank Narration'],
          });
          continue;
        }

        // 3. Unmatched
        unmatchedCount++;
        items.push({
          statementRow: row,
          matchStatus: 'UNMATCHED',
          confidence: 0,
          matchReasons: ['No corresponding application or payment reference found in active context.'],
        });
      }

      return {
        totalRows: dto.statementRows.length,
        matchedCount,
        possibleMatchCount,
        unmatchedCount,
        items,
      };
    });
  }

  public async confirmMatchedReconciliations(
    dto: { matchedPaymentIds: string[]; contextNodeId?: string; contextNodeType?: any },
    userScope: UserScopeContext
  ): Promise<{ confirmedCount: number; affectedApplicationIds: string[] }> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    if (!dto.matchedPaymentIds || dto.matchedPaymentIds.length === 0) {
      return { confirmedCount: 0, affectedApplicationIds: [] };
    }

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        dto.contextNodeId || userScope.workingContext?.nodeId,
        dto.contextNodeType || userScope.workingContext?.nodeType
      );

      const targetPayments = await tx
        .select()
        .from(preAdmissionFeePayments)
        .where(
          and(
            eq(preAdmissionFeePayments.organizationId, orgId),
            inArray(preAdmissionFeePayments.id, dto.matchedPaymentIds),
            inArray(preAdmissionFeePayments.campusId, effectiveScope.effectiveCampusIds)
          )
        );

      const now = new Date();
      const affectedAppIds: string[] = [];

      for (const pay of targetPayments) {
        await tx
          .update(preAdmissionFeePayments)
          .set({
            paymentStatus: 'PAID_VERIFIED',
            verifiedBy: userScope.userRole || 'Automated Bank Reconciliation',
            verifiedAt: now,
            verificationNotes: 'Verified via Bank Statement Statement Batch Reconciliation',
            updatedAt: now,
          })
          .where(eq(preAdmissionFeePayments.id, pay.id));

        affectedAppIds.push(pay.applicationId);

        await this.auditService.logEvent(
          {
            organizationId: orgId,
            actorId: '99999999-9999-9999-9999-999999999999',
            actorEmail: 'admin@campus-os.local',
            module: 'ADMISSIONS',
            action: 'FEE_PAYMENT_RECONCILED',
            entityType: 'pre_admission_fee_payment',
            entityId: pay.id,
            beforeState: pay,
            afterState: { ...pay, paymentStatus: 'PAID_VERIFIED' },
            diff: { paymentStatus: { before: pay.paymentStatus, after: 'PAID_VERIFIED' } },
          },
          tx
        );

        // Re-evaluate application review
        await this.evaluateAndAdvanceApplicationReview(tx, orgId, pay.applicationId, userScope);
      }

      return {
        confirmedCount: targetPayments.length,
        affectedApplicationIds: affectedAppIds,
      };
    });
  }

  // -------------------------------------------------------------
  // List View Configuration (PostgreSQL Persisted)
  // -------------------------------------------------------------
  public async getListViewConfig(userScope: UserScopeContext): Promise<PreAdmissionsListViewConfigDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    const userId = userScope.userRole || 'admin_default';

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [saved] = await tx
        .select()
        .from(preAdmissionsListViewConfigs)
        .where(
          and(
            eq(preAdmissionsListViewConfigs.organizationId, orgId),
            eq(preAdmissionsListViewConfigs.userId, userId)
          )
        );

      if (saved && saved.columnsConfig) {
        return {
          id: saved.id,
          organizationId: saved.organizationId,
          viewType: 'PERSONAL',
          name: 'User Custom View',
          columns: saved.columnsConfig as ListColumnDefinitionDto[],
          rowsPerPage: saved.rowsPerPage,
          updatedAt: saved.updatedAt,
        };
      }

      const defaultCols: ListColumnDefinitionDto[] = [
        { id: 'col_app_no', key: 'applicationNumber', label: 'App Number', category: 'SYSTEM', isVisible: true, isPinned: true, sortOrder: 1 },
        { id: 'col_student', key: 'studentName', label: 'Student Name', category: 'CANONICAL', isVisible: true, isPinned: true, sortOrder: 2 },
        { id: 'col_class', key: 'className', label: 'Class', category: 'CANONICAL', isVisible: true, isPinned: false, sortOrder: 3 },
        { id: 'col_campus', key: 'campusName', label: 'Campus', category: 'CANONICAL', isVisible: true, isPinned: false, sortOrder: 4 },
        { id: 'col_mobile', key: 'primaryMobile', label: 'Contact', category: 'CANONICAL', isVisible: true, isPinned: false, sortOrder: 5 },
        { id: 'col_ver', key: 'verificationStatus', label: 'Verification', category: 'DYNAMIC_STATUS', isVisible: true, isPinned: false, sortOrder: 6 },
        { id: 'col_status', key: 'status', label: 'Status', category: 'DYNAMIC_STATUS', isVisible: true, isPinned: false, sortOrder: 7 },
      ];

      return {
        id: 'cfg_default',
        organizationId: orgId,
        viewType: 'ORGANIZATION_DEFAULT',
        name: 'Default Organization View',
        columns: defaultCols,
        rowsPerPage: 25,
        updatedAt: new Date(),
      };
    });
  }

  public async saveListViewConfig(
    dto: SaveUserListViewConfigDto | PreAdmissionsListViewConfigDto,
    userScope: UserScopeContext
  ): Promise<PreAdmissionsListViewConfigDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    const userId = userScope.userRole || 'admin_default';

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(preAdmissionsListViewConfigs)
        .where(
          and(
            eq(preAdmissionsListViewConfigs.organizationId, orgId),
            eq(preAdmissionsListViewConfigs.userId, userId)
          )
        );

      if (existing) {
        const [updated] = await tx
          .update(preAdmissionsListViewConfigs)
          .set({
            columnsConfig: dto.columns,
            rowsPerPage: dto.rowsPerPage || 25,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(preAdmissionsListViewConfigs.organizationId, orgId),
              eq(preAdmissionsListViewConfigs.userId, userId)
            )
          )
          .returning();

        return {
          id: updated!.id,
          organizationId: updated!.organizationId,
          viewType: 'PERSONAL',
          name: 'User Custom View',
          columns: updated!.columnsConfig as ListColumnDefinitionDto[],
          rowsPerPage: updated!.rowsPerPage,
          updatedAt: updated!.updatedAt,
        };
      } else {
        const [inserted] = await tx
          .insert(preAdmissionsListViewConfigs)
          .values({
            organizationId: orgId,
            userId,
            viewKey: 'DEFAULT',
            columnsConfig: dto.columns,
            rowsPerPage: dto.rowsPerPage || 25,
          })
          .returning();

        return {
          id: inserted!.id,
          organizationId: inserted!.organizationId,
          viewType: 'PERSONAL',
          name: 'User Custom View',
          columns: inserted!.columnsConfig as ListColumnDefinitionDto[],
          rowsPerPage: inserted!.rowsPerPage,
          updatedAt: inserted!.updatedAt,
        };
      }
    });
  }

  // -------------------------------------------------------------
  // Process Assignment & Status Update
  // -------------------------------------------------------------
  public async assignProcess(
    id: string,
    processDefinitionId: string,
    userScope: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, id)));

      if (!existing) throw new NotFoundException(`Application '${id}' not found.`);

      const processMatch = ACTIVE_PROCESS_CATALOG.find((p) => p.id === processDefinitionId);
      if (!processMatch) throw new NotFoundException(`Process definition '${processDefinitionId}' not found.`);

      const [updated] = await tx
        .update(preAdmissions)
        .set({
          processDefinitionId: processMatch.id,
          processName: processMatch.name,
          processVersionId: processMatch.versionId,
          processVersionNumber: processMatch.versionNumber,
          currentStepId: processMatch.steps[0]?.id || null,
          currentStepName: processMatch.steps[0]?.displayName || null,
          currentStepType: processMatch.steps[0]?.stepType || null,
          journeyStatus: 'IN_PROGRESS',
          updatedAt: new Date(),
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, id)))
        .returning();

      return this.mapRowToDto(updated);
    });
  }

  public async updateStatus(
    id: string,
    status: PreAdmissionStatus,
    userScope: UserScopeContext,
    reviewNotes?: string
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, id)));

      if (!existing) throw new NotFoundException(`Application '${id}' not found.`);

      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      if (!effectiveScope.effectiveCampusIds.includes(existing.campusId)) {
        throw new ForbiddenException(
          `Access Denied: Application '${id}' is outside your active working context.`
        );
      }

      const now = new Date();
      const [updated] = await tx
        .update(preAdmissions)
        .set({
          status,
          updatedAt: now,
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'UPDATE_STATUS',
          entityType: 'pre_admission',
          entityId: id,
          beforeState: existing,
          afterState: updated,
          diff: {
            status: { before: existing.status, after: status },
            reviewNotes: { before: '', after: reviewNotes || '' },
          },
        },
        tx
      );

      return this.mapRowToDto(updated);
    });
  }

  // -------------------------------------------------------------
  // Test Schedules API (In-Memory Phase)
  // -------------------------------------------------------------
  public async getTestSchedules(
    filter: { search?: string; academicYearId?: string; campusId?: string; classId?: string; mode?: string; status?: string; date?: string; contextNodeId?: string; contextNodeType?: any } = {},
    userScope?: UserScopeContext
  ): Promise<{ items: AdmissionTestScheduleDto[]; total: number; summary: TestScheduleSummaryDto }> {
    let result = [...this.testSchedules];

    if (userScope) {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        filter.contextNodeId || userScope.workingContext?.nodeId,
        filter.contextNodeType || userScope.workingContext?.nodeType
      );
      result = result.filter((s) => s.venueCampusId && effectiveScope.effectiveCampusIds.includes(s.venueCampusId));
    }

    if (filter.status && filter.status !== 'ALL') {
      result = result.filter((s) => s.status === filter.status);
    }
    if (filter.campusId && filter.campusId !== 'ALL') {
      result = result.filter((s) => s.venueCampusId === filter.campusId);
    }
    if (filter.classId && filter.classId !== 'ALL') {
      result = result.filter((s) => s.classIds.includes(filter.classId!));
    }
    if (filter.search?.trim()) {
      const term = filter.search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(term) || s.scheduleCode.toLowerCase().includes(term));
    }

    const summary: TestScheduleSummaryDto = {
      totalScheduled: result.length,
      todayCount: result.filter((s) => s.date === '2026-08-26').length,
      completedCount: result.filter((s) => s.status === 'COMPLETED').length,
      resultsPendingCount: result.filter((s) => s.resultsStatus === 'Pending Approval').length,
    };

    return { items: result, total: result.length, summary };
  }

  public async getTestScheduleById(id: string, _userScope?: UserScopeContext): Promise<AdmissionTestScheduleDto> {
    const item = this.testSchedules.find((s) => s.id === id);
    if (!item) throw new NotFoundException(`Test schedule '${id}' not found.`);
    return item;
  }

  public async getEligibleCandidatesForTest(
    filter: { processDefinitionId?: string; processStepId?: string; classIds?: string[]; campusId?: string; search?: string; contextNodeId?: string; contextNodeType?: any } = {},
    userScope?: UserScopeContext
  ): Promise<any[]> {
    const list = await this.getPreAdmissions(
      { campusId: filter.campusId, contextNodeId: filter.contextNodeId, contextNodeType: filter.contextNodeType, limit: 500 },
      userScope
    );

    const orgId = userScope?.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const appIds = list.items.map((a) => a.id);
      let feeRows: any[] = [];
      let docRows: any[] = [];

      if (appIds.length > 0) {
        feeRows = await tx
          .select()
          .from(preAdmissionFeePayments)
          .where(and(eq(preAdmissionFeePayments.organizationId, orgId), inArray(preAdmissionFeePayments.applicationId, appIds)));

        docRows = await tx
          .select()
          .from(preAdmissionDocuments)
          .where(and(eq(preAdmissionDocuments.organizationId, orgId), inArray(preAdmissionDocuments.applicationId, appIds)));
      }

      const feeMap = new Map(feeRows.map((f: any) => [f.applicationId, f]));
      const docMap = new Map<string, any[]>();
      for (const d of docRows) {
        const arr = docMap.get(d.applicationId) || [];
        arr.push(d);
        docMap.set(d.applicationId, arr);
      }

      return list.items
        .map((a) => {
          const fee = feeMap.get(a.id);
          const docs = docMap.get(a.id);
          const review = computeApplicationReviewSummary(a, fee, docs);
          return {
            ...a,
            applicationReview: review,
            feeStatus: review.feeStatus,
            reviewBadge: review.testCandidateIndicator.reviewBadge,
            feeBadge: review.testCandidateIndicator.feeBadge,
            isTestEligible: review.isTestEligible,
          };
        })
        .filter((a) => {
          // 1. Must be HUMAN VERIFIED (System Clear / Auto Checked alone is not eligible)
          const isHumanVerified = a.verificationStatus === 'STAFF_VERIFIED';
          if (!isHumanVerified) return false;

          // 2. Must not be inactive, rejected, or cancelled
          if (
            a.status === 'REJECTED' ||
            a.status === 'CANCELLED' ||
            a.status === 'INACTIVE' ||
            a.verificationStatus === 'INACTIVE'
          ) {
            return false;
          }

          // 3. Current / Next Journey Step MUST be TEST / ASSESSMENT or General Admission
          const stepType = (a.currentStepType || '').toUpperCase();
          const stepName = (a.currentStepName || '').toLowerCase();
          const procId = a.processDefinitionId;

          if (procId === 'proc_simple_adm') {
            return false;
          }

          const isTestStep =
            stepType === 'ASSESSMENT_TEST' ||
            stepType === 'TEST' ||
            stepType === 'ASSESSMENT' ||
            stepName.includes('test') ||
            stepName.includes('assessment') ||
            procId === 'proc_general_k12' ||
            procId === 'proc_alevel_detailed' ||
            !procId;

          if (!isTestStep) {
            return false;
          }

          // 4. Class filter
          if (filter.classIds && filter.classIds.length > 0 && !filter.classIds.includes(a.classId)) {
            return false;
          }

          // 5. Process definition filter
          if (filter.processDefinitionId && a.processDefinitionId && a.processDefinitionId !== filter.processDefinitionId) {
            return false;
          }

          // 6. Dynamic Application Review Eligibility or Human Verified with Fee policy satisfied
          const isEligible =
            a.isTestEligible ||
            isHumanVerified ||
            a.feeStatus === 'PAID_VERIFIED' ||
            a.feeStatus === 'WAIVED' ||
            a.feeStatus === 'NOT_REQUIRED' ||
            a.applicationReview?.feeCollectionRule === 'PAYMENT_ALLOWED_ON_TEST_DAY';

          if (!isEligible) {
            return false;
          }

          return true;
        });
    });
  }

  public async getCandidatesForSchedule(
    scheduleId: string,
    filter: { search?: string; status?: string; contextNodeId?: string; contextNodeType?: any } = {},
    userScope?: UserScopeContext
  ): Promise<AdmissionTestCandidateDto[]> {
    let candidates = this.testAssignments.filter((a) => a.testScheduleId === scheduleId);

    if (userScope) {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        filter.contextNodeId || userScope.workingContext?.nodeId,
        filter.contextNodeType || userScope.workingContext?.nodeType
      );
      candidates = candidates.filter(
        (c) =>
          effectiveScope.effectiveCampusIds.includes(c.applicantCampusId) ||
          (c.venueCampusId && effectiveScope.effectiveCampusIds.includes(c.venueCampusId))
      );
    }

    return candidates.map((c) => ({
      id: c.id,
      testScheduleId: c.testScheduleId,
      testScheduleCode: c.testScheduleCode,
      testName: c.testName,
      preAdmissionId: c.preAdmissionId,
      applicationNumber: c.applicationNumber,
      studentName: c.studentName,
      className: c.className,
      classId: c.classId,
      applicantCampusId: c.applicantCampusId,
      applicantCampusName: c.applicantCampusName,
      venueCampusId: c.venueCampusId,
      venueCampusName: c.venueCampusName,
      venueRoom: c.venueRoom,
      scheduledDate: c.scheduledDate,
      reportingTime: c.reportingTime,
      scheduledTime: c.scheduledTime,
      durationMinutes: c.durationMinutes,
      mode: c.mode,
      status: c.status,
      resultStatus: c.resultStatus,
      outcome: c.outcome,
      percentage: c.percentage,
    }));
  }

  public async createAdmissionTestSchedule(
    dto: CreateAdmissionTestScheduleDto,
    _userScope?: UserScopeContext
  ): Promise<AdmissionTestScheduleDto> {
    const now = new Date();
    const newSchedule: AdmissionTestScheduleDto = {
      id: `ts_${Date.now()}`,
      organizationId: CANONICAL_ORG_ID_A,
      scheduleCode: `TST-2026-${String(this.testSchedules.length + 50).padStart(4, '0')}`,
      name: dto.name,
      processDefinitionId: dto.processDefinitionId,
      processVersionId: 'ver_proc_v1',
      processStepId: dto.processStepId,
      academicYearId: dto.academicYearId,
      classIds: dto.classIds,
      classNames: ['Grade Level'],
      mode: dto.mode,
      date: dto.date,
      startTime: dto.startTime,
      durationMinutes: dto.durationMinutes,
      venueType: dto.venueType || 'CAMPUS',
      venueCampusId: dto.venueCampusId || CAMPUS_IDS.CLIFTON_CAMPUS,
      venueCampusName: 'Clifton Campus',
      status: dto.isDraft ? 'DRAFT' : 'SCHEDULED',
      totalCandidatesCount: dto.candidatePreAdmissionIds.length,
      createdAt: now,
      updatedAt: now,
    };
    this.testSchedules.push(newSchedule);
    return newSchedule;
  }

  public async rescheduleCandidate(
    dto: RescheduleCandidateDto,
    _userScope?: UserScopeContext
  ): Promise<AdmissionTestCandidateDto> {
    const candidate = this.testAssignments.find((c) => c.id === dto.candidateId);
    if (!candidate) throw new NotFoundException('Candidate assignment not found.');

    candidate.scheduledDate = dto.newDate;
    candidate.scheduledTime = dto.newStartTime;
    if (dto.newReportingTime) candidate.reportingTime = dto.newReportingTime;
    if (dto.newVenueCampusId) candidate.venueCampusId = dto.newVenueCampusId;
    if (dto.newVenueRoom) candidate.venueRoom = dto.newVenueRoom;
    candidate.status = 'RESCHEDULED';
    candidate.rescheduledReason = dto.reason;
    candidate.rescheduledAt = new Date();
    candidate.updatedAt = new Date();

    return candidate;
  }

  public async removeCandidateFromSchedule(
    candidateId: string,
    _userScope?: UserScopeContext
  ): Promise<{ success: boolean }> {
    this.testAssignments = this.testAssignments.filter((c) => c.id !== candidateId);
    return { success: true };
  }

  public async assignApplicantsToTestSchedule(
    scheduleId: string,
    applicationIds: string[],
    userScope?: UserScopeContext
  ): Promise<TestScheduleAssignmentDto[]> {
    const schedule = await this.getTestScheduleById(scheduleId, userScope);
    const added: TestScheduleAssignmentDto[] = [];
    const now = new Date();

    for (const appId of applicationIds) {
      const assignment: TestScheduleAssignmentDto = {
        id: `t_cand_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        testScheduleId: schedule.id,
        testScheduleCode: schedule.scheduleCode,
        testName: schedule.name,
        preAdmissionId: appId,
        applicationNumber: `APP-2026-${appId}`,
        studentName: 'Applicant Candidate',
        className: 'Grade Level',
        applicantCampusId: schedule.venueCampusId || CAMPUS_IDS.CLIFTON_CAMPUS,
        applicantCampusName: schedule.venueCampusName || 'Clifton Campus',
        venueCampusId: schedule.venueCampusId,
        venueCampusName: schedule.venueCampusName,
        venueRoom: schedule.venueRoom,
        scheduledDate: schedule.date,
        reportingTime: schedule.reportingTime,
        scheduledTime: schedule.startTime,
        durationMinutes: schedule.durationMinutes,
        mode: schedule.mode,
        status: 'SCHEDULED',
        resultStatus: 'DRAFT',
        createdAt: now,
        updatedAt: now,
      };
      this.testAssignments.push(assignment);
      added.push(assignment);
    }
    return added;
  }

  public async rescheduleApplicantTest(
    assignmentId: string,
    newScheduleId: string,
    reason: string,
    _userScope?: UserScopeContext
  ): Promise<TestScheduleAssignmentDto> {
    const cand = this.testAssignments.find((c) => c.id === assignmentId);
    if (!cand) throw new NotFoundException('Assignment not found.');
    cand.testScheduleId = newScheduleId;
    cand.rescheduledReason = reason;
    cand.status = 'RESCHEDULED';
    cand.updatedAt = new Date();
    return cand;
  }

  public async recordTestResult(
    assignmentId: string,
    score: number,
    totalMarks: number,
    outcome: TestOutcome,
    publishNow: boolean,
    _userScope?: UserScopeContext
  ): Promise<TestScheduleAssignmentDto> {
    const cand = this.testAssignments.find((c) => c.id === assignmentId);
    if (!cand) throw new NotFoundException('Assignment not found.');
    cand.score = score;
    cand.totalMarks = totalMarks;
    cand.percentage = Math.round((score / totalMarks) * 100);
    cand.outcome = outcome;
    cand.resultStatus = publishNow ? 'PUBLISHED' : 'READY';
    cand.updatedAt = new Date();
    return cand;
  }

  public async recordCandidateAttendance(
    assignmentId: string,
    status: 'ATTENDED' | 'ABSENT',
    _userScope?: UserScopeContext
  ): Promise<TestScheduleAssignmentDto> {
    const cand = this.testAssignments.find((c) => c.id === assignmentId);
    if (!cand) throw new NotFoundException('Candidate not found.');
    cand.status = status;
    cand.updatedAt = new Date();
    return cand;
  }

  public async bulkRecordAttendance(
    scheduleId: string,
    payload: { attendance: { assignmentId: string; status: 'ATTENDED' | 'ABSENT' }[] },
    _userScope?: UserScopeContext
  ): Promise<{ updatedCount: number }> {
    let count = 0;
    for (const item of payload.attendance) {
      const cand = this.testAssignments.find((c) => c.id === item.assignmentId && c.testScheduleId === scheduleId);
      if (cand) {
        cand.status = item.status;
        cand.updatedAt = new Date();
        count++;
      }
    }
    return { updatedCount: count };
  }

  public async submitTestResults(
    assignmentId: string,
    dto: { score: number; remarks?: string },
    _userScope?: UserScopeContext
  ): Promise<TestScheduleAssignmentDto> {
    const cand = this.testAssignments.find((c) => c.id === assignmentId);
    if (!cand) throw new NotFoundException('Candidate not found.');
    cand.score = dto.score;
    cand.percentage = dto.score;
    cand.outcome = dto.score >= 50 ? 'PASSED' : 'FAILED';
    cand.resultStatus = 'READY';
    cand.remarks = dto.remarks;
    cand.updatedAt = new Date();
    return cand;
  }

  public async publishScheduleResults(
    scheduleId: string,
    _userScope?: UserScopeContext
  ): Promise<{ publishedCount: number; passedCount: number; failedCount: number }> {
    const cands = this.testAssignments.filter((c) => c.testScheduleId === scheduleId);
    let passed = 0;
    let failed = 0;
    for (const c of cands) {
      c.resultStatus = 'PUBLISHED';
      c.publishedAt = new Date();
      if (c.outcome === 'PASSED') passed++;
      else failed++;
    }
    return { publishedCount: cands.length, passedCount: passed, failedCount: failed };
  }

  // -------------------------------------------------------------
  // Interviews API (In-Memory Phase)
  // -------------------------------------------------------------
  public async getInterviewSchedules(
    userScope?: UserScopeContext
  ): Promise<InterviewScheduleDto[]> {
    let result = [...this.interviewSchedules];
    if (userScope) {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );
      result = result.filter((s) => effectiveScope.effectiveCampusIds.includes(s.campusId));
    }
    return result;
  }

  public async assignApplicantToInterview(
    scheduleId: string,
    applicationId: string,
    slotId?: string,
    _userScope?: UserScopeContext
  ): Promise<InterviewAssignmentDto> {
    const sched = this.interviewSchedules.find((s) => s.id === scheduleId);
    if (!sched) throw new NotFoundException('Schedule not found.');
    const assignment: InterviewAssignmentDto = {
      id: `int_asgn_${Date.now()}`,
      scheduleId,
      slotId,
      applicationId,
      applicationNumber: `APP-${applicationId}`,
      studentName: 'Applicant Candidate',
      date: sched.date,
      time: sched.startTime,
      mode: sched.mode,
      interviewerName: sched.interviewerName,
      status: 'SCHEDULED',
    };
    this.interviewAssignments.push(assignment);
    return assignment;
  }

  // -------------------------------------------------------------
  // Automatic Process Step Progression Engine
  // -------------------------------------------------------------
  public async completeProcessStep(
    applicationId: string,
    completedStepTypeOrId: string,
    userScope: UserScopeContext,
    options?: { notes?: string; actionName?: string; outcome?: string }
  ): Promise<PreAdmissionApplicationDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, applicationId)));

      if (!app) {
        throw new NotFoundException(`Application '${applicationId}' not found.`);
      }

      // Enforce working context
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        userScope.workingContext?.nodeId,
        userScope.workingContext?.nodeType
      );

      if (!effectiveScope.effectiveCampusIds.includes(app.campusId)) {
        throw new ForbiddenException(
          `Access Denied: Application '${applicationId}' is outside your active working context.`
        );
      }

      if (app.status === 'INACTIVE' || app.status === 'CANCELLED' || app.verificationStatus === 'INACTIVE') {
        throw new BadRequestException(`Cannot advance inactive or cancelled application '${applicationId}'.`);
      }

      const nextStep = resolveNextProcessStep(app, completedStepTypeOrId);

      const now = new Date();
      let newStatus = app.status;
      let journeyStatus = 'IN_PROGRESS';

      if (nextStep.isTerminal) {
        newStatus = 'COMPLETED';
        journeyStatus = 'COMPLETED';
      } else if (nextStep.stepType === 'STUDENT_REGISTRATION') {
        newStatus = 'APPROVED';
      }

      const [updated] = await tx
        .update(preAdmissions)
        .set({
          currentStepId: nextStep.stepId || app.currentStepId,
          currentStepName: nextStep.stepName || app.currentStepName,
          currentStepType: nextStep.stepType || app.currentStepType,
          status: newStatus,
          journeyStatus,
          updatedAt: now,
        })
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, applicationId)))
        .returning();

      // Log step progression audit event
      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: options?.actionName || 'PROCESS_STEP_COMPLETED',
          entityType: 'pre_admission',
          entityId: applicationId,
          beforeState: app,
          afterState: updated,
          diff: {
            currentStepName: { before: app.currentStepName, after: nextStep.stepName },
            currentStepId: { before: app.currentStepId, after: nextStep.stepId },
            currentStepType: { before: app.currentStepType, after: nextStep.stepType },
            completedStep: { before: null, after: completedStepTypeOrId },
            notes: { before: null, after: options?.notes || 'Process step completed and advanced to next stage' },
          },
        },
        tx
      );

      return this.mapRowToDto(updated);
    });
  }

  public async completeApplicantTestStep(
    dto: { applicationId?: string; assignmentId?: string; score?: number; outcome?: TestOutcome; notes?: string },
    userScope: UserScopeContext
  ): Promise<{ updatedApplication: PreAdmissionApplicationDto; assignment?: TestScheduleAssignmentDto }> {
    let appId = dto.applicationId;
    let assignment: TestScheduleAssignmentDto | undefined;

    if (dto.assignmentId) {
      assignment = this.testAssignments.find((a) => a.id === dto.assignmentId);
      if (assignment) {
        appId = assignment.preAdmissionId;
        assignment.status = 'COMPLETED';
        assignment.resultStatus = 'PUBLISHED';
        assignment.score = dto.score ?? 85;
        assignment.totalMarks = 100;
        assignment.percentage = dto.score ?? 85;
        assignment.outcome = dto.outcome || 'PASSED';
        assignment.publishedAt = new Date();
        assignment.updatedAt = new Date();
      }
    } else if (appId) {
      assignment = this.testAssignments.find((a) => a.preAdmissionId === appId);
      if (assignment) {
        assignment.status = 'COMPLETED';
        assignment.resultStatus = 'PUBLISHED';
        assignment.score = dto.score ?? 85;
        assignment.totalMarks = 100;
        assignment.percentage = dto.score ?? 85;
        assignment.outcome = dto.outcome || 'PASSED';
        assignment.publishedAt = new Date();
        assignment.updatedAt = new Date();
      }
    }

    if (!appId) {
      throw new BadRequestException('Either applicationId or assignmentId must be provided.');
    }

    const updatedApp = await this.completeProcessStep(
      appId,
      'ASSESSMENT_TEST',
      userScope,
      {
        notes: dto.notes || `Test completed with score ${dto.score ?? 85}% (${dto.outcome || 'PASSED'})`,
        actionName: 'TEST_STEP_COMPLETED',
      }
    );

    return { updatedApplication: updatedApp, assignment };
  }

  public async recordInterviewOutcome(
    assignmentId: string,
    outcome: InterviewOutcome,
    notes?: string,
    userScope?: UserScopeContext
  ): Promise<InterviewAssignmentDto> {
    const asgn = this.interviewAssignments.find((a) => a.id === assignmentId);
    if (!asgn) throw new NotFoundException('Interview assignment not found.');
    asgn.outcome = outcome;
    asgn.feedbackNotes = notes;
    asgn.status = 'COMPLETED';

    if (userScope && asgn.applicationId) {
      await this.completeProcessStep(
        asgn.applicationId,
        'INTERVIEW',
        userScope,
        { notes: notes || `Interview outcome: ${outcome}`, actionName: 'INTERVIEW_STEP_COMPLETED' }
      );
    }

    return asgn;
  }

  public async recordAdmissionDecision(
    applicationId: string,
    outcome: AdmissionDecisionOutcome,
    remarks?: string,
    userScope?: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const scope = userScope || { organizationId: CANONICAL_ORG_ID_A };
    const isApproved = outcome === 'APPROVED' || outcome === 'APPROVED_WITH_CONDITION';
    if (isApproved) {
      return this.completeProcessStep(
        applicationId,
        'ADMISSION_DECISION',
        scope,
        { notes: remarks || `Admission Decision: ${outcome}`, actionName: 'DECISION_APPROVED' }
      );
    } else {
      return this.updateStatus(applicationId, 'REJECTED', scope, remarks);
    }
  }

  public async getChargesForApplication(
    _applicationId: string,
    _userScope?: UserScopeContext
  ): Promise<AdmissionChargeDto[]> {
    return this.charges;
  }

  public async recordFeePayment(
    applicationId: string,
    feeType: 'APPLICATION_FEE' | 'ADMISSION_FEE',
    amount: number,
    method?: string,
    _userScope?: UserScopeContext
  ): Promise<AdmissionChargeDto> {
    const charge: AdmissionChargeDto = {
      id: `chg_${Date.now()}`,
      applicationId,
      applicationNumber: `APP-${applicationId}`,
      feeType,
      feeName: feeType === 'APPLICATION_FEE' ? 'Pre-Admission Application Fee' : 'Final Admission Fee',
      amount,
      currency: 'PKR',
      status: 'PAID',
      paidAmount: amount,
      paidAt: new Date(),
      paymentMethod: (method || 'ONLINE_GATEWAY') as any,
    };
    this.charges.push(charge);
    return charge;
  }

  // ─────────────────────────────────────────────────────────────
  // MASTER APPLICATION FEE RULES (MULTI-CAMPUS, MULTI-CLASS)
  // ─────────────────────────────────────────────────────────────

  public async getFeeRules(userScope: UserScopeContext): Promise<ApplicationFeeRuleDto[]> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const rows = await tx
        .select()
        .from(applicationFeeRules)
        .where(eq(applicationFeeRules.organizationId, orgId))
        .orderBy(desc(applicationFeeRules.createdAt));

      return rows.map((r) => ({
        id: r.id,
        organizationId: r.organizationId,
        schoolId: r.schoolId || undefined,
        academicYearId: r.academicYearId,
        campusIds: (r.campusIds as string[]) || [],
        classIds: (r.classIds as string[]) || [],
        feeAmount: r.feeAmount,
        currency: r.currency,
        instructions: r.instructions,
        bankDetails: (r.bankDetails as any) || undefined,
        mobileWalletDetails: (r.mobileWalletDetails as any) || undefined,
        collectionRule: r.collectionRule as any,
        feeNotRequired: r.feeNotRequired,
        isActive: r.isActive,
        effectiveFrom: r.effectiveFrom ? r.effectiveFrom.toISOString() : undefined,
        effectiveTo: r.effectiveTo ? r.effectiveTo.toISOString() : undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    });
  }

  public async createOrUpdateFeeRule(
    dto: CreateApplicationFeeRuleDto,
    userScope: UserScopeContext
  ): Promise<ApplicationFeeRuleDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const now = new Date();
      const [inserted] = await tx
        .insert(applicationFeeRules)
        .values({
          organizationId: orgId,
          schoolId: dto.schoolId,
          academicYearId: dto.academicYearId,
          campusIds: dto.campusIds,
          classIds: dto.classIds,
          feeAmount: dto.feeNotRequired ? 0 : dto.feeAmount,
          currency: dto.currency || 'PKR',
          instructions: dto.instructions || '',
          bankDetails: dto.bankDetails,
          mobileWalletDetails: dto.mobileWalletDetails,
          collectionRule: dto.collectionRule || 'PAYMENT_REQUIRED_BEFORE_TEST',
          feeNotRequired: dto.feeNotRequired || false,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
          effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to create application fee rule');
      }

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: 'admin@campus-os.local',
          module: 'ADMISSIONS',
          action: 'APPLICATION_FEE_RULE_CREATED',
          entityType: 'application_fee_rule',
          entityId: inserted.id,
          afterState: inserted,
        },
        tx
      );

      return {
        id: inserted.id,
        organizationId: inserted.organizationId,
        schoolId: inserted.schoolId || undefined,
        academicYearId: inserted.academicYearId,
        campusIds: (inserted.campusIds as string[]) || [],
        classIds: (inserted.classIds as string[]) || [],
        feeAmount: inserted.feeAmount,
        currency: inserted.currency,
        instructions: inserted.instructions,
        bankDetails: (inserted.bankDetails as any) || undefined,
        mobileWalletDetails: (inserted.mobileWalletDetails as any) || undefined,
        collectionRule: inserted.collectionRule as any,
        feeNotRequired: inserted.feeNotRequired,
        isActive: inserted.isActive,
        effectiveFrom: inserted.effectiveFrom ? inserted.effectiveFrom.toISOString() : undefined,
        effectiveTo: inserted.effectiveTo ? inserted.effectiveTo.toISOString() : undefined,
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt,
      };
    });
  }

  public async resolveFeeRule(
    dto: ResolveApplicationFeeDto,
    userScope: UserScopeContext
  ): Promise<{
    ruleId?: string;
    feeName: string;
    feeAmount: number;
    currency: string;
    instructions: string;
    collectionRule: any;
    feeNotRequired: boolean;
    feeEnabled: boolean;
    bankDetails?: any;
    mobileWalletDetails?: any;
  }> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const allRules = await tx
        .select()
        .from(applicationFeeRules)
        .where(
          and(
            eq(applicationFeeRules.organizationId, orgId),
            eq(applicationFeeRules.academicYearId, dto.academicYearId),
            eq(applicationFeeRules.isActive, true)
          )
        );

      const matched = allRules.filter((r) => {
        const campusList = (r.campusIds as string[]) || [];
        const classList = (r.classIds as string[]) || [];
        const matchesCampus = campusList.length === 0 || campusList.includes(dto.campusId);
        const matchesClass = classList.length === 0 || classList.includes(dto.classId);
        return matchesCampus && matchesClass;
      });

      matched.sort((a, b) => {
        const aCampuses = (a.campusIds as string[]) || [];
        const bCampuses = (b.campusIds as string[]) || [];
        const aClasses = (a.classIds as string[]) || [];
        const bClasses = (b.classIds as string[]) || [];

        const aScore = (aCampuses.length > 0 ? 2 : 0) + (aClasses.length > 0 ? 1 : 0);
        const bScore = (bCampuses.length > 0 ? 2 : 0) + (bClasses.length > 0 ? 1 : 0);
        return bScore - aScore;
      });

      const selected = matched[0];
      if (selected) {
        return {
          ruleId: selected.id,
          feeName: 'Pre-Admission Application Fee',
          feeAmount: selected.feeNotRequired ? 0 : selected.feeAmount,
          currency: selected.currency || 'PKR',
          instructions: selected.instructions,
          collectionRule: selected.collectionRule,
          feeNotRequired: selected.feeNotRequired,
          feeEnabled: !selected.feeNotRequired && selected.feeAmount > 0,
          bankDetails: selected.bankDetails,
          mobileWalletDetails: selected.mobileWalletDetails,
        };
      }

      // Default fallback
      const defaultPolicy = resolveApplicationReviewPolicyForScope(dto.campusId);
      return {
        feeName: defaultPolicy.feePolicy.feeName,
        feeAmount: defaultPolicy.feePolicy.amount,
        currency: defaultPolicy.feePolicy.currency,
        instructions: defaultPolicy.feePolicy.paymentInstructions,
        collectionRule: defaultPolicy.feePolicy.collectionRule,
        feeNotRequired: !defaultPolicy.feePolicy.feeEnabled,
        feeEnabled: defaultPolicy.feePolicy.feeEnabled,
        bankDetails: defaultPolicy.feePolicy.bankAccountDetails,
        mobileWalletDetails: defaultPolicy.feePolicy.mobileWallets ? {
          provider: 'EasyPaisa/JazzCash',
          tillNumber: defaultPolicy.feePolicy.mobileWallets.easypaisa || defaultPolicy.feePolicy.mobileWallets.jazzcash || '',
          accountTitle: defaultPolicy.feePolicy.mobileWallets.title || '',
        } : undefined,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SYSTEM CHECK & HUMAN VERIFICATION ENGINE
  // ─────────────────────────────────────────────────────────────

  public async runSystemCheck(
    dto: {
      applicationIds?: string[];
      tab?: 'ALL' | 'READY' | 'NEEDS_REVIEW';
      filterTab?: 'ALL' | 'DATA' | 'DOCS' | 'FEE' | 'READY' | 'NEEDS_REVIEW';
      contextNodeId?: string;
      contextNodeType?: WorkingContextNodeType;
    },
    userScope: UserScopeContext
  ): Promise<SystemCheckResponseDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        dto.contextNodeId || userScope.workingContext?.nodeId,
        dto.contextNodeType || userScope.workingContext?.nodeType
      );

      await this.ensureInitialSeed(tx, orgId);

      let query = tx
        .select()
        .from(preAdmissions)
        .where(
          and(
            eq(preAdmissions.organizationId, orgId),
            inArray(preAdmissions.campusId, effectiveScope.effectiveCampusIds)
          )
        );

      if (dto.applicationIds && dto.applicationIds.length > 0) {
        query = tx
          .select()
          .from(preAdmissions)
          .where(
            and(
              eq(preAdmissions.organizationId, orgId),
              inArray(preAdmissions.id, dto.applicationIds),
              inArray(preAdmissions.campusId, effectiveScope.effectiveCampusIds)
            )
          );
      }

      const apps = await query;
      const appIds = apps.map((a) => a.id);

      let docs: any[] = [];
      let fees: any[] = [];
      if (appIds.length > 0) {
        docs = await tx
          .select()
          .from(preAdmissionDocuments)
          .where(
            and(
              eq(preAdmissionDocuments.organizationId, orgId),
              inArray(preAdmissionDocuments.applicationId, appIds)
            )
          );

        fees = await tx
          .select()
          .from(preAdmissionFeePayments)
          .where(
            and(
              eq(preAdmissionFeePayments.organizationId, orgId),
              inArray(preAdmissionFeePayments.applicationId, appIds)
            )
          );
      }

      const docMap = new Map<string, any[]>();
      for (const d of docs) {
        const arr = docMap.get(d.applicationId) || [];
        arr.push(d);
        docMap.set(d.applicationId, arr);
      }

      const feeMap = new Map<string, any>();
      for (const f of fees) {
        feeMap.set(f.applicationId, f);
      }

      let dataClearCount = 0;
      let dataReviewCount = 0;
      let docsClearCount = 0;
      let docsReviewCount = 0;
      let feeClearCount = 0;
      let feeReviewCount = 0;
      let readyCount = 0;
      let needsReviewCount = 0;
      const branchRows = await tx.select().from(branches).where(eq(branches.organizationId, orgId));
      const branchMap = new Map(branchRows.map((b) => [b.id, b.name]));

      const items: SystemCheckItemDto[] = [];

      for (const app of apps) {
        const appDocs = docMap.get(app.id) || [];
        const appFee = feeMap.get(app.id);
        const policy = resolveApplicationReviewPolicyForScope(app.campusId, app.schoolId);
        const requiredDocs = policy.documents.filter((d) => d.isRequired);

        const issues: VerificationIssue[] = [];
        const issueBadges: string[] = [];

        // 1. Data Verification Check
        let dataCheckStatus: 'CLEAR' | 'NEEDS_REVIEW' = 'CLEAR';
        if (!app.studentName || app.studentName.trim().length < 2) {
          dataCheckStatus = 'NEEDS_REVIEW';
          issueBadges.push('Missing Student Name');
          issues.push({ code: 'MISSING_REQUIRED', severity: 'ERROR', field: 'studentName', message: 'Student name is required' });
        }
        if (!app.fatherOrGuardianName || app.fatherOrGuardianName.trim().length < 2) {
          dataCheckStatus = 'NEEDS_REVIEW';
          issueBadges.push('Missing Guardian');
          issues.push({ code: 'MISSING_REQUIRED', severity: 'ERROR', field: 'fatherOrGuardianName', message: 'Guardian name is required' });
        }
        if (!app.primaryMobile || !/^((\+92)|(0092)|(0))?3[0-9]{2}[-]?[0-9]{7}$/.test(app.primaryMobile)) {
          dataCheckStatus = 'NEEDS_REVIEW';
          issueBadges.push('Invalid Mobile');
          issues.push({ code: 'INVALID_MOBILE', severity: 'ERROR', field: 'primaryMobile', message: 'Mobile format is invalid' });
        }
        if (app.fatherCnic && !/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(app.fatherCnic)) {
          dataCheckStatus = 'NEEDS_REVIEW';
          issueBadges.push('Invalid CNIC');
          issues.push({ code: 'INVALID_CNIC', severity: 'WARNING', field: 'fatherCnic', message: 'CNIC format is invalid' });
        }
        if (app.studentName && /test|dummy|1234|asdf/i.test(app.studentName)) {
          dataCheckStatus = 'NEEDS_REVIEW';
          issueBadges.push('Suspicious / Dummy Data');
          issues.push({ code: 'SUSPICIOUS_DUMMY_DATA', severity: 'WARNING', field: 'studentName', message: 'Suspicious dummy student name detected' });
        }
        if (app.verificationStatus === 'POSSIBLE_DUPLICATE' || (app as any).duplicateMatches?.length > 0) {
          dataCheckStatus = 'NEEDS_REVIEW';
          issueBadges.push('Possible Duplicate');
          issues.push({ code: 'POSSIBLE_DUPLICATE', severity: 'WARNING', message: 'Possible duplicate application detected in catalog' });
        }

        if (dataCheckStatus === 'CLEAR') dataClearCount++;
        else dataReviewCount++;

        // 2. Documents Verification Check
        let docsCheckStatus: 'CLEAR' | 'NEEDS_REVIEW' | 'NOT_REQUIRED' = 'CLEAR';
        let verifiedRatio = `${appDocs.length}/${requiredDocs.length}`;
        if (requiredDocs.length === 0) {
          docsCheckStatus = 'NOT_REQUIRED';
          verifiedRatio = 'N/A';
          docsClearCount++;
        } else {
          const uploadedCodes = new Set(appDocs.map((d) => d.documentCode));
          let missingRequired = false;
          let hasUnreadable = false;
          let hasMismatch = false;

          for (const req of requiredDocs) {
            if (!uploadedCodes.has(req.code)) {
              missingRequired = true;
              issueBadges.push(`Missing ${req.name}`);
              issues.push({ code: 'MISSING_REQUIRED', severity: 'ERROR', message: `Required document '${req.name}' is missing` });
            }
          }

          for (const doc of appDocs) {
            if (doc.systemVerificationStatus === 'UNREADABLE' && doc.staffVerificationStatus !== 'STAFF_VERIFIED') {
              hasUnreadable = true;
              issueBadges.push(`Unreadable Document`);
              issues.push({ code: 'UNREADABLE_DOCUMENT' as any, severity: 'WARNING', message: `Document '${doc.documentName}' is unreadable` });
            } else if (doc.systemVerificationStatus === 'POSSIBLE_MISMATCH' && doc.staffVerificationStatus !== 'STAFF_VERIFIED') {
              hasMismatch = true;
              issueBadges.push(`Document Mismatch`);
              issues.push({ code: 'DATA_MISMATCH' as any, severity: 'WARNING', message: `Document data mismatch in '${doc.documentName}'` });
            }
          }

          if (missingRequired || hasUnreadable || hasMismatch) {
            docsCheckStatus = 'NEEDS_REVIEW';
            docsReviewCount++;
          } else {
            docsCheckStatus = 'CLEAR';
            docsClearCount++;
          }
        }

        // 3. Application Fee Check (Multi-Dimension Verification)
        let feeCheckStatus: 'CLEAR' | 'NEEDS_REVIEW' | 'NOT_REQUIRED' = 'CLEAR';
        let feeStatusBadge = 'Pending';
        const feeDoc = appDocs.find((d) => d.documentCode === 'DOC_FEE_RECEIPT' || d.documentCode === 'DOC_PAYMENT_SLIP');
        const requiredFeeAmount = policy.feePolicy.feeEnabled ? policy.feePolicy.amount : 0;
        const parentPaidAmount = appFee?.amount !== undefined ? appFee.amount : (appFee?.paymentStatus === 'PAID_VERIFIED' ? requiredFeeAmount : 0);
        const transactionReference = appFee?.transactionReference;
        const paymentDate = appFee?.paymentDate;
        const paymentMethod = appFee?.paymentMethod;
        const receiptFileUrl = appFee?.receiptFileUrl || feeDoc?.fileUrl;
        const receiptDocId = feeDoc?.id;
        const receiptDocCode = feeDoc?.documentCode;
        const systemFeeIssues: string[] = [];

        let humanFeeStatus: 'PENDING' | 'PAID_VERIFIED' | 'WAIVED' | 'MISMATCH' | 'NOT_REQUIRED' | 'UNPAID' = 'PENDING';
        let systemFeeResult: 'CLEAR' | 'NEEDS_REVIEW' | 'UNPAID' | 'NOT_REQUIRED' = 'CLEAR';

        if (!policy.feePolicy.feeEnabled) {
          feeCheckStatus = 'NOT_REQUIRED';
          feeStatusBadge = 'N/A';
          humanFeeStatus = 'NOT_REQUIRED';
          systemFeeResult = 'NOT_REQUIRED';
          feeClearCount++;
        } else {
          const currentFeeStatus = appFee?.paymentStatus || 'PENDING';
          if (currentFeeStatus === 'PAID_VERIFIED' || currentFeeStatus === 'PAID') {
            feeCheckStatus = 'CLEAR';
            feeStatusBadge = 'Paid';
            humanFeeStatus = 'PAID_VERIFIED';
            systemFeeResult = 'CLEAR';
            feeClearCount++;
          } else if (currentFeeStatus === 'WAIVED') {
            feeCheckStatus = 'CLEAR';
            feeStatusBadge = 'Waived';
            humanFeeStatus = 'WAIVED';
            systemFeeResult = 'CLEAR';
            feeClearCount++;
          } else if (currentFeeStatus === 'MISMATCH') {
            feeCheckStatus = 'NEEDS_REVIEW';
            feeStatusBadge = 'Mismatch';
            humanFeeStatus = 'MISMATCH';
            systemFeeResult = 'NEEDS_REVIEW';
            systemFeeIssues.push('Amount Mismatch');
            issueBadges.push('Fee Mismatch');
            issues.push({ code: 'FEE_MISMATCH' as any, severity: 'ERROR', message: `Application fee mismatch: Required Rs. ${requiredFeeAmount}, Parent entered Rs. ${parentPaidAmount}` });
            feeReviewCount++;
          } else {
            // PENDING or SUBMITTED
            humanFeeStatus = 'PENDING';
            const hasAmount = parentPaidAmount > 0;
            const isAmountMatch = parentPaidAmount === requiredFeeAmount;
            const hasSlip = !!receiptFileUrl;
            const isSlipUnreadable = feeDoc?.systemVerificationStatus === 'UNREADABLE';

            if (hasAmount && isAmountMatch && hasSlip && !isSlipUnreadable) {
              feeCheckStatus = 'CLEAR';
              feeStatusBadge = 'Paid / Clear ✓';
              systemFeeResult = 'CLEAR';
              feeClearCount++;
            } else if (hasAmount && !isAmountMatch) {
              feeCheckStatus = 'NEEDS_REVIEW';
              feeStatusBadge = 'Amount Mismatch';
              systemFeeResult = 'NEEDS_REVIEW';
              systemFeeIssues.push(`Amount Mismatch (Req: Rs. ${requiredFeeAmount}, Paid: Rs. ${parentPaidAmount})`);
              issueBadges.push('Amount Mismatch');
              issues.push({ code: 'FEE_MISMATCH' as any, severity: 'ERROR', message: `Amount mismatch: Required Rs. ${requiredFeeAmount}, Paid Rs. ${parentPaidAmount}` });
              feeReviewCount++;
            } else if (hasAmount && !hasSlip) {
              feeCheckStatus = 'NEEDS_REVIEW';
              feeStatusBadge = 'Slip Missing';
              systemFeeResult = 'NEEDS_REVIEW';
              systemFeeIssues.push('Payment Slip Missing');
              issueBadges.push('Payment Slip Missing');
              issues.push({ code: 'MISSING_REQUIRED' as any, severity: 'WARNING', message: 'Payment slip receipt was not uploaded by parent' });
              feeReviewCount++;
            } else if (hasAmount && isSlipUnreadable) {
              feeCheckStatus = 'NEEDS_REVIEW';
              feeStatusBadge = 'Slip Unreadable';
              systemFeeResult = 'NEEDS_REVIEW';
              systemFeeIssues.push('Slip Unreadable');
              issueBadges.push('Slip Unreadable');
              issues.push({ code: 'UNREADABLE_DOCUMENT' as any, severity: 'WARNING', message: 'Uploaded payment slip is unreadable; human inspection required' });
              feeReviewCount++;
            } else {
              feeCheckStatus = 'NEEDS_REVIEW';
              feeStatusBadge = 'Unpaid';
              humanFeeStatus = 'UNPAID';
              systemFeeResult = 'UNPAID';
              systemFeeIssues.push('Payment Pending');
              issueBadges.push('Fee Pending');
              feeReviewCount++;
            }
          }
        }

        const isEligibleForBulkFee =
          policy.feePolicy.feeEnabled &&
          systemFeeResult === 'CLEAR' &&
          humanFeeStatus !== 'PAID_VERIFIED' &&
          humanFeeStatus !== 'WAIVED' &&
          humanFeeStatus !== 'NOT_REQUIRED';

        // System Result
        const isSystemReady =
          dataCheckStatus === 'CLEAR' &&
          (docsCheckStatus === 'CLEAR' || docsCheckStatus === 'NOT_REQUIRED') &&
          (feeCheckStatus === 'CLEAR' || feeCheckStatus === 'NOT_REQUIRED');

        const systemResult: 'READY' | 'NEEDS_REVIEW' = isSystemReady ? 'READY' : 'NEEDS_REVIEW';
        if (systemResult === 'READY') readyCount++;
        else needsReviewCount++;

        // Human verification status (NEVER overwritten by system check)
        let humanStatus: any = 'PENDING';
        if (app.verificationStatus === 'STAFF_VERIFIED') humanStatus = 'VERIFIED';
        else if (app.verificationStatus === 'REJECTED') humanStatus = 'REJECTED';
        else if (app.verificationStatus === 'NEEDS_REVIEW') humanStatus = 'NEEDS_REVIEW';

        const isEligibleForBulk = systemResult === 'READY' && humanStatus !== 'VERIFIED';

        items.push({
          id: app.id,
          applicationNumber: app.applicationNumber,
          studentName: app.studentName,
          fatherOrGuardianName: app.fatherOrGuardianName,
          campusId: app.campusId,
          campusName: branchMap.get(app.campusId) || 'Campus',
          classId: app.classId,
          className: app.classId || 'Class',
          academicYearId: app.academicYearId,
          dataCheckStatus,
          docsCheckStatus,
          docsVerifiedRatio: verifiedRatio,
          feeCheckStatus,
          feeStatusBadge,
          systemResult,
          humanVerificationStatus: humanStatus,
          issueBadges: Array.from(new Set(issueBadges)),
          issues,
          isEligibleForBulkHumanVerify: isEligibleForBulk,

          // ── Fee Dimension ──
          feePaymentId: appFee?.id,
          requiredFeeAmount,
          parentPaidAmount,
          paymentMethod,
          transactionReference,
          paymentDate,
          receiptFileUrl,
          receiptDocCode,
          receiptDocId,
          systemFeeResult,
          systemFeeIssues,
          humanFeeStatus,
          isEligibleForBulkFeeVerify: isEligibleForBulkFee,
        });
      }

      let filteredItems = items;
      if (dto.tab === 'READY' || dto.filterTab === 'READY') {
        filteredItems = items.filter((i) => i.systemResult === 'READY');
      } else if (dto.tab === 'NEEDS_REVIEW' || dto.filterTab === 'NEEDS_REVIEW') {
        filteredItems = items.filter((i) => i.systemResult === 'NEEDS_REVIEW');
      } else if (dto.filterTab === 'DATA') {
        filteredItems = items.filter((i) => i.dataCheckStatus === 'NEEDS_REVIEW');
      } else if (dto.filterTab === 'DOCS') {
        filteredItems = items.filter((i) => i.docsCheckStatus === 'NEEDS_REVIEW');
      } else if (dto.filterTab === 'FEE') {
        filteredItems = items.filter((i) => i.feeCheckStatus === 'NEEDS_REVIEW');
      }

      return {
        summary: {
          totalScanned: apps.length,
          totalApplications: apps.length,
          readyForHumanVerification: readyCount,
          readyCount,
          needsReview: needsReviewCount,
          needsReviewCount,
          dataClear: dataClearCount,
          dataClearCount,
          dataReview: dataReviewCount,
          dataReviewCount,
          docsClear: docsClearCount,
          docsClearCount,
          docsReview: docsReviewCount,
          docsReviewCount,
          feeClear: feeClearCount,
          feeClearCount,
          feeReview: feeReviewCount,
          feeReviewCount,
        } as any,
        items: filteredItems,
        scannedAt: new Date().toISOString(),
      };
    });
  }

  public async bulkVerifyFeePayments(
    dto: BulkVerifyFeePaymentsDto,
    userScope: UserScopeContext
  ): Promise<BulkVerifyFeePaymentsResponseDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const now = new Date();
      let targetPaymentIds = dto.paymentIds || [];

      if (dto.applicationIds && dto.applicationIds.length > 0) {
        const fees = await tx
          .select()
          .from(preAdmissionFeePayments)
          .where(
            and(
              eq(preAdmissionFeePayments.organizationId, orgId),
              inArray(preAdmissionFeePayments.applicationId, dto.applicationIds)
            )
          );
        targetPaymentIds = Array.from(new Set([...targetPaymentIds, ...fees.map((f) => f.id)]));
      }

      if (targetPaymentIds.length === 0) {
        return {
          verifiedCount: 0,
          verifiedPaymentIds: [],
          verifiedBy: dto.verifiedBy || userScope.userRole || 'Admissions Staff',
          verifiedAt: now.toISOString(),
        };
      }

      const verifiedRecords = await tx
        .update(preAdmissionFeePayments)
        .set({
          paymentStatus: 'PAID_VERIFIED',
          verifiedBy: dto.verifiedBy || userScope.userRole || 'Admissions Staff',
          verifiedAt: now,
          verificationNotes: dto.notes || 'Verified in bulk via Verification Center',
          updatedAt: now,
        })
        .where(
          and(
            eq(preAdmissionFeePayments.organizationId, orgId),
            inArray(preAdmissionFeePayments.id, targetPaymentIds)
          )
        )
        .returning();

      // Audit log per verified payment record
      for (const rec of verifiedRecords) {
        await this.auditService.logEvent(
          {
            organizationId: orgId,
            actorId: '99999999-9999-9999-9999-999999999999',
            actorEmail: dto.verifiedBy || userScope.userRole || 'Admissions Staff',
            module: 'ADMISSIONS',
            action: 'FEE_PAYMENT_VERIFIED',
            entityType: 'pre_admission_fee_payment',
            entityId: rec.id,
            afterState: rec,
            diff: {
              paymentStatus: { before: 'SUBMITTED', after: 'PAID_VERIFIED' },
            },
          },
          tx
        );
      }

      return {
        verifiedCount: verifiedRecords.length,
        verifiedPaymentIds: verifiedRecords.map((r) => r.id),
        verifiedBy: dto.verifiedBy || userScope.userRole || 'Admissions Staff',
        verifiedAt: now.toISOString(),
      };
    });
  }

  public async bulkHumanVerify(
    dto: BulkHumanVerifyDto,
    userScope: UserScopeContext
  ): Promise<BulkHumanVerifyResponseDto> {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    if (!dto.applicationIds || dto.applicationIds.length === 0) {
      return {
        verifiedCount: 0,
        verifiedApplicationIds: [],
        skippedFlaggedApplicationIds: [],
        verifiedBy: dto.verifiedBy,
        verifiedAt: new Date().toISOString(),
        advancedToStepNames: {},
      };
    }

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const effectiveScope = this.workingContextService.resolveEffectiveScope(
        userScope,
        dto.contextNodeId || userScope.workingContext?.nodeId,
        dto.contextNodeType || userScope.workingContext?.nodeType
      );

      const targetApps = await tx
        .select()
        .from(preAdmissions)
        .where(
          and(
            eq(preAdmissions.organizationId, orgId),
            inArray(preAdmissions.id, dto.applicationIds),
            inArray(preAdmissions.campusId, effectiveScope.effectiveCampusIds)
          )
        );

      // Query documents and fee payments
      let docs: any[] = [];
      let fees: any[] = [];
      const appIds = targetApps.map((a) => a.id);
      if (appIds.length > 0) {
        docs = await tx
          .select()
          .from(preAdmissionDocuments)
          .where(and(eq(preAdmissionDocuments.organizationId, orgId), inArray(preAdmissionDocuments.applicationId, appIds)));
        fees = await tx
          .select()
          .from(preAdmissionFeePayments)
          .where(and(eq(preAdmissionFeePayments.organizationId, orgId), inArray(preAdmissionFeePayments.applicationId, appIds)));
      }
      const docMap = new Map<string, any[]>();
      for (const d of docs) {
        const arr = docMap.get(d.applicationId) || [];
        arr.push(d);
        docMap.set(d.applicationId, arr);
      }
      const feeMap = new Map(fees.map((f: any) => [f.applicationId, f]));

      const cleanApps = targetApps.filter((a) => {
        const issues = (a.verificationIssues as any[]) || [];
        if (issues.length > 0 || a.verificationStatus === 'NEEDS_REVIEW' || a.verificationStatus === 'POSSIBLE_DUPLICATE' || a.verificationStatus === 'INVALID') {
          return false;
        }
        const appDocs = docMap.get(a.id) || [];
        const appFee = feeMap.get(a.id);
        const policy = resolveApplicationReviewPolicyForScope(a.campusId, a.schoolId);
        const requiredDocs = policy.documents.filter((d) => d.isRequired);
        const hasMissing = requiredDocs.some((r) => !appDocs.some((d) => d.documentCode === r.code));
        const hasUnreadable = appDocs.some((d) => d.systemVerificationStatus === 'UNREADABLE' || d.systemVerificationStatus === 'POSSIBLE_MISMATCH');
        if (hasMissing || hasUnreadable) return false;

        if (policy.feePolicy.feeEnabled) {
          const feeStatus = appFee?.paymentStatus;
          const isFeeClear = feeStatus === 'PAID_VERIFIED' || feeStatus === 'PAID' || feeStatus === 'WAIVED' || policy.feePolicy.collectionRule === 'PAYMENT_ALLOWED_ON_TEST_DAY';
          if (!isFeeClear) return false;
        }
        return true;
      });
      const skippedFlaggedIds = dto.applicationIds.filter((id) => !cleanApps.some((c) => c.id === id));

      const now = new Date();
      const verifiedIds: string[] = [];
      const advancedSteps: Record<string, string> = {};

      for (const app of cleanApps) {
        // Resolve process version to determine next journey step
        let nextStepName = 'Entrance Test';
        let nextStepType = 'ASSESSMENT_TEST';
        let nextStepId = 'step_entrance_test';

        if (app.processDefinitionId === 'proc_direct_interview') {
          nextStepName = 'Personal Interview';
          nextStepType = 'INTERVIEW';
          nextStepId = 'step_interview';
        } else if (app.processDefinitionId === 'proc_open_enrollment') {
          nextStepName = 'Final Admission Decision';
          nextStepType = 'DECISION';
          nextStepId = 'step_decision';
        }

        await tx
          .update(preAdmissions)
          .set({
            verificationStatus: 'STAFF_VERIFIED',
            status: 'IN_PROGRESS',
            currentStepId: nextStepId,
            currentStepName: nextStepName,
            currentStepType: nextStepType,
            verifiedBy: dto.verifiedBy,
            verifiedAt: now,
            verificationMethod: 'STAFF',
            updatedAt: now,
          })
          .where(eq(preAdmissions.id, app.id));

        // Also auto-verify documents & fee payment
        await tx
          .update(preAdmissionDocuments)
          .set({
            staffVerificationStatus: 'STAFF_VERIFIED',
            verifiedBy: dto.verifiedBy,
            verifiedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(preAdmissionDocuments.organizationId, orgId),
              eq(preAdmissionDocuments.applicationId, app.id),
              eq(preAdmissionDocuments.staffVerificationStatus, 'UNVERIFIED')
            )
          );

        await tx
          .update(preAdmissionFeePayments)
          .set({
            paymentStatus: 'PAID_VERIFIED',
            verifiedBy: dto.verifiedBy,
            verifiedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(preAdmissionFeePayments.organizationId, orgId),
              eq(preAdmissionFeePayments.applicationId, app.id),
              eq(preAdmissionFeePayments.paymentStatus, 'PENDING')
            )
          );

        verifiedIds.push(app.id);
        advancedSteps[app.id] = nextStepName;

        await this.auditService.logEvent(
          {
            organizationId: orgId,
            actorId: '99999999-9999-9999-9999-999999999999',
            actorEmail: dto.verifiedBy,
            module: 'ADMISSIONS',
            action: 'PRE_ADMISSION_HUMAN_VERIFIED',
            entityType: 'pre_admission',
            entityId: app.id,
            beforeState: app,
            afterState: { ...app, verificationStatus: 'STAFF_VERIFIED', currentStepName: nextStepName },
            diff: {
              verificationStatus: { before: app.verificationStatus, after: 'STAFF_VERIFIED' },
              currentStepName: { before: app.currentStepName, after: nextStepName },
            },
          },
          tx
        );
      }

      return {
        verifiedCount: verifiedIds.length,
        verifiedApplicationIds: verifiedIds,
        skippedFlaggedApplicationIds: skippedFlaggedIds,
        verifiedBy: dto.verifiedBy,
        verifiedAt: now.toISOString(),
        advancedToStepNames: advancedSteps,
      };
    });
  }

  public async singleHumanVerify(
    applicationId: string,
    verifiedByOrDto?: string | { verifiedBy?: string; overrideReason?: string },
    overrideReasonArg?: string,
    userScope?: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const verifiedBy = typeof verifiedByOrDto === 'object' ? (verifiedByOrDto?.verifiedBy || 'Admissions Staff') : (verifiedByOrDto || 'Admissions Staff');
    const overrideReason = typeof verifiedByOrDto === 'object' ? verifiedByOrDto?.overrideReason : overrideReasonArg;
    const verificationMethod = overrideReason ? 'OVERRIDE' : 'STAFF';
    const scope = (typeof verifiedByOrDto === 'object' ? (overrideReasonArg as any) : userScope) || userScope;
    const orgId = scope?.organizationId || CANONICAL_ORG_ID_A;

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, applicationId)));

      if (!app) throw new NotFoundException(`Application '${applicationId}' not found.`);

      let nextStepName = 'Entrance Test';
      let nextStepType = 'ASSESSMENT_TEST';
      let nextStepId = 'step_entrance_test';

      if (app.processDefinitionId === 'proc_direct_interview') {
        nextStepName = 'Personal Interview';
        nextStepType = 'INTERVIEW';
        nextStepId = 'step_interview';
      } else if (app.processDefinitionId === 'proc_open_enrollment') {
        nextStepName = 'Final Admission Decision';
        nextStepType = 'DECISION';
        nextStepId = 'step_decision';
      }

      const now = new Date();
      const [updated] = await tx
        .update(preAdmissions)
        .set({
          verificationStatus: 'STAFF_VERIFIED',
          status: 'IN_PROGRESS',
          currentStepId: nextStepId,
          currentStepName: nextStepName,
          currentStepType: nextStepType,
          verifiedBy,
          verifiedAt: now,
          verificationMethod,
          verificationOverrideReason: overrideReason || null,
          updatedAt: now,
        })
        .where(eq(preAdmissions.id, app.id))
        .returning();

      // Auto-verify documents & fee payment
      await tx
        .update(preAdmissionDocuments)
        .set({
          staffVerificationStatus: 'STAFF_VERIFIED',
          verifiedBy,
          verifiedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(preAdmissionDocuments.organizationId, orgId),
            eq(preAdmissionDocuments.applicationId, applicationId),
            eq(preAdmissionDocuments.staffVerificationStatus, 'UNVERIFIED')
          )
        );

      await tx
        .update(preAdmissionFeePayments)
        .set({
          paymentStatus: 'PAID_VERIFIED',
          verifiedBy,
          verifiedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(preAdmissionFeePayments.organizationId, orgId),
            eq(preAdmissionFeePayments.applicationId, applicationId),
            eq(preAdmissionFeePayments.paymentStatus, 'PENDING')
          )
        );

      await this.auditService.logEvent(
        {
          organizationId: orgId,
          actorId: '99999999-9999-9999-9999-999999999999',
          actorEmail: verifiedBy,
          module: 'ADMISSIONS',
          action: overrideReason ? 'PRE_ADMISSION_OVERRIDDEN_AND_VERIFIED' : 'PRE_ADMISSION_HUMAN_VERIFIED',
          entityType: 'pre_admission',
          entityId: app.id,
          beforeState: app,
          afterState: updated,
          diff: {
            verificationStatus: { before: app.verificationStatus, after: 'STAFF_VERIFIED' },
            overrideReason: { before: '', after: overrideReason || '' },
          },
        },
        tx
      );

      return this.mapRowToDto(updated);
    });
  }

  public async submitApplicationFeePayment(
    applicationId: string,
    dto: {
      paidYesNo: 'YES' | 'NO';
      amount?: number;
      paymentMethod?: any;
      transactionReference?: string;
      receiptFileName?: string;
      receiptFileUrl?: string;
      payerName?: string;
      payerMobile?: string;
    },
    userScope?: UserScopeContext
  ): Promise<ApplicationFeePaymentDto> {
    const orgId = userScope?.organizationId || CANONICAL_ORG_ID_A;
    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const [app] = await tx
        .select()
        .from(preAdmissions)
        .where(and(eq(preAdmissions.organizationId, orgId), eq(preAdmissions.id, applicationId)));

      if (!app) throw new NotFoundException(`Application '${applicationId}' not found.`);

      const policy = resolveApplicationReviewPolicyForScope(app.campusId, app.schoolId);
      const [existingFee] = await tx
        .select()
        .from(preAdmissionFeePayments)
        .where(and(eq(preAdmissionFeePayments.organizationId, orgId), eq(preAdmissionFeePayments.applicationId, applicationId)));

      const now = new Date();
      const paymentStatus: ApplicationFeePaymentStatus = dto.paidYesNo === 'YES' ? 'PAID_VERIFIED' : 'PENDING';

      let savedFee: any;
      if (existingFee) {
        const [updated] = await tx
          .update(preAdmissionFeePayments)
          .set({
            amount: dto.amount ?? existingFee.amount,
            paymentMethod: dto.paymentMethod || existingFee.paymentMethod,
            transactionReference: dto.transactionReference || existingFee.transactionReference,
            receiptFileUrl: dto.receiptFileUrl || dto.receiptFileName || existingFee.receiptFileUrl,
            payerName: dto.payerName || existingFee.payerName || app.fatherOrGuardianName,
            payerMobile: dto.payerMobile || existingFee.payerMobile || app.primaryMobile,
            paymentStatus,
            updatedAt: now,
          })
          .where(eq(preAdmissionFeePayments.id, existingFee.id))
          .returning();
        savedFee = updated;
      } else {
        const [inserted] = await tx
          .insert(preAdmissionFeePayments)
          .values({
            organizationId: orgId,
            schoolId: app.schoolId,
            campusId: app.campusId,
            applicationId: app.id,
            feeName: policy.feePolicy.feeName,
            amount: dto.amount ?? policy.feePolicy.amount,
            currency: policy.feePolicy.currency,
            collectionRule: policy.feePolicy.collectionRule,
            paymentStatus,
            paymentMethod: dto.paymentMethod,
            transactionReference: dto.transactionReference,
            receiptFileUrl: dto.receiptFileUrl || dto.receiptFileName,
            voucherReference: `VCH-${app.applicationNumber}-${Math.floor(1000 + Math.random() * 9000)}`,
            paymentDate: now.toISOString().slice(0, 10),
            payerName: dto.payerName || app.fatherOrGuardianName,
            payerMobile: dto.payerMobile || app.primaryMobile,
          })
          .returning();
        savedFee = inserted;
      }

      return {
        ...savedFee,
        applicationNumber: app.applicationNumber,
        studentName: app.studentName,
      };
    });
  }
}

function processMatchName(processBinding: ActiveProcessRegistryItem | null): string | null {
  return processBinding?.name || null;
}
