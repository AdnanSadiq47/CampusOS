import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller.js';
import { AcademicService } from './academic.service.js';
import { AuditModule } from '../../core/audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [AcademicController],
  providers: [AcademicService],
  exports: [AcademicService],
})
export class AcademicModule {}
