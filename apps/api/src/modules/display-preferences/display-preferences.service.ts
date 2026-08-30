import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  TenantTransactionManager,
  hierarchyNodes,
  schools,
  branches,
  eq,
  and,
  isNull,
} from '@campus-os/database';
import {
  SaveDisplayPreferencesDto,
  ResolvedDisplayPreferencesDto,
  CampusDisplayPreferences,
  resolveEffectiveDisplayPreferences,
  MobileDisplayFormat,
  LandlineDisplayFormat,
  CnicDisplayFormat,
} from '@campus-os/types';
import { AuditService } from '../../core/audit/audit.service.js';

const ALLOWED_MOBILE_FORMATS: MobileDisplayFormat[] = [
  '03XX-XXXXXXX',
  '03XXXXXXXXX',
  '+92 XXX XXXXXXX',
  'NATIONAL',
  'E164',
  'INTERNATIONAL',
];

const ALLOWED_LANDLINE_FORMATS: LandlineDisplayFormat[] = [
  '0XX-XXXXXXX',
  '0XX XXXXXXX',
  '0XX XXXXXXXX',
  '+92 XX XXXXXXXX',
  '+92 XX XXXXXXX',
  'DOMESTIC_HYPHEN',
  'DOMESTIC_SPACE',
  'INTERNATIONAL',
];

const ALLOWED_CNIC_FORMATS: CnicDisplayFormat[] = [
  'XXXXX-XXXXXXX-X',
  'XXXXXXXXXXXXX',
  'DASHED',
  'PLAIN',
];

