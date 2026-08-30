import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import {
  TenantTransactionManager,
  regions,
  headOffices,
  schools,
  branches,
  membershipNodeAssignments,
  hierarchyNodes,
  hierarchyNodeTypes,
  identityUsers,
  eq,
  and,
  inArray,
  sql,
} from '@campus-os/database';
import {
  CreateRegionDto,
  UpdateRegionDto,
  RegionListItemDto,
  RegionDetailDto,
  EligibleRegionParentNodeDto,
  RegionDependenciesDto,
  RegionalOfficePermissions,
  UserSummaryDto,
  validateAndNormalizeContactFields,
} from '@campus-os/types';
import { AuditService } from '../../core/audit/audit.service.js';
import { provisionOrLinkAccountTx, resolveLinkedAccountTx } from '../../core/iam/iam-provisioning.util.js';
import { validateAndResolveGeographyHierarchy } from '../geography/geography-validation.util.js';

@Injectable()
export class RegionsService implements OnModuleInit {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

  async onModuleInit() {
    const orgId = '11111111-1111-1111-1111-111111111111';
    await this.txManager.runInTenantContext(orgId, async (tx) => {
      const [existing] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(regions)
        .where(eq(regions.organizationId, orgId));

      if (Number(existing?.count || 0) > 0) return;

      // Find Head Office or root node to anchor the default region
      const [ho] = await tx
        .select()
        .from(headOffices)
        .where(eq(headOffices.organizationId, orgId))
        .limit(1);

      let parentNodeId: string | null = null;
      let parentPath = 'root.ho_main';

      if (ho) {
        parentNodeId = ho.hierarchyNodeId;
        const [hoNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(eq(hierarchyNodes.id, ho.hierarchyNodeId))
          .limit(1);
        if (hoNode) parentPath = hoNode.path;
      } else {
        const [rootNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(and(eq(hierarchyNodes.organizationId, orgId), sql`${hierarchyNodes.parentId} IS NULL`))
          .limit(1);
        if (rootNode) {
          parentNodeId = rootNode.id;
          parentPath = rootNode.path;
        }
      }

      if (!parentNodeId) return;

      const regionNodeType = await this.ensureRegionNodeType(tx, orgId);

      const [node] = await tx
        .insert(hierarchyNodes)
        .values({
          organizationId: orgId,
          nodeTypeId: regionNodeType.id,
          parentId: parentNodeId,
          code: 'REG_SOUTH_01',
          name: 'South Regional Directorate',
          path: `${parentPath}.reg_south_01`,
          isActive: true,
        })
        .returning();

      await tx.insert(regions).values({
        organizationId: orgId,
        hierarchyNodeId: node!.id,
        parentId: parentNodeId,
        code: 'REG_SOUTH_01',
        name: 'South Regional Directorate',
        shortName: 'South Region',
        directorName: 'Mr. Ahmed Raza Khan',
        email: 'south.directorate@beaconhorizon.edu.pk',
        phone: '+92 21 34567891',
        country: 'Pakistan',
        province: 'Sindh',
        city: 'Karachi',
        address: 'Plot 12-C, Commercial Zone, Clifton Block 4',
        isActive: true,
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: '00000000-0000-0000-0000-000000000000',
      });
    });
  }

  /**
   * Helper to resolve an array of user UUIDs to full human-readable UserSummaryDtos
   */
  private async resolveUserSummaries(
    tx: any,
    userIds: (string | null | undefined)[]
  ): Promise<Map<string, UserSummaryDto>> {
    const userMap = new Map<string, UserSummaryDto>();
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean))) as string[];
    if (uniqueIds.length === 0) return userMap;

