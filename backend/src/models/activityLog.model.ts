import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const ActivityLogValidationSchema = z.object({
  entityType: z.string(), // e.g., 'Order', 'Product'
  entityId: zodObjectId,
  action: z.string(), // e.g., 'CREATE', 'UPDATE_STATUS'
  by: zodObjectId,
  details: z.record(z.any()).optional(), // e.g., { from: 'pending', to: 'completed' }
});

// TYPESCRIPT TYPE
export type IActivityLog = z.infer<typeof ActivityLogValidationSchema>;
export type ActivityLogDocument = IActivityLog & Document;

// MONGOOSE SCHEMA
const activityLogMongooseSchema = new Schema<ActivityLogDocument>({
  entityType: { type: String, required: true },
  // @ts-ignore
  entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  // @ts-ignore
  by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } }); // Only createdAt is needed

// MODEL
export const ActivityLog = models.ActivityLog || model<ActivityLogDocument>('ActivityLog', activityLogMongooseSchema);