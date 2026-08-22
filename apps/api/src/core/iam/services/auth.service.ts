import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  TenantTransactionManager,
  organizationMemberships,
  membershipNodeAssignments,
  assignmentRoles,
  roles,
  rolePermissions,
  hierarchyNodes,
  organizations,
  eq,
  and,
  sql,
} from '@campus-os/database';
import { PasswordService } from './password.service.js';
import { IdentitySecurityRepository } from '../repositories/identity-security.repository.js';
import {
  AuthTokens,
  AuthUserContext,
  LoginCredentials,
  PermissionRuleDTO,
  MembershipNodeAssignmentDTO,
} from '@campus-os/types';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly tenantManager: TenantTransactionManager,
    private readonly passwordService: PasswordService,
    private readonly identityRepo: IdentitySecurityRepository,
    private readonly jwtService: JwtService
  ) {}

  async login(
    credentials: LoginCredentials,
    requestedOrgId?: string
  ): Promise<{
    tokens: AuthTokens;
    user: AuthUserContext;
    availableOrganizations: Array<{ organizationId: string; organizationCode: string; organizationName: string }>;
  }> {
    const { email, password } = credentials;

    // 1. Authenticate Global Identity
    const identity = await this.identityRepo.findForAuthentication(email);
    if (!identity || !identity.isActive) {
      throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    if (identity.lockedUntil && new Date(identity.lockedUntil) > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
    }

    const isPasswordValid = await this.passwordService.verify(identity.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Discover all active organization memberships for this identity
    const db = (this.tenantManager as any).db;
    const memberships = await db
      .select({
        membershipId: organizationMemberships.id,
        organizationId: organizationMemberships.organizationId,
        organizationCode: organizations.code,
        organizationName: organizations.name,
        status: organizationMemberships.status,
        validFrom: organizationMemberships.validFrom,
        validUntil: organizationMemberships.validUntil,
        version: organizationMemberships.version,
      })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMemberships.identityUserId, identity.id),
          eq(organizationMemberships.status, 'ACTIVE'),
          eq(organizations.isActive, true)
        )
      );

    if (memberships.length === 0) {
      throw new ForbiddenException('No active organization memberships found for this account.');
    }

    // 3. Resolve target organization (either requested or default to first active)
    let activeMembership = memberships[0];
    if (requestedOrgId) {
      const matched = memberships.find((m: any) => m.organizationId === requestedOrgId);
      if (!matched) {
        throw new ForbiddenException('Access denied: You do not have active membership in the requested organization.');
      }
      activeMembership = matched;
    }

    // 4. Resolve node assignments and roles in the active tenant context
    const tenantId = activeMembership.organizationId;
    const assignments = await this.resolveTenantAssignments(tenantId, activeMembership.membershipId);

    const sessionId = crypto.randomUUID();

    const authUser: AuthUserContext = {
      identityId: identity.id,
      email: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
      organizationId: tenantId,
      organizationCode: activeMembership.organizationCode,
      membershipId: activeMembership.membershipId,
      sessionId,
      assignments,
    };

    const tokens = this.issueTokens(
      identity.id,
      tenantId,
      activeMembership.organizationCode,
      activeMembership.membershipId,
      sessionId,
      identity.securityStamp,
      activeMembership.version
    );

    return {
      tokens,
      user: authUser,
      availableOrganizations: memberships.map((m: any) => ({
        organizationId: m.organizationId,
        organizationCode: m.organizationCode,
        organizationName: m.organizationName,
      })),
    };
  }

  async switchTenant(
    identityId: string,
    targetOrgId: string
  ): Promise<{ tokens: AuthTokens; user: AuthUserContext }> {
    const identity = await this.identityRepo.findById(identityId);
    if (!identity || !identity.isActive) {
      throw new UnauthorizedException('Invalid or inactive account');
    }

    const db = (this.tenantManager as any).db;
    const membershipResult = await db
      .select({
        membershipId: organizationMemberships.id,
        organizationId: organizationMemberships.organizationId,
        organizationCode: organizations.code,
        status: organizationMemberships.status,
        version: organizationMemberships.version,
      })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMemberships.identityUserId, identityId),
          eq(organizationMemberships.organizationId, targetOrgId),
          eq(organizationMemberships.status, 'ACTIVE'),
          eq(organizations.isActive, true)
        )
      )
      .limit(1);

    const membership = membershipResult[0];
    if (!membership) {
      throw new ForbiddenException('Access denied: You do not hold active membership in the target organization.');
    }

    const assignments = await this.resolveTenantAssignments(targetOrgId, membership.membershipId);
    const sessionId = crypto.randomUUID();

    const authUser: AuthUserContext = {
      identityId: identity.id,
      email: identity.email,
      firstName: '',
      lastName: '',
      organizationId: targetOrgId,
      organizationCode: membership.organizationCode,
      membershipId: membership.membershipId,
      sessionId,
      assignments,
    };

    const tokens = this.issueTokens(
      identity.id,
      targetOrgId,
      membership.organizationCode,
      membership.membershipId,
      sessionId,
      identity.securityStamp,
      membership.version
    );

    return { tokens, user: authUser };
  }

  private async resolveTenantAssignments(
    tenantId: string,
    membershipId: string
  ): Promise<MembershipNodeAssignmentDTO[]> {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      const rawAssignments = await tx
        .select({
          assignmentId: membershipNodeAssignments.id,
          organizationId: membershipNodeAssignments.organizationId,
          membershipId: membershipNodeAssignments.membershipId,
          hierarchyNodeId: membershipNodeAssignments.hierarchyNodeId,
          nodeCode: hierarchyNodes.code,
          nodeName: hierarchyNodes.name,
          nodePath: sql<string>`${hierarchyNodes.path}::text`,
          isPrimary: membershipNodeAssignments.isPrimary,
          status: membershipNodeAssignments.status,
          validFrom: membershipNodeAssignments.validFrom,
          validUntil: membershipNodeAssignments.validUntil,
          assignedBy: membershipNodeAssignments.assignedBy,
          createdAt: membershipNodeAssignments.createdAt,
          updatedAt: membershipNodeAssignments.updatedAt,
          roleId: roles.id,
          roleCode: roles.code,
          roleName: roles.name,
          arId: assignmentRoles.id,
          arCreatedAt: assignmentRoles.createdAt,
        })
        .from(membershipNodeAssignments)
        .innerJoin(hierarchyNodes, eq(membershipNodeAssignments.hierarchyNodeId, hierarchyNodes.id))
        .leftJoin(assignmentRoles, eq(membershipNodeAssignments.id, assignmentRoles.assignmentId))
        .leftJoin(roles, eq(assignmentRoles.roleId, roles.id))
        .where(
          and(
            eq(membershipNodeAssignments.organizationId, tenantId),
            eq(membershipNodeAssignments.membershipId, membershipId),
            eq(membershipNodeAssignments.status, 'ACTIVE')
          )
        );

      const assignmentMap = new Map<string, MembershipNodeAssignmentDTO>();

      for (const row of rawAssignments) {
        if (!assignmentMap.has(row.assignmentId)) {
          assignmentMap.set(row.assignmentId, {
            id: row.assignmentId,
            organizationId: row.organizationId,
            membershipId: row.membershipId,
            hierarchyNodeId: row.hierarchyNodeId,
            nodeCode: row.nodeCode,
            nodeName: row.nodeName,
            nodePath: row.nodePath,
            isPrimary: row.isPrimary,
            status: row.status as any,
            validFrom: row.validFrom,
            validUntil: row.validUntil,
            assignedBy: row.assignedBy,
            roles: [],
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          });
        }

        if (row.roleId && row.arId) {
          const item = assignmentMap.get(row.assignmentId)!;
          item.roles.push({
            id: row.arId,
            organizationId: row.organizationId,
            assignmentId: row.assignmentId,
            roleId: row.roleId,
            roleCode: row.roleCode || '',
            roleName: row.roleName || '',
            createdAt: row.arCreatedAt || new Date(),
          });
        }
      }

      return Array.from(assignmentMap.values());
    });
  }

  private issueTokens(
    identityId: string,
    orgId: string,
    orgCode: string,
    membershipId: string,
    sessionId: string,
    securityStamp: string,
    membershipVersion: number
  ): AuthTokens {
    const payload = {
      sub: identityId,
      orgId,
      orgCode,
      membershipId,
      sessionId,
      secStamp: securityStamp,
      memVer: membershipVersion,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_ACCESS_SECRET'] || 'development_jwt_access_secret_64chars_long_minimum',
      algorithm: 'HS256',
      issuer: 'campus-os-auth',
      audience: 'campus-os-client',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_REFRESH_SECRET'] || 'development_jwt_refresh_secret_64chars_long_minimum',
      algorithm: 'HS256',
      issuer: 'campus-os-auth',
      audience: 'campus-os-client',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
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
            effect: (p.effect as any) || 'ALLOW',
            dataScope: p.dataScope as any,
            fieldRules: (p.fieldRules as any) || [],
            conditions: (p.conditions as any) || {},
          }))
        );
      }
    });

    return map;
  }
}
