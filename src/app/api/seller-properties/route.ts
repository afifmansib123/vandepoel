// FILE: /app/api/seller-properties/route.ts
// STATUS: UPDATED WITH INDIVIDUAL ROOM SUPPORT AND JSON PARSING FIXES

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '../../../utils/dbConnect';
import SellerProperty from '@/app/models/SellerProperty';
import Location from '@/app/models/Location';
import PropertyToken from '@/app/models/PropertyToken';
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import axios, { AxiosResponse } from 'axios';

// UPDATED: Enhanced interfaces to support individual rooms
interface NominatimResult {
    lat: string;
    lon: string;
    [key: string]: any;
}

interface FormattedLocationForResponse {
  id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates: { longitude: number; latitude: number } | null;
}

// UPDATED: Individual room detail interface
interface IndividualRoomDetail {
  description?: string;
  images?: string[];
}

// UPDATED: Enhanced FeatureDetail interface with proper individual room support
interface FeatureDetail {
  count?: number;
  description?: string;
  images?: string[];
  individual?: { [key: string]: IndividualRoomDetail };
}

interface SellerPropertyDataFromFrontend {
  name: string; 
  description?: string; 
  salePrice: number; 
  propertyType?: string; 
  propertyStatus?: string;
  squareFeet?: number; 
  yearBuilt?: number | null; 
  HOAFees?: number | null;
  features?: { [key: string]: FeatureDetail };
  amenities?: string[]; 
  highlights?: string[];
  openHouseDates?: string | string[]; // FIXED: Can be string or array
  sellerNotes?: string; 
  allowBuyerApplications?: boolean;
  preferredFinancingInfo?: string; 
  insuranceRecommendation?: string;
  address: string; 
  city: string; 
  state: string; 
  country: string; 
  postalCode: string;
  managedBy?: string;
}

interface SavedSellerPropertyDocument extends SellerPropertyDataFromFrontend {
  _id: Types.ObjectId | string;
  id: number;
  locationId: number;
  sellerCognitoId: string;
  photoUrls: string[];
  agreementDocumentUrl?: string;
  postedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  buyerInquiries: any[];
  openHouseDates?: string[];
}

interface CreatedSellerPropertyResponse extends Omit<SavedSellerPropertyDocument, '_id' | 'locationId'> {
  _id: string;
  location: FormattedLocationForResponse;
}

interface MongooseValidationError {
  name: 'ValidationError'; 
  message: string;
  errors: { [key: string]: { message: string; [key: string]: any } };
}

function isMongooseValidationError(error: any): error is MongooseValidationError {
  return error && error.name === 'ValidationError' && typeof error.errors === 'object' && error.errors !== null;
}

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});
const S3_BUCKET_NAME = process.env.S3_SELLER_PROPERTY_BUCKET_NAME || process.env.S3_BUCKET_NAME!;

const getBooleanFormValue = (formData: FormData, key: string, defaultValue: boolean = false): boolean => {
    const value = formData.get(key) as string | null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return defaultValue;
};

const getNumericFormValue = (formData: FormData, key: string, isFloat: boolean = false): number | undefined => {
    const value = formData.get(key) as string | null;
    if (value === null || value.trim() === '') return undefined;
    const num = isFloat ? parseFloat(value) : parseInt(value, 10);
    return isNaN(num) ? undefined : num;
};

// NEW: Helper function to safely parse JSON with fallback
const safeJsonParse = (value: string | null, fallback: any = []): any => {
  if (!value || value.trim() === '') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch (error) {
    console.warn(`Failed to parse JSON: ${value}`, error);
    return fallback;
  }
};

// NEW: Helper function to normalize openHouseDates
const normalizeOpenHouseDates = (value: string | null): string[] => {
  if (!value || value.trim() === '') return [];
  
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(date => typeof date === 'string' && date.trim() !== '');
    } else if (typeof parsed === 'string') {
      return parsed.trim() ? [parsed.trim()] : [];
    }
    return [];
  } catch (error) {
    // If JSON parsing fails, treat as a single string
    return value.trim() ? [value.trim()] : [];
  }
};

