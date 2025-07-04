"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Star,
  Phone,
  HelpCircle,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  // Add these new icons for highlights and amenities
  Wifi,
  Car,
  Waves,
  Trees,
  Dumbbell,
  Flame,
  Snowflake,
  ChefHat,
  Tv,
  Dog,
  Camera,
  Lock,
  Sun,
  Users,
  Coffee,
  Gamepad2,
  Baby,
} from "lucide-react";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // For the top image carousel

// Components from the "zip file" (initial user provided files)
import ApplicationModal from "@/app/(nondashboard)/search/[id]/ApplicationModal"; // Adjusted path
import { useGetAuthUserQuery } from "@/state/api";

import {
  Wrench,
  X,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Droplet,
  Zap,
  Wind,
  Settings,
  Home,
  Shield,
  Bug,
  Hammer,
} from "lucide-react";

// 2. ADD THESE TYPE DEFINITIONS (paste after your existing interfaces)
interface MaintenanceSubItem {
  name: string;
}

interface MaintenanceCategory {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  iconColor: string;
  subItems: MaintenanceSubItem[];
}

interface UrgencyLevel {
  level: string;
  color: string;
  description: string;
}

interface CreateMaintenanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    _id: string;
    name: string;
    managedBy: string;
  };
  managerId: string;
  onSuccess: () => void;
}

// 3. ADD THESE CONSTANTS (paste after your type definitions)
const maintenanceCategories: MaintenanceCategory[] = [
  {
    name: "Plumbing",
    icon: Droplet,
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
    subItems: [
      { name: "Leaky faucet" },
      { name: "Clogged drain" },
      { name: "Running toilet" },
      { name: "Low water pressure" },
      { name: "Burst pipe" },
      { name: "Water heater issues" },
      { name: "Garbage disposal problem" },
      { name: "Other plumbing issue" },
    ],
  },
  {
    name: "Electrical",
    icon: Zap,
    color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
    iconColor: "text-yellow-600",
    subItems: [
      { name: "Power outlet not working" },
      { name: "Light switch malfunction" },
      { name: "Flickering lights" },
      { name: "Circuit breaker tripping" },
      { name: "Electrical safety concern" },
      { name: "Ceiling fan issue" },
      { name: "Doorbell not working" },
      { name: "Other electrical issue" },
    ],
  },
  {
    name: "HVAC",
    icon: Wind,
    color: "bg-green-50 border-green-200 hover:border-green-400",
    iconColor: "text-green-600",
    subItems: [
      { name: "Air conditioning not cooling" },
      { name: "Heating not working" },
      { name: "Strange noises from unit" },
      { name: "Poor air circulation" },
      { name: "Thermostat issues" },
      { name: "Filter needs replacement" },
      { name: "Vent blockage" },
      { name: "Other HVAC issue" },
    ],
  },
  {
    name: "Appliances",
    icon: Settings,
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    iconColor: "text-purple-600",
    subItems: [
      { name: "Refrigerator not cooling" },
      { name: "Dishwasher malfunction" },
      { name: "Washing machine issue" },
      { name: "Dryer not working" },
      { name: "Oven/Stove problem" },
      { name: "Microwave issue" },
      { name: "Garbage disposal problem" },
      { name: "Other appliance issue" },
    ],
  },
  {
    name: "Structural",
    icon: Home,
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    iconColor: "text-orange-600",
    subItems: [
      { name: "Roof leak" },
      { name: "Wall damage" },
      { name: "Floor issues" },
      { name: "Window problems" },
      { name: "Door not closing properly" },
      { name: "Ceiling damage" },
      { name: "Foundation concerns" },
      { name: "Other structural issue" },
    ],
  },
  {
    name: "Security",
    icon: Shield,
    color: "bg-red-50 border-red-200 hover:border-red-400",
    iconColor: "text-red-600",
    subItems: [
      { name: "Lock malfunction" },
      { name: "Security system issue" },
      { name: "Broken window" },
      { name: "Gate not working" },
      { name: "Intercom problem" },
      { name: "Keypad issue" },
      { name: "Security light out" },
      { name: "Other security concern" },
    ],
  },
  {
    name: "Pest Control",
    icon: Bug,
    color: "bg-teal-50 border-teal-200 hover:border-teal-400",
    iconColor: "text-teal-600",
    subItems: [
      { name: "Ants" },
      { name: "Cockroaches" },
      { name: "Mice/Rats" },
      { name: "Spiders" },
      { name: "Flies" },
      { name: "Wasps/Bees" },
      { name: "Termites" },
      { name: "Other pest issue" },
    ],
  },
  {
    name: "Maintenance",
    icon: Hammer,
    color: "bg-gray-50 border-gray-200 hover:border-gray-400",
    iconColor: "text-gray-600",
    subItems: [
      { name: "General repair needed" },
      { name: "Paint touch-up" },
      { name: "Caulking repair" },
      { name: "Tile repair" },
      { name: "Cabinet issue" },
      { name: "Fixture replacement" },
      { name: "Weather stripping" },
      { name: "Other maintenance" },
    ],
  },
];

