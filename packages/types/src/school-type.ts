/**
 * School Type DTOs & Interfaces
 */

export interface CreateSchoolTypeDto {
  code: string;
  name: string;
  description?: string;
  status?: boolean; // isActive
}

export interface UpdateSchoolTypeDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface SchoolTypeListItemDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  schoolCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolTypeDetailDto extends SchoolTypeListItemDto {
  // Additional metadata if needed in future
}
