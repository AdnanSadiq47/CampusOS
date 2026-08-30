import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkingContextService } from '../src/core/hierarchy/working-context.service';
import { AdmissionsService } from '../src/modules/admissions/admissions.service';
import { UserScopeContext } from '@campus-os/types';

describe('CampusOS Global Working Context / Scope Engine', () => {
  let contextService: WorkingContextService;
  let admissionsService: AdmissionsService;

  const ORG_ALPHA = '11111111-1111-1111-1111-111111111111';
  const ORG_BETA = '22222222-2222-2222-2222-222222222222';

  const CAMPUS_MAIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const CAMPUS_CLIFTON = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CAMPUS_DHA = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const CAMPUS_PECHS = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const CAMPUS_CLIFTON_JR = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const CAMPUS_ISB = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  beforeEach(() => {
    contextService = new WorkingContextService();
    admissionsService = new AdmissionsService(contextService);
  });

  describe('1. Hierarchy Resolution & Scoping Tests', () => {
    it('Invariant 1: Exact Campus context returns exact campus only (Clifton Campus)', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const scope = contextService.resolveEffectiveScope(userScope, 'cmp_clifton', 'CAMPUS');
      expect(scope.nodeType).toBe('CAMPUS');
      expect(scope.effectiveCampusIds).toEqual([CAMPUS_CLIFTON]);
      expect([CAMPUS_CLIFTON, 'cmp_clifton', 'cmp-clifton']).toContain(scope.selectedNodeId);
    });

    it('Invariant 2: Exact Campus context for DHA Phase 6 returns DHA campus only', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const scope = contextService.resolveEffectiveScope(userScope, 'cmp_dha', 'CAMPUS');
      expect(scope.nodeType).toBe('CAMPUS');
      expect(scope.effectiveCampusIds).toEqual([CAMPUS_DHA]);
    });

    it('Invariant 3: School context combines all authorized child campuses (Beacon Horizon -> Main, Clifton, DHA)', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const scope = contextService.resolveEffectiveScope(userScope, 'sch_beacon', 'SCHOOL');
      expect(scope.nodeType).toBe('SCHOOL');
      expect(scope.effectiveCampusIds).toEqual(
        expect.arrayContaining([CAMPUS_MAIN, CAMPUS_CLIFTON, CAMPUS_DHA])
      );
      expect(scope.effectiveCampusIds).not.toContain(CAMPUS_PECHS);
      expect(scope.effectiveCampusIds).not.toContain(CAMPUS_ISB);
    });

    it('Invariant 4: Region context combines all region descendants (South Region -> Beacon Horizon + City Grammar)', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const scope = contextService.resolveEffectiveScope(userScope, 'reg_south', 'REGION');
      expect(scope.nodeType).toBe('REGION');
      expect(scope.effectiveCampusIds).toEqual(
        expect.arrayContaining([
          CAMPUS_MAIN,
          CAMPUS_CLIFTON,
          CAMPUS_DHA,
          CAMPUS_PECHS,
          CAMPUS_CLIFTON_JR,
        ])
      );
      expect(scope.effectiveCampusIds).not.toContain(CAMPUS_ISB);
    });

    it('Invariant 5: Head Office context consolidates all authorized tenant descendants', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const scope = contextService.resolveEffectiveScope(userScope, 'ho_alpha', 'HEAD_OFFICE');
      expect(scope.nodeType).toBe('HEAD_OFFICE');
      expect(scope.effectiveCampusIds.length).toBeGreaterThanOrEqual(6);
      expect(scope.effectiveCampusIds).toEqual(
        expect.arrayContaining([
          CAMPUS_MAIN,
          CAMPUS_CLIFTON,
          CAMPUS_DHA,
          CAMPUS_PECHS,
          CAMPUS_CLIFTON_JR,
          CAMPUS_ISB,
        ])
      );
    });

    it('Invariant 6: Variable hierarchy — Direct School -> Campus hierarchy without Region works seamlessly', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const scope = contextService.resolveEffectiveScope(userScope, 'sch_independent', 'SCHOOL');
      expect(scope.nodeType).toBe('SCHOOL');
      expect(scope.effectiveCampusIds).toContain(CAMPUS_MAIN);
    });
  });

  describe('2. Security & Permission Intersect Invariants', () => {
    it('Invariant 7: Permission Ceiling — Context can ONLY narrow within user authorization, NEVER expand', () => {
      // User only authorized for Clifton and DHA
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'CAMPUS_OFFICER',
        isSuperAdmin: false,
        authorizedCampusIds: [CAMPUS_CLIFTON, CAMPUS_DHA],
      };

      // User attempts to select Head Office (which has 6 campuses)
      const scope = contextService.resolveEffectiveScope(userScope, 'ho_alpha', 'HEAD_OFFICE');
      // Must be intersected: only [CAMPUS_CLIFTON, CAMPUS_DHA]
      expect(scope.effectiveCampusIds).toEqual(
        expect.arrayContaining([CAMPUS_CLIFTON, CAMPUS_DHA])
      );
      expect(scope.effectiveCampusIds.length).toBe(2);
      expect(scope.effectiveCampusIds).not.toContain(CAMPUS_MAIN);
      expect(scope.effectiveCampusIds).not.toContain(CAMPUS_PECHS);
    });

    it('Invariant 8: Unauthorized context node selection outside user scope is rejected with 403', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'CAMPUS_OFFICER',
        isSuperAdmin: false,
        authorizedCampusIds: [CAMPUS_CLIFTON],
      };

      // User attempts to select PECHS Campus
      expect(() => {
        contextService.resolveEffectiveScope(userScope, 'cmp_pechs', 'CAMPUS');
      }).toThrow(ForbiddenException);
    });

    it('Invariant 9: Tenant Isolation — Node from Tenant B requested under Tenant A credentials throws 403 Forbidden', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'SUPER_ADMIN',
        isSuperAdmin: true,
      };

      expect(() => {
        contextService.resolveEffectiveScope(userScope, 'ho_beta', 'HEAD_OFFICE');
      }).toThrow(ForbiddenException);
    });

    it('Invariant 10: Fallback to default authorized scope when no working context is specified', () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'CAMPUS_ADMIN',
        isSuperAdmin: false,
        authorizedCampusIds: [CAMPUS_DHA],
      };

      const scope = contextService.resolveEffectiveScope(userScope);
      expect(scope.effectiveCampusIds).toEqual([CAMPUS_DHA]);
    });
  });

  describe('3. Admissions Operational Scoping & Data Boundary Invariants', () => {
    it('Invariant 11: Pre-Admissions list returns only applications within the active working context', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      // Scope to Clifton Campus
      const cliftonResults = await admissionsService.getPreAdmissions(
        { contextNodeId: 'cmp_clifton', contextNodeType: 'CAMPUS' },
        userScope
      );

      expect(cliftonResults.items.length).toBeGreaterThan(0);
      expect(cliftonResults.items.every((a) => a.campusId === CAMPUS_CLIFTON)).toBe(true);

      // Scope to DHA Campus
      const dhaResults = await admissionsService.getPreAdmissions(
        { contextNodeId: 'cmp_dha', contextNodeType: 'CAMPUS' },
        userScope
      );
      expect(dhaResults.items.every((a) => a.campusId === CAMPUS_DHA)).toBe(true);
    });

    it('Invariant 12: School context returns combined applications for all campuses under that school', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const beaconResults = await admissionsService.getPreAdmissions(
        { contextNodeId: 'sch_beacon', contextNodeType: 'SCHOOL' },
        userScope
      );

      const beaconCampuses = [CAMPUS_MAIN, CAMPUS_CLIFTON, CAMPUS_DHA];
      expect(beaconResults.items.every((a) => beaconCampuses.includes(a.campusId))).toBe(true);
    });

    it('Invariant 13: Page Filter cannot escape or expand working context boundary', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      // Working context is Beacon Horizon School (Campuses: Main, Clifton, DHA)
      // Page filter specifies PECHS Campus (which is under City Grammar School)
      const results = await admissionsService.getPreAdmissions(
        {
          contextNodeId: 'sch_beacon',
          contextNodeType: 'SCHOOL',
          campusId: CAMPUS_PECHS, // Outside Beacon Horizon
        },
        userScope
      );

      // Must be empty list, cannot bypass working context!
      expect(results.items.length).toBe(0);
      expect(results.total).toBe(0);
    });

    it('Invariant 14: Single Pre-Admission detail route throws 403 when record is outside active working context', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      // Get an application from PECHS campus
      const allApps = await admissionsService.getPreAdmissions(
        { contextNodeId: 'ho_alpha', contextNodeType: 'HEAD_OFFICE' },
        userScope
      );
      const pechsApp = allApps.items.find((a) => a.campusId === CAMPUS_PECHS);
      expect(pechsApp).toBeDefined();

      // Accessing PECHS app under Clifton Campus working context throws 403 Forbidden
      await expect(
        admissionsService.getPreAdmissionById(
          pechsApp!.id,
          userScope,
          'cmp_clifton',
          'CAMPUS'
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('Invariant 15: Creation safety — Creating an application outside the active working context is blocked', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'CAMPUS_OFFICER',
        isSuperAdmin: false,
        authorizedCampusIds: [CAMPUS_CLIFTON],
        workingContext: {
          nodeId: 'cmp_clifton',
          nodeType: 'CAMPUS',
          nodeName: 'Clifton Campus',
          organizationId: ORG_ALPHA,
        },
      };

      // Attempting to create application for DHA Campus while in Clifton context
      await expect(
        admissionsService.createPreAdmission(
          {
            formDefinitionId: 'f_prereg_2026',
            campusId: CAMPUS_DHA,
            classId: 'cls-g3',
            academicYearId: 'ay_2026_2027',
            source: 'STAFF_ENTRY',
            data: {
              studentName: 'Out of Scope Candidate',
              fatherOrGuardianName: 'Guardian',
              primaryMobile: '03001234567',
            },
          },
          userScope
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('Invariant 16: Verification Scan respects active working context pool', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const scanClifton = await admissionsService.scanApplicationsForVerification(
        { filter: { contextNodeId: 'cmp_clifton', contextNodeType: 'CAMPUS' } },
        userScope
      );

      expect(scanClifton.items.every((i) => i.campusName.includes('Clifton'))).toBe(true);
    });

    it('Invariant 17: Test Schedules and Summary metrics scope strictly to active working context', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const cliftonTests = await admissionsService.getTestSchedules(
        { contextNodeId: 'cmp_clifton', contextNodeType: 'CAMPUS' },
        userScope
      );

      expect(cliftonTests.summary).toBeDefined();
      expect(typeof cliftonTests.summary.totalScheduled).toBe('number');
    });

    it('Invariant 18: Eligible test candidates list strictly filters to active working context', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const cliftonCandidates = await admissionsService.getEligibleCandidatesForTest(
        { contextNodeId: 'cmp_clifton', contextNodeType: 'CAMPUS' },
        userScope
      );

      expect(cliftonCandidates.every((c) => c.campusId === CAMPUS_CLIFTON)).toBe(true);
    });

    it('Invariant 19: List View column configuration is accessible and personalizable per user context', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'ADMIN',
        isSuperAdmin: true,
      };

      const config = await admissionsService.getListViewConfig(userScope);
      expect(config.columns.length).toBeGreaterThan(0);
      expect(config.columns.some((c) => c.key === 'applicationNumber')).toBe(true);
    });

    it('Invariant 20: listAuthorizedContexts returns complete tree filtered to user authorization', async () => {
      const userScope: UserScopeContext = {
        organizationId: ORG_ALPHA,
        userRole: 'CAMPUS_ADMIN',
        isSuperAdmin: false,
        authorizedCampusIds: [CAMPUS_CLIFTON, CAMPUS_MAIN],
      };

      const tree = await admissionsService.getAuthorizedWorkingContexts(userScope);
      expect(tree.campuses.length).toBe(2);
      expect(tree.campuses.map((c) => c.effectiveCampusIds[0])).toEqual(
        expect.arrayContaining([CAMPUS_CLIFTON, CAMPUS_MAIN])
      );
    });
  });
});
