import { useState } from 'react';
import { useHealth } from '@/features/health/hooks/useHealth';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { VaccinationForm } from '@/features/health/components/VaccinationForm';
import { TreatmentForm } from '@/features/health/components/TreatmentForm';
import { Plus, Syringe, Stethoscope, HeartPulse, CheckCircle2, Clock, Pencil, AlertTriangle, Pill, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

type TabType = 'vaccines' | 'deworming' | 'treatments';

interface HealthPageProps {
  initialTab?: TabType;
}

export default function HealthPage({ initialTab = 'vaccines' }: HealthPageProps) {
  const { vaccines, treatments, isLoading, addVaccine, addTreatment, updateVaccine, updateTreatment, deleteTreatment, isSubmitting } = useHealth();
  const { batches, isLoading: batchesLoading } = useBatches();
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isAddVaccineOpen, setIsAddVaccineOpen] = useState(false);
  const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<any>(null);
  const [editingTreatment, setEditingTreatment] = useState<any>(null);

  const handleAddVaccine = (data: any) => {
    addVaccine({ ...data, type: activeTab === 'deworming' ? 'Dewormer' : 'Vaccine' }).catch(console.error);
    setIsAddVaccineOpen(false);
  };

  const handleAddTreatment = (data: any) => {
    addTreatment(data).catch(console.error);
    setIsAddTreatmentOpen(false);
  };

  const handleUpdateVaccine = (data: any) => {
    if (!editingVaccine?.id) return;
    const { id, sourceCollection, createdAt, updatedAt, ...payload } = data;
    updateVaccine({
      id: editingVaccine.id,
      collectionName: editingVaccine.sourceCollection || 'vaccines',
      data: payload,
    }).catch(console.error);
    setEditingVaccine(null);
  };

  const handleUpdateTreatment = (data: any) => {
    if (!editingTreatment?.id) return;
    const { id, createdAt, updatedAt, ...payload } = data;
    updateTreatment({ id: editingTreatment.id, data: payload }).catch(console.error);
    setEditingTreatment(null);
  };

  const markVaccineComplete = (vaccine: any) => {
    if (!vaccine?.id) return;
    updateVaccine({ 
      id: vaccine.id,
      collectionName: vaccine.sourceCollection || 'vaccines',
      data: { 
        status: 'Completed' as const, 
        completedDate: new Date().toISOString().split('T')[0] 
      } 
    }).catch(console.error);
  };

  const markTreatmentComplete = (treatment: any) => {
    if (!treatment?.id) return;
    updateTreatment({ 
      id: treatment.id,
      data: { 
        status: 'Completed' as const
      } 
    }).catch(console.error);
  };

  const handleDeleteTreatment = (id: string) => {
    if (window.confirm("Are you sure you want to delete this treatment?")) {
      deleteTreatment(id).catch(console.error);
    }
  };

  const pendingVaccines = vaccines.filter(v => v.status === 'Pending' && v.type !== 'Dewormer').sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  const pendingDeworming = vaccines.filter(v => v.status === 'Pending' && v.type === 'Dewormer').sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  const ongoingTreatments = treatments.filter(t => t.status === 'Ongoing');

  // Group by Batch
  const vaccinesByBatch = pendingVaccines.reduce((acc, v) => {
    if (!acc[v.batchId]) acc[v.batchId] = { batchName: v.batchName, items: [] };
    acc[v.batchId].items.push(v);
    return acc;
  }, {} as Record<string, { batchName: string, items: any[] }>);

  const dewormingByBatch = pendingDeworming.reduce((acc, v) => {
    if (!acc[v.batchId]) acc[v.batchId] = { batchName: v.batchName, items: [] };
    acc[v.batchId].items.push(v);
    return acc;
  }, {} as Record<string, { batchName: string, items: any[] }>);

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">
      {/* Summary */}
      <div 
        className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, hsl(142,71%,45%), hsl(142,76%,36%))' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 right-12 w-24 h-24 bg-white/10 rounded-full" />
        
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <HeartPulse className="w-5 h-5 text-emerald-100" />
          <p className="text-emerald-100/90 text-sm font-bold uppercase tracking-widest">Health Status</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Vaccines</p>
            <p className="text-3xl font-extrabold text-white animate-count-up">{pendingVaccines.length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Active Treatments</p>
            <p className="text-3xl font-extrabold text-white animate-count-up">{ongoingTreatments.length}</p>
          </div>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex p-1 bg-muted/60 dark:bg-muted/30 rounded-2xl border border-border backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('vaccines')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'vaccines' 
              ? 'bg-background shadow-md text-foreground border border-border scale-[0.98]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Syringe className="w-4 h-4" /> Vaccines
        </button>
        <button
          onClick={() => setActiveTab('deworming')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'deworming' 
              ? 'bg-background shadow-md text-foreground border border-border scale-[0.98]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Pill className="w-4 h-4" /> Deworming
        </button>
        <button
          onClick={() => setActiveTab('treatments')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'treatments' 
              ? 'bg-background shadow-md text-foreground border border-border scale-[0.98]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Treatments
        </button>
      </div>

      {/* List Content */}
      {isLoading || batchesLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="bg-card rounded-2xl border border-border h-28 animate-pulse" />)}
        </div>
      ) : activeTab === 'vaccines' ? (
        // VACCINES LIST
        <div className="animate-fade-in-up">
          {vaccines.filter(v => v.type !== 'Dewormer').length === 0 ? (
            <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                   style={{ background: 'linear-gradient(135deg, hsl(142,71%,45%), hsl(142,76%,36%))' }}>
                <Syringe className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">No vaccines scheduled</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Keep your flock safe by scheduling their vaccinations.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-6">
                {Object.values(vaccinesByBatch).map(group => (
                  <div key={group.batchName} className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pl-3 border-l-4 border-amber-500 py-1 bg-amber-50/50 dark:bg-amber-900/10 rounded-r-lg">{group.batchName}</h3>
                    {group.items.map(v => (
                      <div key={v.id} className="premium-card rounded-2xl border border-border p-4 touch-active active:scale-98 transition-transform duration-100">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-200 dark:shadow-amber-900/40">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-base truncate">{v.vaccineName}</p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">Age: {v.targetAgeWeeks} wks</p>
                            
                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                Due: {v.scheduledDate && !isNaN(new Date(v.scheduledDate).getTime()) ? format(new Date(v.scheduledDate), 'dd MMM yyyy') : 'Unknown'}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingVaccine(v)}
                                  className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5 touch-active active:scale-95 transition-transform"
                                >
                                  <Pencil className="w-4 h-4" /> Edit
                                </button>
                                <button 
                                  onClick={() => markVaccineComplete(v)}
                                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-xl flex items-center gap-1.5 touch-active active:scale-95 transition-transform"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Done
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {vaccines.filter(v => v.status === 'Completed' && v.type !== 'Dewormer').length > 0 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">Completed</p>
                  <div className="space-y-2">
                    {vaccines.filter(v => v.status === 'Completed' && v.type !== 'Dewormer').map(v => (
                      <div key={v.id} className="bg-card/50 dark:bg-card/20 rounded-2xl border border-border/50 p-4 flex items-center justify-between opacity-80">
                        <div>
                          <p className="text-sm font-bold text-foreground">{v.vaccineName}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">{v.batchName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingVaccine(v)}
                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center"
                            aria-label="Edit vaccination"
                          >
                            <Pencil className="w-4 h-4 text-slate-500" />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
    ) : activeTab === 'deworming' ? (
        // DEWORMING LIST
        <div className="animate-fade-in-up">
          {vaccines.filter(v => v.type === 'Dewormer').length === 0 ? (
            <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                   style={{ background: 'linear-gradient(135deg, hsl(199,89%,48%), hsl(200,98%,39%))' }}>
                <Pill className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">No deworming scheduled</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Keep your flock healthy by scheduling their deworming.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-6">
                {Object.values(dewormingByBatch).map(group => (
                  <div key={group.batchName} className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pl-3 border-l-4 border-cyan-500 py-1 bg-cyan-50/50 dark:bg-cyan-900/10 rounded-r-lg">{group.batchName}</h3>
                    {group.items.map(v => (
                      <div key={v.id} className="premium-card rounded-2xl border border-border p-4 touch-active active:scale-98 transition-transform duration-100">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-cyan-200 dark:shadow-cyan-900/40">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-base truncate">{v.vaccineName}</p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">Age: {v.targetAgeWeeks} wks</p>
                            
                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                Due: {v.scheduledDate && !isNaN(new Date(v.scheduledDate).getTime()) ? format(new Date(v.scheduledDate), 'dd MMM yyyy') : 'Unknown'}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingVaccine(v)}
                                  className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5 touch-active active:scale-95 transition-transform"
                                >
                                  <Pencil className="w-4 h-4" /> Edit
                                </button>
                                <button 
                                  onClick={() => markVaccineComplete(v)}
                                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-xl flex items-center gap-1.5 touch-active active:scale-95 transition-transform"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Done
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {vaccines.filter(v => v.status === 'Completed' && v.type === 'Dewormer').length > 0 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">Completed</p>
                  <div className="space-y-2">
                    {vaccines.filter(v => v.status === 'Completed' && v.type === 'Dewormer').map(v => (
                      <div key={v.id} className="bg-card/50 dark:bg-card/20 rounded-2xl border border-border/50 p-4 flex items-center justify-between opacity-80">
                        <div>
                          <p className="text-sm font-bold text-foreground">{v.vaccineName}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">{v.batchName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingVaccine(v)}
                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center"
                            aria-label="Edit deworming"
                          >
                            <Pencil className="w-4 h-4 text-slate-500" />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'treatments' ? (
        // TREATMENTS LIST
        <div className="animate-fade-in-up">
          {treatments.length === 0 ? (
            <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                   style={{ background: 'linear-gradient(135deg, hsl(142,71%,45%), hsl(142,76%,36%))' }}>
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">No health issues</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Your flock is healthy! Log treatments if sickness occurs.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {ongoingTreatments.map(t => (
                  <div key={t.id} className="premium-card rounded-2xl border border-border p-4 touch-active active:scale-98 transition-transform duration-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-rose-200 dark:shadow-rose-900/40">
                        <HeartPulse className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-foreground text-base truncate">{t.diagnosis}</p>
                          <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                            Started: {t.date && !isNaN(new Date(t.date).getTime()) ? format(new Date(t.date), 'dd MMM yyyy') : 'Unknown'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground truncate">{t.batchName} <span className="opacity-60">·</span> {t.medicineType || 'Medicine'}: {t.medicationUsed}</p>
                        
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div className="bg-muted/50 rounded-xl p-2.5 border border-border/50">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Dosage</p>
                            <p className="text-sm font-bold text-foreground">{t.dosage}</p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-2.5 border border-border/50">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Duration</p>
                            <p className="text-sm font-bold text-foreground">{t.durationDays} days</p>
                          </div>
                          {(t.withdrawalPeriodDays || 0) > 0 && (
                            <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-2.5 border border-orange-200/50 dark:border-orange-900/30 col-span-2 md:col-span-1">
                              <p className="text-[9px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest mb-0.5">Withdrawal</p>
                              <p className="text-sm font-bold text-orange-700 dark:text-orange-400">{t.withdrawalPeriodDays} days</p>
                            </div>
                          )}
                        </div>
                        {t.date && (t.withdrawalPeriodDays || 0) > 0 && (
                          (() => {
                            const startDate = new Date(t.date);
                            const endDate = new Date(startDate.getTime() + ((t.durationDays + (t.withdrawalPeriodDays || 0)) * 24 * 60 * 60 * 1000));
                            const isActive = endDate > new Date();
                            if (isActive) {
                              return (
                                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-2.5 rounded-xl flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400">Active Withdrawal Period</p>
                                    <p className="text-[10px] text-red-600 dark:text-red-300 mt-0.5">Do not sell eggs or meat until {format(endDate, 'dd MMM yyyy')}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTreatment(t)}
                              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5 touch-active active:scale-95 transition-transform"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => { if(t.id) handleDeleteTreatment(t.id) }}
                              className="text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-xl flex items-center gap-1.5 touch-active active:scale-95 transition-transform"
                            >
                              <Trash className="w-4 h-4" /> Delete
                            </button>
                          </div>
                          <button
                            onClick={() => markTreatmentComplete(t)}
                            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-xl flex items-center gap-1.5 touch-active active:scale-95 transition-transform"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {treatments.filter(t => t.status === 'Completed').length > 0 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">Completed History</p>
                  <div className="space-y-2">
                    {treatments.filter(t => t.status === 'Completed').map(t => (
                      <div key={t.id} className="bg-card/50 dark:bg-card/20 rounded-2xl border border-border/50 p-4 opacity-80 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{t.diagnosis}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.batchName} <span className="opacity-60">·</span> {t.date && !isNaN(new Date(t.date).getTime()) ? format(new Date(t.date), 'MMM yyyy') : 'Unknown'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingTreatment(t)}
                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0"
                            aria-label="Edit treatment"
                          >
                            <Pencil className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => { if(t.id) handleDeleteTreatment(t.id) }}
                            className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0"
                            aria-label="Delete treatment"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* FAB */}
      <button
        onClick={() => activeTab === 'treatments' ? setIsAddTreatmentOpen(true) : setIsAddVaccineOpen(true)}
        className="fixed w-14 h-14 rounded-full flex items-center justify-center touch-active active:scale-95 transition-transform duration-100 z-20 shadow-xl border border-white/20"
        style={{ 
          bottom: 'calc(4.5rem + var(--safe-area-bottom) + 1rem)', 
          right: '1.25rem',
          background: 'linear-gradient(135deg, hsl(142,71%,45%), hsl(142,76%,36%))',
          boxShadow: '0 8px 32px hsl(142,76%,36% / 0.4)'
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Dialogs */}
      <Dialog open={isAddVaccineOpen} onOpenChange={setIsAddVaccineOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {activeTab === 'deworming' ? 'Schedule Deworming' : 'Schedule Vaccine'}
            </DialogTitle>
          </DialogHeader>
          <VaccinationForm batches={batches} onSubmit={handleAddVaccine} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVaccine} onOpenChange={(open) => !open && setEditingVaccine(null)}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Vaccination</DialogTitle>
          </DialogHeader>
          {editingVaccine && (
            <VaccinationForm batches={batches} onSubmit={handleUpdateVaccine} isLoading={isSubmitting} initialData={editingVaccine} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddTreatmentOpen} onOpenChange={setIsAddTreatmentOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Log Treatment</DialogTitle>
          </DialogHeader>
          <TreatmentForm batches={batches} onSubmit={handleAddTreatment} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTreatment} onOpenChange={(open) => !open && setEditingTreatment(null)}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Treatment</DialogTitle>
          </DialogHeader>
          {editingTreatment && (
            <TreatmentForm batches={batches} onSubmit={handleUpdateTreatment} isLoading={isSubmitting} initialData={editingTreatment} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
