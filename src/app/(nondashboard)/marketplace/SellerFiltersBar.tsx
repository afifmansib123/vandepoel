// src/app/(nondashboard)/seller-marketplace/SellerFiltersBar.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Not used after removing search button, can be removed if no other use
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SellerMarketplaceFilters } from "@/types/sellerMarketplaceTypes"; // Adjust path if necessary
import { useTranslations } from "next-intl";

// Define location data structures locally or import if shared
interface Province {
  name: string;
  cities: string[];
}

interface Country {
  name: string;
  code: string;
  provinces: Province[];
}

interface SellerFiltersBarProps {
  onFiltersChange: (filters: SellerMarketplaceFilters) => void;
  initialFilters: SellerMarketplaceFilters;
}

const SellerFiltersBar: React.FC<SellerFiltersBarProps> = ({
  onFiltersChange,
  initialFilters,
}) => {
  const t = useTranslations();

  // Helper functions to get translated options
  const getListingTypeOptions = (): Record<string, string> => ({
    any: t('marketplace.filters.forSaleOrRent'),
    Sell: t('marketplace.filters.forSale'),
    Rent: t('marketplace.filters.forRent'),
  });

  const getPropertyTypeOptions = (): Record<string, string> => ({
    any: t('marketplace.filters.anyType'),
    "Condominium / Apartment": t('marketplace.filters.condoApartment'),
    "House / Villa": t('marketplace.filters.houseVilla'),
    Townhouse: t('marketplace.filters.townhouse'),
    Land: t('marketplace.filters.land'),
    "Commercial Property (Shop/Office/Warehouse)": t('marketplace.filters.commercial'),
    Other: t('marketplace.filters.other'),
  });

  const getBedOptions = (): Record<string, string> => ({
    any: t('marketplace.filters.anyBeds'),
    "1": t('marketplace.filters.oneBedPlus'),
    "2": t('marketplace.filters.twoBedsPlus'),
    "3": t('marketplace.filters.threeBedsPlus'),
    "4": t('marketplace.filters.fourBedsPlus'),
    "5": t('marketplace.filters.fiveBedsPlus'),
  });

  // Search state
  const [searchInput, setSearchInput] = useState<string>(
    initialFilters.search || ""
  );

  // Location state
  const [allCountriesData, setAllCountriesData] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    initialFilters.country || ""
  );
  const [currentProvinces, setCurrentProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>(
    initialFilters.state || ""
  );
  const [currentCities, setCurrentCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(
    initialFilters.city || ""
  );

  // Other filter states
  const [listingTypeSelect, setListingTypeSelect] = useState(
  initialFilters.listingType || "any"
);
  const [minPriceInput, setMinPriceInput] = useState<string>(
    initialFilters.salePriceRange?.[0]?.toString() || ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    initialFilters.salePriceRange?.[1]?.toString() || ""
  );
  const [propertyTypeSelect, setPropertyTypeSelect] = useState(
    initialFilters.propertyType || "any"
  );
  const [bedsSelect, setBedsSelect] = useState(initialFilters.beds || "any");

  // Fetch location data on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/locations.json");
        if (!response.ok) {
          console.error(
            "Failed to fetch location data. Status:",
            response.status
          );
          throw new Error("Failed to fetch location data");
        }
        const data: Country[] = await response.json();
        setAllCountriesData(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  // Sync local state with initialFilters when they change or location data loads
  useEffect(() => {
    setMinPriceInput(initialFilters.salePriceRange?.[0]?.toString() || "");
    setMaxPriceInput(initialFilters.salePriceRange?.[1]?.toString() || "");
    setPropertyTypeSelect(initialFilters.propertyType || "any");
    setBedsSelect(initialFilters.beds || "any");

    const initialCountryName = initialFilters.country || "";
    setSelectedCountry(initialCountryName);

    if (allCountriesData.length > 0) {
      // Ensure country data is loaded
      if (initialCountryName) {
        const countryData = allCountriesData.find(
          (c) => c.name === initialCountryName
        );
        if (countryData) {
          setCurrentProvinces(countryData.provinces);
          const initialProvinceName = initialFilters.state || "";
          setSelectedProvince(initialProvinceName);

          if (initialProvinceName) {
            const provinceData = countryData.provinces.find(
              (p) => p.name === initialProvinceName
            );
            if (provinceData) {
              setCurrentCities(provinceData.cities);
              setSelectedCity(initialFilters.city || "");
            } else {
              setCurrentCities([]);
              setSelectedCity("");
            }
          } else {
            // No initial province, clear city
            setCurrentCities([]);
            setSelectedCity("");
          }
        } else {
          // Initial country not found in data, clear dependent
          setCurrentProvinces([]);
          setSelectedProvince("");
          setCurrentCities([]);
          setSelectedCity("");
        }
      } else {
        // No initial country, clear all dependent
        setCurrentProvinces([]);
        setSelectedProvince("");
        setCurrentCities([]);
        setSelectedCity("");
      }
    }
  }, [initialFilters, allCountriesData]); // Rerun if initialFilters or allCountriesData change

  // Effect for when 'selectedCountry' changes
  useEffect(() => {
    if (selectedCountry && allCountriesData.length > 0) {
      const countryData = allCountriesData.find(
        (c) => c.name === selectedCountry
      );
      setCurrentProvinces(countryData ? countryData.provinces : []);
    } else {
      setCurrentProvinces([]);
    }
    // Reset dependent selections when country changes if not from initial load
    if (selectedProvince || selectedCity) {
      // Avoid resetting if initial load is setting them
      setSelectedProvince("");
      setCurrentCities([]);
      setSelectedCity("");
    }
  }, [selectedCountry, allCountriesData]);

  // Effect for when 'selectedProvince' changes
  useEffect(() => {
    if (selectedProvince && selectedCountry && allCountriesData.length > 0) {
      const countryData = allCountriesData.find(
        (c) => c.name === selectedCountry
      );
      if (countryData) {
        const provinceData = countryData.provinces.find(
          (p) => p.name === selectedProvince
        );
        setCurrentCities(provinceData ? provinceData.cities : []);
      } else {
        setCurrentCities([]);
      }
    } else {
      setCurrentCities([]);
    }
    if (selectedCity) {
      // Avoid resetting if initial load is setting it
      setSelectedCity("");
    }
  }, [selectedProvince, selectedCountry, allCountriesData]);

  // Debounced filter change trigger
  const triggerFilterChange = useCallback(
    debounce((filtersToApply: SellerMarketplaceFilters) => {
      onFiltersChange(filtersToApply);
    }, 700),
    [onFiltersChange] // onFiltersChange should be stable
  );

  // Effect to call triggerFilterChange when any filter state changes
  useEffect(() => {
    const currentPriceRange: [number | null, number | null] = [
      minPriceInput === "" ? null : Number(minPriceInput),
      maxPriceInput === "" ? null : Number(maxPriceInput),
    ];

    const filtersToApply: SellerMarketplaceFilters = {
      search: searchInput || null,
      country: selectedCountry || null,
      state: selectedProvince || null,
      city: selectedCity || null,
      salePriceRange: currentPriceRange,
      listingType: listingTypeSelect === "any" ? null : listingTypeSelect,
      propertyType: propertyTypeSelect === "any" ? null : propertyTypeSelect,
      beds: bedsSelect === "any" ? null : bedsSelect,
    };
    triggerFilterChange(filtersToApply);
  }, [
    searchInput,
    selectedCountry,
    selectedProvince,
    selectedCity,
    minPriceInput,
    maxPriceInput,
    listingTypeSelect,
    propertyTypeSelect,
    bedsSelect,
    triggerFilterChange,
  ]);

  const handleSelectChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
    anyValue: string
  ) => {
    setter(value === anyValue ? "" : value);
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap justify-start items-center w-full py-3 px-2 md:px-4 bg-white border-b border-gray-200 gap-2 md:gap-3 sticky top-0 z-20 shadow-sm">
      {/* Search Input */}
      <Input
        type="text"
        placeholder={t('marketplace.filters.searchPlaceholder')}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full sm:w-auto min-w-[200px] md:min-w-[250px] rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500"
        aria-label={t('marketplace.filters.searchPlaceholder')}
      />

      {/* Country Select */}
      <Select
        value={selectedCountry}
        onValueChange={(value) => setSelectedCountry(value)}
      >
        <SelectTrigger className="w-full sm:w-auto min-w-[130px] md:min-w-[150px] rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500">
          <SelectValue placeholder={t('marketplace.filters.country')} />
        </SelectTrigger>
        <SelectContent>
          {allCountriesData.map((country) => (
            <SelectItem key={country.code} value={country.name}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* State/Province Select */}
      <Select
        value={selectedProvince || "any-province"}
        onValueChange={(value) =>
          handleSelectChange(setSelectedProvince, value, "any-province")
        }
        disabled={!selectedCountry || currentProvinces.length === 0}
      >
        <SelectTrigger className="w-full sm:w-auto min-w-[130px] md:min-w-[160px] rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500">
          <SelectValue placeholder={t('marketplace.filters.stateProvince')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any-province">{t('marketplace.filters.anyStateProvince')}</SelectItem>
          {currentProvinces.map((province) => (
            <SelectItem key={province.name} value={province.name}>
              {province.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City Select */}
      <Select
        value={selectedCity || "any-city"}
        onValueChange={(value) =>
          handleSelectChange(setSelectedCity, value, "any-city")
        }
        disabled={!selectedProvince || currentCities.length === 0}
      >
        <SelectTrigger className="w-full sm:w-auto min-w-[130px] md:min-w-[160px] rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500">
          <SelectValue placeholder={t('marketplace.filters.city')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any-city">{t('marketplace.filters.anyCity')}</SelectItem>
          {currentCities.map((cityName) => (
            <SelectItem key={cityName} value={cityName}>
              {cityName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/*rent or sell*/}
      <Select
        value={listingTypeSelect}
        onValueChange={(value) => setListingTypeSelect(value)}
      >
        <SelectTrigger className="w-full sm:w-auto min-w-[130px] md:min-w-[150px] rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500">
          <SelectValue placeholder={t('marketplace.filters.forSaleOrRent')} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(getListingTypeOptions()).map(([key, name]) => (
            <SelectItem key={key} value={key}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>


      {/* Price Range Inputs */}
      <div className="flex items-center gap-1 w-full sm:w-auto">
        <Input
          type="number"
          placeholder={t('marketplace.filters.minPrice')}
          value={minPriceInput}
          onChange={(e) => setMinPriceInput(e.target.value)}
          min="0"
          className="w-1/2 sm:w-24 md:w-28 rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500"
          aria-label={t('marketplace.filters.minPrice')}
        />
        <span className="text-gray-400 px-1">-</span>
        <Input
          type="number"
          placeholder={t('marketplace.filters.maxPrice')}
          value={maxPriceInput}
          onChange={(e) => setMaxPriceInput(e.target.value)}
          min="0"
          className="w-1/2 sm:w-24 md:w-28 rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500"
          aria-label={t('marketplace.filters.maxPrice')}
        />
      </div>

      {/* Property Type */}
      <Select
        value={propertyTypeSelect}
        onValueChange={(value) => setPropertyTypeSelect(value)}
      >
        <SelectTrigger className="w-full sm:w-auto min-w-[130px] md:min-w-[140px] rounded-lg border-gray-300 h-10 text-sm focus:ring-primary-500 focus:border-primary-500">
          <SelectValue placeholder={t('marketplace.filters.propertyType')} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(getPropertyTypeOptions()).map(([key, name]) => (
            <SelectItem key={key} value={key}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SellerFiltersBar;
