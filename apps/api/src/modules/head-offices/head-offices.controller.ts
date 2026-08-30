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
import { HeadOfficesService } from './head-offices.service.js';
import {
  CreateHeadOfficeDto,
  UpdateHeadOfficeDto,
} from '@campus-os/types';

const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER_ID = '99999999-9999-9999-9999-999999999999';

function parseUserScope(
  userScopeHeader?: string,
  authHOs?: string,
  authRegions?: string,
  authSchools?: string
) {
  let authorizedHeadOffices = authHOs ? authHOs.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  let authorizedRegions = authRegions ? authRegions.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  let authorizedSchools = authSchools ? authSchools.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

  if (userScopeHeader) {
    try {
      const parsed = typeof userScopeHeader === 'string' ? JSON.parse(userScopeHeader) : userScopeHeader;
      if (parsed.authorizedHeadOffices) authorizedHeadOffices = parsed.authorizedHeadOffices;
      if (parsed.authorizedRegions) authorizedRegions = parsed.authorizedRegions;
      if (parsed.authorizedSchools) authorizedSchools = parsed.authorizedSchools;
    } catch {}
  }

  return { authorizedHeadOffices, authorizedRegions, authorizedSchools };
}

@Controller('head-offices')
export class HeadOfficesController {
  constructor(private readonly headOfficesService: HeadOfficesService) {}

  private resolveTenant(tenantHeader?: string, tenantQuery?: string): string {
    return tenantHeader || tenantQuery || DEFAULT_TENANT_ID;
  }

  @Get()
  async listHeadOffices(
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Query('activeOnly') activeOnly?: string,
    @Headers('x-user-permissions') userPermissions?: string
  ) {
    this.headOfficesService.assertPermission(userPermissions, 'HEAD_OFFICE_VIEW');
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    const isActiveOnly = activeOnly === 'true';
    return this.headOfficesService.listHeadOffices(orgId, isActiveOnly);
  }

  @Get('eligible-parents')
  async getEligibleParents(
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string
  ) {
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.headOfficesService.getEligibleParents(orgId);
  }

  @Get(':id/dependencies')
  async getHeadOfficeDependencies(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string
  ) {
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.headOfficesService.getHeadOfficeDependencies(orgId, id);
  }

  @Get(':id')
  async getHeadOffice(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-head-offices') authHOs?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.headOfficesService.assertPermission(userPermissions, 'HEAD_OFFICE_VIEW');
    const scope = parseUserScope(userScopeHeader, authHOs, authRegions, authSchools);
    this.headOfficesService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.headOfficesService.getHeadOffice(orgId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createHeadOffice(
    @Body() dto: CreateHeadOfficeDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-head-offices') authHOs?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.headOfficesService.assertPermission(userPermissions, 'HEAD_OFFICE_CREATE');
    const scope = parseUserScope(userScopeHeader, authHOs, authRegions, authSchools);
    this.headOfficesService.assertScope(scope);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.headOfficesService.createHeadOffice(orgId, dto, userIdHeader || DEFAULT_USER_ID);
  }

  @Patch(':id')
  async updateHeadOffice(
    @Param('id') id: string,
    @Body() dto: UpdateHeadOfficeDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-head-offices') authHOs?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.headOfficesService.assertPermission(userPermissions, 'HEAD_OFFICE_EDIT');
    const scope = parseUserScope(userScopeHeader, authHOs, authRegions, authSchools);
    this.headOfficesService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.headOfficesService.updateHeadOffice(orgId, id, dto, userIdHeader || DEFAULT_USER_ID);
  }

  @Patch(':id/status')
  async toggleHeadOfficeStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-head-offices') authHOs?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    this.headOfficesService.assertPermission(userPermissions, 'HEAD_OFFICE_STATUS_CHANGE');
    const scope = parseUserScope(userScopeHeader, authHOs, authRegions, authSchools);
    this.headOfficesService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.headOfficesService.toggleHeadOfficeStatus(orgId, id, isActive, userIdHeader || DEFAULT_USER_ID);
  }

  @Delete(':id')
  async deleteHeadOffice(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string,
    @Headers('x-authorized-head-offices') authHOs?: string,
    @Headers('x-authorized-regions') authRegions?: string,
    @Headers('x-authorized-schools') authSchools?: string
  ) {
    const scope = parseUserScope(userScopeHeader, authHOs, authRegions, authSchools);
    this.headOfficesService.assertScope(scope, id);
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.headOfficesService.deleteHeadOffice(orgId, id, userIdHeader || DEFAULT_USER_ID, userPermissions);
  }
}
