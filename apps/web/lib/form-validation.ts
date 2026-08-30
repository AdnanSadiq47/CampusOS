'use client';

import { useState, useCallback } from 'react';
import {
  SemanticDataType,
  VALIDATION_ERROR_MESSAGES,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidMobile,
  isValidWhatsApp,
  isValidCnic,
  normalizeEmail,
  normalizeUrl,
  normalizeMobile,
  normalizePhone,
  normalizeWhatsApp,
  normalizeCnic,
  formatMobile,
  formatLandline,
  formatPhone,
  formatCnic,
  formatCnicDisplay,
  formatContactValue,
  DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES,
  resolveEffectiveDisplayPreferences,
  normalizeImportValue,
  normalizeCnicForImport,
  normalizeMobileForImport,
  normalizePhoneForImport,
  resolveLoginIdentifier,
  normalizeSearchQuery,
  validateSemanticField,
  validateAndNormalizeContactFields,
  getMobileExample,
  getLandlineExample,
  getPhoneExample,
  getCnicExample,
  getContactExample,
  CANONICAL_SAMPLE_DATA,
} from '@campus-os/types';

import type {
  CountryCode,
  MobileDisplayFormat,
  LandlineDisplayFormat,
  CnicDisplayFormat,
  CampusDisplayPreferences,
} from '@campus-os/types';

export {
  VALIDATION_ERROR_MESSAGES,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidMobile,
  isValidWhatsApp,
  isValidCnic,
  normalizeEmail,
  normalizeUrl,
  normalizeMobile,
  normalizePhone,
  normalizeWhatsApp,
  normalizeCnic,
  formatMobile,
  formatLandline,
  formatPhone,
  formatCnic,
  formatCnicDisplay,
  formatContactValue,
  DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES,
  resolveEffectiveDisplayPreferences,
  normalizeImportValue,
  normalizeCnicForImport,
  normalizeMobileForImport,
  normalizePhoneForImport,
  resolveLoginIdentifier,
  normalizeSearchQuery,
  validateSemanticField,
  validateAndNormalizeContactFields,
  getMobileExample,
  getLandlineExample,
  getPhoneExample,
  getCnicExample,
  getContactExample,
  CANONICAL_SAMPLE_DATA,
};

export type {
  SemanticDataType,
  CountryCode,
  MobileDisplayFormat,
  LandlineDisplayFormat,
  CnicDisplayFormat,
  CampusDisplayPreferences,
};

export interface FieldValidationRule {
  type: SemanticDataType;
  required?: boolean;
  label?: string;
  country?: CountryCode;
  customValidator?: (value: unknown) => string | null;
}

export function validateSingleField(
  type: SemanticDataType,
  value: unknown,
  required = false,
  country: CountryCode = 'PK'
): string | null {
  const result = validateSemanticField(type, value, required, country);
  return result.valid ? null : (result.error || 'Invalid format');
}

export function validateFormFields(
  values: Record<string, unknown>,
  rules: Record<string, FieldValidationRule>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const val = values[field];
    if (rule.customValidator) {
      const customErr = rule.customValidator(val);
      if (customErr) {
        errors[field] = customErr;
        continue;
      }
    }

    const err = validateSingleField(rule.type, val, rule.required);
    if (err) {
      errors[field] = err;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function useFormValidation(initialRules: Record<string, FieldValidationRule> = {}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<Record<string, FieldValidationRule>>(initialRules);

  const validateField = useCallback(
    (field: string, value: unknown, customRule?: FieldValidationRule) => {
      const rule = customRule || rules[field];
      if (!rule) return true;

      if (rule.customValidator) {
        const customErr = rule.customValidator(value);
        if (customErr) {
          setErrors((prev) => ({ ...prev, [field]: customErr }));
          return false;
        }
      }

      const err = validateSingleField(rule.type, value, rule.required);
      if (err) {
        setErrors((prev) => ({ ...prev, [field]: err }));
        return false;
      } else {
        setErrors((prev) => {
          if (!prev[field]) return prev;
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return true;
      }
    },
    [rules]
  );

  const handleBlur = useCallback(
    (field: string, value: unknown, type?: SemanticDataType, required = false) => {
      const rule = rules[field] || (type ? { type, required } : undefined);
      if (!rule) return;
      validateField(field, value, rule);
    },
    [rules, validateField]
  );

  const handleChange = useCallback(
    (field: string, value: unknown, type?: SemanticDataType, required = false) => {
      // If field already has an active error, re-validate live to clear it as soon as user types valid data
      if (errors[field]) {
        const rule = rules[field] || (type ? { type, required } : undefined);
        if (rule) {
          validateField(field, value, rule);
        }
      }
    },
    [errors, rules, validateField]
  );

  const validateAll = useCallback(
    (values: Record<string, unknown>, overrideRules?: Record<string, FieldValidationRule>): boolean => {
      const activeRules = overrideRules || rules;
      const res = validateFormFields(values, activeRules);
      setErrors(res.errors);
      return res.valid;
    },
    [rules]
  );

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setErrors,
    rules,
    setRules,
    validateField,
    handleBlur,
    handleChange,
    validateAll,
    clearError,
    clearAllErrors,
  };
}
