import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  TenantTransactionManager,
  branches,
  schools,
  hierarchyNodes,
  hierarchyNodeTypes,
  organizations,
  identityUsers,
  organizationMemberships,
  membershipNodeAssignments,
  assignmentRoles,
  auditLogs,
  eq,
} from '@campus-os/database';
import { BranchesService } from '../src/modules/branches/branches.service.js';
import { PasswordService } from '../src/core/iam/services/password.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('BranchesService & Campus Management Integration Tests (PGlite)', () => {
  let pglite: PGlite;
  let txManager: TenantTransactionManager;
  let passwordService: PasswordService;
  let branchesService: BranchesService;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const USER_ID = '99999999-9999-9999-9999-999999999999';

  let schoolA1Id: string;
  let schoolA1NodeId: string;
  let schoolA2Id: string;
  let schoolA2NodeId: string;
  let schoolB1Id: string;
  let schoolB1NodeId: string;

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
        node_type_id UUID NOT NULL REFERENCES hierarchy_node_types(id),
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path TEXT NOT NULL,
        address JSONB DEFAULT '{}'::jsonb NOT NULL,
        contact_info JSONB DEFAULT '{}'::jsonb NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
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

      CREATE TABLE branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        hierarchy_node_id UUID NOT NULL,
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(128),
        description TEXT,
        logo_url TEXT,
        phone VARCHAR(64),
        alternate_phone VARCHAR(64),
        email VARCHAR(255),
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
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE identity_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(32),
        mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
        mfa_secret_encrypted BYTEA,
        mfa_secret_iv BYTEA,
        mfa_key_version INTEGER DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        email_verified_at TIMESTAMPTZ,
        failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
        locked_until TIMESTAMPTZ,
        security_stamp UUID DEFAULT gen_random_uuid() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE organization_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        identity_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
        membership_type VARCHAR(32) DEFAULT 'STAFF' NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMPTZ,
        version INTEGER DEFAULT 1 NOT NULL,
        joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE membership_node_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL,
        hierarchy_node_id UUID NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMPTZ,
        assigned_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE assignment_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        assignment_id UUID NOT NULL,
        role_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
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
        entity_type VARCHAR(128) NOT NULL,
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

    // Seed Organizations
    await db.insert(organizations).values([
      { id: TENANT_A, code: 'TENANT_A', name: 'Alpha Educational Network' },
      { id: TENANT_B, code: 'TENANT_B', name: 'Beta Learning Trust' },
    ]);

    // Seed Node Types
    const [schoolTypeA] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'SCHOOL',
        name: 'School',
        levelOrder: 30,
      })
      .returning();

    const [branchTypeA] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'BRANCH',
        name: 'Branch / Campus',
        levelOrder: 40,
      })
      .returning();

    const [schoolTypeB] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_B,
        code: 'SCHOOL',
        name: 'School',
        levelOrder: 30,
      })
      .returning();

    // Seed Schools & Hierarchy Nodes for Tenant A
    const [nodeSchoolA1] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: schoolTypeA!.id,
        code: 'SCH_A1',
        name: 'Beacon Horizon Public School',
        path: 'tenant_a.sch_a1',
      })
      .returning();
    schoolA1NodeId = nodeSchoolA1!.id;

    const [schoolA1] = await db
      .insert(schools)
      .values({
        organizationId: TENANT_A,
        hierarchyNodeId: schoolA1NodeId,
        code: 'SCH_A1',
        name: 'Beacon Horizon Public School',
        parentId: schoolA1NodeId,
        city: 'Karachi',
      })
      .returning();
    schoolA1Id = schoolA1!.id;

    const [nodeSchoolA2] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: schoolTypeA!.id,
        code: 'SCH_A2',
        name: 'Apex Crescent Grammar School',
        path: 'tenant_a.sch_a2',
      })
      .returning();
    schoolA2NodeId = nodeSchoolA2!.id;

    const [schoolA2] = await db
      .insert(schools)
      .values({
        organizationId: TENANT_A,
        hierarchyNodeId: schoolA2NodeId,
        code: 'SCH_A2',
        name: 'Apex Crescent Grammar School',
        parentId: schoolA2NodeId,
        city: 'Lahore',
      })
      .returning();
    schoolA2Id = schoolA2!.id;

    // Seed School for Tenant B
    const [nodeSchoolB1] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_B,
        nodeTypeId: schoolTypeB!.id,
        code: 'SCH_B1',
        name: 'Beta City School',
        path: 'tenant_b.sch_b1',
      })
      .returning();
    schoolB1NodeId = nodeSchoolB1!.id;

    const [schoolB1] = await db
      .insert(schools)
      .values({
        organizationId: TENANT_B,
        hierarchyNodeId: schoolB1NodeId,
        code: 'SCH_B1',
        name: 'Beta City School',
        parentId: schoolB1NodeId,
        city: 'Islamabad',
      })
      .returning();
    schoolB1Id = schoolB1!.id;

    txManager = {
      runInTenantContext: async (_tenantId: string, callback: (tx: any) => Promise<any>) => {
        return callback(db);
      },
    } as unknown as TenantTransactionManager;
    passwordService = new PasswordService();
    const auditService = new AuditService(txManager);
    branchesService = new BranchesService(txManager, passwordService, auditService);
  });

  // ── TEST 1: CREATE BRANCH & ATTACH TO SCHOOL ──────────────────────
  it('1. should create a Branch linked to a School and establish correct hierarchy node path', async () => {
    const created = await branchesService.createBranch(
      TENANT_A,
      {
        schoolId: schoolA1Id,
        code: 'BR_GULSHAN',
        name: 'Gulshan Senior Campus',
        shortName: 'Gulshan Campus',
        city: 'Karachi',
        province: 'Sindh',
        status: true,
      },
      USER_ID
    );

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.code).toBe('BR_GULSHAN');
    expect(created.schoolId).toBe(schoolA1Id);

    // Verify hierarchy node was created with correct parent and path
    const [node] = await txManager.runInTenantContext(TENANT_A, async (tx) =>
      tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, created.hierarchyNodeId))
    );

    expect(node).toBeDefined();
    expect(node!.parentId).toBe(schoolA1NodeId);
    expect(node!.path).toBe('tenant_a.sch_a1.br_gulshan');
  });

  // ── TEST 2: ONE SCHOOL CAN HAVE MULTIPLE BRANCHES ──────────────────
  it('2. should allow multiple branches under the same school', async () => {
    const branch2 = await branchesService.createBranch(
      TENANT_A,
      {
        schoolId: schoolA1Id,
        code: 'BR_CLIFTON',
        name: 'Clifton Junior Campus',
        shortName: 'Clifton Campus',
        city: 'Karachi',
        province: 'Sindh',
      },
      USER_ID
    );

    expect(branch2).toBeDefined();
    expect(branch2.schoolId).toBe(schoolA1Id);
    expect(branch2.code).toBe('BR_CLIFTON');

    const list = await branchesService.listBranches(TENANT_A, { schoolId: schoolA1Id });
    expect(list.length).toBe(2);
    expect(list.map((b) => b.code)).toContain('BR_GULSHAN');
    expect(list.map((b) => b.code)).toContain('BR_CLIFTON');
  });

  // ── TEST 3: CODE UNIQUENESS & TENANT ISOLATION ─────────────────────
  it('3. should enforce code uniqueness per tenant while allowing identical code in another tenant', async () => {
    // Duplicate in Tenant A should throw ConflictException
    await expect(
      branchesService.createBranch(
        TENANT_A,
        {
          schoolId: schoolA1Id,
          code: 'BR_GULSHAN',
          name: 'Another Gulshan Branch',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);

    // Same code in Tenant B is completely permitted
    const branchInB = await branchesService.createBranch(
      TENANT_B,
      {
        schoolId: schoolB1Id,
        code: 'BR_GULSHAN',
        name: 'Beta Gulshan Campus',
      },
      USER_ID
    );

    expect(branchInB).toBeDefined();
    expect(branchInB.code).toBe('BR_GULSHAN');
    expect(branchInB.organizationId).toBe(TENANT_B);
  });

  // ── TEST 4: BRANCH ADMINISTRATOR LOGIN PROVISIONING ────────────────
  it('4. should provision an administrator login with Argon2id hash and scope strictly to the branch node', async () => {
    const rawPassword = 'SuperSecretBranchAdminPassword2026!';

    const createdWithAdmin = await branchesService.createBranch(
      TENANT_A,
      {
        schoolId: schoolA2Id,
        code: 'BR_JOHAR_TOWN',
        name: 'Johar Town Main Campus',
        city: 'Lahore',
        adminUser: {
          username: 'admin.johartown',
          email: 'admin.johartown@apexgrammar.edu.pk',
          password: rawPassword,
          forcePasswordChange: true,
        },
      },
      USER_ID
    );

    expect(createdWithAdmin).toBeDefined();

    // Verify identity user exists and password is NOT stored as plaintext
    const [user] = await txManager.runInTenantContext(TENANT_A, async (tx) =>
      tx
        .select()
        .from(identityUsers)
        .where(eq(identityUsers.email, 'admin.johartown@apexgrammar.edu.pk'))
    );

    expect(user).toBeDefined();
    expect(user!.passwordHash).not.toBe(rawPassword);
    expect(user!.passwordHash.startsWith('$argon2')).toBe(true);

    // Verify Argon2id password verification succeeds
    const isValid = await passwordService.verify(user!.passwordHash, rawPassword);
    expect(isValid).toBe(true);

    // Verify organization membership and node assignment scoped to branch hierarchy node
    const [assignment] = await txManager.runInTenantContext(TENANT_A, async (tx) =>
      tx
        .select()
        .from(membershipNodeAssignments)
        .where(eq(membershipNodeAssignments.hierarchyNodeId, createdWithAdmin.hierarchyNodeId))
    );

    expect(assignment).toBeDefined();
    expect(assignment!.hierarchyNodeId).toBe(createdWithAdmin.hierarchyNodeId);
  });

  // ── TEST 5: PREVENT DUPLICATE ADMIN USERNAME/EMAIL ─────────────────
  it('5. should reject duplicate admin email on branch provisioning', async () => {
    await expect(
      branchesService.createBranch(
        TENANT_A,
        {
          schoolId: schoolA2Id,
          code: 'BR_MODEL_TOWN',
          name: 'Model Town Campus',
          adminUser: {
            username: 'admin.johartown',
            email: 'admin.johartown@apexgrammar.edu.pk', // Already used in previous test
            password: 'AnotherPassword123!',
          },
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  // ── TEST 6: GET BRANCH DETAIL (NEVER EXPOSES PASSWORD) ─────────────
  it('6. should retrieve branch details with associated school and admin contact without exposing credentials', async () => {
    const list = await branchesService.listBranches(TENANT_A);
    const jt = list.find((b) => b.code === 'BR_JOHAR_TOWN');
    expect(jt).toBeDefined();

    const detail = await branchesService.getBranch(TENANT_A, jt!.id);
    expect(detail).toBeDefined();
    expect(detail.name).toBe('Johar Town Main Campus');
    expect(detail.schoolName).toBe('Apex Crescent Grammar School');
    expect(detail.adminEmail).toBe('admin.johartown@apexgrammar.edu.pk');
    expect(detail.adminUsername).toBe('admin.johartown');

    // Security invariant: detail object MUST NOT contain password or passwordHash keys
    expect((detail as any).password).toBeUndefined();
    expect((detail as any).passwordHash).toBeUndefined();
  });

  // ── TEST 7: UPDATE BRANCH METADATA & STATUS TOGGLE ─────────────────
  it('7. should update branch metadata and toggle active status cleanly', async () => {
    const list = await branchesService.listBranches(TENANT_A);
    const target = list[0]!;

    const updated = await branchesService.updateBranch(
      TENANT_A,
      target.id,
      {
        shortName: 'Updated Short Name',
        phone: '+92 300 1234567',
        isActive: false,
      },
      USER_ID
    );

    expect(updated.shortName).toBe('Updated Short Name');
    expect(updated.phone).toBe('+92 300 1234567');
    expect(updated.isActive).toBe(false);

    // Verify status reflected in hierarchy_nodes
    const [node] = await txManager.runInTenantContext(TENANT_A, async (tx) =>
      tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, target.hierarchyNodeId))
    );

    expect(node!.isActive).toBe(false);
  });

  // ── TEST 8: GET ELIGIBLE SCHOOLS ──────────────────────────────────
  it('8. should return eligible schools for branch parent selection', async () => {
    const eligible = await branchesService.getEligibleSchools(TENANT_A);
    expect(eligible.length).toBe(2);
    expect(eligible.map((s) => s.code)).toContain('SCH_A1');
    expect(eligible.map((s) => s.code)).toContain('SCH_A2');
  });
});
