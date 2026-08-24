'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  PreAdmissionApplicationDto,
  PreAdmissionStatus,
  PreAdmissionSource,
  AdmissionDecisionOutcome,
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FORM' | 'JOURNEY' | 'ASSESSMENT' | 'INTERVIEW' | 'PAYMENTS' | 'ACTIVITY'>('OVERVIEW');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState('proc_general_k12');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState<AdmissionDecisionOutcome>('APPROVED');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(2500);
  const [paymentType, setPaymentType] = useState<'APPLICATION_FEE' | 'ADMISSION_FEE'>('APPLICATION_FEE');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

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

  useEffect(() => {
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
        setFeedbackMsg(`Admission Process assigned! Journey advanced to first step.`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (e) {
      alert('Failed to assign process.');
    }
  };

  const handleRecordDecision = async () => {
    if (!application) return;
    try {
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${application.id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ outcome: decisionOutcome, remarks: decisionNotes }),
      });

      if (res.ok) {
        const updated = await res.json();
        setApplication(updated);
        setShowDecisionModal(false);
        setFeedbackMsg(`Decision "${decisionOutcome}" recorded successfully!`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (e) {
      alert('Failed to record decision.');
    }
  };

  const handleRecordPayment = async () => {
    if (!application) return;
    try {
      const res = await fetch(`http://localhost:4000/admissions/pre-admissions/${application.id}/fee-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ feeType: paymentType, amount: paymentAmount, method: 'ONLINE_GATEWAY' }),
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setFeedbackMsg(`Payment of PKR ${paymentAmount.toLocaleString()} recorded successfully!`);
        setTimeout(() => setFeedbackMsg(null), 4000);
        fetchDetail();
      }
    } catch (e) {
      alert('Failed to record payment.');
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
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {application.studentName}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sourceBadge.bg} flex items-center gap-1`}>
              <span>{sourceBadge.icon}</span>
              <span>{sourceBadge.label}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Applying for <span className="font-bold text-slate-700 dark:text-slate-300">{application.className}</span> at{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">{application.campusName}</span> ({application.schoolName})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>💰</span>
            <span>Record Payment</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDecisionModal(true)}
            className="px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>⚖️</span>
            <span>Record Decision</span>
          </button>

          {!application.processDefinitionId && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Assign Process</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>✓</span>
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: '📋' },
          { id: 'FORM', label: 'Submitted Form', icon: '📄' },
          { id: 'JOURNEY', label: 'Journey & Steps', icon: '⚡' },
          { id: 'ASSESSMENT', label: 'Test & Assessment', icon: '📝' },
          { id: 'INTERVIEW', label: 'Interview', icon: '👥' },
          { id: 'PAYMENTS', label: 'Payments & Fees', icon: '💰' },
          { id: 'ACTIVITY', label: 'Activity Log', icon: '📜' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Application Information</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Application No.</span>
                  <span className="font-mono font-bold text-indigo-600">{application.applicationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Form Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{application.formName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Submitted On</span>
                  <span className="font-semibold text-slate-700">{new Date(application.submittedAt).toLocaleDateString('en-GB')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Father / Guardian</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{application.fatherOrGuardianName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Primary Mobile</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{application.primaryMobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Primary Email</span>
                  <span className="text-slate-700">{application.primaryEmail || '—'}</span>
                </div>
              </div>
            </div>

            {/* Assessment & Status Summary Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Operational Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Test Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{application.testDate || 'Not Scheduled'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Test Result</span>
                  <span className="font-bold text-indigo-600">{application.testResult || '—'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Interview</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{application.interviewStatus || 'Pending'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Payment Status</span>
                  <span className="font-bold text-emerald-600">{application.feeStatus || 'UNPAID'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Journey Step Tracker */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Journey Progress</h2>
              {application.processName && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  v{application.processVersionNumber}
                </span>
              )}
            </div>

            {application.journey ? (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{application.processName}</span>
                <div className="space-y-2">
                  {application.journey.steps.map((st, i) => (
                    <div
                      key={st.stepId}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        st.state === 'CURRENT'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 font-bold text-indigo-900 dark:text-indigo-200'
                          : st.state === 'COMPLETED'
                          ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{i + 1}.</span>
                        <span>{st.displayName}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold">
                        {st.state === 'CURRENT' ? 'Active' : st.state === 'COMPLETED' ? 'Done' : 'Upcoming'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No Admission Process assigned. This record is currently in Data Collection Only mode.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'FORM' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Submitted Form Data (v{application.formVersionNumber})</h2>
              <p className="text-xs text-slate-400">Complete submitted form responses snapshot.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
              Read-Only Snapshot
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Student Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{application.studentName}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Date of Birth</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{application.dateOfBirth}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Gender</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{application.gender}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Father / Guardian</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{application.fatherOrGuardianName}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Primary Mobile</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{application.primaryMobile}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Previous School</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{application.submissionData?.previousSchool || 'Kindergarten Academy'}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'JOURNEY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Admission Journey Sequence</h2>
          {application.journey ? (
            <div className="space-y-3">
              {application.journey.steps.map((st, i) => (
                <div key={st.stepId} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 text-xs">{i + 1}.</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{st.displayName}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-semibold">{st.stepType}</span>
                    </div>
                    {st.attachedFormName && (
                      <p className="text-[11px] text-slate-400 pl-4">📄 Attached Form: {st.attachedFormName}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.state === 'CURRENT' ? 'bg-indigo-100 text-indigo-700' : st.state === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {st.state}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No journey active.</p>
          )}
        </div>
      )}

      {activeTab === 'ASSESSMENT' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Assessment & Test Management</h2>
              <p className="text-xs text-slate-400">Candidate examination scheduling and score recording.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              {application.testStatus || 'NOT_SCHEDULED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Scheduled Test Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{application.testDate || 'Pending Assignment'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Venue / Room</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Main Hall / Room 204</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Recorded Outcome</span>
              <span className="font-bold text-indigo-600">{application.testResult || 'Awaiting Test'}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'INTERVIEW' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Interview Schedule & Evaluation</h2>
              <p className="text-xs text-slate-400">Interaction with student & parent panel.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
              {application.interviewStatus || 'NOT_SCHEDULED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Interview Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{application.interviewDate || 'Pending Assignment'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Interviewer</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Dr. Tariq Mehmood (Principal)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Status</span>
              <span className="font-bold text-emerald-600">{application.interviewStatus || 'Pending'}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PAYMENTS' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Fees & Payments</h2>
              <p className="text-xs text-slate-400">Tracking application processing and admission security deposits.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              {application.feeStatus || 'UNPAID'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">Registration Fee (Application Fee)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">PKR 2,500</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>Payment Mode: Online Gateway / Counter</span>
              <span>Status: <strong className="text-emerald-600">{application.feeStatus || 'UNPAID'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ACTIVITY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Audit & Activity Log</h2>
          <div className="space-y-3 text-xs">
            {(application.auditEvents || []).map((ev) => (
              <div key={ev.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{ev.description}</span>
                  <span className="text-[10px] text-slate-400">Actor: {ev.actor}</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">
                  {new Date(ev.timestamp).toLocaleString('en-GB')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: ASSIGN ADMISSION PROCESS ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Admission Process</h3>
                <p className="text-xs text-slate-400">Select an active journey for this applicant.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Admission Process *
                </label>
                <select
                  value={selectedProcessId}
                  onChange={(e) => setSelectedProcessId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <option value="proc_general_k12">General Admission Process (v1)</option>
                  <option value="proc_simple_adm">Simple Direct Admission (v1)</option>
                  <option value="proc_alevel_detailed">A-Level Comprehensive Track (v1)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignProcess}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD ADMISSION DECISION ── */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Admission Decision</h3>
                <p className="text-xs text-slate-400">Formal committee outcome for this candidate.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDecisionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Decision Outcome *
                </label>
                <select
                  value={decisionOutcome}
                  onChange={(e) => setDecisionOutcome(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <option value="APPROVED">✅ Approved (Offer Admission)</option>
                  <option value="APPROVED_WITH_CONDITION">⚠️ Approved with Condition</option>
                  <option value="WAITING_LIST">⏳ Waiting List</option>
                  <option value="ON_HOLD">⏸️ On Hold</option>
                  <option value="REJECTED">❌ Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Committee Notes / Rationale
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter committee comments or admission terms..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordDecision}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD PAYMENT ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Fee Payment</h3>
                <p className="text-xs text-slate-400">Collect application or admission fee.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Fee Type *
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <option value="APPLICATION_FEE">Registration / Application Fee (PKR 2,500)</option>
                  <option value="ADMISSION_FEE">Final Admission Deposit (PKR 25,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Amount Paid (PKR) *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-sm cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
