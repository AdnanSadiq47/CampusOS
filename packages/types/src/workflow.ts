/**
 * Workflow Finite State Machine (FSM) Type Definitions
 */

export type WorkflowStateType = 'INITIAL' | 'INTERMEDIATE' | 'TERMINAL';

export interface WorkflowState {
  id: string;
  organizationId: string;
  workflowId: string;
  code: string;
  name: string;
  stateType: WorkflowStateType;
  color: string;
  sortOrder: number;
  createdAt: Date;
}

export interface WorkflowAction {
  type: 'NOTIFICATION' | 'WEBHOOK' | 'UPDATE_FIELD' | 'EMIT_EVENT';
  payload: Record<string, unknown>;
}

export interface WorkflowTransition {
  id: string;
  organizationId: string;
  workflowId: string;
  fromStateCode: string;
  toStateCode: string;
  actionName: string;
  guardRule?: Record<string, unknown>; // AST Condition Rule
  requiredRoles?: string[]; // E.g. ["ACADEMIC_ADMIN", "REGISTRAR"]
  actions: WorkflowAction[];
  createdAt: Date;
}

export interface WorkflowDefinition {
  id: string;
  organizationId: string;
  entityId: string;
  code: string;
  name: string;
  description?: string | null;
  initialStateCode: string;
  isActive: boolean;
  states?: WorkflowState[];
  transitions?: WorkflowTransition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInstance {
  id: string;
  organizationId: string;
  workflowId: string;
  recordId: string;
  currentStateCode: string;
  assignedNodeId: string;
  startedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowHistory {
  id: string;
  organizationId: string;
  instanceId: string;
  fromStateCode: string;
  toStateCode: string;
  actionTaken: string;
  performedBy?: string | null;
  comments?: string | null;
  createdAt: Date;
}

export interface CreateWorkflowDto {
  entityId: string;
  code: string;
  name: string;
  description?: string;
  initialStateCode: string;
}

export interface CreateWorkflowStateDto {
  code: string;
  name: string;
  stateType?: WorkflowStateType;
  color?: string;
  sortOrder?: number;
}

export interface CreateWorkflowTransitionDto {
  fromStateCode: string;
  toStateCode: string;
  actionName: string;
  guardRule?: Record<string, unknown>;
  requiredRoles?: string[];
  actions?: WorkflowAction[];
}

export interface TriggerWorkflowTransitionDto {
  actionName: string;
  comments?: string;
  contextData?: Record<string, unknown>;
}
