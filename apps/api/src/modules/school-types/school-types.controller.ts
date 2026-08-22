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
import { SchoolTypesService } from './school-types.service.js';
import {
  CreateSchoolTypeDto,
  UpdateSchoolTypeDto,
} from '@campus-os/types';

// Temporary tenant ID for local development before full JWT session injection
const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_USER_ID = '99999999-9999-9999-9999-999999999999';

@Controller('school-types')
export class SchoolTypesController {
  constructor(private readonly schoolTypesService: SchoolTypesService) {}

  @Get()
  async listSchoolTypes(
    @Query('tenantId') tenantId?: string,
    @Query('activeOnly') activeOnly?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    const isActiveOnly = activeOnly === 'true';
    return this.schoolTypesService.listSchoolTypes(orgId, isActiveOnly);
  }

  @Get(':id')
  async getSchoolType(
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.schoolTypesService.getSchoolType(orgId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSchoolType(
    @Body() dto: CreateSchoolTypeDto,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.schoolTypesService.createSchoolType(orgId, dto, DEMO_USER_ID);
  }

  @Patch(':id')
  async updateSchoolType(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolTypeDto,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.schoolTypesService.updateSchoolType(orgId, id, dto, DEMO_USER_ID);
  }

  @Patch(':id/status')
  async toggleSchoolTypeStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.schoolTypesService.toggleSchoolTypeStatus(orgId, id, isActive, DEMO_USER_ID);
  }
}
