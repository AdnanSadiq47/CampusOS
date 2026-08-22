import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  TenantTransactionManager,
  schoolTypes,
  schools,
  auditLogs,
  eq,
  and,
  sql,
} from '@campus-os/database';
import {
  CreateSchoolTypeDto,
  UpdateSchoolTypeDto,
  SchoolTypeListItemDto,
} from '@campus-os/types';

@Injectable()
export class SchoolTypesService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  // ─────────────────────────────────────────────────────────────────
  //  CREATE
  // ─────────────────────────────────────────────────────────────────

  async createSchoolType(tenantId: string, dto: CreateSchoolTypeDto, userId?: string) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const cleanCode = dto.code.trim().toUpperCase();
      const cleanName = dto.name.trim();

      // 1. Check duplicate code within tenant
      const [existing] = await tx
        .select({ id: schoolTypes.id })
        .from(schoolTypes)
        .where(
          and(
            eq(schoolTypes.organizationId, tenantId),
            eq(schoolTypes.code, cleanCode)
          )
        )
        .limit(1);

      if (existing) {
        throw new ConflictException(
          `A School Type with code '${cleanCode}' already exists in this organization.`
        );
      }

      // 2. Insert record
      const [created] = await tx
        .insert(schoolTypes)
        .values({
          organizationId: tenantId,
          code: cleanCode,
          name: cleanName,
          description: dto.description?.trim() || null,
          isActive: dto.status !== undefined ? dto.status : true,
        })
        .returning();

      // 3. Audit log
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ? userId : null,
        actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
        entityType: 'school_type',
        entityId: created!.id,
        action: 'CREATE',
        beforeState: null,
        afterState: created,
      });

      return created!;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  LIST (With referenced school count)
  // ─────────────────────────────────────────────────────────────────

  async listSchoolTypes(
    tenantId: string,
    activeOnly: boolean = false
  ): Promise<SchoolTypeListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // Query school types joined with school counts
      const conditions = [eq(schoolTypes.organizationId, tenantId)];
      if (activeOnly) {
        conditions.push(eq(schoolTypes.isActive, true));
      }

      const rows = await tx
        .select({
          id: schoolTypes.id,
          organizationId: schoolTypes.organizationId,
          code: schoolTypes.code,
          name: schoolTypes.name,
          description: schoolTypes.description,
          isActive: schoolTypes.isActive,
          createdAt: schoolTypes.createdAt,
          updatedAt: schoolTypes.updatedAt,
          schoolCount: sql<number>`cast(count(${schools.id}) as int)`,
        })
        .from(schoolTypes)
        .leftJoin(
          schools,
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.schoolType, schoolTypes.code)
          )
        )
        .where(and(...conditions))
        .groupBy(
          schoolTypes.id,
          schoolTypes.organizationId,
          schoolTypes.code,
          schoolTypes.name,
          schoolTypes.description,
          schoolTypes.isActive,
          schoolTypes.createdAt,
          schoolTypes.updatedAt
        )
        .orderBy(schoolTypes.name);

      return rows.map((r) => ({
        id: r.id,
        organizationId: r.organizationId,
        code: r.code,
        name: r.name,
        description: r.description,
        schoolCount: Number(r.schoolCount || 0),
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  GET BY ID
  // ─────────────────────────────────────────────────────────────────

  async getSchoolType(tenantId: string, id: string): Promise<SchoolTypeListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [typeRow] = await tx
        .select({
          id: schoolTypes.id,
          organizationId: schoolTypes.organizationId,
          code: schoolTypes.code,
          name: schoolTypes.name,
          description: schoolTypes.description,
          isActive: schoolTypes.isActive,
          createdAt: schoolTypes.createdAt,
          updatedAt: schoolTypes.updatedAt,
          schoolCount: sql<number>`cast(count(${schools.id}) as int)`,
        })
        .from(schoolTypes)
        .leftJoin(
          schools,
          and(
            eq(schools.organizationId, tenantId),
            eq(schools.schoolType, schoolTypes.code)
          )
        )
        .where(
          and(
            eq(schoolTypes.organizationId, tenantId),
            eq(schoolTypes.id, id)
          )
        )
        .groupBy(
          schoolTypes.id,
          schoolTypes.organizationId,
          schoolTypes.code,
          schoolTypes.name,
          schoolTypes.description,
          schoolTypes.isActive,
          schoolTypes.createdAt,
          schoolTypes.updatedAt
        )
        .limit(1);

      if (!typeRow) {
        throw new NotFoundException(`School Type '${id}' not found in this organization.`);
      }

      return {
        id: typeRow.id,
        organizationId: typeRow.organizationId,
        code: typeRow.code,
        name: typeRow.name,
        description: typeRow.description,
        schoolCount: Number(typeRow.schoolCount || 0),
        isActive: typeRow.isActive,
        createdAt: typeRow.createdAt,
        updatedAt: typeRow.updatedAt,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────────────────────────

  async updateSchoolType(
    tenantId: string,
    id: string,
    dto: UpdateSchoolTypeDto,
    userId?: string
  ) {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(schoolTypes)
        .where(
          and(
            eq(schoolTypes.organizationId, tenantId),
            eq(schoolTypes.id, id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`School Type '${id}' not found in this organization.`);
      }

      // Check code uniqueness if changing code
      if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
        const cleanCode = dto.code.trim().toUpperCase();
        const [dup] = await tx
          .select({ id: schoolTypes.id })
          .from(schoolTypes)
          .where(
            and(
              eq(schoolTypes.organizationId, tenantId),
              eq(schoolTypes.code, cleanCode)
            )
          )
          .limit(1);

        if (dup) {
          throw new ConflictException(
            `A School Type with code '${cleanCode}' already exists in this organization.`
          );
        }
      }

      const patch: Partial<typeof schoolTypes.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.name !== undefined) patch.name = dto.name.trim();
      if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
      if (dto.description !== undefined) patch.description = dto.description?.trim() || null;
      if (dto.isActive !== undefined) patch.isActive = dto.isActive;

      const [updated] = await tx
        .update(schoolTypes)
        .set(patch)
        .where(
          and(
            eq(schoolTypes.organizationId, tenantId),
            eq(schoolTypes.id, id)
          )
        )
        .returning();

      // Audit log
      await tx.insert(auditLogs).values({
        organizationId: tenantId,
        actorId: userId ? userId : null,
        actorEmail: userId ? 'admin@campus-os.local' : 'system@campus-os.local',
        entityType: 'school_type',
        entityId: id,
        action: 'UPDATE',
        beforeState: existing,
        afterState: updated,
      });

      return updated!;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  TOGGLE STATUS
  // ─────────────────────────────────────────────────────────────────

  async toggleSchoolTypeStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId?: string
  ) {
    return this.updateSchoolType(tenantId, id, { isActive }, userId);
  }
}
