export interface CreateSchoolDto {
  name: string;
  code: string;
  parentId: string; // Head Office or Region hierarchy node ID
  status?: boolean;
  schoolType?: string;
  registrationNumber?: string;
  educationBoard?: string;
  principalName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  area?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  website?: string;
  logoUrl?: string;
  customDomain?: string;
  defaultLanguage?: string;
  timezone?: string;
  currency?: string;
  notes?: string;
}

export interface UpdateSchoolDto {
  name?: string;
  parentId?: string;
  schoolType?: string;
  registrationNumber?: string;
  educationBoard?: string;
  principalName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  area?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  website?: string;
  logoUrl?: string;
  customDomain?: string;
  defaultLanguage?: string;
  timezone?: string;
  currency?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SchoolListItemDto {
  id: string;
  organizationId: string;
  hierarchyNodeId: string;
  code: string;
  name: string;
  parentId: string;
  parentName: string;
  parentType: string;
  schoolType?: string | null;
  registrationNumber?: string | null;
  educationBoard?: string | null;
  principalName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  branchCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EligibleParentNodeDto {
  id: string;
  name: string;
  code: string;
  type: string; // 'HEAD_OFFICE' | 'REGION' | etc.
  path: string;
}
