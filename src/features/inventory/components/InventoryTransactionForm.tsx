import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { InventoryLog, InventoryItem } from '@/schemas/inventorySchemas';
import { inventoryLogSchema } from '@/schemas/inventorySchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InventoryTransactionFormProps {
  item: InventoryItem;
  onSubmit: (data: InventoryLog) => void;
  isLoading?: boolean;
}

export function InventoryTransactionForm({ item, onSubmit, isLoading }: InventoryTransactionFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(inventoryLogSchema),
    defaultValues: {
      itemId: item.id,
      itemName: item.name,
      type: 'IN',
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
    }
  });

  const type = watch('type');

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="bg-muted p-3 rounded-xl mb-2 flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground">Current Stock</p>
          <p className="font-bold">{item.currentQuantity} {item.unit}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Item</p>
          <p className="font-medium text-sm">{item.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Action</Label>
          <select
            id="type"
            {...register('type')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="IN">Restock (IN)</option>
            <option value="OUT">Consume (OUT)</option>
          </select>
          {errors.type && <p className="text-xs text-red-500">{String(errors.type.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-red-500">{String(errors.date.message)}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity ({item.unit})</Label>
        <Input id="quantity" type="number" step="0.01" {...register('quantity')} placeholder={`Amount to ${type === 'IN' ? 'add' : 'remove'}`} />
        {errors.quantity && <p className="text-xs text-red-500">{String(errors.quantity.message)}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input id="notes" placeholder="e.g. Invoice #1234 or Batch A" {...register('notes')} />
        {errors.notes && <p className="text-xs text-red-500">{String(errors.notes.message)}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : type === 'IN' ? 'Confirm Restock' : 'Confirm Consumption'}
      </Button>
    </form>
  );
}
