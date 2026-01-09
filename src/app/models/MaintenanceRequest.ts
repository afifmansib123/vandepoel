import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMaintenanceRequest extends Document {
  propertyId: mongoose.Schema.Types.ObjectId;
  tenantId?: string;  // Made optional
  managerId?: string; // Made optional
  landlordId?: string; // Added landlord support
  category: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  imageUrls?: string[]; // Added support for multiple images
}

const MaintenanceRequestSchema: Schema = new Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProperty', required: true },
  tenantId: { type: String, required: false }, // Changed to optional
  managerId: { type: String, required: false }, // Changed to optional
  landlordId: { type: String, required: false }, // Added for landlord support
  category: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  imageUrls: { type: [String], required: false, default: [] }, // Added support for multiple images
}, { timestamps: true });

// Add validation to ensure at least one user ID is provided
MaintenanceRequestSchema.pre('save', function(next) {
  if (!this.tenantId && !this.managerId && !this.landlordId) {
    const error = new Error('At least one of tenantId, managerId, or landlordId must be provided');
    return next(error);
  }
  next();
});

const MaintenanceRequest: Model<IMaintenanceRequest> = mongoose.models.MaintenanceRequest || mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);

export default MaintenanceRequest;