import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import {
  TenantTransactionManager,
  formDefinitions,
  formVersions,
  fieldDefinitions,
  formTemplates,
  configScopeBranches,
  branches,
} from '@campus-os/database';
import {
  FormPurpose,
  FormVersionStatus,
  FieldCategory,
  FieldOrigin,
  FieldDataType,
  FieldDefinitionDto,
  FormVersionDto,
  FormDefinitionListItemDto,
  FormTemplateDto,
  ResolvedFormDto,
  CreateFormDefinitionDto,
  SaveFormDraftDto,
  PublishFormVersionDto,
  CreateCustomFieldDto,
  FormSchemaPayload,
  ConfigOwnerType,
  ConfigScopeType,
  ConfigSourceOrigin,
} from '@campus-os/types';
import { eq, and, or, ilike, desc, asc, inArray } from 'drizzle-orm';
import { AuditService } from '../../core/audit/audit.service.js';
import { MASTER_FIELD_LIBRARY_CATALOG } from './forms.catalog.js';

// Pre-configured starter templates
const INITIAL_SYSTEM_TEMPLATES: FormTemplateDto[] = [
  {
    id: 'tmpl_basic_prereg',
    code: 'TMPL_BASIC_PREREG',
    name: 'Basic Pre-Registration Form',
    formPurpose: 'PRE_REGISTRATION',
    category: 'Standard',
    icon: '⚡',
    description: 'Fast, minimal pre-registration form collecting essential student & parent contact details.',
    isSystem: true,
    schemaPayload: {
      settings: { submitButtonText: 'Submit Pre-Registration', saveDraftEnabled: true },
      rules: [],
      sections: [
        {
          id: 'sec_basic_student',
          title: 'Student Basic Details',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_full_name',
              fieldDefinitionId: 'STD_FULL_NAME',
              canonicalKey: 'STUDENT_FULL_NAME',
              customLabel: 'Student Full Name',
              placeholder: 'Enter student official name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
              validation: { required: true, minLength: 3 },
            },
            {
              instanceId: 'fld_dob',
              fieldDefinitionId: 'STD_DOB',
              canonicalKey: 'STUDENT_DOB',
              customLabel: 'Date of Birth',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
              validation: { required: true },
            },
            {
              instanceId: 'fld_gender',
              fieldDefinitionId: 'STD_GENDER',
              canonicalKey: 'STUDENT_GENDER',
              customLabel: 'Gender',
              width: 'HALF',
              isRequired: true,
              sortOrder: 3,
              options: [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }],
            },
            {
              instanceId: 'fld_class',
              fieldDefinitionId: 'ACAD_CLASS_REF',
              canonicalKey: 'APPLYING_CLASS',
              customLabel: 'Applying Class / Grade',
              width: 'HALF',
              isRequired: true,
              sortOrder: 4,
              masterBinding: 'CLASS',
            },
          ],
        },
        {
          id: 'sec_basic_parent',
          title: 'Parent / Guardian Contact',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 2,
          fields: [
            {
              instanceId: 'fld_fat_name',
              fieldDefinitionId: 'FAT_NAME',
              canonicalKey: 'FATHER_NAME',
              customLabel: 'Father Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_primary_mobile',
              fieldDefinitionId: 'CNT_PRIMARY_MOBILE',
              canonicalKey: 'PRIMARY_CONTACT_MOBILE',
              customLabel: 'Primary Mobile Number (SMS Alerts)',
              placeholder: '+92 300 1234567',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
              validation: { required: true, phoneFormat: true },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'tmpl_standard_prereg',
    code: 'TMPL_STANDARD_PREREG',
    name: 'Standard Pre-Registration Form',
    formPurpose: 'PRE_REGISTRATION',
    category: 'Standard',
    icon: '📋',
    description: 'Comprehensive pre-registration form including address, previous school, and emergency contact details.',
    isSystem: true,
    schemaPayload: {
      settings: { submitButtonText: 'Submit Application', saveDraftEnabled: true },
      rules: [],
      sections: [
        {
          id: 'sec_std_info',
          title: 'Student Information',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_fname',
              fieldDefinitionId: 'STD_FIRST_NAME',
              canonicalKey: 'STUDENT_FIRST_NAME',
              customLabel: 'First Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_lname',
              fieldDefinitionId: 'STD_LAST_NAME',
              canonicalKey: 'STUDENT_LAST_NAME',
              customLabel: 'Last Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
            },
            {
              instanceId: 'fld_dob',
              fieldDefinitionId: 'STD_DOB',
              canonicalKey: 'STUDENT_DOB',
              customLabel: 'Date of Birth',
              width: 'HALF',
              isRequired: true,
              sortOrder: 3,
            },
            {
              instanceId: 'fld_gender',
              fieldDefinitionId: 'STD_GENDER',
              canonicalKey: 'STUDENT_GENDER',
              customLabel: 'Gender',
              width: 'HALF',
              isRequired: true,
              sortOrder: 4,
              options: [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }],
            },
            {
              instanceId: 'fld_applying_class',
              fieldDefinitionId: 'ACAD_CLASS_REF',
              canonicalKey: 'APPLYING_CLASS',
              customLabel: 'Applying Class / Grade',
              width: 'HALF',
              isRequired: true,
              sortOrder: 5,
              masterBinding: 'CLASS',
            },
            {
              instanceId: 'fld_bform',
              fieldDefinitionId: 'ID_BFORM',
              canonicalKey: 'IDENTITY_BFORM',
              customLabel: 'NADRA B-Form Number',
              placeholder: '42201-1234567-1',
              width: 'HALF',
              isRequired: false,
              sortOrder: 6,
            },
          ],
        },
        {
          id: 'sec_parent_info',
          title: 'Parent Information',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 2,
          fields: [
            {
              instanceId: 'fld_father_name',
              fieldDefinitionId: 'FAT_NAME',
              canonicalKey: 'FATHER_NAME',
              customLabel: 'Father Full Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_father_cnic',
              fieldDefinitionId: 'FAT_CNIC',
              canonicalKey: 'FATHER_CNIC',
              customLabel: 'Father CNIC',
              placeholder: '42201-1234567-1',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
            },
            {
              instanceId: 'fld_father_mobile',
              fieldDefinitionId: 'FAT_MOBILE',
              canonicalKey: 'FATHER_MOBILE',
              customLabel: 'Father Mobile Number',
              placeholder: '+92 300 1234567',
              width: 'HALF',
              isRequired: true,
              sortOrder: 3,
            },
            {
              instanceId: 'fld_mother_name',
              fieldDefinitionId: 'MOT_NAME',
              canonicalKey: 'MOTHER_NAME',
              customLabel: 'Mother Full Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 4,
            },
          ],
        },
        {
          id: 'sec_address',
          title: 'Residential Address',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 3,
          fields: [
            {
              instanceId: 'fld_addr_line1',
              fieldDefinitionId: 'ADDR_CURR_LINE1',
              canonicalKey: 'CURRENT_ADDRESS_LINE1',
              customLabel: 'Address Line 1',
              width: 'FULL',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_city',
              fieldDefinitionId: 'ADDR_CURR_CITY',
              canonicalKey: 'CURRENT_CITY',
              customLabel: 'City',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
              masterBinding: 'CITY',
            },
            {
              instanceId: 'fld_area',
              fieldDefinitionId: 'ADDR_CURR_AREA',
              canonicalKey: 'CURRENT_AREA',
              customLabel: 'Area / Zone',
              width: 'HALF',
              isRequired: false,
              sortOrder: 3,
              masterBinding: 'AREA',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'tmpl_detailed_admission',
    code: 'TMPL_DETAILED_ADMISSION',
    name: 'Comprehensive Formal Admission Form',
    formPurpose: 'ADMISSION',
    category: 'Detailed',
    icon: '🏫',
    description: 'Complete institutional admission form covering academic history, documents, medical details, transport, and parent declarations.',
    isSystem: true,
    schemaPayload: {
      settings: { submitButtonText: 'Submit Complete Admission Package', saveDraftEnabled: true },
      rules: [
        {
          id: 'rule_transport',
          sourceFieldKey: 'fld_transport_req',
          operator: 'EQUALS',
          value: true,
          action: 'SHOW',
          targetFieldKey: 'fld_transport_pickup',
        },
      ],
      sections: [
        {
          id: 'sec_adm_student',
          title: 'Student Information',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_adm_fullname',
              fieldDefinitionId: 'STD_FULL_NAME',
              canonicalKey: 'STUDENT_FULL_NAME',
              customLabel: 'Official Full Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_adm_dob',
              fieldDefinitionId: 'STD_DOB',
              canonicalKey: 'STUDENT_DOB',
              customLabel: 'Date of Birth',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
            },
            {
              instanceId: 'fld_adm_gender',
              fieldDefinitionId: 'STD_GENDER',
              canonicalKey: 'STUDENT_GENDER',
              customLabel: 'Gender',
              width: 'HALF',
              isRequired: true,
              sortOrder: 3,
              options: [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }],
            },
            {
              instanceId: 'fld_adm_photo',
              fieldDefinitionId: 'STD_PHOTO',
              canonicalKey: 'STUDENT_PHOTO',
              customLabel: 'Student Photograph',
              width: 'HALF',
              isRequired: true,
              sortOrder: 4,
            },
          ],
        },
        {
          id: 'sec_adm_academic',
          title: 'Academic & Grade Details',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 2,
          fields: [
            {
              instanceId: 'fld_adm_board',
              fieldDefinitionId: 'ACAD_BOARD_REF',
              canonicalKey: 'BOARD',
              customLabel: 'Curriculum / Board',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
              masterBinding: 'BOARD',
            },
            {
              instanceId: 'fld_adm_class',
              fieldDefinitionId: 'ACAD_CLASS_REF',
              canonicalKey: 'APPLYING_CLASS',
              customLabel: 'Enrolling Class / Grade',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
              masterBinding: 'CLASS',
            },
          ],
        },
        {
          id: 'sec_adm_transport',
          title: 'Transport & Facilities',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 3,
          fields: [
            {
              instanceId: 'fld_transport_req',
              fieldDefinitionId: 'TRN_REQUIRED',
              canonicalKey: 'TRANSPORT_REQUIRED',
              customLabel: 'School Transport Required?',
              width: 'HALF',
              isRequired: false,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_transport_pickup',
              fieldDefinitionId: 'TRN_PICKUP_AREA',
              canonicalKey: 'TRANSPORT_PICKUP_AREA',
              customLabel: 'Preferred Pickup / Drop Location',
              width: 'HALF',
              isRequired: false,
              sortOrder: 2,
            },
          ],
        },
        {
          id: 'sec_adm_declaration',
          title: 'Parent Declaration',
          showSectionHeading: true,
          columns: 1,
          sortOrder: 4,
          fields: [
            {
              instanceId: 'fld_declaration_accuracy',
              fieldDefinitionId: 'DEC_ACCURACY',
              canonicalKey: 'DECLARATION_ACCURACY',
              customLabel: 'I hereby confirm that all information provided is accurate and authentic.',
              width: 'FULL',
              isRequired: true,
              sortOrder: 1,
            },
          ],
        },
      ],
    },
  },
];

@Injectable()
export class FormsService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

  // ═════════════════════════════════════════════════════════════════
  // GOVERNANCE ENGINE TAGGING
  // ═════════════════════════════════════════════════════════════════

  private tagEffectiveGovernance<T extends { ownerType?: string; ownerId?: string | null; applyTo?: string }>(
    record: T,
    userRole: string = 'SCHOOL_ADMIN',
    targetCampusId?: string,
    allowLowerLevelEdit: boolean = false
  ) {
    const isLocal = record.ownerType === 'CAMPUS';
    const isCampusQuery = !!(targetCampusId && targetCampusId !== 'ALL');
    const sourceOrigin: ConfigSourceOrigin = isCampusQuery
      ? (isLocal && record.ownerId === targetCampusId ? 'LOCAL' : 'INHERITED')
      : (isLocal ? 'LOCAL' : 'INHERITED');
    const isInherited = sourceOrigin === 'INHERITED';

    const isOrgAdmin =
      userRole === 'SUPER_ADMIN' ||
      userRole === 'HEAD_OFFICE_ADMIN' ||
      userRole === 'REGION_ADMIN' ||
      userRole === 'SCHOOL_ADMIN' ||
      userRole === 'ADMIN';

    const canEdit = isLocal
      ? (userRole === 'CAMPUS_ADMIN' ? (targetCampusId ? record.ownerId === targetCampusId : true) : allowLowerLevelEdit)
      : isOrgAdmin;

    const canToggleStatus = canEdit;
    const canAssign = isOrgAdmin && !isLocal;

    return {
      ownerType: (record.ownerType as ConfigOwnerType) || 'SCHOOL',
      sourceOrigin,
      isInherited,
      canEdit,
      canToggleStatus,
      canAssign,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. MASTER FIELD LIBRARY & CATALOG
  // ═════════════════════════════════════════════════════════════════

  async listFieldLibrary(
    tenantId: string,
    category?: string,
    search?: string,
    origin?: string
  ): Promise<FieldDefinitionDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // 1. Load tenant custom fields from DB
      const customRows = await tx
        .select()
        .from(fieldDefinitions)
        .where(
          and(
            eq(fieldDefinitions.organizationId, tenantId),
            category && category !== 'ALL' ? eq(fieldDefinitions.category, category) : undefined
          )
        )
        .orderBy(asc(fieldDefinitions.name));

      const customFields: FieldDefinitionDto[] = customRows.map((r) => ({
        id: r.id,
        organizationId: r.organizationId,
        code: r.code,
        canonicalKey: r.canonicalKey,
        name: r.name,
        description: r.description,
        category: r.category as FieldCategory,
        origin: r.origin as FieldOrigin,
        dataType: r.dataType as FieldDataType,
        masterBinding: r.masterBinding as any,
        defaultLabel: r.defaultLabel,
        defaultPlaceholder: r.defaultPlaceholder,
        defaultHelpText: r.defaultHelpText,
        defaultOptions: (r.defaultOptions as any) || [],
        defaultValidation: (r.defaultValidation as any) || {},
        isSystemProtected: r.isSystemProtected,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      // 2. Combine with Global Master Catalog
      const now = new Date('2026-01-01');
      const catalogFields: FieldDefinitionDto[] = MASTER_FIELD_LIBRARY_CATALOG.map((f) => ({
        id: f.id || `fld_${f.code.toLowerCase()}`,
        organizationId: null,
        code: f.code,
        canonicalKey: f.canonicalKey || null,
        name: f.name,
        description: f.description || null,
        category: f.category,
        origin: f.origin,
        dataType: f.dataType,
        masterBinding: f.masterBinding || null,
        defaultLabel: f.defaultLabel,
        defaultPlaceholder: f.defaultPlaceholder || null,
        defaultHelpText: f.defaultHelpText || null,
        defaultOptions: f.defaultOptions || [],
        defaultValidation: f.defaultValidation || {},
        isSystemProtected: f.isSystemProtected,
        isActive: f.isActive,
        createdAt: now,
        updatedAt: now,
      }));

      let allFields = [...catalogFields, ...customFields];

      if (category && category !== 'ALL') {
        allFields = allFields.filter((f) => f.category === category);
      }
      if (origin && origin !== 'ALL') {
        allFields = allFields.filter((f) => f.origin === origin);
      }
      if (search) {
        const q = search.trim().toLowerCase();
        allFields = allFields.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.code.toLowerCase().includes(q) ||
            f.defaultLabel.toLowerCase().includes(q) ||
            (f.canonicalKey && f.canonicalKey.toLowerCase().includes(q))
        );
      }

      return allFields;
    });
  }

  /**
   * Duplicate Canonical Concept Detection
   * Warns or blocks when user creates a custom field that duplicates an existing canonical concept
   */
  async checkDuplicateCanonicalConcept(
    name: string,
    _category: FieldCategory
  ): Promise<{ isDuplicate: boolean; matchedCanonical?: string; message?: string }> {
    const clean = name.trim().toLowerCase();
    const keywords = clean.split(/[\s_-]+/);

    const matchPatterns: Record<string, string[]> = {
      STUDENT_DOB: ['dob', 'birth', 'date of birth', 'birthdate'],
      STUDENT_FULL_NAME: ['full name', 'student name', 'candidate name'],
      FATHER_MOBILE: ['father mobile', 'father contact', 'father phone', 'father cell'],
      PRIMARY_CONTACT_MOBILE: ['primary mobile', 'primary phone', 'sms mobile', 'sms number'],
      IDENTITY_BFORM: ['b-form', 'bform', 'crc', 'child registration certificate'],
      FATHER_CNIC: ['father cnic', 'father national id', 'father nic'],
      CURRENT_CITY: ['city', 'residential city', 'living city'],
      APPLYING_CLASS: ['class', 'grade', 'applying grade', 'admission class'],
    };

    for (const [canonicalKey, tokens] of Object.entries(matchPatterns)) {
      if (tokens.some((t) => clean.includes(t) || keywords.includes(t))) {
        const canonical = MASTER_FIELD_LIBRARY_CATALOG.find((f) => f.canonicalKey === canonicalKey);
        return {
          isDuplicate: true,
          matchedCanonical: canonicalKey,
          message: `A canonical system field '${canonical?.name || canonicalKey}' already exists for this concept. We recommend selecting '${canonical?.name}' from the Field Library to ensure automated ERP mapping and data reuse.`,
        };
      }
    }

    return { isDuplicate: false };
  }

  async createCustomField(
    tenantId: string,
    dto: CreateCustomFieldDto,
    _actorUserId?: string
  ): Promise<FieldDefinitionDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // 1. Detect duplicate canonical concepts
      const duplicateCheck = await this.checkDuplicateCanonicalConcept(dto.name, dto.category);
      if (duplicateCheck.isDuplicate) {
        throw new BadRequestException(duplicateCheck.message);
      }

      const cleanCode = dto.code
        ? dto.code.trim().toUpperCase()
        : `CUST_${dto.name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_${Date.now().toString().slice(-4)}`;

      // 2. Check for duplicate code in tenant
      const [existing] = await tx
        .select()
        .from(fieldDefinitions)
        .where(
          and(
            eq(fieldDefinitions.organizationId, tenantId),
            or(eq(fieldDefinitions.code, cleanCode), ilike(fieldDefinitions.name, dto.name.trim()))
          )
        );

      if (existing) {
        throw new ConflictException(`A field with name '${dto.name}' or code '${cleanCode}' already exists in your field library.`);
      }

      const [created] = await tx
        .insert(fieldDefinitions)
        .values({
          organizationId: tenantId,
          code: cleanCode,
          canonicalKey: null,
          name: dto.name.trim(),
          category: dto.category,
          origin: 'CUSTOM',
          dataType: dto.dataType,
          defaultLabel: dto.defaultLabel.trim(),
          defaultPlaceholder: dto.defaultPlaceholder?.trim() || null,
          defaultHelpText: dto.defaultHelpText?.trim() || null,
          defaultOptions: dto.defaultOptions || [],
          defaultValidation: dto.defaultValidation || {},
          isSystemProtected: false,
          isActive: true,
        })
        .returning();

      return {
        id: created!.id,
        organizationId: created!.organizationId,
        code: created!.code,
        canonicalKey: created!.canonicalKey,
        name: created!.name,
        description: created!.description,
        category: created!.category as FieldCategory,
        origin: created!.origin as FieldOrigin,
        dataType: created!.dataType as FieldDataType,
        masterBinding: created!.masterBinding as any,
        defaultLabel: created!.defaultLabel,
        defaultPlaceholder: created!.defaultPlaceholder,
        defaultHelpText: created!.defaultHelpText,
        defaultOptions: (created!.defaultOptions as any) || [],
        defaultValidation: (created!.defaultValidation as any) || {},
        isSystemProtected: created!.isSystemProtected,
        isActive: created!.isActive,
        createdAt: created!.createdAt,
        updatedAt: created!.updatedAt,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. FORM DEFINITIONS & VERSIONING
  // ═════════════════════════════════════════════════════════════════

  async listFormDefinitions(
    tenantId: string,
    campusId?: string,
    formPurpose?: string,
    search?: string,
    status?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<FormDefinitionListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const forms = await tx
        .select()
        .from(formDefinitions)
        .where(
          and(
            eq(formDefinitions.organizationId, tenantId),
            formPurpose && formPurpose !== 'ALL' ? eq(formDefinitions.formPurpose, formPurpose) : undefined,
            status && status !== 'ALL' ? eq(formDefinitions.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(formDefinitions.name, `%${search}%`),
                  ilike(formDefinitions.code, `%${search}%`),
                  ilike(formDefinitions.description, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(desc(formDefinitions.updatedAt));

      const formIds = forms.map((f) => f.id);
      if (formIds.length === 0) return [];

      // Load scope branch info
      const scopeBranches = await tx
        .select({
          entityId: configScopeBranches.entityId,
          branchId: configScopeBranches.branchId,
          branchName: branches.name,
        })
        .from(configScopeBranches)
        .innerJoin(branches, eq(configScopeBranches.branchId, branches.id))
        .where(
          and(
            eq(configScopeBranches.organizationId, tenantId),
            eq(configScopeBranches.entityType, 'form_definition'),
            inArray(configScopeBranches.entityId, formIds)
          )
        );

      const branchMap = new Map<string, { ids: string[]; names: string[] }>();
      for (const sb of scopeBranches) {
        if (!branchMap.has(sb.entityId)) {
          branchMap.set(sb.entityId, { ids: [], names: [] });
        }
        const b = branchMap.get(sb.entityId)!;
        b.ids.push(sb.branchId);
        b.names.push(sb.branchName);
      }

      // Load versions info
      const allVersions = await tx
        .select()
        .from(formVersions)
        .where(
          and(
            eq(formVersions.organizationId, tenantId),
            inArray(formVersions.formDefinitionId, formIds)
          )
        );

      let result: FormDefinitionListItemDto[] = forms.map((f) => {
        const fVersions = allVersions.filter((v) => v.formDefinitionId === f.id);
        const currentVer = fVersions.find((v) => v.id === f.currentVersionId) || fVersions[fVersions.length - 1];
        const publishedVer = fVersions.find((v) => v.id === f.publishedVersionId || v.status === 'PUBLISHED');
        const bInfo = branchMap.get(f.id);
        const gov = this.tagEffectiveGovernance(f, userRole, campusId);

        return {
          id: f.id,
          organizationId: f.organizationId,
          name: f.name,
          code: f.code,
          formPurpose: f.formPurpose as FormPurpose,
          description: f.description,
          ownerType: (f.ownerType as ConfigOwnerType) || 'SCHOOL',
          ownerId: f.ownerId,
          applyTo: f.applyTo as ConfigScopeType,
          branchIds: bInfo?.ids || [],
          branchNames: bInfo?.names || [],
          sourceOrigin: gov.sourceOrigin,
          isInherited: gov.isInherited,
          canEdit: gov.canEdit,
          canToggleStatus: gov.canToggleStatus,
          canAssign: gov.canAssign,
          currentVersionNumber: currentVer?.versionNumber || 1,
          currentVersionStatus: (currentVer?.status as FormVersionStatus) || 'DRAFT',
          publishedVersionId: publishedVer?.id || null,
          publishedVersionNumber: publishedVer?.versionNumber || null,
          totalVersionsCount: fVersions.length,
          isActive: f.isActive,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        };
      });

      // Campus Filtering
      if (campusId && campusId !== 'ALL') {
        result = result.filter((item) => {
          if (item.ownerType === 'CAMPUS' && item.ownerId === campusId) return true;
          if (item.applyTo === 'ALL_CAMPUSES') return true;
          return item.branchIds?.includes(campusId);
        });
      } else if (userRole === 'HEAD_OFFICE_ADMIN') {
        // Head Office summary policy
        result = result.filter((item) => item.ownerType !== 'CAMPUS');
      }

      return result;
    });
  }

  async getFormDefinition(
    tenantId: string,
    id: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<{
    form: FormDefinitionListItemDto;
    currentVersion: FormVersionDto;
    allVersions: Array<Omit<FormVersionDto, 'schemaPayload'>>;
  }> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [form] = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, id)));

      if (!form) throw new NotFoundException(`Form definition with ID '${id}' not found.`);

      const versions = await tx
        .select()
        .from(formVersions)
        .where(
          and(
            eq(formVersions.organizationId, tenantId),
            eq(formVersions.formDefinitionId, id)
          )
        )
        .orderBy(desc(formVersions.versionNumber));

      if (versions.length === 0) {
        throw new NotFoundException(`No version found for form '${form.name}'.`);
      }

      const activeVer = versions.find((v) => v.id === form.currentVersionId) || versions[0]!;
      const gov = this.tagEffectiveGovernance(form, userRole);

      // Scope branches
      const scopeRows = await tx
        .select({ branchId: configScopeBranches.branchId, branchName: branches.name })
        .from(configScopeBranches)
        .innerJoin(branches, eq(configScopeBranches.branchId, branches.id))
        .where(
          and(
            eq(configScopeBranches.organizationId, tenantId),
            eq(configScopeBranches.entityType, 'form_definition'),
            eq(configScopeBranches.entityId, id)
          )
        );

      const publishedVer = versions.find((v) => v.id === form.publishedVersionId || v.status === 'PUBLISHED');

      return {
        form: {
          id: form.id,
          organizationId: form.organizationId,
          name: form.name,
          code: form.code,
          formPurpose: form.formPurpose as FormPurpose,
          description: form.description,
          ownerId: form.ownerId,
          applyTo: form.applyTo as ConfigScopeType,
          branchIds: scopeRows.map((r) => r.branchId),
          branchNames: scopeRows.map((r) => r.branchName),
          ...gov,
          currentVersionNumber: activeVer.versionNumber,
          currentVersionStatus: activeVer.status as FormVersionStatus,
          publishedVersionId: publishedVer?.id || null,
          publishedVersionNumber: publishedVer?.versionNumber || null,
          totalVersionsCount: versions.length,
          isActive: form.isActive,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        },
        currentVersion: {
          id: activeVer.id,
          organizationId: activeVer.organizationId,
          formDefinitionId: activeVer.formDefinitionId,
          versionNumber: activeVer.versionNumber,
          status: activeVer.status as FormVersionStatus,
          schemaPayload: activeVer.schemaPayload as FormSchemaPayload,
          publishedAt: activeVer.publishedAt,
          publishedByUserId: activeVer.publishedByUserId,
          changelogSummary: activeVer.changelogSummary,
          createdAt: activeVer.createdAt,
        },
        allVersions: versions.map((v) => ({
          id: v.id,
          organizationId: v.organizationId,
          formDefinitionId: v.formDefinitionId,
          versionNumber: v.versionNumber,
          status: v.status as FormVersionStatus,
          publishedAt: v.publishedAt,
          publishedByUserId: v.publishedByUserId,
          changelogSummary: v.changelogSummary,
          createdAt: v.createdAt,
        })),
      };
    });
  }

  async createFormDefinition(
    tenantId: string,
    dto: CreateFormDefinitionDto,
    actorUserId?: string,
    _authorizedBranchIds?: string[],
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<FormDefinitionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanName = dto.name.trim();
      const cleanCode = dto.code
        ? dto.code.trim().toUpperCase()
        : `FORM_${dto.formPurpose}_${Date.now().toString().slice(-4)}`;

      const ownerType: ConfigOwnerType = dto.ownerType || 'SCHOOL';
      const ownerId = dto.ownerId || null;
      const applyTo = dto.applyTo || 'ALL_CAMPUSES';

      // 1. Duplicate code/name check
      const [existing] = await tx
        .select()
        .from(formDefinitions)
        .where(
          and(
            eq(formDefinitions.organizationId, tenantId),
            or(eq(formDefinitions.code, cleanCode), eq(formDefinitions.name, cleanName))
          )
        );

      if (existing) {
        throw new ConflictException(`Form definition '${cleanName}' or code '${cleanCode}' already exists in this organization.`);
      }

      // 2. Resolve initial schema payload
      let initialSchema: FormSchemaPayload = {
        sections: [],
        rules: [],
        settings: { submitButtonText: 'Submit Application', saveDraftEnabled: true },
      };

      if (dto.initialSchema) {
        initialSchema = dto.initialSchema;
      } else if (dto.templateId) {
        const tmpl = INITIAL_SYSTEM_TEMPLATES.find((t) => t.id === dto.templateId);
        if (tmpl) initialSchema = JSON.parse(JSON.stringify(tmpl.schemaPayload));
      } else if (dto.copyFromFormId) {
        // Copy schema from existing form while preserving canonical field identities
        const [sourceForm] = await tx
          .select()
          .from(formDefinitions)
          .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, dto.copyFromFormId)));

        if (sourceForm && sourceForm.currentVersionId) {
          const [sourceVer] = await tx
            .select()
            .from(formVersions)
            .where(
              and(
                eq(formVersions.organizationId, tenantId),
                eq(formVersions.id, sourceForm.currentVersionId)
              )
            );
          if (sourceVer) {
            initialSchema = JSON.parse(JSON.stringify(sourceVer.schemaPayload));
          }
        }
      }

      // 3. Insert form definition
      const [createdForm] = await tx
        .insert(formDefinitions)
        .values({
          organizationId: tenantId,
          name: cleanName,
          code: cleanCode,
          formPurpose: dto.formPurpose,
          description: dto.description?.trim() || null,
          ownerType,
          ownerId,
          applyTo,
          isActive: true,
        })
        .returning();

      // 4. Create initial Version 1 (DRAFT)
      const [createdVer] = await tx
        .insert(formVersions)
        .values({
          organizationId: tenantId,
          formDefinitionId: createdForm!.id,
          versionNumber: 1,
          status: 'DRAFT',
          schemaPayload: initialSchema,
          changelogSummary: 'Initial draft version created.',
        })
        .returning();

      // 5. Link current version
      await tx
        .update(formDefinitions)
        .set({ currentVersionId: createdVer!.id, updatedAt: new Date() })
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, createdForm!.id)));

      // 6. Sync scope branches with validation & deduplication
      if (applyTo === 'SELECTED_CAMPUSES') {
        if (!dto.branchIds || dto.branchIds.length === 0) {
          throw new BadRequestException('Please select at least one location.');
        }

        const uniqueBranchIds = Array.from(new Set(dto.branchIds));

        // Security authorization check
        if (_authorizedBranchIds && _authorizedBranchIds.length > 0) {
          const isUnauthorized = uniqueBranchIds.some((bId) => !_authorizedBranchIds.includes(bId));
          if (isUnauthorized) {
            throw new ForbiddenException('You are not authorized to assign forms to one or more selected locations.');
          }
        }

        const valuesToInsert = uniqueBranchIds.map((bId) => ({
          organizationId: tenantId,
          entityType: 'form_definition',
          entityId: createdForm!.id,
          branchId: bId,
        }));
        await tx.insert(configScopeBranches).values(valuesToInsert);
      }

      // 7. Audit log
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'FORMS',
          action: 'CREATE',
          entityType: 'form_definition',
          entityId: createdForm!.id,
          afterState: { form: createdForm, version: createdVer },
        },
        tx
      );

      const gov = this.tagEffectiveGovernance(createdForm!, userRole);

      return {
        id: createdForm!.id,
        organizationId: createdForm!.organizationId,
        name: createdForm!.name,
        code: createdForm!.code,
        formPurpose: createdForm!.formPurpose as FormPurpose,
        description: createdForm!.description,
        ownerId,
        applyTo,
        branchIds: applyTo === 'SELECTED_CAMPUSES' ? Array.from(new Set(dto.branchIds || [])) : [],
        branchNames: [],
        ...gov,
        currentVersionNumber: 1,
        currentVersionStatus: 'DRAFT',
        publishedVersionId: null,
        publishedVersionNumber: null,
        totalVersionsCount: 1,
        isActive: true,
        createdAt: createdForm!.createdAt,
        updatedAt: createdForm!.updatedAt,
      };
    });
  }

  async saveFormDraft(
    tenantId: string,
    formId: string,
    dto: SaveFormDraftDto,
    _actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<FormVersionDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [form] = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)));

      if (!form) throw new NotFoundException(`Form with ID '${formId}' not found.`);

      const gov = this.tagEffectiveGovernance(form, userRole);
      if (!gov.canEdit) {
        throw new ForbiddenException('You do not have permission to edit this form.');
      }

      // Find current draft version or create one
      const [currentVer] = await tx
        .select()
        .from(formVersions)
        .where(
          and(
            eq(formVersions.organizationId, tenantId),
            eq(formVersions.id, form.currentVersionId!)
          )
        );

      let targetVer = currentVer;

      if (!targetVer || targetVer.status !== 'DRAFT') {
        // If current version is already PUBLISHED/ARCHIVED, create next DRAFT version
        const versions = await tx
          .select()
          .from(formVersions)
          .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.formDefinitionId, formId)))
          .orderBy(desc(formVersions.versionNumber));

        const nextVerNum = (versions[0]?.versionNumber || 1) + 1;

        const [newDraft] = await tx
          .insert(formVersions)
          .values({
            organizationId: tenantId,
            formDefinitionId: formId,
            versionNumber: nextVerNum,
            status: 'DRAFT',
            schemaPayload: dto.schemaPayload,
            changelogSummary: dto.changelogSummary || `Draft Version ${nextVerNum}`,
          })
          .returning();

        targetVer = newDraft;

        await tx
          .update(formDefinitions)
          .set({ currentVersionId: targetVer!.id, updatedAt: new Date() })
          .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)));
      } else {
        // Update existing DRAFT
        const [updatedDraft] = await tx
          .update(formVersions)
          .set({
            schemaPayload: dto.schemaPayload,
            changelogSummary: dto.changelogSummary || targetVer.changelogSummary,
          })
          .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.id, targetVer.id)))
          .returning();

        targetVer = updatedDraft;

        await tx
          .update(formDefinitions)
          .set({ updatedAt: new Date() })
          .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)));
      }

      return {
        id: targetVer!.id,
        organizationId: targetVer!.organizationId,
        formDefinitionId: targetVer!.formDefinitionId,
        versionNumber: targetVer!.versionNumber,
        status: targetVer!.status as FormVersionStatus,
        schemaPayload: targetVer!.schemaPayload as FormSchemaPayload,
        publishedAt: targetVer!.publishedAt,
        publishedByUserId: targetVer!.publishedByUserId,
        changelogSummary: targetVer!.changelogSummary,
        createdAt: targetVer!.createdAt,
      };
    });
  }

  async publishFormVersion(
    tenantId: string,
    formId: string,
    dto?: PublishFormVersionDto,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<FormDefinitionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [form] = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)));

      if (!form) throw new NotFoundException(`Form with ID '${formId}' not found.`);

      const gov = this.tagEffectiveGovernance(form, userRole);
      if (!gov.canEdit) {
        throw new ForbiddenException('You do not have permission to publish this form.');
      }

      const [currentVer] = await tx
        .select()
        .from(formVersions)
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.id, form.currentVersionId!)));

      if (!currentVer) {
        throw new NotFoundException(`Current version for form '${form.name}' not found.`);
      }

      // 1. Mark current version as PUBLISHED
      const [publishedVer] = await tx
        .update(formVersions)
        .set({
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedByUserId: actorUserId || null,
          changelogSummary: dto?.changelogSummary || currentVer.changelogSummary || 'Published version.',
        })
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.id, currentVer.id)))
        .returning();

      // 2. Set published version on form definition
      const [updatedForm] = await tx
        .update(formDefinitions)
        .set({
          publishedVersionId: publishedVer!.id,
          updatedAt: new Date(),
        })
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)))
        .returning();

      // 3. Audit log
      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'FORMS',
          action: 'PUBLISH',
          entityType: 'form_definition',
          entityId: formId,
          afterState: { form: updatedForm, publishedVersion: publishedVer },
        },
        tx
      );

      return {
        id: updatedForm!.id,
        organizationId: updatedForm!.organizationId,
        name: updatedForm!.name,
        code: updatedForm!.code,
        formPurpose: updatedForm!.formPurpose as FormPurpose,
        description: updatedForm!.description,
        ownerId: updatedForm!.ownerId,
        applyTo: updatedForm!.applyTo as ConfigScopeType,
        ...gov,
        currentVersionNumber: publishedVer!.versionNumber,
        currentVersionStatus: 'PUBLISHED',
        publishedVersionId: publishedVer!.id,
        publishedVersionNumber: publishedVer!.versionNumber,
        totalVersionsCount: 1,
        isActive: updatedForm!.isActive,
        createdAt: updatedForm!.createdAt,
        updatedAt: updatedForm!.updatedAt,
      };
    });
  }

  async createNewVersion(
    tenantId: string,
    formId: string,
    _actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<FormVersionDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [form] = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)));

      if (!form) throw new NotFoundException(`Form with ID '${formId}' not found.`);

      const gov = this.tagEffectiveGovernance(form, userRole);
      if (!gov.canEdit) {
        throw new ForbiddenException('You do not have permission to create a new version.');
      }

      const allVersions = await tx
        .select()
        .from(formVersions)
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.formDefinitionId, formId)))
        .orderBy(desc(formVersions.versionNumber));

      const latestVer = allVersions[0];
      const nextVerNum = (latestVer?.versionNumber || 1) + 1;

      // Clone latest schema into new DRAFT version
      const [newVersion] = await tx
        .insert(formVersions)
        .values({
          organizationId: tenantId,
          formDefinitionId: formId,
          versionNumber: nextVerNum,
          status: 'DRAFT',
          schemaPayload: latestVer?.schemaPayload || { sections: [], rules: [], settings: {} },
          changelogSummary: `Version ${nextVerNum} draft created from Version ${latestVer?.versionNumber || 1}.`,
        })
        .returning();

      // Update form definition pointer
      await tx
        .update(formDefinitions)
        .set({ currentVersionId: newVersion!.id, updatedAt: new Date() })
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)));

      return {
        id: newVersion!.id,
        organizationId: newVersion!.organizationId,
        formDefinitionId: newVersion!.formDefinitionId,
        versionNumber: newVersion!.versionNumber,
        status: 'DRAFT',
        schemaPayload: newVersion!.schemaPayload as FormSchemaPayload,
        changelogSummary: newVersion!.changelogSummary,
        createdAt: newVersion!.createdAt,
      };
    });
  }

  async archiveForm(
    tenantId: string,
    formId: string,
    actorUserId?: string,
    userRole: string = 'SCHOOL_ADMIN'
  ): Promise<FormDefinitionListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [form] = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)));

      if (!form) throw new NotFoundException(`Form with ID '${formId}' not found.`);

      const gov = this.tagEffectiveGovernance(form, userRole);
      if (!gov.canToggleStatus) {
        throw new ForbiddenException('You do not have permission to archive this form.');
      }

      const [updated] = await tx
        .update(formDefinitions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'FORMS',
          action: 'ARCHIVE',
          entityType: 'form_definition',
          entityId: formId,
          beforeState: form,
          afterState: updated,
        },
        tx
      );

      return {
        id: updated!.id,
        organizationId: updated!.organizationId,
        name: updated!.name,
        code: updated!.code,
        formPurpose: updated!.formPurpose as FormPurpose,
        description: updated!.description,
        ownerId: updated!.ownerId,
        applyTo: updated!.applyTo as ConfigScopeType,
        ...gov,
        currentVersionNumber: 1,
        currentVersionStatus: 'ARCHIVED',
        totalVersionsCount: 1,
        isActive: false,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. CENTRALIZED FORM RESOLUTION ENGINE
  // ═════════════════════════════════════════════════════════════════

  /**
   * Deterministic Form Resolution for Future Runtime Consumers (Admissions / Pre-Registration)
   * Resolves the effective published form that applies to a given campus context:
   * Priority 1: Campus-owned local published form (if authorized)
   * Priority 2: School/Region/HO assigned published form via SELECTED_CAMPUSES
   * Priority 3: School/Region/HO universal published form via ALL_CAMPUSES
   */
  async resolvePublishedForm(
    tenantId: string,
    formPurpose: FormPurpose,
    campusId: string,
    _userRole: string = 'CAMPUS_ADMIN'
  ): Promise<ResolvedFormDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // Query all active form definitions for this tenant and purpose
      const activeForms = await tx
        .select()
        .from(formDefinitions)
        .where(
          and(
            eq(formDefinitions.organizationId, tenantId),
            eq(formDefinitions.formPurpose, formPurpose),
            eq(formDefinitions.isActive, true)
          )
        );

      if (activeForms.length === 0) {
        throw new NotFoundException(`No active '${formPurpose}' form definitions exist in this organization.`);
      }

      // Priority 1: Check for Campus local override
      const localForm = activeForms.find(
        (f) => f.ownerType === 'CAMPUS' && f.ownerId === campusId && f.publishedVersionId
      );

      let selectedForm = localForm;

      // Priority 2: Check for SELECTED_CAMPUSES assignment
      if (!selectedForm) {
        const selectedScopeForms = activeForms.filter(
          (f) => f.applyTo === 'SELECTED_CAMPUSES' && f.publishedVersionId
        );

        if (selectedScopeForms.length > 0) {
          const formIds = selectedScopeForms.map((f) => f.id);
          const branchMatches = await tx
            .select()
            .from(configScopeBranches)
            .where(
              and(
                eq(configScopeBranches.organizationId, tenantId),
                eq(configScopeBranches.entityType, 'form_definition'),
                eq(configScopeBranches.branchId, campusId),
                inArray(configScopeBranches.entityId, formIds)
              )
            );

          if (branchMatches.length > 0) {
            const matchedFormId = branchMatches[0]!.entityId;
            selectedForm = selectedScopeForms.find((f) => f.id === matchedFormId);
          }
        }
      }

      // Priority 3: Check for ALL_CAMPUSES universal definition
      if (!selectedForm) {
        selectedForm = activeForms.find(
          (f) => f.applyTo === 'ALL_CAMPUSES' && f.publishedVersionId
        );
      }

      if (!selectedForm || !selectedForm.publishedVersionId) {
        throw new NotFoundException(
          `No published '${formPurpose}' form currently applies to Campus ID '${campusId}'.`
        );
      }

      // Load published version payload
      const [publishedVer] = await tx
        .select()
        .from(formVersions)
        .where(
          and(
            eq(formVersions.organizationId, tenantId),
            eq(formVersions.id, selectedForm.publishedVersionId)
          )
        );

      if (!publishedVer) {
        throw new NotFoundException(`Published version record for form '${selectedForm.name}' was not found.`);
      }

      const isLocal = selectedForm.ownerType === 'CAMPUS';

      return {
        formDefinitionId: selectedForm.id,
        formName: selectedForm.name,
        formPurpose: selectedForm.formPurpose as FormPurpose,
        versionId: publishedVer.id,
        versionNumber: publishedVer.versionNumber,
        resolvedCampusId: campusId,
        sourceOrigin: isLocal ? 'LOCAL' : 'INHERITED',
        ownerType: selectedForm.ownerType as ConfigOwnerType,
        schemaPayload: publishedVer.schemaPayload as FormSchemaPayload,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. FORM TEMPLATES
  // ═════════════════════════════════════════════════════════════════

  async listTemplates(tenantId: string): Promise<FormTemplateDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const orgTemplates = await tx
        .select()
        .from(formTemplates)
        .where(
          and(
            eq(formTemplates.organizationId, tenantId),
            eq(formTemplates.isActive, true)
          )
        );

      const orgDtos: FormTemplateDto[] = orgTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        formPurpose: t.formPurpose as FormPurpose,
        category: t.category,
        icon: t.icon,
        description: t.description,
        isSystem: t.isSystem,
        schemaPayload: t.schemaPayload as FormSchemaPayload,
      }));

      return [...INITIAL_SYSTEM_TEMPLATES, ...orgDtos];
    });
  }
}
