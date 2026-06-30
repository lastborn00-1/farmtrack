import { addDays } from 'date-fns';
import type { VaccinationSchedule } from '@/schemas/healthSchemas';

interface ScheduleTemplate {
  name: string;
  type?: 'Vaccine' | 'Dewormer';
  targetDays: number;
  method: 'Water' | 'Eye Drop' | 'Injection' | 'Spray' | 'Wing Web' | 'Feed';
  notes: string;
}

// Standard Commercial Poultry Health Schedule (Nigeria)
// Growing Phase (Weeks 1–16) + Laying Phase Boosters & Deworming (Weeks 18–72)
export const NIGERIAN_VACCINATION_SCHEDULE: ScheduleTemplate[] = [
  // --- BROODING & GROWING PHASE ---
  { name: "NDV + IB (1st Dose)", type: 'Vaccine', targetDays: 7, method: "Water", notes: "Use Hitchner B1 or Lasota. Standard for NDV/IB prevention." },
  { name: "Gumboro (IBD - 1st Dose)", type: 'Vaccine', targetDays: 14, method: "Water", notes: "Use intermediate strain. Crucial for Gumboro prevention." },
  { name: "NDV + IB (Booster)", type: 'Vaccine', targetDays: 21, method: "Water", notes: "Lasota strain. Enhances immunity against Newcastle." },
  { name: "Gumboro (Booster)", type: 'Vaccine', targetDays: 28, method: "Water", notes: "Intermediate plus strain if farm has history, else standard." },
  { name: "Fowl Pox", type: 'Vaccine', targetDays: 42, method: "Wing Web", notes: "Check for 'takes' 7 days post-vaccination." },
  { name: "NDV + IB (2nd Booster)", type: 'Vaccine', targetDays: 56, method: "Water", notes: "Maintain immunity during growing phase." },
  { name: "Grower Deworming", type: 'Dewormer', targetDays: 56, method: "Water", notes: "Wk 8: First standard deworming (Piperazine or Levamisole)." },
  { name: "Coryza / Fowl Cholera", type: 'Vaccine', targetDays: 70, method: "Injection", notes: "Bacterial vaccines. Administer intramuscularly." },
  { name: "NDV + IB + EDS (Inactivated)", type: 'Vaccine', targetDays: 112, method: "Injection", notes: "Critical pre-lay multi-vaccine. Give 2–4 weeks before point of lay. Oil-emulsion, injected intramuscularly." },
  { name: "Pre-Lay Deworming", type: 'Dewormer', targetDays: 126, method: "Water", notes: "Wk 18: Crucial deworming before point of lay." },

  // --- LAYING PHASE BOOSTERS & DEWORMING (every 8 weeks for vaccines, 12 weeks for deworming) ---
  { name: "NDV Lasota (Laying Booster 1)", type: 'Vaccine', targetDays: 168, method: "Water", notes: "Wk 24: Live Lasota via drinking water. Top up immunity at start of peak lay. Withhold water 2hrs before dosing." },
  { name: "Routine Deworming 1", type: 'Dewormer', targetDays: 210, method: "Water", notes: "Wk 30: Routine 12-week laying phase deworming. Check withdrawal periods if selling eggs!" },
  { name: "NDV Lasota (Laying Booster 2)", type: 'Vaccine', targetDays: 224, method: "Water", notes: "Wk 32: Routine 8-week Lasota booster. Essential in Nigerian endemic zone to prevent production drops." },
  { name: "NDV Lasota (Laying Booster 3)", type: 'Vaccine', targetDays: 280, method: "Water", notes: "Wk 40: Mid-lay booster. Monitor egg production closely after vaccination for any temporary drops." },
  { name: "Routine Deworming 2", type: 'Dewormer', targetDays: 294, method: "Water", notes: "Wk 42: Routine 12-week laying phase deworming. Check withdrawal periods if selling eggs!" },
  { name: "NDV Lasota (Laying Booster 4)", type: 'Vaccine', targetDays: 336, method: "Water", notes: "Wk 48: Peak-to-late lay transition booster. Continue 8-week interval as per FAO/NVMA guidelines." },
  { name: "Routine Deworming 3", type: 'Dewormer', targetDays: 378, method: "Water", notes: "Wk 54: Routine 12-week laying phase deworming. Check withdrawal periods if selling eggs!" },
  { name: "NDV Lasota (Laying Booster 5)", type: 'Vaccine', targetDays: 392, method: "Water", notes: "Wk 56: Late lay booster. Consider also checking antibody titres this period if possible." },
  { name: "NDV Lasota (Laying Booster 6)", type: 'Vaccine', targetDays: 448, method: "Water", notes: "Wk 64: Approaching end of lay cycle. Maintain immunity to protect remaining production." },
  { name: "Routine Deworming 4", type: 'Dewormer', targetDays: 462, method: "Water", notes: "Wk 66: Routine 12-week laying phase deworming. Check withdrawal periods if selling eggs!" },
  { name: "NDV Lasota (Laying Booster 7)", type: 'Vaccine', targetDays: 504, method: "Water", notes: "Wk 72: Final booster of standard laying cycle. Birds typically depopulated around Wk 72–80." },
];

export function generateVaccinationSchedule(
  batchId: string, 
  batchName: string, 
  arrivalDate: string, 
  currentAgeWeeksAtArrival: number = 0
): Omit<VaccinationSchedule, 'id'>[] {
  const arrival = new Date(arrivalDate);
  const currentAgeDays = currentAgeWeeksAtArrival * 7;
  
  // Calculate the "Day 0" hatch date assuming arrivalDate is at `currentAgeDays`
  const hatchDate = addDays(arrival, -currentAgeDays);
  
  const schedules: Omit<VaccinationSchedule, 'id'>[] = [];

  NIGERIAN_VACCINATION_SCHEDULE.forEach(template => {
    const scheduledDate = addDays(hatchDate, template.targetDays);

    if (template.targetDays > currentAgeDays) {
      // Vaccination is still upcoming — schedule as Pending
      schedules.push({
        batchId,
        batchName,
        vaccineName: template.name,
        type: template.type || 'Vaccine',
        targetAgeWeeks: Math.floor(template.targetDays / 7),
        scheduledDate: scheduledDate.toISOString(),
        administrationMethod: template.method,
        status: 'Pending',
        notes: template.notes
      });
    } else {
      // Vaccination was due before arrival — mark as skipped/assumed done
      schedules.push({
        batchId,
        batchName,
        vaccineName: template.name,
        type: template.type || 'Vaccine',
        targetAgeWeeks: Math.floor(template.targetDays / 7),
        scheduledDate: scheduledDate.toISOString(),
        administrationMethod: template.method,
        status: 'Missed',
        notes: `Assumed administered before arrival (birds arrived at ${currentAgeWeeksAtArrival} weeks). ${template.notes}`
      });
    }
  });

  return schedules;
}

