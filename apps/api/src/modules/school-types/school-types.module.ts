import { Module } from '@nestjs/common';
import { SchoolTypesService } from './school-types.service.js';
import { SchoolTypesController } from './school-types.controller.js';

@Module({
  controllers: [SchoolTypesController],
  providers: [SchoolTypesService],
  exports: [SchoolTypesService],
})
export class SchoolTypesModule {}
