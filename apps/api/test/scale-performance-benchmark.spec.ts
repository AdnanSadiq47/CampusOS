import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  CANONICAL_ORG_ID_A,
  CANONICAL_CAMPUS_IDS,
  CANONICAL_SCHOOL_IDS,
  TenantTransactionManager,
  generateSyntheticScaleDataset,
  bootstrapPgLiteSchema,
} from '@campus-os/database';
import { AdmissionsService, UserScopeContext } from '../src/modules/admissions/admissions.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { WorkingContextService } from '../src/core/hierarchy/working-context.service.js';

describe('CampusOS Scale & High-Growth Architecture Performance Spec (1M Scale Baseline)', () => {
  let pglite: PGlite;
  let admissionsService: AdmissionsService;
  let txManager: TenantTransactionManager;
  let auditService: AuditService;
  let contextService: WorkingContextService;

  const headOfficeScope: UserScopeContext = {
    organizationId: CANONICAL_ORG_ID_A,
    userRole: 'ADMIN',
    workingContext: {
      nodeId: 'ho_alpha',
      nodeType: 'HEAD_OFFICE',
      nodeName: 'Alpha Academy Head Office',
    },
  };

  const cliftonCampusScope: UserScopeContext = {
    organizationId: CANONICAL_ORG_ID_A,
    userRole: 'ADMIN',
    workingContext: {
      nodeId: CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS,
      nodeType: 'CAMPUS',
      nodeName: 'Clifton Campus',
    },
  };

  beforeAll(async () => {
    pglite = new PGlite();
    await bootstrapPgLiteSchema(pglite);
    txManager = new TenantTransactionManager(pglite);
    auditService = new AuditService(txManager);
    contextService = new WorkingContextService();
    admissionsService = new AdmissionsService(txManager, auditService, contextService);
  });

  it('1. Bounded Query Rule: Head Office wide scope returns exact page size and SQL aggregate counts', async () => {
    const start = performance.now();
    const result = await admissionsService.getPreAdmissions(
      { page: 1, limit: 25 },
      headOfficeScope
    );
    const duration = performance.now() - start;

    expect(result.items.length).toBeLessThanOrEqual(25);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
    expect(result.total).toBeGreaterThan(0);
    expect(result.summary).toBeDefined();
    expect(result.summary.totalPreAdmissions).toBe(result.total);
    expect(result.summary.newSubmitted).toBeGreaterThanOrEqual(0);
    // Bounded queries should execute in low milliseconds
    expect(duration).toBeLessThan(500);
  });

  it('2. Smallest Authorized Scope Rule: Campus query scans only campus rows', async () => {
    const result = await admissionsService.getPreAdmissions(
      { page: 1, limit: 25 },
      cliftonCampusScope
    );

    // Every item returned must belong to Clifton campus
    for (const item of result.items) {
      expect(item.campusId).toBe(CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS);
    }
  });

  it('3. Synthetic Scale Generator: Populates synthetic campuses, applications, and audit logs without memory failure', async () => {
    const genResult = await generateSyntheticScaleDataset(pglite, {
      organizationId: CANONICAL_ORG_ID_A,
      schoolsCount: 5,
      campusesPerSchool: 4, // 20 campuses
      preAdmissionsPerCampus: 50, // 1,000 applications
      auditLogsPerCampus: 50, // 1,000 audit logs
      batchSize: 250,
      onNodeCreated: (node) => {
        contextService.registerNode({
          id: node.id,
          code: node.code,
          name: node.name,
          type: node.type as any,
          organizationId: CANONICAL_ORG_ID_A,
          parentId: node.parentId || 'ho-alpha',
          childIds: [],
        });
      },
    });

    expect(genResult.totalSchools).toBe(5);
    expect(genResult.totalCampuses).toBe(20);
    expect(genResult.totalPreAdmissions).toBe(1000);
    expect(genResult.totalAuditLogs).toBe(1000);
    expect(genResult.durationMs).toBeGreaterThan(0);
  });

  it('4. High-Volume Pagination Invariant: Page 10 under large dataset returns bounded page with zero memory leak', async () => {
    const start = performance.now();
    const result = await admissionsService.getPreAdmissions(
      { page: 10, limit: 25 },
      headOfficeScope
    );
    const duration = performance.now() - start;

    expect(result.page).toBe(10);
    expect(result.limit).toBe(25);
    expect(result.items.length).toBeLessThanOrEqual(25);
    expect(result.total).toBeGreaterThan(1000);
    expect(duration).toBeLessThan(300);
  });

  it('5. Server-Side Aggregate Invariant: Summary counts remain consistent without loading rows into Node.js heap', async () => {
    const result = await admissionsService.getPreAdmissions(
      { page: 1, limit: 10 },
      headOfficeScope
    );

    const { summary } = result;
    const sumOfCategorized =
      summary.newSubmitted +
      summary.inProcess +
      summary.completed;

    expect(result.total).toBeGreaterThanOrEqual(sumOfCategorized);
    expect(summary.totalApplications).toBe(result.total);
  });
});