/**
 * Detects any UUID-shaped string (8-4-4-4-12 hex digits).
 * Intentionally broader than strict RFC4122 to accommodate non-standard seed UUIDs
 * like aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa used in development/test data.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

@Injectable()
export class DisplayPreferencesService {
  constructor(
    private readonly txManager: TenantTransactionManager,
    private readonly auditService: AuditService
  ) {}

  /**
   * Internal resolver using existing transaction context to prevent nested transaction deadlocks.
   */
  private async resolvePreferencesWithTx(
    tx: any,
    orgId: string,
    query: { schoolId?: string; campusId?: string }
  ): Promise<ResolvedDisplayPreferencesDto> {
    let targetSchoolId = query.schoolId ? query.schoolId.trim() : null;

    if (targetSchoolId) {
      const schoolCondition = isUuid(targetSchoolId)
        ? eq(schools.id, targetSchoolId)
        : eq(schools.code, targetSchoolId);

      const [school] = await tx
        .select({ id: schools.id })
        .from(schools)
        .where(
          and(
            eq(schools.organizationId, orgId),
            schoolCondition
          )
        );
      if (school) {
        targetSchoolId = school.id;
      }
    }

    if (!targetSchoolId && query.campusId) {
      const campusIdentifier = query.campusId.trim();
      const branchCondition = isUuid(campusIdentifier)
        ? eq(branches.id, campusIdentifier)
        : eq(branches.code, campusIdentifier);

      const [branch] = await tx
        .select({ schoolId: branches.schoolId })
        .from(branches)
        .where(
          and(
            eq(branches.organizationId, orgId),
            branchCondition
          )
        );
      if (branch?.schoolId) {
        targetSchoolId = branch.schoolId;
      }
    }

    // 1. Organization Default
    let [rootNode] = await tx
      .select()
      .from(hierarchyNodes)
      .where(and(eq(hierarchyNodes.organizationId, orgId), isNull(hierarchyNodes.parentId)));

    if (!rootNode) {
      [rootNode] = await tx
        .select()
        .from(hierarchyNodes)
        .where(and(eq(hierarchyNodes.organizationId, orgId), eq(hierarchyNodes.code, 'HO-MAIN')));
    }

    let orgPrefRecord: CampusDisplayPreferences | null = null;
    if (rootNode?.metadata && typeof rootNode.metadata === 'object') {
      orgPrefRecord = (rootNode.metadata as any).displayPreferences || null;
    }

    const orgPrefs: CampusDisplayPreferences | null = orgPrefRecord
      ? {
          mobileFormat: orgPrefRecord.mobileFormat as MobileDisplayFormat,
          landlineFormat: orgPrefRecord.landlineFormat as LandlineDisplayFormat,
          cnicFormat: orgPrefRecord.cnicFormat as CnicDisplayFormat,
        }
      : null;

    // 2. Fetch all school overrides in the organization for client-side multi-context caching
    const allOrgSchools = await tx
      .select({
        id: schools.id,
        code: schools.code,
        hierarchyNodeId: schools.hierarchyNodeId,
      })
      .from(schools)
      .where(eq(schools.organizationId, orgId));

    const schoolOverridesMap: Record<string, CampusDisplayPreferences> = {};
    for (const s of allOrgSchools) {
      let sNode: any = null;
      if (s.hierarchyNodeId) {
        [sNode] = await tx
          .select({ metadata: hierarchyNodes.metadata })
          .from(hierarchyNodes)
          .where(and(eq(hierarchyNodes.organizationId, orgId), eq(hierarchyNodes.id, s.hierarchyNodeId)));
      }
      if (!sNode && s.code) {
        [sNode] = await tx
          .select({ metadata: hierarchyNodes.metadata })
          .from(hierarchyNodes)
          .where(and(eq(hierarchyNodes.organizationId, orgId), eq(hierarchyNodes.code, s.code)));
      }
      if (sNode?.metadata && typeof sNode.metadata === 'object') {
        const pref = (sNode.metadata as any).displayPreferences;
        if (pref && (pref.mobileFormat || pref.landlineFormat || pref.cnicFormat)) {
          const formattedPref: CampusDisplayPreferences = {
            mobileFormat: pref.mobileFormat as MobileDisplayFormat,
            landlineFormat: pref.landlineFormat as LandlineDisplayFormat,
            cnicFormat: pref.cnicFormat as CnicDisplayFormat,
          };
          schoolOverridesMap[s.id] = formattedPref;
          if (s.code) schoolOverridesMap[s.code] = formattedPref;
        }
      }
    }

    // 3. School Override for target school (if requested)
    let schoolPrefs: CampusDisplayPreferences | null = null;
    if (targetSchoolId && schoolOverridesMap[targetSchoolId]) {
      schoolPrefs = schoolOverridesMap[targetSchoolId] || null;
    } else if (targetSchoolId) {
      const schoolCondition = isUuid(targetSchoolId)
        ? eq(schools.id, targetSchoolId)
        : eq(schools.code, targetSchoolId);

      const [school] = await tx
        .select({
          id: schools.id,
          code: schools.code,
          hierarchyNodeId: schools.hierarchyNodeId,
        })
        .from(schools)
        .where(and(eq(schools.organizationId, orgId), schoolCondition));

      if (school) {
        let schoolNode: any = null;
        if (school.hierarchyNodeId) {
          [schoolNode] = await tx
            .select({ metadata: hierarchyNodes.metadata })
            .from(hierarchyNodes)
            .where(
              and(
                eq(hierarchyNodes.organizationId, orgId),
                eq(hierarchyNodes.id, school.hierarchyNodeId)
              )
            );
        }
        if (!schoolNode) {
          [schoolNode] = await tx
            .select({ metadata: hierarchyNodes.metadata })
            .from(hierarchyNodes)
            .where(
              and(
                eq(hierarchyNodes.organizationId, orgId),
                eq(hierarchyNodes.code, school.code)
              )
            );
        }

        if (schoolNode?.metadata && typeof schoolNode.metadata === 'object') {
          const pref = (schoolNode.metadata as any).displayPreferences;
          if (pref) {
            schoolPrefs = {
              mobileFormat: pref.mobileFormat as MobileDisplayFormat,
              landlineFormat: pref.landlineFormat as LandlineDisplayFormat,
              cnicFormat: pref.cnicFormat as CnicDisplayFormat,
            };
          }
        }
      }
    }

    const effective = resolveEffectiveDisplayPreferences(orgPrefs, schoolPrefs);

    let source: 'SCHOOL_OVERRIDE' | 'ORGANIZATION_DEFAULT' | 'SYSTEM_DEFAULT' = 'SYSTEM_DEFAULT';
    if (schoolPrefs && (schoolPrefs.mobileFormat || schoolPrefs.landlineFormat || schoolPrefs.cnicFormat)) {
      source = 'SCHOOL_OVERRIDE';
    } else if (orgPrefs && (orgPrefs.mobileFormat || orgPrefs.landlineFormat || orgPrefs.cnicFormat)) {
      source = 'ORGANIZATION_DEFAULT';
    }

    return {
      effective,
      organizationDefault: orgPrefs,
      schoolOverride: schoolPrefs,
      schoolOverrides: schoolOverridesMap,
      source,
      schoolId: targetSchoolId,
      organizationId: orgId,
    };
  }

  async getResolvedPreferences(
    orgId: string,
    query: { schoolId?: string; campusId?: string }
  ): Promise<ResolvedDisplayPreferencesDto> {
    return this.txManager.runInTenantContext(orgId, async (tx) => {
      return this.resolvePreferencesWithTx(tx, orgId, query);
    });
  }

  async savePreferences(
    orgId: string,
    dto: SaveDisplayPreferencesDto,
    userId = '99999999-9999-9999-9999-999999999999'
  ): Promise<ResolvedDisplayPreferencesDto> {
    if (dto.mobileFormat && !ALLOWED_MOBILE_FORMATS.includes(dto.mobileFormat)) {
      throw new BadRequestException(`Invalid mobileFormat: "${dto.mobileFormat}". Allowed: ${ALLOWED_MOBILE_FORMATS.join(', ')}`);
    }
    if (dto.landlineFormat && !ALLOWED_LANDLINE_FORMATS.includes(dto.landlineFormat)) {
      throw new BadRequestException(`Invalid landlineFormat: "${dto.landlineFormat}". Allowed: ${ALLOWED_LANDLINE_FORMATS.join(', ')}`);
    }
    if (dto.cnicFormat && !ALLOWED_CNIC_FORMATS.includes(dto.cnicFormat)) {
      throw new BadRequestException(`Invalid cnicFormat: "${dto.cnicFormat}". Allowed: ${ALLOWED_CNIC_FORMATS.join(', ')}`);
    }

    return this.txManager.runInTenantContext(orgId, async (tx) => {
      const rawTargetSchoolId = dto.schoolId ? dto.schoolId.trim() : null;

      if (rawTargetSchoolId) {
        const schoolCondition = isUuid(rawTargetSchoolId)
          ? eq(schools.id, rawTargetSchoolId)
          : eq(schools.code, rawTargetSchoolId);

        const [school] = await tx
          .select({
            id: schools.id,
            name: schools.name,
            code: schools.code,
            hierarchyNodeId: schools.hierarchyNodeId,
          })
          .from(schools)
          .where(
            and(
              eq(schools.organizationId, orgId),
              schoolCondition
            )
          );

        if (!school) {
          throw new NotFoundException(`School "${rawTargetSchoolId}" not found in organization "${orgId}".`);
        }

        const targetSchoolId = school.id;

        let targetNodeId: string | null = school.hierarchyNodeId;
        if (!targetNodeId) {
          const [matchingNode] = await tx
            .select({ id: hierarchyNodes.id })
            .from(hierarchyNodes)
            .where(and(eq(hierarchyNodes.organizationId, orgId), eq(hierarchyNodes.code, school.code)));
          targetNodeId = matchingNode?.id || null;
        }

        if (!targetNodeId) {
          throw new NotFoundException(`Hierarchy node for school "${school.name}" not found.`);
        }

        const validNodeId: string = targetNodeId;

        const [currNode] = await tx
          .select({ metadata: hierarchyNodes.metadata })
          .from(hierarchyNodes)
          .where(eq(hierarchyNodes.id, validNodeId));

        const currentMetadata = { ...((currNode?.metadata as Record<string, any>) || {}) };

        if (dto.useOrganizationDefault) {
          delete currentMetadata['displayPreferences'];
          await tx
            .update(hierarchyNodes)
            .set({
              metadata: currentMetadata,
              updatedAt: new Date(),
            })
            .where(eq(hierarchyNodes.id, validNodeId));

          await this.auditService.logEvent(
            {
              organizationId: orgId,
              actorId: userId,
              action: 'DISPLAY_PREFERENCES_RESET_TO_ORG',
              entityType: 'DISPLAY_PREFERENCES',
              entityId: targetSchoolId,
              module: 'ORGANIZATION',
              metadata: { message: `Reset display preferences for school "${school.name}" to Organization Default` },
            },
            tx
          );

          return this.resolvePreferencesWithTx(tx, orgId, { schoolId: targetSchoolId });
        }

        const existingSchoolPref = currentMetadata['displayPreferences'] || {};
        currentMetadata['displayPreferences'] = {
          ...existingSchoolPref,
          ...(dto.mobileFormat !== undefined ? { mobileFormat: dto.mobileFormat } : {}),
          ...(dto.landlineFormat !== undefined ? { landlineFormat: dto.landlineFormat } : {}),
          ...(dto.cnicFormat !== undefined ? { cnicFormat: dto.cnicFormat } : {}),
        };

        await tx
          .update(hierarchyNodes)
          .set({
            metadata: currentMetadata,
            updatedAt: new Date(),
          })
          .where(eq(hierarchyNodes.id, validNodeId));

        await this.auditService.logEvent(
          {
            organizationId: orgId,
            actorId: userId,
            action: 'DISPLAY_PREFERENCES_UPDATE',
            entityType: 'DISPLAY_PREFERENCES',
            entityId: targetSchoolId,
            module: 'ORGANIZATION',
            metadata: {
              targetLevel: 'SCHOOL_OVERRIDE',
              schoolId: targetSchoolId,
              mobileFormat: dto.mobileFormat,
              landlineFormat: dto.landlineFormat,
              cnicFormat: dto.cnicFormat,
            },
          },
          tx
        );

        return this.resolvePreferencesWithTx(tx, orgId, { schoolId: targetSchoolId });
      } else {
        let [targetNode] = await tx
          .select()
          .from(hierarchyNodes)
          .where(and(eq(hierarchyNodes.organizationId, orgId), isNull(hierarchyNodes.parentId)));

        if (!targetNode) {
          [targetNode] = await tx
            .select()
            .from(hierarchyNodes)
            .where(and(eq(hierarchyNodes.organizationId, orgId), eq(hierarchyNodes.code, 'HO-MAIN')));
        }

        if (!targetNode) {
          const [anyOrgNode] = await tx
            .select()
            .from(hierarchyNodes)
            .where(eq(hierarchyNodes.organizationId, orgId));
          targetNode = anyOrgNode;
        }

        if (!targetNode) {
          return {
            effective: {
              mobileFormat: dto.mobileFormat || '03XX-XXXXXXX',
              landlineFormat: dto.landlineFormat || '0XX-XXXXXXX',
              cnicFormat: dto.cnicFormat || 'XXXXX-XXXXXXX-X',
            },
            organizationDefault: null,
            schoolOverride: null,
            source: 'SYSTEM_DEFAULT',
            organizationId: orgId,
          };
        }

        const currentMetadata = { ...((targetNode.metadata as Record<string, any>) || {}) };
        const existingOrgPref = currentMetadata['displayPreferences'] || {};

        currentMetadata['displayPreferences'] = {
          ...existingOrgPref,
          ...(dto.mobileFormat !== undefined ? { mobileFormat: dto.mobileFormat } : {}),
          ...(dto.landlineFormat !== undefined ? { landlineFormat: dto.landlineFormat } : {}),
          ...(dto.cnicFormat !== undefined ? { cnicFormat: dto.cnicFormat } : {}),
        };

        await tx
          .update(hierarchyNodes)
          .set({
            metadata: currentMetadata,
            updatedAt: new Date(),
          })
          .where(eq(hierarchyNodes.id, targetNode.id));

        await this.auditService.logEvent(
          {
            organizationId: orgId,
            actorId: userId,
            action: 'DISPLAY_PREFERENCES_UPDATE',
            entityType: 'DISPLAY_PREFERENCES',
            entityId: orgId,
            module: 'ORGANIZATION',
            metadata: {
              targetLevel: 'ORGANIZATION_DEFAULT',
              mobileFormat: dto.mobileFormat,
              landlineFormat: dto.landlineFormat,
              cnicFormat: dto.cnicFormat,
            },
          },
          tx
        );

        return this.resolvePreferencesWithTx(tx, orgId, {});
      }
    });
  }
}
