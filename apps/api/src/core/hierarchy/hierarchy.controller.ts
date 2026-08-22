import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { HierarchyService } from './hierarchy.service.js';
import { AuthGuard } from '../iam/guards/auth.guard.js';
import { RbacGuard } from '../iam/guards/rbac.guard.js';
import { RequirePermission } from '../iam/decorators/require-permission.decorator.js';
import { CreateHierarchyNodeTypeSchema, CreateHierarchyNodeSchema } from '@campus-os/types';

@Controller('hierarchy')
@UseGuards(AuthGuard, RbacGuard)
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get('types')
  @RequirePermission('core', 'hierarchy_node_types', 'READ')
  async listNodeTypes(@Req() req: Request) {
    return this.hierarchyService.listNodeTypes(req.tenant!.organizationId);
  }

  @Post('types')
  @RequirePermission('core', 'hierarchy_node_types', 'CREATE')
  async createNodeType(@Body() body: unknown, @Req() req: Request) {
    const parse = CreateHierarchyNodeTypeSchema.safeParse(body);
    if (!parse.success) throw new BadRequestException(parse.error.message);
    return this.hierarchyService.createNodeType(req.tenant!.organizationId, parse.data);
  }

  @Get('nodes')
  @RequirePermission('core', 'hierarchy_nodes', 'READ')
  async listNodes(@Req() req: Request) {
    return this.hierarchyService.listNodes(req.tenant!.organizationId);
  }

  @Post('nodes')
  @RequirePermission('core', 'hierarchy_nodes', 'CREATE')
  async createNode(@Body() body: unknown, @Req() req: Request) {
    const parse = CreateHierarchyNodeSchema.safeParse(body);
    if (!parse.success) throw new BadRequestException(parse.error.message);
    return this.hierarchyService.createNode(req.tenant!.organizationId, parse.data);
  }
}
