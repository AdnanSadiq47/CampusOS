'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Search,
  Building2,
  School,
  Globe,
  MapPin,
  Loader2,
  Minus,
} from 'lucide-react';

export interface HierarchyNode {
  id: string;
  label: string;
  type?: 'head_office' | 'region' | 'school' | 'branch' | string;
  code?: string;
  disabled?: boolean;
  children?: HierarchyNode[];
  icon?: React.ReactNode;
}

export interface HierarchyMultiSelectProps {
  id?: string;
  label?: string;
  placeholder?: string;
  nodes: HierarchyNode[];
  value: string[];
  onChange: (selectedIds: string[]) => void;
  cascadeSelection?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isLoading?: boolean;
  maxDisplayedChips?: number;
  searchPlaceholder?: string;
  className?: string;
}

function getNodeIcon(type?: string) {
  switch (type) {
    case 'head_office':
      return <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    case 'region':
      return <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
    case 'school':
      return <School className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    case 'branch':
      return <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
  }
}

// Helper to collect all descendant IDs of a node
function getAllDescendantIds(node: HierarchyNode): string[] {
  let ids = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids = ids.concat(getAllDescendantIds(child));
    }
  }
  return ids;
}

// Helper to flatten hierarchy to flat map
function flattenHierarchy(nodes: HierarchyNode[]): Map<string, HierarchyNode> {
  const map = new Map<string, HierarchyNode>();
  function traverse(n: HierarchyNode) {
    map.set(n.id, n);
    if (n.children) {
      n.children.forEach(traverse);
    }
  }
  nodes.forEach(traverse);
  return map;
}

