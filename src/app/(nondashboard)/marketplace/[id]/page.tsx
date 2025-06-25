"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
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
  // Icons for highlights and amenities
  Wifi,
  Car,
  Waves,
  Trees,
  Dumbbell,
  Shield,
  Flame,
  Snowflake,
  ChefHat,
  Tv,
  Dog,
  Camera,
  Lock,
  Sun,
  Wind,
  Home,
  Users,
  Coffee,
  Gamepad2,
  Baby,
  // New Icons
  User,
  Mail,
  CalendarDays,
  UserCheck,
  Wrench,
  Banknote,
  ClipboardList,
  X,
} from "lucide-react";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetAuthUserQuery } from "@/state/api";

// Define the expected shape of seller information
interface SellerInfo {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
}

interface FeatureDetail {
  count: number;
  description: string;
  images: string[];
}

interface PropertyFeatures {
  [key: string]: FeatureDetail;
}

// Updated property data interface
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
  preferredFinancingInfo?: string;
  insuranceRecommendation?: string;
  sellerCognitoId: string;
  photoUrls: string[];
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
  averageRating?: number;
  numberOfReviews?: number;
  applicationFee?: number;
  securityDeposit?: number;
  isPetsAllowed?: boolean;
  isParkingIncluded?: boolean;
  managedBy?: string;
  seller?: SellerInfo;
  features?: PropertyFeatures;
}

const HighlightVisuals: Record<string, { icon: React.ElementType }> = {
  "Air Conditioning": { icon: Snowflake },
  Heating: { icon: Flame },
  "Hardwood Floors": { icon: Home },
  Carpet: { icon: Home },
  "Tile Floors": { icon: Home },
  "High Ceilings": { icon: ArrowLeft },
  "Walk-in Closet": { icon: Home },
  Balcony: { icon: Sun },
  Patio: { icon: Sun },
  Fireplace: { icon: Flame },
  "Bay Windows": { icon: Sun },
  Skylight: { icon: Sun },
  "Ceiling Fans": { icon: Wind },
  "Updated Kitchen": { icon: ChefHat },
  "Stainless Steel Appliances": { icon: ChefHat },
  "Granite Countertops": { icon: ChefHat },
  Dishwasher: { icon: ChefHat },
  Microwave: { icon: ChefHat },
  Refrigerator: { icon: ChefHat },
  "Washer/Dryer": { icon: Wind },
  "Laundry Room": { icon: Wind },
  "In-Unit Laundry": { icon: Wind },
  "High-Speed Internet": { icon: Wifi },
  "WiFi Included": { icon: Wifi },
  "Cable Ready": { icon: Tv },
  "Smart Home Features": { icon: Home },
  "Security System": { icon: Shield },
  "Video Surveillance": { icon: Camera },
  "Keyless Entry": { icon: Lock },
  Garage: { icon: Car },
  "Covered Parking": { icon: Car },
  "Street Parking": { icon: Car },
  "Parking Included": { icon: Car },
  "EV Charging": { icon: Car },
  "Swimming Pool": { icon: Waves },
  "Hot Tub": { icon: Waves },
  Garden: { icon: Trees },
  "Landscaped Yard": { icon: Trees },
  Deck: { icon: Sun },
  "Rooftop Access": { icon: Sun },
  "Outdoor Space": { icon: Trees },
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
  Elevator: { icon: ArrowLeft },
  "Pet Friendly": { icon: Dog },
  "Dog Park": { icon: Dog },
  "Pet Wash Station": { icon: Dog },
  Playground: { icon: Baby },
  "Family Friendly": { icon: Users },
  "Child Care": { icon: Baby },
  "Wheelchair Accessible": { icon: Users },
  "Handicap Accessible": { icon: Users },
  "Emergency Exits": { icon: Shield },
  "Fire Safety": { icon: Shield },
  "Smoke Free": { icon: Wind },
  "Non Smoking": { icon: Wind },
  DEFAULT: { icon: Star },
};

