import { z } from 'zod';

export const treatmentRecordSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  batchId: z.string().min(1, "Batch is required"),
  batchName: z.string(),
  diagnosis: z.string().min(2, "Diagnosis is required"),
  medicationUsed: z.string().min(1, "Medication is required"),
  medicineType: z.string().optional(),
  productCompany: z.string().optional(),
  treatmentPurpose: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required"),
  administrationMethod: z.enum(['Water', 'Feed', 'Injection', 'Spray', 'Other']),
  treatedCount: z.coerce.number().min(1),
  durationDays: z.coerce.number().min(1),
  status: z.enum(['Ongoing', 'Completed']),
  withdrawalPeriodDays: z.coerce.number().default(0).optional(),
  notes: z.string().optional(),
  inventoryItemId: z.string().optional(),
  inventoryQuantityUsed: z.coerce.number().optional()
});

export type TreatmentRecord = z.infer<typeof treatmentRecordSchema>;

export const vaccinationScheduleSchema = z.object({
  id: z.string().optional(),
  batchId: z.string().min(1, "Batch is required"),
  batchName: z.string(),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  type: z.enum(['Vaccine', 'Dewormer']).default('Vaccine'),
  targetAgeWeeks: z.coerce.number().min(0),
  scheduledDate: z.string().min(1, "Date is required"),
  administrationMethod: z.enum(['Water', 'Eye Drop', 'Injection', 'Spray', 'Wing Web', 'Feed']),
  status: z.enum(['Pending', 'Completed', 'Missed']),
  completedDate: z.string().optional(),
  notes: z.string().optional()
});

export type VaccinationSchedule = z.infer<typeof vaccinationScheduleSchema>;
