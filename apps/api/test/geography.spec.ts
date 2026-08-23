import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantTransactionManager } from '@campus-os/database';
import { GeographyService } from '../src/modules/geography/geography.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const USER_ID = '99999999-9999-9999-9999-999999999999';

describe('GeographyService & Location Shared Masters Integration Tests (PGlite)', () => {
  let pglite: PGlite;
  let db: any;
  let txManager: TenantTransactionManager;
  let auditService: AuditService;
  let geographyService: GeographyService;

  let pkCountryId: string;
  let usCountryId: string;
  let sindhStateId: string;
  let calStateId: string;
  let khiCityId: string;
  let laCityId: string;
  let gulshanAreaId: string;

  beforeAll(async () => {
    pglite = new PGlite();
    db = drizzle(pglite);

    await pglite.exec(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE countries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        iso2 VARCHAR(2) NOT NULL,
        iso3 VARCHAR(3),
        numeric_code VARCHAR(10),
        dial_code VARCHAR(16),
        currency_code VARCHAR(10),
        currency_symbol VARCHAR(10),
        nationality VARCHAR(100),
        sort_order INTEGER DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_country_org_iso2 ON countries(organization_id, iso2);

      CREATE TABLE states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64),
        type VARCHAR(64) DEFAULT 'Province' NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_state_org_country_name ON states(organization_id, country_id, name);

      CREATE TABLE cities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
        state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64),
        sort_order INTEGER DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_city_org_state_name ON cities(organization_id, state_id, name);

      CREATE TABLE areas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
        state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
        city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64),
        postal_code VARCHAR(32),
        sort_order INTEGER DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_area_org_city_name ON areas(organization_id, city_id, name);

      CREATE TABLE postal_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
        state_id UUID REFERENCES states(id) ON DELETE RESTRICT,
        city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
        area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
        postal_code VARCHAR(32) NOT NULL,
        description VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        hierarchy_node_id UUID,
        actor_id UUID,
        actor_email VARCHAR(255),
        impersonator_id UUID,
        module VARCHAR(64) DEFAULT 'ORGANIZATION' NOT NULL,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID,
        before_state JSONB,
        after_state JSONB,
        diff JSONB,
        outcome VARCHAR(32) DEFAULT 'SUCCESS' NOT NULL,
        ip_address VARCHAR(64),
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      INSERT INTO organizations (id, code, name) VALUES
        ('${TENANT_A}', 'ORG_A', 'Alpha Educational Trust'),
        ('${TENANT_B}', 'ORG_B', 'Beta Academies Network');
    `);

    txManager = new TenantTransactionManager(pglite as any);
    auditService = new AuditService(txManager);
    geographyService = new GeographyService(txManager, auditService);
  });

  // ── 1. COUNTRIES TESTS ──────────────────────────────────────────
  it('1. should create countries with auto-increment sort order and ISO details', async () => {
    const pk = await geographyService.createCountry(
      TENANT_A,
      {
        name: 'Pakistan',
        iso2: 'PK',
        iso3: 'PAK',
        numericCode: '586',
        dialCode: '+92',
        currencyCode: 'PKR',
        currencySymbol: 'Rs',
        nationality: 'Pakistani',
      },
      USER_ID
    );

    expect(pk.id).toBeDefined();
    expect(pk.sortOrder).toBe(1);
    expect(pk.iso2).toBe('PK');
    pkCountryId = pk.id;

    const us = await geographyService.createCountry(
      TENANT_A,
      {
        name: 'United States',
        iso2: 'US',
        iso3: 'USA',
        numericCode: '840',
        dialCode: '+1',
        currencyCode: 'USD',
        currencySymbol: '$',
        nationality: 'American',
      },
      USER_ID
    );

    expect(us.sortOrder).toBe(2);
    usCountryId = us.id;
  });

  it('2. should reject country with duplicate ISO-2 code within same tenant', async () => {
    await expect(
      geographyService.createCountry(
        TENANT_A,
        {
          name: 'Pakistan Duplicate',
          iso2: 'PK',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  it('3. should allow same ISO-2 code in a different tenant (isolation)', async () => {
    const tenantBPk = await geographyService.createCountry(
      TENANT_B,
      {
        name: 'Pakistan',
        iso2: 'PK',
        dialCode: '+92',
      },
      USER_ID
    );

    expect(tenantBPk.organizationId).toBe(TENANT_B);
  });

  // ── 2. STATES / PROVINCES TESTS ─────────────────────────────────
  it('4. should create states/provinces linked to country with custom types', async () => {
    const sindh = await geographyService.createState(
      TENANT_A,
      {
        countryId: pkCountryId,
        name: 'Sindh',
        code: 'SD',
        type: 'Province',
      },
      USER_ID
    );

    expect(sindh.id).toBeDefined();
    expect(sindh.countryId).toBe(pkCountryId);
    expect(sindh.sortOrder).toBe(1);
    sindhStateId = sindh.id;

    const cal = await geographyService.createState(
      TENANT_A,
      {
        countryId: usCountryId,
        name: 'California',
        code: 'CA',
        type: 'State',
      },
      USER_ID
    );

    expect(cal.countryId).toBe(usCountryId);
    calStateId = cal.id;
  });

  it('5. should reject creating state with duplicate name in same country', async () => {
    await expect(
      geographyService.createState(
        TENANT_A,
        {
          countryId: pkCountryId,
          name: 'Sindh',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  it('6. should reject creating state under invalid or cross-tenant country', async () => {
    await expect(
      geographyService.createState(
        TENANT_A,
        {
          countryId: '00000000-0000-0000-0000-000000000000',
          name: 'Atlantis State',
        },
        USER_ID
      )
    ).rejects.toThrow(NotFoundException);
  });

  // ── 3. CITIES TESTS ──────────────────────────────────────────────
  it('7. should create cities under state and country hierarchy', async () => {
    const khi = await geographyService.createCity(
      TENANT_A,
      {
        countryId: pkCountryId,
        stateId: sindhStateId,
        name: 'Karachi',
        code: 'KHI',
      },
      USER_ID
    );

    expect(khi.id).toBeDefined();
    expect(khi.countryId).toBe(pkCountryId);
    expect(khi.stateId).toBe(sindhStateId);
    expect(khi.sortOrder).toBe(1);
    khiCityId = khi.id;

    const la = await geographyService.createCity(
      TENANT_A,
      {
        countryId: usCountryId,
        stateId: calStateId,
        name: 'Los Angeles',
        code: 'LAX',
      },
      USER_ID
    );

    expect(la.countryId).toBe(usCountryId);
    laCityId = la.id;
  });

  it('8. should reject duplicate city name in same state', async () => {
    await expect(
      geographyService.createCity(
        TENANT_A,
        {
          countryId: pkCountryId,
          stateId: sindhStateId,
          name: 'Karachi',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  // ── 4. AREAS / ZONES TESTS ───────────────────────────────────────
  it('9. should create areas/zones under city with optional postal code', async () => {
    const gulshan = await geographyService.createArea(
      TENANT_A,
      {
        countryId: pkCountryId,
        stateId: sindhStateId,
        cityId: khiCityId,
        name: 'Gulshan-e-Iqbal',
        code: 'GIQ',
        postalCode: '75300',
      },
      USER_ID
    );

    expect(gulshan.id).toBeDefined();
    expect(gulshan.cityId).toBe(khiCityId);
    expect(gulshan.postalCode).toBe('75300');
    expect(gulshan.sortOrder).toBe(1);
    gulshanAreaId = gulshan.id;

    const clifton = await geographyService.createArea(
      TENANT_A,
      {
        countryId: pkCountryId,
        stateId: sindhStateId,
        cityId: khiCityId,
        name: 'Clifton',
        code: 'CLF',
        postalCode: '75600',
      },
      USER_ID
    );

    expect(clifton.sortOrder).toBe(2);
    expect(clifton.postalCode).toBe('75600');
  });

  it('10. should search and filter areas by postal code', async () => {
    const searchResult = await geographyService.listAreas(
      TENANT_A,
      undefined,
      undefined,
      undefined,
      '75300'
    );
    expect(searchResult.length).toBe(1);
    expect(searchResult[0]!.name).toBe('Gulshan-e-Iqbal');
    expect(searchResult[0]!.postalCode).toBe('75300');
  });

  it('11. should reject duplicate area name in same city', async () => {
    await expect(
      geographyService.createArea(
        TENANT_A,
        {
          countryId: pkCountryId,
          stateId: sindhStateId,
          cityId: khiCityId,
          name: 'Gulshan-e-Iqbal',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  // ── 5. POSTAL CODES TESTS ─────────────────────────────────────────
  it('11. should create postal codes linked to city and area', async () => {
    const pc1 = await geographyService.createPostalCode(
      TENANT_A,
      {
        countryId: pkCountryId,
        stateId: sindhStateId,
        cityId: khiCityId,
        areaId: gulshanAreaId,
        postalCode: '75300',
        description: 'Gulshan Block 1-13 General Post Office',
      },
      USER_ID
    );

    expect(pc1.id).toBeDefined();
    expect(pc1.postalCode).toBe('75300');
    expect(pc1.cityName).toBe('Karachi');
    expect(pc1.areaName).toBe('Gulshan-e-Iqbal');

    const pc2 = await geographyService.createPostalCode(
      TENANT_A,
      {
        countryId: usCountryId,
        stateId: calStateId,
        cityId: laCityId,
        postalCode: '90012',
        description: 'Downtown Los Angeles Civic Center',
      },
      USER_ID
    );

    expect(pc2.postalCode).toBe('90012');
  });

  it('12. should search and filter postal codes by code and city', async () => {
    const list = await geographyService.listPostalCodes(TENANT_A, undefined, undefined, khiCityId);
    expect(list.length).toBe(1);
    expect(list[0]!.postalCode).toBe('75300');

    const searchList = await geographyService.listPostalCodes(TENANT_A, undefined, undefined, undefined, undefined, '90012');
    expect(searchList.length).toBe(1);
    expect(searchList[0]!.cityName).toBe('Los Angeles');
  });

  // ── 6. STATUS & AUDIT LOG TESTS ───────────────────────────────────
  it('13. should toggle active/inactive status and log structured audit events', async () => {
    const deactivated = await geographyService.toggleCountryStatus(TENANT_A, usCountryId, false, USER_ID);
    expect(deactivated.isActive).toBe(false);

    const activeList = await geographyService.listCountries(TENANT_A, undefined, 'ACTIVE');
    expect(activeList.some((c) => c.id === usCountryId)).toBe(false);

    // Verify audit logs
    const rawLogs = await pglite.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE organization_id = '${TENANT_A}';`
    );
    expect(Number(rawLogs.rows[0]?.count)).toBeGreaterThan(5);
  });
});
