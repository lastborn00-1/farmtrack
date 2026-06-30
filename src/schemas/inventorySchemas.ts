import { z } from 'zod';

export const inventoryItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.enum(['Feed', 'Medication', 'Additive', 'Equipment', 'Other']),
  unit: z.enum(['Kg', 'Bags', 'Litres', 'Pieces']),
  currentQuantity: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(0),
  unitPrice: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  lastRestockedDate: z.string().optional()
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const inventoryLogSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().min(1, "Item is required"),
  itemName: z.string(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().positive(),
  date: z.string(),
  referenceId: z.string().optional(), // e.g. Batch ID if used for a specific batch
  notes: z.string().optional()
});

export type InventoryLog = z.infer<typeof inventoryLogSchema>;
