/**
 * Head Office DTOs & Interfaces
 */

import { ProvisionAccountDto, LinkedAccountSummaryDto } from './iam.js';

export interface CreateHeadOfficeDto {
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  parentId?: string; // Optional root / parent hierarchy node
  directorName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  country?: string;
  province?: string;
  city?: string;
  area?: string;
  address?: string;
  postalCode?: string;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  notes?: string;
  status?: boolean; // isActive
  account?: ProvisionAccountDto;
}

export interface UpdateHeadOfficeDto {
  code?: string;
  name?: string;
  shortName?: string;
  description?: string;
  parentId?: string;
  directorName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  country?: string;
  province?: string;
  city?: string;
  area?: string;
  address?: string;
  postalCode?: string;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  notes?: string;
  isActive?: boolean;
  account?: ProvisionAccountDto;
}

export interface UserSummaryDto {
  id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface HeadOfficeListItemDto {
  id: string;
  organizationId: string;
  hierarchyNodeId: string;
  parentId?: string | null;
  code: string;
  name: string;
  shortName?: string | null;
  description?: string | null;
  directorName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  connectedUnitsCount: number; // Connected regions and direct schools
  regionCount: number;
  schoolCount: number;
  isActive: boolean;
  alternatePhone?: string | null;
  website?: string | null;
  address?: string | null;
  area?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  linkedAccount?: LinkedAccountSummaryDto | null;
  createdBy?: string | null;
  createdByUser?: UserSummaryDto | null;
  updatedBy?: string | null;
  updatedByUser?: UserSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeadOfficeDetailDto extends HeadOfficeListItemDto {
  alternatePhone?: string | null;
  website?: string | null;
  address?: string | null;
  area?: string | null;
  postalCode?: string | null;
  notes?: string | null;
}

export interface HeadOfficeDependenciesDto {
  headOfficeId: string;
  headOfficeName: string;
  headOfficeCode: string;
  canDelete: boolean;
  message?: string;
  dependencies: {
    regions: number;
    schools: number;
    campuses: number;
    userAssignments: number;
    childHierarchyNodes: number;
    total: number;
  };
}

export const HeadOfficePermissions = {
  CREATE: 'HEAD_OFFICE_CREATE',
  VIEW: 'HEAD_OFFICE_VIEW',
  EDIT: 'HEAD_OFFICE_EDIT',
  STATUS_CHANGE: 'HEAD_OFFICE_STATUS_CHANGE',
  DELETE: 'HEAD_OFFICE_DELETE',
} as const;
