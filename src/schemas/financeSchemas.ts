import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.enum([
    'Feed Cost',
    'Medication',
    'Equipment',
    'Salary',
    'Egg Sales',
    'Bird Sales',
    'Manure Sales',
    'Other'
  ]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  unitPrice: z.coerce.number().positive("Unit price must be greater than 0").optional(),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").optional(),
  unitName: z.string().optional(),
  date: z.string(),
  referenceId: z.string().optional(), // Could be a Batch ID or Invoice Number
  description: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Mobile Money', 'Credit', 'Other']).default('Cash'),
  status: z.enum(['Paid', 'Pending']).default('Paid'),
  // Bird sale specific fields
  birdsSoldBatchId: z.string().optional(),
  birdsSoldCount: z.coerce.number().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;
