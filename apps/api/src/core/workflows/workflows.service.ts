import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  TenantTransactionManager,
  workflowDefinitions,
  workflowStates,
  workflowTransitions,
  workflowInstances,
  workflowHistory,
  entityDefinitions,
  entityRecords,
  assignmentRoles,
  roles,
  membershipNodeAssignments,
  eq,
  and,
  desc,
} from '@campus-os/database';
import { ASTEvaluator, ConditionRule, CompoundRule } from '@campus-os/rule-engine';
import {
  CreateWorkflowDto,
  CreateWorkflowStateDto,
  CreateWorkflowTransitionDto,
  TriggerWorkflowTransitionDto,
} from '@campus-os/types';

@Injectable()
export class WorkflowsService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  /**
   * Create a workflow definition
   */
  async createWorkflow(tenantId: string, dto: CreateWorkflowDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [entity] = await tx
        .select()
        .from(entityDefinitions)
        .where(and(eq(entityDefinitions.organizationId, tenantId), eq(entityDefinitions.id, dto.entityId)))
        .limit(1);

      if (!entity) {
        throw new NotFoundException('Entity not found');
      }

      const [existing] = await tx
        .select()
        .from(workflowDefinitions)
        .where(and(eq(workflowDefinitions.organizationId, tenantId), eq(workflowDefinitions.code, dto.code)))
        .limit(1);

      if (existing) {
        throw new ConflictException(`Workflow with code '${dto.code}' already exists`);
      }

      const [workflow] = await tx
        .insert(workflowDefinitions)
        .values({
          organizationId: tenantId,
          entityId: dto.entityId,
          code: dto.code,
          name: dto.name,
          description: dto.description,
          initialStateCode: dto.initialStateCode,
          isActive: true,
        })
        .returning();

      // Automatically create initial state
      await tx.insert(workflowStates).values({
        organizationId: tenantId,
        workflowId: workflow!.id,
        code: dto.initialStateCode,
        name: 'Initial State',
        stateType: 'INITIAL',
        color: 'blue',
        sortOrder: 0,
      });

      return workflow;
    });
  }

  /**
   * Add a state to a workflow
   */
  async addState(tenantId: string, workflowId: string, dto: CreateWorkflowStateDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [workflow] = await tx
        .select()
        .from(workflowDefinitions)
        .where(and(eq(workflowDefinitions.organizationId, tenantId), eq(workflowDefinitions.id, workflowId)))
        .limit(1);

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      const [state] = await tx
        .insert(workflowStates)
        .values({
          organizationId: tenantId,
          workflowId,
          code: dto.code,
          name: dto.name,
          stateType: dto.stateType ?? 'INTERMEDIATE',
          color: dto.color ?? 'gray',
          sortOrder: dto.sortOrder ?? 0,
        })
        .returning();

      return state;
    });
  }

  /**
   * Add a transition to a workflow
   */
  async addTransition(tenantId: string, workflowId: string, dto: CreateWorkflowTransitionDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [transition] = await tx
        .insert(workflowTransitions)
        .values({
          organizationId: tenantId,
          workflowId,
          fromStateCode: dto.fromStateCode,
          toStateCode: dto.toStateCode,
          actionName: dto.actionName,
          guardRule: (dto.guardRule ?? {}) as Record<string, unknown>,
          requiredRoles: (dto.requiredRoles ?? []) as unknown as Record<string, unknown>,
          actions: (dto.actions ?? []) as unknown as Record<string, unknown>,
        })
        .returning();

      return transition;
    });
  }

  /**
   * Start a workflow instance for a record
   */
  async startInstance(tenantId: string, workflowCode: string, recordId: string, assignedNodeId: string, userId?: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [workflow] = await tx
        .select()
        .from(workflowDefinitions)
        .where(and(eq(workflowDefinitions.organizationId, tenantId), eq(workflowDefinitions.code, workflowCode)))
        .limit(1);

      if (!workflow) {
        throw new NotFoundException(`Workflow '${workflowCode}' not found`);
      }

      const [instance] = await tx
        .insert(workflowInstances)
        .values({
          organizationId: tenantId,
          workflowId: workflow.id,
          recordId,
          currentStateCode: workflow.initialStateCode,
          assignedNodeId,
          startedBy: userId,
        })
        .returning();

      // Record initial history
      await tx.insert(workflowHistory).values({
        organizationId: tenantId,
        instanceId: instance!.id,
        fromStateCode: 'NONE',
        toStateCode: workflow.initialStateCode,
        actionTaken: 'WORKFLOW_STARTED',
        performedBy: userId,
        comments: 'Instance initialized',
      });

      return instance;
    });
  }

  /**
   * Execute state transition in the FSM
   */
  async triggerTransition(
    tenantId: string,
    instanceId: string,
    dto: TriggerWorkflowTransitionDto,
    membershipId: string,
    userId?: string
  ) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [instance] = await tx
        .select()
        .from(workflowInstances)
        .where(and(eq(workflowInstances.organizationId, tenantId), eq(workflowInstances.id, instanceId)))
        .limit(1);

      if (!instance) {
        throw new NotFoundException('Workflow instance not found');
      }

      // Find valid transitions from current state matching actionName
      const [transition] = await tx
        .select()
        .from(workflowTransitions)
        .where(
          and(
            eq(workflowTransitions.organizationId, tenantId),
            eq(workflowTransitions.workflowId, instance.workflowId),
            eq(workflowTransitions.fromStateCode, instance.currentStateCode),
            eq(workflowTransitions.actionName, dto.actionName)
          )
        )
        .limit(1);

      if (!transition) {
        throw new BadRequestException(
          `Invalid transition '${dto.actionName}' from current state '${instance.currentStateCode}'`
        );
      }

      // Check Role Guards if specified
      const requiredRoles = (transition.requiredRoles as unknown as string[]) ?? [];
      if (requiredRoles.length > 0) {
        // Query user's roles on the assigned node
        const userRolesOnNode = await tx
          .select({ roleCode: roles.code })
          .from(membershipNodeAssignments)
          .innerJoin(assignmentRoles, eq(assignmentRoles.assignmentId, membershipNodeAssignments.id))
          .innerJoin(roles, eq(roles.id, assignmentRoles.roleId))
          .where(
            and(
              eq(membershipNodeAssignments.organizationId, tenantId),
              eq(membershipNodeAssignments.membershipId, membershipId),
              eq(membershipNodeAssignments.hierarchyNodeId, instance.assignedNodeId),
              eq(membershipNodeAssignments.status, 'ACTIVE')
            )
          );

        const roleCodes = userRolesOnNode.map((r) => r.roleCode);
        const hasRequiredRole = requiredRoles.some((r) => roleCodes.includes(r));

        if (!hasRequiredRole) {
          throw new ForbiddenException(
            `You do not possess the required role (${requiredRoles.join(', ')}) on the assigned node to execute this action`
          );
        }
      }

      // Check Guard Condition Rules if specified
      if (transition.guardRule && Object.keys(transition.guardRule).length > 0) {
        // Fetch record data
        const [record] = await tx
          .select()
          .from(entityRecords)
          .where(and(eq(entityRecords.organizationId, tenantId), eq(entityRecords.id, instance.recordId)))
          .limit(1);

        const mergedContext = {
          ...((record?.data as Record<string, unknown>) ?? {}),
          ...(dto.contextData ?? {}),
        };

        const isGuardPassed = ASTEvaluator.evaluate(
          transition.guardRule as unknown as (ConditionRule | CompoundRule),
          mergedContext
        );

        if (!isGuardPassed) {
          throw new BadRequestException('Workflow guard condition rule evaluated to false. Action blocked.');
        }
      }

      // Transition FSM State
      const [updatedInstance] = await tx
        .update(workflowInstances)
        .set({
          currentStateCode: transition.toStateCode,
          updatedAt: new Date(),
        })
        .where(eq(workflowInstances.id, instance.id))
        .returning();

      // Record immutable workflow history audit
      await tx.insert(workflowHistory).values({
        organizationId: tenantId,
        instanceId: instance.id,
        fromStateCode: instance.currentStateCode,
        toStateCode: transition.toStateCode,
        actionTaken: dto.actionName,
        performedBy: userId,
        comments: dto.comments,
      });

      return updatedInstance;
    });
  }

  /**
   * Get workflow instance history
   */
  async getInstanceHistory(tenantId: string, instanceId: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      return tx
        .select()
        .from(workflowHistory)
        .where(and(eq(workflowHistory.organizationId, tenantId), eq(workflowHistory.instanceId, instanceId)))
        .orderBy(desc(workflowHistory.createdAt));
    });
  }
}
