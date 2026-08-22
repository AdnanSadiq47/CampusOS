import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { SchoolsService } from './schools.service.js';
import { CreateSchoolDto, UpdateSchoolDto } from '@campus-os/types';

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
    @Body() dto: CreateSchoolDto
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.createSchool(tenantId, dto);
  }

  @Get()
  async listSchools(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('parentId') parentId?: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.listSchools(tenantId, { search, status, parentId });
  }

  @Get('parents')
  async getEligibleParents(@Headers('x-tenant-id') tenantIdHeader: string) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.getEligibleParents(tenantId);
  }

  @Get(':id')
  async getSchool(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Param('id') id: string
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.getSchool(tenantId, id);
  }

  @Patch(':id')
  async updateSchool(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.updateSchool(tenantId, id, dto);
  }

  @Patch(':id/status')
  async toggleSchoolStatus(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean
  ) {
    const tenantId = this.getTenantId(tenantIdHeader);
    return this.schoolsService.toggleSchoolStatus(tenantId, id, isActive);
  }
}
