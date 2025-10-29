import mongoose, { Document, Schema, Model } from "mongoose";

// Interface for the flexible form data object
interface IFormData {
  [key: string]: any;
}

// Interface for our Application document
export interface IApplication extends Document {
  propertyId: mongoose.Schema.Types.ObjectId;
  senderId: string;      // The Cognito ID of the user submitting the form
  receiverId: string;    // The Cognito ID of the user managing the property
  applicationType: 'ScheduleVisit' | 'AgentApplication' | 'FinancialInquiry' | 'RentRequest';
  formData: IFormData;   // Holds the unique data from each form
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  // Contact details for CRM and tracking
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverEmail?: string;
  receiverPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  propertyId: {
    type: String, // Storing as string for flexibility if you use non-ObjectId refs
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  applicationType: {
    type: String,
    enum: ['ScheduleVisit', 'AgentApplication', 'FinancialInquiry', 'RentRequest'],
    required: true,
  },
  formData: {
    type: mongoose.Schema.Types.Mixed, // Allows storing any JSON object
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'contacted'],
    default: 'pending',
  },
  // Contact details for CRM and tracking
  senderName: {
    type: String,
  },
  senderEmail: {
    type: String,
  },
  senderPhone: {
    type: String,
  },
  receiverName: {
    type: String,
  },
  receiverEmail: {
    type: String,
  },
  receiverPhone: {
    type: String,
  },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Prevent model overwrite during hot-reloading
const Application: Model<IApplication> = mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;