import { Injectable, BadRequestException } from '@nestjs/common';
import { TenantTransactionManager, organizationModules, eq, and } from '@campus-os/database';
import { ModuleDeclaration, ToggleModuleDto } from '@campus-os/types';

@Injectable()
export class ModulesService {
  // Static registry of available pluggable domain modules
  private readonly availableModules = new Map<string, ModuleDeclaration>();

  constructor(private readonly txManager: TenantTransactionManager) {
    this.registerCoreModules();
  }

  private registerCoreModules() {
    this.registerModule({
      code: 'academic_core',
      name: 'Academic Core Management',
      version: '1.0.0',
      description: 'Configurable academic programs, terms, course catalogs, and class sections',
      category: 'ACADEMIC',
    });

    this.registerModule({
      code: 'fee_billing',
      name: 'Fee Billing & Collections',
      version: '1.0.0',
      description: 'Fee structures, invoices, challan generation, and ledger posting bridge',
      category: 'FINANCIAL',
      dependencies: ['academic_core'],
    });

    this.registerModule({
      code: 'admissions',
      name: 'Admissions & Enrollment Pipeline',
      version: '1.0.0',
      description: 'Online application forms, document verification workflows, and merit lists',
      category: 'ADMINISTRATIVE',
      dependencies: ['academic_core'],
    });
  }

  registerModule(manifest: ModuleDeclaration) {
    this.availableModules.set(manifest.code, manifest);
  }

  /**
   * List all available modules and their activation status for the tenant
   */
  async listModules(tenantId: string) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const activeModules = await tx
        .select()
        .from(organizationModules)
        .where(eq(organizationModules.organizationId, tenantId));

      const activeMap = new Map(activeModules.map((m) => [m.moduleCode, m]));

      return Array.from(this.availableModules.values()).map((mod) => {
        const orgMod = activeMap.get(mod.code);
        return {
          ...mod,
          isEnabled: orgMod?.isEnabled ?? false,
          activatedAt: orgMod?.activatedAt ?? null,
          settings: orgMod?.settings ?? {},
        };
      });
    });
  }

  /**
   * Toggle activation state of a module with dependency validation
   */
  async toggleModule(tenantId: string, dto: ToggleModuleDto, userId?: string) {
    const manifest = this.availableModules.get(dto.moduleCode);
    if (!manifest) {
      throw new BadRequestException(`Module '${dto.moduleCode}' is not a registered platform module`);
    }

    return this.txManager.withTenant(tenantId, async (tx) => {
      // If enabling, check prerequisites
      if (dto.isEnabled && manifest.dependencies && manifest.dependencies.length > 0) {
        const activeDependencies = await tx
          .select()
          .from(organizationModules)
          .where(and(eq(organizationModules.organizationId, tenantId), eq(organizationModules.isEnabled, true)));

        const activeCodes = new Set(activeDependencies.map((d) => d.moduleCode));
        for (const dep of manifest.dependencies) {
          if (!activeCodes.has(dep)) {
            const depManifest = this.availableModules.get(dep);
            throw new BadRequestException(
              `Cannot enable '${manifest.name}' because prerequisite module '${depManifest?.name ?? dep}' is not enabled`
            );
          }
        }
      }

      // Upsert module activation record (NEVER DELETES HISTORICAL DATA)
      const existing = await tx
        .select()
        .from(organizationModules)
        .where(and(eq(organizationModules.organizationId, tenantId), eq(organizationModules.moduleCode, dto.moduleCode)))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await tx
          .update(organizationModules)
          .set({
            isEnabled: dto.isEnabled,
            settings: (dto.settings ?? existing[0]?.settings ?? {}) as Record<string, unknown>,
            activatedAt: dto.isEnabled ? new Date() : existing[0]?.activatedAt,
            activatedBy: dto.isEnabled ? userId : existing[0]?.activatedBy,
            updatedAt: new Date(),
          })
          .where(eq(organizationModules.id, existing[0]!.id))
          .returning();

        return updated;
      }

      const [created] = await tx
        .insert(organizationModules)
        .values({
          organizationId: tenantId,
          moduleCode: dto.moduleCode,
          isEnabled: dto.isEnabled,
          settings: (dto.settings ?? {}) as Record<string, unknown>,
          activatedAt: dto.isEnabled ? new Date() : null,
          activatedBy: dto.isEnabled ? userId : null,
        })
        .returning();

      return created;
    });
  }
}
