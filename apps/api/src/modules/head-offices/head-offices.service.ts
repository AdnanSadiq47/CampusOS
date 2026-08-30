import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  TenantTransactionManager,
  headOffices,
  regions,
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
  CreateHeadOfficeDto,
  UpdateHeadOfficeDto,
  HeadOfficeListItemDto,
  HeadOfficeDetailDto,
  HeadOfficeDependenciesDto,
  HeadOfficePermissions,
  UserSummaryDto,
  validateAndNormalizeContactFields,
} from '@campus-os/types';
import { AuditService } from '../../core/audit/audit.service.js';
import { provisionOrLinkAccountTx, resolveLinkedAccountTx } from '../../core/iam/iam-provisioning.util.js';
import { validateAndResolveGeographyHierarchy } from '../geography/geography-validation.util.js';

@Injectable()
export class HeadOfficesService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

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

      // 5. Validate & Resolve Geography Hierarchy
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

      // 5.5 Validate & normalize contact fields
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

      // 6. Create head_offices record
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
          email: contactVal.normalized.email,
          phone: contactVal.normalized.phone,
          alternatePhone: contactVal.normalized.alternatePhone,
          website: contactVal.normalized.website,
          country: geo.country || 'Pakistan',
          province: geo.province,
          city: geo.city,
          area: geo.area,
          address: dto.address?.trim() || null,
          postalCode: geo.postalCode,
          countryId: geo.countryId,
          stateId: geo.stateId,
          cityId: geo.cityId,
          areaId: geo.areaId,
          notes: dto.notes?.trim() || null,
          isActive: dto.status !== undefined ? dto.status : true,
          createdBy: userId || null,
          updatedBy: userId || null,
        })
        .returning();

      // 7. Audit trail
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          actorId: userId ?? null,
          actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'head_office',
          entityId: newHeadOffice!.id,
          beforeState: null,
          afterState: newHeadOffice,
        },
        tx
      );

      const userMap = await this.resolveUserSummaries(tx, [newHeadOffice!.createdBy, newHeadOffice!.updatedBy]);

      let linkedAccount = null;
      if (dto.account) {
        linkedAccount = await provisionOrLinkAccountTx(
          tx,
          tenantId,
          node!.id,
          dto.account,
          userId,
          'HEAD_OFFICE',
          this.auditService
        );
      } else {
        linkedAccount = await resolveLinkedAccountTx(tx, tenantId, node!.id);
      }

      return {
        ...newHeadOffice!,
        linkedAccount,
        createdByUser: newHeadOffice!.createdBy ? userMap.get(newHeadOffice!.createdBy) || null : null,
        updatedByUser: newHeadOffice!.updatedBy ? userMap.get(newHeadOffice!.updatedBy) || null : null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  USER RESOLUTION HELPER
  // ─────────────────────────────────────────────────────────────────

  private async resolveUserSummaries(
    tx: any,
    userIds: (string | null | undefined)[]
  ): Promise<Map<string, UserSummaryDto>> {
    const userMap = new Map<string, UserSummaryDto>();

    userMap.set('00000000-0000-0000-0000-000000000000', {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'System User',
      email: 'system@campus-os.local',
      firstName: 'System',
      lastName: 'User',
    });

    const uniqueIds = Array.from(
      new Set(userIds.filter((id): id is string => !!id && id !== '00000000-0000-0000-0000-000000000000'))
    );

    if (uniqueIds.length === 0) return userMap;

    try {
      const users = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
          firstName: identityUsers.firstName,
          lastName: identityUsers.lastName,
        })
        .from(identityUsers)
        .where(inArray(identityUsers.id, uniqueIds));

      for (const u of users) {
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
          address: headOffices.address,
          area: headOffices.area,
          postalCode: headOffices.postalCode,
          countryId: headOffices.countryId,
          stateId: headOffices.stateId,
          cityId: headOffices.cityId,
          areaId: headOffices.areaId,
          isActive: headOffices.isActive,
          createdBy: headOffices.createdBy,
          updatedBy: headOffices.updatedBy,
          createdAt: headOffices.createdAt,
          updatedAt: headOffices.updatedAt,
        })
        .from(headOffices)
        .where(and(...conditions))
        .orderBy(headOffices.name);

      const allUserIds = rows.flatMap((r) => [r.createdBy, r.updatedBy]);
      const userMap = await this.resolveUserSummaries(tx, allUserIds);

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
        const linkedAccount = await resolveLinkedAccountTx(tx, tenantId, row.hierarchyNodeId);

        results.push({
          ...row,
          regionCount: rCount,
          schoolCount: sCount,
          connectedUnitsCount: rCount + sCount,
          linkedAccount,
          createdByUser: row.createdBy ? userMap.get(row.createdBy) || null : null,
          updatedByUser: row.updatedBy ? userMap.get(row.updatedBy) || null : null,
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
      const userMap = await this.resolveUserSummaries(tx, [ho.createdBy, ho.updatedBy]);
      const linkedAccount = await resolveLinkedAccountTx(tx, tenantId, ho.hierarchyNodeId);

      return {
        ...ho,
        regionCount: rCount,
        schoolCount: sCount,
        connectedUnitsCount: rCount + sCount,
        linkedAccount,
        createdByUser: ho.createdBy ? userMap.get(ho.createdBy) || null : null,
        updatedByUser: ho.updatedBy ? userMap.get(ho.updatedBy) || null : null,
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
        ...(userId ? { updatedBy: userId } : {}),
      };

      // Validate & normalize contact fields if any are provided
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

      if (dto.name !== undefined) patch.name = dto.name.trim();
      if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
      if (dto.shortName !== undefined) patch.shortName = dto.shortName?.trim() || null;
      if (dto.description !== undefined) patch.description = dto.description?.trim() || null;
      if (dto.directorName !== undefined) patch.directorName = dto.directorName?.trim() || null;
      if (dto.email !== undefined) patch.email = contactVal.normalized.email;
      if (dto.phone !== undefined) patch.phone = contactVal.normalized.phone;
      if (dto.alternatePhone !== undefined) patch.alternatePhone = contactVal.normalized.alternatePhone;
      if (dto.website !== undefined) patch.website = contactVal.normalized.website;
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

        patch.countryId = geo.countryId;
        patch.stateId = geo.stateId;
        patch.cityId = geo.cityId;
        patch.areaId = geo.areaId;
        patch.country = geo.country || 'Pakistan';
        patch.province = geo.province;
        patch.city = geo.city;
        patch.area = geo.area;
        patch.postalCode = geo.postalCode;
      }
      if (dto.address !== undefined) patch.address = dto.address?.trim() || null;
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

      let auditAction = 'UPDATE';
      if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
        auditAction = dto.isActive ? 'ACTIVATE' : 'DEACTIVATE';
      }

      // Audit log with automatic compact diff and secret redaction
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: existing.hierarchyNodeId,
          actorId: userId ?? null,
          actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: auditAction,
          entityType: 'head_office',
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
          'HEAD_OFFICE',
          this.auditService
        );
      } else {
        linkedAccount = await resolveLinkedAccountTx(tx, tenantId, existing.hierarchyNodeId);
      }

      return {
        ...updated!,
        linkedAccount,
        createdByUser: updated!.createdBy ? userMap.get(updated!.createdBy) || null : null,
        updatedByUser: updated!.updatedBy ? userMap.get(updated!.updatedBy) || null : null,
      };
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

  async getHeadOfficeDependenciesTx(tx: any, tenantId: string, id: string): Promise<HeadOfficeDependenciesDto> {
    const [ho] = await tx
      .select()
      .from(headOffices)
      .where(and(eq(headOffices.organizationId, tenantId), eq(headOffices.id, id)))
      .limit(1);

    if (!ho) {
      throw new NotFoundException(`Head Office '${id}' not found in this organization.`);
    }

    // 1. Direct Child Regions
    const [regionCountRes] = await tx
      .select({ count: sql<number>`cast(count(${regions.id}) as int)` })
      .from(regions)
      .where(and(eq(regions.organizationId, tenantId), eq(regions.parentId, ho.hierarchyNodeId)));

    // 2. Direct Schools + Schools under Child Regions
    const [schoolCountRes] = await tx
      .select({ count: sql<number>`cast(count(${schools.id}) as int)` })
      .from(schools)
      .where(
        and(
          eq(schools.organizationId, tenantId),
          sql`(${schools.parentId} = ${ho.hierarchyNodeId} OR ${schools.parentId} IN (
            SELECT ${regions.hierarchyNodeId} FROM ${regions} 
            WHERE ${regions.organizationId} = ${tenantId} AND ${regions.parentId} = ${ho.hierarchyNodeId}
          ))`
        )
      );

    // 3. Campuses belonging to schools connected to this Head Office
    const [branchCountRes] = await tx
      .select({ count: sql<number>`cast(count(${branches.id}) as int)` })
      .from(branches)
      .where(
        and(
          eq(branches.organizationId, tenantId),
          sql`${branches.schoolId} IN (
            SELECT ${schools.id} FROM ${schools} 
            WHERE ${schools.organizationId} = ${tenantId} AND (
              ${schools.parentId} = ${ho.hierarchyNodeId} OR ${schools.parentId} IN (
                SELECT ${regions.hierarchyNodeId} FROM ${regions} 
                WHERE ${regions.organizationId} = ${tenantId} AND ${regions.parentId} = ${ho.hierarchyNodeId}
              )
            )
          )`
        )
      );

    // 4. User / Role assignments on this Head Office node
    const [assignmentCountRes] = await tx
      .select({ count: sql<number>`cast(count(${membershipNodeAssignments.id}) as int)` })
      .from(membershipNodeAssignments)
      .where(
        and(
          eq(membershipNodeAssignments.organizationId, tenantId),
          eq(membershipNodeAssignments.hierarchyNodeId, ho.hierarchyNodeId)
        )
      );

    // 5. Child Hierarchy Nodes
    const [childNodeCountRes] = await tx
      .select({ count: sql<number>`cast(count(${hierarchyNodes.id}) as int)` })
      .from(hierarchyNodes)
      .where(
        and(
          eq(hierarchyNodes.organizationId, tenantId),
          eq(hierarchyNodes.parentId, ho.hierarchyNodeId)
        )
      );

    const rCount = Number(regionCountRes?.count || 0);
    const sCount = Number(schoolCountRes?.count || 0);
    const bCount = Number(branchCountRes?.count || 0);
    const aCount = Number(assignmentCountRes?.count || 0);
    const cCount = Number(childNodeCountRes?.count || 0);
    const total = rCount + sCount + bCount + aCount;

    const canDelete = total === 0;

    const breakdown: string[] = [];
    if (rCount > 0) breakdown.push(`${rCount} Regional Office${rCount > 1 ? 's' : ''}`);
    if (sCount > 0) breakdown.push(`${sCount} School${sCount > 1 ? 's' : ''}`);
    if (bCount > 0) breakdown.push(`${bCount} Campus${bCount > 1 ? 'es' : ''}`);
    if (aCount > 0) breakdown.push(`${aCount} User Assignment${aCount > 1 ? 's' : ''}`);

    let message: string | undefined;
    if (!canDelete) {
      message = `This Head Office is currently used by:\n${breakdown.map((b) => `• ${b}`).join('\n')}\n\nReassign these records or deactivate the Head Office first.`;
    }

    return {
      headOfficeId: ho.id,
      headOfficeName: ho.name,
      headOfficeCode: ho.code,
      canDelete,
      message,
      dependencies: {
        regions: rCount,
        schools: sCount,
        campuses: bCount,
        userAssignments: aCount,
        childHierarchyNodes: cCount,
        total,
      },
    };
  }

  async getHeadOfficeDependencies(tenantId: string, id: string): Promise<HeadOfficeDependenciesDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this.getHeadOfficeDependenciesTx(tx, tenantId, id);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  DELETE (with foreign key and full hierarchy dependency protection)
  // ─────────────────────────────────────────────────────────────────

  async deleteHeadOffice(
    tenantId: string,
    id: string,
    userId?: string,
    permissions?: string | string[]
  ) {
    this.assertPermission(permissions, HeadOfficePermissions.DELETE);

    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const depCheck = await this.getHeadOfficeDependenciesTx(tx, tenantId, id);

      if (!depCheck.canDelete) {
        throw new BadRequestException(
          `Cannot Delete Head Office. ${depCheck.message}`
        );
      }

      const [ho] = await tx
        .select()
        .from(headOffices)
        .where(and(eq(headOffices.organizationId, tenantId), eq(headOffices.id, id)))
        .limit(1);

      if (!ho) {
        throw new NotFoundException(`Head Office '${id}' not found in this organization.`);
      }

      // Safe standalone delete
      await tx
        .delete(headOffices)
        .where(and(eq(headOffices.organizationId, tenantId), eq(headOffices.id, id)));

      await tx
        .delete(hierarchyNodes)
        .where(and(eq(hierarchyNodes.organizationId, tenantId), eq(hierarchyNodes.id, ho.hierarchyNodeId)));

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: ho.hierarchyNodeId,
          actorId: userId ?? null,
          actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'HEAD_OFFICE_DELETED',
          entityType: 'head_office',
          entityId: id,
          beforeState: ho,
          afterState: null,
        },
        tx
      );

      return {
        success: true,
        message: `Head Office '${ho.name}' (${ho.code}) deleted successfully.`,
        deletedId: id,
      };
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

  assertScope(
    userScope?: { authorizedHeadOffices?: string[]; authorizedRegions?: string[]; authorizedSchools?: string[] },
    targetHeadOfficeIdOrCode?: string
  ) {
    if (!userScope) return;
    if (userScope.authorizedRegions?.length && !userScope.authorizedHeadOffices?.length) {
      throw new ForbiddenException('Access denied: Region-scoped account cannot access Head Office management.');
    }
    if (userScope.authorizedSchools?.length && !userScope.authorizedHeadOffices?.length) {
      throw new ForbiddenException('Access denied: School-scoped account cannot access Head Office management.');
    }
    if (userScope.authorizedHeadOffices?.length && targetHeadOfficeIdOrCode) {
      const match = userScope.authorizedHeadOffices.some(
        (id) => id === targetHeadOfficeIdOrCode || id.toLowerCase() === targetHeadOfficeIdOrCode.toLowerCase()
      );
      if (!match) {
        throw new ForbiddenException('Access denied: Target Head Office is outside your authorized hierarchy scope.');
      }
    }
  }
}
