import { z } from 'zod';

export const TenantContextSchema = z.object({
  organizationId: z.string().uuid(),
  organizationCode: z.string(),
  organizationName: z.string(),
  primaryCurrency: z.string().default('USD'),
  domain: z.string().optional(),
  settings: z.record(z.unknown()).default({}),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;

export interface OrganizationDTO {
  id: string;
  code: string;
  name: string;
  legalName?: string | null;
  taxIdentifier?: string | null;
  primaryCurrency: string;
  domain?: string | null;
  logoUrl?: string | null;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
