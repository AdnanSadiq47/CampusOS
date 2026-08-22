import { z } from 'zod';

export interface HierarchyNodeTypeDTO {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  levelOrder: number;
  allowFinancialPosting: boolean;
  allowUserAssignment: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface HierarchyNodeDTO {
  id: string;
  organizationId: string;
  nodeTypeId: string;
  parentId?: string | null;
  code: string;
  name: string;
  path: string; // ltree representation, e.g. "root.region_north.campus_isb"
  address?: Record<string, unknown>;
  contactInfo?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateHierarchyNodeTypeSchema = z.object({
  code: z.string().min(2).max(64),
  name: z.string().min(2).max(128),
  levelOrder: z.number().int().min(1),
  allowFinancialPosting: z.boolean().default(true),
  allowUserAssignment: z.boolean().default(true),
});

export type CreateHierarchyNodeTypeInput = z.infer<typeof CreateHierarchyNodeTypeSchema>;

export const CreateHierarchyNodeSchema = z.object({
  nodeTypeId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
  code: z.string().min(2).max(64),
  name: z.string().min(2).max(255),
  address: z.record(z.unknown()).optional(),
  contactInfo: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateHierarchyNodeInput = z.infer<typeof CreateHierarchyNodeSchema>;
