import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './services/auth.service.js';
import { LoginCredentialsSchema } from '@campus-os/types';
import { AuthGuard } from './guards/auth.guard.js';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown, @Req() req: Request) {
    const parseResult = LoginCredentialsSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.format());
    }

    const requestedOrgId = req.tenant?.organizationId;
    return this.authService.login(parseResult.data, requestedOrgId);
  }

  @Post('switch-tenant')
  @UseGuards(AuthGuard)
  async switchTenant(@Body() body: { targetOrganizationId: string }, @Req() req: Request) {
    if (!body.targetOrganizationId) {
      throw new BadRequestException('Missing targetOrganizationId');
    }

    if (!req.user) {
      throw new BadRequestException('Unauthenticated user context');
    }

    return this.authService.switchTenant(req.user.identityId, body.targetOrganizationId);
  }
}
