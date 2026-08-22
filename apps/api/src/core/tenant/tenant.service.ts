import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantTransactionManager, organizations } from '@campus-os/database';
import { TenantContext } from '@campus-os/types';
import { eq } from 'drizzle-orm';

@Injectable()
export class TenantService {
  constructor(private readonly tenantManager: TenantTransactionManager) {}

  async resolveTenant(identifier: string): Promise<TenantContext> {
    const tenant = await this.tenantManager.findTenantForResolution(identifier);

    if (!tenant) {
      throw new NotFoundException(`Tenant not found or inactive: ${identifier}`);
    }

    return tenant;
  }

  async getOrganizationDetails(tenantId: string) {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      const org = await tx.query.organizations.findFirst({
        where: eq(organizations.id, tenantId),
      });

      if (!org) {
        throw new NotFoundException(`Organization details not found: ${tenantId}`);
      }

      return org;
    });
  }
}
