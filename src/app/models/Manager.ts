// src/lib/models/Manager.js
import mongoose , {Schema} from 'mongoose';

const ManagerSchema : Schema = new mongoose.Schema({
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
  description : {
    type: String,
    required: [false, 'Description is not required.'],
  },
  agency : {
    type: String,
    required: [false, 'Agency is not required.'],
  },
  properties : {
    type: [Number], // Expects an array of Property IDs (numeric)
    default: [],
  },
  applications : {
    type: [Number], // Expects an array of Application IDs (numeric)
    default: [],
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  // IMPORTANT: If your MongoDB collection name is not 'managers', specify it:
  // collection: 'manager_profiles'
});

const Manager =  mongoose.models.Manager || mongoose.model('Manager', ManagerSchema);
export default Manager;