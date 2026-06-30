import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { House } from '@/schemas/farmSchemas';
import { batchSchema } from '@/schemas/farmSchemas';
import { useEffect } from 'react';
import { autoCalcLayingStartDate } from '@/lib/birdAge';

type BatchFormData = z.infer<typeof batchSchema>;

interface BatchFormProps {
  houses: House[];
  initialData?: Partial<BatchFormData>;
  onSubmit: (data: BatchFormData) => void;
  isLoading?: boolean;
}

export function BatchForm({ houses, initialData, onSubmit, isLoading }: BatchFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema) as any,
    defaultValues: {
      batchCode: initialData?.batchCode || '',
      batchName: initialData?.batchName || '',
      houseId: initialData?.houseId || (houses.length > 0 ? houses[0].id! : ''),
      houseName: initialData?.houseName || (houses.length > 0 ? houses[0].name : ''),
      breedName: initialData?.breedName || 'Isa Brown',
      acquisitionType: initialData?.acquisitionType || 'PULLET',
      purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
      arrivalDate: initialData?.arrivalDate || new Date().toISOString().split('T')[0],
      initialQuantity: initialData?.initialQuantity ?? 1000,
      currentQuantity: initialData?.currentQuantity ?? 1000,
      costPerBird: initialData?.costPerBird ?? 0,
      totalPurchaseCost: initialData?.totalPurchaseCost ?? 0,
      supplierName: initialData?.supplierName || '',
      currentAgeWeeks: initialData?.currentAgeWeeks ?? 16,
      expectedLayingStartDate: initialData?.expectedLayingStartDate || '',
      status: initialData?.status || 'GROWING',
    },
  });

  const selectedHouseId = watch('houseId');
  const initialQuantity = watch('initialQuantity');
  const costPerBird = watch('costPerBird');
  const arrivalDateVal = watch('arrivalDate');
  const currentAgeWeeksVal = watch('currentAgeWeeks');

  useEffect(() => {
    const house = houses.find(h => h.id === selectedHouseId);
    if (house) setValue('houseName', house.name);
  }, [selectedHouseId, houses, setValue]);

  useEffect(() => {
    setValue('totalPurchaseCost', (initialQuantity || 0) * (costPerBird || 0));
    const loss = (initialData?.cumulativeMortality || 0) + (initialData?.cumulativeCull || 0);
    setValue('currentQuantity', Math.max(0, (initialQuantity || 0) - loss));
  }, [initialQuantity, costPerBird, setValue, initialData]);

  // Auto-calculate expected laying start date and set appropriate status/acquisition
  useEffect(() => {
    const ageNum = Number(currentAgeWeeksVal);
    if (Number.isFinite(ageNum)) {
      // Set expected laying date
      if (arrivalDateVal) {
        const calculated = autoCalcLayingStartDate(arrivalDateVal, ageNum);
        if (calculated) setValue('expectedLayingStartDate', calculated);
      }
      
      // Auto-select status and acquisitionType
      if (ageNum === 0) {
        setValue('acquisitionType', 'DOC');
        setValue('status', 'BROODING');
      } else if (ageNum > 0 && ageNum <= 15) {
        setValue('acquisitionType', 'PULLET');
        setValue('status', 'GROWING');
      } else if (ageNum > 15 && ageNum <= 18) {
        setValue('acquisitionType', 'POL');
        setValue('status', 'GROWING'); // POL is still technically growing until they start laying
      } else if (ageNum > 18) {
        setValue('acquisitionType', 'STARTED_LAYER');
        setValue('status', 'LAYING');
      }
    }
  }, [arrivalDateVal, currentAgeWeeksVal, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="batchCode">Batch Code</Label>
          <Input id="batchCode" placeholder="e.g. B-2026-01" {...register('batchCode')} />
          {errors.batchCode && <p className="text-sm text-destructive">{errors.batchCode.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchName">Batch Name</Label>
          <Input id="batchName" placeholder="e.g. Spring Layers" {...register('batchName')} />
          {errors.batchName && <p className="text-sm text-destructive">{errors.batchName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="houseId">House</Label>
          <select 
            id="houseId" 
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            {...register('houseId')}
          >
            {houses.map(h => (
              <option key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</option>
            ))}
          </select>
          {errors.houseId && <p className="text-sm text-destructive">{errors.houseId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="breedName">Breed</Label>
          <Input id="breedName" {...register('breedName')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="acquisitionType">Type</Label>
          <select 
            id="acquisitionType" 
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            {...register('acquisitionType')}
          >
            <option value="DOC">Day Old Chicks (DOC)</option>
            <option value="PULLET">Pullets</option>
            <option value="POL">Point of Lay (POL)</option>
            <option value="STARTED_LAYER">Started Layers</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status" className="text-muted-foreground">Status (Auto-managed)</Label>
          <Input id="status" value="Auto-updates based on age" disabled className="bg-muted text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="initialQuantity">Initial Quantity</Label>
          <Input id="initialQuantity" type="number" {...register('initialQuantity', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPerBird">Cost per Bird</Label>
          <Input id="costPerBird" type="number" step="0.01" {...register('costPerBird', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="arrivalDate">Date of Registration</Label>
          <Input id="arrivalDate" type="date" {...register('arrivalDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentAgeWeeks">
            Age at Registration
            <span className="ml-1 text-[10px] text-muted-foreground font-normal">(weeks, 0 = DOC)</span>
          </Label>
          <Input id="currentAgeWeeks" type="number" min="0" max="80" placeholder="e.g. 16" {...register('currentAgeWeeks', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplierName">Supplier Name</Label>
          <Input id="supplierName" placeholder="e.g. Zartech Farms" {...register('supplierName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expectedLayingStartDate">
            Expected Lay Date
            <span className="ml-1 text-[10px] text-muted-foreground font-normal">(auto-calculated)</span>
          </Label>
          <Input id="expectedLayingStartDate" type="date" {...register('expectedLayingStartDate')} />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Batch'}
        </Button>
      </div>
    </form>
  );
}
