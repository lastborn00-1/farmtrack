import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Batch } from '@/schemas/farmSchemas';
import { eggProductionSchema } from '@/schemas/productionSchemas';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

type EggProductionFormData = z.infer<typeof eggProductionSchema>;

interface EggProductionFormProps {
  batches: Batch[];
  initialData?: Partial<EggProductionFormData>;
  onSubmit: (data: EggProductionFormData) => void;
  isLoading?: boolean;
}

export function EggProductionForm({ batches, initialData, onSubmit, isLoading }: EggProductionFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EggProductionFormData>({
    resolver: zodResolver(eggProductionSchema) as any,
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      batchId: initialData?.batchId || (batches.length > 0 ? batches[0].id! : ''),
      batchName: initialData?.batchName || (batches.length > 0 ? batches[0].batchName : ''),
      normalEggs: initialData?.normalEggs || 0,
      crackedEggs: initialData?.crackedEggs || 0,
      brokenEggs: initialData?.brokenEggs || 0,
      dirtyEggs: initialData?.dirtyEggs || 0,
      smallEggs: initialData?.smallEggs || 0,
      softShellEggs: initialData?.softShellEggs || 0,
      doubleYolkEggs: initialData?.doubleYolkEggs || 0,
      totalEggs: initialData?.totalEggs || 0,
      totalCrates: initialData?.totalCrates || 0,
    },
  });

  const selectedBatchId = watch('batchId');
  const normal = watch('normalEggs') || 0;
  const cracked = watch('crackedEggs') || 0;
  const broken = watch('brokenEggs') || 0;
  const dirty = watch('dirtyEggs') || 0;
  const small = watch('smallEggs') || 0;
  const soft = watch('softShellEggs') || 0;
  const double = watch('doubleYolkEggs') || 0;

  useEffect(() => {
    if (selectedBatchId === 'ALL') {
      setValue('batchName', 'All Batches (Mixed)');
    } else {
      const batch = batches.find(b => b.id === selectedBatchId);
      if (batch) {
        setValue('batchName', batch.batchName);
      }
    }
  }, [selectedBatchId, batches, setValue]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const totalEggs = watch('totalEggs') || 0;
  const eggWarning = selectedBatch && totalEggs > selectedBatch.currentQuantity
    ? `⚠️ ${totalEggs} eggs logged but batch only has ${selectedBatch.currentQuantity} live birds. Please double-check.`
    : null;

  useEffect(() => {
    const total = normal + cracked + broken + dirty + small + soft + double;
    setValue('totalEggs', total);
    setValue('totalCrates', Number((total / 30).toFixed(2)));
  }, [normal, cracked, broken, dirty, small, soft, double, setValue]);

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
            <option value="ALL">All Batches (Mixed)</option>
            {batches.filter(b => b.status === 'LAYING').map(b => (
              <option key={b.id} value={b.id}>{b.batchName} ({b.houseName})</option>
            ))}
          </select>
          {errors.batchId && <p className="text-sm text-destructive">{errors.batchId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="normalEggs">Normal Eggs</Label>
          <Input id="normalEggs" type="number" {...register('normalEggs', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dirtyEggs">Dirty Eggs</Label>
          <Input id="dirtyEggs" type="number" {...register('dirtyEggs', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="crackedEggs">Cracked Eggs</Label>
          <Input id="crackedEggs" type="number" {...register('crackedEggs', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brokenEggs">Broken Eggs (Loss)</Label>
          <Input id="brokenEggs" type="number" {...register('brokenEggs', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="smallEggs">Small/Pullet Eggs</Label>
          <Input id="smallEggs" type="number" {...register('smallEggs', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="softShellEggs">Soft Shell Eggs</Label>
          <Input id="softShellEggs" type="number" {...register('softShellEggs', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doubleYolkEggs">Double Yolk Eggs</Label>
          <Input id="doubleYolkEggs" type="number" {...register('doubleYolkEggs', { valueAsNumber: true })} />
        </div>
      </div>

      {eggWarning && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{eggWarning}</p>
        </div>
      )}

      <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Eggs Computed</p>
          <p className="text-2xl font-bold">{watch('totalEggs')}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Crates (30)</p>
          <p className="text-2xl font-bold">{watch('totalCrates')} <span className="text-sm font-normal text-muted-foreground">crates</span></p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Egg Production'}
        </Button>
      </div>
    </form>
  );
}
