/**
 * birdAge.ts
 * Pure utility helpers for calculating bird age and lifecycle milestones.
 * All functions are NaN/undefined safe.
 */

export interface LifecycleMilestones {
  layingStartDate: Date | null;
  peakLayingDate: Date | null;
  endOfLayDate: Date | null;
  restockAlertDate: Date | null;
  hatchDate: Date | null;
}

export type LifecycleStage =
  | 'Brooding'
  | 'Growing'
  | 'Pre-Lay'
  | 'Laying'
  | 'Late Lay'
  | 'End of Lay'
  | 'Closed';

/** Safe coerce: returns 0 if value is null/undefined/NaN */
function safeAge(val: number | undefined | null): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : Math.max(0, n);
}

export function calcCurrentAgeWeeks(
  arrivalDate: string | undefined,
  ageOnArrivalWeeks: number | undefined
): { weeks: number; days: number; totalWeeks: number } {
  if (!arrivalDate) return { weeks: 0, days: 0, totalWeeks: 0 };
  const arrival = new Date(arrivalDate);
  if (isNaN(arrival.getTime())) return { weeks: 0, days: 0, totalWeeks: 0 };
  const now = new Date();
  const msElapsed = now.getTime() - arrival.getTime();
  const daysElapsed = Math.max(0, Math.floor(msElapsed / (1000 * 60 * 60 * 24)));
  const weeksElapsed = daysElapsed / 7;
  const ageAtArrival = safeAge(ageOnArrivalWeeks);
  const totalWeeksFractional = ageAtArrival + weeksElapsed;
  const totalWeeksInt = Math.floor(totalWeeksFractional);
  const remainingDays = Math.floor((totalWeeksFractional - totalWeeksInt) * 7);
  return { weeks: totalWeeksInt, days: remainingDays, totalWeeks: totalWeeksFractional };
}

export function getAgeDisplayText(weeks: number, days: number): string {
  if (weeks === 0 && days === 0) return 'Day Old Chick';
  if (weeks === 0) return `${days} day${days !== 1 ? 's' : ''} old`;
  if (days === 0) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  return `${weeks}w ${days}d`;
}

export function getLifecycleStage(ageWeeks: number): LifecycleStage {
  const w = safeAge(ageWeeks);
  if (w < 4) return 'Brooding';
  if (w < 17) return 'Growing';
  if (w < 20) return 'Pre-Lay';
  if (w < 60) return 'Laying';
  if (w < 72) return 'Late Lay';
  return 'End of Lay';
}

export function getStageColors(stage: LifecycleStage): {
  bg: string; text: string; dot: string; bar: string;
} {
  switch (stage) {
    case 'Brooding':   return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', bar: 'bg-amber-400' };
    case 'Growing':    return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', bar: 'bg-blue-400' };
    case 'Pre-Lay':    return { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500', bar: 'bg-violet-400' };
    case 'Laying':     return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', bar: 'bg-emerald-400' };
    case 'Late Lay':   return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', bar: 'bg-orange-400' };
    case 'End of Lay': return { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', bar: 'bg-rose-400' };
    default:           return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', bar: 'bg-slate-400' };
  }
}

export function getLayingLifecycle(
  arrivalDate: string | undefined,
  ageOnArrivalWeeks: number | undefined,
  layingStartWeek = 18,
  endOfLayWeek = 72
): LifecycleMilestones {
  const empty = { layingStartDate: null, peakLayingDate: null, endOfLayDate: null, restockAlertDate: null, hatchDate: null };
  if (!arrivalDate) return empty;
  const arrival = new Date(arrivalDate);
  if (isNaN(arrival.getTime())) return empty;
  const ageAtArrival = safeAge(ageOnArrivalWeeks);
  const hatchDate = new Date(arrival);
  hatchDate.setDate(hatchDate.getDate() - ageAtArrival * 7);
  const addWeeks = (base: Date, weeks: number): Date => {
    const d = new Date(base);
    d.setDate(d.getDate() + weeks * 7);
    return d;
  };
  const weeksToLay = layingStartWeek - ageAtArrival;
  const layingStartDate = weeksToLay <= 0 ? null : addWeeks(hatchDate, layingStartWeek);
  return {
    layingStartDate,
    peakLayingDate: addWeeks(hatchDate, 28),
    endOfLayDate: addWeeks(hatchDate, endOfLayWeek),
    restockAlertDate: addWeeks(hatchDate, endOfLayWeek - 4),
    hatchDate,
  };
}

export function getLifecycleProgress(ageWeeks: number, endOfLayWeek = 72): number {
  return Math.min(100, Math.max(0, (safeAge(ageWeeks) / endOfLayWeek) * 100));
}

export function getCountdownText(targetDate: Date | null): string {
  if (!targetDate) return '';
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < -14) return `${Math.abs(Math.round(diffDays / 7))} wks ago`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays < 0) return 'yesterday';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 14) return `in ${diffDays} days`;
  return `in ${Math.round(diffDays / 7)} weeks`;
}

export function autoCalcLayingStartDate(
  arrivalDate: string,
  ageOnArrivalWeeks: number | undefined,
  layingStartWeek = 18
): string {
  if (!arrivalDate) return '';
  const age = safeAge(ageOnArrivalWeeks);
  const weeksToLay = layingStartWeek - age;
  if (weeksToLay <= 0) return '';
  const d = new Date(arrivalDate);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + weeksToLay * 7);
  return d.toISOString().split('T')[0];
}
