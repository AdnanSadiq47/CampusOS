/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOCATION & GEOGRAPHY DTOs & TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── 1. COUNTRIES ─────────────────────────────────────────────────────────────

export interface CreateCountryDto {
  name: string;
  iso2: string;
  iso3?: string;
  numericCode?: string;
  dialCode?: string;
  currencyCode?: string;
  currencySymbol?: string;
  nationality?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCountryDto {
  name?: string;
  iso2?: string;
  iso3?: string;
  numericCode?: string;
  dialCode?: string;
  currencyCode?: string;
  currencySymbol?: string;
  nationality?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CountryListItemDto {
  id: string;
  organizationId: string;
  name: string;
  iso2: string;
  iso3?: string | null;
  numericCode?: string | null;
  dialCode?: string | null;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  nationality?: string | null;
  sortOrder: number;
  isActive: boolean;
  stateCount?: number;
  cityCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── 2. STATES / PROVINCES ────────────────────────────────────────────────────

export interface CreateStateDto {
  countryId: string;
  name: string;
  code?: string;
  type?: string; // State, Province, Territory, Region, Emirate, Governorate, Other
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateStateDto {
  countryId?: string;
  name?: string;
  code?: string;
  type?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface StateListItemDto {
  id: string;
  organizationId: string;
  countryId: string;
  countryName?: string;
  countryIso2?: string;
  name: string;
  code?: string | null;
  type: string;
  sortOrder: number;
  isActive: boolean;
  cityCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── 3. CITIES ────────────────────────────────────────────────────────────────

export interface CreateCityDto {
  countryId: string;
  stateId: string;
  name: string;
  code?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCityDto {
  countryId?: string;
  stateId?: string;
  name?: string;
  code?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CityListItemDto {
  id: string;
  organizationId: string;
  countryId: string;
  countryName?: string;
  stateId: string;
  stateName?: string;
  name: string;
  code?: string | null;
  sortOrder: number;
  isActive: boolean;
  areaCount?: number;
  postalCodeCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── 4. AREAS / ZONES ─────────────────────────────────────────────────────────

export interface CreateAreaDto {
  countryId: string;
  stateId: string;
  cityId: string;
  name: string;
  code?: string;
  postalCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateAreaDto {
  countryId?: string;
  stateId?: string;
  cityId?: string;
  name?: string;
  code?: string;
  postalCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AreaListItemDto {
  id: string;
  organizationId: string;
  countryId: string;
  countryName?: string;
  stateId: string;
  stateName?: string;
  cityId: string;
  cityName?: string;
  name: string;
  code?: string | null;
  postalCode?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 5. POSTAL CODES ──────────────────────────────────────────────────────────

export interface CreatePostalCodeDto {
  countryId: string;
  stateId?: string;
  cityId: string;
  areaId?: string;
  postalCode: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePostalCodeDto {
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  postalCode?: string;
  description?: string;
  isActive?: boolean;
}

export interface PostalCodeListItemDto {
  id: string;
  organizationId: string;
  countryId: string;
  countryName?: string;
  stateId?: string | null;
  stateName?: string | null;
  cityId: string;
  cityName?: string;
  areaId?: string | null;
  areaName?: string | null;
  postalCode: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
