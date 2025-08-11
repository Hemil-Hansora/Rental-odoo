import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const TimeDependentPriceRuleValidationSchema = z.object({
  name: z.string(),
  type: z.enum(['weekday', 'holiday', 'hours']),
  pattern: z.record(z.any()), // e.g., { weekdays: [6,0] } or { dates: ['2025-12-25'] }
  multiplier: z.number().positive().optional(),
  fixedPrice: z.record(z.number().positive()).optional(), // e.g., { pricePerHour: 15 }
  appliesToProducts: z.array(zodObjectId).optional(), // Empty means all
  stacking: z.boolean().default(false),
  start: z.date().optional(),
  end: z.date().optional(),
  priority: z.number().default(0),
});

// TYPESCRIPT TYPE
export type ITimeDependentPriceRule = z.infer<typeof TimeDependentPriceRuleValidationSchema>;
export type TimeDependentPriceRuleDocument = ITimeDependentPriceRule & Document;

// MONGOOSE SCHEMA
const timeDependentPriceRuleMongooseSchema = new Schema<TimeDependentPriceRuleDocument>({
  name: { type: String, required: true },
  type: { type: String, enum: ['weekday', 'holiday', 'hours'], required: true },
  pattern: { type: Schema.Types.Mixed, required: true },
  multiplier: { type: Number },
  fixedPrice: { type: Schema.Types.Mixed },
  appliesToProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  stacking: { type: Boolean, default: false },
  start: { type: Date },
  end: { type: Date },
  priority: { type: Number, default: 0 },
}, { timestamps: true });

// MODEL
export const TimeDependentPriceRule = models.TimeDependentPriceRule || model<TimeDependentPriceRuleDocument>('TimeDependentPriceRule', timeDependentPriceRuleMongooseSchema);