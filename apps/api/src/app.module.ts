import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantModule } from './core/tenant/tenant.module.js';
import { TenantMiddleware } from './core/tenant/tenant.middleware.js';
import { IamModule } from './core/iam/iam.module.js';
import { HierarchyModule } from './core/hierarchy/hierarchy.module.js';
import { AuditModule } from './core/audit/audit.module.js';
import { EntitiesModule } from './core/entities/entities.module.js';
import { FormsModule } from './core/forms/forms.module.js';
import { WorkflowsModule } from './core/workflows/workflows.module.js';
import { NavigationModule } from './core/navigation/navigation.module.js';
import { ModulesModule } from './core/modules/modules.module.js';
import { AccountingModule } from './core/accounting/accounting.module.js';
import { DashboardEngineModule } from './core/dashboard-engine/dashboard-engine.module.js';
import { ReportEngineModule } from './core/report-engine/report-engine.module.js';
import { NotificationModule } from './core/notification/notification.module.js';
import { SchoolsModule } from './modules/schools/schools.module.js';
import { RegionsModule } from './modules/regions/regions.module.js';
import { SchoolTypesModule } from './modules/school-types/school-types.module.js';
import { HeadOfficesModule } from './modules/head-offices/head-offices.module.js';
import { BranchesModule } from './modules/branches/branches.module.js';
import { GeographyModule } from './modules/geography/geography.module.js';
import { AcademicModule } from './modules/academic/academic.module.js';
import { FormsSetupModule } from './modules/forms/forms.module.js';
import { AdmissionsModule } from './modules/admissions/admissions.module.js';

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
    EntitiesModule,
    FormsModule,
    WorkflowsModule,
    NavigationModule,
    ModulesModule,
    AccountingModule,
    DashboardEngineModule,
    ReportEngineModule,
    NotificationModule,
    SchoolsModule,
    RegionsModule,
    SchoolTypesModule,
    HeadOfficesModule,
    BranchesModule,
    GeographyModule,
    AcademicModule,
    FormsSetupModule,
    AdmissionsModule,
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
