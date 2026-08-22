import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ModulesService } from './modules.service.js';
import { AuthGuard } from '../iam/guards/auth.guard.js';
import { ToggleModuleDto } from '@campus-os/types';

interface AuthenticatedRequest {
  user: {
    sub: string;
    orgId: string;
  };
}

@UseGuards(AuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  async listModules(@Req() req: AuthenticatedRequest) {
    return this.modulesService.listModules(req.user.orgId);
  }

  @Post('toggle')
  async toggleModule(@Req() req: AuthenticatedRequest, @Body() dto: ToggleModuleDto) {
    return this.modulesService.toggleModule(req.user.orgId, dto, req.user.sub);
  }
}
