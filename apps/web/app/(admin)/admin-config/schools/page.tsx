'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SchoolListItemDto, EligibleParentNodeDto, CreateSchoolDto, SchoolTypeListItemDto } from '@campus-os/types';
import { AdminConfigPageHeader, ORGANIZATION_SETUP_NAV } from '../../../../components/AdminConfigPageHeader';
import { SchoolBranchesDetailsModal } from '../../../../components/SchoolBranchesDetailsModal';

export default function SchoolsPage() {
  // State
  const [schools, setSchools] = useState<SchoolListItemDto[]>([]);
  const [parents, setParents] = useState<EligibleParentNodeDto[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<SchoolTypeListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [parentFilter, setParentFilter] = useState<string>('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedSchoolForBranchesModal, setSelectedSchoolForBranchesModal] = useState<SchoolListItemDto | null>(null);
  const [editingSchool, setEditingSchool] = useState<SchoolListItemDto | null>(null);
  const [viewingSchool, setViewingSchool] = useState<SchoolListItemDto | null>(null);
  const [selectedHeadOffice, setSelectedHeadOffice] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [formTab, setFormTab] = useState<'basic' | 'contact' | 'location' | 'affiliation'>('basic');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<CreateSchoolDto>({
    name: '',
    code: '',
    parentId: '',
    status: true,
    schoolType: 'K12',
    registrationNumber: '',
    educationBoard: '',
    principalName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    area: '',
    city: '',
    province: '',
    postalCode: '',
    website: '',
    customDomain: '',
    defaultLanguage: 'en',
    timezone: 'Asia/Karachi',
    currency: 'PKR',
    notes: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Seed default data if database is initialized locally
  const defaultParents: EligibleParentNodeDto[] = useMemo(
    () => [
      { id: 'parent-ho-1', name: 'Alpha Central Directorate & Head Office', code: 'HO_MAIN', type: 'Head Office', path: 'root.ho_main' },
      { id: 'parent-ho-2', name: 'Southern Zonal Executive Office', code: 'HO_SOUTH', type: 'Head Office', path: 'root.ho_south' },
      { id: 'parent-south-1', name: 'Southern Regional Directorate', code: 'REGION_SOUTH', type: 'Region', path: 'root.ho_main.south' },
      { id: 'parent-north-1', name: 'Northern Regional Directorate', code: 'REGION_NORTH', type: 'Region', path: 'root.ho_main.north' },
      { id: 'parent-root', name: 'Alpha Organization Root (Direct)', code: 'ORG_ROOT', type: 'Organization Root', path: 'root' },
    ],
    []
  );

  const initialSeedSchools: SchoolListItemDto[] = useMemo(
    () => [
      {
        id: 'sch-1',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-sch-1',
        code: 'SCH_KHI_01',
        name: 'Beacon Horizon Public School',
        parentId: 'parent-south-1',
        parentName: 'Southern Regional Directorate',
        parentType: 'Region',
        schoolType: 'K12',
        registrationNumber: 'REG-KHI-2024-889',
        educationBoard: 'BISE Karachi / Cambridge',
        principalName: 'Dr. Tariq Mehmood',
        email: 'principal.horizon@beacon.edu.pk',
        phone: '+92 21 34567890',
        city: 'Karachi',
        branchCount: 3,
        isActive: true,
        createdAt: new Date('2026-01-15T09:00:00Z'),
        updatedAt: new Date('2026-01-15T09:00:00Z'),
      },
      {
        id: 'sch-2',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-sch-2',
        code: 'SCH_LHR_02',
        name: 'Apex Crescent Grammar School',
        parentId: 'parent-north-1',
        parentName: 'Northern Regional Directorate',
        parentType: 'Region',
        schoolType: 'Secondary',
        registrationNumber: 'REG-LHR-2023-412',
        educationBoard: 'BISE Lahore',
        principalName: 'Prof. Saima Khan',
        email: 'saima.khan@apexgrammar.edu.pk',
        phone: '+92 42 37890123',
        city: 'Lahore',
        branchCount: 2,
        isActive: true,
        createdAt: new Date('2026-02-10T11:30:00Z'),
        updatedAt: new Date('2026-02-10T11:30:00Z'),
      },
      {
        id: 'sch-3',
        organizationId: '11111111-1111-1111-1111-111111111111',
        hierarchyNodeId: 'node-sch-3',
        code: 'SCH_ISB_03',
        name: 'Capital Model Higher Secondary School',
        parentId: 'parent-ho-1',
        parentName: 'Head Office & Directorate',
        parentType: 'Head Office',
        schoolType: 'Higher Secondary',
        registrationNumber: 'REG-ISB-2025-104',
        educationBoard: 'Federal Board (FBISE)',
        principalName: 'Mr. Asadullah Qureshi',
        email: 'admin.capital@cms.edu.pk',
        phone: '+92 51 2233445',
        city: 'Islamabad',
        branchCount: 1,
        isActive: false,
        createdAt: new Date('2026-03-01T14:15:00Z'),
        updatedAt: new Date('2026-03-01T14:15:00Z'),
      },
    ],
    []
  );

  const defaultSchoolTypes: SchoolTypeListItemDto[] = useMemo(
    () => [
      { id: 'st-1', organizationId: '11111111-1111-1111-1111-111111111111', code: 'SCH', name: 'School', description: 'General school institution', schoolCount: 12, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'st-2', organizationId: '11111111-1111-1111-1111-111111111111', code: 'COL', name: 'College', description: 'College-level institution', schoolCount: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'st-3', organizationId: '11111111-1111-1111-1111-111111111111', code: 'UNI', name: 'University', description: 'University institution', schoolCount: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'st-4', organizationId: '11111111-1111-1111-1111-111111111111', code: 'ACA', name: 'Academy', description: 'Academy / training institution', schoolCount: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'st-5', organizationId: '11111111-1111-1111-1111-111111111111', code: 'K12', name: 'K-12 Comprehensive', description: 'Full K-12 educational institution', schoolCount: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'st-6', organizationId: '11111111-1111-1111-1111-111111111111', code: 'Secondary', name: 'Secondary / Matric', description: 'Secondary grade school', schoolCount: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'st-7', organizationId: '11111111-1111-1111-1111-111111111111', code: 'Higher Secondary', name: 'Higher Secondary', description: 'Intermediate institution', schoolCount: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ],
    []
  );

  // Fetch schools, parents and school types master
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // In browser preview, use initialized seed list, parents, and school types
      setParents(defaultParents);
      setSchoolTypes(defaultSchoolTypes);
      setSchools((prev) => (prev.length > 0 ? prev : initialSeedSchools));
    } catch {
      showToast('error', 'Failed to load school records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        school.name.toLowerCase().includes(q) ||
        school.code.toLowerCase().includes(q) ||
        (school.city && school.city.toLowerCase().includes(q)) ||
        (school.principalName && school.principalName.toLowerCase().includes(q)) ||
        (school.email && school.email.toLowerCase().includes(q));

      // Status
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && school.isActive) ||
        (statusFilter === 'INACTIVE' && !school.isActive);

      // Parent
      const matchesParent = parentFilter === 'ALL' || school.parentId === parentFilter;

      return matchesSearch && matchesStatus && matchesParent;
    });
  }, [schools, searchQuery, statusFilter, parentFilter]);

  // Categorized Offices for Business-Friendly Hierarchy Selection
  const headOffices = useMemo(
    () => parents.filter((p) => p.type === 'Head Office' || p.type === 'HEAD_OFFICE'),
    [parents]
  );

  const regionalOffices = useMemo(
    () => parents.filter((p) => p.type === 'Region' || p.type === 'REGION'),
    [parents]
  );

  const availableRegions = useMemo(() => {
    if (!selectedHeadOffice) return regionalOffices;
    const selectedHO = headOffices.find((h) => h.id === selectedHeadOffice);
    if (!selectedHO) return regionalOffices;
    return regionalOffices.filter((r) => r.path.includes(selectedHO.code.toLowerCase()));
  }, [selectedHeadOffice, headOffices, regionalOffices]);

  // Handle Form Open
  const handleOpenAddModal = () => {
    setEditingSchool(null);
    setSelectedHeadOffice('');
    setSelectedRegion('');
    const defaultRootId = parents.find((p) => p.type === 'Organization Root')?.id || parents[0]?.id || '';
    setFormData({
      name: '',
      code: '',
      parentId: defaultRootId,
      status: true,
      schoolType: 'K12',
      registrationNumber: '',
      educationBoard: '',
      principalName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      area: '',
      city: '',
      province: '',
      postalCode: '',
      website: '',
      customDomain: '',
      defaultLanguage: 'en',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      notes: '',
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (school: SchoolListItemDto) => {
    setEditingSchool(school);
    const parent = parents.find((p) => p.id === school.parentId);
    if (parent?.type === 'Region') {
      setSelectedRegion(parent.id);
      const ho = headOffices.find((h) => parent.path.includes(h.code.toLowerCase()));
      setSelectedHeadOffice(ho?.id || '');
    } else if (parent?.type === 'Head Office') {
      setSelectedHeadOffice(parent.id);
      setSelectedRegion('');
    } else {
      setSelectedHeadOffice('');
      setSelectedRegion('');
    }

    setFormData({
      name: school.name,
      code: school.code,
      parentId: school.parentId,
      status: school.isActive,
      schoolType: school.schoolType ?? 'K12',
      registrationNumber: school.registrationNumber ?? '',
      educationBoard: school.educationBoard ?? '',
      principalName: school.principalName ?? '',
      email: school.email ?? '',
      phone: school.phone ?? '',
      alternatePhone: '',
      address: '',
      area: '',
      city: school.city ?? '',
      province: '',
      postalCode: '',
      website: '',
      customDomain: '',
      defaultLanguage: 'en',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      notes: '',
    });
    setFormErrors({});
    setFormTab('basic');
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'School Name is required';
    if (!formData.code.trim()) errors.code = 'School Code is required';

    // Duplicate code check
    const duplicate = schools.find(
      (s) => s.code.toUpperCase() === formData.code.trim().toUpperCase() && (!editingSchool || s.id !== editingSchool.id)
    );
    if (duplicate) {
      errors.code = `School Code '${formData.code.trim().toUpperCase()}' is already taken in this organization`;
    }

    // Resolve parent ID according to selection (Region > Head Office > Root/Default)
    const effectiveParentId =
      selectedRegion ||
      selectedHeadOffice ||
      parents.find((p) => p.type === 'Organization Root')?.id ||
      parents[0]?.id ||
      '';
    formData.parentId = effectiveParentId;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save
  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('error', 'Please correct the validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedParent = parents.find((p) => p.id === formData.parentId);
      const cleanCode = formData.code.trim().toUpperCase();
      const cleanName = formData.name.trim();

      if (editingSchool) {
        // Update
        const updatedList = schools.map((s) => {
          if (s.id === editingSchool.id) {
            return {
              ...s,
              name: cleanName,
              parentId: formData.parentId,
              parentName: selectedParent?.name ?? s.parentName,
              parentType: selectedParent?.type ?? s.parentType,
              schoolType: formData.schoolType,
              registrationNumber: formData.registrationNumber,
              educationBoard: formData.educationBoard,
              principalName: formData.principalName,
              email: formData.email,
              phone: formData.phone,
              city: formData.city,
              isActive: formData.status ?? true,
              updatedAt: new Date(),
            };
          }
          return s;
        });
        setSchools(updatedList);
        showToast('success', `School '${cleanName}' updated successfully`);
      } else {
        // Create new
        const newSchool: SchoolListItemDto = {
          id: `sch-${Date.now()}`,
          organizationId: '11111111-1111-1111-1111-111111111111',
          hierarchyNodeId: `node-sch-${Date.now()}`,
          code: cleanCode,
          name: cleanName,
          parentId: formData.parentId,
          parentName: selectedParent?.name ?? 'Head Office',
          parentType: selectedParent?.type ?? 'Parent Node',
          schoolType: formData.schoolType,
          registrationNumber: formData.registrationNumber,
          educationBoard: formData.educationBoard,
          principalName: formData.principalName,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          branchCount: 0,
          isActive: formData.status ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setSchools([newSchool, ...schools]);
        showToast('success', `School '${cleanName}' [${cleanCode}] created successfully`);
      }

      setIsModalOpen(false);
    } catch {
      showToast('error', 'Failed to save school');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = (school: SchoolListItemDto) => {
    const nextStatus = !school.isActive;
    const updated = schools.map((s) => (s.id === school.id ? { ...s, isActive: nextStatus, updatedAt: new Date() } : s));
    setSchools(updated);
    showToast('success', `School '${school.name}' is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`);
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
        description="Manage educational institutions, campus affiliations, and hierarchy nodes within your network."
        categoryNav={ORGANIZATION_SETUP_NAV}
        actionButtonText="Add School"
        onAction={handleOpenAddModal}
      />

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Schools</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{schools.length}</div>
          </div>
          <span className="text-2xl">🏫</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Schools</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {schools.filter((s) => s.isActive).length}
            </div>
          </div>
          <span className="text-2xl">🟢</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Branches Managed</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {schools.reduce((acc, s) => acc + s.branchCount, 0)}
            </div>
          </div>
          <span className="text-2xl">🏢</span>
        </div>
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

        <div className="w-full md:w-auto flex items-center gap-3">
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

          {/* Office / Region Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Office / Region:</span>
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">All Offices & Regions</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Schools Table / Empty / Loading State */}
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
                {searchQuery || statusFilter !== 'ALL' || parentFilter !== 'ALL'
                  ? 'No school records match the selected filters. Try clearing your search filters.'
                  : 'Get started by creating your first school in the organization.'}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'ALL' || parentFilter !== 'ALL') ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setParentFilter('ALL');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700"
              >
                + Add First School
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">School Code</th>
                  <th className="py-3 px-4">School Name & Type</th>
                  <th className="py-3 px-4">Head Office / Regional Office</th>
                  <th className="py-3 px-4">Branches</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSchools.map((school) => (
                  <tr
                    key={school.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {school.code}
                    </td>

                    {/* Name & Type */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{school.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {school.schoolType || 'K12'}
                        </span>
                        {school.city && (
                          <span className="text-[11px] text-slate-400">📍 {school.city}</span>
                        )}
                      </div>
                    </td>

                    {/* Parent Context */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{school.parentName}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{school.parentType}</div>
                    </td>

                    {/* Branches */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedSchoolForBranchesModal(school)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition-all shadow-xs"
                        title="View campuses belonging to this school"
                      >
                        <span>🏢</span>
                        <span>{school.branchCount} {school.branchCount === 1 ? 'Branch' : 'Branches'}</span>
                        <span className="text-[10px] text-blue-400">›</span>
                      </button>
                    </td>

                    {/* Primary Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {school.principalName || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {school.email || school.phone || 'No contact specified'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(school)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          school.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${school.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{school.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setViewingSchool(school);
                            setIsViewModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          title="View full school metadata"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(school)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                          title="Edit school details"
                        >
                          Edit
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

      {/* 5. ADD / EDIT SCHOOL MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingSchool ? `Edit School: ${editingSchool.name}` : 'Add New School'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure school attributes, location, and attach to authorized organizational hierarchy parent.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFormTab('basic')}
                  className={`py-3 border-b-2 transition-colors ${
                    formTab === 'basic'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  1. Basic Details *
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('contact')}
                  className={`py-3 border-b-2 transition-colors ${
                    formTab === 'contact'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  2. Contact & Admin
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('location')}
                  className={`py-3 border-b-2 transition-colors ${
                    formTab === 'location'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  3. Location & Address
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('affiliation')}
                  className={`py-3 border-b-2 transition-colors ${
                    formTab === 'affiliation'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  4. Affiliation & Portal
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSchool} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
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
                        value={formData.name}
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
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 font-mono font-semibold focus:outline-none uppercase ${
                          editingSchool ? 'opacity-60 cursor-not-allowed' : ''
                        } ${formErrors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                      />
                      {formErrors.code && <p className="text-[10px] text-rose-500 mt-1">{formErrors.code}</p>}
                    </div>
                  </div>

                  {/* SECTION: HEAD OFFICE & REGIONAL OFFICE */}
                  <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        Head Office / Regional Office
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Optional administrative reporting</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Head Office
                        </label>
                        <select
                          value={selectedHeadOffice}
                          onChange={(e) => {
                            const newHO = e.target.value;
                            setSelectedHeadOffice(newHO);
                            if (newHO && selectedRegion) {
                              const hoObj = headOffices.find((h) => h.id === newHO);
                              const regObj = regionalOffices.find((r) => r.id === selectedRegion);
                              if (hoObj && regObj && !regObj.path.includes(hoObj.code.toLowerCase())) {
                                setSelectedRegion('');
                              }
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="">[ None / Direct School ]</option>
                          {headOffices.map((ho) => (
                            <option key={ho.id} value={ho.id}>
                              {ho.name} ({ho.code})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Select if this school operates under a central Head Office.
                        </p>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Regional Office
                        </label>
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="">[ None / Direct School ]</option>
                          {availableRegions.map((reg) => (
                            <option key={reg.id} value={reg.id}>
                              {reg.name} ({reg.code})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Select if this school reports to a Regional Office.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Level / Type (Configured Master)
                    </label>
                    <select
                      value={formData.schoolType}
                      onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium focus:outline-none cursor-pointer"
                    >
                      {schoolTypes
                        .filter((st) => st.isActive || st.code === formData.schoolType || st.name === formData.schoolType)
                        .map((st) => (
                          <option key={st.id} value={st.code}>
                            {st.name} ({st.code}) {!st.isActive ? '— [Inactive]' : ''}
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Loaded from Administration Configuration → School Types master.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Active Status:</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: !formData.status })}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        formData.status
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                      }`}
                    >
                      {formData.status ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACT & ADMIN */}
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
                        value={formData.principalName}
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
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Official Telephone
                      </label>
                      <input
                        type="tel"
                        placeholder="+92 21 34567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Alternate / Mobile Helpline
                      </label>
                      <input
                        type="tel"
                        placeholder="+92 300 1234567"
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.school.edu.pk"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: LOCATION */}
              {formTab === 'location' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Street Address
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Plot 42, Block 6, PECHS"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Area / Sector
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gulshan-e-Iqbal / DHA"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Karachi / Lahore / Islamabad"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Province</label>
                      <input
                        type="text"
                        placeholder="e.g. Sindh / Punjab / KPK / ICT"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 75300"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AFFILIATION & PORTAL */}
              {formTab === 'affiliation' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Registration / Affiliation Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. REG-KHI-2024-889"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Education Board / Authority
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BISE Karachi / Cambridge"
                        value={formData.educationBoard}
                        onChange={(e) => setFormData({ ...formData, educationBoard: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Custom Subdomain / Portal URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. horizon.campus.edu.pk"
                        value={formData.customDomain}
                        onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none cursor-pointer"
                      >
                        <option value="PKR">Pakistani Rupee (PKR)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="AED">UAE Dirham (AED)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Administrative Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Internal remarks, establishment year, or special guidelines..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {formTab === 'basic' ? 'Step 1 of 4' : formTab === 'contact' ? 'Step 2 of 4' : formTab === 'location' ? 'Step 3 of 4' : 'Step 4 of 4'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingSchool ? 'Save Changes' : 'Create School'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. VIEW SCHOOL DETAILS MODAL */}
      {isViewModalOpen && viewingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {viewingSchool.code}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{viewingSchool.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                    {viewingSchool.schoolType || 'K12'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      viewingSchool.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {viewingSchool.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-medium">Head Office / Regional Office:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingSchool.parentName} ({viewingSchool.parentType})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-medium">Affiliation Board:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingSchool.educationBoard || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-medium">Registration No:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingSchool.registrationNumber || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-medium">Principal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingSchool.principalName || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-medium">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSchool.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-medium">Phone:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSchool.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-medium">Child Branches:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {viewingSchool.branchCount} Active {viewingSchool.branchCount === 1 ? 'Branch' : 'Branches'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Branches / Campuses Details Popup */}
      <SchoolBranchesDetailsModal
        isOpen={!!selectedSchoolForBranchesModal}
        onClose={() => setSelectedSchoolForBranchesModal(null)}
        school={selectedSchoolForBranchesModal}
      />
    </div>
  );
}
