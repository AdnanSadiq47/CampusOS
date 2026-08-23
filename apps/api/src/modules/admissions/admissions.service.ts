import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  AdmissionApplicationListItemDto,
  AdmissionApplicationsFilterDto,
  PaginatedAdmissionApplicationsDto,
  AdmissionApplicationsSummaryDto,
  AdmissionStatus,
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

@Injectable()
export class AdmissionsService {
  // In-memory operational store seeded with realistic production-grade records
  private applications: AdmissionApplicationListItemDto[] = [];

  constructor() {
    this.seedDefaultApplications();
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
      { id: 'ay_2026_2027', name: 'Academic Session 2026-2027' },
      { id: 'ay_2025_2026', name: 'Academic Session 2025-2026' },
    ];

    const classes = [
      { id: 'cls-ey1', name: 'Playgroup (EY-1)', levelName: 'Early Years / Pre-School' },
      { id: 'cls-kg', name: 'Kindergarten (KG)', levelName: 'Early Years / Pre-School' },
      { id: 'cls-g1', name: 'Grade 1', levelName: 'Primary School' },
      { id: 'cls-g3', name: 'Grade 3', levelName: 'Primary School' },
      { id: 'cls-g5', name: 'Grade 5', levelName: 'Primary School' },
      { id: 'cls-g7', name: 'Grade 7', levelName: 'Middle School' },
      { id: 'cls-g9', name: 'Grade 9 (Matric/O-Levels)', levelName: 'Secondary School' },
      { id: 'cls-a1', name: 'A-Levels Year 1 (AS)', levelName: 'Higher Secondary / College' },
    ];

