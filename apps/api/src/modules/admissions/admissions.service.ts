import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  PreAdmissionApplicationDto,
  PreAdmissionsFilterDto,
  PaginatedPreAdmissionsDto,
  PreAdmissionStatus,
  PreAdmissionSource,
  CreatePreAdmissionDto,
  AdmissionJourneyDto,
  AdmissionJourneyStepProgress,
  AdmissionStepType,
  PreAdmissionsListViewConfigDto,
  ListColumnDefinitionDto,
  TestScheduleDto,
  TestScheduleAssignmentDto,
  TestOutcome,
  InterviewScheduleDto,
  InterviewAssignmentDto,
  InterviewOutcome,
  AdmissionChargeDto,
  AdmissionDecisionOutcome,
  AdmissionProcessDomainEvent,
  AdmissionProcessStepConfig,
} from '@campus-os/types';

export interface UserScopeContext {
  organizationId: string;
  userRole?: string;
  authorizedHeadOfficeIds?: string[];
  authorizedRegionIds?: string[];
  authorizedSchoolIds?: string[];
  authorizedCampusIds?: string[]; // Branch IDs
  isSuperAdmin?: boolean;
}

// Active Published Process Registry for Resolution
interface ActiveProcessRegistryItem {
  id: string;
  name: string;
  code: string;
  versionId: string;
  versionNumber: number;
  applyTo: 'ALL_CAMPUSES' | 'SELECTED_CAMPUSES';
  branchIds: string[];
  schoolId?: string;
  steps: AdmissionProcessStepConfig[];
}

