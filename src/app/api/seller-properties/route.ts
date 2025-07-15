// FILE: /app/api/seller-properties/route.ts
// STATUS: UPDATE EXISTING FILE

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '../../../utils/dbConnect';
import SellerProperty from '@/app/models/SellerProperty';
import Location from '@/app/models/Location';
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

// NEW: Individual room detail interface
interface IndividualRoomDetail {
  description?: string;
  images?: string[];
}

// UPDATED: Enhanced FeatureDetail interface
interface FeatureDetail {
  count?: number;
  description?: string;
  images?: string[];
  // ADD THIS: Individual room support (optional)
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
  openHouseDates?: string[];
  sellerNotes?: string; 
  allowBuyerApplications?: boolean;
  preferredFinancingInfo?: string; 
  insuranceRecommendation?: string;
  address: string; 
  city: string; 
  state: string; 
  country: string; 
  postalCode: string;
  managedBy? : string;
}

// Keep all other existing interfaces the same...
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
    const features = JSON.parse(featuresString) as { [key: string]: FeatureDetail };
    
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
      amenities: JSON.parse(formData.get('amenities') as string || '[]'),
      highlights: JSON.parse(formData.get('highlights') as string || '[]'),
      openHouseDates: JSON.parse(formData.get('openHouseDates') as string || '[]'),
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
      managedBy : formData.get('managedBy') as string,
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

    // ENHANCED: Handle individual room images with better file detection
    if (features[featureKey].individual) {
        console.log(`Processing individual rooms for ${featureKey}`);
        
        // Initialize individual rooms object if it doesn't exist
        if (!features[featureKey].individual) {
            features[featureKey].individual = {};
        }
        
        const individualRooms = features[featureKey].individual!;
        
        // Check for individual room images using multiple patterns
        const roomIndices = Object.keys(individualRooms);
        
        for (const roomIndex of roomIndices) {
            console.log(`Processing room ${roomIndex} for ${featureKey}`);
            
            // Try multiple FormData key patterns to find images
            const patterns = [
                `features[${featureKey}][individual][${roomIndex}][images]`,
                `features[${featureKey}][individual][${roomIndex}][images][0]`,
                `features[${featureKey}][individual][${roomIndex}][images][1]`,
                `features[${featureKey}][individual][${roomIndex}][images][2]`
            ];
            
            let individualImageFiles: File[] = [];
            
            // Collect all individual room images
            for (const pattern of patterns) {
                const files = formData.getAll(pattern) as File[];
                individualImageFiles = [...individualImageFiles, ...files.filter(f => f.size > 0)];
            }
            
            console.log(`Found ${individualImageFiles.length} individual images for ${featureKey} room ${roomIndex}`);
            
            if (individualImageFiles.length > 0) {
                const uploadedIndividualImageUrls: string[] = [];
                
                for (const file of individualImageFiles) {
                    if (file.size > 0) {
                        console.log(`Uploading individual room image: ${file.name}`);
                        const uploadParams = {
                            Bucket: S3_BUCKET_NAME,
                            Key: `seller-properties/features/${featureKey}/individual/${roomIndex}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`,
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

    // Create SellerProperty Document (unchanged)
    const lastSellerProperty = await SellerProperty.findOne().sort({ id: -1 }).select('id').lean().exec() as { id?: number } | null;
    const nextSellerPropertyId = (lastSellerProperty?.id ?? 0) + 1;

    const sellerPropertyToSave = new SellerProperty({
      ...dataForDb,
      id: nextSellerPropertyId,
      locationId: newLocation.id,
      features: features, // Now includes individual room data
      photoUrls: uploadedPhotoUrls,
      agreementDocumentUrl: agreementDocumentUrl,
    });

    const savedSellerProperty = await sellerPropertyToSave.save();

    // Prepare Response (unchanged)
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

// Keep your existing GET function exactly the same
export async function GET() {
  await dbConnect();
  try {
    const properties = await SellerProperty.find().lean();
    const locationIds = properties.map(p => p.locationId);
    const locations = await Location.find({ id: { $in: locationIds } }).lean();

    const response = properties.map(property => {
      const location = locations.find(loc => loc.id === property.locationId);

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
      };
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching seller properties:", error);
    return NextResponse.json({ message: "Failed to fetch seller properties." }, { status: 500 });
  }
}