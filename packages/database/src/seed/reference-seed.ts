import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import {
  CANONICAL_ORG_ID_A,
  CANONICAL_ORG_ID_B,
  CANONICAL_SCHOOL_IDS,
  CANONICAL_CAMPUS_IDS,
} from '../client.js';

const logger = new StructuredLogger('ReferenceSeed');

export interface SeedOptions {
  includeInitialOrgHierarchy?: boolean;
}

/**
 * Explicit seed procedure for System Reference Data.
 * MUST NEVER BE CALLED AUTOMATICALLY ON NORMAL API STARTUP.
 */
export async function seedCanonicalReferenceData(
  pglite: PGlite,
  options: SeedOptions = {}
): Promise<void> {
  logger.info('Executing explicit System Reference Data seeding...');

  // 1. Seed Canonical Identity Users
  const canonicalUsers = [
    { id: '99999999-9999-9999-9999-999999999999', email: 'ali.hassan@campus-os.pk', firstName: 'Ali', lastName: 'Hassan' },
    { id: '88888888-8888-8888-8888-888888888888', email: 'adnan.sadiq@campus-os.pk', firstName: 'Adnan', lastName: 'Sadiq' },
    { id: '77777777-7777-7777-7777-777777777777', email: 'ahmed.khan@campus-os.pk', firstName: 'Ahmed', lastName: 'Khan' },
    { id: '00000000-0000-0000-0000-000000000000', email: 'system@campus-os.local', firstName: 'System', lastName: 'User' },
  ];

  for (const u of canonicalUsers) {
    await pglite.query(
      `INSERT INTO identity_users (id, email, password_hash, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (id) DO NOTHING;`,
      [u.id, u.email, 'argon2id$dummyhash', u.firstName, u.lastName]
    );
  }

  // 2. Seed Canonical Organizations (DO NOTHING on conflict to protect existing data)
  await pglite.query(
    `INSERT INTO organizations (id, code, name, slug, status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING;`,
    [CANONICAL_ORG_ID_A, 'ORG-ALPHA', 'Alpha Academy', 'alpha-academy', 'ACTIVE', true]
  );

  await pglite.query(
    `INSERT INTO organizations (id, code, name, slug, status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING;`,
    [CANONICAL_ORG_ID_B, 'ORG-BETA', 'Beta University System', 'beta-university', 'ACTIVE', true]
  );

  // 3. Seed System Roles
  const canonicalRoles = [
    { code: 'ORG_ADMIN', name: 'Organization Central Administrator', desc: 'Full administrative access across organization' },
    { code: 'HO_ADMIN', name: 'Head Office Administrator', desc: 'Administrative access for Head Office and its subtree' },
    { code: 'REGION_ADMIN', name: 'Regional Director / Administrator', desc: 'Administrative access for Regional Office and its subtree' },
    { code: 'SCHOOL_ADMIN', name: 'School Principal / Administrator', desc: 'Administrative access for School and its branches' },
  ];

  for (const r of canonicalRoles) {
    const existing = await pglite.query(
      `SELECT id FROM roles WHERE organization_id = $1 AND code = $2 LIMIT 1;`,
      [CANONICAL_ORG_ID_A, r.code]
    );
    if ((existing as any).rows?.length === 0) {
      await pglite.query(
        `INSERT INTO roles (organization_id, code, name, description, is_system, is_active)
         VALUES ($1, $2, $3, $4, true, true);`,
        [CANONICAL_ORG_ID_A, r.code, r.name, r.desc]
      );
    }
  }

  // 4. Seed Canonical Geography Masters (DO NOTHING on conflict)
  const canonicalCountries = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'Pakistan', iso2: 'PK', iso3: 'PAK', numericCode: '586', dialCode: '+92', currencyCode: 'PKR', currencySymbol: 'Rs', nationality: 'Pakistani', sortOrder: 1 },
    { id: '10000000-0000-0000-0000-000000000002', name: 'United States', iso2: 'US', iso3: 'USA', numericCode: '840', dialCode: '+1', currencyCode: 'USD', currencySymbol: '$', nationality: 'American', sortOrder: 2 },
    { id: '10000000-0000-0000-0000-000000000003', name: 'United Kingdom', iso2: 'GB', iso3: 'GBR', numericCode: '826', dialCode: '+44', currencyCode: 'GBP', currencySymbol: '£', nationality: 'British', sortOrder: 3 },
    { id: '10000000-0000-0000-0000-000000000004', name: 'United Arab Emirates', iso2: 'AE', iso3: 'ARE', numericCode: '784', dialCode: '+971', currencyCode: 'AED', currencySymbol: 'د.إ', nationality: 'Emirati', sortOrder: 4 },
    { id: '10000000-0000-0000-0000-000000000005', name: 'Saudi Arabia', iso2: 'SA', iso3: 'SAU', numericCode: '682', dialCode: '+966', currencyCode: 'SAR', currencySymbol: '﷼', nationality: 'Saudi', sortOrder: 5 },
  ];

  for (const c of canonicalCountries) {
    await pglite.query(
      `INSERT INTO countries (id, organization_id, name, iso2, iso3, numeric_code, dial_code, currency_code, currency_symbol, nationality, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
       ON CONFLICT (id) DO NOTHING;`,
      [c.id, CANONICAL_ORG_ID_A, c.name, c.iso2, c.iso3, c.numericCode, c.dialCode, c.currencyCode, c.currencySymbol, c.nationality, c.sortOrder]
    );
  }

  const pkCountryId = '10000000-0000-0000-0000-000000000001';
  const canonicalStates = [
    { id: '20000000-0000-0000-0000-000000000001', countryId: pkCountryId, name: 'Sindh', code: 'SD', type: 'Province', sortOrder: 1 },
    { id: '20000000-0000-0000-0000-000000000002', countryId: pkCountryId, name: 'Punjab', code: 'PB', type: 'Province', sortOrder: 2 },
    { id: '20000000-0000-0000-0000-000000000003', countryId: pkCountryId, name: 'Khyber Pakhtunkhwa', code: 'KP', type: 'Province', sortOrder: 3 },
    { id: '20000000-0000-0000-0000-000000000004', countryId: pkCountryId, name: 'Balochistan', code: 'BA', type: 'Province', sortOrder: 4 },
    { id: '20000000-0000-0000-0000-000000000005', countryId: pkCountryId, name: 'Islamabad Capital Territory', code: 'ICT', type: 'Territory', sortOrder: 5 },
  ];

  for (const s of canonicalStates) {
    await pglite.query(
      `INSERT INTO states (id, organization_id, country_id, name, code, type, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (id) DO NOTHING;`,
      [s.id, CANONICAL_ORG_ID_A, s.countryId, s.name, s.code, s.type, s.sortOrder]
    );
  }

  const sindhId = '20000000-0000-0000-0000-000000000001';
  const punjabId = '20000000-0000-0000-0000-000000000002';
  const ictId = '20000000-0000-0000-0000-000000000005';

  const canonicalCities = [
    { id: '30000000-0000-0000-0000-000000000001', countryId: pkCountryId, stateId: sindhId, name: 'Karachi', code: 'KHI', sortOrder: 1 },
    { id: '30000000-0000-0000-0000-000000000002', countryId: pkCountryId, stateId: sindhId, name: 'Hyderabad', code: 'HYD', sortOrder: 2 },
    { id: '30000000-0000-0000-0000-000000000003', countryId: pkCountryId, stateId: punjabId, name: 'Lahore', code: 'LHE', sortOrder: 3 },
    { id: '30000000-0000-0000-0000-000000000004', countryId: pkCountryId, stateId: punjabId, name: 'Rawalpindi', code: 'RWP', sortOrder: 4 },
    { id: '30000000-0000-0000-0000-000000000005', countryId: pkCountryId, stateId: ictId, name: 'Islamabad', code: 'ISB', sortOrder: 5 },
  ];

  for (const c of canonicalCities) {
    await pglite.query(
      `INSERT INTO cities (id, organization_id, country_id, state_id, name, code, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (id) DO NOTHING;`,
      [c.id, CANONICAL_ORG_ID_A, c.countryId, c.stateId, c.name, c.code, c.sortOrder]
    );
  }

  const karachiId = '30000000-0000-0000-0000-000000000001';
  const lahoreId = '30000000-0000-0000-0000-000000000003';
  const isbId = '30000000-0000-0000-0000-000000000005';

  const canonicalAreas = [
    { id: '40000000-0000-0000-0000-000000000001', countryId: pkCountryId, stateId: sindhId, cityId: karachiId, name: 'Gulshan-e-Iqbal', code: 'GUL', postalCode: '75300', sortOrder: 1 },
    { id: '40000000-0000-0000-0000-000000000002', countryId: pkCountryId, stateId: sindhId, cityId: karachiId, name: 'Clifton & DHA', code: 'CLF', postalCode: '75600', sortOrder: 2 },
    { id: '40000000-0000-0000-0000-000000000003', countryId: pkCountryId, stateId: sindhId, cityId: karachiId, name: 'North Nazimabad', code: 'NNZ', postalCode: '74700', sortOrder: 3 },
    { id: '40000000-0000-0000-0000-000000000004', countryId: pkCountryId, stateId: sindhId, cityId: karachiId, name: 'PECHS / Tariq Road', code: 'PCH', postalCode: '75400', sortOrder: 4 },
    { id: '40000000-0000-0000-0000-000000000005', countryId: pkCountryId, stateId: punjabId, cityId: lahoreId, name: 'Gulberg & Model Town', code: 'GLB', postalCode: '54660', sortOrder: 5 },
    { id: '40000000-0000-0000-0000-000000000006', countryId: pkCountryId, stateId: punjabId, cityId: lahoreId, name: 'DHA Phase 1-6', code: 'DHA', postalCode: '54792', sortOrder: 6 },
    { id: '40000000-0000-0000-0000-000000000007', countryId: pkCountryId, stateId: ictId, cityId: isbId, name: 'Sector F-6 / F-7', code: 'F6', postalCode: '44000', sortOrder: 7 },
  ];

  for (const a of canonicalAreas) {
    await pglite.query(
      `INSERT INTO areas (id, organization_id, country_id, state_id, city_id, name, code, postal_code, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       ON CONFLICT (id) DO NOTHING;`,
      [a.id, CANONICAL_ORG_ID_A, a.countryId, a.stateId, a.cityId, a.name, a.code, a.postalCode, a.sortOrder]
    );
  }

  // 5. Optionally Seed Initial Org Branches ONLY if requested on fresh development setup
  if (options.includeInitialOrgHierarchy) {
    const VERIFIED_BEACON_SCHOOL_ID = '898d49b3-9c82-4741-ba88-5167ecef6b12';
    const orgABranches = [
      { id: CANONICAL_CAMPUS_IDS.MAIN_CAMPUS, schoolId: VERIFIED_BEACON_SCHOOL_ID, code: 'CMP-01', name: 'Main Campus (Gulshan)', shortName: 'Main' },
      { id: CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS, schoolId: VERIFIED_BEACON_SCHOOL_ID, code: 'CMP-02', name: 'Clifton Campus', shortName: 'Clifton' },
      { id: CANONICAL_CAMPUS_IDS.DHA_CAMPUS, schoolId: VERIFIED_BEACON_SCHOOL_ID, code: 'CMP-03', name: 'DHA Phase 6 Campus', shortName: 'DHA' },
      { id: CANONICAL_CAMPUS_IDS.PECHS_CAMPUS, schoolId: CANONICAL_SCHOOL_IDS.CITY, code: 'CMP-04', name: 'PECHS Senior Campus', shortName: 'PECHS' },
      { id: CANONICAL_CAMPUS_IDS.CLIFTON_JR_CAMPUS, schoolId: CANONICAL_SCHOOL_IDS.CITY, code: 'CMP-05', name: 'Clifton Junior Campus', shortName: 'Clifton Jr' },
      { id: CANONICAL_CAMPUS_IDS.ISLAMABAD_CAMPUS, schoolId: CANONICAL_SCHOOL_IDS.HORIZON, code: 'CMP-06', name: 'Islamabad Capital Campus', shortName: 'Islamabad' },
      { id: CANONICAL_CAMPUS_IDS.INDEPENDENT_CAMPUS, schoolId: CANONICAL_SCHOOL_IDS.INDEPENDENT, code: 'CMP-IND-1', name: 'Independent Main Campus', shortName: 'Independent' },
    ];

    for (const b of orgABranches) {
      await pglite.query(
        `INSERT INTO branches (id, organization_id, school_id, code, name, short_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (id) DO NOTHING;`,
        [b.id, CANONICAL_ORG_ID_A, b.schoolId, b.code, b.name, b.shortName]
      );
    }

    await pglite.query(
      `INSERT INTO branches (id, organization_id, school_id, code, name, short_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (id) DO NOTHING;`,
      [CANONICAL_CAMPUS_IDS.BETA_MAIN_CAMPUS, CANONICAL_ORG_ID_B, CANONICAL_SCHOOL_IDS.BETA_COLLEGE, 'CMP-B01', 'Beta Tech Main Campus', 'Beta Main']
    );
  }

  logger.info('System Reference Data seeding completed cleanly.');
}
