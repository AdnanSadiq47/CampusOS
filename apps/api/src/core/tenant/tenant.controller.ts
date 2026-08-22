import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TenantService } from './tenant.service.js';
import { AuthGuard } from '../iam/guards/auth.guard.js';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: Request) {
    if (!req.tenant) return null;
    return this.tenantService.getOrganizationDetails(req.tenant.organizationId);
  }

  @Get('context')
  async getContext(@Req() req: Request) {
    return req.tenant || null;
  }
}
