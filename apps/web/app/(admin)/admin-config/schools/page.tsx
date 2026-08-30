'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SchoolListItemDto,
  SchoolDetailDto,
  SchoolDependenciesDto,
  HeadOfficeListItemDto,
  RegionListItemDto,
  CreateSchoolDto,
  UpdateSchoolDto,
  ProvisionAccountDto,
  SchoolType,
  CANONICAL_SCHOOL_TYPES,
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
import { School, CheckCircle2, Building2 } from 'lucide-react';
import { FormattedPhone, FormattedMobile, useContactPlaceholders } from '../../../../components/DisplayFormatters';

const API_BASE = '/api';
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '99999999-9999-9999-9999-999999999999';

export default function SchoolsPage() {
  const [editingSchool, setEditingSchool] = useState<SchoolListItemDto | null>(null);
  const contactPlaceholders = useContactPlaceholders({ schoolId: editingSchool?.id || null });
  const {
    permissions,
    canCreateSchool,
    canViewSchool,
    canEditSchool,
    canChangeStatusSchool,
    canDeleteSchool,
  } = usePermissions();

  // State
  const [schools, setSchools] = useState<SchoolListItemDto[]>([]);
  const [headOffices, setHeadOffices] = useState<HeadOfficeListItemDto[]>([]);
  const [regionalOffices, setRegionalOffices] = useState<RegionListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [hoFilter, setHoFilter] = useState<string>('ALL');
  const [regFilter, setRegFilter] = useState<string>('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [connectedUnitsSchool, setConnectedUnitsSchool] = useState<SchoolListItemDto | SchoolDetailDto | null>(null);
  const [viewingSchool, setViewingSchool] = useState<SchoolDetailDto | null>(null);
  const [isLoadingView, setIsLoadingView] = useState<boolean>(false);

  // Form selections
  const [selectedHeadOffice, setSelectedHeadOffice] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [formTab, setFormTab] = useState<'basic' | 'branding' | 'account' | 'contact' | 'location' | 'affiliation'>('basic');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dependency Safe Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolListItemDto | null>(null);
  const [deleteDependencies, setDeleteDependencies] = useState<SchoolDependenciesDto | null>(null);
  const [isCheckingDeps, setIsCheckingDeps] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<CreateSchoolDto>({
    name: '',
    code: '',
    headOfficeId: '',
    regionId: '',
    status: true,
    schoolType: SchoolType.SCHOOL,
    registrationNumber: '',
    educationBoard: '',
    principalName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    websiteUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    whatsappNumber: '',
    logoUrl: '',
    address: '',
    area: '',
    city: '',
    province: '',
    country: 'Pakistan',
    postalCode: '',
    countryId: '',
    stateId: '',
    cityId: '',
    areaId: '',
    customDomain: '',
    defaultLanguage: 'en',
    timezone: 'Asia/Karachi',
    notes: '',
  });

  const [accountData, setAccountData] = useState<ProvisionAccountDto>({
    email: '',
    temporaryPassword: '',
    roleCode: 'SCHOOL_ADMIN',
    isActive: true,
  });

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

  // Fetch real data from DB
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schools`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.message || 'Failed to fetch schools from PostgreSQL');
      }
    } catch {
      showToast('error', 'Network error connecting to CampusOS API');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [hoRes, regRes] = await Promise.all([
        fetch(`${API_BASE}/head-offices`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/regions`, { headers: getAuthHeaders() }),
      ]);

      if (hoRes.ok) {
        const data = await hoRes.json();
        setHeadOffices(Array.isArray(data) ? data : []);
      }
      if (regRes.ok) {
        const data = await regRes.json();
        setRegionalOffices(Array.isArray(data) ? data : []);
      }
    } catch {
      // Non-blocking
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSchools();
    fetchAuxiliaryData();
  }, [fetchSchools, fetchAuxiliaryData]);

  // Handle Logo Upload via FileReader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image file exceeds 2MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      headOfficeId: headOffices[0]?.id || '',
      regionId: '',
      status: true,
      schoolType: 'K12',
      registrationNumber: '',
      educationBoard: '',
      principalName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      websiteUrl: '',
      facebookUrl: '',
      linkedinUrl: '',
      whatsappNumber: '',
      logoUrl: '',
      address: '',
      area: '',
      city: '',
      province: '',
      country: 'Pakistan',
      postalCode: '',
      countryId: '',
      stateId: '',
      cityId: '',
      areaId: '',
      customDomain: '',
      defaultLanguage: 'en',
      timezone: 'Asia/Karachi',
      notes: '',
    });
    setAccountData({
      email: '',
      temporaryPassword: '',
      roleCode: 'SCHOOL_ADMIN',
      isActive: true,
    });
    setSelectedHeadOffice(headOffices[0]?.id || '');
    setSelectedRegion('');
    setFormErrors({});
    setFormTab('basic');
    setEditingSchool(null);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (school: SchoolListItemDto) => {
    setEditingSchool(school);
    setSelectedHeadOffice(school.headOfficeId || '');
    setSelectedRegion(school.regionId || '');
    setFormData({
      name: school.name,
      code: school.code,
      headOfficeId: school.headOfficeId || '',
      regionId: school.regionId || '',
      status: school.isActive,
      schoolType: school.schoolType || SchoolType.SCHOOL,
      registrationNumber: school.registrationNumber || '',
      educationBoard: school.educationBoard || '',
      principalName: school.principalName || '',
      email: school.email || '',
      phone: school.phone || '',
      alternatePhone: (school as any).alternatePhone || '',
      websiteUrl: school.websiteUrl || (school as any).website || '',
      facebookUrl: school.facebookUrl || '',
      linkedinUrl: school.linkedinUrl || '',
      whatsappNumber: school.whatsappNumber || '',
      logoUrl: school.logoUrl || '',
      address: school.address || (school as any).address || '',
      area: school.area || (school as any).area || '',
      city: school.city || '',
      province: school.province || '',
      country: school.country || 'Pakistan',
      postalCode: school.postalCode || (school as any).postalCode || '',
      countryId: school.countryId || (school as any).countryId || '',
      stateId: school.stateId || (school as any).stateId || '',
      cityId: school.cityId || (school as any).cityId || '',
      areaId: school.areaId || (school as any).areaId || '',
      customDomain: (school as any).customDomain || '',
      defaultLanguage: (school as any).defaultLanguage || 'en',
      timezone: (school as any).timezone || 'Asia/Karachi',
      notes: (school as any).notes || '',
    });
    setAccountData({
      email: school.linkedAccount?.email || school.email || '',
      temporaryPassword: '',
      roleCode: school.linkedAccount?.roleCode || 'SCHOOL_ADMIN',
      isActive: school.linkedAccount ? school.linkedAccount.isActive : true,
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  // Open View Details Modal
  const handleOpenViewModal = async (school: SchoolListItemDto) => {
    setIsLoadingView(true);
    setIsViewModalOpen(true);
    setViewingSchool(null);

    try {
      const res = await fetch(`${API_BASE}/schools/${school.id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data: SchoolDetailDto = await res.json();
        setViewingSchool(data);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.message || 'Failed to fetch full school details');
        setIsViewModalOpen(false);
      }
    } catch {
      showToast('error', 'Network error fetching school details');
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingView(false);
    }
  };

  // Available Regions based on selected Head Office
  const availableRegionsForModal = useMemo(() => {
    if (!selectedHeadOffice) return [];
    const selectedHO = headOffices.find((h) => h.id === selectedHeadOffice);
    if (!selectedHO) return [];

    return regionalOffices.filter(
      (r) =>
        r.parentId === selectedHO.id ||
        r.parentId === selectedHO.hierarchyNodeId ||
        r.parentCode === selectedHO.code
    );
  }, [selectedHeadOffice, headOffices, regionalOffices]);

  // Filtered Schools list
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.principalName && s.principalName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.isActive) ||
        (statusFilter === 'INACTIVE' && !s.isActive);

      const matchesHO = hoFilter === 'ALL' || s.headOfficeId === hoFilter;
      const matchesReg = regFilter === 'ALL' || s.regionId === regFilter;

      return matchesSearch && matchesStatus && matchesHO && matchesReg;
    });
  }, [schools, searchQuery, statusFilter, hoFilter, regFilter]);

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

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'School Name is required';
    if (!editingSchool && !formData.code?.trim()) errors.code = 'School Code is required';
    if (!selectedHeadOffice) errors.headOfficeId = 'Head Office selection is mandatory';

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
    if (formData.websiteUrl?.trim()) {
      const urlErr = validateSingleField('URL', formData.websiteUrl);
      if (urlErr) errors.websiteUrl = urlErr;
    }
    if (formData.facebookUrl?.trim()) {
      const fbErr = validateSingleField('URL', formData.facebookUrl);
      if (fbErr) errors.facebookUrl = fbErr;
    }
    if (formData.linkedinUrl?.trim()) {
      const liErr = validateSingleField('URL', formData.linkedinUrl);
      if (liErr) errors.linkedinUrl = liErr;
    }
    if (formData.whatsappNumber?.trim()) {
      const waErr = validateSingleField('WHATSAPP', formData.whatsappNumber);
      if (waErr) errors.whatsappNumber = waErr;
    }
    if (accountData.email?.trim()) {
      const accEmailErr = validateSingleField('EMAIL', accountData.email);
      if (accEmailErr) errors.accountEmail = accEmailErr;
    }

    setFormErrors(errors);

    // Auto-focus tab with errors
    if (errors.name || errors.code || errors.headOfficeId) setFormTab('basic');
    else if (errors.websiteUrl || errors.whatsappNumber || errors.facebookUrl || errors.linkedinUrl) setFormTab('branding');
    else if (errors.email || errors.phone || errors.alternatePhone) setFormTab('contact');
    else if (errors.accountEmail) setFormTab('account');

    return Object.keys(errors).length === 0;
  };

  // Save (Create or Edit)
  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const cleanCode = formData.code.trim().toUpperCase();
      const cleanName = formData.name.trim();

      const accountPayload = accountData.email?.trim()
        ? {
            email: accountData.email.trim().toLowerCase(),
            temporaryPassword: accountData.temporaryPassword?.trim() || undefined,
            roleCode: accountData.roleCode || 'SCHOOL_ADMIN',
            isActive: accountData.isActive ?? true,
          }
        : undefined;

      if (editingSchool) {
        // Real PATCH
        const updatePayload: UpdateSchoolDto = {
          name: cleanName,
          headOfficeId: selectedHeadOffice,
          regionId: selectedRegion || null,
          schoolType: formData.schoolType,
          registrationNumber: formData.registrationNumber?.trim() || undefined,
          educationBoard: formData.educationBoard?.trim() || undefined,
          principalName: formData.principalName?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          alternatePhone: formData.alternatePhone?.trim() || undefined,
          websiteUrl: formData.websiteUrl?.trim() || null,
          facebookUrl: formData.facebookUrl?.trim() || null,
          linkedinUrl: formData.linkedinUrl?.trim() || null,
          whatsappNumber: formData.whatsappNumber?.trim() || null,
          logoUrl: formData.logoUrl || null,
          address: formData.address?.trim() || undefined,
          area: formData.area?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          province: formData.province?.trim() || undefined,
          country: formData.country?.trim() || 'Pakistan',
          postalCode: formData.postalCode?.trim() || undefined,
          countryId: formData.countryId || undefined,
          stateId: formData.stateId || undefined,
          cityId: formData.cityId || undefined,
          areaId: formData.areaId || undefined,
          customDomain: formData.customDomain?.trim() || undefined,
          defaultLanguage: formData.defaultLanguage || 'en',
          timezone: formData.timezone || 'Asia/Karachi',
          notes: formData.notes?.trim() || undefined,
          isActive: formData.status ?? true,
          account: accountPayload,
        };

        const res = await fetch(`${API_BASE}/schools/${editingSchool.id}`, {
          method: 'PATCH',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to update school');
        }

        showToast('success', `School '${cleanName}' updated successfully`);
      } else {
        // Real POST
        const createPayload: CreateSchoolDto = {
          name: cleanName,
          code: cleanCode,
          headOfficeId: selectedHeadOffice,
          regionId: selectedRegion || undefined,
          schoolType: formData.schoolType,
          registrationNumber: formData.registrationNumber?.trim() || undefined,
          educationBoard: formData.educationBoard?.trim() || undefined,
          principalName: formData.principalName?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          alternatePhone: formData.alternatePhone?.trim() || undefined,
          websiteUrl: formData.websiteUrl?.trim() || undefined,
          facebookUrl: formData.facebookUrl?.trim() || undefined,
          linkedinUrl: formData.linkedinUrl?.trim() || undefined,
          whatsappNumber: formData.whatsappNumber?.trim() || undefined,
          logoUrl: formData.logoUrl || undefined,
          address: formData.address?.trim() || undefined,
          area: formData.area?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          province: formData.province?.trim() || undefined,
          country: formData.country?.trim() || 'Pakistan',
          postalCode: formData.postalCode?.trim() || undefined,
          countryId: formData.countryId || undefined,
          stateId: formData.stateId || undefined,
          cityId: formData.cityId || undefined,
          areaId: formData.areaId || undefined,
          customDomain: formData.customDomain?.trim() || undefined,
          defaultLanguage: formData.defaultLanguage || 'en',
          timezone: formData.timezone || 'Asia/Karachi',
          notes: formData.notes?.trim() || undefined,
          status: formData.status ?? true,
          account: accountPayload,
        };

        const res = await fetch(`${API_BASE}/schools`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createPayload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to create school');
        }

        showToast('success', `School '${cleanName}' created successfully`);
      }

      setIsModalOpen(false);
      await fetchSchools();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save school');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (school: SchoolListItemDto) => {
    if (!canChangeStatusSchool) return;

    try {
      const res = await fetch(`${API_BASE}/schools/${school.id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !school.isActive }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update status');
      }

      showToast('success', `School '${school.name}' status updated`);
      await fetchSchools();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to toggle status');
    }
  };

  // Open Safe Delete Verification Modal
  const handleOpenDeleteModal = async (school: SchoolListItemDto) => {
    if (!canDeleteSchool) return;
    setSchoolToDelete(school);
    setIsCheckingDeps(true);
    setIsDeleteModalOpen(true);
    setDeleteDependencies(null);

    try {
      const res = await fetch(`${API_BASE}/schools/${school.id}/dependencies`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to verify school dependencies');
      }

      const data: SchoolDependenciesDto = await res.json();
      setDeleteDependencies(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to check dependencies');
      setIsDeleteModalOpen(false);
    } finally {
      setIsCheckingDeps(false);
    }
  };

  // Execute Safe Delete
  const handleConfirmDelete = async () => {
    if (!schoolToDelete || !canDeleteSchool) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/schools/${schoolToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete school');
      }

      showToast('success', `School '${schoolToDelete.name}' deleted successfully`);
      setIsDeleteModalOpen(false);
      setSchoolToDelete(null);
      await fetchSchools();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete school');
    } finally {
      setIsDeleting(false);
    }
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

      {/* 1. Page Header */}
      <AdminConfigPageHeader
        group="Organization Setup"
        title="Schools"
        description="Manage educational institutions, campus affiliations, branding, and hierarchy nodes within your network."
        categoryNav={ORGANIZATION_SETUP_NAV}
        actionButtonText={canCreateSchool ? 'Add School' : undefined}
        onAction={canCreateSchool ? handleOpenAddModal : undefined}
      />

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Schools"
          value={schools.length}
          icon={<School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          subtitle="Registered educational institutions"
          variant="default"
        />
        <StatCard
          title="Active Schools"
          value={schools.filter((s) => s.isActive).length}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle="Currently operational"
          variant="success"
        />
        <StatCard
          title="Total Branches Managed"
          value={schools.reduce((acc, s) => acc + (s.branchCount || 0), 0)}
          icon={<Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          subtitle="Affiliated secondary campuses"
          variant="info"
        />
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by code, school name, city, or principal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs">
              ✕
            </button>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Head Office Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Head Office:</span>
            <select
              value={hoFilter}
              onChange={(e) => setHoFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">All Head Offices</option>
              {headOffices.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.code})
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Region:</span>
            <select
              value={regFilter}
              onChange={(e) => setRegFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">All Regions</option>
              {regionalOffices.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Schools Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm">Loading schools from PostgreSQL...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="text-4xl">🏫</div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Schools Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No school records match the selected filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">School Institution</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Parent Affiliation</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Connected Units</th>
                  <th className="py-3.5 px-4">Linked Account</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                {filteredSchools.map((school) => (
                  <tr
                    key={school.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {school.logoUrl ? (
                          <img
                            src={school.logoUrl}
                            alt={school.name}
                            className="h-8 w-8 rounded-lg object-contain bg-white border border-slate-200 dark:border-slate-800 shadow-xs flex-shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                            🏫
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {school.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Type: {school.schoolType || 'K12'}</span>
                            {school.websiteUrl && (
                              <a
                                href={school.websiteUrl.startsWith('http') ? school.websiteUrl : `https://${school.websiteUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                              >
                                🔗 Web
                              </a>
                            )}
                            {school.whatsappNumber && (
                              <a
                                href={`https://wa.me/${school.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                              >
                                💬 WA
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                        {school.code}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {school.regionName ? (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">🌐 {school.regionName}</div>
                          <div className="text-[10px] text-slate-400">HO: {school.headOfficeName || 'Main HQ'}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            🏢 {school.headOfficeName || school.parentName || 'Direct HQ'}
                          </div>
                          <div className="text-[10px] text-slate-400">Direct Head Office Unit</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{[school.city, school.province].filter(Boolean).join(', ') || '—'}</div>
                      <div className="text-[11px] text-slate-400">{school.country || 'Pakistan'}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <ConnectedCountPill
                        count={school.branchCount || 0}
                        label="Connected Branches"
                        onClick={() => setConnectedUnitsSchool(school)}
                      />
                    </td>

                    {/* Linked Account */}
                    <td className="py-3 px-4">
                      {school.linkedAccount ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                            {school.linkedAccount.email}
                          </div>
                          <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                            {school.linkedAccount.roleCode || 'SCHOOL_ADMIN'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unlinked</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(school)}
                        disabled={!canChangeStatusSchool}
                        className={!canChangeStatusSchool ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                      >
                        <StatusBadge status={school.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <RowActions>
                        {canViewSchool && (
                          <ViewAction onClick={() => handleOpenViewModal(school)} />
                        )}
                        {canEditSchool && (
                          <EditAction onClick={() => handleOpenEditModal(school)} />
                        )}
                        {canDeleteSchool && (
                          <DeleteAction onClick={() => handleOpenDeleteModal(school)} />
                        )}
                      </RowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="5xl"
        title={editingSchool ? `Edit School: ${editingSchool.name}` : 'Add New School Institution'}
        subtitle={
          editingSchool
            ? 'Update institutional identity, branding, leadership coordinates, or IAM account.'
            : 'Register a real academic school institution under a central Head Office or Regional Directorate.'
        }
      >
        <div className="space-y-4">
          {/* Modal Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormTab('basic')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                formTab === 'basic'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              1. Basic Identity
            </button>
            <button
              type="button"
              onClick={() => setFormTab('branding')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                formTab === 'branding'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              2. Branding & Social
            </button>
            <button
              type="button"
              onClick={() => setFormTab('account')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                formTab === 'account'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              3. IAM Account
            </button>
            <button
              type="button"
              onClick={() => setFormTab('contact')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                formTab === 'contact'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              4. Contact & Admin
            </button>
            <button
              type="button"
              onClick={() => setFormTab('location')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                formTab === 'location'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              5. Location
            </button>
            <button
              type="button"
              onClick={() => setFormTab('affiliation')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                formTab === 'affiliation'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              6. Affiliation & Portal
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSaveSchool} className="space-y-4 pt-2">
            {/* TAB 1: BASIC */}
            {formTab === 'basic' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Beacon Horizon Public School"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                    {formErrors.name && <p className="text-[10px] text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SCH_KHI_01"
                      disabled={!!editingSchool}
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 font-mono focus:outline-none ${
                        formErrors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      } ${editingSchool ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    {formErrors.code && <p className="text-[10px] text-rose-500 mt-1">{formErrors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Parent Head Office <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedHeadOffice}
                      onChange={(e) => {
                        setSelectedHeadOffice(e.target.value);
                        setSelectedRegion('');
                      }}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none cursor-pointer ${
                        formErrors.headOfficeId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <option value="">-- Select Parent Head Office --</option>
                      {headOffices.map((ho) => (
                        <option key={ho.id} value={ho.id}>
                          {ho.name} ({ho.code})
                        </option>
                      ))}
                    </select>
                    {formErrors.headOfficeId && (
                      <p className="text-[10px] text-rose-500 mt-1">{formErrors.headOfficeId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Regional Directorate (Optional)
                    </label>
                    <select
                      value={selectedRegion}
                      disabled={!selectedHeadOffice}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- Direct Under Head Office (No Region) --</option>
                      {availableRegionsForModal.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Type / Level
                    </label>
                    <select
                      value={formData.schoolType || SchoolType.SCHOOL}
                      onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none cursor-pointer"
                    >
                      {CANONICAL_SCHOOL_TYPES.map((st) => (
                        <option key={st.code} value={st.code}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-5">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Active Status</div>
                      <div className="text-[10px] text-slate-400">Institutional operational state</div>
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
              </div>
            )}

            {/* TAB 2: BRANDING & SOCIAL */}
            {formTab === 'branding' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    School Official Logo (Media / Avatar)
                  </label>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {formData.logoUrl ? (
                      <div className="relative">
                        <img
                          src={formData.logoUrl}
                          alt="School Logo"
                          className="h-16 w-16 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-800 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: '' })}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center cursor-pointer shadow-xs hover:bg-rose-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold flex items-center justify-center text-2xl border border-indigo-200/50">
                        🏫
                      </div>
                    )}
                    <div className="space-y-1">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                        onChange={handleLogoUpload}
                        className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, SVG or WEBP. Max size 2MB. Displayed on public school identity, student cards, and portal.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Website URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://horizon.beacon.edu.pk"
                      value={formData.websiteUrl || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, websiteUrl: e.target.value });
                        if (formErrors.websiteUrl) handleFieldBlur('websiteUrl', 'URL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('websiteUrl', 'URL', formData.websiteUrl)}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.websiteUrl ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.websiteUrl && <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.websiteUrl}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Helpline Number
                    </label>
                    <input
                      type="text"
                      placeholder={contactPlaceholders.whatsapp}
                      value={formData.whatsappNumber || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, whatsappNumber: e.target.value });
                        if (formErrors.whatsappNumber) handleFieldBlur('whatsappNumber', 'WHATSAPP', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('whatsappNumber', 'WHATSAPP', formData.whatsappNumber)}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.whatsappNumber ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.whatsappNumber && <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.whatsappNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Facebook Page URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://facebook.com/beaconhorizon"
                      value={formData.facebookUrl || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, facebookUrl: e.target.value });
                        if (formErrors.facebookUrl) handleFieldBlur('facebookUrl', 'URL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('facebookUrl', 'URL', formData.facebookUrl)}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.facebookUrl ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.facebookUrl && <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.facebookUrl}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      LinkedIn Page URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://linkedin.com/company/beacon-horizon"
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, linkedinUrl: e.target.value });
                        if (formErrors.linkedinUrl) handleFieldBlur('linkedinUrl', 'URL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('linkedinUrl', 'URL', formData.linkedinUrl)}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.linkedinUrl ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.linkedinUrl && <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.linkedinUrl}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: IAM ACCOUNT */}
            {formTab === 'account' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>🔐</span> Centralized IAM School Administrator Account
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Provision or link an administrative user account for this school institution in the canonical IAM system. Passwords are encrypted with Argon2id and never stored in plain text.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Username / Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. principal.horizon@beacon.edu.pk"
                      value={accountData.email}
                      onChange={(e) => {
                        setAccountData({ ...accountData, email: e.target.value });
                        if (formErrors.accountEmail) handleFieldBlur('accountEmail', 'EMAIL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('accountEmail', 'EMAIL', accountData.email)}
                      className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border ${
                        formErrors.accountEmail ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      } focus:outline-none`}
                    />
                    {formErrors.accountEmail && (
                      <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.accountEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Temporary Password {editingSchool ? '(Leave blank to retain current)' : ''}
                    </label>
                    <input
                      type="password"
                      placeholder={editingSchool ? '••••••••' : 'Enter temporary password'}
                      value={accountData.temporaryPassword}
                      onChange={(e) => setAccountData({ ...accountData, temporaryPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned IAM Role
                    </label>
                    <select
                      value={accountData.roleCode}
                      onChange={(e) => setAccountData({ ...accountData, roleCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer focus:outline-none"
                    >
                      <option value="SCHOOL_ADMIN">School Administrator (SCHOOL_ADMIN)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-5">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Account Active</div>
                      <div className="text-[10px] text-slate-400">Allow login to portal</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccountData({ ...accountData, isActive: !accountData.isActive })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        accountData.isActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          accountData.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONTACT & ADMIN */}
            {formTab === 'contact' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Principal / Head of Institution
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Tariq Mehmood"
                      value={formData.principalName || ''}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="principal@school.edu.pk"
                      value={formData.email || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) handleFieldBlur('email', 'EMAIL', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('email', 'EMAIL', formData.email)}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.email ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.email && <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Telephone
                    </label>
                    <input
                      type="tel"
                      placeholder={contactPlaceholders.landline}
                      value={formData.phone || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (formErrors.phone) handleFieldBlur('phone', 'PHONE', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('phone', 'PHONE', formData.phone)}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.phone ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.phone && <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Alternate / Mobile Helpline
                    </label>
                    <input
                      type="tel"
                      placeholder={contactPlaceholders.mobile}
                      value={formData.alternatePhone || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, alternatePhone: e.target.value });
                        if (formErrors.alternatePhone) handleFieldBlur('alternatePhone', 'PHONE', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('alternatePhone', 'PHONE', formData.alternatePhone)}
                      className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 focus:outline-none ${
                        formErrors.alternatePhone ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.alternatePhone && <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.alternatePhone}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: LOCATION */}
            {formTab === 'location' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Plot 42, Block 6, PECHS"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  />
                </div>

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
              </div>
            )}

            {/* TAB 6: AFFILIATION & PORTAL */}
            {formTab === 'affiliation' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registration / Accreditation No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. REG-SED-2024-889"
                      value={formData.registrationNumber || ''}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Education Board / Affiliation Body
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cambridge / Federal Board / Aga Khan"
                      value={formData.educationBoard || ''}
                      onChange={(e) => setFormData({ ...formData, educationBoard: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Portal Custom Subdomain
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="horizon"
                        value={formData.customDomain || ''}
                        onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                        className="w-full px-3 py-2 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none font-mono"
                      />
                      <span className="px-3 py-2 rounded-r-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-mono">
                        .campusos.edu.pk
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      System Timezone
                    </label>
                    <select
                      value={formData.timezone || 'Asia/Karachi'}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</option>
                      <option value="UTC">UTC / GMT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Institutional mandates, notes, or special directives..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingSchool ? 'Save Changes' : 'Create School'}
              </button>
            </div>
          </form>
        </div>
      </AdminModal>

      {/* View Details Modal */}
      <AdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="5xl"
        title={
          <div className="flex items-center gap-3">
            {viewingSchool?.logoUrl ? (
              <img
                src={viewingSchool.logoUrl}
                alt={viewingSchool.name}
                className="h-10 w-10 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold flex items-center justify-center text-lg shrink-0 border border-indigo-200/50">
                🏫
              </div>
            )}
            <div className="min-w-0">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {viewingSchool?.name || 'School Details'}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Code: {viewingSchool?.code || '—'} • Level:{' '}
                {CANONICAL_SCHOOL_TYPES.find((t) => t.code === viewingSchool?.schoolType)?.label ||
                  viewingSchool?.schoolType ||
                  'School'}
              </div>
            </div>
          </div>
        }
        badge={
          viewingSchool && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                viewingSchool.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              {viewingSchool.isActive ? 'Active' : 'Inactive'}
            </span>
          )
        }
      >
        {isLoadingView || !viewingSchool ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="animate-spin text-xl">⏳</div>
            <p className="text-xs">Loading full school record...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Digital & Social Presence */}
            {(viewingSchool.websiteUrl || viewingSchool.facebookUrl || viewingSchool.linkedinUrl || viewingSchool.whatsappNumber) && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                  <span>🌐</span> Digital & Social Presence
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {viewingSchool.websiteUrl && (
                    <a
                      href={viewingSchool.websiteUrl.startsWith('http') ? viewingSchool.websiteUrl : `https://${viewingSchool.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200/60 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🌐</span>
                      <span>Website</span>
                      <span className="text-[10px] text-slate-400">↗</span>
                    </a>
                  )}
                  {viewingSchool.whatsappNumber && (
                    <a
                      href={`https://wa.me/${viewingSchool.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200/60 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>💬</span>
                      <span>WhatsApp (<FormattedMobile value={viewingSchool.whatsappNumber} />)</span>
                      <span className="text-[10px] text-slate-400">↗</span>
                    </a>
                  )}
                  {viewingSchool.facebookUrl && (
                    <a
                      href={viewingSchool.facebookUrl.startsWith('http') ? viewingSchool.facebookUrl : `https://${viewingSchool.facebookUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors border border-blue-200/60 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📘</span>
                      <span>Facebook</span>
                      <span className="text-[10px] text-slate-400">↗</span>
                    </a>
                  )}
                  {viewingSchool.linkedinUrl && (
                    <a
                      href={viewingSchool.linkedinUrl.startsWith('http') ? viewingSchool.linkedinUrl : `https://${viewingSchool.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors border border-sky-200/60 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🔗</span>
                      <span>LinkedIn</span>
                      <span className="text-[10px] text-slate-400">↗</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Linked IAM Account */}
            {viewingSchool.linkedAccount && (
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl space-y-2">
                <div className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🔐</span> Linked IAM School Administrator Account
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Account Email:</span>{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingSchool.linkedAccount.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span>{' '}
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{viewingSchool.linkedAccount.roleCode || 'SCHOOL_ADMIN'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hierarchy, Contact, Location & Connected Units Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-medium">Head Office Affiliation:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  🏢 {viewingSchool.headOfficeName || 'Direct HQ'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Regional Directorate:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingSchool.regionName ? `🌐 ${viewingSchool.regionName}` : '— None (Direct School) —'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Principal / Head:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingSchool.principalName || '—'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Connected Units:</span>
                <div className="mt-0.5">
                  <button
                    type="button"
                    onClick={() => setConnectedUnitsSchool(viewingSchool)}
                    title="Click to view connected branches / campuses"
                    className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  >
                    🔗 {viewingSchool.branchCount || 0} {viewingSchool.branchCount === 1 ? 'Campus' : 'Campuses'} (View List ↗)
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Official Contact Email:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingSchool.email || '—'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Official Contact Phone:</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  <FormattedPhone value={viewingSchool.phone} schoolId={viewingSchool.id} />
                </div>
              </div>

              {viewingSchool.registrationNumber && (
                <div>
                  <span className="text-slate-400 font-medium">Registration No.:</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingSchool.registrationNumber}
                  </div>
                </div>
              )}

              {viewingSchool.educationBoard && (
                <div>
                  <span className="text-slate-400 font-medium">Education Board:</span>
                  <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingSchool.educationBoard}
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <span className="text-slate-400 font-medium">Location & Physical Address:</span>
                <div className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {[viewingSchool.address, viewingSchool.area, viewingSchool.city, viewingSchool.province, viewingSchool.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                  {viewingSchool.postalCode && <span className="text-slate-400 ml-1">({viewingSchool.postalCode})</span>}
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Audit Trail</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  Created By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingSchool.createdByUser?.name || 'System User'}</span>
                </div>
                <div>
                  Created At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingSchool.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  Updated By: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingSchool.updatedByUser?.name || 'System User'}</span>
                </div>
                <div>
                  Updated At: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(viewingSchool.updatedAt).toLocaleString()}</span>
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

      {/* Safe Delete Modal */}
      <AdminModal
        isOpen={isDeleteModalOpen && !!schoolToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="lg"
        title={`Delete School: ${schoolToDelete?.name || ''}`}
        subtitle="Verifying downstream dependencies and relationships."
      >
        {schoolToDelete && (
          <div className="space-y-4 text-xs">
            {isCheckingDeps ? (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <div className="animate-spin text-xl">⏳</div>
                <p>Checking database relationships and branches...</p>
              </div>
            ) : deleteDependencies && !deleteDependencies.canDelete ? (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⛔</span> Cannot Delete School Institution
                  </div>
                  <p className="text-[11px]">
                    This School has connected downstream records in the database.
                  </p>
                </div>

                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Blocking Dependencies:</div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                    {(deleteDependencies.reasons || []).map((reason, idx) => (
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
                    Are you sure you want to permanently delete <strong>{schoolToDelete.name}</strong> ({schoolToDelete.code})? No blocking dependencies were found.
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

      {/* Connected Units Popup Modal */}
      {connectedUnitsSchool && (
        <ConnectedUnitsModal
          isOpen={!!connectedUnitsSchool}
          onClose={() => setConnectedUnitsSchool(null)}
          parentEntityId={connectedUnitsSchool.id}
          parentEntityName={connectedUnitsSchool.name}
          parentEntityCode={connectedUnitsSchool.code}
          parentEntityType="SCHOOL"
          hierarchyNodeId={(connectedUnitsSchool as any).hierarchyNodeId}
          expectedCount={connectedUnitsSchool.branchCount}
          zIndex={120}
        />
      )}
    </div>
  );
}
