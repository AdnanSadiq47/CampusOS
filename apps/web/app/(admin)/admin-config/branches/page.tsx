'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BranchListItemDto, CreateBranchDto } from '@campus-os/types';

interface SchoolOption {
  id: string;
  code: string;
  name: string;
  city?: string | null;
}

export default function BranchesPage() {
  // State
  const [branches, setBranches] = useState<BranchListItemDto[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<BranchListItemDto | null>(null);
  const [viewingBranch, setViewingBranch] = useState<BranchListItemDto | null>(null);
  const [formTab, setFormTab] = useState<'school' | 'basic' | 'contact' | 'location' | 'admin'>('school');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Administrator Login State
  const [enableAdminLogin, setEnableAdminLogin] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [forcePasswordChange, setForcePasswordChange] = useState<boolean>(true);

  // Branding Logo State
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<CreateBranchDto>({
    schoolId: '',
    code: '',
    name: '',
    shortName: '',
    description: '',
    logoUrl: '',
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    country: 'Pakistan',
    province: '',
    city: '',
    area: '',
    address: '',
    postalCode: '',
    notes: '',
    status: true,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Seed default data for local preview
  const defaultSchools: SchoolOption[] = useMemo(
    () => [
      { id: 'sch-1', code: 'SCH_KHI_01', name: 'Beacon Horizon Public School', city: 'Karachi' },
      { id: 'sch-2', code: 'SCH_LHR_02', name: 'Apex Crescent Grammar School', city: 'Lahore' },
      { id: 'sch-3', code: 'SCH_ISB_03', name: 'Capital Model Higher Secondary School', city: 'Islamabad' },
    ],
    []
  );

  const initialSeedBranches: BranchListItemDto[] = useMemo(
    () => [
      {
        id: 'br-1',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-br-1',
        schoolId: 'sch-1',
        schoolName: 'Beacon Horizon Public School',
        schoolCode: 'SCH_KHI_01',
        code: 'BR_KHI_GUL',
        name: 'Gulshan Senior Campus',
        shortName: 'Gulshan Campus',
        logoUrl: null,
        phone: '+92 21 34981122',
        email: 'gulshan@beaconhorizon.edu.pk',
        city: 'Karachi',
        province: 'Sindh',
        country: 'Pakistan',
        adminUsername: 'admin.gulshan',
        adminEmail: 'admin.gulshan@beaconhorizon.edu.pk',
        isActive: true,
        createdAt: new Date('2026-01-20T09:00:00Z'),
        updatedAt: new Date('2026-01-20T09:00:00Z'),
      },
      {
        id: 'br-2',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-br-2',
        schoolId: 'sch-1',
        schoolName: 'Beacon Horizon Public School',
        schoolCode: 'SCH_KHI_01',
        code: 'BR_KHI_CLF',
        name: 'Clifton Junior Campus',
        shortName: 'Clifton Campus',
        logoUrl: null,
        phone: '+92 21 35872233',
        email: 'clifton@beaconhorizon.edu.pk',
        city: 'Karachi',
        province: 'Sindh',
        country: 'Pakistan',
        adminUsername: 'admin.clifton',
        adminEmail: 'admin.clifton@beaconhorizon.edu.pk',
        isActive: true,
        createdAt: new Date('2026-01-25T11:00:00Z'),
        updatedAt: new Date('2026-01-25T11:00:00Z'),
      },
      {
        id: 'br-3',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-br-3',
        schoolId: 'sch-2',
        schoolName: 'Apex Crescent Grammar School',
        schoolCode: 'SCH_LHR_02',
        code: 'BR_LHR_JT',
        name: 'Johar Town Main Campus',
        shortName: 'Johar Town',
        logoUrl: null,
        phone: '+92 42 35184455',
        email: 'johartown@apexgrammar.edu.pk',
        city: 'Lahore',
        province: 'Punjab',
        country: 'Pakistan',
        adminUsername: 'admin.johartown',
        adminEmail: 'admin.johartown@apexgrammar.edu.pk',
        isActive: true,
        createdAt: new Date('2026-02-12T14:30:00Z'),
        updatedAt: new Date('2026-02-12T14:30:00Z'),
      },
      {
        id: 'br-4',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-br-4',
        schoolId: 'sch-3',
        schoolName: 'Capital Model Higher Secondary School',
        schoolCode: 'SCH_ISB_03',
        code: 'BR_ISB_F8',
        name: 'F-8 Executive Campus',
        shortName: 'F-8 Campus',
        logoUrl: null,
        phone: '+92 51 2289900',
        email: 'f8@capitalmodel.edu.pk',
        city: 'Islamabad',
        province: 'Federal Capital',
        country: 'Pakistan',
        adminUsername: null,
        adminEmail: null,
        isActive: false,
        createdAt: new Date('2026-03-05T16:00:00Z'),
        updatedAt: new Date('2026-03-05T16:00:00Z'),
      },
    ],
    []
  );

  // Fetch branches & schools
  const fetchData = async () => {
    setIsLoading(true);
    try {
      setSchools(defaultSchools);
      setBranches((prev) => (prev.length > 0 ? prev : initialSeedBranches));
    } catch {
      showToast('error', 'Failed to load branch records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.schoolName.toLowerCase().includes(q) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.adminUsername && b.adminUsername.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && b.isActive) ||
        (statusFilter === 'INACTIVE' && !b.isActive);

      const matchesSchool = schoolFilter === 'ALL' || b.schoolId === schoolFilter;

      return matchesSearch && matchesStatus && matchesSchool;
    });
  }, [branches, searchQuery, statusFilter, schoolFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive).length;
    const inactive = total - active;
    const uniqueSchoolsWithBranches = new Set(branches.map((b) => b.schoolId)).size;
    return { total, active, inactive, uniqueSchoolsWithBranches };
  }, [branches]);

  // Password Generator
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pwd);
    setAdminConfirmPassword(pwd);
    showToast('success', 'Strong password generated');
  };

  // Suggest Username from Branch code / name
  const suggestUsername = () => {
    if (formData.code) {
      const suggested = `admin.${formData.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      setAdminUsername(suggested);
    } else if (formData.name) {
      const suggested = `admin.${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      setAdminUsername(suggested);
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      showToast('error', 'Please upload a PNG, JPEG, WEBP, or SVG image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, logoUrl: result }));
      showToast('success', 'Branch logo loaded successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('success', 'Logo removed');
  };

  // Modal open handlers
  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormData({
      schoolId: schools[0]?.id || '',
      code: '',
      name: '',
      shortName: '',
      description: '',
      logoUrl: '',
      phone: '',
      alternatePhone: '',
      email: '',
      website: '',
      country: 'Pakistan',
      province: '',
      city: '',
      area: '',
      address: '',
      postalCode: '',
      notes: '',
      status: true,
    });
    setLogoPreview(null);
    setEnableAdminLogin(false);
    setAdminUsername('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminConfirmPassword('');
    setShowPassword(false);
    setForcePasswordChange(true);
    setFormErrors({});
    setFormTab('school');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: BranchListItemDto) => {
    setEditingBranch(b);
    setFormData({
      schoolId: b.schoolId,
      code: b.code,
      name: b.name,
      shortName: b.shortName || '',
      description: '',
      logoUrl: b.logoUrl || '',
      phone: b.phone || '',
      alternatePhone: '',
      email: b.email || '',
      website: '',
      country: b.country || 'Pakistan',
      province: b.province || '',
      city: b.city || '',
      area: '',
      address: '',
      postalCode: '',
      notes: '',
      status: b.isActive,
    });
    setLogoPreview(b.logoUrl || null);
    setEnableAdminLogin(false);
    setAdminUsername(b.adminUsername || '');
    setAdminEmail(b.adminEmail || '');
    setAdminPassword('');
    setAdminConfirmPassword('');
    setFormErrors({});
    setFormTab('school');
    setIsModalOpen(true);
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.schoolId) errors.schoolId = 'Please select a parent School';
    if (!formData.name?.trim()) errors.name = 'Branch / Campus Name is required';
    if (!formData.code?.trim()) errors.code = 'Branch Code is required';
    else if (!/^[A-Z0-9_-]+$/i.test(formData.code.trim())) {
      errors.code = 'Code must contain only alphanumeric characters, underscores or hyphens';
    }

    const cleanCode = formData.code.trim().toUpperCase();
    const isDuplicate = branches.some(
      (b) => b.code.toUpperCase() === cleanCode && (!editingBranch || b.id !== editingBranch.id)
    );
    if (isDuplicate) {
      errors.code = `A Branch with code '${cleanCode}' already exists in this organization`;
    }

    if (enableAdminLogin && !editingBranch) {
      if (!adminUsername.trim()) errors.adminUsername = 'Username / User ID is required';
      if (!adminEmail.trim()) errors.adminEmail = 'Administrator Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
        errors.adminEmail = 'Please enter a valid email address';
      }
      if (!adminPassword) errors.adminPassword = 'Password is required';
      else if (adminPassword.length < 8) errors.adminPassword = 'Password must be at least 8 characters';
      if (adminPassword !== adminConfirmPassword) {
        errors.adminConfirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('error', 'Please resolve form validation errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanCode = formData.code.trim().toUpperCase();
      const cleanName = formData.name.trim();
      const selectedSchool = schools.find((s) => s.id === formData.schoolId);

      if (editingBranch) {
        // Update
        const updatedList = branches.map((b) => {
          if (b.id === editingBranch.id) {
            return {
              ...b,
              schoolId: formData.schoolId,
              schoolName: selectedSchool?.name || b.schoolName,
              schoolCode: selectedSchool?.code || b.schoolCode,
              name: cleanName,
              code: cleanCode,
              shortName: formData.shortName?.trim() || null,
              logoUrl: logoPreview || null,
              phone: formData.phone?.trim() || null,
              email: formData.email?.trim() || null,
              city: formData.city?.trim() || null,
              province: formData.province?.trim() || null,
              country: formData.country?.trim() || 'Pakistan',
              isActive: formData.status ?? true,
              updatedAt: new Date(),
            };
          }
          return b;
        });
        setBranches(updatedList);
        showToast('success', `Branch '${cleanName}' updated successfully`);
      } else {
        // Create new
        const newBranch: BranchListItemDto = {
          id: `br-${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          hierarchyNodeId: `node-br-${Date.now()}`,
          schoolId: formData.schoolId,
          schoolName: selectedSchool?.name || 'Selected School',
          schoolCode: selectedSchool?.code || 'SCH',
          code: cleanCode,
          name: cleanName,
          shortName: formData.shortName?.trim() || null,
          logoUrl: logoPreview || null,
          phone: formData.phone?.trim() || null,
          email: formData.email?.trim() || null,
          city: formData.city?.trim() || null,
          province: formData.province?.trim() || null,
          country: formData.country?.trim() || 'Pakistan',
          adminUsername: enableAdminLogin ? adminUsername.trim() : null,
          adminEmail: enableAdminLogin ? adminEmail.trim() : null,
          isActive: formData.status ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setBranches([newBranch, ...branches]);
        showToast(
          'success',
          `Branch '${cleanName}' [${cleanCode}] created successfully${
            enableAdminLogin ? ' with administrator login' : ''
          }`
        );
      }

      setIsModalOpen(false);
    } catch {
      showToast('error', 'Failed to save branch record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = (b: BranchListItemDto) => {
    const nextStatus = !b.isActive;
    const updated = branches.map((item) =>
      item.id === b.id ? { ...item, isActive: nextStatus, updatedAt: new Date() } : item
    );
    setBranches(updated);
    showToast(
      'success',
      `Branch '${b.name}' is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-3 transition-all animate-in slide-in-from-bottom-5 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800 shadow-emerald-950/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-800 shadow-rose-950/50'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── 1. PAGE HEADER ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <span>Administration Configuration</span>
            <span>/</span>
            <span>Organization Setup</span>
            <span>/</span>
            <span>Branches</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Branches / Campuses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage school branches, physical campuses, centers, and localized administrative units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Add Branch</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI / SUMMARY CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Branches */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Branches
            </span>
            <span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
              🌿
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.total}</div>
          <div className="mt-1 text-xs text-slate-400">Campus locations</div>
        </div>

        {/* Active Branches */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active
            </span>
            <span className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
              ✓
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.active}</div>
          <div className="mt-1 text-xs text-slate-400">In active session</div>
        </div>

        {/* Inactive Branches */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inactive
            </span>
            <span className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs">
              ⏸️
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-600 dark:text-slate-400">{kpis.inactive}</div>
          <div className="mt-1 text-xs text-slate-400">Suspended / Inactive</div>
        </div>

        {/* Schools with Branches */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Schools
            </span>
            <span className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
              🏫
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis.uniqueSchoolsWithBranches}</div>
          <div className="mt-1 text-xs text-slate-400">Parent schools hosting branches</div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER BAR ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by branch name, code, school, city, admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* School Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">School:</span>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px] truncate cursor-pointer"
            >
              <option value="ALL">All Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredBranches.length}</span> of {branches.length} branches
        </div>
      </div>

      {/* ── 4. DATA TABLE ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-xs">Loading branches...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-2">🌿</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">No Branches Found</div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || schoolFilter !== 'ALL'
                ? 'No branch records match your filter criteria. Try adjusting filters.'
                : 'Get started by creating your first branch / campus location.'}
            </div>
            {!searchQuery && statusFilter === 'ALL' && schoolFilter === 'ALL' && (
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                + Add First Branch
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Branch Code</th>
                  <th className="py-3 px-4">Branch / Campus Name</th>
                  <th className="py-3 px-4">School</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBranches.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {b.code}
                    </td>

                    {/* Name + Branding */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {b.logoUrl ? (
                          <img
                            src={b.logoUrl}
                            alt={b.name}
                            className="h-7 w-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {b.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{b.name}</div>
                          {b.shortName && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{b.shortName}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* School */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{b.schoolName}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                        {b.schoolCode}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{b.city || '—'}</div>
                      <div className="text-[10px] text-slate-400">
                        {[b.province, b.country].filter(Boolean).join(', ')}
                      </div>
                    </td>

                    {/* Administrator */}
                    <td className="py-3.5 px-4">
                      {b.adminUsername ? (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 font-mono text-xs">
                            👤 {b.adminUsername}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {b.adminEmail}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not Configured</span>
                      )}
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(b)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          b.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{b.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setViewingBranch(b);
                            setIsViewModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          title="View branch details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                          title="Edit branch"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(b)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                            b.isActive
                              ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={b.isActive ? 'Deactivate branch' : 'Activate branch'}
                        >
                          {b.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. ADD / EDIT BRANCH MODAL ──────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add New Branch / Campus'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingBranch ? 'Update branch campus configuration and location details' : 'Configure a campus location and optional administrator login'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 pt-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setFormTab('school')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  formTab === 'school'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                1. School & Branding
              </button>
              <button
                type="button"
                onClick={() => setFormTab('basic')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  formTab === 'basic'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                2. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setFormTab('contact')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  formTab === 'contact'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                3. Contact
              </button>
              <button
                type="button"
                onClick={() => setFormTab('location')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  formTab === 'location'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                4. Location
              </button>
              {!editingBranch && (
                <button
                  type="button"
                  onClick={() => setFormTab('admin')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    formTab === 'admin'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  5. Administrator Login
                </button>
              )}
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: SCHOOL & BRANDING */}
              {formTab === 'school' && (
                <div className="space-y-5 text-xs">
                  {/* School Selection */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.schoolId}
                      onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none cursor-pointer ${
                        formErrors.schoolId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <option value="">Select Parent School...</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code}) {s.city ? `— ${s.city}` : ''}
                        </option>
                      ))}
                    </select>
                    {formErrors.schoolId && <p className="text-[11px] text-rose-500 mt-1">{formErrors.schoolId}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">
                      Every branch belongs to a school. One school may have multiple branches.
                    </p>
                  </div>

                  {/* Branch Branding (Logo Upload) */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Branch / Campus Logo (Optional Branding)
                    </label>
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Branch Logo"
                            className="h-16 w-16 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center shadow hover:bg-rose-700"
                            title="Remove Logo"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xl font-bold bg-white dark:bg-slate-900">
                          📷
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            className="hidden"
                            id="branch-logo-input"
                          />
                          <label
                            htmlFor="branch-logo-input"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors shadow-sm"
                          >
                            {logoPreview ? 'Replace Logo' : 'Upload Logo'}
                          </label>
                          {logoPreview && (
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Recommended: PNG, JPG, or SVG (Square format, max 2MB).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BASIC INFORMATION */}
              {formTab === 'basic' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Branch / Campus Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gulshan Senior Campus"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                        } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                      />
                      {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Branch Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BR_KHI_GUL"
                        disabled={!!editingBranch}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className={`w-full px-3 py-2 rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                        } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          editingBranch ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      />
                      {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Short Name / Campus Alias
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gulshan Campus"
                        value={formData.shortName || ''}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-5">
                      <div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">Active Status</div>
                        <div className="text-[10px] text-slate-400">Campus operational state</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: !formData.status })}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.status ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            formData.status ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description / Campus Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Main boys senior campus, grades 8-12 with science laboratories..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CONTACT INFORMATION */}
              {formTab === 'contact' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Campus Phone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +92 21 34981122"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Alternate Phone / Hotline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +92 21 34981123"
                        value={formData.alternatePhone || ''}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Official Campus Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. gulshan@beaconhorizon.edu.pk"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Campus Website / Portal URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. https://gulshan.beaconhorizon.edu.pk"
                        value={formData.website || ''}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LOCATION & GEOGRAPHY */}
              {formTab === 'location' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="Pakistan"
                        value={formData.country || 'Pakistan'}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Province / State</label>
                      <input
                        type="text"
                        placeholder="e.g. Sindh, Punjab"
                        value={formData.province || ''}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Karachi, Lahore, Islamabad"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Area / Zone</label>
                      <input
                        type="text"
                        placeholder="e.g. Block 6, Gulshan-e-Iqbal"
                        value={formData.area || ''}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 75300"
                        value={formData.postalCode || ''}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Physical Street Address</label>
                    <textarea
                      rows={2}
                      placeholder="Campus plot number, street, sector, or landmark..."
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: ADMINISTRATOR LOGIN PROVISIONING */}
              {!editingBranch && formTab === 'admin' && (
                <div className="space-y-4 text-xs">
                  {/* Enable Admin Login Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Create Branch Administrator Login
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Provision an initial administrator account scoped strictly to this branch.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableAdminLogin(!enableAdminLogin)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableAdminLogin ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          enableAdminLogin ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {enableAdminLogin && (
                    <div className="space-y-4 p-4 border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl animate-in fade-in">
                      {/* Username */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">
                            Username / User ID <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={suggestUsername}
                            className="text-[10px] font-semibold text-indigo-600 hover:underline"
                          >
                            Suggest Username
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. admin.gulshan"
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border font-mono ${
                            formErrors.adminUsername ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                          } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                        />
                        {formErrors.adminUsername && (
                          <p className="text-[11px] text-rose-500 mt-1">{formErrors.adminUsername}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          Choose the login username for the Branch Administrator.
                        </p>
                      </div>

                      {/* Admin Email */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Administrator Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. admin.gulshan@beaconhorizon.edu.pk"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border ${
                            formErrors.adminEmail ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                          } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                        />
                        {formErrors.adminEmail && (
                          <p className="text-[11px] text-rose-500 mt-1">{formErrors.adminEmail}</p>
                        )}
                      </div>

                      {/* Password & Confirm */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-slate-700 dark:text-slate-300">
                              Password <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={generateStrongPassword}
                              className="text-[10px] font-semibold text-indigo-600 hover:underline"
                            >
                              Generate Strong Password
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter secure password..."
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              className={`w-full px-3 py-2 pr-8 rounded-lg bg-white dark:bg-slate-950 border font-mono ${
                                formErrors.adminPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                              } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs"
                            >
                              {showPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {formErrors.adminPassword && (
                            <p className="text-[11px] text-rose-500 mt-1">{formErrors.adminPassword}</p>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Confirm Password <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Re-enter password..."
                            value={adminConfirmPassword}
                            onChange={(e) => setAdminConfirmPassword(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border font-mono ${
                              formErrors.adminConfirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                            } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                          />
                          {formErrors.adminConfirmPassword && (
                            <p className="text-[11px] text-rose-500 mt-1">{formErrors.adminConfirmPassword}</p>
                          )}
                        </div>
                      </div>

                      {/* Force Password Change on First Login */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Force Password Change on First Login
                          </span>
                          <p className="text-[10px] text-slate-400">
                            User will be prompted to set a new password on their initial sign-in.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForcePasswordChange(!forcePasswordChange)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            forcePasswordChange ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              forcePasswordChange ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. VIEW DETAILS MODAL ───────────────────────────────── */}
      {isViewModalOpen && viewingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                {viewingBranch.logoUrl ? (
                  <img
                    src={viewingBranch.logoUrl}
                    alt={viewingBranch.name}
                    className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                    {viewingBranch.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {viewingBranch.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {viewingBranch.name}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    School: <span className="font-semibold text-slate-600 dark:text-slate-300">{viewingBranch.schoolName}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block mb-1">Parent School</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{viewingBranch.schoolName}</div>
                  <div className="font-mono text-[10px] text-indigo-600">{viewingBranch.schoolCode}</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      viewingBranch.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${viewingBranch.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {viewingBranch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Branch Administrator</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {viewingBranch.adminUsername ? `👤 ${viewingBranch.adminUsername}` : 'Not Configured'}
                  </div>
                  <div className="text-slate-500">{viewingBranch.adminEmail || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Location</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{viewingBranch.city || '—'}</div>
                  <div className="text-slate-500">{[viewingBranch.province, viewingBranch.country].filter(Boolean).join(', ')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Official Phone</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{viewingBranch.phone || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Official Email</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{viewingBranch.email || '—'}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Created: {new Date(viewingBranch.createdAt).toLocaleDateString()}</div>
                <div>Last Updated: {new Date(viewingBranch.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
