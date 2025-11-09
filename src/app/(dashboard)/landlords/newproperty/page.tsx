"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAuthUserQuery } from "@/state/api";
import { toast } from "sonner";

// --- SHADCN/UI & OTHER COMPONENT IMPORTS ---
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
  FormDescription,
} from "@/components/ui/form";
import { Lock } from "lucide-react";

// --- FILEPOND IMPORTS ---
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";

registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

// --- FORM OPTIONS ---
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
  // General
  "Unfurnished",
  "Furnished",
  "Partially Furnished",
  "Built-in cupboards",
  // Heating or cooling related
  "Heating Gas",
  "Heating Oil",
  "Heatpump",
  "Air Conditioning (Central)",
  "Air Conditioning (Split-unit)",
  "Central Heating (Common in BE)",
  "Fireplace",
  // Actual amenities
  "In-unit Laundry Hookup",
  "Communal Laundry Facility",
  "Sauna / Steam Room",
  "Swimming Pool",
  "Fitness Center/Gym",
  "Garden / Green Space",
  "Balcony",
  "Terrace",
  "Indoor parking space",
  "Open parking space",
  "Dedicated parking",
  "Cellar / Private Storage Room (Common in BE)",
  "Rooftop Terrace/Lounge",
  "Co-working Space / Business Center",
  "Bicycle Storage (Common in BE)",
  "Shuttle Service (e.g., to BTS/MRT in TH)",
  "Kids Playground / Play Area",
  "On-site Convenience Store/Shop",
  "High-speed Internet Access",
  "Smart Home Features",
  "Energy Efficient Appliances/Features",
  // Security
  "CCTV",
  "Gated Community",
  "24/7 Security",
  "Keycard Access System",
  "Biometric access",
  "Burglary alarm system",
  "Fire alarm",
  "Intercom",
  // Other
  "Pet-friendly",
  "Wheelchair Accessible",
  "Elevator",
  "Sub-renting allowed",
  "AirBnB allowed",
];
const HIGHLIGHTS_OPTIONS = [
  // Location related
  "City view",
  "Garden view",
  "Mountain view",
  "Sea view",
  "Panoramic / Stunning Views",
  "Access to Golf Course(s)",
  "Near Tram/Metro/Bus Stop (BE/General)",
  "Near BTS/MRT Station (TH)",
  "Near city center",
  "Rural",
  "Near International School(s)",
  "Close to Major Hospitals/Clinics",
  "Near Business center",
  "Prime Location / Sought-After Area",
  "Expat-Friendly Community/Area",
  "Beachfront / Easy Access to Beach (TH)",
  "Proximity to Parks / Green Spaces",
  "Quiet and Peaceful Neighborhood",
  "Excellent Public Transport Links",
  "Waterfront Property (River/Canal/Sea)",
  "Close to EU Institutions (Brussels, BE)",
  // Energy Efficient related items
  "Double Glazing Windows",
  "Triple Glazing Windows",
  "Solar panels",
  "Good Energy Performance Certificate (EPC)",
  // Property
  "Move-in Ready Condition",
  "Classic/Traditional Charm",
  "Newly Renovated / Modern Interior",
  "Contemporary/Modern Design",
  "Bright and Airy / Abundant Natural Light",
  "Spacious Rooms / Open Floor Plan",
  "High Ceilings",
  "Ample Storage Space",
  "Historic Building / Property with Character",
  "South-facing Garden/Terrace (Valued in BE)",
  "Corner Unit / End Unit (More Privacy/Light)",
  "Top Floor Unit (Views/Quiet)",
  "Ground Floor Unit with Private Garden Access",
  // Financial
  "Strong Investment Potential / Good ROI",
  "Upcoming area",
  "Low Common Area Fees / HOA Dues",
  // Other
  "Ideal for Families",
  "Perfect for Professionals/Couples",
  "Pet-Friendly Building/Community Rules",
];

// --- INTERFACES ---
interface Province {
  name: string;
  cities: string[];
}
interface Country {
  name: string;
  code: string;
  provinces: Province[];
}
interface FeatureDetail {
  count?: number | string;
  description?: string;
  images?: File[];
  individual?: {
    [key: string]: {
      description?: string;
      images?: File[];
    };
  };
}

