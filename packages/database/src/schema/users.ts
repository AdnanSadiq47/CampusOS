import { pgTable, uuid, varchar, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').default(true).notNull(),
    mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
    mfaSecret: varchar('mfa_secret', { length: 64 }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgEmailUnique: unique('users_org_email_unique').on(table.organizationId, table.email),
  })
);
