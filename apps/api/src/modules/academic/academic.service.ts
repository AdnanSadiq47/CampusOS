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
} from '@campus-os/types';
import { AuditService } from '../../core/audit/audit.service.js';

@Injectable()
export class AcademicService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

  // ═════════════════════════════════════════════════════════════════
  // CENTRAL SCOPE / INHERITANCE HELPER
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
    // Delete existing branch mappings
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
      // Validate requested branches belong to tenant
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

      // Validate authorization if restricted
      if (authorizedBranchIds && !authorizedBranchIds.includes('*')) {
        for (const bid of branchIds) {
          if (!authorizedBranchIds.includes(bid)) {
            throw new ForbiddenException(`You are not authorized to assign branch ID '${bid}'.`);
          }
        }
      }

      // Insert new mappings
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

  // ═════════════════════════════════════════════════════════════════
  // 1. ACADEMIC YEARS MASTER
  // ═════════════════════════════════════════════════════════════════

  async listAcademicYears(
    tenantId: string,
    campusId?: string,
    search?: string,
    status?: string
  ): Promise<AcademicYearListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      let query = tx
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

      const rows = await query;
      const entityIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'academic_year', entityIds);

      let result: AcademicYearListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
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
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      // Filter by campus if requested
      if (campusId && campusId !== 'ALL') {
        result = result.filter((ay) => {
          if (ay.applyTo === 'ALL_CAMPUSES') return true;
          return ay.branchIds?.includes(campusId);
        });
      }

      return result;
    });
  }

  async createAcademicYear(
    tenantId: string,
    dto: CreateAcademicYearDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<AcademicYearListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // Validate dates
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('Start Date must be earlier than End Date.');
      }

      const cleanCode = dto.code.trim().toUpperCase();
      const cleanName = dto.name.trim();

      // Duplicate code check
      const [existing] = await tx
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(
          and(
            eq(academicYears.organizationId, tenantId),
            eq(academicYears.code, cleanCode)
          )
        );

      if (existing) {
        throw new ConflictException(`Academic Year with code '${cleanCode}' already exists.`);
      }

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${academicYears.sortOrder}), 0)` })
          .from(academicYears)
          .where(eq(academicYears.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      // If set as current, reset previous current year for overlapping scope
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

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
      };
    });
  }

  async updateAcademicYear(
    tenantId: string,
    id: string,
    dto: UpdateAcademicYearDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<AcademicYearListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.id, id)));

      if (!existing) throw new NotFoundException(`Academic Year with ID '${id}' not found.`);

      const startDate = dto.startDate || existing.startDate;
      const endDate = dto.endDate || existing.endDate;
      if (new Date(startDate) >= new Date(endDate)) {
        throw new BadRequestException('Start Date must be earlier than End Date.');
      }

      if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
        const [duplicate] = await tx
          .select({ id: academicYears.id })
          .from(academicYears)
          .where(
            and(
              eq(academicYears.organizationId, tenantId),
              eq(academicYears.code, dto.code.trim().toUpperCase())
            )
          );
        if (duplicate) {
          throw new ConflictException(`Academic Year with code '${dto.code}' already exists.`);
        }
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
      };
    });
  }

  async toggleAcademicYearStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<AcademicYearListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.organizationId, tenantId), eq(academicYears.id, id)));

      if (!existing) throw new NotFoundException(`Academic Year with ID '${id}' not found.`);

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
    status?: string
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
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          shortName: r.shortName,
          code: r.code,
          sortOrder: r.sortOrder,
          description: r.description,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((b) => b.applyTo === 'ALL_CAMPUSES' || b.branchIds?.includes(campusId));
      }

      return result;
    });
  }

  async createBoard(
    tenantId: string,
    dto: CreateBoardDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<BoardListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();

      const [existing] = await tx
        .select({ id: boards.id })
        .from(boards)
        .where(
          and(
            eq(boards.organizationId, tenantId),
            ilike(boards.name, cleanName)
          )
        );

      if (existing) {
        throw new ConflictException(`Board '${cleanName}' already exists.`);
      }

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

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
      };
    });
  }

  async updateBoard(
    tenantId: string,
    id: string,
    dto: UpdateBoardDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<BoardListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(boards)
        .where(and(eq(boards.organizationId, tenantId), eq(boards.id, id)));

      if (!existing) throw new NotFoundException(`Board with ID '${id}' not found.`);

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
      };
    });
  }

  async toggleBoardStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<BoardListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(boards)
        .where(and(eq(boards.organizationId, tenantId), eq(boards.id, id)));

      if (!existing) throw new NotFoundException(`Board with ID '${id}' not found.`);

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
    status?: string
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

      // Class count per level
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
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          shortName: r.shortName,
          sortOrder: r.sortOrder,
          description: r.description,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          classCount: countMap.get(r.id) || 0,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((l) => l.applyTo === 'ALL_CAMPUSES' || l.branchIds?.includes(campusId));
      }

      return result;
    });
  }

  async createAcademicLevel(
    tenantId: string,
    dto: CreateAcademicLevelDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<AcademicLevelListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();

      const [existing] = await tx
        .select({ id: academicLevels.id })
        .from(academicLevels)
        .where(
          and(
            eq(academicLevels.organizationId, tenantId),
            ilike(academicLevels.name, cleanName)
          )
        );

      if (existing) {
        throw new ConflictException(`Academic Level / Stage '${cleanName}' already exists.`);
      }

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

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        classCount: 0,
      };
    });
  }

  async updateAcademicLevel(
    tenantId: string,
    id: string,
    dto: UpdateAcademicLevelDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<AcademicLevelListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicLevels)
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, id)));

      if (!existing) throw new NotFoundException(`Academic Level with ID '${id}' not found.`);

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
      };
    });
  }

  async toggleAcademicLevelStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<AcademicLevelListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(academicLevels)
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, id)));

      if (!existing) throw new NotFoundException(`Academic Level with ID '${id}' not found.`);

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
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. SUBJECTS MASTER
  // ═════════════════════════════════════════════════════════════════

  async listSubjects(
    tenantId: string,
    campusId?: string,
    type?: string,
    category?: string,
    search?: string,
    status?: string
  ): Promise<SubjectListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.organizationId, tenantId),
            type && type !== 'ALL' ? eq(subjects.type, type) : undefined,
            category && category !== 'ALL' ? eq(subjects.category, category) : undefined,
            status && status !== 'ALL' ? eq(subjects.isActive, status === 'ACTIVE') : undefined,
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
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((s) => s.applyTo === 'ALL_CAMPUSES' || s.branchIds?.includes(campusId));
      }

      return result;
    });
  }

  async createSubject(
    tenantId: string,
    dto: CreateSubjectDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<SubjectListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();

      const [existing] = await tx
        .select({ id: subjects.id })
        .from(subjects)
        .where(
          and(
            eq(subjects.organizationId, tenantId),
            ilike(subjects.name, cleanName)
          )
        );

      if (existing) {
        throw new ConflictException(`Subject '${cleanName}' already exists.`);
      }

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${subjects.sortOrder}), 0)` })
          .from(subjects)
          .where(eq(subjects.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const hasPractical = dto.hasPractical ?? false;
      const practicalMaxMarks = hasPractical ? (dto.practicalMaxMarks ?? null) : null;

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
          practicalMaxMarks: practicalMaxMarks !== null ? String(practicalMaxMarks) : null,
          creditWeight: dto.creditWeight !== undefined ? String(dto.creditWeight) : null,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
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

      return {
        id: created!.id,
        organizationId: created!.organizationId,
        name: created!.name,
        shortName: created!.shortName,
        code: created!.code,
        type: created!.type as any,
        category: created!.category as any,
        defaultMaxMarks: created!.defaultMaxMarks ? Number(created!.defaultMaxMarks) : null,
        defaultPassingMarks: created!.defaultPassingMarks ? Number(created!.defaultPassingMarks) : null,
        hasPractical: created!.hasPractical,
        practicalMaxMarks: created!.practicalMaxMarks ? Number(created!.practicalMaxMarks) : null,
        creditWeight: created!.creditWeight ? Number(created!.creditWeight) : null,
        sortOrder: created!.sortOrder,
        description: created!.description,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        isActive: created!.isActive,
        createdAt: created!.createdAt,
        updatedAt: created!.updatedAt,
      };
    });
  }

  async updateSubject(
    tenantId: string,
    id: string,
    dto: UpdateSubjectDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<SubjectListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(subjects)
        .where(and(eq(subjects.organizationId, tenantId), eq(subjects.id, id)));

      if (!existing) throw new NotFoundException(`Subject with ID '${id}' not found.`);

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);
      const hasPractical = dto.hasPractical !== undefined ? dto.hasPractical : existing.hasPractical;
      const practicalMaxMarks = hasPractical
        ? dto.practicalMaxMarks !== undefined
          ? dto.practicalMaxMarks
          : existing.practicalMaxMarks
        : null;

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
          practicalMaxMarks: practicalMaxMarks ? String(practicalMaxMarks) : null,
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
        id: updated!.id,
        organizationId: updated!.organizationId,
        name: updated!.name,
        shortName: updated!.shortName,
        code: updated!.code,
        type: updated!.type as any,
        category: updated!.category as any,
        defaultMaxMarks: updated!.defaultMaxMarks ? Number(updated!.defaultMaxMarks) : null,
        defaultPassingMarks: updated!.defaultPassingMarks ? Number(updated!.defaultPassingMarks) : null,
        hasPractical: updated!.hasPractical,
        practicalMaxMarks: updated!.practicalMaxMarks ? Number(updated!.practicalMaxMarks) : null,
        creditWeight: updated!.creditWeight ? Number(updated!.creditWeight) : null,
        sortOrder: updated!.sortOrder,
        description: updated!.description,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        isActive: updated!.isActive,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      };
    });
  }

  async toggleSubjectStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<SubjectListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(subjects)
        .where(and(eq(subjects.organizationId, tenantId), eq(subjects.id, id)));

      if (!existing) throw new NotFoundException(`Subject with ID '${id}' not found.`);

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
        id: updated!.id,
        organizationId: updated!.organizationId,
        name: updated!.name,
        shortName: updated!.shortName,
        code: updated!.code,
        type: updated!.type as any,
        category: updated!.category as any,
        defaultMaxMarks: updated!.defaultMaxMarks ? Number(updated!.defaultMaxMarks) : null,
        defaultPassingMarks: updated!.defaultPassingMarks ? Number(updated!.defaultPassingMarks) : null,
        hasPractical: updated!.hasPractical,
        practicalMaxMarks: updated!.practicalMaxMarks ? Number(updated!.practicalMaxMarks) : null,
        creditWeight: updated!.creditWeight ? Number(updated!.creditWeight) : null,
        sortOrder: updated!.sortOrder,
        description: updated!.description,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
        isActive: updated!.isActive,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 5. CLASSES / GRADES MASTER
  // ═════════════════════════════════════════════════════════════════

  async listClasses(
    tenantId: string,
    levelId?: string,
    campusId?: string,
    search?: string,
    status?: string
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
            levelId && levelId !== 'ALL' ? eq(classes.levelId, levelId) : undefined,
            status && status !== 'ALL' ? eq(classes.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(classes.name, `%${search}%`),
                  ilike(classes.shortName, `%${search}%`),
                  ilike(classes.code, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(academicLevels.sortOrder), asc(classes.sortOrder), asc(classes.name));

      const classIds = rows.map((r: any) => r.id);
      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'class', classIds);

      // Load subject mappings
      const subjectMappings = classIds.length > 0
        ? await tx
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
            )
        : [];

      const subjectsMap = new Map<
        string,
        {
          compulsoryIds: string[];
          compulsoryNames: string[];
          optionalIds: string[];
          optionalNames: string[];
        }
      >();

      for (const m of subjectMappings) {
        if (!subjectsMap.has(m.classId)) {
          subjectsMap.set(m.classId, {
            compulsoryIds: [],
            compulsoryNames: [],
            optionalIds: [],
            optionalNames: [],
          });
        }
        const entry = subjectsMap.get(m.classId)!;
        if (m.isCompulsory) {
          entry.compulsoryIds.push(m.subjectId);
          entry.compulsoryNames.push(m.subjectName);
        } else {
          entry.optionalIds.push(m.subjectId);
          entry.optionalNames.push(m.subjectName);
        }
      }

      let result: ClassListItemDto[] = rows.map((r: any) => {
        const scope = branchMap.get(r.id);
        const sub = subjectsMap.get(r.id);
        const compCount = sub?.compulsoryIds.length || 0;
        const optCount = sub?.optionalIds.length || 0;
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
          compulsorySubjectIds: sub?.compulsoryIds || [],
          compulsorySubjectNames: sub?.compulsoryNames || [],
          optionalSubjectIds: sub?.optionalIds || [],
          optionalSubjectNames: sub?.optionalNames || [],
          totalSubjectsCount: compCount + optCount,
          sortOrder: r.sortOrder,
          description: r.description,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((c) => c.applyTo === 'ALL_CAMPUSES' || c.branchIds?.includes(campusId));
      }

      return result;
    });
  }

  async createClass(
    tenantId: string,
    dto: CreateClassDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<ClassListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // 1. Validate parent Level
      const [level] = await tx
        .select()
        .from(academicLevels)
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, dto.levelId)));

      if (!level) throw new NotFoundException(`Academic Level '${dto.levelId}' not found.`);

      // 2. Validate Age range
      if (dto.fromAge !== undefined && dto.toAge !== undefined) {
        if (dto.fromAge > dto.toAge) {
          throw new BadRequestException('From Age must be less than or equal to To Age.');
        }
      }

      // 3. Validate Compulsory vs Optional Subject intersection
      const compIds = dto.compulsorySubjectIds || [];
      const optIds = dto.optionalSubjectIds || [];
      for (const cid of compIds) {
        if (optIds.includes(cid)) {
          throw new BadRequestException(`Subject ID '${cid}' cannot be mapped as both Compulsory and Optional for the same class.`);
        }
      }

      const cleanName = dto.name.trim();

      const [existing] = await tx
        .select({ id: classes.id })
        .from(classes)
        .where(
          and(
            eq(classes.organizationId, tenantId),
            ilike(classes.name, cleanName)
          )
        );

      if (existing) {
        throw new ConflictException(`Class / Grade '${cleanName}' already exists.`);
      }

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${classes.sortOrder}), 0)` })
          .from(classes)
          .where(and(eq(classes.organizationId, tenantId), eq(classes.levelId, dto.levelId)));
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
          fromAge: dto.fromAge !== undefined ? String(dto.fromAge) : null,
          toAge: dto.toAge !== undefined ? String(dto.toAge) : null,
          sortOrder: resolvedSortOrder,
          description: dto.description?.trim() || null,
          applyTo: dto.applyTo || 'ALL_CAMPUSES',
          isActive: dto.isActive ?? true,
        })
        .returning();

      // Insert subject mappings
      for (const sid of compIds) {
        await tx.insert(classSubjectMappings).values({
          organizationId: tenantId,
          classId: created!.id,
          subjectId: sid,
          isCompulsory: true,
        });
      }
      for (const sid of optIds) {
        await tx.insert(classSubjectMappings).values({
          organizationId: tenantId,
          classId: created!.id,
          subjectId: sid,
          isCompulsory: false,
        });
      }

      await this.syncScopeBranches(
        tx,
        tenantId,
        'class',
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
          entityType: 'class',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      const branchMap = await this.loadScopeBranchInfo(tx, tenantId, 'class', [created!.id]);
      const scope = branchMap.get(created!.id);

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
        compulsorySubjectIds: compIds,
        optionalSubjectIds: optIds,
        totalSubjectsCount: compIds.length + optIds.length,
        sortOrder: created!.sortOrder,
        description: created!.description,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
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
    authorizedBranchIds?: string[]
  ): Promise<ClassListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(classes)
        .where(and(eq(classes.organizationId, tenantId), eq(classes.id, id)));

      if (!existing) throw new NotFoundException(`Class with ID '${id}' not found.`);

      const targetLevelId = dto.levelId || existing.levelId;
      const [level] = await tx
        .select()
        .from(academicLevels)
        .where(and(eq(academicLevels.organizationId, tenantId), eq(academicLevels.id, targetLevelId)));

      if (!level) throw new NotFoundException(`Academic Level '${targetLevelId}' not found.`);

      const fromAge = dto.fromAge !== undefined ? dto.fromAge : (existing.fromAge ? Number(existing.fromAge) : undefined);
      const toAge = dto.toAge !== undefined ? dto.toAge : (existing.toAge ? Number(existing.toAge) : undefined);
      if (fromAge !== undefined && toAge !== undefined && fromAge > toAge) {
        throw new BadRequestException('From Age must be less than or equal to To Age.');
      }

      if (dto.compulsorySubjectIds !== undefined && dto.optionalSubjectIds !== undefined) {
        for (const cid of dto.compulsorySubjectIds) {
          if (dto.optionalSubjectIds.includes(cid)) {
            throw new BadRequestException(`Subject ID '${cid}' cannot be mapped as both Compulsory and Optional for the same class.`);
          }
        }
      }

      const applyTo = dto.applyTo || (existing.applyTo as ConfigScopeType);

      const [updated] = await tx
        .update(classes)
        .set({
          levelId: targetLevelId,
          name: dto.name ? dto.name.trim() : existing.name,
          shortName: dto.shortName !== undefined ? (dto.shortName ? dto.shortName.trim() : null) : existing.shortName,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          fromAge: fromAge !== undefined ? String(fromAge) : null,
          toAge: toAge !== undefined ? String(toAge) : null,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
          applyTo,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(classes.organizationId, tenantId), eq(classes.id, id)))
        .returning();

      // Replace subject mappings if provided
      if (dto.compulsorySubjectIds !== undefined || dto.optionalSubjectIds !== undefined) {
        await tx
          .delete(classSubjectMappings)
          .where(and(eq(classSubjectMappings.organizationId, tenantId), eq(classSubjectMappings.classId, id)));

        const compIds = dto.compulsorySubjectIds || [];
        const optIds = dto.optionalSubjectIds || [];

        for (const sid of compIds) {
          await tx.insert(classSubjectMappings).values({
            organizationId: tenantId,
            classId: id,
            subjectId: sid,
            isCompulsory: true,
          });
        }
        for (const sid of optIds) {
          await tx.insert(classSubjectMappings).values({
            organizationId: tenantId,
            classId: id,
            subjectId: sid,
            isCompulsory: false,
          });
        }
      }

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
      const scope = branchMap.get(id);

      return {
        id: updated!.id,
        organizationId: updated!.organizationId,
        levelId: updated!.levelId,
        levelName: level.name,
        name: updated!.name,
        shortName: updated!.shortName,
        code: updated!.code,
        fromAge: updated!.fromAge ? Number(updated!.fromAge) : null,
        toAge: updated!.toAge ? Number(updated!.toAge) : null,
        sortOrder: updated!.sortOrder,
        description: updated!.description,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
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
    actorUserId?: string
  ): Promise<ClassListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(classes)
        .where(and(eq(classes.organizationId, tenantId), eq(classes.id, id)));

      if (!existing) throw new NotFoundException(`Class with ID '${id}' not found.`);

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
      const scope = branchMap.get(id);

      return {
        id: updated!.id,
        organizationId: updated!.organizationId,
        levelId: updated!.levelId,
        name: updated!.name,
        shortName: updated!.shortName,
        code: updated!.code,
        sortOrder: updated!.sortOrder,
        description: updated!.description,
        applyTo: updated!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
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
    status?: string
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
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          sortOrder: r.sortOrder,
          description: r.description,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((s) => s.applyTo === 'ALL_CAMPUSES' || s.branchIds?.includes(campusId));
      }

      return result;
    });
  }

  async createSection(
    tenantId: string,
    dto: CreateSectionDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<SectionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();

      const [existing] = await tx
        .select({ id: sections.id })
        .from(sections)
        .where(
          and(
            eq(sections.organizationId, tenantId),
            ilike(sections.name, cleanName)
          )
        );

      if (existing) {
        throw new ConflictException(`Section '${cleanName}' already exists.`);
      }

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

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
      };
    });
  }

  async updateSection(
    tenantId: string,
    id: string,
    dto: UpdateSectionDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<SectionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(sections)
        .where(and(eq(sections.organizationId, tenantId), eq(sections.id, id)));

      if (!existing) throw new NotFoundException(`Section with ID '${id}' not found.`);

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
      };
    });
  }

  async toggleSectionStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<SectionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(sections)
        .where(and(eq(sections.organizationId, tenantId), eq(sections.id, id)));

      if (!existing) throw new NotFoundException(`Section with ID '${id}' not found.`);

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
    status?: string
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
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          code: r.code,
          sortOrder: r.sortOrder,
          description: r.description,
          applyTo: r.applyTo as ConfigScopeType,
          branchIds: scope?.branchIds || [],
          branchNames: scope?.branchNames || [],
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      if (campusId && campusId !== 'ALL') {
        result = result.filter((l) => l.applyTo === 'ALL_CAMPUSES' || l.branchIds?.includes(campusId));
      }

      return result;
    });
  }

  async createLanguage(
    tenantId: string,
    dto: CreateLanguageDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<LanguageListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();

      const [existing] = await tx
        .select({ id: languages.id })
        .from(languages)
        .where(
          and(
            eq(languages.organizationId, tenantId),
            ilike(languages.name, cleanName)
          )
        );

      if (existing) {
        throw new ConflictException(`Language '${cleanName}' already exists.`);
      }

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

      return {
        ...created!,
        applyTo: created!.applyTo as ConfigScopeType,
        branchIds: scope?.branchIds || [],
        branchNames: scope?.branchNames || [],
      };
    });
  }

  async updateLanguage(
    tenantId: string,
    id: string,
    dto: UpdateLanguageDto,
    actorUserId?: string,
    authorizedBranchIds?: string[]
  ): Promise<LanguageListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(languages)
        .where(and(eq(languages.organizationId, tenantId), eq(languages.id, id)));

      if (!existing) throw new NotFoundException(`Language with ID '${id}' not found.`);

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
      };
    });
  }

  async toggleLanguageStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<LanguageListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(languages)
        .where(and(eq(languages.organizationId, tenantId), eq(languages.id, id)));

      if (!existing) throw new NotFoundException(`Language with ID '${id}' not found.`);

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
      };
    });
  }
}