const urgencyLevels: UrgencyLevel[] = [
  {
    level: "Low",
    color: "bg-green-600 hover:bg-green-700",
    description: "Not urgent, can wait a few days",
  },
  {
    level: "Medium",
    color: "bg-yellow-600 hover:bg-yellow-700",
    description: "Should be addressed within 24-48 hours",
  },
  {
    level: "High",
    color: "bg-red-600 hover:bg-red-700",
    description: "Urgent, needs immediate attention",
  },
];

// Define the expected shape of the fetched property data
interface SellerPropertyDetail {
  _id: string;
  id: number;
  name: string;
  description: string;
  salePrice: number;
  propertyType: string;
  propertyStatus: string;
  beds: number;
  baths: number;
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
  sellerCognitoId: string;
  photoUrls: string[]; // This will be used for the top carousel
  agreementDocumentUrl?: string;
  postedDate: string;
  createdAt: string;
  updatedAt: string;
  buyerInquiries?: any[];
  location: {
    id: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates: { longitude: number; latitude: number } | null;
  } | null;
  // Mocked/assumed fields, ensure they exist in your actual data
  averageRating?: number;
  numberOfReviews?: number;
  applicationFee?: number;
  securityDeposit?: number;
  isPetsAllowed?: boolean;
  isParkingIncluded?: boolean;
}

const HighlightVisuals: Record<string, { icon: React.ElementType }> = {
  // Property Features
  "Air Conditioning": { icon: Snowflake },
  Heating: { icon: Flame },
  "Hardwood Floors": { icon: Home },
  Carpet: { icon: Home },
  "Tile Floors": { icon: Home },
  "High Ceilings": { icon: ArrowLeft }, // Use ArrowLeft rotated or replace with better icon
  "Walk-in Closet": { icon: Home },
  Balcony: { icon: Sun },
  Patio: { icon: Sun },
  Fireplace: { icon: Flame },
  "Bay Windows": { icon: Sun },
  Skylight: { icon: Sun },
  "Ceiling Fans": { icon: Wind },

  // Kitchen & Appliances
  "Updated Kitchen": { icon: ChefHat },
  "Stainless Steel Appliances": { icon: ChefHat },
  "Granite Countertops": { icon: ChefHat },
  Dishwasher: { icon: ChefHat },
  Microwave: { icon: ChefHat },
  Refrigerator: { icon: ChefHat },
  "Washer/Dryer": { icon: Wind },
  "Laundry Room": { icon: Wind },
  "In-Unit Laundry": { icon: Wind },

  // Technology & Connectivity
  "High-Speed Internet": { icon: Wifi },
  "WiFi Included": { icon: Wifi },
  "Cable Ready": { icon: Tv },
  "Smart Home Features": { icon: Home },
  "Security System": { icon: Shield },
  "Video Surveillance": { icon: Camera },
  "Keyless Entry": { icon: Lock },

  // Parking & Transportation
  Garage: { icon: Car },
  "Covered Parking": { icon: Car },
  "Street Parking": { icon: Car },
  "Parking Included": { icon: Car },
  "EV Charging": { icon: Car },

  // Outdoor & Recreation
  "Swimming Pool": { icon: Waves },
  "Hot Tub": { icon: Waves },
  Garden: { icon: Trees },
  "Landscaped Yard": { icon: Trees },
  Deck: { icon: Sun },
  "Rooftop Access": { icon: Sun },
  "Outdoor Space": { icon: Trees },

  // Building Amenities
  "Fitness Center": { icon: Dumbbell },
  Gym: { icon: Dumbbell },
  "Business Center": { icon: Coffee },
  "Conference Room": { icon: Users },
  "Lounge Area": { icon: Coffee },
  "Game Room": { icon: Gamepad2 },
  Library: { icon: Coffee },
  Concierge: { icon: Users },
  "24/7 Security": { icon: Shield },
  "Controlled Access": { icon: Lock },
  Elevator: { icon: ArrowLeft }, // Use ArrowLeft rotated or replace

  // Pet & Family Friendly
  "Pet Friendly": { icon: Dog },
  "Dog Park": { icon: Dog },
  "Pet Wash Station": { icon: Dog },
  Playground: { icon: Baby },
  "Family Friendly": { icon: Users },
  "Child Care": { icon: Baby },

  // Accessibility & Safety
  "Wheelchair Accessible": { icon: Users },
  "Handicap Accessible": { icon: Users },
  "Emergency Exits": { icon: Shield },
  "Fire Safety": { icon: Shield },
  "Smoke Free": { icon: Wind },
  "Non Smoking": { icon: Wind },

  // Default fallback
  DEFAULT: { icon: Star },
};

