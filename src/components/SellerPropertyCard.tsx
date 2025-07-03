// src/components/SellerPropertyCard.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SellerProperty } from "@/types/sellerMarketplaceTypes";
import { BedDouble, Bath, LandPlot, Building, Heart } from "lucide-react";
import { formatEnumString } from "@/lib/utils";
import { useGetAuthUserQuery } from "@/state/api";

// Define types for favorites to handle both cases
type FavoriteItem = number | { id: number; [key: string]: any };

interface AuthUser {
  cognitoInfo: {
    userId: string;
  };
  userRole: 'buyer' | 'tenant' | 'seller' | 'landlord';
  favorites?: FavoriteItem[];
}

interface SellerPropertyCardProps {
  property: SellerProperty;
  propertyLinkBase?: string;
  onFavoriteToggle?: () => void;
  showFavoriteButton?: boolean;
}

const SellerPropertyCard: React.FC<SellerPropertyCardProps> = ({
  property,
  propertyLinkBase = "/seller-marketplace",
  onFavoriteToggle,
  showFavoriteButton = true,
}) => {
  const link = `${propertyLinkBase}/${property.id}`;
  const displayImage = property.photoUrls?.[0] || "/placeholder-property.jpg";

  const { data: authUser, refetch: refetchAuthUser } = useGetAuthUserQuery() as { 
    data: AuthUser | undefined;
    refetch: () => void;
  };

  const isOwner = authUser?.cognitoInfo?.userId === property.sellerCognitoId;

  // Function to check if property is in favorites
  const isPropertyFavorite = (): boolean => {
    if (!authUser?.favorites || authUser.favorites.length === 0) return false;
    
    console.log('Checking favorites:', authUser.favorites);
    console.log('Property ID:', property.id);
    
    return authUser.favorites.some((fav: FavoriteItem) => 
      typeof fav === 'number' ? fav === property.id : fav.id === property.id
    );
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!authUser) {
      alert("Please log in to save favorites");
      return;
    }

    // Check if user is buyer or tenant
    if (authUser.userRole !== 'buyer' && authUser.userRole !== 'tenant') {
      alert("Only buyers and tenants can save favorites");
      return;
    }

    try {
      const currentFavorites = authUser.favorites || [];
      
      // Check if property ID already exists in favorites
      const isAlreadyFavorite = currentFavorites.some((fav: FavoriteItem) => 
        typeof fav === 'number' ? fav === property.id : fav.id === property.id
      );
      
      console.log('Is already favorite:', isAlreadyFavorite);
      
      const cognitoId = authUser.cognitoInfo.userId;
      const apiEndpoint = `/api/${authUser.userRole}/${cognitoId}/favorites/${property.id}`;
      
      const response = await fetch(apiEndpoint, {
        method: isAlreadyFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refetch user data to get updated favorites
      await refetchAuthUser();
      
      // Call the parent's toggle function to refresh data
      onFavoriteToggle?.();

    } catch (error) {
      console.error("Failed to update favorites:", error);
      alert("Failed to update favorites. Please try again.");
    }
  };

  const isFavorite = isPropertyFavorite();

  const formatPrice = (price: number, country?: string) => {
    const countryLower = country?.toLowerCase().trim();

    let options: Intl.NumberFormatOptions = {
      style: "currency",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // Or 2 if you want decimals
    };
    let locale = "en-US"; // Default locale

    if (countryLower === "thailand") {
      options.currency = "THB";
      locale = "th-TH";
    } else if (countryLower === "belgium") {
      options.currency = "EUR";
      locale = "nl-BE"; 
    } else {
      // Default to USD if no specific country matches
      options.currency = "USD";
    }

    return new Intl.NumberFormat(locale, options).format(price);
  };

  return (
    <Link href={link} legacyBehavior>
      <a className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mb-4 border border-gray-200">
        <div className="relative h-60 w-full">
          <Image
            src={displayImage}
            alt={property.name}
            layout="fill"
            objectFit="cover"
            className="rounded-t-xl"
          />
          <div className="absolute top-3 right-3 bg-primary-700 text-white text-xs px-2 py-1 rounded-md shadow">
            FOR SALE
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
            <h3
              className="text-xl font-semibold text-white truncate"
              title={property.name}
            >
              {property.name}
            </h3>
            {showFavoriteButton &&
              authUser &&
              (authUser.userRole === "buyer" || authUser.userRole === "tenant") && (
                <button
                  className="absolute bottom-4 right-4 bg-white hover:bg-white/90 rounded-full p-2 cursor-pointer transition-colors"
                  onClick={handleFavoriteToggle}
                  type="button"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isFavorite
                        ? "text-red-500 fill-red-500"
                        : "text-gray-600"
                    }`}
                  />
                </button>
              )}
          </div>
        </div>
        <div className="p-5">
          <p className="text-2xl font-bold text-primary-700 mb-3">
           {formatPrice(property.salePrice, property.location?.country)}
          </p>
          <p className="text-sm text-gray-600 mb-3 flex items-center">
            <span
              className="truncate"
              title={`${property.location?.address}, ${property.location?.city}`}
            >
              {property.location?.address || "Address not available"},{" "}
              {property.location?.city}
            </span>
          </p>
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 text-sm text-gray-700 mb-4">
            <span className="flex items-center col-span-1">
              <BedDouble size={16} className="mr-1.5 text-primary-500" />{" "}
              {property.beds} Beds
            </span>
            <span className="flex items-center col-span-1">
              <Bath size={16} className="mr-1.5 text-primary-500" />{" "}
              {property.baths} Baths
            </span>
            <span className="flex items-center col-span-1">
              <LandPlot size={16} className="mr-1.5 text-primary-500" />{" "}
              {property.squareFeet.toLocaleString()} sqft
            </span>
          </div>
          <div className="border-t pt-3 mt-3 flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center">
              <Building size={14} className="mr-1.5" />
              {formatEnumString(property.propertyType)}
            </span>
            <span>Status: {formatEnumString(property?.propertyStatus)}</span>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default SellerPropertyCard;