// src/lib/models/Payment.js
import mongoose , {Schema} from 'mongoose';
import { PaymentStatusEnum } from './Enums.js';

const PaymentSchema : Schema = new mongoose.Schema({
  amountDue: {
    type: Number,
    required: [true, 'Amount due is required.'],
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  dueDate: {
    type: Date, // Mongoose will parse the ISO string date
    required: [true, 'Due date is required.'],
  },
  paymentDate: { 
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: PaymentStatusEnum, 
    required: [true, 'Payment status is required.'],
    default: 'Pending', 
  },
  leaseId: {
    type: Number,
    index: true,
  },

}, {
  timestamps: true, 
});

PaymentSchema.index({ leaseId: 1, dueDate: 1 });
PaymentSchema.index({ paymentStatus: 1 });

const Payment =  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
export default Payment;