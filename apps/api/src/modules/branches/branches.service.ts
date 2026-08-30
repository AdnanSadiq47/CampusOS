import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  TenantTransactionManager,
  branches,
  schools,
  headOffices,
  regions,
  hierarchyNodes,
  hierarchyNodeTypes,
  identityUsers,
  organizationMemberships,
  membershipNodeAssignments,
  assignmentRoles,
  classes,
  sections,
  configScopeBranches,
  eq,
  and,
  asc,
  sql,
  inArray,
} from '@campus-os/database';
import {
  CreateBranchDto,
  UpdateBranchDto,
  BranchListItemDto,
  BranchDetailDto,
  BranchDependenciesDto,
  ReorderBranchesDto,
  SuggestUsernameResponseDto,
  UserSummaryDto,
  validateAndNormalizeContactFields,
} from '@campus-os/types';
import { PasswordService } from '../../core/iam/services/password.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { provisionOrLinkAccountTx, resolveLinkedAccountTx } from '../../core/iam/iam-provisioning.util.js';
import { validateAndResolveGeographyHierarchy } from '../geography/geography-validation.util.js';

@Injectable()
export class BranchesService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService
  ) {}

  // ─────────────────────────────────────────────────────────────────
  //  CREATE BRANCH (+ Optional Admin User Provisioning)
  // ─────────────────────────────────────────────────────────────────

  async createBranch(tenantId: string, dto: CreateBranchDto, actorUserId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanCode = dto.code.trim().toUpperCase();
      const cleanName = dto.name.trim();
      const creatorId = actorUserId || '00000000-0000-0000-0000-000000000000';

      // 1. Validate Parent School belongs to tenant
      const [school] = await tx
        .select()
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.id, dto.schoolId)
          )
        )
        .limit(1);

      if (!school) {
        throw new NotFoundException(`Selected School '${dto.schoolId}' not found in this organization.`);
      }

      // 2. Uniqueness check for branch code per tenant
      const [existingCode] = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(
            eq(branches.organizationId, tenantId),
            eq(branches.code, cleanCode)
          )
        )
        .limit(1);

      if (existingCode) {
        throw new ConflictException(`A Branch with code '${cleanCode}' already exists in this organization.`);
      }

      // 3. Fetch school hierarchy node to compute ltree path
      const [schoolNode] = await tx
        .select()
        .from(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, school.hierarchyNodeId)
          )
        )
        .limit(1);

      if (!schoolNode) {
        throw new NotFoundException(`Hierarchy node for school '${school.name}' not found.`);
      }

      // 4. Ensure BRANCH node type exists
      const branchNodeType = await this.ensureBranchNodeType(tx, tenantId);

      // 5. Create hierarchy_nodes record for branch
      const pathLabel = this.sanitizePath(cleanCode);
      const nodePath = `${schoolNode.path}.${pathLabel}`;

      const [node] = await tx
        .insert(hierarchyNodes)
        .values({
          organizationId: tenantId,
          nodeTypeId: branchNodeType.id,
          parentId: school.hierarchyNodeId,
          code: cleanCode,
          name: cleanName,
          path: nodePath,
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // Determine Sort Order (use provided or highest + 1)
      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${branches.sortOrder}), 0)` })
          .from(branches)
          .where(
            and(
              eq(branches.organizationId, tenantId),
              eq(branches.schoolId, school.id)
            )
          );
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

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
        whatsappNumber: (dto as any).whatsappNumber,
      });
      if (!contactVal.valid) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed for structured contact fields',
          errors: contactVal.errors,
        });
      }

      // 7. Create branches record
      const [newBranch] = await tx
        .insert(branches)
        .values({
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          schoolId: school.id,
          code: cleanCode,
          name: cleanName,
          shortName: dto.shortName?.trim() || null,
          description: dto.description?.trim() || null,
          sortOrder: resolvedSortOrder,
          logoUrl: dto.logoUrl?.trim() || null,
          phone: contactVal.normalized.phone,
          alternatePhone: contactVal.normalized.alternatePhone,
          email: contactVal.normalized.email,
          website: contactVal.normalized.website,
          country: geo.country || 'Pakistan',
          countryId: geo.countryId,
          province: geo.province,
          stateId: geo.stateId,
          city: geo.city,
          cityId: geo.cityId,
          area: geo.area,
          areaId: geo.areaId,
          address: dto.address?.trim() || null,
          postalCode: geo.postalCode,
          notes: dto.notes?.trim() || null,
          isActive: dto.status !== undefined ? dto.status : true,
          createdBy: creatorId,
          updatedBy: creatorId,
        })
        .returning();

      // 8. Resolve creator user for audit log
      const [creatorUser] = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
        })
        .from(identityUsers)
        .where(eq(identityUsers.id, creatorId))
        .limit(1);

      const creatorEmail = creatorUser?.email || 'admin@campus-os.local';

      // 8. Canonical audit log
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          actorId: creatorId,
          actorEmail: creatorEmail,
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'branch',
          entityId: newBranch!.id,
          beforeState: null,
          afterState: newBranch,
        },
        tx
      );

      // 9. IAM Administrator Provisioning
      if (dto.account) {
        await provisionOrLinkAccountTx(
          tx,
          tenantId,
          node!.id,
          dto.account,
          creatorId,
          'BRANCH',
          this.auditService
        );
      } else if (dto.adminUser && dto.adminUser.email) {
        const adminEmail = dto.adminUser.email.trim().toLowerCase();
        const adminUsername = dto.adminUser.username.trim();

        const [existingIdentity] = await tx
          .select()
          .from(identityUsers)
          .where(eq(identityUsers.email, adminEmail))
          .limit(1);

        let identityId: string;
        if (existingIdentity) {
          identityId = existingIdentity.id;
        } else {
          const rawPassword = dto.adminUser.password || 'CampusOS@Branch2026!';
          const passwordHash = await this.passwordService.hash(rawPassword);

          const [newIdentity] = await tx
            .insert(identityUsers)
            .values({
              email: adminEmail,
              passwordHash,
              firstName: adminUsername || 'Branch',
              lastName: 'Administrator',
              phoneNumber: dto.phone || null,
              isActive: true,
            })
            .returning();

          identityId = newIdentity!.id;
        }

        const [existingMembership] = await tx
          .select()
          .from(organizationMemberships)
          .where(
            and(
              eq(organizationMemberships.organizationId, tenantId),
              eq(organizationMemberships.identityUserId, identityId)
            )
          )
          .limit(1);

        let membershipId: string;
        if (existingMembership) {
          membershipId = existingMembership.id;
        } else {
          const [newMembership] = await tx
            .insert(organizationMemberships)
            .values({
              organizationId: tenantId,
              identityUserId: identityId,
              membershipType: 'STAFF',
              status: 'ACTIVE',
            })
            .returning();
          membershipId = newMembership!.id;
        }

        const [assignment] = await tx
          .insert(membershipNodeAssignments)
          .values({
            organizationId: tenantId,
            membershipId,
            hierarchyNodeId: node!.id,
            isPrimary: true,
            status: 'ACTIVE',
            assignedBy: creatorId,
          })
          .returning();

        if (dto.adminUser.roleId) {
          await tx.insert(assignmentRoles).values({
            organizationId: tenantId,
            assignmentId: assignment!.id,
            roleId: dto.adminUser.roleId,
          });
        }
      }

      return this._getBranchWithTx(tx, tenantId, newBranch!.id);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE BRANCH
  // ─────────────────────────────────────────────────────────────────

  async updateBranch(tenantId: string, id: string, dto: UpdateBranchDto, actorUserId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const modifierId = actorUserId || '00000000-0000-0000-0000-000000000000';

      const [existing] = await tx
        .select()
        .from(branches)
        .where(
          and(
            eq(branches.organizationId, tenantId),
            eq(branches.id, id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Branch '${id}' not found in this organization.`);
      }

      // Handle Parent School Reassignment if requested
      let isReassigned = false;
      if (dto.schoolId && dto.schoolId !== existing.schoolId) {
        const [targetSchool] = await tx
          .select()
          .from(schools)
          .where(
            and(
              eq(schools.organizationId, tenantId),
              eq(schools.id, dto.schoolId)
            )
          )
          .limit(1);

        if (!targetSchool) {
          throw new NotFoundException(`Target school '${dto.schoolId}' not found.`);
        }

        const [targetSchoolNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, targetSchool.hierarchyNodeId)
            )
          )
          .limit(1);

        if (targetSchoolNode) {
          const pathLabel = this.sanitizePath(existing.code);
          const newPath = `${targetSchoolNode.path}.${pathLabel}`;
          await tx
            .update(hierarchyNodes)
            .set({
              parentId: targetSchool.hierarchyNodeId,
              path: newPath,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(hierarchyNodes.organizationId, tenantId),
                eq(hierarchyNodes.id, existing.hierarchyNodeId)
              )
            );
          isReassigned = true;
        }
      }

      // Validate & normalize contact fields if provided
      const contactVal = validateAndNormalizeContactFields({
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        website: dto.website,
        whatsappNumber: (dto as any).whatsappNumber,
      });
      if (!contactVal.valid) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed for structured contact fields',
          errors: contactVal.errors,
        });
      }

      const patch: Partial<typeof branches.$inferInsert> = {
        updatedBy: modifierId,
        updatedAt: new Date(),
      };

      if (dto.schoolId !== undefined) patch.schoolId = dto.schoolId;
      if (dto.name !== undefined) patch.name = dto.name.trim();
      if (dto.shortName !== undefined) patch.shortName = dto.shortName?.trim() || null;
      if (dto.description !== undefined) patch.description = dto.description?.trim() || null;
      if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
      if (dto.logoUrl !== undefined) patch.logoUrl = dto.logoUrl?.trim() || null;
      if (dto.phone !== undefined) patch.phone = contactVal.normalized.phone;
      if (dto.alternatePhone !== undefined) patch.alternatePhone = contactVal.normalized.alternatePhone;
      if (dto.email !== undefined) patch.email = contactVal.normalized.email;
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
        .update(branches)
        .set(patch)
        .where(
          and(
            eq(branches.organizationId, tenantId),
            eq(branches.id, id)
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

      let auditAction = isReassigned ? 'BRANCH_REASSIGNED' : 'UPDATE';
      if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
        auditAction = dto.isActive ? 'ACTIVATE' : 'DEACTIVATE';
      }

      // Resolve modifier user details for audit log
      const [modifierUser] = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
        })
        .from(identityUsers)
        .where(eq(identityUsers.id, modifierId))
        .limit(1);

      const modifierEmail = modifierUser?.email || 'admin@campus-os.local';

      // Audit Log
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: existing.hierarchyNodeId,
          actorId: modifierId,
          actorEmail: modifierEmail,
          module: 'ORGANIZATION',
          action: auditAction,
          entityType: 'branch',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      // Provision or link account if requested
      if (dto.account) {
        await provisionOrLinkAccountTx(
          tx,
          tenantId,
          existing.hierarchyNodeId,
          dto.account,
          modifierId,
          'BRANCH',
          this.auditService
        );
      }

      return this._getBranchWithTx(tx, tenantId, id);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  TOGGLE STATUS
  // ─────────────────────────────────────────────────────────────────

  async toggleBranchStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ) {
    return this.updateBranch(tenantId, id, { isActive }, actorUserId);
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET SINGLE BRANCH (Detail View)
  // ─────────────────────────────────────────────────────────────────

  async getBranchById(tenantId: string, id: string): Promise<BranchDetailDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this._getBranchWithTx(tx, tenantId, id);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST BRANCHES
  // ─────────────────────────────────────────────────────────────────

  async listBranches(
    tenantId: string,
    filters?: { schoolId?: string; activeOnly?: boolean }
  ): Promise<BranchListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const conditions = [eq(branches.organizationId, tenantId)];

      if (filters?.schoolId) {
        conditions.push(eq(branches.schoolId, filters.schoolId));
      }
      if (filters?.activeOnly) {
        conditions.push(eq(branches.isActive, true));
      }

      const rows = await tx
        .select({
          id: branches.id,
          organizationId: branches.organizationId,
          hierarchyNodeId: branches.hierarchyNodeId,
          schoolId: branches.schoolId,
          schoolName: schools.name,
          schoolCode: schools.code,
          schoolHeadOfficeId: schools.headOfficeId,
          schoolRegionId: schools.regionId,
          code: branches.code,
          name: branches.name,
          shortName: branches.shortName,
          sortOrder: branches.sortOrder,
          logoUrl: branches.logoUrl,
          phone: branches.phone,
          email: branches.email,
          country: branches.country,
          countryId: branches.countryId,
          province: branches.province,
          stateId: branches.stateId,
          city: branches.city,
          cityId: branches.cityId,
          area: branches.area,
          areaId: branches.areaId,
          isActive: branches.isActive,
          createdBy: branches.createdBy,
          updatedBy: branches.updatedBy,
          createdAt: branches.createdAt,
          updatedAt: branches.updatedAt,
        })
        .from(branches)
        .leftJoin(schools, eq(branches.schoolId, schools.id))
        .where(and(...conditions))
        .orderBy(asc(branches.sortOrder), asc(branches.name));

      if (rows.length === 0) return [];

      // Collect user IDs for resolution
      const userIds = new Set<string>();
      rows.forEach((r) => {
        if (r.createdBy) userIds.add(r.createdBy);
        if (r.updatedBy) userIds.add(r.updatedBy);
      });

      const userMap = new Map<string, UserSummaryDto>();
      if (userIds.size > 0) {
        const foundUsers = await tx
          .select({
            id: identityUsers.id,
            email: identityUsers.email,
            firstName: identityUsers.firstName,
            lastName: identityUsers.lastName,
          })
          .from(identityUsers)
          .where(inArray(identityUsers.id, Array.from(userIds)));

        for (const u of foundUsers) {
          userMap.set(u.id, {
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
          });
        }
      }

      // Collect Head Office and Region names
      const hoIds = new Set<string>();
      const regionIds = new Set<string>();
      rows.forEach((r) => {
        if (r.schoolHeadOfficeId) hoIds.add(r.schoolHeadOfficeId);
        if (r.schoolRegionId) regionIds.add(r.schoolRegionId);
      });

      const hoMap = new Map<string, string>();
      if (hoIds.size > 0) {
        const foundHos = await tx
          .select({ id: headOffices.id, name: headOffices.name })
          .from(headOffices)
          .where(inArray(headOffices.id, Array.from(hoIds)));
        for (const ho of foundHos) hoMap.set(ho.id, ho.name);
      }

      const regionMap = new Map<string, string>();
      if (regionIds.size > 0) {
        const foundRegions = await tx
          .select({ id: regions.id, name: regions.name })
          .from(regions)
          .where(inArray(regions.id, Array.from(regionIds)));
        for (const reg of foundRegions) regionMap.set(reg.id, reg.name);
      }

      // Fetch primary administrator for each branch
      const results: BranchListItemDto[] = [];

      for (const row of rows) {
        const [adminInfo] = await tx
          .select({
            email: identityUsers.email,
            firstName: identityUsers.firstName,
            lastName: identityUsers.lastName,
          })
          .from(membershipNodeAssignments)
          .innerJoin(
            organizationMemberships,
            eq(membershipNodeAssignments.membershipId, organizationMemberships.id)
          )
          .innerJoin(
            identityUsers,
            eq(organizationMemberships.identityUserId, identityUsers.id)
          )
          .where(
            and(
              eq(membershipNodeAssignments.organizationId, tenantId),
              eq(membershipNodeAssignments.hierarchyNodeId, row.hierarchyNodeId),
              eq(membershipNodeAssignments.isPrimary, true)
            )
          )
          .limit(1);

        const adminName = adminInfo
          ? [adminInfo.firstName, adminInfo.lastName].filter(Boolean).join(' ') || adminInfo.firstName
          : null;

        results.push({
          id: row.id,
          organizationId: row.organizationId,
          hierarchyNodeId: row.hierarchyNodeId,
          schoolId: row.schoolId,
          schoolName: row.schoolName || 'Parent School Missing / Unassigned',
          schoolCode: row.schoolCode || 'N/A',
          headOfficeName: row.schoolHeadOfficeId ? hoMap.get(row.schoolHeadOfficeId) || null : null,
          regionName: row.schoolRegionId ? regionMap.get(row.schoolRegionId) || null : null,
          code: row.code,
          name: row.name,
          shortName: row.shortName,
          sortOrder: row.sortOrder,
          logoUrl: row.logoUrl,
          phone: row.phone,
          email: row.email,
          country: row.country,
          countryId: row.countryId,
          province: row.province,
          stateId: row.stateId,
          city: row.city,
          cityId: row.cityId,
          area: row.area,
          areaId: row.areaId,
          isActive: row.isActive,
          adminEmail: adminInfo?.email || null,
          adminUsername: adminName,
          createdBy: row.createdBy,
          createdByUser: row.createdBy ? userMap.get(row.createdBy) || null : null,
          updatedBy: row.updatedBy,
          updatedByUser: row.updatedBy ? userMap.get(row.updatedBy) || null : null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
      }

      return results;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  INTERNAL: GET BRANCH WITH TRANSACTION
  // ─────────────────────────────────────────────────────────────────

  private async _getBranchWithTx(tx: any, tenantId: string, id: string): Promise<BranchDetailDto> {
    const [row] = await tx
      .select({
        id: branches.id,
        organizationId: branches.organizationId,
        hierarchyNodeId: branches.hierarchyNodeId,
        schoolId: branches.schoolId,
        schoolName: schools.name,
        schoolCode: schools.code,
        schoolHeadOfficeId: schools.headOfficeId,
        schoolRegionId: schools.regionId,
        code: branches.code,
        name: branches.name,
        shortName: branches.shortName,
        description: branches.description,
        sortOrder: branches.sortOrder,
        logoUrl: branches.logoUrl,
        phone: branches.phone,
        alternatePhone: branches.alternatePhone,
        email: branches.email,
        website: branches.website,
        country: branches.country,
        countryId: branches.countryId,
        province: branches.province,
        stateId: branches.stateId,
        city: branches.city,
        cityId: branches.cityId,
        area: branches.area,
        areaId: branches.areaId,
        address: branches.address,
        postalCode: branches.postalCode,
        notes: branches.notes,
        isActive: branches.isActive,
        createdBy: branches.createdBy,
        updatedBy: branches.updatedBy,
        createdAt: branches.createdAt,
        updatedAt: branches.updatedAt,
      })
      .from(branches)
      .leftJoin(schools, eq(branches.schoolId, schools.id))
      .where(
        and(
          eq(branches.organizationId, tenantId),
          eq(branches.id, id)
        )
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Branch '${id}' not found in this organization.`);
    }

    // Resolve Head Office and Region names
    let headOfficeName: string | null = null;
    if (row.schoolHeadOfficeId) {
      const [ho] = await tx
        .select({ name: headOffices.name })
        .from(headOffices)
        .where(eq(headOffices.id, row.schoolHeadOfficeId))
        .limit(1);
      headOfficeName = ho?.name || null;
    }

    let regionName: string | null = null;
    if (row.schoolRegionId) {
      const [reg] = await tx
        .select({ name: regions.name })
        .from(regions)
        .where(eq(regions.id, row.schoolRegionId))
        .limit(1);
      regionName = reg?.name || null;
    }

    // Resolve createdByUser and updatedByUser
    const userIds = [row.createdBy, row.updatedBy].filter(Boolean) as string[];
    const userMap = new Map<string, UserSummaryDto>();
    if (userIds.length > 0) {
      const foundUsers = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
          firstName: identityUsers.firstName,
          lastName: identityUsers.lastName,
        })
        .from(identityUsers)
        .where(inArray(identityUsers.id, userIds));

      for (const u of foundUsers) {
        userMap.set(u.id, {
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
        });
      }
    }

    // Fetch primary administrator / linkedAccount
    const linkedAccount = await resolveLinkedAccountTx(tx, tenantId, row.hierarchyNodeId);

    const [adminInfo] = await tx
      .select({
        email: identityUsers.email,
        firstName: identityUsers.firstName,
        lastName: identityUsers.lastName,
      })
      .from(membershipNodeAssignments)
      .innerJoin(
        organizationMemberships,
        eq(membershipNodeAssignments.membershipId, organizationMemberships.id)
      )
      .innerJoin(
        identityUsers,
        eq(organizationMemberships.identityUserId, identityUsers.id)
      )
      .where(
        and(
          eq(membershipNodeAssignments.organizationId, tenantId),
          eq(membershipNodeAssignments.hierarchyNodeId, row.hierarchyNodeId),
          eq(membershipNodeAssignments.isPrimary, true)
        )
      )
      .limit(1);

    const adminName = adminInfo
      ? [adminInfo.firstName, adminInfo.lastName].filter(Boolean).join(' ') || adminInfo.firstName
      : null;

    return {
      id: row.id,
      organizationId: row.organizationId,
      hierarchyNodeId: row.hierarchyNodeId,
      schoolId: row.schoolId,
      schoolName: row.schoolName || 'Parent School Missing / Unassigned',
      schoolCode: row.schoolCode || 'N/A',
      headOfficeName,
      regionName,
      code: row.code,
      name: row.name,
      shortName: row.shortName,
      description: row.description,
      sortOrder: row.sortOrder,
      logoUrl: row.logoUrl,
      phone: row.phone,
      alternatePhone: row.alternatePhone,
      email: row.email,
      website: row.website,
      country: row.country,
      countryId: row.countryId,
      province: row.province,
      stateId: row.stateId,
      city: row.city,
      cityId: row.cityId,
      area: row.area,
      areaId: row.areaId,
      address: row.address,
      postalCode: row.postalCode,
      notes: row.notes,
      isActive: row.isActive,
      adminEmail: adminInfo?.email || linkedAccount?.email || null,
      adminUsername: adminName,
      linkedAccount,
      createdBy: row.createdBy,
      createdByUser: row.createdBy ? userMap.get(row.createdBy) || null : null,
      updatedBy: row.updatedBy,
      updatedByUser: row.updatedBy ? userMap.get(row.updatedBy) || null : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  //  DEPENDENCY INSPECTION & SAFE DELETE
  // ─────────────────────────────────────────────────────────────────

  async getDependencies(tenantId: string, id: string): Promise<BranchDependenciesDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this._getDependenciesWithTx(tx, tenantId, id);
    });
  }

  private async _getDependenciesWithTx(
    tx: any,
    tenantId: string,
    id: string
  ): Promise<BranchDependenciesDto> {
    const [branch] = await tx
      .select()
      .from(branches)
      .where(
        and(
          eq(branches.organizationId, tenantId),
          eq(branches.id, id)
        )
      )
      .limit(1);

    if (!branch) {
      throw new NotFoundException(`Branch '${id}' not found`);
    }

    // 1. Classes count scoped to branch
    const [classCountRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(classes)
      .where(
        and(
          eq(classes.organizationId, tenantId),
          eq(classes.ownerId, id)
        )
      );
    const classesCount = Number(classCountRes?.count || 0);

    // 2. Sections count scoped to branch
    const [sectionCountRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(sections)
      .where(
        and(
          eq(sections.organizationId, tenantId),
          eq(sections.ownerId, id)
        )
      );
    const sectionsCount = Number(sectionCountRes?.count || 0);

    // 3. Academic years scoped to branch
    const [acadYearCountRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(configScopeBranches)
      .where(
        and(
          eq(configScopeBranches.organizationId, tenantId),
          eq(configScopeBranches.branchId, id)
        )
      );
    const academicYearsCount = Number(acadYearCountRes?.count || 0);

    // 4. Staff / membership assignments
    const [assignmentCountRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(membershipNodeAssignments)
      .where(
        and(
          eq(membershipNodeAssignments.organizationId, tenantId),
          eq(membershipNodeAssignments.hierarchyNodeId, branch.hierarchyNodeId)
        )
      );
    const staffAssignmentsCount = Number(assignmentCountRes?.count || 0);

    const reasons: string[] = [];
    if (classesCount > 0) reasons.push(`${classesCount} connected class(es)`);
    if (sectionsCount > 0) reasons.push(`${sectionsCount} connected section(s)`);
    if (academicYearsCount > 0) reasons.push(`${academicYearsCount} scoped academic year mapping(s)`);
    if (staffAssignmentsCount > 0) reasons.push(`${staffAssignmentsCount} staff node assignment(s)`);

    const totalDependencies = classesCount + sectionsCount + academicYearsCount + staffAssignmentsCount;

    return {
      canDelete: totalDependencies === 0,
      branchName: branch.name,
      branchCode: branch.code,
      totalDependencies,
      reasons,
      breakdown: {
        classes: classesCount,
        sections: sectionsCount,
        academicYears: academicYearsCount,
        staffAssignments: staffAssignmentsCount,
      },
    };
  }

  async deleteBranch(tenantId: string, id: string, actorUserId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const deps = await this._getDependenciesWithTx(tx, tenantId, id);
      if (!deps.canDelete) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: `Cannot delete Branch '${deps.branchName}' [${deps.branchCode}]. It has ${deps.totalDependencies} active dependencies: ${deps.reasons.join(', ')}. Deactivate the branch instead.`,
          breakdown: deps.breakdown,
        });
      }

      const [branch] = await tx
        .select()
        .from(branches)
        .where(
          and(
            eq(branches.organizationId, tenantId),
            eq(branches.id, id)
          )
        )
        .limit(1);

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      // Delete branch record
      await tx
        .delete(branches)
        .where(
          and(
            eq(branches.organizationId, tenantId),
            eq(branches.id, id)
          )
        );

      // Delete hierarchy node
      await tx
        .delete(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, branch.hierarchyNodeId)
          )
        );

      const actorId = actorUserId || '00000000-0000-0000-0000-000000000000';

      const [actorUser] = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
        })
        .from(identityUsers)
        .where(eq(identityUsers.id, actorId))
        .limit(1);

      const actorEmail = actorUser?.email || 'admin@campus-os.local';

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: branch.hierarchyNodeId,
          actorId,
          actorEmail,
          module: 'ORGANIZATION',
          action: 'DELETE',
          entityType: 'branch',
          entityId: id,
          beforeState: branch,
          afterState: null,
        },
        tx
      );

      return { success: true, message: `Branch '${branch.name}' [${branch.code}] deleted successfully.` };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  NEXT SORT ORDER DETERMINATION (Per School)
  // ─────────────────────────────────────────────────────────────────

  async getNextSortOrder(tenantId: string, schoolId: string): Promise<{ nextSortOrder: number }> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [maxSort] = await tx
        .select({ maxOrder: sql<number>`COALESCE(MAX(${branches.sortOrder}), 0)` })
        .from(branches)
        .where(
          and(
            eq(branches.organizationId, tenantId),
            eq(branches.schoolId, schoolId)
          )
        );
      return { nextSortOrder: (Number(maxSort?.maxOrder) || 0) + 1 };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  REORDER BRANCHES (Deterministic sequence persistence per School)
  // ─────────────────────────────────────────────────────────────────

  async reorderBranches(tenantId: string, dto: ReorderBranchesDto, actorUserId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      for (let i = 0; i < dto.branchIds.length; i++) {
        const branchId = dto.branchIds[i];
        if (!branchId) continue;
        await tx
          .update(branches)
          .set({
            sortOrder: i + 1,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(branches.organizationId, tenantId),
              eq(branches.schoolId, dto.schoolId),
              eq(branches.id, branchId)
            )
          );
      }

      const actorId = actorUserId || '00000000-0000-0000-0000-000000000000';
      const [actorUser] = await tx
        .select({ id: identityUsers.id, email: identityUsers.email })
        .from(identityUsers)
        .where(eq(identityUsers.id, actorId))
        .limit(1);

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId,
          actorEmail: actorUser?.email || 'admin@campus-os.local',
          module: 'ORGANIZATION',
          action: 'REORDER',
          entityType: 'school_branches',
          entityId: dto.schoolId,
          afterState: { schoolId: dto.schoolId, branchOrder: dto.branchIds },
        },
        tx
      );

      return { success: true, count: dto.branchIds.length };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  SUGGEST USERNAME ENGINE (Normalization + Availability Checking)
  // ─────────────────────────────────────────────────────────────────

  async suggestUsername(
    tenantId: string,
    schoolId?: string,
    branchCode?: string,
    branchName?: string
  ): Promise<SuggestUsernameResponseDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      let schoolCode = 'school';
      if (schoolId) {
        const [sch] = await tx
          .select({ code: schools.code })
          .from(schools)
          .where(and(eq(schools.organizationId, tenantId), eq(schools.id, schoolId)))
          .limit(1);
        if (sch?.code) {
          schoolCode = sch.code.toLowerCase().replace(/[^a-z0-9]/g, '');
        }
      }

      const rawBranchCode = (branchCode || 'branch').toLowerCase().replace(/[^a-z0-9]/g, '');
      const rawBranchName = (branchName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Generate candidate usernames
      const candidates: string[] = [];
      if (rawBranchCode) {
        candidates.push(`${rawBranchCode}.admin`);
        candidates.push(`${schoolCode}.${rawBranchCode}`);
        candidates.push(`${schoolCode}.${rawBranchCode}.admin`);
      }
      if (rawBranchName && rawBranchName !== rawBranchCode) {
        candidates.push(`${rawBranchName}.admin`);
      }
      candidates.push(`${schoolCode}.admin`);

      // Check availability against identity_users
      const available: string[] = [];
      for (const candidate of candidates) {
        const [existing] = await tx
          .select({ id: identityUsers.id })
          .from(identityUsers)
          .where(eq(identityUsers.email, candidate))
          .limit(1);

        if (!existing && !available.includes(candidate)) {
          available.push(candidate);
        }
      }

      const primary = available[0] || `${rawBranchCode || 'branch'}.admin.${Date.now().toString().slice(-4)}`;
      const alternatives = available.slice(1);

      return {
        username: primary,
        isAvailable: true,
        alternatives,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET ELIGIBLE SCHOOLS FOR DROPDOWN
  // ─────────────────────────────────────────────────────────────────

  async getEligibleSchools(tenantId: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return tx
        .select({
          id: schools.id,
          code: schools.code,
          name: schools.name,
          city: schools.city,
          hierarchyNodeId: schools.hierarchyNodeId,
        })
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.isActive, true)
          )
        )
        .orderBy(schools.name);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────────────

  private async ensureBranchNodeType(tx: any, tenantId: string) {
    const [existing] = await tx
      .select()
      .from(hierarchyNodeTypes)
      .where(
        and(
          eq(hierarchyNodeTypes.organizationId, tenantId),
          eq(hierarchyNodeTypes.code, 'BRANCH')
        )
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await tx
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: tenantId,
        code: 'BRANCH',
        name: 'Branch / Campus',
        levelOrder: 40,
        allowFinancialPosting: true,
        allowUserAssignment: true,
        isActive: true,
      })
      .returning();

    return created!;
  }

  private sanitizePath(segment: string): string {
    return segment.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }
}
