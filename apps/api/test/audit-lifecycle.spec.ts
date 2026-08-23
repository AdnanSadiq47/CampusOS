import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  TenantTransactionManager,
  auditLogs,
  hierarchyNodes,
  hierarchyNodeTypes,
  organizations,
  schools,
  branches,
  eq,
} from '@campus-os/database';
import { AuditService } from '../src/core/audit/audit.service.js';
import { SchoolsService } from '../src/modules/schools/schools.service.js';
import { BranchesService } from '../src/modules/branches/branches.service.js';
import { PasswordService } from '../src/core/iam/services/password.service.js';

describe('Permanent Audit Logging & Safe Record Lifecycle Policy (PGlite)', () => {
  let pglite: PGlite;
  let txManager: TenantTransactionManager;
  let auditService: AuditService;
  let passwordService: PasswordService;
  let schoolsService: SchoolsService;
  let branchesService: BranchesService;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const ACTOR_A = '99999999-9999-9999-9999-999999999999';

  let schoolNodeAId: string;
  let schoolAId: string;
  let branch1NodeId: string;
  let branch1Id: string;
  let branch2NodeId: string;
  let branch2Id: string;

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
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
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

    // Seed Organizations
    await db.insert(organizations).values([
      { id: TENANT_A, code: 'TENANT_A', name: 'Alpha Educational Network' },
      { id: TENANT_B, code: 'TENANT_B', name: 'Beta Learning Group' },
    ]);

    // Seed Node Types
    const [schoolNodeType] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'SCHOOL',
        name: 'School',
        levelOrder: 30,
      })
      .returning();

    const [branchNodeType] = await db
      .insert(hierarchyNodeTypes)
      .values({
        organizationId: TENANT_A,
        code: 'BRANCH',
        name: 'Branch / Campus',
        levelOrder: 40,
      })
      .returning();

    // Seed School Node in Tenant A (path: tenant_a.school_1)
    const [nodeSchool] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: schoolNodeType!.id,
        code: 'SCH_01',
        name: 'Alpha Horizon School',
        path: 'tenant_a.sch_01',
      })
      .returning();
    schoolNodeAId = nodeSchool!.id;

    const [schoolRecord] = await db
      .insert(schools)
      .values({
        organizationId: TENANT_A,
        hierarchyNodeId: schoolNodeAId,
        code: 'SCH_01',
        name: 'Alpha Horizon School',
        parentId: schoolNodeAId,
        city: 'Karachi',
        phone: '+92 21 11122233',
      })
      .returning();
    schoolAId = schoolRecord!.id;

    // Seed Branch 1 under School (path: tenant_a.sch_01.br_north)
    const [nodeBranch1] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: branchNodeType!.id,
        parentId: schoolNodeAId,
        code: 'BR_NORTH',
        name: 'North Campus',
        path: 'tenant_a.sch_01.br_north',
      })
      .returning();
    branch1NodeId = nodeBranch1!.id;

    const [branch1Record] = await db
      .insert(branches)
      .values({
        organizationId: TENANT_A,
        hierarchyNodeId: branch1NodeId,
        schoolId: schoolAId,
        code: 'BR_NORTH',
        name: 'North Campus',
        phone: '+92 21 36611223',
        city: 'Karachi',
      })
      .returning();
    branch1Id = branch1Record!.id;

    // Seed Branch 2 under School (path: tenant_a.sch_01.br_south)
    const [nodeBranch2] = await db
      .insert(hierarchyNodes)
      .values({
        organizationId: TENANT_A,
        nodeTypeId: branchNodeType!.id,
        parentId: schoolNodeAId,
        code: 'BR_SOUTH',
        name: 'South Campus',
        path: 'tenant_a.sch_01.br_south',
      })
      .returning();
    branch2NodeId = nodeBranch2!.id;

    const [branch2Record] = await db
      .insert(branches)
      .values({
        organizationId: TENANT_A,
        hierarchyNodeId: branch2NodeId,
        schoolId: schoolAId,
        code: 'BR_SOUTH',
        name: 'South Campus',
        phone: '+92 21 35899887',
        city: 'Karachi',
      })
      .returning();
    branch2Id = branch2Record!.id;

    txManager = {
      runInTenantContext: async (_tenantId: string, callback: (tx: any) => Promise<any>) => {
        return callback(db);
      },
    } as unknown as TenantTransactionManager;

    auditService = new AuditService(txManager);
    passwordService = new PasswordService();
    schoolsService = new SchoolsService(txManager, auditService);
    branchesService = new BranchesService(txManager, passwordService, auditService);
  });

  // ── TEST 1: CREATE ACTION RECORDS AUDIT EVENT ─────────────────────
  it('1. should record structured audit event on entity creation with node context', async () => {
    const log = await auditService.logEvent({
      organizationId: TENANT_A,
      hierarchyNodeId: branch1NodeId,
      actorId: ACTOR_A,
      actorEmail: 'admin@alpha.edu.pk',
      module: 'ORGANIZATION',
      action: 'CREATE',
      entityType: 'branch',
      entityId: branch1Id,
      beforeState: null,
      afterState: { id: branch1Id, name: 'North Campus', code: 'BR_NORTH' },
      outcome: 'SUCCESS',
    });

    expect(log).toBeDefined();
    expect(log.action).toBe('CREATE');
    expect(log.module).toBe('ORGANIZATION');
    expect(log.organizationId).toBe(TENANT_A);
    expect(log.hierarchyNodeId).toBe(branch1NodeId);
    expect(log.outcome).toBe('SUCCESS');
    expect(log.diff).toBeNull();
  });

  // ── TEST 2: COMPACT DIFF COMPUTATION ON UPDATE ────────────────────
  it('2. should automatically compute compact field-level delta on update, ignoring unchanged fields', async () => {
    const beforeState = {
      id: schoolAId,
      name: 'Alpha Horizon School',
      phone: '+92 21 11122233',
      city: 'Karachi',
      principalName: 'Mr. Tariq',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const afterState = {
      id: schoolAId,
      name: 'Alpha Horizon School', // Unchanged
      phone: '+92 21 99988877',     // Changed
      city: 'Karachi',              // Unchanged
      principalName: 'Dr. Tariq',   // Changed
      updatedAt: '2026-08-23T11:00:00Z', // Ignored timestamp
    };

    const log = await auditService.logEvent({
      organizationId: TENANT_A,
      hierarchyNodeId: schoolNodeAId,
      actorId: ACTOR_A,
      actorEmail: 'admin@alpha.edu.pk',
      module: 'ORGANIZATION',
      action: 'UPDATE',
      entityType: 'school',
      entityId: schoolAId,
      beforeState,
      afterState,
    });

    expect(log.diff).toBeDefined();
    const diff = log.diff as Record<string, { before: unknown; after: unknown }>;

    // Only changed fields should be in diff
    expect(Object.keys(diff)).toEqual(['phone', 'principalName']);
    expect(diff['phone']).toEqual({ before: '+92 21 11122233', after: '+92 21 99988877' });
    expect(diff['principalName']).toEqual({ before: 'Mr. Tariq', after: 'Dr. Tariq' });

    // Unchanged and timestamp fields must NOT pollute diff
    expect(diff['name']).toBeUndefined();
    expect(diff['city']).toBeUndefined();
    expect(diff['updatedAt']).toBeUndefined();
  });

  // ── TEST 3: STATUS TRANSITIONS (DEACTIVATE / ACTIVATE) ─────────────
  it('3. should record explicit DEACTIVATE and ACTIVATE audit actions on record status changes', async () => {
    const deactLog = await auditService.logEvent({
      organizationId: TENANT_A,
      hierarchyNodeId: branch2NodeId,
      actorId: ACTOR_A,
      actorEmail: 'admin@alpha.edu.pk',
      module: 'ORGANIZATION',
      action: 'DEACTIVATE',
      entityType: 'branch',
      entityId: branch2Id,
      beforeState: { id: branch2Id, isActive: true },
      afterState: { id: branch2Id, isActive: false },
    });

    expect(deactLog.action).toBe('DEACTIVATE');
    expect((deactLog.diff as any)?.isActive).toEqual({ before: true, after: false });

    const actLog = await auditService.logEvent({
      organizationId: TENANT_A,
      hierarchyNodeId: branch2NodeId,
      actorId: ACTOR_A,
      actorEmail: 'admin@alpha.edu.pk',
      module: 'ORGANIZATION',
      action: 'ACTIVATE',
      entityType: 'branch',
      entityId: branch2Id,
      beforeState: { id: branch2Id, isActive: false },
      afterState: { id: branch2Id, isActive: true },
    });

    expect(actLog.action).toBe('ACTIVATE');
    expect((actLog.diff as any)?.isActive).toEqual({ before: false, after: true });
  });

  // ── TEST 4: STRICT SECRET REDACTION IN AUDIT PAYLOADS ─────────────
  it('4. should strictly redact plaintext passwords, password hashes, and tokens from all audit payloads', async () => {
    const log = await auditService.logEvent({
      organizationId: TENANT_A,
      hierarchyNodeId: branch1NodeId,
      actorId: ACTOR_A,
      actorEmail: 'admin@alpha.edu.pk',
      module: 'IAM',
      action: 'PASSWORD_CHANGE',
      entityType: 'identity_user',
      entityId: ACTOR_A,
      beforeState: {
        email: 'admin@alpha.edu.pk',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$oldsecret...',
        token: 'eyJhbGciOiJIUzI1NiIs...',
      },
      afterState: {
        email: 'admin@alpha.edu.pk',
        password: 'PlainTextPasswordThatMustNeverBeLogged123!',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$newsecret...',
        token: 'eyJhbGciOiJIUzI1NiIs...',
      },
      metadata: {
        clientSecret: 'super-secret-api-key',
        sessionToken: 'xyz123',
      },
    });

    const before = log.beforeState as any;
    const after = log.afterState as any;
    const meta = log.metadata as any;

    expect(before.passwordHash).toBe('[REDACTED_SECRET]');
    expect(before.token).toBe('[REDACTED_SECRET]');

    expect(after.password).toBe('[REDACTED_SECRET]');
    expect(after.passwordHash).toBe('[REDACTED_SECRET]');
    expect(after.token).toBe('[REDACTED_SECRET]');

    expect(meta.clientSecret).toBe('[REDACTED_SECRET]');
    expect(meta.sessionToken).toBe('[REDACTED_SECRET]');
  });

  // ── TEST 5: TENANT ISOLATION ON AUDIT QUERIES ─────────────────────
  it('5. should enforce strict tenant isolation so Tenant B cannot see Tenant A audit logs', async () => {
    // Record log for Tenant B
    await auditService.logEvent({
      organizationId: TENANT_B,
      actorId: '88888888-8888-8888-8888-888888888888',
      actorEmail: 'admin@beta.edu.pk',
      module: 'ORGANIZATION',
      action: 'CREATE',
      entityType: 'school',
      entityId: '77777777-7777-7777-7777-777777777777',
    });

    // Query for Tenant A
    const logsA = await auditService.queryAuditLogs(TENANT_A);
    expect(logsA.items.every((l) => l.organizationId === TENANT_A)).toBe(true);

    // Query for Tenant B
    const logsB = await auditService.queryAuditLogs(TENANT_B);
    expect(logsB.items.every((l) => l.organizationId === TENANT_B)).toBe(true);
  });

  // ── TEST 6: SCOPE-AWARE BRANCH/NODE QUERYING ──────────────────────
  it('6. should filter audit logs according to user branch/node scope', async () => {
    // Branch 1 Admin querying audit logs scoped to branch1NodeId
    const branch1Logs = await auditService.queryAuditLogs(
      TENANT_A,
      {},
      branch1NodeId // Viewer only has access to Branch 1
    );

    // Should only contain logs with hierarchyNodeId === branch1NodeId
    expect(branch1Logs.items.length).toBeGreaterThan(0);
    expect(branch1Logs.items.every((l) => l.hierarchyNodeId === branch1NodeId)).toBe(true);

    // Must NOT contain Branch 2 logs
    expect(branch1Logs.items.some((l) => l.hierarchyNodeId === branch2NodeId)).toBe(false);
  });

  // ── TEST 7: IMMUTABILITY & SAFE LIFECYCLE ─────────────────────────
  it('7. should ensure audit service is strictly append-only with no update/delete methods exposed', () => {
    expect((auditService as any).updateLog).toBeUndefined();
    expect((auditService as any).deleteLog).toBeUndefined();
    expect((auditService as any).deleteEvent).toBeUndefined();
  });
});
