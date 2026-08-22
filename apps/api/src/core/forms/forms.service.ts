import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TenantTransactionManager, formDefinitions, formVersions, entityDefinitions, eq, and, desc } from '@campus-os/database';
import { CreateFormDto, SaveFormVersionDto, FormSchemaAST } from '@campus-os/types';

@Injectable()
export class FormsService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  /**
   * Create a new form definition with initial draft version
   */
  async createForm(tenantId: string, dto: CreateFormDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [entity] = await tx
        .select()
        .from(entityDefinitions)
        .where(and(eq(entityDefinitions.organizationId, tenantId), eq(entityDefinitions.id, dto.entityId)))
        .limit(1);

      if (!entity) {
        throw new NotFoundException('Target entity not found');
      }

      const existing = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.code, dto.code)))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Form with code '${dto.code}' already exists`);
      }

      const [form] = await tx
        .insert(formDefinitions)
        .values({
          organizationId: tenantId,
          entityId: dto.entityId,
          code: dto.code,
          name: dto.name,
          description: dto.description,
          isActive: true,
        })
        .returning();

      // Create initial v1 DRAFT
      const initialAst: FormSchemaAST = dto.initialSchemaAst ?? {
        layout: 'single_page',
        tabs: [
          {
            id: 'tab_general',
            title: 'General',
            sections: [
              {
                id: 'sec_main',
                title: 'Main Details',
                columns: 2,
                controls: [],
              },
            ],
          },
        ],
      };

      const [version] = await tx
        .insert(formVersions)
        .values({
          organizationId: tenantId,
          formId: form!.id,
          version: 1,
          status: 'DRAFT',
          schemaAst: initialAst as unknown as Record<string, unknown>,
          rules: [] as unknown as Record<string, unknown>,
        })
        .returning();

      return { form, initialVersion: version };
    });
  }

  /**
   * Save a draft version of a form
   */
  async saveDraft(tenantId: string, formId: string, dto: SaveFormVersionDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [form] = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.id, formId)))
        .limit(1);

      if (!form) {
        throw new NotFoundException('Form not found');
      }

      // Find current latest draft
      const [latestDraft] = await tx
        .select()
        .from(formVersions)
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.formId, formId), eq(formVersions.status, 'DRAFT')))
        .orderBy(desc(formVersions.version))
        .limit(1);

      if (latestDraft) {
        const [updated] = await tx
          .update(formVersions)
          .set({
            schemaAst: dto.schemaAst as unknown as Record<string, unknown>,
            rules: (dto.rules ?? []) as unknown as Record<string, unknown>,
          })
          .where(eq(formVersions.id, latestDraft.id))
          .returning();

        return updated;
      }

      // If no draft exists (all published/archived), find max version and create version + 1
      const [latestVersion] = await tx
        .select()
        .from(formVersions)
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.formId, formId)))
        .orderBy(desc(formVersions.version))
        .limit(1);

      const nextVersionNumber = (latestVersion?.version ?? 0) + 1;

      const [newDraft] = await tx
        .insert(formVersions)
        .values({
          organizationId: tenantId,
          formId,
          version: nextVersionNumber,
          status: 'DRAFT',
          schemaAst: dto.schemaAst as unknown as Record<string, unknown>,
          rules: (dto.rules ?? []) as unknown as Record<string, unknown>,
        })
        .returning();

      return newDraft;
    });
  }

  /**
   * Publish a form version (Marks as strictly immutable PUBLISHED state)
   */
  async publishVersion(tenantId: string, formId: string, userId?: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [draft] = await tx
        .select()
        .from(formVersions)
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.formId, formId), eq(formVersions.status, 'DRAFT')))
        .orderBy(desc(formVersions.version))
        .limit(1);

      if (!draft) {
        throw new BadRequestException('No active DRAFT version available to publish');
      }

      // Archive any currently published versions
      await tx
        .update(formVersions)
        .set({ status: 'ARCHIVED' })
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.formId, formId), eq(formVersions.status, 'PUBLISHED')));

      // Mark this draft as PUBLISHED
      const [published] = await tx
        .update(formVersions)
        .set({
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: userId,
        })
        .where(eq(formVersions.id, draft.id))
        .returning();

      return published;
    });
  }

  /**
   * Get the published version of a form by form code
   */
  async getPublishedForm(tenantId: string, formCode: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [form] = await tx
        .select()
        .from(formDefinitions)
        .where(and(eq(formDefinitions.organizationId, tenantId), eq(formDefinitions.code, formCode), eq(formDefinitions.isActive, true)))
        .limit(1);

      if (!form) {
        throw new NotFoundException(`Form '${formCode}' not found`);
      }

      const [published] = await tx
        .select()
        .from(formVersions)
        .where(and(eq(formVersions.organizationId, tenantId), eq(formVersions.formId, form.id), eq(formVersions.status, 'PUBLISHED')))
        .orderBy(desc(formVersions.version))
        .limit(1);

      if (!published) {
        throw new NotFoundException(`No published version found for form '${formCode}'`);
      }

      return { form, version: published };
    });
  }

  /**
   * List all forms for the organization
   */
  async listForms(tenantId: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      return tx
        .select()
        .from(formDefinitions)
        .where(eq(formDefinitions.organizationId, tenantId))
        .orderBy(desc(formDefinitions.createdAt));
    });
  }
}
