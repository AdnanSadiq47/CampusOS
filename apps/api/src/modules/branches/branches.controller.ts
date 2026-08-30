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
import { BranchesService } from './branches.service.js';
import {
  CreateBranchDto,
  UpdateBranchDto,
  ReorderBranchesDto,
} from '@campus-os/types';

const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_USER_ID = '99999999-9999-9999-9999-999999999999';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  async listBranches(
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string,
    @Query('schoolId') schoolId?: string,
    @Query('activeOnly') activeOnly?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    const isActiveOnly = activeOnly === 'true';
    return this.branchesService.listBranches(orgId, {
      schoolId: schoolId || undefined,
      activeOnly: isActiveOnly,
    });
  }

  @Get('eligible-schools')
  async getEligibleSchools(
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    return this.branchesService.getEligibleSchools(orgId);
  }

  @Get('next-sort-order')
  async getNextSortOrder(
    @Query('schoolId') schoolId: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    return this.branchesService.getNextSortOrder(orgId, schoolId);
  }

  @Get('suggest-username')
  async suggestUsername(
    @Query('schoolId') schoolId?: string,
    @Query('branchCode') branchCode?: string,
    @Query('branchName') branchName?: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    return this.branchesService.suggestUsername(orgId, schoolId, branchCode, branchName);
  }

  @Patch('reorder')
  async reorderBranches(
    @Body() dto: ReorderBranchesDto,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    const userId = userIdHeader || DEMO_USER_ID;
    return this.branchesService.reorderBranches(orgId, dto, userId);
  }

  @Get(':id')
  async getBranch(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    return this.branchesService.getBranchById(orgId, id);
  }

  @Get(':id/dependencies')
  async getDependencies(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    return this.branchesService.getDependencies(orgId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBranch(
    @Body() dto: CreateBranchDto,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    const userId = userIdHeader || DEMO_USER_ID;
    return this.branchesService.createBranch(orgId, dto, userId);
  }

  @Patch(':id')
  async updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    const userId = userIdHeader || DEMO_USER_ID;
    return this.branchesService.updateBranch(orgId, id, dto, userId);
  }

  @Patch(':id/status')
  async toggleBranchStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    const userId = userIdHeader || DEMO_USER_ID;
    return this.branchesService.toggleBranchStatus(orgId, id, isActive, userId);
  }

  @Delete(':id')
  async deleteBranch(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Query('tenantId') tenantIdQuery?: string
  ) {
    const orgId = tenantIdHeader || tenantIdQuery || DEMO_TENANT_ID;
    const userId = userIdHeader || DEMO_USER_ID;
    return this.branchesService.deleteBranch(orgId, id, userId);
  }
}
