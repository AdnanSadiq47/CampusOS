'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, X, Search, Loader2 } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}

export interface MultiSelectProps {
  id?: string;
  label?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isLoading?: boolean;
  maxDisplayedChips?: number;
  showSelectAll?: boolean;
  searchPlaceholder?: string;
  className?: string;
  onSearchChange?: (query: string) => void;
  renderCustomOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
}

export function MultiSelect({
  id,
  label,
  placeholder = 'Select options...',
  options = [],
  value = [],
  onChange,
  disabled = false,
  readOnly = false,
  required = false,
  isError = false,
  errorMessage,
  isLoading = false,
  maxDisplayedChips = 3,
  showSelectAll = true,
  searchPlaceholder = 'Search options...',
  className = '',
  onSearchChange,
  renderCustomOption,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (onSearchChange) onSearchChange(q);
  };

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Map values to full option objects for chip display
  const selectedOptions = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o]));
    return value.map((v) => map.get(v) || { value: v, label: v });
  }, [options, value]);

  const toggleOption = (optValue: string, optDisabled?: boolean) => {
    if (disabled || readOnly || optDisabled) return;
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeChip = (e: React.MouseEvent, optValue: string) => {
    e.stopPropagation();
    if (disabled || readOnly) return;
    onChange(value.filter((v) => v !== optValue));
  };

  const handleSelectAll = () => {
    if (disabled || readOnly) return;
    const visibleEnabledValues = filteredOptions.filter((o) => !o.disabled).map((o) => o.value);
    const uniqueValues = Array.from(new Set([...value, ...visibleEnabledValues]));
    onChange(uniqueValues);
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled || readOnly) return;
    onChange([]);
  };

  const allVisibleSelected =
    filteredOptions.length > 0 &&
    filteredOptions.filter((o) => !o.disabled).every((o) => value.includes(o.value));

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

      {/* Main Trigger Field */}
      <div
        id={id}
        tabIndex={isInputDisabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          if (!isInputDisabled) setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (isInputDisabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
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
        {/* Selected Values Display Area */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 overflow-hidden py-0.5">
          {!hasSelections ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 select-none">
              {placeholder}
            </span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplayedChips).map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold animate-in fade-in"
                >
                  <span className="truncate max-w-[140px]">{opt.label}</span>
                  {!isInputDisabled && (
                    <button
                      type="button"
                      onClick={(e) => removeChip(e, opt.value)}
                      className="hover:text-indigo-900 dark:hover:text-white rounded-xs focus:outline-hidden"
                      aria-label={`Remove ${opt.label}`}
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}
                </span>
              ))}

              {/* Overflow Badge */}
              {selectedOptions.length > maxDisplayedChips && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  +{selectedOptions.length - maxDisplayedChips} more
                </span>
              )}
            </>
          )}
        </div>

        {/* Right Actions / Controls */}
        <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
          {isLoading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}

          {hasSelections && !isInputDisabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear all selections"
              aria-label="Clear all selections"
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

      {/* Dropdown Menu Panel */}
      {isOpen && !isInputDisabled && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[320px]"
        >
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
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

          {/* Quick Actions Header: Select All / Clear All & Selected Count */}
          {showSelectAll && filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {allVisibleSelected ? 'Select All Visible' : 'Select All'}
                </button>
                {hasSelections && (
                  <button
                    type="button"
                    onClick={() => handleClearAll()}
                    className="font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <span className="font-mono text-slate-400 text-[10px]">
                {value.length} of {options.length} selected
              </span>
            </div>
          )}

          {/* Scrollable Options List */}
          <div className="overflow-y-auto max-h-[220px] p-1 divide-y divide-slate-50 dark:divide-slate-800/40">
            {filteredOptions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                <div>No matching records found</div>
                {searchQuery && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    query: "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                const isOptDisabled = opt.disabled;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleOption(opt.value, isOptDisabled)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    } ${isOptDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                  >
                    {renderCustomOption ? (
                      renderCustomOption(opt, isSelected)
                    ) : (
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Checkbox Box */}
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Label & Sublabel */}
                        <div className="flex flex-col truncate leading-tight">
                          <span className="truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-normal">
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {opt.icon && <div className="ml-2 text-slate-400">{opt.icon}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
