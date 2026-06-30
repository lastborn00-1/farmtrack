import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { VaccinationSchedule } from '@/schemas/healthSchemas';
import { vaccinationScheduleSchema } from '@/schemas/healthSchemas';
import type { Batch } from '@/schemas/farmSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VaccinationFormProps {
  batches: Batch[];
  onSubmit: (data: VaccinationSchedule) => void;
  isLoading?: boolean;
  initialData?: VaccinationSchedule;
}

export function VaccinationForm({ batches, onSubmit, isLoading, initialData }: VaccinationFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(vaccinationScheduleSchema),
    defaultValues: initialData ? {
      ...initialData,
      scheduledDate: initialData.scheduledDate?.split('T')[0],
    } : {
      status: 'Pending',
      administrationMethod: 'Water',
      scheduledDate: new Date().toISOString().split('T')[0],
    }
  });

  const activeBatches = batches.filter(b => ['LAYING','GROWING','BROODING'].includes(b.status));
  const selectedBatchId = watch('batchId');
  const targetAgeWeeks = watch('targetAgeWeeks');

  useEffect(() => {
    const batch = batches.find(b => b.id === selectedBatchId);
    if (!batch) return;

    setValue('batchName', batch.batchName, { shouldValidate: true });

    const weeks = Number(targetAgeWeeks);
    if (!Number.isFinite(weeks) || weeks < 0) return;

    const arrival = new Date(batch.arrivalDate);
    if (Number.isNaN(arrival.getTime())) return;

    const hatchDate = new Date(arrival);
    hatchDate.setDate(hatchDate.getDate() - Number(batch.currentAgeWeeks || 0) * 7);

    const scheduledDate = new Date(hatchDate);
    scheduledDate.setDate(scheduledDate.getDate() + weeks * 7);
    setValue('scheduledDate', scheduledDate.toISOString().split('T')[0], { shouldValidate: true });
  }, [batches, selectedBatchId, setValue, targetAgeWeeks]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="batchId">Select Batch</Label>
        <select
          id="batchId"
          {...register('batchId')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">-- Choose Batch --</option>
          {activeBatches.map(b => (
            <option key={b.id} value={b.id}>{b.batchName} ({b.houseName})</option>
          ))}
        </select>
        {errors.batchId && <p className="text-xs text-red-500">{String(errors.batchId.message)}</p>}
        <input type="hidden" {...register('batchName')} /> 
      </div>

      <div className="space-y-2">
        <Label htmlFor="vaccineName">Vaccine Name</Label>
        <Input id="vaccineName" placeholder="e.g. Newcastle Disease (NDV)" {...register('vaccineName')} />
        {errors.vaccineName && <p className="text-xs text-red-500">{String(errors.vaccineName.message)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Scheduled Date</Label>
          <Input id="scheduledDate" type="date" {...register('scheduledDate')} />
          {errors.scheduledDate && <p className="text-xs text-red-500">{String(errors.scheduledDate.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetAgeWeeks">Target Age (Weeks)</Label>
          <Input id="targetAgeWeeks" type="number" {...register('targetAgeWeeks')} />
          {errors.targetAgeWeeks && <p className="text-xs text-red-500">{String(errors.targetAgeWeeks.message)}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="administrationMethod">Method</Label>
        <select
          id="administrationMethod"
          {...register('administrationMethod')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Water">Drinking Water</option>
          <option value="Eye Drop">Eye Drop</option>
          <option value="Injection">Injection</option>
          <option value="Spray">Spray</option>
          <option value="Wing Web">Wing Web</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" placeholder="Optional notes" {...register('notes')} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : initialData ? 'Save Vaccination' : 'Schedule Vaccination'}
      </Button>
    </form>
  );
}
