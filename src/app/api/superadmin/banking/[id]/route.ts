import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { authenticateAndAuthorize } from '@/lib/authUtils';
import BankingService from '@/app/models/BankingService';

// --- UPDATE a Banking Service ---
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate and authorize the user as a superadmin
  const authResult = await authenticateAndAuthorize(request, ['superadmin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  await dbConnect();

  try {
    // 2. Correctly await and extract the ID from route parameters
    const params = await context.params;
    const { id } = params;

    // 3. Validate the ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return NextResponse.json({ message: "Invalid ID format." }, { status: 400 });
    }
    
    // 4. Get the update data from the request body
    const body = await request.json();

    // 5. Find the service by its MongoDB _id and update it
    const updatedService = await BankingService.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    // 6. Handle not found case
    if (!updatedService) {
      return NextResponse.json({ message: "Banking service not found." }, { status: 404 });
    }

    // 7. Return the updated service
    return NextResponse.json(updatedService, { status: 200 });

  } catch (error: any) {
    console.error('Error updating banking service:', error);
    return NextResponse.json({ message: `Server Error: ${error.message}` }, { status: 500 });
  }
}

// --- DELETE a Banking Service ---
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate and authorize
  const authResult = await authenticateAndAuthorize(request, ['superadmin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  await dbConnect();

  try {
    // 2. Correctly get the ID
    const params = await context.params;
    const { id } = params;

    // 3. Validate ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return NextResponse.json({ message: "Invalid ID format." }, { status: 400 });
    }

    // 4. Find and delete the service
    const deletedService = await BankingService.findByIdAndDelete(id);

    // 5. Handle not found case
    if (!deletedService) {
      return NextResponse.json({ message: "Banking service not found or already deleted." }, { status: 404 });
    }

    // 6. Return a success confirmation
    return NextResponse.json({ message: "Banking service deleted successfully." }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting banking service:', error);
    return NextResponse.json({ message: `Server Error: ${error.message}` }, { status: 500 });
  }
}