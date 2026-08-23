import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FormsService } from './forms.service.js';
import {
  CreateFormDefinitionDto,
  SaveFormDraftDto,
  PublishFormVersionDto,
  CreateCustomFieldDto,
  FormPurpose,
} from '@campus-os/types';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // ── Field Library Endpoints ───────────────────────────────────────
  @Get('fields')
  async listFieldLibrary(
    @Headers('x-tenant-id') tenantId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('origin') origin?: string
  ) {
    return this.formsService.listFieldLibrary(tenantId, category, search, origin);
  }

  @Post('fields')
  async createCustomField(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorUserId: string,
    @Body() dto: CreateCustomFieldDto
  ) {
    return this.formsService.createCustomField(tenantId, dto, actorUserId);
  }

  // ── Form Definitions Endpoints ────────────────────────────────────
  @Get('definitions')
  async listFormDefinitions(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string = 'SCHOOL_ADMIN',
    @Query('campusId') campusId?: string,
    @Query('formPurpose') formPurpose?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    return this.formsService.listFormDefinitions(tenantId, campusId, formPurpose, search, status, userRole);
  }

  @Get('definitions/:id')
  async getFormDefinition(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string = 'SCHOOL_ADMIN',
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.formsService.getFormDefinition(tenantId, id, userRole);
  }

  @Post('definitions')
  async createFormDefinition(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorUserId: string,
    @Headers('x-user-role') userRole: string = 'SCHOOL_ADMIN',
    @Body() dto: CreateFormDefinitionDto
  ) {
    return this.formsService.createFormDefinition(tenantId, dto, actorUserId, undefined, userRole);
  }

  @Put('definitions/:id/draft')
  async saveFormDraft(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorUserId: string,
    @Headers('x-user-role') userRole: string = 'SCHOOL_ADMIN',
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveFormDraftDto
  ) {
    return this.formsService.saveFormDraft(tenantId, id, dto, actorUserId, userRole);
  }

  @Post('definitions/:id/publish')
  async publishFormVersion(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorUserId: string,
    @Headers('x-user-role') userRole: string = 'SCHOOL_ADMIN',
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishFormVersionDto
  ) {
    return this.formsService.publishFormVersion(tenantId, id, dto, actorUserId, userRole);
  }

  @Post('definitions/:id/new-version')
  async createNewVersion(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorUserId: string,
    @Headers('x-user-role') userRole: string = 'SCHOOL_ADMIN',
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.formsService.createNewVersion(tenantId, id, actorUserId, userRole);
  }

  @Put('definitions/:id/archive')
  async archiveForm(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorUserId: string,
    @Headers('x-user-role') userRole: string = 'SCHOOL_ADMIN',
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.formsService.archiveForm(tenantId, id, actorUserId, userRole);
  }

  // ── Centralized Runtime Resolver Endpoint ─────────────────────────
  @Get('resolve')
  async resolvePublishedForm(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-role') userRole: string = 'CAMPUS_ADMIN',
    @Query('formPurpose') formPurpose: FormPurpose,
    @Query('campusId') campusId: string
  ) {
    return this.formsService.resolvePublishedForm(tenantId, formPurpose, campusId, userRole);
  }

  // ── Form Templates Endpoint ───────────────────────────────────────
  @Get('templates')
  async listTemplates(@Headers('x-tenant-id') tenantId: string) {
    return this.formsService.listTemplates(tenantId);
  }
}
