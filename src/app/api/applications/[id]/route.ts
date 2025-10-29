// in src/app/api/applications/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Application from "@/app/models/Application";
import SellerProperty from "@/app/models/SellerProperty";
import Manager from "@/app/models/Manager";
import { createNotification } from "@/lib/notifications";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect();

  try {
    // --- MODIFIED: Await the context.params promise first ---
    const params = await context.params;
    const { id } = params; // Now you can safely destructure the id

    const { status } = await req.json();

    if (!status || !['approved', 'rejected', 'contacted'].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status provided." }, { status: 400 });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('propertyId');

    if (!updatedApplication) {
      return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });
    }

    // Send notification to applicant (sender) when status changes
    const property = updatedApplication.propertyId as any;
    const propertyName = property?.name || 'the property';
    const applicationType = updatedApplication.applicationType;

    let notificationTitle = '';
    let notificationMessage = '';
    let notificationUrl = '';

    if (status === 'approved') {
      // Handle different application types
      if (applicationType === 'ScheduleVisit') {
        notificationTitle = 'Property Visit Request Approved';
        notificationMessage = `Your request to visit ${propertyName} has been approved. The owner will contact you soon.`;
        notificationUrl = '/buyers/applications';
      } else if (applicationType === 'AgentApplication') {
        notificationTitle = 'Agent Application Approved';
        notificationMessage = `Congratulations! You've been approved as an agent for ${propertyName}.`;
        notificationUrl = '/managers/properties';

        // Update the property's managedBy field to include this manager
        if (property) {
          await SellerProperty.findByIdAndUpdate(
            property._id,
            { managedBy: updatedApplication.senderId }
          );
        }
      } else if (applicationType === 'RentRequest') {
        notificationTitle = 'Rental Application Approved';
        notificationMessage = `Your rental application for ${propertyName} has been approved. The landlord will contact you with next steps.`;
        notificationUrl = '/tenants/applications';
      } else {
        notificationTitle = 'Application Approved';
        notificationMessage = `Your application for ${propertyName} has been approved.`;
        notificationUrl = '/buyers/applications';
      }

      // Create notification for the applicant
      await createNotification({
        userId: updatedApplication.senderId,
        type: 'application',
        title: notificationTitle,
        message: notificationMessage,
        relatedId: updatedApplication._id.toString(),
        relatedUrl: notificationUrl,
        priority: 'high',
      });
    } else if (status === 'rejected') {
      if (applicationType === 'ScheduleVisit') {
        notificationTitle = 'Property Visit Request Declined';
        notificationMessage = `Unfortunately, your request to visit ${propertyName} has been declined.`;
        notificationUrl = '/buyers/applications';
      } else if (applicationType === 'AgentApplication') {
        notificationTitle = 'Agent Application Declined';
        notificationMessage = `Your application to be an agent for ${propertyName} has been declined.`;
        notificationUrl = '/managers/applications';
      } else if (applicationType === 'RentRequest') {
        notificationTitle = 'Rental Application Declined';
        notificationMessage = `Your rental application for ${propertyName} has been declined.`;
        notificationUrl = '/tenants/applications';
      } else {
        notificationTitle = 'Application Declined';
        notificationMessage = `Your application for ${propertyName} has been declined.`;
        notificationUrl = '/buyers/applications';
      }

      // Create notification for the applicant
      await createNotification({
        userId: updatedApplication.senderId,
        type: 'application',
        title: notificationTitle,
        message: notificationMessage,
        relatedId: updatedApplication._id.toString(),
        relatedUrl: notificationUrl,
        priority: 'medium',
      });
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