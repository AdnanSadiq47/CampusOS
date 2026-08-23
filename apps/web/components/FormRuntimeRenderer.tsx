'use client';

import React, { useState, useMemo } from 'react';
import {
  FormSchemaPayload,
  FormFieldInstance,
} from '@campus-os/types';

interface FormRuntimeRendererProps {
  schema: FormSchemaPayload;
  formTitle?: string;
  formPurpose?: string;
  campusName?: string;
  academicYearName?: string;
  initialValues?: Record<string, any>;
  readOnly?: boolean;
  onSubmit?: (values: Record<string, any>) => void;
  onSaveDraft?: (values: Record<string, any>) => void;
}

// Sample cascading mock data for ERP smart fields
const MOCK_COUNTRIES = [{ label: 'Pakistan', value: 'PK' }, { label: 'United Arab Emirates', value: 'AE' }, { label: 'United Kingdom', value: 'GB' }];
const MOCK_STATES: Record<string, Array<{ label: string; value: string }>> = {
  PK: [
    { label: 'Sindh', value: 'SINDH' },
    { label: 'Punjab', value: 'PUNJAB' },
    { label: 'Khyber Pakhtunkhwa', value: 'KPK' },
    { label: 'Islamabad Capital Territory', value: 'ICT' },
  ],
};
const MOCK_CITIES: Record<string, Array<{ label: string; value: string }>> = {
  SINDH: [{ label: 'Karachi', value: 'KHI' }, { label: 'Hyderabad', value: 'HYD' }, { label: 'Sukkur', value: 'SKR' }],
  PUNJAB: [{ label: 'Lahore', value: 'LHR' }, { label: 'Islamabad / Rawalpindi', value: 'ISB' }, { label: 'Faisalabad', value: 'FSD' }],
};
const MOCK_AREAS: Record<string, Array<{ label: string; value: string }>> = {
  KHI: [
    { label: 'Gulshan-e-Iqbal (Block 1-13)', value: 'GULSHAN' },
    { label: 'Clifton (Block 1-9)', value: 'CLIFTON' },
    { label: 'DHA (Phase 1-8)', value: 'DHA' },
    { label: 'North Nazimabad', value: 'NN' },
    { label: 'PECHS / Bahadurabad', value: 'PECHS' },
  ],
  LHR: [
    { label: 'Gulberg (I-III)', value: 'GULBERG' },
    { label: 'DHA Lahore', value: 'DHA_LHR' },
    { label: 'Model Town', value: 'MODEL_TOWN' },
  ],
};

const MOCK_BOARDS = [
  { label: 'Cambridge Assessment International Education (CIE)', value: 'CIE' },
  { label: 'Federal Board of Intermediate & Secondary Education (FBISE)', value: 'FBISE' },
  { label: 'Sindh Board of Secondary Education (BSEK)', value: 'BSEK' },
  { label: 'Aga Khan University Examination Board (AKU-EB)', value: 'AKUEB' },
];

const MOCK_CLASSES = [
  { label: 'Playgroup (Age 2.5 - 3.5 yrs)', value: 'PLAYGROUP', minAgeMonths: 30, maxAgeMonths: 42 },
  { label: 'Nursery (Age 3.5 - 4.5 yrs)', value: 'NURSERY', minAgeMonths: 42, maxAgeMonths: 54 },
  { label: 'Kindergarten / Prep (Age 4.5 - 5.5 yrs)', value: 'KG', minAgeMonths: 54, maxAgeMonths: 66 },
  { label: 'Grade 1 (Age 5.5 - 6.5 yrs)', value: 'GRADE_1', minAgeMonths: 66, maxAgeMonths: 78 },
  { label: 'Grade 2', value: 'GRADE_2', minAgeMonths: 78, maxAgeMonths: 90 },
  { label: 'Grade 3', value: 'GRADE_3', minAgeMonths: 90, maxAgeMonths: 102 },
  { label: 'Grade 4', value: 'GRADE_4', minAgeMonths: 102, maxAgeMonths: 114 },
  { label: 'Grade 5', value: 'GRADE_5', minAgeMonths: 114, maxAgeMonths: 126 },
  { label: 'Grade 6', value: 'GRADE_6', minAgeMonths: 126, maxAgeMonths: 138 },
  { label: 'Grade 7', value: 'GRADE_7', minAgeMonths: 138, maxAgeMonths: 150 },
  { label: 'Grade 8', value: 'GRADE_8', minAgeMonths: 150, maxAgeMonths: 162 },
  { label: 'Grade 9 / O-Level 1', value: 'GRADE_9', minAgeMonths: 162, maxAgeMonths: 174 },
  { label: 'Grade 10 / O-Level 2', value: 'GRADE_10', minAgeMonths: 174, maxAgeMonths: 186 },
];

