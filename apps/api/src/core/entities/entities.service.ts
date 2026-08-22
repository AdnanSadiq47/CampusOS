import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantTransactionManager, entityDefinitions, entityFields, entityRecords, hierarchyNodes, eq, and, desc, sql } from '@campus-os/database';
import { CreateEntityDto, CreateEntityFieldDto, QueryEntityRecordsDto } from '@campus-os/types';

@Injectable()
export class EntitiesService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  /**
   * Create a new dynamic entity definition
   */
  async createEntity(tenantId: string, dto: CreateEntityDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const existing = await tx
        .select()
        .from(entityDefinitions)
        .where(and(eq(entityDefinitions.organizationId, tenantId), eq(entityDefinitions.code, dto.code)))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Entity with code '${dto.code}' already exists`);
      }

      const [entity] = await tx
        .insert(entityDefinitions)
        .values({
          organizationId: tenantId,
          code: dto.code,
          name: dto.name,
          description: dto.description,
          isSystem: dto.isSystem ?? false,
          isActive: true,
        })
        .returning();

      return entity;
    });
  }

  /**
   * List all entities for the tenant
   */
  async listEntities(tenantId: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      return tx
        .select()
        .from(entityDefinitions)
        .where(eq(entityDefinitions.organizationId, tenantId))
        .orderBy(desc(entityDefinitions.createdAt));
    });
  }

  /**
   * Add a field to an entity
   */
  async addField(tenantId: string, entityId: string, dto: CreateEntityFieldDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [entity] = await tx
        .select()
        .from(entityDefinitions)
        .where(and(eq(entityDefinitions.organizationId, tenantId), eq(entityDefinitions.id, entityId)))
        .limit(1);

      if (!entity) {
        throw new NotFoundException('Entity not found');
      }

      const [field] = await tx
        .insert(entityFields)
        .values({
          organizationId: tenantId,
          entityId,
          code: dto.code,
          name: dto.name,
          fieldType: dto.fieldType,
          isRequired: dto.isRequired ?? false,
          isUnique: dto.isUnique ?? false,
          isSearchable: dto.isSearchable ?? false,
          defaultValue: dto.defaultValue as unknown as Record<string, unknown>,
          validationRules: (dto.validationRules ?? {}) as Record<string, unknown>,
          options: (dto.options ?? []) as unknown as Record<string, unknown>,
          referenceEntityId: dto.referenceEntityId,
          sortOrder: dto.sortOrder ?? 0,
        })
        .returning();

      return field;
    });
  }

  /**
   * Create a dynamic record with Virtual ORM validation
   */
  async createRecord(
    tenantId: string,
    entityCode: string,
    hierarchyNodeId: string,
    data: Record<string, unknown>,
    userId?: string
  ) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [entity] = await tx
        .select()
        .from(entityDefinitions)
        .where(and(eq(entityDefinitions.organizationId, tenantId), eq(entityDefinitions.code, entityCode)))
        .limit(1);

      if (!entity) {
        throw new NotFoundException(`Entity '${entityCode}' not found`);
      }

      const fields = await tx
        .select()
        .from(entityFields)
        .where(and(eq(entityFields.organizationId, tenantId), eq(entityFields.entityId, entity.id)));

      // Virtual ORM Validation: required fields, types, constraints
      for (const field of fields) {
        const val = data[field.code];
        if (field.isRequired && (val === undefined || val === null || val === '')) {
          throw new BadRequestException(`Field '${field.name}' (${field.code}) is required`);
        }

        if (field.isUnique && val !== undefined && val !== null) {
          const existingRecords = await tx
            .select()
            .from(entityRecords)
            .where(
              and(
                eq(entityRecords.organizationId, tenantId),
                eq(entityRecords.entityId, entity.id),
                sql`data->>${field.code} = ${String(val)}`
              )
            )
            .limit(1);

          if (existingRecords.length > 0) {
            throw new ConflictException(`Unique constraint violation on field '${field.name}' (${field.code})`);
          }
        }
      }

      const [record] = await tx
        .insert(entityRecords)
        .values({
          organizationId: tenantId,
          entityId: entity.id,
          hierarchyNodeId,
          data,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      return record;
    });
  }

  /**
   * Query records with node hierarchy subtree scoping
   */
  async queryRecords(tenantId: string, dto: QueryEntityRecordsDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [entity] = await tx
        .select()
        .from(entityDefinitions)
        .where(and(eq(entityDefinitions.organizationId, tenantId), eq(entityDefinitions.code, dto.entityCode)))
        .limit(1);

      if (!entity) {
        throw new NotFoundException(`Entity '${dto.entityCode}' not found`);
      }

      let query = tx
        .select({
          id: entityRecords.id,
          organizationId: entityRecords.organizationId,
          entityId: entityRecords.entityId,
          hierarchyNodeId: entityRecords.hierarchyNodeId,
          data: entityRecords.data,
          createdAt: entityRecords.createdAt,
          updatedAt: entityRecords.updatedAt,
        })
        .from(entityRecords)
        .where(and(eq(entityRecords.organizationId, tenantId), eq(entityRecords.entityId, entity.id)));

      // If hierarchyNodeId and includeSubtree is requested, join with hierarchy_nodes ltree
      if (dto.hierarchyNodeId) {
        if (dto.includeSubtree) {
          const [targetNode] = await tx
            .select({ path: hierarchyNodes.path })
            .from(hierarchyNodes)
            .where(and(eq(hierarchyNodes.organizationId, tenantId), eq(hierarchyNodes.id, dto.hierarchyNodeId)))
            .limit(1);

          if (targetNode) {
            return tx
              .select({
                id: entityRecords.id,
                organizationId: entityRecords.organizationId,
                entityId: entityRecords.entityId,
                hierarchyNodeId: entityRecords.hierarchyNodeId,
                data: entityRecords.data,
                createdAt: entityRecords.createdAt,
                updatedAt: entityRecords.updatedAt,
              })
              .from(entityRecords)
              .innerJoin(hierarchyNodes, eq(entityRecords.hierarchyNodeId, hierarchyNodes.id))
              .where(
                and(
                  eq(entityRecords.organizationId, tenantId),
                  eq(entityRecords.entityId, entity.id),
                  sql`${hierarchyNodes.path} <@ ${targetNode.path}::ltree`
                )
              )
              .orderBy(desc(entityRecords.createdAt));
          }
        } else {
          return tx
            .select()
            .from(entityRecords)
            .where(
              and(
                eq(entityRecords.organizationId, tenantId),
                eq(entityRecords.entityId, entity.id),
                eq(entityRecords.hierarchyNodeId, dto.hierarchyNodeId)
              )
            )
            .orderBy(desc(entityRecords.createdAt));
        }
      }

      return query.orderBy(desc(entityRecords.createdAt));
    });
  }
}
