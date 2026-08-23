'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  PreAdmissionApplicationDto,
  PreAdmissionStatus,
  PreAdmissionSource,
} from '@campus-os/types';

// Status badge styling helper
function getStatusBadge(status: PreAdmissionStatus) {
  switch (status) {
    case 'SUBMITTED':
      return { label: 'Submitted', bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200' };
    case 'ON_HOLD':
      return { label: 'On Hold', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200' };
    case 'APPROVED':
      return { label: 'Approved', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200' };
    case 'COMPLETED':
      return { label: 'Completed', bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200' };
    case 'REJECTED':
      return { label: 'Rejected', bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200' };
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

// Source badge helper
function getSourceBadge(source: PreAdmissionSource) {
  switch (source) {
    case 'ONLINE':
      return { label: 'Online', icon: '🌐', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'STAFF_ENTRY':
      return { label: 'Staff Entry', icon: '👤', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'WALK_IN':
      return { label: 'Walk-in', icon: '🚶', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'IMPORT':
      return { label: 'Import', icon: '📥', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    default:
      return { label: source, icon: '📋', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export default function PreAdmissionDetailPage() {
  const params = useParams();
  const id = String(params.id || 'preadm_pa_2026_00125');

  const [application, setApplication] = useState<PreAdmissionApplicationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState('proc_general_k12');
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${id}`, {
          headers: {
            'x-tenant-id': '11111111-1111-1111-1111-111111111111',
            'x-user-role': 'ADMIN',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setApplication(data);
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleAssignProcess = async () => {
    if (!application) return;
    try {
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${application.id}/assign-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ processDefinitionId: selectedProcessId }),
      });

      if (res.ok) {
        const updated = await res.json();
        setApplication(updated);
        setShowAssignModal(false);
        setAssignSuccessMsg(`Admission Process assigned! Journey advanced to first step.`);
        setTimeout(() => setAssignSuccessMsg(null), 4000);
      }
    } catch (e) {
      alert('Failed to assign process.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading Pre-Admission details...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-20 text-center space-y-3">
        <span className="text-3xl block">⚠️</span>
        <h2 className="text-base font-bold text-slate-800 dark:text-white">Pre-Admission Record Not Found</h2>
        <Link href="/admissions/pre-admissions" className="text-xs text-indigo-600 font-bold hover:underline">
          ← Back to Pre-Admissions List
        </Link>
      </div>
    );
  }

  const statusBadge = getStatusBadge(application.status);
  const sourceBadge = getSourceBadge(application.source);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <Link href="/admissions/pre-admissions" className="hover:text-indigo-600">
              ← Pre-Admissions
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-indigo-600">{application.applicationNumber}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {application.studentName}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${sourceBadge.bg}`}>
              <span>{sourceBadge.icon}</span>
              <span>{sourceBadge.label}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Link
            href="/admissions/pre-admissions"
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            ← Back to List
          </Link>
          {!application.processDefinitionId && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              + Assign Process
            </button>
          )}
        </div>
      </div>

      {/* Success Alert */}
      {assignSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>✓</span>
          <span>{assignSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Details & Form, Right Journey & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Summary & Submitted Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION A: APPLICATION SUMMARY */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              A. Application Summary
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Application No.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {application.applicationNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Form Used</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {application.formName} (v{application.formVersionNumber})
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Applied On</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(application.submittedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Applying Class</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {application.className}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">School & Campus</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.campusName}
                </span>
                <span className="text-[10px] text-slate-400 block">{application.schoolName}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Academic Year</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {application.academicYearName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Father / Guardian</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.fatherOrGuardianName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Primary Mobile</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {application.primaryMobile}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.primaryEmail || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION B: SUBMITTED FORM SNAPSHOT */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                B. Submitted Form Snapshot (v{application.formVersionNumber} Read-Only)
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Immutable Version Link</span>
            </div>

            {/* Structured Read-Only Fields */}
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                  Student Basic Information
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Student Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{application.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Gender</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{application.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Date of Birth</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{application.dateOfBirth}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                  Guardian & Previous Record
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Father / Guardian</span>
                    <span className="font-bold text-slate-900 dark:text-white">{application.fatherOrGuardianName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Contact Mobile</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{application.primaryMobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Previous School</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {application.submissionData?.previousSchool || 'Kindergarten Academy'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              {application.customFieldsData && Object.keys(application.customFieldsData).length > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-[11px] uppercase tracking-wider">
                    Custom / School-Defined Fields
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    {Object.entries(application.customFieldsData).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-slate-400 capitalize block">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Journey Progress & Activity Log */}
        <div className="space-y-6">
          {/* SECTION C: ADMISSION JOURNEY */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                C. Admission Journey
              </h2>
              {application.processName && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  v{application.processVersionNumber}
                </span>
              )}
            </div>

            {application.journey && application.journey.steps.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  {application.processName}
                </p>

                <div className="space-y-2 text-xs">
                  {application.journey.steps.map((step) => (
                    <div key={step.stepId} className="flex items-start gap-2.5">
                      {/* Step Indicator Dot / Icon */}
                      <div className="mt-0.5">
                        {step.state === 'COMPLETED' ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        ) : step.state === 'CURRENT' ? (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-indigo-100 dark:ring-indigo-950 animate-pulse">
                            ●
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                            ○
                          </div>
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${
                              step.state === 'CURRENT'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : step.state === 'COMPLETED'
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.displayName}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              step.state === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : step.state === 'CURRENT'
                                ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {step.state}
                          </span>
                        </div>
                        {step.attachedFormName && (
                          <span className="text-[10px] text-slate-400 block">
                            📄 {step.attachedFormName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  No Admission Process Assigned
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  This application was saved as Pre-Admission data intake only. You can assign an active admission journey whenever ready.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Assign Process
                </button>
              </div>
            )}
          </div>

          {/* SECTION D: ACTIVITY / AUDIT LOG */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              D. Activity & Audit Log
            </h2>

            <div className="space-y-3 text-xs">
              {application.auditEvents?.map((evt) => (
                <div key={evt.id} className="space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      {evt.eventType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{evt.description}</p>
                  <span className="text-[10px] text-slate-400 italic">By: {evt.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ASSIGN PROCESS MODAL ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Admission Process</h3>
              <p className="text-xs text-slate-400">Select an active process for {application.studentName}.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Active Process
                </label>
                <select
                  value={selectedProcessId}
                  onChange={(e) => setSelectedProcessId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <option value="proc_general_k12">General Admission Process (4 Steps)</option>
                  <option value="proc_simple_adm">Simple Direct Admission (3 Steps)</option>
                  <option value="proc_alevel_detailed">A-Level Comprehensive Track (8 Steps)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400">
                Assigning will advance the applicant past the initial pre-admission stage to the first actionable step.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignProcess}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
              >
                Assign & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
