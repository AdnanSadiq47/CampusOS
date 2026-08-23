'use client';

import React, { useState, useEffect } from 'react';
import {
  AdmissionApplicationListItemDto,
  AdmissionApplicationsSummaryDto,
  AdmissionStatus,
} from '@campus-os/types';

// Status badge styling helper
export function getStatusBadge(status: AdmissionStatus) {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'SUBMITTED':
      return {
        label: 'Submitted',
        bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        dot: 'bg-sky-500',
      };
    case 'PENDING_REVIEW':
      return {
        label: 'Pending Review',
        bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'UNDER_REVIEW':
      return {
        label: 'Under Review',
        bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500',
      };
    case 'ON_HOLD':
      return {
        label: 'On Hold',
        bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
      };
    case 'APPROVED':
      return {
        label: 'Approved',
        bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'ENROLLED':
      return {
        label: 'Enrolled',
        bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export default function AdmissionApplicationsPage() {
  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | 'ALL'>('ALL');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<'appliedAt' | 'applicationNumber' | 'studentName' | 'status'>('appliedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI state for modal previews & actions
  const [selectedAppForView, setSelectedAppForView] = useState<AdmissionApplicationListItemDto | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [showNewAdmissionModal, setShowNewAdmissionModal] = useState(false);

  // Data & loading state
  const [applications, setApplications] = useState<AdmissionApplicationListItemDto[]>([]);
  const [summary, setSummary] = useState<AdmissionApplicationsSummaryDto>({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    enrolled: 0,
  });
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch applications from API
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (academicYearFilter !== 'ALL') params.set('academicYearId', academicYearFilter);
      if (classFilter !== 'ALL') params.set('classId', classFilter);
      if (campusFilter !== 'ALL') params.set('campusId', campusFilter);
      if (schoolFilter !== 'ALL') params.set('schoolId', schoolFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`http://localhost:4000/admissions/applications?${params.toString()}`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setApplications(data.items || []);
        setSummary(data.summary || { totalApplications: 0, pendingReview: 0, approved: 0, enrolled: 0 });
        setTotal(data.total || 0);
      } else {
        // Fallback demo dataset if API is not yet running on port 4000
        fallbackLocalData();
      }
    } catch (err) {
      fallbackLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackLocalData = () => {
    // Generate realistic multi-school demo applications
    const demoApps: AdmissionApplicationListItemDto[] = [
      {
        id: 'app_121',
        organizationId: '11111111-1111-1111-1111-111111111111',
        applicationNumber: 'APP-2026-00121',
        studentName: 'Ahmed Ali',
        gender: 'MALE',
        dateOfBirth: '2018-03-12',
        fatherOrGuardianName: 'Muhammad Ali',
        primaryMobile: '0300-1234567',
        schoolId: 'sch-1',
        schoolName: 'Beacon Horizon Public School',
        campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        campusName: 'Clifton Campus',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Session 2026-2027',
        classId: 'cls-g3',
        className: 'Grade 3',
        status: 'PENDING_REVIEW',
        appliedAt: new Date('2026-08-24T10:42:00Z'),
        formDefinitionId: 'form_admission_k12',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        createdAt: new Date('2026-08-24T10:42:00Z'),
        updatedAt: new Date('2026-08-24T10:42:00Z'),
      },
      {
        id: 'app_122',
        organizationId: '11111111-1111-1111-1111-111111111111',
        applicationNumber: 'APP-2026-00122',
        studentName: 'Fatima Zahra',
        gender: 'FEMALE',
        dateOfBirth: '2019-07-25',
        fatherOrGuardianName: 'Zahid Hussain',
        primaryMobile: '0321-9876543',
        schoolId: 'sch-1',
        schoolName: 'Beacon Horizon Public School',
        campusId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        campusName: 'Main Campus (Gulshan)',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Session 2026-2027',
        classId: 'cls-g1',
        className: 'Grade 1',
        status: 'UNDER_REVIEW',
        appliedAt: new Date('2026-08-24T09:15:00Z'),
        formDefinitionId: 'form_admission_k12',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        createdAt: new Date('2026-08-24T09:15:00Z'),
        updatedAt: new Date('2026-08-24T09:15:00Z'),
      },
      {
        id: 'app_123',
        organizationId: '11111111-1111-1111-1111-111111111111',
        applicationNumber: 'APP-2026-00123',
        studentName: 'Hamza Tariq',
        gender: 'MALE',
        dateOfBirth: '2017-11-05',
        fatherOrGuardianName: 'Dr. Tariq Mehmood',
        primaryMobile: '0333-5551234',
        schoolId: 'sch-2',
        schoolName: 'City Grammar School',
        campusId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        campusName: 'PECHS Senior Campus',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Session 2026-2027',
        classId: 'cls-g5',
        className: 'Grade 5',
        status: 'APPROVED',
        appliedAt: new Date('2026-08-23T16:30:00Z'),
        formDefinitionId: 'form_admission_k12',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        createdAt: new Date('2026-08-23T16:30:00Z'),
        updatedAt: new Date('2026-08-23T16:30:00Z'),
      },
      {
        id: 'app_124',
        organizationId: '11111111-1111-1111-1111-111111111111',
        applicationNumber: 'APP-2026-00124',
        studentName: 'Ayesha Khan',
        gender: 'FEMALE',
        dateOfBirth: '2020-01-18',
        fatherOrGuardianName: 'Imran Khan',
        primaryMobile: '0345-4447890',
        schoolId: 'sch-1',
        schoolName: 'Beacon Horizon Public School',
        campusId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        campusName: 'DHA Phase 6 Campus',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Session 2026-2027',
        classId: 'cls-ey1',
        className: 'Playgroup (EY-1)',
        status: 'ENROLLED',
        appliedAt: new Date('2026-08-23T14:10:00Z'),
        formDefinitionId: 'form_admission_k12',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        createdAt: new Date('2026-08-23T14:10:00Z'),
        updatedAt: new Date('2026-08-23T14:10:00Z'),
      },
      {
        id: 'app_125',
        organizationId: '11111111-1111-1111-1111-111111111111',
        applicationNumber: 'APP-2026-00125',
        studentName: 'Zainab Qureshi',
        gender: 'FEMALE',
        dateOfBirth: '2016-09-30',
        fatherOrGuardianName: 'Kamran Qureshi',
        primaryMobile: '0301-2223344',
        schoolId: 'sch-2',
        schoolName: 'City Grammar School',
        campusId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        campusName: 'Clifton Junior Campus',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Session 2026-2027',
        classId: 'cls-g7',
        className: 'Grade 7',
        status: 'ON_HOLD',
        appliedAt: new Date('2026-08-22T11:20:00Z'),
        formDefinitionId: 'form_admission_k12',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        createdAt: new Date('2026-08-22T11:20:00Z'),
        updatedAt: new Date('2026-08-22T11:20:00Z'),
      },
      {
        id: 'app_126',
        organizationId: '11111111-1111-1111-1111-111111111111',
        applicationNumber: 'APP-2026-00126',
        studentName: 'Bilal Siddiqui',
        gender: 'MALE',
        dateOfBirth: '2015-04-14',
        fatherOrGuardianName: 'Adnan Siddiqui',
        primaryMobile: '0312-8889900',
        schoolId: 'sch-1',
        schoolName: 'Beacon Horizon Public School',
        campusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        campusName: 'Clifton Campus',
        academicYearId: 'ay_2026_2027',
        academicYearName: 'Academic Session 2026-2027',
        classId: 'cls-g9',
        className: 'Grade 9 (Matric/O-Levels)',
        status: 'APPROVED',
        appliedAt: new Date('2026-08-22T09:45:00Z'),
        formDefinitionId: 'form_admission_k12',
        publishedFormVersionId: 'ver_adm_v1_live',
        formVersionNumber: 1,
        createdAt: new Date('2026-08-22T09:45:00Z'),
        updatedAt: new Date('2026-08-22T09:45:00Z'),
      },
    ];

    setApplications(demoApps);
    setSummary({
      totalApplications: 248,
      pendingReview: 34,
      approved: 176,
      enrolled: 152,
    });
    setTotal(demoApps.length);
  };

  useEffect(() => {
    fetchApplications();
  }, [search, statusFilter, academicYearFilter, classFilter, campusFilter, schoolFilter, page, limit, sortBy, sortOrder]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setAcademicYearFilter('ALL');
    setClassFilter('ALL');
    setCampusFilter('ALL');
    setSchoolFilter('ALL');
    setPage(1);
  };

  const isFilterActive =
    search.trim() !== '' ||
    statusFilter !== 'ALL' ||
    academicYearFilter !== 'ALL' ||
    classFilter !== 'ALL' ||
    campusFilter !== 'ALL' ||
    schoolFilter !== 'ALL';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header (CampusOS Standard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Admission Applications
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and review student admission applications across your authorized schools and campuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowNewAdmissionModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Applications
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-xs">📝</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{summary.totalApplications}</p>
          <span className="text-[10px] text-slate-400">Across authorized locations</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Review
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xs">⏳</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">{summary.pendingReview}</p>
          <span className="text-[10px] text-slate-400">Awaiting admission decision</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Approved
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs">✓</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.approved}</p>
          <span className="text-[10px] text-slate-400">Ready for enrollment</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Enrolled
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-xs">🎓</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">{summary.enrolled}</p>
          <span className="text-[10px] text-slate-400">Converted to active students</span>
        </div>
      </div>

      {/* 3. Main Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by application no., student name, parent name or mobile..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Primary Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Academic Year */}
            <select
              value={academicYearFilter}
              onChange={(e) => {
                setAcademicYearFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Academic Year"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Academic Years</option>
              <option value="ay_2026_2027">Session 2026-2027</option>
              <option value="ay_2025_2026">Session 2025-2026</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              aria-label="Filter by Status"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Applying Class */}
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Applying Class"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              <option value="cls-ey1">Playgroup (EY-1)</option>
              <option value="cls-kg">Kindergarten (KG)</option>
              <option value="cls-g1">Grade 1</option>
              <option value="cls-g3">Grade 3</option>
              <option value="cls-g5">Grade 5</option>
              <option value="cls-g7">Grade 7</option>
              <option value="cls-g9">Grade 9 (Matric/O-Levels)</option>
              <option value="cls-a1">A-Levels Year 1 (AS)</option>
            </select>

            {/* More Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showMoreFilters || schoolFilter !== 'ALL' || campusFilter !== 'ALL'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>⚙️</span>
              <span>More Filters</span>
              {showMoreFilters ? '▲' : '▼'}
            </button>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Secondary Hierarchy / Advanced Filters Panel */}
        {showMoreFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                School
              </label>
              <select
                value={schoolFilter}
                onChange={(e) => {
                  setSchoolFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Authorized Schools</option>
                <option value="sch-1">Beacon Horizon Public School</option>
                <option value="sch-2">City Grammar School</option>
                <option value="sch-3">Horizon Heights International</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Campus / Location
              </label>
              <select
                value={campusFilter}
                onChange={(e) => {
                  setCampusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Authorized Campuses</option>
                <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa">Main Campus (Gulshan)</option>
                <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">Clifton Campus</option>
                <option value="cccccccc-cccc-cccc-cccc-cccccccccccc">DHA Phase 6 Campus</option>
                <option value="dddddddd-dddd-dddd-dddd-dddddddddddd">PECHS Senior Campus</option>
                <option value="eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee">Clifton Junior Campus</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Sort Applications By
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="appliedAt">Applied Date</option>
                  <option value="applicationNumber">Application No.</option>
                  <option value="studentName">Student Name</option>
                  <option value="status">Status</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  title="Toggle Ascending / Descending"
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Desktop Table / Mobile Responsive Cards */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="animate-spin text-3xl">⏳</div>
            <p className="text-xs font-semibold">Loading admission applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-4xl">🎓</div>
            {isFilterActive ? (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Applications Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No admission applications match your selected filter criteria. Try clearing or relaxing your search filters.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Admission Applications Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start your first admission application for eligible students.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewAdmissionModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  + New Admission
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile < 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Application No.</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Applying For</th>
                    <th className="py-3 px-4">School / Campus</th>
                    <th className="py-3 px-4">Parent / Contact</th>
                    <th className="py-3 px-4">Applied On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {applications.map((app) => {
                    const badge = getStatusBadge(app.status);
                    const appliedDate = new Date(app.appliedAt);
                    const dateFormatted = appliedDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const timeFormatted = appliedDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Application No */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => setSelectedAppForView(app)}
                            className="hover:text-indigo-600 hover:underline cursor-pointer"
                            title="View application details"
                          >
                            {app.applicationNumber}
                          </button>
                        </td>

                        {/* Student Details */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{app.studentName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {app.gender === 'MALE' ? 'Male' : app.gender === 'FEMALE' ? 'Female' : 'Other'} · DOB{' '}
                            {new Date(app.dateOfBirth).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Applying For */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-indigo-700 dark:text-indigo-300">{app.className}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{app.academicYearName}</div>
                        </td>

                        {/* School / Campus */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{app.schoolName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>📍</span>
                            <span>{app.campusName}</span>
                          </div>
                        </td>

                        {/* Parent / Contact */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {app.fatherOrGuardianName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{app.primaryMobile}</div>
                        </td>

                        {/* Applied On */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{dateFormatted}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{timeFormatted}</div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${badge.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 relative">
                            <button
                              type="button"
                              onClick={() => setSelectedAppForView(app)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer transition-colors"
                            >
                              View
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenActionMenuId(openActionMenuId === app.id ? null : app.id)
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                ⋮
                              </button>

                              {openActionMenuId === app.id && (
                                <div className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 text-left text-xs font-semibold animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAppForView(app);
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center gap-2"
                                  >
                                    <span>👁️</span>
                                    <span>View Application</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      alert(`Print preview for ${app.applicationNumber}`);
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center gap-2"
                                  >
                                    <span>🖨️</span>
                                    <span>Print Application</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      alert(`Status change workflow for ${app.applicationNumber}`);
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center gap-2 text-indigo-600"
                                  >
                                    <span>⚡</span>
                                    <span>Review / Status</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View (Shown on < 640px) */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {applications.map((app) => {
                const badge = getStatusBadge(app.status);
                const appliedDate = new Date(app.appliedAt);
                const dateFormatted = appliedDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div key={app.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
                        {app.applicationNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.studentName}</h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                        {app.className} · {app.campusName}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div>👤 {app.fatherOrGuardianName} · 📞 {app.primaryMobile}</div>
                      <div>📅 Applied on {dateFormatted}</div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">{app.schoolName}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAppForView(app)}
                          className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 5. Pagination Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)}
                </span>{' '}
                of <span className="font-bold text-slate-900 dark:text-white">{total}</span> applications
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                  >
                    ‹ Prev
                  </button>
                  <span className="px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                  >
                    Next ›
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── VIEW APPLICATION QUICK PREVIEW MODAL ── */}
      {selectedAppForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between animate-in fade-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedAppForView.applicationNumber}
                  </span>
                  {(() => {
                    const b = getStatusBadge(selectedAppForView.status);
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg}`}>
                        {b.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Applied on {new Date(selectedAppForView.appliedAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Snapshot */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pr-1 text-xs">
              {/* Student Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Student Information
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedAppForView.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gender & Date of Birth</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAppForView.gender} · {selectedAppForView.dateOfBirth}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admission Target Context */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Assigned Location & Class
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">School & Campus</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{selectedAppForView.schoolName}</span>
                    <span className="text-indigo-600 font-semibold">{selectedAppForView.campusName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Applying Class & Session</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{selectedAppForView.className}</span>
                    <span className="text-slate-500">{selectedAppForView.academicYearName}</span>
                  </div>
                </div>
              </div>

              {/* Parent / Guardian */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Parent / Guardian Contact
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Father / Guardian</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedAppForView.fatherOrGuardianName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Mobile</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedAppForView.primaryMobile}</span>
                  </div>
                </div>
              </div>

              {/* Schema Snapshot & Version Traceability */}
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-[11px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 block">Form Version Snapshot</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    Version v{selectedAppForView.formVersionNumber || 1} ({selectedAppForView.publishedFormVersionId || 'snapshot'})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700">
                  Immutable Record
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Reviewer: {selectedAppForView.assignedReviewer || 'Unassigned'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAppForView(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW ADMISSION INTEGRATION BOUNDARY MODAL ── */}
      {showNewAdmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Start New Admission</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAdmissionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                In CampusOS, <strong>New Admission</strong> resolves the published Admission Form assigned to the target Campus and Class using the Dynamic Form Resolver:
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 font-mono text-[11px]">
                <div>1. Select Campus & Academic Year</div>
                <div>2. Select Applying Class</div>
                <div>3. Resolver selects Published Form Version</div>
                <div>4. Render Dynamic Admission Runtime</div>
              </div>
              <p className="text-slate-400 text-[11px]">
                Phase 1 lists applications with data scope and filters. The complete interactive form filling workflow is part of Phase 2.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewAdmissionModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
