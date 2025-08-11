import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Zod schema for validating a MongoDB ObjectId.
 */
export const zodObjectId = z.string().refine(
  (val) => Types.ObjectId.isValid(val), 
  { message: "Invalid ObjectId" }
);