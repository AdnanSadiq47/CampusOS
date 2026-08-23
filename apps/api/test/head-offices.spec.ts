import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  TenantTransactionManager,
  headOffices,
  regions,
  schools,
  hierarchyNodes,
  hierarchyNodeTypes,
  organizations,
  auditLogs,
  eq,
} from '@campus-os/database';
import { HeadOfficesService } from '../src/modules/head-offices/head-offices.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('HeadOfficesService & Variable-Depth Hierarchy Integration Tests (PGlite)', () => {
  let pglite: PGlite;
  let txManager: TenantTransactionManager;
  let headOfficesService: HeadOfficesService;

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

      CREATE TABLE hierarchy_node_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        level_order INTEGER NOT NULL,
        allow_financial_posting BOOLEAN DEFAULT TRUE NOT NULL,
        allow_user_assignment BOOLEAN DEFAULT TRUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE hierarchy_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        node_type_id UUID,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        address JSONB DEFAULT '{}'::jsonb NOT NULL,
        contact_info JSONB DEFAULT '{}'::jsonb NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE head_offices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        hierarchy_node_id UUID NOT NULL,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(128),
        description TEXT,
        director_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(64),
        alternate_phone VARCHAR(64),
        website VARCHAR(255),
        country VARCHAR(128) DEFAULT 'Pakistan',
        province VARCHAR(128),
        city VARCHAR(128),
        area VARCHAR(128),
        address TEXT,
        postal_code VARCHAR(32),
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_head_office_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE regions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        hierarchy_node_id UUID NOT NULL,
        parent_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(128),
        director_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(64),
        alternate_phone VARCHAR(64),
        website VARCHAR(255),
        address TEXT,
        area VARCHAR(128),
        city VARCHAR(128),
        province VARCHAR(128),
        postal_code VARCHAR(32),
        notes TEXT,
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
        ('${TENANT_A}', 'org_alpha', 'Alpha Academy Network'),
        ('${TENANT_B}', 'org_beta', 'Beta Education Group');
    `);

    // Mock TenantTransactionManager for in-process testing
    txManager = {
      runInTenantContext: async (_tenantId: string, callback: (tx: any) => Promise<any>) => {
        return callback(db);
      },
    } as unknown as TenantTransactionManager;

    const auditService = new AuditService(txManager);
    headOfficesService = new HeadOfficesService(txManager, auditService);
  });

  it('1. Creates a new Head Office and corresponding hierarchy_nodes entry with audit trail', async () => {
    const created = await headOfficesService.createHeadOffice(
      TENANT_A,
      {
        code: 'ho_main', // lowercase input should be normalized to uppercase
        name: 'Alpha Central Directorate & Head Office',
        shortName: 'Central HQ',
        description: 'Main academic and financial headquarters',
        directorName: 'Prof. Dr. Mansoor Ali Khan',
        email: 'directorate@alphaacademy.edu.pk',
        city: 'Islamabad',
        province: 'Federal Capital',
        status: true,
      },
      USER_ID
    );

    expect(created.id).toBeDefined();
    expect(created.code).toBe('HO_MAIN');
    expect(created.name).toBe('Alpha Central Directorate & Head Office');
    expect(created.isActive).toBe(true);

    // Verify hierarchy node creation
    const nodeRes = await pglite.query(
      `SELECT * FROM hierarchy_nodes WHERE id = '${created.hierarchyNodeId}'`
    );
    expect(nodeRes.rows.length).toBe(1);
    expect((nodeRes.rows[0] as any).code).toBe('HO_MAIN');

    // Verify audit log entry
    const auditRes = await pglite.query(
      `SELECT * FROM audit_logs WHERE entity_id = '${created.id}' AND action = 'CREATE'`
    );
    expect(auditRes.rows.length).toBe(1);
    expect((auditRes.rows[0] as any).entity_type).toBe('head_office');
  });

  it('2. Rejects duplicate Head Office code in the same tenant', async () => {
    await expect(
      headOfficesService.createHeadOffice(
        TENANT_A,
        {
          code: 'HO_MAIN',
          name: 'Duplicate Head Office',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  it('3. Allows identical Head Office code in different tenant (Tenant Isolation)', async () => {
    const createdTenantB = await headOfficesService.createHeadOffice(
      TENANT_B,
      {
        code: 'HO_MAIN',
        name: 'Beta Central Head Office',
      },
      USER_ID
    );

    expect(createdTenantB.id).toBeDefined();
    expect(createdTenantB.organizationId).toBe(TENANT_B);
    expect(createdTenantB.code).toBe('HO_MAIN');
  });

  it('4. Lists Head Offices with accurate connected units count (regions + direct schools)', async () => {
    const listA = await headOfficesService.listHeadOffices(TENANT_A);
    const hoMain = listA.find((h) => h.code === 'HO_MAIN')!;

    // Attach 1 Region and 1 direct School to HO_MAIN's hierarchyNodeId
    await pglite.exec(`
      INSERT INTO regions (id, organization_id, hierarchy_node_id, parent_id, code, name)
      VALUES (gen_random_uuid(), '${TENANT_A}', gen_random_uuid(), '${hoMain.hierarchyNodeId}', 'REG_SOUTH', 'South Region');

      INSERT INTO schools (id, organization_id, hierarchy_node_id, code, name, parent_id)
      VALUES (gen_random_uuid(), '${TENANT_A}', gen_random_uuid(), 'SCH_DIRECT', 'Direct Central School', '${hoMain.hierarchyNodeId}');
    `);

    const updatedList = await headOfficesService.listHeadOffices(TENANT_A);
    const updatedHo = updatedList.find((h) => h.code === 'HO_MAIN')!;

    expect(updatedHo.regionCount).toBe(1);
    expect(updatedHo.schoolCount).toBe(1);
    expect(updatedHo.connectedUnitsCount).toBe(2);
  });

  it('5. Toggles Head Office status and verifies deactivation safety (children are NOT deleted)', async () => {
    const listA = await headOfficesService.listHeadOffices(TENANT_A);
    const hoMain = listA.find((h) => h.code === 'HO_MAIN')!;

    // Deactivate Head Office
    const deactivated = await headOfficesService.toggleHeadOfficeStatus(
      TENANT_A,
      hoMain.id,
      false,
      USER_ID
    );
    expect(deactivated.isActive).toBe(false);

    // Verify child regions and schools still exist intact (no cascade destruction)
    const regionsAfter = await pglite.query(
      `SELECT * FROM regions WHERE parent_id = '${hoMain.hierarchyNodeId}'`
    );
    expect(regionsAfter.rows.length).toBe(1);

    const schoolsAfter = await pglite.query(
      `SELECT * FROM schools WHERE parent_id = '${hoMain.hierarchyNodeId}'`
    );
    expect(schoolsAfter.rows.length).toBe(1);

    // Reactivate
    const reactivated = await headOfficesService.toggleHeadOfficeStatus(
      TENANT_A,
      hoMain.id,
      true,
      USER_ID
    );
    expect(reactivated.isActive).toBe(true);
  });

  it('6. Updates Head Office metadata and synchronizes hierarchy node name', async () => {
    const listA = await headOfficesService.listHeadOffices(TENANT_A);
    const hoMain = listA.find((h) => h.code === 'HO_MAIN')!;

    const updated = await headOfficesService.updateHeadOffice(
      TENANT_A,
      hoMain.id,
      {
        name: 'Alpha Supreme Directorate & HQ',
        directorName: 'Prof. Dr. Tariq Mansoor',
      },
      USER_ID
    );

    expect(updated.name).toBe('Alpha Supreme Directorate & HQ');
    expect(updated.directorName).toBe('Prof. Dr. Tariq Mansoor');

    // Verify hierarchy node name updated
    const nodeRes = await pglite.query(
      `SELECT name FROM hierarchy_nodes WHERE id = '${hoMain.hierarchyNodeId}'`
    );
    expect((nodeRes.rows[0] as any).name).toBe('Alpha Supreme Directorate & HQ');
  });

  it('7. Throws NotFoundException for non-existent Head Office ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(
      headOfficesService.getHeadOffice(TENANT_A, fakeId)
    ).rejects.toThrow(NotFoundException);
  });
});
