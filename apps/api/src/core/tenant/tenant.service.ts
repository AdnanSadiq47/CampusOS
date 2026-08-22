import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantTransactionManager, organizations } from '@campus-os/database';
import { eq } from 'drizzle-orm';
import { TenantContext } from '@campus-os/types';

@Injectable()
export class TenantService {
  constructor(private readonly tenantManager: TenantTransactionManager) {}

  async resolveTenant(identifier: string): Promise<TenantContext> {
    const db = this.tenantManager.getUnscopedDb();

    // Look up by subdomain/code or custom domain
    const org = await db.query.organizations.findFirst({
      where: (table, { or }) => or(eq(table.code, identifier), eq(table.domain, identifier), eq(table.id, identifier)),
    });

    if (!org || !org.isActive) {
      throw new NotFoundException(`Organization '${identifier}' not found or inactive`);
    }

    return {
      organizationId: org.id,
      organizationCode: org.code,
      organizationName: org.name,
      primaryCurrency: org.primaryCurrency,
      domain: org.domain || undefined,
      settings: (org.settings as Record<string, unknown>) || {},
    };
  }

  async getOrganizationDetails(tenantId: string) {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      const org = await tx.query.organizations.findFirst({
        where: eq(organizations.id, tenantId),
      });
      if (!org) throw new NotFoundException('Organization not found');
      return org;
    });
  }
}
