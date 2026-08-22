/**
 * Head Office DTOs & Interfaces
 */

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
  notes?: string;
  status?: boolean; // isActive
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
  notes?: string;
  isActive?: boolean;
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
  connectedUnitsCount: number; // Connected regions and direct schools
  regionCount: number;
  schoolCount: number;
  isActive: boolean;
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
