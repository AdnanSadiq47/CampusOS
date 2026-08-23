import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  TenantTransactionManager,
  organizations,
  schoolTypes,
  schools,
  auditLogs,
  eq,
} from '@campus-os/database';
import { SchoolTypesService } from '../src/modules/school-types/school-types.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('SchoolTypesService Integration Tests (PGlite)', () => {
  let pglite: PGlite;
  let txManager: TenantTransactionManager;
  let schoolTypesService: SchoolTypesService;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const USER_ID = '99999999-9999-9999-9999-999999999999';

  beforeAll(async () => {
    pglite = new PGlite();
    const db = drizzle(pglite);

    // Setup tables in PGlite
    await pglite.exec(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        legal_name VARCHAR(255),
        tax_identifier VARCHAR(64),
        primary_currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
        domain VARCHAR(255) UNIQUE,
        logo_url TEXT,
        settings JSONB DEFAULT '{}'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE school_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_school_type_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE hierarchy_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        node_type_id UUID,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        hierarchy_node_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        parent_id UUID NOT NULL,
        school_type VARCHAR(64) DEFAULT 'K12',
        registration_number VARCHAR(128),
        education_board VARCHAR(128),
        principal_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(64),
        alternate_phone VARCHAR(64),
        address TEXT,
        area VARCHAR(128),
        city VARCHAR(128),
        province VARCHAR(128),
        postal_code VARCHAR(32),
        website VARCHAR(255),
        logo_url TEXT,
        custom_domain VARCHAR(255),
        default_language VARCHAR(32) DEFAULT 'en' NOT NULL,
        timezone VARCHAR(64) DEFAULT 'UTC' NOT NULL,
        currency VARCHAR(16) DEFAULT 'PKR' NOT NULL,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        hierarchy_node_id UUID,
        actor_id UUID,
        actor_email VARCHAR(255),
        impersonator_id UUID,
        module VARCHAR(64) DEFAULT 'GENERAL' NOT NULL,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID NOT NULL,
        before_state JSONB,
        after_state JSONB,
        diff JSONB,
        outcome VARCHAR(32) DEFAULT 'SUCCESS' NOT NULL,
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    // Insert test organizations
    await pglite.exec(`
      INSERT INTO organizations (id, code, name)
      VALUES 
        ('${TENANT_A}', 'org_alpha', 'Alpha Organization'),
        ('${TENANT_B}', 'org_beta', 'Beta Organization');
    `);

    // Mock TenantTransactionManager for in-process testing
    txManager = {
      runInTenantContext: async (_tenantId: string, callback: (tx: any) => Promise<any>) => {
        return callback(db);
      },
    } as unknown as TenantTransactionManager;

    const auditService = new AuditService(txManager);
    schoolTypesService = new SchoolTypesService(txManager, auditService);
  });

  it('1. Creates a new School Type successfully with audit log', async () => {
    const created = await schoolTypesService.createSchoolType(
      TENANT_A,
      {
        code: 'k12', // lowercase input should be normalized to uppercase
        name: 'K-12 Comprehensive School',
        description: 'Covers kindergarten to grade 12',
        status: true,
      },
      USER_ID
    );

    expect(created.id).toBeDefined();
    expect(created.code).toBe('K12');
    expect(created.name).toBe('K-12 Comprehensive School');
    expect(created.isActive).toBe(true);

    // Verify audit log entry
    const auditRes = await pglite.query(
      `SELECT * FROM audit_logs WHERE entity_id = '${created.id}' AND action = 'CREATE'`
    );
    expect(auditRes.rows.length).toBe(1);
    expect((auditRes.rows[0] as any).entity_type).toBe('school_type');
  });

  it('2. Prevents duplicate School Type code in the same tenant', async () => {
    await expect(
      schoolTypesService.createSchoolType(
        TENANT_A,
        {
          code: 'K12',
          name: 'Duplicate K12',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  it('3. Allows same School Type code in different tenant (Tenant Isolation)', async () => {
    const createdTenantB = await schoolTypesService.createSchoolType(
      TENANT_B,
      {
        code: 'K12',
        name: 'Beta K12 Institution',
      },
      USER_ID
    );

    expect(createdTenantB.id).toBeDefined();
    expect(createdTenantB.organizationId).toBe(TENANT_B);
    expect(createdTenantB.code).toBe('K12');
  });

  it('4. Lists School Types with accurate referenced school counts', async () => {
    // Create College and University in Tenant A
    const col = await schoolTypesService.createSchoolType(
      TENANT_A,
      { code: 'COL', name: 'Intermediate College' },
      USER_ID
    );
    const uni = await schoolTypesService.createSchoolType(
      TENANT_A,
      { code: 'UNI', name: 'University Campus', status: false },
      USER_ID
    );

    // Insert 2 schools referencing COL and 1 referencing K12 in Tenant A
    await pglite.exec(`
      INSERT INTO schools (id, organization_id, hierarchy_node_id, code, name, parent_id, school_type)
      VALUES 
        (gen_random_uuid(), '${TENANT_A}', gen_random_uuid(), 'SCH_01', 'College Branch 1', gen_random_uuid(), 'COL'),
        (gen_random_uuid(), '${TENANT_A}', gen_random_uuid(), 'SCH_02', 'College Branch 2', gen_random_uuid(), 'COL'),
        (gen_random_uuid(), '${TENANT_A}', gen_random_uuid(), 'SCH_03', 'K12 Main Branch', gen_random_uuid(), 'K12');
    `);

    const allTypes = await schoolTypesService.listSchoolTypes(TENANT_A, false);

    expect(allTypes.length).toBe(3); // K12, COL, UNI

    const colItem = allTypes.find((t) => t.code === 'COL');
    const k12Item = allTypes.find((t) => t.code === 'K12');
    const uniItem = allTypes.find((t) => t.code === 'UNI');

    expect(colItem?.schoolCount).toBe(2);
    expect(k12Item?.schoolCount).toBe(1);
    expect(uniItem?.schoolCount).toBe(0);
  });

  it('5. Filters activeOnly=true for dropdown consumption by Schools form', async () => {
    const activeOnlyList = await schoolTypesService.listSchoolTypes(TENANT_A, true);

    // UNI is inactive, so it should NOT be in the active-only list
    expect(activeOnlyList.some((t) => t.code === 'UNI')).toBe(false);
    expect(activeOnlyList.some((t) => t.code === 'K12')).toBe(true);
    expect(activeOnlyList.some((t) => t.code === 'COL')).toBe(true);
  });

  it('6. Directly toggles School Type status (Active -> Inactive -> Active)', async () => {
    const colList = await schoolTypesService.listSchoolTypes(TENANT_A, false);
    const col = colList.find((t) => t.code === 'COL')!;
    expect(col.isActive).toBe(true);

    // Deactivate
    const deactivated = await schoolTypesService.toggleSchoolTypeStatus(
      TENANT_A,
      col.id,
      false,
      USER_ID
    );
    expect(deactivated.isActive).toBe(false);

    // Reactivate
    const reactivated = await schoolTypesService.toggleSchoolTypeStatus(
      TENANT_A,
      col.id,
      true,
      USER_ID
    );
    expect(reactivated.isActive).toBe(true);
  });

  it('7. Updates School Type metadata and validates code uniqueness on edit', async () => {
    const colList = await schoolTypesService.listSchoolTypes(TENANT_A, false);
    const col = colList.find((t) => t.code === 'COL')!;

    const updated = await schoolTypesService.updateSchoolType(
      TENANT_A,
      col.id,
      {
        name: 'Higher Secondary & College',
        description: 'Updated description for college institution',
      },
      USER_ID
    );

    expect(updated.name).toBe('Higher Secondary & College');
    expect(updated.description).toBe('Updated description for college institution');

    // Attempting to rename code to existing K12 should throw ConflictException
    await expect(
      schoolTypesService.updateSchoolType(
        TENANT_A,
        col.id,
        { code: 'K12' },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  it('8. Throws NotFoundException when retrieving non-existent School Type', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    await expect(
      schoolTypesService.getSchoolType(TENANT_A, nonExistentId)
    ).rejects.toThrow(NotFoundException);
  });
});
