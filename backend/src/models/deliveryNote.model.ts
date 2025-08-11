import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
const ChecklistItemSchema = z.object({
  name: z.string(),
  checked: z.boolean().default(false),
  notes: z.string().optional(),
  signatureUrl: z.string().url().optional(),
});

export const DeliveryNoteValidationSchema = z.object({
  order: zodObjectId,
  type: z.enum(['pickup', 'delivery']),
  scheduledAt: z.date(),
  actualAt: z.date().optional(),
  driver: z.string().optional(),
  vehicle: z.string().optional(),
  checklist: z.array(ChecklistItemSchema).optional(),
  status: z.enum(['scheduled', 'in_transit', 'completed', 'failed']),
});

// TYPESCRIPT TYPE
export type IDeliveryNote = z.infer<typeof DeliveryNoteValidationSchema>;
export type DeliveryNoteDocument = IDeliveryNote & Document;

// MONGOOSE SCHEMA
const deliveryNoteMongooseSchema = new Schema<DeliveryNoteDocument>({
    // @ts-ignore
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  type: { type: String, enum: ['pickup', 'delivery'], required: true },
  scheduledAt: { type: Date, required: true },
  actualAt: { type: Date },
  driver: { type: String },
  vehicle: { type: String },
  checklist: [{
    name: { type: String, required: true },
    checked: { type: Boolean, default: false },
    notes: { type: String },
    signatureUrl: { type: String },
  }],
  status: { type: String, enum: ['scheduled', 'in_transit', 'completed', 'failed'], required: true },
}, { timestamps: true });

// MODEL
export const DeliveryNote = models.DeliveryNote || model<DeliveryNoteDocument>('DeliveryNote', deliveryNoteMongooseSchema);