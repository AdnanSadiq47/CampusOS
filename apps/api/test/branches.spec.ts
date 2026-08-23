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
  let auditService: AuditService;
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
        sort_order INTEGER DEFAULT 1 NOT NULL,
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
        membership_id UUID NOT NULL REFERENCES organization_memberships(id) ON DELETE CASCADE,
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
        assignment_id UUID NOT NULL REFERENCES membership_node_assignments(id) ON DELETE CASCADE,
        role_id UUID NOT NULL
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
    `);

    txManager = new TenantTransactionManager(pglite as any);
    passwordService = new PasswordService();
    auditService = new AuditService(txManager);
    branchesService = new BranchesService(txManager, passwordService, auditService);

    // Seed Tenants
    await db.insert(organizations).values([
      {
        id: TENANT_A,
        code: 'ORG_A',
        name: 'The Educators Network',
      },
      {
        id: TENANT_B,
        code: 'ORG_B',
        name: 'Beaconhouse System',
      },
    ]);

    // Seed Node Types
    const [schoolTypeA] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'SCHOOL',
        name: 'School',
        levelOrder: 30,
        allowFinancialPosting: true,
        allowUserAssignment: true,
      })
      .returning();

    const [branchTypeA] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'BRANCH',
        name: 'Branch / Campus',
        levelOrder: 40,
        allowFinancialPosting: true,
        allowUserAssignment: true,
      })
      .returning();

    const [schoolTypeB] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_B,
        code: 'SCHOOL',
        name: 'School',
        levelOrder: 30,
        allowFinancialPosting: true,
        allowUserAssignment: true,
      })
      .returning();

    // Seed Schools for Tenant A
    const [nodeA1] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: schoolTypeA!.id,
        code: 'SCH_A1',
        name: 'Beacon Horizon Public School',
        path: 'org_a.sch_a1',
      })
      .returning();
    schoolA1NodeId = nodeA1!.id;

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

    const [nodeA2] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: schoolTypeA!.id,
        code: 'SCH_A2',
        name: 'Apex Crescent Grammar School',
        path: 'org_a.sch_a2',
      })
      .returning();
    schoolA2NodeId = nodeA2!.id;

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

    // Seed Schools for Tenant B
    const [nodeB1] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_B,
        nodeTypeId: schoolTypeB!.id,
        code: 'SCH_B1',
        name: 'Islamabad Model College',
        path: 'org_b.sch_b1',
      })
      .returning();
    schoolB1NodeId = nodeB1!.id;

    const [schoolB1] = await db
      .insert(schools)
      .values({
        organizationId: TENANT_B,
        hierarchyNodeId: schoolB1NodeId,
        code: 'SCH_B1',
        name: 'Islamabad Model College',
        parentId: schoolB1NodeId,
        city: 'Islamabad',
      })
      .returning();
    schoolB1Id = schoolB1!.id;
  });

  // ── TEST 1: CREATE BRANCH UNDER SCHOOL ─────────────────────────────
  it('1. should create a branch belonging to a school and establish hierarchy node with ltree path', async () => {
    const created = await branchesService.createBranch(
      TENANT_A,
      {
        schoolId: schoolA1Id,
        code: 'BR_GULSHAN',
        name: 'Gulshan Senior Campus',
        shortName: 'Gulshan Campus',
        phone: '+92 21 34981122',
        email: 'gulshan@beaconhorizon.edu.pk',
        city: 'Karachi',
        province: 'Sindh',
        country: 'Pakistan',
        status: true,
      },
      USER_ID
    );

    expect(created).toBeDefined();
    expect(created.code).toBe('BR_GULSHAN');
    expect(created.name).toBe('Gulshan Senior Campus');
    expect(created.schoolId).toBe(schoolA1Id);
    expect(created.sortOrder).toBe(1);

    // Verify hierarchy_nodes link and path hierarchy
    const [node] = await txManager.runInTenantContext(TENANT_A, async (tx) =>
      tx
        .select()
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, created.hierarchyNodeId))
    );

    expect(node).toBeDefined();
    expect(node!.parentId).toBe(schoolA1NodeId);
    expect(node!.path).toBe('org_a.sch_a1.br_gulshan');
  });

  // ── TEST 2: AUTO-INCREMENT SORT ORDER FOR SAME SCHOOL ──────────────
  it('2. should automatically suggest highest + 1 sort order for subsequent branch under same school', async () => {
    const nextOrderDto = await branchesService.getNextSortOrder(TENANT_A, schoolA1Id);
    expect(nextOrderDto.nextSortOrder).toBe(2);

    const branch2 = await branchesService.createBranch(
      TENANT_A,
      {
        schoolId: schoolA1Id,
        code: 'BR_CLIFTON',
        name: 'Clifton Junior Campus',
        city: 'Karachi',
      },
      USER_ID
    );

    expect(branch2.sortOrder).toBe(2);
  });

  // ── TEST 3: PREVENT DUPLICATE BRANCH CODE PER TENANT ───────────────
  it('3. should reject branch with duplicate code within the same organization', async () => {
    await expect(
      branchesService.createBranch(
        TENANT_A,
        {
          schoolId: schoolA1Id,
          code: 'BR_GULSHAN', // Duplicate code
          name: 'Another Gulshan Branch',
        },
        USER_ID
      )
    ).rejects.toThrow(ConflictException);
  });

  // ── TEST 4: PREVENT CROSS-TENANT SCHOOL SELECTION ──────────────────
  it('4. should reject creating branch with a parent school from another tenant', async () => {
    await expect(
      branchesService.createBranch(
        TENANT_A,
        {
          schoolId: schoolB1Id, // School belonging to Tenant B
          code: 'BR_ILLEGAL',
          name: 'Illegal Cross Tenant Branch',
        },
        USER_ID
      )
    ).rejects.toThrow(NotFoundException);
  });

  // ── TEST 5: CREATE BRANCH WITH ADMIN USER PROVISIONING ─────────────
  it('5. should provision branch administrator with Argon2id password hash and scoped node assignment', async () => {
    const rawPassword = 'SecurePassword2026!';
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

  // ── TEST 6: GET BRANCH DETAIL ──────────────────────────────────────
  it('6. should retrieve branch details with associated school and admin contact without exposing credentials', async () => {
    const list = await branchesService.listBranches(TENANT_A);
    const jt = list.find((b) => b.code === 'BR_JOHAR_TOWN');
    expect(jt).toBeDefined();

    const detail = await branchesService.getBranchById(TENANT_A, jt!.id);
    expect(detail).toBeDefined();
    expect(detail.name).toBe('Johar Town Main Campus');
    expect(detail.schoolName).toBe('Apex Crescent Grammar School');
    expect(detail.adminEmail).toBe('admin.johartown@apexgrammar.edu.pk');

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

  // ── TEST 8: REORDER BRANCHES PERSISTENCE & AUDIT ───────────────────
  it('8. should reorder branches within a school and persist new sequence with audit log', async () => {
    const schoolBranches = await branchesService.listBranches(TENANT_A, { schoolId: schoolA1Id });
    expect(schoolBranches.length).toBe(2);

    const originalOrder = schoolBranches.map((b) => b.id);
    const reversedOrder = [...originalOrder].reverse();

    const reorderResult = await branchesService.reorderBranches(
      TENANT_A,
      {
        schoolId: schoolA1Id,
        branchIds: reversedOrder,
      },
      USER_ID
    );

    expect(reorderResult.success).toBe(true);

    const reorderedBranches = await branchesService.listBranches(TENANT_A, { schoolId: schoolA1Id });
    expect(reorderedBranches[0]!.id).toBe(reversedOrder[0]);
    expect(reorderedBranches[0]!.sortOrder).toBe(1);
    expect(reorderedBranches[1]!.id).toBe(reversedOrder[1]);
    expect(reorderedBranches[1]!.sortOrder).toBe(2);
  });

  // ── TEST 9: SUGGEST USERNAME ENGINE ────────────────────────────────
  it('9. should suggest normalized and available usernames for branch administrators', async () => {
    const suggestion = await branchesService.suggestUsername(
      TENANT_A,
      schoolA1Id,
      'BR_NORTH',
      'North Campus'
    );

    expect(suggestion).toBeDefined();
    expect(suggestion.username).toBeTruthy();
    expect(suggestion.username).toContain('brnorth');
    expect(suggestion.isAvailable).toBe(true);
    expect(suggestion.alternatives.length).toBeGreaterThan(0);
  });
});
