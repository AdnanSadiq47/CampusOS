/**
 * Region (Regional Office) DTOs and TypeScript interfaces
 *
 * Regions are OPTIONAL intermediate hierarchy tiers:
 * Organization / Network → Head Office → [Region] → School → Branch
 *
 * SECURITY INVARIANTS:
 * - No user credentials on region records (belong to identity_users)
 * - organization_id always set server-side from authenticated tenant context
 * - no hardcoded campus_id / branch_id fields
 */

import { UserSummaryDto } from './head-office.js';
import { ProvisionAccountDto, LinkedAccountSummaryDto } from './iam.js';

export interface CreateRegionDto {
  name: string;
  code: string;
  parentId: string; // hierarchy_nodes id of parent (typically Head Office)
  shortName?: string;
  directorName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  country?: string;
  address?: string;
  area?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  notes?: string;
  status?: boolean;
  isActive?: boolean;
  account?: ProvisionAccountDto;
}

export interface UpdateRegionDto {
  name?: string;
  parentId?: string;
  shortName?: string;
  directorName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  country?: string;
  address?: string;
  area?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  notes?: string;
  isActive?: boolean;
  status?: boolean;
  account?: ProvisionAccountDto;
}

export interface RegionListItemDto {
  id: string;
  organizationId: string;
  hierarchyNodeId: string;
  parentId: string;
  parentName: string;
  parentCode?: string;
  code: string;
  name: string;
  shortName: string | null;
  description?: string | null;
  directorName: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone?: string | null;
  website?: string | null;
  country?: string | null;
  address?: string | null;
  area?: string | null;
  city: string | null;
  province: string | null;
  postalCode?: string | null;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  notes?: string | null;
  schoolCount: number;
  campusCount?: number;
  isActive: boolean;
  linkedAccount?: LinkedAccountSummaryDto | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdByUser?: UserSummaryDto | null;
  updatedByUser?: UserSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegionDetailDto extends RegionListItemDto {}

export interface EligibleRegionParentNodeDto {
  id: string;
  code: string;
  name: string;
  nodeTypeCode: string;
  path: string;
}

export interface RegionDependenciesDto {
  regionId: string;
  regionName: string;
  regionCode: string;
  canDelete: boolean;
  message?: string;
  dependencies: {
    schools: number;
    campuses: number;
    userAssignments: number;
    childHierarchyNodes: number;
    total: number;
  };
}

export const RegionalOfficePermissions = {
  CREATE: 'REGIONAL_OFFICE_CREATE',
  VIEW: 'REGIONAL_OFFICE_VIEW',
  EDIT: 'REGIONAL_OFFICE_EDIT',
  STATUS_CHANGE: 'REGIONAL_OFFICE_STATUS_CHANGE',
  DELETE: 'REGIONAL_OFFICE_DELETE',
} as const;
