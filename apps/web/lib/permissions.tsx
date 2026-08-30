'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { HeadOfficePermissions, RegionalOfficePermissions, SchoolPermissions } from '@campus-os/types';

export interface PermissionsContextValue {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  setSimulatedPermissions: (perms: string[] | null) => void;
  // Specific Head Office flags
  canCreateHeadOffice: boolean;
  canViewHeadOffice: boolean;
  canEditHeadOffice: boolean;
  canChangeStatusHeadOffice: boolean;
  canDeleteHeadOffice: boolean;
  // Specific Regional Office flags
  canCreateRegion: boolean;
  canViewRegion: boolean;
  canEditRegion: boolean;
  canChangeStatusRegion: boolean;
  canDeleteRegion: boolean;
  // Specific School flags
  canCreateSchool: boolean;
  canViewSchool: boolean;
  canEditSchool: boolean;
  canChangeStatusSchool: boolean;
  canDeleteSchool: boolean;
  // Design System Internal Administration
  canViewDesignSystem: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export const DESIGN_SYSTEM_VIEW_PERMISSION = 'DESIGN_SYSTEM_VIEW';

// Canonical Administrator Explicit Permissions (Derived from Canonical IAM Role for dev admin session)
export const CANONICAL_ADMIN_PERMISSIONS: string[] = [
  HeadOfficePermissions.CREATE,
  HeadOfficePermissions.VIEW,
  HeadOfficePermissions.EDIT,
  HeadOfficePermissions.STATUS_CHANGE,
  HeadOfficePermissions.DELETE,
  RegionalOfficePermissions.CREATE,
  RegionalOfficePermissions.VIEW,
  RegionalOfficePermissions.EDIT,
  RegionalOfficePermissions.STATUS_CHANGE,
  RegionalOfficePermissions.DELETE,
  SchoolPermissions.CREATE,
  SchoolPermissions.VIEW,
  SchoolPermissions.EDIT,
  SchoolPermissions.STATUS_CHANGE,
  SchoolPermissions.DELETE,
  DESIGN_SYSTEM_VIEW_PERMISSION,
];

// Fail-closed default value when unmounted or unresolved
const FAIL_CLOSED_PERMISSIONS_VALUE: PermissionsContextValue = {
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  setSimulatedPermissions: () => {},
  canCreateHeadOffice: false,
  canViewHeadOffice: false,
  canEditHeadOffice: false,
  canChangeStatusHeadOffice: false,
  canDeleteHeadOffice: false,
  canCreateRegion: false,
  canViewRegion: false,
  canEditRegion: false,
  canChangeStatusRegion: false,
  canDeleteRegion: false,
  canCreateSchool: false,
  canViewSchool: false,
  canEditSchool: false,
  canChangeStatusSchool: false,
  canDeleteSchool: false,
  canViewDesignSystem: false,
};

export function PermissionsProvider({
  children,
  initialPermissions,
}: {
  children: React.ReactNode;
  initialPermissions?: string[];
}) {
  const [simulatedPermissions, setSimulatedPermissions] = useState<string[] | null>(null);

  const effectivePermissions = useMemo(() => {
    // If simulated permissions are active, use them; otherwise use initialPermissions or canonical admin IAM permissions
    const raw = simulatedPermissions ?? initialPermissions ?? CANONICAL_ADMIN_PERMISSIONS;
    return raw.map((p) => p.trim().toUpperCase()).filter(Boolean);
  }, [simulatedPermissions, initialPermissions]);

  const hasPermission = (permission: string): boolean => {
    if (!permission || effectivePermissions.length === 0) return false;
    // Strict exact key matching — fail closed, NO wildcard '*' or 'ALL'
    return effectivePermissions.includes(permission.trim().toUpperCase());
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0 || effectivePermissions.length === 0) return false;
    return permissions.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0 || effectivePermissions.length === 0) return false;
    return permissions.every((p) => hasPermission(p));
  };

  const value: PermissionsContextValue = {
    permissions: effectivePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setSimulatedPermissions,
    canCreateHeadOffice: hasPermission(HeadOfficePermissions.CREATE),
    canViewHeadOffice: hasPermission(HeadOfficePermissions.VIEW),
    canEditHeadOffice: hasPermission(HeadOfficePermissions.EDIT),
    canChangeStatusHeadOffice: hasPermission(HeadOfficePermissions.STATUS_CHANGE),
    canDeleteHeadOffice: hasPermission(HeadOfficePermissions.DELETE),
    canCreateRegion: hasPermission(RegionalOfficePermissions.CREATE),
    canViewRegion: hasPermission(RegionalOfficePermissions.VIEW),
    canEditRegion: hasPermission(RegionalOfficePermissions.EDIT),
    canChangeStatusRegion: hasPermission(RegionalOfficePermissions.STATUS_CHANGE),
    canDeleteRegion: hasPermission(RegionalOfficePermissions.DELETE),
    canCreateSchool: hasPermission(SchoolPermissions.CREATE),
    canViewSchool: hasPermission(SchoolPermissions.VIEW),
    canEditSchool: hasPermission(SchoolPermissions.EDIT),
    canChangeStatusSchool: hasPermission(SchoolPermissions.STATUS_CHANGE),
    canDeleteSchool: hasPermission(SchoolPermissions.DELETE),
    canViewDesignSystem: hasPermission(DESIGN_SYSTEM_VIEW_PERMISSION),
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__campusOsSetPermissions = setSimulatedPermissions;
    }
  }, []);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext);
  if (!context) {
    // Fail closed if provider is not mounted in isolation or unresolved
    return FAIL_CLOSED_PERMISSIONS_VALUE;
  }
  return context;
}

