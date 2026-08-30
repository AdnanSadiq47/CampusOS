'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type {
  AdmissionTestScheduleDto,
  AdmissionTestCandidateDto,
  TestScheduleSummaryDto,
  TestMode,
  CandidateAssignmentStrategy,
} from '@campus-os/types';
import { SectionNavigation } from '../../../../components/SectionNavigation';
import { useWorkingContext, ALL_CAMPUSES_METADATA } from '../../../../lib/working-context';
import { Plus, Calendar, Zap, CheckCircle2, Clock } from 'lucide-react';
import {
  StatCard,
  StatusBadge,
  RowActions,
  ViewAction,
} from '../../../../design-system';

export default function AdmissionTestsPage() {
  // Global Working Context Engine Integration
  const { currentContext, isCampusInEffectiveScope, getAuthorizedCampusesForWrite } = useWorkingContext();

  // State
  const [schedules, setSchedules] = useState<AdmissionTestScheduleDto[]>([]);
  const [summary, setSummary] = useState<TestScheduleSummaryDto>({
    totalScheduled: 0,
    todayCount: 0,
    completedCount: 0,
    resultsPendingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Candidates Popup Drawer
  const [activeCandidateSchedule, setActiveCandidateSchedule] = useState<AdmissionTestScheduleDto | null>(null);
  const [candidatesList, setCandidatesList] = useState<AdmissionTestCandidateDto[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // Reschedule Sub-Modal
  const [reschedulingCandidate, setReschedulingCandidate] = useState<AdmissionTestCandidateDto | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    newStartTime: '',
    newReportingTime: '',
    newVenueCampusId: '',
    newVenueRoom: '',
    reason: '',
  });
  const [isReschedulingSaving, setIsReschedulingSaving] = useState(false);

  // Schedule Test Flow (Modal / Drawer)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<'FORM' | 'CONFIRM'>('FORM');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Helper to auto-calculate reporting time (30 minutes prior to start time)
  const calculateReportingTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (h === undefined || m === undefined || isNaN(h) || isNaN(m)) return '';
    let totalMin = h * 60 + m - 30;
    if (totalMin < 0) totalMin += 24 * 60;
    const rh = Math.floor(totalMin / 60);
    const rm = totalMin % 60;
    return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
  };

  // New Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    academicYearId: 'ay_2026_2027',
    processDefinitionId: 'proc_general_k12',
    processStepId: 's_test_1',
    classIds: ['cls-g6'],
    strategy: 'ALL_ELIGIBLE_APPLICANTS' as CandidateAssignmentStrategy,
    selectedCandidateIds: [] as string[],
    date: '2026-08-28',
    reportingTime: '09:30',
    startTime: '10:00',
    durationMinutes: 90,
    mode: 'PAPER_BASED' as TestMode,
    venueType: 'CAMPUS' as 'CAMPUS' | 'EXTERNAL',
    venueCampusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    venueCampusName: 'Clifton Campus',
    venueBuilding: 'Academic Block B',
    venueRoom: 'Room 204',
    venueInstructions: 'Arrive 30 minutes prior with physical admit card and stationery.',
  });

  // Eligible Candidates Pool for Selector
  const [eligibleCandidates, setEligibleCandidates] = useState<any[]>([]);
  const [candidateSelectorSearch, setCandidateSelectorSearch] = useState('');
  const [candidateSelectorCampus, setCandidateSelectorCampus] = useState('ALL');
  const [isLoadingEligible, setIsLoadingEligible] = useState(false);

  // Available Processes with Test Step Configuration
  const availableProcesses = [
    {
      id: 'proc_general_k12',
      name: 'General K-12 Admission Journey',
      stepId: 's_test_1',
      stepName: 'Entrance Test',
      mode: 'HYBRID' as TestMode,
      totalMarks: 100,
      passMarks: 50,
    },
    {
      id: 'proc_alevel_detailed',
      name: 'A-Level Competitive Track',
      stepId: 'ad4',
      stepName: 'Comprehensive Entrance Test',
      mode: 'HYBRID' as TestMode,
      totalMarks: 100,
      passMarks: 60,
    },
  ];

  // Campuses Catalog scoped to working context
  const availableFilterCampuses = useMemo(() => {
    return ALL_CAMPUSES_METADATA.filter((c) => isCampusInEffectiveScope(c.id));
  }, [isCampusInEffectiveScope]);

  const classesList = [
    { id: 'cls-g6', name: 'Grade 6' },
    { id: 'cls-g7', name: 'Grade 7' },
    { id: 'cls-g3', name: 'Grade 3' },
    { id: 'cls-a1', name: 'A-Levels Year 1' },
    { id: 'cls-g1', name: 'Grade 1' },
  ];

  // Reset page-level campus filter if active working context narrows and excludes it
  useEffect(() => {
    if (campusFilter !== 'ALL' && !isCampusInEffectiveScope(campusFilter)) {
      setCampusFilter('ALL');
    }
  }, [currentContext, campusFilter, isCampusInEffectiveScope]);

  // Load Schedules with Active Working Context
  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('contextNodeId', currentContext.id);
      params.append('contextNodeType', currentContext.type);
      if (search) params.append('search', search);
      if (academicYearFilter !== 'ALL') params.append('academicYearId', academicYearFilter);
      if (campusFilter !== 'ALL') params.append('campusId', campusFilter);
      if (classFilter !== 'ALL') params.append('classId', classFilter);
      if (modeFilter !== 'ALL') params.append('mode', modeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`http://localhost:4000/admissions/tests?${params.toString()}`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.items || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load admission tests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentContext.id, search, academicYearFilter, campusFilter, classFilter, modeFilter, statusFilter, dateFilter]);

  // Load Candidates for Active Popup
  const loadCandidatesForSchedule = async (schedule: AdmissionTestScheduleDto) => {
    setActiveCandidateSchedule(schedule);
    setIsLoadingCandidates(true);
    try {
      const params = new URLSearchParams();
      params.append('contextNodeId', currentContext.id);
      params.append('contextNodeType', currentContext.type);
      if (candidateSearch) params.append('search', candidateSearch);
      if (candidateStatusFilter !== 'ALL') params.append('status', candidateStatusFilter);

      const res = await fetch(`http://localhost:4000/admissions/test-schedules/${schedule.id}/candidates?${params.toString()}`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCandidatesList(data || []);
      }
    } catch (err) {
      console.error('Failed to load schedule candidates:', err);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (activeCandidateSchedule) {
      loadCandidatesForSchedule(activeCandidateSchedule);
    }
  }, [currentContext.id, candidateSearch, candidateStatusFilter]);

  // Load Eligible Candidates for Modal
  const loadEligibleCandidates = async () => {
    setIsLoadingEligible(true);
    try {
      const params = new URLSearchParams();
      params.append('contextNodeId', currentContext.id);
      params.append('contextNodeType', currentContext.type);
      params.append('processDefinitionId', scheduleForm.processDefinitionId);
      params.append('processStepId', scheduleForm.processStepId);
      if (scheduleForm.classIds.length > 0) params.append('classIds', scheduleForm.classIds.join(','));
      if (candidateSelectorCampus !== 'ALL') params.append('campusId', candidateSelectorCampus);
      if (candidateSelectorSearch) params.append('search', candidateSelectorSearch);

      const res = await fetch(`http://localhost:4000/admissions/test-schedules/eligible-candidates?${params.toString()}`, {
        headers: {
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
          'x-working-context-id': currentContext.id,
          'x-working-context-type': currentContext.type,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEligibleCandidates(data || []);
      }
    } catch (err) {
      console.error('Failed to load eligible candidates:', err);
    } finally {
      setIsLoadingEligible(false);
    }
  };

  useEffect(() => {
    if (isScheduleModalOpen) {
      loadEligibleCandidates();
    }
  }, [isScheduleModalOpen, scheduleForm.processDefinitionId, scheduleForm.processStepId, scheduleForm.classIds, candidateSelectorCampus, candidateSelectorSearch]);

  // Open Schedule Modal
  const handleOpenScheduleModal = () => {
    setScheduleForm({
      name: 'Grade 6 Entrance Assessment',
      academicYearId: 'ay_2026_2027',
      processDefinitionId: 'proc_general_k12',
      processStepId: 's_test_1',
      classIds: ['cls-g6'],
      strategy: 'ALL_ELIGIBLE_APPLICANTS',
      selectedCandidateIds: [],
      date: '2026-08-28',
      reportingTime: '09:30',
      startTime: '10:00',
      durationMinutes: 90,
      mode: 'PAPER_BASED',
      venueType: 'CAMPUS',
      venueCampusId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      venueCampusName: 'Clifton Campus',
      venueBuilding: 'Academic Block B',
      venueRoom: 'Room 204',
      venueInstructions: 'Arrive 30 minutes prior with physical admit card and stationery.',
    });
    setScheduleStep('FORM');
    setConflictWarning(null);
    setIsScheduleModalOpen(true);
  };

  // Toggle Single Candidate Selection
  const toggleCandidateSelection = (id: string) => {
    setScheduleForm((prev) => {
      const exists = prev.selectedCandidateIds.includes(id);
      return {
        ...prev,
        selectedCandidateIds: exists
          ? prev.selectedCandidateIds.filter((cid) => cid !== id)
          : [...prev.selectedCandidateIds, id],
      };
    });
  };

  // Select All / Clear Selection
  const handleSelectAllMatching = () => {
    const allIds = eligibleCandidates.map((c) => c.id);
    setScheduleForm((prev) => ({ ...prev, selectedCandidateIds: allIds }));
  };

  const handleClearCandidateSelection = () => {
    setScheduleForm((prev) => ({ ...prev, selectedCandidateIds: [] }));
  };

  // Save / Confirm Schedule
  const handleProceedToConfirm = () => {
    if (!scheduleForm.name.trim()) {
      alert('Please provide a Test Name.');
      return;
    }
    if (scheduleForm.selectedCandidateIds.length === 0) {
      if (!confirm('No candidates have been assigned yet. Would you like to schedule an empty test session and assign candidates later?')) {
        return;
      }
    }
    setScheduleStep('CONFIRM');
  };

  const handleFinalSaveSchedule = async (isDraft: boolean) => {
    setIsSavingSchedule(true);
    setConflictWarning(null);
    try {
      const res = await fetch('http://localhost:4000/admissions/test-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'HEAD_OFFICE_ADMIN' },
        body: JSON.stringify({
          ...scheduleForm,
          candidatePreAdmissionIds: scheduleForm.selectedCandidateIds,
          isDraft,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to schedule test.');
      }

      await fetchSchedules();
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      setConflictWarning(err.message || 'Failed to schedule test.');
      setScheduleStep('FORM');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Reschedule Candidate Submission
  const handleSaveReschedule = async () => {
    if (!reschedulingCandidate) return;
    if (!rescheduleForm.newDate || !rescheduleForm.newStartTime) {
      alert('New Date and Start Time are required.');
      return;
    }
    if (!rescheduleForm.reason.trim()) {
      alert('A reason is mandatory for audit history.');
      return;
    }

    setIsReschedulingSaving(true);
    try {
      const res = await fetch('http://localhost:4000/admissions/test-candidates/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'CAMPUS_ADMIN' },
        body: JSON.stringify({
          candidateId: reschedulingCandidate.id,
          newDate: rescheduleForm.newDate,
          newStartTime: rescheduleForm.newStartTime,
          newReportingTime: rescheduleForm.newReportingTime,
          newVenueCampusId: rescheduleForm.newVenueCampusId || undefined,
          newVenueRoom: rescheduleForm.newVenueRoom || undefined,
          reason: rescheduleForm.reason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to reschedule candidate.');
      }

      if (activeCandidateSchedule) {
        await loadCandidatesForSchedule(activeCandidateSchedule);
      }
      await fetchSchedules();
      setReschedulingCandidate(null);
    } catch (err: any) {
      alert(err.message || 'Error rescheduling candidate.');
    } finally {
      setIsReschedulingSaving(false);
    }
  };

  // Remove Candidate from Schedule
  const handleRemoveCandidate = async (candidateId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove "${studentName}" from this test schedule?`)) return;

    try {
      const res = await fetch(`http://localhost:4000/admissions/test-candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'HEAD_OFFICE_ADMIN' },
      });
      if (res.ok && activeCandidateSchedule) {
        await loadCandidatesForSchedule(activeCandidateSchedule);
        await fetchSchedules();
      }
    } catch (err) {
      console.error('Failed to remove candidate:', err);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admission Tests</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Operations
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule and manage admission assessments across your schools and campuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenScheduleModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Test</span>
          </button>
        </div>
      </div>

      {/* Shared Operational Workflow Nav */}
      <SectionNavigation section="preadmission_ops" className="pb-1" />

      {/* ── TOP KPI CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          title="Scheduled"
          value={summary.totalScheduled}
          icon={<Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle="Active assessments"
          variant="success"
        />
        <StatCard
          title="Today / Upcoming"
          value={summary.todayCount}
          icon={<Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          subtitle="Sessions on calendar"
          variant="info"
        />
        <StatCard
          title="Completed"
          value={summary.completedCount}
          icon={<CheckCircle2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
          subtitle="Conducted tests"
          variant="default"
        />
        <StatCard
          title="Results Pending"
          value={summary.resultsPendingCount}
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          subtitle="Pending evaluation"
          variant="warning"
        />
      </div>

      {/* ── FILTERS & SEARCH TOOLBAR ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search test name, schedule code, class or campus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Quick Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Academic Year */}
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Academic Years</option>
              <option value="ay_2026_2027">2026–2027</option>
            </select>

            {/* School / Campus */}
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none max-w-[180px] truncate"
            >
              <option value="ALL">All Authorized Campuses ({availableFilterCampuses.length})</option>
              {availableFilterCampuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Class / Grade */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Classes</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Test Mode */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="PAPER_BASED">Paper Based</option>
              <option value="COMPUTER_BASED">Computer Based</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESULTS_PENDING">Results Pending</option>
              <option value="RESULTS_PUBLISHED">Results Published</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Clear Button */}
            {(search || academicYearFilter !== 'ALL' || campusFilter !== 'ALL' || classFilter !== 'ALL' || modeFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setAcademicYearFilter('ALL');
                  setCampusFilter('ALL');
                  setClassFilter('ALL');
                  setModeFilter('ALL');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TESTS TABLE / CARDS ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading admission test schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-3xl">📝</div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-2">No admission tests found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No assessments match your current filters. Click "+ Schedule Test" to create a new session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Test / Schedule</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Class / Grade</th>
                  <th className="py-3.5 px-4">Candidates</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Results</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* TEST / SCHEDULE */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {schedule.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{schedule.scheduleCode}</span>
                        <span>•</span>
                        <span>{schedule.processStepName || 'Entrance Test'}</span>
                      </div>
                    </td>

                    {/* DATE & TIME */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {schedule.date}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {schedule.startTime} ({schedule.durationMinutes} mins)
                        {schedule.reportingTime && <span className="ml-1 text-slate-400">· Rep: {schedule.reportingTime}</span>}
                      </div>
                    </td>

                    {/* CLASS / GRADE */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {schedule.classNames && schedule.classNames.length > 0 ? (
                          schedule.classNames.map((cn, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                              {cn}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">All Grades</span>
                        )}
                      </div>
                    </td>

                    {/* CANDIDATES */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => loadCandidatesForSchedule(schedule)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                        title="Click to view assigned candidate roster"
                      >
                        <span>{schedule.totalCandidatesCount} Candidates</span>
                        <span className="text-indigo-500">›</span>
                      </button>
                    </td>

                    {/* VENUE */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {schedule.venueCampusName || 'Online Venue'}
                      </div>
                      {schedule.venueRoom && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {schedule.venueBuilding ? `${schedule.venueBuilding} · ` : ''}{schedule.venueRoom}
                        </div>
                      )}
                    </td>

                    {/* MODE */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        schedule.mode === 'PAPER_BASED'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : schedule.mode === 'COMPUTER_BASED'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : schedule.mode === 'ONLINE'
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {schedule.mode === 'PAPER_BASED' && '📄 Paper Based'}
                        {schedule.mode === 'COMPUTER_BASED' && '💻 Computer Based'}
                        {schedule.mode === 'ONLINE' && '🌐 Online'}
                        {schedule.mode === 'HYBRID' && '🔀 Hybrid'}
                      </span>
                    </td>

                    {/* RESULTS */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {schedule.resultsStatus || 'Not Started'}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={schedule.status} />
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <RowActions>
                        <ViewAction onClick={() => loadCandidatesForSchedule(schedule)} />
                      </RowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CANDIDATES POPUP / DRAWER ─────────────────────────────────── */}
      {activeCandidateSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Candidates — {activeCandidateSchedule.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {activeCandidateSchedule.scheduleCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled on {activeCandidateSchedule.date} at {activeCandidateSchedule.startTime} • Venue: {activeCandidateSchedule.venueCampusName || 'Exam Location'} ({activeCandidateSchedule.venueRoom || 'Room 101'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCandidateSchedule(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Filter Toolbar inside Candidates Popup */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs pointer-events-none">🔍</span>
                <input
                  type="text"
                  placeholder="Search candidate name or app no..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'SCHEDULED', 'RESCHEDULED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCandidateStatusFilter(st)}
                    className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                      candidateStatusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All Candidates' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidates Table (Internally Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingCandidates ? (
                <div className="py-12 text-center text-slate-400">Loading candidates roster...</div>
              ) : candidatesList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No candidates assigned to this schedule yet.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3.5">Application No.</th>
                        <th className="py-2.5 px-3.5">Student</th>
                        <th className="py-2.5 px-3.5">Class</th>
                        <th className="py-2.5 px-3.5">Applicant Campus</th>
                        <th className="py-2.5 px-3.5">Test Venue</th>
                        <th className="py-2.5 px-3.5">Schedule</th>
                        <th className="py-2.5 px-3.5">Status</th>
                        <th className="py-2.5 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {candidatesList.map((cand) => (
                        <tr key={cand.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {cand.applicationNumber}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-slate-100">
                            {cand.studentName}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                            {cand.className}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                            {cand.applicantCampusName}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                            {cand.venueCampusName || activeCandidateSchedule.venueCampusName} ({cand.venueRoom || activeCandidateSchedule.venueRoom})
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-200">
                            {cand.scheduledDate} · {cand.scheduledTime}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cand.status === 'RESCHEDULED'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {cand.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap space-x-1.5">
                            <Link
                              href={`/admissions/pre-admissions/${cand.preAdmissionId}`}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold"
                            >
                              View App
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setReschedulingCandidate(cand);
                                setRescheduleForm({
                                  newDate: cand.scheduledDate,
                                  newStartTime: cand.scheduledTime,
                                  newReportingTime: cand.reportingTime || '',
                                  newVenueCampusId: cand.venueCampusId || '',
                                  newVenueRoom: cand.venueRoom || '',
                                  reason: '',
                                });
                              }}
                              className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-semibold"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCandidate(cand.id, cand.studentName)}
                              className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCandidateSchedule(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESCHEDULE INDIVIDUAL CANDIDATE SUB-MODAL ──────────────────── */}
      {reschedulingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reschedule Candidate Test</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {reschedulingCandidate.studentName} ({reschedulingCandidate.applicationNumber})
                </p>
              </div>
              <button type="button" onClick={() => setReschedulingCandidate(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
              <span className="font-bold">Original Schedule:</span> {reschedulingCandidate.scheduledDate} at {reschedulingCandidate.scheduledTime} ({reschedulingCandidate.venueCampusName || 'Campus'} · {reschedulingCandidate.venueRoom || 'Room 101'})
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Test Date *</label>
                  <input
                    type="date"
                    value={rescheduleForm.newDate}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Start Time *</label>
                  <input
                    type="time"
                    value={rescheduleForm.newStartTime}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newStartTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Reporting Time (Optional)</label>
                <input
                  type="time"
                  value={rescheduleForm.newReportingTime}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, newReportingTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Rescheduling * (Preserved in Audit)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Parent requested date adjustment due to family travel or medical appointment..."
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setReschedulingCandidate(null)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReschedulingSaving}
                onClick={handleSaveReschedule}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isReschedulingSaving ? 'Saving...' : 'Confirm & Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE TEST MODAL / DRAWER (PROGRESSIVE SECTIONS) ─────────── */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {scheduleStep === 'FORM' ? 'Schedule Admission Test' : 'Confirm & Activate Schedule'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up testing sessions, select eligible applicants, and assign examination venues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {conflictWarning && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <div className="font-bold">Scheduling Conflict / Validation Error</div>
                    <div>{conflictWarning}</div>
                  </div>
                </div>
              )}

              {scheduleStep === 'FORM' ? (
                <>
                  {/* SECTION A — TEST DETAILS */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Section A — Test & Journey Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                      <div className="md:col-span-2">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Test Name *
                        </label>
                        <input
                          type="text"
                          value={scheduleForm.name}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                          placeholder="e.g. Grade 6 Entrance Test"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Academic Year *
                        </label>
                        <select
                          value={scheduleForm.academicYearId}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, academicYearId: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="ay_2026_2027">Academic Year 2026–2027</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Admission Process / Test Stage *
                        </label>
                        <select
                          value={scheduleForm.processDefinitionId}
                          onChange={(e) => {
                            const proc = availableProcesses.find((p) => p.id === e.target.value);
                            setScheduleForm({
                              ...scheduleForm,
                              processDefinitionId: e.target.value,
                              processStepId: proc?.stepId || 's_test_1',
                              mode: proc?.mode === 'HYBRID' ? 'PAPER_BASED' : (proc?.mode || 'PAPER_BASED'),
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {availableProcesses.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} → {p.stepName} ({p.mode} Mode, Pass: {p.passMarks}/{p.totalMarks})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Applying Class / Grade *
                        </label>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {classesList.map((c) => {
                            const isSelected = scheduleForm.classIds.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setScheduleForm((prev) => ({
                                    ...prev,
                                    classIds: isSelected
                                      ? prev.classIds.filter((cid) => cid !== c.id)
                                      : [...prev.classIds, c.id],
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION B — WHO IS TAKING THIS TEST? */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Section B — Candidate Assignment
                        </h3>
                      </div>
                      <div className="text-xs text-slate-500">
                        Eligible Pool: <span className="font-bold text-slate-800 dark:text-slate-200">{eligibleCandidates.length}</span> | Selected: <span className="font-bold text-indigo-600 dark:text-indigo-400">{scheduleForm.selectedCandidateIds.length}</span>
                      </div>
                    </div>

                    {/* Candidate Strategy Options */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        { key: 'SELECTED_STUDENTS', label: 'Selected Students' },
                        { key: 'CLASS_GRADE', label: 'By Class / Grade' },
                        { key: 'CAMPUS', label: 'By Campus' },
                        { key: 'ALL_ELIGIBLE_APPLICANTS', label: 'All Eligible Applicants' },
                      ].map((strat) => (
                        <button
                          key={strat.key}
                          type="button"
                          onClick={() => {
                            setScheduleForm({ ...scheduleForm, strategy: strat.key as any });
                            if (strat.key === 'ALL_ELIGIBLE_APPLICANTS') {
                              handleSelectAllMatching();
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                            scheduleForm.strategy === strat.key
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {strat.label}
                        </button>
                      ))}
                    </div>

                    {/* Candidate Selector Box */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                      {/* Search & Actions inside Selector */}
                      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 items-center justify-between bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                          <input
                            type="text"
                            placeholder="Search candidates by name, app no..."
                            value={candidateSelectorSearch}
                            onChange={(e) => setCandidateSelectorSearch(e.target.value)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex-1 max-w-sm focus:outline-none"
                          />
                          <select
                            value={candidateSelectorCampus}
                            onChange={(e) => setCandidateSelectorCampus(e.target.value)}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                          >
                            <option value="ALL">All Authorized Campuses ({availableFilterCampuses.length})</option>
                            {availableFilterCampuses.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={handleSelectAllMatching}
                            className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100"
                          >
                            Select All ({eligibleCandidates.length})
                          </button>
                          <button
                            type="button"
                            onClick={handleClearCandidateSelection}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Candidate Picker List */}
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-2">
                        {isLoadingEligible ? (
                          <div className="py-6 text-center text-xs text-slate-400">Resolving eligible candidates...</div>
                        ) : eligibleCandidates.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">No eligible candidates found matching filters.</div>
                        ) : (
                          eligibleCandidates.map((cand) => {
                            const isChecked = scheduleForm.selectedCandidateIds.includes(cand.id);
                            return (
                              <label
                                key={cand.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                  isChecked ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCandidateSelection(cand.id)}
                                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                  />
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                      {cand.studentName}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono">
                                      {cand.applicationNumber} • {cand.className} • {cand.campusName}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-1.5 flex-wrap justify-end">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {cand.reviewBadge || 'Review ✓'}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    (cand.feeBadge || '').includes('Paid')
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : (cand.feeBadge || '').includes('Test-Day')
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}>
                                    {cand.feeBadge || 'Fee ✓ Paid'}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION C — DATE, TIME & TEST MODE */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Section C — Date, Time & Test Mode
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Test Date *</label>
                        <input
                          type="date"
                          value={scheduleForm.date}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time *</label>
                        <input
                          type="time"
                          value={scheduleForm.startTime}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            const newReporting = calculateReportingTime(newStart);
                            setScheduleForm({
                              ...scheduleForm,
                              startTime: newStart,
                              reportingTime: newReporting || scheduleForm.reportingTime,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Mins) *</label>
                        <input
                          type="number"
                          value={scheduleForm.durationMinutes}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Reporting Time <span className="text-[10px] text-slate-400 font-normal">(-30m auto)</span>
                        </label>
                        <input
                          type="time"
                          value={scheduleForm.reportingTime}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, reportingTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Test Mode (Governed by Process Config)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { key: 'PAPER_BASED', label: '📄 Paper Based' },
                            { key: 'COMPUTER_BASED', label: '💻 Computer Based' },
                            { key: 'ONLINE', label: '🌐 Online' },
                            { key: 'HYBRID', label: '🔀 Hybrid' },
                          ].map((m) => (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => setScheduleForm({ ...scheduleForm, mode: m.key as any })}
                              className={`px-3 py-2 rounded-lg border text-xs font-semibold text-center transition-colors ${
                                scheduleForm.mode === m.key
                                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION D — VENUE */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Section D — Examination Venue
                      </h3>
                    </div>

                    {scheduleForm.mode === 'ONLINE' ? (
                      <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>🌐</span>
                          <span>Online Assessment Mode</span>
                        </div>
                        <p className="mt-1 text-teal-700 dark:text-teal-300">
                          Candidate access credentials, time limits, and test access configurations will be handled securely through the online assessment engine. No physical exam hall is required.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Exam Venue Campus *
                            </label>
                            <select
                              value={scheduleForm.venueCampusId}
                              onChange={(e) => {
                                const selected = getAuthorizedCampusesForWrite().find((c) => c.id === e.target.value);
                                setScheduleForm({
                                  ...scheduleForm,
                                  venueCampusId: e.target.value,
                                  venueCampusName: selected?.name || 'Selected Campus',
                                });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {getAuthorizedCampusesForWrite().map((c) => (
                                <option key={c.id} value={c.id}>{c.name} ({c.schoolName})</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Note: Applicant Campus and Venue Campus can differ.
                            </p>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Building / Wing
                            </label>
                            <input
                              type="text"
                              value={scheduleForm.venueBuilding}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, venueBuilding: e.target.value })}
                              placeholder="e.g. Academic Block B"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Room / Exam Hall *
                            </label>
                            <input
                              type="text"
                              value={scheduleForm.venueRoom}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, venueRoom: e.target.value })}
                              placeholder="e.g. Room 204 or Main Hall"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Candidate / Parent Venue Instructions
                          </label>
                          <input
                            type="text"
                            value={scheduleForm.venueInstructions}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, venueInstructions: e.target.value })}
                            placeholder="e.g. Arrive 30 minutes prior with physical admit card and stationery."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* CONFIRMATION SUMMARY SCREEN */
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                    <h3 className="font-bold text-sm">Ready to Schedule Admission Test?</h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                      Review the schedule summary below before activating and notifying candidates.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 block">Test Name</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{scheduleForm.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Assessment Stage</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Entrance Test (General K-12)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Date & Time</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {scheduleForm.date} · {scheduleForm.startTime} ({scheduleForm.durationMinutes} mins)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Candidates Assigned</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {scheduleForm.selectedCandidateIds.length} Candidates
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Test Mode</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{scheduleForm.mode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Exam Venue</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {scheduleForm.venueCampusName} · {scheduleForm.venueRoom}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              {scheduleStep === 'FORM' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSavingSchedule}
                      onClick={() => handleFinalSaveSchedule(true)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToConfirm}
                      className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      Review & Schedule ›
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setScheduleStep('FORM')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    ‹ Back to Edit
                  </button>

                  <button
                    type="button"
                    disabled={isSavingSchedule}
                    onClick={() => handleFinalSaveSchedule(false)}
                    className="px-6 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                  >
                    {isSavingSchedule ? 'Activating Schedule...' : 'Confirm & Schedule Test'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
