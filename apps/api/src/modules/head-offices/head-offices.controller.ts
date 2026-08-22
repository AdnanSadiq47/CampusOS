import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HeadOfficesService } from './head-offices.service.js';
import {
  CreateHeadOfficeDto,
  UpdateHeadOfficeDto,
} from '@campus-os/types';

// Default tenant for local preview before JWT middleware binds session
const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_USER_ID = '99999999-9999-9999-9999-999999999999';

@Controller('head-offices')
export class HeadOfficesController {
  constructor(private readonly headOfficesService: HeadOfficesService) {}

  @Get()
  async listHeadOffices(
    @Query('tenantId') tenantId?: string,
    @Query('activeOnly') activeOnly?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    const isActiveOnly = activeOnly === 'true';
    return this.headOfficesService.listHeadOffices(orgId, isActiveOnly);
  }

  @Get('eligible-parents')
  async getEligibleParents(@Query('tenantId') tenantId?: string) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.headOfficesService.getEligibleParents(orgId);
  }

  @Get(':id')
  async getHeadOffice(
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.headOfficesService.getHeadOffice(orgId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createHeadOffice(
    @Body() dto: CreateHeadOfficeDto,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.headOfficesService.createHeadOffice(orgId, dto, DEMO_USER_ID);
  }

  @Patch(':id')
  async updateHeadOffice(
    @Param('id') id: string,
    @Body() dto: UpdateHeadOfficeDto,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.headOfficesService.updateHeadOffice(orgId, id, dto, DEMO_USER_ID);
  }

  @Patch(':id/status')
  async toggleHeadOfficeStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.headOfficesService.toggleHeadOfficeStatus(orgId, id, isActive, DEMO_USER_ID);
  }
}
