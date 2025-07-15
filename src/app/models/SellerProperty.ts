// FILE: /app/models/SellerProperty.js 
// STATUS: UPDATE EXISTING FILE

import mongoose , {Schema} from 'mongoose';

// NEW: Add this schema for individual rooms
const IndividualRoomSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  }
}, { _id: false });

// UPDATED: Enhanced FeatureDetailSchema with individual room support
const FeatureDetailSchema = new mongoose.Schema({
  count: { 
    type: Number,
  },
  description: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  },
  // ADD THIS: Individual room details (optional for backwards compatibility)
  individual: {
    type: Map,
    of: IndividualRoomSchema,
    default: {},
    required: false  // Makes it optional - existing data won't break
  }
}, { _id: false });

// UNCHANGED: Keep your exact same SellerPropertySchema
const SellerPropertySchema : Schema = new mongoose.Schema({
  id: {
    type: Number,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Property name is required.'],
  },
  description: {
    type: String,
    required: [false, 'Description is required.'],
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required.'],
  },
  propertyType: {
    type: String,
    required: [false, 'Property type is required.'],
  },
  propertyStatus: {
    type: String,
    default: 'For Sale',
    required: false,
  },
   features: {
    type: Map,
    of: FeatureDetailSchema, // Now supports individual rooms
    default: {},
  },
  squareFeet: {
    type: Number,
    required: [false, 'Square footage is required.'],
  },
  yearBuilt: {
    type: Number,
  },
  HOAFees: {
    type: Number,
  },
  photoUrls: {
    type: [String],
    default: [],
  },
  agreementDocumentUrl: {
    type: String,
  },
  amenities: {
    type: [String],
    default: [],
  },
  highlights: {
    type: [String],
    default: [],
  },
  openHouseDates: {
    type: [String],
    default: [],
  },
  sellerNotes: {
    type: String,
  },
  allowBuyerApplications: {
    type: Boolean,
    default: true,
  },
  buyerInquiries: [{
    buyerCognitoId: { type: String }, 
    message: String,
    inquiredAt: { type: Date, default: Date.now },
  }],
  preferredFinancingInfo: {
    type: String,
  },
  insuranceRecommendation: {
    type: String,
  },
  locationId: {
    type: Number,
    required: false,
    index: true,
  },
  sellerCognitoId: {
    type: String,
    required: true,
    index: true,
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  managedBy : {
    type: String,
    required: true,
  },
  propertyFor : {
    type: String,
    default: 'Sale',
  }
}, {
  timestamps: true,
});

SellerPropertySchema.index({ propertyType: 1, salePrice: 1, propertyStatus: 1 });
SellerPropertySchema.index({ sellerCognitoId: 1, propertyStatus: 1 });

export default mongoose.models.SellerProperty || mongoose.model('SellerProperty', SellerPropertySchema);