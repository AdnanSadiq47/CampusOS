import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  TenantTransactionManager,
  organizations,
  hierarchyNodeTypes,
  hierarchyNodes,
  schools,
  auditLogs,
  eq,
} from '@campus-os/database';
import { SchoolsService } from '../src/modules/schools/schools.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('SchoolsService & Configurable Hierarchy Integration Tests', () => {
  let pglite: PGlite;
  let txManager: TenantTransactionManager;
  let schoolsService: SchoolsService;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const USER_ID = '99999999-9999-9999-9999-999999999999';

  let hoNodeTypeId: string;
  let regionNodeTypeId: string;
  let parentHeadOfficeId: string;
  let parentRegionSouthId: string;

  beforeAll(async () => {
    pglite = new PGlite();
    const db = drizzle(pglite);

    // Setup base schema in PGlite
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
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_node_type_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE hierarchy_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        node_type_id UUID NOT NULL,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        address JSONB DEFAULT '{}'::jsonb NOT NULL,
        contact_info JSONB DEFAULT '{}'::jsonb NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_nodes_org_code UNIQUE (organization_id, code)
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
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_school_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

    // Insert Organization Tenants
    await db.insert(organizations).values([
      { id: TENANT_A, code: 'alpha_academy', name: 'Alpha Academy Network' },
      { id: TENANT_B, code: 'beta_uni', name: 'Beta University System' },
    ]);

    // Insert Hierarchy Node Types for Head Office and Region
    const [hoType] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'HEAD_OFFICE',
        name: 'Head Office',
        levelOrder: 10,
        allowFinancialPosting: true,
        allowUserAssignment: true,
      })
      .returning();
    hoNodeTypeId = hoType!.id;

    const [regType] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'REGION',
        name: 'Regional Office',
        levelOrder: 20,
        allowFinancialPosting: true,
        allowUserAssignment: true,
      })
      .returning();
    regionNodeTypeId = regType!.id;

    // Create Root Head Office Node
    const [hoNode] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: hoNodeTypeId,
        code: 'HO_MAIN',
        name: 'Central Directorate & Head Office',
        path: 'root.ho',
      })
      .returning();
    parentHeadOfficeId = hoNode!.id;

    // Create Region South Node
    const [regionNode] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: regionNodeTypeId,
        parentId: parentHeadOfficeId,
        code: 'REGION_SOUTH',
        name: 'Southern Regional Directorate',
        path: 'root.ho.south',
      })
      .returning();
    parentRegionSouthId = regionNode!.id;

    txManager = new TenantTransactionManager(pglite as any);
    const auditService = new AuditService(txManager);
    schoolsService = new SchoolsService(txManager, auditService);
  });

  it('1. Successfully creates a School under a Region node with automatic hierarchy synchronization', async () => {
    const school = await schoolsService.createSchool(
      TENANT_A,
      {
        name: 'Beacon Horizon Public School',
        code: 'SCH_KHI_01',
        parentId: parentRegionSouthId,
        schoolType: 'K12',
        registrationNumber: 'REG-KHI-2024-889',
        educationBoard: 'BISE Karachi / Cambridge',
        principalName: 'Dr. Tariq Mehmood',
        email: 'principal@horizon.edu.pk',
        phone: '+92 21 34567890',
        city: 'Karachi',
        province: 'Sindh',
        status: true,
      },
      USER_ID
    );

    expect(school).toBeDefined();
    expect(school.code).toBe('SCH_KHI_01');
    expect(school.name).toBe('Beacon Horizon Public School');
    expect(school.parentId).toBe(parentRegionSouthId);
    expect(school.hierarchyNodeId).toBeDefined();

    // Verify synchronized hierarchy node exists with correct ltree path
    const [node] = await txManager.withTenant(TENANT_A, async (tx) =>
      tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, school.hierarchyNodeId))
        .limit(1)
    );

    expect(node).toBeDefined();
    expect(node?.code).toBe('SCH_KHI_01');
    expect(node?.path).toBe('root.ho.south.sch_khi_01');
    expect(node?.name).toBe('Beacon Horizon Public School');
  });

  it('2. Successfully creates a School directly under Head Office when no Region exists', async () => {
    const schoolDirect = await schoolsService.createSchool(
      TENANT_A,
      {
        name: 'Apex Capital Model School',
        code: 'SCH_ISB_02',
        parentId: parentHeadOfficeId, // Attached directly to Head Office
        schoolType: 'Secondary',
        city: 'Islamabad',
        status: true,
      },
      USER_ID
    );

    expect(schoolDirect).toBeDefined();
    expect(schoolDirect.parentId).toBe(parentHeadOfficeId);

    const [node] = await txManager.withTenant(TENANT_A, async (tx) =>
      tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, schoolDirect.hierarchyNodeId))
        .limit(1)
    );

    expect(node?.path).toBe('root.ho.sch_isb_02');
  });

  it('3. Rejects duplicate School Code within the same tenant', async () => {
    await expect(
      schoolsService.createSchool(
        TENANT_A,
        {
          name: 'Duplicate School Code Attempt',
          code: 'SCH_KHI_01', // Already exists in Tenant A
          parentId: parentRegionSouthId,
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  it('4. Rejects School creation with invalid or non-existent parent hierarchy node', async () => {
    await expect(
      schoolsService.createSchool(
        TENANT_A,
        {
          name: 'Invalid Parent School',
          code: 'SCH_INV_01',
          parentId: '00000000-0000-0000-0000-000000000000',
        },
        USER_ID
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('5. Lists schools with parent context and computes branch count', async () => {
    const list = await schoolsService.listSchools(TENANT_A);
    expect(list.length).toBe(2);

    const khiSchool = list.find((s) => s.code === 'SCH_KHI_01');
    expect(khiSchool).toBeDefined();
    expect(khiSchool?.parentName).toBe('Southern Regional Directorate');
    expect(khiSchool?.branchCount).toBe(0);

    const isbSchool = list.find((s) => s.code === 'SCH_ISB_02');
    expect(isbSchool).toBeDefined();
    expect(isbSchool?.parentName).toBe('Central Directorate & Head Office');
  });

  it('6. Filters schools by search query and active status', async () => {
    const searchResult = await schoolsService.listSchools(TENANT_A, { search: 'Karachi' });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0]?.code).toBe('SCH_KHI_01');

    const codeResult = await schoolsService.listSchools(TENANT_A, { search: 'SCH_ISB_02' });
    expect(codeResult.length).toBe(1);
    expect(codeResult[0]?.name).toBe('Apex Capital Model School');
  });

  it('7. Updates school details and synchronizes changes to the hierarchy node', async () => {
    const list = await schoolsService.listSchools(TENANT_A);
    const target = list[0]!;

    const updated = await schoolsService.updateSchool(
      TENANT_A,
      target.id,
      {
        name: 'Beacon Horizon International School',
        principalName: 'Prof. Ayesha Siddiqui',
        city: 'Karachi South',
      },
      USER_ID
    );

    expect(updated.name).toBe('Beacon Horizon International School');
    expect(updated.principalName).toBe('Prof. Ayesha Siddiqui');
    expect(updated.city).toBe('Karachi South');

    // Verify synchronized hierarchy node updated
    const [node] = await txManager.withTenant(TENANT_A, async (tx) =>
      tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, target.hierarchyNodeId))
        .limit(1)
    );

    expect(node?.name).toBe('Beacon Horizon International School');
  });

  it('8. Toggles active/inactive status and updates both school and hierarchy node', async () => {
    const list = await schoolsService.listSchools(TENANT_A);
    const target = list[0]!;

    const deactivated = await schoolsService.toggleSchoolStatus(TENANT_A, target.id, false, USER_ID);
    expect(deactivated.isActive).toBe(false);

    const [node] = await txManager.withTenant(TENANT_A, async (tx) =>
      tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, target.hierarchyNodeId))
        .limit(1)
    );
    expect(node?.isActive).toBe(false);

    // Reactivate
    const reactivated = await schoolsService.toggleSchoolStatus(TENANT_A, target.id, true, USER_ID);
    expect(reactivated.isActive).toBe(true);
  });

  it('9. Enforces strict cross-tenant isolation: Tenant B cannot view or modify Tenant A schools', async () => {
    // Tenant B queries schools -> should return 0 schools
    const tenantBSchools = await schoolsService.listSchools(TENANT_B);
    expect(tenantBSchools.length).toBe(0);

    const tenantASchools = await schoolsService.listSchools(TENANT_A);
    const tenantASchoolId = tenantASchools[0]!.id;

    // Tenant B attempts to get Tenant A school -> throws NotFoundException
    await expect(schoolsService.getSchool(TENANT_B, tenantASchoolId)).rejects.toThrow(NotFoundException);

    // Tenant B attempts to update Tenant A school -> throws NotFoundException
    await expect(
      schoolsService.updateSchool(TENANT_B, tenantASchoolId, { name: 'Hacked School Name' }, USER_ID)
    ).rejects.toThrow(NotFoundException);
  });
});
