import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import MaintenanceRequest from "@/app/models/MaintenanceRequest";
import SellerProperty from "@/app/models/SellerProperty"; // For populating

// Create a new request
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const newRequest = await MaintenanceRequest.create(body);
    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

// Get requests for a specific tenant
export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const tenantId = new URL(req.url).searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ success: false, message: "Tenant ID is required." }, { status: 400 });
    }
    const requests = await MaintenanceRequest.find({ tenantId })
      .populate({ path: 'propertyId', model: SellerProperty, select: 'name photoUrls' })
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: requests }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}