const CreateMaintenanceRequestModal: React.FC<
  CreateMaintenanceRequestModalProps
> = ({ isOpen, onClose, property, managerId, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] =
    useState<MaintenanceCategory | null>(null);
  const [selectedSubItem, setSelectedSubItem] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedCategory(null);
      setSelectedSubItem("");
      setCustomDescription("");
      setUrgency("Medium");
      setError(null);
    }
  }, [isOpen]);

  const handleCategorySelect = (category: MaintenanceCategory) => {
    setSelectedCategory(category);
    setStep(2);
  };

  const handleSubItemSelect = (subItemName: string) => {
    setSelectedSubItem(subItemName);
    setStep(3);
  };

  const handleSubmit = async () => {
    const finalDescription = selectedSubItem.toLowerCase().includes("other")
      ? customDescription
      : `${selectedSubItem}. ${customDescription}`;

    if (!selectedCategory || !finalDescription.trim()) {
      alert("Please complete all steps and provide a description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/maintenance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property._id,
          managerId: managerId, // Changed from tenantId to managerId
          category: selectedCategory.name,
          description: finalDescription,
          urgency,
          reportedBy: "manager", // Add this field to distinguish
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit maintenance request");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">New Maintenance Request</h2>
              <p className="opacity-90 mt-1">
                Property: <span className="font-semibold">{property.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center mt-4 space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= stepNum
                      ? "bg-white text-blue-600"
                      : "bg-white/20 text-white/60"
                  }`}
                >
                  {step > stepNum ? <CheckCircle size={16} /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`h-1 w-12 mx-2 transition-colors ${
                      step > stepNum ? "bg-white" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  What type of issue needs attention?
                </h3>
                <p className="text-gray-600">
                  Select the category that best describes the maintenance needed
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {maintenanceCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => handleCategorySelect(category)}
                      className={`p-4 border-2 rounded-xl text-center transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${category.color} group`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Icon
                          className={`w-8 h-8 ${category.iconColor} group-hover:scale-110 transition-transform`}
                        />
                        <span className="font-semibold text-sm text-gray-800">
                          {category.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Specific Issue Selection */}
          {step === 2 && selectedCategory && (
            <div className="p-6">
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={16} /> Back to categories
              </button>

              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <selectedCategory.icon
                    className={`w-6 h-6 ${selectedCategory.iconColor}`}
                  />
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedCategory.name} Issues
                  </h3>
                </div>
                <p className="text-gray-600">
                  What specific problem needs to be addressed?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                {selectedCategory.subItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleSubItemSelect(item.name)}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                      <span className="font-medium text-gray-700 group-hover:text-blue-700">
                        {item.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details and Urgency */}
          {step === 3 && selectedCategory && (
            <div className="p-6 space-y-6">
              <button
                onClick={() => setStep(2)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={16} /> Back to specific issues
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <selectedCategory.icon
                    className={`w-5 h-5 ${selectedCategory.iconColor}`}
                  />
                  <span className="font-semibold text-gray-800">
                    {selectedCategory.name}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-700">{selectedSubItem}</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Details & Notes
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Provide additional details about the maintenance needed
                </p>
                <textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={4}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 'Scheduled maintenance needed for HVAC system in units 1A-1C. Last service was 6 months ago...'"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Priority Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {urgencyLevels.map(({ level, color, description }) => (
                    <button
                      key={level}
                      onClick={() => setUrgency(level)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        urgency === level
                          ? `${color} text-white border-transparent transform scale-105 shadow-lg`
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md"
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-bold text-lg mb-1">{level}</div>
                        <div
                          className={`text-sm ${
                            urgency === level
                              ? "text-white/90"
                              : "text-gray-600"
                          }`}
                        >
                          {description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 3 && (
          <div className="p-6 border-t bg-gray-50">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertTriangle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Wrench size={16} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SellerPropertyDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const propertyIdParams = params.id as string;

  const [property, setProperty] = useState<SellerPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... other imports

  // Inside the SellerPropertyDetailsPage component function:
  // Add this state for the image preview logic
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Handlers for the custom image preview
  const handlePrevImage = () => {
    if (property && property.photoUrls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.photoUrls.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (property && property.photoUrls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === property.photoUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: authUser } = useGetAuthUserQuery();
  const propertyIdForModal = Number(property?.id);

  const formatPrice = (price: number, country?: string) => {
    const countryLower = country?.toLowerCase().trim();

    const options: Intl.NumberFormatOptions = {
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
  

  useEffect(() => {
    if (!propertyIdParams || isNaN(Number(propertyIdParams))) {
      setError("Invalid Property ID.");
      setIsLoading(false);
      return;
    }
    const fetchPropertyDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/seller-properties/${propertyIdParams}`
        );
        if (!response.ok) {
          if (response.status === 404) throw new Error("Property not found.");
          throw new Error(`Failed to fetch property: ${response.statusText}`);
        }
        const data: SellerPropertyDetail = await response.json();
        setProperty(data);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPropertyDetails();
  }, [propertyIdParams]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h2 className="text-2xl font-semibold mb-2 text-red-600">Error</h2>
        <p className="text-red-500 mb-6">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  if (!property)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h2 className="text-2xl font-semibold mb-2">Not Found</h2>
        <p className="text-gray-600 mb-6">Property not found.</p>
        <Button onClick={() => router.push("/dashboard/landlords/properties")}>
          My Properties
        </Button>
      </div>
    );

  const locationString = property.location
    ? `${property.location.city || ""}${
        property.location.city && property.location.state ? ", " : ""
      }${property.location.state || ""}${
        (property.location.city || property.location.state) &&
        property.location.country
          ? ", "
          : ""
      }${property.location.country || ""}`
        .trim()
        .replace(/,$/, "") || "N/A"
    : "N/A";
  const fullAddress = property.location
    ? `${property.location.address || ""}${
        property.location.address ? ", " : ""
      }${property.location.city || ""}${property.location.city ? ", " : ""}${
        property.location.state || ""
      }${property.location.state ? " " : ""}${
        property.location.postalCode || ""
      }`
        .trim()
        .replace(/,$/, "") || "N/A"
    : "N/A";
  const averageRating = property.averageRating || 0.0;
  const numberOfReviews = property.numberOfReviews || 0;
  const isVerifiedListing = property.propertyStatus === "For Sale";
  const applicationFee = property.applicationFee || 100;
  const securityDeposit = property.securityDeposit || 500;
  const isPetsAllowed =
    property.isPetsAllowed !== undefined ? property.isPetsAllowed : true;
  const isParkingIncluded =
    property.isParkingIncluded !== undefined
      ? property.isParkingIncluded
      : true;

  return (
    <div className="bg-white min-h-screen">
      {/* Full-width Image Carousel at the Top */}
      {property && property.photoUrls && property.photoUrls.length > 0 ? (
        <div className="relative h-[350px] sm:h-[450px] md:h-[550px] w-full mb-8 overflow-hidden group">
          {" "}
          {/* Added group for button visibility on hover */}
          {property.photoUrls.map((imageUrl, index) => (
            <div
              key={imageUrl} // Assuming imageUrls are unique, or use index if not
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                index === currentImageIndex
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0"
              }`}
            >
              <Image
                src={imageUrl}
                alt={`${property.name} - Image ${index + 1}`}
                layout="fill"
                objectFit="cover"
                priority={index === 0} // Prioritize loading the first image
              />
            </div>
          ))}
          {property.photoUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all opacity-0 group-hover:opacity-100 z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all opacity-0 group-hover:opacity-100 z-20"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 mb-8">
          <ImageIcon className="w-20 h-20 mb-2" />
          <p>No images available for this property.</p>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {" "}
        {/* Added pb-8 */}
        <Link
          href="/dashboard/landlords/properties"
          className="inline-flex items-center mb-6 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to My Properties
        </Link>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="w-full lg:w-2/3 space-y-10">
            {/* Property Overview Section */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {property.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-500" />
                  {locationString}
                </span>
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1.5 text-yellow-400 fill-yellow-400" />
                  {averageRating.toFixed(1)} ({numberOfReviews} Reviews)
                </span>
                {isVerifiedListing && (
                  <span className="text-green-600 font-medium">
                    Verified Listing
                  </span>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">
                      Sale Price
                    </div>
                    <div className="font-semibold text-gray-800">
                       {formatPrice(property.salePrice, property.location?.country)}
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 h-8 border-l border-gray-200 hidden sm:block"></span>
                    <div className="text-xs text-gray-500 mb-0.5">Bedrooms</div>
                    <div className="font-semibold text-gray-800">
                      {property.beds} bd
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 h-8 border-l border-gray-200 hidden sm:block"></span>
                    <div className="text-xs text-gray-500 mb-0.5">
                      Bathrooms
                    </div>
                    <div className="font-semibold text-gray-800">
                      {property.baths} ba
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 h-8 border-l border-gray-200 hidden sm:block"></span>
                    <div className="text-xs text-gray-500 mb-0.5">
                      Square Feet
                    </div>
                    <div className="font-semibold text-gray-800">
                      {property.squareFeet.toLocaleString()} sq ft
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                About {property.name}
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {property.description}
              </p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {property.amenities.map((highlight, index) => {
                    const HighlightIcon =
                      HighlightVisuals[highlight]?.icon ||
                      HighlightVisuals.DEFAULT.icon;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center text-center border border-gray-200 rounded-lg py-5 px-3"
                      >
                        <HighlightIcon className="w-7 h-7 mb-2 text-gray-600" />
                        <span className="text-xs text-gray-700">
                          {highlight}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Highlights Section */}
            {property.highlights && property.highlights.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Highlights
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {property.highlights.map((highlight, index) => {
                    const HighlightIcon =
                      HighlightVisuals[highlight]?.icon ||
                      HighlightVisuals.DEFAULT.icon;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center text-center border border-gray-200 rounded-lg py-5 px-3"
                      >
                        <HighlightIcon className="w-7 h-7 mb-2 text-gray-600" />
                        <span className="text-xs text-gray-700">
                          {highlight}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fees and Policies Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                Fees and Policies
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                The fees below are based on community-supplied data and may
                exclude additional fees and utilities.
              </p>
              <Tabs defaultValue="required-fees" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-md p-1">
                  <TabsTrigger
                    value="required-fees"
                    className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Required Fees
                  </TabsTrigger>
                  <TabsTrigger
                    value="pets"
                    className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Pets
                  </TabsTrigger>
                  <TabsTrigger
                    value="parking"
                    className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Parking
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="required-fees" className="pt-5 text-sm">
                  <p className="font-medium text-gray-700 mb-3">
                    One time move in fees
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Application Fee</span>
                      <span>${applicationFee}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Security Deposit</span>
                      <span>${securityDeposit}</span>
                    </div>
                    {property.HOAFees !== null &&
                      property.HOAFees !== undefined && (
                        <>
                          <Separator />
                          <div className="flex justify-between items-center text-gray-600">
                            <span>HOA Fees (Monthly)</span>
                            <span>${property.HOAFees.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                  </div>
                </TabsContent>
                <TabsContent value="pets" className="pt-5 text-sm">
                  <p className="font-medium text-gray-700">
                    Pets are {isPetsAllowed ? "allowed" : "not allowed"}.
                  </p>
                </TabsContent>
                <TabsContent value="parking" className="pt-5 text-sm">
                  <p className="font-medium text-gray-700">
                    Parking is {isParkingIncluded ? "included" : "not included"}
                    .
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Map and Location Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                Map and Location
              </h2>
              {(!property.location || !property.location.coordinates) && (
                <p className="text-xs text-gray-500 mb-3">
                  Location coordinates are not available for this property. Map
                  cannot be displayed.
                </p>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0" />
                Property Address:
                <span className="ml-1 font-medium text-gray-800">
                  {fullAddress}
                </span>
              </div>
              {property.location?.coordinates && (
                <div className="mt-4 h-[250px] rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                  Map would be displayed here
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Contact Widget) */}
          <div className="w-full lg:w-1/3 lg:sticky top-8 h-fit">
            <div className="bg-white border border-primary-200 rounded-2xl p-7 h-fit min-w-[300px] space-y-4">
              <Button
                className="w-full bg-primary-700 text-white hover:bg-primary-600"
                onClick={() => {}}
              >
                Edit Property
              </Button>

              <Button
                onClick={() => setIsMaintenanceModalOpen(true)}
                variant="outline"
                className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600"
              >
                <Wrench className="w-5 h-5 mr-2" />
                Report Maintenance
              </Button>
            </div>
          </div>
        </div>
      </div>

      {authUser && propertyIdForModal && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          propertyId={propertyIdForModal}
        />
      )}

      {property && authUser && (
        <CreateMaintenanceRequestModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          property={{
            _id: property._id,
            name: property.name,
            managedBy: property.sellerCognitoId,
          }}
          managerId={authUser.cognitoInfo?.userId || ""}
          onSuccess={() => {
            alert("Maintenance request has been submitted successfully!");
            // You can redirect to maintenance page if you have one
            // router.push('/dashboard/managers/maintenance');
          }}
        />
      )}
    </div>
  );
};

export default SellerPropertyDetailsPage;
