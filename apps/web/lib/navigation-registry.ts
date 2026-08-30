/**
 * Centralized Navigation Registry for CampusOS
 *
 * Defines:
 * 1. Main Global ERP Modules (Dashboard, Student, Billing, HR, etc.)
 * 2. Student Cascading Menu & Right-Side Flyout Structure
 * 3. Shared Section Context Navigation (Forms Setup, Organization Setup, Pre-Admission Operations, etc.)
 * 4. Route-aware active state resolution & permission filtering
 */

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  isImplemented?: boolean;
  badge?: string;
  soon?: boolean;
  requiredPermission?: string;
}

export interface CascadingMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  hasChildren?: boolean;
  isImplemented?: boolean;
  soon?: boolean;
  children?: CascadingMenuItem[];
  match?: (pathname: string) => boolean;
}

export interface MainModuleItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  isMegaMenu?: boolean;
  match: (pathname: string) => boolean;
  soon?: boolean;
}

// ── 1. STUDENT CASCADING MENU (FIRST LEVEL + RIGHT-SIDE FLYOUT) ─────────────
export const STUDENT_CASCADING_MENU: CascadingMenuItem[] = [
  {
    id: 'sm_preadmission',
    label: 'Pre-Admission',
    href: '/admissions/pre-admissions',
    icon: 'preadmissions',
    hasChildren: true,
    isImplemented: true,
    match: (p) => p.startsWith('/admissions'),
    children: [
      { id: 'sub_preadmissions', label: 'Pre-Admissions', href: '/admissions/pre-admissions', icon: 'preadmissions', isImplemented: true },
      { id: 'sub_verification', label: 'Verification', href: '/admissions/pre-admissions', icon: 'verification', isImplemented: true },
      { id: 'sub_tests', label: 'Tests', href: '/admissions/tests', icon: 'tests', isImplemented: true },
      { id: 'sub_interviews', label: 'Interviews', href: '#', icon: 'interviews', soon: true, isImplemented: false },
      { id: 'sub_decisions', label: 'Decisions', href: '#', icon: 'decisions', soon: true, isImplemented: false },
    ],
  },
  {
    id: 'sm_view_students',
    label: 'View Students',
    href: '#',
    icon: 'view_students',
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_attendance',
    label: 'Attendance',
    href: '#',
    icon: 'attendance',
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_promotion',
    label: 'Promotion',
    href: '#',
    icon: 'promotion',
    hasChildren: true,
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_transfer',
    label: 'Transfer',
    href: '#',
    icon: 'transfer',
    hasChildren: true,
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_withdrawal',
    label: 'Withdrawal',
    href: '#',
    icon: 'withdrawal',
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_graduates',
    label: 'Graduates',
    href: '#',
    icon: 'graduates',
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_rejoining',
    label: 'Rejoining',
    href: '#',
    icon: 'rejoining',
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_student_update',
    label: 'Student Update',
    href: '#',
    icon: 'edit',
    soon: true,
    isImplemented: false,
  },
  {
    id: 'sm_reports',
    label: 'Reports',
    href: '#',
    icon: 'reports',
    hasChildren: true,
    soon: true,
    isImplemented: false,
  },
];

