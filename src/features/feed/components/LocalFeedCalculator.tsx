import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedProductionSchema, type FeedProductionLog } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Calculator, Beaker } from 'lucide-react';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { toast } from 'sonner';

// Standard Recipes (Per 1000kg)
const STANDARD_RECIPES = {
  'Chick Mash': [
    { name: 'Maize', quantityKg: 500, totalPrice: 0 },
    { name: 'Soybean Meal', quantityKg: 200, totalPrice: 0 },
    { name: 'Groundnut Cake (GNC)', quantityKg: 100, totalPrice: 0 },
    { name: 'Wheat Offal', quantityKg: 120, totalPrice: 0 },
    { name: 'Fish Meal', quantityKg: 25, totalPrice: 0 },
    { name: 'Bone Meal', quantityKg: 25, totalPrice: 0 },
    { name: 'Limestone', quantityKg: 15, totalPrice: 0 },
    { name: 'Premix', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Salt', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Methionine', quantityKg: 1, totalPrice: 0 },
    { name: 'Lysine', quantityKg: 1, totalPrice: 0 },
    { name: 'Toxin Binder', quantityKg: 1, totalPrice: 0 },
  ],
  'Grower Mash': [
    { name: 'Maize', quantityKg: 450, totalPrice: 0 },
    { name: 'Soybean Meal', quantityKg: 100, totalPrice: 0 },
    { name: 'Groundnut Cake (GNC)', quantityKg: 80, totalPrice: 0 },
    { name: 'Wheat Offal', quantityKg: 280, totalPrice: 0 },
    { name: 'Palm Kernel Cake', quantityKg: 40, totalPrice: 0 },
    { name: 'Bone Meal', quantityKg: 25, totalPrice: 0 },
    { name: 'Limestone', quantityKg: 15, totalPrice: 0 },
    { name: 'Premix', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Salt', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Methionine', quantityKg: 1, totalPrice: 0 },
    { name: 'Lysine', quantityKg: 1, totalPrice: 0 },
    { name: 'Toxin Binder', quantityKg: 1, totalPrice: 0 },
  ],
  'Pre-Layer Mash': [
    { name: 'Maize', quantityKg: 480, totalPrice: 0 },
    { name: 'Soybean Meal', quantityKg: 120, totalPrice: 0 },
    { name: 'Groundnut Cake (GNC)', quantityKg: 100, totalPrice: 0 },
    { name: 'Wheat Offal', quantityKg: 200, totalPrice: 0 },
    { name: 'Palm Kernel Cake (PKC)', quantityKg: 30, totalPrice: 0 },
    { name: 'Bone Meal', quantityKg: 30, totalPrice: 0 },
    { name: 'Limestone', quantityKg: 30, totalPrice: 0 },
    { name: 'Premix', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Salt', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Methionine', quantityKg: 1.5, totalPrice: 0 },
    { name: 'Lysine', quantityKg: 1, totalPrice: 0 },
    { name: 'Toxin Binder', quantityKg: 1, totalPrice: 0 },
  ],
  'Layer Mash': [
    { name: 'Maize', quantityKg: 500, totalPrice: 0 },
    { name: 'Soybean Meal', quantityKg: 150, totalPrice: 0 },
    { name: 'Groundnut Cake (GNC)', quantityKg: 80, totalPrice: 0 },
    { name: 'Wheat Offal', quantityKg: 140, totalPrice: 0 },
    { name: 'Bone Meal', quantityKg: 30, totalPrice: 0 },
    { name: 'Limestone', quantityKg: 85, totalPrice: 0 },
    { name: 'Premix', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Salt', quantityKg: 2.5, totalPrice: 0 },
    { name: 'Methionine', quantityKg: 1.5, totalPrice: 0 },
    { name: 'Lysine', quantityKg: 1, totalPrice: 0 },
    { name: 'Toxin Binder', quantityKg: 1, totalPrice: 0 },
  ],
};

export function LocalFeedCalculator() {
  const { items, logTransaction, isSubmitting } = useInventory();
  const { addTransaction } = useFinance();
  const feedItems = items.filter(i => i.category === 'Feed');
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FeedProductionLog>({
    resolver: zodResolver(feedProductionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      recipeName: 'Custom Mix',
      targetBagSizeKg: 25,
      ingredients: [{ id: crypto.randomUUID(), name: '', quantityKg: 0, totalPrice: 0 }],
      overheadCosts: { milling: 0, transport: 0, other: 0 },
      totalWeightKg: 0,
      totalCost: 0,
      bagsProduced: 0,
      costPerBag: 0,
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'ingredients'
  });

  const formValues = watch();

  // Calculate totals on the fly
  useEffect(() => {
    let weight = 0;
    let cost = 0;

    formValues.ingredients?.forEach(ing => {
      weight += (Number(ing.quantityKg) || 0);
      cost += (Number(ing.totalPrice) || 0);
    });

    const overhead = (Number(formValues.overheadCosts?.milling) || 0) + 
                     (Number(formValues.overheadCosts?.transport) || 0) + 
                     (Number(formValues.overheadCosts?.other) || 0);
    
    cost += overhead;

    const bags = formValues.targetBagSizeKg > 0 ? +(weight / formValues.targetBagSizeKg).toFixed(2) : 0;
    const bagCost = bags > 0 ? +(cost / bags).toFixed(2) : 0;

    if (formValues.totalWeightKg !== weight) setValue('totalWeightKg', weight);
    if (formValues.totalCost !== cost) setValue('totalCost', cost);
    if (formValues.bagsProduced !== bags) setValue('bagsProduced', bags);
    if (formValues.costPerBag !== bagCost) setValue('costPerBag', bagCost);
  }, [JSON.stringify(formValues.ingredients), JSON.stringify(formValues.overheadCosts), formValues.targetBagSizeKg, setValue]);

  const loadRecipe = (recipeName: keyof typeof STANDARD_RECIPES) => {
    const recipe = STANDARD_RECIPES[recipeName];
    setValue('recipeName', recipeName);
    replace(recipe.map(ing => ({ ...ing, id: crypto.randomUUID(), totalPrice: 0 })));
  };

  const onSubmit = async (data: FeedProductionLog) => {
    if (!data.inventoryItemId || data.bagsProduced <= 0) return;

    try {
      const selectedItem = feedItems.find(i => i.id === data.inventoryItemId);
      if (!selectedItem) return;

      const logData = {
        itemId: data.inventoryItemId,
        itemName: selectedItem.name,
        type: 'IN' as const,
        quantity: data.bagsProduced,
        unitCost: data.costPerBag,
        totalCost: data.totalCost,
        date: data.date,
        notes: `Produced ${data.totalWeightKg}kg of ${data.recipeName}. Unit Cost: ₦${data.costPerBag.toLocaleString()}/${data.targetBagSizeKg}kg bag.`,
        referenceId: 'LOCAL_PRODUCTION',
        invoiceNumber: undefined,
        supplier: 'Self-Produced',
      };

      // Ensure no undefined values
      const cleanLog = Object.fromEntries(Object.entries(logData).filter(([_, v]) => v !== undefined));

      await logTransaction({
        log: cleanLog as any,
        newQuantity: selectedItem.currentQuantity + data.bagsProduced
      });

      // Auto-log as Feed Cost expense in Finance
      if (data.totalCost > 0) {
        const financePayload = {
          type: 'EXPENSE' as const,
          category: 'Feed Cost' as const,
          amount: data.totalCost,
          date: data.date,
          description: `Local production: ${data.bagsProduced} bags (${data.targetBagSizeKg}kg) of ${data.recipeName}. Cost/bag: ₦${data.costPerBag.toLocaleString()}`,
          paymentMethod: 'Cash' as const,
          status: 'Paid' as const,
        };
        await addTransaction(financePayload);
      }

      // Reset inventory selection
      setValue('inventoryItemId', '');
      toast.success(`${data.bagsProduced} bags added to inventory & cost logged in Finance!`);
      
    } catch (e) {
      console.error('Failed to save to inventory', e);
      toast.error('Failed to save. Please try again.');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in-up">
      {/* Templates */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Load Standard Recipe (1 Ton)</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide hide-scrollbar">
          {Object.keys(STANDARD_RECIPES).map(recipe => (
            <button
              key={recipe}
              type="button"
              onClick={() => loadRecipe(recipe as keyof typeof STANDARD_RECIPES)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              {recipe.replace(' Mash', '')}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Basic Info */}
        <div className="premium-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Calculator className="w-5 h-5" />
            <h3 className="font-bold">Production Setup</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recipe Name</Label>
              <Input {...register('recipeName')} placeholder="e.g. Layer Mash" />
              {errors.recipeName && <p className="text-[10px] text-destructive">{errors.recipeName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Target Bag Size (kg)</Label>
              <Input type="number" step="0.1" {...register('targetBagSizeKg', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Production Date</Label>
              <Input type="date" {...register('date')} />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="premium-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Beaker className="w-5 h-5" />
              <h3 className="font-bold">Ingredients & Cost</h3>
            </div>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start relative bg-muted/30 p-3 rounded-xl border border-border/50">
                <div className="col-span-5 space-y-1">
                  <Label className="text-[10px]">Ingredient</Label>
                  <Input {...register(`ingredients.${index}.name`)} placeholder="e.g. Maize" className="h-8 text-sm" />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-[10px]">Qty (kg)</Label>
                  <Input type="number" step="0.1" {...register(`ingredients.${index}.quantityKg`, { valueAsNumber: true })} className="h-8 text-sm" />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-[10px]">Cost (₦)</Label>
                  <Input type="number" {...register(`ingredients.${index}.totalPrice`, { valueAsNumber: true })} className="h-8 text-sm" />
                </div>
                <div className="col-span-1 pt-6 flex justify-center">
                  <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => append({ id: crypto.randomUUID(), name: '', quantityKg: 0, totalPrice: 0 })}
            className="w-full mt-4 text-primary border-primary/20 hover:bg-primary/5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ingredient
          </Button>
        </div>

        {/* Overhead Costs */}
        <div className="premium-card rounded-2xl p-5 border border-border">
          <h3 className="font-bold text-foreground mb-4">Overhead Costs (₦)</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Milling</Label>
              <Input type="number" {...register('overheadCosts.milling', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Transport</Label>
              <Input type="number" {...register('overheadCosts.transport', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Other</Label>
              <Input type="number" {...register('overheadCosts.other', { valueAsNumber: true })} />
            </div>
          </div>
        </div>

        {/* Results Summary & Save */}
        <div 
          className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, hsl(231,48%,48%), hsl(231,50%,38%))' }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Weight</p>
              <p className="text-2xl font-extrabold text-white">{formValues.totalWeightKg?.toLocaleString()} kg</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Cost</p>
              <p className="text-2xl font-extrabold text-white">₦ {formValues.totalCost?.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-500/30 rounded-2xl p-4 border border-emerald-500/50 backdrop-blur-sm col-span-2 flex justify-between items-center">
              <div>
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Bags Produced</p>
                <p className="text-2xl font-extrabold text-white">{formValues.bagsProduced} <span className="text-sm font-medium text-emerald-200 ml-1">x {formValues.targetBagSizeKg}kg</span></p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Cost Per Bag</p>
                <p className="text-xl font-extrabold text-white">₦ {formValues.costPerBag?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-3 bg-black/20 p-4 rounded-2xl border border-white/10">
            <Label className="text-white">Transfer to Inventory</Label>
            <select
              {...register('inventoryItemId')}
              className="flex h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <option value="" className="text-black">Select Feed Inventory Item...</option>
              {feedItems.map(item => (
                <option key={item.id} value={item.id} className="text-black">
                  {item.name} (Current: {item.currentQuantity} bags)
                </option>
              ))}
            </select>
            {errors.inventoryItemId && <p className="text-xs text-rose-300">{errors.inventoryItemId.message}</p>}

            <Button 
              type="submit" 
              disabled={isSubmitting || !formValues.inventoryItemId || formValues.bagsProduced <= 0}
              className="w-full h-12 mt-2 bg-white text-indigo-900 hover:bg-white/90 font-bold"
            >
              {isSubmitting ? 'Transferring...' : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save & Add {formValues.bagsProduced || 0} Bags to Inventory
                </>
              )}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
