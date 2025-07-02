// src/app/(dashboard)/tenants/properties/[id]/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, MapPin, BedDouble, Bath, Ruler, Star, Wrench, FileText,
  ImageIcon, ChevronLeft, ChevronRight, Wifi, Car, Waves, Trees,
  Dumbbell, Shield, Flame, Snowflake, ChefHat, Tv, Dog, Home, X
} from "lucide-react";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { maintenanceCategories, MaintenanceCategory } from '@/lib/maintenanceCategories';

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
}

// --- Highlight Icons Map ---
const HighlightVisuals: Record<string, { icon: React.ElementType }> = {
  "Air Conditioning": { icon: Snowflake }, "Heating": { icon: Flame }, "Hardwood Floors": { icon: Home },
  "High-Speed Internet": { icon: Wifi }, "Garage": { icon: Car }, "Swimming Pool": { icon: Waves },
  "Garden": { icon: Trees }, "Fitness Center": { icon: Dumbbell }, "Security System": { icon: Shield },
  "Updated Kitchen": { icon: ChefHat }, "In-Unit Laundry": { icon: Wrench }, "Pet Friendly": { icon: Dog },
  DEFAULT: { icon: Star },
};


// ============================ THE FIX IS HERE ============================
// The Modal component is now defined OUTSIDE and BEFORE the Page component.
// This prevents it from being recreated on every render of the parent.
// =========================================================================

interface CreateMaintenanceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: {
        _id: string;
        name: string;
        managedBy: string;
    };
    tenantId: string;
    onSuccess: () => void;
}

const CreateMaintenanceRequestModal: React.FC<CreateMaintenanceRequestModalProps> = ({ isOpen, onClose, property, tenantId, onSuccess }) => {
    const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategory | null>(null);
    const [description, setDescription] = useState('');
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // This useEffect will now work correctly because the component is stable.
    useEffect(() => {
        if (isOpen) {
            setSelectedCategory(null);
            setDescription('');
            setUrgency('Medium');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!selectedCategory || !description) {
            setError('Please select a category and provide a description.');
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
                    category: selectedCategory.name,
                    description,
                    urgency,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit request.');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">New Maintenance Request</h2>
                    <p className="text-gray-500">For property: <span className="font-semibold text-gray-600">{property.name}</span></p>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="text-lg font-semibold text-gray-700">1. What's the issue?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                            {maintenanceCategories.map(cat => (
                                <button key={cat.name} onClick={() => setSelectedCategory(cat)}
                                    className={`p-4 border-2 rounded-lg text-center transition-all flex flex-col items-center justify-center h-28 ${selectedCategory?.name === cat.name ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400'}`}>
                                    <cat.icon className={`w-8 h-8 mb-2 ${selectedCategory?.name === cat.name ? 'text-blue-600' : 'text-gray-500'}`} />
                                    <span className={`font-semibold text-sm ${selectedCategory?.name === cat.name ? 'text-blue-700' : 'text-gray-800'}`}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="text-lg font-semibold text-gray-700">2. Describe the problem</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4}
                            className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder={selectedCategory?.description ?? 'Please provide as much detail as possible...'}
                        />
                    </div>
                    <div>
                        <label className="text-lg font-semibold text-gray-700">3. How urgent is it?</label>
                        <div className="flex gap-3 mt-2">
                            {(['Low', 'Medium', 'High'] as const).map(level => (
                                <button key={level} onClick={() => setUrgency(level)}
                                className={`flex-1 py-3 font-semibold rounded-lg border-2 ${urgency === level ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:border-gray-400'}`}>
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>
                <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-4 mt-auto">
                    <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSubmit} disabled={isLoading}
                    className="px-6 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN TENANT PROPERTY DETAIL PAGE (Now uses the modal defined above) ---
const TenantPropertyDetailPage = () => {
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
      } catch (err: any) {
        setError(err.message);
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
                layout="fill"
                objectFit="cover"
                className="transition-opacity duration-300"
            />
        ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center"><ImageIcon className="w-16 h-16 text-gray-400"/></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        {property.photoUrls.length > 1 && (
            <>
                <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft /></button>
                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight /></button>
            </>
        )}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tenants/applications" className="inline-flex items-center mb-6 text-gray-600 hover:text-gray-800 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Applications
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
                    return <div key={amenity} className="flex items-center gap-3"><AmenityIcon className="w-5 h-5 text-gray-700" /><span>{amenity}</span></div>
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 bg-white border rounded-xl shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Property Management</h3>
              <p className="text-sm text-gray-600">Need help with something? You can request maintenance or view your lease details here.</p>
              <Button onClick={() => setIsModalOpen(true)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-base">
                <Wrench className="w-5 h-5 mr-2" />
                Request Maintenance
              </Button>
              <Button onClick={() => router.push('/tenants/contracts')} variant="outline" className="w-full py-3 text-base">
                <FileText className="w-5 h-5 mr-2" />
                View My Contract
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
              managedBy: property.sellerCognitoId,
          }}
          tenantId={tenantId}
          onSuccess={() => {
            alert('Your maintenance request has been submitted successfully!');
            router.push('/tenants/maintenance');
          }}
        />
      )}
    </div>
  );
};

export default TenantPropertyDetailPage;