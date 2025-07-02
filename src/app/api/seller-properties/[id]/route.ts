// src/app/api/seller-properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '../../../../utils/dbConnect';
import SellerProperty from '@/app/models/SellerProperty'; // Your SellerProperty model
import Location from '@/app/models/Location';             // Your Location model

// --- Re-usable Type Definitions (can be moved to a shared types file later) ---

interface ParsedPointCoordinates {
  longitude: number;
  latitude: number;
}

interface FormattedLocationForResponse {
  id: number;
  address?: string; // Made optional to match common patterns
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates: ParsedPointCoordinates | null;
}

// Interface for SellerProperty document from DB (includes all fields)
// This should closely match your SellerProperty Mongoose schema.
interface SellerPropertyDocumentLean {
  _id: Types.ObjectId | string;
  id: number; // Numeric ID
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
  openHouseDates?: string[]; // Stored as array of strings
  sellerNotes?: string;
  allowBuyerApplications: boolean;
  preferredFinancingInfo?: string;
  insuranceRecommendation?: string;
  sellerCognitoId: string;
  photoUrls: string[];
  agreementDocumentUrl?: string;
  locationId: number; // Foreign key to Location
  postedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  buyerInquiries?: any[]; // Define more specifically if possible
  managedBy : string;
  // Add any other fields from your SellerProperty schema
  [key: string]: any;
}

// For the API response of a single property (with populated location)
interface SingleSellerPropertyResponse extends Omit<SellerPropertyDocumentLean, '_id' | 'locationId'> {
  _id: string;
  location: FormattedLocationForResponse | null; // Location can be null if not found
}

// Context for dynamic route parameters
interface HandlerContext {
  params: {
    id: string; // The property ID from the URL path
  };
}
// --- End Type Definitions ---

// Helper function to parse WKT
function parseWKTPointString(wktString: string | null | undefined): ParsedPointCoordinates | null {
    if (!wktString || typeof wktString !== 'string') return null;
    const match = wktString.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (match && match.length === 3) {
        const longitude = parseFloat(match[1]);
        const latitude = parseFloat(match[2]);
        if (!isNaN(longitude) && !isNaN(latitude)) {
            return { longitude, latitude };
        }
    }
    console.warn("Could not parse WKT for location coordinates:", wktString);
    return null;
}

// Keep all your existing imports and type definitions at the top of the file

// This single GET function now handles BOTH numeric IDs and MongoDB _ids.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // The context param is simplified here
) {
  await dbConnect();
  
  const { id: idParam } = params;
  
  console.log(`GET /api/seller-properties/ with parameter: ${idParam}`);

  if (!idParam) {
    return NextResponse.json({ message: "Property ID parameter is missing." }, { status: 400 });
  }

  // --- THIS IS THE NEW LOGIC TO CHECK BOTH ID TYPES ---

  let query: any;
  // Check if the parameter is a valid 24-character hex string (a MongoDB ObjectId)
  if (/^[0-9a-fA-F]{24}$/.test(idParam)) {
    console.log(`Parameter '${idParam}' is a valid MongoDB ObjectId. Querying by _id.`);
    query = { _id: idParam };
  } else if (!isNaN(Number(idParam))) {
    // Check if it's a number
    console.log(`Parameter '${idParam}' is a number. Querying by numeric id.`);
    query = { id: Number(idParam) };
  } else {
    // If it's neither, it's an invalid format
    return NextResponse.json({ message: "Invalid Property ID format." }, { status: 400 });
  }

  try {
    // The query object is now dynamically set to search by either _id or id
    const property = await SellerProperty.findOne(query)
      .lean()
      .exec() as SellerPropertyDocumentLean | null;

    if (!property) {
      console.log(`Property not found with query:`, query);
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }
    console.log(`Found Property: ${property.name}`);

    // The rest of your logic for fetching and formatting the location is perfect and remains unchanged.
    let formattedLocation: FormattedLocationForResponse | null = null;
    if (property.locationId) {
      const locationDoc = await Location.findOne({ id: property.locationId })
        .lean()
        .exec() as { id: number; address?: string; city?: string; state?: string; country?: string; postalCode?: string; coordinates?: string; } | null;

      // =========================== THE FIX IS HERE ===========================
      if (locationDoc) {
        formattedLocation = {
          id: locationDoc.id, // We know id exists because locationDoc exists
          address: locationDoc.address ?? '', // Use ?? to provide a default empty string
          city: locationDoc.city ?? '',       // Use ?? to provide a default empty string
          state: locationDoc.state ?? '',       // Use ?? to provide a default empty string
          country: locationDoc.country ?? '',     // Use ?? to provide a default empty string
          postalCode: locationDoc.postalCode ?? '', // Use ?? to provide a default empty string
          coordinates: parseWKTPointString(locationDoc.coordinates), // Your helper handles this case already
        };
      }
      // ========================= END OF FIX =========================
      else {
        console.warn(`Location with ID ${property.locationId} not found for SellerProperty ID ${property.id}.`);
      }
    } else {
        console.log(`SellerProperty ID ${property.id} does not have a locationId.`);
    }

    const { _id, locationId, ...restOfProperty } = property;
    const responseData: SingleSellerPropertyResponse = {
      ...restOfProperty,
      _id: _id.toString(),
      location: formattedLocation,
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error fetching property with parameter '${idParam}':`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Error retrieving property: ${message}` }, { status: 500 });
  }
}

