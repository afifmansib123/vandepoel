import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenInvestment extends Document {
  investorId: string;
  propertyId: mongoose.Schema.Types.ObjectId;
  tokenId: mongoose.Schema.Types.ObjectId;
  tokensOwned: number;
  purchasePrice: number;
  totalInvestment: number;
  ownershipPercentage: number;
  transactionId: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  totalDividendsEarned: number;
  lastDividendDate?: Date;
  status: 'active' | 'sold' | 'transferred';
  purchaseDate: Date;
  investorEmail?: string;
  investorPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TokenInvestmentSchema: Schema = new Schema({
  investorId: {
    type: String,
    required: true,
    index: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerProperty',
    required: true,
    index: true
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyToken',
    required: true,
    index: true
  },
  tokensOwned: {
    type: Number,
    required: true,
    min: 1
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalInvestment: {
    type: Number,
    required: true,
    min: 0
  },
  ownershipPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  totalDividendsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDividendDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'transferred'],
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  investorEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  investorPhone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

TokenInvestmentSchema.index({ investorId: 1, status: 1 });
TokenInvestmentSchema.index({ propertyId: 1, status: 1 });

const TokenInvestment = mongoose.models.TokenInvestment || 
  mongoose.model<ITokenInvestment>('TokenInvestment', TokenInvestmentSchema);

export default TokenInvestment;