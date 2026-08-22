import { Module } from '@nestjs/common';
import { HeadOfficesService } from './head-offices.service.js';
import { HeadOfficesController } from './head-offices.controller.js';

@Module({
  controllers: [HeadOfficesController],
  providers: [HeadOfficesService],
  exports: [HeadOfficesService],
})
export class HeadOfficesModule {}
