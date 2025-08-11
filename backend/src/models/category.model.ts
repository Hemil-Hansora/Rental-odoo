import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types';

// ZOD SCHEMA
export const CategoryValidationSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parentCategory: zodObjectId.optional(),
});

// TYPESCRIPT TYPE
export type ICategory = z.infer<typeof CategoryValidationSchema>;
export type CategoryDocument = ICategory & Document;

// MONGOOSE SCHEMA
const categoryMongooseSchema = new Schema<CategoryDocument>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true });

// MODEL
export const Category = models.Category || model<CategoryDocument>('Category', categoryMongooseSchema);