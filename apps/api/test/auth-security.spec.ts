import { describe, it, expect } from 'vitest';
import { PasswordService } from '../src/core/iam/services/password.service.js';
import { AuthGuard } from '../src/core/iam/guards/auth.guard.js';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('Auth & Multi-Tenant Security (Negative Tests)', () => {
  const jwtService = new JwtService();
  const passwordService = new PasswordService();

  it('Argon2 password service hashes and verifies passwords correctly without exposing plaintext', async () => {
    const rawPassword = 'SuperSecretEnterprisePassword#2026';
    const hash = await passwordService.hash(rawPassword);

    expect(hash).toContain('$argon2id$');
    expect(hash).not.toContain(rawPassword);

    const isValid = await passwordService.verify(hash, rawPassword);
    expect(isValid).toBe(true);

    const isInvalid = await passwordService.verify(hash, 'WrongPassword#123');
    expect(isInvalid).toBe(false);
  });

  it('AuthGuard blocks requests with missing or invalid Authorization header (Fail Closed)', async () => {
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

  it('AuthGuard blocks Cross-Tenant Token Tampering (Tenant A token on Tenant B route)', async () => {
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
      },
      {
        secret: 'development_jwt_access_secret_64chars_long_minimum',
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

  it('AuthGuard permits valid token matching the target tenant', async () => {
    const guard = new AuthGuard(jwtService);
    const tenantAId = '11111111-1111-1111-1111-111111111111';

    const token = jwtService.sign(
      {
        sub: 'user-123',
        email: 'user@tenanta.com',
        orgId: tenantAId,
        orgCode: 'tenant_a',
      },
      {
        secret: 'development_jwt_access_secret_64chars_long_minimum',
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
    expect(mockRequest.user.userId).toBe('user-123');
    expect(mockRequest.user.organizationId).toBe(tenantAId);
  });
});