// --- ZOD VALIDATION SCHEMA ---
const formSchema = z.object({
  name: z.string().min(5, { message: "Property title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  salePrice: z.coerce.number({ required_error: "Asking price is required." }).positive("Price must be a positive number."),
  propertyType: z.string({ required_error: "Please select a property type." }).min(1, "Property type is required."),
  propertyStatus: z.string({ required_error: "Please select a property status." }).min(1, "Property status is required."),
  squareFeet: z.coerce.number({ required_error: "Square meters is required." }).positive("Square meters must be a positive number."),
  country: z.string({ required_error: "Country is required." }).min(1, "Country is required."),
  state: z.string({ required_error: "State/Province is required." }).min(1, "State/Province is required."),
  city: z.string({ required_error: "City is required." }).min(1, "City is required."),
  address: z.string().min(5, { message: "A valid street address is required." }),
  postalCode: z.string().min(3, { message: "A valid postal code is required." }),
  photos: z.array(z.instanceof(File)).min(1, { message: "At least one property photo is required." }),
  termsAgreed: z.boolean().refine((val) => val === true, { message: "You must agree to the terms to proceed." }),
  yearBuilt: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().optional().nullable()),
  HOAFees: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().optional().nullable()),
  amenities: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  agreementDocument: z.any().optional(),
  openHouseDates: z.union([
    z.string().optional(),
    z.array(z.string()).optional()
  ]).optional(),
  sellerNotes: z.string().optional(),
  allowBuyerApplications: z.boolean().default(true),
  preferredFinancingInfo: z.string().optional(),
  insuranceRecommendation: z.string().optional(),
  managedBy: z.string().optional(),
  // FIXED: More flexible features schema
  features: z.any().optional(), // Allow any structure for features
});

type SellerPropertyFormData = z.infer<typeof formSchema> & {
  features?: { [key: string]: FeatureDetail };
};

