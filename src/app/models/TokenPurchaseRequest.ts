import mongoose, { Schema, Document, Model } from 'mongoose';

// Token Purchase Request - Application-based token buying
export interface ITokenPurchaseRequest extends Document {
  // Request Info
  requestId: number;
  tokenOfferingId: mongoose.Types.ObjectId; // Reference to PropertyToken
  propertyId: mongoose.Types.ObjectId; // Reference to SellerProperty

  // Buyer Info
  buyerId: string; // Buyer's cognitoId
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerAddress?: string;

  // Seller Info
  sellerId: string; // Property owner's cognitoId
  sellerName: string;
  sellerEmail: string;

  // Token Purchase Details
  tokensRequested: number;
  pricePerToken: number;
  totalAmount: number;
  currency: 'EUR' | 'THB';

  // Request Details
  message?: string; // Buyer's message to seller
  proposedPaymentMethod: string; // How buyer wants to pay
  investmentPurpose?: string; // Why they want to invest

  // Status & Workflow
  status: 'pending' | 'approved' | 'rejected' | 'payment_pending' | 'payment_confirmed' | 'tokens_assigned' | 'completed' | 'cancelled';

  // Approval/Rejection
  reviewedAt?: Date;
  reviewedBy?: string; // Who reviewed it
  rejectionReason?: string;

  // Payment Tracking
  paymentMethod?: string; // Actual payment method used
  paymentProof?: string; // URL to payment proof document
  paymentConfirmedAt?: Date;
  paymentConfirmedBy?: string; // Seller who confirmed payment
  paymentTransactionId?: string;

  // Token Assignment
  tokensAssigned: number; // Actual tokens assigned (might differ from requested)
  tokensAssignedAt?: Date;

  // Smart Contract/Agreement
  agreementDocumentUrl?: string; // URL to signed agreement
  agreementSignedByBuyer: boolean;
  agreementSignedBySeller: boolean;
  agreementSignedAt?: Date;

  // Notifications
  buyerNotified: boolean;
  sellerNotified: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const TokenPurchaseRequestSchema = new Schema<ITokenPurchaseRequest>(
  {
    requestId: {
      type: Number,
      unique: true,
      required: true,
    },
    tokenOfferingId: {
      type: Schema.Types.ObjectId,
      ref: 'PropertyToken',
      required: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProperty',
      required: true,
    },

    // Buyer Info
    buyerId: {
      type: String,
      required: true,
      index: true,
    },
    buyerName: {
      type: String,
      required: true,
    },
    buyerEmail: {
      type: String,
      required: true,
    },
    buyerPhone: String,
    buyerAddress: String,

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

    // Token Purchase Details
    tokensRequested: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerToken: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['EUR', 'THB'],
      required: true,
    },

    // Request Details
    message: String,
    proposedPaymentMethod: {
      type: String,
      required: true,
    },
    investmentPurpose: String,

    // Status
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'payment_pending',
        'payment_confirmed',
        'tokens_assigned',
        'completed',
        'cancelled'
      ],
      default: 'pending',
      index: true,
    },

    // Approval/Rejection
    reviewedAt: Date,
    reviewedBy: String,
    rejectionReason: String,

    // Payment Tracking
    paymentMethod: String,
    paymentProof: String,
    paymentConfirmedAt: Date,
    paymentConfirmedBy: String,
    paymentTransactionId: String,

    // Token Assignment
    tokensAssigned: {
      type: Number,
      default: 0,
    },
    tokensAssignedAt: Date,

    // Smart Contract/Agreement
    agreementDocumentUrl: String,
    agreementSignedByBuyer: {
      type: Boolean,
      default: false,
    },
    agreementSignedBySeller: {
      type: Boolean,
      default: false,
    },
    agreementSignedAt: Date,

    // Notifications
    buyerNotified: {
      type: Boolean,
      default: false,
    },
    sellerNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-increment requestId
TokenPurchaseRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const lastRequest = await (this.constructor as Model<ITokenPurchaseRequest>)
        .findOne()
        .sort({ requestId: -1 })
        .exec();
      this.requestId = lastRequest ? lastRequest.requestId + 1 : 1;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Indexes for better query performance
TokenPurchaseRequestSchema.index({ buyerId: 1, status: 1 });
TokenPurchaseRequestSchema.index({ sellerId: 1, status: 1 });
TokenPurchaseRequestSchema.index({ tokenOfferingId: 1 });
TokenPurchaseRequestSchema.index({ createdAt: -1 });

const TokenPurchaseRequest =
  (mongoose.models.TokenPurchaseRequest as Model<ITokenPurchaseRequest>) ||
  mongoose.model<ITokenPurchaseRequest>('TokenPurchaseRequest', TokenPurchaseRequestSchema);

export default TokenPurchaseRequest;
