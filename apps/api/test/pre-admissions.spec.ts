import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionsService } from '../src/modules/admissions/admissions.service.js';
import { CreatePreAdmissionDto } from '@campus-os/types';

describe('Pre-Admissions Execution Engine — Phase 1 Tests', () => {
  let service: AdmissionsService;

  beforeEach(() => {
    service = new AdmissionsService();
  });

  it('1. Staff Submission Flow: Creates record, stores form version, assigns process, and resolves first step', async () => {
    const dto: CreatePreAdmissionDto = {
      campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Clifton Campus
      classId: 'cls-g3',
      academicYearId: 'ay_2026_2027',
      formDefinitionId: 'f_prereg_2026',
      publishedFormVersionId: 'v_prereg_1',
      source: 'STAFF_ENTRY',
      formData: {
        studentFirstName: 'Haris',
        studentLastName: 'Memon',
        gender: 'MALE',
        dateOfBirth: '2018-06-15',
        fatherName: 'Kashif Memon',
        primaryMobile: '0300-9988776',
        primaryEmail: 'kashif.m@example.com',
      },
    };

    const app = await service.createPreAdmission(dto, {
      organizationId: '11111111-1111-1111-1111-111111111111',
      userRole: 'ADMIN',
      isSuperAdmin: true,
    });

    expect(app.id).toBeDefined();
    expect(app.applicationNumber).toMatch(/^PA-2026-\d{5}$/);
    expect(app.studentName).toBe('Haris Memon');
    expect(app.source).toBe('STAFF_ENTRY');
    expect(app.formDefinitionId).toBe('f_prereg_2026');
    expect(app.publishedFormVersionId).toBe('v_prereg_1');
    expect(app.formVersionNumber).toBe(1);

    // Process assignment & first step resolution
    expect(app.processDefinitionId).toBeDefined();
    expect(app.journeyStatus).toBe('IN_PROGRESS');
    expect(app.journey?.steps[0]?.state).toBe('COMPLETED'); // Step 1 completed
    expect(app.journey?.steps[1]?.state).toBe('CURRENT'); // Step 2 current
    expect(app.currentStepId).toBe(app.journey?.steps[1]?.stepId);
  });

  it('2. Public Online Submission Flow: Creates record with source ONLINE, extracts canonical fields, and generates application number', async () => {
    const dto: CreatePreAdmissionDto = {
      campusId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Main Campus Gulshan
      classId: 'cls-g1',
      academicYearId: 'ay_2026_2027',
      formDefinitionId: 'f_prereg_2026',
      publishedFormVersionId: 'v_prereg_1',
      source: 'ONLINE',
      formData: {
        studentFirstName: 'Maham',
        studentLastName: 'Tariq',
        gender: 'FEMALE',
        dateOfBirth: '2019-09-20',
        fatherName: 'Tariq Javed',
        primaryMobile: '0321-1122334',
        primaryEmail: 'tariq.javed@example.com',
      },
    };

    // Public submission (no userScope header)
    const app = await service.createPreAdmission(dto);

    expect(app.applicationNumber).toMatch(/^PA-2026-\d{5}$/);
    expect(app.studentName).toBe('Maham Tariq');
    expect(app.source).toBe('ONLINE');
    expect(app.submittedByUserId).toBeUndefined();
    expect(app.customFieldsData?.submittedViaOnlinePortal).toBe(true);
    expect(app.processDefinitionId).toBe('proc_alevel_detailed'); // Specific match for Gulshan
    expect(app.currentStepType).toBe('APPLICATION_REVIEW');
  });

  it('3. No Process Found Scenario: Submission succeeds, record created with SUBMITTED status and Awaiting Process state', async () => {
    const dto: CreatePreAdmissionDto = {
      campusId: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Islamabad Campus
      classId: 'cls-ey1',
      academicYearId: 'ay_2026_2027',
      formDefinitionId: 'f_prereg_2026',
      source: 'ONLINE',
      formData: {
        studentFirstName: 'Ali',
        studentLastName: 'Raza',
        gender: 'MALE',
        dateOfBirth: '2021-02-10',
        fatherName: 'Raza Abbas',
        primaryMobile: '0345-1234567',
      },
    };

    // Temporarily mock resolver to return undefined
    const originalResolver = service.resolveProcessForCampus;
    service.resolveProcessForCampus = () => undefined;

    const app = await service.createPreAdmission(dto);

    expect(app.applicationNumber).toBeDefined();
    expect(app.status).toBe('SUBMITTED');
    expect(app.journeyStatus).toBe('NO_PROCESS');
    expect(app.processDefinitionId).toBeNull();
    expect(app.currentStepId).toBeNull();
    expect(app.journey).toBeNull();

    // Restore resolver
    service.resolveProcessForCampus = originalResolver;
  });

  it('4. Manual Process Assignment: Unassigned record can have an active process assigned by staff', async () => {
    // 1. Create unassigned record
    const originalResolver = service.resolveProcessForCampus;
    service.resolveProcessForCampus = () => undefined;

    const app = await service.createPreAdmission({
      campusId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      classId: 'cls-ey1',
      academicYearId: 'ay_2026_2027',
      formDefinitionId: 'f_prereg_2026',
      source: 'ONLINE',
      formData: {
        studentFirstName: 'Zayd',
        studentLastName: 'Siddiqui',
        gender: 'MALE',
        dateOfBirth: '2021-05-15',
        fatherName: 'Farooq Siddiqui',
        primaryMobile: '0312-3344556',
      },
    });

    service.resolveProcessForCampus = originalResolver;

    expect(app.journeyStatus).toBe('NO_PROCESS');

    // 2. Staff manually assigns General Admission Process
    const assigned = await service.assignProcess(app.id, 'proc_general_k12', {
      organizationId: '11111111-1111-1111-1111-111111111111',
      userRole: 'ADMIN',
      isSuperAdmin: true,
    });

    expect(assigned.processDefinitionId).toBe('proc_general_k12');
    expect(assigned.journeyStatus).toBe('IN_PROGRESS');
    expect(assigned.journey?.steps[0]?.state).toBe('COMPLETED');
    expect(assigned.journey?.steps[1]?.state).toBe('CURRENT');
    expect(assigned.currentStepName).toBe('Application Review');
  });

  it('5. Standard Process Progression: Pre-Admission completes, Application Review becomes current', async () => {
    const app = await service.createPreAdmission({
      campusId: 'unknown_campus_universal',
      classId: 'cls-g3',
      academicYearId: 'ay_2026_2027',
      formDefinitionId: 'f_prereg_2026',
      source: 'STAFF_ENTRY',
      formData: {
        studentFirstName: 'Saad',
        studentLastName: 'Ahmed',
        gender: 'MALE',
        dateOfBirth: '2017-04-12',
        fatherName: 'Waqar Ahmed',
        primaryMobile: '0333-8877665',
      },
    });

    expect(app.processDefinitionId).toBe('proc_general_k12');
    expect(app.journey?.steps[0]?.stepType).toBe('PRE_ADMISSION');
    expect(app.journey?.steps[0]?.state).toBe('COMPLETED');
    expect(app.journey?.steps[1]?.stepType).toBe('APPLICATION_REVIEW');
    expect(app.journey?.steps[1]?.state).toBe('CURRENT');
  });

  it('6. Simple Process Progression: Pre-Admission completes, Final Admission becomes current directly', async () => {
    const app = await service.createPreAdmission({
      campusId: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // PECHS Senior Campus (matches proc_simple_adm)
      classId: 'cls-g7',
      academicYearId: 'ay_2026_2027',
      formDefinitionId: 'f_prereg_2026',
      source: 'STAFF_ENTRY',
      formData: {
        studentFirstName: 'Khadija',
        studentLastName: 'Noor',
        gender: 'FEMALE',
        dateOfBirth: '2014-08-22',
        fatherName: 'Noor Muhammad',
        primaryMobile: '0302-5544332',
      },
    });

    expect(app.processDefinitionId).toBe('proc_simple_adm');
    expect(app.journey?.steps[0]?.stepType).toBe('PRE_ADMISSION');
    expect(app.journey?.steps[0]?.state).toBe('COMPLETED');
    expect(app.journey?.steps[1]?.stepType).toBe('FINAL_ADMISSION_FORM');
    expect(app.journey?.steps[1]?.state).toBe('CURRENT');
    expect(app.currentStepType).toBe('FINAL_ADMISSION_FORM');
  });

  it('7. Version Safety: Application preserves exact form version and process version snapshot', async () => {
    const app = await service.createPreAdmission({
      campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      classId: 'cls-g3',
      academicYearId: 'ay_2026_2027',
      formDefinitionId: 'f_prereg_2026',
      publishedFormVersionId: 'v_prereg_1',
      source: 'ONLINE',
      formData: {
        studentFirstName: 'Ayla',
        studentLastName: 'Khan',
        gender: 'FEMALE',
        dateOfBirth: '2018-12-05',
        fatherName: 'Danish Khan',
        primaryMobile: '0322-7788990',
      },
    });

    expect(app.formDefinitionId).toBe('f_prereg_2026');
    expect(app.publishedFormVersionId).toBe('v_prereg_1');
    expect(app.formVersionNumber).toBe(1);
    expect(app.processVersionId).toBe('ver_proc_smp_v1');
    expect(app.processVersionNumber).toBe(1);
  });

  it('8. Data-Scope Isolation: Staff cannot view pre-admissions from unauthorized campuses', async () => {
    const res = await service.getPreAdmissions(
      {},
      {
        organizationId: '11111111-1111-1111-1111-111111111111',
        isSuperAdmin: false,
        authorizedCampusIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], // Only Clifton
      }
    );

    expect(res.items.length).toBeGreaterThan(0);
    for (const item of res.items) {
      expect(item.campusId).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    }
  });
});
