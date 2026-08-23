import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Headers,
} from '@nestjs/common';
import { AdmissionsService, UserScopeContext } from './admissions.service.js';
import {
  PreAdmissionsFilterDto,
  PaginatedPreAdmissionsDto,
  PreAdmissionApplicationDto,
  CreatePreAdmissionDto,
  AssignAdmissionProcessDto,
  PreAdmissionStatus,
} from '@campus-os/types';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  private extractUserScope(headers: Record<string, any>): UserScopeContext {
    const orgId = headers['x-tenant-id'] || '11111111-1111-1111-1111-111111111111';
    const role = headers['x-user-role'] || 'ADMIN';
    const campusHeader = headers['x-authorized-campuses'];
    const schoolHeader = headers['x-authorized-schools'];
    const regionHeader = headers['x-authorized-regions'];

    return {
      organizationId: orgId,
      userRole: role,
      isSuperAdmin: role === 'SUPER_ADMIN' || !campusHeader,
      authorizedCampusIds: campusHeader ? String(campusHeader).split(',').map((s) => s.trim()) : undefined,
      authorizedSchoolIds: schoolHeader ? String(schoolHeader).split(',').map((s) => s.trim()) : undefined,
      authorizedRegionIds: regionHeader ? String(regionHeader).split(',').map((s) => s.trim()) : undefined,
    };
  }

  // Pre-Admissions List (and legacy applications alias)
  @Get('pre-admissions')
  async getPreAdmissions(
    @Query() query: PreAdmissionsFilterDto,
    @Headers() headers: Record<string, any>
  ): Promise<PaginatedPreAdmissionsDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getPreAdmissions(query, userScope);
  }

  @Get('applications')
  async getApplicationsLegacy(
    @Query() query: PreAdmissionsFilterDto,
    @Headers() headers: Record<string, any>
  ): Promise<PaginatedPreAdmissionsDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getPreAdmissions(query, userScope);
  }

  // Single Pre-Admission Detail
  @Get('pre-admissions/:id')
  async getPreAdmissionById(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getPreAdmissionById(id, userScope);
  }

  @Get('applications/:id')
  async getApplicationByIdLegacy(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getPreAdmissionById(id, userScope);
  }

  // Create Pre-Admission (Unified Staff Entry & Public Online)
  @Post('pre-admissions')
  async createPreAdmission(
    @Body() dto: CreatePreAdmissionDto,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = headers['x-user-role'] ? this.extractUserScope(headers) : undefined;
    return this.admissionsService.createPreAdmission(dto, userScope);
  }

  // Manual Process Assignment
  @Post('pre-admissions/:id/assign-process')
  async assignProcess(
    @Param('id') id: string,
    @Body() body: AssignAdmissionProcessDto,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.assignProcess(id, body.processDefinitionId, userScope);
  }

  // Status update
  @Patch('pre-admissions/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PreAdmissionStatus; reviewNotes?: string },
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.updateStatus(id, body.status, userScope);
  }
}
