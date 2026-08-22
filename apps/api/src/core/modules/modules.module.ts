import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service.js';
import { ModulesController } from './modules.controller.js';
import { IamModule } from '../iam/iam.module.js';

@Module({
  imports: [IamModule],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
