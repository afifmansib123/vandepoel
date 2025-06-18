// src/app/(dashboard)/landlords/newproperty/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

// --- FilePond Imports ---
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css"; // Main FilePond CSS
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css"; // Image Preview plugin CSS
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size"; // For file size validation

import { useGetAuthUserQuery } from "@/state/api";

// --- Register FilePond plugins ---
registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

// Icons
import { UploadCloud, XCircle, ImageOff } from "lucide-react"; // ImageOff might not be needed anymore

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Options for select dropdowns (untouched)
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

// Add these interfaces, for example, after SellerPropertyFormData
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
  count?: number;
  description?: string;
  images?: File[]; // Feature-specific images
}

interface SellerPropertyFormData {
  name: string;
  description: string;
  salePrice: number;
  propertyType: string;
  propertyStatus: string;
  amenities: string[];
  highlights: string[];
  squareFeet: number;
  yearBuilt?: number | null;
  HOAFees?: number | null;
  photos?: File[]; // Stays as File[]
  agreementDocument?: FileList;
  openHouseDates?: string;
  sellerNotes?: string;
  allowBuyerApplications: boolean;
  preferredFinancingInfo?: string;
  insuranceRecommendation?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  termsAgreed?: boolean;
  features: { [key: string]: FeatureDetail };
}