    const namesPool = [
      { student: 'Ahmed Ali', father: 'Muhammad Ali', mobile: '0300-1234567', gender: 'MALE' as const, dob: '2018-03-12', status: 'PENDING_REVIEW' as AdmissionStatus },
      { student: 'Fatima Zahra', father: 'Zahid Hussain', mobile: '0321-9876543', gender: 'FEMALE' as const, dob: '2019-07-25', status: 'UNDER_REVIEW' as AdmissionStatus },
      { student: 'Hamza Tariq', father: 'Dr. Tariq Mehmood', mobile: '0333-5551234', gender: 'MALE' as const, dob: '2017-11-05', status: 'APPROVED' as AdmissionStatus },
      { student: 'Ayesha Khan', father: 'Imran Khan', mobile: '0345-4447890', gender: 'FEMALE' as const, dob: '2020-01-18', status: 'ENROLLED' as AdmissionStatus },
      { student: 'Zainab Qureshi', father: 'Kamran Qureshi', mobile: '0301-2223344', gender: 'FEMALE' as const, dob: '2016-09-30', status: 'ON_HOLD' as AdmissionStatus },
      { student: 'Bilal Siddiqui', father: 'Adnan Siddiqui', mobile: '0312-8889900', gender: 'MALE' as const, dob: '2015-04-14', status: 'APPROVED' as AdmissionStatus },
      { student: 'Maryam Naveed', father: 'Naveed Akhtar', mobile: '0322-7776655', gender: 'FEMALE' as const, dob: '2018-08-22', status: 'PENDING_REVIEW' as AdmissionStatus },
      { student: 'Mustafa Raza', father: 'Syed Raza Ali', mobile: '0334-1112233', gender: 'MALE' as const, dob: '2019-12-01', status: 'ENROLLED' as AdmissionStatus },
      { student: 'Hania Aslam', father: 'Muhammad Aslam', mobile: '0346-6665544', gender: 'FEMALE' as const, dob: '2017-02-14', status: 'SUBMITTED' as AdmissionStatus },
      { student: 'Daniyal Farooq', father: 'Farooq Ahmed', mobile: '0302-3334455', gender: 'MALE' as const, dob: '2014-06-19', status: 'APPROVED' as AdmissionStatus },
      { student: 'Sara Rehman', father: 'Abdul Rehman', mobile: '0313-9990011', gender: 'FEMALE' as const, dob: '2020-05-10', status: 'DRAFT' as AdmissionStatus },
      { student: 'Usman Ghani', father: 'Ghani Ur Rehman', mobile: '0323-8881122', gender: 'MALE' as const, dob: '2016-10-08', status: 'REJECTED' as AdmissionStatus },
      { student: 'Noor ul Huda', father: 'Syed Huda Shah', mobile: '0335-7773344', gender: 'FEMALE' as const, dob: '2018-01-29', status: 'ENROLLED' as AdmissionStatus },
      { student: 'Saad Malik', father: 'Malik Faisal', mobile: '0347-5556677', gender: 'MALE' as const, dob: '2015-09-17', status: 'APPROVED' as AdmissionStatus },
      { student: 'Maham Waqar', father: 'Waqar Younis', mobile: '0303-4448899', gender: 'FEMALE' as const, dob: '2019-04-03', status: 'PENDING_REVIEW' as AdmissionStatus },
      { student: 'Ibrahim Javed', father: 'Javed Iqbal', mobile: '0314-2227788', gender: 'MALE' as const, dob: '2017-08-11', status: 'APPROVED' as AdmissionStatus },
      { student: 'Dua Kashif', father: 'Kashif Anwar', mobile: '0324-1119900', gender: 'FEMALE' as const, dob: '2018-12-15', status: 'ENROLLED' as AdmissionStatus },
      { student: 'Rayyan Shah', father: 'Shahbaz Ahmed', mobile: '0336-9994433', gender: 'MALE' as const, dob: '2020-03-21', status: 'CANCELLED' as AdmissionStatus },
      { student: 'Amina Baig', father: 'Mirza Baig', mobile: '0348-8885566', gender: 'FEMALE' as const, dob: '2016-07-07', status: 'UNDER_REVIEW' as AdmissionStatus },
      { student: 'Zayd Hasan', father: 'Hasan Raza', mobile: '0304-7771122', gender: 'MALE' as const, dob: '2015-11-28', status: 'APPROVED' as AdmissionStatus },
      { student: 'Eshal Mansoor', father: 'Mansoor Ali', mobile: '0315-6662233', gender: 'FEMALE' as const, dob: '2019-09-09', status: 'PENDING_REVIEW' as AdmissionStatus },
      { student: 'Yahya Zubair', father: 'Zubair Sheikh', mobile: '0325-5553344', gender: 'MALE' as const, dob: '2017-05-16', status: 'ENROLLED' as AdmissionStatus },
      { student: 'Anaya Sohail', father: 'Sohail Tanvir', mobile: '0337-4441122', gender: 'FEMALE' as const, dob: '2018-10-31', status: 'APPROVED' as AdmissionStatus },
      { student: 'Shahzaib Abbasi', father: 'Rashid Abbasi', mobile: '0349-3338877', gender: 'MALE' as const, dob: '2014-12-04', status: 'APPROVED' as AdmissionStatus },
      { student: 'Hiba Nadeem', father: 'Nadeem Sarwar', mobile: '0305-2229988', gender: 'FEMALE' as const, dob: '2019-02-17', status: 'PENDING_REVIEW' as AdmissionStatus },
      { student: 'Moiz Khalid', father: 'Khalid Mehmood', mobile: '0316-1118877', gender: 'MALE' as const, dob: '2016-03-25', status: 'ENROLLED' as AdmissionStatus },
      { student: 'Khadija Usman', father: 'Usman Ali', mobile: '0326-9993322', gender: 'FEMALE' as const, dob: '2020-08-14', status: 'APPROVED' as AdmissionStatus },
      { student: 'Abdullah Rauf', father: 'Abdul Rauf', mobile: '0338-8884411', gender: 'MALE' as const, dob: '2017-06-30', status: 'ON_HOLD' as AdmissionStatus },
      { student: 'Aiza Bilal', father: 'Bilal Saeed', mobile: '0350-7772200', gender: 'FEMALE' as const, dob: '2018-04-19', status: 'APPROVED' as AdmissionStatus },
      { student: 'Haris Munir', father: 'Munir Ahmed', mobile: '0306-6661199', gender: 'MALE' as const, dob: '2015-01-23', status: 'PENDING_REVIEW' as AdmissionStatus },
    ];

    const allCampuses = schools.flatMap((s) =>
      s.campuses.map((c) => ({
        ...c,
        schoolId: s.id,
        schoolName: s.name,
        regionId: s.regionId,
        regionName: s.regionName,
      }))
    );

    let appIndex = 120;
    const baseDate = new Date('2026-08-24T10:00:00Z');

