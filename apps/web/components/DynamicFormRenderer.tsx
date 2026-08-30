'use client';

import React, { useState, useEffect } from 'react';
import { FormSchemaAST, FormRule, FormFieldControl, SemanticDataType, validateSemanticField } from '@campus-os/types';
import { FormRuleEvaluator } from '@campus-os/rule-engine';
import { useContactPlaceholders } from './DisplayFormatters';

export interface DynamicFormRendererProps {
  schema: FormSchemaAST;
  rules?: FormRule[];
  initialValues?: Record<string, unknown>;
  userPermissions?: string[];
  schoolId?: string | null;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

function inferSemanticType(control: FormFieldControl): SemanticDataType | null {
  const code = (control.fieldCode || '').toLowerCase();
  const label = (control.label || '').toLowerCase();
  const type = (control.controlType || '').toLowerCase();

  if (type === 'email' || code.includes('email') || label.includes('email')) return 'EMAIL';
  if (type === 'url' || code.includes('website') || label.includes('website') || code.includes('url')) return 'URL';
  if (code.includes('cnic') || label.includes('cnic')) return 'CNIC';
  if (code.includes('whatsapp') || label.includes('whatsapp')) return 'WHATSAPP';
  if (code.includes('mobile') || label.includes('mobile') || code.includes('cell')) return 'MOBILE';
  if (type === 'phone' || code.includes('phone') || label.includes('phone') || label.includes('landline')) return 'PHONE';
  return null;
}

export function DynamicFormRenderer({
  schema,
  rules = [],
  initialValues = {},
  userPermissions = [],
  schoolId,
  onSubmit,
  submitLabel = 'Submit',
  isSubmitting = false,
}: DynamicFormRendererProps) {
  const contactPlaceholders = useContactPlaceholders({ schoolId });
  const [formData, setFormData] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const handleFieldChange = (fieldCode: string, value: unknown, control?: FormFieldControl) => {
    setFormData((prev) => ({
      ...prev,
      [fieldCode]: value,
    }));

    if (control) {
      const semType = inferSemanticType(control);
      if (semType) {
        const isRequired = evaluationResult.requiredFields.has(control.fieldCode);
        const res = validateSemanticField(semType, value, isRequired);
        if (!res.valid) {
          setErrors((prev) => ({ ...prev, [fieldCode]: res.error || 'Invalid format' }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[fieldCode];
            return next;
          });
        }
      }
    }
  };

  const handleBlur = (fieldCode: string, value: unknown, control: FormFieldControl) => {
    const semType = inferSemanticType(control);
    if (semType) {
      const isRequired = evaluationResult.requiredFields.has(control.fieldCode);
      const res = validateSemanticField(semType, value, isRequired);
      if (!res.valid) {
        setErrors((prev) => ({ ...prev, [fieldCode]: res.error || 'Invalid format' }));
      } else {
        setErrors((prev) => {
          if (!prev[fieldCode]) return prev;
          const next = { ...prev };
          delete next[fieldCode];
          return next;
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all active controls
    const newErrors: Record<string, string> = {};
    for (const tab of schema.tabs) {
      for (const sec of tab.sections) {
        for (const ctrl of sec.controls) {
          if (!ctrl.hidden && !evaluationResult.hiddenFields.has(ctrl.fieldCode)) {
            const isRequired = evaluationResult.requiredFields.has(ctrl.fieldCode);
            const val = formData[ctrl.fieldCode];
            const semType = inferSemanticType(ctrl);
            if (semType) {
              const res = validateSemanticField(semType, val, isRequired);
              if (!res.valid && res.error) {
                newErrors[ctrl.fieldCode] = res.error;
              }
            } else if (isRequired && (val === undefined || val === null || val === '')) {
              newErrors[ctrl.fieldCode] = 'This field is required.';
            }
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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

    const hasError = !!errors[control.fieldCode];
    const borderClass = hasError
      ? 'border-red-500 focus:ring-red-500'
      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500';

    const semType = inferSemanticType(control);
    const dynamicPlaceholder = control.placeholder || (semType ? contactPlaceholders.getPlaceholder(semType) : undefined);
    const dynamicHelpText = control.helpText || (semType ? contactPlaceholders.getHelpText(semType) : undefined);

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
            placeholder={dynamicPlaceholder}
            onChange={(e) => handleFieldChange(control.fieldCode, e.target.value, control)}
            onBlur={() => handleBlur(control.fieldCode, value, control)}
            className={`w-full rounded-md border ${borderClass} bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50`}
            rows={3}
          />
        ) : control.controlType === 'switch' ? (
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(control.fieldCode, e.target.checked, control)}
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
            placeholder={dynamicPlaceholder}
            onChange={(e) => handleFieldChange(control.fieldCode, e.target.value === '' ? '' : Number(e.target.value), control)}
            onBlur={() => handleBlur(control.fieldCode, value, control)}
            className={`w-full rounded-md border ${borderClass} bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50`}
          />
        ) : (
          <input
            type="text"
            value={String(value)}
            disabled={isDisabled}
            placeholder={dynamicPlaceholder}
            onChange={(e) => handleFieldChange(control.fieldCode, e.target.value, control)}
            onBlur={() => handleBlur(control.fieldCode, value, control)}
            className={`w-full rounded-md border ${borderClass} bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50`}
          />
        )}

        {hasError && (
          <p className="text-xs text-red-500 font-medium">{errors[control.fieldCode]}</p>
        )}

        {dynamicHelpText && control.controlType !== 'switch' && !hasError && (
          <p className="text-xs text-slate-500">{dynamicHelpText}</p>
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
