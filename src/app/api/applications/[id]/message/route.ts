import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Application from '@/app/models/Application';
import { createNotification } from '@/lib/notifications';
import SellerProperty from '@/app/models/SellerProperty';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/applications/[id]/message - Add a message to the application
export async function POST(req: NextRequest, { params }: RouteParams) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();
    const { senderId, senderName, message, shareContact } = body;

    if (!senderId || !senderName || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: senderId, senderName, message' },
        { status: 400 }
      );
    }

    const application = await Application.findById(id).populate('propertyId');
    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    // Add the new message
    if (!application.messages) {
      application.messages = [];
    }

    application.messages.push({
      senderId,
      senderName,
      message,
      timestamp: new Date(),
    });

    // Update contact sharing status if requested
    if (shareContact !== undefined) {
      if (senderId === application.senderId) {
        application.senderSharedContact = shareContact;
      } else if (senderId === application.receiverId) {
        application.receiverSharedContact = shareContact;
      }
    }

    // Update status to 'contacted' if it was 'pending'
    if (application.status === 'pending') {
      application.status = 'contacted';
    }

    await application.save();

    // Send notification to the other party
    const recipientId = senderId === application.senderId ? application.receiverId : application.senderId;
    const property = application.propertyId as any;
    const propertyName = property?.name || 'the property';

    // Determine the correct applications URL based on who is receiving the notification
    // The recipient is the one who should see the link to THEIR applications page
    let applicationsUrl = '/tenants/applications'; // Default

    // Check if recipient is the sender (tenant/buyer) or receiver (landlord/manager)
    if (recipientId === application.senderId) {
      // Recipient is the original applicant (tenant or buyer)
      applicationsUrl = '/tenants/applications'; // Could be /buyers/applications too
    } else if (recipientId === application.receiverId) {
      // Recipient is the property owner/manager
      // We need to check if they're a manager or landlord
      // For now, we'll try both common patterns
      applicationsUrl = '/landlords/applications'; // Most common case
    }

    await createNotification({
      userId: recipientId,
      type: 'application',
      title: 'New Message on Application',
      message: `${senderName} sent you a message about ${propertyName}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
      relatedId: application._id.toString(),
      // Remove relatedUrl entirely to prevent incorrect redirects
      // Users can navigate to their applications page themselves
      priority: 'medium',
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: application,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
