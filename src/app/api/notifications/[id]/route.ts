import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Notification from '@/app/models/Notification';
import { getUserFromToken } from '@/lib/auth';

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await context.params;

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json({
        success: false,
        message: 'Notification not found',
      }, { status: 404 });
    }

    // Verify notification belongs to user
    if (notification.userId !== user.userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - notification belongs to another user',
      }, { status: 403 });
    }

    notification.isRead = true;
    await notification.save();

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error('PATCH /api/notifications/[id] error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error updating notification',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Delete specific notification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json({
        success: false,
        message: 'Notification not found',
      }, { status: 404 });
    }

    // Verify notification belongs to user
    if (notification.userId !== user.userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - notification belongs to another user',
      }, { status: 403 });
    }

    await Notification.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    console.error('DELETE /api/notifications/[id] error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    }, { status: 500 });
  }
}