export async function POST(request: NextRequest) {
  await dbConnect();
  console.log("POST /api/seller-properties called (enhanced with individual rooms)");

  if (!S3_BUCKET_NAME || !s3Client.config.region) {
    console.error("S3 environment variables missing or incomplete.");
    return NextResponse.json({ message: 'Server configuration error for file uploads.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    
    // Parse features from form data
    const featuresString = formData.get('features') as string || '{}';
    const features = safeJsonParse(featuresString, {}) as { [key: string]: FeatureDetail };
    
    // FIXED: Properly handle openHouseDates parsing
    const openHouseDatesRaw = formData.get('openHouseDates') as string;
    const openHouseDates = normalizeOpenHouseDates(openHouseDatesRaw);

    const dataForDb: Omit<SavedSellerPropertyDocument, '_id' | 'id' | 'locationId' | 'photoUrls' | 'agreementDocumentUrl' | 'postedDate' | 'createdAt' | 'updatedAt' | 'buyerInquiries' | 'sellerCognitoId'> & { sellerCognitoId: string } = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      salePrice: getNumericFormValue(formData, 'salePrice', true)!,
      propertyType: formData.get('propertyType') as string,
      propertyStatus: formData.get('propertyStatus') as string,
      features: features,
      squareFeet: getNumericFormValue(formData, 'squareFeet')!,
      yearBuilt: getNumericFormValue(formData, 'yearBuilt'),
      HOAFees: getNumericFormValue(formData, 'HOAFees', true),
      amenities: safeJsonParse(formData.get('amenities') as string, []),
      highlights: safeJsonParse(formData.get('highlights') as string, []),
      openHouseDates: openHouseDates, // FIXED: Now properly parsed
      sellerNotes: formData.get('sellerNotes') as string | undefined,
      allowBuyerApplications: getBooleanFormValue(formData, 'allowBuyerApplications', true),
      preferredFinancingInfo: formData.get('preferredFinancingInfo') as string | undefined,
      insuranceRecommendation: formData.get('insuranceRecommendation') as string | undefined,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      country: formData.get('country') as string,
      postalCode: formData.get('postalCode') as string,
      sellerCognitoId: formData.get('sellerCognitoId') as string,
      managedBy: formData.get('managedBy') as string,
    };

    if (!dataForDb.sellerCognitoId) {
        return NextResponse.json({ message: 'Seller authentication ID is missing from form data.' }, { status: 400 });
    }

    // File Uploads to S3 - Main property photos
    const photoFiles = formData.getAll('photos') as File[];
    const agreementFile = formData.get('agreementDocument') as File | null;
    const uploadedPhotoUrls: string[] = [];
    let agreementDocumentUrl: string | undefined;

    // Upload main property photos
    for (const file of photoFiles) {
        if (file.size > 0) {
          const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: `seller-properties/photos/${Date.now()}-${file.name.replace(/\s+/g, '_')}`,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type,
          };
          const upload = new Upload({ client: s3Client, params: uploadParams });
          const result = await upload.done();
          if ((result as { Location?: string }).Location) {
            uploadedPhotoUrls.push((result as { Location: string }).Location);
          }
        }
    }

    // ENHANCED: Upload feature-specific images (supports individual rooms)
    for (const featureKey of Object.keys(features)) {
        console.log(`Processing feature: ${featureKey}`);
        
        // Handle general feature images (existing functionality)
        const featureImageFiles = formData.getAll(`features[${featureKey}][images]`) as File[];
        console.log(`Found ${featureImageFiles.length} general images for ${featureKey}`);
        
        if (featureImageFiles.length > 0) {
            const uploadedFeatureImageUrls: string[] = [];
            for (const file of featureImageFiles) {
                if (file.size > 0) {
                    const uploadParams = {
                        Bucket: S3_BUCKET_NAME,
                        Key: `seller-properties/features/${featureKey}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`,
                        Body: Buffer.from(await file.arrayBuffer()),
                        ContentType: file.type,
                    };
                    const upload = new Upload({ client: s3Client, params: uploadParams });
                    const result = await upload.done();
                    if ((result as { Location?: string }).Location) {
                        uploadedFeatureImageUrls.push((result as { Location: string }).Location);
                    }
                }
            }
            if (!features[featureKey].images) {
                features[featureKey].images = [];
            }
            features[featureKey].images = [...(features[featureKey].images || []), ...uploadedFeatureImageUrls];
        }

        // ENHANCED: Handle individual room images with better detection
        if (features[featureKey].individual) {
            console.log(`Processing individual rooms for ${featureKey}`);
            
            const individualRooms = features[featureKey].individual!;
            const roomIndices = Object.keys(individualRooms);
            
            for (const roomIndex of roomIndices) {
                console.log(`Processing room ${roomIndex} for ${featureKey}`);
                
                // Try multiple FormData key patterns to find images
                const patterns = [
                    `features[${featureKey}][individual][${roomIndex}][images]`,
                    `features[${featureKey}][individual][${roomIndex}][images][0]`,
                    `features[${featureKey}][individual][${roomIndex}][images][1]`,
                    `features[${featureKey}][individual][${roomIndex}][images][2]`,
                    `features[${featureKey}][individual][${roomIndex}][images][3]`,
                    `features[${featureKey}][individual][${roomIndex}][images][4]`
                ];
                
                let individualImageFiles: File[] = [];
                
                // Collect all individual room images using different patterns
                for (const pattern of patterns) {
                    const files = formData.getAll(pattern) as File[];
                    const validFiles = files.filter(f => f && f.size > 0);
                    individualImageFiles = [...individualImageFiles, ...validFiles];
                }
                
                // Also check for numbered file patterns (e.g., [0], [1], [2])
                for (let i = 0; i < 10; i++) {
                    const numberedPattern = `features[${featureKey}][individual][${roomIndex}][images][${i}]`;
                    const numberedFiles = formData.getAll(numberedPattern) as File[];
                    const validFiles = numberedFiles.filter(f => f && f.size > 0);
                    individualImageFiles = [...individualImageFiles, ...validFiles];
                }
                
                // Remove duplicates based on file name and size
                individualImageFiles = individualImageFiles.filter((file, index, self) => 
                    index === self.findIndex(f => f.name === file.name && f.size === file.size)
                );
                
                console.log(`Found ${individualImageFiles.length} unique individual images for ${featureKey} room ${roomIndex}`);
                
                if (individualImageFiles.length > 0) {
                    const uploadedIndividualImageUrls: string[] = [];
                    
                    for (const file of individualImageFiles) {
                        console.log(`Uploading individual room image: ${file.name} (${file.size} bytes)`);
                        const uploadParams = {
                            Bucket: S3_BUCKET_NAME,
                            Key: `seller-properties/features/${featureKey}/individual/${roomIndex}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/\s+/g, '_')}`,
                            Body: Buffer.from(await file.arrayBuffer()),
                            ContentType: file.type,
                        };
                        const upload = new Upload({ client: s3Client, params: uploadParams });
                        const result = await upload.done();
                        if ((result as { Location?: string }).Location) {
                            uploadedIndividualImageUrls.push((result as { Location: string }).Location);
                            console.log(`Successfully uploaded: ${(result as { Location: string }).Location}`);
                        }
                    }
                    
                    // Ensure the room object exists and add images
                    if (!individualRooms[roomIndex]) {
                        individualRooms[roomIndex] = {};
                    }
                    if (!individualRooms[roomIndex].images) {
                        individualRooms[roomIndex].images = [];
                    }
                    individualRooms[roomIndex].images = [...(individualRooms[roomIndex].images || []), ...uploadedIndividualImageUrls];
                    
                    console.log(`Room ${roomIndex} now has ${individualRooms[roomIndex].images?.length} images`);
                }
            }
        }
    }

    // Upload agreement document
    if (agreementFile && agreementFile.size > 0) {
      const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: `seller-properties/agreements/${Date.now()}-${agreementFile.name.replace(/\s+/g, '_')}`,
        Body: Buffer.from(await agreementFile.arrayBuffer()),
        ContentType: agreementFile.type,
      };
      const upload = new Upload({ client: s3Client, params: uploadParams });
      const result = await upload.done();
      if ((result as { Location?: string }).Location) {
        agreementDocumentUrl = (result as { Location: string }).Location;
      }
    }

    // Geocoding and Location Handling (unchanged)
    let longitude = 0, latitude = 0;
    try {
      const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        street: dataForDb.address, 
        city: dataForDb.city, 
        country: dataForDb.country,
        postalcode: dataForDb.postalCode, 
        format: "json", 
        limit: "1",
      }).toString()}`;
      
      const geocodingResponse: AxiosResponse<NominatimResult[]> = await axios.get(geocodingUrl, {
        headers: { 'User-Agent': 'YourAppName/1.0 (yourcontact@example.com)' },
      });
      
      if (geocodingResponse.data && geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat) {
        longitude = parseFloat(geocodingResponse.data[0].lon);
        latitude = parseFloat(geocodingResponse.data[0].lat);
      }
    } catch (geoError: any) {
      console.error("Geocoding API error:", geoError.message);
    }
    
    const wktCoordinates = `POINT(${longitude} ${latitude})`;

    // Create Location (unchanged)
    const lastLocation = await Location.findOne().sort({ id: -1 }).select('id').lean().exec() as { id?: number } | null;
    const nextLocationId = (lastLocation?.id ?? 0) + 1;

    const newLocation = new Location({
      id: nextLocationId, 
      address: dataForDb.address, 
      city: dataForDb.city, 
      state: dataForDb.state,
      country: dataForDb.country, 
      postalCode: dataForDb.postalCode, 
      coordinates: wktCoordinates,
    });
    await newLocation.save();

    // Create SellerProperty Document
    const lastSellerProperty = await SellerProperty.findOne().sort({ id: -1 }).select('id').lean().exec() as { id?: number } | null;
    const nextSellerPropertyId = (lastSellerProperty?.id ?? 0) + 1;

    const sellerPropertyToSave = new SellerProperty({
      ...dataForDb,
      id: nextSellerPropertyId,
      locationId: newLocation.id,
      features: features, // Now includes individual room data with uploaded images
      photoUrls: uploadedPhotoUrls,
      agreementDocumentUrl: agreementDocumentUrl,
    });

    const savedSellerProperty = await sellerPropertyToSave.save();

    // Prepare Response
    const propertyDocObject = savedSellerProperty.toObject({ virtuals: true }) as SavedSellerPropertyDocument;
    const { _id: propMongoId, locationId: propLocId, ...restOfSavedProp } = propertyDocObject;

    const responseData: CreatedSellerPropertyResponse = {
      ...restOfSavedProp,
      _id: propMongoId.toString(),
      location: {
        id: newLocation.id, 
        address: newLocation.address!, 
        city: newLocation.city!,
        state: newLocation.state!, 
        country: newLocation.country!, 
        postalCode: newLocation.postalCode!,
        coordinates: { longitude, latitude },
      },
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error: unknown) {
    console.error('POST /api/seller-properties - Error:', error);
    if (isMongooseValidationError(error)) {
      return NextResponse.json({ message: 'Validation Error from Database', errors: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'An unknown error occurred during property creation.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const propertyType = searchParams.get('propertyType');
    const propertyStatus = searchParams.get('propertyStatus');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const beds = searchParams.get('beds');
    const country = searchParams.get('country');
    const state = searchParams.get('state');
    const city = searchParams.get('city');

    // Build property filter query
    const propertyFilter: any = {};

    // Text search across name and description
    if (search) {
      propertyFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Property type filter
    if (propertyType && propertyType !== 'any') {
      propertyFilter.propertyType = propertyType;
    }

    // Property status filter (For Rent/For Sale)
    if (propertyStatus && propertyStatus !== 'any') {
      propertyFilter.propertyStatus = propertyStatus;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      propertyFilter.salePrice = {};
      if (minPrice) propertyFilter.salePrice.$gte = parseFloat(minPrice);
      if (maxPrice) propertyFilter.salePrice.$lte = parseFloat(maxPrice);
    }

    // Bedroom filter (beds is minimum count)
    if (beds && beds !== 'any') {
      propertyFilter['features.bedrooms.count'] = { $gte: parseInt(beds) };
    }

    const properties = await SellerProperty.find(propertyFilter).lean();

    // Get location IDs for fetching locations
    const locationIds = properties.map(p => p.locationId);
    const propertyIds = properties.map(p => p._id);

    // Fetch locations and token offerings in parallel
    const [allLocations, tokenOfferings] = await Promise.all([
      Location.find({ id: { $in: locationIds } }).lean(),
      PropertyToken.find({ propertyId: { $in: propertyIds } }).lean()
    ]);

    // Filter locations by country, state, city if specified
    let locations = allLocations;
    if (country || state || city) {
      locations = allLocations.filter(loc => {
        if (country && loc.country !== country) return false;
        if (state && loc.state !== state) return false;
        if (city && loc.city !== city) return false;
        return true;
      });
    }

    // Get location IDs that match the filter
    const matchedLocationIds = locations.map(loc => loc.id);

    // Filter properties to only include those with matching locations
    const filteredProperties = properties.filter(p =>
      matchedLocationIds.includes(p.locationId)
    );

    // Create a map of propertyId -> tokenOffering for quick lookup
    const tokenOfferingMap = new Map();
    tokenOfferings.forEach(offering => {
      tokenOfferingMap.set(offering.propertyId.toString(), offering);
    });

    const response = filteredProperties.map(property => {
      const location = locations.find(loc => loc.id === property.locationId);
      const tokenOffering = tokenOfferingMap.get(property._id?.toString());

      const formattedLocation: FormattedLocationForResponse = {
        id: location?.id ?? -1,
        address: location?.address ?? '',
        city: location?.city ?? '',
        state: location?.state ?? '',
        country: location?.country ?? '',
        postalCode: location?.postalCode ?? '',
        coordinates: location?.coordinates
          ? {
              longitude: parseFloat(location.coordinates.split('(')[1]?.split(' ')[0] ?? '0'),
              latitude: parseFloat(location.coordinates.split(' ')[1]?.replace(')', '') ?? '0'),
            }
          : null,
      };

      return {
        ...property,
        _id: property?._id?.toString(),
        location: formattedLocation,
        isTokenized: !!tokenOffering,
        tokenOffering: tokenOffering ? {
          _id: tokenOffering._id.toString(),
          tokenSymbol: tokenOffering.tokenSymbol,
          totalTokens: tokenOffering.totalTokens,
          tokensSold: tokenOffering.tokensSold,
          status: tokenOffering.status,
        } : undefined,
      };
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching seller properties:", error);
    return NextResponse.json({ message: "Failed to fetch seller properties." }, { status: 500 });
  }
}