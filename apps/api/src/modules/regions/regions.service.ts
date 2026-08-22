import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  TenantTransactionManager,
  regions,
  hierarchyNodes,
  hierarchyNodeTypes,
  auditLogs,
  eq,
  and,
  sql,
} from '@campus-os/database';
import {
  CreateRegionDto,
  UpdateRegionDto,
  RegionListItemDto,
  EligibleRegionParentNodeDto,
} from '@campus-os/types';

@Injectable()
export class RegionsService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  /**
   * Ensure a REGION hierarchy node type exists for this organization, or create it.
   */
  private async ensureRegionNodeType(tx: any, tenantId: string) {
    const [existing] = await tx
      .select()
      .from(hierarchyNodeTypes)
      .where(
        and(
          eq(hierarchyNodeTypes.organizationId, tenantId),
          eq(hierarchyNodeTypes.code, 'REGION')
        )
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await tx
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: tenantId,
        code: 'REGION',
        name: 'Regional Office',
        levelOrder: 20,
        allowFinancialPosting: true,
        allowUserAssignment: true,
      })
      .returning();

    return created;
  }

  /**
   * Sanitize a string for use as an ltree label (lowercase, alphanumeric + underscore only)
   */
  private sanitizePath(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // ─────────────────────────────────────────────────────────────────
  //  CREATE
  // ─────────────────────────────────────────────────────────────────

  async createRegion(tenantId: string, dto: CreateRegionDto, userId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanCode = dto.code.trim().toUpperCase();
      const cleanName = dto.name.trim();

      // 1. Check duplicate code within tenant
      const [existingRegion] = await tx
        .select({ id: regions.id })
        .from(regions)
        .where(
          and(
            eq(regions.organizationId, tenantId),
            eq(regions.code, cleanCode)
          )
        )
        .limit(1);

      if (existingRegion) {
        throw new ConflictException(
          `A Regional Office with code '${cleanCode}' already exists in this organization.`
        );
      }

      // 2. Validate parent hierarchy node belongs to this tenant
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

      if (!parentNode) {
        throw new NotFoundException(
          `Parent hierarchy node '${dto.parentId}' not found in this organization.`
        );
      }

      // 3. Ensure REGION node type exists (create lazily if needed)
      const regionNodeType = await this.ensureRegionNodeType(tx, tenantId);

      // 4. Build ltree path: parent.path.region_code
      const pathLabel = this.sanitizePath(cleanCode);
      const nodePath = `${parentNode.path}.${pathLabel}`;

      // 5. Create hierarchy_nodes entry
      const [node] = await tx
        .insert(hierarchyNodes)
        .values({
          organizationId: tenantId,
          nodeTypeId: regionNodeType.id,
          parentId: parentNode.id,
          code: cleanCode,
          name: cleanName,
          path: nodePath,
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // 6. Create region record
      const [newRegion] = await tx
        .insert(regions)
        .values({
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          parentId: parentNode.id,
          code: cleanCode,
          name: cleanName,
          shortName: dto.shortName?.trim() || null,
          directorName: dto.directorName?.trim() || null,
          email: dto.email?.trim() || null,
          phone: dto.phone?.trim() || null,
          alternatePhone: dto.alternatePhone?.trim() || null,
          website: dto.website?.trim() || null,
          address: dto.address?.trim() || null,
          area: dto.area?.trim() || null,
          city: dto.city?.trim() || null,
          province: dto.province?.trim() || null,
          postalCode: dto.postalCode?.trim() || null,
          notes: dto.notes?.trim() || null,
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // 7. Audit trail
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ?? null,
        entityType: 'region',
        entityId: newRegion!.id,
        action: 'CREATE',
        afterState: newRegion,
      });

      return newRegion;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST
  // ─────────────────────────────────────────────────────────────────

  async listRegions(
    tenantId: string,
    filters?: { search?: string; status?: string; parentId?: string }
  ): Promise<RegionListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // Raw query so we can join parent names and count schools
      const rows = await tx.execute(sql`
        SELECT
          r.id,
          r.organization_id,
          r.hierarchy_node_id,
          r.parent_id,
          pn.name AS parent_name,
          r.code,
          r.name,
          r.short_name,
          r.director_name,
          r.email,
          r.phone,
          r.city,
          r.province,
          r.is_active,
          r.created_at,
          r.updated_at,
          COUNT(DISTINCT s.id)::int AS school_count
        FROM regions r
        LEFT JOIN hierarchy_nodes pn ON pn.id = r.parent_id
        LEFT JOIN schools s ON s.parent_id = r.hierarchy_node_id AND s.organization_id = r.organization_id
        WHERE r.organization_id = ${tenantId}
        GROUP BY r.id, pn.name
        ORDER BY r.name ASC
      `);

      let results: RegionListItemDto[] = (rows.rows as any[]).map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        hierarchyNodeId: row.hierarchy_node_id,
        parentId: row.parent_id,
        parentName: row.parent_name ?? 'Head Office',
        code: row.code,
        name: row.name,
        shortName: row.short_name ?? null,
        directorName: row.director_name ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        city: row.city ?? null,
        province: row.province ?? null,
        schoolCount: Number(row.school_count ?? 0),
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      // Apply search filter in memory
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (r) =>
            r.code.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q) ||
            (r.city ?? '').toLowerCase().includes(q) ||
            (r.directorName ?? '').toLowerCase().includes(q) ||
            (r.email ?? '').toLowerCase().includes(q)
        );
      }

      if (filters?.status && filters.status !== 'ALL') {
        const isActive = filters.status === 'ACTIVE';
        results = results.filter((r) => r.isActive === isActive);
      }

      if (filters?.parentId && filters.parentId !== 'ALL') {
        results = results.filter((r) => r.parentId === filters.parentId);
      }

      return results;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET ONE
  // ─────────────────────────────────────────────────────────────────

  async getRegion(tenantId: string, id: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [region] = await tx
        .select()
        .from(regions)
        .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)))
        .limit(1);

      if (!region) {
        throw new NotFoundException(`Regional Office '${id}' not found.`);
      }

      return region;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────────────────────────

  async updateRegion(tenantId: string, id: string, dto: UpdateRegionDto, userId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(regions)
        .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Regional Office '${id}' not found.`);
      }

      const updatePayload: Partial<typeof dto> = {
        ...dto,
        updatedAt: new Date(),
      } as any;

      const [updated] = await tx
        .update(regions)
        .set(updatePayload)
        .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)))
        .returning();

      // Sync name to hierarchy_nodes
      if (dto.name !== undefined) {
        await tx
          .update(hierarchyNodes)
          .set({ name: dto.name, updatedAt: new Date() })
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, existing.hierarchyNodeId)
            )
          );
      }

      // Sync isActive to hierarchy_nodes
      if (dto.isActive !== undefined) {
        await tx
          .update(hierarchyNodes)
          .set({ isActive: dto.isActive, updatedAt: new Date() })
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, existing.hierarchyNodeId)
            )
          );
      }

      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ?? null,
        entityType: 'region',
        entityId: id,
        action: 'UPDATE',
        beforeState: existing,
        afterState: updated,
      });

      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  TOGGLE STATUS
  // ─────────────────────────────────────────────────────────────────

  async toggleRegionStatus(tenantId: string, id: string, isActive: boolean, userId?: string) {
    return this.updateRegion(tenantId, id, { isActive }, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  //  ELIGIBLE PARENTS — any active node that is not itself a REGION,
  //  SCHOOL, or BRANCH (supports all valid hierarchy depths)
  // ─────────────────────────────────────────────────────────────────

  async getEligibleParents(tenantId: string): Promise<EligibleRegionParentNodeDto[]> {
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

      // Architecture invariant: Head Office is OPTIONAL. A Region may attach to any
      // hierarchy node that is not itself a Region/School/Branch to support all valid
      // customer hierarchy structures:
      //   Org → HO → Region (standard)
      //   Org → HO → Region (no region yet — attach to HO)
      //   Org → School → Region (flat hierarchy)
      //   Org → (root) → Region (minimal hierarchy)
      // Exclude node types that would create circular nesting.
      const EXCLUDE_AS_PARENT = ['REGION', 'SCHOOL', 'BRANCH', 'CAMPUS'];
      const eligible = rows.filter(
        (r) => !EXCLUDE_AS_PARENT.includes((r.nodeTypeCode ?? '').toUpperCase())
      );

      // If no eligible parents found yet (fresh tenant with no hierarchy), allow all active nodes
      const result = eligible.length > 0 ? eligible : rows;

      return result.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        nodeTypeCode: r.nodeTypeCode ?? '',
        path: r.path,
      }));
    });
  }
}