const capitalizeFirstLetter = (string: string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Icon mapping using your existing Lucide icons from PropertyDetailView.tsx
const featureToIconMap: Record<string, React.ElementType> = {
  bedroom: BedDouble,
  bathroom: Bath,
  dining: ChefHat, // Using ChefHat as a proxy for dining
  kitchen: ChefHat,
  livingroom: Tv, // Using Tv as a proxy for living room
  drawingroom: ImageIcon, // Example, using ImageIcon as a generic for drawing room
  default: Home, // Fallback icon if no specific match
};

interface PropertyFeaturesDisplayProps {
  features?: PropertyFeatures;
  onImageClick: (imageUrl: string) => void;
}

// --- NEW COMPONENT: Image Lightbox ---
interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
      onClick={onClose} // Close when clicking the background
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>
      <div
        className="relative w-full h-full max-w-5xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking the image
      >
        <Image
          src={imageUrl}
          alt="Enlarged property view"
          layout="fill"
          objectFit="contain" // 'contain' ensures the whole image is visible
        />
      </div>
    </div>
  );
};
// --- UPDATED COMPONENT: PropertyFeaturesDisplay ---

interface PropertyFeaturesDisplayProps {
  features?: PropertyFeatures;
  onImageClick: (url: string) => void; // Define the prop correctly
}

