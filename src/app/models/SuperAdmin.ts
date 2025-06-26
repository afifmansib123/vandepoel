import mongoose, { Schema } from 'mongoose';

const SuperAdminSchema: Schema = new mongoose.Schema({
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
  // You can add other admin-specific fields here later if needed
}, {
  timestamps: true,
});

const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);
export default SuperAdmin;