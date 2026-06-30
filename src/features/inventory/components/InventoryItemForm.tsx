import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { InventoryItem } from '@/schemas/inventorySchemas';
import { inventoryItemSchema } from '@/schemas/inventorySchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InventoryItemFormProps {
  onSubmit: (data: InventoryItem) => void;
  isLoading?: boolean;
  initialData?: InventoryItem;
}

export function InventoryItemForm({ onSubmit, isLoading, initialData }: InventoryItemFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: initialData || {
      category: 'Feed',
      unit: 'Kg',
      currentQuantity: 0,
      reorderLevel: 50,
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input id="name" placeholder="e.g. Layer Mash Phase 1" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{String(errors.name.message)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            {...register('category')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Feed">Feed</option>
            <option value="Medication">Medication</option>
            <option value="Additive">Additive</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>
          {errors.category && <p className="text-xs text-red-500">{String(errors.category.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <select
            id="unit"
            {...register('unit')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Kg">Kg</option>
            <option value="Bags">Bags</option>
            <option value="Litres">Litres</option>
            <option value="Pieces">Pieces</option>
          </select>
          {errors.unit && <p className="text-xs text-red-500">{String(errors.unit.message)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentQuantity">Initial Quantity</Label>
          <Input id="currentQuantity" type="number" step="0.01" {...register('currentQuantity')} />
          {errors.currentQuantity && <p className="text-xs text-red-500">{String(errors.currentQuantity.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Low Stock Alert Level</Label>
          <Input id="reorderLevel" type="number" step="0.01" {...register('reorderLevel')} />
          {errors.reorderLevel && <p className="text-xs text-red-500">{String(errors.reorderLevel.message)}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Add Item'}
      </Button>
    </form>
  );
}
