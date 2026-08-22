import { z } from 'zod';

export const MembershipStatusEnum = z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'TERMINATED']);
export type MembershipStatus = z.infer<typeof MembershipStatusEnum>;

export const MembershipTypeEnum = z.enum(['STAFF', 'STUDENT', 'PARENT', 'ALUMNI', 'AFFILIATE']);
export type MembershipType = z.infer<typeof MembershipTypeEnum>;

export interface OrganizationMembershipDTO {
  id: string;
  organizationId: string;
  organizationCode?: string;
  organizationName?: string;
  identityUserId: string;
  membershipType: MembershipType;
  status: MembershipStatus;
  validFrom: Date;
  validUntil?: Date | null;
  version: number;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeProfileDTO {
  id: string;
  organizationId: string;
  membershipId: string;
  employeeCode: string;
  designation?: string | null;
  employmentType: string;
  hireDate?: Date | null;
  details: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
