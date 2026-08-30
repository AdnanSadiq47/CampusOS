'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES,
  resolveEffectiveDisplayPreferences,
  formatMobile,
  formatLandline,
  formatCnic,
  formatContactValue,
  getMobileExample,
  getLandlineExample,
  getCnicExample,
  getContactExample,
  CANONICAL_SAMPLE_DATA,
} from '@campus-os/types';
import type {
  MobileDisplayFormat,
  LandlineDisplayFormat,
  CnicDisplayFormat,
  CampusDisplayPreferences,
  SaveDisplayPreferencesDto,
  ResolvedDisplayPreferencesDto,
  CountryCode,
  SemanticDataType,
} from '@campus-os/types';
import { Settings2, Phone, Smartphone, CreditCard, Check, Undo2, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { useWorkingContext, ALL_CAMPUSES_METADATA } from '../lib/working-context';

const DEFAULT_ORG_ID = '11111111-1111-1111-1111-111111111111';

export async function apiFetchDisplayPreferences(
  schoolId?: string | null,
  campusId?: string | null,
  tenantId: string = DEFAULT_ORG_ID
): Promise<ResolvedDisplayPreferencesDto | null> {
  try {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId);
    if (campusId) params.append('campusId', campusId);

    const res = await fetch(`/api/display-preferences?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-user-permissions': 'SUPER_ADMIN,*,MANAGE_ORGANIZATION,MANAGE_SCHOOL,SCHOOL_VIEW',
        'x-user-role': 'SUPER_ADMIN',
      },
    });

    if (res.ok) {
      return (await res.json()) as ResolvedDisplayPreferencesDto;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiSaveDisplayPreferences(
  dto: SaveDisplayPreferencesDto,
  tenantId: string = DEFAULT_ORG_ID
): Promise<{ success: boolean; data?: ResolvedDisplayPreferencesDto; error?: string }> {
  try {
    const res = await fetch('/api/display-preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-user-permissions': 'SUPER_ADMIN,*,MANAGE_ORGANIZATION,MANAGE_SCHOOL,SCHOOL_VIEW',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.message || `Failed to save display preferences (HTTP ${res.status}).`;
      const formattedMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      return { success: false, error: formattedMsg };
    }

    const data: ResolvedDisplayPreferencesDto = await res.json();
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error while saving preferences.';
    return { success: false, error: msg };
  }
}

export async function apiResetDisplayPreferences(
  schoolId: string,
  tenantId: string = DEFAULT_ORG_ID
): Promise<{ success: boolean; data?: ResolvedDisplayPreferencesDto; error?: string }> {
  return apiSaveDisplayPreferences(
    {
      schoolId,
      useOrganizationDefault: true,
    },
    tenantId
  );
}

export interface DisplayPreferencesContextType {
  preferences: CampusDisplayPreferences;
  organizationDefault: CampusDisplayPreferences | null;
  schoolOverride: CampusDisplayPreferences | null;
  schoolOverrides: Record<string, CampusDisplayPreferences>;
  source: 'SCHOOL_OVERRIDE' | 'ORGANIZATION_DEFAULT' | 'SYSTEM_DEFAULT';
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  activeSchoolId: string | null;
  mobilePlaceholder: string;
  landlinePlaceholder: string;
  phonePlaceholder: string;
  cnicPlaceholder: string;
  getPlaceholder: (type: SemanticDataType, country?: CountryCode, context?: { schoolId?: string | null; campusId?: string | null }) => string;
  getExample: (type: SemanticDataType, country?: CountryCode, context?: { schoolId?: string | null; campusId?: string | null }) => string;
  getHelpText: (type: SemanticDataType, country?: CountryCode, context?: { schoolId?: string | null; campusId?: string | null }) => string;
  resolvePreferences: (context?: { schoolId?: string | null; campusId?: string | null }) => CampusDisplayPreferences;
  getPlaceholders: (context?: { schoolId?: string | null; campusId?: string | null }) => {
    mobile: string;
    landline: string;
    phone: string;
    whatsapp: string;
    cnic: string;
    email: string;
    url: string;
    getPlaceholder: (type: SemanticDataType, country?: CountryCode) => string;
    getHelpText: (type: SemanticDataType, country?: CountryCode) => string;
  };
  setActiveSchoolId: (schoolId: string | null) => void;
  fetchPreferences: (schoolId?: string | null, campusId?: string | null) => Promise<ResolvedDisplayPreferencesDto | null>;
  savePreferences: (dto: SaveDisplayPreferencesDto) => Promise<{ success: boolean; data?: ResolvedDisplayPreferencesDto; error?: string }>;
  resetToOrganizationDefault: (schoolId: string) => Promise<{ success: boolean; data?: ResolvedDisplayPreferencesDto; error?: string }>;
}

const defaultGetPlaceholders = () => ({
  mobile: '0345-1123603',
  landline: '021-34567890',
  phone: '021-34567890',
  whatsapp: '0345-1123603',
  cnic: '42501-3064512-8',
  email: CANONICAL_SAMPLE_DATA.EMAIL,
  url: CANONICAL_SAMPLE_DATA.URL,
  getPlaceholder: () => '',
  getHelpText: () => '',
});

const DisplayPreferencesContext = createContext<DisplayPreferencesContextType>({
  preferences: DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES,
  organizationDefault: null,
  schoolOverride: null,
  schoolOverrides: {},
  source: 'SYSTEM_DEFAULT',
  isLoading: false,
  isSaving: false,
  error: null,
  activeSchoolId: null,
  mobilePlaceholder: '0345-1123603',
  landlinePlaceholder: '021-34567890',
  phonePlaceholder: '021-34567890',
  cnicPlaceholder: '42501-3064512-8',
  getPlaceholder: () => '',
  getExample: () => '',
  getHelpText: () => '',
  resolvePreferences: () => DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES,
  getPlaceholders: defaultGetPlaceholders,
  setActiveSchoolId: () => {},
  fetchPreferences: (schoolId, campusId) => apiFetchDisplayPreferences(schoolId, campusId),
  savePreferences: (dto) => apiSaveDisplayPreferences(dto),
  resetToOrganizationDefault: (schoolId) => apiResetDisplayPreferences(schoolId),
});

export function DisplayPreferencesProvider({
  children,
  initialSchoolId,
  initialCampusId,
  tenantId = DEFAULT_ORG_ID,
}: {
  children: React.ReactNode;
  initialSchoolId?: string | null;
  initialCampusId?: string | null;
  tenantId?: string;
}) {
  const workingCtx = useWorkingContext();
  const currentCtx = workingCtx?.currentContext;
  const workingSchoolId = currentCtx?.type === 'SCHOOL' ? currentCtx.id : null;
  const workingCampusId = currentCtx?.type === 'CAMPUS' ? currentCtx.id : null;

  const [preferences, setPreferences] = useState<CampusDisplayPreferences>(DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES);
  const [organizationDefault, setOrganizationDefault] = useState<CampusDisplayPreferences | null>(null);
  const [schoolOverride, setSchoolOverride] = useState<CampusDisplayPreferences | null>(null);
  const [schoolOverrides, setSchoolOverrides] = useState<Record<string, CampusDisplayPreferences>>({});
  const [source, setSource] = useState<'SCHOOL_OVERRIDE' | 'ORGANIZATION_DEFAULT' | 'SYSTEM_DEFAULT'>('SYSTEM_DEFAULT');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(initialSchoolId || workingSchoolId || null);

  useEffect(() => {
    if (workingSchoolId) {
      setActiveSchoolId(workingSchoolId);
    }
  }, [workingSchoolId]);

  const fetchPreferences = useCallback(
    async (schoolId?: string | null, campusId?: string | null): Promise<ResolvedDisplayPreferencesDto | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const targetSchool = schoolId !== undefined ? schoolId : activeSchoolId;
        const targetCampus = campusId !== undefined ? campusId : (initialCampusId || workingCampusId);
        const data = await apiFetchDisplayPreferences(targetSchool, targetCampus, tenantId);

        if (data) {
          setPreferences(data.effective || DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES);
          setOrganizationDefault(data.organizationDefault);
          setSchoolOverride(data.schoolOverride);
          if (data.schoolOverrides) {
            setSchoolOverrides(data.schoolOverrides);
          } else if (data.schoolId && data.schoolOverride) {
            setSchoolOverrides((prev) => ({ ...prev, [data.schoolId!]: data.schoolOverride! }));
          }
          setSource(data.source);
          return data;
        } else {
          setPreferences(DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES);
          return null;
        }
      } catch (err) {
        setPreferences(DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [activeSchoolId, initialCampusId, workingCampusId, tenantId]
  );

  useEffect(() => {
    fetchPreferences(activeSchoolId, initialCampusId || workingCampusId);
  }, [activeSchoolId, initialCampusId, workingCampusId, fetchPreferences]);

  const savePreferences = useCallback(
    async (dto: SaveDisplayPreferencesDto): Promise<{ success: boolean; data?: ResolvedDisplayPreferencesDto; error?: string }> => {
      setIsSaving(true);
      setError(null);
      try {
        const result = await apiSaveDisplayPreferences(dto, tenantId);
        if (result.success && result.data) {
          setPreferences(result.data.effective);
          setOrganizationDefault(result.data.organizationDefault);
          setSchoolOverride(result.data.schoolOverride);
          if (result.data.schoolOverrides) {
            setSchoolOverrides(result.data.schoolOverrides);
          } else if (result.data.schoolId && result.data.schoolOverride) {
            setSchoolOverrides((prev) => ({ ...prev, [result.data!.schoolId!]: result.data!.schoolOverride! }));
          }
          setSource(result.data.source);
        } else if (result.error) {
          setError(result.error);
        }
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [tenantId]
  );

  const resetToOrganizationDefault = useCallback(
    async (schoolId: string) => {
      return savePreferences({
        schoolId,
        useOrganizationDefault: true,
      });
    },
    [savePreferences]
  );

  /**
   * Centralized Hierarchical Resolver across ERP Contexts:
   * Record School Override -> Organization Default -> CampusOS System Default
   */
  const resolvePreferences = useCallback(
    (context?: { schoolId?: string | null; campusId?: string | null }): CampusDisplayPreferences => {
      // 1. Context explicitly provided with a schoolId
      if (context && 'schoolId' in context) {
        const sid = context.schoolId;
        if (sid) {
          const override = schoolOverrides[sid];
          if (override) {
            return resolveEffectiveDisplayPreferences(organizationDefault, override);
          }
        }
        // Explicitly schoolId=null / empty (e.g. Head Office, Region, New School Create) -> Org Default
        return resolveEffectiveDisplayPreferences(organizationDefault, null);
      }

      // 2. Context provided with campusId
      if (context?.campusId) {
        const sid = ALL_CAMPUSES_METADATA.find(
          (c) => c.id === context.campusId || c.code === context.campusId
        )?.schoolId;
        if (sid) {
          const override = schoolOverrides[sid];
          if (override) {
            return resolveEffectiveDisplayPreferences(organizationDefault, override);
          }
        }
        return resolveEffectiveDisplayPreferences(organizationDefault, null);
      }

      // 3. Fall back to current active preferences from provider
      return preferences;
    },
    [schoolOverrides, organizationDefault, preferences]
  );

  const mobilePlaceholder = useMemo(() => getMobileExample(preferences.mobileFormat), [preferences.mobileFormat]);
  const landlinePlaceholder = useMemo(() => getLandlineExample(preferences.landlineFormat), [preferences.landlineFormat]);
  const phonePlaceholder = landlinePlaceholder;
  const cnicPlaceholder = useMemo(() => getCnicExample(preferences.cnicFormat), [preferences.cnicFormat]);

  const getPlaceholder = useCallback(
    (type: SemanticDataType, country: CountryCode = 'PK', context?: { schoolId?: string | null; campusId?: string | null }) => {
      const prefs = resolvePreferences(context);
      return getContactExample(type, {
        mobileFormat: prefs.mobileFormat,
        landlineFormat: prefs.landlineFormat,
        cnicFormat: prefs.cnicFormat,
        country,
      });
    },
    [resolvePreferences]
  );

  const getExample = getPlaceholder;

  const getHelpText = useCallback(
    (type: SemanticDataType, country: CountryCode = 'PK', context?: { schoolId?: string | null; campusId?: string | null }) => {
      const example = getPlaceholder(type, country, context);
      switch (type) {
        case 'MOBILE':
        case 'WHATSAPP':
          return `Format: e.g. ${example} (flexible domestic/international accepted)`;
        case 'PHONE':
          return `Format: e.g. ${example} (landline with area code)`;
        case 'CNIC':
          return `Format: e.g. ${example} (13-digit national identity)`;
        case 'EMAIL':
          return 'Format: e.g. name@domain.edu.pk';
        case 'URL':
          return 'Format: e.g. https://domain.edu.pk';
        default:
          return '';
      }
    },
    [getPlaceholder]
  );

  const getPlaceholders = useCallback(
    (context?: { schoolId?: string | null; campusId?: string | null }) => {
      const prefs = resolvePreferences(context);
      const mEx = getMobileExample(prefs.mobileFormat);
      const lEx = getLandlineExample(prefs.landlineFormat);
      const cEx = getCnicExample(prefs.cnicFormat);

      return {
        mobile: mEx,
        landline: lEx,
        phone: lEx,
        whatsapp: mEx,
        cnic: cEx,
        email: CANONICAL_SAMPLE_DATA.EMAIL,
        url: CANONICAL_SAMPLE_DATA.URL,
        getPlaceholder: (type: SemanticDataType, country: CountryCode = 'PK') => {
          return getContactExample(type, {
            mobileFormat: prefs.mobileFormat,
            landlineFormat: prefs.landlineFormat,
            cnicFormat: prefs.cnicFormat,
            country,
          });
        },
        getHelpText: (type: SemanticDataType, country: CountryCode = 'PK') => {
          const ex = getContactExample(type, {
            mobileFormat: prefs.mobileFormat,
            landlineFormat: prefs.landlineFormat,
            cnicFormat: prefs.cnicFormat,
            country,
          });
          switch (type) {
            case 'MOBILE':
            case 'WHATSAPP':
              return `Format: e.g. ${ex} (flexible domestic/international accepted)`;
            case 'PHONE':
              return `Format: e.g. ${ex} (landline with area code)`;
            case 'CNIC':
              return `Format: e.g. ${ex} (13-digit national identity)`;
            case 'EMAIL':
              return 'Format: e.g. name@domain.edu.pk';
            case 'URL':
              return 'Format: e.g. https://domain.edu.pk';
            default:
              return '';
          }
        },
      };
    },
    [resolvePreferences]
  );

  return (
    <DisplayPreferencesContext.Provider
      value={{
        preferences,
        organizationDefault,
        schoolOverride,
        schoolOverrides,
        source,
        isLoading,
        isSaving,
        error,
        activeSchoolId,
        mobilePlaceholder,
        landlinePlaceholder,
        phonePlaceholder,
        cnicPlaceholder,
        getPlaceholder,
        getExample,
        getHelpText,
        resolvePreferences,
        getPlaceholders,
        setActiveSchoolId,
        fetchPreferences,
        savePreferences,
        resetToOrganizationDefault,
      }}
    >
      {children}
    </DisplayPreferencesContext.Provider>
  );
}

export function useDisplayPreferences() {
  return useContext(DisplayPreferencesContext);
}

/**
 * Universal hook for any form across the entire ERP to obtain format-driven placeholders & examples
 * according to record context (e.g. schoolId, parent school, or Organization Default).
 */
export function useContactPlaceholders(context?: { schoolId?: string | null; campusId?: string | null } | string) {
  const { getPlaceholders } = useDisplayPreferences();
  const normalizedCtx = useMemo(() => {
    if (typeof context === 'string') return { schoolId: context };
    return context;
  }, [context]);

  return useMemo(() => {
    return getPlaceholders(normalizedCtx);
  }, [getPlaceholders, normalizedCtx]);
}

// ---------------------------------------------------------------------------
// FORMATTED DISPLAY COMPONENTS (Context-Aware Multi-Scope Rendering)
// ---------------------------------------------------------------------------

export function FormattedMobile({
  value,
  format,
  schoolId,
  country = 'PK',
  className = '',
}: {
  value: string | null | undefined;
  format?: MobileDisplayFormat;
  schoolId?: string | null;
  country?: CountryCode;
  className?: string;
}) {
  const { resolvePreferences, preferences } = useDisplayPreferences();
  const effectivePrefs = schoolId !== undefined ? resolvePreferences({ schoolId }) : preferences;
  const effectiveFormat = format || effectivePrefs.mobileFormat || '03XX-XXXXXXX';
  const formatted = formatMobile(value, effectiveFormat, country);

  if (!formatted) return <span className="text-slate-400 italic font-mono text-[11px]">—</span>;
  return <span className={`font-mono ${className}`}>{formatted}</span>;
}

export function FormattedPhone({
  value,
  format,
  schoolId,
  country = 'PK',
  className = '',
}: {
  value: string | null | undefined;
  format?: LandlineDisplayFormat;
  schoolId?: string | null;
  country?: CountryCode;
  className?: string;
}) {
  const { resolvePreferences, preferences } = useDisplayPreferences();
  const effectivePrefs = schoolId !== undefined ? resolvePreferences({ schoolId }) : preferences;
  const effectiveFormat = format || effectivePrefs.landlineFormat || '0XX-XXXXXXX';
  const formatted = formatLandline(value, effectiveFormat, country);

  if (!formatted) return <span className="text-slate-400 italic font-mono text-[11px]">—</span>;
  return <span className={`font-mono ${className}`}>{formatted}</span>;
}

export function FormattedCnic({
  value,
  format,
  schoolId,
  className = '',
}: {
  value: string | null | undefined;
  format?: CnicDisplayFormat;
  schoolId?: string | null;
  className?: string;
}) {
  const { resolvePreferences, preferences } = useDisplayPreferences();
  const effectivePrefs = schoolId !== undefined ? resolvePreferences({ schoolId }) : preferences;
  const effectiveFormat = format || effectivePrefs.cnicFormat || 'XXXXX-XXXXXXX-X';
  const formatted = formatCnic(value, effectiveFormat);

  if (!formatted) return <span className="text-slate-400 italic font-mono text-[11px]">—</span>;
  return <span className={`font-mono font-medium tracking-wide ${className}`}>{formatted}</span>;
}

export function FormattedContact({
  type,
  value,
  schoolId,
  country = 'PK',
  className = '',
}: {
  type: SemanticDataType;
  value: string | null | undefined;
  schoolId?: string | null;
  country?: CountryCode;
  className?: string;
}) {
  const { resolvePreferences, preferences } = useDisplayPreferences();
  const effectivePrefs = schoolId !== undefined ? resolvePreferences({ schoolId }) : preferences;
  const formatted = formatContactValue(type, value, {
    mobileFormat: effectivePrefs.mobileFormat,
    landlineFormat: effectivePrefs.landlineFormat,
    cnicFormat: effectivePrefs.cnicFormat,
    country,
  });

  if (!formatted) return <span className="text-slate-400 italic text-[11px]">—</span>;

  if (type === 'EMAIL') {
    return (
      <a href={`mailto:${value}`} className={`text-indigo-600 hover:underline ${className}`}>
        {formatted}
      </a>
    );
  }
  if (type === 'URL') {
    const href = formatted.startsWith('http') ? formatted : `https://${formatted}`;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`text-indigo-600 hover:underline ${className}`}>
        {formatted}
      </a>
    );
  }

  return <span className={`font-mono ${className}`}>{formatted}</span>;
}

