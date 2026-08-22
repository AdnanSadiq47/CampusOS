import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserContext } from '@campus-os/types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserContext | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  }
);