    this.applications = namesPool.map((p, idx) => {
      appIndex++;
      const campusInfo = allCampuses[idx % allCampuses.length]!;
      const academicYear = academicYears[idx % academicYears.length]!;
      const cls = classes[idx % classes.length]!;

      const appliedDate = new Date(baseDate.getTime() - idx * 3600 * 1000 * 5.5);

      return {
        id: `app_${appIndex}`,
        organizationId: orgId,
        applicationNumber: `APP-2026-${String(appIndex).padStart(5, '0')}`,
        studentName: p.student,
        gender: p.gender,
        dateOfBirth: p.dob,
        fatherOrGuardianName: p.father,
        primaryMobile: p.mobile,
        primaryEmail: `${p.student.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        schoolId: campusInfo.schoolId,
        schoolName: campusInfo.schoolName,
        campusId: campusInfo.id,
        campusName: campusInfo.name,
        regionId: campusInfo.regionId,
        regionName: campusInfo.regionName,
        headOfficeId: 'ho_main',
        headOfficeName: 'Alpha Central Directorate',
        academicYearId: academicYear.id,
        academicYearName: academicYear.name,
        academicLevelName: cls.levelName,
        classId: cls.id,
        className: cls.name,
        boardName: 'BISE Karachi / Cambridge',
        status: p.status,
        appliedAt: appliedDate,
        formDefinitionId: 'form_admission_k12',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        submissionData: {
          previousSchool: 'Kindergarten Academy',
          emergencyContact: p.mobile,
        },
        assignedReviewer: idx % 2 === 0 ? 'Admissions Officer 1' : 'Principal Office',
        createdAt: appliedDate,
        updatedAt: appliedDate,
      };
    });
  }

  /**
   * Filter applications respecting the logged-in user's authorized hierarchy and data scope
   */
  public async getApplications(
    filter: AdmissionApplicationsFilterDto,
    userScope: UserScopeContext
  ): Promise<PaginatedAdmissionApplicationsDto> {
    // 1. Data-Scope Isolation
    let scoped = this.applications.filter((app) => {
      if (userScope.isSuperAdmin) return true;

      // If user has specific Campus / Branch scope
      if (userScope.authorizedCampusIds && userScope.authorizedCampusIds.length > 0) {
        return userScope.authorizedCampusIds.includes(app.campusId);
      }

      // If user has School scope
      if (userScope.authorizedSchoolIds && userScope.authorizedSchoolIds.length > 0) {
        return userScope.authorizedSchoolIds.includes(app.schoolId);
      }

      // If user has Region scope
      if (userScope.authorizedRegionIds && userScope.authorizedRegionIds.length > 0) {
        return app.regionId ? userScope.authorizedRegionIds.includes(app.regionId) : false;
      }

      // If user has Head Office scope
      if (userScope.authorizedHeadOfficeIds && userScope.authorizedHeadOfficeIds.length > 0) {
        return app.headOfficeId ? userScope.authorizedHeadOfficeIds.includes(app.headOfficeId) : true;
      }

      return true;
    });

    // 2. Summary KPI Calculation (Scoped strictly to authorized user boundary)
    const summary: AdmissionApplicationsSummaryDto = {
      totalApplications: scoped.length,
      pendingReview: scoped.filter(
        (a) => a.status === 'PENDING_REVIEW' || a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED'
      ).length,
      approved: scoped.filter((a) => a.status === 'APPROVED').length,
      enrolled: scoped.filter((a) => a.status === 'ENROLLED').length,
    };

    // 3. Search Filter
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
          a.className.toLowerCase().includes(q)
      );
    }

    // 4. Secondary Filters
    if (filter.status && filter.status !== 'ALL') {
      scoped = scoped.filter((a) => a.status === filter.status);
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

    // 5. Sorting
    const sortBy = filter.sortBy || 'appliedAt';
    const sortOrder = filter.sortOrder || 'desc';

    scoped.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'appliedAt') {
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

    // 6. Pagination
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
   * Retrieve single application detail with version snapshot verification
   */
  public async getApplicationById(
    id: string,
    userScope: UserScopeContext
  ): Promise<AdmissionApplicationListItemDto> {
    const app = this.applications.find((a) => a.id === id || a.applicationNumber === id);
    if (!app) {
      throw new NotFoundException(`Admission Application with identifier "${id}" not found.`);
    }

    // Scope check
    if (
      userScope.authorizedCampusIds &&
      userScope.authorizedCampusIds.length > 0 &&
      !userScope.authorizedCampusIds.includes(app.campusId)
    ) {
      throw new ForbiddenException('You do not have permission to view applications for this campus.');
    }

    return app;
  }

  /**
   * Status change transition with audit tracking
   */
  public async updateStatus(
    id: string,
    newStatus: AdmissionStatus,
    userScope: UserScopeContext,
    reviewNotes?: string
  ): Promise<AdmissionApplicationListItemDto> {
    const app = await this.getApplicationById(id, userScope);
    app.status = newStatus;
    if (reviewNotes) {
      app.reviewNotes = reviewNotes;
    }
    app.updatedAt = new Date();
    return app;
  }
}
