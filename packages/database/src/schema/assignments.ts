import { pgTable, uuid, varchar, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { identityUsers } from './identity.js';

export const membershipNodeAssignments = pgTable(
  'membership_node_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id').notNull(),
    hierarchyNodeId: uuid('hierarchy_node_id').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    status: varchar('status', { length: 32 }).default('ACTIVE').notNull(), // ACTIVE, SUSPENDED, EXPIRED
    validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow().notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    assignedBy: uuid('assigned_by').references(() => identityUsers.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqAssignmentsOrgId: unique('uq_assignments_org_id').on(t.organizationId, t.id),
    uqAssignmentsMembershipNode: unique('uq_assignments_membership_node').on(
      t.organizationId,
      t.membershipId,
      t.hierarchyNodeId
    ),
  })
);

export const assignmentRoles = pgTable(
  'assignment_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    assignmentId: uuid('assignment_id').notNull(),
    roleId: uuid('role_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqAssignmentRoles: unique('uq_assignment_roles').on(t.assignmentId, t.roleId),
  })
);
