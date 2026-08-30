import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Headers,
} from '@nestjs/common';
import { AdmissionsService, UserScopeContext } from './admissions.service.js';
import {
  PreAdmissionsFilterDto,
  PaginatedPreAdmissionsDto,
  PreAdmissionApplicationDto,
  CreatePreAdmissionDto,
  AssignAdmissionProcessDto,
  PreAdmissionStatus,
  PreAdmissionsListViewConfigDto,
  SaveUserListViewConfigDto,
  VerifyApplicationsScanRequestDto,
  VerifyApplicationsScanResultDto,
  BulkVerifyCleanRequestDto,
  HumanOverrideVerificationDto,
  EditOperationalDataDto,
  DuplicateComparisonResultDto,
  AdmissionTestScheduleDto,
  TestScheduleSummaryDto,
  AdmissionTestCandidateDto,
  CreateAdmissionTestScheduleDto,
  RescheduleCandidateDto,
  TestScheduleAssignmentDto,
  TestOutcome,
  InterviewScheduleDto,
  InterviewAssignmentDto,
  InterviewOutcome,
  AdmissionDecisionOutcome,
  AdmissionChargeDto,
  ApplicationDocumentDto,
  UploadDocumentDto,
  VerifyDocumentDto,
  ApplicationFeePolicyDto,
  ApplicationFeePaymentDto,
  SubmitFeePaymentDto,
  VerifyFeePaymentDto,
  ApplicationFeeVoucherDto,
  BankStatementRowDto,
  BulkReconciliationResultDto,
  ApplicationFeeRuleDto,
  CreateApplicationFeeRuleDto,
  ResolveApplicationFeeDto,
  SystemCheckResponseDto,
  BulkHumanVerifyDto,
  BulkHumanVerifyResponseDto,
} from '@campus-os/types';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  private extractUserScope(
    headers: Record<string, any>,
    query?: Record<string, any>,
    body?: Record<string, any>
  ): UserScopeContext {
    const orgId = headers['x-tenant-id'] || '11111111-1111-1111-1111-111111111111';
    const role = headers['x-user-role'] || 'ADMIN';
    const campusHeader = headers['x-authorized-campuses'];
    const schoolHeader = headers['x-authorized-schools'];
    const regionHeader = headers['x-authorized-regions'];
    const contextNodeId =
      headers['x-working-context-id'] || query?.contextNodeId || body?.contextNodeId;
    const contextNodeType =
      headers['x-working-context-type'] || query?.contextNodeType || body?.contextNodeType;

    return {
      organizationId: orgId,
      userRole: role,
      isSuperAdmin: role === 'SUPER_ADMIN',
      authorizedCampusIds: campusHeader ? String(campusHeader).split(',').map((s) => s.trim()) : undefined,
      authorizedSchoolIds: schoolHeader ? String(schoolHeader).split(',').map((s) => s.trim()) : undefined,
      authorizedRegionIds: regionHeader ? String(regionHeader).split(',').map((s) => s.trim()) : undefined,
      workingContext: contextNodeId
        ? {
            nodeId: String(contextNodeId),
            nodeType: contextNodeType as any,
            nodeName: '',
            organizationId: orgId,
          }
        : undefined,
    };
  }

  // -------------------------------------------------------------
  // Global Working Context Engine Endpoints
  // -------------------------------------------------------------
  @Get('working-contexts')
  async getWorkingContexts(@Headers() headers: Record<string, any>) {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getAuthorizedWorkingContexts(userScope);
  }

  @Get('effective-scope')
  async getEffectiveScope(
    @Query('contextNodeId') contextNodeId: string,
    @Query('contextNodeType') contextNodeType: any,
    @Headers() headers: Record<string, any>
  ) {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getEffectiveScope(userScope, contextNodeId, contextNodeType);
  }

  // Pre-Admissions List
  @Get('pre-admissions')
  async getPreAdmissions(
    @Query() query: PreAdmissionsFilterDto,
    @Headers() headers: Record<string, any>
  ): Promise<PaginatedPreAdmissionsDto> {
    const userScope = this.extractUserScope(headers, query);
    return this.admissionsService.getPreAdmissions(query, userScope);
  }

  @Get('applications')
  async getApplicationsLegacy(
    @Query() query: PreAdmissionsFilterDto,
    @Headers() headers: Record<string, any>
  ): Promise<PaginatedPreAdmissionsDto> {
    const userScope = this.extractUserScope(headers, query);
    return this.admissionsService.getPreAdmissions(query, userScope);
  }

  // Dynamic List View Configuration
  @Get('list-view-config')
  async getListViewConfig(@Headers() headers: Record<string, any>): Promise<PreAdmissionsListViewConfigDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getListViewConfig(userScope);
  }

  @Put('list-view-config')
  async saveListViewConfig(
    @Body() body: SaveUserListViewConfigDto | PreAdmissionsListViewConfigDto,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionsListViewConfigDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.saveListViewConfig(body, userScope);
  }

  // -------------------------------------------------------------
  // Verification Center Endpoints
  // -------------------------------------------------------------
  @Post('verification/scan')
  async scanApplicationsForVerification(
    @Body() dto: VerifyApplicationsScanRequestDto & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<VerifyApplicationsScanResultDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.scanApplicationsForVerification(dto, userScope);
  }

  @Post('verification/verify-clean')
  async bulkVerifyCleanApplications(
    @Body() dto: BulkVerifyCleanRequestDto & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<{ verifiedCount: number; advancedApplicationIds: string[]; remainingFlaggedCount: number }> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.bulkVerifyCleanApplications(dto, userScope);
  }

  @Post('verification/override')
  async overrideVerification(
    @Body() dto: HumanOverrideVerificationDto & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.overrideVerification(dto, userScope);
  }

  @Post('verification/edit-data')
  async editOperationalData(
    @Body() dto: EditOperationalDataDto & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.editOperationalData(dto, userScope);
  }

  @Post('verification/mark-verified')
  async markApplicationVerified(
    @Body() dto: { applicationId: string; notes?: string; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.markApplicationVerified(dto, userScope);
  }

  @Post('verification/bulk-mark-verified')
  async bulkMarkApplicationsVerified(
    @Body() dto: { applicationIds: string[]; notes?: string; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<{ verifiedCount: number; updatedApplicationIds: string[]; message: string }> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.bulkMarkApplicationsVerified(dto, userScope);
  }

  @Post('verification/set-inactive')
  async setApplicationInactive(
    @Body() dto: { applicationId: string; reason?: string; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.setApplicationInactive(dto, userScope);
  }

  @Post('verification/remove')
  async removePreAdmission(
    @Body() dto: { applicationId: string; reason: string; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<{ success: boolean; id: string }> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.removePreAdmission(dto, userScope);
  }

  @Get('verification/compare/:id/:duplicateId')
  async getDuplicateComparison(
    @Param('id') id: string,
    @Param('duplicateId') duplicateId: string,
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<DuplicateComparisonResultDto> {
    const userScope = this.extractUserScope(headers, query);
    return this.admissionsService.getDuplicateComparison(id, duplicateId, userScope);
  }

  // ─────────────────────────────────────────────────────────────
  // Application Review & Documents Endpoints
  // ─────────────────────────────────────────────────────────────
  @Get('pre-admissions/:id/review')
  async getApplicationReview(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ) {
    const userScope = this.extractUserScope(headers, query);
    return this.admissionsService.getApplicationReview(id, userScope);
  }

  @Get('pre-admissions/:id/documents')
  async getApplicationDocuments(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<ApplicationDocumentDto[]> {
    const userScope = this.extractUserScope(headers, query);
    return this.admissionsService.getApplicationDocuments(id, userScope);
  }

  @Post('pre-admissions/:id/documents')
  async uploadApplicationDocument(
    @Param('id') id: string,
    @Body() dto: Omit<UploadDocumentDto, 'applicationId'> & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<ApplicationDocumentDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.uploadApplicationDocument({ ...dto, applicationId: id }, userScope);
  }

  @Post('documents/verify')
  async verifyApplicationDocument(
    @Body() dto: VerifyDocumentDto & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<ApplicationDocumentDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.verifyApplicationDocument(dto, userScope);
  }

  // ─────────────────────────────────────────────────────────────
  // Application Fee & Reconciliation Endpoints
  // ─────────────────────────────────────────────────────────────
  @Get('fee-policy')
  async getApplicationFeePolicy(
    @Query('campusId') campusId: string,
    @Headers() headers: Record<string, any>
  ): Promise<ApplicationFeePolicyDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getApplicationFeePolicy(campusId, userScope);
  }

  @Get('pre-admissions/:id/fee')
  async getApplicationFeePayment(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<ApplicationFeePaymentDto> {
    const userScope = this.extractUserScope(headers, query);
    return this.admissionsService.getApplicationFeePayment(id, userScope);
  }

  @Post('pre-admissions/:id/fee/submit')
  async submitFeePaymentEvidence(
    @Param('id') id: string,
    @Body() dto: Omit<SubmitFeePaymentDto, 'applicationId'> & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<ApplicationFeePaymentDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.submitFeePaymentEvidence({ ...dto, applicationId: id }, userScope);
  }

  @Post('fee-payments/verify')
  async verifyFeePayment(
    @Body() dto: VerifyFeePaymentDto & { contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<ApplicationFeePaymentDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.verifyFeePayment(dto, userScope);
  }

  @Get('pre-admissions/:id/fee/voucher')
  async generateFeeVoucher(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<ApplicationFeeVoucherDto> {
    const userScope = this.extractUserScope(headers, query);
    return this.admissionsService.generateFeeVoucher(id, userScope);
  }

  @Post('fee/reconcile-statement')
  async reconcileBankStatement(
    @Body() dto: { statementRows: BankStatementRowDto[]; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<BulkReconciliationResultDto> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.reconcileBankStatement(dto, userScope);
  }

  @Post('fee/confirm-reconciliations')
  async confirmMatchedReconciliations(
    @Body() dto: { matchedPaymentIds: string[]; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<{ confirmedCount: number; affectedApplicationIds: string[] }> {
    const userScope = this.extractUserScope(headers, query, dto);
    return this.admissionsService.confirmMatchedReconciliations(dto, userScope);
  }

  // Single Pre-Admission Detail
  @Get('pre-admissions/:id')
  async getPreAdmissionById(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getPreAdmissionById(id, userScope);
  }

  @Get('applications/:id')
  async getApplicationByIdLegacy(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getPreAdmissionById(id, userScope);
  }

  // Create Pre-Admission
  @Post('pre-admissions')
  async createPreAdmission(
    @Body() dto: CreatePreAdmissionDto,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = headers['x-user-role'] ? this.extractUserScope(headers) : undefined;
    return this.admissionsService.createPreAdmission(dto, userScope);
  }

  // Process Assignment
  @Post('pre-admissions/:id/assign-process')
  async assignProcess(
    @Param('id') id: string,
    @Body() body: AssignAdmissionProcessDto,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.assignProcess(id, body.processDefinitionId, userScope);
  }

  // Status update
  @Patch('pre-admissions/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PreAdmissionStatus; reviewNotes?: string },
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.updateStatus(id, body.status, userScope, body.reviewNotes);
  }

  // Automatic Step Progression Endpoint
  @Post('pre-admissions/:id/complete-step')
  async completeProcessStep(
    @Param('id') id: string,
    @Body() body: { completedStep: string; notes?: string; actionName?: string; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers, query, body);
    return this.admissionsService.completeProcessStep(id, body.completedStep, userScope, {
      notes: body.notes,
      actionName: body.actionName,
    });
  }

  @Post('test-candidates/complete')
  async completeApplicantTestStep(
    @Body() body: { applicationId?: string; assignmentId?: string; score?: number; outcome?: TestOutcome; notes?: string; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>
  ): Promise<{ updatedApplication: PreAdmissionApplicationDto; assignment?: TestScheduleAssignmentDto }> {
    const userScope = this.extractUserScope(headers, query, body);
    return this.admissionsService.completeApplicantTestStep(body, userScope);
  }

  // -------------------------------------------------------------
  // Test Scheduling Endpoints (Operational Test Management)
  // -------------------------------------------------------------
  @Get('tests')
  async getTestsList(
    @Query('search') search?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('campusId') campusId?: string,
    @Query('classId') classId?: string,
    @Query('mode') mode?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('contextNodeId') contextNodeId?: string,
    @Query('contextNodeType') contextNodeType?: any,
    @Headers() headers: Record<string, any> = {}
  ): Promise<{ items: AdmissionTestScheduleDto[]; total: number; summary: TestScheduleSummaryDto }> {
    const userScope = this.extractUserScope(headers, { contextNodeId, contextNodeType });
    return this.admissionsService.getTestSchedules(
      { search, academicYearId, campusId, classId, mode, status, date, contextNodeId, contextNodeType },
      userScope
    );
  }

  @Get('test-schedules')
  async getTestSchedules(
    @Query('search') search?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('campusId') campusId?: string,
    @Query('classId') classId?: string,
    @Query('mode') mode?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('contextNodeId') contextNodeId?: string,
    @Query('contextNodeType') contextNodeType?: any,
    @Headers() headers: Record<string, any> = {}
  ): Promise<{ items: AdmissionTestScheduleDto[]; total: number; summary: TestScheduleSummaryDto }> {
    const userScope = this.extractUserScope(headers, { contextNodeId, contextNodeType });
    return this.admissionsService.getTestSchedules(
      { search, academicYearId, campusId, classId, mode, status, date, contextNodeId, contextNodeType },
      userScope
    );
  }

  @Get('test-schedules/eligible-candidates')
  async getEligibleCandidates(
    @Query('processDefinitionId') processDefinitionId?: string,
    @Query('processStepId') processStepId?: string,
    @Query('classIds') classIdsStr?: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('contextNodeId') contextNodeId?: string,
    @Query('contextNodeType') contextNodeType?: any,
    @Headers() headers: Record<string, any> = {}
  ): Promise<any[]> {
    const userScope = this.extractUserScope(headers, { contextNodeId, contextNodeType });
    const classIds = classIdsStr ? classIdsStr.split(',') : undefined;
    return this.admissionsService.getEligibleCandidatesForTest(
      { processDefinitionId, processStepId, classIds, campusId, search, contextNodeId, contextNodeType },
      userScope
    );
  }

  @Get('test-schedules/:id')
  async getTestScheduleById(
    @Param('id') id: string,
    @Headers() headers: Record<string, any> = {}
  ): Promise<AdmissionTestScheduleDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getTestScheduleById(id, userScope);
  }

  @Get('test-schedules/:id/candidates')
  async getCandidatesForSchedule(
    @Param('id') scheduleId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('contextNodeId') contextNodeId?: string,
    @Query('contextNodeType') contextNodeType?: any,
    @Headers() headers: Record<string, any> = {}
  ): Promise<AdmissionTestCandidateDto[]> {
    const userScope = this.extractUserScope(headers, { contextNodeId, contextNodeType });
    return this.admissionsService.getCandidatesForSchedule(scheduleId, { search, status, contextNodeId, contextNodeType }, userScope);
  }

  @Post('test-schedules')
  async createAdmissionTestSchedule(
    @Body() dto: CreateAdmissionTestScheduleDto,
    @Headers() headers: Record<string, any> = {}
  ): Promise<AdmissionTestScheduleDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.createAdmissionTestSchedule(dto, userScope);
  }

  @Post('test-candidates/reschedule')
  async rescheduleCandidate(
    @Body() dto: RescheduleCandidateDto,
    @Headers() headers: Record<string, any> = {}
  ): Promise<AdmissionTestCandidateDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.rescheduleCandidate(dto, userScope);
  }

  @Delete('test-candidates/:id')
  async removeCandidateFromSchedule(
    @Param('id') candidateId: string,
    @Headers() headers: Record<string, any> = {}
  ): Promise<{ success: boolean }> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.removeCandidateFromSchedule(candidateId, userScope);
  }

  @Post('test-schedules/:id/assign')
  async assignApplicantsToTestSchedule(
    @Param('id') scheduleId: string,
    @Body() body: { applicationIds: string[] },
    @Headers() headers: Record<string, any>
  ): Promise<TestScheduleAssignmentDto[]> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.assignApplicantsToTestSchedule(scheduleId, body.applicationIds, userScope);
  }

  @Patch('test-assignments/:id/reschedule')
  async rescheduleApplicantTest(
    @Param('id') assignmentId: string,
    @Body() body: { newScheduleId: string; reason: string },
    @Headers() headers: Record<string, any>
  ): Promise<TestScheduleAssignmentDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.rescheduleApplicantTest(assignmentId, body.newScheduleId, body.reason, userScope);
  }

  @Post('test-assignments/:id/result')
  async recordTestResult(
    @Param('id') assignmentId: string,
    @Body() body: { score: number; totalMarks: number; outcome: TestOutcome; publishNow?: boolean },
    @Headers() headers: Record<string, any>
  ): Promise<TestScheduleAssignmentDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.recordTestResult(
      assignmentId,
      body.score,
      body.totalMarks,
      body.outcome,
      body.publishNow ?? true,
      userScope
    );
  }

  // -------------------------------------------------------------
  // Interview Scheduling Endpoints
  // -------------------------------------------------------------
  @Get('interview-schedules')
  async getInterviewSchedules(@Headers() headers: Record<string, any>): Promise<InterviewScheduleDto[]> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getInterviewSchedules(userScope);
  }

  @Post('interview-schedules/:id/assign')
  async assignApplicantToInterview(
    @Param('id') scheduleId: string,
    @Body() body: { applicationId: string; slotId?: string },
    @Headers() headers: Record<string, any>
  ): Promise<InterviewAssignmentDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.assignApplicantToInterview(scheduleId, body.applicationId, body.slotId, userScope);
  }

  @Post('interview-assignments/:id/outcome')
  async recordInterviewOutcome(
    @Param('id') assignmentId: string,
    @Body() body: { outcome: InterviewOutcome; notes?: string },
    @Headers() headers: Record<string, any>
  ): Promise<InterviewAssignmentDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.recordInterviewOutcome(assignmentId, body.outcome, body.notes, userScope);
  }

  // -------------------------------------------------------------
  // Decision & Fee Endpoints
  // -------------------------------------------------------------
  @Post('pre-admissions/:id/decision')
  async recordAdmissionDecision(
    @Param('id') applicationId: string,
    @Body() body: { outcome: AdmissionDecisionOutcome; remarks?: string },
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.recordAdmissionDecision(applicationId, body.outcome, body.remarks, userScope);
  }

  @Post('pre-admissions/:id/fee-payment')
  async recordFeePayment(
    @Param('id') applicationId: string,
    @Body() body: { feeType: 'APPLICATION_FEE' | 'ADMISSION_FEE'; amount: number; method?: string },
    @Headers() headers: Record<string, any>
  ): Promise<AdmissionChargeDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.recordFeePayment(applicationId, body.feeType, body.amount, body.method || 'ONLINE_GATEWAY', userScope);
  }

  // ─────────────────────────────────────────────────────────────
  // Application Fee Rule Management Endpoints
  // ─────────────────────────────────────────────────────────────
  @Get('fee-rules')
  async getFeeRules(@Headers() headers: Record<string, any>): Promise<ApplicationFeeRuleDto[]> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getFeeRules(userScope);
  }

  @Post('fee-rules')
  async createFeeRule(
    @Body() body: CreateApplicationFeeRuleDto,
    @Headers() headers: Record<string, any>
  ): Promise<ApplicationFeeRuleDto> {
    const userScope = this.extractUserScope(headers, undefined, body);
    return this.admissionsService.createOrUpdateFeeRule(body, userScope);
  }

  @Post('fee-rules/resolve')
  async resolveFeeRule(
    @Body() body: ResolveApplicationFeeDto,
    @Headers() headers: Record<string, any>
  ) {
    const userScope = this.extractUserScope(headers, undefined, body);
    return this.admissionsService.resolveFeeRule(body, userScope);
  }

  // ─────────────────────────────────────────────────────────────
  // Master Verification Endpoints (System Check & Human Verify)
  // ─────────────────────────────────────────────────────────────
  @Post('verification/system-check')
  async runSystemCheck(
    @Body() body: { applicationIds?: string[]; filterTab?: 'ALL' | 'DATA' | 'DOCS' | 'FEE'; contextNodeId?: string; contextNodeType?: any },
    @Headers() headers: Record<string, any>
  ): Promise<SystemCheckResponseDto> {
    const userScope = this.extractUserScope(headers, undefined, body);
    return this.admissionsService.runSystemCheck(body, userScope);
  }

  @Post('verification/bulk-fee-verify')
  async bulkFeeVerify(
    @Body() body: any,
    @Headers() headers: Record<string, any>
  ): Promise<any> {
    const userScope = this.extractUserScope(headers, undefined, body);
    return this.admissionsService.bulkVerifyFeePayments(body, userScope);
  }

  @Post('verification/bulk-human-verify')
  async bulkHumanVerify(
    @Body() body: BulkHumanVerifyDto,
    @Headers() headers: Record<string, any>
  ): Promise<BulkHumanVerifyResponseDto> {
    const userScope = this.extractUserScope(headers, undefined, body);
    return this.admissionsService.bulkHumanVerify(body, userScope);
  }

  @Post('verification/human-verify')
  async singleHumanVerify(
    @Body() body: { applicationId: string; verifiedBy: string; overrideReason?: string },
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionApplicationDto> {
    const userScope = this.extractUserScope(headers, undefined, body);
    return this.admissionsService.singleHumanVerify(body.applicationId, body.verifiedBy, body.overrideReason, userScope);
  }
}
