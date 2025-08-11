import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const ReservationValidationSchema = z.object({
  order: zodObjectId,
  product: zodObjectId,
  quantity: z.number().int().positive(),
  start: z.date(),
  end: z.date(),
  status: z.enum(['reserved', 'picked_up', 'returned', 'cancelled']),
});

// TYPESCRIPT TYPE
export type IReservation = z.infer<typeof ReservationValidationSchema>;
export type ReservationDocument = IReservation & Document;

// MONGOOSE SCHEMA
const reservationMongooseSchema = new Schema<ReservationDocument>({
    //@ts-ignore
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  //@ts-ignore
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  status: { type: String, enum: ['reserved', 'picked_up', 'returned', 'cancelled'], required: true },
}, { timestamps: true });

// Add compound index for fast availability queries
reservationMongooseSchema.index({ product: 1, start: 1, end: 1 });

// MODEL
export const Reservation = models.Reservation || model<ReservationDocument>('Reservation', reservationMongooseSchema);