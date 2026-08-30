import { z } from 'zod';

/**
 * CampusOS Global Data Validation, Normalization & Display Format Contract
 * Platform Standard Version: 2.0.0
 */
export const CAMPUSOS_VALIDATION_CONTRACT_VERSION = '2.0.0';

export type SemanticDataType =
  | 'EMAIL'
  | 'URL'
  | 'MOBILE'
  | 'PHONE'
  | 'WHATSAPP'
  | 'CNIC';

export type CountryCode = 'PK' | 'AE' | 'SA' | 'US' | 'GB' | 'GLOBAL' | string;

export const VALIDATION_ERROR_MESSAGES = {
  EMAIL_INVALID: 'Please enter a valid email address (e.g. name@example.com).',
  URL_INVALID: 'Please enter a valid website URL (e.g. example.com or https://example.com).',
  MOBILE_INVALID: 'Please enter a valid mobile number (e.g. 0300-1234567 or +92 300 1234567).',
  PHONE_INVALID: 'Please enter a valid landline / official telephone number (e.g. 021-34567890 or +92 21 34567890).',
  WHATSAPP_INVALID: 'Please enter a valid WhatsApp mobile number (e.g. 0300-1234567 or +92 300 1234567).',
  CNIC_INVALID: 'Please enter a valid 13-digit CNIC (e.g. 42101-1234567-1 or 4210112345671).',
  REQUIRED: 'This field is required.',
} as const;

// ---------------------------------------------------------------------------
// 1. EMAIL CONTRACT
// ---------------------------------------------------------------------------
// RFC-5322 compatible regex requiring a valid domain and TLD (min 2 chars)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (!EMAIL_REGEX.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[1]) return false;
  const domain = parts[1];
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) return false;
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return false;
  return true;
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.toLowerCase();
}

// ---------------------------------------------------------------------------
// 2. WEBSITE / URL CONTRACT
// ---------------------------------------------------------------------------
const DOMAIN_REGEX = /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[^\s]*)?$/i;

export function isValidUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;
  if (!DOMAIN_REGEX.test(trimmed)) return false;
  if (/\s/.test(trimmed)) return false;
  return true;
}

export function normalizeUrl(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (!isValidUrl(trimmed)) return trimmed;

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// 3. MOBILE / CELL PHONE CONTRACT (COUNTRY-AWARE + PAKISTAN STANDARD)
// ---------------------------------------------------------------------------
/**
 * Pakistan mobile structure:
 * Domestic: 03XX + 7 subscriber digits = 11 digits (e.g. 03451123603)
 * International: +923XX + 7 subscriber digits = 12 digits (e.g. +923451123603)
 * Canonical Normalized Identity: 923XXXXXXXXX (12 digits, digits-only)
 */
export function isValidMobile(value: unknown, country: CountryCode = 'PK'): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (/[a-zA-Z]/.test(trimmed)) return false;
  if (!/^[+]?[\d\s\-()./]+$/.test(trimmed)) return false;

  const rawDigits = trimmed.replace(/\D/g, '');
  if (!rawDigits) return false;

  // Clean leading 00 international prefix if present (e.g. 00923001234567 -> 923001234567)
  let cleanDigits = rawDigits;
  if (cleanDigits.startsWith('00')) {
    cleanDigits = cleanDigits.slice(2);
  }

  const upperCountry = (country || 'PK').toUpperCase();

  if (upperCountry === 'PK' || upperCountry === 'PAKISTAN') {
    // Domestic: starts with 03 and has exactly 11 digits
    if (cleanDigits.startsWith('03') && cleanDigits.length === 11) {
      return true;
    }
    // International with 92: starts with 923 and has exactly 12 digits
    if (cleanDigits.startsWith('923') && cleanDigits.length === 12) {
      return true;
    }
    // Starts with 3 and has exactly 10 digits (without leading zero or country code)
    if (cleanDigits.startsWith('3') && cleanDigits.length === 10) {
      return true;
    }
    // Not a valid Pakistan mobile structure
    return false;
  }

  if (upperCountry === 'AE' || upperCountry === 'UAE') {
    // UAE mobile: starts with 05 (10 digits) or 9715 (12 digits)
    if (cleanDigits.startsWith('05') && cleanDigits.length === 10) return true;
    if (cleanDigits.startsWith('9715') && cleanDigits.length === 12) return true;
    return false;
  }

  if (upperCountry === 'SA' || upperCountry === 'SAUDI') {
    // Saudi mobile: starts with 05 (10 digits) or 9665 (12 digits)
    if (cleanDigits.startsWith('05') && cleanDigits.length === 10) return true;
    if (cleanDigits.startsWith('9665') && cleanDigits.length === 12) return true;
    return false;
  }

  // Global E.164 standard (7 to 15 digits)
  return cleanDigits.length >= 7 && cleanDigits.length <= 15;
}

