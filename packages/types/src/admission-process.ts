import { ConfigOwnerType, ConfigScopeType, ConfigSourceOrigin } from './academic.js';

// 1. Canonical Step Types
export type AdmissionStepType =
  // APPLICATION
  | 'PRE_ADMISSION'
  | 'APPLICATION_REVIEW'
  | 'DOCUMENT_VERIFICATION'
  // PAYMENT
  | 'APPLICATION_FEE'
  // ASSESSMENT
  | 'ASSESSMENT_TEST'
  | 'INTERVIEW'
  // DECISION
  | 'ADMISSION_DECISION'
  | 'WAITING_LIST'
  // CONFIRMATION
  | 'PARENT_CONFIRMATION'
  | 'SEAT_CONFIRMATION'
  | 'ADMISSION_FEE'
  | 'FINAL_ADMISSION_FORM'
  // SYSTEM
  | 'STUDENT_REGISTRATION'
  // Backward compatibility legacy aliases
  | 'REGISTRATION_FEE'
  | 'INITIAL_ADMISSION_FEE'
  | 'APPROVAL'
  | 'ELIGIBILITY_REVIEW';

// 2. Step Categories
export type AdmissionStepCategory =
  | 'APPLICATION'
  | 'PAYMENT'
  | 'ASSESSMENT'
  | 'DECISION'
  | 'CONFIRMATION'
  | 'SYSTEM'
  | 'REGISTRATION'; // Legacy alias for SYSTEM

export type AdmissionProcessStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type AdmissionProcessStarterTemplate =
  | 'SIMPLE'
  | 'STANDARD'
  | 'DETAILED'
  | 'CUSTOM';

export interface AdmissionStepNotificationSettings {
  notifyApplicant: boolean;
  notifyInternalTeam: boolean;
  customApplicantMessage?: string;
  customTeamMessage?: string;
}

// Step Specific Configurations
export interface ApplicationFeeStepConfig {
  feeRequired: boolean;
  feeName: string;
  amount: number;
  currency: string; // e.g. 'PKR', 'USD'
  paymentRequiredBeforeNextStep: boolean;
  allowWaiver: boolean;
  allowDiscount: boolean;
  dueRule?: string;
  receiptRequired: boolean;
  chargeDefinitionId?: string;
}

export type TestMode = 'PAPER_BASED' | 'COMPUTER_BASED' | 'ONLINE' | 'HYBRID';
export type TestResultPublishingRule =
  | 'AUTOMATIC_AFTER_EVALUATION'
  | 'AFTER_STAFF_APPROVAL'
  | 'MANUAL_PUBLISH'
  | 'IMMEDIATE'
  | 'ON_SCHEDULED_DATE';
export type TestOutcome = 'PASSED' | 'FAILED' | 'NEEDS_REVIEW' | 'ABSENT' | 'CANCELLED';
export type TestResultStatus = 'DRAFT' | 'READY' | 'PUBLISHED';

export interface AssessmentTestStepConfig {
  testRequired: boolean;
  assessmentName: string;
  passMarks?: number;
  totalMarks?: number;
  cutoffPercentage?: number;
  attemptLimit?: number;
  allowRetest?: boolean;
  maxAttempts?: number;
  resultVisibleToParent?: boolean;
  sendResultNotification?: boolean;
  instructions?: string;
  mode: TestMode;
  resultPublishingRule: TestResultPublishingRule;
  assessmentDefinitionId?: string;
}

export type InterviewMode = 'PHYSICAL' | 'ONLINE';
export type InterviewMeetingProvider = 'GOOGLE_MEET' | 'MS_TEAMS' | 'ZOOM' | 'OTHER';
export type InterviewOutcome = 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'NEEDS_REVIEW' | 'ABSENT' | 'RESCHEDULE';

export interface InterviewStepConfig {
  interviewRequired: boolean;
  mode: InterviewMode;
  responsibleRole?: string;
  panelUserIds?: string[];
  attachedEvaluationFormId?: string;
  attachedEvaluationFormVersionId?: string;
  attachedEvaluationFormName?: string;
  durationMinutes?: number;
  meetingProvider?: InterviewMeetingProvider;
  instructions?: string;
}

export type AdmissionDecisionOutcome =
  | 'APPROVED'
  | 'APPROVED_WITH_CONDITION'
  | 'WAITING_LIST'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface AdmissionDecisionStepConfig {
  allowedOutcomes: AdmissionDecisionOutcome[];
  autoSuggestionEnabled?: boolean;
  minTestScoreForSuggestion?: number;
  requireHumanConfirmation: boolean;
  parentMessageTemplate?: string;
  internalNotesRequired?: boolean;
}

