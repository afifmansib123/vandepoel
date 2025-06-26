import mongoose, { Schema, Document } from 'mongoose';

export interface IBankingService extends Document {
  bankName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  servicesOffered: string[];
  website?: string;
}

const BankingServiceSchema: Schema = new Schema({
  bankName: { 
    type: String, 
    required: [true, 'Bank name is required.'] 
  },
  contactPerson: { 
    type: String 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required.'], 
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: { 
    type: String 
  },
  servicesOffered: { 
    type: [String], // e.g., ['Mortgage', 'Pre-approval', 'Business Loan']
    default: [] 
  },
  website: { 
    type: String 
  },
}, { 
  timestamps: true 
});

export default mongoose.models.BankingService || mongoose.model<IBankingService>('BankingService', BankingServiceSchema);