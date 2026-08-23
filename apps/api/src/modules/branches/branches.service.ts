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
  auditLogs,
  eq,
  and,
} from '@campus-os/database';
import {
  CreateBranchDto,
  UpdateBranchDto,
  BranchListItemDto,
  BranchDetailDto,
} from '@campus-os/types';
import { PasswordService } from '../../core/iam/services/password.service.js';

@Injectable()
export class BranchesService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly passwordService: PasswordService
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

      let createdAdminUser: { id: string; email: string } | null = null;

      // 7. Optional Branch Administrator Provisioning
      if (dto.adminUser && dto.adminUser.email && dto.adminUser.password) {
        const adminEmail = dto.adminUser.email.trim().toLowerCase();
        const username = dto.adminUser.username?.trim() || adminEmail;

        // Check if identity user already exists
        const [existingUser] = await tx
          .select({ id: identityUsers.id })
          .from(identityUsers)
          .where(eq(identityUsers.email, adminEmail))
          .limit(1);

        if (existingUser) {
          throw new ConflictException(`An account with email '${adminEmail}' already exists.`);
        }

        // Hash password securely with Argon2id
        const passwordHash = await this.passwordService.hash(dto.adminUser.password);

        const [newUser] = await tx
          .insert(identityUsers)
          .values({
            email: adminEmail,
            passwordHash,
            firstName: username,
            lastName: 'Administrator',
            phoneNumber: dto.phone?.trim() || null,
            isActive: true,
          })
          .returning();

        createdAdminUser = { id: newUser!.id, email: adminEmail };

        // Create organization membership
        const [membership] = await tx
          .insert(organizationMemberships)
          .values({
            organizationId: tenantId,
            identityUserId: newUser!.id,
            membershipType: 'STAFF',
            status: 'ACTIVE',
          })
          .returning();

        // Scope administrator to this specific Branch node
        const [assignment] = await tx
          .insert(membershipNodeAssignments)
          .values({
            organizationId: tenantId,
            membershipId: membership!.id,
            hierarchyNodeId: node!.id,
            isPrimary: true,
            status: 'ACTIVE',
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
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: actorUserId ?? null,
        actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
        entityType: 'branch',
        entityId: newBranch!.id,
        action: 'CREATE',
        beforeState: null,
        afterState: {
          ...newBranch,
          adminUserProvisioned: !!createdAdminUser,
          adminEmail: createdAdminUser?.email || null,
        },
      });

      return newBranch!;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST BRANCHES
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
        .orderBy(branches.name);

      // Fetch primary administrator for each branch
      const results: BranchListItemDto[] = [];

      for (const row of rows) {
        const [adminInfo] = await tx
          .select({
            email: identityUsers.email,
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
          adminUsername: adminInfo?.email ? adminInfo.email.split('@')[0] : null,
        });
      }

      return results;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET BY ID
  // ─────────────────────────────────────────────────────────────────

  async getBranch(tenantId: string, id: string): Promise<BranchDetailDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [branchRow] = await tx
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

      if (!branchRow) {
        throw new NotFoundException(`Branch '${id}' not found in this organization.`);
      }

      const [adminInfo] = await tx
        .select({
          email: identityUsers.email,
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
            eq(membershipNodeAssignments.hierarchyNodeId, branchRow.hierarchyNodeId),
            eq(membershipNodeAssignments.isPrimary, true)
          )
        )
        .limit(1);

      return {
        ...branchRow,
        adminEmail: adminInfo?.email || null,
        adminUsername: adminInfo?.email ? adminInfo.email.split('@')[0] : null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE BRANCH
  // ─────────────────────────────────────────────────────────────────

  async updateBranch(
    tenantId: string,
    id: string,
    dto: UpdateBranchDto,
    actorUserId?: string
  ) {
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

      // Sync name and isActive to hierarchy_nodes entry
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

      // Audit Log
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: actorUserId ?? null,
        actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
        entityType: 'branch',
        entityId: id,
        action: 'UPDATE',
        beforeState: existing,
        afterState: updated,
      });

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
  //  ELIGIBLE SCHOOLS (Parent Selection)
  // ─────────────────────────────────────────────────────────────────

  async getEligibleSchools(tenantId: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return tx
        .select({
          id: schools.id,
          code: schools.code,
          name: schools.name,
          city: schools.city,
          schoolType: schools.schoolType,
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

  // ── PRIVATE HELPERS ──────────────────────────────────────────────

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

  private sanitizePath(code: string): string {
    return code
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
