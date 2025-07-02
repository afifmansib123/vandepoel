import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import MaintenanceRequest from "@/app/models/MaintenanceRequest";
import mongoose from "mongoose";

interface RouteContext {
  params: { id: string };
}

// ======================= THE FIX IS IN THE FUNCTION SIGNATURE =======================
export async function PUT(req: NextRequest, context: RouteContext) {
  await dbConnect();
  
  // Destructure 'id' from context.params
  const { id } = context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Invalid request ID format" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
        return NextResponse.json({ success: false, message: "A valid status is required." }, { status: 400 });
    }

    const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(
      id,
      { $set: { status: status } },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedRequest) {
      return NextResponse.json({ success: false, message: "Maintenance request not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRequest }, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating request ${id}:`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/maintenance-requests/[id] - Also useful for a superadmin
export async function DELETE(req: NextRequest, { params }: RouteContext) {
    await dbConnect();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: "Invalid request ID format" }, { status: 400 });
    }

    try {
        const deletedRequest = await MaintenanceRequest.findByIdAndDelete(id);
        if (!deletedRequest) {
            return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Request deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}