export type ParentConfirmationResponse = 'ACCEPT' | 'DECLINE' | 'NEED_MORE_TIME';

export interface ParentConfirmationStepConfig {
  expiryDays?: number;
  allowedResponses: ParentConfirmationResponse[];
  secureTokenExpiryHours?: number;
  autoReminderEnabled?: boolean;
}

export interface FinalAdmissionStepConfig {
  attachedFormDefinitionId?: string;
  attachedFormVersionId?: string;
  attachedFormName?: string;
  prefillFromPreAdmission: boolean;
  canonicalFieldMappings?: Record<string, string>;
}

export interface AdmissionProcessStepConfig {
  id: string;
  stepType: AdmissionStepType;
  displayName: string;
  category: AdmissionStepCategory;
  isRequired: boolean;
  sortOrder: number;
  attachedFormDefinitionId?: string;
  attachedFormVersionId?: string;
  attachedFormName?: string;
  responsibleRole?: string;
  responsibleUserId?: string;
  autoMoveToNext?: boolean;
  allowHold?: boolean;
  allowReject?: boolean;
  instructions?: string;
  notifications?: AdmissionStepNotificationSettings;
  isSystemTerminal?: boolean; // For Student Registration
  // Specialized Step Configs
  feeConfig?: ApplicationFeeStepConfig;
  testConfig?: AssessmentTestStepConfig;
  interviewConfig?: InterviewStepConfig;
  decisionConfig?: AdmissionDecisionStepConfig;
  confirmationConfig?: ParentConfirmationStepConfig;
  finalAdmissionConfig?: FinalAdmissionStepConfig;
}

export interface AdmissionProcessDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  starterTemplate: AdmissionProcessStarterTemplate;
  status: AdmissionProcessStatus;
  currentVersionNumber: number;
  publishedVersionId?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  ownerType: ConfigOwnerType;
  ownerId?: string | null;
  sourceOrigin: ConfigSourceOrigin;
  isInherited: boolean;
  canEdit: boolean;
  canActivate: boolean;
  steps: AdmissionProcessStepConfig[];
  totalStepsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AdmissionProcessVersionDto {
  id: string;
  organizationId: string;
  processDefinitionId: string;
  versionNumber: number;
  status: AdmissionProcessStatus;
  steps: AdmissionProcessStepConfig[];
  publishedAt?: Date | string | null;
  publishedByUserId?: string | null;
  changelogSummary?: string | null;
  createdAt: Date | string;
}

export interface CreateAdmissionProcessDto {
  name: string;
  code?: string;
  description?: string;
  starterTemplate?: AdmissionProcessStarterTemplate;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  steps?: AdmissionProcessStepConfig[];
}

export interface UpdateAdmissionProcessDto {
  name?: string;
  description?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  steps?: AdmissionProcessStepConfig[];
}

// Scheduling & Operational Models
export type AdmissionTestStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RESULTS_PENDING'
  | 'RESULTS_PUBLISHED'
  | 'CANCELLED';

export type CandidateAssignmentStrategy =
  | 'INDIVIDUAL_STUDENTS'
  | 'SELECTED_STUDENTS'
  | 'CLASS_GRADE'
  | 'CAMPUS'
  | 'MULTIPLE_CAMPUSES'
  | 'ALL_ELIGIBLE_APPLICANTS';

