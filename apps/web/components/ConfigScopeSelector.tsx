'use client';

import React, { useEffect, useState } from 'react';
import { ConfigScopeType } from '@campus-os/types';

export interface BranchOption {
  id: string;
  name: string;
  code?: string;
}

interface ConfigScopeSelectorProps {
  applyTo: ConfigScopeType;
  onChangeApplyTo: (applyTo: ConfigScopeType) => void;
  selectedBranchIds: string[];
  onChangeBranchIds: (branchIds: string[]) => void;
  availableBranches?: BranchOption[];
  disabled?: boolean;
}

export function ConfigScopeSelector({
  applyTo,
  onChangeApplyTo,
  selectedBranchIds,
  onChangeBranchIds,
  availableBranches = [],
  disabled = false,
}: ConfigScopeSelectorProps) {
  const [branches, setBranches] = useState<BranchOption[]>(availableBranches);

  // If availableBranches is empty, optionally fetch from backend
  useEffect(() => {
    if (availableBranches.length > 0) {
      setBranches(availableBranches);
      return;
    }

    fetch('http://localhost:4000/branches', {
      headers: {
        'x-tenant-id': '11111111-1111-1111-1111-111111111111',
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(
            data.map((b: any) => ({
              id: b.id,
              name: b.name,
              code: b.code,
            }))
          );
        }
      })
      .catch(() => {
        // Fallback default sample branches if offline/mock
        setBranches([
          { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Main Campus (Gulshan)', code: 'CAMPUS-A' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Clifton Campus', code: 'CAMPUS-B' },
          { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'DHA Phase 8 Campus', code: 'CAMPUS-C' },
        ]);
      });
  }, [availableBranches]);

  const handleToggleBranch = (branchId: string) => {
    if (selectedBranchIds.includes(branchId)) {
      onChangeBranchIds(selectedBranchIds.filter((id) => id !== branchId));
    } else {
      onChangeBranchIds([...selectedBranchIds, branchId]);
    }
  };

  const handleSelectAll = () => {
    onChangeBranchIds(branches.map((b) => b.id));
  };

  const handleClearAll = () => {
    onChangeBranchIds([]);
  };

  return (
    <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Campus Applicability / Scope *
        </label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Determine whether this configuration automatically applies to all campuses or specific branch locations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Option 1: All Campuses */}
        <label
          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
            applyTo === 'ALL_CAMPUSES'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name="applyToScope"
            value="ALL_CAMPUSES"
            checked={applyTo === 'ALL_CAMPUSES'}
            onChange={() => onChangeApplyTo('ALL_CAMPUSES')}
            disabled={disabled}
            className="mt-0.5 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
              🌐 All Campuses
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Applies dynamically across the entire organization. Any future branch created will automatically inherit this.
            </p>
          </div>
        </label>

        {/* Option 2: Selected Campuses */}
        <label
          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
            applyTo === 'SELECTED_CAMPUSES'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name="applyToScope"
            value="SELECTED_CAMPUSES"
            checked={applyTo === 'SELECTED_CAMPUSES'}
            onChange={() => onChangeApplyTo('SELECTED_CAMPUSES')}
            disabled={disabled}
            className="mt-0.5 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
              📍 Selected Campuses Only
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Restricts this configuration to designated branch campuses.
            </p>
          </div>
        </label>
      </div>

      {/* Branch Selection List (Visible when SELECTED_CAMPUSES) */}
      {applyTo === 'SELECTED_CAMPUSES' && (
        <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Select Campuses ({selectedBranchIds.length} of {branches.length} selected):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={disabled}
                className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={disabled}
                className="text-[10px] font-semibold text-slate-500 hover:text-rose-500 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {branches.map((branch) => {
              const isChecked = selectedBranchIds.includes(branch.id);
              return (
                <label
                  key={branch.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 font-semibold text-indigo-900 dark:text-indigo-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleBranch(branch.id)}
                      disabled={disabled}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="truncate">{branch.name}</span>
                  </div>
                  {branch.code && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 ml-1 flex-shrink-0">
                      {branch.code}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {selectedBranchIds.length === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Please select at least one campus, or choose 'All Campuses'.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
