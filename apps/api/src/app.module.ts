import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantModule } from './core/tenant/tenant.module.js';
import { TenantMiddleware } from './core/tenant/tenant.middleware.js';
import { IamModule } from './core/iam/iam.module.js';
import { HierarchyModule } from './core/hierarchy/hierarchy.module.js';
import { AuditModule } from './core/audit/audit.module.js';
import { EntityEngineModule } from './core/entity-engine/entity-engine.module.js';
import { FormEngineModule } from './core/form-engine/form-engine.module.js';
import { WorkflowEngineModule } from './core/workflow-engine/workflow-engine.module.js';
import { AccountingModule } from './core/accounting/accounting.module.js';
import { DashboardEngineModule } from './core/dashboard-engine/dashboard-engine.module.js';
import { ReportEngineModule } from './core/report-engine/report-engine.module.js';
import { NotificationModule } from './core/notification/notification.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TenantModule,
    IamModule,
    HierarchyModule,
    AuditModule,
    EntityEngineModule,
    FormEngineModule,
    WorkflowEngineModule,
    AccountingModule,
    DashboardEngineModule,
    ReportEngineModule,
    NotificationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply TenantMiddleware globally across all routes
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
