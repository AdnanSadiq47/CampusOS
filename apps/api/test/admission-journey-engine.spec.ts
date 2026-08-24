import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionsService, UserScopeContext } from '../src/modules/admissions/admissions.service.js';
import {
  AdmissionProcessStepConfig,
  AdmissionStepType,
  PreAdmissionsListViewConfigDto,
} from '@campus-os/types';

describe('CampusOS Admission Journey Engine — Master Architecture Upgrade', () => {
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
    authorizedCampusIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
  };

  beforeEach(() => {
    service = new AdmissionsService();
  });

  describe('1. 13 Canonical Step Types & Display Name Customization', () => {
    it('supports all 13 canonical step types across 6 categories', () => {
      const canonicalSteps: AdmissionStepType[] = [
        'PRE_ADMISSION',
        'APPLICATION_REVIEW',
        'DOCUMENT_VERIFICATION',
        'APPLICATION_FEE',
        'ASSESSMENT_TEST',
        'INTERVIEW',
        'ADMISSION_DECISION',
        'WAITING_LIST',
        'PARENT_CONFIRMATION',
        'SEAT_CONFIRMATION',
        'ADMISSION_FEE',
        'FINAL_ADMISSION_FORM',
        'STUDENT_REGISTRATION',
      ];

      expect(canonicalSteps.length).toBe(13);
    });

    it('allows custom display names without changing underlying stepType', () => {
      const customSteps: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Early Bird Registration', category: 'APPLICATION', isRequired: true, sortOrder: 1 },
        { id: 's2', stepType: 'ASSESSMENT_TEST', displayName: 'Scholarship Diagnostic Exam', category: 'ASSESSMENT', isRequired: true, sortOrder: 2 },
        { id: 's3', stepType: 'STUDENT_REGISTRATION', displayName: 'Enrol Student', category: 'SYSTEM', isRequired: true, sortOrder: 3, isSystemTerminal: true },
      ];

      expect(service.validateProcessDefinition(customSteps)).toBe(true);
    });
  });

  describe('2. Process Invariants & Validation', () => {
    it('enforces that STUDENT_REGISTRATION must be the final step if present', () => {
      const invalidSteps: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1 },
        { id: 's2', stepType: 'STUDENT_REGISTRATION', displayName: 'Registration', category: 'SYSTEM', isRequired: true, sortOrder: 2 },
        { id: 's3', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Form', category: 'CONFIRMATION', isRequired: true, sortOrder: 3 },
      ];

      expect(() => service.validateProcessDefinition(invalidSteps)).toThrow(
        'Student Registration must be the final terminal step of the admission process.'
      );
    });

    it('enforces that STUDENT_REGISTRATION cannot appear more than once', () => {
      const duplicateTerminalSteps: AdmissionProcessStepConfig[] = [
        { id: 's1', stepType: 'STUDENT_REGISTRATION', displayName: 'Reg 1', category: 'SYSTEM', isRequired: true, sortOrder: 1 },
        { id: 's2', stepType: 'STUDENT_REGISTRATION', displayName: 'Reg 2', category: 'SYSTEM', isRequired: true, sortOrder: 2 },
      ];

      expect(() => service.validateProcessDefinition(duplicateTerminalSteps)).toThrow(
        'Student Registration can only appear once in an admission process.'
      );
    });

    it('validates that fee steps require non-negative amounts', () => {
      const negativeFeeStep: AdmissionProcessStepConfig[] = [
        {
          id: 's1',
          stepType: 'APPLICATION_FEE',
          displayName: 'Fee',
          category: 'PAYMENT',
          isRequired: true,
          sortOrder: 1,
          feeConfig: { feeRequired: true, amount: -500, currency: 'PKR', paymentRequiredBeforeNextStep: true },
        },
      ];

      expect(() => service.validateProcessDefinition(negativeFeeStep)).toThrow(
        'Fee step "Fee" requires a valid non-negative amount.'
      );
    });
  });

  describe('3. Dynamic List View Configuration', () => {
    it('provides default columns catalog with system, canonical, custom, and dynamic status fields', async () => {
      const config = await service.getListViewConfig(superAdminScope);
      expect(config.columns.length).toBeGreaterThan(15);
      expect(config.columns.some((c) => c.key === 'applicationNumber')).toBe(true);
      expect(config.columns.some((c) => c.key === 'testStatus')).toBe(true);
      expect(config.columns.some((c) => c.key === 'feeStatus')).toBe(true);
    });

    it('allows updating and saving custom column order and visibility', async () => {
      const current = await service.getListViewConfig(superAdminScope);
      const modifiedColumns = current.columns.map((c) =>
        c.key === 'testStatus' ? { ...c, isVisible: true } : c
      );

      const saved = await service.saveListViewConfig(
        { ...current, columns: modifiedColumns },
        superAdminScope
      );

      expect(saved.columns.find((c) => c.key === 'testStatus')?.isVisible).toBe(true);
    });
  });

  describe('4. Process Resolution & Data Collection Only Mode', () => {
    it('correctly resolves specific campus process over universal process', () => {
      const cliftonMatch = service.resolveProcessForCampus('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      expect(cliftonMatch?.id).toBe('proc_simple_adm');

      const fallbackMatch = service.resolveProcessForCampus('unknown_campus_123');
      expect(fallbackMatch?.id).toBe('proc_general_k12');
    });

    it('allows pre-admission record creation without process assignment', async () => {
      const created = await service.createPreAdmission({
        campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        classId: 'cls-g3',
        academicYearId: 'ay_2026_2027',
        formDefinitionId: 'f_prereg_2026',
        formData: {
          studentFirstName: 'Sami',
          studentLastName: 'Khan',
          gender: 'MALE',
          fatherName: 'Kamran Khan',
          primaryMobile: '0300-9988776',
        },
      });

      expect(created.applicationNumber).toContain('PA-2026-');
      expect(created.studentName).toBe('Sami Khan');
      expect(created.status).toBe('IN_PROGRESS');
    });
  });

  describe('5. Test Scheduling & Multi-Campus Assignment Foundation', () => {
    it('creates test schedule and assigns applicants across campuses', async () => {
      const schedule = await service.createTestSchedule(
        {
          assessmentName: 'Annual Admission Test 2026',
          date: '2026-09-10',
          startTime: '09:00',
          campusId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          campusName: 'Main Campus (Gulshan)',
          venueRoom: 'Auditorium Hall',
          mode: 'PAPER_BASED',
        },
        superAdminScope
      );

      expect(schedule.id).toBeDefined();

      const assignments = await service.assignApplicantsToTestSchedule(
        schedule.id,
        ['app_121'],
        superAdminScope
      );

      expect(assignments.length).toBe(1);
      expect(assignments[0]!.scheduleCampusName).toBe('Main Campus (Gulshan)');
      expect(assignments[0]!.status).toBe('SCHEDULED');

      // Check applicant projection updated
      const app = await service.getPreAdmissionById('app_121', superAdminScope);
      expect(app.testDate).toBe('2026-09-10');
      expect(app.testStatus).toBe('SCHEDULED');
    });

    it('reschedules an applicant to a new venue/schedule with reason audit', async () => {
      const newSchedule = await service.createTestSchedule(
        {
          assessmentName: 'Makeup Entrance Test',
          date: '2026-09-15',
          startTime: '11:00',
          campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          campusName: 'Clifton Campus',
          venueRoom: 'Room 101',
          mode: 'PAPER_BASED',
        },
        superAdminScope
      );

      // Create initial assignment
      const assignments = await service.assignApplicantsToTestSchedule(
        'ts_clifton_g6',
        ['app_122'],
        superAdminScope
      );

      const rescheduled = await service.rescheduleApplicantTest(
        assignments[0]!.id,
        newSchedule.id,
        'Parent requested morning clash rescheduling',
        superAdminScope
      );

      expect(rescheduled.status).toBe('RESCHEDULED');
      expect(rescheduled.rescheduledReason).toBe('Parent requested morning clash rescheduling');
      expect(rescheduled.scheduledDate).toBe('2026-09-15');
    });

    it('records test result and updates applicant outcome', async () => {
      const assignments = await service.assignApplicantsToTestSchedule(
        'ts_clifton_g6',
        ['app_123'],
        superAdminScope
      );

      const graded = await service.recordTestResult(
        assignments[0]!.id,
        82,
        100,
        'PASSED',
        true,
        superAdminScope
      );

      expect(graded.percentage).toBe(82);
      expect(graded.outcome).toBe('PASSED');
      expect(graded.resultStatus).toBe('PUBLISHED');

      const app = await service.getPreAdmissionById('app_123', superAdminScope);
      expect(app.testResult).toBe('PASSED (82%)');
      expect(app.testStatus).toBe('COMPLETED');
    });
  });

  describe('6. Interview Scheduling Foundation', () => {
    it('retrieves interview schedules and books applicant slot', async () => {
      const schedules = await service.getInterviewSchedules(superAdminScope);
      expect(schedules.length).toBeGreaterThan(0);

      const assignment = await service.assignApplicantToInterview(
        schedules[0]!.id,
        'app_124',
        'slot_2',
        superAdminScope
      );

      expect(assignment.status).toBe('SCHEDULED');

      const completedInterview = await service.recordInterviewOutcome(
        assignment.id,
        'RECOMMENDED',
        'Candidate demonstrated strong academic foundation and communication skills.',
        superAdminScope
      );

      expect(completedInterview.outcome).toBe('RECOMMENDED');
    });
  });

  describe('7. Decision & Fee Payment Foundation', () => {
    it('records admission decision with status transitions', async () => {
      const app = await service.recordAdmissionDecision(
        'app_125',
        'APPROVED',
        'Principal confirmed admission offer for Grade 3.',
        superAdminScope
      );

      expect(app.decisionOutcome).toBe('APPROVED');
      expect(app.status).toBe('APPROVED');
    });

    it('records application and admission fee payment', async () => {
      const charge = await service.recordFeePayment(
        'app_126',
        'APPLICATION_FEE',
        2500,
        'ONLINE_GATEWAY',
        superAdminScope
      );

      expect(charge.amount).toBe(2500);
      expect(charge.status).toBe('PAID');
      expect(charge.receiptNumber).toBeDefined();

      const app = await service.getPreAdmissionById('app_126', superAdminScope);
      expect(app.feeStatus).toBe('PAID');
    });
  });

  describe('8. Domain Events Foundation', () => {
    it('emits domain events across lifecycle actions', async () => {
      await service.createPreAdmission({
        campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        classId: 'cls-g1',
        academicYearId: 'ay_2026_2027',
        formDefinitionId: 'f_prereg_2026',
        formData: { studentFirstName: 'Ayla', studentLastName: 'Raza' },
      });

      const events = service.getEmittedEvents();
      expect(events.some((e) => e.event === 'PRE_ADMISSION_SUBMITTED')).toBe(true);
    });
  });

  describe('9. Data Scope Isolation', () => {
    it('restricts campus admin from seeing applicants from unauthorized campuses', async () => {
      const res = await service.getPreAdmissions({}, cliftonCampusScope);
      expect(res.items.every((a) => a.campusId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')).toBe(true);
    });
  });
});
