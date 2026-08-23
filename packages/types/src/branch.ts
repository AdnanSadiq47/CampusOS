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
  logoUrl?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  website?: string;
  country?: string;
  province?: string;
  city?: string;
  area?: string;
  address?: string;
  postalCode?: string;
  notes?: string;
  status?: boolean; // isActive
  adminUser?: CreateBranchAdminUserDto;
}

export interface UpdateBranchDto {
  name?: string;
  shortName?: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
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

export interface BranchListItemDto {
  id: string;
  organizationId: string;
  hierarchyNodeId: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  code: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  adminUsername?: string | null;
  adminEmail?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchDetailDto extends BranchListItemDto {
  description?: string | null;
  alternatePhone?: string | null;
  website?: string | null;
  area?: string | null;
  address?: string | null;
  postalCode?: string | null;
  notes?: string | null;
}
