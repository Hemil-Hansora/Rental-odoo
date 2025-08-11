import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';
import { OrderItemValidationSchema, IOrderItem } from './shared/orderItem.schema';

// ZOD SCHEMA
export const QuotationValidationSchema = z.object({
  createdBy: zodObjectId,
  createdByStaff: zodObjectId.optional(),
  items: z.array(OrderItemValidationSchema),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']).default('draft'),
  expiresAt: z.date().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string().url()).optional(), // Assuming file refs are URLs
});

// TYPESCRIPT TYPE
export type IQuotation = z.infer<typeof QuotationValidationSchema>;
export type QuotationDocument = IQuotation & Document;

// MONGOOSE SCHEMA
const quotationMongooseSchema = new Schema<QuotationDocument>({
//    @ts-ignore
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdByStaff: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    unit: { type: String, enum: ['hour', 'day', 'week'], required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'approved', 'rejected'], default: 'draft' },
  expiresAt: { type: Date },
  notes: { type: String },
  attachments: [{ type: String }],
}, { timestamps: true });

// MODEL
export const Quotation = models.Quotation || model<QuotationDocument>('Quotation', quotationMongooseSchema);