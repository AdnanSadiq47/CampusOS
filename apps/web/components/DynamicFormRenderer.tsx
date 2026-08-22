'use client';

import React, { useState, useEffect } from 'react';
import { FormSchemaAST, FormRule, FormFieldControl } from '@campus-os/types';
import { FormRuleEvaluator } from '@campus-os/rule-engine';

export interface DynamicFormRendererProps {
  schema: FormSchemaAST;
  rules?: FormRule[];
  initialValues?: Record<string, unknown>;
  userPermissions?: string[];
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function DynamicFormRenderer({
  schema,
  rules = [],
  initialValues = {},
  userPermissions = [],
  onSubmit,
  submitLabel = 'Submit',
  isSubmitting = false,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialValues);
  const [activeTabId, setActiveTabId] = useState<string>(schema.tabs[0]?.id ?? '');

  // Evaluate form rules live on every state change
  const evaluationResult = FormRuleEvaluator.evaluateRules(rules as any, {
    formData,
    userPermissions,
  });

  // Apply calculated values automatically
  useEffect(() => {
    if (Object.keys(evaluationResult.calculatedValues).length > 0) {
      let hasChanges = false;
      const updated = { ...formData };
      for (const [key, val] of Object.entries(evaluationResult.calculatedValues)) {
        if (updated[key] !== val) {
          updated[key] = val;
          hasChanges = true;
        }
      }
      if (hasChanges) {
        setFormData(updated);
      }
    }
  }, [formData, evaluationResult.calculatedValues]);

  const handleFieldChange = (fieldCode: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldCode]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const activeTab = schema.tabs.find((t) => t.id === activeTabId) ?? schema.tabs[0];

  const renderControl = (control: FormFieldControl) => {
    // Check if field is hidden by rule
    if (control.hidden || evaluationResult.hiddenFields.has(control.fieldCode)) {
      return null;
    }

    const isRequired = evaluationResult.requiredFields.has(control.fieldCode);
    const isDisabled = control.isReadOnly || evaluationResult.disabledFields.has(control.fieldCode);
    const value = formData[control.fieldCode] ?? '';

    // ColSpan layout (1 to 12)
    const colSpanClass = control.colSpan ? `col-span-${control.colSpan}` : 'col-span-1';

    return (
      <div key={control.id} className={`${colSpanClass} flex flex-col space-y-1.5`}>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {control.label ?? control.fieldCode}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>

        {control.controlType === 'textarea' ? (
          <textarea
            value={String(value)}
            disabled={isDisabled}
            placeholder={control.placeholder}
            onChange={(e) => handleFieldChange(control.fieldCode, e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            rows={3}
          />
        ) : control.controlType === 'switch' ? (
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(control.fieldCode, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">{control.helpText ?? 'Enable'}</span>
          </div>
        ) : control.controlType === 'number_input' || control.controlType === 'decimal_input' ? (
          <input
            type="number"
            step={control.controlType === 'decimal_input' ? '0.01' : '1'}
            value={value === '' ? '' : Number(value)}
            disabled={isDisabled}
            placeholder={control.placeholder}
            onChange={(e) => handleFieldChange(control.fieldCode, e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        ) : (
          <input
            type="text"
            value={String(value)}
            disabled={isDisabled}
            placeholder={control.placeholder}
            onChange={(e) => handleFieldChange(control.fieldCode, e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        )}

        {control.helpText && control.controlType !== 'switch' && (
          <p className="text-xs text-slate-500">{control.helpText}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs Header if multiple tabs exist */}
      {schema.tabs.length > 1 && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
          {schema.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTabId === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>
      )}

      {/* Active Tab Sections & Controls */}
      {activeTab && (
        <div className="space-y-6">
          {activeTab.sections.map((section) => (
            <div
              key={section.id}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4 shadow-sm"
            >
              {section.title && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{section.title}</h4>
                  {section.description && <p className="text-xs text-slate-500">{section.description}</p>}
                </div>
              )}

              <div
                className={`grid gap-4 ${
                  section.columns === 1
                    ? 'grid-cols-1'
                    : section.columns === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : section.columns === 4
                    ? 'grid-cols-1 md:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {section.controls.map((control) => renderControl(control))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
