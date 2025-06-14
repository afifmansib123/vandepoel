// src/lib/models/Lease.js
import exp from 'constants';
import mongoose , {Schema} from 'mongoose';

const LeaseSchema : Schema = new mongoose.Schema({
  id: {
    type: Number,
    index: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Lease start date is required.'],
  },
  endDate: {
    type: Date,
    required: [true, 'Lease end date is required.'],
  },
  rent: {
    type: Number,
    required: [true, 'Rent amount is required.'],
  },
  deposit: {
    type: Number,
    required: [true, 'Deposit amount is required.'],
  },
  propertyId: {
    type: Number,
    index: true,    // Good if you query leases by propertyId
  },
  tenantCognitoId: {
    type: String,
    index: true,    // Good if you query leases by tenantCognitoId
  },
}, {
  timestamps: true, 
});

// Indexes using the adjusted field names
LeaseSchema.index({ propertyId: 1, tenantCognitoId: 1 }); // For finding leases by property or tenant
LeaseSchema.index({ startDate: 1, endDate: 1 });     // For date-range queries

// Validate that endDate is after startDate
LeaseSchema.path('endDate').validate(function (value) {
  // Ensure startDate is also present and valid for comparison
  if (this.startDate && value) {
    return this.startDate < value;
  }
  return true; // Or false if both must be present for validation
}, 'End date must be after start date.');

const Lease = mongoose.models.Lease || mongoose.model('Lease', LeaseSchema);
export default Lease;