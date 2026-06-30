import { useState } from 'react';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { useHouses } from '@/features/farm/hooks/useHouses';
import { useHealth } from '@/features/health/hooks/useHealth';
import { useAuthStore } from '@/store/authStore';
import { Plus, Layers, Calendar, Bird, Clock, Egg, AlertTriangle, Syringe, Pill, CheckCircle2, Trash2, Skull } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BatchForm } from '@/features/farm/components/batches/BatchForm';
import { BatchClosureDialog } from '@/features/farm/components/batches/BatchClosureDialog';
import { format } from 'date-fns';
import { getFarmDocuments, addFarmDocument, updateFarmDocument } from '@/lib/firestore';
import {
  calcCurrentAgeWeeks,
  getAgeDisplayText,
  getLifecycleStage,
  getStageColors,
  getLayingLifecycle,
  getLifecycleProgress,
  getCountdownText,
} from '@/lib/birdAge';

const acquisitionBadge: Record<string, { bg: string; text: string; darkBg: string }> = {
  DOC: { bg: 'bg-amber-100', text: 'text-amber-800 dark:text-amber-400', darkBg: 'dark:bg-amber-900/30' },
  PULLET: { bg: 'bg-blue-100', text: 'text-blue-800 dark:text-blue-400', darkBg: 'dark:bg-blue-900/30' },
  POL: { bg: 'bg-violet-100', text: 'text-violet-800 dark:text-violet-400', darkBg: 'dark:bg-violet-900/30' },
  STARTED_LAYER: { bg: 'bg-emerald-100', text: 'text-emerald-800 dark:text-emerald-400', darkBg: 'dark:bg-emerald-900/30' },
};

