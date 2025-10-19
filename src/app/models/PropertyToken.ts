import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyToken extends Document {
  propertyId: mongoose.Schema.Types.ObjectId;
  tokenName: string;
  tokenSymbol: string;
  totalTokens: number;
  tokenPrice: number;
  tokensSold: number;
  tokensAvailable: number;
  minPurchase: number;
  maxPurchase?: number;
  propertyValue: number;
  expectedReturn: string;
  dividendFrequency: string;
  offeringStartDate: Date;
  offeringEndDate: Date;
  status: 'draft' | 'active' | 'funded' | 'closed' | 'cancelled';
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  propertyType: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyTokenSchema: Schema = new Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerProperty',
    required: true,
    unique: true
  },
  tokenName: {
    type: String,
    required: true,
    trim: true
  },
  tokenSymbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  totalTokens: {
    type: Number,
    required: true,
    min: 1
  },
  tokenPrice: {
    type: Number,
    required: true,
    min: 0
  },
  tokensSold: {
    type: Number,
    default: 0,
    min: 0
  },
  tokensAvailable: {
    type: Number,
    required: true
  },
  minPurchase: {
    type: Number,
    required: true,
    min: 1
  },
  maxPurchase: {
    type: Number,
    min: 1
  },
  propertyValue: {
    type: Number,
    required: true,
    min: 0
  },
  expectedReturn: {
    type: String,
    required: true
  },
  dividendFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Bi-annually', 'Annually'],
    default: 'Quarterly'
  },
  offeringStartDate: {
    type: Date,
    required: true
  },
  offeringEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'funded', 'closed', 'cancelled'],
    default: 'draft'
  },
  description: {
    type: String,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  propertyType: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

PropertyTokenSchema.pre('save', function(next) {
  this.tokensAvailable = this.totalTokens - this.tokensSold;
  next();
});

const PropertyToken = mongoose.models.PropertyToken || 
  mongoose.model<IPropertyToken>('PropertyToken', PropertyTokenSchema);

export default PropertyToken;