import { pgTable, uuid, varchar, text, boolean, integer, jsonb, timestamp, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { entityDefinitions, entityRecords } from './entities.js';
import { hierarchyNodes } from './hierarchy.js';
import { identityUsers } from './identity.js';

export const workflowDefinitions = pgTable(
  'workflow_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id').notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description'),
    initialStateCode: varchar('initial_state_code', { length: 64 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_workflow_org_id').on(t.organizationId, t.id),
    uqOrgCode: uniqueIndex('uq_workflow_org_code').on(t.organizationId, t.code),
    fkEntity: foreignKey({
      columns: [t.organizationId, t.entityId],
      foreignColumns: [entityDefinitions.organizationId, entityDefinitions.id],
      name: 'fk_workflow_entity',
    }).onDelete('cascade'),
  })
);

export const workflowStates = pgTable(
  'workflow_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    workflowId: uuid('workflow_id').notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    stateType: varchar('state_type', { length: 32 }).default('INTERMEDIATE').notNull(), // INITIAL, INTERMEDIATE, TERMINAL
    color: varchar('color', { length: 32 }).default('gray').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_workflow_state_org_id').on(t.organizationId, t.id),
    uqOrgWorkflowCode: uniqueIndex('uq_workflow_state_code').on(t.organizationId, t.workflowId, t.code),
    fkWorkflow: foreignKey({
      columns: [t.organizationId, t.workflowId],
      foreignColumns: [workflowDefinitions.organizationId, workflowDefinitions.id],
      name: 'fk_workflow_states_workflow',
    }).onDelete('cascade'),
  })
);

export const workflowTransitions = pgTable(
  'workflow_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    workflowId: uuid('workflow_id').notNull(),
    fromStateCode: varchar('from_state_code', { length: 64 }).notNull(),
    toStateCode: varchar('to_state_code', { length: 64 }).notNull(),
    actionName: varchar('action_name', { length: 128 }).notNull(),
    guardRule: jsonb('guard_rule').default({}).notNull(),
    requiredRoles: jsonb('required_roles').default([]).notNull(),
    actions: jsonb('actions').default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_workflow_transition_org_id').on(t.organizationId, t.id),
    fkWorkflow: foreignKey({
      columns: [t.organizationId, t.workflowId],
      foreignColumns: [workflowDefinitions.organizationId, workflowDefinitions.id],
      name: 'fk_workflow_transitions_workflow',
    }).onDelete('cascade'),
  })
);

export const workflowInstances = pgTable(
  'workflow_instances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    workflowId: uuid('workflow_id').notNull(),
    recordId: uuid('record_id').notNull(),
    currentStateCode: varchar('current_state_code', { length: 64 }).notNull(),
    assignedNodeId: uuid('assigned_node_id').notNull(),
    startedBy: uuid('started_by').references(() => identityUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_workflow_instance_org_id').on(t.organizationId, t.id),
    fkWorkflow: foreignKey({
      columns: [t.organizationId, t.workflowId],
      foreignColumns: [workflowDefinitions.organizationId, workflowDefinitions.id],
      name: 'fk_workflow_instances_workflow',
    }).onDelete('cascade'),
    fkRecord: foreignKey({
      columns: [t.organizationId, t.recordId],
      foreignColumns: [entityRecords.organizationId, entityRecords.id],
      name: 'fk_workflow_instances_record',
    }).onDelete('cascade'),
    fkNode: foreignKey({
      columns: [t.organizationId, t.assignedNodeId],
      foreignColumns: [hierarchyNodes.organizationId, hierarchyNodes.id],
      name: 'fk_workflow_instances_node',
    }).onDelete('restrict'),
  })
);

export const workflowHistory = pgTable(
  'workflow_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    instanceId: uuid('instance_id').notNull(),
    fromStateCode: varchar('from_state_code', { length: 64 }).notNull(),
    toStateCode: varchar('to_state_code', { length: 64 }).notNull(),
    actionTaken: varchar('action_taken', { length: 128 }).notNull(),
    performedBy: uuid('performed_by').references(() => identityUsers.id, { onDelete: 'set null' }),
    comments: text('comments'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_workflow_history_org_id').on(t.organizationId, t.id),
    fkInstance: foreignKey({
      columns: [t.organizationId, t.instanceId],
      foreignColumns: [workflowInstances.organizationId, workflowInstances.id],
      name: 'fk_workflow_history_instance',
    }).onDelete('cascade'),
  })
);
