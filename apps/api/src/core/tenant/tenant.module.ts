import { Module, Global, OnApplicationShutdown } from '@nestjs/common';
import { TenantService } from './tenant.service.js';
import { TenantController } from './tenant.controller.js';
import { TenantTransactionManager, createTenantManager, closeSharedDatabase } from '@campus-os/database';
import { IamModule } from '../iam/iam.module.js';

@Global()
@Module({
  imports: [IamModule],
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
export class TenantModule implements OnApplicationShutdown {
  async onApplicationShutdown(_signal?: string): Promise<void> {
    await closeSharedDatabase();
  }
}

