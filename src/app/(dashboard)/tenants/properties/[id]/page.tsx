"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, MapPin, BedDouble, Bath, Ruler, Star, Wrench, FileText,
  ImageIcon, ChevronLeft, ChevronRight, Wifi, Car, Waves, Trees,
  Dumbbell, Shield, Flame, Snowflake, ChefHat, Tv, Dog, Home, X,
  // NEW ICONS FOR ENHANCED MODAL:
  Droplet, Zap, Thermometer, Wind, Bug, Paintbrush, Lightbulb,
  Camera, Volume2, Hammer, Settings, AlertTriangle, Clock, CheckCircle
} from "lucide-react";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/state/api";

// --- Type Definitions ---
interface SellerPropertyDetail {
  _id: string;
  name: string;
  description: string;
  salePrice: number;
  propertyType: string;
  beds: number;
  baths: number;
  squareFeet: number;
  amenities: string[];
  highlights: string[];
  photoUrls: string[];
  sellerCognitoId: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null;
  isPetsAllowed?: boolean;
  isParkingIncluded?: boolean;
  managedBy?: string;
}

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

interface ModalProperty {
  _id: string;
  name: string;
  managedBy: string;
  sellerCognitoId: string;
}

interface CreateMaintenanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: ModalProperty;
  tenantId: string;
  onSuccess: () => void;
}

const HighlightVisuals: Record<string, { icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  "Air Conditioning": { icon: Snowflake }, 
  "Heating": { icon: Flame }, 
  "Hardwood Floors": { icon: Home },
  "High-Speed Internet": { icon: Wifi }, 
  "Garage": { icon: Car }, 
  "Swimming Pool": { icon: Waves },
  "Garden": { icon: Trees }, 
  "Fitness Center": { icon: Dumbbell }, 
  "Security System": { icon: Shield },
  "Updated Kitchen": { icon: ChefHat }, 
  "In-Unit Laundry": { icon: Wrench }, 
  "Pet Friendly": { icon: Dog },
  DEFAULT: { icon: Star },
};

// --- MULTI-STEP MAINTENANCE MODAL ---

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
      { name: "Other plumbing issue" }
    ]
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
      { name: "Other electrical issue" }
    ]
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
      { name: "Other HVAC issue" }
    ]
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
      { name: "Other appliance issue" }
    ]
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
      { name: "Other structural issue" }
    ]
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
      { name: "Other security concern" }
    ]
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
      { name: "Other pest issue" }
    ]
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
      { name: "Other maintenance" }
    ]
  }
];

const urgencyLevels: UrgencyLevel[] = [
  { level: 'Low', color: 'bg-green-600 hover:bg-green-700', description: 'Not urgent, can wait a few days' },
  { level: 'Medium', color: 'bg-yellow-600 hover:bg-yellow-700', description: 'Should be addressed within 24-48 hours' },
  { level: 'High', color: 'bg-red-600 hover:bg-red-700', description: 'Urgent, needs immediate attention' }
];

