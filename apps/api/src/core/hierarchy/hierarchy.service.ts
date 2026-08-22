import { Injectable } from '@nestjs/common';
import { TenantTransactionManager, hierarchyNodeTypes, hierarchyNodes } from '@campus-os/database';
import { eq, asc } from 'drizzle-orm';
import { CreateHierarchyNodeTypeInput, CreateHierarchyNodeInput } from '@campus-os/types';

@Injectable()
export class HierarchyService {
  constructor(private readonly tenantManager: TenantTransactionManager) {}

  async listNodeTypes(tenantId: string) {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      return tx.query.hierarchyNodeTypes.findMany({
        where: eq(hierarchyNodeTypes.organizationId, tenantId),
        orderBy: [asc(hierarchyNodeTypes.levelOrder)],
      });
    });
  }

  async createNodeType(tenantId: string, input: CreateHierarchyNodeTypeInput) {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      const [nodeType] = await tx
        .insert(hierarchyNodeTypes)
        .values({
          organizationId: tenantId,
          code: input.code,
          name: input.name,
          levelOrder: input.levelOrder,
          allowFinancialPosting: input.allowFinancialPosting,
          allowUserAssignment: input.allowUserAssignment,
        })
        .returning();
      return nodeType;
    });
  }

  async listNodes(tenantId: string) {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      return tx.query.hierarchyNodes.findMany({
        where: eq(hierarchyNodes.organizationId, tenantId),
        orderBy: [asc(hierarchyNodes.name)],
      });
    });
  }

  async createNode(tenantId: string, input: CreateHierarchyNodeInput) {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      let nodePath = input.code.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      if (input.parentId) {
        const parentNode = await tx.query.hierarchyNodes.findFirst({
          where: eq(hierarchyNodes.id, input.parentId),
        });
        if (parentNode) {
          nodePath = `${parentNode.path}.${nodePath}`;
        }
      }

      const [node] = await tx
        .insert(hierarchyNodes)
        .values({
          organizationId: tenantId,
          nodeTypeId: input.nodeTypeId,
          parentId: input.parentId || null,
          code: input.code,
          name: input.name,
          path: nodePath,
          address: input.address || {},
          contactInfo: input.contactInfo || {},
          metadata: input.metadata || {},
        })
        .returning();

      return node;
    });
  }
}
