import { useState } from 'react';
import type { InventoryItem } from '@/schemas/inventorySchemas';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { InventoryItemForm } from '@/features/inventory/components/InventoryItemForm';
import { InventoryTransactionForm } from '@/features/inventory/components/InventoryTransactionForm';
import { Plus, PackageSearch, PackageOpen, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Maps inventory category to the correct Finance expense category
const CATEGORY_TO_FINANCE: Record<string, string> = {
  'Feed': 'Feed Cost',
  'Medication': 'Medication',
  'Additive': 'Other',
  'Equipment': 'Equipment',
  'Other': 'Other',
};

export default function InventoryPage() {
  const { items, isLoading, addItem, updateItem, logTransaction, isSubmitting } = useInventory();
  const { addTransaction } = useFinance();
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleAddItem = async (data: any) => {
    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id!, ...data });
        setEditingItem(null);
      } else {
        await addItem(data);
        setIsAddItemOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransaction = async (data: any) => {
    if (!selectedItem) return;
    
    // Calculate new quantity
    let newQuantity = selectedItem.currentQuantity;
    if (data.type === 'IN') {
      newQuantity += data.quantity;
    } else {
      newQuantity -= data.quantity;
      if (newQuantity < 0) newQuantity = 0;
    }

    // Strip totalCost from the inventory log payload (not part of the schema)
    const { totalCost, ...logData } = data;
    const cleanLog = Object.fromEntries(Object.entries(logData).filter(([_, v]) => v !== undefined && v !== '' && !Number.isNaN(v)));

    try {
      await logTransaction({ log: cleanLog as any, newQuantity });

      // Auto-log Finance expense if cost was provided and it's a restock
      if (data.type === 'IN' && totalCost && Number(totalCost) > 0) {
        const financeCategory = CATEGORY_TO_FINANCE[selectedItem.category] || 'Other';
        await addTransaction({
          type: 'EXPENSE',
          category: financeCategory as any,
          amount: Number(totalCost),
          date: data.date,
          description: `Restock: ${data.quantity} ${selectedItem.unit} of ${selectedItem.name}`,
          paymentMethod: 'Cash',
          status: 'Paid',
        });
        toast.success(`Restocked & ₦${Number(totalCost).toLocaleString()} logged as ${financeCategory} expense!`);
      } else {
        toast.success(data.type === 'IN' ? 'Stock restocked!' : 'Usage logged!');
      }

      setSelectedItem(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save. Please try again.');
    }
  };

  const lowStockItems = items.filter(i => i.currentQuantity <= i.reorderLevel);

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">
      {/* Summary */}
      <div 
        className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, hsl(231,48%,48%), hsl(231,50%,38%))' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 right-12 w-24 h-24 bg-white/10 rounded-full" />
        
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <Boxes className="w-5 h-5 text-indigo-100" />
          <p className="text-indigo-100/90 text-sm font-bold uppercase tracking-widest">Inventory Status</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Items Tracked</p>
            <p className="text-3xl font-extrabold text-white animate-count-up">{items.length}</p>
          </div>
          <div className="bg-rose-500/30 rounded-2xl p-4 border border-rose-500/50 backdrop-blur-sm">
            <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mb-1">Low Stock</p>
            <p className="text-3xl font-extrabold text-white animate-count-up flex items-center gap-2">
              {lowStockItems.length}
              {lowStockItems.length > 0 && <AlertTriangle className="w-5 h-5 text-rose-300 animate-pulse" />}
            </p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Current Stock</p>
          <button onClick={() => setIsAddItemOpen(true)} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">+ Add New Type</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border h-28 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, hsl(231,48%,48%), hsl(231,50%,38%))' }}>
              <PackageSearch className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground">No inventory items</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Start tracking your feed, medications, and supplies.</p>
            </div>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="mt-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, hsl(231,48%,48%), hsl(231,50%,38%))' }}
            >
              Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isLowStock = item.currentQuantity <= item.reorderLevel;
              const percentage = item.reorderLevel > 0 
                ? Math.min(100, Math.round((item.currentQuantity / (item.reorderLevel * 2)) * 100)) 
                : 100;

              return (
                <div key={item.id} className={`premium-card rounded-2xl border p-4 touch-active active:scale-98 transition-transform duration-100 ${isLowStock ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10' : 'border-border'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isLowStock 
                        ? 'bg-gradient-to-br from-rose-400 to-red-500 shadow-rose-200 dark:shadow-rose-900/40' 
                        : 'bg-gradient-to-br from-indigo-400 to-blue-500 shadow-indigo-200 dark:shadow-indigo-900/40'
                    }`}>
                      <PackageOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-foreground text-base truncate">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem(item)} className="text-[10px] font-bold px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors">
                            Edit
                          </button>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/60 dark:bg-muted/30 px-2.5 py-1 rounded-full">{item.category}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className={`text-2xl font-extrabold ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                            {item.currentQuantity.toLocaleString()} <span className="text-sm font-semibold opacity-70">{item.unit}</span>
                          </p>
                          {isLowStock && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low stock! (Reorder: {item.reorderLevel})</p>}
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedItem({ ...item, _action: 'OUT' } as any)}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                          >
                            <ArrowUpFromLine className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedItem({ ...item, _action: 'IN' } as any)}
                            className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-900/40"
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${isLowStock ? 'bg-gradient-to-r from-rose-400 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-gradient-to-r from-indigo-400 to-blue-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB for new items */}
      {items.length > 0 && (
        <button
          onClick={() => setIsAddItemOpen(true)}
          className="fixed w-14 h-14 rounded-full flex items-center justify-center touch-active active:scale-95 transition-transform duration-100 z-20 shadow-xl border border-white/20"
          style={{ 
            bottom: 'calc(4.5rem + var(--safe-area-bottom) + 1rem)', 
            right: '1.25rem',
            background: 'linear-gradient(135deg, hsl(231,48%,48%), hsl(231,50%,38%))',
            boxShadow: '0 8px 32px hsl(231,50%,38% / 0.4)'
          }}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      <Dialog open={isAddItemOpen || !!editingItem} onOpenChange={(open) => {
        if (!open) { setIsAddItemOpen(false); setEditingItem(null); }
      }}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <InventoryItemForm initialData={editingItem || undefined} onSubmit={handleAddItem} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Log {((selectedItem as any)?._action || 'IN') === 'IN' ? 'Restock' : 'Consumption'}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <InventoryTransactionForm 
              item={selectedItem} 
              onSubmit={handleTransaction} 
              isLoading={isSubmitting} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
