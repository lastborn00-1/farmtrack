import { z } from 'zod';

export const houseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  houseType: z.enum(['Deep Litter', 'Battery Cage', 'Free Range']),
  capacity: z.coerce.number().positive(),
  currentPopulation: z.number().default(0),
  status: z.enum(['Active', 'Inactive', 'Maintenance']),
  description: z.string().optional(),
});

export type House = z.infer<typeof houseSchema>;

export const batchSchema = z.object({
  id: z.string().optional(),
  batchCode: z.string().min(1, "Batch code is required"),
  batchName: z.string().min(1, "Batch name is required"),
  houseId: z.string().min(1, "House is required"),
  houseName: z.string(),
  breedId: z.string().optional(),
  breedName: z.string(),
  acquisitionType: z.enum(['DOC', 'PULLET', 'POL', 'STARTED_LAYER']),
  purchaseDate: z.string(),
  arrivalDate: z.string(),
  initialQuantity: z.coerce.number().positive(),
  currentQuantity: z.number(),
  costPerBird: z.coerce.number().positive(),
  totalPurchaseCost: z.number(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  currentAgeWeeks: z.coerce.number().min(0),
  expectedLayingStartDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  status: z.enum(['BROODING', 'GROWING', 'LAYING', 'MOLTING', 'COMPLETED', 'SOLD', 'CULLED']),
  cumulativeMortality: z.number().default(0),
  cumulativeCull: z.number().default(0),
  remarks: z.string().optional(),
});

export type Batch = z.infer<typeof batchSchema>;
