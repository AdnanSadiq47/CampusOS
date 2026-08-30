'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BranchListItemDto,
  BranchDetailDto,
  CreateBranchDto,
  UpdateBranchDto,
  BranchDependenciesDto,
  ProvisionAccountDto,
} from '@campus-os/types';
import { AdminConfigPageHeader, ORGANIZATION_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { AdminModal } from '../../../../components/ui/AdminModal';
import { ConnectedUnitsModal } from '../../../../components/ConnectedUnitsModal';
import { GeographyLocationFields } from '../../../../components/GeographySelectors';
import { usePermissions } from '../../../../lib/permissions';
import { validateSingleField, SemanticDataType } from '../../../../lib/form-validation';
import {
  StatCard,
  StatusBadge,
  ConnectedCountPill,
  RowActions,
  ViewAction,
  EditAction,
  DeleteAction,
} from '../../../../design-system';
import { CheckCircle2, Clock, Building2, School as SchoolIcon, Sparkles } from 'lucide-react';
import { FormattedPhone, useContactPlaceholders } from '../../../../components/DisplayFormatters';

const API_BASE = '/api';
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '99999999-9999-9999-9999-999999999999';

interface SchoolOption {
  id: string;
  code: string;
  name: string;
  city?: string | null;
}

export default function BranchesPage() {
  const { permissions } = usePermissions();

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState<boolean>(false);
  const [reorderSchoolId, setReorderSchoolId] = useState<string>('');
  const [reorderList, setReorderList] = useState<BranchListItemDto[]>([]);

  const [editingBranch, setEditingBranch] = useState<BranchListItemDto | null>(null);
  const [viewingBranch, setViewingBranch] = useState<BranchDetailDto | null>(null);
  const [isLoadingView, setIsLoadingView] = useState<boolean>(false);
  const [connectedUnitsBranch, setConnectedUnitsBranch] = useState<BranchListItemDto | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<BranchListItemDto | null>(null);
  const [branchDependencies, setBranchDependencies] = useState<BranchDependenciesDto | null>(null);
  const [isCheckingDeps, setIsCheckingDeps] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formTab, setFormTab] = useState<'school' | 'basic' | 'contact' | 'location' | 'admin'>('school');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Administrator Login State
  const [enableAdminLogin, setEnableAdminLogin] = useState<boolean>(false);
  const [accountData, setAccountData] = useState<ProvisionAccountDto>({
    email: '',
    temporaryPassword: '',
    roleCode: 'BRANCH_ADMIN',
    isActive: true,
  });

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<CreateBranchDto>({
    schoolId: '',
    code: '',
    name: '',
    shortName: '',
    description: '',
    sortOrder: 1,
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
    countryId: '',
    stateId: '',
    cityId: '',
    areaId: '',
    notes: '',
    status: true,
  });

  const activeBranchSchoolId = editingBranch ? editingBranch.schoolId : (formData.schoolId || null);
  const contactPlaceholders = useContactPlaceholders({ schoolId: activeBranchSchoolId });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getAuthHeaders = useCallback(() => {
    return {
      'x-tenant-id': TENANT_ID,
      'x-user-id': USER_ID,
      'x-user-permissions': permissions.join(','),
    };
  }, [permissions]);

  // Fetch real branches & schools from DB
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schoolsRes, branchesRes] = await Promise.all([
        fetch(`${API_BASE}/schools`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/branches`, { headers: getAuthHeaders() }),
      ]);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(
          Array.isArray(schoolsData)
            ? schoolsData.map((s: any) => ({
                id: s.id,
                code: s.code,
                name: s.name,
                city: s.city,
              }))
            : []
        );
      }

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } else {
        const err = await branchesRes.json().catch(() => ({}));
        showToast('error', err.message || 'Failed to load branch records from database');
      }
    } catch {
      showToast('error', 'Network error connecting to CampusOS API');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch real dependencies when deletingBranch is selected
  useEffect(() => {
    if (deletingBranch) {
      setIsCheckingDeps(true);
      fetch(`${API_BASE}/branches/${deletingBranch.id}/dependencies`, {
        headers: getAuthHeaders(),
      })
        .then((res) => res.json())
        .then((data: BranchDependenciesDto) => {
          setBranchDependencies(data);
        })
        .catch(() => {
          showToast('error', 'Failed to inspect branch dependencies');
        })
        .finally(() => {
          setIsCheckingDeps(false);
        });
    }
  }, [deletingBranch, getAuthHeaders]);

  // Canonical ordering: schoolName ASC, sortOrder ASC, name ASC
  const canonicalBranches = useMemo(() => {
    return [...branches].sort((a, b) => {
      const schoolComp = (a.schoolName || '').localeCompare(b.schoolName || '');
      if (schoolComp !== 0) return schoolComp;
      const orderA = a.sortOrder || 1;
      const orderB = b.sortOrder || 1;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return canonicalBranches.filter((b) => {
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
  }, [canonicalBranches, searchQuery, statusFilter, schoolFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive).length;
    const inactive = total - active;
    const uniqueSchoolsWithBranches = new Set(branches.map((b) => b.schoolId)).size;
    return { total, active, inactive, uniqueSchoolsWithBranches };
  }, [branches]);

  // Auto-Suggest Next Sort Order when School changes
  const handleSchoolSelect = async (schoolId: string) => {
    setFormData((prev) => ({ ...prev, schoolId }));
    if (!schoolId) return;

    try {
      const res = await fetch(`${API_BASE}/branches/next-sort-order?schoolId=${schoolId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, schoolId, sortOrder: data.nextSortOrder || 1 }));
      }
    } catch {
      // ignore
    }
  };

  // Username suggestion helper
  const handleSuggestUsername = async () => {
    try {
      const query = new URLSearchParams({
        schoolId: formData.schoolId || '',
        branchCode: formData.code || '',
        branchName: formData.name || '',
      });
      const res = await fetch(`${API_BASE}/branches/suggest-username?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.username) {
          const cleanEmail = `${data.username.toLowerCase()}@campus-os.pk`;
          setAccountData((prev) => ({
            ...prev,
            email: cleanEmail,
          }));
        }
      }
    } catch {
      const codePart = formData.code ? formData.code.toLowerCase().replace(/[^a-z0-9]/g, '') : 'campus';
      setAccountData((prev) => ({
        ...prev,
        email: `${codePart}.admin@campus-os.pk`,
      }));
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({
      schoolId: schools[0]?.id || '',
      code: '',
      name: '',
      shortName: '',
      description: '',
      sortOrder: 1,
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
      countryId: '',
      stateId: '',
      cityId: '',
      areaId: '',
      notes: '',
      status: true,
    });
    setEnableAdminLogin(false);
    setAccountData({
      email: '',
      temporaryPassword: '',
      roleCode: 'BRANCH_ADMIN',
      isActive: true,
    });
    setFormTab('school');
    setFormErrors({});
    setIsModalOpen(true);

    if (schools[0]?.id) {
      handleSchoolSelect(schools[0].id);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = async (branch: BranchListItemDto) => {
    setEditingBranch(branch);
    setFormData({
      schoolId: branch.schoolId,
      code: branch.code,
      name: branch.name,
      shortName: branch.shortName || '',
      description: '',
      sortOrder: branch.sortOrder || 1,
      logoUrl: branch.logoUrl || '',
      phone: branch.phone || '',
      alternatePhone: '',
      email: branch.email || '',
      website: '',
      country: branch.country || 'Pakistan',
      province: branch.province || '',
      city: branch.city || '',
      area: '',
      address: '',
      postalCode: '',
      countryId: (branch as any).countryId || '',
      stateId: (branch as any).stateId || '',
      cityId: (branch as any).cityId || '',
      areaId: (branch as any).areaId || '',
      notes: '',
      status: branch.isActive,
    });

    setEnableAdminLogin(false);
    setFormTab('basic');
    setFormErrors({});
    setIsModalOpen(true);

    // Fetch full details
    try {
      const res = await fetch(`${API_BASE}/branches/${branch.id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const detail: BranchDetailDto = await res.json();
        setFormData({
          schoolId: detail.schoolId,
          code: detail.code,
          name: detail.name,
          shortName: detail.shortName || '',
          description: detail.description || '',
          sortOrder: detail.sortOrder || 1,
          logoUrl: detail.logoUrl || '',
          phone: detail.phone || '',
          alternatePhone: detail.alternatePhone || '',
          email: detail.email || '',
          website: detail.website || '',
          country: detail.country || 'Pakistan',
          province: detail.province || '',
          city: detail.city || '',
          area: detail.area || '',
          address: detail.address || '',
          postalCode: detail.postalCode || '',
          countryId: (detail as any).countryId || '',
          stateId: (detail as any).stateId || '',
          cityId: (detail as any).cityId || '',
          areaId: (detail as any).areaId || '',
          notes: detail.notes || '',
          status: detail.isActive,
        });

        if (detail.linkedAccount) {
          setAccountData({
            email: detail.linkedAccount.email,
            roleCode: detail.linkedAccount.roleCode || 'BRANCH_ADMIN',
            isActive: true,
          });
        }
      }
    } catch {
      // continue with list data
    }
  };

  // Open View Modal
  const handleOpenView = async (branch: BranchListItemDto) => {
    setViewingBranch({ ...branch });
    setIsLoadingView(true);
    setIsViewModalOpen(true);
    try {
      const res = await fetch(`${API_BASE}/branches/${branch.id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const detail = await res.json();
        setViewingBranch(detail);
      }
    } catch {
      // keep fallback
    } finally {
      setIsLoadingView(false);
    }
  };

  // Open Reorder Modal
  const handleOpenReorder = (initialSchoolId?: string) => {
    const targetSchoolId = initialSchoolId || schools[0]?.id || '';
    setReorderSchoolId(targetSchoolId);
    const targetBranches = canonicalBranches
      .filter((b) => b.schoolId === targetSchoolId)
      .sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1));
    setReorderList(targetBranches);
    setIsReorderModalOpen(true);
  };

  const handleReorderSchoolChange = (newSchoolId: string) => {
    setReorderSchoolId(newSchoolId);
    const targetBranches = canonicalBranches
      .filter((b) => b.schoolId === newSchoolId)
      .sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1));
    setReorderList(targetBranches);
  };

  const moveReorderItem = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderList.length) return;
    const nextList = [...reorderList];
    const [moved] = nextList.splice(index, 1);
    if (moved) {
      nextList.splice(targetIndex, 0, moved);
      setReorderList(nextList);
    }
  };

  const handleSaveReorder = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        schoolId: reorderSchoolId,
        branchIds: reorderList.map((b) => b.id),
      };
      const res = await fetch(`${API_BASE}/branches/reorder`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('success', 'Branch display order saved successfully');
        setIsReorderModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.message || 'Failed to save reorder');
      }
    } catch {
      showToast('error', 'Network error saving reorder');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (branch: BranchListItemDto) => {
    try {
      const res = await fetch(`${API_BASE}/branches/${branch.id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });

      if (res.ok) {
        showToast('success', `Branch '${branch.name}' is now ${!branch.isActive ? 'Active' : 'Inactive'}`);
        fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.message || 'Failed to update status');
      }
    } catch {
      showToast('error', 'Network error updating status');
    }
  };

  // Field Blur Validation
  const handleFieldBlur = (field: string, type: SemanticDataType, value: unknown, required = false) => {
    const err = validateSingleField(type, value, required);
    if (err) {
      setFormErrors((prev) => ({ ...prev, [field]: err }));
    } else {
      setFormErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.schoolId) {
      errors.schoolId = 'Please select a valid parent School';
    }
    if (!formData.name?.trim()) {
      errors.name = 'Branch name is required';
    }
    if (!formData.code?.trim()) {
      errors.code = 'Branch code is required';
    } else if (!/^[A-Z0-9_-]{2,32}$/i.test(formData.code.trim())) {
      errors.code = 'Code must be 2-32 alphanumeric characters (dashes & underscores allowed)';
    }

    if (formData.email?.trim()) {
      const emailErr = validateSingleField('EMAIL', formData.email);
      if (emailErr) errors.email = emailErr;
    }
    if (formData.phone?.trim()) {
      const phoneErr = validateSingleField('PHONE', formData.phone);
      if (phoneErr) errors.phone = phoneErr;
    }
    if (formData.alternatePhone?.trim()) {
      const altPhoneErr = validateSingleField('PHONE', formData.alternatePhone);
      if (altPhoneErr) errors.alternatePhone = altPhoneErr;
    }
    if (formData.website?.trim()) {
      const urlErr = validateSingleField('URL', formData.website);
      if (urlErr) errors.website = urlErr;
    }

    if (enableAdminLogin) {
      if (!accountData.email?.trim()) {
        errors.adminEmail = 'Administrator email is required';
      } else {
        const accEmailErr = validateSingleField('EMAIL', accountData.email);
        if (accEmailErr) errors.adminEmail = accEmailErr;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Branch (Create / Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      if (formErrors.schoolId) setFormTab('school');
      else if (formErrors.name || formErrors.code) setFormTab('basic');
      else if (formErrors.phone || formErrors.alternatePhone || formErrors.email || formErrors.website) setFormTab('contact');
      else if (formErrors.adminEmail) setFormTab('admin');
      showToast('error', 'Please fix the errors in the form before saving');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBranch) {
        const updatePayload: UpdateBranchDto = {
          schoolId: formData.schoolId,
          name: formData.name.trim(),
          shortName: formData.shortName?.trim() || undefined,
          description: formData.description?.trim() || undefined,
          sortOrder: formData.sortOrder || 1,
          logoUrl: formData.logoUrl?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          alternatePhone: formData.alternatePhone?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          website: formData.website?.trim() || undefined,
          country: formData.country?.trim() || 'Pakistan',
          province: formData.province?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          area: formData.area?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          postalCode: formData.postalCode?.trim() || undefined,
          countryId: formData.countryId || undefined,
          stateId: formData.stateId || undefined,
          cityId: formData.cityId || undefined,
          areaId: formData.areaId || undefined,
          notes: formData.notes?.trim() || undefined,
          isActive: formData.status ?? true,
          account: enableAdminLogin && accountData.email ? accountData : undefined,
        };

        const res = await fetch(`${API_BASE}/branches/${editingBranch.id}`, {
          method: 'PATCH',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to update branch');
        }

        showToast('success', `Branch '${formData.name}' updated successfully`);
      } else {
        const createPayload: CreateBranchDto = {
          schoolId: formData.schoolId,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          shortName: formData.shortName?.trim() || undefined,
          description: formData.description?.trim() || undefined,
          sortOrder: formData.sortOrder || 1,
          logoUrl: formData.logoUrl?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          alternatePhone: formData.alternatePhone?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          website: formData.website?.trim() || undefined,
          country: formData.country?.trim() || 'Pakistan',
          province: formData.province?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          area: formData.area?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          postalCode: formData.postalCode?.trim() || undefined,
          countryId: formData.countryId || undefined,
          stateId: formData.stateId || undefined,
          cityId: formData.cityId || undefined,
          areaId: formData.areaId || undefined,
          notes: formData.notes?.trim() || undefined,
          status: formData.status ?? true,
          account: enableAdminLogin && accountData.email ? accountData : undefined,
        };

        const res = await fetch(`${API_BASE}/branches`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createPayload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to create branch');
        }

        showToast('success', `Branch '${formData.name}' created successfully`);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'An error occurred while saving branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingBranch) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/branches/${deletingBranch.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        showToast('success', `Branch '${deletingBranch.name}' deleted successfully`);
        setIsDeleteModalOpen(false);
        setDeletingBranch(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.message || 'Failed to delete branch');
      }
    } catch {
      showToast('error', 'Network error deleting branch');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <AdminConfigPageHeader
        title="Branches / Campuses"
        description="Manage physical campus locations, sort sequences, and administrators under each Parent School."
        categoryNav={ORGANIZATION_SETUP_NAV}
        actionButtonText="Add Branch / Campus"
        onAction={handleOpenCreate}
      />

      {/* KPI Stats (Canonical 2-Row StatCard with Lucide icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL BRANCHES"
          value={kpis.total}
          icon={<Building2 className="w-5 h-5" />}
          variant="primary"
        />
        <StatCard
          label="ACTIVE CAMPUSES"
          value={kpis.active}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          label="INACTIVE CAMPUSES"
          value={kpis.inactive}
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          label="PARENT SCHOOLS"
          value={kpis.uniqueSchoolsWithBranches}
          icon={<SchoolIcon className="w-5 h-5" />}
          variant="info"
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex-1 w-full sm:w-auto relative">
          <input
            type="text"
            placeholder="Search by code, campus name, school, city, or admin email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Parent School Filter */}
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Schools ({schools.length})</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Reorder Button */}
          <button
            type="button"
            onClick={() => handleOpenReorder(schoolFilter !== 'ALL' ? schoolFilter : undefined)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>⇅</span>
            <span>Reorder Sequence</span>
          </button>
        </div>
      </div>

      {/* Main Branches Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Sort</th>
                <th className="py-3.5 px-4">Campus / Branch</th>
                <th className="py-3.5 px-4">Parent School</th>
                <th className="py-3.5 px-4">Connected Units</th>
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="animate-spin text-xl mb-1">⏳</div>
                    Loading branches from real database...
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No branch campuses found</p>
                    <p className="text-xs mt-1">Try adjusting your search query or parent school filter.</p>
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Sort Order */}
                    <td className="py-3 px-4 font-mono text-slate-400 font-semibold text-[11px]">
                      #{branch.sortOrder || 1}
                    </td>

                    {/* Branch Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {branch.logoUrl ? (
                          <img
                            src={branch.logoUrl}
                            alt={branch.name}
                            className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {branch.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {branch.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {branch.code}
                            {branch.shortName && ` • ${branch.shortName}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Parent School */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        🏫 {branch.schoolName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {branch.schoolCode}
                      </div>
                    </td>

                    {/* Connected Units */}
                    <td className="py-3 px-4">
                      <ConnectedCountPill
                        count={0}
                        label="Units"
                        onClick={() => setConnectedUnitsBranch(branch)}
                      />
                    </td>

                    {/* Administrator */}
                    <td className="py-3 px-4">
                      {branch.adminUsername || branch.adminEmail ? (
                        <div>
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {branch.adminUsername || 'Administrator'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {branch.adminEmail}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {[branch.city, branch.province].filter(Boolean).join(', ') || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(branch)}
                        className="cursor-pointer inline-block"
                        title="Click to toggle active status"
                      >
                        <StatusBadge
                          status={branch.isActive ? 'Active' : 'Inactive'}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <RowActions>
                        <ViewAction
                          onClick={() => handleOpenView(branch)}
                        />
                        <EditAction
                          onClick={() => handleOpenEdit(branch)}
                        />
                        <DeleteAction
                          onClick={() => {
                            setDeletingBranch(branch);
                            setIsDeleteModalOpen(true);
                          }}
                        />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 1. CREATE / EDIT BRANCH MODAL (Canonical AdminModal) ─────────────────── */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="4xl"
        title={editingBranch ? `Edit Campus: ${editingBranch.name}` : 'Add New Branch / Campus'}
        subtitle="Establish a physical campus under a verified Parent School in your network hierarchy."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setFormTab('school')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                formTab === 'school'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              1. Parent School {formErrors.schoolId && <span className="text-rose-500">*</span>}
            </button>
            <button
              type="button"
              onClick={() => setFormTab('basic')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                formTab === 'basic'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              2. Basic Information {(formErrors.name || formErrors.code) && <span className="text-rose-500">*</span>}
            </button>
            <button
              type="button"
              onClick={() => setFormTab('contact')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                formTab === 'contact'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              3. Contact Information
            </button>
            <button
              type="button"
              onClick={() => setFormTab('location')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                formTab === 'location'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              4. Location & Address
            </button>
            <button
              type="button"
              onClick={() => setFormTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                formTab === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              5. Administrator Login {formErrors.adminEmail && <span className="text-rose-500">*</span>}
            </button>
          </div>

          {/* TAB 1: PARENT SCHOOL SELECTION (Strictly Real Database) */}
          {formTab === 'school' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl space-y-1">
                <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🏛️</span> Parent School Attachment
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Every Branch/Campus strictly belongs to a Parent School institution. Choose the authorized school from your organization database.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Parent School <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.schoolId}
                  onChange={(e) => handleSchoolSelect(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                    formErrors.schoolId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  <option value="">— Select an authorized School from database —</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}){s.city ? ` — ${s.city}` : ''}
                    </option>
                  ))}
                </select>
                {formErrors.schoolId && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.schoolId}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BASIC INFORMATION */}
          {formTab === 'basic' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus / Branch Name <span className="text-rose-500">*</span>
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
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BR_KHI_GUL"
                    value={formData.code}
                    disabled={!!editingBranch}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border font-mono ${
                      formErrors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60`}
                  />
                  {formErrors.code && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short / Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gulshan Campus"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sort Order / Sequence
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sortOrder || 1}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of this branch campus..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Active Status</div>
                  <div className="text-[11px] text-slate-400">
                    Active branches are operational and open for enrollment and staffing.
                  </div>
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
          )}

          {/* TAB 3: CONTACT INFORMATION */}
          {formTab === 'contact' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder={contactPlaceholders.landline}
                    value={formData.phone || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (formErrors.phone) handleFieldBlur('phone', 'PHONE', e.target.value);
                    }}
                    onBlur={() => handleFieldBlur('phone', 'PHONE', formData.phone)}
                    className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                      formErrors.phone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                    } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="text"
                    placeholder={contactPlaceholders.mobile}
                    value={formData.alternatePhone || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, alternatePhone: e.target.value });
                      if (formErrors.alternatePhone) handleFieldBlur('alternatePhone', 'PHONE', e.target.value);
                    }}
                    onBlur={() => handleFieldBlur('alternatePhone', 'PHONE', formData.alternatePhone)}
                    className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                      formErrors.alternatePhone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                    } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                  />
                  {formErrors.alternatePhone && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.alternatePhone}</p>
                  )}
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
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) handleFieldBlur('email', 'EMAIL', e.target.value);
                    }}
                    onBlur={() => handleFieldBlur('email', 'EMAIL', formData.email)}
                    className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                      formErrors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                    } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Website URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://gulshan.beaconhorizon.edu.pk"
                    value={formData.website || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, website: e.target.value });
                      if (formErrors.website) handleFieldBlur('website', 'URL', e.target.value);
                    }}
                    onBlur={() => handleFieldBlur('website', 'URL', formData.website)}
                    className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                      formErrors.website ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                    } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                  />
                  {formErrors.website && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.website}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOCATION & GEOGRAPHY */}
          {formTab === 'location' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Authoritative Geographic Hierarchy
                </div>
                <GeographyLocationFields
                  country={formData.country || 'Pakistan'}
                  countryId={formData.countryId || ''}
                  province={formData.province || ''}
                  stateId={formData.stateId || ''}
                  city={formData.city || ''}
                  cityId={formData.cityId || ''}
                  area={formData.area || ''}
                  areaId={formData.areaId || ''}
                  postalCode={formData.postalCode || ''}
                  onCountryChange={(c) => setFormData((prev) => ({ ...prev, country: c }))}
                  onCountryIdChange={(cId) => setFormData((prev) => ({ ...prev, countryId: cId }))}
                  onProvinceChange={(p) => setFormData((prev) => ({ ...prev, province: p }))}
                  onStateIdChange={(sId) => setFormData((prev) => ({ ...prev, stateId: sId }))}
                  onCityChange={(ct) => setFormData((prev) => ({ ...prev, city: ct }))}
                  onCityIdChange={(ctId) => setFormData((prev) => ({ ...prev, cityId: ctId }))}
                  onAreaChange={(a) => setFormData((prev) => ({ ...prev, area: a }))}
                  onAreaIdChange={(aId) => setFormData((prev) => ({ ...prev, areaId: aId }))}
                  onPostalCodeChange={(pc) => setFormData((prev) => ({ ...prev, postalCode: pc }))}
                  showAreaAndPostal={true}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  placeholder="Plot/Street address of the campus..."
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 5: ADMINISTRATOR LOGIN PROVISIONING */}
          {formTab === 'admin' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Provision Branch Administrator Login
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Link an IAM administrator account scoped strictly to this Branch / Campus node.
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
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Admin Email Address <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSuggestUsername}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Suggest Email</span>
                      </button>
                    </div>
                    <input
                      type="email"
                      placeholder="e.g. gulshan.admin@campus-os.pk"
                      value={accountData.email}
                      onChange={(e) => {
                        setAccountData({ ...accountData, email: e.target.value });
                        if (formErrors.adminEmail) handleFieldBlur('adminEmail', 'EMAIL', e.target.value, true);
                      }}
                      onBlur={() => handleFieldBlur('adminEmail', 'EMAIL', accountData.email, true)}
                      className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border font-mono ${
                        formErrors.adminEmail ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                      } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1`}
                    />
                    {formErrors.adminEmail && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.adminEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Temporary Initial Password
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank for auto-generated secure password"
                      value={accountData.temporaryPassword || ''}
                      onChange={(e) => setAccountData({ ...accountData, temporaryPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-400">
              {editingBranch ? 'Editing existing branch' : 'New branch record'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingBranch ? 'Update Campus' : 'Create Campus'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* ── 2. VIEW BRANCH MODAL (Canonical AdminModal with exact viewport fit) ─────────────────── */}
      <AdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="4xl"
        title={
          <div className="flex items-center gap-3">
            {viewingBranch?.logoUrl ? (
              <img
                src={viewingBranch.logoUrl}
                alt={viewingBranch.name}
                className="h-10 w-10 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold flex items-center justify-center text-lg shrink-0 border border-indigo-200/50">
                🏫
              </div>
            )}
            <div className="min-w-0">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {viewingBranch?.name || 'Branch Details'}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Code: {viewingBranch?.code || '—'} • Sequence: #{viewingBranch?.sortOrder || 1}
              </div>
            </div>
          </div>
        }
        badge={
          viewingBranch && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                viewingBranch.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              {viewingBranch.isActive ? 'Active' : 'Inactive'}
            </span>
          )
        }
      >
        {isLoadingView || !viewingBranch ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="animate-spin text-xl">⏳</div>
            <p className="text-xs">Loading campus details from real database...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Hierarchy & Parent Affiliations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-medium">Parent School:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  🏫 {viewingBranch.schoolName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {viewingBranch.schoolCode}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Head Office Affiliation:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  🏢 {viewingBranch.headOfficeName || 'Direct HQ'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Official Campus Email:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingBranch.email || '—'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Official Campus Phone:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  <FormattedPhone value={viewingBranch.phone} schoolId={viewingBranch.schoolId} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 font-medium">Location & Physical Address:</span>
                <div className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {[viewingBranch.address, viewingBranch.area, viewingBranch.city, viewingBranch.province, viewingBranch.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                  {viewingBranch.postalCode && <span className="text-slate-400 ml-1">({viewingBranch.postalCode})</span>}
                </div>
              </div>
            </div>

            {/* Linked IAM Administrator */}
            {viewingBranch.linkedAccount && (
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl space-y-2">
                <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🔐</span> Linked IAM Campus Administrator
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Account Email:</span>{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingBranch.linkedAccount.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span>{' '}
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{viewingBranch.linkedAccount.roleCode || 'BRANCH_ADMIN'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Audit Trail</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  Created By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingBranch.createdByUser?.name || 'System User'}</span>
                </div>
                <div>
                  Created At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingBranch.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  Updated By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingBranch.updatedByUser?.name || 'System User'}</span>
                </div>
                <div>
                  Updated At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingBranch.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ── 3. REORDER SEQUENCE MODAL ─────────────────────────────────── */}
      <AdminModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        maxWidth="2xl"
        title="Reorder Branch Display Sequence"
        subtitle="Control the numeric sequence of campuses within the selected Parent School."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Parent School to Reorder
            </label>
            <select
              value={reorderSchoolId}
              onChange={(e) => handleReorderSchoolChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {reorderList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                No campuses registered under this School.
              </div>
            ) : (
              reorderList.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.code}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveReorderItem(idx, 'UP')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === reorderList.length - 1}
                      onClick={() => moveReorderItem(idx, 'DOWN')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReorderModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReorder}
              disabled={isSubmitting || reorderList.length === 0}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Order'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* ── 4. SAFE DELETE MODAL (Canonical AdminModal) ─────────────────── */}
      <AdminModal
        isOpen={isDeleteModalOpen && !!deletingBranch}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="lg"
        title={`Delete Branch: ${deletingBranch?.name || ''}`}
        subtitle="Verifying downstream dependencies and relationships."
      >
        {deletingBranch && (
          <div className="space-y-4 text-xs">
            {isCheckingDeps ? (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <div className="animate-spin text-xl">⏳</div>
                <p>Checking database relationships and classes...</p>
              </div>
            ) : branchDependencies && !branchDependencies.canDelete ? (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⛔</span> Cannot Delete Branch Campus
                  </div>
                  <p className="text-[11px]">
                    This Campus has active connected downstream records in the database.
                  </p>
                </div>

                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Blocking Dependencies:</div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                    {(branchDependencies.reasons || []).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span> Permanent Deletion Warning
                  </div>
                  <p className="text-[11px] mt-1">
                    Are you sure you want to permanently delete <strong>{deletingBranch.name}</strong> ({deletingBranch.code})? No blocking dependencies were found.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* ── 5. CONNECTED UNITS POPUP MODAL ─────────────────── */}
      {connectedUnitsBranch && (
        <ConnectedUnitsModal
          isOpen={!!connectedUnitsBranch}
          onClose={() => setConnectedUnitsBranch(null)}
          parentEntityId={connectedUnitsBranch.id}
          parentEntityName={connectedUnitsBranch.name}
          parentEntityCode={connectedUnitsBranch.code}
          parentEntityType="BRANCH"
          hierarchyNodeId={connectedUnitsBranch.hierarchyNodeId}
          expectedCount={0}
          zIndex={120}
        />
      )}
    </div>
  );
}
