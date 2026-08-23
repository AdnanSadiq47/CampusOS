import { Module } from '@nestjs/common';
import { GeographyController } from './geography.controller.js';
import { GeographyService } from './geography.service.js';
import { AuditModule } from '../../core/audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [GeographyController],
  providers: [GeographyService],
  exports: [GeographyService],
})
export class GeographyModule {}
