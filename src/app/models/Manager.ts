import mongoose, { Schema } from 'mongoose';

const ManagerSchema: Schema = new mongoose.Schema({
  // --- No changes to these fields ---
  id: {
    type: Number,
    index: true,
  },
  cognitoId: {
    type: String,
    unique: true,
    required: [true, 'Cognito ID is required.'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
  },
  phoneNumber: {
    type: String,
    // Note: If your form sends empty strings, `required: false` is fine.
    // If it might send `null` or `undefined`, you can remove `required` entirely.
  },
  properties: {
    type: [Number],
    default: [],
  },
  applications: {
    type: [Number],
    default: [],
  },

  // --- ADD THESE NEW FIELDS (Copied from Landlord) ---
  companyName: {
    type: String,
  },
  address: {
    type: String,
  },
  description: {
    type: String,
  },
  businessLicense: {
    type: String, // Storing URL or Base64 string
  },
  profileImage: {
    type: String, // Storing URL or Base64 string
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
  },
  // 'agency' field from original Manager model removed as it seems replaced by companyName
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
});

const Manager = mongoose.models.Manager || mongoose.model('Manager', ManagerSchema);
export default Manager;