// ---------------------------------------------------------------------------
// ADMIN DISPLAY PREFERENCES CONFIGURATION PANEL (INTERACTIVE SELECTION + SAVE UX)
// ---------------------------------------------------------------------------

export function DisplayPreferencesSettingsPanel({
  title = 'Global Display Format Preferences',
  subtitle = 'Configure presentation formatting for Mobile numbers, Landlines, and CNIC national identities in PostgreSQL database.',
}: {
  title?: string;
  subtitle?: string;
}) {
  const {
    savePreferences,
    resetToOrganizationDefault,
    fetchPreferences,
    isSaving,
  } = useDisplayPreferences();

  const [scopeLevel, setScopeLevel] = useState<'ORG' | 'SCHOOL'>('ORG');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [schoolsList, setSchoolsList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [isLoadingScope, setIsLoadingScope] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'DIRTY' | 'SAVED' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Server-confirmed state for active scope
  const [serverState, setServerState] = useState<CampusDisplayPreferences>({
    mobileFormat: '03XX-XXXXXXX',
    landlineFormat: '0XX-XXXXXXX',
    cnicFormat: 'XXXXX-XXXXXXX-X',
  });
  const [activeSource, setActiveSource] = useState<'SCHOOL_OVERRIDE' | 'ORGANIZATION_DEFAULT' | 'SYSTEM_DEFAULT'>('SYSTEM_DEFAULT');

  // Form (local selected) state
  const [formState, setFormState] = useState<CampusDisplayPreferences>({
    mobileFormat: '03XX-XXXXXXX',
    landlineFormat: '0XX-XXXXXXX',
    cnicFormat: 'XXXXX-XXXXXXX-X',
  });

  // Fetch available schools in organization for dropdown
  useEffect(() => {
    async function loadSchools() {
      try {
        const res = await fetch('/api/schools', {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': DEFAULT_ORG_ID,
            'x-user-permissions': 'SUPER_ADMIN,*,SCHOOL_VIEW',
            'x-user-role': 'SUPER_ADMIN',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.items || data.data || [];
          setSchoolsList(list);
          if (list.length > 0) {
            setSelectedSchoolId((prev) => prev || list[0].id);
          }
        }
      } catch {}
    }
    loadSchools();
  }, []);

  // Load preferences from backend whenever scope or selected school changes
  const loadPreferencesForScope = useCallback(
    async (scope: 'ORG' | 'SCHOOL', schoolId: string) => {
      setIsLoadingScope(true);
      setErrorMessage(null);
      const targetSchool = scope === 'SCHOOL' ? schoolId || (schoolsList[0]?.id || null) : null;
      const resolved = await fetchPreferences(targetSchool);
      if (resolved) {
        const eff = resolved.effective || DEFAULT_CAMPUSOS_DISPLAY_PREFERENCES;
        setServerState(eff);
        setFormState(eff);
        setActiveSource(resolved.source);
        setSaveStatus('IDLE');
      }
      setIsLoadingScope(false);
    },
    [fetchPreferences, schoolsList]
  );

  useEffect(() => {
    const effectiveSchoolId = selectedSchoolId || (schoolsList[0]?.id || '');
    loadPreferencesForScope(scopeLevel, effectiveSchoolId);
  }, [scopeLevel, selectedSchoolId, schoolsList, loadPreferencesForScope]);

  // Determine if form has unsaved local changes
  const isDirty = useMemo(() => {
    return (
      formState.mobileFormat !== serverState.mobileFormat ||
      formState.landlineFormat !== serverState.landlineFormat ||
      formState.cnicFormat !== serverState.cnicFormat
    );
  }, [formState, serverState]);

  // Handle local card selection
  const handleSelectMobile = (fmt: MobileDisplayFormat) => {
    setFormState((prev) => ({ ...prev, mobileFormat: fmt }));
    setSaveStatus('DIRTY');
    setErrorMessage(null);
  };

  const handleSelectLandline = (fmt: LandlineDisplayFormat) => {
    setFormState((prev) => ({ ...prev, landlineFormat: fmt }));
    setSaveStatus('DIRTY');
    setErrorMessage(null);
  };

  const handleSelectCnic = (fmt: CnicDisplayFormat) => {
    setFormState((prev) => ({ ...prev, cnicFormat: fmt }));
    setSaveStatus('DIRTY');
    setErrorMessage(null);
  };

  // Scope toggle with dirty check
  const handleScopeChange = (newScope: 'ORG' | 'SCHOOL') => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved display format changes. Discard changes and switch scope?');
      if (!confirmLeave) return;
    }
    if (newScope === 'SCHOOL' && !selectedSchoolId && schoolsList.length > 0 && schoolsList[0]) {
      setSelectedSchoolId(schoolsList[0].id);
    }
    setScopeLevel(newScope);
  };

  // School selector with dirty check
  const handleSchoolChange = (newSchoolId: string) => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved display format changes. Discard changes and switch school?');
      if (!confirmLeave) return;
    }
    setSelectedSchoolId(newSchoolId);
  };

  // Save Changes handler
  const handleSaveChanges = async () => {
    setErrorMessage(null);
    const targetSchoolId = scopeLevel === 'SCHOOL' ? (selectedSchoolId || schoolsList[0]?.id || null) : null;

    if (scopeLevel === 'SCHOOL' && !targetSchoolId) {
      setErrorMessage('Please select a school before saving a School-Level Override.');
      return;
    }

    const result = await savePreferences({
      schoolId: targetSchoolId,
      mobileFormat: formState.mobileFormat,
      landlineFormat: formState.landlineFormat,
      cnicFormat: formState.cnicFormat,
    });

    if (result.success && result.data) {
      setServerState(result.data.effective);
      setFormState(result.data.effective);
      setActiveSource(result.data.source);
      setSaveStatus('SAVED');
      setTimeout(() => {
        setSaveStatus('IDLE');
      }, 3500);
    } else {
      setSaveStatus('ERROR');
      setErrorMessage(result.error || 'Failed to save display preferences to database.');
    }
  };

  // Reset to Organization Default handler
  const handleResetToOrg = async () => {
    const targetSchoolId = selectedSchoolId || schoolsList[0]?.id;
    if (!targetSchoolId) return;
    const confirmReset = window.confirm('Reset this school override to Organization Default? This will delete the school override.');
    if (!confirmReset) return;

    setErrorMessage(null);
    const result = await resetToOrganizationDefault(targetSchoolId);
    if (result.success && result.data) {
      setServerState(result.data.effective);
      setFormState(result.data.effective);
      setActiveSource(result.data.source);
      setSaveStatus('SAVED');
      setTimeout(() => {
        setSaveStatus('IDLE');
      }, 3500);
    } else {
      setSaveStatus('ERROR');
      setErrorMessage(result.error || 'Failed to reset display preferences.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
      {/* HEADER + TARGET SCOPE SELECTOR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{subtitle}</p>
        </div>

        {/* CONTROLS RIGHT SIDE */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Scope Level Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleScopeChange('ORG')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                scopeLevel === 'ORG'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏢 Organization Default
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('SCHOOL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                scopeLevel === 'SCHOOL'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏫 School-Level Override
            </button>
          </div>

          {/* School Selector if School Scope is active */}
          {scopeLevel === 'SCHOOL' && (
            <div className="flex items-center gap-2">
              <label htmlFor="school-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">School:</label>
              <select
                id="school-select"
                value={selectedSchoolId || (schoolsList[0]?.id || '')}
                onChange={(e) => handleSchoolChange(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
              >
                {schoolsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PRIMARY SAVE CHANGES BUTTON */}
          <button
            type="button"
            disabled={!isDirty || isSaving || isLoadingScope}
            onClick={handleSaveChanges}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isDirty && !isSaving && !isLoadingScope
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none cursor-pointer scale-100 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/50 dark:border-slate-700/50'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STATUS BANNER & ACTIVE INHERITANCE INFO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Hierarchy Scope:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {scopeLevel === 'ORG' ? 'Organization Default (All Schools)' : `School: ${schoolsList.find(s => s.id === (selectedSchoolId || schoolsList[0]?.id))?.name || 'Selected School'}`}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Database Source:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border ${
                activeSource === 'SCHOOL_OVERRIDE'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                  : activeSource === 'ORGANIZATION_DEFAULT'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {activeSource === 'SCHOOL_OVERRIDE'
                ? '✨ School Override Active'
                : activeSource === 'ORGANIZATION_DEFAULT'
                ? '🏢 Organization Default Active'
                : '🌐 CampusOS System Default'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* DIRTY / SAVED INDICATOR */}
          {isDirty ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Unsaved Changes</span>
            </div>
          ) : saveStatus === 'SAVED' ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to Database</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Check className="w-3.5 h-3.5 text-slate-400" />
              <span>Synced with Database</span>
            </div>
          )}

          {/* Reset to Org button if school override exists */}
          {scopeLevel === 'SCHOOL' && activeSource === 'SCHOOL_OVERRIDE' && (
            <button
              type="button"
              disabled={isSaving || isLoadingScope}
              onClick={handleResetToOrg}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Reset to Organization Default</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3 PREFERENCE OPTION GROUPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. MOBILE FORMAT */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <span>Mobile Display Format</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">e.g. {getMobileExample(formState.mobileFormat)}</span>
          </div>

          <div className="space-y-2">
            {[
              { id: '03XX-XXXXXXX' as MobileDisplayFormat, label: '03XX-XXXXXXX', desc: 'Hyphenated National Standard' },
              { id: '03XXXXXXXXX' as MobileDisplayFormat, label: '03XXXXXXXXX', desc: '11-Digit Continuous' },
              { id: '+92 XXX XXXXXXX' as MobileDisplayFormat, label: '+92 XXX XXXXXXX', desc: 'International E.164 Spaced' },
            ].map((opt) => {
              const isSelected = formState.mobileFormat === opt.id;
              const formattedSample = getMobileExample(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectMobile(opt.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-2 border-indigo-600 dark:border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/70 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {formattedSample}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. LANDLINE / PTCL FORMAT */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Phone className="w-4 h-4 text-indigo-500" />
              <span>Landline / PTCL Format</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">e.g. {getLandlineExample(formState.landlineFormat)}</span>
          </div>

          <div className="space-y-2">
            {[
              { id: '0XX-XXXXXXX' as LandlineDisplayFormat, label: '0XX-XXXXXXX', desc: 'Domestic Area Hyphenated' },
              { id: '0XX XXXXXXXX' as LandlineDisplayFormat, label: '0XX XXXXXXXX', desc: 'Domestic Area Spaced' },
              { id: '+92 XX XXXXXXXX' as LandlineDisplayFormat, label: '+92 XX XXXXXXXX', desc: 'International Code Spaced' },
            ].map((opt) => {
              const isSelected =
                formState.landlineFormat === opt.id ||
                (opt.id === '0XX-XXXXXXX' && formState.landlineFormat === 'DOMESTIC_HYPHEN') ||
                (opt.id === '0XX XXXXXXXX' && (formState.landlineFormat === '0XX XXXXXXX' || formState.landlineFormat === '0XX XXXXXXXX' || formState.landlineFormat === 'DOMESTIC_SPACE')) ||
                (opt.id === '+92 XX XXXXXXXX' && (formState.landlineFormat === '+92 XX XXXXXXX' || formState.landlineFormat === '+92 XX XXXXXXXX' || formState.landlineFormat === 'INTERNATIONAL'));
              const formattedSample = getLandlineExample(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectLandline(opt.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-2 border-indigo-600 dark:border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/70 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {formattedSample}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. CNIC FORMAT */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              <span>CNIC Display Format</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">e.g. {getCnicExample(formState.cnicFormat)}</span>
          </div>

          <div className="space-y-2">
            {[
              { id: 'XXXXX-XXXXXXX-X' as CnicDisplayFormat, label: 'XXXXX-XXXXXXX-X', desc: '5-7-1 Standard National Dashed' },
              { id: 'XXXXXXXXXXXXX' as CnicDisplayFormat, label: 'XXXXXXXXXXXXX', desc: '13-Digit Plain Continuous' },
            ].map((opt) => {
              const isSelected = formState.cnicFormat === opt.id || (opt.id === 'XXXXX-XXXXXXX-X' && formState.cnicFormat === 'DASHED') || (opt.id === 'XXXXXXXXXXXXX' && formState.cnicFormat === 'PLAIN');
              const formattedSample = getCnicExample(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectCnic(opt.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-2 border-indigo-600 dark:border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/70 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {formattedSample}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER SAVE BAR WHEN DIRTY */}
      {isDirty && (
        <div className="flex items-center justify-between p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200 font-semibold">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>You have unsaved changes. Click Save Changes to update database preferences.</span>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
