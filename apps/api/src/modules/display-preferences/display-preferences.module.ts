import { Module } from '@nestjs/common';
import { DisplayPreferencesController } from './display-preferences.controller.js';
import { DisplayPreferencesService } from './display-preferences.service.js';
import { AuditModule } from '../../core/audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [DisplayPreferencesController],
  providers: [DisplayPreferencesService],
  exports: [DisplayPreferencesService],
})
export class DisplayPreferencesModule {}