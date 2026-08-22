'use client';

import React, { useState } from 'react';

interface HierarchyNodeItem {
  id: string;
  code: string;
  name: string;
  type: string;
  path: string;
  children?: HierarchyNodeItem[];
}

export default function HierarchyBuilderPage() {
  const [nodes] = useState<HierarchyNodeItem[]>([
    {
      id: '1',
      code: 'HO',
      name: 'Head Office & Directorate',
      type: 'Head Office',
      path: 'root.ho',
      children: [
        {
          id: '2',
          code: 'REGION_SOUTH',
          name: 'Southern Regional Directorate',
          type: 'Region',
          path: 'root.ho.south',
          children: [
            {
              id: '3',
              code: 'CAMPUS_ALPHA',
              name: 'Campus Alpha (Main Campus)',
              type: 'Campus',
              path: 'root.ho.south.alpha',
            },
            {
              id: '4',
              code: 'CAMPUS_BETA',
              name: 'Campus Beta (City Campus)',
              type: 'Campus',
              path: 'root.ho.south.beta',
            },
          ],
        },
      ],
    },
  ]);

  const [selectedNode, setSelectedNode] = useState<HierarchyNodeItem | null>(nodes[0] ?? null);

  const renderTree = (items: HierarchyNodeItem[]) => {
    return (
      <ul className="space-y-1 pl-4 border-l border-slate-200 dark:border-slate-800">
        {items.map((node) => (
          <li key={node.id} className="pt-1">
            <div
              onClick={() => setSelectedNode(node)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                selectedNode?.id === node.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>📁</span>
              <span>{node.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{node.type}</span>
            </div>
            {node.children && node.children.length > 0 && renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Visual Hierarchy Tree Builder</h1>
          <p className="text-sm text-slate-500">
            Configure arbitrary multi-level organizational structures (Head Office, Regions, Campuses, Departments) with PostgreSQL <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ltree</code> paths.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Export Schema
          </button>
          <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors">
            + New Hierarchy Tier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hierarchy Tree Canvas */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-semibold text-sm">Organization Structure Tree</h3>
            <button className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
              + Add Child Node
            </button>
          </div>
          {renderTree(nodes)}
        </div>

        {/* Node Inspector */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">Node Properties</h3>
          {selectedNode ? (
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-500 font-medium">Node Code</label>
                <div className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded">{selectedNode.code}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Display Name</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => setSelectedNode({ ...selectedNode, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Hierarchical ltree Path</label>
                <div className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-900 p-2 rounded">
                  {selectedNode.path}
                </div>
              </div>
              <div className="pt-2">
                <button className="w-full py-2 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select a node from the tree to inspect.</p>
          )}
        </div>
      </div>
    </div>
  );
}
