import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect"; // Corrected your import path
import Application from "@/app/models/Application";
import SellerProperty from "@/app/models/SellerProperty";
import { createNotification } from "@/lib/notifications";
import Buyer from "@/app/models/Buyer";
import Tenant from "@/app/models/Tenant";
import Manager from "@/app/models/Manager";
import Landlord from "@/app/models/Landlord";

// Your POST function with notifications
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

    // Get property details for notification
    const property = await SellerProperty.findById(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, message: "Property not found." }, { status: 404 });
    }

    // Check if property is tokenized and application is for agent role
    if (property.isTokenized && applicationType === 'AgentApplication') {
      return NextResponse.json({
        success: false,
        message: "Tokenized properties do not accept agent applications."
      }, { status: 400 });
    }

    // Fetch sender and receiver contact details for CRM tracking
    let senderDetails: any = null;
    let receiverDetails: any = null;

    // Try to find sender in different user models
    senderDetails = await Buyer.findOne({ cognitoId: senderId }).select('name email phoneNumber') ||
                    await Tenant.findOne({ cognitoId: senderId }).select('name email phoneNumber') ||
                    await Manager.findOne({ cognitoId: senderId }).select('name email phoneNumber');

    // Try to find receiver in different user models
    const landlordReceiver = await Landlord.findOne({ cognitoId: receiverId }).select('name email phoneNumber');
    const managerReceiver = await Manager.findOne({ cognitoId: receiverId }).select('name email phoneNumber');
    receiverDetails = landlordReceiver || managerReceiver;

    const newApplication = new Application({
      propertyId,
      senderId,
      receiverId,
      applicationType,
      formData,
      // Populate contact details for CRM
      senderName: senderDetails?.name,
      senderEmail: senderDetails?.email,
      senderPhone: senderDetails?.phoneNumber || formData.phone || formData.phoneNumber,
      receiverName: receiverDetails?.name,
      receiverEmail: receiverDetails?.email,
      receiverPhone: receiverDetails?.phoneNumber,
    });

    await newApplication.save();

    // Send notification to receiver (property owner/manager)
    const propertyName = property.name || 'a property';
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationUrl = '';

    // Determine the base URL based on receiver type
    const baseApplicationsUrl = managerReceiver ? '/managers/applications' : '/landlords/applications';

    if (applicationType === 'ScheduleVisit') {
      notificationTitle = 'New Property Visit Request';
      notificationMessage = `Someone has requested to visit ${propertyName}.`;
      notificationUrl = baseApplicationsUrl;
    } else if (applicationType === 'AgentApplication') {
      notificationTitle = 'New Agent Application';
      notificationMessage = `A manager has applied to be an agent for ${propertyName}.`;
      notificationUrl = baseApplicationsUrl;
    } else if (applicationType === 'RentRequest') {
      notificationTitle = 'New Rental Application';
      notificationMessage = `Someone has applied to rent ${propertyName}.`;
      notificationUrl = baseApplicationsUrl;
    } else if (applicationType === 'FinancialInquiry') {
      notificationTitle = 'New Financial Inquiry';
      notificationMessage = `Someone has submitted a financial inquiry for ${propertyName}.`;
      notificationUrl = baseApplicationsUrl;
    } else {
      notificationTitle = 'New Application';
      notificationMessage = `You have a new application for ${propertyName}.`;
      notificationUrl = baseApplicationsUrl;
    }

    await createNotification({
      userId: receiverId,
      type: 'application',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: newApplication._id.toString(),
      relatedUrl: notificationUrl,
      priority: 'high',
    });

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
        select: 'name photoUrls sellerCognitoId' // Include sellerCognitoId for contract creation
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