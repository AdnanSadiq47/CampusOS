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
  address?: string;
  area?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  status?: boolean;
}

export interface UpdateRegionDto {
  name?: string;
  shortName?: string;
  directorName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  address?: string;
  area?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  isActive?: boolean;
}

export interface RegionListItemDto {
  id: string;
  organizationId: string;
  hierarchyNodeId: string;
  parentId: string;
  parentName: string;
  code: string;
  name: string;
  shortName: string | null;
  directorName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  schoolCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EligibleRegionParentNodeDto {
  id: string;
  code: string;
  name: string;
  nodeTypeCode: string;
  path: string;
}
