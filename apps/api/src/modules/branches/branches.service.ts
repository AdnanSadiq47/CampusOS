import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  TenantTransactionManager,
  branches,
  schools,
  hierarchyNodes,
  hierarchyNodeTypes,
  identityUsers,
  organizationMemberships,
  membershipNodeAssignments,
  assignmentRoles,
  eq,
  and,
  asc,
  sql,
} from '@campus-os/database';
import {
  CreateBranchDto,
  UpdateBranchDto,
  BranchListItemDto,
  BranchDetailDto,
  ReorderBranchesDto,
  SuggestUsernameResponseDto,
} from '@campus-os/types';
import { PasswordService } from '../../core/iam/services/password.service.js';
import { AuditService } from '../../core/audit/audit.service.js';

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

      // 6. Create branches record
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
          phone: dto.phone?.trim() || null,
          alternatePhone: dto.alternatePhone?.trim() || null,
          email: dto.email?.trim() || null,
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

      // 7. Optional Administrator Provisioning
      let createdAdminUser = null;
      if (dto.adminUser && dto.adminUser.email) {
        const adminEmail = dto.adminUser.email.trim().toLowerCase();
        const adminUsername = dto.adminUser.username.trim();

        // Check if identity user already exists
        const [existingIdentity] = await tx
          .select()
          .from(identityUsers)
          .where(eq(identityUsers.email, adminEmail))
          .limit(1);

        let identityId: string;

        if (existingIdentity) {
          identityId = existingIdentity.id;
          createdAdminUser = existingIdentity;
        } else {
          // Hash password securely with Argon2id
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
          createdAdminUser = newIdentity;
        }

        // Check or create organization membership
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

        // Create node assignment scoped strictly to the newly created branch node
        const [assignment] = await tx
          .insert(membershipNodeAssignments)
          .values({
            organizationId: tenantId,
            membershipId,
            hierarchyNodeId: node!.id,
            isPrimary: true,
            status: 'ACTIVE',
            assignedBy: actorUserId ?? null,
          })
          .returning();

        // Assign role if provided
        if (dto.adminUser.roleId) {
          await tx.insert(assignmentRoles).values({
            organizationId: tenantId,
            assignmentId: assignment!.id,
            roleId: dto.adminUser.roleId,
          });
        }
      }

      // 8. Audit Log (Strictly sanitizing: NEVER log password or password hash)
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'branch',
          entityId: newBranch!.id,
          beforeState: null,
          afterState: {
            ...newBranch,
            adminUserProvisioned: !!createdAdminUser,
            adminEmail: createdAdminUser?.email || null,
          },
        },
        tx
      );

      return newBranch!;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST BRANCHES (Canonical Ordering: school.name, branch.sortOrder, branch.name)
  // ─────────────────────────────────────────────────────────────────

  async listBranches(
    tenantId: string,
    options: { schoolId?: string; activeOnly?: boolean } = {}
  ): Promise<BranchListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const conditions = [eq(branches.organizationId, tenantId)];
      if (options.schoolId) {
        conditions.push(eq(branches.schoolId, options.schoolId));
      }
      if (options.activeOnly) {
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
          code: branches.code,
          name: branches.name,
          shortName: branches.shortName,
          sortOrder: branches.sortOrder,
          logoUrl: branches.logoUrl,
          phone: branches.phone,
          email: branches.email,
          city: branches.city,
          province: branches.province,
          country: branches.country,
          isActive: branches.isActive,
          createdAt: branches.createdAt,
          updatedAt: branches.updatedAt,
        })
        .from(branches)
        .innerJoin(schools, eq(branches.schoolId, schools.id))
        .where(and(...conditions))
        .orderBy(asc(schools.name), asc(branches.sortOrder), asc(branches.name));

      // Fetch primary administrator for each branch
      const results: BranchListItemDto[] = [];

      for (const row of rows) {
        const [adminInfo] = await tx
          .select({
            email: identityUsers.email,
            firstName: identityUsers.firstName,
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

        results.push({
          ...row,
          adminEmail: adminInfo?.email || null,
          adminUsername: adminInfo?.firstName || null,
        });
      }

      return results;
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

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
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
  //  GET SINGLE BRANCH
  // ─────────────────────────────────────────────────────────────────

  async getBranchById(tenantId: string, id: string): Promise<BranchDetailDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          id: branches.id,
          organizationId: branches.organizationId,
          hierarchyNodeId: branches.hierarchyNodeId,
          schoolId: branches.schoolId,
          schoolName: schools.name,
          schoolCode: schools.code,
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
          province: branches.province,
          city: branches.city,
          area: branches.area,
          address: branches.address,
          postalCode: branches.postalCode,
          notes: branches.notes,
          isActive: branches.isActive,
          createdAt: branches.createdAt,
          updatedAt: branches.updatedAt,
        })
        .from(branches)
        .innerJoin(schools, eq(branches.schoolId, schools.id))
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

      // Fetch primary administrator for this branch
      const [adminInfo] = await tx
        .select({
          email: identityUsers.email,
          firstName: identityUsers.firstName,
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

      return {
        ...row,
        adminEmail: adminInfo?.email || null,
        adminUsername: adminInfo?.firstName || null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE BRANCH
  // ─────────────────────────────────────────────────────────────────

  async updateBranch(tenantId: string, id: string, dto: UpdateBranchDto, actorUserId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
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

      const patch: Partial<typeof branches.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.name !== undefined) patch.name = dto.name.trim();
      if (dto.shortName !== undefined) patch.shortName = dto.shortName?.trim() || null;
      if (dto.description !== undefined) patch.description = dto.description?.trim() || null;
      if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
      if (dto.logoUrl !== undefined) patch.logoUrl = dto.logoUrl?.trim() || null;
      if (dto.phone !== undefined) patch.phone = dto.phone?.trim() || null;
      if (dto.alternatePhone !== undefined) patch.alternatePhone = dto.alternatePhone?.trim() || null;
      if (dto.email !== undefined) patch.email = dto.email?.trim() || null;
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

      let auditAction = 'UPDATE';
      if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
        auditAction = dto.isActive ? 'ACTIVATE' : 'DEACTIVATE';
      }

      // Audit Log
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: existing.hierarchyNodeId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: auditAction,
          entityType: 'branch',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      return updated!;
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
