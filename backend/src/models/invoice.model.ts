import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';
import { IOrderItem, OrderItemValidationSchema } from './shared/orderItem.schema';

// ZOD SCHEMA
export const InvoiceValidationSchema = z.object({
  order: zodObjectId, // Can also be an array: z.array(zodObjectId)
  invoiceNumber: z.string(),
  amount: z.number().min(0),
  tax: z.number().min(0),
  paid: z.number().min(0).default(0),
  dueAmount: z.number().min(0),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  pdfUrl: z.string().url().optional(),
  issuedAt: z.date(),
  dueDate: z.date(),
  lineItems: z.array(OrderItemValidationSchema),
  notes: z.string().optional(),
  payments: z.array(zodObjectId).optional(),
});

// TYPESCRIPT TYPE
export type IInvoice = z.infer<typeof InvoiceValidationSchema>;
export type InvoiceDocument = IInvoice & Document;

// MONGOOSE SCHEMA
const invoiceMongooseSchema = new Schema<InvoiceDocument>({
  //@ts-ignore
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  tax: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], required: true },
  pdfUrl: { type: String },
  issuedAt: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  lineItems: [{
    // Mirrors order items structure
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number },
    // ...etc
  }],
  notes: { type: String },
  payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
}, { timestamps: true });

// MODEL
export const Invoice = models.Invoice || model<InvoiceDocument>('Invoice', invoiceMongooseSchema);