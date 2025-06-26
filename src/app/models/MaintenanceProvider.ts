import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintenanceProvider extends Document {
  companyName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  servicesOffered: string[];
  serviceArea?: string;
  website?: string;
  status: 'active' | 'inactive';
}

const MaintenanceProviderSchema: Schema = new Schema({
  companyName: { 
    type: String, 
    required: [true, 'Company name is required.'] 
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
    type: [String], 
    default: [] 
  },
  serviceArea: { 
    type: String 
  },
  website: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
}, { 
  timestamps: true 
});

export default mongoose.models.MaintenanceProvider || mongoose.model<IMaintenanceProvider>('MaintenanceProvider', MaintenanceProviderSchema);