/**
 * Normalizes Mobile number to a stable, digits-only canonical identity value.
 * Pakistan standard canonical identity: 923XXXXXXXXX (12 digits)
 */
export function normalizeMobile(value: string | null | undefined, country: CountryCode = 'PK'): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  const upperCountry = (country || 'PK').toUpperCase();

  if (upperCountry === 'PK' || upperCountry === 'PAKISTAN') {
    if (digits.startsWith('03') && digits.length === 11) {
      return `92${digits.slice(1)}`; // 923451123603
    }
    if (digits.startsWith('923') && digits.length === 12) {
      return digits; // 923451123603
    }
    if (digits.startsWith('3') && digits.length === 10) {
      return `92${digits}`; // 923451123603
    }
    return digits;
  }

  if (upperCountry === 'AE' || upperCountry === 'UAE') {
    if (digits.startsWith('05') && digits.length === 10) {
      return `971${digits.slice(1)}`;
    }
    return digits;
  }

  if (upperCountry === 'SA' || upperCountry === 'SAUDI') {
    if (digits.startsWith('05') && digits.length === 10) {
      return `966${digits.slice(1)}`;
    }
    return digits;
  }

  return digits;
}

// ---------------------------------------------------------------------------
// 4. OFFICIAL PHONE / LANDLINE CONTRACT (COUNTRY-AWARE + PAKISTAN STANDARD)
// ---------------------------------------------------------------------------
/**
 * Pakistan Landline structure:
 * Area codes (2-4 digits): 021 (Karachi), 042 (Lahore), 051 (ISB/RWP), 022, 091, 061, 081, 041, etc.
 * Total domestic digits: 9 to 11 digits.
 * Canonical Normalized Identity: 92 + (area code without 0) + subscriber digits (e.g. 922134567890)
 */
export function isValidPhone(value: unknown, country: CountryCode = 'PK'): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  // Strip allowed extension suffix if present (e.g. ext. 102, x102)
  const withoutExt = trimmed.replace(/(?:ext\.?|x)\s*\d+$/i, '').trim();

  // Reject letters/words
  if (/[a-zA-Z]/.test(withoutExt)) return false;
  if (!/^[+]?[\d\s\-().,/]+$/.test(withoutExt)) return false;

  let cleanDigits = withoutExt.replace(/\D/g, '');
  if (!cleanDigits) return false;
  if (cleanDigits.startsWith('00')) cleanDigits = cleanDigits.slice(2);

  const upperCountry = (country || 'PK').toUpperCase();

  if (upperCountry === 'PK' || upperCountry === 'PAKISTAN') {
    // Domestic: starts with 0 and has 9 to 11 digits
    if (cleanDigits.startsWith('0') && cleanDigits.length >= 9 && cleanDigits.length <= 11) {
      return true;
    }
    // International: starts with 92 and has 10 to 12 digits
    if (cleanDigits.startsWith('92') && cleanDigits.length >= 10 && cleanDigits.length <= 12) {
      return true;
    }
    // Direct without leading 0 (e.g. 2134567890 -> 10 digits)
    if (cleanDigits.length >= 8 && cleanDigits.length <= 11) {
      return true;
    }
    return false;
  }

  // Global Landline (6 to 15 digits)
  return cleanDigits.length >= 6 && cleanDigits.length <= 15;
}

/**
 * Normalizes Landline / Official Phone to a stable digits-only canonical identity value.
 */
export function normalizePhone(value: string | null | undefined, country: CountryCode = 'PK'): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  const upperCountry = (country || 'PK').toUpperCase();

  if (upperCountry === 'PK' || upperCountry === 'PAKISTAN') {
    if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 11) {
      return `92${digits.slice(1)}`; // e.g. 02134567890 -> 922134567890
    }
    if (digits.startsWith('92') && digits.length >= 10 && digits.length <= 12) {
      return digits; // 922134567890
    }
    if (!digits.startsWith('92') && digits.length >= 8 && digits.length <= 10) {
      return `92${digits}`;
    }
    return digits;
  }

  return digits;
}

