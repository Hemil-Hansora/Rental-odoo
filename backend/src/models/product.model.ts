import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
const PricingSchema = z.object({
  pricePerHour: z.number().positive().optional(),
  pricePerDay: z.number().positive().optional(),
  pricePerWeek: z.number().positive().optional(),
}).refine(data => data.pricePerHour || data.pricePerDay || data.pricePerWeek, {
  message: 'At least one pricing tier (hour, day, or week) must be provided',
});

const MaintenanceBlockSchema = z.object({
  start: z.date(),
  end: z.date(),
  reason: z.string(),
});

export const ProductValidationSchema = z.object({
  name: z.string(),
  sku: z.string().optional(),
  category: zodObjectId.optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  stock: z.number().int().min(0),
  unit: z.string().default('piece'),
  pricing: PricingSchema,
  taxPercent: z.number().min(0).optional(),
  maintenanceBlocks: z.array(MaintenanceBlockSchema).optional(),
  metadata: z.record(z.any()).optional(),
   createdBy: zodObjectId,
});

// TYPESCRIPT TYPE
export type IProduct = z.infer<typeof ProductValidationSchema>;
export type ProductDocument = IProduct & Document;

// MONGOOSE SCHEMA
const productMongooseSchema = new Schema<ProductDocument>({
  name: { type: String, required: true, index: true },
  sku: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String },
  images: [{ type: String }],
  stock: { type: Number, required: true },
  unit: { type: String, default: 'piece' },
  pricing: {
    pricePerHour: { type: Number },
    pricePerDay: { type: Number },
    pricePerWeek: { type: Number },
  },
  taxPercent: { type: Number },
  maintenanceBlocks: [{
    start: { type: Date },
    end: { type: Date },
    reason: { type: String },
  }],
  metadata: { type: Schema.Types.Mixed },
  //@ts-ignore
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// MODEL
export const Product = models.Product || model<ProductDocument>('Product', productMongooseSchema);