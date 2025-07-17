// 1. Create this file: src/app/dashboard/landlords/properties/[id]/edit/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAuthUserQuery } from "@/state/api";

// Import your UI components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";

// Import your constants (create this file as shown below)
const PROPERTY_TYPES_OPTIONS = [
  "Condominium / Apartment",
  "House / Villa",
  "Townhouse",
  "Land",
  "Commercial Property (Shop/Office/Warehouse)",
  "Shophouse (TH-style)",
  "Studio Apartment",
  "Mixed-Use Property",
  "Serviced Apartment",
  "Bungalow",
  "Penthouse",
  "Other Residential",
  "Other Commercial",
];

const AMENITIES_OPTIONS = [
  "Swimming Pool",
  "Fitness Center/Gym",
  "Covered Parking",
  "Underground Parking",
  "24/7 Security",
  "CCTV",
  "Elevator",
  "Garden / Green Space",
  "Pet-friendly",
  "Air Conditioning (Central)",
  "Air Conditioning (Split-unit)",
  "Balcony",
  "Terrace",
  "Rooftop Terrace/Lounge",
  "High-speed Internet Access",
  "In-unit Laundry Hookup",
  "Communal Laundry Facility",
  "Co-working Space / Business Center",
  "Shuttle Service (e.g., to BTS/MRT in TH)",
  "Sauna / Steam Room",
  "Kids Playground / Play Area",
  "On-site Convenience Store/Shop",
  "Keycard Access System",
  "Bicycle Storage (Common in BE)",
  "Cellar / Private Storage Room (Common in BE)",
  "Energy Efficient Appliances/Features",
  "Central Heating (Common in BE)",
  "Double Glazing Windows",
  "Fireplace",
  "Wheelchair Accessible",
  "Smart Home Features",
  "Sea View / River View",
  "City View",
  "Mountain View",
  "Fully Furnished",
  "Partially Furnished",
  "Unfurnished",
];

const HIGHLIGHTS_OPTIONS = [
  "Prime Location / Sought-After Area",
  "Newly Renovated / Modern Interior",
  "Quiet and Peaceful Neighborhood",
  "Excellent Public Transport Links",
  "Near BTS/MRT Station (TH)",
  "Near Tram/Metro/Bus Stop (BE/General)",
  "Bright and Airy / Abundant Natural Light",
  "Spacious Rooms / Open Floor Plan",
  "Contemporary/Modern Design",
  "Classic/Traditional Charm",
  "High Ceilings",
  "Ample Storage Space",
  "Strong Investment Potential / Good ROI",
  "Move-in Ready Condition",
  "Panoramic / Stunning Views",
  "Waterfront Property (River/Canal/Sea)",
  "Near International School(s)",
  "Close to Major Hospitals/Clinics",
  "Beachfront / Easy Access to Beach (TH)",
  "Access to Golf Course(s)",
  "Expat-Friendly Community/Area",
  "Low Common Area Fees / HOA Dues",
  "Close to EU Institutions (Brussels, BE)",
  "Historic Building / Property with Character",
  "South-facing Garden/Terrace (Valued in BE)",
  "Good Energy Performance Certificate (EPC)",
  "Proximity to Parks / Green Spaces",
  "Corner Unit / End Unit (More Privacy/Light)",
  "Top Floor Unit (Views/Quiet)",
  "Ground Floor Unit with Private Garden Access",
  "Gated Community / Secure Compound",
  "Ideal for Families",
  "Perfect for Professionals/Couples",
  "Pet-Friendly Building/Community Rules",
];

// Validation schema
const formSchema = z.object({
  name: z.string().min(5, { message: "Property title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  salePrice: z.coerce.number({ required_error: "Asking price is required." }).positive("Price must be a positive number."),
  propertyType: z.string({ required_error: "Please select a property type." }).min(1, "Property type is required."),
  propertyStatus: z.string({ required_error: "Please select a property status." }).min(1, "Property status is required."),
  squareFeet: z.coerce.number({ required_error: "Square meters is required." }).positive("Square meters must be a positive number."),
  yearBuilt: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().optional().nullable()),
  HOAFees: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().optional().nullable()),
  amenities: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  openHouseDates: z.union([z.string().optional(), z.array(z.string()).optional()]).optional(),
  sellerNotes: z.string().optional(),
  allowBuyerApplications: z.boolean().default(true),
  preferredFinancingInfo: z.string().optional(),
  insuranceRecommendation: z.string().optional(),
});