export interface AdmissionTestScheduleDto {
  id: string;
  organizationId: string;
  scheduleCode: string;
  name: string;
  processDefinitionId: string;
  processVersionId: string;
  processStepId: string;
  processStepName?: string;
  academicYearId: string;
  academicYearName?: string;
  classIds: string[];
  classNames: string[];
  mode: TestMode;
  date: string; // YYYY-MM-DD
  reportingTime?: string; // HH:mm
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  durationMinutes: number;
  venueType: 'CAMPUS' | 'EXTERNAL';
  venueCampusId?: string;
  venueCampusName?: string;
  venueBuilding?: string;
  venueRoom?: string;
  venueInstructions?: string;
  totalMarks?: number;
  passMarks?: number;
  resultPublishingRule?: TestResultPublishingRule;
  status: AdmissionTestStatus;
  totalCandidatesCount: number;
  attendedCount?: number;
  passedCount?: number;
  failedCount?: number;
  resultsStatus?: string;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Backward compatibility alias
export type TestScheduleDto = AdmissionTestScheduleDto;

export interface AdmissionTestCandidateDto {
  id: string;
  testScheduleId: string;
  testScheduleCode?: string;
  testName?: string;
  preAdmissionId: string;
  applicationNumber: string;
  studentName: string;
  className: string;
  classId?: string;
  applicantCampusId: string;
  applicantCampusName: string;
  venueCampusId?: string;
  venueCampusName?: string;
  scheduleCampusId?: string;
  scheduleCampusName?: string;
  venueRoom?: string;
  scheduledDate: string;
  reportingTime?: string;
  scheduledTime: string;
  durationMinutes: number;
  mode: TestMode;
  status: 'SCHEDULED' | 'RESCHEDULED' | 'ATTENDED' | 'ABSENT' | 'COMPLETED' | 'CANCELLED';
  rescheduledFromScheduleId?: string;
  rescheduledReason?: string;
  rescheduledAt?: Date | string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  outcome?: TestOutcome;
  resultStatus: TestResultStatus;
  publishedAt?: Date | string;
  remarks?: string;
  reviewedBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Backward compatibility alias
export type TestScheduleAssignmentDto = AdmissionTestCandidateDto;

export interface CreateAdmissionTestScheduleDto {
  name: string;
  processDefinitionId: string;
  processStepId: string;
  academicYearId: string;
  classIds: string[];
  mode: TestMode;
  date: string;
  reportingTime?: string;
  startTime: string;
  durationMinutes: number;
  venueType?: 'CAMPUS' | 'EXTERNAL';
  venueCampusId?: string;
  venueCampusName?: string;
  venueBuilding?: string;
  venueRoom?: string;
  venueInstructions?: string;
  candidateStrategy?: CandidateAssignmentStrategy;
  candidatePreAdmissionIds: string[];
  isDraft?: boolean;
}

export interface RescheduleCandidateDto {
  candidateId: string;
  newDate: string;
  newStartTime: string;
  newReportingTime?: string;
  newVenueCampusId?: string;
  newVenueRoom?: string;
  reason: string;
}

export interface TestScheduleSummaryDto {
  totalScheduled: number;
  todayCount: number;
  completedCount: number;
  resultsPendingCount: number;
}

export interface InterviewSlotDto {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  applicationId?: string;
  studentName?: string;
}

export interface InterviewScheduleDto {
  id: string;
  organizationId: string;
  date: string;
  startTime: string;
  endTime: string;
  campusId: string;
  campusName: string;
  venueRoom?: string;
  mode: InterviewMode;
  meetingLink?: string;
  interviewerRole?: string;
  interviewerName?: string;
  slots: InterviewSlotDto[];
  totalSlots: number;
  bookedSlots: number;
  createdAt: Date | string;
}

export interface InterviewAssignmentDto {
  id: string;
  scheduleId: string;
  slotId?: string;
  applicationId: string;
  applicationNumber: string;
  studentName: string;
  date: string;
  time: string;
  mode: InterviewMode;
  venueOrMeetingLink?: string;
  interviewerName?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'ABSENT' | 'CANCELLED';
  outcome?: InterviewOutcome;
  evaluationFormData?: Record<string, any>;
  feedbackNotes?: string;
}

// Payment / Charge Models
export type PaymentStatus = 'NOT_GENERATED' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED' | 'CANCELLED';

export interface AdmissionChargeDto {
  id: string;
  applicationId: string;
  applicationNumber: string;
  feeType: 'APPLICATION_FEE' | 'ADMISSION_FEE';
  feeName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  dueDate?: string;
  paidAmount?: number;
  paidAt?: Date | string;
  paymentMethod?: 'CASH' | 'BANK' | 'CARD' | 'ONLINE_GATEWAY' | 'MANUAL_TRANSFER';
  transactionReference?: string;
  receiptNumber?: string;
  waiverReason?: string;
}

// Notification Domain Event Names (17 Canonical Events)
export type AdmissionProcessDomainEvent =
  | 'PRE_ADMISSION_SUBMITTED'
  | 'JOURNEY_STARTED'
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'STEP_SKIPPED'
  | 'STEP_HELD'
  | 'DOCUMENTS_REQUIRED'
  | 'APPLICATION_FEE_CREATED'
  | 'APPLICATION_FEE_PAID'
  | 'TEST_SCHEDULED'
  | 'TEST_RESCHEDULED'
  | 'TEST_CANCELLED'
  | 'TEST_STARTED'
  | 'TEST_COMPLETED'
  | 'TEST_RESULT_READY'
  | 'TEST_RESULT_PUBLISHED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_RESCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'INTERVIEW_RESULT_PUBLISHED'
  | 'ADMISSION_APPROVED'
  | 'ADMISSION_REJECTED'
  | 'WAITLISTED'
  | 'PARENT_CONFIRMATION_REQUESTED'
  | 'PARENT_CONFIRMATION_RECEIVED'
  | 'ADMISSION_FEE_CREATED'
  | 'ADMISSION_FEE_PAID'
  | 'ADMISSION_CONFIRMED'
  | 'STUDENT_CREATED';
