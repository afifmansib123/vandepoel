import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: string; // Cognito ID of the user this notification is for
  type: 'application' | 'token_request' | 'payment' | 'maintenance' | 'contract' | 'system';
  title: string;
  message: string;
  relatedId?: string; // ID of related entity (applicationId, tokenRequestId, etc.)
  relatedUrl?: string; // URL to navigate to when clicked
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['application', 'token_request', 'payment', 'maintenance', 'contract', 'system'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    relatedId: {
      type: String,
      index: true,
    },
    relatedUrl: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Auto-delete expired notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
