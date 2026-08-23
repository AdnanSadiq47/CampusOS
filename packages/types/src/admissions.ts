export type AdmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'ON_HOLD'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ENROLLED';

export type AdmissionGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AdmissionApplicationListItemDto {
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
  status: AdmissionStatus;
  appliedAt: Date | string;
  formDefinitionId?: string;
  publishedFormVersionId?: string;
  formVersionNumber?: number;
  submissionData?: Record<string, any>;
  assignedReviewer?: string;
  reviewNotes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AdmissionApplicationsSummaryDto {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  enrolled: number;
}

export interface AdmissionApplicationsFilterDto {
  search?: string;
  status?: AdmissionStatus | 'ALL';
  academicYearId?: string;
  classId?: string;
  campusId?: string;
  schoolId?: string;
  regionId?: string;
  boardId?: string;
  academicLevelId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'appliedAt' | 'applicationNumber' | 'studentName' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAdmissionApplicationsDto {
  items: AdmissionApplicationListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: AdmissionApplicationsSummaryDto;
}
