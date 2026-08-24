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
export type TestResultPublishingRule = 'IMMEDIATE' | 'AFTER_STAFF_APPROVAL' | 'ON_SCHEDULED_DATE';
export type TestOutcome = 'PASSED' | 'FAILED' | 'NEEDS_REVIEW' | 'ABSENT' | 'CANCELLED';
export type TestResultStatus = 'DRAFT' | 'READY' | 'PUBLISHED';

export interface AssessmentTestStepConfig {
  testRequired: boolean;
  assessmentName: string;
  passMarks?: number;
  totalMarks?: number;
  cutoffPercentage?: number;
  attemptLimit?: number;
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
export interface TestScheduleDto {
  id: string;
  organizationId: string;
  assessmentName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  campusId: string;
  campusName: string;
  venueRoom: string;
  mode: TestMode;
  capacity?: number;
  instructions?: string;
  assignedApplicantCount: number;
  createdAt: Date | string;
}

export interface TestScheduleAssignmentDto {
  id: string;
  scheduleId: string;
  applicationId: string;
  applicationNumber: string;
  studentName: string;
  applicantCampusId: string;
  applicantCampusName: string;
  scheduleCampusId: string;
  scheduleCampusName: string;
  venueRoom: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'ATTENDED' | 'ABSENT' | 'RESCHEDULED' | 'CANCELLED';
  rescheduledFromScheduleId?: string;
  rescheduledReason?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  outcome?: TestOutcome;
  resultStatus: TestResultStatus;
  publishedAt?: Date | string;
  remarks?: string;
  reviewedBy?: string;
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
