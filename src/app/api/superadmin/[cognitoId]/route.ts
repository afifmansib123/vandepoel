// src/app/api/superadmin/[cognitoId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import SuperAdmin from '@/app/models/SuperAdmin';

// This function handles GET requests to /api/superadmin/[cognitoId]
export async function GET(
  request: NextRequest,
  // --- FIX START: Corrected the context signature ---
  // The 'params' object is not a Promise. This aligns it with your other handlers.
  context: { params: { cognitoId: string } }
  // --- FIX END ---
) {
  await dbConnect();

  try {
    // --- FIX START: Removed 'await' as context.params is not a promise ---
    const { cognitoId } = context.params;
    // --- FIX END ---

    // Check if the cognitoId was provided
    if (!cognitoId) {
      return NextResponse.json({ message: 'Cognito ID is required in the path.' }, { status: 400 });
    }

    // Find the superadmin document in the database using the cognitoId
    const admin = await SuperAdmin.findOne({ cognitoId: cognitoId }).lean().exec();

    // If no admin is found, return a 404 error
    // This is the correct behavior that allows the frontend to trigger user creation.
    if (!admin) {
      return NextResponse.json({ message: 'Super Admin not found' }, { status: 404 });
    }

    // If the admin is found, return their data
    return NextResponse.json(admin, { status: 200 });

  } catch (error: any) {
    // Handle any potential server errors
    console.error(`Error retrieving superadmin:`, error);
    return NextResponse.json({ message: `Error retrieving admin: ${error.message}` }, { status: 500 });
  }
}

// src/app/api/superadmin/route.t

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { cognitoId, name, email } = body;

    if (!cognitoId || !name || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // --- FIX START: Replaced the previous logic with a clear, robust implementation ---
    // First, check if the user already exists.
    const existingAdmin = await SuperAdmin.findOne({ cognitoId }).lean().exec();

    // If the user is found, it means the creation process was triggered unnecessarily
    // or a race condition occurred. We handle it gracefully by returning the existing user.
    if (existingAdmin) {
      console.warn(`[POST /api/superadmin] Attempted to create a superadmin that already exists: ${cognitoId}. Returning existing document.`);
      return NextResponse.json(existingAdmin, { status: 200 });
    }

    // If the user does not exist, proceed with creation.
    console.log(`[POST /api/superadmin] Creating new superadmin for cognitoId ${cognitoId}.`);
    const newAdmin = new SuperAdmin({ cognitoId, name, email });
    const savedAdmin = await newAdmin.save();

    // Return the newly created user with a 201 status.
    return NextResponse.json(savedAdmin.toObject(), { status: 201 });
    // --- FIX END ---

  } catch (error: any) {
    console.error('Error in POST /api/superadmin:', error);
    
    // This catch block specifically handles a race condition where `findOne` returns null,
    // but another process saves the user before this one does, causing a duplicate key error.
    if (error.code === 11000) {
      console.warn(`[POST /api/superadmin] Race condition: Duplicate key error for ${body.cognitoId}. Finding and returning existing user.`);
      const admin = await SuperAdmin.findOne({ cognitoId: body.cognitoId }).lean().exec();
      if (admin) {
        return NextResponse.json(admin, { status: 200 });
      }
    }

    return NextResponse.json({ message: `Error creating superadmin: ${error.message}` }, { status: 500 });
  }
}