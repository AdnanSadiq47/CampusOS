export type ConfigScopeType = 'ALL_CAMPUSES' | 'SELECTED_CAMPUSES' | 'LOCAL_SCOPE';
export type ConfigOwnerType = 'PLATFORM' | 'HEAD_OFFICE' | 'REGION' | 'SCHOOL' | 'CAMPUS';
export type ConfigSourceOrigin = 'INHERITED' | 'LOCAL' | 'PLATFORM_DEFAULT';
export type VisibilityPolicy = 'FULL_DETAIL' | 'SUMMARY_ONLY' | 'HIDDEN';

export interface EffectiveGovernanceMetadata {
  ownerType: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  sourceOrigin: ConfigSourceOrigin;
  isInherited: boolean;
  canEdit: boolean;
  canToggleStatus: boolean;
  canAssign: boolean;
}

export interface EffectiveConfigQueryDto {
  campusId?: string;
  includeInactive?: boolean;
  searchQuery?: string;
  ownerType?: ConfigOwnerType;
  sourceOrigin?: ConfigSourceOrigin;
}

// ── 1. ACADEMIC YEARS ────────────────────────────────────────────────────────
export interface CreateAcademicYearDto {
  name: string;
  code: string;
  startDate: string; // ISO date string 'YYYY-MM-DD'
  endDate: string; // ISO date string 'YYYY-MM-DD'
  isCurrent?: boolean;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface UpdateAcademicYearDto {
  name?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface AcademicYearListItemDto extends Partial<EffectiveGovernanceMetadata> {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  sortOrder: number;
  description?: string | null;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  sourceOrigin?: ConfigSourceOrigin;
  isInherited?: boolean;
  canEdit?: boolean;
  canToggleStatus?: boolean;
  canAssign?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 2. BOARDS ─────────────────────────────────────────────────────────────────
export interface CreateBoardDto {
  name: string;
  shortName: string;
  code?: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface UpdateBoardDto {
  name?: string;
  shortName?: string;
  code?: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface BoardListItemDto extends Partial<EffectiveGovernanceMetadata> {
  id: string;
  organizationId: string;
  name: string;
  shortName: string;
  code?: string | null;
  sortOrder: number;
  description?: string | null;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  sourceOrigin?: ConfigSourceOrigin;
  isInherited?: boolean;
  canEdit?: boolean;
  canToggleStatus?: boolean;
  canAssign?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 3. ACADEMIC LEVELS / STAGES ───────────────────────────────────────────────
export interface CreateAcademicLevelDto {
  name: string;
  shortName?: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface UpdateAcademicLevelDto {
  name?: string;
  shortName?: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface AcademicLevelListItemDto extends Partial<EffectiveGovernanceMetadata> {
  id: string;
  organizationId: string;
  name: string;
  shortName?: string | null;
  sortOrder: number;
  description?: string | null;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  classCount?: number;
  sourceOrigin?: ConfigSourceOrigin;
  isInherited?: boolean;
  canEdit?: boolean;
  canToggleStatus?: boolean;
  canAssign?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 4. SUBJECTS ───────────────────────────────────────────────────────────────
export type SubjectType = 'Theory' | 'Practical' | 'Theory + Practical' | 'Activity';
export type SubjectCategory = 'Core' | 'Elective' | 'Language' | 'Science' | 'Commerce' | 'Arts' | 'Lab' | 'Activity' | 'Other';

export interface CreateSubjectDto {
  name: string;
  shortName?: string;
  code?: string;
  type?: SubjectType;
  category?: SubjectCategory;
  defaultMaxMarks?: number;
  defaultPassingMarks?: number;
  hasPractical?: boolean;
  practicalMaxMarks?: number;
  creditWeight?: number;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface UpdateSubjectDto {
  name?: string;
  shortName?: string;
  code?: string;
  type?: SubjectType;
  category?: SubjectCategory;
  defaultMaxMarks?: number;
  defaultPassingMarks?: number;
  hasPractical?: boolean;
  practicalMaxMarks?: number;
  creditWeight?: number;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface SubjectListItemDto extends Partial<EffectiveGovernanceMetadata> {
  id: string;
  organizationId: string;
  name: string;
  shortName?: string | null;
  code?: string | null;
  type: SubjectType;
  category: SubjectCategory;
  defaultMaxMarks?: number | null;
  defaultPassingMarks?: number | null;
  hasPractical: boolean;
  practicalMaxMarks?: number | null;
  creditWeight?: number | null;
  sortOrder: number;
  description?: string | null;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  sourceOrigin?: ConfigSourceOrigin;
  isInherited?: boolean;
  canEdit?: boolean;
  canToggleStatus?: boolean;
  canAssign?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 5. CLASSES / GRADES ───────────────────────────────────────────────────────
export interface ClassSubjectMappingDto {
  subjectId: string;
  subjectName?: string;
  isCompulsory: boolean; // true = Compulsory, false = Optional
}

export interface CreateClassDto {
  levelId: string;
  name: string;
  shortName?: string;
  code?: string;
  fromAge?: number;
  toAge?: number;
  compulsorySubjectIds?: string[];
  optionalSubjectIds?: string[];
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface UpdateClassDto {
  levelId?: string;
  name?: string;
  shortName?: string;
  code?: string;
  fromAge?: number;
  toAge?: number;
  compulsorySubjectIds?: string[];
  optionalSubjectIds?: string[];
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface ClassListItemDto extends Partial<EffectiveGovernanceMetadata> {
  id: string;
  organizationId: string;
  levelId: string;
  levelName?: string;
  name: string;
  shortName?: string | null;
  code?: string | null;
  fromAge?: number | null;
  toAge?: number | null;
  compulsorySubjectIds?: string[];
  compulsorySubjectNames?: string[];
  optionalSubjectIds?: string[];
  optionalSubjectNames?: string[];
  totalSubjectsCount?: number;
  sortOrder: number;
  description?: string | null;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  sourceOrigin?: ConfigSourceOrigin;
  isInherited?: boolean;
  canEdit?: boolean;
  canToggleStatus?: boolean;
  canAssign?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 6. SECTIONS ───────────────────────────────────────────────────────────────
export interface CreateSectionDto {
  name: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface UpdateSectionDto {
  name?: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface SectionListItemDto extends Partial<EffectiveGovernanceMetadata> {
  id: string;
  organizationId: string;
  name: string;
  sortOrder: number;
  description?: string | null;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  sourceOrigin?: ConfigSourceOrigin;
  isInherited?: boolean;
  canEdit?: boolean;
  canToggleStatus?: boolean;
  canAssign?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 7. LANGUAGES ──────────────────────────────────────────────────────────────
export interface CreateLanguageDto {
  name: string;
  code?: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface UpdateLanguageDto {
  name?: string;
  code?: string;
  sortOrder?: number;
  description?: string;
  ownerType?: ConfigOwnerType;
  ownerId?: string;
  applyTo?: ConfigScopeType;
  branchIds?: string[];
  isActive?: boolean;
}

export interface LanguageListItemDto extends Partial<EffectiveGovernanceMetadata> {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  sortOrder: number;
  description?: string | null;
  ownerType?: ConfigOwnerType;
  ownerId?: string | null;
  ownerName?: string | null;
  applyTo: ConfigScopeType;
  branchIds?: string[];
  branchNames?: string[];
  sourceOrigin?: ConfigSourceOrigin;
  isInherited?: boolean;
  canEdit?: boolean;
  canToggleStatus?: boolean;
  canAssign?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
