import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect"; // Corrected your import path
import Application from "@/app/models/Application";
import SellerProperty from "@/app/models/SellerProperty";

// Your POST function remains the same
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
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating application:", error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// --- The New, Powerful GET Function ---
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    // 1. Read all potential query parameters from the request URL
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const senderId = url.searchParams.get('senderId');
    const receiverId = url.searchParams.get('receiverId');

    // 2. Build the filter object dynamically based on the parameters provided
    let filter: any = {};

    if (userId) {
      // If a general 'userId' is provided, find where they are either sender OR receiver
      filter = { $or: [{ senderId: userId }, { receiverId: userId }] };
    } else {
      // If specific filters are provided, use them
      if (senderId) {
        filter.senderId = senderId;
      }
      if (receiverId) {
        filter.receiverId = receiverId;
      }
    }
    // If no parameters are provided, the filter object remains empty ({}), which finds all documents.

    // 3. Apply the filter to the database query
    const applications = await Application.find(filter)
      .populate({
        path: 'propertyId',
        model: SellerProperty,
        select: 'name photoUrls'
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: applications,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching applications:", error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}