import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyToken extends Document {
  propertyId: mongoose.Schema.Types.ObjectId;
  tokenName: string;
  tokenSymbol: string;
  totalTokens: number;
  tokenPrice: number;
  initialTokenPrice: number; // Starting price when token was created
  annualAppreciationRate: number; // Percentage (e.g., 8 for 8%, 12 for 12%)
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
  getCurrentPrice(): number; // Method to calculate current price based on appreciation
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
  initialTokenPrice: {
    type: Number,
    required: true,
    min: 0
  },
  annualAppreciationRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Max 100% appreciation per year
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

// Calculate current token price based on annual appreciation
PropertyTokenSchema.methods.getCurrentPrice = function(): number {
  if (!this.annualAppreciationRate || this.annualAppreciationRate === 0) {
    return this.tokenPrice;
  }

  const now = new Date();
  const startDate = new Date(this.offeringStartDate);

  // Calculate years elapsed (including fractional years)
  const millisecondsPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsElapsed = (now.getTime() - startDate.getTime()) / millisecondsPerYear;

  // Compound appreciation formula: P = P0 * (1 + r)^t
  // where P0 = initial price, r = rate (as decimal), t = years
  const rate = this.annualAppreciationRate / 100;
  const currentPrice = this.initialTokenPrice * Math.pow(1 + rate, yearsElapsed);

  return Math.round(currentPrice * 100) / 100; // Round to 2 decimal places
};

PropertyTokenSchema.pre('save', function(next) {
  this.tokensAvailable = this.totalTokens - this.tokensSold;

  // Set initialTokenPrice if not already set (for new tokens)
  if (!this.initialTokenPrice) {
    this.initialTokenPrice = this.tokenPrice;
  }

  // Update tokenPrice based on appreciation if applicable
  if (this.annualAppreciationRate && this.annualAppreciationRate > 0) {
    this.tokenPrice = this.getCurrentPrice();
  }

  next();
});

const PropertyToken = mongoose.models.PropertyToken ||
  mongoose.model<IPropertyToken>('PropertyToken', PropertyTokenSchema);

export default PropertyToken;