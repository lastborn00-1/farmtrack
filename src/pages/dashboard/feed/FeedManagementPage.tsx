import { useState } from 'react';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { useEggProduction } from '@/features/production/hooks/useEggProduction';
import { Plus, Wheat, TrendingDown, Calendar, AlertTriangle, ArrowUpFromLine, Trash2, Edit2, Scale, Beaker } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LocalFeedCalculator } from '@/features/feed/components/LocalFeedCalculator';
import { format } from 'date-fns';
import { toast } from 'sonner';

const EMPTY_FORM = {
  itemId: '',
  itemName: '',
  batchId: '',
  batchName: '',
  quantity: '' as number | '',
  unit: 'Kg',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function FeedManagementPage() {
  const { items, logs, isLoading, logTransaction, deleteLog, updateLog } = useInventory();
  const { batches } = useBatches();
  const { records: eggRecords } = useEggProduction();

  const feedItems = items.filter(i => i.category === 'Feed');
  const feedLogs = logs
    .filter(l => {
      const item = items.find(i => i.id === l.itemId);
      return item?.category === 'Feed' && l.type === 'OUT';
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [activeTab, setActiveTab] = useState<'inventory' | 'fcr' | 'production'>('inventory');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingOldQuantity, setEditingOldQuantity] = useState<number>(0);
  const [form, setForm] = useState(EMPTY_FORM);

  const openDialog = (presetItemId?: string, logToEdit?: any) => {
    if (logToEdit) {
      setEditingLogId(logToEdit.id!);
      setEditingOldQuantity(logToEdit.quantity);
      setForm({
        itemId: logToEdit.itemId,
        itemName: logToEdit.itemName,
        batchId: logToEdit.referenceId || '',
        batchName: logToEdit.referenceId ? batches.find(b => b.id === logToEdit.referenceId)?.batchName || '' : '',
        quantity: logToEdit.quantity,
        unit: items.find(i => i.id === logToEdit.itemId)?.unit || 'Kg',
        date: logToEdit.date,
        notes: logToEdit.notes || '',
      });
    } else {
      setEditingLogId(null);
      setEditingOldQuantity(0);
      const preset = presetItemId ? feedItems.find(i => i.id === presetItemId) : undefined;
      setForm({
        ...EMPTY_FORM,
        date: new Date().toISOString().split('T')[0],
        ...(preset ? { itemId: preset.id!, itemName: preset.name, unit: preset.unit || 'Kg' } : {}),
      });
    }
    setIsLogOpen(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.itemId || !form.quantity || Number(form.quantity) <= 0) {
      toast.error('Please select a feed type and enter a quantity.');
      return;
    }
    const item = feedItems.find(i => i.id === form.itemId);
    if (!item) return;
    const qty = Number(form.quantity);
    
    if (editingLogId) {
      const logPayload: any = {
        itemId: form.itemId,
        itemName: form.itemName,
        quantity: qty,
        date: form.date,
      };
      if (form.batchId) logPayload.referenceId = form.batchId;
      if (form.notes) logPayload.notes = form.notes;

      updateLog({
        logId: editingLogId,
        log: logPayload,
        oldQuantity: editingOldQuantity,
        newQuantity: qty
      }).then(() => toast.success('Feed consumption updated!')).catch(e => {
        toast.error('Failed to update. ' + e.message);
      });
    } else {
      const newQty = Math.max(0, item.currentQuantity - qty);
      const logPayload: any = {
        itemId: form.itemId,
        itemName: form.itemName,
        type: 'OUT',
        quantity: qty,
        date: form.date,
      };
      if (form.batchId) logPayload.referenceId = form.batchId;
      if (form.notes) logPayload.notes = form.notes;

      logTransaction({
        log: logPayload,
        newQuantity: newQty,
      }).then(() => toast.success('Feed consumption logged!')).catch(e => {
        toast.error('Failed to log. ' + e.message);
      });
    }
    setIsLogOpen(false);
    setForm(EMPTY_FORM);
    setEditingLogId(null);
  };

  const handleDelete = async (log: { id?: string; itemId: string; quantity: number }) => {
    if (!log.id) return;
    if (!confirm('Delete this feed log? The quantity will be restored.')) return;
    setDeletingId(log.id);
    try {
      await deleteLog({ logId: log.id, itemId: log.itemId, quantity: log.quantity });
      toast.success('Feed log deleted and stock restored.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete log.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalConsumedToday = feedLogs
    .filter(l => l.date === new Date().toISOString().split('T')[0])
    .reduce((s, l) => s + l.quantity, 0);
  const totalFeedStock = feedItems.reduce((s, i) => s + i.currentQuantity, 0);
  const lowStockFeed = feedItems.filter(i => i.currentQuantity <= i.reorderLevel);
  const primaryUnit = feedItems.length > 0 ? feedItems[0].unit || 'Units' : '';

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">
      {/* Hero */}
      <div
        className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, hsl(38,85%,50%), hsl(30,90%,42%))' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 right-12 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <Wheat className="w-5 h-5 text-amber-100" />
          <p className="text-amber-100/90 text-sm font-bold uppercase tracking-widest">Feed Overview</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
            <p className="text-amber-100 text-[9px] font-bold uppercase tracking-widest mb-1">Total Stock</p>
            <p className="text-xl font-extrabold text-white">{totalFeedStock.toLocaleString()}<span className="text-xs font-medium opacity-70 ml-1">{primaryUnit}</span></p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
            <p className="text-amber-100 text-[9px] font-bold uppercase tracking-widest mb-1">Today Used</p>
            <p className="text-xl font-extrabold text-white">{totalConsumedToday}<span className="text-xs font-medium opacity-70 ml-1">{primaryUnit}</span></p>
          </div>
          <div className={`rounded-2xl p-3 border ${lowStockFeed.length > 0 ? 'bg-rose-500/30 border-rose-400/50' : 'bg-white/10 border-white/20'}`}>
            <p className="text-amber-100 text-[9px] font-bold uppercase tracking-widest mb-1">Low Stock</p>
            <p className="text-xl font-extrabold text-white flex items-center gap-1">
              {lowStockFeed.length}
              {lowStockFeed.length > 0 && <AlertTriangle className="w-4 h-4 text-rose-300" />}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide hide-scrollbar">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 min-w-max flex items-center justify-center gap-2 py-3 px-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'inventory' 
              ? 'bg-background shadow-md text-foreground border border-border scale-[0.98]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wheat className="w-4 h-4" /> Feed & Logs
        </button>
        <button
          onClick={() => setActiveTab('fcr')}
          className={`flex-1 min-w-max flex items-center justify-center gap-2 py-3 px-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'fcr' 
              ? 'bg-background shadow-md text-foreground border border-border scale-[0.98]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scale className="w-4 h-4" /> Performance (FCR)
        </button>
        <button
          onClick={() => setActiveTab('production')}
          className={`flex-1 min-w-max flex items-center justify-center gap-2 py-3 px-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'production' 
              ? 'bg-background shadow-md text-foreground border border-border scale-[0.98]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Beaker className="w-4 h-4" /> Local Production
        </button>
      </div>

      {activeTab === 'inventory' && (
        <>
          {/* Feed Stock */}
          <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Feed Stock</p>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="premium-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-foreground">No feed items tracked</p>
            <p className="text-xs text-muted-foreground mt-1">Go to Inventory → Add Item → Category: Feed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedItems.map(item => {
              const isLow = item.currentQuantity <= item.reorderLevel;
              const pct = item.reorderLevel > 0 ? Math.min(100, Math.round((item.currentQuantity / (item.reorderLevel * 3)) * 100)) : 60;
              return (
                <div key={item.id} className={`premium-card rounded-2xl border p-4 ${isLow ? 'border-rose-200 dark:border-rose-900/50' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-extrabold ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                        {item.currentQuantity.toLocaleString()}
                      </p>
                      {isLow && (
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 justify-end">
                          <AlertTriangle className="w-3 h-3" />Low!
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-semibold">Reorder at: {item.reorderLevel} {item.unit}</span>
                    <button
                      onClick={() => openDialog(item.id)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1"
                    >
                      <ArrowUpFromLine className="w-3 h-3" /> Log Usage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Consumption Log */}
      {feedLogs.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Consumption History</p>
          <div className="space-y-2">
            {feedLogs.slice(0, 20).map((log, i) => (
              <div key={log.id ?? i} className="premium-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{log.itemName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.date), 'dd MMM yyyy')}
                      {log.notes && <span className="opacity-60 truncate max-w-[100px]"> · {log.notes}</span>}
                    </p>
                  </div>
                  <p className="text-rose-600 dark:text-rose-400 font-extrabold text-base flex-shrink-0">
                    -{log.quantity} <span className="text-xs font-semibold opacity-70">{items.find(i => i.id === log.itemId)?.unit || 'Kg'}</span>
                  </p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openDialog(undefined, log)}
                      disabled={deletingId === log.id}
                      className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-40"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(log as any)}
                      disabled={deletingId === log.id}
                      className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
      )}

      {activeTab === 'fcr' && (
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Batch Feed Efficiency</p>
          <div className="space-y-4">
            {batches.map(batch => {
              const batchFeedLogs = feedLogs.filter(l => l.referenceId === batch.id);
              const lifetimeFeedKg = batchFeedLogs.reduce((sum, l) => sum + l.quantity, 0);

              const batchEggRecords = eggRecords.filter(r => r.batchId === batch.id);
              const lifetimeEggs = batchEggRecords.reduce((sum, r) => sum + r.totalEggs, 0);

              const fcr = lifetimeEggs > 0 ? Math.round((lifetimeFeedKg * 1000) / lifetimeEggs) : 0;
              
              const ageInDays = batch.arrivalDate ? Math.floor((new Date().getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 3600 * 24)) : 0;
              const daysToDivide = Math.max(1, ageInDays);
              const dailyFeedIntakePerBird = (batch.currentQuantity > 0) 
                ? Math.round((lifetimeFeedKg * 1000) / (batch.currentQuantity * daysToDivide)) 
                : 0;

              return (
                <div key={batch.id} className="premium-card border border-border rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-foreground text-lg">{batch.batchName}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{batch.status} · {batch.currentQuantity} BIRDS</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{lifetimeFeedKg.toLocaleString()} {primaryUnit}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Feed Consumed</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                    <div className="bg-emerald-50/60 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Lifetime FCR</p>
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        {fcr > 0 ? `${fcr}g feed/egg` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-500 mt-1">Grams of feed per egg produced</p>
                    </div>
                    <div className="bg-blue-50/60 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Daily Intake</p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                        {dailyFeedIntakePerBird > 0 ? `${dailyFeedIntakePerBird}g/bird` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-blue-600 dark:text-blue-500 mt-1">Average daily feed per live bird</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {batches.length === 0 && (
              <div className="premium-card border border-border rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-foreground">No active batches</p>
                <p className="text-xs text-muted-foreground mt-1">Create a batch to see feed performance metrics.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <LocalFeedCalculator />
      )}

      {/* FAB */}
      <button
        onClick={() => openDialog()}
        className="fixed w-14 h-14 rounded-full flex items-center justify-center touch-active active:scale-95 transition-transform duration-100 z-20 shadow-xl border border-white/20"
        style={{
          bottom: 'calc(4.5rem + var(--safe-area-bottom) + 1rem)',
          right: '1.25rem',
          background: 'linear-gradient(135deg, hsl(38,85%,50%), hsl(30,90%,42%))',
          boxShadow: '0 8px 32px hsl(30,90%,42% / 0.4)',
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Log Feed Dialog */}
      <Dialog open={isLogOpen} onOpenChange={(open) => { if (!open) setIsLogOpen(false); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingLogId ? 'Edit Consumption' : 'Log Feed Consumption'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">

            <div>
              <label className="text-sm font-semibold block mb-1.5">Feed Type <span className="text-rose-500">*</span></label>
              <select
                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm"
                value={form.itemId}
                onChange={e => {
                  const item = feedItems.find(i => i.id === e.target.value);
                  setForm(f => ({ ...f, itemId: e.target.value, itemName: item?.name || '', unit: item?.unit || 'Kg' }));
                }}
              >
                <option value="">Select feed type...</option>
                {feedItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.currentQuantity} {item.unit} in stock)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Batch (Optional)</label>
              <select
                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm"
                value={form.batchId}
                onChange={e => {
                  const batch = batches.find(b => b.id === e.target.value);
                  setForm(f => ({ ...f, batchId: e.target.value, batchName: batch?.batchName || '' }));
                }}
              >
                <option value="">All flocks / unspecified</option>
                {batches.filter(b => ['LAYING', 'GROWING', 'BROODING'].includes(b.status)).map(b => (
                  <option key={b.id} value={b.id}>{b.batchName} ({b.currentQuantity?.toLocaleString()} birds)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Quantity <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Date</label>
                <input
                  type="date"
                  className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm"
                  value={form.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            {/* Feed Sanity Check Warning */}
            {(() => {
              const selectedBatch = form.batchId ? batches.find(b => b.id === form.batchId) : null;
              const qty = Number(form.quantity) || 0;
              // Standard benchmark: more than 300g/bird/day is suspicious for any batch type
              if (selectedBatch && selectedBatch.currentQuantity > 0 && qty > 0) {
                const unit = form.unit || 'Kg';
                const qtyInKg = unit === 'Bags' ? qty * 25 : qty; // assume 25kg bags
                const gPerBird = (qtyInKg * 1000) / selectedBatch.currentQuantity;
                if (gPerBird > 300) {
                  return (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        ⚠️ That's {Math.round(gPerBird)}g per bird for {selectedBatch.currentQuantity} birds. Typical max is ~300g/bird/day. Please double-check the quantity.
                      </p>
                    </div>
                  );
                }
              }
              return null;
            })()}

            <div>
              <label className="text-sm font-semibold block mb-1.5">Notes (Optional)</label>
              <textarea
                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm min-h-[70px] resize-none"
                placeholder="e.g. Morning feeding, Batch A only..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsLogOpen(false)}
                disabled={false}
                className="flex-1 py-3.5 rounded-xl font-bold text-muted-foreground bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.itemId || !form.quantity || Number(form.quantity) <= 0}
                className="flex-1 py-3.5 rounded-xl font-bold text-white disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, hsl(38,85%,50%), hsl(30,90%,42%))' }}
              >
                {editingLogId ? 'Update Log' : 'Save Log'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
