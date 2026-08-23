import { ConfigOwnerType, ConfigScopeType, ConfigSourceOrigin } from './academic.js';

export type AdmissionStepType =
  | 'PRE_ADMISSION'
  | 'APPLICATION_REVIEW'
  | 'DOCUMENT_VERIFICATION'
  | 'REGISTRATION_FEE'
  | 'ASSESSMENT_TEST'
  | 'INTERVIEW'
  | 'ELIGIBILITY_REVIEW'
  | 'APPROVAL'
  | 'WAITING_LIST'
  | 'SEAT_CONFIRMATION'
  | 'INITIAL_ADMISSION_FEE'
  | 'FINAL_ADMISSION_FORM'
  | 'STUDENT_REGISTRATION';

export type AdmissionStepCategory =
  | 'APPLICATION'
  | 'ASSESSMENT'
  | 'DECISION'
  | 'CONFIRMATION'
  | 'REGISTRATION';

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

// Notification Domain Event Names
export type AdmissionProcessDomainEvent =
  | 'PRE_ADMISSION_SUBMITTED'
  | 'JOURNEY_STARTED'
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'STEP_SKIPPED'
  | 'STEP_HELD'
  | 'DOCUMENTS_REQUIRED'
  | 'TEST_SCHEDULED'
  | 'INTERVIEW_SCHEDULED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_ON_HOLD'
  | 'ADMISSION_CONFIRMED'
  | 'STUDENT_CREATED';
