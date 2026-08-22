import { Module } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service.js';
import { HierarchyController } from './hierarchy.controller.js';
import { IamModule } from '../iam/iam.module.js';

@Module({
  imports: [IamModule],
  controllers: [HierarchyController],
  providers: [HierarchyService],
  exports: [HierarchyService],
})
export class HierarchyModule {}