export default function BatchesPage() {
  const { activeFarm } = useAuthStore();
  const { batches, isLoading, addBatch, updateBatch, deleteBatch } = useBatches();
  const { houses, isLoading: housesLoading } = useHouses();
  const { vaccines } = useHealth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [detailsBatch, setDetailsBatch] = useState<any>(null);
  const [closureBatch, setClosureBatch] = useState<{ id: string; name: string } | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<{ id: string; name: string } | null>(null);
  const [mortalityBatch, setMortalityBatch] = useState<any>(null);
  const [mortalityForm, setMortalityForm] = useState({ type: 'mortality' as 'mortality' | 'cull', count: '' as number | '', notes: '' });

  if (!activeFarm) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
          <Layers className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Farm profile not loaded. Please refresh.</p>
      </div>
    );
  }

  const handleAddBatch = (data: any) => {
    if (editingBatch) {
      updateBatch({
        id: editingBatch.id,
        ...data,
      }).catch(console.error);
      setEditingBatch(null);
    } else {
      addBatch(data).catch(console.error);
      setIsAddOpen(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deletingBatch) return;
    try {
      await deleteBatch(deletingBatch.id);
      setDeletingBatch(null);
      if (detailsBatch?.id === deletingBatch.id) setDetailsBatch(null);
    } catch (e) {
      console.error(e);
    }
  };

  const totalBirds = batches.reduce((sum, b) => sum + (b.currentQuantity || 0), 0);
  const activeBatches = batches.filter(b => b.status === 'LAYING' || b.status === 'GROWING' || b.status === 'BROODING');

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="premium-card rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-border">
          <Layers className="w-4 h-4 text-primary" />
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Batches</p>
          <p className="text-xl font-extrabold text-foreground animate-count-up">{batches.length}</p>
        </div>
        <div className="premium-card rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-border">
          <Bird className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">Active</p>
          <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 animate-count-up">{activeBatches.length}</p>
        </div>
        <div className="premium-card rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-border">
          <span className="text-sm">🐔</span>
          <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 font-bold uppercase tracking-widest mt-0.5">Birds</p>
          <p className="text-xl font-extrabold text-blue-700 dark:text-blue-400 animate-count-up">{totalBirds.toLocaleString()}</p>
        </div>
      </div>

      {/* Batch List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Flock Inventory</p>
        </div>

        {isLoading || housesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse h-36" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Layers className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-foreground">No batches yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Register your first flock of birds to start tracking their lifecycle.</p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-transform"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Add First Batch
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => {
              const badge = acquisitionBadge[batch.acquisitionType] || acquisitionBadge.DOC;
              const isActive = ['LAYING', 'GROWING', 'BROODING'].includes(batch.status);

              return (
                <div
                  key={batch.id}
                  className="premium-card rounded-2xl border border-border p-4 touch-active active:scale-98 transition-transform duration-100"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200 dark:shadow-blue-900/40">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-base truncate">{batch.batchName}</p>
                        <p className="text-xs font-medium text-muted-foreground truncate">{batch.breedName} · {batch.houseName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setEditingBatch(batch)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingBatch({ id: batch.id!, name: batch.batchName })}
                        className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                        aria-label="Delete batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge.bg} ${badge.darkBg} ${badge.text}`}>
                      {batch.acquisitionType.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                      isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                               : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    {/* Live lifecycle stage badge */}
                    {(() => {
                      const age = calcCurrentAgeWeeks(batch.arrivalDate, batch.currentAgeWeeks);
                      const stage = getLifecycleStage(age.totalWeeks);
                      const colors = getStageColors(stage);
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${colors.bg} ${colors.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {stage}
                        </span>
                      );
                    })()}
                  </div>

                  {/* ── Bird Age & Lifecycle Strip ── */}
                  {(() => {
                    const age = calcCurrentAgeWeeks(batch.arrivalDate, batch.currentAgeWeeks);
                    const stage = getLifecycleStage(age.totalWeeks);
                    const colors = getStageColors(stage);
                    const progress = getLifecycleProgress(age.totalWeeks);
                    const milestones = getLayingLifecycle(batch.arrivalDate, batch.currentAgeWeeks);
                    const now = new Date();

                    const layingInFuture = milestones.layingStartDate && milestones.layingStartDate > now;
                    const endOfLaySoon = milestones.restockAlertDate && milestones.restockAlertDate <= now && milestones.endOfLayDate && milestones.endOfLayDate > now;

                    return (
                      <div className={`mt-3 rounded-2xl p-3 border ${colors.bg} border-border/50`}>
                        {/* Age + Progress */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-bold text-foreground">
                              {getAgeDisplayText(age.weeks, age.days)}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Wk {Math.floor(age.totalWeeks)} of 72
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Milestones */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {milestones.layingStartDate && (
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider flex items-center justify-center gap-0.5">
                                <Egg className="w-2.5 h-2.5" /> Lay Start
                              </p>
                              <p className="text-[11px] font-bold text-foreground mt-0.5">
                                {format(milestones.layingStartDate, 'dd MMM yy')}
                              </p>
                              <p className={`text-[9px] font-semibold mt-0.5 ${
                                layingInFuture ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {getCountdownText(milestones.layingStartDate)}
                              </p>
                            </div>
                          )}
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Peak</p>
                            <p className="text-[11px] font-bold text-foreground mt-0.5">
                              {milestones.peakLayingDate ? format(milestones.peakLayingDate, 'dd MMM yy') : '—'}
                            </p>
                            <p className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                              {getCountdownText(milestones.peakLayingDate)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider flex items-center justify-center gap-0.5">
                              {endOfLaySoon && <AlertTriangle className="w-2.5 h-2.5 text-orange-500" />} End of Lay
                            </p>
                            <p className="text-[11px] font-bold text-foreground mt-0.5">
                              {milestones.endOfLayDate ? format(milestones.endOfLayDate, 'dd MMM yy') : '—'}
                            </p>
                            <p className={`text-[9px] font-semibold mt-0.5 ${
                              endOfLaySoon ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-muted-foreground'
                            }`}>
                              {getCountdownText(milestones.endOfLayDate)}
                            </p>
                          </div>
                        </div>

                        {/* Alert chips */}
                        {layingInFuture && (
                          <div className="mt-2 px-2 py-1.5 bg-violet-100/60 dark:bg-violet-900/20 rounded-xl flex items-center gap-1.5">
                            <Egg className="w-3 h-3 text-violet-600" />
                            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400">
                              First eggs expected {getCountdownText(milestones.layingStartDate)}
                            </span>
                          </div>
                        )}
                        {endOfLaySoon && (
                          <div className="mt-2 px-2 py-1.5 bg-orange-100/60 dark:bg-orange-900/20 rounded-xl flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-orange-600" />
                            <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400">
                              ⚠️ End of lay {getCountdownText(milestones.endOfLayDate)} — plan restock
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Quick stats */}
                  <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-0.5">Current</p>
                      <p className="text-sm font-extrabold text-foreground">{(batch.currentQuantity || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-0.5">Initial</p>
                      <p className="text-sm font-bold text-muted-foreground">{(batch.initialQuantity || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-0.5 flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" /> Registered
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {batch.arrivalDate ? format(new Date(batch.arrivalDate), 'dd MMM') : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setDetailsBatch(batch)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl touch-active active:scale-98 transition-all group"
                      style={{ background: 'var(--gradient-card)', border: '1px solid hsl(var(--border))' }}
                    >
                      <span className="text-foreground group-hover:text-primary transition-colors">Details</span>
                    </button>
                    {isActive && (
                      <button
                        onClick={() => { setMortalityBatch(batch); setMortalityForm({ type: 'mortality', count: '', notes: '' }); }}
                        title="Log Mortality / Cull"
                        className="w-10 flex items-center justify-center rounded-xl touch-active active:scale-95 transition-all bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30"
                      >
                        <Skull className="w-4 h-4 text-rose-500" />
                      </button>
                    )}
                    {isActive && (
                      <button
                        onClick={() => setClosureBatch({ id: batch.id!, name: batch.batchName })}
                        className="flex-1 flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl touch-active active:scale-98 transition-all bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                      >
                        Close Batch
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium FAB */}
      {batches.length > 0 && (
        <button
          onClick={() => setIsAddOpen(true)}
          className="fixed w-14 h-14 rounded-full flex items-center justify-center touch-active active:scale-95 transition-transform duration-100 z-20 shadow-xl border border-white/20"
          style={{ 
            bottom: 'calc(4.5rem + var(--safe-area-bottom) + 1rem)',
            right: '1.25rem',
            background: 'var(--gradient-primary)',
            boxShadow: '0 8px 32px hsl(152,65%,28% / 0.4)'
          }}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Add/Edit Batch Dialog */}
      <Dialog open={isAddOpen || !!editingBatch} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditingBatch(null);
        }
      }}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingBatch ? 'Edit Batch' : 'New Batch'}</DialogTitle>
          </DialogHeader>
          <BatchForm houses={houses} initialData={editingBatch} onSubmit={handleAddBatch} isLoading={false} />
        </DialogContent>
      </Dialog>

      {closureBatch && (
        <BatchClosureDialog
          batchId={closureBatch.id}
          batchName={closureBatch.name}
          isOpen={!!closureBatch}
          onClose={() => setClosureBatch(null)}
        />
      )}

      {/* Details Dialog */}
      <Dialog open={!!detailsBatch} onOpenChange={(open) => !open && setDetailsBatch(null)}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Batch Details</DialogTitle>
          </DialogHeader>
          {detailsBatch && (
            <div className="flex flex-col gap-4 mt-2 max-h-[70vh] overflow-y-auto">
              <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                <p className="text-sm font-bold text-foreground mb-1">{detailsBatch.batchName}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{detailsBatch.status}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Acquisition</p>
                  <p className="text-sm font-bold text-foreground">{detailsBatch.acquisitionType}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Breed</p>
                  <p className="text-sm font-bold text-foreground">{detailsBatch.breedName || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Cost / Bird</p>
                  <p className="text-sm font-bold text-foreground">₦{detailsBatch.costPerBird?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Cost</p>
                  <p className="text-sm font-bold text-foreground">₦{detailsBatch.totalPurchaseCost?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Supplier</p>
                  <p className="text-sm font-bold text-foreground">{detailsBatch.supplierName || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Expected Lay</p>
                  <p className="text-sm font-bold text-foreground">{detailsBatch.expectedLayingStartDate ? format(new Date(detailsBatch.expectedLayingStartDate), 'dd MMM yyyy') : '—'}</p>
                </div>
              </div>


              {/* Vaccination Schedule */}
              {(() => {
                const batchVaccines = vaccines.filter((v: any) => v.batchId === detailsBatch.id && v.type !== 'Dewormer');
                if (batchVaccines.length === 0) return null;
                const pending = batchVaccines.filter((v: any) => v.status === 'Pending').sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
                const completed = batchVaccines.filter((v: any) => v.status === 'Completed').sort((a: any, b: any) => new Date(b.completedDate || 0).getTime() - new Date(a.completedDate || 0).getTime()).slice(0, 3);
                
                return (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Vaccination Schedule</p>
                    
                    {pending.length === 0 ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Vaccination Schedule Complete</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium mt-0.5">
                            All standard vaccines have been administered.
                          </p>
                        </div>
                      </div>
                    ) : (
                      pending.slice(0, 3).map((v: any) => (
                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                          {v.type === 'Dewormer' ? (
                            <Pill className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          ) : (
                            <Syringe className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{v.vaccineName}</p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Due: {format(new Date(v.scheduledDate), 'dd MMM yyyy')} · Age: {v.targetAgeWeeks}wk
                            </p>
                          </div>
                        </div>
                      ))
                    )}

                    {completed.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Recently Completed</p>
                        <div className="space-y-2">
                          {completed.map((v: any) => (
                            <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <p className="text-xs font-bold text-muted-foreground truncate pr-2">{v.vaccineName}</p>
                                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                                  {v.completedDate ? format(new Date(v.completedDate), 'dd MMM yyyy') : '—'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingBatch} onOpenChange={(open) => !open && setDeletingBatch(null)}>
        <DialogContent className="max-w-sm rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">Delete Batch?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">{deletingBatch?.name}</span>? This action cannot be undone. All associated records will remain but the batch itself will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingBatch(null)}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBatch}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mortality / Cull Dialog */}
      <Dialog open={!!mortalityBatch} onOpenChange={(open) => !open && setMortalityBatch(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Skull className="w-5 h-5 text-rose-500" /> Log Mortality / Cull
            </DialogTitle>
          </DialogHeader>
          {mortalityBatch && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="bg-muted/40 rounded-2xl px-4 py-3 border border-border">
                <p className="text-sm font-bold text-foreground">{mortalityBatch.batchName}</p>
                <p className="text-xs text-muted-foreground">{mortalityBatch.currentQuantity} birds currently in this batch</p>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['mortality', 'cull'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setMortalityForm(f => ({ ...f, type: t }))}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border ${mortalityForm.type === t ? 'bg-rose-500 text-white border-rose-500' : 'bg-muted text-muted-foreground border-border'}`}
                    >
                      {t === 'mortality' ? '💀 Mortality' : '✂️ Cull'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1.5">
                  Number of Birds <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={mortalityBatch.currentQuantity}
                  className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm"
                  placeholder={`Max: ${mortalityBatch.currentQuantity}`}
                  value={mortalityForm.count}
                  onChange={e => setMortalityForm(f => ({ ...f, count: e.target.value === '' ? '' : Number(e.target.value) }))}
                />
                {Number(mortalityForm.count) > mortalityBatch.currentQuantity && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">⚠️ Cannot exceed {mortalityBatch.currentQuantity} birds.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1.5">Notes (Optional)</label>
                <input
                  type="text"
                  className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm"
                  placeholder="e.g. Disease, injury..."
                  value={mortalityForm.notes}
                  onChange={e => setMortalityForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMortalityBatch(null)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-muted-foreground bg-muted"
                >
                  Cancel
                </button>
                <button
                  disabled={!mortalityForm.count || Number(mortalityForm.count) <= 0 || Number(mortalityForm.count) > mortalityBatch.currentQuantity}
                  onClick={async () => {
                    const count = Number(mortalityForm.count);
                    const newQty = Math.max(0, mortalityBatch.currentQuantity - count);
                    const field = mortalityForm.type === 'mortality' ? 'cumulativeMortality' : 'cumulativeCull';
                    
                    // 1. Update Batch
                    updateBatch({
                      id: mortalityBatch.id!,
                      currentQuantity: newQty,
                      [field]: (mortalityBatch[field] || 0) + count,
                      ...(newQty === 0 && { status: 'COMPLETED' })
                    } as any);

                    // 2. Add to Daily Records so it shows on Dashboard
                    try {
                      const todayStr = format(new Date(), 'yyyy-MM-dd');
                      const records = await getFarmDocuments<any>(activeFarm!.farmId, 'dailyRecords');
                      const existing = records.find(r => r.batchId === mortalityBatch.id && r.date === todayStr);
                      
                      const dField = mortalityForm.type === 'mortality' ? 'mortality' : 'culling';
                      
                      if (existing) {
                        await updateFarmDocument(activeFarm!.farmId, 'dailyRecords', existing.id, {
                          [dField]: (existing[dField] || 0) + count,
                          population: newQty
                        });
                      } else {
                        await addFarmDocument(activeFarm!.farmId, 'dailyRecords', {
                          date: todayStr,
                          batchId: mortalityBatch.id,
                          batchName: mortalityBatch.batchName,
                          houseId: mortalityBatch.houseId,
                          population: newQty,
                          mortality: mortalityForm.type === 'mortality' ? count : 0,
                          culling: mortalityForm.type === 'cull' ? count : 0,
                          mortalityReason: mortalityForm.notes,
                          cullingReason: mortalityForm.notes,
                          feedGivenKg: 0,
                          feedRemainingKg: 0,
                          actualFeedConsumedKg: 0,
                          waterConsumptionLitres: 0
                        });
                      }
                    } catch (e) {
                      console.error("Failed to log daily record for mortality", e);
                    }

                    setMortalityBatch(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
