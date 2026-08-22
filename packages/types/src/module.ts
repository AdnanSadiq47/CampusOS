/**
 * Pluggable Module Architecture & Manifest Specification
 */

import { CreateEntityDto, CreateEntityFieldDto } from './entity.js';
import { CreateFormDto } from './form.js';
import { CreateWorkflowDto } from './workflow.js';
import { CreateNavigationItemDto } from './navigation.js';

export interface ModuleDeclaration {
  code: string;
  name: string;
  version: string;
  description: string;
  category: 'ACADEMIC' | 'FINANCIAL' | 'ADMINISTRATIVE' | 'HR' | 'CUSTOM';
  dependencies?: string[];
  entities?: Array<{
    definition: CreateEntityDto;
    fields: CreateEntityFieldDto[];
  }>;
  defaultForms?: CreateFormDto[];
  defaultWorkflows?: CreateWorkflowDto[];
  navigationItems?: CreateNavigationItemDto[];
}

export interface OrganizationModule {
  id: string;
  organizationId: string;
  moduleCode: string;
  isEnabled: boolean;
  settings: Record<string, unknown>;
  activatedAt?: Date | null;
  activatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToggleModuleDto {
  moduleCode: string;
  isEnabled: boolean;
  settings?: Record<string, unknown>;
}
