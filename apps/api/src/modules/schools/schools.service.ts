import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import {
  TenantTransactionManager,
  schools,
  hierarchyNodes,
  hierarchyNodeTypes,
  auditLogs,
  eq,
  and,
  desc,
  sql,
} from '@campus-os/database';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  SchoolListItemDto,
  EligibleParentNodeDto,
} from '@campus-os/types';

@Injectable()
export class SchoolsService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  /**
   * Helper to ensure the 'SCHOOL' hierarchy node type exists for this organization
   */
  private async ensureSchoolNodeType(tx: any, tenantId: string) {
    const [existing] = await tx
      .select()
      .from(hierarchyNodeTypes)
      .where(
        and(
          eq(hierarchyNodeTypes.organizationId, tenantId),
          eq(hierarchyNodeTypes.code, 'SCHOOL')
        )
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await tx
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: tenantId,
        code: 'SCHOOL',
        name: 'School',
        levelOrder: 30,
        allowFinancialPosting: true,
        allowUserAssignment: true,
        isActive: true,
      })
      .returning();

    return created;
  }

  /**
   * Create a new School and synchronize with hierarchy engine
   */
  async createSchool(tenantId: string, dto: CreateSchoolDto, userId?: string) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('School Name is required');
    }
    if (!dto.code || !dto.code.trim()) {
      throw new BadRequestException('School Code is required');
    }
    if (!dto.parentId) {
      throw new BadRequestException('Parent Context (Head Office or Region) is required');
    }

    const cleanCode = dto.code.trim().toUpperCase();
    const cleanName = dto.name.trim();

    return this.txManager.withTenant(tenantId, async (tx) => {
      // 1. Verify parent node exists in this tenant
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
        throw new NotFoundException('Selected Parent Hierarchy Node does not exist in this organization');
      }

      // 2. Check for duplicate school code in tenant
      const [existingSchool] = await tx
        .select()
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.code, cleanCode)
          )
        )
        .limit(1);

      if (existingSchool) {
        throw new ConflictException(`School with code '${cleanCode}' already exists in this organization`);
      }

      // 3. Ensure SCHOOL node type exists
      const schoolNodeType = await this.ensureSchoolNodeType(tx, tenantId);

      // 4. Compute ltree path
      const sanitizedCodeSegment = cleanCode.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const nodePath = `${parentNode.path}.${sanitizedCodeSegment}`;

      // 5. Create hierarchy node
      const [node] = await tx
        .insert(hierarchyNodes)
        .values({
          organizationId: tenantId,
          nodeTypeId: schoolNodeType.id,
          parentId: parentNode.id,
          code: cleanCode,
          name: cleanName,
          path: nodePath,
          address: {
            address: dto.address ?? '',
            area: dto.area ?? '',
            city: dto.city ?? '',
            province: dto.province ?? '',
            postalCode: dto.postalCode ?? '',
          },
          contactInfo: {
            principalName: dto.principalName ?? '',
            email: dto.email ?? '',
            phone: dto.phone ?? '',
            alternatePhone: dto.alternatePhone ?? '',
            website: dto.website ?? '',
          },
          metadata: {
            schoolType: dto.schoolType ?? 'K12',
            registrationNumber: dto.registrationNumber ?? '',
            educationBoard: dto.educationBoard ?? '',
            customDomain: dto.customDomain ?? '',
            defaultLanguage: dto.defaultLanguage ?? 'en',
            timezone: dto.timezone ?? 'UTC',
            currency: dto.currency ?? 'PKR',
            notes: dto.notes ?? '',
          },
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // 6. Create school record
      const [newSchool] = await tx
        .insert(schools)
        .values({
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          code: cleanCode,
          name: cleanName,
          parentId: parentNode.id,
          schoolType: dto.schoolType ?? 'K12',
          registrationNumber: dto.registrationNumber ?? null,
          educationBoard: dto.educationBoard ?? null,
          principalName: dto.principalName ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          alternatePhone: dto.alternatePhone ?? null,
          address: dto.address ?? null,
          area: dto.area ?? null,
          city: dto.city ?? null,
          province: dto.province ?? null,
          postalCode: dto.postalCode ?? null,
          website: dto.website ?? null,
          logoUrl: dto.logoUrl ?? null,
          customDomain: dto.customDomain ?? null,
          defaultLanguage: dto.defaultLanguage ?? 'en',
          timezone: dto.timezone ?? 'UTC',
          currency: dto.currency ?? 'PKR',
          notes: dto.notes ?? null,
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // 7. Record audit trail
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ?? null,
        entityType: 'school',
        entityId: newSchool!.id,
        action: 'CREATE',
        afterState: newSchool,
      });

      return newSchool;
    });
  }

  /**
   * List all schools with parent node details and child branch counts
   */
  async listSchools(
    tenantId: string,
    filters?: { search?: string; status?: string; parentId?: string }
  ): Promise<SchoolListItemDto[]> {
    return this.txManager.withTenant(tenantId, async (tx) => {
      // Query schools with parent info and compute child branch count
      const allSchools = await tx
        .select({
          id: schools.id,
          organizationId: schools.organizationId,
          hierarchyNodeId: schools.hierarchyNodeId,
          code: schools.code,
          name: schools.name,
          parentId: schools.parentId,
          parentName: hierarchyNodes.name,
          schoolType: schools.schoolType,
          registrationNumber: schools.registrationNumber,
          educationBoard: schools.educationBoard,
          principalName: schools.principalName,
          email: schools.email,
          phone: schools.phone,
          city: schools.city,
          isActive: schools.isActive,
          createdAt: schools.createdAt,
          updatedAt: schools.updatedAt,
        })
        .from(schools)
        .leftJoin(hierarchyNodes, eq(hierarchyNodes.id, schools.parentId))
        .where(eq(schools.organizationId, tenantId))
        .orderBy(desc(schools.createdAt));

      // Get branch counts for all schools in tenant
      const branchNodes = await tx
        .select({
          parentId: hierarchyNodes.parentId,
          count: sql<number>`count(*)::int`,
        })
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.organizationId, tenantId))
        .groupBy(hierarchyNodes.parentId);

      const branchCountMap = new Map<string, number>();
      for (const b of branchNodes) {
        if (b.parentId) {
          branchCountMap.set(b.parentId, b.count);
        }
      }

      // Format and filter
      let result: SchoolListItemDto[] = allSchools.map((s) => ({
        id: s.id,
        organizationId: s.organizationId,
        hierarchyNodeId: s.hierarchyNodeId,
        code: s.code,
        name: s.name,
        parentId: s.parentId,
        parentName: s.parentName ?? 'Head Office',
        parentType: 'Parent Node',
        schoolType: s.schoolType,
        registrationNumber: s.registrationNumber,
        educationBoard: s.educationBoard,
        principalName: s.principalName,
        email: s.email,
        phone: s.phone,
        city: s.city,
        branchCount: branchCountMap.get(s.hierarchyNodeId) ?? 0,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        result = result.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            (s.city && s.city.toLowerCase().includes(q)) ||
            (s.principalName && s.principalName.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q))
        );
      }

      if (filters?.status && filters.status !== 'ALL') {
        const isAct = filters.status === 'ACTIVE';
        result = result.filter((s) => s.isActive === isAct);
      }

      if (filters?.parentId && filters.parentId !== 'ALL') {
        result = result.filter((s) => s.parentId === filters.parentId);
      }

      return result;
    });
  }

  /**
   * Get single school details by ID
   */
  async getSchool(tenantId: string, id: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [school] = await tx
        .select()
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.id, id)
          )
        )
        .limit(1);

      if (!school) {
        throw new NotFoundException('School not found');
      }

      const [parentNode] = await tx
        .select({ id: hierarchyNodes.id, name: hierarchyNodes.name, code: hierarchyNodes.code })
        .from(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, school.parentId)
          )
        )
        .limit(1);

      const [branchCountResult] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.parentId, school.hierarchyNodeId)
          )
        );

      return {
        ...school,
        parentName: parentNode?.name ?? 'Head Office',
        parentCode: parentNode?.code ?? 'HO',
        branchCount: branchCountResult?.count ?? 0,
      };
    });
  }

  /**
   * Update school details and sync with hierarchy node
   */
  async updateSchool(tenantId: string, id: string, dto: UpdateSchoolDto, userId?: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.id, id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new NotFoundException('School not found');
      }

      // Update school record
      const [updated] = await tx
        .update(schools)
        .set({
          name: dto.name !== undefined ? dto.name.trim() : existing.name,
          schoolType: dto.schoolType !== undefined ? dto.schoolType : existing.schoolType,
          registrationNumber: dto.registrationNumber !== undefined ? dto.registrationNumber : existing.registrationNumber,
          educationBoard: dto.educationBoard !== undefined ? dto.educationBoard : existing.educationBoard,
          principalName: dto.principalName !== undefined ? dto.principalName : existing.principalName,
          email: dto.email !== undefined ? dto.email : existing.email,
          phone: dto.phone !== undefined ? dto.phone : existing.phone,
          alternatePhone: dto.alternatePhone !== undefined ? dto.alternatePhone : existing.alternatePhone,
          address: dto.address !== undefined ? dto.address : existing.address,
          area: dto.area !== undefined ? dto.area : existing.area,
          city: dto.city !== undefined ? dto.city : existing.city,
          province: dto.province !== undefined ? dto.province : existing.province,
          postalCode: dto.postalCode !== undefined ? dto.postalCode : existing.postalCode,
          website: dto.website !== undefined ? dto.website : existing.website,
          logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : existing.logoUrl,
          customDomain: dto.customDomain !== undefined ? dto.customDomain : existing.customDomain,
          defaultLanguage: dto.defaultLanguage !== undefined ? dto.defaultLanguage : existing.defaultLanguage,
          timezone: dto.timezone !== undefined ? dto.timezone : existing.timezone,
          currency: dto.currency !== undefined ? dto.currency : existing.currency,
          notes: dto.notes !== undefined ? dto.notes : existing.notes,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.id, id)
          )
        )
        .returning();

      // Synchronize changes to the hierarchy node
      await tx
        .update(hierarchyNodes)
        .set({
          name: updated!.name,
          address: {
            address: updated!.address ?? '',
            area: updated!.area ?? '',
            city: updated!.city ?? '',
            province: updated!.province ?? '',
            postalCode: updated!.postalCode ?? '',
          },
          contactInfo: {
            principalName: updated!.principalName ?? '',
            email: updated!.email ?? '',
            phone: updated!.phone ?? '',
            alternatePhone: updated!.alternatePhone ?? '',
            website: updated!.website ?? '',
          },
          isActive: updated!.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, existing.hierarchyNodeId)
          )
        );

      // Audit log
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ?? null,
        entityType: 'school',
        entityId: id,
        action: 'UPDATE',
        beforeState: existing,
        afterState: updated,
      });

      return updated;
    });
  }

  /**
   * Toggle school active status
   */
  async toggleSchoolStatus(tenantId: string, id: string, isActive: boolean, userId?: string) {
    return this.updateSchool(tenantId, id, { isActive }, userId);
  }

  /**
   * Return eligible parent hierarchy nodes (Head Office or Region nodes) for this tenant
   */
  async getEligibleParents(tenantId: string): Promise<EligibleParentNodeDto[]> {
    return this.txManager.withTenant(tenantId, async (tx) => {
      // Find all hierarchy nodes and join with node types
      const nodes = await tx
        .select({
          id: hierarchyNodes.id,
          name: hierarchyNodes.name,
          code: hierarchyNodes.code,
          path: hierarchyNodes.path,
          typeCode: hierarchyNodeTypes.code,
          typeName: hierarchyNodeTypes.name,
        })
        .from(hierarchyNodes)
        .leftJoin(
          hierarchyNodeTypes,
          eq(hierarchyNodeTypes.id, hierarchyNodes.nodeTypeId)
        )
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.isActive, true)
          )
        )
        .orderBy(hierarchyNodes.name);

      // Filter to eligible parent types (Head Office, Region, or any node that is not a School or Branch)
      const eligible = nodes.filter(
        (n) =>
          !n.typeCode ||
          n.typeCode.toUpperCase() === 'HEAD_OFFICE' ||
          n.typeCode.toUpperCase() === 'REGION' ||
          n.typeCode.toUpperCase() === 'ROOT' ||
          (n.typeCode.toUpperCase() !== 'SCHOOL' && n.typeCode.toUpperCase() !== 'BRANCH')
      );

      // Fallback: If no specific parent types match, allow any non-school node
      const fallbackList = eligible.length > 0 ? eligible : nodes;

      return fallbackList.map((n) => ({
        id: n.id,
        name: n.name,
        code: n.code,
        type: n.typeName ?? n.typeCode ?? 'Parent Node',
        path: String(n.path),
      }));
    });
  }
}
