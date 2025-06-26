// in src/app/api/applications/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Application from "@/app/models/Application";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect();

  try {
    // --- MODIFIED: Await the context.params promise first ---
    const params = await context.params; 
    const { id } = params; // Now you can safely destructure the id
    
    const { status } = await req.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status provided." }, { status: 400 });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedApplication) {
      return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedApplication }, { status: 200 });

  } catch (error) {
    console.error("Error updating application:", error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// --- NEW: Add this DELETE function ---
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect();

  try {
    const params = await context.params;
    const { id } = params;

    // Validate the ID
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return NextResponse.json({ success: false, message: "Invalid Application ID." }, { status: 400 });
    }

    const deletedApplication = await Application.findByIdAndDelete(id);

    if (!deletedApplication) {
      return NextResponse.json({ success: false, message: "Application not found or already deleted." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Application withdrawn successfully." }, { status: 200 });

  } catch (error) {
    console.error("Error withdrawing application:", error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}