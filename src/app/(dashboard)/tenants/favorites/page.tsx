"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import SellerPropertyCard from "@/components/SellerPropertyCard";
import { useGetAuthUserQuery } from "@/state/api";
import React, { useState, useEffect } from "react";
import { SellerPropertyLocation } from "@/types/sellerMarketplaceTypes";

// Types for the API response
interface FavoriteProperty {
  _id?: string; // Or just string, depending on your DB ObjectId handling
    id : string | number,
    name: string;
    description?: string;
    salePrice: number;
    propertyType: string;
    beds: number;
    baths: number; // Assuming you have this
    squareFeet: number; // Assuming you have this
    photoUrls: string[];
    location: SellerPropertyLocation; // Use the interface defined above
    propertyStatus:string;
    sellerCognitoId: string;
}

interface BuyerWithFavorites {
  cognitoId: string;
  favorites: FavoriteProperty[];
  // other buyer properties...
}

const Favorites = () => {
  const { data: authUser, refetch: refetchAuthUser } = useGetAuthUserQuery();
  const [favoriteProperties, setFavoriteProperties] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites from our new API
  const fetchFavorites = async () => {
    if (!authUser?.cognitoInfo?.userId) return;
    
    // Only buyers and tenants have favorites
    if (authUser.userRole !== 'buyer' && authUser.userRole !== 'tenant') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const cognitoId = authUser.cognitoInfo.userId;
      const apiEndpoint = `/api/${authUser.userRole}s/${cognitoId}`;
      
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }

      const userData: BuyerWithFavorites = await response.json();
      
      // Debug: Log the response to see data structure
      console.log('API Response:', userData);
      console.log('Favorites array:', userData.favorites);
      
      // Extract favorite properties from the response
      const favorites = userData.favorites || [];
      console.log('Processed favorites:', favorites);
      setFavoriteProperties(favorites);
      
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch favorites when component mounts or auth user changes
  useEffect(() => {
    fetchFavorites();
  }, [authUser?.cognitoInfo?.userId, authUser?.userRole]);

  // Handle favorite toggle - refetch favorites and auth user
  const handleFavoriteToggle = async () => {
    // Refetch both the auth user (to update the favorites in the global state)
    // and the local favorites list
    await Promise.all([
      refetchAuthUser(),
      fetchFavorites()
    ]);
  };

  // Show loading state
  if (isLoading) return <Loading />;

  // Show error state
  if (error) {
    return (
      <div className="dashboard-container">
        <Header
          title="Favorited Properties"
          subtitle="Browse and manage your saved property listings"
        />
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading favorites: {error}</p>
          <button 
            onClick={fetchFavorites}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show message for non-buyer/tenant users
  if (authUser && authUser.userRole !== 'buyer' && authUser.userRole !== 'tenant') {
    return (
      <div className="dashboard-container">
        <Header
          title="Favorited Properties"
          subtitle="Browse and manage your saved property listings"
        />
        <div className="text-center py-8">
          <p className="text-gray-600">
            Only buyers and tenants can save favorite properties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header
        title="Favorited Properties"
        subtitle="Browse and manage your saved property listings"
      />
      
      {/* Show favorites count */}
      {favoriteProperties.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-600">
            You have {favoriteProperties.length} favorite {favoriteProperties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
      )}

      {/* Properties grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoriteProperties.map((property) => (
          <SellerPropertyCard
            key={property.id}
            property={property}
            propertyLinkBase="/marketplace"
            onFavoriteToggle={handleFavoriteToggle}
            showFavoriteButton={true}
          />
        ))}
      </div>

      {/* Empty state */}
      {favoriteProperties.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No favorite properties yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start browsing properties and click the heart icon to save your favorites here.
            </p>
            <a
              href="/seller-marketplace"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Browse Properties
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;