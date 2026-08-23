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

export function GeographyLocationFields({
  country = 'Pakistan',
  province = '',
  city = '',
  onCountryChange,
  onProvinceChange,
  onCityChange,
}: LocationSelectorProps) {
  const currentProvinces = DEFAULT_PROVINCES[country] || [];
  const currentCities = DEFAULT_CITIES[province] || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
            onChange={(e) => onCityChange?.(e.target.value)}
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
  );
}
