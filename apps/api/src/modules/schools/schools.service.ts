import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  TenantTransactionManager,
  schools,
  headOffices,
  regions,
  branches,
  preAdmissions,
  academicYears,
  boards,
  classes,
  sections,
  subjects,
  languages,
  membershipNodeAssignments,
  hierarchyNodes,
  hierarchyNodeTypes,
  identityUsers,
  eq,
  and,
  desc,
  sql,
  inArray,
} from '@campus-os/database';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  SchoolListItemDto,
  SchoolDetailDto,
  SchoolDependenciesDto,
  EligibleParentNodeDto,
  SchoolPermissions,
  UserSummaryDto,
  SchoolType,
  VALID_SCHOOL_TYPE_CODES,
  validateAndNormalizeContactFields,
} from '@campus-os/types';
import { AuditService } from '../../core/audit/audit.service.js';
import { provisionOrLinkAccountTx, resolveLinkedAccountTx } from '../../core/iam/iam-provisioning.util.js';
import { validateAndResolveGeographyHierarchy } from '../geography/geography-validation.util.js';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

  // ─────────────────────────────────────────────────────────────────
  //  FAIL-CLOSED PERMISSION CHECKER
  // ─────────────────────────────────────────────────────────────────

  private assertPermission(permissionsHeader: string | undefined, requiredPermission: SchoolPermissions) {
    if (!permissionsHeader || permissionsHeader.trim() === '') {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Fail-closed: No permissions context provided. Access denied.',
      });
    }

    const perms = permissionsHeader.split(',').map((p) => p.trim());
    if (!perms.includes(requiredPermission)) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: `Forbidden: User lacks required permission '${requiredPermission}'`,
      });
    }
  }

  /**
   * Helper to ensure a specific hierarchy node type exists for this organization
   */
  private async ensureNodeType(tx: any, tenantId: string, code: string, name: string, levelOrder: number) {
    const [existing] = await tx
      .select()
      .from(hierarchyNodeTypes)
      .where(
        and(
          eq(hierarchyNodeTypes.organizationId, tenantId),
          eq(hierarchyNodeTypes.code, code)
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
        code,
        name,
        levelOrder,
        allowFinancialPosting: true,
        allowUserAssignment: true,
        isActive: true,
      })
      .returning();

    return created;
  }

  // ─────────────────────────────────────────────────────────────────
  //  CREATE SCHOOL
  // ─────────────────────────────────────────────────────────────────

  async createSchool(
    tenantId: string,
    dto: CreateSchoolDto,
    userId?: string,
    permissionsHeader?: string
  ): Promise<SchoolListItemDto> {
    this.assertPermission(permissionsHeader, SchoolPermissions.CREATE);

    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('School Name is required');
    }
    if (!dto.code || !dto.code.trim()) {
      throw new BadRequestException('School Code is required');
    }
    if (!dto.headOfficeId) {
      throw new BadRequestException('Head Office selection is mandatory for School');
    }

    const cleanCode = dto.code.trim().toUpperCase();
    const cleanName = dto.name.trim();

    // Validate optional URLs & phone
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    const web = dto.websiteUrl || dto.website;
    if (web && web.trim() && !urlRegex.test(web.trim())) {
      throw new BadRequestException('Invalid Website URL format');
    }
    if (dto.facebookUrl && dto.facebookUrl.trim() && !urlRegex.test(dto.facebookUrl.trim())) {
      throw new BadRequestException('Invalid Facebook URL format');
    }
    if (dto.linkedinUrl && dto.linkedinUrl.trim() && !urlRegex.test(dto.linkedinUrl.trim())) {
      throw new BadRequestException('Invalid LinkedIn URL format');
    }
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
    if (dto.whatsappNumber && dto.whatsappNumber.trim() && !phoneRegex.test(dto.whatsappNumber.trim())) {
      throw new BadRequestException('Invalid WhatsApp number format');
    }

    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // 1. Uniqueness check per tenant
      const [existing] = await tx
        .select({ id: schools.id })
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.code, cleanCode)
          )
        )
        .limit(1);

      if (existing) {
        throw new ConflictException(`School with code '${cleanCode}' already exists in this organization`);
      }

      // 2. Verify Head Office exists
      const [ho] = await tx
        .select()
        .from(headOffices)
        .where(
          and(
            eq(headOffices.organizationId, tenantId),
            eq(headOffices.id, dto.headOfficeId)
          )
        )
        .limit(1);

      if (!ho) {
        throw new NotFoundException('Selected Head Office does not exist in this organization');
      }

      // 3. Verify Head Office hierarchy node exists
      const [hoNode] = await tx
        .select()
        .from(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, ho.hierarchyNodeId)
          )
        )
        .limit(1);

      if (!hoNode) {
        throw new NotFoundException('Hierarchy node for Head Office not found');
      }

      let parentHierarchyNode = hoNode;
      let selectedRegionId: string | null = null;
      let regionName: string | null = null;
      let regionCode: string | null = null;

      // 4. If Region is provided, validate that it belongs to this Head Office
      if (dto.regionId) {
        const [reg] = await tx
          .select()
          .from(regions)
          .where(
            and(
              eq(regions.organizationId, tenantId),
              eq(regions.id, dto.regionId)
            )
          )
          .limit(1);

        if (!reg) {
          throw new NotFoundException('Selected Region does not exist in this organization');
        }

        const [regNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, reg.hierarchyNodeId)
            )
          )
          .limit(1);

        if (!regNode) {
          throw new NotFoundException('Hierarchy node for Region not found');
        }

        // Validate Region parentage matches Head Office hierarchy node
        if (regNode.parentId !== hoNode.id && !regNode.path.startsWith(hoNode.path)) {
          throw new BadRequestException(
            `Selected Region '${reg.name}' does not belong to Head Office '${ho.name}'`
          );
        }

        parentHierarchyNode = regNode;
        selectedRegionId = reg.id;
        regionName = reg.name;
        regionCode = reg.code;
      }

      // 5. Ensure SCHOOL node type exists
      const schoolNodeType = await this.ensureNodeType(tx, tenantId, 'SCHOOL', 'School', 30);

      // 6. Compute ltree path
      const sanitizedCodeSegment = cleanCode.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const nodePath = `${parentHierarchyNode.path}.${sanitizedCodeSegment}`;

      // 7. Insert hierarchy_nodes row
      const [node] = await tx
        .insert(hierarchyNodes)
        .values({
          organizationId: tenantId,
          nodeTypeId: schoolNodeType.id,
          parentId: parentHierarchyNode.id,
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
            website: (dto.websiteUrl || dto.website) ?? '',
          },
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      const creatorId = userId || '00000000-0000-0000-0000-000000000000';

      // 8. Validate & Resolve Geography Hierarchy
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

      // Validate School Type
      let schoolTypeVal = SchoolType.SCHOOL;
      if (dto.schoolType && dto.schoolType.trim()) {
        const cleanType = dto.schoolType.trim();
        if (!VALID_SCHOOL_TYPE_CODES.has(cleanType)) {
          throw new BadRequestException(
            `Invalid school type '${cleanType}'. Must be one of: SCHOOL, COLLEGE, UNIVERSITY, ACADEMY_INSTITUTE`
          );
        }
        schoolTypeVal = cleanType as any;
      }

      // 8.5 Validate & normalize contact fields
      const contactVal = validateAndNormalizeContactFields({
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        website: dto.websiteUrl || dto.website,
        whatsappNumber: dto.whatsappNumber,
      });
      if (!contactVal.valid) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed for structured contact fields',
          errors: contactVal.errors,
        });
      }

      // 9. Insert schools row
      const [newSchool] = await tx
        .insert(schools)
        .values({
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          parentId: parentHierarchyNode.id,
          headOfficeId: ho.id,
          regionId: selectedRegionId,
          code: cleanCode,
          name: cleanName,
          shortName: dto.name,
          description: dto.notes ?? null,
          schoolType: schoolTypeVal,
          registrationNumber: dto.registrationNumber ?? null,
          educationBoard: dto.educationBoard ?? null,
          principalName: dto.principalName ?? null,
          email: contactVal.normalized.email,
          phone: contactVal.normalized.phone,
          alternatePhone: contactVal.normalized.alternatePhone,
          address: dto.address ?? null,
          area: geo.area,
          city: geo.city,
          province: geo.province,
          country: geo.country || 'Pakistan',
          postalCode: geo.postalCode,
          countryId: geo.countryId,
          stateId: geo.stateId,
          cityId: geo.cityId,
          areaId: geo.areaId,
          website: contactVal.normalized.website,
          websiteUrl: contactVal.normalized.website,
          facebookUrl: dto.facebookUrl || null,
          linkedinUrl: dto.linkedinUrl || null,
          whatsappNumber: contactVal.normalized.whatsappNumber,
          logoUrl: dto.logoUrl || null,
          customDomain: dto.customDomain ?? null,
          defaultLanguage: dto.defaultLanguage ?? 'en',
          timezone: dto.timezone ?? 'UTC',
          currency: 'PKR',
          notes: dto.notes ?? null,
          isActive: dto.status !== undefined ? dto.status : true,
          createdBy: creatorId,
          updatedBy: creatorId,
        })
        .returning();

      // Resolve creator user
      const [creatorUser] = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
          firstName: identityUsers.firstName,
          lastName: identityUsers.lastName,
        })
        .from(identityUsers)
        .where(eq(identityUsers.id, creatorId))
        .limit(1);

      const creatorSummary: UserSummaryDto = creatorUser
        ? {
            id: creatorUser.id,
            name: [creatorUser.firstName, creatorUser.lastName].filter(Boolean).join(' ') || creatorUser.email,
            email: creatorUser.email,
            firstName: creatorUser.firstName,
            lastName: creatorUser.lastName,
          }
        : {
            id: creatorId,
            name: 'System User',
            email: 'system@campus-os.local',
            firstName: 'System',
            lastName: 'User',
          };

      // 9. Record canonical audit log with actual authenticated actor
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: node!.id,
          actorId: creatorId,
          actorEmail: creatorSummary.email,
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'school',
          entityId: newSchool!.id,
          beforeState: null,
          afterState: newSchool,
        },
        tx
      );

      // Provision or link account if requested
      let linkedAccount = null;
      if (dto.account) {
        linkedAccount = await provisionOrLinkAccountTx(
          tx,
          tenantId,
          node!.id,
          dto.account,
          creatorId,
          'SCHOOL',
          this.auditService
        );
      } else {
        linkedAccount = await resolveLinkedAccountTx(tx, tenantId, node!.id);
      }

      return {
        id: newSchool!.id,
        organizationId: newSchool!.organizationId,
        hierarchyNodeId: newSchool!.hierarchyNodeId,
        parentId: newSchool!.parentId,
        headOfficeId: ho.id,
        headOfficeName: ho.name,
        headOfficeCode: ho.code,
        regionId: selectedRegionId,
        regionName,
        regionCode,
        code: newSchool!.code,
        name: newSchool!.name,
        parentName: parentHierarchyNode.name,
        parentType: selectedRegionId ? 'Region' : 'Head Office',
        schoolType: newSchool!.schoolType,
        registrationNumber: newSchool!.registrationNumber,
        educationBoard: newSchool!.educationBoard,
        principalName: newSchool!.principalName,
        email: newSchool!.email,
        phone: newSchool!.phone,
        city: newSchool!.city,
        province: newSchool!.province,
        country: newSchool!.country,
        websiteUrl: newSchool!.websiteUrl || newSchool!.website || null,
        facebookUrl: newSchool!.facebookUrl || null,
        linkedinUrl: newSchool!.linkedinUrl || null,
        whatsappNumber: newSchool!.whatsappNumber || null,
        logoUrl: newSchool!.logoUrl || null,
        branchCount: 0,
        isActive: newSchool!.isActive,
        linkedAccount,
        createdBy: newSchool!.createdBy,
        updatedBy: newSchool!.updatedBy,
        createdByUser: creatorSummary,
        updatedByUser: creatorSummary,
        createdAt: newSchool!.createdAt,
        updatedAt: newSchool!.updatedAt,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST SCHOOLS
  // ─────────────────────────────────────────────────────────────────

  async listSchools(
    tenantId: string,
    filters?: { search?: string; status?: string; parentId?: string; headOfficeId?: string; regionId?: string },
    permissionsHeader?: string
  ): Promise<SchoolListItemDto[]> {
    this.assertPermission(permissionsHeader, SchoolPermissions.VIEW);

    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // 1. Fetch schools with left-joined parent hierarchy nodes, head offices, and regions
      const rawSchools = await tx
        .select({
          id: schools.id,
          organizationId: schools.organizationId,
          hierarchyNodeId: schools.hierarchyNodeId,
          parentId: schools.parentId,
          headOfficeId: schools.headOfficeId,
          regionId: schools.regionId,
          code: schools.code,
          name: schools.name,
          shortName: schools.shortName,
          schoolType: schools.schoolType,
          registrationNumber: schools.registrationNumber,
          educationBoard: schools.educationBoard,
          principalName: schools.principalName,
          email: schools.email,
          phone: schools.phone,
          city: schools.city,
          province: schools.province,
          country: schools.country,
          address: schools.address,
          area: schools.area,
          postalCode: schools.postalCode,
          countryId: schools.countryId,
          stateId: schools.stateId,
          cityId: schools.cityId,
          areaId: schools.areaId,
          website: schools.website,
          websiteUrl: schools.websiteUrl,
          facebookUrl: schools.facebookUrl,
          linkedinUrl: schools.linkedinUrl,
          whatsappNumber: schools.whatsappNumber,
          logoUrl: schools.logoUrl,
          isActive: schools.isActive,
          createdBy: schools.createdBy,
          updatedBy: schools.updatedBy,
          createdAt: schools.createdAt,
          updatedAt: schools.updatedAt,
          parentName: hierarchyNodes.name,
          hoName: headOffices.name,
          hoCode: headOffices.code,
          regName: regions.name,
          regCode: regions.code,
        })
        .from(schools)
        .leftJoin(hierarchyNodes, eq(hierarchyNodes.id, schools.parentId))
        .leftJoin(headOffices, eq(headOffices.id, schools.headOfficeId))
        .leftJoin(regions, eq(regions.id, schools.regionId))
        .where(eq(schools.organizationId, tenantId))
        .orderBy(desc(schools.createdAt));

      // 2. Query branch counts per school
      const branchNodes = await tx
        .select({
          schoolId: branches.schoolId,
          count: sql<number>`count(*)::int`,
        })
        .from(branches)
        .where(eq(branches.organizationId, tenantId))
        .groupBy(branches.schoolId);

      const branchCountMap = new Map<string, number>();
      for (const b of branchNodes) {
        if (b.schoolId) {
          branchCountMap.set(b.schoolId, b.count);
        }
      }

      // Also check hierarchy node parentage for branch nodes
      const hierarchyBranchNodes = await tx
        .select({
          parentId: hierarchyNodes.parentId,
          count: sql<number>`count(*)::int`,
        })
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.organizationId, tenantId))
        .groupBy(hierarchyNodes.parentId);

      for (const h of hierarchyBranchNodes) {
        if (h.parentId && !branchCountMap.has(h.parentId)) {
          branchCountMap.set(h.parentId, h.count);
        }
      }

      // 3. User resolution
      const userIds = new Set<string>();
      for (const s of rawSchools) {
        if (s.createdBy) userIds.add(s.createdBy);
        if (s.updatedBy) userIds.add(s.updatedBy);
      }

      const userMap = new Map<string, UserSummaryDto>();
      if (userIds.size > 0) {
        const users = await tx
          .select({
            id: identityUsers.id,
            email: identityUsers.email,
            firstName: identityUsers.firstName,
            lastName: identityUsers.lastName,
          })
          .from(identityUsers)
          .where(inArray(identityUsers.id, Array.from(userIds)));

        for (const u of users) {
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
          userMap.set(u.id, {
            id: u.id,
            name: fullName,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
          });
        }
      }

      const defaultUserSummary: UserSummaryDto = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'System User',
        email: 'system@campus-os.local',
        firstName: 'System',
        lastName: 'User',
      };

      // 4. Map records
      let list: SchoolListItemDto[] = [];
      for (const s of rawSchools) {
        const bCount = (branchCountMap.get(s.id) ?? 0) + (branchCountMap.get(s.hierarchyNodeId) ?? 0);
        const linkedAccount = await resolveLinkedAccountTx(tx, tenantId, s.hierarchyNodeId);
        list.push({
          id: s.id,
          organizationId: s.organizationId,
          hierarchyNodeId: s.hierarchyNodeId,
          parentId: s.parentId,
          headOfficeId: s.headOfficeId,
          headOfficeName: s.hoName ?? null,
          headOfficeCode: s.hoCode ?? null,
          regionId: s.regionId,
          regionName: s.regName ?? null,
          regionCode: s.regCode ?? null,
          code: s.code,
          name: s.name,
          parentName: s.regName || s.hoName || s.parentName || 'Head Office',
          parentType: s.regionId ? 'Region' : 'Head Office',
          schoolType: s.schoolType,
          registrationNumber: s.registrationNumber,
          educationBoard: s.educationBoard,
          principalName: s.principalName,
          email: s.email,
          phone: s.phone,
          city: s.city,
          province: s.province,
          country: s.country,
          countryId: s.countryId,
          stateId: s.stateId,
          cityId: s.cityId,
          areaId: s.areaId,
          address: s.address,
          area: s.area,
          postalCode: s.postalCode,
          websiteUrl: s.websiteUrl || s.website || null,
          facebookUrl: s.facebookUrl || null,
          linkedinUrl: s.linkedinUrl || null,
          whatsappNumber: s.whatsappNumber || null,
          logoUrl: s.logoUrl || null,
          branchCount: bCount,
          isActive: s.isActive,
          linkedAccount,
          createdBy: s.createdBy,
          updatedBy: s.updatedBy,
          createdByUser: (s.createdBy && userMap.get(s.createdBy)) || defaultUserSummary,
          updatedByUser: (s.updatedBy && userMap.get(s.updatedBy)) || defaultUserSummary,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        });
      }

      // 5. Apply filters
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
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
        list = list.filter((s) => s.isActive === isAct);
      }

      if (filters?.headOfficeId && filters.headOfficeId !== 'ALL') {
        list = list.filter((s) => s.headOfficeId === filters.headOfficeId);
      }

      if (filters?.regionId && filters.regionId !== 'ALL') {
        list = list.filter((s) => s.regionId === filters.regionId);
      }

      if (filters?.parentId && filters.parentId !== 'ALL') {
        list = list.filter((s) => s.parentId === filters.parentId || s.headOfficeId === filters.parentId || s.regionId === filters.parentId);
      }

      return list;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET SINGLE SCHOOL
  // ─────────────────────────────────────────────────────────────────

  private async _getSchoolWithTx(tx: any, tenantId: string, id: string): Promise<SchoolDetailDto> {
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

    // Fetch parent hierarchy node
    const [parentNode] = await tx
      .select({ id: hierarchyNodes.id, name: hierarchyNodes.name, code: hierarchyNodes.code, path: hierarchyNodes.path })
      .from(hierarchyNodes)
      .where(
        and(
          eq(hierarchyNodes.organizationId, tenantId),
          eq(hierarchyNodes.id, school.parentId)
        )
      )
      .limit(1);

    // Fetch Head Office details
    let hoName: string | null = null;
    let hoCode: string | null = null;
    if (school.headOfficeId) {
      const [ho] = await tx
        .select({ name: headOffices.name, code: headOffices.code })
        .from(headOffices)
        .where(eq(headOffices.id, school.headOfficeId))
        .limit(1);
      if (ho) {
        hoName = ho.name;
        hoCode = ho.code;
      }
    }

    // Fetch Region details
    let regName: string | null = null;
    let regCode: string | null = null;
    if (school.regionId) {
      const [reg] = await tx
        .select({ name: regions.name, code: regions.code })
        .from(regions)
        .where(eq(regions.id, school.regionId))
        .limit(1);
      if (reg) {
        regName = reg.name;
        regCode = reg.code;
      }
    }

    // Branch count
    const [branchCountResult] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(branches)
      .where(
        and(
          eq(branches.organizationId, tenantId),
          eq(branches.schoolId, school.id)
        )
      );

    const branchCount = Number(branchCountResult?.count || 0);

    // Users
    const userIds = [school.createdBy, school.updatedBy].filter(Boolean) as string[];
    const userMap = new Map<string, UserSummaryDto>();
    if (userIds.length > 0) {
      const users = await tx
        .select({
          id: identityUsers.id,
          email: identityUsers.email,
          firstName: identityUsers.firstName,
          lastName: identityUsers.lastName,
        })
        .from(identityUsers)
        .where(inArray(identityUsers.id, userIds));

      for (const u of users) {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
        userMap.set(u.id, {
          id: u.id,
          name: fullName,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
        });
      }
    }

    const defaultUserSummary: UserSummaryDto = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'System User',
      email: 'system@campus-os.local',
      firstName: 'System',
      lastName: 'User',
    };

    const linkedAccount = await resolveLinkedAccountTx(tx, tenantId, school.hierarchyNodeId);

    return {
      id: school.id,
      organizationId: school.organizationId,
      hierarchyNodeId: school.hierarchyNodeId,
      parentId: school.parentId,
      headOfficeId: school.headOfficeId,
      headOfficeName: hoName,
      headOfficeCode: hoCode,
      regionId: school.regionId,
      regionName: regName,
      regionCode: regCode,
      code: school.code,
      name: school.name,
      parentName: regName || hoName || parentNode?.name || 'Head Office',
      parentType: school.regionId ? 'Region' : 'Head Office',
      schoolType: school.schoolType,
      registrationNumber: school.registrationNumber,
      educationBoard: school.educationBoard,
      principalName: school.principalName,
      email: school.email,
      phone: school.phone,
      alternatePhone: school.alternatePhone,
      address: school.address,
      area: school.area,
      city: school.city,
      province: school.province,
      country: school.country,
      postalCode: school.postalCode,
      countryId: school.countryId,
      stateId: school.stateId,
      cityId: school.cityId,
      areaId: school.areaId,
      website: school.websiteUrl || school.website || null,
      websiteUrl: school.websiteUrl || school.website || null,
      facebookUrl: school.facebookUrl || null,
      linkedinUrl: school.linkedinUrl || null,
      whatsappNumber: school.whatsappNumber || null,
      logoUrl: school.logoUrl || null,
      customDomain: school.customDomain,
      defaultLanguage: school.defaultLanguage,
      timezone: school.timezone,
      notes: school.notes,
      branchCount,
      isActive: school.isActive,
      linkedAccount,
      createdBy: school.createdBy,
      updatedBy: school.updatedBy,
      createdByUser: (school.createdBy && userMap.get(school.createdBy)) || defaultUserSummary,
      updatedByUser: (school.updatedBy && userMap.get(school.updatedBy)) || defaultUserSummary,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };
  }

  async getSchool(tenantId: string, id: string, permissionsHeader?: string): Promise<SchoolDetailDto> {
    this.assertPermission(permissionsHeader, SchoolPermissions.VIEW);
    return this.txManager.runInTenantContext(tenantId, async (tx) => this._getSchoolWithTx(tx, tenantId, id));
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE SCHOOL
  // ─────────────────────────────────────────────────────────────────

  async updateSchool(
    tenantId: string,
    id: string,
    dto: UpdateSchoolDto,
    userId?: string,
    permissionsHeader?: string
  ): Promise<SchoolListItemDto> {
    this.assertPermission(permissionsHeader, SchoolPermissions.EDIT);

    // Validate optional URLs & phone
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    const web = dto.websiteUrl !== undefined ? dto.websiteUrl : dto.website;
    if (web && web.trim() && !urlRegex.test(web.trim())) {
      throw new BadRequestException('Invalid Website URL format');
    }
    if (dto.facebookUrl && dto.facebookUrl.trim() && !urlRegex.test(dto.facebookUrl.trim())) {
      throw new BadRequestException('Invalid Facebook URL format');
    }
    if (dto.linkedinUrl && dto.linkedinUrl.trim() && !urlRegex.test(dto.linkedinUrl.trim())) {
      throw new BadRequestException('Invalid LinkedIn URL format');
    }
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
    if (dto.whatsappNumber && dto.whatsappNumber.trim() && !phoneRegex.test(dto.whatsappNumber.trim())) {
      throw new BadRequestException('Invalid WhatsApp number format');
    }

    return this.txManager.runInTenantContext(tenantId, async (tx) => {
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

      let effectiveParentNodeId = existing.parentId;
      let effectiveHeadOfficeId = existing.headOfficeId;
      let effectiveRegionId = existing.regionId;
      let isReassigned = false;

      // Handle Head Office or Region reassignment
      if (dto.headOfficeId && dto.headOfficeId !== existing.headOfficeId) {
        isReassigned = true;
        effectiveHeadOfficeId = dto.headOfficeId;
      }

      if (dto.regionId !== undefined && dto.regionId !== existing.regionId) {
        isReassigned = true;
        effectiveRegionId = dto.regionId;
      }

      if (isReassigned) {
        // Validate new Head Office
        const [targetHO] = await tx
          .select()
          .from(headOffices)
          .where(
            and(
              eq(headOffices.organizationId, tenantId),
              eq(headOffices.id, effectiveHeadOfficeId!)
            )
          )
          .limit(1);

        if (!targetHO) {
          throw new NotFoundException('Target Head Office not found');
        }

        const [hoNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, targetHO.hierarchyNodeId)
            )
          )
          .limit(1);

        let targetParentHierarchyNode = hoNode!;

        // Validate new Region if assigned
        if (effectiveRegionId) {
          const [targetReg] = await tx
            .select()
            .from(regions)
            .where(
              and(
                eq(regions.organizationId, tenantId),
                eq(regions.id, effectiveRegionId)
              )
            )
            .limit(1);

          if (!targetReg) {
            throw new NotFoundException('Target Region not found');
          }

          const [regNode] = await tx
            .select()
            .from(hierarchyNodes)
            .where(
              and(
                eq(hierarchyNodes.organizationId, tenantId),
                eq(hierarchyNodes.id, targetReg.hierarchyNodeId)
              )
            )
            .limit(1);

          if (regNode!.parentId !== hoNode!.id && !regNode!.path.startsWith(hoNode!.path)) {
            throw new BadRequestException(
              `Region '${targetReg.name}' does not belong to Head Office '${targetHO.name}'`
            );
          }

          targetParentHierarchyNode = regNode!;
        }

        effectiveParentNodeId = targetParentHierarchyNode.id;

        // Recompute hierarchy path
        const sanitizedCodeSegment = existing.code.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const newPath = `${targetParentHierarchyNode.path}.${sanitizedCodeSegment}`;

        // Update hierarchy node path and parentId
        await tx
          .update(hierarchyNodes)
          .set({
            parentId: targetParentHierarchyNode.id,
            path: newPath,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, existing.hierarchyNodeId)
            )
          );
      }

      const modifierId = userId || '00000000-0000-0000-0000-000000000000';

      let geo = {
        countryId: existing.countryId,
        stateId: existing.stateId,
        cityId: existing.cityId,
        areaId: existing.areaId,
        country: existing.country,
        province: existing.province,
        city: existing.city,
        area: existing.area,
        postalCode: existing.postalCode,
      };

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
        geo = await validateAndResolveGeographyHierarchy(tx, {
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
      }

      // Validate School Type
      let schoolTypeVal = existing.schoolType;
      if (dto.schoolType !== undefined) {
        const cleanType = dto.schoolType?.trim();
        if (cleanType && !VALID_SCHOOL_TYPE_CODES.has(cleanType)) {
          throw new BadRequestException(
            `Invalid school type '${cleanType}'. Must be one of: SCHOOL, COLLEGE, UNIVERSITY, ACADEMY_INSTITUTE`
          );
        }
        schoolTypeVal = cleanType || SchoolType.SCHOOL;
      }

      // Validate & normalize contact fields if provided
      const contactVal = validateAndNormalizeContactFields({
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        website: dto.websiteUrl !== undefined ? dto.websiteUrl : dto.website,
        whatsappNumber: dto.whatsappNumber,
      });
      if (!contactVal.valid) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed for structured contact fields',
          errors: contactVal.errors,
        });
      }

      const websiteVal = (dto.websiteUrl !== undefined || dto.website !== undefined)
        ? contactVal.normalized.website
        : (existing.websiteUrl || existing.website);

      // Update schools table (preserve created_by & created_at)
      const [updated] = await tx
        .update(schools)
        .set({
          name: dto.name !== undefined ? dto.name.trim() : existing.name,
          shortName: dto.name !== undefined ? dto.name.trim() : existing.shortName,
          headOfficeId: effectiveHeadOfficeId,
          regionId: effectiveRegionId,
          parentId: effectiveParentNodeId,
          schoolType: schoolTypeVal,
          registrationNumber: dto.registrationNumber !== undefined ? dto.registrationNumber : existing.registrationNumber,
          educationBoard: dto.educationBoard !== undefined ? dto.educationBoard : existing.educationBoard,
          principalName: dto.principalName !== undefined ? dto.principalName : existing.principalName,
          email: dto.email !== undefined ? contactVal.normalized.email : existing.email,
          phone: dto.phone !== undefined ? contactVal.normalized.phone : existing.phone,
          alternatePhone: dto.alternatePhone !== undefined ? contactVal.normalized.alternatePhone : existing.alternatePhone,
          address: dto.address !== undefined ? dto.address : existing.address,
          area: geo.area,
          city: geo.city,
          province: geo.province,
          country: geo.country || 'Pakistan',
          postalCode: geo.postalCode,
          countryId: geo.countryId,
          stateId: geo.stateId,
          cityId: geo.cityId,
          areaId: geo.areaId,
          website: websiteVal,
          websiteUrl: websiteVal,
          facebookUrl: dto.facebookUrl !== undefined ? (dto.facebookUrl?.trim() || null) : existing.facebookUrl,
          linkedinUrl: dto.linkedinUrl !== undefined ? (dto.linkedinUrl?.trim() || null) : existing.linkedinUrl,
          whatsappNumber: dto.whatsappNumber !== undefined ? contactVal.normalized.whatsappNumber : existing.whatsappNumber,
          logoUrl: dto.logoUrl !== undefined ? (dto.logoUrl?.trim() || null) : existing.logoUrl,
          customDomain: dto.customDomain !== undefined ? dto.customDomain : existing.customDomain,
          defaultLanguage: (dto.defaultLanguage ?? existing.defaultLanguage) || 'en',
          timezone: (dto.timezone ?? existing.timezone) || 'Asia/Karachi',
          notes: dto.notes !== undefined ? dto.notes : existing.notes,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedBy: modifierId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.id, id)
          )
        )
        .returning();

      // Synchronize hierarchy node metadata
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
            website: (updated!.websiteUrl || updated!.website) ?? '',
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

      const auditAction = isReassigned ? 'SCHOOL_REASSIGNED' : 'UPDATE';

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

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: existing.hierarchyNodeId,
          actorId: modifierId,
          actorEmail: modifierEmail,
          module: 'ORGANIZATION',
          action: auditAction,
          entityType: 'school',
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
          'SCHOOL',
          this.auditService
        );
      }

      return this._getSchoolWithTx(tx, tenantId, id);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  TOGGLE STATUS
  // ─────────────────────────────────────────────────────────────────

  async toggleSchoolStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId?: string,
    permissionsHeader?: string
  ): Promise<SchoolListItemDto> {
    this.assertPermission(permissionsHeader, SchoolPermissions.STATUS_CHANGE);

    return this.txManager.runInTenantContext(tenantId, async (tx) => {
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

      const modifierId = userId || '00000000-0000-0000-0000-000000000000';

      const [updated] = await tx
        .update(schools)
        .set({
          isActive,
          updatedBy: modifierId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.id, id)
          )
        )
        .returning();

      await tx
        .update(hierarchyNodes)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, existing.hierarchyNodeId)
          )
        );

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

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId: existing.hierarchyNodeId,
          actorId: modifierId,
          actorEmail: modifierEmail,
          module: 'ORGANIZATION',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'school',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      return this._getSchoolWithTx(tx, tenantId, id);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  DEPENDENCY INSPECTION & SAFE DELETE
  // ─────────────────────────────────────────────────────────────────

  private async _getDependenciesWithTx(
    tx: any,
    tenantId: string,
    id: string
  ): Promise<SchoolDependenciesDto> {
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

    // 1. Branches count
    const [branchCountRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(branches)
      .where(
        and(
          eq(branches.organizationId, tenantId),
          eq(branches.schoolId, id)
        )
      );
    const branchesCount = Number(branchCountRes?.count || 0);

    // 2. Pre-admissions count
    const [admissionCountRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(preAdmissions)
      .where(
        and(
          eq(preAdmissions.organizationId, tenantId),
          eq(preAdmissions.schoolId, id)
        )
      );
    const admissionsCount = Number(admissionCountRes?.count || 0);

    // 3. Academic configuration items
    const [acadYears] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(academicYears)
      .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.ownerId, id)));
    const [acadBoards] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(boards)
      .where(and(eq(boards.organizationId, tenantId), eq(boards.ownerId, id)));
    const [acadClasses] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(classes)
      .where(and(eq(classes.organizationId, tenantId), eq(classes.ownerId, id)));
    const [acadSections] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(sections)
      .where(and(eq(sections.organizationId, tenantId), eq(sections.ownerId, id)));
    const [acadSubjects] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(subjects)
      .where(and(eq(subjects.organizationId, tenantId), eq(subjects.ownerId, id)));
    const [acadLangs] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(languages)
      .where(and(eq(languages.organizationId, tenantId), eq(languages.ownerId, id)));

    const academicSetupCount =
      Number(acadYears?.count || 0) +
      Number(acadBoards?.count || 0) +
      Number(acadClasses?.count || 0) +
      Number(acadSections?.count || 0) +
      Number(acadSubjects?.count || 0) +
      Number(acadLangs?.count || 0);

    // 4. User assignments
    const [userAssignRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(membershipNodeAssignments)
      .where(
        and(
          eq(membershipNodeAssignments.organizationId, tenantId),
          eq(membershipNodeAssignments.hierarchyNodeId, school.hierarchyNodeId)
        )
      );
    const userAssignmentsCount = Number(userAssignRes?.count || 0);

    // 5. Hierarchy child nodes
    const [childNodeRes] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(hierarchyNodes)
      .where(
        and(
          eq(hierarchyNodes.organizationId, tenantId),
          eq(hierarchyNodes.parentId, school.hierarchyNodeId)
        )
      );
    const hierarchyChildrenCount = Number(childNodeRes?.count || 0);

    const totalDependencies =
      branchesCount + admissionsCount + academicSetupCount + userAssignmentsCount + hierarchyChildrenCount;

    const rList: string[] = [];
    if (branchesCount > 0) rList.push(`${branchesCount} active Branch/Campus ${branchesCount === 1 ? 'record' : 'records'}`);
    if (admissionsCount > 0) rList.push(`${admissionsCount} Student Pre-Admission ${admissionsCount === 1 ? 'application' : 'applications'}`);
    if (academicSetupCount > 0) rList.push(`${academicSetupCount} Academic Configuration ${academicSetupCount === 1 ? 'rule' : 'rules'}`);
    if (userAssignmentsCount > 0) rList.push(`${userAssignmentsCount} User/Employee ${userAssignmentsCount === 1 ? 'assignment' : 'assignments'}`);
    if (hierarchyChildrenCount > 0) rList.push(`${hierarchyChildrenCount} Child Hierarchy ${hierarchyChildrenCount === 1 ? 'node' : 'nodes'}`);

    return {
      canDelete: totalDependencies === 0,
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.code,
      totalDependencies,
      breakdown: {
        branches: branchesCount,
        admissions: admissionsCount,
        academicSetup: academicSetupCount,
        userAssignments: userAssignmentsCount,
        hierarchyChildren: hierarchyChildrenCount,
      },
      reasons: rList,
    };
  }

  async getDependencies(
    tenantId: string,
    id: string,
    permissionsHeader?: string
  ): Promise<SchoolDependenciesDto> {
    this.assertPermission(permissionsHeader, SchoolPermissions.VIEW);
    return this.txManager.runInTenantContext(tenantId, async (tx) => this._getDependenciesWithTx(tx, tenantId, id));
  }

  async deleteSchool(
    tenantId: string,
    id: string,
    userId?: string,
    permissionsHeader?: string
  ): Promise<{ success: boolean; message: string }> {
    this.assertPermission(permissionsHeader, SchoolPermissions.DELETE);

    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const deps = await this._getDependenciesWithTx(tx, tenantId, id);

      if (!deps.canDelete) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: `Cannot delete School '${deps.schoolName}' [${deps.schoolCode}]. It has ${deps.totalDependencies} active dependencies: ${deps.reasons.join(', ')}. Reassign or deactivate the school instead.`,
          breakdown: deps.breakdown,
        });
      }

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

      // Delete school record
      await tx
        .delete(schools)
        .where(
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.id, id)
          )
        );

      // Delete hierarchy node
      await tx
        .delete(hierarchyNodes)
        .where(
          and(
            eq(hierarchyNodes.organizationId, tenantId),
            eq(hierarchyNodes.id, school.hierarchyNodeId)
          )
        );

      const actorId = userId || '00000000-0000-0000-0000-000000000000';

      // Resolve actor user details for audit log
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
          hierarchyNodeId: school.hierarchyNodeId,
          actorId,
          actorEmail,
          module: 'ORGANIZATION',
          action: 'DELETE',
          entityType: 'school',
          entityId: id,
          beforeState: school,
          afterState: null,
        },
        tx
      );

      return {
        success: true,
        message: `School '${school.name}' [${school.code}] deleted successfully.`,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  ELIGIBLE PARENTS
  // ─────────────────────────────────────────────────────────────────

  async getEligibleParents(tenantId: string): Promise<EligibleParentNodeDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
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

      const eligible = nodes.filter(
        (n) =>
          !n.typeCode ||
          (n.typeCode.toUpperCase() !== 'SCHOOL' && n.typeCode.toUpperCase() !== 'BRANCH' && n.typeCode.toUpperCase() !== 'CAMPUS')
      );

      return eligible.map((n) => ({
        id: n.id,
        name: n.name,
        code: n.code,
        type: n.typeName ?? n.typeCode ?? 'Parent Node',
        path: String(n.path),
      }));
    });
  }

  assertScope(
    userScope?: { authorizedSchools?: string[]; authorizedRegions?: string[]; authorizedHeadOffices?: string[] },
    targetSchoolIdOrCode?: string
  ) {
    if (!userScope) return;
    if (userScope.authorizedSchools?.length && targetSchoolIdOrCode) {
      const match = userScope.authorizedSchools.some(
        (id) => id === targetSchoolIdOrCode || id.toLowerCase() === targetSchoolIdOrCode.toLowerCase()
      );
      if (!match) {
        throw new ForbiddenException('Access denied: Target School is outside your authorized hierarchy scope.');
      }
    }
  }
}
