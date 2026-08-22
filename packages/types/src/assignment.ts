import { z } from 'zod';

export const AssignmentStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']);
export type AssignmentStatus = z.infer<typeof AssignmentStatusEnum>;

export interface MembershipNodeAssignmentDTO {
  id: string;
  organizationId: string;
  membershipId: string;
  hierarchyNodeId: string;
  nodeCode?: string;
  nodeName?: string;
  nodePath?: string;
  isPrimary: boolean;
  status: AssignmentStatus;
  validFrom: Date;
  validUntil?: Date | null;
  assignedBy?: string | null;
  roles: AssignmentRoleDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentRoleDTO {
  id: string;
  organizationId: string;
  assignmentId: string;
  roleId: string;
  roleCode?: string;
  roleName?: string;
  createdAt: Date;
}
