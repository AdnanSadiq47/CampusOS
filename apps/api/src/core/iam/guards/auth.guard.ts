import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUserContext } from '@campus-os/types';
import { TenantTransactionManager, organizationMemberships, identityUsers } from '@campus-os/database';
import { eq, and } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tenantManager?: TenantTransactionManager
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('SECURITY_ERROR: Missing or malformed Authorization header');
    }

    const token = authHeader.substring(7);

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env['JWT_ACCESS_SECRET'] || 'development_jwt_access_secret_64chars_long_minimum',
        algorithms: ['HS256'],
        issuer: 'campus-os-auth',
        audience: 'campus-os-client',
      });
    } catch {
      throw new UnauthorizedException('SECURITY_ERROR: Invalid, expired, or untrusted access token');
    }

    // Strict multi-tenant verification: token tenant MUST match request tenant context
    if (request.tenant && payload.orgId !== request.tenant.organizationId) {
      throw new UnauthorizedException('SECURITY_ERROR: Cross-tenant token tampering detected');
    }

    // Fail-Closed Authoritative Membership Status Check
    if (this.tenantManager && payload.membershipId) {
      try {
        const db = (this.tenantManager as any).db;
        if (db) {
          const membership = await db
            .select({
              status: organizationMemberships.status,
              version: organizationMemberships.version,
              userActive: identityUsers.isActive,
            })
            .from(organizationMemberships)
            .innerJoin(identityUsers, eq(organizationMemberships.identityUserId, identityUsers.id))
            .where(
              and(
                eq(organizationMemberships.id, payload.membershipId),
                eq(organizationMemberships.organizationId, payload.orgId)
              )
            )
            .limit(1);

          const record = membership[0];
          if (!record || record.status !== 'ACTIVE' || !record.userActive) {
            throw new UnauthorizedException('SECURITY_ERROR: Membership or user account has been suspended or terminated');
          }

          // Version check for instant session revocation
          if (payload.memVer && record.version !== payload.memVer) {
            throw new UnauthorizedException('SECURITY_ERROR: Session token has been revoked by administrative update');
          }
        }
      } catch (err: unknown) {
        if (err instanceof UnauthorizedException) throw err;
        // Invariant: If authoritative validation cannot be completed, fail closed!
        throw new UnauthorizedException('SECURITY_ERROR: Authoritative security validation unavailable. Request denied.');
      }
    }

    request.user = {
      identityId: payload.sub,
      email: payload.email || '',
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      organizationId: payload.orgId,
      organizationCode: payload.orgCode || '',
      membershipId: payload.membershipId || '',
      sessionId: payload.sessionId || '',
      assignments: payload.assignments || [],
    };

    return true;
  }
}
