import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator.js';
import { AuthService } from '../services/auth.service.js';
import { PermissionEvaluator } from '@campus-os/permissions';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no permission decorator is specified, allow through (AuthGuard still validates authentication)
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user || !request.tenant) {
      throw new ForbiddenException('SECURITY_ERROR: Deny by default. Missing user or tenant context');
    }

    const roleIds = user.assignments.flatMap((a) => (a.roles || []).map((r) => r.roleId));
    const rolePermissionsMap = await this.authService.getRolePermissionsMap(
      roleIds,
      request.tenant.organizationId
    );

    const evaluation = PermissionEvaluator.evaluate(
      {
        user,
        moduleCode: requiredPermission.module,
        entityCode: requiredPermission.entity,
        action: requiredPermission.action,
        record: request.body || undefined,
      },
      rolePermissionsMap
    );

    if (!evaluation.granted) {
      throw new ForbiddenException(
        `SECURITY_ERROR: Access Denied. Insufficient permissions for ${requiredPermission.action} on ${requiredPermission.entity}`
      );
    }

    return true;
  }
}