// ---------------------------------------------------------------------------
// 5. WHATSAPP CONTRACT
// ---------------------------------------------------------------------------
export function isValidWhatsApp(value: unknown, country: CountryCode = 'PK'): boolean {
  return isValidMobile(value, country);
}

export function normalizeWhatsApp(value: string | null | undefined, country: CountryCode = 'PK'): string | null {
  return normalizeMobile(value, country);
}

// ---------------------------------------------------------------------------
// 6. CNIC CONTRACT (Pakistan National Identity Card)
// ---------------------------------------------------------------------------
/**
 * CNIC structure:
 * Standard visual: 42101-1234567-1
 * Plain digits: 4210112345671
 * Canonical Normalized Identity: 4210112345671 (13 digits exactly)
 */
const CNIC_REGEX = /^\d{5}-?\d{7}-?\d{1}$/;

export function isValidCnic(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (/[a-zA-Z]/.test(trimmed)) return false;
  if (!CNIC_REGEX.test(trimmed)) return false;
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length === 13;
}

export function normalizeCnic(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length !== 13) return trimmed;
  return digitsOnly;
}

// ---------------------------------------------------------------------------
// 7. DISPLAY FORMATTERS & PREFERENCES HIERARCHY
// ---------------------------------------------------------------------------
export type MobileDisplayFormat =
  | '03XX-XXXXXXX'
  | '03XXXXXXXXX'
  | '+92 XXX XXXXXXX'
  | 'E164'
  | 'NATIONAL'
  | 'INTERNATIONAL';

export type LandlineDisplayFormat =
  | '0XX-XXXXXXX'
  | '0XX XXXXXXX'
  | '0XX XXXXXXXX'
  | '+92 XX XXXXXXXX'
  | '+92 XX XXXXXXX'
  | 'DOMESTIC_HYPHEN'
  | 'DOMESTIC_SPACE'
  | 'INTERNATIONAL';

export type CnicDisplayFormat =
  | 'XXXXX-XXXXXXX-X'
  | 'XXXXXXXXXXXXX'
  | 'DASHED'
  | 'PLAIN';

export interface CampusDisplayPreferences {
  mobileFormat?: MobileDisplayFormat;
  landlineFormat?: LandlineDisplayFormat;
  cnicFormat?: CnicDisplayFormat;
}

export interface SaveDisplayPreferencesDto {
  schoolId?: string | null;
  mobileFormat?: MobileDisplayFormat | null;
  landlineFormat?: LandlineDisplayFormat | null;
  cnicFormat?: CnicDisplayFormat | null;
  useOrganizationDefault?: boolean;
}

export interface ResolvedDisplayPreferencesDto {
  effective: CampusDisplayPreferences;
  organizationDefault: CampusDisplayPreferences | null;
  schoolOverride: CampusDisplayPreferences | null;
  schoolOverrides?: Record<string, CampusDisplayPreferences>;
  source: 'SCHOOL_OVERRIDE' | 'ORGANIZATION_DEFAULT' | 'SYSTEM_DEFAULT';
  schoolId?: string | null;
  organizationId: string;
}

export const DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES: CampusDisplayPreferences = {
  mobileFormat: '03XX-XXXXXXX',
  landlineFormat: '0XX-XXXXXXX',
  cnicFormat: 'XXXXX-XXXXXXX-X',
};

/**
 * Resolves effective display preferences using hierarchical inheritance:
 * School Override -> Organization Default -> CampusOS Default
 */
export function resolveEffectiveDisplayPreferences(
  orgPrefs?: CampusDisplayPreferences | null,
  schoolPrefs?: CampusDisplayPreferences | null
): CampusDisplayPreferences {
  return {
    mobileFormat: schoolPrefs?.mobileFormat || orgPrefs?.mobileFormat || DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES.mobileFormat,
    landlineFormat: schoolPrefs?.landlineFormat || orgPrefs?.landlineFormat || DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES.landlineFormat,
    cnicFormat: schoolPrefs?.cnicFormat || orgPrefs?.cnicFormat || DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES.cnicFormat,
  };
}

/**
 * Shared Mobile Display Formatter.
 * Formats a canonical or raw mobile number according to the chosen display preference.
 */
