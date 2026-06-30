import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { InventoryItem } from '@/schemas/inventorySchemas';
import { inventoryItemSchema } from '@/schemas/inventorySchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { z } from 'zod';

interface InventoryItemFormProps {
  onSubmit: (data: InventoryItem & { totalCost?: number }) => void;
  isLoading?: boolean;
  initialData?: InventoryItem;
}

const formSchema = inventoryItemSchema.extend({
  totalCost: z.coerce.number().optional()
});

export function InventoryItemForm({ onSubmit, isLoading, initialData }: InventoryItemFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      category: 'Feed',
      unit: 'Kg',
      currentQuantity: 0,
      reorderLevel: 50,
    }
  });

  const isEditing = !!initialData;
  const category = watch('category');

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

      {/* Cost field — only show when adding new item with initial quantity > 0, or always for new items */}
      {!isEditing && (
        <div className="space-y-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
          <Label htmlFor="totalCost" className="text-emerald-800 dark:text-emerald-300">
            Total Cost (₦) <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
          </Label>
          <Input
            id="totalCost"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 45000"
            {...register('totalCost', { valueAsNumber: true })}
            className="border-emerald-200 dark:border-emerald-900/40 focus-visible:ring-emerald-500"
          />
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
            💡 If entered, will be recorded as a <strong>{category}</strong> expense in Finance & Reports.
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Item'}
      </Button>
    </form>
  );
}