const createSellerPropertyAPI = async (
  formData: FormData
): Promise<{ success: boolean; property?: any; message?: string }> => {
  console.log(
    "API CALL (POST): /api/seller-properties - Creating new seller property..."
  );
  try {
    const response = await fetch("/api/seller-properties", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok)
      return {
        success: false,
        message: data.message || `Error: ${response.status}`,
      };
    return {
      success: true,
      property: data,
      message: "Seller property created!",
    };
  } catch (error) {
    console.error("createSellerPropertyAPI error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
};

const NewSellerPropertyPage = () => {
  // Use the hook directly in the component
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
    defaultValues: {
      name: "",
      description: "",
      salePrice: undefined,
      propertyType: "",
      propertyStatus: "For Sale",
      squareFeet: undefined,
      yearBuilt: null,
      HOAFees: null,
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
      photos: [], // Default to empty array for FilePond
      agreementDocument: undefined,
      features: {},
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedCountry = watch("country");
  const watchedState = watch("state");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/locations.json"); // Assumes locations.json is in /public
        if (!response.ok) {
          console.error(
            "Failed to fetch location data. Status:",
            response.status
          );
          throw new Error("Failed to fetch location data");
        }
        const data: Country[] = await response.json();
        setAllCountries(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
        // Optionally, set an error state here to inform the user
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (watchedCountry && allCountries.length > 0) {
      const countryData = allCountries.find((c) => c.name === watchedCountry);
      if (countryData) {
        setCurrentProvinces(countryData.provinces);
      } else {
        setCurrentProvinces([]);
      }
      // Reset dependent fields when country changes.
      // Only validate if there was already an error to avoid premature error messages.
      setValue("state", "", { shouldValidate: !!errors.state });
      setValue("city", "", { shouldValidate: !!errors.city });
      setCurrentCities([]); // Clear city options as well
    } else {
      // If country is not selected or data isn't loaded, clear subsequent dropdowns
      setCurrentProvinces([]);
      setCurrentCities([]);
      // Ensure form values are also cleared if they were somehow set
      if (getValues("state") !== "")
        setValue("state", "", { shouldValidate: !!errors.state });
      if (getValues("city") !== "")
        setValue("city", "", { shouldValidate: !!errors.city });
    }
  }, [
    watchedCountry,
    allCountries,
    setValue,
    getValues,
    errors.state,
    errors.city,
  ]);

  // Effect for when 'state' (province/region) field changes to update city options
  useEffect(() => {
    if (watchedState && watchedCountry && allCountries.length > 0) {
      const countryData = allCountries.find((c) => c.name === watchedCountry);
      if (countryData) {
        const provinceData = countryData.provinces.find(
          (p) => p.name === watchedState
        );
        if (provinceData) {
          setCurrentCities(provinceData.cities);
        } else {
          setCurrentCities([]);
        }
      } else {
        setCurrentCities([]);
      }
      setValue("city", "", { shouldValidate: !!errors.city }); // Reset city when state/province changes
    } else {
      // If state/province is not selected (or country is missing), clear city options
      setCurrentCities([]);
      if (getValues("city") !== "")
        setValue("city", "", { shouldValidate: !!errors.city });
    }
  }, [
    watchedState,
    watchedCountry,
    allCountries,
    setValue,
    getValues,
    errors.city,
  ]);

  const onSubmit: SubmitHandler<SellerPropertyFormData> = async (
    submittedData
  ) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    if (!authUser?.cognitoInfo?.userId) {
      setSubmitMessage({
        type: "error",
        text: "Authentication error. Please log in.",
      });
      setIsSubmitting(false);
      return;
    }

    const currentFormValues = getValues();
    const data = { ...currentFormValues, ...submittedData };
    const processedData: SellerPropertyFormData = { ...data };

    if (!String(processedData.name || "").trim())
      processedData.name = "Placeholder Property Name";
    if (!Array.isArray(processedData.amenities)) processedData.amenities = [];
    if (!Array.isArray(processedData.highlights)) processedData.highlights = [];
    if (!Array.isArray(processedData.photos)) processedData.photos = [];

    const formDataToSubmit = new FormData();

    // Handle regular fields
    Object.entries(processedData).forEach(([key, value]) => {
      const K = key as keyof SellerPropertyFormData;
      if (K === "photos" || K === "agreementDocument" || K === "features")
        return;
      if (K === "amenities" || K === "highlights") {
        formDataToSubmit.append(K, JSON.stringify(value || []));
      } else if (K === "openHouseDates") {
        if (value === "Not scheduled") {
          formDataToSubmit.append(K, JSON.stringify(["Not scheduled"]));
        } else if (typeof value === "string" && value.trim()) {
          formDataToSubmit.append(
            K,
            JSON.stringify(
              value
                .split(",")
                .map((d) => d.trim())
                .filter((d) => d)
            )
          );
        } else {
          formDataToSubmit.append(K, JSON.stringify([]));
        }
      } else if (value !== undefined && value !== null) {
        formDataToSubmit.append(K, String(value));
      }
    });

    // Handle features - prepare features object without images for JSON
    const featuresForJson: { [key: string]: Omit<FeatureDetail, "images"> } =
      {};
    Object.entries(processedData.features || {}).forEach(
      ([featureKey, featureDetail]) => {
        featuresForJson[featureKey] = {
          count: featureDetail.count,
          description: featureDetail.description,
        };
      }
    );
    formDataToSubmit.append("features", JSON.stringify(featuresForJson));

    // Handle main property photos
    if (processedData.photos && processedData.photos.length > 0) {
      processedData.photos.forEach((file) => {
        if (file instanceof File) {
          formDataToSubmit.append("photos", file);
        }
      });
    }

    // Handle feature-specific images
    Object.entries(processedData.features || {}).forEach(
      ([featureKey, featureDetail]) => {
        if (featureDetail.images && featureDetail.images.length > 0) {
          featureDetail.images.forEach((file) => {
            if (file instanceof File) {
              formDataToSubmit.append(`features[${featureKey}][images]`, file);
            }
          });
        }
      }
    );

    // Handle agreement document
    if (
      processedData.agreementDocument &&
      processedData.agreementDocument.length > 0
    ) {
      formDataToSubmit.append(
        "agreementDocument",
        processedData.agreementDocument[0]
      );
    }

    // Add the cognito ID
    formDataToSubmit.append("sellerCognitoId", authUser.cognitoInfo.userId);

    console.log("Submitting with Cognito ID:", authUser.cognitoInfo.userId);

    const response = await createSellerPropertyAPI(formDataToSubmit);
    if (response.success) {
      setSubmitMessage({
        type: "success",
        text: response.message || "Property listed successfully!",
      });
      reset();
      setSelectedFeatures([]); // Reset selected features
    } else {
      setSubmitMessage({
        type: "error",
        text: response.message || "Failed to list property.",
      });
    }
    setIsSubmitting(false);
  };

  // Style constants (untouched)
  const inputClassName =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClassName = "block text-sm font-medium text-gray-700";
  const sectionCardClassName = "bg-white shadow-md rounded-xl p-6";
  const sectionTitleClassName = "text-xl font-semibold text-gray-900 mb-1";
  const sectionDescriptionClassName = "text-sm text-gray-600 mb-6";

  // Handle loading and error states
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user information...</p>
      </div>
    );
  }

  if (authQueryError || !authUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">
          {authQueryError
            ? "Error loading user information. Please try refreshing the page."
            : "Failed to load user info."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          List Your Property for Sale
        </h1>
        <p className="text-md text-gray-600 mt-1">
          Provide details to attract potential buyers.
        </p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Property Overview</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className={labelClassName}>
                  Property Title / Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="description" className={labelClassName}>
                  Description
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={5}
                  className={inputClassName}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Sale Details */}
          {/* Sale Details */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Sale Information</h2>
            {/* Change grid-cols-2 to grid-cols-3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="salePrice" className={labelClassName}>
                  Asking Price (THB)
                </label>
                <input
                  type="number"
                  id="salePrice"
                  {...register("salePrice", { valueAsNumber: true })}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="propertyStatus" className={labelClassName}>
                  Property Status
                </label>
                <input
                  type="text"
                  id="propertyStatus"
                  readOnly
                  {...register("propertyStatus")}
                  className={inputClassName}
                />
              </div>

              {/* --- PASTE THE MISSING CODE HERE --- */}
              <div>
                <label htmlFor="propertyType" className={labelClassName}>
                  Property Type
                </label>
                <select
                  id="propertyType"
                  {...register("propertyType")}
                  className={inputClassName}
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Select Property Type --
                  </option>
                  {PROPERTY_TYPES_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {/* --- END OF PASTED CODE --- */}
            </div>
          </div>

          {/* Property Features Section */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Property Features</h2>
            <p className={sectionDescriptionClassName}>
              Select features your property has and specify details for each.
            </p>

            {/* Feature Selection */}
            <div className="mb-6">
              <label className={`${labelClassName} mb-3`}>
                Available Features
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {availableFeatures.map((feature) => (
                  <div key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`feature-${feature}`}
                      checked={selectedFeatures.includes(feature)}
                      onChange={(e) => {
                        const currentFeatures = getValues("features") || {};
                        if (e.target.checked) {
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
                          const newFeatures = { ...currentFeatures };
                          delete newFeatures[feature];
                          setValue("features", newFeatures);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`feature-${feature}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer select-none capitalize"
                    >
                      {feature.replace("_", " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Details */}
            {selectedFeatures.map((feature) => (
              <div
                key={feature}
                className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                  {feature.replace("_", " ")} Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Count */}
                  <div>
                    <label
                      htmlFor={`${feature}-count`}
                      className={labelClassName}
                    >
                      Number of {feature.replace("_", " ")}s
                    </label>
                    <input
                      type="number"
                      id={`${feature}-count`}
                      min="1"
                      {...register(`features.${feature}.count` as any, {
                        valueAsNumber: true,
                      })}
                      className={inputClassName}
                      defaultValue={1}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor={`${feature}-description`}
                      className={labelClassName}
                    >
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      id={`${feature}-description`}
                      {...register(`features.${feature}.description` as any)}
                      className={inputClassName}
                      placeholder={`Describe the ${feature.replace(
                        "_",
                        " "
                      )}...`}
                    />
                  </div>
                </div>

                {/* Feature Images */}
                <div>
                  <FormLabel className={`${labelClassName} mb-2`}>
                    {feature.replace("_", " ").charAt(0).toUpperCase() +
                      feature.replace("_", " ").slice(1)}{" "}
                    Photos
                  </FormLabel>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload images specific to this {feature.replace("_", " ")}.
                    Max 5 images, 5MB each.
                  </p>
                  <FormField
                    control={control}
                    name={`features.${feature}.images` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FilePond
                            files={(field.value as File[]) || []}
                            onupdatefiles={(fileItems) => {
                              const files = fileItems.map(
                                (fileItem) => fileItem.file as File
                              );
                              field.onChange(files);
                            }}
                            allowMultiple={true}
                            maxFiles={5}
                            name={`${feature}-images`}
                            labelIdle={`Drag & Drop ${feature.replace(
                              "_",
                              " "
                            )} images or <span class="filepond--label-action">Browse</span>`}
                            allowImagePreview={true}
                            imagePreviewHeight={120}
                            imagePreviewMaxFileSize="5MB"
                            acceptedFileTypes={[
                              "image/png",
                              "image/jpeg",
                              "image/webp",
                            ]}
                            labelFileTypeNotAllowed="Invalid file type"
                            fileValidateTypeLabelExpectedTypes="Expects PNG, JPG, or WEBP"
                            allowFileSizeValidation={true}
                            maxFileSize="5MB"
                            labelMaxFileSizeExceeded="File is too large"
                            labelMaxFileSize="Maximum file size is {filesize}"
                            credits={false}
                          />
                        </FormControl>
                        <FormMessage>
                          {
                            errors.features?.[feature]?.images
                              ?.message as React.ReactNode
                          }
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            {/* Square Feet - moved here */}
            <div className="mt-6">
              <label htmlFor="squareFeet" className={labelClassName}>
                Total Square Feet (approx.)
              </label>
              <input
                type="number"
                id="squareFeet"
                step="100"
                {...register("squareFeet", { valueAsNumber: true })}
                className={inputClassName}
              />
            </div>
          </div>

          {/* Location Section */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Location</h2>
            <p className={sectionDescriptionClassName}>
              Specify the property's location details.
            </p>
            <div className="space-y-4">
              {/* Row 1: Country */}
              <div>
                <label htmlFor="country" className={labelClassName}>
                  Country
                </label>
                <select
                  id="country"
                  {...register("country", { required: "Country is required" })}
                  className={inputClassName}
                >
                  <option value="">-- Select Country --</option>
                  {allCountries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <FormMessage>{errors.country.message}</FormMessage>
                )}
              </div>

              {/* Row 2: State/Province and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="state" className={labelClassName}>
                    State/Province
                  </label>
                  <select
                    id="state"
                    {...register("state", {
                      required: "State/Province is required",
                    })}
                    className={inputClassName}
                    disabled={!watchedCountry || currentProvinces.length === 0}
                  >
                    <option value="">-- Select State/Province --</option>
                    {currentProvinces.map((province) => (
                      <option key={province.name} value={province.name}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <FormMessage>{errors.state.message}</FormMessage>
                  )}
                </div>
                <div>
                  <label htmlFor="city" className={labelClassName}>
                    City
                  </label>
                  <select
                    id="city"
                    {...register("city", { required: "City is required" })}
                    className={inputClassName}
                    disabled={!watchedState || currentCities.length === 0}
                  >
                    <option value="">-- Select City --</option>
                    {currentCities.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <FormMessage>{errors.city.message}</FormMessage>
                  )}
                </div>
              </div>

              {/* Row 3: Street Address and Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="address" className={labelClassName}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    {...register("address", {
                      required: "Street address is required",
                    })}
                    className={inputClassName}
                    placeholder="e.g., 123 Main St, Apt 4B"
                  />
                  {errors.address && (
                    <FormMessage>{errors.address.message}</FormMessage>
                  )}
                </div>
                <div>
                  <label htmlFor="postalCode" className={labelClassName}>
                    Postal/Zip Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    {...register("postalCode", {
                      required: "Postal code is required",
                    })}
                    className={inputClassName}
                    placeholder="e.g., 10110 or B-1000"
                  />
                  {errors.postalCode && (
                    <FormMessage>{errors.postalCode.message}</FormMessage>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Media & Documents Section with FilePond */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Media & Documents</h2>
            <div className="space-y-6">
              {/* Property Photos - Using FilePond */}
              <div>
                <FormLabel className={`${labelClassName} mb-2`}>
                  Property Photos
                </FormLabel>
                <p className="text-xs text-gray-500 mb-3">
                  Upload up to 10 images. JPG, PNG, WEBP accepted. Max 5MB each.
                </p>
                <FormField
                  control={control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FilePond
                          files={field.value as File[]} // RHF value will be File[]
                          onupdatefiles={(fileItems) => {
                            const files = fileItems.map(
                              (fileItem) => fileItem.file as File
                            );
                            field.onChange(files); // Update RHF
                          }}
                          allowMultiple={true}
                          maxFiles={10}
                          name={field.name} // "photos"
                          labelIdle={`Drag & Drop your images or <span class="filepond--label-action">Browse</span>`}
                          // Image Preview plugin
                          allowImagePreview={true}
                          imagePreviewHeight={160} // Adjust as needed
                          imagePreviewMaxFileSize="5MB" // Corresponds to FileValidateSize
                          // File Type Validation plugin
                          acceptedFileTypes={[
                            "image/png",
                            "image/jpeg",
                            "image/webp",
                          ]}
                          labelFileTypeNotAllowed="Invalid file type"
                          fileValidateTypeLabelExpectedTypes="Expects PNG, JPG, or WEBP"
                          // File Size Validation plugin
                          allowFileSizeValidation={true}
                          maxFileSize="5MB"
                          labelMaxFileSizeExceeded="File is too large"
                          labelMaxFileSize="Maximum file size is {filesize}"
                          credits={false} // Removes "Powered by PQINA"
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.photos?.message as React.ReactNode}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {/* Agreement Document */}
              <div>
                <label htmlFor="agreementDocument" className={labelClassName}>
                  Sales Agreement Template / Info (Optional)
                </label>
                <input
                  type="file"
                  id="agreementDocument"
                  {...register("agreementDocument")}
                  accept=".pdf,.doc,.docx,.txt"
                  className={`${inputClassName} p-0 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100`}
                />
              </div>
            </div>
          </div>

          {/* Additional Information for Buyers */}
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>
              Additional Information for Buyers
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="openHouseDates" className={labelClassName}>
                  Open House Dates & Times (e.g., "Sat 2-4pm, Sun 1-3pm")
                </label>
                <input
                  type="text"
                  id="openHouseDates"
                  {...register("openHouseDates")}
                  className={inputClassName}
                  placeholder="Enter dates, comma-separated"
                />
              </div>
              <div>
                <label htmlFor="sellerNotes" className={labelClassName}>
                  Special Notes from Seller
                </label>
                <textarea
                  id="sellerNotes"
                  {...register("sellerNotes")}
                  rows={3}
                  className={inputClassName}
                  placeholder="e.g., Recently updated kitchen, motivated seller."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowBuyerApplications"
                  {...register("allowBuyerApplications")}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="allowBuyerApplications"
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  Allow interested buyers to submit inquiries/applications
                  through the platform.
                </label>
              </div>
              <div>
                <label
                  htmlFor="preferredFinancingInfo"
                  className={labelClassName}
                >
                  Preferred Financing / Banking Services (Optional)
                </label>
                <textarea
                  id="preferredFinancingInfo"
                  {...register("preferredFinancingInfo")}
                  rows={2}
                  className={inputClassName}
                  placeholder="e.g., Seller prefers offers with pre-approval from XYZ Bank."
                />
              </div>
              <div>
                <label
                  htmlFor="insuranceRecommendation"
                  className={labelClassName}
                >
                  Insurance Recommendations (Optional)
                </label>
                <textarea
                  id="insuranceRecommendation"
                  {...register("insuranceRecommendation")}
                  rows={2}
                  className={inputClassName}
                  placeholder="e.g., Consider ABC Insurance for competitive homeowners rates."
                />
              </div>
            </div>
          </div>

          {/* Property Features - Checkbox Groups (Untouched) */}
          <div className={sectionCardClassName}>
            {/* ... content ... */}
            <h2 className={sectionTitleClassName}>Property Features</h2>
            <p className={sectionDescriptionClassName}>
              Select all applicable features and highlights.
            </p>
            <div className="mb-6">
              <label className={`${labelClassName} mb-2`}>Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50">
                {AMENITIES_OPTIONS.map((amenity) => (
                  <div key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`amenity-${amenity
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                      value={amenity}
                      {...register("amenities")}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`amenity-${amenity
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={`${labelClassName} mb-2`}>
                Property Highlights
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50">
                {HIGHLIGHTS_OPTIONS.map((highlight) => (
                  <div key={highlight} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`highlight-${highlight
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                      value={highlight}
                      {...register("highlights")}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`highlight-${highlight
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
                    >
                      {highlight}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Terms and Conditions (Untouched) */}
          <div className={sectionCardClassName}>
            {/* ... content ... */}
            <h2 className={sectionTitleClassName}>Confirmation</h2>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsAgreed"
                  type="checkbox"
                  {...register("termsAgreed")}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="termsAgreed"
                  className="font-medium text-gray-700 cursor-pointer select-none"
                >
                  I confirm that the information provided is accurate to the
                  best of my knowledge.
                </label>
                {errors.termsAgreed && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.termsAgreed.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submission (Untouched) */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-700 text-white w-full mt-8" // Consider using your theme's primary color for consistency
            >
              {isSubmitting ? "Submitting..." : "List Property for Sale"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewSellerPropertyPage;
