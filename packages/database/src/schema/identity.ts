import { pgTable, uuid, varchar, boolean, timestamp, integer, customType } from 'drizzle-orm/pg-core';

// Custom type for BYTEA column
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const identityUsers = pgTable('identity_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 32 }),
  
  // Encrypted MFA storage via AES-256-GCM
  mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
  mfaSecretEncrypted: bytea('mfa_secret_encrypted'),
  mfaSecretIv: bytea('mfa_secret_iv'),
  mfaKeyVersion: integer('mfa_key_version').default(1).notNull(),
  
  // Account Security & Lockout
  isActive: boolean('is_active').default(true).notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  securityStamp: uuid('security_stamp').defaultRandom().notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
