import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service.js';
import { TenantContext } from '@campus-os/types';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

// Strict identifier whitelist: UUID or alphanumeric slug (2 to 64 chars)
const TENANT_IDENTIFIER_REGEX = /^[a-zA-Z0-9_-]{2,64}$/;

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // 1. Check header X-Organization-ID / X-Tenant-Code / x-tenant-id
    const headerOrg = req.headers['x-organization-id'] || req.headers['x-tenant-code'] || req.headers['x-tenant-id'];

    // 2. Or parse subdomain from Host header
    let identifier: string | undefined = typeof headerOrg === 'string' ? headerOrg.trim() : undefined;

    if (!identifier && req.headers.host) {
      const host = req.headers.host.split(':')[0]; // remove port
      const parts = host?.split('.') || [];
      if (parts.length > 2 && parts[0] && parts[0] !== 'www' && parts[0] !== 'api') {
        identifier = parts[0].trim();
      }
    }

    // Public/Health endpoints can bypass strict tenant header if not present
    if (!identifier) {
      if (req.path.startsWith('/health') || req.path === '/' || req.path.startsWith('/api/public')) {
        return next();
      }
      throw new BadRequestException('SECURITY_ERROR: Missing required X-Organization-ID header or valid subdomain');
    }

    // 3. Strict Input Validation (Prevents Header Injection / Malformed inputs)
    if (!TENANT_IDENTIFIER_REGEX.test(identifier)) {
      throw new BadRequestException('SECURITY_ERROR: Malformed or invalid tenant identifier format');
    }

    try {
      const tenantContext = await this.tenantService.resolveTenant(identifier);
      req.tenant = tenantContext;
      next();
    } catch (error) {
      next(error);
    }
  }
}
