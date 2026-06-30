import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PackageX, AlertTriangle } from 'lucide-react';
import { useBatches } from '@/features/farm/hooks/useBatches';

interface BatchClosureDialogProps {
  batchId: string;
  batchName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BatchClosureDialog({ batchId, batchName, isOpen, onClose }: BatchClosureDialogProps) {
  const { updateBatch } = useBatches();
  const [closureReason, setClosureReason] = useState<'SOLD' | 'CULLED'>('SOLD');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseBatch = async () => {
    setIsSubmitting(true);
    try {
      await updateBatch({
        id: batchId,
        status: closureReason,
        remarks: notes || undefined,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md mx-4 rounded-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PackageX className="w-5 h-5 text-rose-500" />
            Close Batch
          </DialogTitle>
          <DialogDescription>
            You are about to close <strong className="text-foreground">{batchName}</strong>. This will mark the batch as inactive.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-900/40 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
              Once closed, this batch will no longer appear in active dashboards or require daily logs.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Reason for Closure</p>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                  closureReason === 'SOLD' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="reason" 
                  className="hidden" 
                  checked={closureReason === 'SOLD'} 
                  onChange={() => setClosureReason('SOLD')}
                />
                <span className="text-2xl">💰</span>
                <span className="font-bold text-sm">Sold</span>
              </label>
              
              <label 
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                  closureReason === 'CULLED' 
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' 
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="reason" 
                  className="hidden" 
                  checked={closureReason === 'CULLED'} 
                  onChange={() => setClosureReason('CULLED')}
                />
                <span className="text-2xl">☠️</span>
                <span className="font-bold text-sm">Depopulated</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            <label className="text-sm font-semibold">Closure Notes (Optional)</label>
            <textarea
              className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm min-h-[80px]"
              placeholder="Record final weight, buyer name, or reason for culling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseBatch}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: closureReason === 'SOLD' ? 'var(--gradient-primary)' : 'linear-gradient(135deg, hsl(348,83%,47%), hsl(348,90%,38%))' }}
            >
              {isSubmitting ? 'Closing...' : 'Confirm Close'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
