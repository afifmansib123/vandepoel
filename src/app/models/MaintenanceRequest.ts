import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMaintenanceRequest extends Document {
  propertyId: mongoose.Schema.Types.ObjectId;
  tenantId: string;
  managerId: string;
  category: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
}

const MaintenanceRequestSchema: Schema = new Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProperty', required: true },
  tenantId: { type: String, required: true },
  managerId: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
}, { timestamps: true });

const MaintenanceRequest: Model<IMaintenanceRequest> = mongoose.models.MaintenanceRequest || mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);

export default MaintenanceRequest;