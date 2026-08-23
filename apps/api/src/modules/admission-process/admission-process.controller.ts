import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Headers,
} from '@nestjs/common';
import { AdmissionProcessService, UserScopeContext } from './admission-process.service.js';
import {
  AdmissionProcessDto,
  AdmissionProcessVersionDto,
  CreateAdmissionProcessDto,
  UpdateAdmissionProcessDto,
} from '@campus-os/types';

@Controller('admin/admission-processes')
export class AdmissionProcessController {
  constructor(private readonly processService: AdmissionProcessService) {}

  private extractUserScope(headers: Record<string, any>): UserScopeContext {
    const orgId = headers['x-tenant-id'] || '11111111-1111-1111-1111-111111111111';
    const role = headers['x-user-role'] || 'ADMIN';
    const campusHeader = headers['x-authorized-campuses'];
    const schoolHeader = headers['x-authorized-schools'];

    return {
      organizationId: orgId,
      userRole: role,
      isSuperAdmin: role === 'SUPER_ADMIN' || !campusHeader,
      authorizedCampusIds: campusHeader ? String(campusHeader).split(',').map((s) => s.trim()) : undefined,
      authorizedSchoolIds: schoolHeader ? String(schoolHeader).split(',').map((s) => s.trim()) : undefined,
    };
  }

  @Get()
  async getProcesses(@Headers() headers: Record<string, any>): Promise<AdmissionProcessDto[]> {
    const userScope = this.extractUserScope(headers);
    return this.processService.getProcesses(userScope);
  }

  @Get(':id')
  async getProcessById(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionProcessDto> {
    const userScope = this.extractUserScope(headers);
    return this.processService.getProcessById(id, userScope);
  }

  @Post()
  async createProcess(
    @Body() dto: CreateAdmissionProcessDto,
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionProcessDto> {
    const userScope = this.extractUserScope(headers);
    return this.processService.createProcess(dto, userScope);
  }

  @Put(':id')
  async updateProcess(
    @Param('id') id: string,
    @Body() dto: UpdateAdmissionProcessDto,
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionProcessDto> {
    const userScope = this.extractUserScope(headers);
    return this.processService.updateProcess(id, dto, userScope);
  }

  @Patch(':id/activate')
  async activateProcess(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionProcessDto> {
    const userScope = this.extractUserScope(headers);
    return this.processService.activateProcess(id, userScope);
  }

  @Patch(':id/deactivate')
  async deactivateProcess(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionProcessDto> {
    const userScope = this.extractUserScope(headers);
    return this.processService.deactivateProcess(id, userScope);
  }

  @Get(':id/versions')
  async getVersions(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionProcessVersionDto[]> {
    const userScope = this.extractUserScope(headers);
    return this.processService.getVersions(id, userScope);
  }
}