// --- API CALL FUNCTION (UNCHANGED) ---
const createSellerPropertyAPI = async (
  formData: FormData
): Promise<{ success: boolean; property?: any; message?: string }> => {
  console.log("API CALL (POST): /api/seller-properties...");
  try {
    const response = await fetch("/api/seller-properties", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.message || `Error: ${response.status}`;
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
    toast.success("Property created successfully!");
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
    return {
      success: true,
      property: data,
      message: "property created!",
    };
  } catch (error) {
    console.error("createSellerPropertyAPI error:", error);
    const errorMsg = error instanceof Error ? error.message : "Network error";
    toast.error(errorMsg);
    return {
      success: false,
      message: errorMsg,
    };
  }
};

// --- MAIN COMPONENT ---
const NewSellerPropertyPage = () => {
  const {
    data: authUser,
    error: authQueryError,
    isLoading: authLoading,
  } = useGetAuthUserQuery();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [currentProvinces, setCurrentProvinces] = useState<Province[]>([]);
  const [currentCities, setCurrentCities] = useState<string[]>([]);
  const [availableFeatures] = useState([
    "bedroom",
    "bathroom",
    "dining",
    "kitchen",
    "living_room",
    "garage",
    "garden",
    "balcony",
    "study",
    "storage",
  ]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const form = useForm<SellerPropertyFormData>({
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
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      termsAgreed: false,
      openHouseDates: "",
      sellerNotes: "",
      preferredFinancingInfo: "",
      insuranceRecommendation: "",
      photos: [],
      agreementDocument: undefined,
      features: {},
      managedBy: "", // Initialize as empty string
    },
  });

  const {
    control,
    setValue,
    getValues,
    watch,
    reset,
    handleSubmit,
    unregister,
  } = form;

  const watchedCountry = watch("country");
  const watchedState = watch("state");
  const currentCurrency = watchedCountry === "Belgium" ? "EUR" : "THB";

  // Set managedBy when authUser is available
  useEffect(() => {
    if (authUser?.cognitoInfo?.userId) {
      setValue("managedBy", authUser.cognitoInfo.userId);
    }
  }, [authUser, setValue]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/locations.json");
        if (!response.ok) throw new Error("Failed to fetch location data");
        const data: Country[] = await response.json();
        setAllCountries(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (watchedCountry && allCountries.length > 0) {
      const countryData = allCountries.find((c) => c.name === watchedCountry);
      setCurrentProvinces(countryData ? countryData.provinces : []);
      setValue("state", "");
      setValue("city", "");
      setCurrentCities([]);
    }
  }, [watchedCountry, allCountries, setValue]);

  useEffect(() => {
    if (watchedState && watchedCountry && allCountries.length > 0) {
      const countryData = allCountries.find((c) => c.name === watchedCountry);
      const provinceData = countryData?.provinces.find(
        (p) => p.name === watchedState
      );
      setCurrentCities(provinceData ? provinceData.cities : []);
      setValue("city", "");
    }
  }, [watchedState, watchedCountry, allCountries, setValue]);

  const onInvalid = (errors: any) => {
    console.error("Form validation failed:", errors);
    const errorFields = Object.keys(errors)
      .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
      .join(", ");
    toast.error(`Please fix the errors in the following fields: ${errorFields}`);
  };

// REPLACE your onSubmit function with this properly typed version:

const onSubmit: SubmitHandler<SellerPropertyFormData> = async (submittedData) => {
  setIsSubmitting(true);
  setSubmitMessage(null);

  if (!authUser?.cognitoInfo?.userId) {
    setSubmitMessage({ type: "error", text: "Authentication error. Please log in." });
    setIsSubmitting(false);
    return;
  }

  if (!submittedData.managedBy) {
    submittedData.managedBy = authUser.cognitoInfo.userId;
  }

  const formDataToSubmit = new FormData();

  // Handle regular fields
Object.entries(submittedData).forEach(([key, value]) => {
    const K = key as keyof SellerPropertyFormData;
    if (K === "photos" || K === "agreementDocument" || K === "features") return;
    
    // SPECIAL HANDLING FOR openHouseDates:
    if (K === "openHouseDates") {
      // Convert single string to array, or keep array as is
      let processedDates: string[] = [];
      if (typeof value === 'string' && value.trim()) {
        // Split by comma if it contains commas, otherwise treat as single date
        processedDates = value.includes(',') 
          ? value.split(',').map(date => date.trim()).filter(date => date.length > 0)
          : [value.trim()];
      } else if (Array.isArray(value)) {
        processedDates = value.filter(date => typeof date === 'string' && date.trim().length > 0);
      }
      formDataToSubmit.append(K, JSON.stringify(processedDates));
      return;
    }
    
    // Handle other array fields
    if (Array.isArray(value)) {
      formDataToSubmit.append(K, JSON.stringify(value || []));
    } else if (value !== undefined && value !== null && value !== "") {
      formDataToSubmit.append(K, String(value));
    }
  });

  // ENHANCED: Handle features with individual room data
  const featuresForJson: { [key: string]: any } = {};
  
  if (submittedData.features) {
    Object.entries(submittedData.features).forEach(([featureKey, featureDetail]) => {
      const detail = featureDetail as FeatureDetail;
      
      // Prepare the basic feature data (no images yet)
      featuresForJson[featureKey] = {
        count: Number(detail.count),
        description: detail.description,
      };

      // Handle individual room data (descriptions only, images handled separately)
      if (detail.individual) {
        const individualData: { [key: string]: any } = {};
        
        Object.entries(detail.individual).forEach(([roomIndex, roomData]) => {
          const room = roomData as { description?: string; images?: File[] };
          
          // Store only description in JSON, images handled as files
          individualData[roomIndex] = {
            description: room.description,
          };
          
          // CRITICAL: Handle individual room images as separate FormData entries
          if (room.images && room.images.length > 0) {
            room.images.forEach((file, fileIndex) => {
              console.log(`Adding individual room image: features[${featureKey}][individual][${roomIndex}][images][${fileIndex}]`);
              formDataToSubmit.append(`features[${featureKey}][individual][${roomIndex}][images][${fileIndex}]`, file);
            });
          }
        });
        
        featuresForJson[featureKey].individual = individualData;
      }

      // Handle general feature images
      if (detail.images && detail.images.length > 0) {
        detail.images.forEach((file, fileIndex) => {
          console.log(`Adding general feature image: features[${featureKey}][images][${fileIndex}]`);
          formDataToSubmit.append(`features[${featureKey}][images][${fileIndex}]`, file);
        });
      }
    });
  }
  
  formDataToSubmit.append("features", JSON.stringify(featuresForJson));

  // Handle main property photos
  if (submittedData.photos && submittedData.photos.length > 0) {
    submittedData.photos.forEach((file) => formDataToSubmit.append("photos", file));
  }

  // Handle agreement document
  const agreementFile = submittedData.agreementDocument?.[0];
  if (agreementFile) {
    formDataToSubmit.append("agreementDocument", agreementFile);
  }

  formDataToSubmit.append("sellerCognitoId", authUser.cognitoInfo.userId);

  // DEBUG: Log what we're sending
  console.log("=== FORM DATA DEBUG ===");
  for (const [key, value] of formDataToSubmit.entries()) {
    console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
  }

  const response = await createSellerPropertyAPI(formDataToSubmit);
  if (response.success) {
    setSubmitMessage({ type: "success", text: response.message || "Property listed successfully!" });
    reset();
    setSelectedFeatures([]);
  } else {
    setSubmitMessage({ type: "error", text: response.message || "Failed to list property." });
  }
  setIsSubmitting(false);
};

  const sectionCardClassName = "bg-white shadow-md rounded-xl p-6";
  const sectionTitleClassName = "text-xl font-semibold text-gray-900 mb-1";
  const sectionDescriptionClassName = "text-sm text-gray-600 mb-6";

  if (authLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user information...</p>
      </div>
    );
  if (authQueryError || !authUser)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">
          Error loading user information. Please try refreshing.
        </p>
      </div>
    );
  if (authUser.userInfo.status !== "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-gray-100">
        <div className="bg-white p-8 sm:p-12 rounded-xl shadow-lg">
          <Lock className="mx-auto h-16 w-16 text-yellow-500 mb-5" />
          <h1 className="text-2xl font-bold text-gray-800">
            Account Pending Approval
          </h1>
          <p className="mt-2 text-md text-gray-600">
            Your account must be approved to list a property. Current status:{" "}
            <span className="font-semibold text-yellow-600">
              {authUser.userInfo.status.toUpperCase()}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          List Your Property
        </h1>
        <div className="text-md text-gray-600 mt-1 space-y-4">
          <p>
            Through the form below you will be able to provide details regarding
            your property.
          </p>

          <div>
            <p className="mb-2">
              You will be asked at a later stage what you want to do:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Track your property</li>
              <li>Rent out your property</li>
              <li>Sell your property</li>
            </ol>
          </div>

          <p className="text-sm italic">
            You will need to create the property first and if desired you can
            assign an agent later on.
          </p>
        </div>
      </header>

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
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="space-y-8"
        >
          {/* Property Overview */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Property Overview</h2>
            <div className="space-y-4">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Title / Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Modern Beachfront Villa"
                        {...field}
                      />
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
                        placeholder="At Least 20 Charecters"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Location Section */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Location</h2>
            <p className={sectionDescriptionClassName}>
              Specify the property&apos;s location details.
            </p>
            <div className="space-y-4">
              <FormField
                control={control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select Country --" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCountries.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={
                          !watchedCountry || currentProvinces.length === 0
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- Select State/Province --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentProvinces.map((p) => (
                            <SelectItem key={p.name} value={p.name}>
                              {p.name}
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!watchedState || currentCities.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- Select City --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentCities.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 123 Main St, Apt 4B"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal/Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10110 or B-1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Sale Details */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asking Price ({currentCurrency})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5000000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="propertyStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select Status --" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="For Sale">For Sale</SelectItem>
                        <SelectItem value="For Rent">For Rent</SelectItem>
                      </SelectContent>
                    </Select>
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
            </div>
          </div>

          {/* Property Features Section */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Property Features</h2>
            <p className={sectionDescriptionClassName}>
              Select features your property has and specify details for each.
            </p>
            <div className="mb-6">
              <FormLabel>Available Features</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-3">
                {availableFeatures.map((feature) => (
                  <div key={feature} className="flex items-center">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFeatures([...selectedFeatures, feature]);
                          setValue(`features.${feature}`, {
                            count: 1,
                            description: "",
                            images: [],
                          });
                        } else {
                          setSelectedFeatures(
                            selectedFeatures.filter((f) => f !== feature)
                          );
                          unregister(`features.${feature}`);
                        }
                      }}
                    />
                    <label
                      htmlFor={`feature-${feature}`}
                      className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                    >
                      {feature.replace("_", " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

{selectedFeatures.map((feature) => (
  <div key={feature} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
    <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">{feature.replace("_", " ")} Details</h3>
    
    {/* Count and General Description */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <FormField control={control} name={`features.${feature}.count`} render={({ field }) => (
        <FormItem>
          <FormLabel>Number of {feature.replace("_", " ")}s</FormLabel>
          <FormControl><Input type="number" min="1" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}/>
      <FormField control={control} name={`features.${feature}.description`} render={({ field }) => (
        <FormItem>
          <FormLabel>General Description (Optional)</FormLabel>
          <FormControl><Input placeholder={`General notes about ${feature.replace("_", " ")}s...`} {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}/>
    </div>

    {/* General Feature Photos */}
    <div className="mb-6">
      <FormField control={control} name={`features.${feature}.images`} render={({ field }) => (
        <FormItem>
          <FormLabel>General {feature.replace("_", " ").charAt(0).toUpperCase() + feature.replace("_", " ").slice(1)} Photos</FormLabel>
          <FormControl>
            <FilePond
              files={(field.value as File[]) || []}
              onupdatefiles={(fileItems) => field.onChange(fileItems.map(item => item.file as File))}
              allowMultiple={true} maxFiles={5} name={`${feature}-images`} 
              labelIdle={`Drag & Drop or <span class="filepond--label-action">Browse</span>`}
              acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]} maxFileSize="5MB" credits={false}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}/>
    </div>

    {/* Individual Room Details - NOW WORKS FOR ALL ROOM TYPES */}
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-gray-800">Individual {feature.replace("_", " ").charAt(0).toUpperCase() + feature.replace("_", " ").slice(1)} Details</h4>
        <p className="text-sm text-gray-600">Describe each {feature.replace("_", " ")} separately</p>
      </div>
      
      {/* Generate individual sections based on count for ANY feature type */}
      {Array.from({ length: parseInt(String(getValues(`features.${feature}.count`) || '1'), 10) }, (_, index) => (
        <div key={index} className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-3 capitalize">
            {feature.replace("_", " ")} {index + 1}
          </h5>
          
          <div className="space-y-4">
            {/* Individual description */}
            <FormField 
              control={control} 
              name={`features.${feature}.individual.${index}.description`} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={`Describe ${feature.replace("_", " ")} ${index + 1} (size, layout, special features, etc.)`} 
                      rows={2} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Individual photos */}
            <FormField 
              control={control} 
              name={`features.${feature}.individual.${index}.images`} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Photos for {feature.replace("_", " ").charAt(0).toUpperCase() + feature.replace("_", " ").slice(1)} {index + 1}</FormLabel>
                  <FormControl>
                    <FilePond
                      files={(field.value as File[]) || []}
                      onupdatefiles={(fileItems) => field.onChange(fileItems.map(item => item.file as File))}
                      allowMultiple={true} 
                      maxFiles={3} 
                      name={`${feature}-${index}-images`}
                      labelIdle={`<span class="filepond--label-action">Browse</span> or drag photos for ${feature.replace("_", " ")} ${index + 1}`}
                      acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]} 
                      maxFileSize="5MB" 
                      credits={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
))}

            <FormField
              control={control}
              name="squareFeet"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Total squareMeters (approx.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="100"
                      placeholder="e.g. 1500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Media & Documents Section */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Media & Documents</h2>
            <div className="space-y-6">
              <FormField
                control={control}
                name="photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Photos (Required)</FormLabel>
                    <FormDescription>
                      Upload up to 10 images. JPG, PNG, WEBP accepted. Max 5MB
                      each.
                    </FormDescription>
                    <FormControl>
                      <FilePond
                        files={field.value as File[]}
                        onupdatefiles={(fileItems) =>
                          field.onChange(
                            fileItems.map((item) => item.file as File)
                          )
                        }
                        allowMultiple={true}
                        maxFiles={10}
                        name="photos"
                        labelIdle={`Drag & Drop or <span class="filepond--label-action">Browse</span>`}
                        allowImagePreview={true}
                        imagePreviewHeight={160}
                        acceptedFileTypes={[
                          "image/png",
                          "image/jpeg",
                          "image/webp",
                        ]}
                        allowFileSizeValidation={true}
                        maxFileSize="5MB"
                        credits={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="agreementDocument"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>
                      Agreement Template / Info (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => onChange(e.target.files)}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Additional Information for Buyers */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>
              Additional Information
            </h2>
            <div className="space-y-4">
              <FormField
                control={control}
                name="openHouseDates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Open House Dates & Times (e.g.Sat 2-4pm, Sun 1-3pm)
                    </FormLabel>
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
              <FormField
                control={control}
                name="allowBuyerApplications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Allow interested buyers to submit inquiries through the
                      platform.
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="preferredFinancingInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Preferred Financing / Banking Services (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Seller prefers offers with pre-approval from XYZ Bank."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="insuranceRecommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Recommendations (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Consider ABC Insurance for competitive rates."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Amenities & Highlights */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Detailed Features</h2>
            <p className={sectionDescriptionClassName}>
              Select all applicable features and highlights.
            </p>
            <div className="space-y-6">
              <FormField
                control={control}
                name="amenities"
                render={() => (
                  <FormItem>
                    <FormLabel>Amenities</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50">
                      {AMENITIES_OPTIONS.map((item) => (
                        <FormField
                          key={item}
                          control={control}
                          name="amenities"
                          render={({ field }) => (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value || []),
                                          item,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
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
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value || []),
                                          item,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
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
          </div>

          {/* Terms and Conditions */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Confirmation</h2>
            <FormField
              control={control}
              name="termsAgreed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that the information provided is accurate to the
                      best of my knowledge.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Submission */}
          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "List Property"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewSellerPropertyPage;
