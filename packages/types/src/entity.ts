/**
 * Dynamic Entity Builder & Virtual ORM Type Definitions
 */

export type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'REFERENCE'
  | 'FILE'
  | 'JSON';

export interface SelectOption {
  label: string;
  value: string | number;
  color?: string;
}

export interface FieldValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex
  patternMessage?: string;
  customRuleExpression?: Record<string, unknown>; // AST Expression
}

export interface EntityDefinition {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  fields?: EntityField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityField {
  id: string;
  organizationId: string;
  entityId: string;
  code: string;
  name: string;
  fieldType: FieldType;
  isRequired: boolean;
  isUnique: boolean;
  isSearchable: boolean;
  defaultValue?: unknown;
  validationRules: FieldValidationRules;
  options: SelectOption[];
  referenceEntityId?: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface EntityRecord {
  id: string;
  organizationId: string;
  entityId: string;
  hierarchyNodeId: string;
  data: Record<string, unknown>;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntityDto {
  code: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface CreateEntityFieldDto {
  code: string;
  name: string;
  fieldType: FieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  defaultValue?: unknown;
  validationRules?: FieldValidationRules;
  options?: SelectOption[];
  referenceEntityId?: string;
  sortOrder?: number;
}

export interface QueryEntityRecordsDto {
  entityCode: string;
  hierarchyNodeId?: string;
  includeSubtree?: boolean;
  filter?: Record<string, unknown>;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
