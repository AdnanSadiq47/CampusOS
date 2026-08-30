import { UserSummaryDto } from './head-office.js';
import { ProvisionAccountDto, LinkedAccountSummaryDto } from './iam.js';

export enum SchoolPermissions {
  CREATE = 'SCHOOL_CREATE',
  VIEW = 'SCHOOL_VIEW',
  EDIT = 'SCHOOL_EDIT',
  STATUS_CHANGE = 'SCHOOL_STATUS_CHANGE',
  DELETE = 'SCHOOL_DELETE',
}

export enum SchoolType {
  SCHOOL = 'SCHOOL',
  COLLEGE = 'COLLEGE',
  UNIVERSITY = 'UNIVERSITY',
  ACADEMY_INSTITUTE = 'ACADEMY_INSTITUTE',
}

export interface SchoolTypeOption {
  code: SchoolType | string;
  label: string;
  description?: string;
}

export const CANONICAL_SCHOOL_TYPES: readonly SchoolTypeOption[] = [
  { code: SchoolType.SCHOOL, label: 'School', description: 'Primary, secondary, and K-12 schooling institutions' },
  { code: SchoolType.COLLEGE, label: 'College', description: 'Intermediate, higher secondary, and degree colleges' },
  { code: SchoolType.UNIVERSITY, label: 'University', description: 'Undergraduate, postgraduate, and research universities' },
  { code: SchoolType.ACADEMY_INSTITUTE, label: 'Academy / Institute', description: 'Vocational academies, coaching centres, and specialized training institutes' },
] as const;

export const VALID_SCHOOL_TYPE_CODES = new Set<string>([
  SchoolType.SCHOOL,
  SchoolType.COLLEGE,
  SchoolType.UNIVERSITY,
  SchoolType.ACADEMY_INSTITUTE,
  // Backward compatibility aliases
  'K12',
  'PRIMARY',
  'SECONDARY',
  'HIGHER_SECONDARY',
  'MIDDLE',
  'MONTESSORI',
]);

export interface CreateSchoolDto {
  name: string;
  code: string;
  headOfficeId: string;
  regionId?: string | null;
  parentId?: string;
  schoolType?: string;
  registrationNumber?: string | null;
  educationBoard?: string | null;
  principalName?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postalCode?: string | null;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  website?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  whatsappNumber?: string | null;
  logoUrl?: string | null;
  customDomain?: string | null;
  defaultLanguage?: string | null;
  timezone?: string | null;
  notes?: string | null;
  status?: boolean;
  account?: ProvisionAccountDto;
}

export interface UpdateSchoolDto {
  name?: string;
  headOfficeId?: string;
  regionId?: string | null;
  parentId?: string;
  schoolType?: string;
  registrationNumber?: string | null;
  educationBoard?: string | null;
  principalName?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postalCode?: string | null;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  website?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  whatsappNumber?: string | null;
  logoUrl?: string | null;
  customDomain?: string | null;
  defaultLanguage?: string | null;
  timezone?: string | null;
  notes?: string | null;
  isActive?: boolean;
  account?: ProvisionAccountDto;
}

export interface SchoolListItemDto {
  id: string;
  organizationId: string;
  hierarchyNodeId: string;
  parentId: string;
  headOfficeId?: string | null;
  headOfficeName?: string | null;
  headOfficeCode?: string | null;
  regionId?: string | null;
  regionName?: string | null;
  regionCode?: string | null;
  code: string;
  name: string;
  parentName: string;
  parentType: string;
  schoolType?: string | null;
  registrationNumber?: string | null;
  educationBoard?: string | null;
  principalName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  address?: string | null;
  area?: string | null;
  postalCode?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  whatsappNumber?: string | null;
  logoUrl?: string | null;
  branchCount: number;
  isActive: boolean;
  linkedAccount?: LinkedAccountSummaryDto | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdByUser?: UserSummaryDto | null;
  updatedByUser?: UserSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolDetailDto extends SchoolListItemDto {
  alternatePhone?: string | null;
  address?: string | null;
  area?: string | null;
  postalCode?: string | null;
  website?: string | null;
  customDomain?: string | null;
  defaultLanguage: string;
  timezone: string;
  currency?: string | null;
  notes?: string | null;
}

export interface EligibleParentNodeDto {
  id: string;
  name: string;
  code: string;
  type: string; // 'HEAD_OFFICE' | 'REGION' | etc.
  path: string;
}

export interface SchoolDependenciesDto {
  canDelete: boolean;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  totalDependencies: number;
  breakdown: {
    branches: number;
    admissions: number;
    academicSetup: number;
    userAssignments: number;
    hierarchyChildren: number;
  };
  reasons: string[];
}
