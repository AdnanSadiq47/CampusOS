'use client';

import React, { useState, useEffect } from 'react';
import {
  CountryListItemDto,
  StateListItemDto,
  CityListItemDto,
  AreaListItemDto,
} from '@campus-os/types';

const CANONICAL_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const CANONICAL_USER_ID = '99999999-9999-9999-9999-999999999999';

const AUTH_HEADERS = {
  'x-tenant-id': CANONICAL_TENANT_ID,
  'x-organization-id': CANONICAL_TENANT_ID,
  'x-user-id': CANONICAL_USER_ID,
};

export interface LocationSelectorProps {
  country?: string;
  countryId?: string;
  province?: string;
  stateId?: string;
  city?: string;
  cityId?: string;
  area?: string;
  areaId?: string;
  postalCode?: string;
  onCountryChange?: (country: string) => void;
  onCountryIdChange?: (countryId: string) => void;
  onProvinceChange?: (province: string) => void;
  onStateIdChange?: (stateId: string) => void;
  onCityChange?: (city: string) => void;
  onCityIdChange?: (cityId: string) => void;
  onAreaChange?: (area: string) => void;
  onAreaIdChange?: (areaId: string) => void;
  onPostalCodeChange?: (postalCode: string) => void;
  showAreaAndPostal?: boolean;
  className?: string;
}

