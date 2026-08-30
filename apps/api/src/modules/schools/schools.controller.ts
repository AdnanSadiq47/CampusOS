import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { SchoolsService } from './schools.service.js';
import { CreateSchoolDto, UpdateSchoolDto } from '@campus-os/types';

function parseUserScope(
  userScopeHeader?: string,
  authSchools?: string,
  authRegions?: string,
  authHOs?: string
) {
  let authorizedSchools = authSchools ? authSchools.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  let authorizedRegions = authRegions ? authRegions.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  let authorizedHeadOffices = authHOs ? authHOs.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

  if (userScopeHeader) {
    try {
      const parsed = typeof userScopeHeader === 'string' ? JSON.parse(userScopeHeader) : userScopeHeader;
      if (parsed.authorizedSchools) authorizedSchools = parsed.authorizedSchools;
      if (parsed.authorizedRegions) authorizedRegions = parsed.authorizedRegions;
      if (parsed.authorizedHeadOffices) authorizedHeadOffices = parsed.authorizedHeadOffices;
    } catch {}
  }

  return { authorizedSchools, authorizedRegions, authorizedHeadOffices };
}

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  private getTenantId(tenantIdHeader?: string): string {
    const tenantId = tenantIdHeader || process.env.DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';
    if (!tenantId) {
      throw new BadRequestException('Missing x-tenant-id header');
    }
    return tenantId;
  }

  @Post()
  async createSchool(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-permissions') permissionsHeader: string,
    @Body() dto: CreateSchoolDto
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.createSchool(tenantId, dto, userId, permissionsHeader);
  }

  @Get()
  async listSchools(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Headers('x-user-permissions') permissionsHeader: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('parentId') parentId?: string,
    @Query('headOfficeId') headOfficeId?: string,
    @Query('regionId') regionId?: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.listSchools(
      tenantId,
      { search, status, parentId, headOfficeId, regionId },
      permissionsHeader
    );
  }

  @Get('parents')
  async getEligibleParents(@Headers('x-tenant-id') tenantIdHeader: string) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.getEligibleParents(tenantId);
  }

  @Get(':id/dependencies')
  async getDependencies(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Headers('x-user-permissions') permissionsHeader: string,
    @Param('id') id: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.getDependencies(tenantId, id, permissionsHeader);
  }

  @Get(':id')
  async getSchool(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Headers('x-user-permissions') permissionsHeader: string,
    @Param('id') id: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-schools') authSchools?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-head-offices') authHOs?: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    const scope = parseUserScope(userScopeHeader, authSchools, authRegions, authHOs);
    this.schoolsService.assertScope(scope, id);
    return this.schoolsService.getSchool(tenantId, id, permissionsHeader);
  }

  @Patch(':id')
  async updateSchool(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-permissions') permissionsHeader: string,
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-schools') authSchools?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-head-offices') authHOs?: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    const scope = parseUserScope(userScopeHeader, authSchools, authRegions, authHOs);
    this.schoolsService.assertScope(scope, id);
    return this.schoolsService.updateSchool(tenantId, id, dto, userId, permissionsHeader);
  }

  @Patch(':id/status')
  async toggleSchoolStatus(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-permissions') permissionsHeader: string,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-schools') authSchools?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-head-offices') authHOs?: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    const scope = parseUserScope(userScopeHeader, authSchools, authRegions, authHOs);
    this.schoolsService.assertScope(scope, id);
    return this.schoolsService.toggleSchoolStatus(tenantId, id, isActive, userId, permissionsHeader);
  }

  @Delete(':id')
  async deleteSchool(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-permissions') permissionsHeader: string,
    @Param('id') id: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-schools') authSchools?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-head-offices') authHOs?: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    const scope = parseUserScope(userScopeHeader, authSchools, authRegions, authHOs);
    this.schoolsService.assertScope(scope, id);
    return this.schoolsService.deleteSchool(tenantId, id, userId, permissionsHeader);
  }
}
