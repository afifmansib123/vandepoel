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
import { Eye, Trash2, Search, AlertTriangle } from "lucide-react";
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
  };
  sellerCognitoId: string;
  photoUrls?: string[];
  [key: string]: any; // Allow other properties for the details modal
}

// Modal to show detailed property information
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
  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle>Property Details: {property.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2 text-sm max-h-[70vh] overflow-y-auto pr-2">
          {property.photoUrls && property.photoUrls[0] && (
            <div className="relative h-48 w-full rounded-md overflow-hidden mb-4">
              <Image
                src={property.photoUrls[0]}
                alt={property.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
          )}
          {Object.entries(property).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-2 py-2 border-b">
              <span className="font-semibold capitalize text-gray-600 col-span-1">
                {key.replace(/([A-Z])/g, " $1")}
              </span>
              <div className="text-gray-800 col-span-2 break-words">
                {typeof value === "object" && value !== null ? (
                  <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded-md text-xs">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  String(value)
                )}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-6 sm:justify-between items-center">
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
      (prop: PropertyForAdmin) =>
        prop.name.toLowerCase().includes(lowerCaseQuery) ||
        prop._id.toLowerCase().includes(lowerCaseQuery) ||
        prop.sellerCognitoId.toLowerCase().includes(lowerCaseQuery)
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
      // We use the existing Bearer token logic from RTK Query by accessing fetchBaseQuery's prepareHeaders
      // Or more simply, if your browser handles auth cookies, a direct fetch works.
      // Assuming your API is secured and expects a token:
      // Note: This part assumes your RTK setup correctly adds the auth header to all requests.
      // If not, you would need to get the token from Amplify manually here.
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
                filteredProperties.map((prop: PropertyForAdmin) => (
                  <TableRow key={prop._id}>
                    <TableCell className="font-medium">{prop.name}</TableCell>
                    <TableCell>{prop.propertyType}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          prop.propertyStatus === "For Sale"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {prop.propertyStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {prop.location?.city}, {prop.location?.country}
                    </TableCell>
                    <TableCell>
                      ${prop.salePrice?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedProperty(prop)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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