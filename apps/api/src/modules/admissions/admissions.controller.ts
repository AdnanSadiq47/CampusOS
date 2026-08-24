import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  TestScheduleDto,
  TestScheduleAssignmentDto,
  TestOutcome,
  InterviewScheduleDto,
  InterviewAssignmentDto,
  InterviewOutcome,
  AdmissionDecisionOutcome,
  AdmissionChargeDto,
} from '@campus-os/types';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  private extractUserScope(headers: Record<string, any>): UserScopeContext {
    const orgId = headers['x-tenant-id'] || '11111111-1111-1111-1111-111111111111';
    const role = headers['x-user-role'] || 'ADMIN';
    const campusHeader = headers['x-authorized-campuses'];
    const schoolHeader = headers['x-authorized-schools'];
    const regionHeader = headers['x-authorized-regions'];

    return {
      organizationId: orgId,
      userRole: role,
      isSuperAdmin: role === 'SUPER_ADMIN' || !campusHeader,
      authorizedCampusIds: campusHeader ? String(campusHeader).split(',').map((s) => s.trim()) : undefined,
      authorizedSchoolIds: schoolHeader ? String(schoolHeader).split(',').map((s) => s.trim()) : undefined,
      authorizedRegionIds: regionHeader ? String(regionHeader).split(',').map((s) => s.trim()) : undefined,
    };
  }

  // Pre-Admissions List
  @Get('pre-admissions')
  async getPreAdmissions(
    @Query() query: PreAdmissionsFilterDto,
    @Headers() headers: Record<string, any>
  ): Promise<PaginatedPreAdmissionsDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getPreAdmissions(query, userScope);
  }

  @Get('applications')
  async getApplicationsLegacy(
    @Query() query: PreAdmissionsFilterDto,
    @Headers() headers: Record<string, any>
  ): Promise<PaginatedPreAdmissionsDto> {
    const userScope = this.extractUserScope(headers);
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
    @Body() body: PreAdmissionsListViewConfigDto,
    @Headers() headers: Record<string, any>
  ): Promise<PreAdmissionsListViewConfigDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.saveListViewConfig(body, userScope);
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

  // -------------------------------------------------------------
  // Test Scheduling Endpoints
  // -------------------------------------------------------------
  @Get('test-schedules')
  async getTestSchedules(@Headers() headers: Record<string, any>): Promise<TestScheduleDto[]> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.getTestSchedules(userScope);
  }

  @Post('test-schedules')
  async createTestSchedule(
    @Body() dto: Partial<TestScheduleDto>,
    @Headers() headers: Record<string, any>
  ): Promise<TestScheduleDto> {
    const userScope = this.extractUserScope(headers);
    return this.admissionsService.createTestSchedule(dto, userScope);
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
}
