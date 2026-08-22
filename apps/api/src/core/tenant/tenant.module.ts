import { Module, Global } from '@nestjs/common';
import { TenantService } from './tenant.service.js';
import { TenantController } from './tenant.controller.js';
import { TenantTransactionManager, createTenantManager } from '@campus-os/database';

@Global()
@Module({
  controllers: [TenantController],
  providers: [
    {
      provide: TenantTransactionManager,
      useFactory: () => createTenantManager(),
    },
    TenantService,
  ],
  exports: [TenantTransactionManager, TenantService],
})
export class TenantModule {}
