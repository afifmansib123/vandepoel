// src/lib/models/Tenant.js
import mongoose , {Schema} from 'mongoose'; 

const BuyerSchema : Schema = new mongoose.Schema({
  id: {
    type: Number,
    index: true, // Good if you query by this numeric id
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
  properties: {
    type: [Number], // Expects an array of Property IDs (numeric)
    default: [],
  },
  favorites: {
    type: [Number],
    default: [],
  }, 
}, {
  timestamps: true,
});

const Buyer = mongoose.models.Buyer || mongoose.model('Buyer', BuyerSchema);
export default Buyer;