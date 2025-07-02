import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import MaintenanceRequest from "@/app/models/MaintenanceRequest";
import SellerProperty from "@/app/models/SellerProperty";

// Create a new request
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    
    // Validate that at least one user ID is provided
    if (!body.tenantId && !body.managerId && !body.landlordId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "At least one of tenantId, managerId, or landlordId is required" 
        },
        { status: 400 }
      );
    }
    
    const newRequest = await MaintenanceRequest.create(body);
    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

// Get requests for a specific user (tenant, manager, or landlord)
export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');
    const managerId = url.searchParams.get('managerId');
    const landlordId = url.searchParams.get('landlordId');

    // Build filter for any of the three user types
    let filter: any = {};
    if (tenantId) {
      filter.tenantId = tenantId;
    } else if (managerId) {
      filter.managerId = managerId;
    } else if (landlordId) {
      filter.landlordId = landlordId;
    }

    const requests = await MaintenanceRequest.find(filter)
      .populate({ 
          path: 'propertyId', 
          model: SellerProperty, 
          select: 'name photoUrls' 
      })
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ success: true, data: requests }, { status: 200 });

  } catch (error: any) {
    console.error('GET Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}