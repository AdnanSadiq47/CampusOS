import { SetMetadata } from '@nestjs/common';
import { ActionCode } from '@campus-os/types';

export interface RequiredPermission {
  module: string;
  entity: string;
  action: ActionCode;
}

export const PERMISSION_KEY = 'require_permission';
export const RequirePermission = (module: string, entity: string, action: ActionCode) =>
  SetMetadata(PERMISSION_KEY, { module, entity, action });
