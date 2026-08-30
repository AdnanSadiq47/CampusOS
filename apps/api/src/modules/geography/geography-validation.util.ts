import { BadRequestException } from '@nestjs/common';
import { countries, states, cities, areas, eq } from '@campus-os/database';

export interface GeographyInput {
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  area?: string | null;
  postalCode?: string | null;
}

export interface ResolvedGeography {
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
  areaId: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  area: string | null;
  postalCode: string | null;
}

export async function validateAndResolveGeographyHierarchy(
  tx: any,
  input: GeographyInput
): Promise<ResolvedGeography> {
  let countryId = input.countryId?.trim() || null;
  let stateId = input.stateId?.trim() || null;
  let cityId = input.cityId?.trim() || null;
  let areaId = input.areaId?.trim() || null;

  let country = input.country?.trim() || null;
  let province = input.province?.trim() || null;
  let city = input.city?.trim() || null;
  let area = input.area?.trim() || null;
  let postalCode = input.postalCode?.trim() || null;

  let countryRecord: any = null;
  let stateRecord: any = null;
  let cityRecord: any = null;
  let areaRecord: any = null;

  // 1. Validate and resolve Area if provided
  if (areaId) {
    const [foundArea] = await tx
      .select()
      .from(areas)
      .where(eq(areas.id, areaId))
      .limit(1);

    if (!foundArea) {
      throw new BadRequestException(`Selected Area with ID '${areaId}' not found in canonical database.`);
    }
    areaRecord = foundArea;
    area = foundArea.name;
    if (foundArea.postalCode) {
      postalCode = foundArea.postalCode;
    }
    if (cityId && cityId !== foundArea.cityId) {
      throw new BadRequestException(`Selected Area '${foundArea.name}' does not belong to the selected City.`);
    }
    cityId = foundArea.cityId;
  }

  // 2. Validate and resolve City if provided
  if (cityId) {
    const [foundCity] = await tx
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (!foundCity) {
      throw new BadRequestException(`Selected City with ID '${cityId}' not found in canonical database.`);
    }
    cityRecord = foundCity;
    city = foundCity.name;

    if (stateId && stateId !== foundCity.stateId) {
      throw new BadRequestException(`Selected City '${foundCity.name}' does not belong to the selected State/Province.`);
    }
    stateId = foundCity.stateId;

    if (countryId && countryId !== foundCity.countryId) {
      throw new BadRequestException(`Selected City '${foundCity.name}' does not belong to the selected Country.`);
    }
    countryId = foundCity.countryId;
  }

  // 3. Validate and resolve State/Province if provided
  if (stateId) {
    const [foundState] = await tx
      .select()
      .from(states)
      .where(eq(states.id, stateId))
      .limit(1);

    if (!foundState) {
      throw new BadRequestException(`Selected State/Province with ID '${stateId}' not found in canonical database.`);
    }
    stateRecord = foundState;
    province = foundState.name;

    if (countryId && countryId !== foundState.countryId) {
      throw new BadRequestException(`Selected State '${foundState.name}' does not belong to the selected Country.`);
    }
    countryId = foundState.countryId;
  }

  // 4. Validate and resolve Country if provided
  if (countryId) {
    const [foundCountry] = await tx
      .select()
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);

    if (!foundCountry) {
      throw new BadRequestException(`Selected Country with ID '${countryId}' not found in canonical database.`);
    }
    countryRecord = foundCountry;
    country = foundCountry.name;
  }

  return {
    countryId,
    stateId,
    cityId,
    areaId,
    country: country || (countryRecord?.name ?? null),
    province: province || (stateRecord?.name ?? null),
    city: city || (cityRecord?.name ?? null),
    area: area || (areaRecord?.name ?? null),
    postalCode: postalCode || (areaRecord?.postalCode ?? null),
  };
}
