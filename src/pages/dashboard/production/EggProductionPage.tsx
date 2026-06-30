import { useState } from 'react';
import { useEggProduction } from '@/features/production/hooks/useEggProduction';
import { useEggStore } from '@/features/production/hooks/useEggStore';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { Plus, Egg, TrendingUp, CalendarDays, Warehouse, PackagePlus, ShoppingCart, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EggProductionForm } from '@/features/production/components/EggProductionForm';
import { EggStoreForm } from '@/features/production/components/EggStoreForm';
import { format } from 'date-fns';
import { exportToCsv, exportTableToPdf } from '@/lib/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function EggProductionPage() {
  const { records, isLoading, addRecord, updateRecord, deleteRecord } = useEggProduction();
  const { entries: eggStoreEntries, addEntry: addStoreEntry, isSubmitting: isStoreSubmitting } = useEggStore();
  const { transactions } = useFinance();
  const { batches, isLoading: batchesLoading } = useBatches();
  const { items, logs: inventoryLogs } = useInventory();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deletingRecord, setDeletingRecord] = useState<any>(null);

  const handleAddRecord = (data: any) => {
    if (editingRecord) {
      updateRecord({ id: editingRecord.id, ...data }).catch(console.error);
      setEditingRecord(null);
    } else {
      addRecord(data).catch(console.error);
      setIsAddOpen(false);
    }
  };

  const totalEggs = records.reduce((s, r) => s + (r.totalEggs || 0), 0);
  const totalCrates = records.reduce((s, r) => s + (r.totalCrates || 0), 0);
  const totalDefective = records.reduce((s, r) => s + (r.crackedEggs || 0) + (r.brokenEggs || 0) + (r.dirtyEggs || 0) + (r.softShellEggs || 0), 0);
  const goodEggs = totalEggs - totalDefective;
  const storedCrates = eggStoreEntries.reduce((s, entry) => s + (entry.crates || 0), 0);
  const soldCrates = transactions
    .filter(t => t.type === 'INCOME' && t.category === 'Egg Sales')
    .reduce((s, t) => s + (t.quantity || 0), 0);
  const availableCrates = Math.max(0, storedCrates - soldCrates);

  // Performance Metrics (Today)
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today);
  const todayEggs = todayRecords.reduce((s, r) => s + r.totalEggs, 0);
  const activeLayingBirds = batches.filter(b => b.status === 'LAYING').reduce((s, b) => s + b.currentQuantity, 0);
  const layRate = activeLayingBirds > 0 ? ((todayEggs / activeLayingBirds) * 100).toFixed(1) : '0.0';

  const todayFeedLogs = inventoryLogs.filter(l => l.date === today && l.type === 'OUT');
  const todayFeedKg = todayFeedLogs.reduce((sum, log) => {
    const item = items.find(i => i.id === log.itemId);
    if (item?.category === 'Feed') return sum + log.quantity;
    return sum;
  }, 0);
  const todayFcr = todayEggs > 0 ? Math.round((todayFeedKg * 1000) / todayEggs) : 0;

  const handleAddStoreEntry = (data: any) => {
    addStoreEntry(data).catch(console.error);
    setIsStoreOpen(false);
  };

  const handleDeleteRecord = async () => {
    if (!deletingRecord) return;
    try {
      await deleteRecord(deletingRecord.id);
      setDeletingRecord(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    const exportData = records.map(r => ({
      Date: format(new Date(r.date), 'yyyy-MM-dd'),
      Batch: r.batchName,
      'Total Eggs': r.totalEggs,
      'Good Eggs': r.normalEggs,
      'Cracked': r.crackedEggs || 0,
      'Broken': r.brokenEggs || 0,
      'Soft Shell': r.softShellEggs || 0,
      'Dirty': r.dirtyEggs || 0,
      'Total Crates': r.totalCrates
    }));

    if (type === 'csv') {
      exportToCsv(exportData, 'Egg_Production_Logs');
    } else {
      const headers = ['Date', 'Batch', 'Total', 'Good', 'Cracked', 'Broken', 'Soft', 'Dirty', 'Crates'];
      const pdfData = exportData.map(r => Object.values(r));
      exportTableToPdf(pdfData, headers, 'Egg_Production_Logs', 'Egg Production Logs');
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">
      {/* Summary */}
      <div 
        className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, hsl(38,92%,50%), hsl(34,100%,45%))' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 right-12 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute top-8 left-8 w-8 h-8 bg-white/20 rounded-full" />
        
        <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Egg className="w-5 h-5 text-amber-100" />
            <p className="text-amber-100/90 text-sm font-bold uppercase tracking-widest">Total Collected</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm flex flex-col items-center border border-white/10">
              <p className="text-[9px] text-amber-100 uppercase font-bold tracking-widest leading-tight">Lay Rate</p>
              <p className="text-sm font-bold text-white leading-tight">{layRate}%</p>
            </div>
            <div className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm flex flex-col items-center border border-white/10" title="Feed Conversion Ratio (Grams of Feed per Egg Today)">
              <p className="text-[9px] text-amber-100 uppercase font-bold tracking-widest leading-tight">FCR Today</p>
              <p className="text-sm font-bold text-white leading-tight">{todayFcr ? `${todayFcr}g` : '--'}</p>
            </div>
          </div>
        </div>
        <p className="text-5xl font-extrabold text-white mt-1 animate-count-up drop-shadow-md">{totalEggs.toLocaleString()}</p>
        <div className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full border border-white/10 backdrop-blur-sm">
          <p className="text-white text-xs font-bold">{totalCrates.toFixed(1)} <span className="opacity-80">crates</span></p>
        </div>
        
        <div className="mt-6 flex gap-5 pt-5 border-t border-white/20">
          <div className="flex-1">
            <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest mb-1">Good</p>
            <p className="text-white font-bold text-lg">{goodEggs.toLocaleString()}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1 text-center">
            <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest mb-1">Defective</p>
            <p className="text-white font-bold text-lg">{totalDefective.toLocaleString()}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1 text-right">
            <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest mb-1">Logs</p>
            <p className="text-white font-bold text-lg">{records.length}</p>
          </div>
        </div>
      </div>

      {/* Egg Store */}
      <div className="premium-card border border-border rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <Warehouse className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Egg Store</p>
              <p className="text-3xl font-extrabold text-foreground mt-0.5">{availableCrates.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">crates remaining</p>
            </div>
          </div>
          <button
            onClick={() => setIsStoreOpen(true)}
            className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 border border-blue-100 dark:border-blue-900/30 touch-active"
          >
            <PackagePlus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <PackagePlus className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Added</p>
            </div>
            <p className="text-lg font-extrabold text-foreground">{storedCrates.toFixed(1)}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Sold</p>
            </div>
            <p className="text-lg font-extrabold text-foreground">{soldCrates.toFixed(1)}</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-3">
          Egg Sales entered in Finance deduct crates from this store automatically.
        </p>
      </div>

      {/* Records */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Recent Collections</p>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors touch-active">
                <Download className="w-3.5 h-3.5" />
                EXPORT
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer font-medium text-xs py-2">
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer font-medium text-xs py-2">
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading || batchesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border h-28 animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, hsl(38,92%,50%), hsl(34,100%,45%))' }}>
              <Egg className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground">No egg records yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Start logging your daily egg collections to track production.</p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, hsl(38,92%,50%), hsl(34,100%,45%))' }}
            >
              Log First Collection
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const defective = (record.crackedEggs || 0) + (record.brokenEggs || 0) + (record.dirtyEggs || 0) + (record.softShellEggs || 0);
              const qualityPct = record.totalEggs > 0
                ? Math.round(((record.totalEggs - defective) / record.totalEggs) * 100)
                : 100;

              return (
                <div key={record.id} className="premium-card rounded-2xl border border-border p-4 touch-active active:scale-98 transition-transform duration-100">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-200 dark:shadow-amber-900/40"
                         style={{ background: 'linear-gradient(135deg, hsl(38,92%,50%), hsl(34,100%,45%))' }}>
                      <Egg className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-foreground text-base truncate">{record.batchName}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {format(new Date(record.date), 'dd MMM')}
                          </div>
                          <button onClick={() => setEditingRecord(record)} className="text-[10px] font-bold px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors">
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingRecord(record)}
                            className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                            aria-label="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5 text-center border border-amber-100 dark:border-amber-900/30">
                          <p className="text-[10px] text-amber-700/80 dark:text-amber-500 font-bold uppercase tracking-wider mb-0.5">Total</p>
                          <p className="text-base font-extrabold text-amber-900 dark:text-amber-400">{record.totalEggs}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5 text-center border border-emerald-100 dark:border-emerald-900/30">
                          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-500 font-bold uppercase tracking-wider mb-0.5">Good</p>
                          <p className="text-base font-extrabold text-emerald-900 dark:text-emerald-400">{record.normalEggs}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5 text-center border border-blue-100 dark:border-blue-900/30">
                          <p className="text-[10px] text-blue-700/80 dark:text-blue-500 font-bold uppercase tracking-wider mb-0.5">Crates</p>
                          <p className="text-base font-extrabold text-blue-900 dark:text-blue-400">{record.totalCrates}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                            style={{ width: `${qualityPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {qualityPct}% quality
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      {records.length > 0 && (
        <button
          onClick={() => setIsAddOpen(true)}
          className="fixed w-14 h-14 rounded-full flex items-center justify-center touch-active active:scale-95 transition-transform duration-100 z-20 shadow-xl border border-white/20"
          style={{ 
            bottom: 'calc(4.5rem + var(--safe-area-bottom) + 1rem)', 
            right: '1.25rem',
            background: 'linear-gradient(135deg, hsl(38,92%,50%), hsl(34,100%,45%))',
            boxShadow: '0 8px 32px hsl(34,100%,45% / 0.4)'
          }}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      <Dialog open={isAddOpen || !!editingRecord} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditingRecord(null);
        }
      }}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingRecord ? 'Edit Production' : 'Log Production'}</DialogTitle>
          </DialogHeader>
          <EggProductionForm batches={batches} initialData={editingRecord} onSubmit={handleAddRecord} isLoading={false} />
        </DialogContent>
      </Dialog>

      <Dialog open={isStoreOpen} onOpenChange={setIsStoreOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Eggs to Store</DialogTitle>
          </DialogHeader>
          <EggStoreForm onSubmit={handleAddStoreEntry} isLoading={isStoreSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingRecord} onOpenChange={(open) => !open && setDeletingRecord(null)}>
        <DialogContent className="max-w-sm rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">Delete Record?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Delete the egg log for <span className="font-bold text-foreground">{deletingRecord?.batchName}</span> on <span className="font-bold text-foreground">{deletingRecord?.date ? format(new Date(deletingRecord.date), 'dd MMM yyyy') : ''}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingRecord(null)}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