export function formatMobile(
  value: string | null | undefined,
  format: MobileDisplayFormat = '03XX-XXXXXXX',
  country: CountryCode = 'PK'
): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return value;

  const upperCountry = (country || 'PK').toUpperCase();

  if (upperCountry === 'PK' || upperCountry === 'PAKISTAN') {
    // Extract subscriber components from 11 domestic or 12 canonical (923XXXXXXXXX) digits
    let domesticDigits = digits;
    if (digits.startsWith('923') && digits.length === 12) {
      domesticDigits = `0${digits.slice(2)}`;
    } else if (digits.startsWith('3') && digits.length === 10) {
      domesticDigits = `0${digits}`;
    }

    if (domesticDigits.startsWith('03') && domesticDigits.length === 11) {
      const net = domesticDigits.slice(0, 4); // 0345
      const sub = domesticDigits.slice(4);    // 1123603
      const intNet = domesticDigits.slice(1, 4); // 345

      switch (format) {
        case '03XX-XXXXXXX':
        case 'NATIONAL':
          return `${net}-${sub}`;
        case '03XXXXXXXXX':
          return domesticDigits;
        case '+92 XXX XXXXXXX':
        case 'INTERNATIONAL':
          return `+92 ${intNet} ${sub}`;
        case 'E164':
          return `+92${intNet}${sub}`;
        default:
          return `${net}-${sub}`;
      }
    }
  }

  return value;
}

/**
 * Shared Landline Display Formatter.
 * Handles Pakistan area code variations (2-digit e.g. 021/042/051 or 3-digit/4-digit area codes).
 */
export function formatLandline(
  value: string | null | undefined,
  format: LandlineDisplayFormat = '0XX-XXXXXXX',
  country: CountryCode = 'PK'
): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return value;

  const upperCountry = (country || 'PK').toUpperCase();

  if (upperCountry === 'PK' || upperCountry === 'PAKISTAN') {
    let domesticDigits = digits;
    if (digits.startsWith('92') && digits.length >= 10) {
      domesticDigits = `0${digits.slice(2)}`;
    }

    if (domesticDigits.startsWith('0') && domesticDigits.length >= 9 && domesticDigits.length <= 11) {
      // 2-digit NDC area codes: 021 (Karachi), 042 (Lahore), 051 (Islamabad), 022 (Hyderabad), 061 (Multan), etc.
      let areaCode = domesticDigits.slice(0, 3);
      let subscriber = domesticDigits.slice(3);

      // Check if area code is 4 digits (e.g. 0992)
      if (domesticDigits.length === 11 && !['021', '042', '051'].includes(areaCode)) {
        areaCode = domesticDigits.slice(0, 4);
        subscriber = domesticDigits.slice(4);
      }

      const intArea = areaCode.replace(/^0/, '');

      switch (format) {
        case '0XX-XXXXXXX':
        case 'DOMESTIC_HYPHEN':
          return `${areaCode}-${subscriber}`;
        case '0XX XXXXXXX':
        case '0XX XXXXXXXX':
        case 'DOMESTIC_SPACE':
          return `${areaCode} ${subscriber}`;
        case '+92 XX XXXXXXXX':
        case '+92 XX XXXXXXX':
        case 'INTERNATIONAL':
          return `+92 ${intArea} ${subscriber}`;
        default: {
          const fmtStr = String(format || '');
          if (fmtStr.startsWith('+')) {
            return `+92 ${intArea} ${subscriber}`;
          }
          if (fmtStr.includes(' ')) {
            return `${areaCode} ${subscriber}`;
          }
          return `${areaCode}-${subscriber}`;
        }
      }
    }
  }

  return value;
}

export function formatPhone(
  value: string | null | undefined,
  format: LandlineDisplayFormat = '0XX-XXXXXXX',
  country: CountryCode = 'PK'
): string {
  return formatLandline(value, format, country);
}

/**
 * Shared CNIC Display Formatter.
 */
export function formatCnic(
  value: string | null | undefined,
  format: CnicDisplayFormat = 'XXXXX-XXXXXXX-X'
): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 13) return value;

  switch (format) {
    case 'XXXXX-XXXXXXX-X':
    case 'DASHED':
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    case 'XXXXXXXXXXXXX':
    case 'PLAIN':
      return digits;
    default:
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
}

export const formatCnicDisplay = formatCnic;

/**
 * Universal contact display formatter for any semantic type.
 */
