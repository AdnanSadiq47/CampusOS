import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FormsService } from './forms.service.js';
import { AuthGuard } from '../iam/guards/auth.guard.js';
import { CreateFormDto, SaveFormVersionDto } from '@campus-os/types';

interface AuthenticatedRequest {
  user: {
    sub: string;
    orgId: string;
  };
}

@UseGuards(AuthGuard)
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  async createForm(@Req() req: AuthenticatedRequest, @Body() dto: CreateFormDto) {
    return this.formsService.createForm(req.user.orgId, dto);
  }

  @Get()
  async listForms(@Req() req: AuthenticatedRequest) {
    return this.formsService.listForms(req.user.orgId);
  }

  @Put(':id/draft')
  async saveDraft(
    @Req() req: AuthenticatedRequest,
    @Param('id') formId: string,
    @Body() dto: SaveFormVersionDto
  ) {
    return this.formsService.saveDraft(req.user.orgId, formId, dto);
  }

  @Post(':id/publish')
  async publishVersion(@Req() req: AuthenticatedRequest, @Param('id') formId: string) {
    return this.formsService.publishVersion(req.user.orgId, formId, req.user.sub);
  }

  @Get(':code/published')
  async getPublishedForm(@Req() req: AuthenticatedRequest, @Param('code') formCode: string) {
    return this.formsService.getPublishedForm(req.user.orgId, formCode);
  }
}
