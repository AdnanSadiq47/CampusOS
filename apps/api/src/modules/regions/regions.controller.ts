import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegionsService } from './regions.service.js';
import { CreateRegionDto, UpdateRegionDto } from '@campus-os/types';

// Temporary: extract tenantId from request header until auth middleware wires the JWT
const DEMO_TENANT = '11111111-1111-1111-1111-111111111111';
const DEMO_USER = '99999999-9999-9999-9999-999999999999';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  listRegions(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('parentId') parentId?: string
  ) {
    return this.regionsService.listRegions(DEMO_TENANT, { search, status, parentId });
  }

  @Get('parents')
  getEligibleParents() {
    return this.regionsService.getEligibleParents(DEMO_TENANT);
  }

  @Get(':id')
  getRegion(@Param('id', ParseUUIDPipe) id: string) {
    return this.regionsService.getRegion(DEMO_TENANT, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRegion(@Body() dto: CreateRegionDto) {
    return this.regionsService.createRegion(DEMO_TENANT, dto, DEMO_USER);
  }

  @Patch(':id')
  updateRegion(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRegionDto) {
    return this.regionsService.updateRegion(DEMO_TENANT, id, dto, DEMO_USER);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    return this.regionsService.toggleRegionStatus(DEMO_TENANT, id, isActive, DEMO_USER);
  }
}
