import { useState, useEffect } from 'react';
import { useAiReports } from '@/features/ai/hooks/useAiReports';
import { Bot, Sparkles, Calendar, TrendingUp, ChevronDown, Check, Download } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { exportAiReportToPdf } from '@/lib/exportUtils';
import type { AiReport } from '@/features/ai/types';

function ReportCard({ report, onRead }: { report: AiReport, onRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(!report.isRead);

  useEffect(() => {
    if (expanded && !report.isRead && report.id) {
      onRead(report.id);
    }
  }, [expanded, report.isRead, report.id, onRead]);

  // A very basic markdown parser to render the AI output nicely without full markdown lib
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ') || line.startsWith('# ')) {
        return <h3 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{line.replace(/^#+\s/, '')}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 items-start my-1.5 text-sm">
            <span className="text-primary mt-1">•</span>
            <span className="text-foreground/90">{line.replace(/^[-•]\s*/, '')}</span>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Simple bold text replacement
      const boldedLine = line.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <span key={index} className="font-bold">{part.slice(2, -2)}</span>;
        }
        return part;
      });
      return <p key={i} className="text-sm text-foreground/90 my-1">{boldedLine}</p>;
    });
  };

  const getReportTitle = () => {
    switch (report.type) {
      case 'WEEKLY': return 'Weekly Production Snapshot';
      case 'BIWEEKLY': return 'Bi-Weekly Forecast';
      case 'MONTHLY': return 'Monthly Farm Intelligence';
      default: return 'Farm Report';
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportAiReportToPdf(report.content, getReportTitle(), `AI_Report_${format(new Date(report.generatedAt), 'yyyy-MM-dd')}`);
  };

  return (
    <div className={`premium-card rounded-2xl border transition-all duration-300 overflow-hidden ${
      !report.isRead ? 'border-primary ring-1 ring-primary/20 shadow-md shadow-primary/5' : 'border-border'
    }`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none touch-active"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            !report.isRead ? 'gradient-primary shadow-lg shadow-primary/20' : 'bg-muted/50 dark:bg-muted/20'
          }`}>
            {report.type === 'MONTHLY' ? <TrendingUp className={`w-6 h-6 ${!report.isRead ? 'text-white' : 'text-muted-foreground'}`} /> : 
             report.type === 'BIWEEKLY' ? <Calendar className={`w-6 h-6 ${!report.isRead ? 'text-white' : 'text-muted-foreground'}`} /> :
             <Sparkles className={`w-6 h-6 ${!report.isRead ? 'text-white' : 'text-muted-foreground'}`} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-base ${!report.isRead ? 'text-primary' : 'text-foreground'}`}>
                {getReportTitle()}
              </h3>
              {!report.isRead && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary">New</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {format(new Date(report.generatedAt), 'MMMM d, yyyy')} • {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border bg-white dark:bg-zinc-900/50">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 divide-x divide-border border-b border-border bg-muted/20">
            <div className="p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Birds</p>
              <p className="text-sm font-extrabold text-foreground mt-0.5">{report.metrics.totalBirds.toLocaleString()}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Eggs</p>
              <p className="text-sm font-extrabold text-foreground mt-0.5">{report.metrics.eggsTotal.toLocaleString()}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Mortality</p>
              <p className="text-sm font-extrabold text-red-500 mt-0.5">{report.metrics.mortalityTotal.toLocaleString()}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">P&L</p>
              <p className={`text-sm font-extrabold mt-0.5 ${(report.metrics.revenue || 0) >= (report.metrics.expenses || 0) ? 'text-emerald-500' : 'text-red-500'}`}>
                {((report.metrics.revenue || 0) - (report.metrics.expenses || 0)) >= 0 ? '+' : '-'}₦{Math.abs((report.metrics.revenue || 0) - (report.metrics.expenses || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {renderContent(report.content)}
            </div>
          </div>
          
          <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between">
             <button onClick={handleExport} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg touch-active active:scale-95">
               <Download className="w-4 h-4" /> Export PDF
             </button>
             <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
               <Check className="w-4 h-4 text-emerald-500" /> Report acknowledged
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiReportsPage() {
  const { reports, isLoading, markAsRead } = useAiReports();

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">AI Intelligence</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Automated forecasts & profit analysis</p>
        </div>
      </div>

      {/* Report List */}
      <div className="flex-1 overflow-y-auto mobile-scroll pb-6 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              The AI will automatically generate a snapshot of your farm's performance every few days. Check back soon!
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <ReportCard key={report.id} report={report} onRead={markAsRead} />
          ))
        )}
      </div>
    </div>
  );
}
