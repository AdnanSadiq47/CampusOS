'use client';

import React, { useState } from 'react';

interface FieldItem {
  id: string;
  code: string;
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
}

export default function EntityBuilderPage() {
  const [entities] = useState([
    { id: '1', code: 'course', name: 'Course Catalog', count: 12 },
    { id: '2', code: 'hostel_room', name: 'Hostel Room', count: 48 },
    { id: '3', code: 'transport_route', name: 'Transport Route', count: 6 },
  ]);

  const [selectedEntity, setSelectedEntity] = useState(entities[0]);
  const [fields] = useState<FieldItem[]>([
    { id: 'f1', code: 'code', name: 'Course Code', type: 'TEXT', required: true, unique: true },
    { id: 'f2', code: 'title', name: 'Course Title', type: 'TEXT', required: true, unique: false },
    { id: 'f3', code: 'credit_hours', name: 'Credit Hours', type: 'NUMBER', required: true, unique: false },
    { id: 'f4', code: 'is_active', name: 'Active Status', type: 'BOOLEAN', required: true, unique: false },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-400">CampusOS / Platform Builders</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Interactive Builder Studio
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dynamic Entity & Virtual ORM Builder</h1>
          <p className="text-sm text-slate-500">
            Define custom data models, polymorphic attributes, and relational integrity rules without touching database DDL.
          </p>
        </div>
        <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
          + Create New Entity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Entities Sidebar */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2">
          <h3 className="font-semibold text-xs uppercase text-slate-400 px-2">Entities</h3>
          {entities.map((ent) => (
            <div
              key={ent.id}
              onClick={() => setSelectedEntity(ent)}
              className={`p-3 rounded-lg cursor-pointer text-sm transition-colors ${
                selectedEntity?.id === ent.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="font-medium">{ent.name}</div>
              <div className="text-xs text-slate-500 font-mono">{ent.code}</div>
            </div>
          ))}
        </div>

        {/* Fields Editor Canvas */}
        <div className="md:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedEntity?.name} Fields</h3>
              <p className="text-xs text-slate-500 font-mono">Entity Code: {selectedEntity?.code}</p>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
              + Add Field
            </button>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
                <th className="pb-2">Field Name</th>
                <th className="pb-2">Field Code</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Required</th>
                <th className="pb-2">Unique</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fields.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="py-3 font-medium">{f.name}</td>
                  <td className="py-3 font-mono text-xs text-slate-500">{f.code}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-semibold">
                      {f.type}
                    </span>
                  </td>
                  <td className="py-3">{f.required ? '✅' : '—'}</td>
                  <td className="py-3">{f.unique ? '🔒' : '—'}</td>
                  <td className="py-3 text-right">
                    <button className="text-xs text-blue-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
