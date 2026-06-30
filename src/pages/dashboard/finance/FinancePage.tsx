import { useState } from 'react';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { TransactionForm } from '@/features/finance/components/TransactionForm';
import { ReceiptViewer } from '@/features/finance/components/ReceiptViewer';
import type { Transaction } from '@/schemas/financeSchemas';
import { Wallet, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Landmark, Bird, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function FinancePage() {
  const { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, isSubmitting } = useFinance();
  const { batches, updateBatch } = useBatches();
  const { activeFarm } = useAuthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [showBatchCosts, setShowBatchCosts] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleSaveTransaction = async (data: any) => {
    try {
      if (editingTransaction?.id) {
        await updateTransaction({ id: editingTransaction.id, data });
      } else {
        await addTransaction(data);
        // Auto-deplete birds from batch if this is a Bird Sale
        if (data.category === 'Bird Sales' && data.birdsSoldBatchId && Number(data.birdsSoldCount) > 0) {
          const batch = batches.find(b => b.id === data.birdsSoldBatchId);
          if (batch) {
            const newQty = Math.max(0, batch.currentQuantity - Number(data.birdsSoldCount));
            await updateBatch({ 
              id: batch.id!, 
              currentQuantity: newQty,
              ...(newQty === 0 && { status: 'SOLD' })
            } as any);
            toast.success(`${data.birdsSoldCount} birds deducted from ${batch.batchName}`);
          }
        }
      }
      setIsAddOpen(false);
      setEditingTransaction(null);
      setSelectedTransaction(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      setTransactionType(selectedTransaction.type);
      setEditingTransaction(selectedTransaction);
      setIsAddOpen(true);
      setSelectedTransaction(null);
    }
  };

  const handleDelete = async () => {
    if (selectedTransaction && window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      try {
        await deleteTransaction(selectedTransaction.id!);
        toast.success("Transaction deleted successfully");
        setSelectedTransaction(null);
      } catch (error) {
        toast.error("Failed to delete transaction");
        console.error(error);
      }
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Group transactions by date for the list
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">
      {/* Hero P&L */}
      <div 
        className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, hsl(222,47%,11%), hsl(222,47%,16%))' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/10 rounded-full" />
        
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-slate-300" />
            <p className="text-slate-300 text-sm font-bold uppercase tracking-widest">Net Balance</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] text-white font-bold uppercase tracking-widest">NGN</p>
          </div>
        </div>
        
        <p className="text-5xl font-extrabold text-white animate-count-up drop-shadow-md">
          ₦{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-sm relative overflow-hidden group hover:bg-emerald-500/20 transition-colors">
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-colors" />
            <div className="flex items-center gap-1.5 text-emerald-400 mb-2">
              <ArrowDownRight className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Income</span>
            </div>
            <p className="text-2xl font-bold text-white">₦{totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/20 backdrop-blur-sm relative overflow-hidden group hover:bg-rose-500/20 transition-colors">
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-rose-500/20 rounded-full blur-xl group-hover:bg-rose-500/30 transition-colors" />
            <div className="flex items-center gap-1.5 text-rose-400 mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Expense</span>
            </div>
            <p className="text-2xl font-bold text-white">₦{totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setEditingTransaction(null); setTransactionType('INCOME'); setIsAddOpen(true); }}
          className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 touch-active active:scale-95 transition-transform shadow-sm border border-emerald-100 dark:border-emerald-900/30"
        >
          <ArrowDownRight className="w-5 h-5" /> Receive Cash
        </button>
        <button
          onClick={() => { setEditingTransaction(null); setTransactionType('EXPENSE'); setIsAddOpen(true); }}
          className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 touch-active active:scale-95 transition-transform shadow-sm border border-rose-100 dark:border-rose-900/30"
        >
          <ArrowUpRight className="w-5 h-5" /> Record Expense
        </button>
      </div>

      {/* Transactions List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Recent Transactions</p>
          <button className="text-[11px] text-primary font-bold uppercase tracking-widest">View All</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl border border-border h-24 animate-pulse" />)}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
              <Wallet className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="font-bold text-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Record your first income or expense to start tracking financials.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((t) => {
              const isIncome = t.type === 'INCOME';
              return (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTransaction(t)}
                  className="premium-card rounded-2xl border border-border p-4 flex items-center gap-4 touch-active active:scale-98 transition-transform duration-100 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    isIncome 
                      ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200 dark:shadow-emerald-900/40' 
                      : 'bg-gradient-to-br from-rose-400 to-red-500 shadow-rose-200 dark:shadow-rose-900/40'
                  }`}>
                    <ArrowRightLeft className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-base truncate">{t.category}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{format(new Date(t.date), 'dd MMM yyyy')} <span className="opacity-60">·</span> {t.paymentMethod}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-extrabold text-lg ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isIncome ? '+' : '-'}₦{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{t.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch Acquisition Costs */}
      {batches.length > 0 && (() => {
        const totalBatchCost = batches.reduce((s, b) => s + (b.totalPurchaseCost || 0), 0);
        return (
          <div className="premium-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowBatchCosts(v => !v)}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Bird className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground text-sm">Bird Acquisition Costs</p>
                  <p className="text-xs text-muted-foreground">Total spent purchasing {batches.length} batch{batches.length !== 1 ? 'es' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-rose-600 dark:text-rose-400">₦{totalBatchCost.toLocaleString()}</p>
                {showBatchCosts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            {showBatchCosts && (
              <div className="border-t border-border">
                {batches.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.batchName}</p>
                      <p className="text-xs text-muted-foreground">{b.initialQuantity?.toLocaleString()} birds · ₦{(b.costPerBird || 0).toLocaleString()}/bird</p>
                    </div>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">₦{(b.totalPurchaseCost || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) setEditingTransaction(null); }}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingTransaction ? 'Edit Transaction' : (transactionType === 'INCOME' ? 'Add Income' : 'Record Expense')}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm 
            type={transactionType} 
            initialData={editingTransaction || undefined}
            onSubmit={handleSaveTransaction} 
            isLoading={isSubmitting}
            batches={batches}
          />
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer */}
      <ReceiptViewer 
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        farmName={activeFarm?.name || 'My Farm'}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
