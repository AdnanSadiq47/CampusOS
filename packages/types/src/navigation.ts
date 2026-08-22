/**
 * Dynamic Navigation Menu Type Definitions
 */

export interface NavigationMenu {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  isActive: boolean;
  items?: NavigationItem[];
  createdAt: Date;
}

export interface NavigationItem {
  id: string;
  organizationId: string;
  menuId: string;
  parentId?: string | null;
  label: string;
  icon?: string | null;
  routePath: string;
  requiredModule?: string | null;
  requiredPermissions: string[]; // E.g. ["academic:course:read"]
  sortOrder: number;
  isActive: boolean;
  children?: NavigationItem[];
  createdAt: Date;
}

export interface CreateNavigationMenuDto {
  code: string;
  name: string;
}

export interface CreateNavigationItemDto {
  parentId?: string;
  label: string;
  icon?: string;
  routePath: string;
  requiredModule?: string;
  requiredPermissions?: string[];
  sortOrder?: number;
}

export interface ReorderNavigationItemsDto {
  items: Array<{
    id: string;
    parentId?: string | null;
    sortOrder: number;
  }>;
}
