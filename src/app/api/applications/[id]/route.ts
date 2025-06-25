import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Application from "@/app/models/Application";

export async function PUT(req: NextRequest,{ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();

  try {
    const { id } = await params; // Await the params
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