// ── 2. MAIN GLOBAL ERP MODULES ──────────────────────────────────────────────
export const MAIN_ERP_MODULES: MainModuleItem[] = [
  {
    id: 'mod_dashboard',
    label: 'Dashboard',
    href: '/',
    icon: 'dashboard',
    match: (p) => p === '/' || p === '/dashboard',
  },
  {
    id: 'mod_student',
    label: 'Student',
    href: '/admissions/pre-admissions',
    icon: 'student',
    isMegaMenu: true,
    match: (p) => p.startsWith('/admissions') || p.startsWith('/students'),
  },
  {
    id: 'mod_billing',
    label: 'Billing',
    href: '#',
    icon: 'billing',
    soon: true,
    match: (p) => p.startsWith('/billing'),
  },
  {
    id: 'mod_hr',
    label: 'Human Resource',
    href: '#',
    icon: 'hr',
    soon: true,
    match: (p) => p.startsWith('/hr'),
  },
  {
    id: 'mod_payroll',
    label: 'Payroll',
    href: '#',
    icon: 'payroll',
    soon: true,
    match: (p) => p.startsWith('/payroll'),
  },
  {
    id: 'mod_timetable',
    label: 'Timetable',
    href: '#',
    icon: 'timetable',
    soon: true,
    match: (p) => p.startsWith('/timetable'),
  },
  {
    id: 'mod_quiz',
    label: 'Quiz / Exam',
    href: '#',
    icon: 'quiz',
    soon: true,
    match: (p) => p.startsWith('/quiz') || p.startsWith('/exam'),
  },
  {
    id: 'mod_library',
    label: 'Library',
    href: '#',
    icon: 'library',
    soon: true,
    match: (p) => p.startsWith('/library'),
  },
  {
    id: 'mod_comm',
    label: 'SMS / Communication',
    href: '#',
    icon: 'comm',
    soon: true,
    match: (p) => p.startsWith('/communication'),
  },
  {
    id: 'mod_inventory',
    label: 'Inventory',
    href: '#',
    icon: 'inventory',
    soon: true,
    match: (p) => p.startsWith('/inventory'),
  },
  {
    id: 'mod_accounts',
    label: 'Accounts',
    href: '#',
    icon: 'accounts',
    soon: true,
    match: (p) => p.startsWith('/accounts'),
  },
  {
    id: 'mod_more',
    label: 'More',
    href: '#',
    icon: 'more',
    soon: true,
    match: () => false,
  },
];

// ── 3. SHARED SECTION CONTEXT NAVIGATION ────────────────────────────────────
export type SectionNavKey =
  | 'forms_setup'
  | 'org_setup'
  | 'location_geography'
  | 'academic_setup'
  | 'users_access'
  | 'preadmission_ops';

export const SECTION_NAV_REGISTRY: Record<SectionNavKey, { title: string; items: NavLinkItem[] }> = {
  forms_setup: {
    title: 'Forms & Admission Setup',
    items: [
      { id: 'fld_form_builder', label: 'Form Builder', href: '/admin-config/form-builder', icon: 'form_builder', isImplemented: true },
      { id: 'fld_form_templates', label: 'Form Templates', href: '/admin-config/form-templates', icon: 'form_templates', isImplemented: true },
      { id: 'fld_field_library', label: 'Field Library', href: '/admin-config/field-library', icon: 'field_library', isImplemented: true },
      { id: 'fld_admission_process', label: 'Admission Process', href: '/admin-config/admission-process', icon: 'admission_process', isImplemented: true },
      { id: 'fld_application_fee', label: 'Application Fee', href: '/admin-config/application-fee', icon: 'fee_billing', isImplemented: true },
    ],
  },
  org_setup: {
    title: 'Organization Setup',
    items: [
      { id: 'org_head_offices', label: 'Head Offices', href: '/admin-config/head-offices', icon: 'head_offices', isImplemented: true },
      { id: 'org_regions', label: 'Regional Offices', href: '/admin-config/regions', icon: 'regions', isImplemented: true },
      { id: 'org_schools', label: 'Schools', href: '/admin-config/schools', icon: 'schools', isImplemented: true },
      { id: 'org_branches', label: 'Branches / Campuses', href: '/admin-config/branches', icon: 'branches', isImplemented: true },
      { id: 'org_display_preferences', label: 'Display & Formats', href: '/admin-config/display-preferences', icon: 'settings', isImplemented: true },
    ],
  },
  location_geography: {
    title: 'Location & Geography',
    items: [
      { id: 'geo_countries', label: 'Countries', href: '/admin-config/countries', icon: 'countries', isImplemented: true },
      { id: 'geo_states', label: 'States / Provinces', href: '/admin-config/states', icon: 'states', isImplemented: true },
      { id: 'geo_cities', label: 'Cities', href: '/admin-config/cities', icon: 'cities', isImplemented: true },
      { id: 'geo_areas', label: 'Areas / Zones', href: '/admin-config/areas', icon: 'areas', isImplemented: true },
    ],
  },
  academic_setup: {
    title: 'Academic Setup',
    items: [
      { id: 'acad_years', label: 'Academic Years', href: '/admin-config/academic-years', icon: 'academic_years', isImplemented: true },
      { id: 'acad_boards', label: 'Boards', href: '/admin-config/boards', icon: 'boards', isImplemented: true },
      { id: 'acad_levels', label: 'Academic Levels', href: '/admin-config/academic-levels', icon: 'academic_levels', isImplemented: true },
      { id: 'acad_classes', label: 'Classes / Grades', href: '/admin-config/classes', icon: 'classes', isImplemented: true },
      { id: 'acad_sections', label: 'Sections', href: '/admin-config/sections', icon: 'sections', isImplemented: true },
      { id: 'acad_subjects', label: 'Subjects', href: '/admin-config/subjects', icon: 'subjects', isImplemented: true },
      { id: 'acad_languages', label: 'Languages', href: '/admin-config/languages', icon: 'languages', isImplemented: true },
    ],
  },
  users_access: {
    title: 'Users & Access',
    items: [
      { id: 'usr_users', label: 'Admin Users', href: '/admin-config/users', icon: 'users', soon: true, isImplemented: false },
      { id: 'usr_roles', label: 'Roles & Security', href: '/admin-config/roles', icon: 'roles', soon: true, isImplemented: false },
      { id: 'usr_permissions', label: 'Permissions Matrix', href: '/admin-config/permissions', icon: 'permissions', soon: true, isImplemented: false },
    ],
  },
  preadmission_ops: {
    title: 'Pre-Admission Operations',
    items: [
      { id: 'op_preadmissions', label: 'Pre-Admissions', href: '/admissions/pre-admissions', icon: 'preadmissions', isImplemented: true },
      { id: 'op_tests', label: 'Tests', href: '/admissions/tests', icon: 'tests', isImplemented: true },
      { id: 'op_interviews', label: 'Interviews', href: '#', icon: 'interviews', soon: true, isImplemented: false },
      { id: 'op_decisions', label: 'Decisions', href: '#', icon: 'decisions', soon: true, isImplemented: false },
    ],
  },
};