const CreateMaintenanceRequestModal: React.FC<CreateMaintenanceRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  property, 
  tenantId, 
  onSuccess 
}) => {
    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategory | null>(null);
    const [selectedSubItem, setSelectedSubItem] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [urgency, setUrgency] = useState('Medium');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedCategory(null);
            setSelectedSubItem('');
            setCustomDescription('');
            setUrgency('Medium');
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
        const finalDescription = selectedSubItem.toLowerCase().includes('other')
            ? customDescription
            : `${selectedSubItem}. ${customDescription}`;

        if (!selectedCategory || !finalDescription.trim()) {
            alert('Please complete all steps and provide a description.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/maintenance-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: property._id,
                    tenantId,
                    managerId: property.managedBy,
                    landlordId: property.sellerCognitoId,
                    category: selectedCategory.name,
                    description: finalDescription,
                    urgency,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit maintenance request');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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
                            <p className="opacity-90 mt-1">Property: <span className="font-semibold">{property.name}</span></p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <X size={24}/>
                        </button>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="flex items-center mt-4 space-x-4">
                        {[1, 2, 3].map((stepNum) => (
                            <div key={stepNum} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                    step >= stepNum ? 'bg-white text-blue-600' : 'bg-white/20 text-white/60'
                                }`}>
                                    {step > stepNum ? <CheckCircle size={16} /> : stepNum}
                                </div>
                                {stepNum < 3 && (
                                    <div className={`h-1 w-12 mx-2 transition-colors ${
                                        step > stepNum ? 'bg-white' : 'bg-white/20'
                                    }`} />
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
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">What type of issue are you experiencing?</h3>
                                <p className="text-gray-600">Select the category that best describes your maintenance request</p>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {maintenanceCategories.map(category => {
                                    const Icon = category.icon;
                                    return (
                                        <button 
                                            key={category.name} 
                                            onClick={() => handleCategorySelect(category)} 
                                            className={`p-4 border-2 rounded-xl text-center transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${category.color} group`}
                                        >
                                            <div className="flex flex-col items-center space-y-2">
                                                <Icon className={`w-8 h-8 ${category.iconColor} group-hover:scale-110 transition-transform`} />
                                                <span className="font-semibold text-sm text-gray-800">{category.name}</span>
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
                                <ArrowLeft size={16}/> Back to categories
                            </button>
                            
                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <selectedCategory.icon className={`w-6 h-6 ${selectedCategory.iconColor}`} />
                                    <h3 className="text-xl font-semibold text-gray-800">{selectedCategory.name} Issues</h3>
                                </div>
                                <p className="text-gray-600">What specific problem are you experiencing?</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                                {selectedCategory.subItems.map(item => (
                                    <button 
                                        key={item.name} 
                                        onClick={() => handleSubItemSelect(item.name)} 
                                        className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                                            <span className="font-medium text-gray-700 group-hover:text-blue-700">{item.name}</span>
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
                                <ArrowLeft size={16}/> Back to specific issues
                            </button>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <selectedCategory.icon className={`w-5 h-5 ${selectedCategory.iconColor}`} />
                                    <span className="font-semibold text-gray-800">{selectedCategory.name}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-gray-700">{selectedSubItem}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="description" className="block text-lg font-semibold text-gray-700 mb-2">
                                    Additional Details
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Please provide more information about the issue to help us resolve it quickly
                                </p>
                                <textarea 
                                    id="description" 
                                    value={customDescription} 
                                    onChange={e => setCustomDescription(e.target.value)} 
                                    rows={4}
                                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="e.g., 'The kitchen sink faucet has been dripping constantly for 3 days. The drip happens every few seconds and is getting worse...'"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-lg font-semibold text-gray-700 mb-3">Priority Level</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {urgencyLevels.map(({ level, color, description }) => (
                                        <button 
                                            key={level} 
                                            onClick={() => setUrgency(level)} 
                                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                                urgency === level 
                                                    ? `${color} text-white border-transparent transform scale-105 shadow-lg` 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="text-center">
                                                <div className="font-bold text-lg mb-1">{level}</div>
                                                <div className={`text-sm ${urgency === level ? 'text-white/90' : 'text-gray-600'}`}>
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

// --- MAIN TENANT PROPERTY DETAIL PAGE ---
const TenantPropertyDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { data: authUser } = useGetAuthUserQuery();
  const tenantId = authUser?.cognitoInfo?.userId;

  const [property, setProperty] = useState<SellerPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!propertyId) {
      setError("Invalid Property ID.");
      setIsLoading(false);
      return;
    }
    const fetchPropertyDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/seller-properties/${propertyId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch property details.");
        }
        const data = await response.json();
        setProperty(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPropertyDetails();
  }, [propertyId]);

  const handleNextImage = () => {
    if (property && property.photoUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.photoUrls.length);
    }
  };
  
  const handlePrevImage = () => {
    if (property && property.photoUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.photoUrls.length) % property.photoUrls.length);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center p-8">{error}</div>;
  if (!property) return <div className="text-center p-8">Property not found.</div>;

  const locationString = property.location ? `${property.location.city}, ${property.location.state}` : "N/A";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="relative h-[450px] w-full group">
        {property.photoUrls.length > 0 ? (
            <Image 
              src={property.photoUrls[currentImageIndex]} 
              alt={property.name} 
              fill
              style={{ objectFit: 'cover' }}
              className="transition-opacity duration-300"
            />
        ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-400"/>
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        {property.photoUrls.length > 1 && (
            <>
                <button 
                  onClick={handlePrevImage} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft />
                </button>
                <button 
                  onClick={handleNextImage} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight />
                </button>
            </>
        )}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tenants/applications" className="inline-flex items-center mb-6 text-gray-600 hover:text-gray-800 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Applications
        </Link>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="w-full lg:w-2/3 space-y-8">
            <h1 className="text-4xl font-bold text-gray-900">{property.name}</h1>
            <div className="flex items-center gap-x-4 text-gray-600">
                <span className="flex items-center"><MapPin className="w-5 h-5 mr-1.5" />{locationString}</span>
                <span className="flex items-center"><BedDouble className="w-5 h-5 mr-1.5" />{property.beds} Beds</span>
                <span className="flex items-center"><Bath className="w-5 h-5 mr-1.5" />{property.baths} Baths</span>
                <span className="flex items-center"><Ruler className="w-5 h-5 mr-1.5" />{property.squareFeet.toLocaleString()} sqft</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">What this place offers</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map(amenity => {
                    const AmenityIcon = HighlightVisuals[amenity]?.icon || HighlightVisuals.DEFAULT.icon;
                    return (
                      <div key={amenity} className="flex items-center gap-3">
                        <AmenityIcon className="w-5 h-5 text-gray-700" />
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 bg-white border rounded-xl shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Property Management</h3>
              <p className="text-sm text-gray-600">Need help with something? You can request maintenance or view your lease details here.</p>
              <Button 
                onClick={() => setIsModalOpen(true)} 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-base"
              >
                <Wrench className="w-5 h-5 mr-2" /> Request Maintenance
              </Button>
              <Button 
                onClick={() => router.push('/tenants/contracts')} 
                variant="outline" 
                className="w-full py-3 text-base"
              >
                <FileText className="w-5 h-5 mr-2" /> View My Contract
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {property && tenantId && (
        <CreateMaintenanceRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          property={{
            _id: property._id,
            name: property.name,
            managedBy: property.managedBy,
            sellerCognitoId: property.sellerCognitoId,
          }}
          tenantId={tenantId}
          onSuccess={() => {
            alert('Your maintenance request has been submitted successfully!');
            router.push('/tenants/profile');
          }}
        />
      )}
    </div>
  );
};

export default TenantPropertyDetailPage;