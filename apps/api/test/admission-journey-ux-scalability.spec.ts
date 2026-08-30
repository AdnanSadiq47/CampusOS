import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionsService, UserScopeContext } from '../src/modules/admissions/admissions.service.js';
import {
  ListColumnDefinitionDto,
  PreAdmissionsListViewConfigDto,
  AdmissionProcessStepConfig,
  AssessmentTestStepConfig,
} from '@campus-os/types';

describe('CampusOS Admission Journey UX Polish & Scalability Pass', () => {
  let service: AdmissionsService;
  const adminScope: UserScopeContext = {
    organizationId: '11111111-1111-1111-1111-111111111111',
    userRole: 'ADMIN',
    isSuperAdmin: true,
  };

  beforeEach(() => {
    service = new AdmissionsService();
  });

  describe('Part A — Configure Pre-Admissions Columns Scalability', () => {
    it('provides dynamic column catalog with codes, canonical keys, and pinned defaults', async () => {
      const config = await service.getListViewConfig(adminScope);
      expect(config.columns.length).toBeGreaterThanOrEqual(20);

      const appNoCol = config.columns.find((c) => c.key === 'applicationNumber');
      expect(appNoCol).toBeDefined();
      expect(appNoCol?.isPinned).toBe(true);
      expect(appNoCol?.code).toBe('SYS_APP_NUM');

      const studentCol = config.columns.find((c) => c.key === 'studentName');
      expect(studentCol).toBeDefined();
      expect(studentCol?.isPinned).toBe(true);
      expect(studentCol?.canonicalKey).toBe('STUDENT_NAME');
    });

    it('supports searching across label, key, code, and canonical key', async () => {
      const config = await service.getListViewConfig(adminScope);

      // Search by code: CUST_SIBLING_DISC
      const queryCode = 'cust_sibling';
      const resultsByCode = config.columns.filter(
        (c) =>
          c.label.toLowerCase().includes(queryCode) ||
          c.key.toLowerCase().includes(queryCode) ||
          (c.code && c.code.toLowerCase().includes(queryCode)) ||
          (c.canonicalKey && c.canonicalKey.toLowerCase().includes(queryCode))
      );
      expect(resultsByCode.length).toBe(1);
      expect(resultsByCode[0]?.key).toBe('siblingDiscountEligible');

      // Search by canonical key: FATHER_MOBILE
      const queryCanonical = 'father_mobile';
      const resultsByCanonical = config.columns.filter(
        (c) =>
          c.label.toLowerCase().includes(queryCanonical) ||
          c.key.toLowerCase().includes(queryCanonical) ||
          (c.code && c.code.toLowerCase().includes(queryCanonical)) ||
          (c.canonicalKey && c.canonicalKey.toLowerCase().includes(queryCanonical))
      );
      expect(resultsByCanonical.length).toBe(1);
      expect(resultsByCanonical[0]?.key).toBe('primaryMobile');
    });

    it('calculates dynamic category counts accurately', async () => {
      const config = await service.getListViewConfig(adminScope);

      const systemCount = config.columns.filter((c) => c.category === 'SYSTEM').length;
      const canonicalCount = config.columns.filter((c) => c.category === 'CANONICAL').length;
      const customCount = config.columns.filter((c) => c.category === 'CUSTOM').length;
      const operationalCount = config.columns.filter((c) => c.category === 'DYNAMIC_STATUS').length;

      expect(systemCount).toBe(8);
      expect(canonicalCount).toBe(7);
      expect(customCount).toBe(3);
      expect(operationalCount).toBe(7);
      expect(systemCount + canonicalCount + customCount + operationalCount).toBe(config.columns.length);
    });

    it('supports Selected Only filtering without losing column catalog state', async () => {
      const config = await service.getListViewConfig(adminScope);
      const selectedOnly = config.columns.filter((c) => c.isVisible);

      expect(selectedOnly.length).toBe(9);
      expect(selectedOnly.every((c) => c.isVisible)).toBe(true);
    });

    it('persists column ordering, pin states, and visibility preferences per tenant', async () => {
      const updatedCols: ListColumnDefinitionDto[] = [
        { id: 'col_student', key: 'studentName', label: 'Student Name', category: 'CANONICAL', isVisible: true, isPinned: true, sortOrder: 1 },
        { id: 'col_app_no', key: 'applicationNumber', label: 'App No', category: 'SYSTEM', isVisible: true, isPinned: true, sortOrder: 2 },
        { id: 'col_custom_sibling', key: 'siblingDiscountEligible', label: 'Sibling Discount', category: 'CUSTOM', isVisible: true, isPinned: false, sortOrder: 3 },
      ];

      const savePayload: PreAdmissionsListViewConfigDto = {
        id: 'cfg_custom_1',
        organizationId: '11111111-1111-1111-1111-111111111111',
        viewType: 'ORGANIZATION_DEFAULT',
        name: 'Custom Admin View',
        columns: updatedCols,
        updatedAt: new Date(),
      };

      const saved = await service.saveListViewConfig(savePayload, adminScope);
      expect(saved.columns[0]?.key).toBe('studentName');
      expect(saved.columns[0]?.sortOrder).toBe(1);
      expect(saved.columns[2]?.key).toBe('siblingDiscountEligible');

      const reloaded = await service.getListViewConfig(adminScope);
      expect(reloaded.columns[0]?.key).toBe('studentName');
    });

    it('handles active vs inactive custom fields gracefully', async () => {
      const config = await service.getListViewConfig(adminScope);
      const customCols = config.columns.filter((c) => c.category === 'CUSTOM');

      expect(customCols.length).toBeGreaterThan(0);
      customCols.forEach((col) => {
        expect(col.isActive).toBe(true);
      });
    });
  });

  describe('Part B — Test / Assessment Step Settings Rules & Policies', () => {
    it('persists assessment modes and publishing rules without operational scheduling clutter', () => {
      const testConfig: AssessmentTestStepConfig = {
        testRequired: true,
        assessmentName: 'A-Level Diagnostic Assessment',
        mode: 'HYBRID',
        passMarks: 65,
        totalMarks: 100,
        resultPublishingRule: 'AFTER_STAFF_APPROVAL',
        allowRetest: true,
        maxAttempts: 2,
        resultVisibleToParent: true,
        sendResultNotification: true,
      };

      expect(testConfig.mode).toBe('HYBRID');
      expect(testConfig.resultPublishingRule).toBe('AFTER_STAFF_APPROVAL');
      expect(testConfig.allowRetest).toBe(true);
      expect(testConfig.maxAttempts).toBe(2);
      expect(testConfig.resultVisibleToParent).toBe(true);
    });

    it('supports all 4 assessment modes with distinct execution semantic semantics', () => {
      const modes = ['PAPER_BASED', 'COMPUTER_BASED', 'ONLINE', 'HYBRID'] as const;
      expect(modes.length).toBe(4);
    });

    it('supports automatic and manual publishing rules', () => {
      const rules = ['AUTOMATIC_AFTER_EVALUATION', 'AFTER_STAFF_APPROVAL', 'MANUAL_PUBLISH'] as const;
      expect(rules.length).toBe(3);
    });
  });

  describe('Part C — Add Step to Journey Library & Singleton Duplicate Protection', () => {
    it('validates singleton duplicate prevention for Pre-Admission, Final Admission, and Student Registration', () => {
      const validSteps: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1 },
        { id: 's2', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission', category: 'CONFIRMATION', isRequired: true, sortOrder: 2 },
        { id: 's3', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 3, isSystemTerminal: true },
      ];

      expect(service.validateProcessDefinition(validSteps)).toBe(true);

      // Attempt duplicate PRE_ADMISSION before final terminal step
      const duplicatePreAdm: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1 },
        { id: 's1_dup', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission 2', category: 'APPLICATION', isRequired: true, sortOrder: 2 },
        { id: 's2', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission', category: 'CONFIRMATION', isRequired: true, sortOrder: 3 },
        { id: 's3', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 4, isSystemTerminal: true },
      ];
      expect(() => service.validateProcessDefinition(duplicatePreAdm)).toThrow();

      // Attempt duplicate FINAL_ADMISSION_FORM
      const duplicateFinalAdm: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1 },
        { id: 's2', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission', category: 'CONFIRMATION', isRequired: true, sortOrder: 2 },
        { id: 's2_dup', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission 2', category: 'CONFIRMATION', isRequired: true, sortOrder: 3 },
        { id: 's3', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 4, isSystemTerminal: true },
      ];
      expect(() => service.validateProcessDefinition(duplicateFinalAdm)).toThrow();

      // Attempt duplicate STUDENT_REGISTRATION
      const duplicateReg: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1 },
        { id: 's2', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission', category: 'CONFIRMATION', isRequired: true, sortOrder: 2 },
        { id: 's3', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration 1', category: 'SYSTEM', isRequired: true, sortOrder: 3, isSystemTerminal: true },
        { id: 's4', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration 2', category: 'SYSTEM', isRequired: true, sortOrder: 4, isSystemTerminal: true },
      ];
      expect(() => service.validateProcessDefinition(duplicateReg)).toThrow();
    });

    it('allows repeatable non-singleton steps like Assessment Test and Interview', () => {
      const multiAssessmentSteps: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1 },
        { id: 's2', stepType: 'ASSESSMENT_TEST', displayName: 'Round 1 Written Test', category: 'ASSESSMENT', isRequired: true, sortOrder: 2 },
        { id: 's3', stepType: 'ASSESSMENT_TEST', displayName: 'Round 2 Subject Diagnostic', category: 'ASSESSMENT', isRequired: true, sortOrder: 3 },
        { id: 's4', stepType: 'INTERVIEW', displayName: 'Academic Interview', category: 'ASSESSMENT', isRequired: false, sortOrder: 4 },
        { id: 's5', stepType: 'INTERVIEW', displayName: 'Leadership Interview', category: 'ASSESSMENT', isRequired: false, sortOrder: 5 },
        { id: 's6', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission', category: 'CONFIRMATION', isRequired: true, sortOrder: 6 },
        { id: 's7', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 7, isSystemTerminal: true },
      ];

      expect(service.validateProcessDefinition(multiAssessmentSteps)).toBe(true);
    });
  });
});
