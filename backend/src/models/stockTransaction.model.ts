import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const StockTransactionValidationSchema = z.object({
  product: zodObjectId,
  qtyChange: z.number().int(), // Positive for additions, negative for subtractions
  type: z.enum(['reservation', 'return', 'manual_adjust', 'maintenance']),
  refId: zodObjectId.optional(), // e.g., Order ID or MaintenanceBlock ID
  notes: z.string().optional(),
});

// TYPESCRIPT TYPE
export type IStockTransaction = z.infer<typeof StockTransactionValidationSchema>;
export type StockTransactionDocument = IStockTransaction & Document;

// MONGOOSE SCHEMA
const stockTransactionMongooseSchema = new Schema<StockTransactionDocument>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  qtyChange: { type: Number, required: true },
  type: { type: String, enum: ['reservation', 'return', 'manual_adjust', 'maintenance'], required: true },
  refId: { type: Schema.Types.ObjectId },
  notes: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

// MODEL
export const StockTransaction = models.StockTransaction || model<StockTransactionDocument>('StockTransaction', stockTransactionMongooseSchema);