import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { DisplayPreferencesService } from './display-preferences.service.js';
import { SaveDisplayPreferencesDto } from '@campus-os/types';

const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER_ID = '99999999-9999-9999-9999-999999999999';

@Controller('display-preferences')
export class DisplayPreferencesController {
  constructor(private readonly displayPreferencesService: DisplayPreferencesService) {}

  private resolveTenant(tenantHeader?: string, tenantQuery?: string): string {
    return tenantHeader || tenantQuery || DEFAULT_TENANT_ID;
  }

  private assertAuthorization(
    userPermissions?: string,
    userScopeHeader?: string,
    targetSchoolId?: string | null
  ) {
    if (!userPermissions) return;
    const perms = userPermissions.split(',').map((p) => p.trim());
    const isSuperAdmin = perms.includes('SUPER_ADMIN');
    const isOrgAdmin = perms.includes('MANAGE_ORGANIZATION') || perms.includes('CONFIG_UPDATE');
    const isSchoolAdmin = perms.includes('MANAGE_SCHOOL') || perms.includes('SCHOOL_UPDATE');

    if (!isSuperAdmin && !isOrgAdmin && !isSchoolAdmin) {
      throw new ForbiddenException('You do not have permission to manage display preferences.');
    }

    if (!targetSchoolId && !isSuperAdmin && !isOrgAdmin) {
      throw new ForbiddenException('Only Organization Administrators can modify Organization Default display preferences.');
    }

    if (targetSchoolId && userScopeHeader && !isSuperAdmin) {
      let parsed: any = null;
      try {
        parsed = typeof userScopeHeader === 'string' ? JSON.parse(userScopeHeader) : userScopeHeader;
      } catch {}

      if (parsed?.authorizedSchools && Array.isArray(parsed.authorizedSchools)) {
        if (!parsed.authorizedSchools.includes(targetSchoolId)) {
          throw new ForbiddenException(`You are not authorized to modify preferences for school "${targetSchoolId}".`);
        }
      }
    }
  }

  @Get()
  async getPreferences(
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Query('schoolId') schoolId?: string,
    @Query('campusId') campusId?: string
  ) {
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    return this.displayPreferencesService.getResolvedPreferences(orgId, { schoolId, campusId });
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async savePreferences(
    @Body() body: SaveDisplayPreferencesDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string
  ) {
    const orgId = this.resolveTenant(tenantHeader, tenantQuery);
    this.assertAuthorization(userPermissions, userScopeHeader, body.schoolId);
    const userId = userIdHeader || DEFAULT_USER_ID;
    return this.displayPreferencesService.savePreferences(orgId, body, userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async patchPreferences(
    @Body() body: SaveDisplayPreferencesDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('tenantId') tenantQuery?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-permissions') userPermissions?: string,
    @Headers('x-user-scope') userScopeHeader?: string
  ) {
    return this.savePreferences(body, tenantHeader, tenantQuery, userIdHeader, userPermissions, userScopeHeader);
  }
}