'use client';

import React, { useState, useMemo } from 'react';
import { SchoolListItemDto } from '@campus-os/types';

export interface SchoolBranchItem {
  id: string;
  name: string;
  code: string;
  city?: string;
  area?: string;
  principalName?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface SchoolBranchesDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolListItemDto | null;
  branches?: SchoolBranchItem[];
}

export function SchoolBranchesDetailsModal({
  isOpen,
  onClose,
  school,
  branches,
}: SchoolBranchesDetailsModalProps) {
  const [search, setSearch] = useState('');

  // Sample realistic branch data mapped to school if none provided
  const resolvedBranches: SchoolBranchItem[] = useMemo(() => {
    if (branches && branches.length > 0) return branches;
    if (!school) return [];

    if (school.code === 'SCH_KHI_01' || school.name.includes('Beacon Horizon')) {
      return [
        { id: 'b-1', name: 'Main Campus (Gulshan)', code: 'BR_KHI_01', city: 'Karachi', area: 'Gulshan-e-Iqbal Block 6', principalName: 'Prof. Tariq Mehmood', status: 'ACTIVE' },
        { id: 'b-2', name: 'North Nazimabad Campus', code: 'BR_KHI_02', city: 'Karachi', area: 'Block D, North Nazimabad', principalName: 'Ms. Shahida Parveen', status: 'ACTIVE' },
        { id: 'b-3', name: 'DHA Phase 6 Campus', code: 'BR_KHI_03', city: 'Karachi', area: 'Khayaban-e-Shahbaz, Phase 6', principalName: 'Mr. Adnan Siddiqui', status: 'INACTIVE' },
      ];
    } else if (school.name.includes('City Grammar')) {
      return [
        { id: 'b-4', name: 'PECHS Senior Campus', code: 'BR_PECHS_01', city: 'Karachi', area: 'PECHS Block 2', principalName: 'Mrs. Nighat Sultana', status: 'ACTIVE' },
        { id: 'b-5', name: 'Clifton Junior Campus', code: 'BR_CLF_01', city: 'Karachi', area: 'Clifton Block 4', principalName: 'Mr. Kamran Aslam', status: 'ACTIVE' },
      ];
    } else {
      return [
        { id: 'b-def-1', name: `${school.name} - Main Campus`, code: `${school.code}_MAIN`, city: school.city || 'Main City', principalName: school.principalName || 'Campus Head', status: school.isActive ? 'ACTIVE' : 'INACTIVE' },
        { id: 'b-def-2', name: `${school.name} - City Campus`, code: `${school.code}_CITY`, city: school.city || 'Main City', principalName: 'Vice Principal', status: 'ACTIVE' },
      ];
    }
  }, [school, branches]);

  const filteredBranches = useMemo(() => {
    if (!search.trim()) return resolvedBranches;
    const q = search.toLowerCase();
    return resolvedBranches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.area && b.area.toLowerCase().includes(q)) ||
        (b.principalName && b.principalName.toLowerCase().includes(q))
    );
  }, [resolvedBranches, search]);

  if (!isOpen || !school) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col justify-between animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🏢</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Branches / Campuses ({resolvedBranches.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <strong className="text-slate-800 dark:text-slate-200">{school.name}</strong> ({school.code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Optional Search if > 3 branches */}
        {resolvedBranches.length > 3 && (
          <div className="relative shrink-0">
            <span className="absolute left-3 top-2 text-xs text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search branch or campus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Branch List (Scrollable area) */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
          {filteredBranches.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching branches found.
            </div>
          ) : (
            filteredBranches.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
              >
                <div className="min-w-0 mr-2 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      📍 {b.name}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300">
                      {b.code}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    {b.city && <span>📍 {b.area ? `${b.area}, ${b.city}` : b.city}</span>}
                    {b.principalName && (
                      <>
                        <span>•</span>
                        <span>👤 {b.principalName}</span>
                      </>
                    )}
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    b.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {b.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
