import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PasswordService } from './services/password.service.js';
import { AuthService } from './services/auth.service.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RbacGuard } from './guards/rbac.guard.js';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [PasswordService, AuthService, AuthGuard, RbacGuard],
  exports: [PasswordService, AuthService, AuthGuard, RbacGuard],
})
export class IamModule {}
