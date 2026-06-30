import { useRef, useState } from 'react';
import type { Transaction } from '@/schemas/financeSchemas';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download, Edit, CheckCircle2, Trash } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReceiptViewerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  farmName: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReceiptViewer({ isOpen, onClose, transaction, farmName, onEdit, onDelete }: ReceiptViewerProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!transaction) return null;

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Receipt_${transaction.category.replace(/\\s+/g, '_')}_${format(new Date(transaction.date), 'yyyyMMdd')}.jpg`;
      link.click();
    } catch (error) {
      console.error('Failed to generate receipt image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const isIncome = transaction.type === 'INCOME';

  const themeColors = {
    bg: isIncome ? 'bg-emerald-50' : 'bg-red-50',
    text: isIncome ? 'text-emerald-900' : 'text-red-900',
    textMuted: isIncome ? 'text-emerald-600/70' : 'text-red-600/70',
    textAccent: isIncome ? 'text-emerald-600' : 'text-red-600',
    border: isIncome ? 'border-emerald-200' : 'border-red-200',
    bgLight: isIncome ? 'bg-emerald-100' : 'bg-red-100',
    dotPattern: isIncome ? 'bg-emerald-900' : 'bg-red-900',
    iconBg: isIncome ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600',
    amount: isIncome ? 'text-emerald-700' : 'text-red-700',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-transparent border-0 shadow-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="overflow-y-auto p-4 mobile-scroll scrollbar-hide flex-1">
          {/* Receipt Card to Capture */}
          <div 
            ref={receiptRef}
            className={`${themeColors.bg} ${themeColors.text} rounded-2xl overflow-hidden shadow-2xl relative`}
          >
            {/* Header Pattern */}
            <div className="absolute top-0 left-0 right-0 h-4 flex space-x-2 px-4 overflow-hidden opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full ${themeColors.dotPattern} -mt-2`} />
              ))}
            </div>

            <div className="p-8 pt-10">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-2 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-lg bg-gradient-to-br ${themeColors.iconBg}`}>
                  <span className="text-3xl text-white">₦</span>
                </div>
                <h2 className={`text-2xl font-black uppercase tracking-widest ${themeColors.text}`}>{farmName}</h2>
                <p className={`text-xs font-bold ${themeColors.textAccent} uppercase tracking-widest ${themeColors.bgLight} px-3 py-1 rounded-full`}>
                  {isIncome ? 'Official Receipt' : 'Expense Voucher'}
                </p>
              </div>

            <div className={`border-t border-dashed ${themeColors.border} my-6`} />

            {/* Transaction Details */}
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className={themeColors.textMuted}>Date</span>
                <span className={themeColors.text}>{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={themeColors.textMuted}>Category</span>
                <span className={themeColors.text}>{transaction.category}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={themeColors.textMuted}>Payment Method</span>
                <span className={themeColors.text}>{transaction.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={themeColors.textMuted}>Status</span>
                <span className={`flex items-center gap-1 ${themeColors.textAccent}`}>
                  {transaction.status} <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>

              {transaction.description && (
                <div className="flex justify-between items-start pt-2">
                  <span className={`${themeColors.textMuted} flex-shrink-0`}>Description</span>
                  <span className={`${themeColors.text} text-right max-w-[200px] break-words`}>{transaction.description}</span>
                </div>
              )}
            </div>

            <div className={`border-t border-dashed ${themeColors.border} my-6`} />

            {/* Line Items (if quantity & unit price exist) */}
            {transaction.quantity && transaction.unitPrice && (
              <div className="mb-6 space-y-2">
                <div className={`flex justify-between text-xs font-bold ${themeColors.textMuted} uppercase tracking-wider mb-2`}>
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className={themeColors.text}>
                    {transaction.quantity} {transaction.unitName || 'Units'} × ₦{transaction.unitPrice.toLocaleString()}
                  </span>
                  <span className={themeColors.text}>₦{(transaction.quantity * transaction.unitPrice).toLocaleString()}</span>
                </div>
                <div className={`border-b ${themeColors.border} my-2`} />
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-end">
              <span className={`text-lg font-bold ${themeColors.textMuted}`}>Total</span>
              <span className={`text-4xl font-black ${themeColors.amount}`}>
                ₦{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Footer */}
            <div className="mt-10 text-center space-y-1">
              <p className={`text-xs font-bold ${themeColors.textMuted} uppercase tracking-widest`}>Thank you for your business</p>
              <p className="text-[10px] opacity-50">Generated securely by PoultryPro Finance</p>
            </div>
          </div>
          
          {/* Footer Pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-4 flex space-x-2 px-4 overflow-hidden opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${themeColors.dotPattern} mt-2`} />
            ))}
          </div>
          </div>
        </div>

        {/* Action Buttons (outside of capture area) */}
        <div className="flex items-center gap-2 p-4 pt-0 mt-auto flex-shrink-0">
          <Button 
            className="flex-1 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Save & Share Image"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">{isDownloading ? 'Generating...' : 'Save & Share Image'}</span>
          </Button>

          {onEdit && (
            <Button 
              variant="secondary"
              className="w-11 h-11 shadow-lg rounded-xl flex-shrink-0 bg-white hover:bg-slate-100 text-slate-900 p-0 flex items-center justify-center"
              onClick={onEdit}
              title="Edit"
            >
              <Edit className="w-5 h-5" />
            </Button>
          )}

          {onDelete && (
            <Button 
              variant="destructive"
              className="w-11 h-11 shadow-lg rounded-xl flex-shrink-0 p-0 flex items-center justify-center"
              onClick={onDelete}
              title="Delete"
            >
              <Trash className="w-5 h-5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
