import { z } from 'zod';

export const IdentityUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional().nullable(),
  mfaEnabled: z.boolean().default(false),
  isActive: z.boolean().default(true),
  emailVerifiedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IdentityUserDTO = z.infer<typeof IdentityUserSchema>;

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  organizationCode: z.string().optional(),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

export interface MfaSecretPayload {
  secret: string;
  iv: string;
  keyVersion: number;
}
