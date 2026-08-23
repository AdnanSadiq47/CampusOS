import { AdmissionStepType } from './admission-process.js';

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
  | 'COMPLETED';

export type PreAdmissionSource =
  | 'ONLINE'
  | 'STAFF_ENTRY'
  | 'WALK_IN'
  | 'IMPORT'
  | 'OTHER';

export type AdmissionGender = 'MALE' | 'FEMALE' | 'OTHER';

export type JourneyStepStatus =
  | 'COMPLETED'
  | 'CURRENT'
  | 'UPCOMING'
  | 'SKIPPED'
  | 'HELD';

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

// Backward compatibility alias
export type AdmissionApplicationListItemDto = PreAdmissionApplicationDto;

export interface PreAdmissionsSummaryDto {
  totalPreAdmissions: number;
  newSubmitted: number;
  inProcess: number;
  completed: number;
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
  formDefinitionId?: string;
  processDefinitionId?: string;
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
