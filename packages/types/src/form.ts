/**
 * Form Builder & Declarative AST Schema Types
 * CampusOS Dynamic Form Builder Platform Foundation
 */

import { ConfigOwnerType, ConfigScopeType, ConfigSourceOrigin } from './academic.js';

export type FormPurpose = 'PRE_REGISTRATION' | 'ADMISSION' | 'CUSTOM';
export type FormVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FieldOrigin = 'CANONICAL' | 'STANDARD' | 'CUSTOM';

export type FieldCategory =
  | 'STUDENT_BASIC'
  | 'IDENTITY'
  | 'ADMISSION_ACADEMIC'
  | 'FATHER_INFO'
  | 'MOTHER_INFO'
  | 'GUARDIAN_INFO'
  | 'CONTACT_INFO'
  | 'CURRENT_ADDRESS'
  | 'PERMANENT_ADDRESS'
  | 'PREVIOUS_EDUCATION'
  | 'SIBLINGS'
  | 'MEDICAL_HEALTH'
  | 'TRANSPORT'
  | 'HOSTEL'
  | 'DOCUMENTS'
  | 'CONSENT_DECLARATION'
  | 'OTHER';

export type MasterEntityBinding =
  | 'COUNTRY'
  | 'STATE'
  | 'CITY'
  | 'AREA'
  | 'POSTAL_CODE'
  | 'BOARD'
  | 'ACADEMIC_LEVEL'
  | 'CLASS'
  | 'ACADEMIC_YEAR'
  | 'CAMPUS';

export type FieldDataType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'DECIMAL'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'CHECKBOX'
  | 'CHECKBOX_GROUP'
  | 'RADIO'
  | 'DROPDOWN'
  | 'SEARCHABLE_DROPDOWN'
  | 'MULTI_SELECT'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'FILE_UPLOAD'
  | 'IMAGE_UPLOAD';

export type FormControlWidth = 'FULL' | 'HALF' | 'QUARTER' | 'THREE_QUARTERS' | '25%' | '50%' | '75%' | '100%';

export interface FormFieldValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  emailFormat?: boolean;
  phoneFormat?: boolean;
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  regexPattern?: string;
  customErrorMessage?: string;
}

export type ConditionalOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY'
  | 'GREATER_THAN'
  | 'LESS_THAN';

export type ConditionalAction = 'SHOW' | 'HIDE' | 'MAKE_REQUIRED' | 'MAKE_OPTIONAL';

export interface FormConditionalRule {
  id: string;
  sourceFieldKey: string;
  operator: ConditionalOperator;
  value?: any;
  action: ConditionalAction;
  targetFieldKey?: string;
  targetSectionId?: string;
}

export interface FormFieldInstance {
  instanceId: string;
  fieldDefinitionId: string;
  canonicalKey?: string; // Preserves stable concept mapping across Pre-Reg and Admission
  customLabel?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  width: FormControlWidth;
  isRequired: boolean;
  isHidden?: boolean;
  isReadOnly?: boolean;
  sortOrder: number;
  validation?: FormFieldValidationRules;
  options?: Array<{ label: string; value: string }>;
  masterBinding?: MasterEntityBinding;
  props?: Record<string, any>;
}

export interface FormRepeatableGroupConfig {
  isRepeatable: boolean;
  addButtonText?: string;
  minEntries?: number;
  maxEntries?: number;
}

export interface FormSectionInstance {
  id: string;
  title: string;
  description?: string;
  showSectionHeading: boolean; // Optional heading display
  showDescription?: boolean;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  columns?: number; // 1 or 2 columns
  sortOrder: number;
  repeatableConfig?: FormRepeatableGroupConfig;
  fields: FormFieldInstance[];
}

export interface FormSchemaPayload {
  sections: FormSectionInstance[];
  rules: FormConditionalRule[];
  settings: {
    submitButtonText?: string;
    saveDraftEnabled?: boolean;
    headerBannerUrl?: string;
    allowMultipleSubmissions?: boolean;
    dobClassEligibilityEnabled?: boolean;
  };
}

