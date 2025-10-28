import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Notification from '@/app/models/Notification';
import { getUserFromToken } from '@/lib/auth';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get authenticated user
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = { userId: user.userId };
    if (type) query.type = type;
    if (isRead !== null && isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Fetch notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: user.userId,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        hasMore: notifications.length === limit,
      },
    });
  } catch (error: any) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    }, { status: 500 });
  }
}

// POST /api/notifications - Create notification (admin/system use)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get authenticated user (only system/admin should create notifications)
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, relatedId, relatedUrl, priority, expiresAt } = body;

    // Validation
    if (!userId || !type || !title || !message) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: userId, type, title, message',
      }, { status: 400 });
    }

    // Create notification
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedUrl,
      priority: priority || 'medium',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      data: notification,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error creating notification',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete all read notifications for user
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const result = await Notification.deleteMany({
      userId: user.userId,
      isRead: true,
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error: any) {
    console.error('DELETE /api/notifications error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error deleting notifications',
      error: error.message,
    }, { status: 500 });
  }
}
