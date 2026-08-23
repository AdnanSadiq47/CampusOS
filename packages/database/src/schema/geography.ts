import { pgTable, uuid, varchar, boolean, timestamp, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOCATION & GEOGRAPHY SHARED MASTERS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Provides authoritative hierarchical geographic master datasets:
 * Country -> State / Province -> City -> Area / Zone -> Postal Code
 *
 * SHARED REFERENCE MASTER ARCHITECTURE:
 * - Shared across all operational entities (Schools, Branches, Students, Staff, Vendors, Transport).
 * - Scoped to organization_id for custom tenant additions while preserving relational integrity.
 * - No branch-ownership or branch-level silos.
 * - Deterministic sort_order for canonical ERP-wide dropdown display.
 * - Safe lifecycle: ACTIVE / INACTIVE (No hard delete).
 */

// ── 1. COUNTRIES MASTER ──────────────────────────────────────────────────────
export const countries = pgTable(
  'countries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    iso2: varchar('iso2', { length: 2 }).notNull(), // e.g. PK, US, GB, AE, SA
    iso3: varchar('iso3', { length: 3 }), // e.g. PAK, USA, GBR, ARE, SAU
    numericCode: varchar('numeric_code', { length: 10 }), // e.g. 586, 840, 826
    dialCode: varchar('dial_code', { length: 16 }), // e.g. +92, +1, +44, +971
    currencyCode: varchar('currency_code', { length: 10 }), // e.g. PKR, USD, GBP, AED
    currencySymbol: varchar('currency_symbol', { length: 10 }), // e.g. Rs, $, £, د.إ
    nationality: varchar('nationality', { length: 100 }), // e.g. Pakistani, American
    sortOrder: integer('sort_order').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqCountryOrgIso2: uniqueIndex('uq_country_org_iso2').on(t.organizationId, t.iso2),
    uqCountryOrgId: uniqueIndex('uq_country_org_id').on(t.organizationId, t.id),
    idxCountrySort: index('idx_country_sort').on(t.organizationId, t.sortOrder, t.name),
  })
);

// ── 2. STATES / PROVINCES MASTER ─────────────────────────────────────────────
export const states = pgTable(
  'states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }), // e.g. SD, PB, CA, TX, DXB
    type: varchar('type', { length: 64 }).default('Province').notNull(), // State, Province, Territory, Region, Emirate, Governorate, Other
    sortOrder: integer('sort_order').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqStateOrgCountryName: uniqueIndex('uq_state_org_country_name').on(t.organizationId, t.countryId, t.name),
    uqStateOrgId: uniqueIndex('uq_state_org_id').on(t.organizationId, t.id),
    idxStateCountry: index('idx_state_country').on(t.organizationId, t.countryId, t.sortOrder, t.name),
  })
);

// ── 3. CITIES MASTER ─────────────────────────────────────────────────────────
export const cities = pgTable(
  'cities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    stateId: uuid('state_id')
      .notNull()
      .references(() => states.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }), // e.g. KHI, LHE, ISB, LAX
    sortOrder: integer('sort_order').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqCityOrgStateName: uniqueIndex('uq_city_org_state_name').on(t.organizationId, t.stateId, t.name),
    uqCityOrgId: uniqueIndex('uq_city_org_id').on(t.organizationId, t.id),
    idxCityState: index('idx_city_state').on(t.organizationId, t.stateId, t.sortOrder, t.name),
  })
);

// ── 4. AREAS / ZONES MASTER ──────────────────────────────────────────────────
export const areas = pgTable(
  'areas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    stateId: uuid('state_id')
      .notNull()
      .references(() => states.id, { onDelete: 'restrict' }),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }),
    postalCode: varchar('postal_code', { length: 32 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqAreaOrgCityName: uniqueIndex('uq_area_org_city_name').on(t.organizationId, t.cityId, t.name),
    uqAreaOrgId: uniqueIndex('uq_area_org_id').on(t.organizationId, t.id),
    idxAreaCity: index('idx_area_city').on(t.organizationId, t.cityId, t.sortOrder, t.name),
    idxAreaPostalCode: index('idx_area_postal_code').on(t.organizationId, t.postalCode),
  })
);

// ── 5. POSTAL CODES MASTER ───────────────────────────────────────────────────
export const postalCodes = pgTable(
  'postal_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    stateId: uuid('state_id')
      .references(() => states.id, { onDelete: 'restrict' }),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id, { onDelete: 'restrict' }),
    areaId: uuid('area_id')
      .references(() => areas.id, { onDelete: 'set null' }),
    postalCode: varchar('postal_code', { length: 32 }).notNull(),
    description: varchar('description', { length: 255 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqPostalCodeOrgId: uniqueIndex('uq_postal_code_org_id').on(t.organizationId, t.id),
    idxPostalCodeSearch: index('idx_postal_code_search').on(t.organizationId, t.postalCode, t.cityId),
  })
);