export function GeographyLocationFields({
  country = 'Pakistan',
  countryId = '',
  province = '',
  stateId = '',
  city = '',
  cityId = '',
  area = '',
  areaId = '',
  postalCode = '',
  onCountryChange,
  onCountryIdChange,
  onProvinceChange,
  onStateIdChange,
  onCityChange,
  onCityIdChange,
  onAreaChange,
  onAreaIdChange,
  onPostalCodeChange,
  showAreaAndPostal = false,
}: LocationSelectorProps) {
  const [countriesList, setCountriesList] = useState<CountryListItemDto[]>([]);
  const [statesList, setStatesList] = useState<StateListItemDto[]>([]);
  const [citiesList, setCitiesList] = useState<CityListItemDto[]>([]);
  const [areasList, setAreasList] = useState<AreaListItemDto[]>([]);

  // 1. Fetch Countries on Mount
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('/api/geography/countries?status=ACTIVE', {
          headers: AUTH_HEADERS,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCountriesList(data);
          }
        }
      } catch (err) {
        console.error('Failed to load canonical countries:', err);
      }
    }
    fetchCountries();
  }, []);

  // Resolve current active country ID
  const selectedCountryObj = countriesList.find(
    (c) => (countryId && c.id === countryId) || (country && c.name.toLowerCase() === country.toLowerCase())
  );
  const activeCountryId = selectedCountryObj?.id || countryId;

  // 2. Fetch States when Country changes
  useEffect(() => {
    async function fetchStates() {
      if (!activeCountryId) {
        setStatesList([]);
        return;
      }
      try {
        const res = await fetch(`/api/geography/states?countryId=${activeCountryId}&status=ACTIVE`, {
          headers: AUTH_HEADERS,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setStatesList(data);
          }
        }
      } catch (err) {
        console.error('Failed to load canonical states:', err);
      }
    }
    fetchStates();
  }, [activeCountryId]);

  // Resolve current active state ID
  const selectedStateObj = statesList.find(
    (s) => (stateId && s.id === stateId) || (province && s.name.toLowerCase() === province.toLowerCase())
  );
  const activeStateId = selectedStateObj?.id || stateId;

  // 3. Fetch Cities when State changes
  useEffect(() => {
    async function fetchCities() {
      if (!activeCountryId) {
        setCitiesList([]);
        return;
      }
      const url = activeStateId
        ? `/api/geography/cities?countryId=${activeCountryId}&stateId=${activeStateId}&status=ACTIVE`
        : `/api/geography/cities?countryId=${activeCountryId}&status=ACTIVE`;

      try {
        const res = await fetch(url, { headers: AUTH_HEADERS });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCitiesList(data);
          }
        }
      } catch (err) {
        console.error('Failed to load canonical cities:', err);
      }
    }
    fetchCities();
  }, [activeCountryId, activeStateId]);

  // Resolve current active city ID
  const selectedCityObj = citiesList.find(
    (ct) => (cityId && ct.id === cityId) || (city && ct.name.toLowerCase() === city.toLowerCase())
  );
  const activeCityId = selectedCityObj?.id || cityId;

  // 4. Fetch Areas when City changes
  useEffect(() => {
    async function fetchAreas() {
      if (!activeCityId) {
        setAreasList([]);
        return;
      }
      try {
        const res = await fetch(`/api/geography/areas?cityId=${activeCityId}&status=ACTIVE`, {
          headers: AUTH_HEADERS,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAreasList(data);
          }
        }
      } catch (err) {
        console.error('Failed to load canonical areas:', err);
      }
    }
    if (showAreaAndPostal) {
      fetchAreas();
    }
  }, [activeCityId, showAreaAndPostal]);

  // Resolve current active area ID
  const selectedAreaObj = areasList.find(
    (a) => (areaId && a.id === areaId) || (area && a.name.toLowerCase() === area.toLowerCase())
  );

  // Handlers
  const handleCountryChange = (cName: string) => {
    onCountryChange?.(cName);
    const match = countriesList.find((c) => c.name === cName);
    onCountryIdChange?.(match ? match.id : '');
    onProvinceChange?.('');
    onStateIdChange?.('');
    onCityChange?.('');
    onCityIdChange?.('');
    onAreaChange?.('');
    onAreaIdChange?.('');
  };

  const handleStateChange = (sName: string) => {
    onProvinceChange?.(sName);
    const match = statesList.find((s) => s.name === sName);
    onStateIdChange?.(match ? match.id : '');
    onCityChange?.('');
    onCityIdChange?.('');
    onAreaChange?.('');
    onAreaIdChange?.('');
  };

  const handleCityChange = (cityName: string) => {
    onCityChange?.(cityName);
    const match = citiesList.find((ct) => ct.name === cityName);
    onCityIdChange?.(match ? match.id : '');
    onAreaChange?.('');
    onAreaIdChange?.('');
  };

  const handleAreaChange = (areaName: string) => {
    onAreaChange?.(areaName);
    const match = areasList.find((a) => a.name === areaName);
    onAreaIdChange?.(match ? match.id : '');
    if (match?.postalCode && onPostalCodeChange) {
      onPostalCodeChange(match.postalCode);
    }
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Country Field */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Country <span className="text-rose-500">*</span>
          </label>
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select Country</option>
            {countriesList.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({c.iso2})
              </option>
            ))}
          </select>
        </div>

        {/* State / Province Field */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            State / Province
          </label>
          {statesList.length > 0 ? (
            <select
              value={province}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select State / Province</option>
              {statesList.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} {p.code ? `(${p.code})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. State or Province"
              value={province}
              onChange={(e) => onProvinceChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* City Field */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            City
          </label>
          {citiesList.length > 0 ? (
            <select
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select City</option>
              {citiesList.map((ct) => (
                <option key={ct.id} value={ct.name}>
                  {ct.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. City Name"
              value={city}
              onChange={(e) => onCityChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>
      </div>

      {showAreaAndPostal && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Area / Zone Field */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Area / Sector
            </label>
            {areasList.length > 0 ? (
              <select
                value={area || selectedAreaObj?.name || ''}
                onChange={(e) => handleAreaChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Area / Sector</option>
                {areasList.map((ar) => (
                  <option key={ar.id} value={ar.name}>
                    {ar.name} {ar.postalCode ? `(${ar.postalCode})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. Clifton, Sector F-6"
                value={area}
                onChange={(e) => onAreaChange?.(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Postal Code Field */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Postal / ZIP Code
            </label>
            <input
              type="text"
              placeholder="e.g. 75300"
              value={postalCode}
              onChange={(e) => onPostalCodeChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
