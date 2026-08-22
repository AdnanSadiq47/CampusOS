import { describe, it, expect } from 'vitest';
import { PasswordService } from '../src/core/iam/services/password.service.js';
import { MfaCryptoService } from '../src/core/iam/services/mfa-crypto.service.js';
import { AuthGuard } from '../src/core/iam/guards/auth.guard.js';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('Auth, MFA & Multi-Tenant Security (Hardened Tests)', () => {
  const jwtService = new JwtService();
  const passwordService = new PasswordService();
  const mfaCryptoService = new MfaCryptoService();

  it('1. Argon2 password service hashes and verifies passwords correctly without exposing plaintext', async () => {
    const rawPassword = 'SuperSecretEnterprisePassword#2026';
    const hash = await passwordService.hash(rawPassword);

    expect(hash).toContain('$argon2id$');
    expect(hash).not.toContain(rawPassword);

    const isValid = await passwordService.verify(hash, rawPassword);
    expect(isValid).toBe(true);

    const isInvalid = await passwordService.verify(hash, 'WrongPassword#123');
    expect(isInvalid).toBe(false);
  });

  it('2. AES-256-GCM MFA encryption securely encrypts and decrypts TOTP secrets with random IV', () => {
    const totpSecret = 'JBSWY3DPEHPK3PXP';
    const encryptedPayload = mfaCryptoService.encrypt(totpSecret);

    expect(encryptedPayload.encrypted).toBeDefined();
    expect(encryptedPayload.iv.length).toBe(12); // 12-byte GCM nonce
    expect(encryptedPayload.encrypted.toString('utf8')).not.toContain(totpSecret);

    const decrypted = mfaCryptoService.decrypt(
      encryptedPayload.encrypted,
      encryptedPayload.iv,
      encryptedPayload.keyVersion
    );
    expect(decrypted).toBe(totpSecret);
  });

  it('3. AuthGuard blocks requests with missing or invalid Authorization header (Fail Closed)', async () => {
    const guard = new AuthGuard(jwtService);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('4. AuthGuard blocks Cross-Tenant Token Tampering (Tenant A token on Tenant B route)', async () => {
    const guard = new AuthGuard(jwtService);

    const tenantAId = '11111111-1111-1111-1111-111111111111';
    const tenantBId = '22222222-2222-2222-2222-222222222222';

    // Token generated for Tenant A
    const token = jwtService.sign(
      {
        sub: 'user-123',
        email: 'attacker@tenanta.com',
        orgId: tenantAId,
        orgCode: 'tenant_a',
        membershipId: 'mem-111',
        sessionId: 'sess-111',
      },
      {
        secret: 'development_jwt_access_secret_64chars_long_minimum',
        algorithm: 'HS256',
        issuer: 'campus-os-auth',
        audience: 'campus-os-client',
      }
    );

    // Request incoming on Tenant B route
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${token}`,
          },
          tenant: {
            organizationId: tenantBId,
            organizationCode: 'tenant_b',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(/Cross-tenant token tampering detected/);
  });

  it('5. Fallback Behavior: Redis unavailable -> falls back to authoritative PostgreSQL validation', async () => {
    // Mock tenant manager where db query returns valid active membership
    const mockTenantManager: any = {
      db: {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      status: 'ACTIVE',
                      version: 1,
                      userActive: true,
                    },
                  ]),
              }),
            }),
          }),
        }),
      },
    };

    const guard = new AuthGuard(jwtService, mockTenantManager);
    const tenantAId = '11111111-1111-1111-1111-111111111111';

    const token = jwtService.sign(
      {
        sub: 'user-123',
        email: 'user@tenanta.com',
        orgId: tenantAId,
        orgCode: 'tenant_a',
        membershipId: 'mem-111',
        sessionId: 'sess-111',
        memVer: 1,
      },
      {
        secret: 'development_jwt_access_secret_64chars_long_minimum',
        algorithm: 'HS256',
        issuer: 'campus-os-auth',
        audience: 'campus-os-client',
      }
    );

    const mockRequest: any = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      tenant: {
        organizationId: tenantAId,
        organizationCode: 'tenant_a',
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockRequest.user).toBeDefined();
  });

  it('6. Fail-Closed Invariant: Redis + PostgreSQL validation unavailable -> request is DENIED', async () => {
    // Mock tenant manager where db query throws error (DB network timeout / partition)
    const brokenTenantManager: any = {
      db: {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.reject(new Error('Database cluster connection timeout')),
              }),
            }),
          }),
        }),
      },
    };

    const guard = new AuthGuard(jwtService, brokenTenantManager);
    const tenantAId = '11111111-1111-1111-1111-111111111111';

    const token = jwtService.sign(
      {
        sub: 'user-123',
        email: 'user@tenanta.com',
        orgId: tenantAId,
        orgCode: 'tenant_a',
        membershipId: 'mem-111',
        sessionId: 'sess-111',
      },
      {
        secret: 'development_jwt_access_secret_64chars_long_minimum',
        algorithm: 'HS256',
        issuer: 'campus-os-auth',
        audience: 'campus-os-client',
      }
    );

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${token}`,
          },
          tenant: {
            organizationId: tenantAId,
            organizationCode: 'tenant_a',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    // Must fail closed with UnauthorizedException
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      /Authoritative security validation unavailable. Request denied/
    );
  });

  it('7. Membership Suspended/Terminated Invariant: AuthGuard immediately rejects token even if unexpired', async () => {
    // Mock tenant manager returning SUSPENDED membership
    const suspendedTenantManager: any = {
      db: {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      status: 'SUSPENDED',
                      version: 1,
                      userActive: true,
                    },
                  ]),
              }),
            }),
          }),
        }),
      },
    };

    const guard = new AuthGuard(jwtService, suspendedTenantManager);
    const tenantAId = '11111111-1111-1111-1111-111111111111';

    const token = jwtService.sign(
      {
        sub: 'user-123',
        email: 'user@tenanta.com',
        orgId: tenantAId,
        orgCode: 'tenant_a',
        membershipId: 'mem-111',
        sessionId: 'sess-111',
      },
      {
        secret: 'development_jwt_access_secret_64chars_long_minimum',
        algorithm: 'HS256',
        issuer: 'campus-os-auth',
        audience: 'campus-os-client',
      }
    );

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${token}`,
          },
          tenant: {
            organizationId: tenantAId,
            organizationCode: 'tenant_a',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      /Membership or user account has been suspended or terminated/
    );
  });
});
