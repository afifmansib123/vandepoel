import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Application from "@/app/models/Application";
import SellerProperty from "@/app/models/SellerProperty";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    const {
      propertyId,
      senderId,
      receiverId,
      applicationType,
      formData
    } = body;

    // Server-side validation
    if (!propertyId || !senderId || !receiverId || !applicationType || !formData) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const newApplication = new Application({
      propertyId,
      senderId,
      receiverId,
      applicationType,
      formData
    });

    await newApplication.save();

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully.",
      data: newApplication,
    }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Error creating application:", error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// Add this to your /api/applications/route.ts file, replacing the old GET function

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    // We no longer need to check for a userId, so those lines are removed.

    // The database query is now simplified to find ALL documents.
    // An empty object {} in find() means "match everything".
    const applications = await Application.find({})
      .populate({
          path: 'propertyId',
          model: SellerProperty, // Make sure this model is imported
          select: 'name photoUrls'
      })
      .sort({ createdAt: -1 }); // Show the newest applications first

    return NextResponse.json({
      success: true,
      data: applications,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching all applications:", error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}