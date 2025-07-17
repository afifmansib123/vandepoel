"use client";

import React, { useState, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetAllPropertiesAdminQuery } from "@/state/api"; // This hook already exists
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Search, AlertTriangle, MapPin, Calendar, User, DollarSign, Home, Bed, Bath, Maximize, Star, Shield, Clock, FileText } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner"; // Using the existing toast library for feedback

// Simplified type for the property list, matching the expected data
interface PropertyForAdmin {
  _id: string;
  name: string;
  propertyType: string;
  propertyStatus: string;
  salePrice: number;
  location: {
    city?: string;
    country?: string;
    address?: string;
    state?: string;
    postalCode?: string;
  };
  sellerCognitoId: string;
  photoUrls?: string[];
  description?: string;
  features?: {
    [key: string]: {
      count: number;
      description?: string;
      images?: string[];
    };
  };
  amenities?: string[];
  highlights?: string[];
  openHouseDates?: string[];
  sellerNotes?: string;
  managedBy?: string;
  postedDate: string;
  updatedAt: string;
  allowBuyerApplications?: boolean;
  preferredFinancingInfo?: string;
  insuranceRecommendation?: string;
  squareFeet?: number;
  [key: string]: any; // Allow other properties for the details modal
}

// Enhanced Modal to show detailed property information in a beautiful, user-friendly way
const PropertyDetailsModal = ({
  property,
  isOpen,
  onClose,
  onDelete,
  isDeleting,
}: {
  property: PropertyForAdmin | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

const formatPrice = (price: number, country?: string) => {
  // Normalize country name - handle different variations
  const countryLower = country?.toLowerCase().trim();
  
  // Thailand variations
  if (countryLower === "thailand" || countryLower === "th" || countryLower === "thai") {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // Thai prices usually don't show decimals
    }).format(price);
  }
  
  // Belgium/Europe variations - default to EUR
  if (countryLower === "belgium" || countryLower === "be" || countryLower === "belgian" || 
      countryLower === "europe" || countryLower === "eur") {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  // Default to EUR if country is not specified or unrecognized
  // (assuming most of your properties are in Belgium)
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white rounded-lg max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">{property.name}</DialogTitle>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{property.location?.address}, {property.location?.city}, {property.location?.state}, {property.location?.country}</span>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Image Gallery */}
          {property.photoUrls && property.photoUrls.length > 0 && (
            <div className="mb-6">
              <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
                <Image
                  src={property.photoUrls[currentImageIndex]}
                  alt={property.name}
                  layout="fill"
                  objectFit="cover"
                />
                {property.photoUrls.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.photoUrls!.length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev < property.photoUrls!.length - 1 ? prev + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {property.photoUrls.length}
                    </div>
                  </>
                )}
              </div>
              {property.photoUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {property.photoUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 ${
                        index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${property.name} ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{property.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={property.propertyStatus === "Sell" || property.propertyStatus === "For Sale" ? "default" : "secondary"}>
                    {property.propertyStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-lg text-green-600">{formatPrice(property.salePrice)}</span>
                </div>
                {property.squareFeet && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Square Feet:</span>
                    <span className="font-medium">{property.squareFeet.toLocaleString()} sq ft</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Address:</span>
                  <p className="font-medium">{property.location?.address}</p>
                </div>
                <div>
                  <span className="text-gray-600">City:</span>
                  <span className="font-medium ml-2">{property.location?.city}</span>
                </div>
                <div>
                  <span className="text-gray-600">State/Province:</span>
                  <span className="font-medium ml-2">{property.location?.state}</span>
                </div>
                <div>
                  <span className="text-gray-600">Country:</span>
                  <span className="font-medium ml-2">{property.location?.country}</span>
                </div>
                {property.location?.postalCode && (
                  <div>
                    <span className="text-gray-600">Postal Code:</span>
                    <span className="font-medium ml-2">{property.location.postalCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          {property.features && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Bed className="h-5 w-5" />
                Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(property.features).map(([featureType, featureData]: [string, any]) => (
                  <div key={featureType} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {featureType === 'bedroom' && <Bed className="h-4 w-4" />}
                      {featureType === 'bathroom' && <Bath className="h-4 w-4" />}
                      <h4 className="font-medium capitalize">{featureType}</h4>
                    </div>
                    <p className="text-gray-600 mb-2">Count: {featureData.count}</p>
                    {featureData.description && (
                      <p className="text-sm text-gray-600 mb-2">{featureData.description}</p>
                    )}
                    {featureData.images && featureData.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {featureData.images.map((img: string, idx: number) => (
                          <div key={idx} className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={img}
                              alt={`${featureType} ${idx + 1}`}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          {property.highlights && property.highlights.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Highlights
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.highlights.map((highlight: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Open House Dates */}
          {property.openHouseDates && property.openHouseDates.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Open House Schedule
              </h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                {property.openHouseDates.map((date: string, index: number) => (
                  <p key={index} className="text-yellow-800 font-medium">{date}</p>
                ))}
              </div>
            </div>
          )}

          {/* Seller Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Seller Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <span className="text-gray-600">Seller ID:</span>
                <span className="font-mono text-sm ml-2">{property.sellerCognitoId}</span>
              </div>
              {property.managedBy && (
                <div>
                  <span className="text-gray-600">Managed By:</span>
                  <span className="font-mono text-sm ml-2">{property.managedBy}</span>
                </div>
              )}
              {property.sellerNotes && (
                <div>
                  <span className="text-gray-600">Seller Notes:</span>
                  <p className="text-gray-700 mt-1 p-3 bg-white rounded border-l-4 border-blue-400">
                    {property.sellerNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Additional Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Posted Date:</span>
                <span className="font-medium">{formatDate(property.postedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{formatDate(property.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property ID:</span>
                <span className="font-mono text-sm">{property._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Applications:</span>
                <span className="font-medium">
                  {property.allowBuyerApplications ? "Allowed" : "Not Allowed"}
                </span>
              </div>
              {property.preferredFinancingInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred Financing:</span>
                  <span className="font-medium">{property.preferredFinancingInfo}</span>
                </div>
              )}
              {property.insuranceRecommendation && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance Recommendation:</span>
                  <span className="font-medium">{property.insuranceRecommendation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 sm:justify-between items-center border-t pt-4">
          <Button
            variant="destructive"
            onClick={() => onDelete(property._id)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Property"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main page component
const SuperadminPropertiesPage = () => {
  const {
    data: properties = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllPropertiesAdminQuery();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyForAdmin | null>(null);

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery) return properties;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return properties.filter(
      (prop: any) => {
        // Convert the property to a plain object if it's a Mongoose model
        const property = prop.toObject ? prop.toObject() : prop;
        return (
          property.name?.toLowerCase().includes(lowerCaseQuery) ||
          property._id?.toLowerCase().includes(lowerCaseQuery) ||
          property.sellerCognitoId?.toLowerCase().includes(lowerCaseQuery)
        );
      }
    );
  }, [properties, searchQuery]);

  // Handle property deletion using a standard fetch call
  const handleDeleteProperty = async (id: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete this property (ID: ${id})? This action cannot be undone.`
      )
    )
      return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/seller-properties/${id}`, {
        method: "DELETE",
        // The browser should automatically send the auth headers if your RTK query setup is working
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to delete property.");
      }
      
      toast.success("Property deleted successfully!");
      setSelectedProperty(null); // Close modal
      refetch(); // Refetch data to update the list
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <div className="dashboard-container text-center">
         <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
         <h2 className="mt-4 text-xl font-semibold text-red-600">Failed to Load Properties</h2>
         <p className="mt-2 text-gray-600">{(error as any)?.data?.message || "An unknown error occurred."}</p>
         <Button onClick={refetch} className="mt-4">Try Again</Button>
      </div>
    );

  return (
    <div className="dashboard-container">
      <Header
        title="All Properties"
        subtitle="View and manage all properties listed on the platform."
      />

      <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name, ID, or seller ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setSearchQuery("")}>
          Clear Search
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length > 0 ? (
                filteredProperties.map((prop: any) => {
                  // Convert to plain object if it's a Mongoose model
                  const property = prop.toObject ? prop.toObject() : prop;
                  return (
                    <TableRow key={property._id}>
                      <TableCell className="font-medium">{property.name}</TableCell>
                      <TableCell>{property.propertyType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            property.propertyStatus === "Sell" || property.propertyStatus === "For Sale"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {property.propertyStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {property.location?.city}, {property.location?.country}
                      </TableCell>
                      <TableCell>
                        {property.salePrice?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedProperty(property)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No properties found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onDelete={handleDeleteProperty}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default SuperadminPropertiesPage;