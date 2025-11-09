"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setFilters } from "@/state";
import { useTranslations } from "next-intl";

interface SearchSuggestion {
  type: 'property' | 'city';
  name: string;
  location?: string;
  propertyId?: string;
}

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions as user types (debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      const query = searchQuery.trim().toLowerCase();

      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);

      try {
        const response = await fetch("/api/seller-properties");
        if (!response.ok) {
          console.error("Failed to fetch properties for suggestions");
          setSuggestions([]);
          setIsLoadingSuggestions(false);
          return;
        }

        const allProperties = await response.json();
        const suggestionsList: SearchSuggestion[] = [];
        const citiesSet = new Set<string>();

        // Find matching properties and cities
        allProperties.forEach((property: any) => {
          const propertyName = property.name?.toLowerCase() || "";
          const city = property.location?.city || "";
          const state = property.location?.state || "";
          const country = property.location?.country || "";

          // Add property name matches (limit to 5)
          if (propertyName.includes(query) && suggestionsList.filter(s => s.type === 'property').length < 5) {
            suggestionsList.push({
              type: 'property',
              name: property.name,
              location: `${city}, ${state}, ${country}`,
              propertyId: property.id || property._id
            });
          }

          // Collect city matches
          if (city && city.toLowerCase().includes(query)) {
            citiesSet.add(`${city}, ${state}, ${country}`);
          }
        });

        // Add city suggestions (limit to 5)
        Array.from(citiesSet).slice(0, 5).forEach(cityStr => {
          suggestionsList.push({
            type: 'city',
            name: cityStr
          });
        });

        setSuggestions(suggestionsList.slice(0, 10)); // Total limit of 10 suggestions
        setShowSuggestions(suggestionsList.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle clicking on a suggestion
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'property') {
      // Navigate to marketplace with property name search
      router.push(`/marketplace?search=${encodeURIComponent(suggestion.name)}`);
    } else if (suggestion.type === 'city') {
      // Extract city, state, country from the location string
      const parts = suggestion.name.split(', ');
      const params = new URLSearchParams();
      if (parts[0]) params.set('city', parts[0]);
      if (parts[1]) params.set('state', parts[1]);
      if (parts[2]) params.set('country', parts[2]);
      router.push(`/marketplace?${params.toString()}`);
    }
    setShowSuggestions(false);
  };

  // Function to handle search logic
  const handleSearch = async () => {
    setShowSuggestions(false);

    if (!searchQuery.trim()) {
      // If no search query, just redirect to marketplace
      router.push("/marketplace");
      return;
    }

    // Navigate to marketplace with search term
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative h-screen">
      <Image
        src="/landing-splash.jpg"
        alt="AssetX Platform Hero Section"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center w-full"
      >
        <div className="max-w-4xl mx-auto px-16 sm:px-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            {t('landing.hero.title')}
          </h1>
          <p className="text-xl text-white mb-8">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex justify-center relative" ref={searchRef}>
            <div className="w-full max-w-lg relative">
              <div className="flex">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={t('landing.hero.searchPlaceholder')}
                  className="w-full rounded-none rounded-l-xl border-none bg-white h-12"
                />
                <Button
                  onClick={handleSearch}
                  className="bg-secondary-500 text-white rounded-none rounded-r-xl border-none hover:bg-secondary-600 h-12"
                >
                  {t('landing.hero.searchButton')}
                </Button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  {isLoadingSuggestions ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary-500 mx-auto"></div>
                    </div>
                  ) : (
                    <div>
                      {suggestions.filter(s => s.type === 'property').length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                            Properties
                          </div>
                          {suggestions
                            .filter(s => s.type === 'property')
                            .map((suggestion, index) => (
                              <div
                                key={`property-${index}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{suggestion.name}</div>
                                <div className="text-sm text-gray-500">{suggestion.location}</div>
                              </div>
                            ))}
                        </div>
                      )}
                      {suggestions.filter(s => s.type === 'city').length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                            Cities
                          </div>
                          {suggestions
                            .filter(s => s.type === 'city')
                            .map((suggestion, index) => (
                              <div
                                key={`city-${index}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="text-gray-900">{suggestion.name}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;