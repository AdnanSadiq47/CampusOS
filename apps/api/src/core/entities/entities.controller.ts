import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { EntitiesService } from './entities.service.js';
import { AuthGuard } from '../iam/guards/auth.guard.js';
import { CreateEntityDto, CreateEntityFieldDto, QueryEntityRecordsDto } from '@campus-os/types';

interface AuthenticatedRequest {
  user: {
    sub: string;
    orgId: string;
  };
}

@UseGuards(AuthGuard)
@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post()
  async createEntity(@Req() req: AuthenticatedRequest, @Body() dto: CreateEntityDto) {
    return this.entitiesService.createEntity(req.user.orgId, dto);
  }

  @Get()
  async listEntities(@Req() req: AuthenticatedRequest) {
    return this.entitiesService.listEntities(req.user.orgId);
  }

  @Post(':id/fields')
  async addField(
    @Req() req: AuthenticatedRequest,
    @Param('id') entityId: string,
    @Body() dto: CreateEntityFieldDto
  ) {
    return this.entitiesService.addField(req.user.orgId, entityId, dto);
  }

  @Post(':code/records')
  async createRecord(
    @Req() req: AuthenticatedRequest,
    @Param('code') entityCode: string,
    @Body() body: { hierarchyNodeId: string; data: Record<string, unknown> }
  ) {
    return this.entitiesService.createRecord(
      req.user.orgId,
      entityCode,
      body.hierarchyNodeId,
      body.data,
      req.user.sub
    );
  }

  @Get(':code/records')
  async queryRecords(
    @Req() req: AuthenticatedRequest,
    @Param('code') entityCode: string,
    @Query('hierarchyNodeId') hierarchyNodeId?: string,
    @Query('includeSubtree') includeSubtree?: string
  ) {
    const dto: QueryEntityRecordsDto = {
      entityCode,
      hierarchyNodeId,
      includeSubtree: includeSubtree === 'true',
    };
    return this.entitiesService.queryRecords(req.user.orgId, dto);
  }
}
