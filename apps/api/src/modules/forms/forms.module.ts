import { Module } from '@nestjs/common';
import { FormsService } from './forms.service.js';
import { FormsController } from './forms.controller.js';
import { AuditModule } from '../../core/audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsSetupModule {}
