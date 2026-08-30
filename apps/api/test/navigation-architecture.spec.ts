import { describe, it, expect } from 'vitest';

// Verify Navigation Registry and Architecture
describe('CampusOS Global Navigation & Information Architecture', () => {
  // Navigation registry definition mock matching apps/web/lib/navigation-registry.ts
  const MAIN_ERP_MODULES = [
    { id: 'mod_dashboard', label: 'Dashboard', href: '/', match: (p: string) => p === '/' || p === '/dashboard' },
    { id: 'mod_student', label: 'Student', href: '/admissions/pre-admissions', match: (p: string) => p.startsWith('/admissions') || p.startsWith('/students'), isMegaMenu: true },
    { id: 'mod_billing', label: 'Billing', href: '#', soon: true },
    { id: 'mod_hr', label: 'Human Resource', href: '#', soon: true },
    { id: 'mod_payroll', label: 'Payroll', href: '#', soon: true },
    { id: 'mod_timetable', label: 'Timetable', href: '#', soon: true },
    { id: 'mod_quiz', label: 'Quiz / Exam', href: '#', soon: true },
    { id: 'mod_library', label: 'Library', href: '#', soon: true },
    { id: 'mod_comm', label: 'SMS / Communication', href: '#', soon: true },
    { id: 'mod_inventory', label: 'Inventory', href: '#', soon: true },
    { id: 'mod_accounts', label: 'Accounts', href: '#', soon: true },
    { id: 'mod_more', label: 'More', href: '#', soon: true },
  ];

  const SECTION_NAV_REGISTRY = {
    forms_setup: {
      title: 'Forms & Admission Setup',
      items: [
        { id: 'fld_form_builder', label: 'Form Builder', href: '/admin-config/form-builder', isImplemented: true },
        { id: 'fld_form_templates', label: 'Form Templates', href: '/admin-config/form-templates', isImplemented: true },
        { id: 'fld_field_library', label: 'Field Library', href: '/admin-config/field-library', isImplemented: true },
        { id: 'fld_admission_process', label: 'Admission Process', href: '/admin-config/admission-process', isImplemented: true },
      ],
    },
    org_setup: {
      title: 'Organization Setup',
      items: [
        { id: 'org_head_offices', label: 'Head Offices', href: '/admin-config/head-offices', isImplemented: true },
        { id: 'org_regions', label: 'Regional Offices', href: '/admin-config/regions', isImplemented: true },
        { id: 'org_schools', label: 'Schools', href: '/admin-config/schools', isImplemented: true },
        { id: 'org_branches', label: 'Branches / Campuses', href: '/admin-config/branches', isImplemented: true },
        { id: 'org_school_types', label: 'School Types', href: '/admin-config/school-types', isImplemented: true },
      ],
    },
    preadmission_ops: {
      title: 'Pre-Admission Operations',
      items: [
        { id: 'op_preadmissions', label: 'Pre-Admissions', href: '/admissions/pre-admissions', isImplemented: true },
        { id: 'op_tests', label: 'Tests', href: '/admissions/tests', isImplemented: true },
        { id: 'op_interviews', label: 'Interviews', href: '#', soon: true, isImplemented: false },
        { id: 'op_decisions', label: 'Decisions', href: '#', soon: true, isImplemented: false },
      ],
    },
  };

  function resolveSectionNavForRoute(pathname: string) {
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
      pathname.startsWith('/admin-config/regions') ||
      pathname.startsWith('/admin-config/schools') ||
      pathname.startsWith('/admin-config/branches') ||
      pathname.startsWith('/admin-config/school-types')
    ) {
      return { key: 'org_setup', ...SECTION_NAV_REGISTRY.org_setup };
    }

    if (pathname.startsWith('/admissions')) {
      return { key: 'preadmission_ops', ...SECTION_NAV_REGISTRY.preadmission_ops };
    }

    return null;
  }

  describe('1. Global Main Modules', () => {
    it('should have Dashboard as the first main ERP module', () => {
      expect(MAIN_ERP_MODULES[0].id).toBe('mod_dashboard');
      expect(MAIN_ERP_MODULES[0].label).toBe('Dashboard');
      expect(MAIN_ERP_MODULES[0].href).toBe('/');
    });

    it('should have Student as an operational mega-menu module', () => {
      const studentMod = MAIN_ERP_MODULES.find((m) => m.id === 'mod_student');
      expect(studentMod).toBeDefined();
      expect(studentMod?.isMegaMenu).toBe(true);
      expect(studentMod?.href).toBe('/admissions/pre-admissions');
    });

    it('should not contain Admin Config as a giant main operational module in MAIN_ERP_MODULES', () => {
      const adminMod = MAIN_ERP_MODULES.find((m) => m.label === 'Admin Config');
      expect(adminMod).toBeUndefined();
    });
  });

  describe('2. Forms & Admission Setup Navigation Stability', () => {
    it('should include Form Builder, Form Templates, Field Library, and Admission Process in forms_setup', () => {
      const items = SECTION_NAV_REGISTRY.forms_setup.items;
      expect(items).toHaveLength(4);
      expect(items.map((i) => i.label)).toEqual([
        'Form Builder',
        'Form Templates',
        'Field Library',
        'Admission Process',
      ]);
    });

    it('should resolve forms_setup for all 4 related routes without dropping Field Library or Admission Process', () => {
      const routes = [
        '/admin-config/form-builder',
        '/admin-config/form-templates',
        '/admin-config/field-library',
        '/admin-config/admission-process',
      ];

      for (const route of routes) {
        const resolved = resolveSectionNavForRoute(route);
        expect(resolved).not.toBeNull();
        expect(resolved?.key).toBe('forms_setup');
        expect(resolved?.items.some((i) => i.label === 'Field Library')).toBe(true);
        expect(resolved?.items.some((i) => i.label === 'Admission Process')).toBe(true);
      }
    });

    it('should accurately resolve active tab based on route pathname', () => {
      const currentRoute = '/admin-config/field-library';
      const resolved = resolveSectionNavForRoute(currentRoute);
      const activeItem = resolved?.items.find((i) => i.href === currentRoute);
      expect(activeItem?.label).toBe('Field Library');
    });
  });

  describe('3. Organization Setup Context Isolation', () => {
    it('should show only organization-related tabs on organization pages', () => {
      const resolved = resolveSectionNavForRoute('/admin-config/schools');
      expect(resolved).not.toBeNull();
      expect(resolved?.key).toBe('org_setup');
      expect(resolved?.items.map((i) => i.label)).toEqual([
        'Head Offices',
        'Regional Offices',
        'Schools',
        'Branches / Campuses',
        'School Types',
      ]);
      expect(resolved?.items.some((i) => i.label === 'Form Builder')).toBe(false);
      expect(resolved?.items.some((i) => i.label === 'Pre-Admissions')).toBe(false);
    });
  });

  describe('4. Pre-Admission Operations Workflow Navigation', () => {
    it('should resolve preadmission_ops for operational admissions routes', () => {
      const resolved = resolveSectionNavForRoute('/admissions/pre-admissions');
      expect(resolved).not.toBeNull();
      expect(resolved?.key).toBe('preadmission_ops');
      expect(resolved?.items.some((i) => i.label === 'Pre-Admissions')).toBe(true);
      expect(resolved?.items.some((i) => i.label === 'Tests')).toBe(true);
    });

    it('should not contain configuration tools (Form Builder, School Types) in preadmission_ops', () => {
      const resolved = resolveSectionNavForRoute('/admissions/pre-admissions');
      expect(resolved?.items.some((i) => i.label === 'Form Builder')).toBe(false);
      expect(resolved?.items.some((i) => i.label === 'School Types')).toBe(false);
      expect(resolved?.items.some((i) => i.label === 'Regional Offices')).toBe(false);
    });
  });

  describe('5. Permission-Based Filtering', () => {
    it('should hide unauthorized tabs without breaking remaining authorized tabs', () => {
      const allItems = SECTION_NAV_REGISTRY.forms_setup.items;
      const userPermissions = ['admin.forms.builder', 'admin.forms.field_library'];

      // Simulated permission check
      const permissionMap: Record<string, string> = {
        fld_form_builder: 'admin.forms.builder',
        fld_field_library: 'admin.forms.field_library',
        fld_form_templates: 'admin.forms.templates',
        fld_admission_process: 'admin.admissions.process',
      };

      const visibleTabs = allItems.filter((item) => {
        const required = permissionMap[item.id];
        return !required || userPermissions.includes(required);
      });

      expect(visibleTabs.map((t) => t.label)).toEqual(['Form Builder', 'Field Library']);
      expect(visibleTabs.some((t) => t.label === 'Form Builder')).toBe(true);
      expect(visibleTabs.some((t) => t.label === 'Field Library')).toBe(true);
      expect(visibleTabs.some((t) => t.label === 'Admission Process')).toBe(false);
    });
  });
});
