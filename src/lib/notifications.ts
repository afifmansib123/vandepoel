import Notification from '@/app/models/Notification';
import dbConnect from '@/utils/dbConnect';

export interface CreateNotificationParams {
  userId: string;
  type: 'application' | 'token_request' | 'payment' | 'maintenance' | 'contract' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  relatedUrl?: string;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

/**
 * Create a notification for a user
 * This is a centralized helper to ensure consistent notification creation
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await dbConnect();

    const notification = await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId,
      relatedUrl: params.relatedUrl,
      priority: params.priority || 'medium',
      expiresAt: params.expiresAt,
      isRead: false,
    });

    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Notification message templates for token purchase requests
 */
export const TokenNotificationMessages = {
  REQUEST_SUBMITTED: (buyerName: string, tokensRequested: number, propertyName: string) => ({
    title: 'New Token Purchase Request',
    message: `${buyerName} has requested to purchase ${tokensRequested} tokens for ${propertyName}`,
  }),

  REQUEST_APPROVED: (propertyName: string) => ({
    title: 'Token Request Approved',
    message: `Your token purchase request for ${propertyName} has been approved. Please submit payment proof.`,
  }),

  REQUEST_REJECTED: (propertyName: string, reason?: string) => ({
    title: 'Token Request Rejected',
    message: `Your token purchase request for ${propertyName} was rejected${reason ? `: ${reason}` : '.'}`,
  }),

  PAYMENT_PROOF_SUBMITTED: (buyerName: string, propertyName: string) => ({
    title: 'Payment Proof Submitted',
    message: `${buyerName} has submitted payment proof for ${propertyName}. Please review and confirm.`,
  }),

  PAYMENT_CONFIRMED: (propertyName: string) => ({
    title: 'Payment Confirmed',
    message: `Your payment for ${propertyName} has been confirmed. Tokens will be assigned shortly.`,
  }),

  TOKENS_ASSIGNED: (tokensAssigned: number, propertyName: string) => ({
    title: 'Tokens Assigned',
    message: `${tokensAssigned} tokens for ${propertyName} have been assigned to your portfolio.`,
  }),

  REQUEST_CANCELLED: (propertyName: string) => ({
    title: 'Token Request Cancelled',
    message: `A token purchase request for ${propertyName} has been cancelled.`,
  }),
};

/**
 * Mark notification(s) as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await dbConnect();
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await dbConnect();
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
}

/**
 * Delete old read notifications (cleanup utility)
 */
export async function deleteOldNotifications(userId: string, daysOld: number = 30) {
  try {
    await dbConnect();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await Notification.deleteMany({
      userId,
      isRead: true,
      createdAt: { $lt: cutoffDate },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    return { success: false, error };
  }
}
