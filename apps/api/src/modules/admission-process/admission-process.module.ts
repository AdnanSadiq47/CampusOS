import { Module } from '@nestjs/common';
import { AdmissionProcessController } from './admission-process.controller.js';
import { AdmissionProcessService } from './admission-process.service.js';

@Module({
  controllers: [AdmissionProcessController],
  providers: [AdmissionProcessService],
  exports: [AdmissionProcessService],
})
export class AdmissionProcessModule {}
