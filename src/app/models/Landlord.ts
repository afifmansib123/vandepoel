// src/lib/models/Manager.js
import mongoose , {Schema} from 'mongoose';

const LandlordSchema : Schema = new mongoose.Schema({
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
    required: [false, 'Phone number is not required.'],
  },
  companyName: {
    type: String,
    required: [false, 'Company name is not required.'],
  },
  address: {
    type: String,
    required: [false, 'Address is not required.'],
  },
  description: {
    type: String,
    required: [false, 'Description is not required.'],
  },
  businessLicense: {
    type: String,
    required: [false, 'Business license is not required.'],
  },
  profileImage: {
    type: String,
    required: [false, 'Profile image is not required.'],
  },
  status: {
    type: String,
    required: [false, 'Status is required.'],
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending', // Default value
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const Landlord = mongoose.models.Landlord || mongoose.model('Landlord', LandlordSchema);
export default Landlord;