import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { authenticateAndAuthorize } from '@/lib/authUtils';
import MaintenanceProvider from '@/app/models/MaintenanceProvider';

export async function POST(request: NextRequest) {
  // Authenticate and authorize - only superadmin can create maintenance providers
  const authResult = await authenticateAndAuthorize(request, ['superadmin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  await dbConnect();

  try {
    const body = await request.json();
    
    // Basic validation
    const { companyName, email } = body;
    if (!companyName || !email) {
      return NextResponse.json({ message: 'Company Name and Email are required.' }, { status: 400 });
    }

    const newProvider = new MaintenanceProvider(body);
    await newProvider.save();

    return NextResponse.json(newProvider, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance provider:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) {
        return NextResponse.json({ message: 'A provider with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: `Server Error: ${error.message}` }, { status: 500 });
  }
}