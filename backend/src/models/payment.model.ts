import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const PaymentValidationSchema = z.object({
  order: zodObjectId,
  invoice: zodObjectId.optional(),
  amount: z.number().positive(),
  method: z.enum(['stripe', 'paypal', 'cash', 'bank_transfer']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  transactionId: z.string().optional(),
  currency: z.string().default('USD'),
  metadata: z.record(z.any()).optional(),
});

// TYPESCRIPT TYPE
export type IPayment = z.infer<typeof PaymentValidationSchema>;
export type PaymentDocument = IPayment & Document;
// MONGOOSE SCHEMA
const paymentMongooseSchema = new Schema<PaymentDocument>({
// @ts-ignore
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['stripe', 'paypal', 'cash', 'bank_transfer'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], required: true },
  transactionId: { type: String },
  currency: { type: String, required: true, default: 'USD' },
  metadata: { type: Schema.Types.Mixed }, // e.g., stripe paymentIntentId
}, { timestamps: true });

// MODEL
export const Payment = models.Payment || model<PaymentDocument>('Payment', paymentMongooseSchema);