'use client';

import React from 'react';

export interface LocationSelectorProps {
  country?: string;
  province?: string;
  city?: string;
  area?: string;
  postalCode?: string;
  onCountryChange?: (country: string) => void;
  onProvinceChange?: (province: string) => void;
  onCityChange?: (city: string) => void;
  onAreaChange?: (area: string) => void;
  onPostalCodeChange?: (postalCode: string) => void;
  showAreaAndPostal?: boolean;
  className?: string;
}

const DEFAULT_COUNTRIES = [
  'Pakistan',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Saudi Arabia',
  'Canada',
  'Australia',
  'Malaysia',
  'Qatar',
  'Oman',
];

const DEFAULT_PROVINCES: Record<string, string[]> = {
  Pakistan: [
    'Sindh',
    'Punjab',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu & Kashmir',
  ],
  'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Washington'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  'Saudi Arabia': ['Riyadh Province', 'Makkah Province', 'Eastern Province', 'Madinah Province'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
};

const DEFAULT_CITIES: Record<string, string[]> = {
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas', 'Nawabshah'],
  Punjab: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Dera Ismail Khan'],
  'Islamabad Capital Territory': ['Islamabad'],
  California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
  Texas: ['Houston', 'Dallas', 'Austin', 'San Antonio'],
  Dubai: ['Dubai City', 'Deira', 'Jumeirah', 'Downtown'],
  'Abu Dhabi': ['Abu Dhabi City', 'Al Ain'],
  'Riyadh Province': ['Riyadh'],
  'Makkah Province': ['Jeddah', 'Makkah'],
  England: ['London', 'Manchester', 'Birmingham', 'Leeds'],
};

const DEFAULT_AREAS: Record<string, { name: string; postalCode: string }[]> = {
  Karachi: [
    { name: 'Gulshan-e-Iqbal', postalCode: '75300' },
    { name: 'Clifton & DHA', postalCode: '75600' },
    { name: 'North Nazimabad', postalCode: '74700' },
    { name: 'PECHS / Tariq Road', postalCode: '75400' },
  ],
  Lahore: [
    { name: 'Gulberg & Model Town', postalCode: '54660' },
    { name: 'DHA Phase 1-6', postalCode: '54792' },
    { name: 'Johar Town', postalCode: '54770' },
  ],
  Islamabad: [
    { name: 'Sector F-6 / F-7', postalCode: '44000' },
    { name: 'Sector G-9 / G-10', postalCode: '44080' },
    { name: 'Sector H-8 / H-9', postalCode: '44090' },
  ],
  'Los Angeles': [
    { name: 'Downtown & Civic Center', postalCode: '90012' },
    { name: 'Hollywood', postalCode: '90028' },
  ],
};

export function GeographyLocationFields({
  country = 'Pakistan',
  province = '',
  city = '',
  area = '',
  postalCode = '',
  onCountryChange,
  onProvinceChange,
  onCityChange,
  onAreaChange,
  onPostalCodeChange,
  showAreaAndPostal = false,
}: LocationSelectorProps) {
  const currentProvinces = DEFAULT_PROVINCES[country] || [];
  const currentCities = DEFAULT_CITIES[province] || [];
  const currentAreas = DEFAULT_AREAS[city] || [];

  const handleAreaSelect = (areaName: string) => {
    onAreaChange?.(areaName);
    const matched = currentAreas.find((a) => a.name.toLowerCase() === areaName.toLowerCase());
    if (matched && matched.postalCode && onPostalCodeChange) {
      onPostalCodeChange(matched.postalCode);
    }
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Country Field */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => {
              const nextCountry = e.target.value;
              onCountryChange?.(nextCountry);
              if (onProvinceChange) onProvinceChange('');
              if (onCityChange) onCityChange('');
              if (onAreaChange) onAreaChange('');
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {DEFAULT_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* State / Province Field */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            State / Province
          </label>
          {currentProvinces.length > 0 ? (
            <select
              value={province}
              onChange={(e) => {
                const nextProvince = e.target.value;
                onProvinceChange?.(nextProvince);
                if (onCityChange) onCityChange('');
                if (onAreaChange) onAreaChange('');
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select State / Province</option>
              {currentProvinces.map((p) => (
                <option key={p} value={p}>
                  {p}
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
          {currentCities.length > 0 ? (
            <select
              value={city}
              onChange={(e) => {
                onCityChange?.(e.target.value);
                if (onAreaChange) onAreaChange('');
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select City</option>
              {currentCities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
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
            {currentAreas.length > 0 ? (
              <select
                value={area}
                onChange={(e) => handleAreaSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Area / Sector</option>
                {currentAreas.map((ar) => (
                  <option key={ar.name} value={ar.name}>
                    {ar.name} ({ar.postalCode})
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
