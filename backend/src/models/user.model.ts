import { Schema, model, models, Document } from 'mongoose';
import { z } from 'zod';

const UserAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

const UserBillingInfoSchema = z.object({
  company: z.string().optional(),
  taxId: z.string().optional(),
  defaultPaymentMethodId: z.string().optional(),
  stripeCustomerId: z.string().optional(), 
});

const UserPreferencesSchema = z.object({
  notifyByEmail: z.boolean().default(true),
  notifyBySMS: z.boolean().default(false),
});

export const UserValidationSchema = z.object({
  name: z.string({ required_error: 'Name is required' }),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
  passwordHash: z.string({ required_error: 'Password is required' }),
 role: z.enum(['customer', 'end_user']).default('customer'), 
  phone: z.string().optional(),
  address: UserAddressSchema.optional(),
  billingInfo: UserBillingInfoSchema.optional(),
  preferences: UserPreferencesSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export type IUser = z.infer<typeof UserValidationSchema>;
export type UserDocument = IUser & Document;


const userMongooseSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'end_user'], default: 'customer' },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  billingInfo: {
    company: { type: String },
    taxId: { type: String },
    defaultPaymentMethodId: { type: String },
    razorPayCustomerId: { type: String },
  },
  preferences: {
    notifyByEmail: { type: Boolean, default: true },
    notifyBySMS: { type: Boolean, default: false },
  },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });


export const User = models.User || model<UserDocument>('User', userMongooseSchema);