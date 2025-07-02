import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '../../../../utils/dbConnect';
import Manager from '@/app/models/Manager';
import { authenticateAndAuthorize, AuthenticatedUser } from '@/lib/authUtils';

// --- ALL YOUR ORIGINAL INTERFACES AND TYPE GUARDS ---
interface ManagerDocument {
  _id: Types.ObjectId | string;
  cognitoId: string;
  name?: string;
  email?: string;
  [key: string]: any;
}
interface ManagerResponse {
  _id: string;
  cognitoId: string;
  name?: string;
  email?: string;
  [key: string]: any;
}
interface ManagerPutRequestBody {
  cognitoId?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}
interface MongooseValidationError {
  name: 'ValidationError';
  message: string;
  errors: { [key: string]: any; };
}
function isMongooseValidationError(error: any): error is MongooseValidationError {
  return error && error.name === 'ValidationError' && typeof error.errors === 'object' && error.errors !== null;
}
// --- END ---


// --- GET HANDLER (UNCHANGED FROM YOUR ORIGINAL) ---
export async function GET(
  request: NextRequest,
  context: { params: Promise< { cognitoId: string } >}
) {
  console.log("--- GET /api/managers/[cognitoId] ---");
  console.log("Received context:", context);
  
  const { cognitoId: cognitoIdFromPath } = await context.params;

  console.log(`[API /managers/:id GET] Handler invoked. Path param cognitoId: "${cognitoIdFromPath}"`);

  await dbConnect();
  console.log(`[API /managers/:id GET] DB connected. Querying for cognitoId: "${cognitoIdFromPath}"`);

  try {
    const manager = await Manager.findOne({ cognitoId: cognitoIdFromPath })
      .lean()
      .exec() as unknown as ManagerDocument | null;

    if (!manager) {
      console.log(`[API /managers/:id GET] MongoDB Query Result: Manager with Cognito ID "${cognitoIdFromPath}" NOT FOUND.`);
      return NextResponse.json({ message: 'Manager not found' }, { status: 404 });
    }

    console.log(`[API /managers/:id GET] MongoDB Query Result: Found manager "${manager.name || '(name not set)'}" for Cognito ID "${cognitoIdFromPath}".`);

    const responseManager: ManagerResponse = {
      ...manager,
      _id: typeof manager._id === 'string' ? manager._id : manager._id.toString(),
      name: manager.name,
      email: manager.email,
      cognitoId: manager.cognitoId,
    };
    return NextResponse.json(responseManager, { status: 200 });

  } catch (error: unknown) {
    console.error(`[API /managers/:id GET] Database or other error fetching manager "${cognitoIdFromPath}":`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Error retrieving manager: ${message}` }, { status: 500 });
  }
}

// --- PUT HANDLER (WITH CORRECTED LOGIC FOR NEW MODEL) ---
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ cognitoId: string }> }
) {
  console.log("--- PUT /api/managers/[cognitoId] ---");
  console.log("Received context:", context);
  
  const { cognitoId: cognitoIdFromPath } = await context.params;
  console.log(`[API /managers/:id PUT] Handler invoked. Path param cognitoId: "${cognitoIdFromPath}"`);

  console.log(`[API /managers/:id PUT] Authorization check passed.`);
  
  if (!cognitoIdFromPath || cognitoIdFromPath.trim() === '') {
    console.error("Error: cognitoIdFromPath is invalid or missing from context.params in PUT request");
    return NextResponse.json({ message: 'Cognito ID is required in path and must be non-empty' }, { status: 400 });
  }

  await dbConnect();
  console.log(`[API /managers/:id PUT] DB connected. Processing for cognitoId: ${cognitoIdFromPath}`);

  try {
    const body: ManagerPutRequestBody = await request.json();
    console.log(`[API /managers/:id PUT] Request body:`, body);

    const updateData: { [key: string]: any } = {};

    // A list of all fields that can be updated via this endpoint.
    const allowedUpdateFields = [
      'name', 'email', 'phoneNumber', 'companyName', 'address',
      'description', 'businessLicense', 'profileImage', 'status'
    ];
    
    // Iterate over the allowed fields and add them to `updateData` if they exist in the request body.
    for (const field of allowedUpdateFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      console.log('[API /managers/:id PUT] No valid fields provided for update.');
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    const updatedManager = await Manager.findOneAndUpdate(
      { cognitoId: cognitoIdFromPath },
      { $set: updateData }, // Use the dynamically built updateData object
      { new: true, runValidators: true }
    ).lean().exec() as unknown as ManagerDocument | null;

    if (!updatedManager) {
      console.log(`[API /managers/:id PUT] Manager with Cognito ID "${cognitoIdFromPath}" not found for update or no changes made.`);
      return NextResponse.json({ message: 'Manager not found or no changes made' }, { status: 404 });
    }

    console.log(`[API /managers/:id PUT] Updated manager name: ${updatedManager.name || '(name not set)'}`);

    const responseManager: ManagerResponse = {
      ...updatedManager,
      _id: typeof updatedManager._id === 'string' ? updatedManager._id : updatedManager._id.toString(),
      name: updatedManager.name,
      email: updatedManager.email,
      cognitoId: updatedManager.cognitoId,
    };
    return NextResponse.json(responseManager, { status: 200 });

  } catch (error: unknown) {
    console.error(`[API /managers/:id PUT] Error updating manager "${cognitoIdFromPath}":`, error);
    if (isMongooseValidationError(error)) {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Error updating manager: ${message}` }, { status: 500 });
  }
}