'use client';

import React, { useState } from 'react';
import { FormSchemaAST, FormRule } from '@campus-os/types';
import { DynamicFormRenderer } from '../../../../components/DynamicFormRenderer';

export default function FormBuilderPage() {
  const [schemaAst] = useState<FormSchemaAST>({
    layout: 'single_page',
    tabs: [
      {
        id: 'tab_admission',
        title: 'Student Admission',
        sections: [
          {
            id: 'sec_personal',
            title: 'Personal Information',
            columns: 2,
            controls: [
              { id: 'c1', fieldCode: 'first_name', label: 'First Name', controlType: 'text_input', colSpan: 1 },
              { id: 'c2', fieldCode: 'last_name', label: 'Last Name', controlType: 'text_input', colSpan: 1 },
              { id: 'c3', fieldCode: 'age', label: 'Age', controlType: 'number_input', colSpan: 1 },
              { id: 'c4', fieldCode: 'requires_hostel', label: 'Requires Hostel Accommodation?', controlType: 'switch', colSpan: 1 },
              { id: 'c5', fieldCode: 'hostel_room_no', label: 'Hostel Room Preference', controlType: 'text_input', colSpan: 2 },
            ],
          },
        ],
      },
    ],
  });

  const [rules] = useState<FormRule[]>([
    {
      id: 'r1',
      type: 'SHOW_IF',
      targetFieldCode: 'hostel_room_no',
      condition: {
        field: 'requires_hostel',
        operator: 'EQUALS',
        value: true,
      },
    },
  ]);

  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visual Form Builder & Compiler</h2>
          <p className="text-sm text-slate-500">
            Construct versioned, multi-tab form ASTs with dynamic evaluation rules and interactive runtime preview.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            Save Draft
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
            Publish (v1)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: AST & Rules Canvas */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm">Form Controls Canvas</h3>
            <div className="space-y-2">
              {schemaAst.tabs[0]?.sections[0]?.controls.map((ctrl) => (
                <div
                  key={ctrl.id}
                  className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">⠿</span>
                    <div>
                      <span className="font-medium">{ctrl.label}</span>
                      <span className="ml-2 text-xs font-mono text-slate-500">({ctrl.fieldCode})</span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">
                    {ctrl.controlType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm">Conditional AST Rules</h3>
            {rules.map((rule) => (
              <div key={rule.id} className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded border border-blue-100 dark:border-blue-900 text-xs">
                <span className="font-bold text-blue-600 dark:text-blue-400">{rule.type}</span> on field{' '}
                <span className="font-mono font-semibold">{rule.targetFieldCode}</span> when{' '}
                <span className="font-mono">requires_hostel === true</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Interactive Runtime Preview */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-sm">Interactive Runtime Preview</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
              Live Evaluation
            </span>
          </div>

          <DynamicFormRenderer
            schema={schemaAst}
            rules={rules}
            onSubmit={(vals) => setSubmittedData(vals)}
            submitLabel="Test Submit Form"
          />

          {submittedData && (
            <div className="mt-4 p-4 rounded bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
              <div className="text-slate-400 mb-1">// Form Payload Evaluated:</div>
              {JSON.stringify(submittedData, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
