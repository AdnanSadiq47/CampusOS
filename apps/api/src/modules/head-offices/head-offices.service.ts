import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  TenantTransactionManager,
  headOffices,
  regions,
  schools,
  hierarchyNodes,
  hierarchyNodeTypes,
  auditLogs,
  eq,
  and,
  sql,
} from '@campus-os/database';
import {
  CreateHeadOfficeDto,
  UpdateHeadOfficeDto,
  HeadOfficeListItemDto,
  HeadOfficeDetailDto,
} from '@campus-os/types';

@Injectable()
export class HeadOfficesService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  // ─────────────────────────────────────────────────────────────────
  //  CREATE
  // ─────────────────────────────────────────────────────────────────

  async createHeadOffice(tenantId: string, dto: CreateHeadOfficeDto, userId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanCode = dto.code.trim().toUpperCase();
      const cleanName = dto.name.trim();

      // 1. Uniqueness check per tenant
      const [existing] = await tx
        .select({ id: headOffices.id })
        .from(headOffices)
        .where(
          and(
            eq(headOffices.organizationId, tenantId),
            eq(headOffices.code, cleanCode)
          )
        )
        .limit(1);

      if (existing) {
        throw new ConflictException(
          `A Head Office with code '${cleanCode}' already exists in this organization.`
        );
      }

      // 2. Ensure HEAD_OFFICE node type exists in hierarchy
      const hoNodeType = await this.ensureHeadOfficeNodeType(tx, tenantId);

      // 3. Resolve parent hierarchy node if provided or find organization root
      let parentNodeId: string | null = null;
      let nodePath = `root.${this.sanitizePath(cleanCode)}`;

      if (dto.parentId) {
        const [parentNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, dto.parentId)
            )
          )
          .limit(1);

        if (parentNode) {
          parentNodeId = parentNode.id;
          nodePath = `${parentNode.path}.${this.sanitizePath(cleanCode)}`;
        }
      } else {
        // Try to find root node for tenant
        const [rootNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              sql`${hierarchyNodes.parentId} IS NULL`
            )
          )
          .limit(1);

        if (rootNode) {
          parentNodeId = rootNode.id;
          nodePath = `${rootNode.path}.${this.sanitizePath(cleanCode)}`;
        }
      }

      // 4. Create hierarchy_nodes entry
      const [node] = await tx
        .insert(hierarchyNodes)
        .values({
          organizationId: tenantId,
          nodeTypeId: hoNodeType.id,
          parentId: parentNodeId,
          code: cleanCode,
          name: cleanName,
          path: nodePath,
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // 5. Create head_offices record
      const [newHeadOffice] = await tx
        .insert(headOffices)
        .values({
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          parentId: parentNodeId,
          code: cleanCode,
          name: cleanName,
          shortName: dto.shortName?.trim() || null,
          description: dto.description?.trim() || null,
          directorName: dto.directorName?.trim() || null,
          email: dto.email?.trim() || null,
          phone: dto.phone?.trim() || null,
          alternatePhone: dto.alternatePhone?.trim() || null,
          website: dto.website?.trim() || null,
          country: dto.country?.trim() || 'Pakistan',
          province: dto.province?.trim() || null,
          city: dto.city?.trim() || null,
          area: dto.area?.trim() || null,
          address: dto.address?.trim() || null,
          postalCode: dto.postalCode?.trim() || null,
          notes: dto.notes?.trim() || null,
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // 6. Audit trail
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ?? null,
        actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
        entityType: 'head_office',
        entityId: newHeadOffice!.id,
        action: 'CREATE',
        beforeState: null,
        afterState: newHeadOffice,
      });

      return newHeadOffice!;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST (with connected units count: regions + direct schools)
  // ─────────────────────────────────────────────────────────────────

  async listHeadOffices(
    tenantId: string,
    activeOnly: boolean = false
  ): Promise<HeadOfficeListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const conditions = [eq(headOffices.organizationId, tenantId)];
      if (activeOnly) {
        conditions.push(eq(headOffices.isActive, true));
      }

      const rows = await tx
        .select({
          id: headOffices.id,
          organizationId: headOffices.organizationId,
          hierarchyNodeId: headOffices.hierarchyNodeId,
          parentId: headOffices.parentId,
          code: headOffices.code,
          name: headOffices.name,
          shortName: headOffices.shortName,
          description: headOffices.description,
          directorName: headOffices.directorName,
          email: headOffices.email,
          phone: headOffices.phone,
          city: headOffices.city,
          province: headOffices.province,
          country: headOffices.country,
          isActive: headOffices.isActive,
          createdAt: headOffices.createdAt,
          updatedAt: headOffices.updatedAt,
        })
        .from(headOffices)
        .where(and(...conditions))
        .orderBy(headOffices.name);

      // Aggregate child regions and direct child schools per head office
      const results: HeadOfficeListItemDto[] = [];

      for (const row of rows) {
        // Count regions attached to this Head Office's hierarchy node
        const [regionCountRes] = await tx
          .select({ count: sql<number>`cast(count(${regions.id}) as int)` })
          .from(regions)
          .where(
            and(
              eq(regions.organizationId, tenantId),
              eq(regions.parentId, row.hierarchyNodeId)
            )
          );

        // Count schools directly attached to this Head Office's hierarchy node
        const [schoolCountRes] = await tx
          .select({ count: sql<number>`cast(count(${schools.id}) as int)` })
          .from(schools)
          .where(
            and(
              eq(schools.organizationId, tenantId),
              eq(schools.parentId, row.hierarchyNodeId)
            )
          );

        const rCount = Number(regionCountRes?.count || 0);
        const sCount = Number(schoolCountRes?.count || 0);

        results.push({
          ...row,
          regionCount: rCount,
          schoolCount: sCount,
          connectedUnitsCount: rCount + sCount,
        });
      }

      return results;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET BY ID
  // ─────────────────────────────────────────────────────────────────

  async getHeadOffice(tenantId: string, id: string): Promise<HeadOfficeDetailDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [ho] = await tx
        .select()
        .from(headOffices)
        .where(
          and(
            eq(headOffices.organizationId, tenantId),
            eq(headOffices.id, id)
          )
        )
        .limit(1);

      if (!ho) {
        throw new NotFoundException(`Head Office '${id}' not found in this organization.`);
      }

      const [regionCountRes] = await tx
        .select({ count: sql<number>`cast(count(${regions.id}) as int)` })
        .from(regions)
        .where(
          and(
            eq(regions.organizationId, tenantId),
            eq(regions.parentId, ho.hierarchyNodeId)
          )
        );

      const [schoolCountRes] = await tx
        .select({ count: sql<number>`cast(count(${schools.id}) as int)` })
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.parentId, ho.hierarchyNodeId)
          )
        );

      const rCount = Number(regionCountRes?.count || 0);
      const sCount = Number(schoolCountRes?.count || 0);

      return {
        ...ho,
        regionCount: rCount,
        schoolCount: sCount,
        connectedUnitsCount: rCount + sCount,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────────────────────────

  async updateHeadOffice(
    tenantId: string,
    id: string,
    dto: UpdateHeadOfficeDto,
    userId?: string
  ) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(headOffices)
        .where(
          and(
            eq(headOffices.organizationId, tenantId),
            eq(headOffices.id, id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Head Office '${id}' not found in this organization.`);
      }

      // Check code uniqueness if changing code
      if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
        const cleanCode = dto.code.trim().toUpperCase();
        const [dup] = await tx
          .select({ id: headOffices.id })
          .from(headOffices)
          .where(
            and(
              eq(headOffices.organizationId, tenantId),
              eq(headOffices.code, cleanCode)
            )
          )
          .limit(1);

        if (dup) {
          throw new ConflictException(
            `A Head Office with code '${cleanCode}' already exists in this organization.`
          );
        }
      }

      const patch: Partial<typeof headOffices.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.name !== undefined) patch.name = dto.name.trim();
      if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
      if (dto.shortName !== undefined) patch.shortName = dto.shortName?.trim() || null;
      if (dto.description !== undefined) patch.description = dto.description?.trim() || null;
      if (dto.directorName !== undefined) patch.directorName = dto.directorName?.trim() || null;
      if (dto.email !== undefined) patch.email = dto.email?.trim() || null;
      if (dto.phone !== undefined) patch.phone = dto.phone?.trim() || null;
      if (dto.alternatePhone !== undefined) patch.alternatePhone = dto.alternatePhone?.trim() || null;
      if (dto.website !== undefined) patch.website = dto.website?.trim() || null;
      if (dto.country !== undefined) patch.country = dto.country?.trim() || 'Pakistan';
      if (dto.province !== undefined) patch.province = dto.province?.trim() || null;
      if (dto.city !== undefined) patch.city = dto.city?.trim() || null;
      if (dto.area !== undefined) patch.area = dto.area?.trim() || null;
      if (dto.address !== undefined) patch.address = dto.address?.trim() || null;
      if (dto.postalCode !== undefined) patch.postalCode = dto.postalCode?.trim() || null;
      if (dto.notes !== undefined) patch.notes = dto.notes?.trim() || null;
      if (dto.isActive !== undefined) patch.isActive = dto.isActive;

      const [updated] = await tx
        .update(headOffices)
        .set(patch)
        .where(
          and(
            eq(headOffices.organizationId, tenantId),
            eq(headOffices.id, id)
          )
        )
        .returning();

      // Sync name & active status to hierarchy_nodes entry
      if (dto.name || dto.isActive !== undefined) {
        await tx
          .update(hierarchyNodes)
          .set({
            name: dto.name?.trim() || existing.name,
            isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, existing.hierarchyNodeId)
            )
          );
      }

      // Audit log
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ?? null,
        actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
        entityType: 'head_office',
        entityId: id,
        action: 'UPDATE',
        beforeState: existing,
        afterState: updated,
      });

      return updated!;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  TOGGLE STATUS (Safe deactivation without deleting children)
  // ─────────────────────────────────────────────────────────────────

  async toggleHeadOfficeStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId?: string
  ) {
    return this.updateHeadOffice(tenantId, id, { isActive }, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  //  ELIGIBLE PARENTS (Root or Organization Nodes)
  // ─────────────────────────────────────────────────────────────────

  async getEligibleParents(tenantId: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: hierarchyNodes.id,
          code: hierarchyNodes.code,
          name: hierarchyNodes.name,
          path: hierarchyNodes.path,
          nodeTypeCode: hierarchyNodeTypes.code,
        })
        .from(hierarchyNodes)
        .leftJoin(
          hierarchyNodeTypes,
          eq(hierarchyNodes.nodeTypeId, hierarchyNodeTypes.id)
        )
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.isActive, true)
          )
        )
        .orderBy(hierarchyNodes.name);

      const EXCLUDE = ['HEAD_OFFICE', 'REGION', 'SCHOOL', 'BRANCH', 'CAMPUS'];
      const eligible = rows.filter(
        (r) => !EXCLUDE.includes((r.nodeTypeCode ?? '').toUpperCase())
      );

      return eligible.length > 0 ? eligible : rows;
    });
  }

  // ── PRIVATE HELPERS ──────────────────────────────────────────────

  private async ensureHeadOfficeNodeType(tx: any, tenantId: string) {
    const [existing] = await tx
      .select()
      .from(hierarchyNodeTypes)
      .where(
        and(
          eq(hierarchyNodeTypes.organizationId, tenantId),
          eq(hierarchyNodeTypes.code, 'HEAD_OFFICE')
        )
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await tx
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: tenantId,
        code: 'HEAD_OFFICE',
        name: 'Head Office',
        levelOrder: 10,
        allowFinancialPosting: true,
        allowUserAssignment: true,
        isActive: true,
      })
      .returning();

    return created!;
  }

  private sanitizePath(code: string): string {
    return code
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
