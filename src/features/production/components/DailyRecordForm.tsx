import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Batch } from '@/schemas/farmSchemas';
import { dailyRecordSchema } from '@/schemas/productionSchemas';
import { useEffect } from 'react';

type DailyRecordFormData = z.infer<typeof dailyRecordSchema>;

interface DailyRecordFormProps {
  batches: Batch[];
  initialData?: Partial<DailyRecordFormData>;
  onSubmit: (data: DailyRecordFormData) => void;
  isLoading?: boolean;
}

export function DailyRecordForm({ batches, initialData, onSubmit, isLoading }: DailyRecordFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DailyRecordFormData>({
    resolver: zodResolver(dailyRecordSchema) as any,
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      batchId: initialData?.batchId || (batches.length > 0 ? batches[0].id! : ''),
      batchName: initialData?.batchName || (batches.length > 0 ? batches[0].batchName : ''),
      houseId: initialData?.houseId || (batches.length > 0 ? batches[0].houseId : ''),
      population: initialData?.population || 0,
      mortality: initialData?.mortality || 0,
      mortalityReason: initialData?.mortalityReason || '',
      culling: initialData?.culling || 0,
      cullingReason: initialData?.cullingReason || '',
      feedGivenKg: initialData?.feedGivenKg || 0,
      feedRemainingKg: initialData?.feedRemainingKg || 0,
      actualFeedConsumedKg: initialData?.actualFeedConsumedKg || 0,
      waterConsumptionLitres: initialData?.waterConsumptionLitres || 0,
      temperature: initialData?.temperature || 0,
      humidity: initialData?.humidity || 0,
      lightHours: initialData?.lightHours || 16,
      remarks: initialData?.remarks || '',
    },
  });

  const selectedBatchId = watch('batchId');
  const feedGiven = watch('feedGivenKg');
  const feedRemaining = watch('feedRemainingKg');

  useEffect(() => {
    const batch = batches.find(b => b.id === selectedBatchId);
    if (batch) {
      setValue('batchName', batch.batchName);
      setValue('houseId', batch.houseId);
      setValue('population', batch.currentQuantity);
    }
  }, [selectedBatchId, batches, setValue]);

  useEffect(() => {
    setValue('actualFeedConsumedKg', Math.max(0, (feedGiven || 0) - (feedRemaining || 0)));
  }, [feedGiven, feedRemaining, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchId">Flock Batch</Label>
          <select 
            id="batchId" 
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            {...register('batchId')}
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.batchName} ({b.houseName})</option>
            ))}
          </select>
          {errors.batchId && <p className="text-sm text-destructive">{errors.batchId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mortality">Mortality (Dead Birds)</Label>
          <Input id="mortality" type="number" {...register('mortality', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mortalityReason">Mortality Reason</Label>
          <Input id="mortalityReason" placeholder="e.g. Unknown, Heat stress" {...register('mortalityReason')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="culling">Culling (Removed Birds)</Label>
          <Input id="culling" type="number" {...register('culling', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cullingReason">Culling Reason</Label>
          <Input id="cullingReason" placeholder="e.g. Sick, Underweight" {...register('cullingReason')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="feedGivenKg">Feed Given (Kg)</Label>
          <Input id="feedGivenKg" type="number" step="0.01" {...register('feedGivenKg', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedRemainingKg">Feed Remaining (Kg)</Label>
          <Input id="feedRemainingKg" type="number" step="0.01" {...register('feedRemainingKg', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="waterConsumptionLitres">Water Consumed (Litres)</Label>
          <Input id="waterConsumptionLitres" type="number" step="0.1" {...register('waterConsumptionLitres', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="temperature">Avg Temperature (°C)</Label>
          <Input id="temperature" type="number" step="0.1" {...register('temperature', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Daily Record'}
        </Button>
      </div>
    </form>
  );
}
