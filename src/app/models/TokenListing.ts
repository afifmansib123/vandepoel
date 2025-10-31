import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITokenListing extends Document {
  // Seller Info
  sellerId: string; // Cognito ID of the token owner
  sellerName: string;
  sellerEmail: string;

  // Token Investment Reference
  tokenInvestmentId: mongoose.Types.ObjectId; // Reference to TokenInvestment
  propertyId: mongoose.Types.ObjectId; // Reference to SellerProperty
  tokenOfferingId: mongoose.Types.ObjectId; // Reference to PropertyToken

  // Listing Details
  tokensForSale: number; // Number of tokens being sold
  pricePerToken: number; // Custom price set by seller
  totalPrice: number; // tokensForSale * pricePerToken
  currency: 'EUR' | 'THB';

  // Property & Token Info (denormalized for quick access)
  propertyName?: string;
  tokenName: string;
  tokenSymbol: string;
  propertyType?: string;
  riskLevel?: 'low' | 'medium' | 'high';

  // Listing Status
  status: 'active' | 'sold' | 'cancelled' | 'expired';

  // Timestamps
  listedAt: Date;
  expiresAt?: Date; // Optional expiration date
  soldAt?: Date;
  cancelledAt?: Date;

  // Buyer Info (when sold)
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;

  // Additional Info
  description?: string; // Optional message from seller
  tags?: string[]; // e.g., ['urgent', 'discount']

  createdAt: Date;
  updatedAt: Date;
}

const TokenListingSchema = new Schema<ITokenListing>(
  {
    // Seller Info
    sellerId: {
      type: String,
      required: true,
      index: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerEmail: {
      type: String,
      required: true,
    },

    // Token Investment Reference
    tokenInvestmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TokenInvestment',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProperty',
      required: true,
      index: true,
    },
    tokenOfferingId: {
      type: Schema.Types.ObjectId,
      ref: 'PropertyToken',
      required: true,
      index: true,
    },

    // Listing Details
    tokensForSale: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerToken: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['EUR', 'THB'],
      required: true,
    },

    // Property & Token Info
    propertyName: String,
    tokenName: {
      type: String,
      required: true,
    },
    tokenSymbol: {
      type: String,
      required: true,
    },
    propertyType: String,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },

    // Listing Status
    status: {
      type: String,
      enum: ['active', 'sold', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },

    // Timestamps
    listedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    soldAt: Date,
    cancelledAt: Date,

    // Buyer Info
    buyerId: String,
    buyerName: String,
    buyerEmail: String,

    // Additional Info
    description: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TokenListingSchema.index({ sellerId: 1, status: 1 });
TokenListingSchema.index({ status: 1, listedAt: -1 }); // For marketplace listing
TokenListingSchema.index({ tokenOfferingId: 1, status: 1 });
TokenListingSchema.index({ createdAt: -1 });

// Pre-save hook to calculate total price
TokenListingSchema.pre('save', function (next) {
  this.totalPrice = this.tokensForSale * this.pricePerToken;
  next();
});

const TokenListing: Model<ITokenListing> =
  mongoose.models.TokenListing ||
  mongoose.model<ITokenListing>('TokenListing', TokenListingSchema);

export default TokenListing;
