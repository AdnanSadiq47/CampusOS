import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NavigationService } from './navigation.service.js';
import { AuthGuard } from '../iam/guards/auth.guard.js';
import { CreateNavigationMenuDto, CreateNavigationItemDto } from '@campus-os/types';

interface AuthenticatedRequest {
  user: {
    sub: string;
    orgId: string;
  };
}

@UseGuards(AuthGuard)
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Post('menus')
  async createMenu(@Req() req: AuthenticatedRequest, @Body() dto: CreateNavigationMenuDto) {
    return this.navigationService.createMenu(req.user.orgId, dto);
  }

  @Post('menus/:id/items')
  async addItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') menuId: string,
    @Body() dto: CreateNavigationItemDto
  ) {
    return this.navigationService.addItem(req.user.orgId, menuId, dto);
  }

  @Get('active-tree')
  async getActiveTree(@Req() req: AuthenticatedRequest, @Query('menuCode') menuCode?: string) {
    return this.navigationService.getActiveTree(req.user.orgId, menuCode ?? 'main_sidebar');
  }
}
