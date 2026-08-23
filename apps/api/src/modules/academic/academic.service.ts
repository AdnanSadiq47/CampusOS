import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  TenantTransactionManager,
  academicYears,
  boards,
  academicLevels,
  subjects,
  classes,
  classSubjectMappings,
  sections,
  languages,
  configScopeBranches,
  branches,
  eq,
  and,
  or,
  inArray,
  asc,
  ilike,
  sql,
} from '@campus-os/database';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  AcademicYearListItemDto,
  CreateBoardDto,
  UpdateBoardDto,
  BoardListItemDto,
  CreateAcademicLevelDto,
  UpdateAcademicLevelDto,
  AcademicLevelListItemDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectListItemDto,
  CreateClassDto,
  UpdateClassDto,
  ClassListItemDto,
  CreateSectionDto,
  UpdateSectionDto,
  SectionListItemDto,
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageListItemDto,
  ConfigScopeType,
  ConfigOwnerType,
  ConfigSourceOrigin,
} from '@campus-os/types';
import { AuditService } from '../../core/audit/audit.service.js';

@Injectable()
export class AcademicService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

  // ═════════════════════════════════════════════════════════════════
  // CENTRAL GOVERNANCE & SCOPE ENGINE HELPERS
  // ═════════════════════════════════════════════════════════════════

  private async syncScopeBranches(
    tx: any,
    tenantId: string,
    entityType: string,
    entityId: string,
    applyTo: ConfigScopeType,
    branchIds: string[] = [],
    authorizedBranchIds?: string[]
  ) {
    await tx
      .delete(configScopeBranches)
      .where(
        and(
          eq(configScopeBranches.organizationId, tenantId),
          eq(configScopeBranches.entityType, entityType),
          eq(configScopeBranches.entityId, entityId)
        )
      );

    if (applyTo === 'SELECTED_CAMPUSES' && branchIds.length > 0) {
      const validBranches = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(
            eq(branches.organizationId, tenantId),
            inArray(branches.id, branchIds)
          )
        );

      const validBranchIds = validBranches.map((b: any) => b.id);
      if (validBranchIds.length !== branchIds.length) {
        throw new BadRequestException('One or more selected branches are invalid for this organization.');
      }

      if (authorizedBranchIds && !authorizedBranchIds.includes('*')) {
        for (const bid of branchIds) {
          if (!authorizedBranchIds.includes(bid)) {
            throw new ForbiddenException(`You are not authorized to assign branch ID '${bid}'.`);
          }
        }
      }

      for (const branchId of branchIds) {
        await tx.insert(configScopeBranches).values({
          organizationId: tenantId,
          entityType,
          entityId,
          branchId,
        });
      }
    }
  }

  private async loadScopeBranchInfo(
    tx: any,
    tenantId: string,
    entityType: string,
    entityIds: string[]
  ): Promise<Map<string, { branchIds: string[]; branchNames: string[] }>> {
    const map = new Map<string, { branchIds: string[]; branchNames: string[] }>();
    if (entityIds.length === 0) return map;

    const rows = await tx
      .select({
        entityId: configScopeBranches.entityId,
        branchId: configScopeBranches.branchId,
        branchName: branches.name,
      })
      .from(configScopeBranches)
      .innerJoin(branches, eq(configScopeBranches.branchId, branches.id))
      .where(
        and(
          eq(configScopeBranches.organizationId, tenantId),
          eq(configScopeBranches.entityType, entityType),
          inArray(configScopeBranches.entityId, entityIds)
        )
      );

    for (const row of rows) {
      if (!map.has(row.entityId)) {
        map.set(row.entityId, { branchIds: [], branchNames: [] });
      }
      const entry = map.get(row.entityId)!;
      entry.branchIds.push(row.branchId);
      entry.branchNames.push(row.branchName);
    }

    return map;
  }

  /**
   * Enterprise Duplicate Prevention and Parent Conflict Detection Engine.
   * Prevents duplicate effective configs and guides users when matching parent records exist.
   */
  private async validateDuplicateAndParentConflict(
    tx: any,
    tenantId: string,
    table: any,
    name: string,
    code: string | null | undefined,
    targetOwnerType: ConfigOwnerType = 'SCHOOL',
    targetOwnerId?: string | null,
    entityLabel: string = 'Configuration record',
    _entityType: string = '',
    excludeId?: string
  ) {
    const normalizedName = name.trim().toLowerCase();
    const normalizedCode = code ? code.trim().toUpperCase() : null;

    const existingRecords = await tx
      .select()
      .from(table)
      .where(
        and(
          eq(table.organizationId, tenantId),
          excludeId ? sql`${table.id} != ${excludeId}` : undefined
        )
      );

    const matching = existingRecords.find((r: any) => {
      const sameName = r.name && r.name.trim().toLowerCase() === normalizedName;
      const sameCode = normalizedCode && r.code && r.code.trim().toUpperCase() === normalizedCode;
      return sameName || sameCode;
    });

    if (!matching) return;

    if (targetOwnerType === 'CAMPUS' && targetOwnerId) {
      if (matching.ownerType !== 'CAMPUS') {
        if (matching.applyTo === 'ALL_CAMPUSES') {
          throw new ConflictException(
            `${entityLabel} '${name}' already exists and is available to this Campus through School configuration.`
          );
        } else if (matching.applyTo === 'SELECTED_CAMPUSES') {
          const [assigned] = await tx
            .select()
            .from(configScopeBranches)
            .where(
              and(
                eq(configScopeBranches.organizationId, tenantId),
                eq(configScopeBranches.entityId, matching.id),
                eq(configScopeBranches.branchId, targetOwnerId)
              )
            );
          if (assigned) {
            throw new ConflictException(
              `${entityLabel} '${name}' already exists and is available to this Campus through School configuration.`
            );
          } else {
            throw new ConflictException(
              `${entityLabel} '${name}' already exists at School level but is not currently assigned to this Campus.`
            );
          }
        }
      } else if (matching.ownerId === targetOwnerId) {
        throw new ConflictException(
          `${entityLabel} '${name}' already exists locally in this Campus.`
        );
      }
    } else {
      if (matching.ownerType !== 'CAMPUS') {
        throw new ConflictException(
          `${entityLabel} '${name}' already exists in this organization.`
        );
      }
    }
  }

  private tagEffectiveGovernance<T extends { ownerType?: string; ownerId?: string | null; applyTo?: string }>(
    record: T,
    userRole: string = 'SCHOOL_ADMIN',
    targetCampusId?: string,
    allowLowerLevelEdit: boolean = false
  ) {
    const isLocal = record.ownerType === 'CAMPUS';
    const isCampusQuery = !!(targetCampusId && targetCampusId !== 'ALL');
    const sourceOrigin: ConfigSourceOrigin = isCampusQuery
      ? (isLocal && record.ownerId === targetCampusId ? 'LOCAL' : 'INHERITED')
      : (isLocal ? 'LOCAL' : 'INHERITED');
    const isInherited = sourceOrigin === 'INHERITED';

    const isOrgAdmin =
      userRole === 'SUPER_ADMIN' ||
      userRole === 'HEAD_OFFICE_ADMIN' ||
      userRole === 'REGION_ADMIN' ||
      userRole === 'SCHOOL_ADMIN' ||
      userRole === 'ADMIN';

    // Campus admin can only edit their own local records.
    // Org/School admin can edit school/org records; they cannot edit campus-owned records unless explicit allowLowerLevelEdit is granted.
    const canEdit = isLocal
      ? (userRole === 'CAMPUS_ADMIN' ? (targetCampusId ? record.ownerId === targetCampusId : true) : allowLowerLevelEdit)
      : isOrgAdmin;

    const canToggleStatus = canEdit;
    const canAssign = isOrgAdmin && !isLocal;

    return {
      ownerType: (record.ownerType as ConfigOwnerType) || 'SCHOOL',
      sourceOrigin,
      isInherited,
      canEdit,
      canToggleStatus,
      canAssign,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. ACADEMIC YEARS MASTER
  // ═════════════════════════════════════════════════════════════════

  async listAcademicYears(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<AcademicYearListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(academicYears)
        .where(
          and(
            eq(academicYears.organizationId, tenantId),
            status && status !== 'ALL' ? eq(academicYears.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(academicYears.name, `%${search}%`),
                  ilike(academicYears.code, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(academicYears.sortOrder), asc(academicYears.startDate));

      const entityIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_year', entityIds);

      let result: AcademicYearListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const gov = this.tagEffectiveGovernance(r, userRole, campusId);
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          code: r.code,
          startDate: r.startDate,
          endDate: r.endDate,
          isCurrent: r.isCurrent,
          sortOrder: r.sortOrder,
          description: r.description,
          ownerType: (r.ownerType as ConfigOwnerType) || 'SCHOOL',
          ownerId: r.ownerId,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          sourceOrigin: gov.sourceOrigin,
          isInherited: gov.isInherited,
          canEdit: gov.canEdit,
          canToggleStatus: gov.canToggleStatus,
          canAssign: gov.canAssign,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((ay) => {
          if (ay.ownerType === 'CAMPUS' && ay.ownerId === campusId) return true;
          if (ay.applyTo === 'ALL_CAMPUSES') return true;
          return ay.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        result = result.filter((ay) => ay.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async createAcademicYear(
    tenantId: string,
    dto: CreateAcademicYearDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<AcademicYearListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('Start Date must be earlier than End Date.');
      }

      const cleanCode = dto.code.trim().toUpperCase();
      const cleanName = dto.name.trim();
      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;

      await this.validateDuplicateAndParentConflict(
        tx,
        tenantId,
        academicYears,
        cleanName,
        cleanCode,
        ownerType,
        ownerId,
        'Academic Year',
        'academic_year'
      );

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${academicYears.sortOrder}), 0)` })
          .from(academicYears)
          .where(eq(academicYears.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      if (dto.isCurrent) {
        await tx
          .update(academicYears)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.isCurrent, true)));
      }

      const [created] = await tx
        .insert(academicYears)
        .values({
          organizationId: tenantId,
          name: cleanName,
          code: cleanCode,
          startDate: dto.startDate,
          endDate: dto.endDate,
          isCurrent: dto.isCurrent ?? false,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.syncScopeBranches(
        tx,
        tenantId,
        'academic_year',
        created!.id,
        dto.applyTo || 'ALL_CAMPUSES',
        dto.branchIds || [],
        authorizedBranchIds
      );

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'CREATE',
          entityType: 'academic_year',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_year', [created!.id]);
      const scope = branchMap.get(created!.id);
      const gov = this.tagEffectiveGovernance(created!, userRole);

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async updateAcademicYear(
    tenantId: string,
    id: string,
    dto: UpdateAcademicYearDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<AcademicYearListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.id, id)));

      if (!existing) throw new NotFoundException(`Academic Year with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canEdit) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to edit this inherited configuration.');
        }
      }

      const startDate = dto.startDate || existing.startDate;
      const endDate = dto.endDate || existing.endDate;
      if (new Date(startDate) >= new Date(endDate)) {
        throw new BadRequestException('Start Date must be earlier than End Date.');
      }

      if (dto.name || dto.code) {
        await this.validateDuplicateAndParentConflict(
          tx,
          tenantId,
          academicYears,
          dto.name || existing.name,
          dto.code || existing.code,
          existing.ownerType as ConfigOwnerType,
          existing.ownerId,
          'Academic Year',
          'academic_year',
          id
        );
      }

      if (dto.isCurrent) {
        await tx
          .update(academicYears)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.isCurrent, true)));
      }

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(academicYears)
        .set({
          name: dto.name ? dto.name.trim() : existing.name,
          code: dto.code ? dto.code.trim().toUpperCase() : existing.code,
          startDate,
          endDate,
          isCurrent: dto.isCurrent !== undefined ? dto.isCurrent : existing.isCurrent,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.id, id)))
        .returning();

      if (dto.applyTo !== undefined || dto.branchIds !== undefined) {
        await this.syncScopeBranches(
          tx,
          tenantId,
          'academic_year',
          id,
          applyTo,
          dto.branchIds || [],
          authorizedBranchIds
        );
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'UPDATE',
          entityType: 'academic_year',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_year', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async toggleAcademicYearStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<AcademicYearListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.id, id)));

      if (!existing) throw new NotFoundException(`Academic Year with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canToggleStatus) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to toggle status for this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to toggle status for this inherited configuration.');
        }
      }

      const [updated] = await tx
        .update(academicYears)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'academic_year',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_year', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. BOARDS MASTER
  // ═════════════════════════════════════════════════════════════════

  async listBoards(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<BoardListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(boards)
        .where(
          and(
            eq(boards.organizationId, tenantId),
            status && status !== 'ALL' ? eq(boards.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(boards.name, `%${search}%`),
                  ilike(boards.shortName, `%${search}%`),
                  ilike(boards.code, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(boards.sortOrder), asc(boards.name));

      const entityIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'board', entityIds);

      let result: BoardListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const gov = this.tagEffectiveGovernance(r, userRole, campusId);
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          shortName: r.shortName,
          code: r.code,
          sortOrder: r.sortOrder,
          description: r.description,
          ownerId: r.ownerId,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          ...gov,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((b) => {
          if (b.ownerType === 'CAMPUS' && b.ownerId === campusId) return true;
          if (b.applyTo === 'ALL_CAMPUSES') return true;
          return b.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        result = result.filter((b) => b.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async createBoard(
    tenantId: string,
    dto: CreateBoardDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<BoardListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();
      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;

      await this.validateDuplicateAndParentConflict(
        tx,
        tenantId,
        boards,
        cleanName,
        dto.code,
        ownerType,
        ownerId,
        'Board',
        'board'
      );

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${boards.sortOrder}), 0)` })
          .from(boards)
          .where(eq(boards.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(boards)
        .values({
          organizationId: tenantId,
          name: cleanName,
          shortName: dto.shortName.trim(),
          code: dto.code?.trim().toUpperCase() || null,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.syncScopeBranches(
        tx,
        tenantId,
        'board',
        created!.id,
        dto.applyTo || 'ALL_CAMPUSES',
        dto.branchIds || [],
        authorizedBranchIds
      );

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'CREATE',
          entityType: 'board',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'board', [created!.id]);
      const scope = branchMap.get(created!.id);
      const gov = this.tagEffectiveGovernance(created!, userRole);

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async updateBoard(
    tenantId: string,
    id: string,
    dto: UpdateBoardDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<BoardListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(boards)
        .where(and(eq(boards.organizationId, tenantId), eq(boards.id, id)));

      if (!existing) throw new NotFoundException(`Board with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canEdit) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to edit this inherited configuration.');
        }
      }

      if (dto.name || dto.code) {
        await this.validateDuplicateAndParentConflict(
          tx,
          tenantId,
          boards,
          dto.name || existing.name,
          dto.code || existing.code,
          existing.ownerType as ConfigOwnerType,
          existing.ownerId,
          'Board',
          'board',
          id
        );
      }

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(boards)
        .set({
          name: dto.name ? dto.name.trim() : existing.name,
          shortName: dto.shortName ? dto.shortName.trim() : existing.shortName,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(boards.organizationId, tenantId), eq(boards.id, id)))
        .returning();

      if (dto.applyTo !== undefined || dto.branchIds !== undefined) {
        await this.syncScopeBranches(
          tx,
          tenantId,
          'board',
          id,
          applyTo,
          dto.branchIds || [],
          authorizedBranchIds
        );
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'UPDATE',
          entityType: 'board',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'board', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async toggleBoardStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<BoardListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(boards)
        .where(and(eq(boards.organizationId, tenantId), eq(boards.id, id)));

      if (!existing) throw new NotFoundException(`Board with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canToggleStatus) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to toggle status for this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to toggle status for this inherited configuration.');
        }
      }

      const [updated] = await tx
        .update(boards)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(boards.organizationId, tenantId), eq(boards.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'board',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'board', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. ACADEMIC LEVELS / STAGES MASTER
  // ═════════════════════════════════════════════════════════════════

  async listAcademicLevels(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<AcademicLevelListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(academicLevels)
        .where(
          and(
            eq(academicLevels.organizationId, tenantId),
            status && status !== 'ALL' ? eq(academicLevels.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(academicLevels.name, `%${search}%`),
                  ilike(academicLevels.shortName, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(academicLevels.sortOrder), asc(academicLevels.name));

      const entityIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_level', entityIds);

      const classCounts = await tx
        .select({
          levelId: classes.levelId,
          count: sql<number>`COUNT(${classes.id})`,
        })
        .from(classes)
        .where(eq(classes.organizationId, tenantId))
        .groupBy(classes.levelId);

      const countMap = new Map<string, number>();
      for (const c of classCounts) countMap.set(c.levelId, Number(c.count) || 0);

      let result: AcademicLevelListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const gov = this.tagEffectiveGovernance(r, userRole, campusId);
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          shortName: r.shortName,
          sortOrder: r.sortOrder,
          description: r.description,
          ownerId: r.ownerId,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          classCount: countMap.get(r.id) || 0,
          ...gov,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((l) => {
          if (l.ownerType === 'CAMPUS' && l.ownerId === campusId) return true;
          if (l.applyTo === 'ALL_CAMPUSES') return true;
          return l.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        result = result.filter((l) => l.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async createAcademicLevel(
    tenantId: string,
    dto: CreateAcademicLevelDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<AcademicLevelListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();
      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;

      await this.validateDuplicateAndParentConflict(
        tx,
        tenantId,
        academicLevels,
        cleanName,
        dto.shortName,
        ownerType,
        ownerId,
        'Academic Level',
        'academic_level'
      );

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${academicLevels.sortOrder}), 0)` })
          .from(academicLevels)
          .where(eq(academicLevels.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(academicLevels)
        .values({
          organizationId: tenantId,
          name: cleanName,
          shortName: dto.shortName?.trim() || null,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.syncScopeBranches(
        tx,
        tenantId,
        'academic_level',
        created!.id,
        dto.applyTo || 'ALL_CAMPUSES',
        dto.branchIds || [],
        authorizedBranchIds
      );

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'CREATE',
          entityType: 'academic_level',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_level', [created!.id]);
      const scope = branchMap.get(created!.id);
      const gov = this.tagEffectiveGovernance(created!, userRole);

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        classCount: 0,
        ...gov,
      };
    });
  }

  async updateAcademicLevel(
    tenantId: string,
    id: string,
    dto: UpdateAcademicLevelDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<AcademicLevelListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicLevels)
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, id)));

      if (!existing) throw new NotFoundException(`Academic Level with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canEdit) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to edit this inherited configuration.');
        }
      }

      if (dto.name) {
        await this.validateDuplicateAndParentConflict(
          tx,
          tenantId,
          academicLevels,
          dto.name,
          dto.shortName,
          existing.ownerType as ConfigOwnerType,
          existing.ownerId,
          'Academic Level',
          'academic_level',
          id
        );
      }

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(academicLevels)
        .set({
          name: dto.name ? dto.name.trim() : existing.name,
          shortName: dto.shortName !== undefined ? (dto.shortName ? dto.shortName.trim() : null) : existing.shortName,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, id)))
        .returning();

      if (dto.applyTo !== undefined || dto.branchIds !== undefined) {
        await this.syncScopeBranches(
          tx,
          tenantId,
          'academic_level',
          id,
          applyTo,
          dto.branchIds || [],
          authorizedBranchIds
        );
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'UPDATE',
          entityType: 'academic_level',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_level', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async toggleAcademicLevelStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<AcademicLevelListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicLevels)
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, id)));

      if (!existing) throw new NotFoundException(`Academic Level with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canToggleStatus) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to toggle status for this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to toggle status for this inherited configuration.');
        }
      }

      const [updated] = await tx
        .update(academicLevels)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'academic_level',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_level', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. SUBJECTS MASTER
  // ═════════════════════════════════════════════════════════════════

  async listSubjects(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string,
    type?: string,
    category?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<SubjectListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.organizationId, tenantId),
            status && status !== 'ALL' ? eq(subjects.isActive, status === 'ACTIVE') : undefined,
            type && type !== 'ALL' ? eq(subjects.type, type) : undefined,
            category && category !== 'ALL' ? eq(subjects.category, category) : undefined,
            search
              ? or(
                  ilike(subjects.name, `%${search}%`),
                  ilike(subjects.shortName, `%${search}%`),
                  ilike(subjects.code, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(subjects.sortOrder), asc(subjects.name));

      const entityIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'subject', entityIds);

      let result: SubjectListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const gov = this.tagEffectiveGovernance(r, userRole, campusId);
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          shortName: r.shortName,
          code: r.code,
          type: r.type as any,
          category: r.category as any,
          defaultMaxMarks: r.defaultMaxMarks ? Number(r.defaultMaxMarks) : null,
          defaultPassingMarks: r.defaultPassingMarks ? Number(r.defaultPassingMarks) : null,
          hasPractical: r.hasPractical,
          practicalMaxMarks: r.practicalMaxMarks ? Number(r.practicalMaxMarks) : null,
          creditWeight: r.creditWeight ? Number(r.creditWeight) : null,
          sortOrder: r.sortOrder,
          description: r.description,
          ownerId: r.ownerId,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          ...gov,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((s) => {
          if (s.ownerType === 'CAMPUS' && s.ownerId === campusId) return true;
          if (s.applyTo === 'ALL_CAMPUSES') return true;
          return s.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        result = result.filter((s) => s.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async createSubject(
    tenantId: string,
    dto: CreateSubjectDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<SubjectListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();
      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;

      await this.validateDuplicateAndParentConflict(
        tx,
        tenantId,
        subjects,
        cleanName,
        dto.code,
        ownerType,
        ownerId,
        'Subject',
        'subject'
      );

      const hasPractical = dto.hasPractical ?? false;
      const practicalMaxMarks = hasPractical && dto.practicalMaxMarks ? String(dto.practicalMaxMarks) : null;

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${subjects.sortOrder}), 0)` })
          .from(subjects)
          .where(eq(subjects.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(subjects)
        .values({
          organizationId: tenantId,
          name: cleanName,
          shortName: dto.shortName?.trim() || null,
          code: dto.code?.trim().toUpperCase() || null,
          type: dto.type || 'Theory',
          category: dto.category || 'Core',
          defaultMaxMarks: dto.defaultMaxMarks !== undefined ? String(dto.defaultMaxMarks) : null,
          defaultPassingMarks: dto.defaultPassingMarks !== undefined ? String(dto.defaultPassingMarks) : null,
          hasPractical,
          practicalMaxMarks,
          creditWeight: dto.creditWeight !== undefined ? String(dto.creditWeight) : null,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.syncScopeBranches(
        tx,
        tenantId,
        'subject',
        created!.id,
        dto.applyTo || 'ALL_CAMPUSES',
        dto.branchIds || [],
        authorizedBranchIds
      );

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'CREATE',
          entityType: 'subject',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'subject', [created!.id]);
      const scope = branchMap.get(created!.id);
      const gov = this.tagEffectiveGovernance(created!, userRole);

      return {
        ...created!,
        type: created!.type as any,
        category: created!.category as any,
        defaultMaxMarks: created!.defaultMaxMarks ? Number(created!.defaultMaxMarks) : null,
        defaultPassingMarks: created!.defaultPassingMarks ? Number(created!.defaultPassingMarks) : null,
        practicalMaxMarks: created!.practicalMaxMarks ? Number(created!.practicalMaxMarks) : null,
        creditWeight: created!.creditWeight ? Number(created!.creditWeight) : null,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async updateSubject(
    tenantId: string,
    id: string,
    dto: UpdateSubjectDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<SubjectListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(subjects)
        .where(and(eq(subjects.organizationId, tenantId), eq(subjects.id, id)));

      if (!existing) throw new NotFoundException(`Subject with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canEdit) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to edit this inherited configuration.');
        }
      }

      if (dto.name || dto.code) {
        await this.validateDuplicateAndParentConflict(
          tx,
          tenantId,
          subjects,
          dto.name || existing.name,
          dto.code || existing.code,
          existing.ownerType as ConfigOwnerType,
          existing.ownerId,
          'Subject',
          'subject',
          id
        );
      }

      const hasPractical = dto.hasPractical !== undefined ? dto.hasPractical : existing.hasPractical;
      const practicalMaxMarks = hasPractical
        ? (dto.practicalMaxMarks !== undefined ? (dto.practicalMaxMarks ? String(dto.practicalMaxMarks) : null) : existing.practicalMaxMarks)
        : null;

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(subjects)
        .set({
          name: dto.name ? dto.name.trim() : existing.name,
          shortName: dto.shortName !== undefined ? (dto.shortName ? dto.shortName.trim() : null) : existing.shortName,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          type: dto.type || existing.type,
          category: dto.category || existing.category,
          defaultMaxMarks: dto.defaultMaxMarks !== undefined ? (dto.defaultMaxMarks ? String(dto.defaultMaxMarks) : null) : existing.defaultMaxMarks,
          defaultPassingMarks: dto.defaultPassingMarks !== undefined ? (dto.defaultPassingMarks ? String(dto.defaultPassingMarks) : null) : existing.defaultPassingMarks,
          hasPractical,
          practicalMaxMarks,
          creditWeight: dto.creditWeight !== undefined ? (dto.creditWeight ? String(dto.creditWeight) : null) : existing.creditWeight,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(subjects.organizationId, tenantId), eq(subjects.id, id)))
        .returning();

      if (dto.applyTo !== undefined || dto.branchIds !== undefined) {
        await this.syncScopeBranches(
          tx,
          tenantId,
          'subject',
          id,
          applyTo,
          dto.branchIds || [],
          authorizedBranchIds
        );
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'UPDATE',
          entityType: 'subject',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'subject', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        type: updated!.type as any,
        category: updated!.category as any,
        defaultMaxMarks: updated!.defaultMaxMarks ? Number(updated!.defaultMaxMarks) : null,
        defaultPassingMarks: updated!.defaultPassingMarks ? Number(updated!.defaultPassingMarks) : null,
        practicalMaxMarks: updated!.practicalMaxMarks ? Number(updated!.practicalMaxMarks) : null,
        creditWeight: updated!.creditWeight ? Number(updated!.creditWeight) : null,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async toggleSubjectStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<SubjectListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(subjects)
        .where(and(eq(subjects.organizationId, tenantId), eq(subjects.id, id)));

      if (!existing) throw new NotFoundException(`Subject with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canToggleStatus) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to toggle status for this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to toggle status for this inherited configuration.');
        }
      }

      const [updated] = await tx
        .update(subjects)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(subjects.organizationId, tenantId), eq(subjects.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'subject',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'subject', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        type: updated!.type as any,
        category: updated!.category as any,
        defaultMaxMarks: updated!.defaultMaxMarks ? Number(updated!.defaultMaxMarks) : null,
        defaultPassingMarks: updated!.defaultPassingMarks ? Number(updated!.defaultPassingMarks) : null,
        practicalMaxMarks: updated!.practicalMaxMarks ? Number(updated!.practicalMaxMarks) : null,
        creditWeight: updated!.creditWeight ? Number(updated!.creditWeight) : null,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 5. CLASSES / GRADES MASTER
  // ═════════════════════════════════════════════════════════════════

  private async syncClassSubjects(
    tx: any,
    tenantId: string,
    classId: string,
    compulsoryIds: string[] = [],
    optionalIds: string[] = []
  ) {
    const overlapping = compulsoryIds.filter((id) => optionalIds.includes(id));
    if (overlapping.length > 0) {
      throw new BadRequestException('A subject cannot be mapped as both Compulsory and Optional for the same class.');
    }

    const allSubjectIds = [...compulsoryIds, ...optionalIds];
    if (allSubjectIds.length > 0) {
      const validSubjects = await tx
        .select({ id: subjects.id })
        .from(subjects)
        .where(
          and(
            eq(subjects.organizationId, tenantId),
            inArray(subjects.id, allSubjectIds)
          )
        );

      if (validSubjects.length !== allSubjectIds.length) {
        throw new BadRequestException('One or more selected subjects do not exist in this organization.');
      }
    }

    await tx
      .delete(classSubjectMappings)
      .where(
        and(
          eq(classSubjectMappings.organizationId, tenantId),
          eq(classSubjectMappings.classId, classId)
        )
      );

    for (const subId of compulsoryIds) {
      await tx.insert(classSubjectMappings).values({
        organizationId: tenantId,
        classId,
        subjectId: subId,
        isCompulsory: true,
      });
    }

    for (const subId of optionalIds) {
      await tx.insert(classSubjectMappings).values({
        organizationId: tenantId,
        classId,
        subjectId: subId,
        isCompulsory: false,
      });
    }
  }

  private async loadClassSubjects(
    tx: any,
    tenantId: string,
    classIds: string[]
  ): Promise<
    Map<
      string,
      {
        compulsoryIds: string[];
        compulsoryNames: string[];
        optionalIds: string[];
        optionalNames: string[];
      }
    >
  > {
    const map = new Map<
      string,
      {
        compulsoryIds: string[];
        compulsoryNames: string[];
        optionalIds: string[];
        optionalNames: string[];
      }
    >();

    if (classIds.length === 0) return map;

    const rows = await tx
      .select({
        classId: classSubjectMappings.classId,
        subjectId: classSubjectMappings.subjectId,
        subjectName: subjects.name,
        isCompulsory: classSubjectMappings.isCompulsory,
      })
      .from(classSubjectMappings)
      .innerJoin(subjects, eq(classSubjectMappings.subjectId, subjects.id))
      .where(
        and(
          eq(classSubjectMappings.organizationId, tenantId),
          inArray(classSubjectMappings.classId, classIds)
        )
      );

    for (const row of rows) {
      if (!map.has(row.classId)) {
        map.set(row.classId, {
          compulsoryIds: [],
          compulsoryNames: [],
          optionalIds: [],
          optionalNames: [],
        });
      }
      const entry = map.get(row.classId)!;
      if (row.isCompulsory) {
        entry.compulsoryIds.push(row.subjectId);
        entry.compulsoryNames.push(row.subjectName);
      } else {
        entry.optionalIds.push(row.subjectId);
        entry.optionalNames.push(row.subjectName);
      }
    }

    return map;
  }

  async listClasses(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string,
    levelId?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<ClassListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: classes.id,
          organizationId: classes.organizationId,
          levelId: classes.levelId,
          levelName: academicLevels.name,
          name: classes.name,
          shortName: classes.shortName,
          code: classes.code,
          fromAge: classes.fromAge,
          toAge: classes.toAge,
          sortOrder: classes.sortOrder,
          description: classes.description,
          ownerType: classes.ownerType,
          ownerId: classes.ownerId,
          applyTo: classes.applyTo,
          isActive: classes.isActive,
          createdAt: classes.createdAt,
          updatedAt: classes.updatedAt,
        })
        .from(classes)
        .innerJoin(academicLevels, eq(classes.levelId, academicLevels.id))
        .where(
          and(
            eq(classes.organizationId, tenantId),
            status && status !== 'ALL' ? eq(classes.isActive, status === 'ACTIVE') : undefined,
            levelId && levelId !== 'ALL' ? eq(classes.levelId, levelId) : undefined,
            search
              ? or(
                  ilike(classes.name, `%${search}%`),
                  ilike(classes.shortName, `%${search}%`),
                  ilike(classes.code, `%${search}%`),
                  ilike(academicLevels.name, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(classes.sortOrder), asc(classes.name));

      const classIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'class', classIds);
      const subjectMap = await this.loadClassSubjects(tx, tenantId, classIds);

      let result: ClassListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const subData = subjectMap.get(r.id);
        const gov = this.tagEffectiveGovernance(r, userRole, campusId);
        return {
          id: r.id,
          organizationId: r.organizationId,
          levelId: r.levelId,
          levelName: r.levelName,
          name: r.name,
          shortName: r.shortName,
          code: r.code,
          fromAge: r.fromAge ? Number(r.fromAge) : null,
          toAge: r.toAge ? Number(r.toAge) : null,
          compulsorySubjectIds: subData?.compulsoryIds || [],
          compulsorySubjectNames: subData?.compulsoryNames || [],
          optionalSubjectIds: subData?.optionalIds || [],
          optionalSubjectNames: subData?.optionalNames || [],
          totalSubjectsCount: (subData?.compulsoryIds.length || 0) + (subData?.optionalIds.length || 0),
          sortOrder: r.sortOrder,
          description: r.description,
          ownerId: r.ownerId,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          ...gov,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((c) => {
          if (c.ownerType === 'CAMPUS' && c.ownerId === campusId) return true;
          if (c.applyTo === 'ALL_CAMPUSES') return true;
          return c.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        result = result.filter((c) => c.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async createClass(
    tenantId: string,
    dto: CreateClassDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<ClassListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();
      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;

      await this.validateDuplicateAndParentConflict(
        tx,
        tenantId,
        classes,
        cleanName,
        dto.code,
        ownerType,
        ownerId,
        'Class / Grade',
        'class'
      );

      const [level] = await tx
        .select()
        .from(academicLevels)
        .where(
          and(
            eq(academicLevels.organizationId, tenantId),
            eq(academicLevels.id, dto.levelId)
          )
        );

      if (!level) {
        throw new BadRequestException(`Academic Level / Stage with ID '${dto.levelId}' does not exist.`);
      }

      if (dto.fromAge !== undefined && dto.toAge !== undefined && dto.fromAge !== null && dto.toAge !== null) {
        if (dto.fromAge > dto.toAge) {
          throw new BadRequestException('From Age must be less than or equal to To Age.');
        }
      }

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${classes.sortOrder}), 0)` })
          .from(classes)
          .where(eq(classes.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(classes)
        .values({
          organizationId: tenantId,
          levelId: dto.levelId,
          name: cleanName,
          shortName: dto.shortName?.trim() || null,
          code: dto.code?.trim().toUpperCase() || null,
          fromAge: dto.fromAge !== undefined ? (dto.fromAge !== null ? String(dto.fromAge) : null) : null,
          toAge: dto.toAge !== undefined ? (dto.toAge !== null ? String(dto.toAge) : null) : null,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.syncScopeBranches(
        tx,
        tenantId,
        'class',
        created!.id,
        dto.applyTo || 'ALL_CAMPUSES',
        dto.branchIds || [],
        authorizedBranchIds
      );

      if (dto.compulsorySubjectIds || dto.optionalSubjectIds) {
        await this.syncClassSubjects(
          tx,
          tenantId,
          created!.id,
          dto.compulsorySubjectIds || [],
          dto.optionalSubjectIds || []
        );
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'CREATE',
          entityType: 'class',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'class', [created!.id]);
      const subjectMap = await this.loadClassSubjects(tx, tenantId, [created!.id]);
      const scope = branchMap.get(created!.id);
      const subData = subjectMap.get(created!.id);
      const gov = this.tagEffectiveGovernance(created!, userRole);

      return {
        id: created!.id,
        organizationId: created!.organizationId,
        levelId: created!.levelId,
        levelName: level.name,
        name: created!.name,
        shortName: created!.shortName,
        code: created!.code,
        fromAge: created!.fromAge ? Number(created!.fromAge) : null,
        toAge: created!.toAge ? Number(created!.toAge) : null,
        compulsorySubjectIds: subData?.compulsoryIds || [],
        compulsorySubjectNames: subData?.compulsoryNames || [],
        optionalSubjectIds: subData?.optionalIds || [],
        optionalSubjectNames: subData?.optionalNames || [],
        totalSubjectsCount: (subData?.compulsoryIds.length || 0) + (subData?.optionalIds.length || 0),
        sortOrder: created!.sortOrder,
        description: created!.description,
        ownerId: created!.ownerId,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
        isActive: created!.isActive,
        createdAt: created!.createdAt,
        updatedAt: created!.updatedAt,
      };
    });
  }

  async updateClass(
    tenantId: string,
    id: string,
    dto: UpdateClassDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<ClassListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(classes)
        .where(and(eq(classes.organizationId, tenantId), eq(classes.id, id)));

      if (!existing) throw new NotFoundException(`Class with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canEdit) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to edit this inherited configuration.');
        }
      }

      if (dto.name || dto.code) {
        await this.validateDuplicateAndParentConflict(
          tx,
          tenantId,
          classes,
          dto.name || existing.name,
          dto.code || existing.code,
          existing.ownerType as ConfigOwnerType,
          existing.ownerId,
          'Class / Grade',
          'class',
          id
        );
      }

      let levelName = '';
      const levelId = dto.levelId || existing.levelId;
      const [level] = await tx
        .select()
        .from(academicLevels)
        .where(
          and(
            eq(academicLevels.organizationId, tenantId),
            eq(academicLevels.id, levelId)
          )
        );

      if (!level) {
        throw new BadRequestException(`Academic Level / Stage with ID '${levelId}' does not exist.`);
      }
      levelName = level.name;

      const fromAge = dto.fromAge !== undefined ? (dto.fromAge !== null ? String(dto.fromAge) : null) : existing.fromAge;
      const toAge = dto.toAge !== undefined ? (dto.toAge !== null ? String(dto.toAge) : null) : existing.toAge;

      if (fromAge !== null && toAge !== null && Number(fromAge) > Number(toAge)) {
        throw new BadRequestException('From Age must be less than or equal to To Age.');
      }

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(classes)
        .set({
          levelId,
          name: dto.name ? dto.name.trim() : existing.name,
          shortName: dto.shortName !== undefined ? (dto.shortName ? dto.shortName.trim() : null) : existing.shortName,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          fromAge,
          toAge,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(classes.organizationId, tenantId), eq(classes.id, id)))
        .returning();

      if (dto.applyTo !== undefined || dto.branchIds !== undefined) {
        await this.syncScopeBranches(
          tx,
          tenantId,
          'class',
          id,
          applyTo,
          dto.branchIds || [],
          authorizedBranchIds
        );
      }

      if (dto.compulsorySubjectIds !== undefined || dto.optionalSubjectIds !== undefined) {
        const currentSubjects = await this.loadClassSubjects(tx, tenantId, [id]);
        const currentData = currentSubjects.get(id);
        const compIds = dto.compulsorySubjectIds !== undefined ? dto.compulsorySubjectIds : (currentData?.compulsoryIds || []);
        const optIds = dto.optionalSubjectIds !== undefined ? dto.optionalSubjectIds : (currentData?.optionalIds || []);
        await this.syncClassSubjects(tx, tenantId, id, compIds, optIds);
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'UPDATE',
          entityType: 'class',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'class', [id]);
      const subjectMap = await this.loadClassSubjects(tx, tenantId, [id]);
      const scope = branchMap.get(id);
      const subData = subjectMap.get(id);

      return {
        id: updated!.id,
        organizationId: updated!.organizationId,
        levelId: updated!.levelId,
        levelName,
        name: updated!.name,
        shortName: updated!.shortName,
        code: updated!.code,
        fromAge: updated!.fromAge ? Number(updated!.fromAge) : null,
        toAge: updated!.toAge ? Number(updated!.toAge) : null,
        compulsorySubjectIds: subData?.compulsoryIds || [],
        compulsorySubjectNames: subData?.compulsoryNames || [],
        optionalSubjectIds: subData?.optionalIds || [],
        optionalSubjectNames: subData?.optionalNames || [],
        totalSubjectsCount: (subData?.compulsoryIds.length || 0) + (subData?.optionalIds.length || 0),
        sortOrder: updated!.sortOrder,
        description: updated!.description,
        ownerId: updated!.ownerId,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
        isActive: updated!.isActive,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      };
    });
  }

  async toggleClassStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<ClassListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select({
          id: classes.id,
          organizationId: classes.organizationId,
          levelId: classes.levelId,
          levelName: academicLevels.name,
          name: classes.name,
          shortName: classes.shortName,
          code: classes.code,
          fromAge: classes.fromAge,
          toAge: classes.toAge,
          sortOrder: classes.sortOrder,
          description: classes.description,
          ownerType: classes.ownerType,
          ownerId: classes.ownerId,
          applyTo: classes.applyTo,
          isActive: classes.isActive,
          createdAt: classes.createdAt,
          updatedAt: classes.updatedAt,
        })
        .from(classes)
        .innerJoin(academicLevels, eq(classes.levelId, academicLevels.id))
        .where(and(eq(classes.organizationId, tenantId), eq(classes.id, id)));

      if (!existing) throw new NotFoundException(`Class with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canToggleStatus) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to toggle status for this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to toggle status for this inherited configuration.');
        }
      }

      const [updated] = await tx
        .update(classes)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(classes.organizationId, tenantId), eq(classes.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'class',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'class', [id]);
      const subjectMap = await this.loadClassSubjects(tx, tenantId, [id]);
      const scope = branchMap.get(id);
      const subData = subjectMap.get(id);

      return {
        id: updated!.id,
        organizationId: updated!.organizationId,
        levelId: updated!.levelId,
        levelName: existing.levelName,
        name: updated!.name,
        shortName: updated!.shortName,
        code: updated!.code,
        fromAge: updated!.fromAge ? Number(updated!.fromAge) : null,
        toAge: updated!.toAge ? Number(updated!.toAge) : null,
        compulsorySubjectIds: subData?.compulsoryIds || [],
        compulsorySubjectNames: subData?.compulsoryNames || [],
        optionalSubjectIds: subData?.optionalIds || [],
        optionalSubjectNames: subData?.optionalNames || [],
        totalSubjectsCount: (subData?.compulsoryIds.length || 0) + (subData?.optionalIds.length || 0),
        sortOrder: updated!.sortOrder,
        description: updated!.description,
        ownerId: updated!.ownerId,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
        isActive: updated!.isActive,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 6. SECTIONS MASTER
  // ═════════════════════════════════════════════════════════════════

  async listSections(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<SectionListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(sections)
        .where(
          and(
            eq(sections.organizationId, tenantId),
            status && status !== 'ALL' ? eq(sections.isActive, status === 'ACTIVE') : undefined,
            search ? ilike(sections.name, `%${search}%`) : undefined
          )
        )
        .orderBy(asc(sections.sortOrder), asc(sections.name));

      const entityIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'section', entityIds);

      let result: SectionListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const gov = this.tagEffectiveGovernance(r, userRole, campusId);
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          sortOrder: r.sortOrder,
          description: r.description,
          ownerId: r.ownerId,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          ...gov,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((sec) => {
          if (sec.ownerType === 'CAMPUS' && sec.ownerId === campusId) return true;
          if (sec.applyTo === 'ALL_CAMPUSES') return true;
          return sec.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        result = result.filter((sec) => sec.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async createSection(
    tenantId: string,
    dto: CreateSectionDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<SectionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();
      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;

      await this.validateDuplicateAndParentConflict(
        tx,
        tenantId,
        sections,
        cleanName,
        null,
        ownerType,
        ownerId,
        'Section',
        'section'
      );

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${sections.sortOrder}), 0)` })
          .from(sections)
          .where(eq(sections.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(sections)
        .values({
          organizationId: tenantId,
          name: cleanName,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.syncScopeBranches(
        tx,
        tenantId,
        'section',
        created!.id,
        dto.applyTo || 'ALL_CAMPUSES',
        dto.branchIds || [],
        authorizedBranchIds
      );

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'CREATE',
          entityType: 'section',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'section', [created!.id]);
      const scope = branchMap.get(created!.id);
      const gov = this.tagEffectiveGovernance(created!, userRole);

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async updateSection(
    tenantId: string,
    id: string,
    dto: UpdateSectionDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<SectionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(sections)
        .where(and(eq(sections.organizationId, tenantId), eq(sections.id, id)));

      if (!existing) throw new NotFoundException(`Section with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canEdit) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to edit this inherited configuration.');
        }
      }

      if (dto.name) {
        await this.validateDuplicateAndParentConflict(
          tx,
          tenantId,
          sections,
          dto.name,
          null,
          existing.ownerType as ConfigOwnerType,
          existing.ownerId,
          'Section',
          'section',
          id
        );
      }

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(sections)
        .set({
          name: dto.name ? dto.name.trim() : existing.name,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(sections.organizationId, tenantId), eq(sections.id, id)))
        .returning();

      if (dto.applyTo !== undefined || dto.branchIds !== undefined) {
        await this.syncScopeBranches(
          tx,
          tenantId,
          'section',
          id,
          applyTo,
          dto.branchIds || [],
          authorizedBranchIds
        );
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'UPDATE',
          entityType: 'section',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'section', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async toggleSectionStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<SectionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(sections)
        .where(and(eq(sections.organizationId, tenantId), eq(sections.id, id)));

      if (!existing) throw new NotFoundException(`Section with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canToggleStatus) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to toggle status for this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to toggle status for this inherited configuration.');
        }
      }

      const [updated] = await tx
        .update(sections)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(sections.organizationId, tenantId), eq(sections.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'section',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'section', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 7. LANGUAGES MASTER
  // ═════════════════════════════════════════════════════════════════

  async listLanguages(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<LanguageListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(languages)
        .where(
          and(
            eq(languages.organizationId, tenantId),
            status && status !== 'ALL' ? eq(languages.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(languages.name, `%${search}%`),
                  ilike(languages.code, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(languages.sortOrder), asc(languages.name));

      const entityIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'language', entityIds);

      let result: LanguageListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const gov = this.tagEffectiveGovernance(r, userRole, campusId);
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          code: r.code,
          sortOrder: r.sortOrder,
          description: r.description,
          ownerId: r.ownerId,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          ...gov,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((l) => {
          if (l.ownerType === 'CAMPUS' && l.ownerId === campusId) return true;
          if (l.applyTo === 'ALL_CAMPUSES') return true;
          return l.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        result = result.filter((l) => l.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async createLanguage(
    tenantId: string,
    dto: CreateLanguageDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<LanguageListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();
      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;

      await this.validateDuplicateAndParentConflict(
        tx,
        tenantId,
        languages,
        cleanName,
        dto.code,
        ownerType,
        ownerId,
        'Language',
        'language'
      );

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${languages.sortOrder}), 0)` })
          .from(languages)
          .where(eq(languages.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(languages)
        .values({
          organizationId: tenantId,
          name: cleanName,
          code: dto.code?.trim().toUpperCase() || null,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.syncScopeBranches(
        tx,
        tenantId,
        'language',
        created!.id,
        dto.applyTo || 'ALL_CAMPUSES',
        dto.branchIds || [],
        authorizedBranchIds
      );

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'CREATE',
          entityType: 'language',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'language', [created!.id]);
      const scope = branchMap.get(created!.id);
      const gov = this.tagEffectiveGovernance(created!, userRole);

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async updateLanguage(
    tenantId: string,
    id: string,
    dto: UpdateLanguageDto,
    actorUserId?: string,
    authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<LanguageListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(languages)
        .where(and(eq(languages.organizationId, tenantId), eq(languages.id, id)));

      if (!existing) throw new NotFoundException(`Language with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canEdit) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to edit this inherited configuration.');
        }
      }

      if (dto.name || dto.code) {
        await this.validateDuplicateAndParentConflict(
          tx,
          tenantId,
          languages,
          dto.name || existing.name,
          dto.code || existing.code,
          existing.ownerType as ConfigOwnerType,
          existing.ownerId,
          'Language',
          'language',
          id
        );
      }

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(languages)
        .set({
          name: dto.name ? dto.name.trim() : existing.name,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(languages.organizationId, tenantId), eq(languages.id, id)))
        .returning();

      if (dto.applyTo !== undefined || dto.branchIds !== undefined) {
        await this.syncScopeBranches(
          tx,
          tenantId,
          'language',
          id,
          applyTo,
          dto.branchIds || [],
          authorizedBranchIds
        );
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: 'UPDATE',
          entityType: 'language',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'language', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }

  async toggleLanguageStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN',
    allowLowerLevelEdit: boolean = false
  ): Promise<LanguageListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(languages)
        .where(and(eq(languages.organizationId, tenantId), eq(languages.id, id)));

      if (!existing) throw new NotFoundException(`Language with ID '${id}' not found.`);

      const gov = this.tagEffectiveGovernance(existing, userRole, undefined, allowLowerLevelEdit);
      if (!gov.canToggleStatus) {
        if (existing.ownerType === 'CAMPUS') {
          throw new ForbiddenException('You do not have permission to toggle status for this Campus-owned configuration. Upward visibility does not grant update rights.');
        } else {
          throw new ForbiddenException('You do not have permission to toggle status for this inherited configuration.');
        }
      }

      const [updated] = await tx
        .update(languages)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(languages.organizationId, tenantId), eq(languages.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ACADEMIC',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'language',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'language', [id]);
      const scope = branchMap.get(id);

      return {
        ...updated!,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        ...gov,
      };
    });
  }
}
