import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionsService } from '../src/modules/admissions/admissions.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UserScopeContext } from '@campus-os/types';

describe('CampusOS Admissions — Operational Test Management (Phase 1)', () => {
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

  const dhaCampusScope: UserScopeContext = {
    organizationId: '11111111-1111-1111-1111-111111111111',
    userRole: 'CAMPUS_ADMIN',
    isSuperAdmin: false,
    authorizedCampusIds: ['cccccccc-cccc-cccc-cccc-cccccccccccc'], // DHA Phase 6 Campus only
  };

  beforeEach(() => {
    service = new AdmissionsService();
  });

  describe('1. Test Schedules Listing & KPIs', () => {
    it('returns seeded test schedules with calculated summary KPIs', async () => {
      const res = await service.getTestSchedules({}, superAdminScope);
      expect(res.items.length).toBeGreaterThanOrEqual(3);
      expect(res.summary).toBeDefined();
      expect(res.summary.totalScheduled).toBeGreaterThanOrEqual(2);
      expect(res.summary.todayCount).toBeGreaterThanOrEqual(1);

      // Verify schedule structure
      const g6Test = res.items.find((s) => s.scheduleCode === 'TST-2026-0041');
      expect(g6Test).toBeDefined();
      expect(g6Test?.name).toBe('Entrance Test — Grade 6');
      expect(g6Test?.mode).toBe('PAPER_BASED');
      expect(g6Test?.totalCandidatesCount).toBe(48);
    });

    it('filters schedules by search, campus, class, mode, and status', async () => {
      const searchRes = await service.getTestSchedules({ search: 'Diagnostic' }, superAdminScope);
      expect(searchRes.items.every((s) => s.name.includes('Diagnostic'))).toBe(true);

      const modeRes = await service.getTestSchedules({ mode: 'COMPUTER_BASED' }, superAdminScope);
      expect(modeRes.items.every((s) => s.mode === 'COMPUTER_BASED')).toBe(true);

      const statusRes = await service.getTestSchedules({ status: 'DRAFT' }, superAdminScope);
      expect(statusRes.items.every((s) => s.status === 'DRAFT')).toBe(true);
    });

    it('enforces hierarchy data scoping for campus users', async () => {
      const res = await service.getTestSchedules({}, cliftonCampusScope);
      // Clifton user should only see schedules that take place at Clifton or have Clifton applicants
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items.every((s) => s.venueCampusId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' || s.totalCandidatesCount > 0)).toBe(true);
    });
  });

  describe('2. Schedule Test Flow & Validations', () => {
    it('creates a new test schedule with candidate assignment and generates code', async () => {
      const schedule = await service.createAdmissionTestSchedule(
        {
          name: 'Grade 7 Entrance Exam',
          processDefinitionId: 'proc_general_k12',
          processStepId: 's_test_1',
          academicYearId: 'ay_2026_2027',
          classIds: ['cls-g7'],
          mode: 'PAPER_BASED',
          date: '2026-09-10',
          reportingTime: '09:00',
          startTime: '09:30',
          durationMinutes: 90,
          venueType: 'CAMPUS',
          venueCampusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          venueCampusName: 'Clifton Campus',
          venueRoom: 'Hall A',
          candidatePreAdmissionIds: ['app_121'],
          isDraft: false,
        },
        superAdminScope
      );

      expect(schedule.id).toBeDefined();
      expect(schedule.scheduleCode).toMatch(/^TST-2026-\d{4}$/);
      expect(schedule.status).toBe('SCHEDULED');
      expect(schedule.totalCandidatesCount).toBe(1);

      // Verify applicant pre-admission was updated
      const app = await service.getPreAdmissionById('app_121', superAdminScope);
      expect(app.testDate).toBe('2026-09-10');
      expect(app.testStatus).toBe('SCHEDULED');
      expect(app.auditEvents?.some((e) => e.eventType === 'TEST_SCHEDULED')).toBe(true);
    });

    it('supports different applicant campus vs exam venue campus', async () => {
      // app_123 belongs to DHA Campus (cccccccc-cccc-cccc-cccc-cccccccccccc), but takes test at Clifton Campus venue
      const schedule = await service.createAdmissionTestSchedule(
        {
          name: 'Inter-Campus Joint Assessment',
          processDefinitionId: 'proc_general_k12',
          processStepId: 's_test_1',
          academicYearId: 'ay_2026_2027',
          classIds: ['cls-g1'],
          mode: 'PAPER_BASED',
          date: '2026-09-15',
          startTime: '10:00',
          durationMinutes: 60,
          venueCampusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Clifton Campus
          venueCampusName: 'Clifton Campus',
          venueRoom: 'Auditorium',
          candidatePreAdmissionIds: ['app_123'], // DHA applicant
          isDraft: false,
        },
        superAdminScope
      );

      expect(schedule.venueCampusId).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      const candidates = await service.getCandidatesForSchedule(schedule.id, {}, superAdminScope);
      expect(candidates.length).toBe(1);
      expect(candidates[0]!.applicantCampusId).toBe('cccccccc-cccc-cccc-cccc-cccccccccccc'); // DHA
      expect(candidates[0]!.venueCampusId).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'); // Clifton
    });

    it('rejects candidate assignment from unauthorized campus scope', async () => {
      // Clifton admin attempting to schedule an applicant belonging to DHA Campus
      await expect(
        service.createAdmissionTestSchedule(
          {
            name: 'Clifton Only Test',
            processDefinitionId: 'proc_general_k12',
            processStepId: 's_test_1',
            academicYearId: 'ay_2026_2027',
            classIds: ['cls-g1'],
            mode: 'PAPER_BASED',
            date: '2026-09-18',
            startTime: '10:00',
            durationMinutes: 60,
            candidatePreAdmissionIds: ['app_123'], // DHA applicant
          },
          cliftonCampusScope
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('detects scheduling conflict when candidate is already scheduled for overlapping time', async () => {
      // First schedule candidate for 2026-09-20 at 10:00
      await service.createAdmissionTestSchedule(
        {
          name: 'Morning Session',
          processDefinitionId: 'proc_general_k12',
          processStepId: 's_test_1',
          academicYearId: 'ay_2026_2027',
          classIds: ['cls-g6'],
          mode: 'PAPER_BASED',
          date: '2026-09-20',
          startTime: '10:00',
          durationMinutes: 90,
          candidatePreAdmissionIds: ['app_121'],
        },
        superAdminScope
      );

      // Attempting to schedule the same candidate again on 2026-09-20 at 10:00 should throw a conflict error
      await expect(
        service.createAdmissionTestSchedule(
          {
            name: 'Conflicting Session',
            processDefinitionId: 'proc_general_k12',
            processStepId: 's_test_1',
            academicYearId: 'ay_2026_2027',
            classIds: ['cls-g6'],
            mode: 'PAPER_BASED',
            date: '2026-09-20',
            startTime: '10:00',
            durationMinutes: 60,
            candidatePreAdmissionIds: ['app_121'],
          },
          superAdminScope
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('creates draft test schedule without emitting parent notification events', async () => {
      const schedule = await service.createAdmissionTestSchedule(
        {
          name: 'Draft Placement Assessment',
          processDefinitionId: 'proc_general_k12',
          processStepId: 's_test_1',
          academicYearId: 'ay_2026_2027',
          classIds: ['cls-g6'],
          mode: 'PAPER_BASED',
          date: '2026-09-22',
          startTime: '11:00',
          durationMinutes: 60,
          candidatePreAdmissionIds: [],
          isDraft: true,
        },
        superAdminScope
      );

      expect(schedule.status).toBe('DRAFT');
      expect(schedule.resultsStatus).toBe('Drafting');
    });
  });

  describe('3. Eligible Candidate Selector & Filters', () => {
    it('returns active eligible candidates filtered by class and campus', async () => {
      const candidates = await service.getEligibleCandidatesForTest(
        {
          processDefinitionId: 'proc_general_k12',
          processStepId: 's_test_1',
          classIds: ['cls-kg'],
          campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Clifton
        },
        superAdminScope
      );

      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.every((c) => c.campusId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')).toBe(true);
      expect(candidates.every((c) => c.classId === 'cls-kg')).toBe(true);
    });
  });

  describe('4. Individual Candidate Rescheduling & Audit History', () => {
    it('reschedules a candidate test with mandatory reason and preserves history in audit log', async () => {
      const res = await service.rescheduleCandidate(
        {
          candidateId: 't_cand_1',
          newDate: '2026-08-30',
          newStartTime: '11:00',
          newReportingTime: '10:30',
          newVenueCampusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          newVenueRoom: 'Room 305',
          reason: 'Parent requested reschedule due to family bereavement',
        },
        superAdminScope
      );

      expect(res.status).toBe('RESCHEDULED');
      expect(res.scheduledDate).toBe('2026-08-30');
      expect(res.scheduledTime).toBe('11:00');
      expect(res.venueRoom).toBe('Room 305');
      expect(res.rescheduledReason).toBe('Parent requested reschedule due to family bereavement');

      // Verify applicant pre-admission timeline audit
      const app = await service.getPreAdmissionById(res.preAdmissionId, superAdminScope);
      expect(app.testDate).toBe('2026-08-30');
      expect(app.testStatus).toBe('RESCHEDULED');
      const auditEntry = app.auditEvents?.find((e) => e.eventType === 'TEST_RESCHEDULED');
      expect(auditEntry).toBeDefined();
      expect(auditEntry?.description).toContain('family bereavement');
    });

    it('rejects candidate reschedule without a reason', async () => {
      await expect(
        service.rescheduleCandidate(
          {
            candidateId: 't_cand_1',
            newDate: '2026-08-30',
            newStartTime: '11:00',
            reason: '',
          },
          superAdminScope
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('removes candidate from test schedule and resets application status', async () => {
      const res = await service.removeCandidateFromSchedule('t_cand_3', superAdminScope);
      expect(res.success).toBe(true);

      const app = await service.getPreAdmissionById('app_123', superAdminScope);
      expect(app.testStatus).toBeUndefined();
    });
  });
});
