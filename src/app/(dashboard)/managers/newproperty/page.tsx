"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAuthUserQuery } from "@/state/api";

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
const PROPERTY_TYPES_OPTIONS = [ "Condominium / Apartment", "House / Villa", "Townhouse", "Land", "Commercial Property (Shop/Office/Warehouse)", "Shophouse (TH-style)", "Studio Apartment", "Mixed-Use Property", "Serviced Apartment", "Bungalow", "Penthouse", "Other Residential", "Other Commercial",];
const AMENITIES_OPTIONS = [ "Swimming Pool", "Fitness Center/Gym", "Covered Parking", "Underground Parking", "24/7 Security", "CCTV", "Elevator", "Garden / Green Space", "Pet-friendly", "Air Conditioning (Central)", "Air Conditioning (Split-unit)", "Balcony", "Terrace", "Rooftop Terrace/Lounge", "High-speed Internet Access", "In-unit Laundry Hookup", "Communal Laundry Facility", "Co-working Space / Business Center", "Shuttle Service (e.g., to BTS/MRT in TH)", "Sauna / Steam Room", "Kids Playground / Play Area", "On-site Convenience Store/Shop", "Keycard Access System", "Bicycle Storage (Common in BE)", "Cellar / Private Storage Room (Common in BE)", "Energy Efficient Appliances/Features", "Central Heating (Common in BE)", "Double Glazing Windows", "Fireplace", "Wheelchair Accessible", "Smart Home Features", "Sea View / River View", "City View", "Mountain View", "Fully Furnished", "Partially Furnished", "Unfurnished",];
const HIGHLIGHTS_OPTIONS = [ "Prime Location / Sought-After Area", "Newly Renovated / Modern Interior", "Quiet and Peaceful Neighborhood", "Excellent Public Transport Links", "Near BTS/MRT Station (TH)", "Near Tram/Metro/Bus Stop (BE/General)", "Bright and Airy / Abundant Natural Light", "Spacious Rooms / Open Floor Plan", "Contemporary/Modern Design", "Classic/Traditional Charm", "High Ceilings", "Ample Storage Space", "Strong Investment Potential / Good ROI", "Move-in Ready Condition", "Panoramic / Stunning Views", "Waterfront Property (River/Canal/Sea)", "Near International School(s)", "Close to Major Hospitals/Clinics", "Beachfront / Easy Access to Beach (TH)", "Access to Golf Course(s)", "Expat-Friendly Community/Area", "Low Common Area Fees / HOA Dues", "Close to EU Institutions (Brussels, BE)", "Historic Building / Property with Character", "South-facing Garden/Terrace (Valued in BE)", "Good Energy Performance Certificate (EPC)", "Proximity to Parks / Green Spaces", "Corner Unit / End Unit (More Privacy/Light)", "Top Floor Unit (Views/Quiet)", "Ground Floor Unit with Private Garden Access", "Gated Community / Secure Compound", "Ideal for Families", "Perfect for Professionals/Couples", "Pet-Friendly Building/Community Rules",];

// --- INTERFACES ---
interface Province { name: string; cities: string[]; }
interface Country { name: string; code: string; provinces: Province[]; }
interface FeatureDetail { count?: number | string; description?: string; images?: File[]; }