export function FormRuntimeRenderer({
  schema,
  formTitle = 'Application Form Preview',
  formPurpose = 'PRE_REGISTRATION',
  campusName = 'Main Campus Gulshan',
  academicYearName = 'Academic Session 2026-2027',
  initialValues = {},
  readOnly = false,
  onSubmit,
  onSaveDraft,
}: FormRuntimeRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({
    CURRENT_COUNTRY: 'PK',
    CURRENT_STATE: 'SINDH',
    CURRENT_CITY: 'KHI',
    ...initialValues,
  });

  const [repeatableEntries, setRepeatableEntries] = useState<Record<string, Array<Record<string, any>>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Dynamic Rule Evaluation Engine
  const evaluatedRules = useMemo(() => {
    const hiddenFields = new Set<string>();
    const hiddenSections = new Set<string>();
    const requiredOverrides = new Set<string>();

    const rules = schema.rules || [];
    for (const rule of rules) {
      const sourceVal = formData[rule.sourceFieldKey];
      let conditionMet = false;

      if (rule.operator === 'EQUALS') {
        conditionMet = sourceVal === rule.value;
      } else if (rule.operator === 'NOT_EQUALS') {
        conditionMet = sourceVal !== rule.value;
      } else if (rule.operator === 'IS_NOT_EMPTY') {
        conditionMet = sourceVal !== undefined && sourceVal !== null && sourceVal !== '';
      } else if (rule.operator === 'IS_EMPTY') {
        conditionMet = sourceVal === undefined || sourceVal === null || sourceVal === '';
      }

      if (rule.action === 'SHOW') {
        if (!conditionMet) {
          if (rule.targetFieldKey) hiddenFields.add(rule.targetFieldKey);
          if (rule.targetSectionId) hiddenSections.add(rule.targetSectionId);
        }
      } else if (rule.action === 'HIDE') {
        if (conditionMet) {
          if (rule.targetFieldKey) hiddenFields.add(rule.targetFieldKey);
          if (rule.targetSectionId) hiddenSections.add(rule.targetSectionId);
        }
      } else if (rule.action === 'MAKE_REQUIRED') {
        if (conditionMet && rule.targetFieldKey) {
          requiredOverrides.add(rule.targetFieldKey);
        }
      }
    }

    return { hiddenFields, hiddenSections, requiredOverrides };
  }, [schema.rules, formData]);

  // DOB Class Eligibility Calculator
  const ageEligibility = useMemo(() => {
    const dobValue = formData['STD_DOB'] || formData['STUDENT_DOB'] || formData['fld_dob'] || formData['fld_adm_dob'];
    const selectedClass = formData['ACAD_CLASS_REF'] || formData['APPLYING_CLASS'] || formData['fld_class'] || formData['fld_applying_class'] || formData['fld_adm_class'];

    if (!dobValue) return null;

    const dob = new Date(dobValue);
    if (isNaN(dob.getTime())) return null;

    const cutoff = new Date('2026-08-01'); // Standard academic session intake cutoff
    let months = (cutoff.getFullYear() - dob.getFullYear()) * 12 + (cutoff.getMonth() - dob.getMonth());
    if (cutoff.getDate() < dob.getDate()) months--;

    if (months < 0) return null;

    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    const ageString = `${years} yrs, ${remMonths} mos`;

    const matchedClass = MOCK_CLASSES.find((c) => c.value === selectedClass);
    let isEligible = true;
    let note = `Age as of Aug 1, 2026: ${ageString}`;

    if (matchedClass && matchedClass.minAgeMonths && matchedClass.maxAgeMonths) {
      if (months < matchedClass.minAgeMonths) {
        isEligible = false;
        note += ` (Below recommended minimum age for ${matchedClass.label})`;
      } else if (months > matchedClass.maxAgeMonths) {
        isEligible = false;
        note += ` (Above recommended maximum age for ${matchedClass.label})`;
      } else {
        note += ` (Age verified for ${matchedClass.label} ✓)`;
      }
    }

    return { ageString, isEligible, note };
  }, [formData]);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleRepeatableAdd = (sectionId: string) => {
    setRepeatableEntries((prev) => {
      const current = prev[sectionId] || [];
      return { ...prev, [sectionId]: [...current, {}] };
    });
  };

  const handleRepeatableRemove = (sectionId: string, index: number) => {
    setRepeatableEntries((prev) => {
      const current = prev[sectionId] || [];
      const updated = current.filter((_, i) => i !== index);
      return { ...prev, [sectionId]: updated };
    });
  };

  const handleRepeatableChange = (sectionId: string, index: number, fieldKey: string, val: any) => {
    setRepeatableEntries((prev) => {
      const current = [...(prev[sectionId] || [])];
      current[index] = { ...(current[index] || {}), [fieldKey]: val };
      return { ...prev, [sectionId]: current };
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate required fields that are not hidden
    for (const section of schema.sections || []) {
      if (evaluatedRules.hiddenSections.has(section.id)) continue;
      for (const field of section.fields || []) {
        const fieldKey = field.instanceId || field.canonicalKey || field.fieldDefinitionId;
        if (evaluatedRules.hiddenFields.has(fieldKey) || evaluatedRules.hiddenFields.has(field.instanceId)) continue;

        const isReq = field.isRequired || evaluatedRules.requiredOverrides.has(fieldKey) || evaluatedRules.requiredOverrides.has(field.instanceId);
        const val = formData[fieldKey] ?? formData[field.canonicalKey || ''] ?? formData[field.fieldDefinitionId];

        if (isReq && (val === undefined || val === null || val === '')) {
          errors[fieldKey] = `${field.customLabel || 'This field'} is required.`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitted(true);
    if (onSubmit) {
      onSubmit({ ...formData, repeatableEntries });
    }
  };

  // Render individual field control
  const renderField = (field: FormFieldInstance, isRepeatable: boolean = false, repIndex?: number, repSectionId?: string) => {
    const fieldKey = field.instanceId || field.canonicalKey || field.fieldDefinitionId;
    if (!isRepeatable && (evaluatedRules.hiddenFields.has(fieldKey) || evaluatedRules.hiddenFields.has(field.instanceId))) {
      return null;
    }

    const value = isRepeatable && repSectionId !== undefined && repIndex !== undefined
      ? (repeatableEntries[repSectionId]?.[repIndex]?.[fieldKey] ?? '')
      : (formData[fieldKey] ?? formData[field.canonicalKey || ''] ?? formData[field.fieldDefinitionId] ?? '');

    const isRequired = field.isRequired || evaluatedRules.requiredOverrides.has(fieldKey) || evaluatedRules.requiredOverrides.has(field.instanceId);
    const error = validationErrors[fieldKey];

    const onChange = (v: any) => {
      if (isRepeatable && repSectionId !== undefined && repIndex !== undefined) {
        handleRepeatableChange(repSectionId, repIndex, fieldKey, v);
      } else {
        handleFieldChange(fieldKey, v);
        if (field.canonicalKey) handleFieldChange(field.canonicalKey, v);
      }
    };

    // Determine options for master entity dropdowns
    let options = field.options || [];
    if (field.masterBinding === 'COUNTRY') options = MOCK_COUNTRIES;
    else if (field.masterBinding === 'STATE') {
      const selectedCountry = formData['CURRENT_COUNTRY'] || formData['ADDR_CURR_COUNTRY'] || 'PK';
      options = MOCK_STATES[selectedCountry] || MOCK_STATES['PK'] || [];
    } else if (field.masterBinding === 'CITY') {
      const selectedState = formData['CURRENT_STATE'] || formData['ADDR_CURR_STATE'] || 'SINDH';
      options = MOCK_CITIES[selectedState] || MOCK_CITIES['SINDH'] || [];
    } else if (field.masterBinding === 'AREA') {
      const selectedCity = formData['CURRENT_CITY'] || formData['ADDR_CURR_CITY'] || 'KHI';
      options = MOCK_AREAS[selectedCity] || MOCK_AREAS['KHI'] || [];
    } else if (field.masterBinding === 'BOARD') options = MOCK_BOARDS;
    let widthClass = 'col-span-12';
    if (field.width === 'QUARTER' || (field.width as string) === '25%') {
      widthClass = 'col-span-12 sm:col-span-6 lg:col-span-3';
    } else if (field.width === 'HALF' || (field.width as string) === '50%') {
      widthClass = 'col-span-12 sm:col-span-6';
    } else if (field.width === 'THREE_QUARTERS' || (field.width as string) === '75%') {
      widthClass = 'col-span-12 sm:col-span-6 lg:col-span-9';
    } else if (field.width === 'FULL' || (field.width as string) === '100%') {
      widthClass = 'col-span-12';
    } else {
      widthClass = 'col-span-12 sm:col-span-6';
    }

    return (
      <div key={field.instanceId + (repIndex !== undefined ? `_${repIndex}` : '')} className={`${widthClass} space-y-1.5`}>
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {field.customLabel || 'Field Label'}
            {isRequired && <span className="ml-1 text-rose-500 font-bold">*</span>}
          </label>
          {field.canonicalKey && (
            <span className="text-[10px] text-slate-400 font-mono">
              {field.canonicalKey}
            </span>
          )}
        </div>

        {/* Text / Phone / Email / Number */}
        {(!field.options && !field.masterBinding && field.fieldDefinitionId !== 'STD_DOB' && !field.fieldDefinitionId.startsWith('DOC_') && field.fieldDefinitionId !== 'STD_PHOTO' && !field.fieldDefinitionId.startsWith('DEC_') && field.fieldDefinitionId !== 'TRN_REQUIRED' && field.fieldDefinitionId !== 'HST_REQUIRED') && (
          <input
            type={field.validation?.emailFormat ? 'email' : 'text'}
            placeholder={field.placeholder || ''}
            value={value}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
          />
        )}

        {/* Date of Birth / Date Field */}
        {(field.fieldDefinitionId === 'STD_DOB' || field.canonicalKey === 'STUDENT_DOB' || field.instanceId.includes('dob')) && (
          <input
            type="date"
            value={value}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
          />
        )}

        {/* Dropdowns & Master Entity Selects */}
        {(options.length > 0 || field.masterBinding) && field.fieldDefinitionId !== 'STD_GENDER' && (
          <select
            value={value}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
          >
            <option value="">-- Select {field.customLabel || 'Option'} --</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Radio Gender Buttons */}
        {field.fieldDefinitionId === 'STD_GENDER' && (
          <div className="flex gap-4 pt-1">
            {['MALE', 'FEMALE', 'OTHER'].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="radio"
                  name={fieldKey}
                  value={g}
                  checked={value === g}
                  disabled={readOnly}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        )}

        {/* Checkbox / Boolean Switch */}
        {(field.fieldDefinitionId === 'TRN_REQUIRED' || field.fieldDefinitionId === 'HST_REQUIRED' || field.fieldDefinitionId.startsWith('DEC_')) && (
          <label className="flex items-start gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              disabled={readOnly}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              {field.customLabel}
            </span>
          </label>
        )}

        {/* File / Photo Upload */}
        {(field.fieldDefinitionId.startsWith('DOC_') || field.fieldDefinitionId === 'STD_PHOTO') && (
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 transition-colors">
            <span className="text-lg mb-1 block">📎</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block">
              Click to select or drag & drop file
            </span>
            <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
          </div>
        )}

        {/* Help text or Validation error */}
        {field.helpText && !error && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{field.helpText}</p>
        )}
        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-8 text-center shadow-lg max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Form Submission Simulated</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Your test application for <strong>{campusName}</strong> ({academicYearName}) was validated successfully under versioned schema AST.
        </p>
        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left font-mono text-xs text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto">
          {JSON.stringify(formData, null, 2)}
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          Back to Form Preview
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Form Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-white/20 text-white">
                {formPurpose.replace('_', ' ')}
              </span>
              <span className="text-xs text-indigo-200">
                {academicYearName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{formTitle}</h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">{campusName}</p>
          </div>
        </div>

        {/* DOB Class Age Eligibility Banner */}
        {ageEligibility && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 text-xs font-medium ${
            ageEligibility.isEligible
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
          }`}>
            <span className="text-lg">{ageEligibility.isEligible ? '💡' : '⚠️'}</span>
            <span>{ageEligibility.note}</span>
          </div>
        )}
      </div>

      {/* Form Sections & Fields Canvas */}
      <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-8">
        {(schema.sections || []).map((section, idx) => {
          if (evaluatedRules.hiddenSections.has(section.id)) return null;

          const isRepeatable = section.repeatableConfig?.isRepeatable;
          const entries = repeatableEntries[section.id] || [];

          return (
            <div
              key={section.id}
              className={`space-y-5 ${idx > 0 ? 'pt-6 border-t border-slate-100 dark:border-slate-800' : ''}`}
            >
              {/* Optional Section Heading */}
              {section.showSectionHeading && section.title && (
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{section.description}</p>
                  )}
                </div>
              )}

              {/* Standard Section Fields Grid */}
              {!isRepeatable && (
                <div className="grid grid-cols-12 gap-5">
                  {section.fields.map((f) => renderField(f))}
                </div>
              )}

              {/* Repeatable Group Section */}
              {isRepeatable && (
                <div className="space-y-4">
                  {entries.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No entries added yet.</p>
                  )}
                  {entries.map((_, entryIdx) => (
                    <div key={entryIdx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Entry #{entryIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRepeatableRemove(section.id, entryIdx)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-12 gap-4">
                        {section.fields.map((f) => renderField(f, true, entryIdx, section.id))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleRepeatableAdd(section.id)}
                    className="px-4 py-2 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>+</span>
                    <span>{section.repeatableConfig?.addButtonText || 'Add Entry'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Action Buttons Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {onSaveDraft && (
            <button
              type="button"
              onClick={() => onSaveDraft(formData)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            >
              Save Draft
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg active:scale-98"
            >
              {schema.settings?.submitButtonText || 'Submit Application'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
