import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const houseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  houseType: z.enum(['Deep Litter', 'Battery Cage', 'Free Range']),
  capacity: z.coerce.number().positive('Capacity must be at least 1'),
  status: z.enum(['Active', 'Inactive', 'Maintenance']).default('Active'),
});

type HouseFormData = z.infer<typeof houseSchema>;

interface HouseFormProps {
  initialData?: Partial<HouseFormData>;
  onSubmit: (data: HouseFormData) => void;
  isLoading?: boolean;
}

export function HouseForm({ initialData, onSubmit, isLoading }: HouseFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<HouseFormData>({
    resolver: zodResolver(houseSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      houseType: initialData?.houseType || 'Deep Litter',
      capacity: initialData?.capacity || 1000,
      status: initialData?.status || 'Active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">House Name/Number</Label>
        <Input id="name" placeholder="e.g. House 1" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="houseType">House Type</Label>
        <select 
          id="houseType" 
          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register('houseType')}
        >
          <option value="Deep Litter">Deep Litter</option>
          <option value="Battery Cage">Battery Cage</option>
          <option value="Free Range">Free Range</option>
        </select>
        {errors.houseType && <p className="text-sm text-destructive">{errors.houseType.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity (Birds)</Label>
        <Input 
          id="capacity" 
          type="number" 
          {...register('capacity', { valueAsNumber: true })} 
        />
        {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select 
          id="status" 
          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register('status')}
        >
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Inactive">Inactive</option>
        </select>
        {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save House'}
        </Button>
      </div>
    </form>
  );
}