const ACTIVE_PROCESS_CATALOG: ActiveProcessRegistryItem[] = [
  // 1. General K-12 Process (Universal - All Campuses)
  {
    id: 'proc_general_k12',
    name: 'General Admission Process',
    code: 'AP-GEN-2026',
    versionId: 'ver_proc_gen_v1',
    versionNumber: 1,
    applyTo: 'ALL_CAMPUSES',
    branchIds: [],
    steps: [
      { id: 's1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission Application', category: 'APPLICATION', isRequired: true, sortOrder: 1, attachedFormName: 'Online Pre-Registration 2026–2027' },
      { id: 's2', stepType: 'APPLICATION_REVIEW', displayName: 'Application Review', category: 'APPLICATION', isRequired: true, sortOrder: 2 },
      { id: 's3', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission Form', category: 'CONFIRMATION', isRequired: true, sortOrder: 3, attachedFormName: 'Formal Admission Package 2026–27' },
      { id: 's4', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 4, isSystemTerminal: true },
    ],
  },
  // 2. Simple Direct Admission (Clifton & PECHS)
  {
    id: 'proc_simple_adm',
    name: 'Simple Direct Admission',
    code: 'AP-SMP-2026',
    versionId: 'ver_proc_smp_v1',
    versionNumber: 1,
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd'],
    steps: [
      { id: 's_smp_1', stepType: 'PRE_ADMISSION', displayName: 'Online Pre-Admission', category: 'APPLICATION', isRequired: true, sortOrder: 1, attachedFormName: 'Online Pre-Registration 2026–2027' },
      { id: 's_smp_2', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission Form', category: 'CONFIRMATION', isRequired: true, sortOrder: 2, attachedFormName: 'Formal Admission Package 2026–27' },
      { id: 's_smp_3', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 3, isSystemTerminal: true },
    ],
  },
  // 3. A-Level Comprehensive Admission (Main Campus Gulshan & DHA Phase 6)
  {
    id: 'proc_alevel_detailed',
    name: 'A-Level Comprehensive Track',
    code: 'AP-ALV-2026',
    versionId: 'ver_proc_alv_v1',
    versionNumber: 1,
    applyTo: 'SELECTED_CAMPUSES',
    branchIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc'],
    steps: [
      { id: 'ad1', stepType: 'PRE_ADMISSION', displayName: 'Pre-Admission Application', category: 'APPLICATION', isRequired: true, sortOrder: 1, attachedFormName: 'Online Pre-Registration 2026–2027' },
      { id: 'ad2', stepType: 'APPLICATION_FEE', displayName: 'Application Fee', category: 'PAYMENT', isRequired: true, sortOrder: 2, feeConfig: { feeRequired: true, feeName: 'Registration Fee', amount: 2500, currency: 'PKR', paymentRequiredBeforeNextStep: true, allowWaiver: true, allowDiscount: false, receiptRequired: true } },
      { id: 'ad3', stepType: 'DOCUMENT_VERIFICATION', displayName: 'Document Verification', category: 'APPLICATION', isRequired: true, sortOrder: 3 },
      { id: 'ad4', stepType: 'ASSESSMENT_TEST', displayName: 'Entrance Test', category: 'ASSESSMENT', isRequired: true, sortOrder: 4, testConfig: { testRequired: true, assessmentName: 'A-Level Diagnostic', mode: 'PAPER_BASED', resultPublishingRule: 'AFTER_STAFF_APPROVAL', passMarks: 60, totalMarks: 100 } },
      { id: 'ad5', stepType: 'INTERVIEW', displayName: 'Panel Interview', category: 'ASSESSMENT', isRequired: false, sortOrder: 5, interviewConfig: { interviewRequired: true, mode: 'PHYSICAL', durationMinutes: 20 } },
      { id: 'ad6', stepType: 'ADMISSION_DECISION', displayName: 'Admission Committee Decision', category: 'DECISION', isRequired: true, sortOrder: 6, decisionConfig: { allowedOutcomes: ['APPROVED', 'APPROVED_WITH_CONDITION', 'WAITING_LIST', 'REJECTED'], requireHumanConfirmation: true } },
      { id: 'ad7', stepType: 'PARENT_CONFIRMATION', displayName: 'Parent Offer Confirmation', category: 'CONFIRMATION', isRequired: true, sortOrder: 7, confirmationConfig: { allowedResponses: ['ACCEPT', 'DECLINE', 'NEED_MORE_TIME'], expiryDays: 7 } },
      { id: 'ad8', stepType: 'ADMISSION_FEE', displayName: 'Admission & Tuition Fee', category: 'CONFIRMATION', isRequired: true, sortOrder: 8, feeConfig: { feeRequired: true, feeName: 'Admission Deposit', amount: 45000, currency: 'PKR', paymentRequiredBeforeNextStep: true, allowWaiver: false, allowDiscount: true, receiptRequired: true } },
      { id: 'ad9', stepType: 'FINAL_ADMISSION_FORM', displayName: 'Final Admission Package', category: 'CONFIRMATION', isRequired: true, sortOrder: 9, attachedFormName: 'Formal Admission Package 2026–27' },
      { id: 'ad10', stepType: 'STUDENT_REGISTRATION', displayName: 'Student Registration', category: 'SYSTEM', isRequired: true, sortOrder: 10, isSystemTerminal: true },
    ],
  },
];

const DEFAULT_LIST_COLUMNS: ListColumnDefinitionDto[] = [
  { id: 'col_app_no', key: 'applicationNumber', label: 'Application No.', category: 'SYSTEM', isVisible: true, isPinned: true, sortOrder: 1, width: '140px', dataType: 'string' },
  { id: 'col_form', key: 'formName', label: 'Form', category: 'SYSTEM', isVisible: true, sortOrder: 2, dataType: 'string' },
  { id: 'col_student', key: 'studentName', label: 'Student', category: 'CANONICAL', isVisible: true, sortOrder: 3, dataType: 'string' },
  { id: 'col_class', key: 'className', label: 'Applying For', category: 'SYSTEM', isVisible: true, sortOrder: 4, dataType: 'string' },
  { id: 'col_campus', key: 'campusName', label: 'School / Campus', category: 'SYSTEM', isVisible: true, sortOrder: 5, dataType: 'string' },
  { id: 'col_source', key: 'source', label: 'Source', category: 'SYSTEM', isVisible: true, sortOrder: 6, dataType: 'badge' },
  { id: 'col_curr_step', key: 'currentStepName', label: 'Current Step', category: 'SYSTEM', isVisible: true, sortOrder: 7, dataType: 'badge' },
  { id: 'col_status', key: 'status', label: 'Status', category: 'SYSTEM', isVisible: true, sortOrder: 8, dataType: 'badge' },
  { id: 'col_submitted', key: 'submittedAt', label: 'Submitted On', category: 'SYSTEM', isVisible: true, sortOrder: 9, dataType: 'date' },
  // Available non-default columns
  { id: 'col_dob', key: 'dateOfBirth', label: 'Date of Birth', category: 'CANONICAL', isVisible: false, sortOrder: 10, dataType: 'date' },
  { id: 'col_gender', key: 'gender', label: 'Gender', category: 'CANONICAL', isVisible: false, sortOrder: 11, dataType: 'string' },
  { id: 'col_father', key: 'fatherOrGuardianName', label: 'Father Name', category: 'CANONICAL', isVisible: false, sortOrder: 12, dataType: 'string' },
  { id: 'col_mobile', key: 'primaryMobile', label: 'Mobile Number', category: 'CANONICAL', isVisible: false, sortOrder: 13, dataType: 'string' },
  { id: 'col_email', key: 'primaryEmail', label: 'Email', category: 'CANONICAL', isVisible: false, sortOrder: 14, dataType: 'string' },
  { id: 'col_prev_school', key: 'previousSchool', label: 'Previous School', category: 'CANONICAL', isVisible: false, sortOrder: 15, dataType: 'string' },
  { id: 'col_custom_sibling', key: 'siblingDiscountEligible', label: 'Sibling Discount Eligible', category: 'CUSTOM', isVisible: false, sortOrder: 16, dataType: 'boolean' },
  { id: 'col_test_status', key: 'testStatus', label: 'Test Status', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 17, dataType: 'badge' },
  { id: 'col_test_date', key: 'testDate', label: 'Test Date', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 18, dataType: 'date' },
  { id: 'col_interview_status', key: 'interviewStatus', label: 'Interview Status', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 19, dataType: 'badge' },
  { id: 'col_decision', key: 'decisionOutcome', label: 'Decision', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 20, dataType: 'badge' },
  { id: 'col_fee_status', key: 'feeStatus', label: 'Payment Status', category: 'DYNAMIC_STATUS', isVisible: false, sortOrder: 21, dataType: 'badge' },
];

@Injectable()
export class AdmissionsService {
  private applications: PreAdmissionApplicationDto[] = [];
  private appSeq = 130;
  private listViewConfigs: Map<string, PreAdmissionsListViewConfigDto> = new Map();
  private testSchedules: TestScheduleDto[] = [];
  private testAssignments: TestScheduleAssignmentDto[] = [];
  private interviewSchedules: InterviewScheduleDto[] = [];
  private interviewAssignments: InterviewAssignmentDto[] = [];
  private charges: AdmissionChargeDto[] = [];
  private emittedEvents: { event: AdmissionProcessDomainEvent; payload: Record<string, any>; timestamp: Date }[] = [];

  constructor() {
    this.seedDefaultApplications();
    this.seedDefaultSchedules();
  }

  private seedDefaultSchedules() {
    const orgId = '11111111-1111-1111-1111-111111111111';
    const now = new Date();

    // Seed a Test Schedule for Clifton Campus
    this.testSchedules.push({
      id: 'ts_clifton_g6',
      organizationId: orgId,
      assessmentName: 'Grade 6 Entry Diagnostic',
      date: '2026-09-05',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90,
      campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      campusName: 'Clifton Campus',
      venueRoom: 'Main Hall / Room 204',
      mode: 'PAPER_BASED',
      capacity: 40,
      instructions: 'Please arrive 15 minutes prior with candidate admit slip.',
      assignedApplicantCount: 2,
      createdAt: now,
    });

    // Seed an Interview Schedule
    this.interviewSchedules.push({
      id: 'is_clifton_panel',
      organizationId: orgId,
      date: '2026-09-08',
      startTime: '09:00',
      endTime: '12:00',
      campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      campusName: 'Clifton Campus',
      venueRoom: 'Executive Conference Room',
      mode: 'PHYSICAL',
      interviewerRole: 'Principal / Vice Principal',
      interviewerName: 'Dr. Tariq Mehmood',
      totalSlots: 6,
      bookedSlots: 1,
      slots: [
        { id: 'slot_1', startTime: '09:00', endTime: '09:20', isBooked: true, applicationId: 'app_121', studentName: 'Ahmed Ali' },
        { id: 'slot_2', startTime: '09:20', endTime: '09:40', isBooked: false },
        { id: 'slot_3', startTime: '09:40', endTime: '10:00', isBooked: false },
        { id: 'slot_4', startTime: '10:00', endTime: '10:20', isBooked: false },
        { id: 'slot_5', startTime: '10:20', endTime: '10:40', isBooked: false },
        { id: 'slot_6', startTime: '10:40', endTime: '11:00', isBooked: false },
      ],
      createdAt: now,
    });
  }

  private seedDefaultApplications() {
    const orgId = '11111111-1111-1111-1111-111111111111';

    const schools = [
      {
        id: 'sch-1',
        name: 'Beacon Horizon Public School',
        regionId: 'reg_south',
        regionName: 'Southern Region',
        campuses: [
          { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Main Campus (Gulshan)' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Clifton Campus' },
          { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'DHA Phase 6 Campus' },
        ],
      },
      {
        id: 'sch-2',
        name: 'City Grammar School',
        regionId: 'reg_south',
        regionName: 'Southern Region',
        campuses: [
          { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'PECHS Senior Campus' },
          { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Clifton Junior Campus' },
        ],
      },
      {
        id: 'sch-3',
        name: 'Horizon Heights International',
        regionId: 'reg_north',
        regionName: 'Northern Region',
        campuses: [
          { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', name: 'Islamabad Capital Campus' },
        ],
      },
    ];

    const academicYears = [
      { id: 'ay_2026_2027', name: 'Academic Year 2026–2027' },
      { id: 'ay_2025_2026', name: 'Academic Year 2025–2026' },
    ];

    const classes = [
      { id: 'cls-ey1', name: 'Playgroup (EY-1)', levelName: 'Early Years' },
      { id: 'cls-kg', name: 'Kindergarten (KG)', levelName: 'Early Years' },
      { id: 'cls-g1', name: 'Grade 1', levelName: 'Primary School' },
      { id: 'cls-g3', name: 'Grade 3', levelName: 'Primary School' },
      { id: 'cls-g5', name: 'Grade 5', levelName: 'Middle School' },
      { id: 'cls-g7', name: 'Grade 7', levelName: 'Middle School' },
      { id: 'cls-g9', name: 'Grade 9 (O-Levels)', levelName: 'Secondary School' },
      { id: 'cls-a1', name: 'A-Levels Year 1', levelName: 'Higher Secondary' },
    ];

    const studentProfiles: {
      name: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      dob: string;
      father: string;
      mobile: string;
      email: string;
      status: PreAdmissionStatus;
      source: PreAdmissionSource;
    }[] = [
      { name: 'Ahmed Ali', gender: 'MALE', dob: '2018-03-12', father: 'Muhammad Ali', mobile: '0300-1234567', email: 'm.ali@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Fatima Zahra', gender: 'FEMALE', dob: '2019-07-24', father: 'Tariq Mehmood', mobile: '0321-9876543', email: 'tariq.m@example.com', status: 'SUBMITTED', source: 'STAFF_ENTRY' },
      { name: 'Zainab Qureshi', gender: 'FEMALE', dob: '2016-11-05', father: 'Farhan Qureshi', mobile: '0333-5551234', email: 'f.qureshi@example.com', status: 'IN_PROGRESS', source: 'WALK_IN' },
      { name: 'Bilal Khan', gender: 'MALE', dob: '2015-05-18', father: 'Imran Khan', mobile: '0345-4447890', email: 'imran.k@example.com', status: 'ON_HOLD', source: 'ONLINE' },
      { name: 'Areeba Hassan', gender: 'FEMALE', dob: '2014-09-30', father: 'Hassan Raza', mobile: '0301-2223344', email: 'hassan.r@example.com', status: 'COMPLETED', source: 'ONLINE' },
      { name: 'Mustafa Siddiqui', gender: 'MALE', dob: '2020-01-15', father: 'Adnan Siddiqui', mobile: '0312-8889900', email: 'adnan.s@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Hamza Tariq', gender: 'MALE', dob: '2017-08-14', father: 'Tariq Aziz', mobile: '0302-3334455', email: 'tariq.aziz@example.com', status: 'APPROVED', source: 'STAFF_ENTRY' },
      { name: 'Maryam Nawaz', gender: 'FEMALE', dob: '2018-12-01', father: 'Nawaz Sharif', mobile: '0323-4445566', email: 'nawaz.s@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Usman Farooq', gender: 'MALE', dob: '2016-04-20', father: 'Farooq Ahmed', mobile: '0344-5556677', email: 'farooq.a@example.com', status: 'APPROVED', source: 'WALK_IN' },
      { name: 'Ayesha Siddiqua', gender: 'FEMALE', dob: '2019-02-28', father: 'Siddiq Jan', mobile: '0305-6667788', email: 'siddiq.j@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Saad Rafique', gender: 'MALE', dob: '2015-10-10', father: 'Rafique Khan', mobile: '0334-7778899', email: 'rafique.k@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Mahnoor Baloch', gender: 'FEMALE', dob: '2017-06-05', father: 'Mir Baloch', mobile: '0313-8889900', email: 'mir.b@example.com', status: 'COMPLETED', source: 'STAFF_ENTRY' },
      { name: 'Ibrahim Memon', gender: 'MALE', dob: '2020-09-18', father: 'Iqbal Memon', mobile: '0324-9990011', email: 'iqbal.m@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Hania Amir', gender: 'FEMALE', dob: '2018-05-14', father: 'Amir Liaquat', mobile: '0346-0001122', email: 'amir.l@example.com', status: 'ON_HOLD', source: 'ONLINE' },
      { name: 'Daniyal Zafar', gender: 'MALE', dob: '2014-11-22', father: 'Zafar Iqbal', mobile: '0306-1112233', email: 'zafar.i@example.com', status: 'APPROVED', source: 'WALK_IN' },
      { name: 'Eshal Fatima', gender: 'FEMALE', dob: '2019-03-09', father: 'Kashif Ali', mobile: '0335-2223344', email: 'kashif.a@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Zohaib Hassan', gender: 'MALE', dob: '2016-07-19', father: 'Hassan Nisar', mobile: '0314-3334455', email: 'hassan.n@example.com', status: 'SUBMITTED', source: 'STAFF_ENTRY' },
      { name: 'Manahil Khan', gender: 'FEMALE', dob: '2017-01-30', father: 'Asim Khan', mobile: '0325-4445566', email: 'asim.k@example.com', status: 'APPROVED', source: 'ONLINE' },
      { name: 'Rayyan Shah', gender: 'MALE', dob: '2018-10-12', father: 'Syed Shah', mobile: '0347-5556677', email: 'syed.shah@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Anaya Rehman', gender: 'FEMALE', dob: '2020-04-05', father: 'Rehman Malik', mobile: '0307-6667788', email: 'rehman.m@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Shahmeer Ali', gender: 'MALE', dob: '2015-08-16', father: 'Zahid Hussain', mobile: '0336-7778899', email: 'zahid.h@example.com', status: 'APPROVED', source: 'WALK_IN' },
      { name: 'Rameen Tariq', gender: 'FEMALE', dob: '2019-12-25', father: 'Tariq Jamil', mobile: '0315-8889900', email: 'tariq.j@example.com', status: 'IN_PROGRESS', source: 'ONLINE' },
      { name: 'Zaviyar Abbasi', gender: 'MALE', dob: '2017-03-14', father: 'Hamza Abbasi', mobile: '0326-9990011', email: 'hamza.a@example.com', status: 'SUBMITTED', source: 'STAFF_ENTRY' },
      { name: 'Mirha Bilal', gender: 'FEMALE', dob: '2018-09-08', father: 'Bilal Saeed', mobile: '0348-0001122', email: 'bilal.s@example.com', status: 'COMPLETED', source: 'ONLINE' },
      { name: 'Farhan Zaidi', gender: 'MALE', dob: '2016-02-17', father: 'Ali Zaidi', mobile: '0308-1112233', email: 'ali.z@example.com', status: 'APPROVED', source: 'ONLINE' },
      { name: 'Kinza Hashmi', gender: 'FEMALE', dob: '2014-06-29', father: 'Sohail Hashmi', mobile: '0337-2223344', email: 'sohail.h@example.com', status: 'ON_HOLD', source: 'WALK_IN' },
      { name: 'Aariz Sheikh', gender: 'MALE', dob: '2020-11-11', father: 'Salman Sheikh', mobile: '0316-3334455', email: 'salman.s@example.com', status: 'SUBMITTED', source: 'ONLINE' },
      { name: 'Alizeh Shah', gender: 'FEMALE', dob: '2017-07-07', father: 'Khurram Shah', mobile: '0327-4445566', email: 'khurram.s@example.com', status: 'IN_PROGRESS', source: 'STAFF_ENTRY' },
      { name: 'Rohaan Dar', gender: 'MALE', dob: '2018-04-18', father: 'Ishaq Dar', mobile: '0349-5556677', email: 'ishaq.d@example.com', status: 'APPROVED', source: 'ONLINE' },
      { name: 'Hoorain Fatima', gender: 'FEMALE', dob: '2019-10-02', father: 'Waseem Akram', mobile: '0309-6667788', email: 'waseem.a@example.com', status: 'SUBMITTED', source: 'ONLINE' },
    ];

    const allCampuses = schools.flatMap((s) => s.campuses.map((c) => ({ ...c, school: s })));

    this.applications = studentProfiles.map((p, idx) => {
      const appNum = 121 + idx;
      const appNo = `APP-2026-${String(appNum).padStart(5, '0')}`;
      const legacyId = `app_${appNum}`;

      const campusObj = allCampuses[idx % allCampuses.length]!;
      const school = campusObj.school;
      const campus = campusObj;
      const academicYear = academicYears[idx % academicYears.length]!;
      const cls = classes[idx % classes.length]!;

      const appliedDate = new Date();
      appliedDate.setDate(appliedDate.getDate() - (idx % 25));

      const processMatch = this.resolveProcessForCampus(campus.id, school.id);

      let journey: AdmissionJourneyDto | null = null;
      let currentStepId: string | null = null;
      let currentStepName: string | null = null;
      let currentStepType: AdmissionStepType | null = null;
      let journeyStatus: 'NO_PROCESS' | 'IN_PROGRESS' | 'COMPLETED' | 'HELD' | 'CANCELLED' = 'NO_PROCESS';

      if (processMatch) {
        journeyStatus = p.status === 'COMPLETED' ? 'COMPLETED' : p.status === 'ON_HOLD' ? 'HELD' : 'IN_PROGRESS';
        
        const stepsProgress: AdmissionJourneyStepProgress[] = processMatch.steps.map((st, sIdx) => {
          let state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' = 'UPCOMING';
          if (sIdx === 0) {
            state = 'COMPLETED';
          } else if (sIdx === 1 && p.status !== 'COMPLETED') {
            state = 'CURRENT';
            currentStepId = st.id;
            currentStepName = st.displayName;
            currentStepType = st.stepType;
          } else if (p.status === 'COMPLETED') {
            state = 'COMPLETED';
          }
          return {
            stepId: st.id,
            stepType: st.stepType,
            displayName: st.displayName,
            sortOrder: st.sortOrder,
            isRequired: st.isRequired,
            state,
            attachedFormName: st.attachedFormName,
            completedAt: sIdx === 0 ? appliedDate : p.status === 'COMPLETED' ? appliedDate : undefined,
          };
        });

        journey = {
          applicationId: appNo,
          processDefinitionId: processMatch.id,
          processVersionId: processMatch.versionId,
          processName: processMatch.name,
          processVersionNumber: processMatch.versionNumber,
          steps: stepsProgress,
          currentStepId,
          status: journeyStatus,
          startedAt: appliedDate,
          updatedAt: appliedDate,
        };
      }

      return {
        id: legacyId,
        organizationId: orgId,
        applicationNumber: appNo,
        studentName: p.name,
        gender: p.gender,
        dateOfBirth: p.dob,
        fatherOrGuardianName: p.father,
        primaryMobile: p.mobile,
        primaryEmail: p.email,
        schoolId: school.id,
        schoolName: school.name,
        campusId: campus.id,
        campusName: campus.name,
        regionId: school.regionId,
        regionName: school.regionName,
        headOfficeId: 'ho_main',
        headOfficeName: 'Alpha Central Directorate',
        academicYearId: academicYear.id,
        academicYearName: academicYear.name,
        academicLevelId: 'lvl_1',
        academicLevelName: cls.levelName,
        classId: cls.id,
        className: cls.name,
        boardId: 'board_cambridge',
        boardName: 'BISE Karachi / Cambridge',
        formDefinitionId: 'form_admission_k12',
        formName: 'Online Pre-Registration 2026–2027',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        source: p.source,
        status: p.status,
        submittedAt: appliedDate,
        submittedByUserId: p.source === 'ONLINE' ? undefined : 'usr_staff_1',
        submittedByRole: p.source === 'ONLINE' ? undefined : 'Admissions Officer',
        submissionData: {
          previousSchool: 'Kindergarten Academy',
          emergencyContact: p.mobile,
        },
        customFieldsData: {
          siblingDiscountEligible: idx % 3 === 0,
        },
        processDefinitionId: processMatch?.id || null,
        processName: processMatch?.name || null,
        processVersionId: processMatch?.versionId || null,
        processVersionNumber: processMatch?.versionNumber || null,
        currentStepId,
        currentStepName,
        currentStepType,
        journeyStatus,
        journey,
        testDate: idx % 2 === 0 ? '2026-09-05' : undefined,
        testStatus: idx % 2 === 0 ? 'SCHEDULED' : undefined,
        testResult: idx === 0 ? 'PASSED (85%)' : undefined,
        interviewDate: idx === 0 ? '2026-09-08' : undefined,
        interviewStatus: idx === 0 ? 'SCHEDULED' : undefined,
        decisionOutcome: p.status === 'APPROVED' ? 'APPROVED' : undefined,
        feeStatus: p.status === 'COMPLETED' ? 'PAID' : 'UNPAID',
        auditEvents: [
          {
            id: `aud_1_${legacyId}`,
            eventType: 'PRE_ADMISSION_SUBMITTED',
            description: `Pre-Admission submitted via ${p.source}`,
            actor: p.source === 'ONLINE' ? 'Applicant (Public Online)' : 'Staff Entry',
            timestamp: appliedDate,
          },
        ],
        createdAt: appliedDate,
        updatedAt: appliedDate,
      };
    });
  }

  /**
   * Process Definition Invariant Validation
   */
  public validateProcessDefinition(steps: AdmissionProcessStepConfig[]) {
    if (!steps || steps.length === 0) {
      throw new BadRequestException('An Admission Process must contain at least one step.');
    }

    // 1. Student Registration must be unique and the final step if present
    const studentRegSteps = steps.filter((s) => s.stepType === 'STUDENT_REGISTRATION');
    if (studentRegSteps.length > 1) {
      throw new BadRequestException('Student Registration can only appear once in an admission process.');
    }
    if (studentRegSteps.length === 1) {
      const lastStep = steps[steps.length - 1]!;
      if (lastStep.stepType !== 'STUDENT_REGISTRATION') {
        throw new BadRequestException('Student Registration must be the final terminal step of the admission process.');
      }
    }

    // 2. Pre-Admission must have PRE_ADMISSION form purpose when attached
    const preAdmSteps = steps.filter((s) => s.stepType === 'PRE_ADMISSION');
    if (preAdmSteps.length > 1) {
      throw new BadRequestException('Pre-Admission step can only appear once at the beginning of the journey.');
    }

    // 3. Application Fee & Admission Fee Validation
    for (const step of steps) {
      if (step.stepType === 'APPLICATION_FEE' || step.stepType === 'ADMISSION_FEE') {
        if (step.feeConfig?.feeRequired && (step.feeConfig.amount === undefined || step.feeConfig.amount < 0)) {
          throw new BadRequestException(`Fee step "${step.displayName}" requires a valid non-negative amount.`);
        }
      }
      if (step.stepType === 'ASSESSMENT_TEST' && step.testConfig?.testRequired) {
        if (!step.testConfig.mode) {
          throw new BadRequestException(`Test step "${step.displayName}" requires an assessment mode.`);
        }
      }
      if (step.stepType === 'INTERVIEW' && step.interviewConfig?.interviewRequired) {
        if (!step.interviewConfig.mode) {
          throw new BadRequestException(`Interview step "${step.displayName}" requires an interview mode.`);
        }
      }
    }

    return true;
  }

  /**
   * Resolve best-matching active admission process for a given campus/school
   */
  public resolveProcessForCampus(campusId: string, schoolId?: string): ActiveProcessRegistryItem | undefined {
    // 1. Priority: Specific Campus Match
    const specificCampusMatch = ACTIVE_PROCESS_CATALOG.find(
      (p) => p.applyTo === 'SELECTED_CAMPUSES' && p.branchIds.includes(campusId)
    );
    if (specificCampusMatch) return specificCampusMatch;

    // 2. Priority: School-Level Match
    if (schoolId) {
      const schoolMatch = ACTIVE_PROCESS_CATALOG.find(
        (p) => p.applyTo === 'SELECTED_CAMPUSES' && p.schoolId === schoolId
      );
      if (schoolMatch) return schoolMatch;
    }

    // 3. Fallback: Universal Scope (ALL_CAMPUSES)
    const universalMatch = ACTIVE_PROCESS_CATALOG.find((p) => p.applyTo === 'ALL_CAMPUSES');
    return universalMatch;
  }

  /**
   * Filter and retrieve pre-admissions with data-scope isolation
   */
  public async getPreAdmissions(
    filter: PreAdmissionsFilterDto,
    userScope: UserScopeContext
  ): Promise<PaginatedPreAdmissionsDto & { summary: any }> {
    let scoped = this.applications.filter((app) => {
      if (userScope.isSuperAdmin) return true;

      if (userScope.authorizedCampusIds && userScope.authorizedCampusIds.length > 0) {
        return userScope.authorizedCampusIds.includes(app.campusId);
      }
      if (userScope.authorizedSchoolIds && userScope.authorizedSchoolIds.length > 0) {
        return userScope.authorizedSchoolIds.includes(app.schoolId);
      }
      if (userScope.authorizedRegionIds && userScope.authorizedRegionIds.length > 0) {
        return app.regionId ? userScope.authorizedRegionIds.includes(app.regionId) : false;
      }
      return true;
    });

    const pendingCount = scoped.filter((a) => a.status === 'SUBMITTED' || a.status === 'IN_PROGRESS').length;
    const approvedCount = scoped.filter((a) => a.status === 'APPROVED').length;
    const completedCount = scoped.filter((a) => a.status === 'COMPLETED').length;

    const summary = {
      totalPreAdmissions: scoped.length,
      totalApplications: scoped.length,
      newSubmitted: scoped.filter((a) => a.status === 'SUBMITTED').length,
      inProcess: scoped.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'ON_HOLD').length,
      pendingReview: pendingCount,
      approved: approvedCount,
      completed: completedCount,
      enrolled: completedCount,
    };

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      scoped = scoped.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(q) ||
          a.studentName.toLowerCase().includes(q) ||
          a.fatherOrGuardianName.toLowerCase().includes(q) ||
          a.primaryMobile.toLowerCase().includes(q) ||
          (a.primaryEmail && a.primaryEmail.toLowerCase().includes(q)) ||
          a.schoolName.toLowerCase().includes(q) ||
          a.campusName.toLowerCase().includes(q) ||
          a.className.toLowerCase().includes(q) ||
          a.formName.toLowerCase().includes(q)
      );
    }

    if (filter.status && filter.status !== 'ALL') {
      scoped = scoped.filter((a) => a.status === filter.status);
    }
    if (filter.source && filter.source !== 'ALL') {
      scoped = scoped.filter((a) => a.source === filter.source);
    }
    if (filter.academicYearId && filter.academicYearId !== 'ALL') {
      scoped = scoped.filter((a) => a.academicYearId === filter.academicYearId);
    }
    if (filter.classId && filter.classId !== 'ALL') {
      scoped = scoped.filter((a) => a.classId === filter.classId);
    }
    if (filter.campusId && filter.campusId !== 'ALL') {
      scoped = scoped.filter((a) => a.campusId === filter.campusId);
    }
    if (filter.schoolId && filter.schoolId !== 'ALL') {
      scoped = scoped.filter((a) => a.schoolId === filter.schoolId);
    }
    if (filter.regionId && filter.regionId !== 'ALL') {
      scoped = scoped.filter((a) => a.regionId === filter.regionId);
    }
    if (filter.processDefinitionId && filter.processDefinitionId !== 'ALL') {
      if (filter.processDefinitionId === 'NO_PROCESS') {
        scoped = scoped.filter((a) => !a.processDefinitionId);
      } else {
        scoped = scoped.filter((a) => a.processDefinitionId === filter.processDefinitionId);
      }
    }

    const sortBy = filter.sortBy || 'submittedAt';
    const sortOrder = filter.sortOrder || 'desc';

    scoped.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'submittedAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Number(filter.limit) || 25);
    const total = scoped.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const items = scoped.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      summary,
    };
  }

  /**
   * Retrieve single application detail with full submission snapshot and journey progress
   */
  public async getPreAdmissionById(
    id: string,
    userScope: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const app = this.applications.find(
      (a) => a.id === id || a.applicationNumber === id || a.applicationNumber.replace('APP-', 'PA-') === id || a.id.replace('preadm_', '') === id
    );
    if (!app) {
      throw new NotFoundException(`Pre-Admission record "${id}" not found.`);
    }

    if (
      userScope.authorizedCampusIds &&
      userScope.authorizedCampusIds.length > 0 &&
      !userScope.authorizedCampusIds.includes(app.campusId)
    ) {
      throw new ForbiddenException('You do not have permission to view pre-admissions for this campus.');
    }

    return app;
  }

  /**
   * Dynamic List View Configuration Management
   */
  public async getListViewConfig(userScope: UserScopeContext): Promise<PreAdmissionsListViewConfigDto> {
    const key = `view_${userScope.organizationId}`;
    if (this.listViewConfigs.has(key)) {
      return this.listViewConfigs.get(key)!;
    }

    const defaultConfig: PreAdmissionsListViewConfigDto = {
      id: 'cfg_default',
      organizationId: userScope.organizationId,
      viewType: 'ORGANIZATION_DEFAULT',
      name: 'Default Operational View',
      columns: DEFAULT_LIST_COLUMNS,
      updatedAt: new Date(),
    };
    this.listViewConfigs.set(key, defaultConfig);
    return defaultConfig;
  }

  public async saveListViewConfig(
    config: PreAdmissionsListViewConfigDto,
    userScope: UserScopeContext
  ): Promise<PreAdmissionsListViewConfigDto> {
    const key = `view_${userScope.organizationId}`;
    const saved: PreAdmissionsListViewConfigDto = {
      ...config,
      organizationId: userScope.organizationId,
      updatedAt: new Date(),
    };
    this.listViewConfigs.set(key, saved);
    return saved;
  }

  /**
   * Unified Submission Engine: Creates business record from Staff Entry or Public Online submission
   */
  public async createPreAdmission(
    dto: CreatePreAdmissionDto,
    userScope?: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    if (!dto.campusId) {
      throw new BadRequestException('Campus is required for Pre-Admission.');
    }
    if (!dto.formDefinitionId) {
      throw new BadRequestException('Form Definition ID is required.');
    }

    const orgId = userScope?.organizationId || '11111111-1111-1111-1111-111111111111';
    this.appSeq++;
    const appNo = `PA-2026-${String(this.appSeq).padStart(5, '0')}`;
    const id = `preadm_${appNo.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const now = new Date();

    const raw = dto.formData || {};
    const studentFirstName = raw.studentFirstName || raw.STUDENT_FIRST_NAME || dto.studentName?.split(' ')[0] || 'Applicant';
    const studentLastName = raw.studentLastName || raw.STUDENT_LAST_NAME || dto.studentName?.split(' ').slice(1).join(' ') || 'Student';
    const studentName = dto.studentName || `${studentFirstName} ${studentLastName}`.trim();
    const gender = dto.gender || raw.gender || raw.GENDER || 'MALE';
    const dateOfBirth = dto.dateOfBirth || raw.dateOfBirth || raw.STD_DOB || '2018-01-01';
    const fatherOrGuardianName = dto.fatherOrGuardianName || raw.fatherName || raw.FATHER_NAME || raw.FAT_NAME || 'Parent / Guardian';
    const primaryMobile = dto.primaryMobile || raw.primaryMobile || raw.FATHER_MOBILE || raw.FAT_MOBILE || '0300-0000000';
    const primaryEmail = dto.primaryEmail || raw.primaryEmail || raw.EMAIL;

    const campusMap: Record<string, { name: string; schoolId: string; schoolName: string; regionId: string; regionName: string }> = {
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': { name: 'Main Campus (Gulshan)', schoolId: 'sch-1', schoolName: 'Beacon Horizon Public School', regionId: 'reg_south', regionName: 'Southern Region' },
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': { name: 'Clifton Campus', schoolId: 'sch-1', schoolName: 'Beacon Horizon Public School', regionId: 'reg_south', regionName: 'Southern Region' },
      'cccccccc-cccc-cccc-cccc-cccccccccccc': { name: 'DHA Phase 6 Campus', schoolId: 'sch-1', schoolName: 'Beacon Horizon Public School', regionId: 'reg_south', regionName: 'Southern Region' },
      'dddddddd-dddd-dddd-dddd-dddddddddddd': { name: 'PECHS Senior Campus', schoolId: 'sch-2', schoolName: 'City Grammar School', regionId: 'reg_south', regionName: 'Southern Region' },
      'ffffffff-ffff-ffff-ffff-ffffffffffff': { name: 'Islamabad Capital Campus', schoolId: 'sch-3', schoolName: 'Horizon Heights International', regionId: 'reg_north', regionName: 'Northern Region' },
    };

    const campusInfo = campusMap[dto.campusId] || {
      name: 'Selected Campus',
      schoolId: dto.schoolId || 'sch-universal',
      schoolName: 'Beacon Horizon Public School',
      regionId: 'reg_south',
      regionName: 'Southern Region',
    };

    const classMap: Record<string, string> = {
      'cls-ey1': 'Playgroup (EY-1)',
      'cls-kg': 'Kindergarten (KG)',
      'cls-g1': 'Grade 1',
      'cls-g3': 'Grade 3',
      'cls-g5': 'Grade 5',
      'cls-g7': 'Grade 7',
      'cls-g9': 'Grade 9 (O-Levels)',
      'cls-a1': 'A-Levels Year 1',
    };
    const className = classMap[dto.classId] || 'Grade 1';

    const processMatch = this.resolveProcessForCampus(dto.campusId, campusInfo.schoolId);

    let journey: AdmissionJourneyDto | null = null;
    let currentStepId: string | null = null;
    let currentStepName: string | null = null;
    let currentStepType: AdmissionStepType | null = null;
    let journeyStatus: 'NO_PROCESS' | 'IN_PROGRESS' | 'COMPLETED' | 'HELD' | 'CANCELLED' = 'NO_PROCESS';

    if (processMatch) {
      journeyStatus = 'IN_PROGRESS';
      
      const stepsProgress: AdmissionJourneyStepProgress[] = processMatch.steps.map((st, idx) => {
        let state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' = 'UPCOMING';
        if (idx === 0) {
          state = 'COMPLETED';
        } else if (idx === 1) {
          state = 'CURRENT';
          currentStepId = st.id;
          currentStepName = st.displayName;
          currentStepType = st.stepType;
        }
        return {
          stepId: st.id,
          stepType: st.stepType,
          displayName: st.displayName,
          sortOrder: st.sortOrder,
          isRequired: st.isRequired,
          state,
          attachedFormName: st.attachedFormName,
          completedAt: idx === 0 ? now : undefined,
        };
      });

      journey = {
        applicationId: appNo,
        processDefinitionId: processMatch.id,
        processVersionId: processMatch.versionId,
        processName: processMatch.name,
        processVersionNumber: processMatch.versionNumber,
        steps: stepsProgress,
        currentStepId,
        status: 'IN_PROGRESS',
        startedAt: now,
        updatedAt: now,
      };
    }

    const source: PreAdmissionSource = dto.source || (userScope ? 'STAFF_ENTRY' : 'ONLINE');

    const newRecord: PreAdmissionApplicationDto = {
      id,
      organizationId: orgId,
      applicationNumber: appNo,
      studentName,
      gender,
      dateOfBirth,
      fatherOrGuardianName,
      primaryMobile,
      primaryEmail,
      schoolId: campusInfo.schoolId,
      schoolName: campusInfo.schoolName,
      campusId: dto.campusId,
      campusName: campusInfo.name,
      regionId: campusInfo.regionId,
      regionName: campusInfo.regionName,
      headOfficeId: 'ho_main',
      headOfficeName: 'Alpha Central Directorate',
      academicYearId: dto.academicYearId || 'ay_2026_2027',
      academicYearName: 'Academic Year 2026–2027',
      classId: dto.classId || 'cls-g1',
      className,
      boardName: 'BISE Karachi / Cambridge',
      formDefinitionId: dto.formDefinitionId,
      formName: 'Online Pre-Registration 2026–2027',
      publishedFormVersionId: dto.publishedFormVersionId || 'v_prereg_1',
      formVersionNumber: 1,
      source,
      status: processMatch ? 'IN_PROGRESS' : 'SUBMITTED',
      submittedAt: now,
      submittedByUserId: userScope ? 'usr_staff_1' : undefined,
      submittedByRole: userScope ? 'Admissions Officer' : undefined,
      submissionData: raw,
      customFieldsData: {
        submittedViaOnlinePortal: source === 'ONLINE',
      },
      processDefinitionId: processMatch?.id || null,
      processName: processMatch?.name || null,
      processVersionId: processMatch?.versionId || null,
      processVersionNumber: processMatch?.versionNumber || null,
      currentStepId,
      currentStepName,
      currentStepType,
      journeyStatus,
      journey,
      auditEvents: [
        {
          id: `aud_1_${appNo}`,
          eventType: 'PRE_ADMISSION_SUBMITTED',
          description: `Pre-Admission application submitted via ${source}`,
          actor: source === 'ONLINE' ? 'Applicant (Public Online)' : 'Staff Entry',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.applications.unshift(newRecord);
    this.emitAdmissionEvent('PRE_ADMISSION_SUBMITTED', { applicationId: newRecord.id, applicationNumber: newRecord.applicationNumber });
    return newRecord;
  }

  /**
   * Manually assign an admission process to an unassigned pre-admission
   */
  public async assignProcess(
    applicationId: string,
    processDefinitionId: string,
    userScope: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const app = await this.getPreAdmissionById(applicationId, userScope);

    const proc = ACTIVE_PROCESS_CATALOG.find((p) => p.id === processDefinitionId);
    if (!proc) {
      throw new NotFoundException(`Admission Process "${processDefinitionId}" not found.`);
    }

    const now = new Date();
    let currentStepId: string | null = null;
    let currentStepName: string | null = null;
    let currentStepType: AdmissionStepType | null = null;

    const stepsProgress: AdmissionJourneyStepProgress[] = proc.steps.map((st, idx) => {
      let state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' = 'UPCOMING';
      if (idx === 0) {
        state = 'COMPLETED';
      } else if (idx === 1) {
        state = 'CURRENT';
        currentStepId = st.id;
        currentStepName = st.displayName;
        currentStepType = st.stepType;
      }
      return {
        stepId: st.id,
        stepType: st.stepType,
        displayName: st.displayName,
        sortOrder: st.sortOrder,
        isRequired: st.isRequired,
        state,
        attachedFormName: st.attachedFormName,
        completedAt: idx === 0 ? app.submittedAt : undefined,
      };
    });

    app.processDefinitionId = proc.id;
    app.processName = proc.name;
    app.processVersionId = proc.versionId;
    app.processVersionNumber = proc.versionNumber;
    app.currentStepId = currentStepId;
    app.currentStepName = currentStepName;
    app.currentStepType = currentStepType;
    app.journeyStatus = 'IN_PROGRESS';
    app.status = 'IN_PROGRESS';
    app.journey = {
      applicationId: app.applicationNumber,
      processDefinitionId: proc.id,
      processVersionId: proc.versionId,
      processName: proc.name,
      processVersionNumber: proc.versionNumber,
      steps: stepsProgress,
      currentStepId,
      status: 'IN_PROGRESS',
      startedAt: now,
      updatedAt: now,
    };

    app.auditEvents?.push({
      id: `aud_${Date.now()}`,
      eventType: 'PROCESS_ASSIGNED_MANUALLY',
      description: `Admission Process "${proc.name}" (v${proc.versionNumber}) assigned by ${userScope.userRole || 'Staff'}`,
      actor: userScope.userRole || 'Admissions Officer',
      timestamp: now,
    });

    app.updatedAt = now;
    return app;
  }

  // -------------------------------------------------------------
  // Test Scheduling & Assignment Foundation
  // -------------------------------------------------------------
  public async getTestSchedules(userScope: UserScopeContext): Promise<TestScheduleDto[]> {
    return this.testSchedules.filter((s) => {
      if (userScope.isSuperAdmin) return true;
      if (userScope.authorizedCampusIds && userScope.authorizedCampusIds.length > 0) {
        return userScope.authorizedCampusIds.includes(s.campusId);
      }
      return true;
    });
  }

  public async createTestSchedule(
    dto: Partial<TestScheduleDto>,
    userScope: UserScopeContext
  ): Promise<TestScheduleDto> {
    if (!dto.date || !dto.startTime || !dto.campusId) {
      throw new BadRequestException('Date, start time, and campus are required for a test schedule.');
    }

    const schedule: TestScheduleDto = {
      id: `ts_${Date.now()}`,
      organizationId: userScope.organizationId,
      assessmentName: dto.assessmentName || 'Admission Diagnostic Test',
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime || '11:30',
      durationMinutes: dto.durationMinutes || 90,
      campusId: dto.campusId,
      campusName: dto.campusName || 'Selected Campus',
      venueRoom: dto.venueRoom || 'Main Exam Hall',
      mode: dto.mode || 'PAPER_BASED',
      capacity: dto.capacity || 50,
      instructions: dto.instructions || 'Arrive with candidate admit slip.',
      assignedApplicantCount: 0,
      createdAt: new Date(),
    };

    this.testSchedules.push(schedule);
    return schedule;
  }

  public async assignApplicantsToTestSchedule(
    scheduleId: string,
    applicationIds: string[],
    userScope: UserScopeContext
  ): Promise<TestScheduleAssignmentDto[]> {
    const schedule = this.testSchedules.find((s) => s.id === scheduleId);
    if (!schedule) throw new NotFoundException('Test schedule not found.');

    const assignments: TestScheduleAssignmentDto[] = [];
    const now = new Date();

    for (const appId of applicationIds) {
      const app = await this.getPreAdmissionById(appId, userScope);

      // Verify user has scope to target this applicant
      if (
        userScope.authorizedCampusIds &&
        userScope.authorizedCampusIds.length > 0 &&
        !userScope.authorizedCampusIds.includes(app.campusId)
      ) {
        throw new ForbiddenException(`Cannot assign applicant from unauthorized campus "${app.campusName}".`);
      }

      const assignment: TestScheduleAssignmentDto = {
        id: `ta_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        scheduleId: schedule.id,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        studentName: app.studentName,
        applicantCampusId: app.campusId,
        applicantCampusName: app.campusName,
        scheduleCampusId: schedule.campusId,
        scheduleCampusName: schedule.campusName,
        venueRoom: schedule.venueRoom,
        scheduledDate: schedule.date,
        scheduledTime: schedule.startTime,
        status: 'SCHEDULED',
        resultStatus: 'DRAFT',
      };

      this.testAssignments.push(assignment);
      assignments.push(assignment);

      // Update applicant operational fields
      app.testDate = schedule.date;
      app.testStatus = 'SCHEDULED';
      app.updatedAt = now;
      schedule.assignedApplicantCount++;

      this.emitAdmissionEvent('TEST_SCHEDULED', { assignmentId: assignment.id, applicationId: app.id, scheduleId: schedule.id });
    }

    return assignments;
  }

  public async rescheduleApplicantTest(
    assignmentId: string,
    newScheduleId: string,
    reason: string,
    userScope: UserScopeContext
  ): Promise<TestScheduleAssignmentDto> {
    const assignment = this.testAssignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new NotFoundException('Test assignment not found.');

    const newSchedule = this.testSchedules.find((s) => s.id === newScheduleId);
    if (!newSchedule) throw new NotFoundException('New target schedule not found.');

    const originalScheduleId = assignment.scheduleId;
    assignment.rescheduledFromScheduleId = originalScheduleId;
    assignment.rescheduledReason = reason;
    assignment.scheduleId = newSchedule.id;
    assignment.scheduleCampusId = newSchedule.campusId;
    assignment.scheduleCampusName = newSchedule.campusName;
    assignment.venueRoom = newSchedule.venueRoom;
    assignment.scheduledDate = newSchedule.date;
    assignment.scheduledTime = newSchedule.startTime;
    assignment.status = 'RESCHEDULED';

    this.emitAdmissionEvent('TEST_RESCHEDULED', { assignmentId: assignment.id, reason, newScheduleId });
    return assignment;
  }

  public async recordTestResult(
    assignmentId: string,
    score: number,
    totalMarks: number,
    outcome: TestOutcome,
    publishNow: boolean,
    userScope: UserScopeContext
  ): Promise<TestScheduleAssignmentDto> {
    const assignment = this.testAssignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new NotFoundException('Test assignment not found.');

    assignment.score = score;
    assignment.totalMarks = totalMarks;
    assignment.percentage = Math.round((score / totalMarks) * 100);
    assignment.outcome = outcome;
    assignment.resultStatus = publishNow ? 'PUBLISHED' : 'READY';
    if (publishNow) {
      assignment.publishedAt = new Date();
      this.emitAdmissionEvent('TEST_RESULT_PUBLISHED', { assignmentId, outcome, score });
    }

    const app = this.applications.find((a) => a.id === assignment.applicationId);
    if (app) {
      app.testResult = `${outcome} (${assignment.percentage}%)`;
      app.testStatus = 'COMPLETED';
    }

    return assignment;
  }

  // -------------------------------------------------------------
  // Interview Scheduling Foundation
  // -------------------------------------------------------------
  public async getInterviewSchedules(userScope: UserScopeContext): Promise<InterviewScheduleDto[]> {
    return this.interviewSchedules;
  }

  public async assignApplicantToInterview(
    scheduleId: string,
    applicationId: string,
    slotId?: string,
    userScope?: UserScopeContext
  ): Promise<InterviewAssignmentDto> {
    const schedule = this.interviewSchedules.find((s) => s.id === scheduleId);
    if (!schedule) throw new NotFoundException('Interview schedule not found.');

    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundException('Application not found.');

    const assignment: InterviewAssignmentDto = {
      id: `ia_${Date.now()}`,
      scheduleId: schedule.id,
      slotId,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      studentName: app.studentName,
      date: schedule.date,
      time: schedule.startTime,
      mode: schedule.mode,
      venueOrMeetingLink: schedule.mode === 'ONLINE' ? schedule.meetingLink : schedule.venueRoom,
      interviewerName: schedule.interviewerName,
      status: 'SCHEDULED',
    };

    this.interviewAssignments.push(assignment);
    app.interviewDate = schedule.date;
    app.interviewStatus = 'SCHEDULED';
    schedule.bookedSlots++;

    this.emitAdmissionEvent('INTERVIEW_SCHEDULED', { assignmentId: assignment.id, applicationId: app.id });
    return assignment;
  }

  public async recordInterviewOutcome(
    assignmentId: string,
    outcome: InterviewOutcome,
    notes?: string,
    userScope?: UserScopeContext
  ): Promise<InterviewAssignmentDto> {
    const assignment = this.interviewAssignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new NotFoundException('Interview assignment not found.');

    assignment.outcome = outcome;
    assignment.feedbackNotes = notes;
    assignment.status = 'COMPLETED';

    const app = this.applications.find((a) => a.id === assignment.applicationId);
    if (app) {
      app.interviewStatus = outcome;
    }

    this.emitAdmissionEvent('INTERVIEW_RESULT_PUBLISHED', { assignmentId, outcome });
    return assignment;
  }

  // -------------------------------------------------------------
  // Decision & Fee Management
  // -------------------------------------------------------------
  public async recordAdmissionDecision(
    applicationId: string,
    outcome: AdmissionDecisionOutcome,
    remarks?: string,
    userScope?: UserScopeContext
  ): Promise<PreAdmissionApplicationDto> {
    const app = await this.getPreAdmissionById(applicationId, userScope || { organizationId: '11111111-1111-1111-1111-111111111111', isSuperAdmin: true });
    app.decisionOutcome = outcome;
    if (outcome === 'APPROVED') {
      app.status = 'APPROVED';
      this.emitAdmissionEvent('ADMISSION_APPROVED', { applicationId: app.id });
    } else if (outcome === 'REJECTED') {
      app.status = 'REJECTED';
      this.emitAdmissionEvent('ADMISSION_REJECTED', { applicationId: app.id });
    } else if (outcome === 'WAITING_LIST') {
      this.emitAdmissionEvent('WAITLISTED', { applicationId: app.id });
    }
    app.updatedAt = new Date();
    return app;
  }

  public async recordFeePayment(
    applicationId: string,
    feeType: 'APPLICATION_FEE' | 'ADMISSION_FEE',
    amountPaid: number,
    method: string,
    userScope: UserScopeContext
  ): Promise<AdmissionChargeDto> {
    const app = await this.getPreAdmissionById(applicationId, userScope);

    const charge: AdmissionChargeDto = {
      id: `chg_${Date.now()}`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      feeType,
      feeName: feeType === 'APPLICATION_FEE' ? 'Registration Processing Fee' : 'Final Admission Fee',
      amount: amountPaid,
      currency: 'PKR',
      status: 'PAID',
      paidAmount: amountPaid,
      paidAt: new Date(),
      paymentMethod: 'ONLINE_GATEWAY',
      transactionReference: `TXN_${Date.now()}`,
      receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    this.charges.push(charge);
    app.feeStatus = 'PAID';
    app.updatedAt = new Date();

    this.emitAdmissionEvent(feeType === 'APPLICATION_FEE' ? 'APPLICATION_FEE_PAID' : 'ADMISSION_FEE_PAID', { chargeId: charge.id, applicationId: app.id, amount: amountPaid });
    return charge;
  }

  /**
   * Domain Notification Event Emitter (Foundation)
   */
  public emitAdmissionEvent(event: AdmissionProcessDomainEvent, payload: Record<string, any>) {
    this.emittedEvents.push({
      event,
      payload,
      timestamp: new Date(),
    });
  }

  public getEmittedEvents() {
    return this.emittedEvents;
  }

  // Backward compatibility aliases
  public async getApplications(filter: any, userScope: UserScopeContext) {
    return this.getPreAdmissions(filter, userScope);
  }

  public async getApplicationById(id: string, userScope: UserScopeContext) {
    return this.getPreAdmissionById(id, userScope);
  }

  public async updateStatus(id: string, newStatus: any, userScope: UserScopeContext, reviewNotes?: string) {
    const app = await this.getPreAdmissionById(id, userScope);
    app.status = newStatus;
    if (reviewNotes) {
      (app as any).reviewNotes = reviewNotes;
    }
    app.updatedAt = new Date();
    return app;
  }
}
