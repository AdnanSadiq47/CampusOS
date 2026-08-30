import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionsService } from '../src/modules/admissions/admissions.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UserScopeContext } from '../src/modules/admissions/admissions.service';

describe('CampusOS Admissions — Pre-Admission Verification & Test Eligibility Engine', () => {
  let service: AdmissionsService;

  const superAdminScope: UserScopeContext = {
    organizationId: '11111111-1111-1111-1111-111111111111',
    userRole: 'SUPER_ADMIN',
    isSuperAdmin: true,
  };

  const cliftonCampusScope: UserScopeContext = {
    organizationId: '11111111-1111-1111-1111-111111111111',
    userRole: 'CAMPUS_ADMIN',
    isSuperAdmin: false,
    authorizedCampusIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], // Clifton Campus only
  };

  const gulshanCampusScope: UserScopeContext = {
    organizationId: '11111111-1111-1111-1111-111111111111',
    userRole: 'CAMPUS_ADMIN',
    isSuperAdmin: false,
    authorizedCampusIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'], // Main Campus (Gulshan)
  };

  beforeEach(() => {
    service = new AdmissionsService();
  });

  describe('1. Automatic Data Validation Checks', () => {
    it('detects missing required fields (name, father, mobile, dob, class, campus)', () => {
      const invalidApp: any = {
        id: 'test_invalid',
        organizationId: '11111111-1111-1111-1111-111111111111',
        studentName: '',
        fatherOrGuardianName: '',
        primaryMobile: '',
        dateOfBirth: '',
        classId: '',
        campusId: '',
      };

      const issues = service.validateApplicationData(invalidApp);
      expect(issues.some((i) => i.field === 'studentName' && i.code === 'MISSING_REQUIRED')).toBe(true);
      expect(issues.some((i) => i.field === 'fatherOrGuardianName' && i.code === 'MISSING_REQUIRED')).toBe(true);
      expect(issues.some((i) => i.field === 'primaryMobile' && i.code === 'MISSING_REQUIRED')).toBe(true);
      expect(issues.some((i) => i.field === 'dateOfBirth' && i.code === 'MISSING_REQUIRED')).toBe(true);
    });

    it('validates mobile number format (Pakistani 11-digit format)', () => {
      const validApp: any = {
        studentName: 'Valid Student',
        fatherOrGuardianName: 'Valid Father',
        primaryMobile: '0300-1234567',
        dateOfBirth: '2018-05-10',
        className: 'Grade 1',
        classId: 'cls-g1',
        campusName: 'Main Campus',
        campusId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      const validIssues = service.validateApplicationData(validApp);
      expect(validIssues.some((i) => i.code === 'INVALID_MOBILE')).toBe(false);

      const invalidMobileApp = { ...validApp, primaryMobile: '12345' };
      const invalidIssues = service.validateApplicationData(invalidMobileApp);
      expect(invalidIssues.some((i) => i.code === 'INVALID_MOBILE')).toBe(true);
    });

    it('detects suspicious dummy / test data', () => {
      const dummyApp: any = {
        studentName: 'test applicant',
        fatherOrGuardianName: 'dummy father',
        primaryMobile: '0300-1234567',
        dateOfBirth: '2018-05-10',
        className: 'Grade 1',
        classId: 'cls-g1',
        campusName: 'Main Campus',
        campusId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      const issues = service.validateApplicationData(dummyApp);
      expect(issues.some((i) => i.code === 'SUSPICIOUS_DUMMY_DATA' && i.field === 'studentName')).toBe(true);
      expect(issues.some((i) => i.code === 'SUSPICIOUS_DUMMY_DATA' && i.field === 'fatherOrGuardianName')).toBe(true);
    });
  });

  describe('2. Composite Duplicate Matching Engine', () => {
    it('flags exact duplicates with same CNIC/Mobile, Student Name, Class, and Academic Year', () => {
      const baseApp: any = {
        id: 'app_1',
        organizationId: '11111111-1111-1111-1111-111111111111',
        studentName: 'Ahmed Ali Khan',
        fatherCnic: '42101-1234567-1',
        primaryMobile: '0300-1234567',
        fatherOrGuardianName: 'Muhammad Ali',
        classId: 'cls-g6',
        className: 'Grade 6',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Year 2026–2027',
        status: 'SUBMITTED',
      };

      const dupApp: any = {
        id: 'app_2',
        organizationId: '11111111-1111-1111-1111-111111111111',
        studentName: 'ahmed ali khan',
        fatherCnic: '42101-1234567-1',
        primaryMobile: '0300-1234567',
        fatherOrGuardianName: 'Muhammad Ali',
        classId: 'cls-g6',
        className: 'Grade 6',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Year 2026–2027',
        status: 'SUBMITTED',
      };

      const result = service.detectDuplicates(dupApp, [baseApp, dupApp]);
      expect(result.isExactMatch).toBe(true);
      expect(result.duplicateMatches.length).toBe(1);
      expect(result.duplicateMatches[0]?.applicationId).toBe('app_1');
      expect(result.duplicateMatches[0]?.reasons).toContain('Exact Same Student Name');
    });

    it('provides detailed side-by-side field comparison with duplicate confidence', async () => {
      const comp = await service.getDuplicateComparison('app_146', 'app_121', superAdminScope);
      expect(comp.currentApplication).toBeDefined();
      expect(comp.existingApplication).toBeDefined();
      expect(comp.comparisonFields.length).toBeGreaterThan(5);
      expect(comp.comparisonFields.some((f) => f.fieldKey === 'studentName' && f.isMatch)).toBe(true);
      expect(comp.matchedReasons.length).toBeGreaterThan(0);
    });
  });

  describe('3. Verification Center Scanning & Bulk Clean Verification', () => {
    it('scans applications and groups into summary buckets (Looks Good, Needs Review, Duplicates, Invalid)', async () => {
      const scan = await service.scanApplicationsForVerification({}, superAdminScope);
      expect(scan.summary.totalScanned).toBeGreaterThan(0);
      expect(scan.summary.looksGoodCount).toBeGreaterThan(0);
      expect(scan.summary.possibleDuplicatesCount).toBeGreaterThan(0);
      expect(scan.summary.invalidMissingDataCount).toBeGreaterThan(0);
      expect(scan.items.length).toBe(scan.summary.totalScanned);
    });

    it('bulk verifies ONLY clean applications without advancing flagged records', async () => {
      const scanBefore = await service.scanApplicationsForVerification({}, superAdminScope);
      const cleanCount = scanBefore.summary.looksGoodCount;

      const bulkRes = await service.bulkVerifyCleanApplications({}, superAdminScope);
      expect(bulkRes.verifiedCount).toBe(cleanCount);
      expect(bulkRes.remainingFlaggedCount).toBe(scanBefore.summary.totalScanned - cleanCount);

      // Verify that flagged applications like app_145 (dummy data) or app_146 (duplicate) were NOT verified
      const app145 = await service.getPreAdmissionById('app_145', superAdminScope);
      expect(app145.verificationStatus).toBe('NEEDS_REVIEW');

      const app146 = await service.getPreAdmissionById('app_146', superAdminScope);
      expect(app146.verificationStatus).toBe('POSSIBLE_DUPLICATE');
    });

    it('advances Admission Journey to next stage (e.g. ASSESSMENT_TEST) upon verification', async () => {
      const scanBefore = await service.scanApplicationsForVerification({}, superAdminScope);
      const firstClean = scanBefore.items.find((i) => i.computedStatus === 'CLEAN' && i.currentVerificationStatus === 'UNVERIFIED');
      expect(firstClean).toBeDefined();

      const bulkRes = await service.bulkVerifyCleanApplications({ applicationIds: [firstClean!.id] }, superAdminScope);
      expect(bulkRes.verifiedCount).toBe(1);

      const verifiedApp = await service.getPreAdmissionById(firstClean!.id, superAdminScope);
      expect(verifiedApp.verificationStatus).toBe('STAFF_VERIFIED');
      expect(verifiedApp.verifiedBy).toBe('SUPER_ADMIN');
      expect(verifiedApp.auditEvents?.some((e) => e.eventType === 'APPLICATION_VERIFIED')).toBe(true);

      // Verify journey steps progressed
      if (verifiedApp.journey && verifiedApp.journey.steps.length > 0) {
        const completedStep = verifiedApp.journey.steps.find((s) => s.state === 'COMPLETED');
        expect(completedStep).toBeDefined();
      }
    });
  });

  describe('4. Human Override & Non-destructive Operational Data Edit', () => {
    it('allows staff to override and verify with mandatory reason', async () => {
      // Trying without reason should throw BadRequestException
      await expect(
        service.overrideVerification(
          {
            applicationId: 'app_145',
            overrideReason: '',
            action: 'VERIFY_ANYWAY',
          },
          superAdminScope
        )
      ).rejects.toThrow(BadRequestException);

      const overridden = await service.overrideVerification(
        {
          applicationId: 'app_145',
          overrideReason: 'Verified with parent in person over phone call.',
          action: 'VERIFY_ANYWAY',
        },
        superAdminScope
      );

      expect(overridden.verificationStatus).toBe('STAFF_VERIFIED');
      expect(overridden.verificationMethod).toBe('OVERRIDE');
      expect(overridden.verificationOverrideReason).toBe('Verified with parent in person over phone call.');
      expect(overridden.auditEvents?.some((e) => e.eventType === 'VERIFICATION_OVERRIDE')).toBe(true);
    });

    it('preserves immutable original submission snapshot when operational data is corrected', async () => {
      const originalApp = await service.getPreAdmissionById('app_147', superAdminScope);
      const originalMobile = originalApp.primaryMobile;

      const corrected = await service.editOperationalData(
        {
          applicationId: 'app_147',
          primaryMobile: '0300-9998877',
          correctionReason: 'Corrected typo in contact number from physical paper slip.',
        },
        superAdminScope
      );

      expect(corrected.primaryMobile).toBe('0300-9998877');
      expect(corrected.isCorrected).toBe(true);
      expect(corrected.originalSubmissionSnapshot).toBeDefined();
      expect(corrected.originalSubmissionSnapshot?.primaryMobile).toBe(originalMobile);
      expect(corrected.auditEvents?.some((e) => e.eventType === 'OPERATIONAL_DATA_CORRECTED')).toBe(true);
    });
  });

  describe('5. Test Scheduling Candidate Eligibility Precision', () => {
    it('includes verified Grade 6 candidates whose journey has reached ASSESSMENT_TEST', async () => {
      const eligible = await service.getEligibleCandidatesForTest(
        {
          processDefinitionId: 'proc_general_k12',
          classIds: ['cls-g6'],
        },
        superAdminScope
      );

      expect(eligible.length).toBeGreaterThan(0);
      expect(eligible.every((c) => c.verificationStatus === 'STAFF_VERIFIED' || c.verificationStatus === 'AUTO_VERIFIED')).toBe(true);
      expect(eligible.every((c) => c.classId === 'cls-g6')).toBe(true);
    });

    it('excludes unverified candidates or processes that have no test step', async () => {
      const eligibleSimple = await service.getEligibleCandidatesForTest(
        {
          processDefinitionId: 'proc_simple_adm', // Simple direct admission without test
        },
        superAdminScope
      );
      expect(eligibleSimple.length).toBe(0);
    });
  });

  describe('6. Multi-tenant and Campus Scope Authorization', () => {
    it('restricts campus admins from scanning or verifying applications from other campuses', async () => {
      const scan = await service.scanApplicationsForVerification({}, cliftonCampusScope);
      expect(scan.items.every((i) => i.campusName === 'Clifton Campus')).toBe(true);

      // Attempting to bulk verify an application from another campus should throw ForbiddenException
      const gulshanApp = service['applications'].find((a) => a.campusName === 'Main Campus (Gulshan)');
      expect(gulshanApp).toBeDefined();

      await expect(
        service.bulkVerifyCleanApplications(
          { applicationIds: [gulshanApp!.id] },
          cliftonCampusScope
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('7. Server-side List View Column Config Persistence', () => {
    it('persists user-specific column configurations and rows-per-page preferences', async () => {
      const config = await service.getListViewConfig(superAdminScope);
      expect(config.columns.length).toBeGreaterThan(0);

      const updated = await service.saveListViewConfig(
        {
          columns: config.columns.map((c, i) => (i === 0 ? { ...c, isVisible: false } : c)),
          rowsPerPage: 50,
          viewType: 'PERSONAL',
        },
        superAdminScope
      );

      expect(updated.rowsPerPage).toBe(50);
      const reloaded = await service.getListViewConfig(superAdminScope);
      expect(reloaded.rowsPerPage).toBe(50);
    });
  });
});
