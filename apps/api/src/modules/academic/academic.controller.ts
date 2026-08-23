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
  constructor(private readonly academicService: AcademicService) {}

  // ── 1. ACADEMIC YEARS ───────────────────────────────────────────────────
  @Get('academic-years')
  async listAcademicYears(
    @Headers('x-tenant-id') tenantId: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.listAcademicYears(resolvedTenant, campusId, search, status);
  }

  @Post('academic-years')
  async createAcademicYear(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateAcademicYearDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createAcademicYear(resolvedTenant, dto, userId);
  }

  @Patch('academic-years/:id')
  async updateAcademicYear(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicYearDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateAcademicYear(resolvedTenant, id, dto, userId);
  }

  @Patch('academic-years/:id/status')
  async toggleAcademicYearStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleAcademicYearStatus(resolvedTenant, id, isActive, userId);
  }

  // ── 2. BOARDS ───────────────────────────────────────────────────────────
  @Get('boards')
  async listBoards(
    @Headers('x-tenant-id') tenantId: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.listBoards(resolvedTenant, campusId, search, status);
  }

  @Post('boards')
  async createBoard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateBoardDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createBoard(resolvedTenant, dto, userId);
  }

  @Patch('boards/:id')
  async updateBoard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoardDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateBoard(resolvedTenant, id, dto, userId);
  }

  @Patch('boards/:id/status')
  async toggleBoardStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleBoardStatus(resolvedTenant, id, isActive, userId);
  }

  // ── 3. ACADEMIC LEVELS / STAGES ─────────────────────────────────────────
  @Get('levels')
  async listAcademicLevels(
    @Headers('x-tenant-id') tenantId: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.listAcademicLevels(resolvedTenant, campusId, search, status);
  }

  @Post('levels')
  async createAcademicLevel(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateAcademicLevelDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createAcademicLevel(resolvedTenant, dto, userId);
  }

  @Patch('levels/:id')
  async updateAcademicLevel(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicLevelDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateAcademicLevel(resolvedTenant, id, dto, userId);
  }

  @Patch('levels/:id/status')
  async toggleAcademicLevelStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleAcademicLevelStatus(resolvedTenant, id, isActive, userId);
  }

  // ── 4. SUBJECTS ─────────────────────────────────────────────────────────
  @Get('subjects')
  async listSubjects(
    @Headers('x-tenant-id') tenantId: string,
    @Query('campusId') campusId?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.listSubjects(resolvedTenant, campusId, type, category, search, status);
  }

  @Post('subjects')
  async createSubject(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateSubjectDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createSubject(resolvedTenant, dto, userId);
  }

  @Patch('subjects/:id')
  async updateSubject(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateSubject(resolvedTenant, id, dto, userId);
  }

  @Patch('subjects/:id/status')
  async toggleSubjectStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleSubjectStatus(resolvedTenant, id, isActive, userId);
  }

  // ── 5. CLASSES / GRADES ─────────────────────────────────────────────────
  @Get('classes')
  async listClasses(
    @Headers('x-tenant-id') tenantId: string,
    @Query('levelId') levelId?: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.listClasses(resolvedTenant, levelId, campusId, search, status);
  }

  @Post('classes')
  async createClass(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateClassDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createClass(resolvedTenant, dto, userId);
  }

  @Patch('classes/:id')
  async updateClass(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateClass(resolvedTenant, id, dto, userId);
  }

  @Patch('classes/:id/status')
  async toggleClassStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleClassStatus(resolvedTenant, id, isActive, userId);
  }

  // ── 6. SECTIONS ─────────────────────────────────────────────────────────
  @Get('sections')
  async listSections(
    @Headers('x-tenant-id') tenantId: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.listSections(resolvedTenant, campusId, search, status);
  }

  @Post('sections')
  async createSection(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateSectionDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createSection(resolvedTenant, dto, userId);
  }

  @Patch('sections/:id')
  async updateSection(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectionDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateSection(resolvedTenant, id, dto, userId);
  }

  @Patch('sections/:id/status')
  async toggleSectionStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleSectionStatus(resolvedTenant, id, isActive, userId);
  }

  // ── 7. LANGUAGES ────────────────────────────────────────────────────────
  @Get('languages')
  async listLanguages(
    @Headers('x-tenant-id') tenantId: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.listLanguages(resolvedTenant, campusId, search, status);
  }

  @Post('languages')
  async createLanguage(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateLanguageDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.createLanguage(resolvedTenant, dto, userId);
  }

  @Patch('languages/:id')
  async updateLanguage(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLanguageDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.updateLanguage(resolvedTenant, id, dto, userId);
  }

  @Patch('languages/:id/status')
  async toggleLanguageStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.academicService.toggleLanguageStatus(resolvedTenant, id, isActive, userId);
  }
}
