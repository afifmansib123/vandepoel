"use client";

import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setFilters } from "@/state";

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Function to handle search logic
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If no search query, just redirect to marketplace
      router.push("/marketplace");
      return;
    }

    try {
      // Fetch all properties to search through them
      const response = await fetch("/api/seller-properties");
      if (!response.ok) {
        console.error("Failed to fetch properties for search");
        // Fallback: redirect to marketplace anyway
        router.push("/marketplace");
        return;
      }

      const allProperties = await response.json();
      const searchTerm = searchQuery.toLowerCase().trim();
      
      // Find matching properties based on name, city, or country
      const matchingProperties = allProperties.filter((property: any) => {
        const propertyName = property.name?.toLowerCase() || "";
        const city = property.location?.city?.toLowerCase() || "";
        const country = property.location?.country?.toLowerCase() || "";
        const state = property.location?.state?.toLowerCase() || "";
        
        return (
          propertyName.includes(searchTerm) ||
          city.includes(searchTerm) ||
          country.includes(searchTerm) ||
          state.includes(searchTerm)
        );
      });

      if (matchingProperties.length > 0) {
        // Find the most common location from matching properties
        const locationCounts: { [key: string]: { count: number; country?: string; state?: string; city?: string } } = {};
        
        matchingProperties.forEach((property: any) => {
          const country = property.location?.country;
          const state = property.location?.state;
          const city = property.location?.city;
          
          // Count countries
          if (country) {
            const countryKey = `country:${country}`;
            locationCounts[countryKey] = locationCounts[countryKey] || { count: 0, country };
            locationCounts[countryKey].count++;
          }
          
          // Count states
          if (state) {
            const stateKey = `state:${state}`;
            locationCounts[stateKey] = locationCounts[stateKey] || { count: 0, state, country };
            locationCounts[stateKey].count++;
          }
          
          // Count cities
          if (city) {
            const cityKey = `city:${city}`;
            locationCounts[cityKey] = locationCounts[cityKey] || { count: 0, city, state, country };
            locationCounts[cityKey].count++;
          }
        });

        // Find the location with the highest count
        let bestMatch = { count: 0, country: null, state: null, city: null };
        
        Object.values(locationCounts).forEach((location) => {
          if (location.count > bestMatch.count) {
            bestMatch = {
              count: location.count,
              country: location.country || null,
              state: location.state || null,
              city: location.city || null
            };
          }
        });

        // Build URL parameters based on the best matching location
        const params = new URLSearchParams();
        
        if (bestMatch.city) {
          params.set('city', bestMatch.city);
          if (bestMatch.state) params.set('state', bestMatch.state);
          if (bestMatch.country) params.set('country', bestMatch.country);
        } else if (bestMatch.state) {
          params.set('state', bestMatch.state);
          if (bestMatch.country) params.set('country', bestMatch.country);
        } else if (bestMatch.country) {
          params.set('country', bestMatch.country);
        }

        // Redirect to marketplace with location filters
        const queryString = params.toString();
        router.push(`/marketplace${queryString ? `?${queryString}` : ''}`);
      } else {
        // No matching properties found, redirect to marketplace without filters
        router.push("/marketplace");
      }
    } catch (error) {
      console.error("Error during search:", error);
      // Fallback: redirect to marketplace anyway
      router.push("/marketplace");
    }
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
            Vadepoel – your 360° partner in property success
          </h1>
          <p className="text-xl text-white mb-8">
            complete property ecosystem for modern buyers, sellers, and agents.
          </p>

          <div className="flex justify-center">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by city, neighborhood or address"
              className="w-full max-w-lg rounded-none rounded-l-xl border-none bg-white h-12"
            />
            <Button
              onClick={handleSearch}
              className="bg-secondary-500 text-white rounded-none rounded-r-xl border-none hover:bg-secondary-600 h-12"
            >
              Search
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;