import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionProcessService } from '../src/modules/admission-process/admission-process.service.js';
import { AdmissionProcessStepConfig } from '@campus-os/types';

describe('Admission Process Builder — Comprehensive Tests', () => {
  let service: AdmissionProcessService;

  beforeEach(() => {
    service = new AdmissionProcessService();
  });

  it('1. Scenario A (Small School): Simple 2-step process validates and activates without pre-admission/test/interview', async () => {
    const proc = await service.createProcess(
      {
        name: 'Simple Junior Admission',
        starterTemplate: 'SIMPLE',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    expect(proc.steps.length).toBe(2);
    expect(proc.steps[0]!.stepType).toBe('FINAL_ADMISSION_FORM');
    expect(proc.steps[1]!.stepType).toBe('STUDENT_REGISTRATION');

    // Validation should pass
    const validation = await service.validateProcess(proc.steps);
    expect(validation.isValid).toBe(true);

    // Activation should succeed
    const activated = await service.activateProcess(proc.id, {
      organizationId: '11111111-1111-1111-1111-111111111111',
      isSuperAdmin: true,
    });
    expect(activated.status).toBe('ACTIVE');
    expect(activated.currentVersionNumber).toBe(1);
  });

  it('2. Scenario B (Normal School): Standard 4-step process validates correctly', async () => {
    const proc = await service.createProcess(
      {
        name: 'Standard Middle School Admission',
        starterTemplate: 'STANDARD',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    expect(proc.steps.length).toBe(4);
    expect(proc.steps[0]!.stepType).toBe('PRE_ADMISSION');
    expect(proc.steps[1]!.stepType).toBe('APPLICATION_REVIEW');
    expect(proc.steps[2]!.stepType).toBe('FINAL_ADMISSION_FORM');
    expect(proc.steps[3]!.stepType).toBe('STUDENT_REGISTRATION');

    const validation = await service.validateProcess(proc.steps);
    expect(validation.isValid).toBe(true);
  });

  it('3. Scenario C (Complex School): Detailed 12-step process with optional assessment and fees', async () => {
    const proc = await service.createProcess(
      {
        name: 'A-Level Comprehensive Track',
        starterTemplate: 'DETAILED',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    expect(proc.steps.length).toBe(12);
    const validation = await service.validateProcess(proc.steps);
    expect(validation.isValid).toBe(true);
  });

  it('4. Validation fails if Student Registration is missing', async () => {
    const invalidSteps: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 1,
        attachedFormDefinitionId: 'form_adm_1',
      },
    ];

    const validation = await service.validateProcess(invalidSteps);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Student Registration'))).toBe(true);
  });

  it('5. Validation fails if Student Registration is not the final step', async () => {
    const invalidSteps: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 1,
        isSystemTerminal: true,
      },
      {
        id: 's2',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 2,
        attachedFormDefinitionId: 'form_adm_1',
      },
    ];

    const validation = await service.validateProcess(invalidSteps);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('final terminal step'))).toBe(true);
  });

  it('6. Validation fails if Final Admission Form is missing an attached published form', async () => {
    const invalidSteps: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 1,
      },
      {
        id: 's2',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 2,
        isSystemTerminal: true,
      },
    ];

    const validation = await service.validateProcess(invalidSteps);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('attached Published Admission Form'))).toBe(true);
  });

  it('7. Process versioning increments version number and stores immutable snapshot upon reactivation', async () => {
    const proc = await service.createProcess(
      {
        name: 'Version Test Process',
        starterTemplate: 'SIMPLE',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    // Initial activation
    await service.activateProcess(proc.id, {
      organizationId: '11111111-1111-1111-1111-111111111111',
      isSuperAdmin: true,
    });
    expect(proc.currentVersionNumber).toBe(1);

    // Subsequent re-activation creates v2
    const v2 = await service.activateProcess(proc.id, {
      organizationId: '11111111-1111-1111-1111-111111111111',
      isSuperAdmin: true,
    });
    expect(v2.currentVersionNumber).toBe(2);

    const versions = await service.getVersions(proc.id, {
      organizationId: '11111111-1111-1111-1111-111111111111',
      isSuperAdmin: true,
    });
    expect(versions.length).toBe(2);
    expect(versions[0]!.versionNumber).toBe(1);
    expect(versions[1]!.versionNumber).toBe(2);
  });
});
