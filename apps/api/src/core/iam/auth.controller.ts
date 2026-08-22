import { Controller, Post, Body, Req, BadRequestException, Get, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './services/auth.service.js';
import { LoginCredentialsSchema } from '@campus-os/types';
import { AuthGuard } from './guards/auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown, @Req() req: Request) {
    const parseResult = LoginCredentialsSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException('Validation failed: ' + parseResult.error.message);
    }

    const tenantId = req.tenant?.organizationId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    return this.authService.login(parseResult.data, tenantId);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: unknown) {
    return user;
  }
}
