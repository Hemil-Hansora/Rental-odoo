import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const NotificationValidationSchema = z.object({
 type: z.enum([
    'reminder',
    'overdue',
    'pickup_soon',
    'order_status_update',
    'order_cancelled',
    'new_quotation',
    'quotation_status_update',
    'quotation_cancelled_by_customer',
    "order_overdue"
  ]),
  recipient: zodObjectId,
  channel: z.enum(['email', 'push', 'in-app']),
  payload: z.record(z.any()),
  scheduledAt: z.date(),
  sentAt: z.date().optional(),
  status: z.enum(['scheduled', 'sent', 'failed']).default('scheduled'),
});

// TYPESCRIPT TYPE
export type INotification = z.infer<typeof NotificationValidationSchema>;
export type NotificationDocument = INotification & Document;

// MONGOOSE SCHEMA
const notificationMongooseSchema = new Schema<NotificationDocument>({
  type: { 
  type: String, 
  enum: ['reminder', 'overdue', 'pickup_soon', 'order_status_update', 'order_cancelled' , 'new_quotation',
    'quotation_status_update',
    'quotation_cancelled_by_customer', "order_overdue"], 
  required: true 
},
  // @ts-ignore
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, enum: ['email', 'push', 'in-app'], required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  scheduledAt: { type: Date, required: true },
  sentAt: { type: Date },
  status: { type: String, enum: ['scheduled', 'sent', 'failed'], default: 'scheduled' },
}, { timestamps: true });

// MODEL
export const Notification = models.Notification || model<NotificationDocument>('Notification', notificationMongooseSchema);