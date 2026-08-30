'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Building2,
  MapPin,
  School,
  GitBranch,
  Search,
  ChevronDown,
  Check,
  Clock,
  Command,
} from 'lucide-react';
import { useWorkingContext, WorkingContextNodeType } from '../lib/working-context';

export function WorkingContextPicker() {
  const { currentContext, availableNodes, switchContext } = useWorkingContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return availableNodes;
    const q = search.toLowerCase();
    return availableNodes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [search, availableNodes]);

  const grouped = useMemo(() => {
    return {
      recent: [availableNodes.find((n) => n.id === 'cmp_clifton')!, availableNodes.find((n) => n.id === 'cmp_dha')!].filter(Boolean),
      headOffice: filtered.filter((c) => c.type === 'HEAD_OFFICE'),
      region: filtered.filter((c) => c.type === 'REGION'),
      school: filtered.filter((c) => c.type === 'SCHOOL'),
      campus: filtered.filter((c) => c.type === 'CAMPUS'),
    };
  }, [filtered, availableNodes]);

  const renderTypeIcon = (type: WorkingContextNodeType, className = 'w-3.5 h-3.5') => {
    switch (type) {
      case 'HEAD_OFFICE':
        return <Building2 className={`${className} text-blue-600 dark:text-blue-400`} />;
      case 'REGION':
        return <MapPin className={`${className} text-emerald-600 dark:text-emerald-400`} />;
      case 'SCHOOL':
        return <School className={`${className} text-amber-600 dark:text-amber-400`} />;
      case 'CAMPUS':
        return <GitBranch className={`${className} text-sky-600 dark:text-sky-400`} />;
    }
  };

  const handleSelect = (nodeId: string) => {
    switchContext(nodeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Executive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 text-left transition-all cursor-pointer shadow-2xs group"
        title="Switch Global Working Context"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-900/60">
          {renderTypeIcon(currentContext.type, 'w-3.5 h-3.5')}
        </div>

        <div className="flex flex-col text-left max-w-[170px] truncate leading-tight">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {currentContext.name}
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {currentContext.subtitle || 'Active Scope'}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ml-0.5" />
      </button>

      {/* Command-Palette Style Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-[340px] sm:w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-120">
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                <Command className="w-3 h-3" />
                <span>Switch Working Context</span>
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded-md">
                Global Scope
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search head office, region, school, or campus..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* List of Contexts */}
          <div className="max-h-[320px] overflow-y-auto p-2 space-y-3 scrollbar-thin text-xs">
            {/* RECENT (only when search is empty) */}
            {!search && grouped.recent.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Recent</span>
                </div>
                {grouped.recent.map((item) => (
                  <button
                    key={`rec_${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      currentContext.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-bold'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderTypeIcon(item.type)}
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    {currentContext.id === item.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* HEAD OFFICES */}
            {grouped.headOffice.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Head Office (Consolidated)
                </div>
                {grouped.headOffice.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      currentContext.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-bold'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderTypeIcon(item.type)}
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    {currentContext.id === item.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* REGIONS */}
            {grouped.region.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Regional Offices
                </div>
                {grouped.region.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      currentContext.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-bold'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderTypeIcon(item.type)}
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    {currentContext.id === item.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* SCHOOLS */}
            {grouped.school.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Schools / Institutions
                </div>
                {grouped.school.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      currentContext.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-bold'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderTypeIcon(item.type)}
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    {currentContext.id === item.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* CAMPUSES */}
            {grouped.campus.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Campuses / Branches (Exact Scope)
                </div>
                {grouped.campus.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      currentContext.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-bold'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderTypeIcon(item.type)}
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    {currentContext.id === item.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
