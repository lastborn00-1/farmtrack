import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { EggStoreEntry } from '@/schemas/productionSchemas';
import { eggStoreEntrySchema } from '@/schemas/productionSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EggStoreFormProps {
  initialData?: Partial<EggStoreEntry>;
  onSubmit: (data: EggStoreEntry) => void;
  isLoading?: boolean;
}

export function EggStoreForm({ initialData, onSubmit, isLoading }: EggStoreFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(eggStoreEntrySchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      crates: initialData?.crates || '',
      source: initialData?.source || 'Production',
      description: initialData?.description || '',
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as EggStoreEntry))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-red-500">{String(errors.date.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="crates">Crates Added</Label>
          <Input id="crates" type="number" step="0.01" min="0" placeholder="e.g. 12" {...register('crates')} />
          {errors.crates && <p className="text-xs text-red-500">{String(errors.crates.message)}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <select
          id="source"
          {...register('source')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="Production">Production</option>
          <option value="Opening Stock">Opening Stock</option>
          <option value="Adjustment">Adjustment</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="Optional note" {...register('description')} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : initialData ? 'Save Store Entry' : 'Add to Store'}
      </Button>
    </form>
  );
}
