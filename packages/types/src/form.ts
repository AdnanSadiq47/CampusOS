/**
 * Form Builder & Declarative AST Schema Types
 */

export type FormVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

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
  condition: Record<string, unknown>; // AST Rule Condition
  expression?: string; // For CALCULATE (e.g. "total_marks = math + science")
}

export interface FormFieldControl {
  id: string;
  fieldCode: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  controlType: FormControlType;
  colSpan?: number; // 1 to 12 in Grid layout
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
  columns?: number; // Grid columns (e.g. 1, 2, 3, 4)
  controls: FormFieldControl[];
}

export interface FormTab {
  id: string;
  title: string;
  icon?: string;
  sections: FormSection[];
}

export interface FormSchemaAST {
  layout: 'single_page' | 'tabs' | 'stepper' | 'accordion';
  tabs: FormTab[];
}

export interface FormDefinition {
  id: string;
  organizationId: string;
  entityId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  currentVersion?: FormVersion | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormVersion {
  id: string;
  organizationId: string;
  formId: string;
  version: number;
  status: FormVersionStatus;
  schemaAst: FormSchemaAST;
  rules: FormRule[];
  publishedAt?: Date | null;
  publishedBy?: string | null;
  createdAt: Date;
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