/**
 * Resolves the active Section Navigation definition based on the pathname
 */
export function resolveSectionNavForRoute(pathname: string): { key: SectionNavKey; title: string; items: NavLinkItem[] } | null {
  if (
    pathname.startsWith('/admin-config/form-builder') ||
    pathname.startsWith('/admin-config/form-templates') ||
    pathname.startsWith('/admin-config/field-library') ||
    pathname.startsWith('/admin-config/admission-process')
  ) {
    return { key: 'forms_setup', ...SECTION_NAV_REGISTRY.forms_setup };
  }

  if (
    pathname.startsWith('/admin-config/head-offices') ||
    pathname.startsWith('/admin-config/head-office') ||
    pathname.startsWith('/admin-config/regions') ||
    pathname.startsWith('/admin-config/schools') ||
    pathname.startsWith('/admin-config/branches') ||
    pathname.startsWith('/admin-config/branch') ||
    pathname.startsWith('/admin-config/school-types') ||
    pathname === '/schools'
  ) {
    return { key: 'org_setup', ...SECTION_NAV_REGISTRY.org_setup };
  }

  if (
    pathname.startsWith('/admin-config/countries') ||
    pathname.startsWith('/admin-config/states') ||
    pathname.startsWith('/admin-config/cities') ||
    pathname.startsWith('/admin-config/areas') ||
    pathname.startsWith('/admin-config/postal-codes')
  ) {
    return { key: 'location_geography', ...SECTION_NAV_REGISTRY.location_geography };
  }

  if (
    pathname.startsWith('/admin-config/academic') ||
    pathname.startsWith('/admin-config/boards') ||
    pathname.startsWith('/admin-config/classes') ||
    pathname.startsWith('/admin-config/sections') ||
    pathname.startsWith('/admin-config/subjects') ||
    pathname.startsWith('/admin-config/languages')
  ) {
    return { key: 'academic_setup', ...SECTION_NAV_REGISTRY.academic_setup };
  }

  if (pathname.startsWith('/admissions')) {
    return { key: 'preadmission_ops', ...SECTION_NAV_REGISTRY.preadmission_ops };
  }

  return null;
}
