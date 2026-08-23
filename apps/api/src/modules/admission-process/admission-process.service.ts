import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  AdmissionProcessDto,
  AdmissionProcessVersionDto,
  AdmissionProcessStepConfig,
  CreateAdmissionProcessDto,
  UpdateAdmissionProcessDto,
  AdmissionProcessStarterTemplate,
} from '@campus-os/types';

export interface UserScopeContext {
  organizationId: string;
  userRole?: string;
  authorizedHeadOfficeIds?: string[];
  authorizedRegionIds?: string[];
  authorizedSchoolIds?: string[];
  authorizedCampusIds?: string[];
  isSuperAdmin?: boolean;
}

@Injectable()
export class AdmissionProcessService {
  private processes: AdmissionProcessDto[] = [];
  private processVersions: AdmissionProcessVersionDto[] = [];

  constructor() {
    this.seedDefaultProcesses();
  }

  private generateStarterSteps(
    template: AdmissionProcessStarterTemplate
  ): AdmissionProcessStepConfig[] {
    switch (template) {
      case 'SIMPLE':
        return [
          {
            id: 'step_simple_1',
            stepType: 'FINAL_ADMISSION_FORM',
            displayName: 'Final Admission Form',
            category: 'CONFIRMATION',
            isRequired: true,
            sortOrder: 1,
            attachedFormDefinitionId: 'form_admission_k12',
            attachedFormVersionId: 'ver_adm_v1_live',
            attachedFormName: 'K-12 Final Admission Form 2026–27',
            autoMoveToNext: true,
            allowHold: false,
            allowReject: false,
          },
          {
            id: 'step_simple_2',
            stepType: 'STUDENT_REGISTRATION',
            displayName: 'Student Registration',
            category: 'REGISTRATION',
            isRequired: true,
            sortOrder: 2,
            isSystemTerminal: true,
            autoMoveToNext: false,
          },
        ];

      case 'STANDARD':
        return [
          {
            id: 'step_std_1',
            stepType: 'PRE_ADMISSION',
            displayName: 'Pre-Admission Application',
            category: 'APPLICATION',
            isRequired: true,
            sortOrder: 1,
            attachedFormDefinitionId: 'form_preadm_online',
            attachedFormVersionId: 'ver_preadm_v1_live',
            attachedFormName: 'Online Admission 2026–27',
            autoMoveToNext: true,
            allowHold: false,
            allowReject: false,
            notifications: {
              notifyApplicant: true,
              notifyInternalTeam: true,
            },
          },
          {
            id: 'step_std_2',
            stepType: 'APPLICATION_REVIEW',
            displayName: 'Application Review',
            category: 'APPLICATION',
            isRequired: true,
            sortOrder: 2,
            responsibleRole: 'Admissions Officer',
            autoMoveToNext: true,
            allowHold: true,
            allowReject: true,
          },
          {
            id: 'step_std_3',
            stepType: 'FINAL_ADMISSION_FORM',
            displayName: 'Final Admission Form',
            category: 'CONFIRMATION',
            isRequired: true,
            sortOrder: 3,
            attachedFormDefinitionId: 'form_admission_k12',
            attachedFormVersionId: 'ver_adm_v1_live',
            attachedFormName: 'K-12 Final Admission Form 2026–27',
            autoMoveToNext: true,
            allowHold: false,
            allowReject: false,
          },
          {
            id: 'step_std_4',
            stepType: 'STUDENT_REGISTRATION',
            displayName: 'Student Registration',
            category: 'REGISTRATION',
            isRequired: true,
            sortOrder: 4,
            isSystemTerminal: true,
            autoMoveToNext: false,
          },
        ];

      case 'DETAILED':
        return [
          {
            id: 'step_det_1',
            stepType: 'PRE_ADMISSION',
            displayName: 'Online Pre-Admission',
            category: 'APPLICATION',
            isRequired: true,
            sortOrder: 1,
            attachedFormDefinitionId: 'form_preadm_online',
            attachedFormVersionId: 'ver_preadm_v1_live',
            attachedFormName: 'Online Admission 2026–27',
            autoMoveToNext: true,
            allowHold: false,
            allowReject: false,
            notifications: {
              notifyApplicant: true,
              notifyInternalTeam: true,
            },
          },
          {
            id: 'step_det_2',
            stepType: 'APPLICATION_REVIEW',
            displayName: 'Application Review',
            category: 'APPLICATION',
            isRequired: true,
            sortOrder: 2,
            responsibleRole: 'Admissions Officer',
            autoMoveToNext: true,
            allowHold: true,
            allowReject: true,
          },
          {
            id: 'step_det_3',
            stepType: 'DOCUMENT_VERIFICATION',
            displayName: 'Document Verification',
            category: 'APPLICATION',
            isRequired: true,
            sortOrder: 3,
            responsibleRole: 'Registrar',
            autoMoveToNext: true,
            allowHold: true,
            allowReject: false,
          },
          {
            id: 'step_det_4',
            stepType: 'REGISTRATION_FEE',
            displayName: 'Registration Fee',
            category: 'CONFIRMATION',
            isRequired: false,
            sortOrder: 4,
            autoMoveToNext: true,
          },
          {
            id: 'step_det_5',
            stepType: 'ASSESSMENT_TEST',
            displayName: 'Entrance Test',
            category: 'ASSESSMENT',
            isRequired: true,
            sortOrder: 5,
            responsibleRole: 'Academic Coordinator',
            autoMoveToNext: true,
            allowHold: true,
            allowReject: true,
          },
          {
            id: 'step_det_6',
            stepType: 'INTERVIEW',
            displayName: 'Interview',
            category: 'ASSESSMENT',
            isRequired: false,
            sortOrder: 6,
            responsibleRole: 'Principal / Vice Principal',
            autoMoveToNext: true,
            allowHold: true,
            allowReject: true,
          },
          {
            id: 'step_det_7',
            stepType: 'ELIGIBILITY_REVIEW',
            displayName: 'Eligibility Review',
            category: 'ASSESSMENT',
            isRequired: true,
            sortOrder: 7,
            autoMoveToNext: true,
          },
          {
            id: 'step_det_8',
            stepType: 'APPROVAL',
            displayName: 'Final Decision / Approval',
            category: 'DECISION',
            isRequired: true,
            sortOrder: 8,
            responsibleRole: 'Principal',
            autoMoveToNext: true,
            allowHold: true,
            allowReject: true,
          },
          {
            id: 'step_det_9',
            stepType: 'SEAT_CONFIRMATION',
            displayName: 'Seat Confirmation',
            category: 'CONFIRMATION',
            isRequired: true,
            sortOrder: 9,
            autoMoveToNext: true,
          },
          {
            id: 'step_det_10',
            stepType: 'INITIAL_ADMISSION_FEE',
            displayName: 'Initial Admission Fee',
            category: 'CONFIRMATION',
            isRequired: true,
            sortOrder: 10,
            autoMoveToNext: true,
          },
          {
            id: 'step_det_11',
            stepType: 'FINAL_ADMISSION_FORM',
            displayName: 'Final Admission Form',
            category: 'CONFIRMATION',
            isRequired: true,
            sortOrder: 11,
            attachedFormDefinitionId: 'form_admission_k12',
            attachedFormVersionId: 'ver_adm_v1_live',
            attachedFormName: 'K-12 Final Admission Form 2026–27',
            autoMoveToNext: true,
            allowHold: false,
            allowReject: false,
          },
          {
            id: 'step_det_12',
            stepType: 'STUDENT_REGISTRATION',
            displayName: 'Student Registration',
            category: 'REGISTRATION',
            isRequired: true,
            sortOrder: 12,
            isSystemTerminal: true,
            autoMoveToNext: false,
          },
        ];

      case 'CUSTOM':
      default:
        return [
          {
            id: 'step_cust_1',
            stepType: 'FINAL_ADMISSION_FORM',
            displayName: 'Final Admission Form',
            category: 'CONFIRMATION',
            isRequired: true,
            sortOrder: 1,
            attachedFormDefinitionId: 'form_admission_k12',
            attachedFormVersionId: 'ver_adm_v1_live',
            attachedFormName: 'K-12 Final Admission Form 2026–27',
            autoMoveToNext: true,
            allowHold: false,
            allowReject: false,
          },
          {
            id: 'step_cust_2',
            stepType: 'STUDENT_REGISTRATION',
            displayName: 'Student Registration',
            category: 'REGISTRATION',
            isRequired: true,
            sortOrder: 2,
            isSystemTerminal: true,
            autoMoveToNext: false,
          },
        ];
    }
  }

