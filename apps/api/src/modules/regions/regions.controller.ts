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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegionsService } from './regions.service.js';
import { CreateRegionDto, UpdateRegionDto } from '@campus-os/types';

const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER_ID = '99999999-9999-9999-9999-999999999999';

function parseUserScope(
  userScopeHeader?: string,
  authRegions?: string,
  authSchools?: string
) {
  let authorizedRegions = authRegions ? authRegions.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  let authorizedSchools = authSchools ? authSchools.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

  if (userScopeHeader) {
    try {
      const parsed = typeof userScopeHeader === 'string' ? JSON.parse(userScopeHeader) : userScopeHeader;
      if (parsed.authorizedRegions) authorizedRegions = parsed.authorizedRegions;
      if (parsed.authorizedSchools) authorizedSchools = parsed.authorizedSchools;
    } catch {}
  }

  return { authorizedRegions, authorizedSchools };
}

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  private resolveTenant(tenantHeader?: string, tenantQuery?: string): string {
    return tenantHeader || tenantQuery || DEFAULT_TENANT_ID;
  }

  @Get()
  async listRegions(
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('parentId') parentId?: string,
    @Query('activeOnly') activeOnly?: string,
    @Headers('x-user-permissions') userPermissions?: string
  ) {
    this.regionsService.assertPermission(userPermissions, 'REGIONAL_OFFICE_VIEW');
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.listRegions(orgId, { search, status, parentId, activeOnly: activeOnly === 'true' });
  }

  @Get('parents')
  async getEligibleParents(
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string
  ) {
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.getEligibleParents(orgId);
  }

  @Get('eligible-parents')
  async getEligibleParentsAlias(
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string
  ) {
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.getEligibleParents(orgId);
  }

  @Get(':id/dependencies')
  async getRegionDependencies(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string
  ) {
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.getRegionDependencies(orgId, id);
  }

  @Get(':id')
  async getRegion(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.regionsService.assertPermission(userPermissions, 'REGIONAL_OFFICE_VIEW');
    const scope = parseUserScope(userScopeHeader, authRegions, authSchools);
    this.regionsService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.getRegion(orgId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRegion(
    @Body() dto: CreateRegionDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.regionsService.assertPermission(userPermissions, 'REGIONAL_OFFICE_CREATE');
    const scope = parseUserScope(userScopeHeader, authRegions, authSchools);
    this.regionsService.assertScope(scope);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.createRegion(orgId, dto, userIdHeader || DEFAULT_USER_ID);
  }

  @Patch(':id')
  async updateRegion(
    @Param('id') id: string,
    @Body() dto: UpdateRegionDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.regionsService.assertPermission(userPermissions, 'REGIONAL_OFFICE_EDIT');
    const scope = parseUserScope(userScopeHeader, authRegions, authSchools);
    this.regionsService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.updateRegion(orgId, id, dto, userIdHeader || DEFAULT_USER_ID);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.regionsService.assertPermission(userPermissions, 'REGIONAL_OFFICE_STATUS_CHANGE');
    const scope = parseUserScope(userScopeHeader, authRegions, authSchools);
    this.regionsService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.toggleRegionStatus(orgId, id, isActive, userIdHeader || DEFAULT_USER_ID);
  }

  @Delete(':id')
  async deleteRegion(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    const scope = parseUserScope(userScopeHeader, authRegions, authSchools);
    this.regionsService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.regionsService.deleteRegion(orgId, id, userIdHeader || DEFAULT_USER_ID, userPermissions);
  }
}
