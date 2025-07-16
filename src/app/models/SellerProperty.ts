// FILE: /app/models/SellerProperty.js 
// STATUS: UPDATED WITH INDIVIDUAL ROOM SUPPORT

import mongoose, { Schema } from 'mongoose';

// NEW: Schema for individual rooms with descriptions and images
const IndividualRoomSchema = new mongoose.Schema({
  description: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr :any) {
        return arr.every((url:any)  => typeof url === 'string' && url.length > 0);
      },
      message: 'All image URLs must be valid strings'
    }
  }
}, { _id: false });

// UPDATED: Enhanced FeatureDetailSchema with individual room support
const FeatureDetailSchema = new mongoose.Schema({
  count: { 
    type: Number,
    min: [0, 'Count cannot be negative'],
    default: 0
  },
  description: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr : any) {
        return arr.every((url: any) => typeof url === 'string' && url.length > 0);
      },
      message: 'All image URLs must be valid strings'
    }
  },
  // NEW: Individual room details (Map allows dynamic keys like "0", "1", "2" etc.)
  individual: {
    type: Map,
    of: IndividualRoomSchema,
    default: new Map(),
    required: false  // Optional for backwards compatibility
  }
}, { _id: false });

// MAIN: SellerPropertySchema with enhanced features support
const SellerPropertySchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Property name is required.'],
    trim: true,
    minlength: [5, 'Property name must be at least 5 characters long.']
  },
  description: {
    type: String,
    required: [false, 'Description is optional.'],
    trim: true,
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required.'],
    min: [0, 'Sale price cannot be negative']
  },
  propertyType: {
    type: String,
    required: [false, 'Property type is optional.'],
    trim: true,
  },
  propertyStatus: {
    type: String,
    default: 'For Sale',
    enum: ['For Sale', 'For Rent', 'Sold', 'Rented', 'Off Market'],
    required: false,
  },
  // ENHANCED: Features now support individual rooms
  features: {
    type: Map,
    of: FeatureDetailSchema,
    default: new Map(),
  },
  squareFeet: {
    type: Number,
    required: [false, 'Square footage is optional.'],
    min: [0, 'Square footage cannot be negative']
  },
  yearBuilt: {
    type: Number,
    min: [0, 'Year built seems too old'],
    max: [new Date().getFullYear() + 2, 'Year built cannot be in the future']
  },
  HOAFees: {
    type: Number,
    min: [0, 'HOA fees cannot be negative']
  },
  photoUrls: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr : any) {
        return arr.length > 0;
      },
      message: 'At least one photo is required'
    }
  },
  agreementDocumentUrl: {
    type: String,
    trim: true,
  },
  amenities: {
    type: [String],
    default: [],
  },
  highlights: {
    type: [String],
    default: [],
  },
  // FIXED: openHouseDates should handle both string and array inputs
  openHouseDates: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr : any) {
        return Array.isArray(arr);
      },
      message: 'Open house dates must be an array'
    }
  },
  sellerNotes: {
    type: String,
    trim: true,
  },
  allowBuyerApplications: {
    type: Boolean,
    default: true,
  },
  buyerInquiries: [{
    buyerCognitoId: { 
      type: String,
      required: true
    }, 
    message: {
      type: String,
      required: true,
      trim: true
    },
    inquiredAt: { 
      type: Date, 
      default: Date.now 
    },
  }],
  preferredFinancingInfo: {
    type: String,
    trim: true,
  },
  insuranceRecommendation: {
    type: String,
    trim: true,
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
    trim: true,
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  managedBy: {
    type: String,
    required: true,
    trim: true,
  },
  propertyFor: {
    type: String,
    default: 'Sale',
    enum: ['Sale', 'Rent', 'Both'],
  }
}, {
  timestamps: true,
  // This helps with JSON serialization of Maps
  toJSON: { 
    transform: function(doc, ret) {
      // Convert Maps to Objects for JSON serialization
      if (ret.features && ret.features instanceof Map) {
        ret.features = Object.fromEntries(ret.features);
      }
      return ret;
    }
  },
  toObject: { 
    transform: function(doc, ret) {
      // Convert Maps to Objects 
      if (ret.features && ret.features instanceof Map) {
        ret.features = Object.fromEntries(ret.features);
      }
      return ret;
    }
  }
});

// Indexes for better query performance
SellerPropertySchema.index({ propertyType: 1, salePrice: 1, propertyStatus: 1 });
SellerPropertySchema.index({ sellerCognitoId: 1, propertyStatus: 1 });
SellerPropertySchema.index({ managedBy: 1 });
SellerPropertySchema.index({ locationId: 1 });

// Pre-save middleware to handle data validation
SellerPropertySchema.pre('save', function(next) {
  // Ensure features individual rooms have valid structure
  if (this.features) {
    for (let [featureKey, featureValue] of this.features) {
      if (featureValue.individual) {
        // Validate that individual room indices are reasonable
        for (let [roomIndex, roomData] of featureValue.individual) {
          if (isNaN(parseInt(roomIndex))) {
            return next(new Error(`Invalid room index: ${roomIndex} for feature: ${featureKey}`));
          }
        }
      }
    }
  }
  next();
});

export default mongoose.models.SellerProperty || mongoose.model('SellerProperty', SellerPropertySchema);