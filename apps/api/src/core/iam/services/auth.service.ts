import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantTransactionManager, users, roles, rolePermissions, userRoleAssignments } from '@campus-os/database';
import { eq, and } from 'drizzle-orm';
import { PasswordService } from './password.service.js';
import { AuthTokens, AuthUserContext, LoginCredentials, PermissionRuleDTO } from '@campus-os/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly tenantManager: TenantTransactionManager,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService
  ) {}

  async login(credentials: LoginCredentials, tenantId: string): Promise<{ tokens: AuthTokens; user: AuthUserContext }> {
    const { email, password } = credentials;

    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      // Find user in the tenant
      const user = await tx.query.users.findFirst({
        where: and(eq(users.organizationId, tenantId), eq(users.email, email)),
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid credentials or inactive account');
      }

      // Verify password
      const isPasswordValid = await this.passwordService.verify(user.passwordHash, password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Fetch user role assignments & nodes
      const assignments = await tx
        .select({
          id: userRoleAssignments.id,
          userId: userRoleAssignments.userId,
          roleId: userRoleAssignments.roleId,
          roleCode: roles.code,
          nodeId: userRoleAssignments.nodeId,
          createdAt: userRoleAssignments.createdAt,
        })
        .from(userRoleAssignments)
        .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
        .where(eq(userRoleAssignments.userId, user.id));

      const authUser: AuthUserContext = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: tenantId,
        organizationCode: credentials.organizationCode,
        assignments: assignments.map((a) => ({
          ...a,
          nodePath: '', // Will be hydrated
        })),
      };

      // Generate JWT Access & Refresh Tokens
      const payload = {
        sub: user.id,
        email: user.email,
        orgId: tenantId,
        orgCode: credentials.organizationCode,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: process.env['JWT_ACCESS_SECRET'] || 'development_jwt_access_secret_64chars_long_minimum',
        expiresIn: '15m',
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env['JWT_REFRESH_SECRET'] || 'development_jwt_refresh_secret_64chars_long_minimum',
        expiresIn: '7d',
      });

      return {
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 900,
        },
        user: authUser,
      };
    });
  }

  async getRolePermissionsMap(roleIds: string[], tenantId: string): Promise<Map<string, PermissionRuleDTO[]>> {
    const map = new Map<string, PermissionRuleDTO[]>();
    if (roleIds.length === 0) return map;

    await this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      for (const roleId of roleIds) {
        const perms = await tx.query.rolePermissions.findMany({
          where: eq(rolePermissions.roleId, roleId),
        });

        map.set(
          roleId,
          perms.map((p) => ({
            moduleCode: p.moduleCode,
            entityCode: p.entityCode,
            action: p.action as any,
            dataScope: p.dataScope as any,
            fieldRules: (p.fieldRules as any) || [],
          }))
        );
      }
    });

    return map;
  }
}
