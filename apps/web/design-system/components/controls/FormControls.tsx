'use client';

import React from 'react';
import { cn } from '@campus-os/ui-kit';

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ isError, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 rounded-lg text-xs border bg-white dark:bg-slate-900 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isError
            ? 'border-rose-400 bg-rose-50/20 text-rose-900 dark:text-rose-200'
            : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white',
          className
        )}
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isError?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ isError, options, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 rounded-lg text-xs border bg-white dark:bg-slate-900 transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isError
            ? 'border-rose-400 bg-rose-50/20 text-rose-900 dark:text-rose-200'
            : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white',
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

SelectField.displayName = 'SelectField';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const checkboxId = id || React.useId();
  return (
    <label htmlFor={checkboxId} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
      <input
        type="checkbox"
        id={checkboxId}
        className={cn(
          'w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer',
          className
        )}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export interface ToggleSwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function ToggleSwitch({ label, checked, onChange, disabled, className }: ToggleSwitchProps) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={cn(
          "w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )} />
      </div>
      {label && <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>}
    </label>
  );
}
