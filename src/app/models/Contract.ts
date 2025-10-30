import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IContract extends Document {
  propertyId: string;
  tenantId: string;   // Cognito User ID of the tenant
  managerId: string;  // Cognito User ID of the manager
  landlordId?: string; // Cognito User ID of the landlord (optional if manager is handling)

  // Contract Dates
  startDate: Date;
  endDate: Date;
  duration: '6_months' | '1_year' | 'custom';

  // Financial Terms
  monthlyRent: number;
  securityDeposit: number;
  currency: 'EUR' | 'THB' | 'USD';
  paymentDay: number; // Day of month rent is due (1-31)

  // Commission Terms (for managers)
  managerCommissionRate?: number; // Percentage (e.g., 5.5 for 5.5%)
  managerCommissionAmount?: number; // Fixed amount per month or total
  managerCommissionType?: 'percentage' | 'fixed_monthly' | 'fixed_total'; // How commission is calculated
  managerCommissionPaid?: boolean; // Whether commission has been paid
  managerCommissionPaidAt?: Date; // When commission was paid
  managerCommissionNotes?: string; // Additional notes about commission

  // Contract Terms
  terms: string; // Full contract terms and conditions
  specialConditions?: string; // Any special conditions or clauses

  // Signatures
  tenantSigned: boolean;
  tenantSignedAt?: Date;
  tenantSignature?: string; // Digital signature or confirmation

  managerSigned: boolean;
  managerSignedAt?: Date;
  managerSignature?: string;

  landlordSigned?: boolean;
  landlordSignedAt?: Date;
  landlordSignature?: string;

  // Documents
  contractDocumentUrl?: string; // PDF or document URL

  // Status
  status: 'draft' | 'pending_signatures' | 'active' | 'expired' | 'terminated' | 'cancelled';
  terminationReason?: string;
  terminatedBy?: string;
  terminatedAt?: Date;
}

const ContractSchema: Schema<IContract> = new Schema({
  propertyId: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  managerId: { type: String, required: true, index: true },
  landlordId: { type: String, index: true },

  // Contract Dates
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: String, enum: ['6_months', '1_year', 'custom'], required: true },

  // Financial Terms
  monthlyRent: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['EUR', 'THB', 'USD'], default: 'EUR' },
  paymentDay: { type: Number, required: true, min: 1, max: 31 },

  // Commission Terms (for managers)
  managerCommissionRate: { type: Number, min: 0, max: 100 }, // Percentage
  managerCommissionAmount: { type: Number, min: 0 }, // Fixed amount
  managerCommissionType: { type: String, enum: ['percentage', 'fixed_monthly', 'fixed_total'] },
  managerCommissionPaid: { type: Boolean, default: false },
  managerCommissionPaidAt: { type: Date },
  managerCommissionNotes: { type: String },

  // Contract Terms
  terms: { type: String, required: true },
  specialConditions: { type: String },

  // Signatures
  tenantSigned: { type: Boolean, default: false },
  tenantSignedAt: { type: Date },
  tenantSignature: { type: String },

  managerSigned: { type: Boolean, default: false },
  managerSignedAt: { type: Date },
  managerSignature: { type: String },

  landlordSigned: { type: Boolean, default: false },
  landlordSignedAt: { type: Date },
  landlordSignature: { type: String },

  // Documents
  contractDocumentUrl: { type: String },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_signatures', 'active', 'expired', 'terminated', 'cancelled'],
    default: 'draft',
    index: true
  },
  terminationReason: { type: String },
  terminatedBy: { type: String },
  terminatedAt: { type: Date },
}, { timestamps: true });

const Contract: Model<IContract> = mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;