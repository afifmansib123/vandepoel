// src/types/sellerMarketplaceTypes.ts

// Define the structure of the location object within a SellerProperty
// Ensure this matches EXACTLY how your API returns location data for each property
export interface SellerPropertyLocation {
  address: string;
  city: string;
  state: string; // This corresponds to Province/Region
  country: string;
  postalCode: string;
  // You might have coordinates here too if your property data includes them
  // coordinates?: { lat: number; lng: number };
}

export interface SellerProperty {
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

// Updated filters interface
export interface SellerMarketplaceFilters {
  search?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  salePriceRange: [number | null, number | null];
  propertyType?: string | null;
  beds?: string | null;
  listingType?: 'Sell' | 'Rent' | any;
}

// Updated initial filters
export const initialSellerMarketplaceFilters: SellerMarketplaceFilters = {
  search: null,
  country: null,
  state: null,
  city: null,
  salePriceRange: [null, null],
  propertyType: null, // Represents "any"
  beds: null,       // Represents "any"
  listingType: null,
};

// Updated function to clean filters for URL
export const cleanSellerFiltersForURL = (filters: SellerMarketplaceFilters): Record<string, string> => {
  const cleaned: Record<string, string> = {};

  if (filters.search) cleaned.search = filters.search;
  if (filters.country) cleaned.country = filters.country;
  if (filters.state) cleaned.state = filters.state;
  if (filters.city) cleaned.city = filters.city;

  if (filters.salePriceRange) {
    const [min, max] = filters.salePriceRange;
    // Only add to URL if at least one value is present
    if (min !== null || max !== null) {
      cleaned.salePriceRange = `${min === null ? '' : min},${max === null ? '' : max}`;
    }
  }
  if (filters.propertyType && filters.propertyType !== "any") cleaned.propertyType = filters.propertyType;
  if (filters.beds && filters.beds !== "any") cleaned.beds = filters.beds;
  if (filters.listingType && filters.listingType !== "any") cleaned.listingType = filters.listingType;

  return cleaned;
};