export function formatContactValue(
  type: SemanticDataType,
  value: string | null | undefined,
  options?: {
    mobileFormat?: MobileDisplayFormat;
    landlineFormat?: LandlineDisplayFormat;
    cnicFormat?: CnicDisplayFormat;
    country?: CountryCode;
  }
): string {
  if (!value) return '';
  const country = options?.country || 'PK';
  switch (type) {
    case 'MOBILE':
    case 'WHATSAPP':
      return formatMobile(value, options?.mobileFormat, country);
    case 'PHONE':
      return formatLandline(value, options?.landlineFormat, country);
    case 'CNIC':
      return formatCnic(value, options?.cnicFormat);
    case 'EMAIL':
      return value.trim().toLowerCase();
    case 'URL':
      return value.trim();
    default:
      return String(value);
  }
}

/**
 * Standard canonical sample values used across the platform to derive dynamic field placeholders and examples.
 */
export const CANONICAL_SAMPLE_DATA = {
  MOBILE_PK: '03451123603',
  LANDLINE_PK: '02134567890',
  CNIC: '4250130645128',
  EMAIL: 'admin@beaconhorizon.edu.pk',
  URL: 'https://beaconhorizon.edu.pk',
};

/**
 * Dynamic example generator for Mobile fields based on active display preference.
 */
export function getMobileExample(
  format: MobileDisplayFormat = '03XX-XXXXXXX',
  country: CountryCode = 'PK'
): string {
  return formatMobile(CANONICAL_SAMPLE_DATA.MOBILE_PK, format, country);
}

/**
 * Dynamic example generator for Landline / PTCL fields based on active display preference.
 */
export function getLandlineExample(
  format: LandlineDisplayFormat = '0XX-XXXXXXX',
  country: CountryCode = 'PK'
): string {
  return formatLandline(CANONICAL_SAMPLE_DATA.LANDLINE_PK, format, country);
}

export const getPhoneExample = getLandlineExample;

/**
 * Dynamic example generator for CNIC fields based on active display preference.
 */
export function getCnicExample(
  format: CnicDisplayFormat = 'XXXXX-XXXXXXX-X'
): string {
  return formatCnic(CANONICAL_SAMPLE_DATA.CNIC, format);
}

/**
 * Universal dynamic example/placeholder generator for any semantic data type.
 */
