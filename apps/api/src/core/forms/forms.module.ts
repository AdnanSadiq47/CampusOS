import { Module } from '@nestjs/common';
import { FormsService } from './forms.service.js';
import { FormsController } from './forms.controller.js';
import { IamModule } from '../iam/iam.module.js';

@Module({
  imports: [IamModule],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
