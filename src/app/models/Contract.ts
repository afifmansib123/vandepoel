import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IContract extends Document {
  propertyId: string;
  tenantId: string;   // Cognito User ID of the tenant
  managerId: string;  // Cognito User ID of the manager
  duration: '6_months' | '1_year';
  status: 'active' | 'expired' | 'terminated';
}

const ContractSchema: Schema<IContract> = new Schema({
  propertyId: { type: String, required: true },
  tenantId: { type: String, required: true },
  managerId: { type: String, required: true },
  duration: { type: String, enum: ['6_months', '1_year'], required: true },
  status: { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },
}, { timestamps: true });

const Contract: Model<IContract> = mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;