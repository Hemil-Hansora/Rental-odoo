import { z } from 'zod';
import { zodObjectId } from '../../lib/zod-types';

export const OrderItemValidationSchema = z.object({
  product: zodObjectId,
  quantity: z.number().int().positive(),
  start: z.date(),
  end: z.date(),
  unit: z.enum(['hour', 'day', 'week']),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});

export type IOrderItem = z.infer<typeof OrderItemValidationSchema>;