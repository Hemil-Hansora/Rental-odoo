import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';

// ZOD SCHEMA
export const SettingValidationSchema = z.object({
  key: z.string(),
  value: z.any(),
});

// TYPESCRIPT TYPE
export type ISetting = z.infer<typeof SettingValidationSchema>;
export type SettingDocument = ISetting & Document;

// MONGOOSE SCHEMA
const settingMongooseSchema = new Schema<SettingDocument>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { timestamps: { createdAt: false, updatedAt: true } }); // Only updatedAt is needed

// MODEL
export const Setting = models.Setting || model<SettingDocument>('Setting', settingMongooseSchema);