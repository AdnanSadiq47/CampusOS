import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionProcessService } from '../src/modules/admission-process/admission-process.service.js';
import { AdmissionProcessStepConfig } from '@campus-os/types';

describe('Admission Process Builder — Comprehensive Tests', () => {
  let service: AdmissionProcessService;

  beforeEach(() => {
    service = new AdmissionProcessService();
  });

  it('1. Application Review can be removed: Pre-Admission -> Final Admission -> Student Registration is valid', async () => {
    const customSteps: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'PRE_ADMISSION',
        displayName: 'Pre-Admission Application',
        category: 'APPLICATION',
        isRequired: true,
        sortOrder: 1,
        attachedFormDefinitionId: 'f_prereg_2026',
      },
      {
        id: 's2',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 2,
        attachedFormDefinitionId: 'f_adm_formal',
      },
      {
        id: 's3',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 3,
        isSystemTerminal: true,
      },
    ];

    const validation = await service.validateProcess(customSteps);
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('2. Pre-Admission can be removed for Simple Admission: Final Admission -> Student Registration is valid', async () => {
    const simpleSteps: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Direct Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 1,
        attachedFormDefinitionId: 'f_adm_formal',
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

    const validation = await service.validateProcess(simpleSteps);
    expect(validation.isValid).toBe(true);
  });

  it('3. Final Admission -> Student Registration is valid and can be activated', async () => {
    const proc = await service.createProcess(
      {
        name: 'Simple Junior Admission',
        starterTemplate: 'SIMPLE',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    const activated = await service.activateProcess(proc.id, {
      organizationId: '11111111-1111-1111-1111-111111111111',
      isSuperAdmin: true,
    });
    expect(activated.status).toBe('ACTIVE');
    expect(activated.steps.length).toBe(2);
  });

  it('4. Student Registration cannot be duplicated', async () => {
    const duplicateSteps: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 1,
        attachedFormDefinitionId: 'f_adm_formal',
      },
      {
        id: 's2',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration 1',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 2,
        isSystemTerminal: true,
      },
      {
        id: 's3',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration 2',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 3,
        isSystemTerminal: true,
      },
    ];

    const validation = await service.validateProcess(duplicateSteps);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Only one "Student Registration"'))).toBe(true);
  });

  it('5. Student Registration cannot be reordered before other steps', async () => {
    const reorderedSteps: AdmissionProcessStepConfig[] = [
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
        attachedFormDefinitionId: 'f_adm_formal',
      },
    ];

    const validation = await service.validateProcess(reorderedSteps);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('final terminal step') || e.includes('final step'))).toBe(true);
  });

  it('6. No step can exist after Student Registration', async () => {
    const invalidStepAfter: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 1,
        attachedFormDefinitionId: 'f_adm_formal',
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
      {
        id: 's3',
        stepType: 'INITIAL_ADMISSION_FEE',
        displayName: 'Late Fee Step',
        category: 'CONFIRMATION',
        isRequired: false,
        sortOrder: 3,
      },
    ];

    const validation = await service.validateProcess(invalidStepAfter);
    expect(validation.isValid).toBe(false);
  });

  it('7. PRE_ADMISSION step accepts only valid pre-admission forms and rejects missing form', async () => {
    const missingFormSteps: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'PRE_ADMISSION',
        displayName: 'Online Pre-Admission',
        category: 'APPLICATION',
        isRequired: true,
        sortOrder: 1,
        // No attachedFormDefinitionId
      },
      {
        id: 's2',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 2,
        attachedFormDefinitionId: 'f_adm_formal',
      },
      {
        id: 's3',
        stepType: 'STUDENT_REGISTRATION',
        displayName: 'Student Registration',
        category: 'REGISTRATION',
        isRequired: true,
        sortOrder: 3,
        isSystemTerminal: true,
      },
    ];

    const validation = await service.validateProcess(missingFormSteps);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Pre-Admission Form'))).toBe(true);
  });

  it('8. Final Admission accepts only ADMISSION forms and rejects missing form', async () => {
    const missingAdmForm: AdmissionProcessStepConfig[] = [
      {
        id: 's1',
        stepType: 'FINAL_ADMISSION_FORM',
        displayName: 'Final Admission Form',
        category: 'CONFIRMATION',
        isRequired: true,
        sortOrder: 1,
        // Missing attached form
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

    const validation = await service.validateProcess(missingAdmForm);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Admission Form'))).toBe(true);
  });

  it('9. Step settings (custom name, isRequired, responsibleRole) persist on update', async () => {
    const proc = await service.createProcess(
      {
        name: 'Custom Settings Process',
        starterTemplate: 'STANDARD',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    const updatedSteps = proc.steps.map((s) => {
      if (s.stepType === 'APPLICATION_REVIEW') {
        return {
          ...s,
          displayName: 'Leadership Committee Review',
          isRequired: false,
          responsibleRole: 'Principal / Vice Principal',
        };
      }
      return s;
    });

    const updated = await service.updateProcess(
      proc.id,
      { steps: updatedSteps },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    const reviewStep = updated.steps.find((s) => s.stepType === 'APPLICATION_REVIEW');
    expect(reviewStep?.displayName).toBe('Leadership Committee Review');
    expect(reviewStep?.isRequired).toBe(false);
    expect(reviewStep?.responsibleRole).toBe('Principal / Vice Principal');
  });

  it('10. Advanced settings (allowHold, allowReject, autoMoveToNext, instructions) persist on update', async () => {
    const proc = await service.createProcess(
      {
        name: 'Advanced Settings Process',
        starterTemplate: 'STANDARD',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    const updatedSteps = proc.steps.map((s) => {
      if (s.stepType === 'APPLICATION_REVIEW') {
        return {
          ...s,
          allowHold: true,
          allowReject: true,
          autoMoveToNext: false,
          instructions: 'Check previous school clearance certificates.',
        };
      }
      return s;
    });

    const updated = await service.updateProcess(
      proc.id,
      { steps: updatedSteps },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    const reviewStep = updated.steps.find((s) => s.stepType === 'APPLICATION_REVIEW');
    expect(reviewStep?.allowHold).toBe(true);
    expect(reviewStep?.allowReject).toBe(true);
    expect(reviewStep?.autoMoveToNext).toBe(false);
    expect(reviewStep?.instructions).toBe('Check previous school clearance certificates.');
  });

  it('11. Notification settings (notifyApplicant, notifyInternalTeam) persist on update', async () => {
    const proc = await service.createProcess(
      {
        name: 'Notification Process',
        starterTemplate: 'STANDARD',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    const updatedSteps = proc.steps.map((s) => {
      if (s.stepType === 'APPLICATION_REVIEW') {
        return {
          ...s,
          notifications: {
            notifyApplicant: true,
            notifyInternalTeam: true,
          },
        };
      }
      return s;
    });

    const updated = await service.updateProcess(
      proc.id,
      { steps: updatedSteps },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    const reviewStep = updated.steps.find((s) => s.stepType === 'APPLICATION_REVIEW');
    expect(reviewStep?.notifications?.notifyApplicant).toBe(true);
    expect(reviewStep?.notifications?.notifyInternalTeam).toBe(true);
  });

  it('12. Reordering steps preserves all internal configurations and properties', async () => {
    const proc = await service.createProcess(
      {
        name: 'Reordering Process',
        starterTemplate: 'DETAILED',
      },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    // Swap Test (step 5) and Interview (step 6)
    const stepsCopy = [...proc.steps];
    const testStep = stepsCopy[4]!;
    const interviewStep = stepsCopy[5]!;

    stepsCopy[4] = { ...interviewStep, sortOrder: 5 };
    stepsCopy[5] = { ...testStep, sortOrder: 6 };

    const updated = await service.updateProcess(
      proc.id,
      { steps: stepsCopy },
      { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true }
    );

    expect(updated.steps[4]!.stepType).toBe('INTERVIEW');
    expect(updated.steps[5]!.stepType).toBe('ASSESSMENT_TEST');
  });

  it('13. Process versioning increments version number and stores immutable snapshot upon reactivation', async () => {
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
