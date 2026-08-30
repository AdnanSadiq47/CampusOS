import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, and, asc, ilike, or, sql } from 'drizzle-orm';
import {
  TenantTransactionManager,
  countries,
  states,
  cities,
  areas,
  schools,
  branches,
  headOffices,
  regions,
} from '@campus-os/database';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryListItemDto,
  CreateStateDto,
  UpdateStateDto,
  StateListItemDto,
  CreateCityDto,
  UpdateCityDto,
  CityListItemDto,
  CreateAreaDto,
  UpdateAreaDto,
  AreaListItemDto,
  GeographyDependenciesDto,
} from '@campus-os/types';
import { AuditService } from '../../core/audit/audit.service.js';

@Injectable()
export class GeographyService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

  // ═════════════════════════════════════════════════════════════════
  // 1. COUNTRIES MASTER
  // ═════════════════════════════════════════════════════════════════

  async listCountries(
    tenantId: string,
    search?: string,
    status?: string
  ): Promise<CountryListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      let query = tx
        .select({
          id: countries.id,
          organizationId: countries.organizationId,
          name: countries.name,
          iso2: countries.iso2,
          iso3: countries.iso3,
          numericCode: countries.numericCode,
          dialCode: countries.dialCode,
          currencyCode: countries.currencyCode,
          currencySymbol: countries.currencySymbol,
          nationality: countries.nationality,
          sortOrder: countries.sortOrder,
          isActive: countries.isActive,
          createdAt: countries.createdAt,
          updatedAt: countries.updatedAt,
        })
        .from(countries)
        .where(
          and(
            eq(countries.organizationId, tenantId),
            status && status !== 'ALL'
              ? eq(countries.isActive, status === 'ACTIVE')
              : undefined,
            search
              ? or(
                  ilike(countries.name, `%${search}%`),
                  ilike(countries.iso2, `%${search}%`),
                  ilike(countries.dialCode, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(countries.sortOrder), asc(countries.name));

      const rows = await query;
      return rows;
    });
  }

  async createCountry(
    tenantId: string,
    dto: CreateCountryDto,
    actorUserId?: string
  ): Promise<CountryListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // Check duplicate ISO2
      const [existing] = await tx
        .select({ id: countries.id })
        .from(countries)
        .where(
          and(
            eq(countries.organizationId, tenantId),
            eq(countries.iso2, dto.iso2.trim().toUpperCase())
          )
        );

      if (existing) {
        throw new ConflictException(`Country with ISO-2 code '${dto.iso2}' already exists.`);
      }

      // Resolve sort order
      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${countries.sortOrder}), 0)` })
          .from(countries)
          .where(eq(countries.organizationId, tenantId));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(countries)
        .values({
          organizationId: tenantId,
          name: dto.name.trim(),
          iso2: dto.iso2.trim().toUpperCase(),
          iso3: dto.iso3 ? dto.iso3.trim().toUpperCase() : null,
          numericCode: dto.numericCode?.trim() ?? null,
          dialCode: dto.dialCode?.trim() ?? null,
          currencyCode: dto.currencyCode?.trim().toUpperCase() ?? null,
          currencySymbol: dto.currencySymbol?.trim() ?? null,
          nationality: dto.nationality?.trim() ?? null,
          sortOrder: resolvedSortOrder,
          isActive: dto.isActive ?? true,
        })
        .returning();

      if (!created) {
        throw new BadRequestException('Failed to create country record');
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'country',
          entityId: created.id,
          afterState: created,
        },
        tx
      );

      return created;
    });
  }

  async updateCountry(
    tenantId: string,
    id: string,
    dto: UpdateCountryDto,
    actorUserId?: string
  ): Promise<CountryListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, id)));

      if (!existing) {
        throw new NotFoundException(`Country with ID '${id}' not found.`);
      }

      if (dto.iso2 && dto.iso2.trim().toUpperCase() !== existing.iso2) {
        const [duplicate] = await tx
          .select({ id: countries.id })
          .from(countries)
          .where(
            and(
              eq(countries.organizationId, tenantId),
              eq(countries.iso2, dto.iso2.trim().toUpperCase())
            )
          );
        if (duplicate) {
          throw new ConflictException(`Country with ISO-2 code '${dto.iso2}' already exists.`);
        }
      }

      const [updated] = await tx
        .update(countries)
        .set({
          name: dto.name ? dto.name.trim() : existing.name,
          iso2: dto.iso2 ? dto.iso2.trim().toUpperCase() : existing.iso2,
          iso3: dto.iso3 !== undefined ? (dto.iso3 ? dto.iso3.trim().toUpperCase() : null) : existing.iso3,
          numericCode: dto.numericCode !== undefined ? (dto.numericCode ? dto.numericCode.trim() : null) : existing.numericCode,
          dialCode: dto.dialCode !== undefined ? (dto.dialCode ? dto.dialCode.trim() : null) : existing.dialCode,
          currencyCode: dto.currencyCode !== undefined ? (dto.currencyCode ? dto.currencyCode.trim().toUpperCase() : null) : existing.currencyCode,
          currencySymbol: dto.currencySymbol !== undefined ? (dto.currencySymbol ? dto.currencySymbol.trim() : null) : existing.currencySymbol,
          nationality: dto.nationality !== undefined ? (dto.nationality ? dto.nationality.trim() : null) : existing.nationality,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, id)))
        .returning();

      if (!updated) {
        throw new NotFoundException(`Country with ID '${id}' not found.`);
      }

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'UPDATE',
          entityType: 'country',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      return updated;
    });
  }

  async toggleCountryStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<CountryListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, id)));

      if (!existing) {
        throw new NotFoundException(`Country with ID '${id}' not found.`);
      }

      const [updated] = await tx
        .update(countries)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'country',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      return updated!;
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. STATES / PROVINCES MASTER
  // ═════════════════════════════════════════════════════════════════

  async listStates(
    tenantId: string,
    countryId?: string,
    search?: string,
    status?: string
  ): Promise<StateListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: states.id,
          organizationId: states.organizationId,
          countryId: states.countryId,
          countryName: countries.name,
          countryIso2: countries.iso2,
          name: states.name,
          code: states.code,
          type: states.type,
          sortOrder: states.sortOrder,
          isActive: states.isActive,
          createdAt: states.createdAt,
          updatedAt: states.updatedAt,
        })
        .from(states)
        .innerJoin(countries, eq(states.countryId, countries.id))
        .where(
          and(
            eq(states.organizationId, tenantId),
            countryId && countryId !== 'ALL' ? eq(states.countryId, countryId) : undefined,
            status && status !== 'ALL' ? eq(states.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(states.name, `%${search}%`),
                  ilike(states.code, `%${search}%`),
                  ilike(countries.name, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(countries.name), asc(states.sortOrder), asc(states.name));

      return rows;
    });
  }

  async createState(
    tenantId: string,
    dto: CreateStateDto,
    actorUserId?: string
  ): Promise<StateListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      // Validate Country
      const [country] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, dto.countryId)));

      if (!country) {
        throw new NotFoundException(`Country with ID '${dto.countryId}' not found.`);
      }

      // Check Duplicate Name in Country
      const [existing] = await tx
        .select({ id: states.id })
        .from(states)
        .where(
          and(
            eq(states.organizationId, tenantId),
            eq(states.countryId, dto.countryId),
            ilike(states.name, dto.name.trim())
          )
        );

      if (existing) {
        throw new ConflictException(
          `State/Province '${dto.name}' already exists in ${country.name}.`
        );
      }

      // Sort Order
      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${states.sortOrder}), 0)` })
          .from(states)
          .where(and(eq(states.organizationId, tenantId), eq(states.countryId, dto.countryId)));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(states)
        .values({
          organizationId: tenantId,
          countryId: dto.countryId,
          name: dto.name.trim(),
          code: dto.code?.trim().toUpperCase() ?? null,
          type: dto.type?.trim() || 'Province',
          sortOrder: resolvedSortOrder,
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'state',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      return {
        ...created!,
        countryName: country.name,
        countryIso2: country.iso2,
      };
    });
  }

  async updateState(
    tenantId: string,
    id: string,
    dto: UpdateStateDto,
    actorUserId?: string
  ): Promise<StateListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(states)
        .where(and(eq(states.organizationId, tenantId), eq(states.id, id)));

      if (!existing) {
        throw new NotFoundException(`State/Province with ID '${id}' not found.`);
      }

      const targetCountryId = dto.countryId || existing.countryId;

      const [country] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, targetCountryId)));

      if (!country) {
        throw new NotFoundException(`Country with ID '${targetCountryId}' not found.`);
      }

      const [updated] = await tx
        .update(states)
        .set({
          countryId: targetCountryId,
          name: dto.name ? dto.name.trim() : existing.name,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          type: dto.type ? dto.type.trim() : existing.type,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(states.organizationId, tenantId), eq(states.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'UPDATE',
          entityType: 'state',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      return {
        ...updated!,
        countryName: country.name,
        countryIso2: country.iso2,
      };
    });
  }

  async toggleStateStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<StateListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(states)
        .where(and(eq(states.organizationId, tenantId), eq(states.id, id)));

      if (!existing) {
        throw new NotFoundException(`State/Province with ID '${id}' not found.`);
      }

      const [updated] = await tx
        .update(states)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(states.organizationId, tenantId), eq(states.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'state',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const [country] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, existing.countryId)));

      return {
        ...updated!,
        countryName: country?.name,
        countryIso2: country?.iso2,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. CITIES MASTER
  // ═════════════════════════════════════════════════════════════════

  async listCities(
    tenantId: string,
    countryId?: string,
    stateId?: string,
    search?: string,
    status?: string
  ): Promise<CityListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: cities.id,
          organizationId: cities.organizationId,
          countryId: cities.countryId,
          countryName: countries.name,
          stateId: cities.stateId,
          stateName: states.name,
          name: cities.name,
          code: cities.code,
          sortOrder: cities.sortOrder,
          isActive: cities.isActive,
          createdAt: cities.createdAt,
          updatedAt: cities.updatedAt,
        })
        .from(cities)
        .innerJoin(countries, eq(cities.countryId, countries.id))
        .innerJoin(states, eq(cities.stateId, states.id))
        .where(
          and(
            eq(cities.organizationId, tenantId),
            countryId && countryId !== 'ALL' ? eq(cities.countryId, countryId) : undefined,
            stateId && stateId !== 'ALL' ? eq(cities.stateId, stateId) : undefined,
            status && status !== 'ALL' ? eq(cities.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(cities.name, `%${search}%`),
                  ilike(cities.code, `%${search}%`),
                  ilike(states.name, `%${search}%`),
                  ilike(countries.name, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(countries.name), asc(states.name), asc(cities.sortOrder), asc(cities.name));

      return rows;
    });
  }

  async createCity(
    tenantId: string,
    dto: CreateCityDto,
    actorUserId?: string
  ): Promise<CityListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [country] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, dto.countryId)));
      if (!country) throw new NotFoundException(`Country '${dto.countryId}' not found.`);

      const [state] = await tx
        .select()
        .from(states)
        .where(and(eq(states.organizationId, tenantId), eq(states.id, dto.stateId)));
      if (!state) throw new NotFoundException(`State '${dto.stateId}' not found.`);

      // Duplicate check within state
      const [existing] = await tx
        .select({ id: cities.id })
        .from(cities)
        .where(
          and(
            eq(cities.organizationId, tenantId),
            eq(cities.stateId, dto.stateId),
            ilike(cities.name, dto.name.trim())
          )
        );

      if (existing) {
        throw new ConflictException(`City '${dto.name}' already exists in ${state.name}.`);
      }

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${cities.sortOrder}), 0)` })
          .from(cities)
          .where(and(eq(cities.organizationId, tenantId), eq(cities.stateId, dto.stateId)));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(cities)
        .values({
          organizationId: tenantId,
          countryId: dto.countryId,
          stateId: dto.stateId,
          name: dto.name.trim(),
          code: dto.code?.trim().toUpperCase() ?? null,
          sortOrder: resolvedSortOrder,
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'city',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      return {
        ...created!,
        countryName: country.name,
        stateName: state.name,
      };
    });
  }

  async updateCity(
    tenantId: string,
    id: string,
    dto: UpdateCityDto,
    actorUserId?: string
  ): Promise<CityListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(cities)
        .where(and(eq(cities.organizationId, tenantId), eq(cities.id, id)));

      if (!existing) throw new NotFoundException(`City with ID '${id}' not found.`);

      const targetCountryId = dto.countryId || existing.countryId;
      const targetStateId = dto.stateId || existing.stateId;

      const [country] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, targetCountryId)));
      const [state] = await tx
        .select()
        .from(states)
        .where(and(eq(states.organizationId, tenantId), eq(states.id, targetStateId)));

      const [updated] = await tx
        .update(cities)
        .set({
          countryId: targetCountryId,
          stateId: targetStateId,
          name: dto.name ? dto.name.trim() : existing.name,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(cities.organizationId, tenantId), eq(cities.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'UPDATE',
          entityType: 'city',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      return {
        ...updated!,
        countryName: country?.name,
        stateName: state?.name,
      };
    });
  }

  async toggleCityStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<CityListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(cities)
        .where(and(eq(cities.organizationId, tenantId), eq(cities.id, id)));

      if (!existing) throw new NotFoundException(`City with ID '${id}' not found.`);

      const [updated] = await tx
        .update(cities)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(cities.organizationId, tenantId), eq(cities.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'city',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const [country] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, existing.countryId)));
      const [state] = await tx
        .select()
        .from(states)
        .where(and(eq(states.organizationId, tenantId), eq(states.id, existing.stateId)));

      return {
        ...updated!,
        countryName: country?.name,
        stateName: state?.name,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. AREAS / ZONES MASTER
  // ═════════════════════════════════════════════════════════════════

  async listAreas(
    tenantId: string,
    countryId?: string,
    stateId?: string,
    cityId?: string,
    search?: string,
    status?: string
  ): Promise<AreaListItemDto[]> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: areas.id,
          organizationId: areas.organizationId,
          countryId: areas.countryId,
          countryName: countries.name,
          stateId: areas.stateId,
          stateName: states.name,
          cityId: areas.cityId,
          cityName: cities.name,
          name: areas.name,
          code: areas.code,
          postalCode: areas.postalCode,
          sortOrder: areas.sortOrder,
          isActive: areas.isActive,
          createdAt: areas.createdAt,
          updatedAt: areas.updatedAt,
        })
        .from(areas)
        .innerJoin(countries, eq(areas.countryId, countries.id))
        .innerJoin(states, eq(areas.stateId, states.id))
        .innerJoin(cities, eq(areas.cityId, cities.id))
        .where(
          and(
            eq(areas.organizationId, tenantId),
            countryId && countryId !== 'ALL' ? eq(areas.countryId, countryId) : undefined,
            stateId && stateId !== 'ALL' ? eq(areas.stateId, stateId) : undefined,
            cityId && cityId !== 'ALL' ? eq(areas.cityId, cityId) : undefined,
            status && status !== 'ALL' ? eq(areas.isActive, status === 'ACTIVE') : undefined,
            search
              ? or(
                  ilike(areas.name, `%${search}%`),
                  ilike(areas.code, `%${search}%`),
                  ilike(areas.postalCode, `%${search}%`),
                  ilike(cities.name, `%${search}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(countries.name), asc(states.name), asc(cities.name), asc(areas.sortOrder), asc(areas.name));

      return rows;
    });
  }

  async createArea(
    tenantId: string,
    dto: CreateAreaDto,
    actorUserId?: string
  ): Promise<AreaListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [country] = await tx
        .select()
        .from(countries)
        .where(and(eq(countries.organizationId, tenantId), eq(countries.id, dto.countryId)));
      const [state] = await tx
        .select()
        .from(states)
        .where(and(eq(states.organizationId, tenantId), eq(states.id, dto.stateId)));
      const [city] = await tx
        .select()
        .from(cities)
        .where(and(eq(cities.organizationId, tenantId), eq(cities.id, dto.cityId)));

      if (!country || !state || !city) {
        throw new NotFoundException('Invalid geographic parent reference.');
      }

      const [existing] = await tx
        .select({ id: areas.id })
        .from(areas)
        .where(
          and(
            eq(areas.organizationId, tenantId),
            eq(areas.cityId, dto.cityId),
            ilike(areas.name, dto.name.trim())
          )
        );

      if (existing) {
        throw new ConflictException(`Area '${dto.name}' already exists in ${city.name}.`);
      }

      let resolvedSortOrder = dto.sortOrder;
      if (!resolvedSortOrder || resolvedSortOrder <= 0) {
        const [maxSort] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${areas.sortOrder}), 0)` })
          .from(areas)
          .where(and(eq(areas.organizationId, tenantId), eq(areas.cityId, dto.cityId)));
        resolvedSortOrder = (Number(maxSort?.maxOrder) || 0) + 1;
      }

      const [created] = await tx
        .insert(areas)
        .values({
          organizationId: tenantId,
          countryId: dto.countryId,
          stateId: dto.stateId,
          cityId: dto.cityId,
          name: dto.name.trim(),
          code: dto.code?.trim().toUpperCase() ?? null,
          postalCode: dto.postalCode?.trim() ?? null,
          sortOrder: resolvedSortOrder,
          isActive: dto.isActive ?? true,
        })
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'CREATE',
          entityType: 'area',
          entityId: created!.id,
          afterState: created,
        },
        tx
      );

      return {
        ...created!,
        countryName: country.name,
        stateName: state.name,
        cityName: city.name,
      };
    });
  }

  async updateArea(
    tenantId: string,
    id: string,
    dto: UpdateAreaDto,
    actorUserId?: string
  ): Promise<AreaListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(areas)
        .where(and(eq(areas.organizationId, tenantId), eq(areas.id, id)));

      if (!existing) throw new NotFoundException(`Area with ID '${id}' not found.`);

      const targetCountryId = dto.countryId || existing.countryId;
      const targetStateId = dto.stateId || existing.stateId;
      const targetCityId = dto.cityId || existing.cityId;

      const [country] = await tx.select().from(countries).where(and(eq(countries.organizationId, tenantId), eq(countries.id, targetCountryId)));
      const [state] = await tx.select().from(states).where(and(eq(states.organizationId, tenantId), eq(states.id, targetStateId)));
      const [city] = await tx.select().from(cities).where(and(eq(cities.organizationId, tenantId), eq(cities.id, targetCityId)));

      const [updated] = await tx
        .update(areas)
        .set({
          countryId: targetCountryId,
          stateId: targetStateId,
          cityId: targetCityId,
          name: dto.name ? dto.name.trim() : existing.name,
          code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : existing.code,
          postalCode: dto.postalCode !== undefined ? (dto.postalCode ? dto.postalCode.trim() : null) : existing.postalCode,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(areas.organizationId, tenantId), eq(areas.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'UPDATE',
          entityType: 'area',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      return {
        ...updated!,
        countryName: country?.name,
        stateName: state?.name,
        cityName: city?.name,
      };
    });
  }

  async toggleAreaStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    actorUserId?: string
  ): Promise<AreaListItemDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(areas)
        .where(and(eq(areas.organizationId, tenantId), eq(areas.id, id)));

      if (!existing) throw new NotFoundException(`Area with ID '${id}' not found.`);

      const [updated] = await tx
        .update(areas)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(areas.organizationId, tenantId), eq(areas.id, id)))
        .returning();

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'area',
          entityId: id,
          beforeState: existing,
          afterState: updated,
        },
        tx
      );

      const [country] = await tx.select().from(countries).where(and(eq(countries.organizationId, tenantId), eq(countries.id, existing.countryId)));
      const [state] = await tx.select().from(states).where(and(eq(states.organizationId, tenantId), eq(states.id, existing.stateId)));
      const [city] = await tx.select().from(cities).where(and(eq(cities.organizationId, tenantId), eq(cities.id, existing.cityId)));

      return {
        ...updated!,
        countryName: country?.name,
        stateName: state?.name,
        cityName: city?.name,
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 5. DEPENDENCY CHECKING & DEPENDENCY-SAFE DELETION
  // ═════════════════════════════════════════════════════════════════

  private async getCountryDependenciesWithTx(tx: any, tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    const [c] = await tx.select().from(countries).where(and(eq(countries.organizationId, tenantId), eq(countries.id, id)));
    if (!c) throw new NotFoundException(`Country with ID '${id}' not found.`);

    const [statesRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(states).where(eq(states.countryId, id));
    const [schoolsRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.countryId, id));
    const [branchesRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(branches).where(eq(branches.countryId, id));
    const [headOfficesRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(headOffices).where(eq(headOffices.countryId, id));
    const [regionsRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(regions).where(eq(regions.countryId, id));

    const statesCount = Number(statesRes?.count || 0);
    const schoolsCount = Number(schoolsRes?.count || 0);
    const branchesCount = Number(branchesRes?.count || 0);
    const headOfficesCount = Number(headOfficesRes?.count || 0);
    const regionsCount = Number(regionsRes?.count || 0);

    const totalDependencies = statesCount + schoolsCount + branchesCount + headOfficesCount + regionsCount;
    const reasons: string[] = [];
    if (statesCount > 0) reasons.push(`${statesCount} State(s)/Province(s) are linked to this country.`);
    if (schoolsCount > 0) reasons.push(`${schoolsCount} School(s) reference this country.`);
    if (branchesCount > 0) reasons.push(`${branchesCount} Branch(es) reference this country.`);
    if (headOfficesCount > 0) reasons.push(`${headOfficesCount} Head Office(s) reference this country.`);
    if (regionsCount > 0) reasons.push(`${regionsCount} Region(s) reference this country.`);

    return {
      canDelete: totalDependencies === 0,
      entityName: c.name,
      entityType: 'COUNTRY',
      totalDependencies,
      reasons,
      breakdown: {
        states: statesCount,
        schools: schoolsCount,
        branches: branchesCount,
        headOffices: headOfficesCount,
        regions: regionsCount,
      },
    };
  }

  async getCountryDependencies(tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this.getCountryDependenciesWithTx(tx, tenantId, id);
    });
  }

  async deleteCountry(tenantId: string, id: string, actorUserId?: string): Promise<{ success: boolean; message: string }> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const deps = await this.getCountryDependenciesWithTx(tx, tenantId, id);
      if (!deps.canDelete) {
        throw new BadRequestException(`Cannot delete country '${deps.entityName}'. Active dependencies exist:\n${deps.reasons.join('\n')}`);
      }

      const [existing] = await tx.select().from(countries).where(and(eq(countries.organizationId, tenantId), eq(countries.id, id)));
      if (!existing) throw new NotFoundException(`Country with ID '${id}' not found.`);

      await tx.delete(countries).where(and(eq(countries.organizationId, tenantId), eq(countries.id, id)));

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'DELETE',
          entityType: 'country',
          entityId: id,
          beforeState: existing,
        },
        tx
      );

      return { success: true, message: `Country '${existing.name}' deleted successfully.` };
    });
  }

  private async getStateDependenciesWithTx(tx: any, tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    const [s] = await tx.select().from(states).where(and(eq(states.organizationId, tenantId), eq(states.id, id)));
    if (!s) throw new NotFoundException(`State with ID '${id}' not found.`);

    const [citiesRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(cities).where(eq(cities.stateId, id));
    const [schoolsRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.stateId, id));
    const [branchesRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(branches).where(eq(branches.stateId, id));

    const citiesCount = Number(citiesRes?.count || 0);
    const schoolsCount = Number(schoolsRes?.count || 0);
    const branchesCount = Number(branchesRes?.count || 0);

    const totalDependencies = citiesCount + schoolsCount + branchesCount;
    const reasons: string[] = [];
    if (citiesCount > 0) reasons.push(`${citiesCount} City/Cities belong to this state/province.`);
    if (schoolsCount > 0) reasons.push(`${schoolsCount} School(s) reference this state/province.`);
    if (branchesCount > 0) reasons.push(`${branchesCount} Branch(es) reference this state/province.`);

    return {
      canDelete: totalDependencies === 0,
      entityName: s.name,
      entityType: 'STATE',
      totalDependencies,
      reasons,
      breakdown: {
        cities: citiesCount,
        schools: schoolsCount,
        branches: branchesCount,
      },
    };
  }

  async getStateDependencies(tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this.getStateDependenciesWithTx(tx, tenantId, id);
    });
  }

  async deleteState(tenantId: string, id: string, actorUserId?: string): Promise<{ success: boolean; message: string }> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const deps = await this.getStateDependenciesWithTx(tx, tenantId, id);
      if (!deps.canDelete) {
        throw new BadRequestException(`Cannot delete state/province '${deps.entityName}'. Active dependencies exist:\n${deps.reasons.join('\n')}`);
      }

      const [existing] = await tx.select().from(states).where(and(eq(states.organizationId, tenantId), eq(states.id, id)));
      if (!existing) throw new NotFoundException(`State with ID '${id}' not found.`);

      await tx.delete(states).where(and(eq(states.organizationId, tenantId), eq(states.id, id)));

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'DELETE',
          entityType: 'state',
          entityId: id,
          beforeState: existing,
        },
        tx
      );

      return { success: true, message: `State/Province '${existing.name}' deleted successfully.` };
    });
  }

  private async getCityDependenciesWithTx(tx: any, tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    const [c] = await tx.select().from(cities).where(and(eq(cities.organizationId, tenantId), eq(cities.id, id)));
    if (!c) throw new NotFoundException(`City with ID '${id}' not found.`);

    const [areasRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(areas).where(eq(areas.cityId, id));
    const [schoolsRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.cityId, id));
    const [branchesRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(branches).where(eq(branches.cityId, id));

    const areasCount = Number(areasRes?.count || 0);
    const schoolsCount = Number(schoolsRes?.count || 0);
    const branchesCount = Number(branchesRes?.count || 0);

    const totalDependencies = areasCount + schoolsCount + branchesCount;
    const reasons: string[] = [];
    if (areasCount > 0) reasons.push(`${areasCount} Area(s)/Zone(s) belong to this city.`);
    if (schoolsCount > 0) reasons.push(`${schoolsCount} School(s) reference this city.`);
    if (branchesCount > 0) reasons.push(`${branchesCount} Branch(es) reference this city.`);

    return {
      canDelete: totalDependencies === 0,
      entityName: c.name,
      entityType: 'CITY',
      totalDependencies,
      reasons,
      breakdown: {
        areas: areasCount,
        schools: schoolsCount,
        branches: branchesCount,
      },
    };
  }

  async getCityDependencies(tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this.getCityDependenciesWithTx(tx, tenantId, id);
    });
  }

  async deleteCity(tenantId: string, id: string, actorUserId?: string): Promise<{ success: boolean; message: string }> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const deps = await this.getCityDependenciesWithTx(tx, tenantId, id);
      if (!deps.canDelete) {
        throw new BadRequestException(`Cannot delete city '${deps.entityName}'. Active dependencies exist:\n${deps.reasons.join('\n')}`);
      }

      const [existing] = await tx.select().from(cities).where(and(eq(cities.organizationId, tenantId), eq(cities.id, id)));
      if (!existing) throw new NotFoundException(`City with ID '${id}' not found.`);

      await tx.delete(cities).where(and(eq(cities.organizationId, tenantId), eq(cities.id, id)));

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'DELETE',
          entityType: 'city',
          entityId: id,
          beforeState: existing,
        },
        tx
      );

      return { success: true, message: `City '${existing.name}' deleted successfully.` };
    });
  }

  private async getAreaDependenciesWithTx(tx: any, tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    const [a] = await tx.select().from(areas).where(and(eq(areas.organizationId, tenantId), eq(areas.id, id)));
    if (!a) throw new NotFoundException(`Area with ID '${id}' not found.`);

    const [schoolsRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.areaId, id));
    const [branchesRes] = await tx.select({ count: sql<number>`COUNT(*)` }).from(branches).where(eq(branches.areaId, id));

    const schoolsCount = Number(schoolsRes?.count || 0);
    const branchesCount = Number(branchesRes?.count || 0);

    const totalDependencies = schoolsCount + branchesCount;
    const reasons: string[] = [];
    if (schoolsCount > 0) reasons.push(`${schoolsCount} School(s) reference this area.`);
    if (branchesCount > 0) reasons.push(`${branchesCount} Branch(es) reference this area.`);

    return {
      canDelete: totalDependencies === 0,
      entityName: a.name,
      entityType: 'AREA',
      totalDependencies,
      reasons,
      breakdown: {
        schools: schoolsCount,
        branches: branchesCount,
      },
    };
  }

  async getAreaDependencies(tenantId: string, id: string): Promise<GeographyDependenciesDto> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      return this.getAreaDependenciesWithTx(tx, tenantId, id);
    });
  }

  async deleteArea(tenantId: string, id: string, actorUserId?: string): Promise<{ success: boolean; message: string }> {
    return this.txManager.runInTenantContext(tenantId, async (tx) => {
      const deps = await this.getAreaDependenciesWithTx(tx, tenantId, id);
      if (!deps.canDelete) {
        throw new BadRequestException(`Cannot delete area '${deps.entityName}'. Active dependencies exist:\n${deps.reasons.join('\n')}`);
      }

      const [existing] = await tx.select().from(areas).where(and(eq(areas.organizationId, tenantId), eq(areas.id, id)));
      if (!existing) throw new NotFoundException(`Area with ID '${id}' not found.`);

      await tx.delete(areas).where(and(eq(areas.organizationId, tenantId), eq(areas.id, id)));

      await this.auditService.logEvent(
        {
          organizationId: tenantId,
          actorId: actorUserId ?? null,
          actorEmail: actorUserId ? 'admin@campus-os.local' : 'system@campus-os.local',
          module: 'ORGANIZATION',
          action: 'DELETE',
          entityType: 'area',
          entityId: id,
          beforeState: existing,
        },
        tx
      );

      return { success: true, message: `Area '${existing.name}' deleted successfully.` };
    });
  }
}