// --- ZOD VALIDATION SCHEMA ---
const formSchema = z.object({
  name: z.string().min(5, { message: "Property title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  salePrice: z.coerce.number({ required_error: "Asking price is required." }).positive("Price must be a positive number."),
  propertyType: z.string({ required_error: "Please select a property type." }).min(1, "Property type is required."),
  propertyStatus: z.string({ required_error: "Please select a property status." }).min(1, "Property status is required."),
  squareFeet: z.coerce.number({ required_error: "Square footage is required." }).positive("Square feet must be a positive number."),
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
  openHouseDates: z.string().optional(),
  sellerNotes: z.string().optional(),
  allowBuyerApplications: z.boolean().default(true),
  preferredFinancingInfo: z.string().optional(),
  insuranceRecommendation: z.string().optional(),
  managedBy: z.string().optional(),
  features: z.record(z.string(), z.object({
    count: z.coerce.number().min(1, "Count must be at least 1."),
    description: z.string().optional(),
    images: z.array(z.instanceof(File)).optional(),
  })).optional(),
});

type SellerPropertyFormData = z.infer<typeof formSchema>;

// --- API CALL FUNCTION ---
const createSellerPropertyAPI = async (formData: FormData): Promise<{ success: boolean; property?: any; message?: string }> => {
  console.log("API CALL (POST): /api/seller-properties...");
  try {
    const response = await fetch("/api/seller-properties", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) return { success: false, message: data.message || `Error: ${response.status}` };
    alert("Seller property created!");
    window.location.href = '/';
    return { success: true, property: data, message: "Seller property created!" };
  } catch (error) {
    console.error("createSellerPropertyAPI error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Network error" };
  }
};

// --- MAIN COMPONENT ---
const NewSellerPropertyPage = () => {
  const { data: authUser, error: authQueryError, isLoading: authLoading } = useGetAuthUserQuery();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string; } | null>(null);

  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [currentProvinces, setCurrentProvinces] = useState<Province[]>([]);
  const [currentCities, setCurrentCities] = useState<string[]>([]);
  const [availableFeatures] = useState(["bedroom", "bathroom", "dining", "kitchen", "living_room", "garage", "garden", "balcony", "study", "storage"]);
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
      managedBy: authUser?.cognitoInfo?.userId,
    },
  });

  const { control, setValue, getValues, watch, reset, handleSubmit, unregister } = form;

  const watchedCountry = watch("country");
  const watchedState = watch("state");
  const currentCurrency = watchedCountry === "Belgium" ? "EUR" : "THB";

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
      setValue("state", "", { shouldValidate: true });
      setValue("city", "", { shouldValidate: true });
      setCurrentCities([]);
    }
  }, [watchedCountry, allCountries, setValue]);

  useEffect(() => {
    if (watchedState && watchedCountry && allCountries.length > 0) {
      const countryData = allCountries.find((c) => c.name === watchedCountry);
      const provinceData = countryData?.provinces.find((p) => p.name === watchedState);
      setCurrentCities(provinceData ? provinceData.cities : []);
      setValue("city", "", { shouldValidate: true });
    }
  }, [watchedState, watchedCountry, allCountries, setValue]);

  const onInvalid = (errors: any) => {
    console.error("Form validation failed:", errors);
    const errorFields = Object.keys(errors).map(key => key.charAt(0).toUpperCase() + key.slice(1)).join(', ');
    alert(`Please fix the errors before submitting.\n\nCheck the following fields: ${errorFields}`);
  };

  const onSubmit: SubmitHandler<SellerPropertyFormData> = async (submittedData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    if (!authUser?.cognitoInfo?.userId) {
      setSubmitMessage({ type: "error", text: "Authentication error. Please log in." });
      setIsSubmitting(false);
      return;
    }
    
    const formDataToSubmit = new FormData();

    Object.entries(submittedData).forEach(([key, value]) => {
      const K = key as keyof SellerPropertyFormData;
      if (K === "photos" || K === "agreementDocument" || K === "features") return;
      if (Array.isArray(value)) {
        formDataToSubmit.append(K, JSON.stringify(value || []));
      } else if (value !== undefined && value !== null && value !== '') {
        formDataToSubmit.append(K, String(value));
      }
    });

    const featuresForJson: { [key: string]: Omit<FeatureDetail, "images"> } = {};
    Object.entries(submittedData.features || {}).forEach(([featureKey, featureDetail]) => {
      featuresForJson[featureKey] = {
        count: Number(featureDetail.count),
        description: featureDetail.description,
      };
      if (featureDetail.images && featureDetail.images.length > 0) {
        featureDetail.images.forEach(file => formDataToSubmit.append(`features[${featureKey}][images]`, file));
      }
    });
    formDataToSubmit.append("features", JSON.stringify(featuresForJson));

    if (submittedData.photos && submittedData.photos.length > 0) {
      submittedData.photos.forEach(file => formDataToSubmit.append("photos", file));
    }
    
    const agreementFile = submittedData.agreementDocument?.[0];
    if (agreementFile) {
      formDataToSubmit.append('agreementDocument', agreementFile);
    }
    
    formDataToSubmit.append("sellerCognitoId", authUser.cognitoInfo.userId);
    
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

  if (authLoading) return <div className="flex justify-center items-center h-screen"><p>Loading user information...</p></div>;
  if (authQueryError || !authUser) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error loading user information. Please try refreshing.</p></div>;
  if (authUser.userInfo.status !== 'approved') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-gray-100">
        <div className="bg-white p-8 sm:p-12 rounded-xl shadow-lg">
          <Lock className="mx-auto h-16 w-16 text-yellow-500 mb-5" />
          <h1 className="text-2xl font-bold text-gray-800">Account Pending Approval</h1>
          <p className="mt-2 text-md text-gray-600">Your account must be approved to list a property. Current status: <span className="font-semibold text-yellow-600">{authUser.userInfo.status.toUpperCase()}</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">List Your Property for Sale</h1>
        <p className="text-md text-gray-600 mt-1">Provide details to attract potential buyers.</p>
      </header>

      {submitMessage && (
        <div className={`mb-6 p-4 rounded-md ${ submitMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700" }`}>
          {submitMessage.text}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Property Overview</h2>
            <div className="space-y-4">
              <FormField control={control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Title / Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Modern Beachfront Villa" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe your property in detail..." rows={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </div>
          
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Location</h2>
            <p className={sectionDescriptionClassName}>Specify the property&apos;s location details.</p>
            <div className="space-y-4">
              <FormField control={control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="-- Select Country --" /></SelectTrigger></FormControl>
                    <SelectContent>{allCountries.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCountry || currentProvinces.length === 0}>
                      <FormControl><SelectTrigger><SelectValue placeholder="-- Select State/Province --" /></SelectTrigger></FormControl>
                      <SelectContent>{currentProvinces.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedState || currentCities.length === 0}>
                      <FormControl><SelectTrigger><SelectValue placeholder="-- Select City --" /></SelectTrigger></FormControl>
                      <SelectContent>{currentCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input placeholder="e.g., 123 Main St, Apt 4B" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={control} name="postalCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal/Zip Code</FormLabel>
                    <FormControl><Input placeholder="e.g., 10110 or B-1000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>
          </div>
          
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Sale Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={control} name="salePrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Asking Price ({currentCurrency})</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 5000000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="propertyStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="-- Select Status --" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="For Sale">For Sale</SelectItem>
                      <SelectItem value="For Rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="propertyType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="-- Select Property Type --" /></SelectTrigger></FormControl>
                    <SelectContent>{PROPERTY_TYPES_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </div>

          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Property Features</h2>
            <p className={sectionDescriptionClassName}>Select features your property has and specify details for each.</p>
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
                          setValue(`features.${feature}`, { count: 1, description: "", images: [] });
                        } else {
                          setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
                          unregister(`features.${feature}`);
                        }
                      }}
                    />
                    <label htmlFor={`feature-${feature}`} className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                      {feature.replace("_", " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {selectedFeatures.map((feature) => (
              <div key={feature} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">{feature.replace("_", " ")} Details</h3>
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl><Input placeholder={`Describe the ${feature.replace("_", " ")}...`} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <div>
                  <FormField control={control} name={`features.${feature}.images`} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{feature.replace("_", " ").charAt(0).toUpperCase() + feature.replace("_", " ").slice(1)} Photos</FormLabel>
                      <FormControl>
                        <FilePond
                          files={(field.value as File[]) || []}
                          onupdatefiles={(fileItems) => field.onChange(fileItems.map(item => item.file as File))}
                          allowMultiple={true} maxFiles={5} name={`${feature}-images`} labelIdle={`Drag & Drop or <span class="filepond--label-action">Browse</span>`}
                          acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]} maxFileSize="5MB" credits={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
              </div>
            ))}

            <FormField control={control} name="squareFeet" render={({ field }) => (
              <FormItem className="mt-6">
                <FormLabel>Total Square Feet (approx.)</FormLabel>
                <FormControl><Input type="number" step="100" placeholder="e.g. 1500" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>

          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Media & Documents</h2>
            <div className="space-y-6">
              <FormField control={control} name="photos" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Photos (Required)</FormLabel>
                  <FormDescription>Upload up to 10 images. JPG, PNG, WEBP accepted. Max 5MB each.</FormDescription>
                  <FormControl>
                    <FilePond
                      files={field.value as File[]}
                      onupdatefiles={(fileItems) => field.onChange(fileItems.map(item => item.file as File))}
                      allowMultiple={true} maxFiles={10} name="photos" labelIdle={`Drag & Drop or <span class="filepond--label-action">Browse</span>`}
                      allowImagePreview={true} imagePreviewHeight={160} acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
                      allowFileSizeValidation={true} maxFileSize="5MB" credits={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="agreementDocument" render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Sales Agreement Template / Info (Optional)</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => onChange(e.target.files)} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </div>
          
          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Additional Information for Buyers</h2>
            <div className="space-y-4">
              <FormField control={control} name="openHouseDates" render={({ field }) => (
                <FormItem>
                  <FormLabel>Open House Dates & Times (e.g. Sat 2-4pm, Sun 1-3pm)</FormLabel>
                  <FormControl><Input placeholder="Enter dates, comma-separated" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="sellerNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Notes from Seller</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Recently updated kitchen, motivated seller." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="allowBuyerApplications" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="font-normal">Allow interested buyers to submit inquiries through the platform.</FormLabel>
                </FormItem>
              )}/>
              <FormField control={control} name="preferredFinancingInfo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Financing / Banking Services (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Seller prefers offers with pre-approval from XYZ Bank." rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="insuranceRecommendation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Recommendations (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Consider ABC Insurance for competitive rates." rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </div>

          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Detailed Features</h2>
            <p className={sectionDescriptionClassName}>Select all applicable features and highlights.</p>
            <div className="space-y-6">
              <FormField control={control} name="amenities" render={() => (
                <FormItem>
                  <FormLabel>Amenities</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50">
                    {AMENITIES_OPTIONS.map((item) => (
                      <FormField key={item} control={control} name="amenities" render={({ field }) => (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item])
                                  : field.onChange(field.value?.filter((value) => value !== item));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item}</FormLabel>
                        </FormItem>
                      )}/>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={control} name="highlights" render={() => (
                <FormItem>
                  <FormLabel>Property Highlights</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50">
                    {HIGHLIGHTS_OPTIONS.map((item) => (
                      <FormField key={item} control={control} name="highlights" render={({ field }) => (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item])
                                  : field.onChange(field.value?.filter((value) => value !== item));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item}</FormLabel>
                        </FormItem>
                      )}/>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </div>

          <div className={sectionCardClassName}>
            <h2 className={sectionTitleClassName}>Confirmation</h2>
            <FormField control={control} name="termsAgreed" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I confirm that the information provided is accurate to the best of my knowledge.</FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}/>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "List Property for Sale"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewSellerPropertyPage;