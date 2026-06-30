import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TreatmentRecord } from '@/schemas/healthSchemas';
import { treatmentRecordSchema } from '@/schemas/healthSchemas';
import type { Batch } from '@/schemas/farmSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AiService } from '@/features/ai/services/aiService';
import { Camera, Sparkles, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeImageForAi } from '@/lib/image';
import { useInventory } from '@/features/inventory/hooks/useInventory';

interface TreatmentFormProps {
  batches: Batch[];
  onSubmit: (data: TreatmentRecord) => void;
  isLoading?: boolean;
  initialData?: Partial<TreatmentRecord>;
}

export function TreatmentForm({ batches, onSubmit, isLoading, initialData }: TreatmentFormProps) {
  const { items: inventoryItems } = useInventory();
  const medications = inventoryItems.filter(i => i.category === 'Medication');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(treatmentRecordSchema),
    defaultValues: initialData || {
      status: 'Ongoing',
      administrationMethod: 'Water',
      date: new Date().toISOString().split('T')[0],
      durationDays: 3,
      medicineType: 'Treatment',
    }
  });

  const handleImageUploadWrapper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const image = await normalizeImageForAi(file);
      const result = await AiService.analyzeDiseaseImage(image.base64, image.mimeType);
      setValue('diagnosis', result.diagnosis, { shouldValidate: true });
      setValue('medicationUsed', result.medication, { shouldValidate: true });
      setValue('dosage', result.dosage, { shouldValidate: true });
      toast.success('AI analyzed the image and suggested treatment details.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to analyze image with AI.');
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };

  const activeBatches = batches.filter(b => ['LAYING','GROWING','BROODING'].includes(b.status));
  const selectedBatchId = watch('batchId');
  const selectedInventoryItemId = watch('inventoryItemId');

  useEffect(() => {
    if (selectedInventoryItemId) {
      const item = medications.find(m => m.id === selectedInventoryItemId);
      if (item) {
        setValue('medicationUsed', item.name, { shouldValidate: true });
      }
    }
  }, [selectedInventoryItemId, medications, setValue]);

  useEffect(() => {
    const batch = batches.find(b => b.id === selectedBatchId);
    if (batch) setValue('batchName', batch.batchName, { shouldValidate: true });
  }, [batches, selectedBatchId, setValue]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      
      {/* AI Image Analysis Section */}
      <div className="p-4 bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-900/30 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/50 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div>
            <h4 className="font-semibold text-fuchsia-900 dark:text-fuchsia-100">AI Disease Diagnosis</h4>
            <p className="text-sm text-fuchsia-700/80 dark:text-fuchsia-300/80">Take a photo of a sick bird to automatically identify the disease and get treatment suggestions.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Camera Button */}
          <div className="relative flex-1">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleImageUploadWrapper}
              disabled={isAnalyzing}
            />
            <Button type="button" variant="outline" className="w-full gap-2 border-fuchsia-200 hover:bg-fuchsia-100 dark:border-fuchsia-800 dark:hover:bg-fuchsia-900/50" disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {isAnalyzing ? 'Analyzing...' : 'Camera'}
            </Button>
          </div>
          {/* Upload Button */}
          <div className="relative flex-1">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleImageUploadWrapper}
              disabled={isAnalyzing}
            />
            <Button type="button" variant="outline" className="w-full gap-2 border-fuchsia-200 hover:bg-fuchsia-100 dark:border-fuchsia-800 dark:hover:bg-fuchsia-900/50" disabled={isAnalyzing}>
              <ImageIcon className="w-4 h-4" />
              Upload Photo
            </Button>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Start Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-red-500">{String(errors.date.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationDays">Duration (Days)</Label>
          <Input id="durationDays" type="number" {...register('durationDays')} />
          {errors.durationDays && <p className="text-xs text-red-500">{String(errors.durationDays.message)}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis / Symptoms</Label>
        <Textarea id="diagnosis" rows={3} className="resize-none" placeholder="e.g. Coccidiosis" {...register('diagnosis')} />
        {errors.diagnosis && <p className="text-xs text-red-500">{String(errors.diagnosis.message)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medicineType">Medicine Type</Label>
          <select
            id="medicineType"
            {...register('medicineType')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="Treatment">Treatment</option>
            <option value="Antibiotic">Antibiotic</option>
            <option value="Anticoccidial">Anticoccidial</option>
            <option value="Dewormer">Dewormer</option>
            <option value="Multivitamin">Multivitamin</option>
            <option value="Appetite Booster">Appetite Booster</option>
            <option value="Electrolyte">Electrolyte</option>
            <option value="Probiotic">Probiotic</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="medicationUsed">Medicine / Product</Label>
          <Input id="medicationUsed" placeholder="e.g. Amprolium, Vitalyte" {...register('medicationUsed')} />
          {errors.medicationUsed && <p className="text-xs text-red-500">{String(errors.medicationUsed.message)}</p>}
        </div>
      </div>

      <div className="p-4 bg-muted/40 rounded-xl space-y-4 border border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inventory Link (Optional)</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inventoryItemId">Select from Inventory</Label>
            <select
              id="inventoryItemId"
              {...register('inventoryItemId')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- None --</option>
              {medications.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.currentQuantity} {m.unit})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventoryQuantityUsed">Quantity Used</Label>
            <Input id="inventoryQuantityUsed" type="number" step="0.01" placeholder="e.g. 1" {...register('inventoryQuantityUsed')} />
            {errors.inventoryQuantityUsed && <p className="text-xs text-red-500">{String(errors.inventoryQuantityUsed.message)}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="productCompany">Product Company</Label>
          <Input id="productCompany" placeholder="e.g. Animal Care, Kepro" {...register('productCompany')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="treatmentPurpose">Used For</Label>
          <Input id="treatmentPurpose" placeholder="e.g. appetite, stress, CRD" {...register('treatmentPurpose')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage</Label>
          <Input id="dosage" placeholder="e.g. 1g/L" {...register('dosage')} />
          {errors.dosage && <p className="text-xs text-red-500">{String(errors.dosage.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="withdrawalPeriodDays">Withdrawal Period (Days)</Label>
          <Input id="withdrawalPeriodDays" type="number" placeholder="e.g. 14" {...register('withdrawalPeriodDays')} />
          {errors.withdrawalPeriodDays && <p className="text-xs text-red-500">{String(errors.withdrawalPeriodDays.message)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="administrationMethod">Method</Label>
          <select
            id="administrationMethod"
            {...register('administrationMethod')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Water">Water</option>
            <option value="Feed">Feed</option>
            <option value="Injection">Injection</option>
            <option value="Spray">Spray</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="treatedCount">Birds Treated</Label>
          <Input id="treatedCount" type="number" {...register('treatedCount')} />
          {errors.treatedCount && <p className="text-xs text-red-500">{String(errors.treatedCount.message)}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : initialData ? 'Save Treatment' : 'Log Treatment'}
      </Button>
    </form>
  );
}
