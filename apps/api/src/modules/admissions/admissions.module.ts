import { Module } from '@nestjs/common';
import { AdmissionsController } from './admissions.controller.js';
import { AdmissionsService } from './admissions.service.js';
import { AuditModule } from '../../core/audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
