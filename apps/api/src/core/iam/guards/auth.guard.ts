import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUserContext } from '@campus-os/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

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
      });
    } catch {
      throw new UnauthorizedException('SECURITY_ERROR: Invalid or expired access token');
    }

    // Strict multi-tenant verification: token tenant must match request tenant
    if (request.tenant && payload.orgId !== request.tenant.organizationId) {
      throw new UnauthorizedException('SECURITY_ERROR: Cross-tenant token tampering detected');
    }

    request.user = {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      organizationId: payload.orgId,
      organizationCode: payload.orgCode,
      assignments: payload.assignments || [],
    };

    return true;
  }
}
