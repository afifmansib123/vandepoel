// src/lib/models/Property.js
import mongoose , {Schema} from 'mongoose';
import { HighlightEnum, AmenityEnum, PropertyTypeEnum } from './Enums'; // Assuming Enums.js is in the same directory

const PropertySchema : Schema= new mongoose.Schema({
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
    required: [true, 'Description is required.'],
  },
  pricePerMonth: {
    type: Number,
    required: [true, 'Price per month is required.'],
  },
  securityDeposit: {
    type: Number,
    required: [true, 'Security deposit is required.'],
  },
  applicationFee: {
    type: Number,
    required: [true, 'Application fee is required.'],
  },
  photoUrls: {
    type: [String],
    default: [],
  },
  amenities: {
    type: [{
      type: String,
      enum: AmenityEnum,
    }],
    default: [],
  },
  highlights: {
    type: [{
      type: String,
      enum: HighlightEnum,
    }],
    default: [],
  },
  isPetsAllowed: {
    type: Boolean,
    default: false,
  },
  isParkingIncluded: {
    type: Boolean,
    default: false,
  },
  beds: {
    type: Number,
    required: [true, 'Number of beds is required.'],
  },
  baths: {
    type: Number,
    required: [true, 'Number of baths is required.'],
  },
  squareFeet: {
    type: Number,
    required: [true, 'Square footage is required.'],
  },
  propertyType: {
    type: String,
    enum: PropertyTypeEnum,
    required: [true, 'Property type is required.'],
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  locationId: {
    type: Number, 
    index: true,
  },
  managerCognitoId: {
    type: String,
    index: true,
  },
  landlordCognitoId: { type: String, index: true },
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
  }],
  tenants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
  }],
}, {
  timestamps: true,
});

// Index for common search/filter fields
PropertySchema.index({ propertyType: 1, pricePerMonth: 1, beds: 1, baths: 1 });
const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);
export default Property;