export function getContactExample(
  type: SemanticDataType,
  options?: {
    mobileFormat?: MobileDisplayFormat;
    landlineFormat?: LandlineDisplayFormat;
    cnicFormat?: CnicDisplayFormat;
    country?: CountryCode;
  }
): string {
  switch (type) {
    case 'MOBILE':
    case 'WHATSAPP':
      return getMobileExample(options?.mobileFormat, options?.country);
    case 'PHONE':
      return getLandlineExample(options?.landlineFormat, options?.country);
    case 'CNIC':
      return getCnicExample(options?.cnicFormat);
    case 'EMAIL':
      return CANONICAL_SAMPLE_DATA.EMAIL;
    case 'URL':
      return CANONICAL_SAMPLE_DATA.URL;
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// 8. IMPORT & DUPLICATE & LOGIN & SEARCH NORMALIZATION
// ---------------------------------------------------------------------------
/**
 * Normalizes mixed-format import data (e.g. from CSV/Excel) to canonical identity.
 */
export function normalizeImportValue(
  type: SemanticDataType,
  value: unknown,
  country: CountryCode = 'PK'
): { valid: boolean; canonical: string | null; error?: string } {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return { valid: true, canonical: null };
  }

  const str = String(value).trim();

  switch (type) {
    case 'CNIC': {
      if (!isValidCnic(str)) {
        return { valid: false, canonical: null, error: VALIDATION_ERROR_MESSAGES.CNIC_INVALID };
      }
      return { valid: true, canonical: normalizeCnic(str) };
    }
    case 'MOBILE':
    case 'WHATSAPP': {
      if (!isValidMobile(str, country)) {
        return { valid: false, canonical: null, error: VALIDATION_ERROR_MESSAGES.MOBILE_INVALID };
      }
      return { valid: true, canonical: normalizeMobile(str, country) };
    }
    case 'PHONE': {
      if (!isValidPhone(str, country)) {
        return { valid: false, canonical: null, error: VALIDATION_ERROR_MESSAGES.PHONE_INVALID };
      }
      return { valid: true, canonical: normalizePhone(str, country) };
    }
    case 'EMAIL': {
      if (!isValidEmail(str)) {
        return { valid: false, canonical: null, error: VALIDATION_ERROR_MESSAGES.EMAIL_INVALID };
      }
      return { valid: true, canonical: normalizeEmail(str) };
    }
    case 'URL': {
      if (!isValidUrl(str)) {
        return { valid: false, canonical: null, error: VALIDATION_ERROR_MESSAGES.URL_INVALID };
      }
      return { valid: true, canonical: normalizeUrl(str) };
    }
    default:
      return { valid: true, canonical: str };
  }
}

export const normalizeCnicForImport = (val: unknown) => normalizeImportValue('CNIC', val);
export const normalizeMobileForImport = (val: unknown, country = 'PK') => normalizeImportValue('MOBILE', val, country);
export const normalizePhoneForImport = (val: unknown, country = 'PK') => normalizeImportValue('PHONE', val, country);

/**
 * Resolves user login identifier to its canonical identity.
 * Supports:
 * - CNIC login (both 42501-3064512-8 and 4250130645128 resolve to 4250130645128)
 * - Email login (normalized to lowercase)
 * - Phone login (normalized to canonical mobile/phone identity)
 * - Username / System ID (trimmed)
 */
export function resolveLoginIdentifier(input: string | null | undefined): {
  type: 'CNIC' | 'EMAIL' | 'PHONE' | 'USERNAME';
  canonical: string;
  original: string;
} {
  if (!input) return { type: 'USERNAME', canonical: '', original: '' };
  const trimmed = input.trim();

  // 1. Check if input is CNIC candidate (13 digits or 5-7-1 dashed format)
  if (isValidCnic(trimmed)) {
    return {
      type: 'CNIC',
      canonical: normalizeCnic(trimmed)!,
      original: trimmed,
    };
  }

  // 2. Check if input is Email
  if (trimmed.includes('@') && isValidEmail(trimmed)) {
    return {
      type: 'EMAIL',
      canonical: normalizeEmail(trimmed)!,
      original: trimmed,
    };
  }

  // 3. Check if input is Mobile
  if (isValidMobile(trimmed)) {
    return {
      type: 'PHONE',
      canonical: normalizeMobile(trimmed)!,
      original: trimmed,
    };
  }

  // 4. Default Username / Registration Code / ID
  return {
    type: 'USERNAME',
    canonical: trimmed,
    original: trimmed,
  };
}

/**
 * Search normalization: converts query into canonical representation where appropriate
 * so searching '42501-3064512-8' matches stored '4250130645128'.
 */
export function normalizeSearchQuery(
  type: SemanticDataType | 'AUTO',
  query: string | null | undefined,
  country: CountryCode = 'PK'
): string {
  if (!query) return '';
  const trimmed = query.trim();

  if (type === 'CNIC' || (type === 'AUTO' && isValidCnic(trimmed))) {
    return normalizeCnic(trimmed) || trimmed;
  }

  if (type === 'MOBILE' || (type === 'AUTO' && isValidMobile(trimmed, country))) {
    return normalizeMobile(trimmed, country) || trimmed;
  }

  if (type === 'PHONE' || (type === 'AUTO' && isValidPhone(trimmed, country))) {
    return normalizePhone(trimmed, country) || trimmed;
  }

  if (type === 'EMAIL' || (type === 'AUTO' && isValidEmail(trimmed))) {
    return normalizeEmail(trimmed) || trimmed;
  }

  return trimmed;
}

// ---------------------------------------------------------------------------
// 9. REUSABLE ZOD SCHEMAS (FRONTEND + API + BACKEND DTOs)
// ---------------------------------------------------------------------------

export const zOptionalEmail = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeEmail(val))
  .refine((val) => val === null || isValidEmail(val), {
    message: VALIDATION_ERROR_MESSAGES.EMAIL_INVALID,
  });

export const zRequiredEmail = z
  .string({ required_error: VALIDATION_ERROR_MESSAGES.REQUIRED })
  .transform((val) => normalizeEmail(val) || '')
  .refine((val) => isValidEmail(val), {
    message: VALIDATION_ERROR_MESSAGES.EMAIL_INVALID,
  });

export const zOptionalUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeUrl(val))
  .refine((val) => val === null || isValidUrl(val), {
    message: VALIDATION_ERROR_MESSAGES.URL_INVALID,
  });

export const zRequiredUrl = z
  .string({ required_error: VALIDATION_ERROR_MESSAGES.REQUIRED })
  .transform((val) => normalizeUrl(val) || '')
  .refine((val) => isValidUrl(val), {
    message: VALIDATION_ERROR_MESSAGES.URL_INVALID,
  });