type EditPropertyFormData = z.infer<typeof formSchema>;

interface PropertyData {
  _id: string;
  name: string;
  description: string;
  salePrice: number;
  propertyType: string;
  propertyStatus: string;
  squareFeet: number;
  yearBuilt?: number | null;
  HOAFees?: number | null;
  amenities: string[];
  highlights: string[];
  openHouseDates?: string[];
  sellerNotes?: string;
  allowBuyerApplications: boolean;
  preferredFinancingInfo?: string;
  insuranceRecommendation?: string;
}

const EditSellerPropertyPage = () => {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<EditPropertyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      salePrice: 0,
      squareFeet: 0,
      yearBuilt: 0,
      HOAFees: 0,
      propertyType: "",
      propertyStatus: "For Sale",
      allowBuyerApplications: true,
      amenities: [],
      highlights: [],
      openHouseDates: "",
      sellerNotes: "",
      preferredFinancingInfo: "",
      insuranceRecommendation: "",
    },
  });

  const { control, reset, handleSubmit } = form;

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/seller-properties/${propertyId}`);
        if (!response.ok) throw new Error("Failed to fetch property");
        
        const data: PropertyData = await response.json();
        setProperty(data);

        // Populate form with existing data
        reset({
          name: data.name,
          description: data.description,
          salePrice: data.salePrice,
          propertyType: data.propertyType,
          propertyStatus: data.propertyStatus,
          squareFeet: data.squareFeet,
          yearBuilt: data.yearBuilt,
          HOAFees: data.HOAFees,
          amenities: data.amenities || [],
          highlights: data.highlights || [],
          openHouseDates: Array.isArray(data.openHouseDates) 
            ? data.openHouseDates.join(", ") 
            : data.openHouseDates || "",
          sellerNotes: data.sellerNotes || "",
          allowBuyerApplications: data.allowBuyerApplications,
          preferredFinancingInfo: data.preferredFinancingInfo || "",
          insuranceRecommendation: data.insuranceRecommendation || "",
        });

      } catch (error) {
        console.error("Error fetching property:", error);
        setSubmitMessage({
          type: "error",
          text: "Failed to load property data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId, reset]);

  const onSubmit: SubmitHandler<EditPropertyFormData> = async (submittedData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Convert to JSON for API
      const updateData = {
        ...submittedData,
        // Handle openHouseDates conversion
        openHouseDates: typeof submittedData.openHouseDates === "string" 
          ? submittedData.openHouseDates.split(",").map(d => d.trim()).filter(d => d.length > 0)
          : submittedData.openHouseDates
      };

      const response = await fetch(`/api/seller-properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update property");
      }

      setSubmitMessage({
        type: "success",
        text: "Property updated successfully!",
      });

      // Redirect back to property details after a delay
      setTimeout(() => {
        router.push(`/landlords/properties`);
      }, 2000);

    } catch (error) {
      console.error("Error updating property:", error);
      setSubmitMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update property",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading property data...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Property not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/landlords/properties/${propertyId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Property
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
        </div>

        {submitMessage && (
          <div
            className={`mb-6 p-4 rounded-md ${
              submitMessage.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Property Information */}
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Property Information
              </h2>
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Title / Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Modern Beachfront Villa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your property in detail..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 5000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="-- Select Property Type --" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPERTY_TYPES_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="squareFeet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Square Feet</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Amenities & Highlights */}
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Features & Highlights
              </h2>
              
              <FormField
                control={control}
                name="amenities"
                render={() => (
                  <FormItem className="mb-6">
                    <FormLabel>Amenities</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50">
                      {AMENITIES_OPTIONS.map((item) => (
                        <FormField
                          key={item}
                          control={control}
                          name="amenities"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== item)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {item}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="highlights"
                render={() => (
                  <FormItem>
                    <FormLabel>Property Highlights</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50">
                      {HIGHLIGHTS_OPTIONS.map((item) => (
                        <FormField
                          key={item}
                          control={control}
                          name="highlights"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== item)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {item}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Additional Information
              </h2>
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="openHouseDates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open House Dates & Times</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter dates, comma-separated"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="sellerNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Recently updated kitchen, motivated seller."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Updating..." : "Update Property"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EditSellerPropertyPage;