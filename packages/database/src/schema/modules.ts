import { pgTable, uuid, varchar, boolean, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { identityUsers } from './identity.js';

export const organizationModules = pgTable(
  'organization_modules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    moduleCode: varchar('module_code', { length: 64 }).notNull(),
    isEnabled: boolean('is_enabled').default(false).notNull(),
    settings: jsonb('settings').default({}).notNull(),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    activatedBy: uuid('activated_by').references(() => identityUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgModule: uniqueIndex('uq_org_module').on(t.organizationId, t.moduleCode),
  })
);