    try {
      const foundUsers = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
          firstName: identityUsers.firstName,
          lastName: identityUsers.lastName,
        })
        .from(identityUsers)
        .where(inArray(identityUsers.id, uniqueIds));

      for (const u of foundUsers) {
        userMap.set(u.id, {
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
        });
      }
    } catch {
      // Table may not exist or query fails gracefully
    }

    for (const uid of uniqueIds) {
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          id: uid,
          name: 'System User',
          email: 'system@campus-os.local',
        });
      }
    }

    return userMap;
  }

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
      let parentNode: any = null;
      const [byNodeId] = await tx
        .select()
        .from(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, dto.parentId)
          )
        )
        .limit(1);

      if (byNodeId) {
        parentNode = byNodeId;
      } else {
        const [ho] = await tx
          .select({ hierarchyNodeId: headOffices.hierarchyNodeId })
          .from(headOffices)
          .where(
            and(
              eq(headOffices.organizationId, tenantId),
              eq(headOffices.id, dto.parentId)
            )
          )
          .limit(1);
        if (ho) {
          const [byHoNode] = await tx
            .select()
            .from(hierarchyNodes)
            .where(
              and(
                eq(hierarchyNodes.organizationId, tenantId),
                eq(hierarchyNodes.id, ho.hierarchyNodeId)
              )
            )
            .limit(1);
          parentNode = byHoNode;
        }
      }

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

      const actorUserId = userId || '00000000-0000-0000-0000-000000000000';

      // 6. Validate & Resolve Geography Hierarchy
      const geo = await validateAndResolveGeographyHierarchy(tx, {
        countryId: dto.countryId,
        stateId: dto.stateId,
        cityId: dto.cityId,
        areaId: dto.areaId,
        country: dto.country,
        province: dto.province,
        city: dto.city,
        area: dto.area,
        postalCode: dto.postalCode,
      });

      // 6.5 Validate & normalize contact fields
      const contactVal = validateAndNormalizeContactFields({
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        website: dto.website,
      });
      if (!contactVal.valid) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed for structured contact fields',
          errors: contactVal.errors,
        });
      }

      // 7. Create region record
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
          email: contactVal.normalized.email,
          phone: contactVal.normalized.phone,
          alternatePhone: contactVal.normalized.alternatePhone,
          website: contactVal.normalized.website,
          country: geo.country || 'Pakistan',
          address: dto.address?.trim() || null,
          area: geo.area,
          city: geo.city,
          province: geo.province,
          postalCode: geo.postalCode,
          countryId: geo.countryId,
          stateId: geo.stateId,
          cityId: geo.cityId,
          areaId: geo.areaId,
          notes: dto.notes?.trim() || null,
          isActive: dto.status !== undefined ? dto.status : true,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        })
        .returning();

      // 8. Audit trail
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          actorId: actorUserId,
          actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'REGIONAL_OFFICE_CREATED',
          entityType: 'region',
          entityId: newRegion!.id,
          beforeState: null,
          afterState: newRegion,
        },
        tx
      );

      const userMap = await this.resolveUserSummaries(tx, [newRegion!.createdBy, newRegion!.updatedBy]);

      let linkedAccount = null;
      if (dto.account) {
        linkedAccount = await provisionOrLinkAccountTx(
          tx,
          tenantId,
          node!.id,
          dto.account,
          userId,
          'REGION',
          this.auditService
        );
      } else {
        linkedAccount = await resolveLinkedAccountTx(tx, tenantId, node!.id);
      }

      return {
        ...newRegion!,
        parentName: parentNode.name,
        parentCode: parentNode.code,
        schoolCount: 0,
        campusCount: 0,
        linkedAccount,
        createdByUser: userMap.get(newRegion!.createdBy || '') || null,
        updatedByUser: userMap.get(newRegion!.updatedBy || '') || null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST
  // ─────────────────────────────────────────────────────────────────

  async listRegions(
    tenantId: string,
    filters?: { search?: string; status?: string; parentId?: string; activeOnly?: boolean }
  ): Promise<RegionListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx.execute(sql`
        SELECT
          r.id,
          r.organization_id,
          r.hierarchy_node_id,
          r.parent_id,
          pn.name AS parent_name,
          pn.code AS parent_code,
          r.code,
          r.name,
          r.short_name,
          r.director_name,
          r.email,
          r.phone,
          r.alternate_phone,
          r.website,
          r.country,
          r.address,
          r.area,
          r.city,
          r.province,
          r.postal_code,
          r.country_id,
          r.state_id,
          r.city_id,
          r.area_id,
          r.notes,
          r.is_active,
          r.created_by,
          r.updated_by,
          r.created_at,
          r.updated_at,
          COUNT(DISTINCT s.id)::int AS school_count,
          COUNT(DISTINCT b.id)::int AS campus_count
        FROM regions r
        LEFT JOIN hierarchy_nodes pn ON pn.id = r.parent_id
        LEFT JOIN schools s ON (s.parent_id = r.hierarchy_node_id OR s.parent_id = r.id) AND s.organization_id = r.organization_id
        LEFT JOIN branches b ON b.school_id = s.id AND b.organization_id = r.organization_id
        WHERE r.organization_id = ${tenantId}
        GROUP BY r.id, pn.name, pn.code
        ORDER BY r.name ASC
      `);

      const rawList = (rows.rows as any[]) || [];
      const allUserIds = rawList.flatMap((r) => [r.created_by, r.updated_by]);
      const userMap = await this.resolveUserSummaries(tx, allUserIds);

      let results: RegionListItemDto[] = rawList.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        hierarchyNodeId: row.hierarchy_node_id,
        parentId: row.parent_id,
        parentName: row.parent_name ?? 'Head Office',
        parentCode: row.parent_code ?? '',
        code: row.code,
        name: row.name,
        shortName: row.short_name ?? null,
        description: row.notes ?? null,
        directorName: row.director_name ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        alternatePhone: row.alternate_phone ?? null,
        website: row.website ?? null,
        country: row.country ?? 'Pakistan',
        address: row.address ?? null,
        area: row.area ?? null,
        city: row.city ?? null,
        province: row.province ?? null,
        postalCode: row.postal_code ?? null,
        countryId: row.country_id ?? null,
        stateId: row.state_id ?? null,
        cityId: row.city_id ?? null,
        areaId: row.area_id ?? null,
        notes: row.notes ?? null,
        schoolCount: Number(row.school_count ?? 0),
        campusCount: Number(row.campus_count ?? 0),
        isActive: row.is_active,
        createdBy: row.created_by ?? null,
        updatedBy: row.updated_by ?? null,
        createdByUser: userMap.get(row.created_by || '') || null,
        updatedByUser: userMap.get(row.updated_by || '') || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      // Apply server-side filters
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

      if (filters?.activeOnly || (filters?.status && filters.status === 'ACTIVE')) {
        results = results.filter((r) => r.isActive === true);
      } else if (filters?.status && filters.status === 'INACTIVE') {
        results = results.filter((r) => r.isActive === false);
      }

      if (filters?.parentId && filters.parentId !== 'ALL') {
        results = results.filter((r) => r.parentId === filters.parentId);
      }

      for (const r of results) {
        r.linkedAccount = await resolveLinkedAccountTx(tx, tenantId, r.hierarchyNodeId);
      }

      return results;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET ONE
  // ─────────────────────────────────────────────────────────────────

  async getRegion(tenantId: string, id: string): Promise<RegionDetailDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [region] = await tx
        .select()
        .from(regions)
        .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)))
        .limit(1);

      if (!region) {
        throw new NotFoundException(`Regional Office '${id}' not found.`);
      }

      const [parentNode] = await tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, region.parentId))
        .limit(1);

      const [schoolCountRes] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            sql`(${schools.parentId} = ${region.hierarchyNodeId} OR ${schools.parentId} = ${region.id})`
          )
        );

      const userMap = await this.resolveUserSummaries(tx, [region.createdBy, region.updatedBy]);
      const linkedAccount = await resolveLinkedAccountTx(tx, tenantId, region.hierarchyNodeId);

      return {
        id: region.id,
        organizationId: region.organizationId,
        hierarchyNodeId: region.hierarchyNodeId,
        parentId: region.parentId,
        parentName: parentNode?.name ?? 'Head Office',
        parentCode: parentNode?.code ?? '',
        code: region.code,
        name: region.name,
        shortName: region.shortName,
        description: region.notes,
        directorName: region.directorName,
        email: region.email,
        phone: region.phone,
        alternatePhone: region.alternatePhone,
        website: region.website,
        country: region.country ?? 'Pakistan',
        address: region.address,
        area: region.area,
        city: region.city,
        province: region.province,
        postalCode: region.postalCode,
        notes: region.notes,
        schoolCount: Number(schoolCountRes?.count || 0),
        isActive: region.isActive,
        linkedAccount,
        createdBy: region.createdBy,
        updatedBy: region.updatedBy,
        createdByUser: userMap.get(region.createdBy || '') || null,
        updatedByUser: userMap.get(region.updatedBy || '') || null,
        createdAt: new Date(region.createdAt),
        updatedAt: new Date(region.updatedAt),
      };
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

      const actorUserId = userId || '00000000-0000-0000-0000-000000000000';

      // 1. Check parent hierarchy change (reassignment)
      if (dto.parentId && dto.parentId !== existing.parentId) {
        const [newParentNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, dto.parentId)
            )
          )
          .limit(1);

        if (!newParentNode) {
          throw new NotFoundException(
            `Target parent hierarchy node '${dto.parentId}' not found.`
          );
        }

        const pathLabel = this.sanitizePath(existing.code);
        const newPath = `${newParentNode.path}.${pathLabel}`;

        await tx
          .update(hierarchyNodes)
          .set({
            parentId: newParentNode.id,
            path: newPath,
            updatedAt: new Date(),
          })
          .where(eq(hierarchyNodes.id, existing.hierarchyNodeId));

        await this.auditService.logEvent(
          {
            organizationId: tenantId,
            hierarchyNodeId: existing.hierarchyNodeId,
            actorId: actorUserId,
            actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
            module: 'ORGANIZATION',
            action: 'REGIONAL_OFFICE_REASSIGNED',
            entityType: 'region',
            entityId: id,
            beforeState: { parentId: existing.parentId },
            afterState: { parentId: dto.parentId, newPath },
          },
          tx
        );
      }

      // 2. Sync name change to hierarchy_nodes
      if (dto.name !== undefined && dto.name.trim() !== existing.name) {
        await tx
          .update(hierarchyNodes)
          .set({ name: dto.name.trim(), updatedAt: new Date() })
          .where(eq(hierarchyNodes.id, existing.hierarchyNodeId));
      }

      // 3. Sync isActive change to hierarchy_nodes
      if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
        await tx
          .update(hierarchyNodes)
          .set({ isActive: dto.isActive, updatedAt: new Date() })
          .where(eq(hierarchyNodes.id, existing.hierarchyNodeId));

        const action = dto.isActive ? 'REGIONAL_OFFICE_ACTIVATED' : 'REGIONAL_OFFICE_DEACTIVATED';
        await this.auditService.logEvent(
          {
            organizationId: tenantId,
            hierarchyNodeId: existing.hierarchyNodeId,
            actorId: actorUserId,
            actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
            module: 'ORGANIZATION',
            action,
            entityType: 'region',
            entityId: id,
            beforeState: { isActive: existing.isActive },
            afterState: { isActive: dto.isActive },
          },
          tx
        );
      }

      // Validate & normalize contact fields if provided
      const contactVal = validateAndNormalizeContactFields({
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        website: dto.website,
      });
      if (!contactVal.valid) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed for structured contact fields',
          errors: contactVal.errors,
        });
      }

      // 4. Update regions row (preserve created_by & created_at)
      const updateData: any = {
        updatedBy: actorUserId,
        updatedAt: new Date(),
      };

      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
      if (dto.shortName !== undefined) updateData.shortName = dto.shortName?.trim() || null;
      if (dto.directorName !== undefined) updateData.directorName = dto.directorName?.trim() || null;
      if (dto.email !== undefined) updateData.email = contactVal.normalized.email;
      if (dto.phone !== undefined) updateData.phone = contactVal.normalized.phone;
      if (dto.alternatePhone !== undefined) updateData.alternatePhone = contactVal.normalized.alternatePhone;
      if (dto.website !== undefined) updateData.website = contactVal.normalized.website;
      if (
        dto.countryId !== undefined ||
        dto.stateId !== undefined ||
        dto.cityId !== undefined ||
        dto.areaId !== undefined ||
        dto.country !== undefined ||
        dto.province !== undefined ||
        dto.city !== undefined ||
        dto.area !== undefined ||
        dto.postalCode !== undefined
      ) {
        const geo = await validateAndResolveGeographyHierarchy(tx, {
          countryId: dto.countryId !== undefined ? dto.countryId : existing.countryId,
          stateId: dto.stateId !== undefined ? dto.stateId : existing.stateId,
          cityId: dto.cityId !== undefined ? dto.cityId : existing.cityId,
          areaId: dto.areaId !== undefined ? dto.areaId : existing.areaId,
          country: dto.country !== undefined ? dto.country : existing.country,
          province: dto.province !== undefined ? dto.province : existing.province,
          city: dto.city !== undefined ? dto.city : existing.city,
          area: dto.area !== undefined ? dto.area : existing.area,
          postalCode: dto.postalCode !== undefined ? dto.postalCode : existing.postalCode,
        });

        updateData.countryId = geo.countryId;
        updateData.stateId = geo.stateId;
        updateData.cityId = geo.cityId;
        updateData.areaId = geo.areaId;
        updateData.country = geo.country || 'Pakistan';
        updateData.province = geo.province;
        updateData.city = geo.city;
        updateData.area = geo.area;
        updateData.postalCode = geo.postalCode;
      }
      if (dto.address !== undefined) updateData.address = dto.address?.trim() || null;
      if (dto.notes !== undefined) updateData.notes = dto.notes?.trim() || null;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const [updated] = await tx
        .update(regions)
        .set(updateData)
        .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)))
        .returning();

      // Audit standard update
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: existing.hierarchyNodeId,
          actorId: actorUserId,
          actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'REGIONAL_OFFICE_UPDATED',
          entityType: 'region',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const userMap = await this.resolveUserSummaries(tx, [updated!.createdBy, updated!.updatedBy]);

      let linkedAccount = null;
      if (dto.account) {
        linkedAccount = await provisionOrLinkAccountTx(
          tx,
          tenantId,
          existing.hierarchyNodeId,
          dto.account,
          userId,
          'REGION',
          this.auditService
        );
      } else {
        linkedAccount = await resolveLinkedAccountTx(tx, tenantId, existing.hierarchyNodeId);
      }

      return {
        ...updated!,
        linkedAccount,
        createdByUser: userMap.get(updated!.createdBy || '') || null,
        updatedByUser: userMap.get(updated!.updatedBy || '') || null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  TOGGLE STATUS
  // ─────────────────────────────────────────────────────────────────

  async toggleRegionStatus(tenantId: string, id: string, isActive: boolean, userId?: string) {
    return this.updateRegion(tenantId, id, { isActive }, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  //  PERMISSIONS & DEPENDENCY SAFETY
  // ─────────────────────────────────────────────────────────────────

  assertPermission(permissionsHeader?: string | string[], requiredPerm?: string) {
    if (!requiredPerm) return;

    if (!permissionsHeader || (typeof permissionsHeader === 'string' && !permissionsHeader.trim())) {
      throw new ForbiddenException(
        `Access Denied: Missing permissions header. Action requires '${requiredPerm}'. System is fail-closed.`
      );
    }

    const perms = (
      Array.isArray(permissionsHeader)
        ? permissionsHeader.map((p) => p.trim().toUpperCase())
        : permissionsHeader.split(',').map((p) => p.trim().toUpperCase())
    ).filter(Boolean);

    // Fail closed: require explicit permission key, no '*' or 'ALL' wildcard bypass
    const hasPerm = perms.includes(requiredPerm.toUpperCase());

    if (!hasPerm) {
      throw new ForbiddenException(
        `Access Denied: You do not have permission '${requiredPerm}' to perform this action.`
      );
    }
  }

  async getRegionDependenciesTx(tx: any, tenantId: string, id: string): Promise<RegionDependenciesDto> {
    const [reg] = await tx
      .select()
      .from(regions)
      .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)))
      .limit(1);

    if (!reg) {
      throw new NotFoundException(`Regional Office '${id}' not found in this organization.`);
    }

    // 1. Child schools connected directly to this region node
    const [schoolCountRes] = await tx
      .select({ count: sql<number>`cast(count(${schools.id}) as int)` })
      .from(schools)
      .where(
        and(
          eq(schools.organizationId, tenantId),
          sql`(${schools.parentId} = ${reg.hierarchyNodeId} OR ${schools.parentId} = ${reg.id})`
        )
      );

    // 2. Campuses connected through child schools
    const [branchCountRes] = await tx
      .select({ count: sql<number>`cast(count(${branches.id}) as int)` })
      .from(branches)
      .where(
        and(
          eq(branches.organizationId, tenantId),
          sql`${branches.schoolId} IN (
            SELECT ${schools.id} FROM ${schools} 
            WHERE ${schools.organizationId} = ${tenantId} AND (
              ${schools.parentId} = ${reg.hierarchyNodeId} OR ${schools.parentId} = ${reg.id}
            )
          )`
        )
      );

    // 3. User / Role assignments on this region node
    const [assignmentCountRes] = await tx
      .select({ count: sql<number>`cast(count(${membershipNodeAssignments.id}) as int)` })
      .from(membershipNodeAssignments)
      .where(
        and(
          eq(membershipNodeAssignments.organizationId, tenantId),
          eq(membershipNodeAssignments.hierarchyNodeId, reg.hierarchyNodeId)
        )
      );

    // 4. Child hierarchy nodes
    const [childNodeCountRes] = await tx
      .select({ count: sql<number>`cast(count(${hierarchyNodes.id}) as int)` })
      .from(hierarchyNodes)
      .where(
        and(
          eq(hierarchyNodes.organizationId, tenantId),
          eq(hierarchyNodes.parentId, reg.hierarchyNodeId)
        )
      );

    const sCount = Number(schoolCountRes?.count || 0);
    const bCount = Number(branchCountRes?.count || 0);
    const aCount = Number(assignmentCountRes?.count || 0);
    const cCount = Number(childNodeCountRes?.count || 0);
    const total = sCount + bCount + aCount;

    const canDelete = total === 0;

    const breakdown: string[] = [];
    if (sCount > 0) breakdown.push(`${sCount} School${sCount > 1 ? 's' : ''}`);
    if (bCount > 0) breakdown.push(`${bCount} Campus${bCount > 1 ? 'es' : ''}`);
    if (aCount > 0) breakdown.push(`${aCount} User Assignment${aCount > 1 ? 's' : ''}`);

    let message: string | undefined;
    if (!canDelete) {
      message = `This Regional Office is currently used by:\n${breakdown.map((b) => `• ${b}`).join('\n')}\n\nReassign them or deactivate the Regional Office first.`;
    }

    return {
      regionId: reg.id,
      regionName: reg.name,
      regionCode: reg.code,
      canDelete,
      message,
      dependencies: {
        schools: sCount,
        campuses: bCount,
        userAssignments: aCount,
        childHierarchyNodes: cCount,
        total,
      },
    };
  }

  async getRegionDependencies(tenantId: string, id: string): Promise<RegionDependenciesDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this.getRegionDependenciesTx(tx, tenantId, id);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  DELETE (with strict Dependency Protection)
  // ─────────────────────────────────────────────────────────────────

  async deleteRegion(
    tenantId: string,
    id: string,
    userId?: string,
    permissions?: string | string[]
  ) {
    this.assertPermission(permissions, RegionalOfficePermissions.DELETE);

    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const depCheck = await this.getRegionDependenciesTx(tx, tenantId, id);

      if (!depCheck.canDelete) {
        throw new BadRequestException(
          `Cannot Delete Regional Office. ${depCheck.message}`
        );
      }

      const [existing] = await tx
        .select()
        .from(regions)
        .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Regional Office '${id}' not found.`);
      }

      const actorUserId = userId || '00000000-0000-0000-0000-000000000000';

      // 1. Delete regions row
      await tx
        .delete(regions)
        .where(and(eq(regions.organizationId, tenantId), eq(regions.id, id)));

      // 2. Delete associated hierarchy_nodes row
      await tx
        .delete(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, existing.hierarchyNodeId)
          )
        );

      // 3. Audit log
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: existing.hierarchyNodeId,
          actorId: actorUserId,
          actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'REGIONAL_OFFICE_DELETED',
          entityType: 'region',
          entityId: id,
          beforeState: existing,
          afterState: null,
        },
        tx
      );

      return {
        success: true,
        id,
        message: `Regional Office '${existing.name}' (${existing.code}) deleted successfully.`,
      };
    });
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

      const EXCLUDE_AS_PARENT = ['REGION', 'SCHOOL', 'BRANCH', 'CAMPUS'];
      const eligible = rows.filter(
        (r) => !EXCLUDE_AS_PARENT.includes((r.nodeTypeCode ?? '').toUpperCase())
      );

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

  assertScope(
    userScope?: { authorizedRegions?: string[]; authorizedSchools?: string[]; authorizedHeadOffices?: string[] },
    targetRegionIdOrCode?: string
  ) {
    if (!userScope) return;
    if (userScope.authorizedSchools?.length && !userScope.authorizedRegions?.length && !userScope.authorizedHeadOffices?.length) {
      throw new ForbiddenException('Access denied: School-scoped account cannot access Regional Office management.');
    }
    if (userScope.authorizedRegions?.length && targetRegionIdOrCode) {
      const match = userScope.authorizedRegions.some(
        (id) => id === targetRegionIdOrCode || id.toLowerCase() === targetRegionIdOrCode.toLowerCase()
      );
      if (!match) {
        throw new ForbiddenException('Access denied: Target Region is outside your authorized hierarchy scope.');
      }
    }
  }
}