export const zOptionalMobile = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeMobile(val))
  .refine((val) => val === null || isValidMobile(val), {
    message: VALIDATION_ERROR_MESSAGES.MOBILE_INVALID,
  });

export const zRequiredMobile = z
  .string({ required_error: VALIDATION_ERROR_MESSAGES.REQUIRED })
  .transform((val) => normalizeMobile(val) || '')
  .refine((val) => isValidMobile(val), {
    message: VALIDATION_ERROR_MESSAGES.MOBILE_INVALID,
  });

export const zOptionalPhone = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizePhone(val))
  .refine((val) => val === null || isValidPhone(val), {
    message: VALIDATION_ERROR_MESSAGES.PHONE_INVALID,
  });

export const zRequiredPhone = z
  .string({ required_error: VALIDATION_ERROR_MESSAGES.REQUIRED })
  .transform((val) => normalizePhone(val) || '')
  .refine((val) => isValidPhone(val), {
    message: VALIDATION_ERROR_MESSAGES.PHONE_INVALID,
  });

export const zOptionalWhatsApp = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeWhatsApp(val))
  .refine((val) => val === null || isValidWhatsApp(val), {
    message: VALIDATION_ERROR_MESSAGES.WHATSAPP_INVALID,
  });

export const zRequiredWhatsApp = z
  .string({ required_error: VALIDATION_ERROR_MESSAGES.REQUIRED })
  .transform((val) => normalizeWhatsApp(val) || '')
  .refine((val) => isValidWhatsApp(val), {
    message: VALIDATION_ERROR_MESSAGES.WHATSAPP_INVALID,
  });

export const zOptionalCnic = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeCnic(val))
  .refine((val) => val === null || isValidCnic(val), {
    message: VALIDATION_ERROR_MESSAGES.CNIC_INVALID,
  });

export const zRequiredCnic = z
  .string({ required_error: VALIDATION_ERROR_MESSAGES.REQUIRED })
  .transform((val) => normalizeCnic(val) || '')
  .refine((val) => isValidCnic(val), {
    message: VALIDATION_ERROR_MESSAGES.CNIC_INVALID,
  });

/**
 * Generic semantic field validator for Dynamic Forms and custom fields.
 */
export function validateSemanticField(
  type: SemanticDataType,
  value: unknown,
  required = false,
  country: CountryCode = 'PK'
): { valid: boolean; error?: string; normalizedValue?: string | null } {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    if (required) {
      return { valid: false, error: VALIDATION_ERROR_MESSAGES.REQUIRED };
    }
    return { valid: true, normalizedValue: null };
  }

  const strVal = String(value);

  switch (type) {
    case 'EMAIL':
      if (!isValidEmail(strVal)) return { valid: false, error: VALIDATION_ERROR_MESSAGES.EMAIL_INVALID };
      return { valid: true, normalizedValue: normalizeEmail(strVal) };
    case 'URL':
      if (!isValidUrl(strVal)) return { valid: false, error: VALIDATION_ERROR_MESSAGES.URL_INVALID };
      return { valid: true, normalizedValue: normalizeUrl(strVal) };
    case 'MOBILE':
      if (!isValidMobile(strVal, country)) return { valid: false, error: VALIDATION_ERROR_MESSAGES.MOBILE_INVALID };
      return { valid: true, normalizedValue: normalizeMobile(strVal, country) };
    case 'PHONE':
      if (!isValidPhone(strVal, country)) return { valid: false, error: VALIDATION_ERROR_MESSAGES.PHONE_INVALID };
      return { valid: true, normalizedValue: normalizePhone(strVal, country) };
    case 'WHATSAPP':
      if (!isValidWhatsApp(strVal, country)) return { valid: false, error: VALIDATION_ERROR_MESSAGES.WHATSAPP_INVALID };
      return { valid: true, normalizedValue: normalizeWhatsApp(strVal, country) };
    case 'CNIC':
      if (!isValidCnic(strVal)) return { valid: false, error: VALIDATION_ERROR_MESSAGES.CNIC_INVALID };
      return { valid: true, normalizedValue: normalizeCnic(strVal) };
    default:
      return { valid: true, normalizedValue: strVal.trim() };
  }
}

