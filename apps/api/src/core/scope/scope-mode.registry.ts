/**
 * CampusOS — Scope Mode Registry
 *
 * NON-NEGOTIABLE PLATFORM RULE:
 * Every entity/module MUST declare its ScopeMode here before going live.
 * Working Context enforcement is driven by this registry.
 *
 * ScopeModes:
 *   GLOBAL          — Platform/system-wide records. Not affected by Working Context or tenant.
 *                     Examples: countries, currencies, language codes.
 *   TENANT_WIDE     — Visible throughout the tenant. Not campus-filtered.
 *                     Examples: school types, field library, org structure.
 *   HIERARCHY_SCOPED — Requires Working Context enforcement. Effective scope =
 *                     userAuthorizedScope ∩ workingContextScope.
 *                     Examples: academic years, levels, forms, admission processes.
 *   CAMPUS_REQUIRED  — Transaction requires an exact Campus selection.
 *                     If Working Context is School/Region/HO, user must pick a campus.
 *                     Examples: pre-admissions, admissions, student enrollment, attendance, campus billing.
 */
export type ScopeMode = 'GLOBAL' | 'TENANT_WIDE' | 'HIERARCHY_SCOPED' | 'CAMPUS_REQUIRED';

export const ENTITY_SCOPE_MODES: Record<string, ScopeMode> = {
  // ── HIERARCHY_SCOPED ─────────────────────────────────────────────
  academic_year:        'HIERARCHY_SCOPED',
  academic_years:       'HIERARCHY_SCOPED',
  board:                'HIERARCHY_SCOPED',
  boards:               'HIERARCHY_SCOPED',
  academic_level:       'HIERARCHY_SCOPED',
  academic_levels:      'HIERARCHY_SCOPED',
  subject:              'HIERARCHY_SCOPED',
  subjects:             'HIERARCHY_SCOPED',
  class:                'HIERARCHY_SCOPED',
  classes:              'HIERARCHY_SCOPED',
  section:              'HIERARCHY_SCOPED',
  sections:             'HIERARCHY_SCOPED',
  language:             'HIERARCHY_SCOPED',
  languages:            'HIERARCHY_SCOPED',
  admission_process:    'HIERARCHY_SCOPED',
  admission_processes:  'HIERARCHY_SCOPED',
  form_definition:      'HIERARCHY_SCOPED',
  form_definitions:    'HIERARCHY_SCOPED',
  form_template:        'HIERARCHY_SCOPED',
  form_templates:       'HIERARCHY_SCOPED',
  fee_structure:        'HIERARCHY_SCOPED',
  fee_structures:       'HIERARCHY_SCOPED',
  timetable:            'HIERARCHY_SCOPED',
  timetables:           'HIERARCHY_SCOPED',

  // ── CAMPUS_REQUIRED ──────────────────────────────────────────────
  pre_admission:        'CAMPUS_REQUIRED',
  pre_admissions:       'CAMPUS_REQUIRED',
  test_schedule:        'CAMPUS_REQUIRED',
  test_schedules:       'CAMPUS_REQUIRED',
  student_enrollment:   'CAMPUS_REQUIRED',
  student_enrollments:  'CAMPUS_REQUIRED',
  attendance:           'CAMPUS_REQUIRED',
  student_attendance:   'CAMPUS_REQUIRED',
  campus_inventory:     'CAMPUS_REQUIRED',
  timetable_slots:      'CAMPUS_REQUIRED',

  // ── TENANT_WIDE ──────────────────────────────────────────────────
  school_type:          'TENANT_WIDE',
  school_types:         'TENANT_WIDE',
  field_library:        'TENANT_WIDE',
  field_definition:     'TENANT_WIDE',
  field_definitions:    'TENANT_WIDE',
  head_office:          'TENANT_WIDE',
  head_offices:         'TENANT_WIDE',
  region:               'TENANT_WIDE',
  regions:              'TENANT_WIDE',
  school:               'TENANT_WIDE',
  schools:              'TENANT_WIDE',
  branch:               'TENANT_WIDE',
  branches:             'TENANT_WIDE',
  organization:         'TENANT_WIDE',
  organizations:        'TENANT_WIDE',
  organization_hierarchy: 'TENANT_WIDE',

  // ── GLOBAL ───────────────────────────────────────────────────────
  country:              'GLOBAL',
  countries:            'GLOBAL',
  state:                'GLOBAL',
  states:               'GLOBAL',
  city:                 'GLOBAL',
  cities:               'GLOBAL',
  area:                 'GLOBAL',
  areas:                'GLOBAL',
  postal_code:          'GLOBAL',
  postal_codes:         'GLOBAL',
  currency:             'GLOBAL',
  currencies:           'GLOBAL',
} as const;

export function getEntityScopeMode(entityName: string): ScopeMode {
  const normalized = entityName.toLowerCase().replace(/-/g, '_');
  const mode = ENTITY_SCOPE_MODES[normalized];
  if (!mode) {
    // Default safety fallback: require hierarchy scoping to prevent accidental global exposure
    return 'HIERARCHY_SCOPED';
  }
  return mode;
}

export function isGlobal(entityName: string): boolean {
  return getEntityScopeMode(entityName) === 'GLOBAL';
}

export function isTenantWide(entityName: string): boolean {
  return getEntityScopeMode(entityName) === 'TENANT_WIDE';
}

export function isHierarchyScoped(entityName: string): boolean {
  return getEntityScopeMode(entityName) === 'HIERARCHY_SCOPED';
}

export function isCampusRequired(entityName: string): boolean {
  return getEntityScopeMode(entityName) === 'CAMPUS_REQUIRED';
}
