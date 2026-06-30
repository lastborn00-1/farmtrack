import { z } from 'zod';

export const dailyRecordSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  batchId: z.string().min(1, "Batch is required"),
  batchName: z.string(),
  houseId: z.string().min(1, "House is required"),
  population: z.coerce.number().min(0),
  mortality: z.coerce.number().min(0).default(0),
  mortalityReason: z.string().optional(),
  culling: z.coerce.number().min(0).default(0),
  cullingReason: z.string().optional(),
  feedGivenKg: z.coerce.number().min(0),
  feedRemainingKg: z.coerce.number().min(0),
  actualFeedConsumedKg: z.coerce.number().min(0),
  waterConsumptionLitres: z.coerce.number().min(0),
  temperature: z.coerce.number().optional(),
  humidity: z.coerce.number().optional(),
  lightHours: z.coerce.number().optional(),
  remarks: z.string().optional()
});

export type DailyRecord = z.infer<typeof dailyRecordSchema>;

export const eggProductionSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  batchId: z.string().min(1, "Batch is required"),
  batchName: z.string(),
  normalEggs: z.coerce.number().min(0).default(0),
  crackedEggs: z.coerce.number().min(0).default(0),
  brokenEggs: z.coerce.number().min(0).default(0),
  dirtyEggs: z.coerce.number().min(0).default(0),
  smallEggs: z.coerce.number().min(0).default(0),
  softShellEggs: z.coerce.number().min(0).default(0),
  doubleYolkEggs: z.coerce.number().min(0).default(0),
  totalEggs: z.coerce.number().min(0),
  totalCrates: z.coerce.number().min(0),
  henDayProductionPercent: z.number().optional(),
  henHousedProductionPercent: z.number().optional()
});

export type EggProduction = z.infer<typeof eggProductionSchema>;

export const eggStoreEntrySchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  crates: z.coerce.number().positive("Crates must be greater than 0"),
  source: z.enum(['Production', 'Opening Stock', 'Adjustment', 'Other']).default('Production'),
  description: z.string().optional()
});

export type EggStoreEntry = z.infer<typeof eggStoreEntrySchema>;
