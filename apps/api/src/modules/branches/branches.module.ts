import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { BranchesController } from './branches.controller.js';
import { IamModule } from '../../core/iam/iam.module.js';

@Module({
  imports: [IamModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
