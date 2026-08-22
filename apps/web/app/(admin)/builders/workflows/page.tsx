'use client';

import React, { useState } from 'react';

interface WorkflowStateItem {
  id: string;
  code: string;
  name: string;
  type: string;
  color: string;
}

interface WorkflowTransitionItem {
  id: string;
  actionName: string;
  from: string;
  to: string;
  roles: string[];
}

export default function WorkflowBuilderPage() {
  const [states] = useState<WorkflowStateItem[]>([
    { id: 's1', code: 'SUBMITTED', name: 'Application Submitted', type: 'INITIAL', color: 'bg-blue-500' },
    { id: 's2', code: 'UNDER_REVIEW', name: 'Under Verification', type: 'INTERMEDIATE', color: 'bg-amber-500' },
    { id: 's3', code: 'APPROVED', name: 'Admitted / Approved', type: 'TERMINAL', color: 'bg-emerald-500' },
    { id: 's4', code: 'REJECTED', name: 'Application Rejected', type: 'TERMINAL', color: 'bg-rose-500' },
  ]);

  const [transitions] = useState<WorkflowTransitionItem[]>([
    { id: 't1', actionName: 'Start Verification', from: 'SUBMITTED', to: 'UNDER_REVIEW', roles: ['REGISTRAR'] },
    { id: 't2', actionName: 'Approve Admission', from: 'UNDER_REVIEW', to: 'APPROVED', roles: ['CAMPUS_PRINCIPAL', 'DIRECTOR'] },
    { id: 't3', actionName: 'Reject Admission', from: 'UNDER_REVIEW', to: 'REJECTED', roles: ['REGISTRAR', 'DIRECTOR'] },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visual Workflow FSM & Approval Builder</h2>
          <p className="text-sm text-slate-500">
            Design directed finite state transitions, role approval gates, automated triggers, and immutable audit trails.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
          + Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* States Flow Canvas */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-6">
          <h3 className="font-semibold text-sm">State Transition Graph</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {states.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center space-y-1 shadow-sm"
              >
                <div className={`w-3 h-3 rounded-full ${st.color} mx-auto mb-2`} />
                <div className="font-bold text-xs">{st.name}</div>
                <div className="font-mono text-[10px] text-slate-400">{st.code}</div>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {st.type}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase text-slate-400">Configured Transitions & Guards</h4>
            <div className="space-y-2">
              {transitions.map((tr) => (
                <div
                  key={tr.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{tr.actionName}</span>
                    <span className="text-xs text-slate-400">
                      ({tr.from} → {tr.to})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 mr-2">Roles:</span>
                    {tr.roles.map((r) => (
                      <span key={r} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transition Inspector */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
            Transition Configuration
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-slate-500 font-medium">Action Trigger Name</label>
              <input
                type="text"
                defaultValue="Approve Admission"
                className="w-full text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">From State</label>
              <div className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded">UNDER_REVIEW</div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">To State</label>
              <div className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded">APPROVED</div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Required Roles Guard</label>
              <div className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded text-blue-600">
                CAMPUS_PRINCIPAL, DIRECTOR
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
