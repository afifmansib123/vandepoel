import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import SuperAdmin from '@/app/models/SuperAdmin';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { cognitoId, name, email } = body;

    if (!cognitoId || !name || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingAdmin = await SuperAdmin.findOne({ cognitoId }).lean().exec();
    
    // --- THIS IS THE FIX ---
    // If the admin already exists in our database, that's fine.
    // Just return their data with a 200 OK status.
    if (existingAdmin) {
      console.log(`[POST /api/superadmin] Superadmin with cognitoId ${cognitoId} already exists. Returning existing document.`);
      return NextResponse.json(existingAdmin, { status: 200 });
    }
    // --- END OF FIX ---

    console.log(`[POST /api/superadmin] Creating new superadmin for cognitoId ${cognitoId}.`);
    const newAdmin = new SuperAdmin({ cognitoId, name, email });
    const savedAdmin = await newAdmin.save();

    return NextResponse.json(savedAdmin.toObject(), { status: 201 }); // 201 Created for a new user

  } catch (error: any) {
    console.error('Error in POST /api/superadmin:', error);
    if (error.code === 11000) {
      // This is a backup for a race condition. Find the user again and return them.
      const admin = await SuperAdmin.findOne({ cognitoId: body.cognitoId }).lean().exec();
      return NextResponse.json(admin, { status: 200 });
    }
    return NextResponse.json({ message: `Error: ${error.message}` }, { status: 500 });
  }
}