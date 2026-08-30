import { Module, Global } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service.js';
import { HierarchyController } from './hierarchy.controller.js';
import { WorkingContextService } from './working-context.service.js';
import { IamModule } from '../iam/iam.module.js';

@Global()
@Module({
  imports: [IamModule],
  controllers: [HierarchyController],
  providers: [HierarchyService, WorkingContextService],
  exports: [HierarchyService, WorkingContextService],
})
export class HierarchyModule {}