export interface ContactValidationInput {
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  mobile?: string | null;
  cellPhone?: string | null;
  website?: string | null;
  websiteUrl?: string | null;
  whatsappNumber?: string | null;
  cnic?: string | null;
  country?: CountryCode;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  normalized: {
    email: string | null;
    phone: string | null;
    alternatePhone: string | null;
    mobile: string | null;
    cellPhone: string | null;
    website: string | null;
    websiteUrl: string | null;
    whatsappNumber: string | null;
    cnic: string | null;
  };
}

/**
 * Validates and normalizes structured contact fields across all CampusOS entities and DTOs.
 */
export function validateAndNormalizeContactFields(input: ContactValidationInput): ContactValidationResult {
  const errors: Record<string, string> = {};
  const country = input.country || 'PK';
  const normalized = {
    email: null as string | null,
    phone: null as string | null,
    alternatePhone: null as string | null,
    mobile: null as string | null,
    cellPhone: null as string | null,
    website: null as string | null,
    websiteUrl: null as string | null,
    whatsappNumber: null as string | null,
    cnic: null as string | null,
  };

  // Email
  if (input.email !== undefined && input.email !== null && input.email.trim() !== '') {
    if (!isValidEmail(input.email)) {
      errors['email'] = VALIDATION_ERROR_MESSAGES.EMAIL_INVALID;
    } else {
      normalized.email = normalizeEmail(input.email);
    }
  }

  // Phone / Official Phone
  if (input.phone !== undefined && input.phone !== null && input.phone.trim() !== '') {
    if (!isValidPhone(input.phone, country)) {
      errors['phone'] = VALIDATION_ERROR_MESSAGES.PHONE_INVALID;
    } else {
      normalized.phone = normalizePhone(input.phone, country);
    }
  }

  // Alternate Phone
  if (input.alternatePhone !== undefined && input.alternatePhone !== null && input.alternatePhone.trim() !== '') {
    if (!isValidPhone(input.alternatePhone, country)) {
      errors['alternatePhone'] = VALIDATION_ERROR_MESSAGES.PHONE_INVALID;
    } else {
      normalized.alternatePhone = normalizePhone(input.alternatePhone, country);
    }
  }

  // Mobile
  if (input.mobile !== undefined && input.mobile !== null && input.mobile.trim() !== '') {
    if (!isValidMobile(input.mobile, country)) {
      errors['mobile'] = VALIDATION_ERROR_MESSAGES.MOBILE_INVALID;
    } else {
      normalized.mobile = normalizeMobile(input.mobile, country);
    }
  }

  // Cell Phone (alias for Mobile)
  if (input.cellPhone !== undefined && input.cellPhone !== null && input.cellPhone.trim() !== '') {
    if (!isValidMobile(input.cellPhone, country)) {
      errors['cellPhone'] = VALIDATION_ERROR_MESSAGES.MOBILE_INVALID;
    } else {
      normalized.cellPhone = normalizeMobile(input.cellPhone, country);
    }
  }

  // Website
  if (input.website !== undefined && input.website !== null && input.website.trim() !== '') {
    if (!isValidUrl(input.website)) {
      errors['website'] = VALIDATION_ERROR_MESSAGES.URL_INVALID;
    } else {
      normalized.website = normalizeUrl(input.website);
    }
  }

  // Website URL
  if (input.websiteUrl !== undefined && input.websiteUrl !== null && input.websiteUrl.trim() !== '') {
    if (!isValidUrl(input.websiteUrl)) {
      errors['websiteUrl'] = VALIDATION_ERROR_MESSAGES.URL_INVALID;
    } else {
      normalized.websiteUrl = normalizeUrl(input.websiteUrl);
    }
  }

  // WhatsApp Number
  if (input.whatsappNumber !== undefined && input.whatsappNumber !== null && input.whatsappNumber.trim() !== '') {
    if (!isValidWhatsApp(input.whatsappNumber, country)) {
      errors['whatsappNumber'] = VALIDATION_ERROR_MESSAGES.WHATSAPP_INVALID;
    } else {
      normalized.whatsappNumber = normalizeWhatsApp(input.whatsappNumber, country);
    }
  }

  // CNIC
  if (input.cnic !== undefined && input.cnic !== null && input.cnic.trim() !== '') {
    if (!isValidCnic(input.cnic)) {
      errors['cnic'] = VALIDATION_ERROR_MESSAGES.CNIC_INVALID;
    } else {
      normalized.cnic = normalizeCnic(input.cnic);
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized,
  };
}