  private seedDefaultProcesses() {
    const orgId = '11111111-1111-1111-1111-111111111111';

    // 1. General Admission Process (Standard 4-step)
    const proc1: AdmissionProcessDto = {
      id: 'proc_general_k12',
      organizationId: orgId,
      code: 'AP-GEN-2026',
      name: 'General Admission Process',
      description: 'Standard K-12 admissions workflow with pre-admission, officer review, final admission and registration.',
      starterTemplate: 'STANDARD',
      status: 'ACTIVE',
      currentVersionNumber: 1,
      publishedVersionId: 'ver_proc_gen_v1',
      applyTo: 'ALL_CAMPUSES',
      branchIds: [],
      branchNames: [],
      ownerType: 'HEAD_OFFICE',
      ownerId: 'ho_main',
      sourceOrigin: 'LOCAL',
      isInherited: false,
      canEdit: true,
      canActivate: true,
      steps: this.generateStarterSteps('STANDARD'),
      totalStepsCount: 4,
      createdAt: new Date('2026-08-20T10:00:00Z'),
      updatedAt: new Date('2026-08-20T10:00:00Z'),
    };

    // 2. Simple Direct Admission (2-step)
    const proc2: AdmissionProcessDto = {
      id: 'proc_simple_adm',
      organizationId: orgId,
      code: 'AP-SMP-2026',
      name: 'Simple Direct Admission',
      description: 'Direct admission for junior school without multi-stage tests or pre-admission forms.',
      starterTemplate: 'SIMPLE',
      status: 'ACTIVE',
      currentVersionNumber: 1,
      publishedVersionId: 'ver_proc_smp_v1',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd'],
      branchNames: ['Clifton Campus', 'PECHS Senior Campus'],
      ownerType: 'SCHOOL',
      ownerId: 'sch-1',
      sourceOrigin: 'LOCAL',
      isInherited: false,
      canEdit: true,
      canActivate: true,
      steps: this.generateStarterSteps('SIMPLE'),
      totalStepsCount: 2,
      createdAt: new Date('2026-08-22T12:00:00Z'),
      updatedAt: new Date('2026-08-22T12:00:00Z'),
    };

    // 3. A-Level Comprehensive Admission (Detailed 12-step)
    const proc3: AdmissionProcessDto = {
      id: 'proc_alevel_detailed',
      organizationId: orgId,
      code: 'AP-ALV-2026',
      name: 'A-Level Comprehensive Admission',
      description: 'Multi-stage admission process with entrance testing, interview, document verification, and seat confirmation.',
      starterTemplate: 'DETAILED',
      status: 'ACTIVE',
      currentVersionNumber: 1,
      publishedVersionId: 'ver_proc_alv_v1',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc'],
      branchNames: ['Main Campus (Gulshan)', 'DHA Phase 6 Campus'],
      ownerType: 'HEAD_OFFICE',
      ownerId: 'ho_main',
      sourceOrigin: 'LOCAL',
      isInherited: false,
      canEdit: true,
      canActivate: true,
      steps: this.generateStarterSteps('DETAILED'),
      totalStepsCount: 12,
      createdAt: new Date('2026-08-23T14:00:00Z'),
      updatedAt: new Date('2026-08-23T14:00:00Z'),
    };

    this.processes = [proc1, proc2, proc3];

    // Seed versions
    this.processVersions = this.processes.map((p) => ({
      id: `ver_${p.id}_v1`,
      organizationId: p.organizationId,
      processDefinitionId: p.id,
      versionNumber: 1,
      status: p.status,
      steps: p.steps,
      publishedAt: p.createdAt,
      publishedByUserId: 'usr_admin',
      changelogSummary: 'Initial Published Process Version',
      createdAt: p.createdAt,
    }));
  }

