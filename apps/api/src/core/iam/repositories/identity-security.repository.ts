import { Injectable } from '@nestjs/common';
import { TenantTransactionManager, identityUsers } from '@campus-os/database';
import { eq } from 'drizzle-orm';

export interface IdentitySecurityRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
  mfaSecretEncrypted?: Buffer | null;
  mfaSecretIv?: Buffer | null;
  mfaKeyVersion: number;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  securityStamp: string;
}

@Injectable()
export class IdentitySecurityRepository {
  constructor(private readonly tenantManager: TenantTransactionManager) {}

  /**
   * Dedicated security boundary method for authenticating a global identity.
   * Access to credential fields is strictly encapsulated here.
   */
  async findForAuthentication(email: string): Promise<IdentitySecurityRecord | null> {
    const db = (this.tenantManager as any).db;
    if (!db) return null;

    const result = await db
      .select({
        id: identityUsers.id,
        email: identityUsers.email,
        passwordHash: identityUsers.passwordHash,
        firstName: identityUsers.firstName,
        lastName: identityUsers.lastName,
        mfaEnabled: identityUsers.mfaEnabled,
        mfaSecretEncrypted: identityUsers.mfaSecretEncrypted,
        mfaSecretIv: identityUsers.mfaSecretIv,
        mfaKeyVersion: identityUsers.mfaKeyVersion,
        isActive: identityUsers.isActive,
        failedLoginAttempts: identityUsers.failedLoginAttempts,
        lockedUntil: identityUsers.lockedUntil,
        securityStamp: identityUsers.securityStamp,
      })
      .from(identityUsers)
      .where(eq(identityUsers.email, email.toLowerCase().trim()))
      .limit(1);

    const user = result[0];
    if (!user) return null;

    return {
      ...user,
      mfaSecretEncrypted: user.mfaSecretEncrypted ? Buffer.from(user.mfaSecretEncrypted) : null,
      mfaSecretIv: user.mfaSecretIv ? Buffer.from(user.mfaSecretIv) : null,
    };
  }

  async findById(id: string): Promise<{ id: string; email: string; isActive: boolean; securityStamp: string } | null> {
    const db = (this.tenantManager as any).db;
    if (!db) return null;

    const result = await db
      .select({
        id: identityUsers.id,
        email: identityUsers.email,
        isActive: identityUsers.isActive,
        securityStamp: identityUsers.securityStamp,
      })
      .from(identityUsers)
      .where(eq(identityUsers.id, id))
      .limit(1);

    return result[0] || null;
  }
}
