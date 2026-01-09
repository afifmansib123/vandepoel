import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import MaintenanceRequest from "@/app/models/MaintenanceRequest";
import SellerProperty from "@/app/models/SellerProperty";
import { createNotification } from "@/lib/notifications";

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

    // Fetch property details for notification
    const property = await SellerProperty.findById(body.propertyId);
    const propertyName = property?.name || 'a property';

    // Create a preview of the description (first 100 characters)
    const descriptionPreview = body.description.length > 100
      ? `${body.description.substring(0, 100)}...`
      : body.description;

    // Prepare notification message with category and full description
    const notificationMessage = `New ${body.urgency} priority ${body.category.toLowerCase()} issue reported for ${propertyName}:\n\n"${descriptionPreview}"`;

    // Send notification to manager if present
    if (body.managerId) {
      await createNotification({
        userId: body.managerId,
        type: 'maintenance',
        title: `New Maintenance Request - ${body.category}`,
        message: notificationMessage,
        relatedId: newRequest._id.toString(),
        relatedUrl: '/managers/properties',
        priority: body.urgency === 'High' ? 'high' : body.urgency === 'Medium' ? 'medium' : 'low',
      });
    }

    // Send notification to landlord if present and different from manager
    if (body.landlordId && body.landlordId !== body.managerId) {
      await createNotification({
        userId: body.landlordId,
        type: 'maintenance',
        title: `New Maintenance Request - ${body.category}`,
        message: notificationMessage,
        relatedId: newRequest._id.toString(),
        relatedUrl: '/landlords/properties',
        priority: body.urgency === 'High' ? 'high' : body.urgency === 'Medium' ? 'medium' : 'low',
      });
    }

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
    const filter: any = {};
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