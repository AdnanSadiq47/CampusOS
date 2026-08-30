import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GeographyService } from './geography.service.js';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CreateStateDto,
  UpdateStateDto,
  CreateCityDto,
  UpdateCityDto,
  CreateAreaDto,
  UpdateAreaDto,
} from '@campus-os/types';

@Controller('geography')
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  // ── 1. COUNTRIES ─────────────────────────────────────────────────────────

  @Get('countries')
  async listCountries(
    @Headers('x-tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.listCountries(resolvedTenant, search, status);
  }

  @Get('countries/:id/dependencies')
  async getCountryDependencies(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.getCountryDependencies(resolvedTenant, id);
  }

  @Post('countries')
  async createCountry(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateCountryDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.createCountry(resolvedTenant, dto, userId);
  }

  @Patch('countries/:id')
  async updateCountry(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCountryDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.updateCountry(resolvedTenant, id, dto, userId);
  }

  @Patch('countries/:id/status')
  async toggleCountryStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.toggleCountryStatus(resolvedTenant, id, isActive, userId);
  }

  @Delete('countries/:id')
  async deleteCountry(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.deleteCountry(resolvedTenant, id, userId);
  }

  // ── 2. STATES / PROVINCES ────────────────────────────────────────────────

  @Get('states')
  async listStates(
    @Headers('x-tenant-id') tenantId: string,
    @Query('countryId') countryId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.listStates(resolvedTenant, countryId, search, status);
  }

  @Get('states/:id/dependencies')
  async getStateDependencies(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.getStateDependencies(resolvedTenant, id);
  }

  @Post('states')
  async createState(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateStateDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.createState(resolvedTenant, dto, userId);
  }

  @Patch('states/:id')
  async updateState(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStateDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.updateState(resolvedTenant, id, dto, userId);
  }

  @Patch('states/:id/status')
  async toggleStateStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.toggleStateStatus(resolvedTenant, id, isActive, userId);
  }

  @Delete('states/:id')
  async deleteState(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.deleteState(resolvedTenant, id, userId);
  }

  // ── 3. CITIES ────────────────────────────────────────────────────────────

  @Get('cities')
  async listCities(
    @Headers('x-tenant-id') tenantId: string,
    @Query('countryId') countryId?: string,
    @Query('stateId') stateId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.listCities(resolvedTenant, countryId, stateId, search, status);
  }

  @Get('cities/:id/dependencies')
  async getCityDependencies(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.getCityDependencies(resolvedTenant, id);
  }

  @Post('cities')
  async createCity(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateCityDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.createCity(resolvedTenant, dto, userId);
  }

  @Patch('cities/:id')
  async updateCity(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCityDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.updateCity(resolvedTenant, id, dto, userId);
  }

  @Patch('cities/:id/status')
  async toggleCityStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.toggleCityStatus(resolvedTenant, id, isActive, userId);
  }

  @Delete('cities/:id')
  async deleteCity(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.deleteCity(resolvedTenant, id, userId);
  }

  // ── 4. AREAS / ZONES ─────────────────────────────────────────────────────

  @Get('areas')
  async listAreas(
    @Headers('x-tenant-id') tenantId: string,
    @Query('countryId') countryId?: string,
    @Query('stateId') stateId?: string,
    @Query('cityId') cityId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.listAreas(resolvedTenant, countryId, stateId, cityId, search, status);
  }

  @Get('areas/:id/dependencies')
  async getAreaDependencies(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.getAreaDependencies(resolvedTenant, id);
  }

  @Post('areas')
  async createArea(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateAreaDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.createArea(resolvedTenant, dto, userId);
  }

  @Patch('areas/:id')
  async updateArea(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAreaDto
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.updateArea(resolvedTenant, id, dto, userId);
  }

  @Patch('areas/:id/status')
  async toggleAreaStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.toggleAreaStatus(resolvedTenant, id, isActive, userId);
  }

  @Delete('areas/:id')
  async deleteArea(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const resolvedTenant = tenantId || '11111111-1111-1111-1111-111111111111';
    return this.geographyService.deleteArea(resolvedTenant, id, userId);
  }
}