// Your existing PUT and DELETE functions remain below...
// ...
// in src/app/api/seller-properties/[id]/route.ts

// Keep all your existing imports

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  
  const params = await context.params;
  const { id: propertyMongoId } = params; // This is now the MongoDB _id (e.g., '65a5...')

  // --- MODIFIED: Validate the MongoDB ID format ---
  if (!propertyMongoId || !/^[0-9a-fA-F]{24}$/.test(propertyMongoId)) {
    return NextResponse.json({ message: "Invalid property ID format. Must be a 24-character hex string." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { managedBy } = body;

    if (!managedBy || typeof managedBy !== 'string') {
      return NextResponse.json({ message: "A 'managedBy' field with the agent's cognitoId is required." }, { status: 400 });
    }

    // --- MODIFIED: Find the document by its MongoDB _id using findByIdAndUpdate ---
    const updatedProperty = await SellerProperty.findByIdAndUpdate(
      propertyMongoId, // Use the MongoDB _id directly
      { $set: { managedBy: managedBy } },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    console.log(`Property ID ${propertyMongoId} has been successfully assigned to manager: ${managedBy}`);
    return NextResponse.json(updatedProperty, { status: 200 });

  } catch (error: unknown) {
    console.error(`PUT /api/seller-properties/${propertyMongoId} - Error:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Error updating property: ${message}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await dbConnect();

    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }

    // Option 2: If using AWS Cognito, replace above with your Cognito auth check
    // const authHeader = request.headers.get("authorization");
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   return NextResponse.json(
    //     { success: false, message: "Unauthorized - No token provided" },
    //     { status: 401 }
    //   );
    // }
    // const token = authHeader.substring(7);
    // // Verify the token with AWS Cognito
    // const cognitoUser = await verifyCognitoToken(token);
    // if (!cognitoUser) {
    //   return NextResponse.json(
    //     { success: false, message: "Unauthorized - Invalid token" },
    //     { status: 401 }
    //   );
    // }

    // Check if property exists
    const existingProperty = await SellerProperty.findById(propertyId);
    if (!existingProperty) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    // Optional: Delete associated images from S3
    // Uncomment and adjust if you want to clean up S3 images
    /*
    if (existingProperty.photoUrls && existingProperty.photoUrls.length > 0) {
      try {
        await deleteS3Images(existingProperty.photoUrls);
      } catch (s3Error) {
        console.error("Error deleting S3 images:", s3Error);
        // Continue with property deletion even if S3 cleanup fails
      }
    }

    // Delete feature images if they exist
    if (existingProperty.features) {
      for (const feature of Object.values(existingProperty.features)) {
        if (feature.images && feature.images.length > 0) {
          try {
            await deleteS3Images(feature.images);
          } catch (s3Error) {
            console.error("Error deleting feature images:", s3Error);
          }
        }
      }
    }
    */

    // Delete the property from database
    await SellerProperty.findByIdAndDelete(propertyId);


    return NextResponse.json(
      { 
        success: true, 
        message: "Property deleted successfully",
        deletedPropertyId: propertyId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting property:", error);

    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error while deleting property" 
      },
      { status: 500 }
    );
  }
}

// Optional: Helper function to delete S3 images
/*
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function deleteS3Images(imageUrls: string[]) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  for (const imageUrl of imageUrls) {
    try {
      // Extract the key from the full S3 URL
      const urlParts = imageUrl.split('/');
      const key = urlParts.slice(3).join('/'); // Remove https://bucket-name.s3.region.amazonaws.com/
      
      await s3.deleteObject({
        Bucket: bucketName,
        Key: key,
      }).promise();
      
      console.log(`Deleted S3 image: ${key}`);
    } catch (error) {
      console.error(`Failed to delete S3 image ${imageUrl}:`, error);
      // Continue with other images even if one fails
    }
  }
} */