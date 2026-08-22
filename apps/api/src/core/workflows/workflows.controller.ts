import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WorkflowsService } from './workflows.service.js';
import { AuthGuard } from '../iam/guards/auth.guard.js';
import {
  CreateWorkflowDto,
  CreateWorkflowStateDto,
  CreateWorkflowTransitionDto,
  TriggerWorkflowTransitionDto,
} from '@campus-os/types';

interface AuthenticatedRequest {
  user: {
    sub: string;
    orgId: string;
    membershipId: string;
  };
}

@UseGuards(AuthGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  async createWorkflow(@Req() req: AuthenticatedRequest, @Body() dto: CreateWorkflowDto) {
    return this.workflowsService.createWorkflow(req.user.orgId, dto);
  }

  @Post(':id/states')
  async addState(
    @Req() req: AuthenticatedRequest,
    @Param('id') workflowId: string,
    @Body() dto: CreateWorkflowStateDto
  ) {
    return this.workflowsService.addState(req.user.orgId, workflowId, dto);
  }

  @Post(':id/transitions')
  async addTransition(
    @Req() req: AuthenticatedRequest,
    @Param('id') workflowId: string,
    @Body() dto: CreateWorkflowTransitionDto
  ) {
    return this.workflowsService.addTransition(req.user.orgId, workflowId, dto);
  }

  @Post(':code/instances')
  async startInstance(
    @Req() req: AuthenticatedRequest,
    @Param('code') workflowCode: string,
    @Body() body: { recordId: string; assignedNodeId: string }
  ) {
    return this.workflowsService.startInstance(
      req.user.orgId,
      workflowCode,
      body.recordId,
      body.assignedNodeId,
      req.user.sub
    );
  }

  @Post('instances/:id/transition')
  async triggerTransition(
    @Req() req: AuthenticatedRequest,
    @Param('id') instanceId: string,
    @Body() dto: TriggerWorkflowTransitionDto
  ) {
    return this.workflowsService.triggerTransition(
      req.user.orgId,
      instanceId,
      dto,
      req.user.membershipId,
      req.user.sub
    );
  }

  @Get('instances/:id/history')
  async getInstanceHistory(@Req() req: AuthenticatedRequest, @Param('id') instanceId: string) {
    return this.workflowsService.getInstanceHistory(req.user.orgId, instanceId);
  }
}
