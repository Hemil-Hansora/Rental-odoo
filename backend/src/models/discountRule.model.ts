import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const DiscountRuleValidationSchema = z.object({
  code: z.string().toUpperCase(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minSpend: z.number().min(0).optional(),
  appliesToProducts: z.array(zodObjectId).optional(),
  usageLimit: z.number().int().positive().optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  createdBy: zodObjectId,
  timesUsed: z.number().int().min(0).default(0),
});

// TYPESCRIPT TYPE
export type IDiscountRule = z.infer<typeof DiscountRuleValidationSchema>;
export interface DiscountRuleDocument extends Omit<IDiscountRule, 'createdBy' | 'appliesToProducts'>, Document {
  createdBy: Schema.Types.ObjectId;
  appliesToProducts?: Schema.Types.ObjectId[];
}
// MONGOOSE SCHEMA
const discountRuleMongooseSchema = new Schema<DiscountRuleDocument>({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true },
  minSpend: { type: Number },
  appliesToProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  usageLimit: { type: Number },
  validFrom: { type: Date },
  validUntil: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timesUsed: { type: Number, default: 0 },
}, { timestamps: true });

// MODEL
export const DiscountRule = models.DiscountRule || model<DiscountRuleDocument>('DiscountRule', discountRuleMongooseSchema);