export interface FieldDefinitionDto {
  id: string;
  organizationId?: string | null;
  code: string;
  canonicalKey?: string | null;
  name: string;
  description?: string | null;
  category: FieldCategory;
  origin: FieldOrigin;
  dataType: FieldDataType;
  masterBinding?: MasterEntityBinding | null;
  defaultLabel: string;
  defaultPlaceholder?: string | null;
  defaultHelpText?: string | null;
  defaultOptions?: Array<{ label: string; value: string }>;
  defaultValidation?: FormFieldValidationRules;
  isSystemProtected: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormVersionDto {
  id: string;
  organizationId: string;
  formDefinitionId: string;
  versionNumber: number;
  status: FormVersionStatus;
  schemaPayload: FormSchemaPayload;
  publishedAt?: Date | null;
  publishedByUserId?: string | null;
  changelogSummary?: string | null;
  createdAt: Date;
}

export interface FormDefinitionListItemDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  formPurpose: FormPurpose;
  description?: string | null;
  ownerType: ConfigOwnerType;
  ownerId?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  sourceOrigin: ConfigSourceOrigin;
  isInherited: boolean;
  canEdit: boolean;
  canToggleStatus: boolean;
  canAssign: boolean;
  currentVersionNumber: number;
  currentVersionStatus: FormVersionStatus;
  publishedVersionId?: string | null;
  publishedVersionNumber?: number | null;
  totalVersionsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormTemplateDto {
  id: string;
  name: string;
  code: string;
  formPurpose: FormPurpose;
  category: string;
  icon: string;
  description: string;
  isSystem: boolean;
  schemaPayload: FormSchemaPayload;
}

export interface ResolvedFormDto {
  formDefinitionId: string;
  formName: string;
  formPurpose: FormPurpose;
  versionId: string;
  versionNumber: number;
  resolvedCampusId: string;
  sourceOrigin: ConfigSourceOrigin;
  ownerType: ConfigOwnerType;
  schemaPayload: FormSchemaPayload;
}

export interface CreateFormDefinitionDto {
  name: string;
  code?: string;
  formPurpose: FormPurpose;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  templateId?: string;
  copyFromFormId?: string;
  initialSchema?: FormSchemaPayload;
}

export interface UpdateFormDefinitionDto {
  name?: string;
  code?: string;
  description?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface SaveFormDraftDto {
  schemaPayload: FormSchemaPayload;
  changelogSummary?: string;
}

export interface PublishFormVersionDto {
  changelogSummary?: string;
}

export interface CreateCustomFieldDto {
  name: string;
  code?: string;
  category: FieldCategory;
  dataType: FieldDataType;
  defaultLabel: string;
  defaultPlaceholder?: string;
  defaultHelpText?: string;
  defaultOptions?: Array<{ label: string; value: string }>;
  defaultValidation?: FormFieldValidationRules;
}

// ── Legacy AST Schema & DTO Compatibility ───────────────────────────
export type FormControlType =
  | 'text_input'
  | 'number_input'
  | 'decimal_input'
  | 'textarea'
  | 'switch'
  | 'date_picker'
  | 'datetime_picker'
  | 'select'
  | 'multi_select'
  | 'radio_group'
  | 'checkbox_group'
  | 'file_upload'
  | 'entity_reference'
  | 'custom_component';

export type FormRuleType = 'SHOW_IF' | 'HIDE_IF' | 'REQUIRED_IF' | 'DISABLE_IF' | 'CALCULATE';

export interface FormRule {
  id: string;
  type: FormRuleType;
  targetFieldCode: string;
  condition: Record<string, unknown>;
  expression?: string;
}

export interface FormFieldControl {
  id: string;
  fieldCode: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  controlType: FormControlType;
  colSpan?: number;
  isReadOnly?: boolean;
  hidden?: boolean;
  props?: Record<string, unknown>;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  columns?: number;
  controls: FormFieldControl[];
}

export interface FormTab {
  id: string;
  title: string;
  icon?: string;
  sections: FormSection[];
}

export interface FormSchemaAST {
  layout: 'single_page' | 'multi_tab' | 'wizard';
  tabs: FormTab[];
}

export interface CreateFormDto {
  entityId: string;
  code: string;
  name: string;
  description?: string;
  initialSchemaAst?: FormSchemaAST;
}

export interface SaveFormVersionDto {
  schemaAst: FormSchemaAST;
  rules?: FormRule[];
}