export function HierarchyMultiSelect({
  id,
  label,
  placeholder = 'Select hierarchy nodes...',
  nodes = [],
  value = [],
  onChange,
  cascadeSelection = true,
  disabled = false,
  readOnly = false,
  required = false,
  isError = false,
  errorMessage,
  isLoading = false,
  maxDisplayedChips = 3,
  searchPlaceholder = 'Search hierarchy nodes...',
  className = '',
}: HierarchyMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize expanded nodes (expand top-level by default)
  useEffect(() => {
    const initialExpanded = new Set<string>();
    nodes.forEach((n) => {
      initialExpanded.add(n.id);
      if (n.children) n.children.forEach((c) => initialExpanded.add(c.id));
    });
    setExpandedNodes(initialExpanded);
  }, [nodes]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const flatMap = useMemo(() => flattenHierarchy(nodes), [nodes]);

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Node selection check: checked, unchecked, or indeterminate
  const getNodeCheckState = (node: HierarchyNode): 'checked' | 'indeterminate' | 'unchecked' => {
    const isDirectlySelected = value.includes(node.id);

    if (!node.children || node.children.length === 0) {
      return isDirectlySelected ? 'checked' : 'unchecked';
    }

    const allDescendantIds = getAllDescendantIds(node).filter((id) => id !== node.id);
    const selectedDescendantsCount = allDescendantIds.filter((id) => value.includes(id)).length;

    if (isDirectlySelected || (allDescendantIds.length > 0 && selectedDescendantsCount === allDescendantIds.length)) {
      return 'checked';
    }

    if (selectedDescendantsCount > 0) {
      return 'indeterminate';
    }

    return 'unchecked';
  };

  const toggleNodeSelection = (node: HierarchyNode) => {
    if (disabled || readOnly || node.disabled) return;

    const currentState = getNodeCheckState(node);
    let newSelected: string[];

    if (cascadeSelection) {
      const allSubtreeIds = getAllDescendantIds(node);
      if (currentState === 'checked') {
        // Deselect node and all descendants
        newSelected = value.filter((id) => !allSubtreeIds.includes(id));
      } else {
        // Select node and all descendants
        newSelected = Array.from(new Set([...value, ...allSubtreeIds]));
      }
    } else {
      // Independent single node toggle
      if (value.includes(node.id)) {
        newSelected = value.filter((id) => id !== node.id);
      } else {
        newSelected = [...value, node.id];
      }
    }

    onChange(newSelected);
  };

  const removeChip = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (disabled || readOnly) return;
    onChange(value.filter((id) => id !== nodeId));
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled || readOnly) return;
    onChange([]);
  };

  // Map selected IDs to Node objects for chips display
  const selectedNodes = useMemo(() => {
    return value.map((id) => flatMap.get(id) || { id, label: id });
  }, [value, flatMap]);

  // Filter hierarchy matching search query
  const matchesSearch = (node: HierarchyNode, q: string): boolean => {
    if (!q) return true;
    const labelMatch = node.label.toLowerCase().includes(q);
    const codeMatch = node.code ? node.code.toLowerCase().includes(q) : false;
    if (labelMatch || codeMatch) return true;
    if (node.children) {
      return node.children.some((child) => matchesSearch(child, q));
    }
    return false;
  };

  // Render recursive hierarchy tree
  const renderTreeNodes = (nodeList: HierarchyNode[], level = 0): React.ReactNode => {
    const q = searchQuery.toLowerCase().trim();
    const visibleList = q ? nodeList.filter((n) => matchesSearch(n, q)) : nodeList;

    if (visibleList.length === 0 && level === 0) {
      return (
        <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <div>No matching hierarchy nodes</div>
          {searchQuery && (
            <div className="text-[10px] text-slate-400 font-mono">
              query: "{searchQuery}"
            </div>
          )}
        </div>
      );
    }

    return visibleList.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id) || !!q; // auto expand during search
      const checkState = getNodeCheckState(node);
      const isNodeDisabled = node.disabled;

      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => toggleNodeSelection(node)}
            style={{ paddingLeft: `${level * 18 + 10}px` }}
            className={`flex items-center justify-between pr-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
              checkState === 'checked'
                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
            } ${isNodeDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Expand / Collapse Chevron */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(node.id, e)}
                  className="p-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <div className="w-4.5" />
              )}

              {/* Tri-state Checkbox */}
              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                  checkState === 'checked'
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : checkState === 'indeterminate'
                    ? 'bg-indigo-100 dark:bg-indigo-900/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                {checkState === 'checked' && <Check className="w-3 h-3 stroke-[3]" />}
                {checkState === 'indeterminate' && <Minus className="w-3 h-3 stroke-[3]" />}
              </div>

              {/* Node Icon & Label */}
              <div className="flex items-center gap-1.5 truncate">
                {getNodeIcon(node.type)}
                <span className="truncate">{node.label}</span>
                {node.code && (
                  <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {node.code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Children nodes recursion */}
          {hasChildren && isExpanded && (
            <div className="border-l border-slate-100 dark:border-slate-800 ml-4">
              {renderTreeNodes(node.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const hasSelections = value.length > 0;
  const isInputDisabled = disabled || readOnly;

  return (
    <div className={`relative w-full text-left space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      {/* Main Trigger Box */}
      <div
        id={id}
        tabIndex={isInputDisabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!isInputDisabled) setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (isInputDisabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`min-h-[38px] w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 transition-all flex items-center justify-between gap-2 shadow-2xs ${
          isError
            ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 ring-1 ring-rose-400'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        } ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
            : 'cursor-pointer'
        }`}
      >
        {/* Selected Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 overflow-hidden py-0.5">
          {!hasSelections ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 select-none">
              {placeholder}
            </span>
          ) : (
            <>
              {selectedNodes.slice(0, maxDisplayedChips).map((node) => (
                <span
                  key={node.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold animate-in fade-in"
                >
                  <span className="truncate max-w-[140px]">{node.label}</span>
                  {!isInputDisabled && (
                    <button
                      type="button"
                      onClick={(e) => removeChip(e, node.id)}
                      className="hover:text-indigo-900 dark:hover:text-white rounded-xs focus:outline-hidden"
                      aria-label={`Remove ${node.label}`}
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}
                </span>
              ))}

              {selectedNodes.length > maxDisplayedChips && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  +{selectedNodes.length - maxDisplayedChips} more
                </span>
              )}
            </>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
          {isLoading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}

          {hasSelections && !isInputDisabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear all selections"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Error Message */}
      {isError && errorMessage && (
        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {errorMessage}
        </p>
      )}

      {/* Hierarchy Dropdown Tree Panel */}
      {isOpen && !isInputDisabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[360px]">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-500">Hierarchy Selection</span>
              {hasSelections && (
                <button
                  type="button"
                  onClick={() => handleClearAll()}
                  className="font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
            <span className="font-mono text-slate-400 text-[10px]">
              {value.length} nodes selected
            </span>
          </div>

          {/* Scrollable Tree View */}
          <div className="overflow-y-auto max-h-[260px] p-1.5 space-y-0.5">
            {renderTreeNodes(nodes)}
          </div>
        </div>
      )}
    </div>
  );
}
