import { Module } from '@nestjs/common';
import { EntitiesService } from './entities.service.js';
import { EntitiesController } from './entities.controller.js';
import { IamModule } from '../iam/iam.module.js';

@Module({
  imports: [IamModule],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
