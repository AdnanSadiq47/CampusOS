import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { schools } from './schools.js';

export const displayPreferences = pgTable(
  'display_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' }),
    mobileFormat: varchar('mobile_format', { length: 32 }),
    landlineFormat: varchar('landline_format', { length: 32 }),
    cnicFormat: varchar('cnic_format', { length: 32 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxDisplayPrefOrg: index('idx_display_pref_org').on(t.organizationId),
  })
);
