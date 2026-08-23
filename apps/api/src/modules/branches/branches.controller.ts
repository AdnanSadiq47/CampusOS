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
import { BranchesService } from './branches.service.js';
import {
  CreateBranchDto,
  UpdateBranchDto,
} from '@campus-os/types';

// Default tenant for local preview before JWT middleware binds session
const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_USER_ID = '99999999-9999-9999-9999-999999999999';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  async listBranches(
    @Query('tenantId') tenantId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('activeOnly') activeOnly?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    const isActiveOnly = activeOnly === 'true';
    return this.branchesService.listBranches(orgId, {
      schoolId: schoolId || undefined,
      activeOnly: isActiveOnly,
    });
  }

  @Get('eligible-schools')
  async getEligibleSchools(@Query('tenantId') tenantId?: string) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.branchesService.getEligibleSchools(orgId);
  }

  @Get(':id')
  async getBranch(
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.branchesService.getBranch(orgId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBranch(
    @Body() dto: CreateBranchDto,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.branchesService.createBranch(orgId, dto, DEMO_USER_ID);
  }

  @Patch(':id')
  async updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.branchesService.updateBranch(orgId, id, dto, DEMO_USER_ID);
  }

  @Patch(':id/status')
  async toggleBranchStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Query('tenantId') tenantId?: string
  ) {
    const orgId = tenantId || DEMO_TENANT_ID;
    return this.branchesService.toggleBranchStatus(orgId, id, isActive, DEMO_USER_ID);
  }
}