const PropertyFeaturesDisplay: React.FC<PropertyFeaturesDisplayProps> = ({
  features,
  onImageClick, // <<< FIX #1: Actually receive the onImageClick function here
}) => {
  if (!features || Object.keys(features).length === 0) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg mt-6">
        <p className="text-gray-600 italic">
          No specific room features listed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
        Room Details & Features
      </h3>
      {Object.entries(features).map(([featureName, details]) => {
        const IconComponent =
          featureToIconMap[featureName.toLowerCase()] ||
          featureToIconMap.default;
        return (
          <div
            key={featureName}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center mb-3">
              <IconComponent className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
              <h4 className="text-lg font-medium text-gray-700">
                {capitalizeFirstLetter(featureName)}
                {details.count > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({details.count})
                  </span>
                )}
              </h4>
            </div>

            {details.description && (
              <p className="text-gray-600 mb-4 text-sm leading-relaxed pl-9">
                {details.description}
              </p>
            )}

            {details.images && details.images.length > 0 && (
              <div className="pl-9">
                <h5 className="text-sm font-medium text-gray-600 mb-2">
                  Gallery:
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {details.images.map((imageUrl, imgIndex) => (
                    // ▼▼▼ FIX #2: Change the `div` to a `button` and add the `onClick` handler ▼▼▼
                    <button
                      key={imageUrl + imgIndex}
                      onClick={() => onImageClick(imageUrl)}
                      className="relative h-32 w-full rounded-md overflow-hidden border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${capitalizeFirstLetter(featureName)} - Image ${
                          imgIndex + 1
                        }`}
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:opacity-80 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(!details.images || details.images.length === 0) &&
              !details.description &&
              details.count > 0 && (
                <p className="text-gray-500 text-xs pl-9 italic">
                  Further details or images for this feature are not specified.
                </p>
              )}
          </div>
        );
      })}
    </div>
  );
};
// the genaral function for submittiong applicsations

// --- GENERAL-PURPOSE SUBMISSION HANDLER ---

// Add this interface to define the parameters for type safety
interface SubmitApplicationParams {
  property: SellerPropertyDetail;
  currentUser: any; // The authenticated user object from useGetAuthUserQuery
  applicationType:
    | "ScheduleVisit"
    | "AgentApplication"
    | "FinancialInquiry"
    | "RentRequest";
  formData: Record<string, any>;
  successMessage: string;
  setIsSubmitting: (isSubmitting: boolean) => void;
  onClose: () => void;
}

const submitApplication = async ({
  property,
  currentUser,
  applicationType,
  formData,
  successMessage,
  setIsSubmitting,
  onClose,
}: SubmitApplicationParams): Promise<void> => {
  // Guard clause: Ensure we have the necessary IDs to proceed.
  // We need to add `managedBy` to your SellerPropertyDetail interface.


  setIsSubmitting(true);

  const payload = {
    propertyId: property._id, // Use the MongoDB _id
    senderId: currentUser?.cognitoInfo?.userId,
    receiverId: (property as any).managedBy,
    applicationType,
    formData,
  };

  try {
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit application.");
    }

    alert(successMessage);
    onClose();
  } catch (error) {
    console.error("Submission Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    alert(`Error: ${errorMessage}`);
  } finally {
    setIsSubmitting(false);
  }
};
// --- MODAL 1: Schedule Visit Modal (For Buyers) ---
// --- MODAL 1: Schedule Visit Modal (For Buyers) ---
interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SellerPropertyDetail;
  currentUser: any;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  onClose,
  property,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitApplication({
      property,
      currentUser,
      applicationType: "ScheduleVisit",
      formData,
      successMessage: `Visit request for "${property.name}" submitted!`,
      setIsSubmitting,
      onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Schedule a Visit
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields remain the same as your original code */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              onChange={handleChange}
              value={formData.name}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                onChange={handleChange}
                value={formData.email}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                onChange={handleChange}
                value={formData.phone}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="preferredDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Preferred Date *
              </label>
              <input
                type="date"
                name="preferredDate"
                id="preferredDate"
                required
                onChange={handleChange}
                value={formData.preferredDate}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label
                htmlFor="preferredTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Preferred Time *
              </label>
              <input
                type="time"
                name="preferredTime"
                id="preferredTime"
                required
                onChange={handleChange}
                value={formData.preferredTime}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message (Optional)
            </label>
            <textarea
              name="message"
              id="message"
              rows={3}
              onChange={handleChange}
              value={formData.message}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Any specific requirements?"
            ></textarea>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Request Visit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL 2: Agent Application Modal (For Managers) ---
// --- MODAL 2: Agent Application Modal (For Managers) ---
// --- MODAL 2: Agent Application Modal (For Managers) ---
interface AgentApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SellerPropertyDetail;
  currentUser: any;
}

const AgentApplicationModal: React.FC<AgentApplicationModalProps> = ({
  isOpen,
  onClose,
  property,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- FIX #1: Simplified state. Name, email, and phone are removed.
  const [formData, setFormData] = useState({
    companyName: "",
    licenseNumber: "",
    yearsOfExperience: "",
    specialization: "residential",
    commissionRate: "",
    coverLetter: "",
    references: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- FIX #2: Ensure user is logged in before proceeding.
    if (!currentUser?.userInfo) {
        alert("You must be logged in to submit an application. Please sign in and try again.");
        return;
    }

    // --- FIX #3: Create a complete payload with the user's contact info.
    const completeFormData = {
        name: currentUser.userInfo.name,
        email: currentUser.userInfo.email,
        phone: currentUser.userInfo.phoneNumber || "",
        ...formData, // Add the agent-specific form data
    };

    await submitApplication({
      property,
      currentUser,
      applicationType: "AgentApplication",
      formData: completeFormData, // Pass the new, complete object
      successMessage: `Agent application for "${property.name}" submitted successfully!`,
      setIsSubmitting,
      onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Apply to Become Agent
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-6 text-sm">
            Your name and contact information will be automatically included from your profile.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- FIX #4: Removed the redundant name, email, and phone fields from the form UI. --- */}

          {/* Agent-specific fields remain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" name="companyName" id="companyName" onChange={handleChange} value={formData.companyName} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">Real Estate License # *</label>
              <input type="text" name="licenseNumber" id="licenseNumber" required onChange={handleChange} value={formData.licenseNumber} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
              <input type="number" name="yearsOfExperience" id="yearsOfExperience" required min="0" onChange={handleChange} value={formData.yearsOfExperience} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
             <div>
              <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">Proposed Commission Rate (%) *</label>
              <input type="number" name="commissionRate" id="commissionRate" required min="0" max="100" step="0.1" onChange={handleChange} value={formData.commissionRate} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
           <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">Area of Specialization</label>
              <select name="specialization" id="specialization" onChange={handleChange} value={formData.specialization} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="luxury">Luxury</option>
                <option value="land">Land</option>
              </select>
            </div>
          <div>
            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">Cover Letter / Bio *</label>
            <textarea name="coverLetter" id="coverLetter" rows={4} required onChange={handleChange} value={formData.coverLetter} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Briefly describe your experience and why you're a good fit."></textarea>
          </div>
          <div>
            <label htmlFor="references" className="block text-sm font-medium text-gray-700 mb-1">References (Optional)</label>
            <textarea name="references" id="references" rows={3} onChange={handleChange} value={formData.references} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g., Previous clients or brokers."></textarea>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL 3: Financial Services Inquiry Modal (For Buyers) ---
// --- MODAL 3: Financial Services Inquiry Modal (For Buyers) ---
interface FinancialServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SellerPropertyDetail;
  currentUser: any;
}

const FinancialServicesModal: React.FC<FinancialServicesModalProps> = ({
  isOpen,
  onClose,
  property,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "mortgage_preapproval",
    annualIncome: "",
    creditScore: "",
    downPaymentAmount: "",
    employmentStatus: "employed",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitApplication({
      property,
      currentUser,
      applicationType: "FinancialInquiry",
      formData,
      successMessage: `Financial inquiry for "${property.name}" submitted!`,
      setIsSubmitting,
      onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Financial Services Inquiry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* The full form from your original code goes here */}
          <div className="pt-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL 4: Request to Rent Modal (For Tenants) ---
// --- MODAL 4: Request to Rent Modal (For Tenants) ---
// --- MODAL 4: Request to Rent Modal (For Tenants) ---
interface RequestToRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SellerPropertyDetail;
  currentUser: any;
}

const RequestToRentModal: React.FC<RequestToRentModalProps> = ({
  isOpen,
  onClose,
  property,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- FIX #1: Simplified state. We will add user info automatically.
  const [formData, setFormData] = useState({
    moveInDate: "",
    numberOfOccupants: 1,
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- FIX #2: Ensure user is logged in before proceeding.
    if (!currentUser?.userInfo) {
        alert("You must be logged in to submit a request. Please sign in and try again.");
        return;
    }
    
    // --- FIX #3: Create a complete payload with the user's contact info.
    const completeFormData = {
        name: currentUser.userInfo.name,
        email: currentUser.userInfo.email,
        phone: currentUser.userInfo.phoneNumber || "", // Use optional chaining for safety
        ...formData, // Add the other form data (move-in date, etc.)
    };

    await submitApplication({
      property,
      currentUser,
      applicationType: "RentRequest",
      formData: completeFormData, // Pass the new, complete object
      successMessage: `Request to rent "${property.name}" submitted!`,
      setIsSubmitting,
      onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Request to Rent
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-6 text-sm">
            Your contact information ({currentUser?.userInfo?.name}, {currentUser?.userInfo?.email}) will be automatically sent with this request.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- FIX #4: Removed the empty name, email, and phone fields from the form UI. --- */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Desired Move-in Date *
                </label>
                <input
                    type="date"
                    name="moveInDate"
                    id="moveInDate"
                    required
                    onChange={handleChange}
                    value={formData.moveInDate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split("T")[0]}
                />
            </div>
            <div>
                <label htmlFor="numberOfOccupants" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Occupants *
                </label>
                <input
                    type="number"
                    name="numberOfOccupants"
                    id="numberOfOccupants"
                    required
                    min="1"
                    onChange={handleChange}
                    value={formData.numberOfOccupants}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message to Landlord (Optional)
            </label>
            <textarea
                name="message"
                id="message"
                rows={3}
                onChange={handleChange}
                value={formData.message}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Tell them a bit about yourself, your employment, etc."
            ></textarea>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const PropertyDetailView: React.FC = () => {
  // At the top of your PropertyDetailView component
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  // Get current user information
  const { data: currentUser } = useGetAuthUserQuery(); // Keep 'currentUser' for consistency

  // State management
  const [property, setProperty] = useState<SellerPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Modal states - ensure you have all three from your desired UI
  const [isScheduleVisitModalOpen, setIsScheduleVisitModalOpen] =
    useState(false);
  const [isAgentApplicationModalOpen, setIsAgentApplicationModalOpen] =
    useState(false);
  const [isFinancialServicesModalOpen, setIsFinancialServicesModalOpen] =
    useState(false);
  const [isRentModalopen, setIsRentModalopen] = useState(false);

  useEffect(()=>{
    const login = () => {
      console.log('user is', currentUser)
    }
    login()
  },[currentUser])

  // PASTE THIS to replace the old useEffect
  useEffect(() => {
    if (!propertyId) {
      // The 'params.id' is already named 'propertyId' in your target file
      setError("Invalid Property ID.");
      setLoading(false); // Make sure to use 'setLoading' to match your state variable
      return;
    }
    const fetchPropertyDetails = async () => {
      setLoading(true); // Use 'setLoading'
      setError(null);
      try {
        const response = await fetch(
          `/api/seller-properties/${propertyId}` // Use 'propertyId'
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
        setLoading(false); // Use 'setLoading'
      }
    };
    fetchPropertyDetails();
  }, [propertyId]);

  // Image navigation
  const nextImage = () => {
    if (property && property.photoUrls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === property.photoUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property && property.photoUrls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.photoUrls.length - 1 : prev - 1
      );
    }
  };

  // Utility functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getHighlightIcon = (highlight: string) => {
    const iconData = HighlightVisuals[highlight] || HighlightVisuals.DEFAULT;
    return iconData.icon;
  };

  // Determine user role for conditional rendering
  const userRole = currentUser?.userRole;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Error Loading Property
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => router.push("/properties")}
            className="inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The property you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => router.push("/properties")}
            className="inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/properties")}
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
            <div className="flex items-center space-x-2">
              {property.averageRating && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">
                    {property.averageRating}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">
                    ({property.numberOfReviews} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative">
                {property.photoUrls.length > 0 ? (
                  <>
                    {property.photoUrls && property.photoUrls.length > 0 ? (
                      <div className="relative h-[350px] sm:h-[450px] md:h-[550px] w-full mb-8 overflow-hidden group">
                        <button
                          onClick={() =>
                            setLightboxImageUrl(
                              property.photoUrls[currentImageIndex]
                            )
                          }
                          className="w-full h-full cursor-pointer focus:outline-none"
                        >
                          {property.photoUrls.map((imageUrl, index) => (
                            <div
                              key={imageUrl + index}
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
                                priority={index === 0}
                                className="group-hover:scale-105 transition-transform duration-300" // Optional: nice zoom effect
                              />
                            </div>
                          ))}
                        </button>
                      </div>
                    ) : (
                      <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 mb-8">
                        <ImageIcon className="w-20 h-20 mb-2" />
                        <p>No images available for this property.</p>
                      </div>
                    )}
                    {property.photoUrls.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {property.photoUrls.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {property.photoUrls.length > 0 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {property.photoUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex
                          ? "border-blue-500"
                          : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        width={80}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {property.name}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>
                      {property.location?.address}, {property.location?.city},{" "}
                      {property.location?.state}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(property.salePrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                    {property.propertyStatus}
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.propertyType}
                  </div>
                </div>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <BedDouble className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">
                    {property.beds}
                  </div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bath className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">
                    {property.baths}
                  </div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Ruler className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">
                    {property.squareFeet.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Sq Ft</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Home className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">
                    {property.yearBuilt || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">Year Built</div>
                </div>
              </div>

              {property.features &&
                Object.keys(property.features).length > 0 && (
                  <PropertyFeaturesDisplay
                    features={property.features}
                    onImageClick={setLightboxImageUrl}
                  />
                )}

              {/* Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="seller">Seller Info</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6">
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      {property.description}
                    </p>

                    {property.sellerNotes && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Seller Notes
                        </h4>
                        <p className="text-blue-800">{property.sellerNotes}</p>
                      </div>
                    )}

                    {property.openHouseDates &&
                      property.openHouseDates.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">
                            Open House Dates
                          </h4>
                          <div className="space-y-1">
                            {property.openHouseDates.map((date, index) => (
                              <div
                                key={index}
                                className="flex items-center text-green-800"
                              >
                                <CalendarDays className="w-4 h-4 mr-2" />
                                <span>{date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                  <div className="space-y-6">
                    {/* Highlights */}
                    {property.highlights && property.highlights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Property Highlights
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {property.highlights.map((highlight, index) => {
                            const IconComponent = getHighlightIcon(highlight);
                            return (
                              <div
                                key={index}
                                className="flex items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <IconComponent className="w-5 h-5 text-blue-600 mr-3" />
                                <span className="text-gray-700">
                                  {highlight}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Amenities
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {property.amenities.map((amenity, index) => {
                            const IconComponent = getHighlightIcon(amenity);
                            return (
                              <div
                                key={index}
                                className="flex items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <IconComponent className="w-5 h-5 text-green-600 mr-3" />
                                <span className="text-gray-700">{amenity}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Features */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Additional Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {property.isPetsAllowed !== undefined && (
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Dog className="w-5 h-5 text-orange-600 mr-3" />
                            <span className="text-gray-700">
                              Pets{" "}
                              {property.isPetsAllowed
                                ? "Allowed"
                                : "Not Allowed"}
                            </span>
                          </div>
                        )}
                        {property.isParkingIncluded !== undefined && (
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Car className="w-5 h-5 text-purple-600 mr-3" />
                            <span className="text-gray-700">
                              Parking{" "}
                              {property.isParkingIncluded
                                ? "Included"
                                : "Not Included"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="mt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Sale Price
                        </h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPrice(property.salePrice)}
                        </p>
                      </div>

                      {property.HOAFees && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            HOA Fees
                          </h4>
                          <p className="text-lg font-semibold text-gray-700">
                            {formatPrice(property.HOAFees)}/month
                          </p>
                        </div>
                      )}

                      {property.applicationFee && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Application Fee
                          </h4>
                          <p className="text-lg font-semibold text-gray-700">
                            {formatPrice(property.applicationFee)}
                          </p>
                        </div>
                      )}

                      {property.securityDeposit && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Security Deposit
                          </h4>
                          <p className="text-lg font-semibold text-gray-700">
                            {formatPrice(property.securityDeposit)}
                          </p>
                        </div>
                      )}
                    </div>

                    {property.preferredFinancingInfo && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Financing Information
                        </h4>
                        <p className="text-blue-800">
                          {property.preferredFinancingInfo}
                        </p>
                      </div>
                    )}

                    {property.insuranceRecommendation && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">
                          Insurance Recommendation
                        </h4>
                        <p className="text-yellow-800">
                          {property.insuranceRecommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="seller" className="mt-6">
                  <div className="space-y-4">
                    {property.seller && (
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          Seller Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <User className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="text-gray-700">
                              {property.seller.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="text-gray-700">
                              {property.seller.email}
                            </span>
                          </div>
                          {property.seller.phone && (
                            <div className="flex items-center">
                              <Phone className="w-5 h-5 text-gray-600 mr-3" />
                              <span className="text-gray-700">
                                {property.seller.phone}
                              </span>
                            </div>
                          )}
                          {property.seller.companyName && (
                            <div className="flex items-center">
                              <Home className="w-5 h-5 text-gray-600 mr-3" />
                              <span className="text-gray-700">
                                {property.seller.companyName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Listing Information
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Posted: {formatDate(property.postedDate)}</p>
                        <p>Last Updated: {formatDate(property.updatedAt)}</p>
                        <p>Property ID: {property.id}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Interested in this property?
              </h3>

              <div className="space-y-3">
                {/* === FOR BUYERS === */}
                {userRole === "buyer" && (
                  <>
                    <Button
                      onClick={() => setIsScheduleVisitModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      <CalendarDays className="w-5 h-5 mr-2" />
                      Schedule a Visit
                    </Button>
                    <Button
                      onClick={() => setIsFinancialServicesModalOpen(true)}
                      variant="outline"
                      className="w-full py-3"
                    >
                      <Banknote className="w-5 h-5 mr-2" />
                      Financial Services
                    </Button>
                  </>
                )}

                {userRole === "tenant" &&
                  property.propertyStatus === "Rent" && (
                    <>
                      <Button
                        onClick={() => setIsScheduleVisitModalOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                      >
                        <CalendarDays className="w-5 h-5 mr-2" />
                        Schedule a Visit
                      </Button>
                      <Button
                        // THIS IS THE IMPORTANT PART
                        onClick={() => setIsRentModalopen(true)}
                        variant="outline"
                        className="w-full py-3"
                      >
                        <Banknote className="w-5 h-5 mr-2" />
                        Request To Rent
                      </Button>
                    </>
                  )}

                {/* === FOR MANAGERS === */}
                {userRole === "manager" && (
                  <>
                    <Button
                      onClick={() => setIsAgentApplicationModalOpen(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      <UserCheck className="w-5 h-5 mr-2" />
                      Apply as Agent
                    </Button>
                    <Button
                      onClick={() => {
                        console.log("=== MANAGER PROPERTY REPORT REQUEST ===");
                        console.log(
                          "Request Type: Property Report",
                          "Property ID:",
                          property.id
                        );
                        alert("Property report request submitted!");
                      }}
                      variant="outline"
                      className="w-full py-3"
                    >
                      <ClipboardList className="w-5 h-5 mr-2" />
                      Request Property Report
                    </Button>
                  </>
                )}

                {!currentUser && (
                  <div className="text-center p-4 border border-dashed rounded-lg">
                    <p className="text-sm text-gray-600">
                      <Link
                        href="/signin"
                        className="text-blue-600 font-semibold"
                      >
                        Log in
                      </Link>{" "}
                      or{" "}
                      <Link
                        href="/signup"
                        className="text-blue-600 font-semibold"
                      >
                        sign up
                      </Link>{" "}
                      to interact with this property.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      {property && (
        <>
          <ScheduleVisitModal
            isOpen={isScheduleVisitModalOpen}
            onClose={() => setIsScheduleVisitModalOpen(false)}
            property={property} // Pass the whole property object
            currentUser={currentUser} // Pass the current user object
          />
          <AgentApplicationModal
            isOpen={isAgentApplicationModalOpen}
            onClose={() => setIsAgentApplicationModalOpen(false)}
            property={property}
            currentUser={currentUser}
          />
          <FinancialServicesModal
            isOpen={isFinancialServicesModalOpen}
            onClose={() => setIsFinancialServicesModalOpen(false)}
            property={property}
            currentUser={currentUser}
          />
          <RequestToRentModal
            isOpen={isRentModalopen}
            onClose={() => setIsRentModalopen(false)}
            property={property}
            currentUser={currentUser}
          />
          <ImageLightbox
            imageUrl={lightboxImageUrl}
            onClose={() => setLightboxImageUrl(null)}
          />
        </>
      )}
    </div>
  );
};

export default PropertyDetailView;
