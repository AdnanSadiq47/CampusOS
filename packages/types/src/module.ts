export interface NavigationMenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  badge?: string;
  order: number;
  requiredPermission?: {
    entity: string;
    action: string;
  };
  children?: NavigationMenuItem[];
}

export interface ModuleManifest {
  code: string;
  name: string;
  version: string;
  description: string;
  category: 'ACADEMIC' | 'FINANCIAL' | 'ADMINISTRATIVE' | 'HR' | 'CUSTOM';
  dependencies?: string[];
  navigationItems?: NavigationMenuItem[];
}
