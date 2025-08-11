import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
const PriceOverrideSchema = z.object({
  product: zodObjectId,
  pricePerHour: z.number().positive().optional(),
  pricePerDay: z.number().positive().optional(),
  pricePerWeek: z.number().positive().optional(),
});

export const PricelistValidationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  appliesToCustomers: z.array(zodObjectId).optional(),
  start: z.date().optional(),
  end: z.date().optional(),
  overrides: z.array(PriceOverrideSchema),
  priority: z.number().default(0),
});

// TYPESCRIPT TYPE
export type IPricelist = z.infer<typeof PricelistValidationSchema>;
export type PricelistDocument = IPricelist & Document;

// MONGOOSE SCHEMA
const pricelistMongooseSchema = new Schema<PricelistDocument>({
  name: { type: String, required: true },
  description: { type: String },
  appliesToCustomers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  start: { type: Date },
  end: { type: Date },
  overrides: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    pricePerHour: { type: Number },
    pricePerDay: { type: Number },
    pricePerWeek: { type: Number },
  }],
  priority: { type: Number, default: 0 },
}, { timestamps: true });

// MODEL
export const Pricelist = models.Pricelist || model<PricelistDocument>('Pricelist', pricelistMongooseSchema);