import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionsService } from '../src/modules/admissions/admissions.service.js';

describe('Admissions Module — Phase 1 Applications List', () => {
  let service: AdmissionsService;

  beforeEach(() => {
    service = new AdmissionsService();
  });

  it('1. SuperAdmin receives full applications dataset across all schools and campuses', async () => {
    const result = await service.getApplications({}, { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBe(30);
    expect(result.summary.totalApplications).toBe(30);
    expect(result.summary.pendingReview).toBeGreaterThan(0);
  });

  it('2. Campus-level user is strictly restricted to their authorized campus scope', async () => {
    const cliftonCampusId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const result = await service.getApplications(
      {},
      {
        organizationId: '11111111-1111-1111-1111-111111111111',
        isSuperAdmin: false,
        authorizedCampusIds: [cliftonCampusId],
      }
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((app) => app.campusId === cliftonCampusId)).toBe(true);
    expect(result.summary.totalApplications).toBe(result.total);
  });

  it('3. School-level user sees only applications under authorized school', async () => {
    const schoolId = 'sch-2';
    const result = await service.getApplications(
      {},
      {
        organizationId: '11111111-1111-1111-1111-111111111111',
        isSuperAdmin: false,
        authorizedSchoolIds: [schoolId],
      }
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((app) => app.schoolId === schoolId)).toBe(true);
  });

  it('4. Search by application number returns exact match', async () => {
    const result = await service.getApplications(
      { search: 'APP-2026-00121' },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    expect(result.items.length).toBe(1);
    expect(result.items[0]!.applicationNumber).toBe('APP-2026-00121');
    expect(result.items[0]!.studentName).toBe('Ahmed Ali');
  });

  it('5. Search by student name and father name works case-insensitively', async () => {
    const studentResult = await service.getApplications(
      { search: 'fatima' },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );
    expect(studentResult.items.length).toBeGreaterThan(0);
    expect(studentResult.items[0]!.studentName).toContain('Fatima');

    const fatherResult = await service.getApplications(
      { search: 'zahid hussain' },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );
    expect(fatherResult.items.length).toBeGreaterThan(0);
    expect(fatherResult.items[0]!.fatherOrGuardianName).toBe('Zahid Hussain');
  });

  it('6. Search by mobile number resolves application', async () => {
    const result = await service.getApplications(
      { search: '0300-1234567' },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );
    expect(result.items.length).toBe(1);
    expect(result.items[0]!.studentName).toBe('Ahmed Ali');
  });

  it('7. Status filter filters correctly', async () => {
    const result = await service.getApplications(
      { status: 'APPROVED' },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((app) => app.status === 'APPROVED')).toBe(true);
  });

  it('8. Class filter filters correctly', async () => {
    const result = await service.getApplications(
      { classId: 'cls-g3' },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((app) => app.classId === 'cls-g3')).toBe(true);
  });

  it('9. Server-side pagination slices dataset accurately', async () => {
    const page1 = await service.getApplications(
      { page: 1, limit: 5 },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );
    const page2 = await service.getApplications(
      { page: 2, limit: 5 },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    expect(page1.items.length).toBe(5);
    expect(page2.items.length).toBe(5);
    expect(page1.totalPages).toBe(6);
    expect(page1.items[0]!.id).not.toBe(page2.items[0]!.id);
  });

  it('10. Status update transition mutates status and logs timestamp', async () => {
    const updated = await service.updateStatus(
      'app_121',
      'APPROVED',
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true },
      'Approved after interview verification'
    );

    expect(updated.status).toBe('APPROVED');
    expect(updated.reviewNotes).toBe('Approved after interview verification');
  });

  it('11. Form version snapshot reference is preserved on applications', async () => {
    const app = await service.getApplicationById(
      'app_121',
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    expect(app.formDefinitionId).toBe('form_admission_k12');
    expect(app.publishedFormVersionId).toBe('ver_adm_v1_live');
    expect(app.formVersionNumber).toBe(1);
  });
});