  public async getProcesses(
    userScope: UserScopeContext
  ): Promise<AdmissionProcessDto[]> {
    return this.processes.filter((p) => {
      if (userScope.isSuperAdmin) return true;

      // Check campus / school scope
      if (userScope.authorizedCampusIds && userScope.authorizedCampusIds.length > 0) {
        if (p.applyTo === 'ALL_CAMPUSES') return true;
        return (p.branchIds || []).some((b) => userScope.authorizedCampusIds!.includes(b));
      }

      if (userScope.authorizedSchoolIds && userScope.authorizedSchoolIds.length > 0) {
        if (p.ownerType === 'SCHOOL') {
          return p.ownerId ? userScope.authorizedSchoolIds.includes(p.ownerId) : true;
        }
        return true;
      }

      return true;
    });
  }

  public async getProcessById(
    id: string,
    _userScope?: UserScopeContext
  ): Promise<AdmissionProcessDto> {
    const proc = this.processes.find((p) => p.id === id || p.code === id);
    if (!proc) {
      throw new NotFoundException(`Admission Process "${id}" not found.`);
    }
    return proc;
  }

  public async createProcess(
    dto: CreateAdmissionProcessDto,
    userScope: UserScopeContext
  ): Promise<AdmissionProcessDto> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Process Name is required.');
    }

    const orgId = userScope.organizationId || '11111111-1111-1111-1111-111111111111';
    const id = `proc_${Date.now()}`;
    const starter = dto.starterTemplate || 'STANDARD';
    const initialSteps = dto.steps && dto.steps.length > 0 ? dto.steps : this.generateStarterSteps(starter);

    const newProc: AdmissionProcessDto = {
      id,
      organizationId: orgId,
      code: dto.code || `AP-${String(this.processes.length + 1).padStart(3, '0')}`,
      name: dto.name.trim(),
      description: dto.description || '',
      starterTemplate: starter,
      status: 'DRAFT',
      currentVersionNumber: 1,
      applyTo: dto.applyTo || 'ALL_CAMPUSES',
      branchIds: dto.branchIds || [],
      branchNames: [],
      ownerType: dto.ownerType || 'HEAD_OFFICE',
      ownerId: dto.ownerId || null,
      sourceOrigin: 'LOCAL',
      isInherited: false,
      canEdit: true,
      canActivate: true,
      steps: initialSteps,
      totalStepsCount: initialSteps.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.processes.push(newProc);
    return newProc;
  }

  public async updateProcess(
    id: string,
    dto: UpdateAdmissionProcessDto,
    userScope: UserScopeContext
  ): Promise<AdmissionProcessDto> {
    const proc = await this.getProcessById(id, userScope);

    if (dto.name !== undefined) proc.name = dto.name.trim();
    if (dto.description !== undefined) proc.description = dto.description;
    if (dto.applyTo !== undefined) proc.applyTo = dto.applyTo;
    if (dto.branchIds !== undefined) proc.branchIds = dto.branchIds;

    if (dto.steps !== undefined) {
      // Re-index sortOrder
      proc.steps = dto.steps.map((s, idx) => ({
        ...s,
        sortOrder: idx + 1,
      }));
      proc.totalStepsCount = proc.steps.length;
    }

    proc.updatedAt = new Date();
    return proc;
  }

  public async validateProcess(steps: AdmissionProcessStepConfig[]): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!steps || steps.length === 0) {
      errors.push('The process must have at least one step.');
      return { isValid: false, errors };
    }

    // 1. Must have exactly one STUDENT_REGISTRATION step
    const regSteps = steps.filter((s) => s.stepType === 'STUDENT_REGISTRATION');
    if (regSteps.length === 0) {
      errors.push('Process must include the "Student Registration" terminal step.');
    } else if (regSteps.length > 1) {
      errors.push('Only one "Student Registration" step is permitted.');
    }

    // 2. STUDENT_REGISTRATION must be the LAST step
    const lastStep = steps[steps.length - 1]!;
    if (lastStep.stepType !== 'STUDENT_REGISTRATION') {
      errors.push('"Student Registration" must be the final terminal step in the admission journey.');
    }

    // 3. Must have a Final Admission Form step
    const admFormSteps = steps.filter((s) => s.stepType === 'FINAL_ADMISSION_FORM');
    if (admFormSteps.length === 0) {
      errors.push('Process must include a "Final Admission Form" step before Student Registration.');
    } else {
      for (const s of admFormSteps) {
        if (!s.attachedFormDefinitionId) {
          errors.push(`"${s.displayName}" requires an attached Published Admission Form.`);
        }
      }
    }

    // 4. Pre-Admission forms check
    const preAdmSteps = steps.filter((s) => s.stepType === 'PRE_ADMISSION');
    for (const s of preAdmSteps) {
      if (!s.attachedFormDefinitionId) {
        errors.push(`"${s.displayName}" requires an attached Published Pre-Admission Form.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public async activateProcess(
    id: string,
    userScope: UserScopeContext
  ): Promise<AdmissionProcessDto> {
    const proc = await this.getProcessById(id, userScope);

    // Validate
    const validation = await this.validateProcess(proc.steps);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(' '));
    }

    // Versioning: If currently active, increment version number
    if (proc.status === 'ACTIVE') {
      proc.currentVersionNumber += 1;
    }

    proc.status = 'ACTIVE';
    const versionId = `ver_${proc.id}_v${proc.currentVersionNumber}`;
    proc.publishedVersionId = versionId;
    proc.updatedAt = new Date();

    // Create Immutable Version Record
    const versionRecord: AdmissionProcessVersionDto = {
      id: versionId,
      organizationId: proc.organizationId,
      processDefinitionId: proc.id,
      versionNumber: proc.currentVersionNumber,
      status: 'ACTIVE',
      steps: JSON.parse(JSON.stringify(proc.steps)),
      publishedAt: new Date(),
      publishedByUserId: 'usr_admin',
      changelogSummary: `Published Process Version ${proc.currentVersionNumber}`,
      createdAt: new Date(),
    };

    this.processVersions.push(versionRecord);
    return proc;
  }

  public async deactivateProcess(
    id: string,
    userScope: UserScopeContext
  ): Promise<AdmissionProcessDto> {
    const proc = await this.getProcessById(id, userScope);
    proc.status = 'INACTIVE';
    proc.updatedAt = new Date();
    return proc;
  }

  public async getVersions(
    processId: string,
    userScope: UserScopeContext
  ): Promise<AdmissionProcessVersionDto[]> {
    await this.getProcessById(processId, userScope);
    return this.processVersions.filter((v) => v.processDefinitionId === processId);
  }
}
