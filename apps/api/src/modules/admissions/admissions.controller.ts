import { Controller, Get, Patch, Param, Query, Body, Headers } from '@nestjs/common';
import { AdmissionsService, UserScopeContext } from './admissions.service.js';
import {
  AdmissionApplicationsFilterDto,
  AdmissionStatus,
  PaginatedAdmissionApplicationsDto,
  AdmissionApplicationListItemDto,
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

  @Get('applications')
  async getApplications(
    @Query() query: AdmissionApplicationsFilterDto,
    @Headers() headers: Record<string, any>
  ): Promise<PaginatedAdmissionApplicationsDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getApplications(query, userScope);
  }

  @Get('applications/:id')
  async getApplicationById(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionApplicationListItemDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getApplicationById(id, userScope);
  }

  @Patch('applications/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AdmissionStatus; reviewNotes?: string },
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionApplicationListItemDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.updateStatus(id, body.status, userScope, body.reviewNotes);
  }
}
