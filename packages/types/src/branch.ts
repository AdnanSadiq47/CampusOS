import { UserSummaryDto } from './head-office.js';
import { ProvisionAccountDto, LinkedAccountSummaryDto } from './iam.js';

export enum BranchPermissions {
  CREATE = 'BRANCH_CREATE',
  VIEW = 'BRANCH_VIEW',
  EDIT = 'BRANCH_EDIT',
  STATUS_CHANGE = 'BRANCH_STATUS_CHANGE',
  DELETE = 'BRANCH_DELETE',
}

/**
 * Branch DTOs & Interfaces
 */

export interface CreateBranchAdminUserDto {
  username: string;
  email: string;
  password?: string;
  forcePasswordChange?: boolean;
  roleId?: string;
}

export interface CreateBranchDto {
  schoolId: string;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  sortOrder?: number;
  logoUrl?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  website?: string;
  country?: string;
  countryId?: string | null;
  province?: string;
  stateId?: string | null;
  city?: string;
  cityId?: string | null;
  area?: string;
  areaId?: string | null;
  address?: string;
  postalCode?: string;
  notes?: string;
  status?: boolean; // isActive
  adminUser?: CreateBranchAdminUserDto;
  account?: ProvisionAccountDto;
}

export interface UpdateBranchDto {
  schoolId?: string;
  name?: string;
  shortName?: string;
  description?: string;
  sortOrder?: number;
  logoUrl?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  website?: string;
  country?: string;
  countryId?: string | null;
  province?: string;
  stateId?: string | null;
  city?: string;
  cityId?: string | null;
  area?: string;
  areaId?: string | null;
  address?: string;
  postalCode?: string;
  notes?: string;
  isActive?: boolean;
  account?: ProvisionAccountDto;
}

export interface ReorderBranchesDto {
  schoolId: string;
  branchIds: string[]; // Ordered list of branch IDs
}

export interface SuggestUsernameResponseDto {
  username: string;
  isAvailable: boolean;
  alternatives: string[];
}

export interface BranchListItemDto {
  id: string;
  organizationId: string;
  hierarchyNodeId: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  headOfficeName?: string | null;
  regionName?: string | null;
  code: string;
  name: string;
  shortName?: string | null;
  sortOrder: number;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  countryId?: string | null;
  province?: string | null;
  stateId?: string | null;
  city?: string | null;
  cityId?: string | null;
  area?: string | null;
  areaId?: string | null;
  adminUsername?: string | null;
  adminEmail?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  createdByUser?: UserSummaryDto | null;
  updatedBy?: string | null;
  updatedByUser?: UserSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchDetailDto extends BranchListItemDto {
  description?: string | null;
  alternatePhone?: string | null;
  website?: string | null;
  address?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  linkedAccount?: LinkedAccountSummaryDto | null;
}

export interface BranchDependenciesDto {
  canDelete: boolean;
  branchName: string;
  branchCode: string;
  totalDependencies: number;
  reasons: string[];
  breakdown: {
    classes: number;
    sections: number;
    academicYears: number;
    staffAssignments: number;
  };
}
