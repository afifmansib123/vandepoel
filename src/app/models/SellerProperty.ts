import mongoose , {Schema} from 'mongoose';

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
    required: [true, 'Description is required.'],
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required.'],
  },
  propertyType: {
    type: String,
    required: [true, 'Property type is required.'],
  },
  propertyStatus: {
    type: String,
    default: 'For Sale',
    required: true,
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
    type: String, // Optional
  },
  locationId: {
    type: Number,
    required: true,
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
  propertyFor : {
    type: String,
    default: 'Sale',
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

SellerPropertySchema.index({ propertyType: 1, salePrice: 1, propertyStatus: 1 });
SellerPropertySchema.index({ sellerCognitoId: 1, propertyStatus: 1 });

export default mongoose.models.SellerProperty || mongoose.model('SellerProperty', SellerPropertySchema);