import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AcademicService } from './academic.service.js';
import { WorkingContextService } from '../../core/hierarchy/working-context.service.js';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateBoardDto,
  UpdateBoardDto,
  CreateAcademicLevelDto,
  UpdateAcademicLevelDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateClassDto,
  UpdateClassDto,
  CreateSectionDto,
  UpdateSectionDto,
  CreateLanguageDto,
  UpdateLanguageDto,
} from '@campus-os/types';

@Controller('academic')
export class AcademicController {
  constructor(
    private readonly academicService: AcademicService,
    private readonly workingContextService: WorkingContextService
  ) {}

  /**
   * Resolves the effective campus IDs from working context headers.
   * Returns undefined when no context is active (admin full-view mode).
   */
  private resolveEffectiveCampusIds(
    tenantId: string,
    contextNodeId?: string,
    contextNodeType?: string,
    userRole?: string
  ): string[] | undefined {
    if (!contextNodeId || contextNodeId === 'ALL' || contextNodeId === 'DEFAULT') {
      return undefined;
    }
    try {
      const scope = this.workingContextService.resolveEffectiveScope(
        {
          organizationId: tenantId,
          userRole: userRole || 'SCHOOL_ADMIN',
        },
        contextNodeId,
        contextNodeType as any
      );
      return scope.effectiveCampusIds.length > 0 ? scope.effectiveCampusIds : undefined;
    } catch {
      return undefined;
    }
  }


  // ── 1. ACADEMIC YEARS ───────────────────────────────────────────────────
  @Get('academic-years')
  async listAcademicYears(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('x-working-context-id') contextNodeId?: string,
    @Headers('x-working-context-type') contextNodeType?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    const effectiveCampusIds = this.resolveEffectiveCampusIds(resolvedTenant, contextNodeId, contextNodeType, userRole);
    return this.academicService.listAcademicYears(
      resolvedTenant,
      effectiveCampusIds,
      search,
      status,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Post('academic-years')
  async createAcademicYear(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body() dto: CreateAcademicYearDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createAcademicYear(
      resolvedTenant,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('academic-years/:id')
  async updateAcademicYear(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicYearDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateAcademicYear(
      resolvedTenant,
      id,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('academic-years/:id/status')
  async toggleAcademicYearStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleAcademicYearStatus(
      resolvedTenant,
      id,
      isActive,
      userId,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  // ── 2. BOARDS ───────────────────────────────────────────────────────────
  @Get('boards')
  async listBoards(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('x-working-context-id') contextNodeId?: string,
    @Headers('x-working-context-type') contextNodeType?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    const effectiveCampusIds = this.resolveEffectiveCampusIds(resolvedTenant, contextNodeId, contextNodeType, userRole);
    return this.academicService.listBoards(
      resolvedTenant,
      effectiveCampusIds,
      search,
      status,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Post('boards')
  async createBoard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body() dto: CreateBoardDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createBoard(
      resolvedTenant,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('boards/:id')
  async updateBoard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoardDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateBoard(
      resolvedTenant,
      id,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('boards/:id/status')
  async toggleBoardStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleBoardStatus(
      resolvedTenant,
      id,
      isActive,
      userId,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  // ── 3. ACADEMIC LEVELS / STAGES ─────────────────────────────────────────
  @Get('levels')
  async listAcademicLevels(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('x-working-context-id') contextNodeId?: string,
    @Headers('x-working-context-type') contextNodeType?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    const effectiveCampusIds = this.resolveEffectiveCampusIds(resolvedTenant, contextNodeId, contextNodeType, userRole);
    return this.academicService.listAcademicLevels(
      resolvedTenant,
      effectiveCampusIds,
      search,
      status,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Post('levels')
  async createAcademicLevel(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body() dto: CreateAcademicLevelDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createAcademicLevel(
      resolvedTenant,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('levels/:id')
  async updateAcademicLevel(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicLevelDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateAcademicLevel(
      resolvedTenant,
      id,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('levels/:id/status')
  async toggleAcademicLevelStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleAcademicLevelStatus(
      resolvedTenant,
      id,
      isActive,
      userId,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  // ── 4. SUBJECTS ─────────────────────────────────────────────────────────
  @Get('subjects')
  async listSubjects(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('x-working-context-id') contextNodeId?: string,
    @Headers('x-working-context-type') contextNodeType?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    const effectiveCampusIds = this.resolveEffectiveCampusIds(resolvedTenant, contextNodeId, contextNodeType, userRole);
    return this.academicService.listSubjects(
      resolvedTenant,
      effectiveCampusIds,
      search,
      status,
      type,
      category,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Post('subjects')
  async createSubject(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body() dto: CreateSubjectDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createSubject(
      resolvedTenant,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('subjects/:id')
  async updateSubject(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateSubject(
      resolvedTenant,
      id,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('subjects/:id/status')
  async toggleSubjectStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleSubjectStatus(
      resolvedTenant,
      id,
      isActive,
      userId,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  // ── 5. CLASSES / GRADES ─────────────────────────────────────────────────
  @Get('classes')
  async listClasses(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('x-working-context-id') contextNodeId?: string,
    @Headers('x-working-context-type') contextNodeType?: string,
    @Query('levelId') levelId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    const effectiveCampusIds = this.resolveEffectiveCampusIds(resolvedTenant, contextNodeId, contextNodeType, userRole);
    return this.academicService.listClasses(
      resolvedTenant,
      effectiveCampusIds,
      search,
      status,
      levelId,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Post('classes')
  async createClass(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body() dto: CreateClassDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createClass(
      resolvedTenant,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('classes/:id')
  async updateClass(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateClass(
      resolvedTenant,
      id,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('classes/:id/status')
  async toggleClassStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleClassStatus(
      resolvedTenant,
      id,
      isActive,
      userId,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  // ── 6. SECTIONS ─────────────────────────────────────────────────────────
  @Get('sections')
  async listSections(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('x-working-context-id') contextNodeId?: string,
    @Headers('x-working-context-type') contextNodeType?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    const effectiveCampusIds = this.resolveEffectiveCampusIds(resolvedTenant, contextNodeId, contextNodeType, userRole);
    return this.academicService.listSections(
      resolvedTenant,
      effectiveCampusIds,
      search,
      status,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Post('sections')
  async createSection(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body() dto: CreateSectionDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createSection(
      resolvedTenant,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('sections/:id')
  async updateSection(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectionDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateSection(
      resolvedTenant,
      id,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('sections/:id/status')
  async toggleSectionStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleSectionStatus(
      resolvedTenant,
      id,
      isActive,
      userId,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  // ── 7. LANGUAGES ────────────────────────────────────────────────────────
  @Get('languages')
  async listLanguages(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('x-working-context-id') contextNodeId?: string,
    @Headers('x-working-context-type') contextNodeType?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    const effectiveCampusIds = this.resolveEffectiveCampusIds(resolvedTenant, contextNodeId, contextNodeType, userRole);
    return this.academicService.listLanguages(
      resolvedTenant,
      effectiveCampusIds,
      search,
      status,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Post('languages')
  async createLanguage(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body() dto: CreateLanguageDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createLanguage(
      resolvedTenant,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('languages/:id')
  async updateLanguage(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLanguageDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateLanguage(
      resolvedTenant,
      id,
      dto,
      userId,
      undefined,
      userRole || 'SCHOOL_ADMIN'
    );
  }

  @Patch('languages/:id/status')
  async toggleLanguageStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleLanguageStatus(
      resolvedTenant,
      id,
      isActive,
      userId,
      userRole || 'SCHOOL_ADMIN'
    );
  }
}
