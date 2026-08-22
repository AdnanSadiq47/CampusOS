import { Module } from '@nestjs/common';
import { RegionsService } from './regions.service.js';
import { RegionsController } from './regions.controller.js';
import { DatabaseModule } from '../../core/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
