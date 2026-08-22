import { Module } from '@nestjs/common';
import { NavigationService } from './navigation.service.js';
import { NavigationController } from './navigation.controller.js';
import { IamModule } from '../iam/iam.module.js';

@Module({
  imports: [IamModule],
  controllers: [NavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
