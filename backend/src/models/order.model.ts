import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';
import { OrderItemValidationSchema, IOrderItem } from './shared/orderItem.schema';

// ZOD SCHEMA
const LocationActionSchema = z.object({
  location: z.string().optional(),
  scheduledAt: z.date(),
  actualAt: z.date().optional(),
  handledBy: zodObjectId.optional(),
});

const ReturnDetailsSchema = LocationActionSchema.extend({
  conditionReport: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

const DeliverySchema = z.object({
  method: z.enum(['pickup', 'delivery']),
  address: z.string().optional(), // Required if method is 'delivery'
  driver: z.string().optional(),
  trackingNo: z.string().optional(),
});

const CancellationSchema = z.object({
  by: zodObjectId,
  at: z.date(),
  reason: z.string(),
  refundAmount: z.number().min(0),
});

export const OrderValidationSchema = z.object({
  customer: zodObjectId,
  quotation: zodObjectId.optional(),
  items: z.array(OrderItemValidationSchema),
  total: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0).default(0),
  depositPercent: z.number().min(0).max(100).optional(),
  depositAmount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  balanceDue: z.number().min(0),
  status: z.enum(['reserved', 'ready_for_pickup', 'picked_up', 'in_use', 'returned', 'completed', 'cancelled', 'overdue']),
  pickup: LocationActionSchema,
  return: ReturnDetailsSchema,
  delivery: DeliverySchema,
  lateFees: z.number().min(0).default(0),
  cancellation: CancellationSchema.optional(),
});

// TYPESCRIPT TYPE
export type IOrder = z.infer<typeof OrderValidationSchema>;
export type OrderDocument = IOrder & Document;

// MONGOOSE SCHEMA
// Note: Use DB transactions when creating an Order and its associated Reservations.
const orderMongooseSchema = new Schema<OrderDocument>({
    //@ts-ignore
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quotation: { type: Schema.Types.ObjectId, ref: 'Quotation' },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    unit: { type: String, enum: ['hour', 'day', 'week'], required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  }],
  total: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  depositPercent: { type: Number },
  depositAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, required: true },
  status: { type: String, enum: ['reserved', 'ready_for_pickup', 'picked_up', 'in_use', 'returned', 'completed', 'cancelled', 'overdue'], required: true, index: true },
  pickup: {
    location: { type: String },
    scheduledAt: { type: Date, required: true },
    actualAt: { type: Date },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  return: {
    location: { type: String },
    scheduledAt: { type: Date, required: true },
    actualAt: { type: Date },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    conditionReport: { type: String },
    images: [{ type: String }],
  },
  delivery: {
    method: { type: String, enum: ['pickup', 'delivery'], required: true },
    address: { type: String },
    driver: { type: String },
    trackingNo: { type: String },
  },
  lateFees: { type: Number, default: 0 },
  cancellation: {
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date },
    reason: { type: String },
    refundAmount: { type: Number },
  },
}, { timestamps: true });

// MODEL
export const Order = models.Order || model<OrderDocument>('Order', orderMongooseSchema);