import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service.js';
import { PasswordService } from './services/password.service.js';
import { MfaCryptoService } from './services/mfa-crypto.service.js';
import { IdentitySecurityRepository } from './repositories/identity-security.repository.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RbacGuard } from './guards/rbac.guard.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env['JWT_ACCESS_SECRET'] || 'development_jwt_access_secret_64chars_long_minimum',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    MfaCryptoService,
    IdentitySecurityRepository,
    AuthGuard,
    RbacGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    MfaCryptoService,
    IdentitySecurityRepository,
    JwtModule,
    AuthGuard,
    RbacGuard,
  ],
})
export class IamModule {}
