// src/lib/models/Application.js
import mongoose , {Schema} from 'mongoose';
import { ApplicationStatusEnum } from './Enums.js'; // Ensure Enums.js is in the same dir or path is correct

const ApplicationSchema : Schema = new mongoose.Schema({
  id: {
    type: Number,
    index: true,
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ApplicationStatusEnum,
    required: [true, 'Application status is required.'],
    default: 'Pending',
  },
  propertyId: { // Corresponds to 'propertyId' in your dummy data (numeric Property ID)
    type: Number,
    index: true,
  },
  tenantorManagerCognitoId: {
    type: String,
    index: true,
  },
  leaseId: { // Corresponds to 'leaseId' in your dummy data (numeric Lease ID, optional)
    type: Number,
    unique: true,
    sparse: true,  
    default: null, 
    index: true,    // Good to index if you look up applications by leaseId
    required: false,
  },
  Applicationtype : {
    type: String,
    enum: ['Tenant App', 'Manager App'],
    required: [true, "Application type is required."],
  },
  name: {
    type: String,
    required: [true, "Applicant's name is required."],
  },
  email: {
    type: String,
    required: [true, "Applicant's email is required."],
  },
  phoneNumber: {
    type: String,
    required: [true, "Applicant's phone number is required."],
  },
  message: {
    type: String, // Optional message
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  // IMPORTANT: If your MongoDB collection name is not 'applications', specify it:
  // collection: 'rental_applications'
});

// Indexes using the adjusted field names
ApplicationSchema.index({ propertyId: 1, tenantCognitoId: 1 });
ApplicationSchema.index({ status: 1 });
// ApplicationSchema.index({ leaseId: 1 }); // Already added with 'index: true' above

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);