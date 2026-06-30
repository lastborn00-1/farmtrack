import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Transaction } from '@/schemas/financeSchemas';
import { transactionSchema } from '@/schemas/financeSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Batch } from '@/schemas/farmSchemas';
import { AlertTriangle } from 'lucide-react';

interface TransactionFormProps {
  type: 'INCOME' | 'EXPENSE';
  initialData?: Partial<Transaction>;
  onSubmit: (data: Transaction & { birdsSoldBatchId?: string; birdsSoldCount?: number }) => void;
  isLoading?: boolean;
  batches?: Batch[];
}

export function TransactionForm({ type, initialData, onSubmit, isLoading, batches = [] }: TransactionFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      paymentMethod: initialData?.paymentMethod || 'Cash',
      status: initialData?.status || 'Paid',
      category: initialData?.category || (type === 'INCOME' ? 'Egg Sales' : 'Feed Cost'),
      amount: initialData?.amount || '',
      unitPrice: initialData?.unitPrice || '',
      quantity: initialData?.quantity || '',
      unitName: initialData?.unitName || '',
      description: initialData?.description || '',
      birdsSoldBatchId: '',
      birdsSoldCount: '',
    }
  });

  const categories = type === 'INCOME' 
    ? ['Egg Sales', 'Bird Sales', 'Manure Sales', 'Other']
    : ['Feed Cost', 'Medication', 'Equipment', 'Salary', 'Other'];

  const selectedCategory = watch('category');
  const qty = watch('quantity');
  const price = watch('unitPrice');
  const birdsSoldBatchId = watch('birdsSoldBatchId');
  const birdsSoldCount = watch('birdsSoldCount');
  const isEggSale = type === 'INCOME' && selectedCategory === 'Egg Sales';
  const isBirdSale = type === 'INCOME' && selectedCategory === 'Bird Sales';

  const selectedBatch = batches.find(b => b.id === birdsSoldBatchId);
  const birdSaleWarning = isBirdSale && selectedBatch && Number(birdsSoldCount) > selectedBatch.currentQuantity
    ? `⚠️ You only have ${selectedBatch.currentQuantity} birds in this batch!`
    : null;

  // Determine the correct unit label dynamically
  const getUnitName = (cat: string) => {
    switch (cat) {
      case 'Egg Sales': return 'Crates';
      case 'Bird Sales': return 'Birds';
      case 'Manure Sales': return 'kg';
      default: return 'Units';
    }
  };

  useEffect(() => {
    if (type === 'INCOME') {
      setValue('unitName', getUnitName(selectedCategory));
    }
  }, [selectedCategory, type, setValue]);

  // Auto-calculate amount for bird sales
  useEffect(() => {
    if (isBirdSale && birdsSoldCount && price) {
      const calculatedAmount = Number(birdsSoldCount) * Number(price);
      if (!isNaN(calculatedAmount) && calculatedAmount > 0) {
        setValue('amount', calculatedAmount);
        setValue('quantity', birdsSoldCount);
      }
    }
  }, [birdsSoldCount, price, isBirdSale, setValue]);

  // Auto-calculate amount when quantity or unit price changes (egg/manure sales)
  useEffect(() => {
    if (type === 'INCOME' && !isBirdSale && qty && price) {
      const calculatedAmount = Number(qty) * Number(price);
      if (!isNaN(calculatedAmount) && calculatedAmount > 0) {
        setValue('amount', calculatedAmount);
      }
    }
  }, [qty, price, type, isBirdSale, setValue]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as Transaction))} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <input type="hidden" {...register('type')} value={type} />
      <input type="hidden" {...register('unitName')} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            {...register('category')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-xs text-red-500">{String(errors.category.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-red-500">{String(errors.date.message)}</p>}
        </div>
      </div>

      {isBirdSale && batches.length > 0 && (
        <div className="space-y-3 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30">
          <div className="space-y-2">
            <Label htmlFor="birdsSoldBatchId">Source Batch <span className="text-rose-500">*</span></Label>
            <select
              id="birdsSoldBatchId"
              {...register('birdsSoldBatchId')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select batch...</option>
              {batches.filter(b => ['LAYING', 'GROWING', 'BROODING'].includes(b.status)).map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchName} ({b.currentQuantity} birds remaining)
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birdsSoldCount">Number of Birds Sold</Label>
            <Input id="birdsSoldCount" type="number" min="1" placeholder="e.g. 50" {...register('birdsSoldCount')} />
          </div>
          {birdSaleWarning && (
            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold bg-amber-100 dark:bg-amber-900/20 rounded-lg p-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {birdSaleWarning}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">Birds sold will be automatically deducted from this batch.</p>
        </div>
      )}

      {isBirdSale && batches.length === 0 && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          No active batches found. Create a batch first.
        </p>
      )}

      {/* Quantity / Price for Egg Sales and Manure Sales */}
      {type === 'INCOME' && !isBirdSale && (
        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-xl border border-border/50">
          <div className="space-y-2">
            <Label htmlFor="quantity">{isEggSale ? 'Crates Sold' : `Quantity (${getUnitName(selectedCategory)})`}</Label>
            <Input id="quantity" type="number" step="0.01" min="0" placeholder="e.g. 10" {...register('quantity')} />
            {isEggSale && <p className="text-[10px] text-muted-foreground">This deducts from Egg Store.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Price per {getUnitName(selectedCategory).replace(/s$/, '')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
              <Input id="unitPrice" type="number" step="0.01" min="0" className="pl-7" placeholder="e.g. 3500" {...register('unitPrice')} />
            </div>
          </div>
        </div>
      )}

      {/* Price per bird for Bird Sales */}
      {isBirdSale && (
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Price per Bird</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
            <Input id="unitPrice" type="number" step="0.01" min="0" className="pl-7" placeholder="e.g. 2500" {...register('unitPrice')} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Total Amount {type === 'INCOME' && <span className="text-muted-foreground font-normal text-[10px] ml-1">(Auto-calculated)</span>}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
          <Input id="amount" type="number" step="0.01" className="pl-7" placeholder="0.00" {...register('amount')} readOnly={type === 'INCOME'} />
        </div>
        {errors.amount && <p className="text-xs text-red-500">{String(errors.amount.message)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <select
            id="paymentMethod"
            {...register('paymentMethod')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Credit">Credit</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...register('status')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input id="description" placeholder="Notes or details" {...register('description')} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : initialData ? 'Save Changes' : (type === 'INCOME' ? 'Add Income' : 'Add Expense')}
      </Button>
    </form>
  );
}
