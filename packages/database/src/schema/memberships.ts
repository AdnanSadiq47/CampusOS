import { pgTable, uuid, varchar, boolean, timestamp, integer, jsonb, date, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { identityUsers } from './identity.js';

export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    identityUserId: uuid('identity_user_id')
      .notNull()
      .references(() => identityUsers.id, { onDelete: 'restrict' }),
    membershipType: varchar('membership_type', { length: 32 }).default('STAFF').notNull(),
    status: varchar('status', { length: 32 }).default('ACTIVE').notNull(), // INVITED, ACTIVE, SUSPENDED, TERMINATED
    validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow().notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    version: integer('version').default(1).notNull(), // Incremented on revocation
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgMembership: unique('uq_org_membership').on(t.organizationId, t.identityUserId),
    uqOrgId: unique('uq_memberships_org_id').on(t.organizationId, t.id),
  })
);

export const employeeProfiles = pgTable(
  'employee_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id').notNull(),
    employeeCode: varchar('employee_code', { length: 64 }).notNull(),
    designation: varchar('designation', { length: 128 }),
    employmentType: varchar('employment_type', { length: 32 }).default('FULL_TIME').notNull(),
    hireDate: date('hire_date'),
    details: jsonb('details').default({}).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqEmployeeOrgMembership: unique('uq_employee_org_membership').on(t.organizationId, t.membershipId),
    uqEmployeeOrgCode: unique('uq_employee_org_code').on(t.organizationId, t.employeeCode),
  })
);
