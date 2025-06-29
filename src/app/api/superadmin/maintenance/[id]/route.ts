import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { authenticateAndAuthorize } from '@/lib/authUtils';
import MaintenanceProvider from '@/app/models/MaintenanceProvider';

// --- UPDATE a Maintenance Provider ---
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate and authorize the user as a superadmin
  const authResult = await authenticateAndAuthorize(request, ['superadmin']);
  if (authResult instanceof NextResponse) {
    return authResult; // Return the 401/403 response if auth fails
  }

  await dbConnect();

  try {
    // 2. Correctly await and extract the ID from route parameters
    const params = await context.params;
    const { id } = params;

    // 3. Validate the ID format to prevent database errors
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return NextResponse.json({ message: "Invalid ID format." }, { status: 400 });
    }
    
    // 4. Get the update data from the request body
    const body = await request.json();

    // 5. Find the provider by its MongoDB _id and update it
    const updatedProvider = await MaintenanceProvider.findByIdAndUpdate(
      id,
      body, // Pass the entire body for updating
      { new: true, runValidators: true } // Options: return the new version, run schema validations
    );

    // 6. Handle the case where the provider is not found
    if (!updatedProvider) {
      return NextResponse.json({ message: "Maintenance provider not found." }, { status: 404 });
    }

    // 7. Return the updated provider
    return NextResponse.json(updatedProvider, { status: 200 });

  } catch (error: any) {
    console.error('Error updating maintenance provider:', error);
    return NextResponse.json({ message: `Server Error: ${error.message}` }, { status: 500 });
  }
}

// --- DELETE a Maintenance Provider ---
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

    // 4. Find and delete the provider
    const deletedProvider = await MaintenanceProvider.findByIdAndDelete(id);

    // 5. Handle not found case
    if (!deletedProvider) {
      return NextResponse.json({ message: "Maintenance provider not found or already deleted." }, { status: 404 });
    }

    // 6. Return a success confirmation
    return NextResponse.json({ message: "Maintenance provider deleted successfully." }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting maintenance provider:', error);
    return NextResponse.json({ message: `Server Error: ${error.message}` }, { status: 500 });
  }
}