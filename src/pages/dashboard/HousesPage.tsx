import { useState } from 'react';
import { useHouses } from '@/features/farm/hooks/useHouses';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { useAuthStore } from '@/store/authStore';
import { Plus, Home, Users, Building2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HouseForm } from '@/features/farm/components/houses/HouseForm';

const statusColors: Record<string, { bg: string; text: string; dot: string; darkBg: string }> = {
  Active: { bg: 'bg-emerald-50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', darkBg: 'dark:bg-emerald-900/30' },
  Inactive: { bg: 'bg-slate-100', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', darkBg: 'dark:bg-slate-800/40' },
  Maintenance: { bg: 'bg-amber-50', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', darkBg: 'dark:bg-amber-900/30' },
};

export default function HousesPage() {
  const { activeFarm } = useAuthStore();
  const { houses, isLoading, addHouse, updateHouse, deleteHouse } = useHouses();
  const { batches } = useBatches();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<any>(null);
  const [deletingHouse, setDeletingHouse] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeFarm) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Farm profile not loaded. Please refresh.</p>
      </div>
    );
  }

  const handleAddHouse = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingHouse) {
        await updateHouse({
          id: editingHouse.id,
          ...data,
          capacity: Number(data.capacity),
        });
        setEditingHouse(null);
      } else {
        await addHouse({
          name: data.name,
          houseType: data.houseType,
          capacity: Number(data.capacity),
          currentPopulation: 0,
          status: data.status,
        } as any);
        setIsAddOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHouse = async () => {
    if (!deletingHouse) return;
    try {
      await deleteHouse(deletingHouse.id);
      setDeletingHouse(null);
    } catch (e) {
      console.error(e);
    }
  };

  const activeCount = houses.filter(h => h.status === 'Active').length;

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">
      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="premium-card rounded-2xl p-4 flex flex-col gap-1 border border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-1">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Houses</p>
          <p className="text-2xl font-extrabold text-foreground animate-count-up">{houses.length}</p>
        </div>
        <div className="premium-card rounded-2xl p-4 flex flex-col gap-1 border border-border">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-1">
            <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-bold uppercase tracking-widest">Active Now</p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 animate-count-up">{activeCount}</p>
        </div>
      </div>

      {/* Houses List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">All Structures</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : houses.length === 0 ? (
          <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">No houses yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Add your first poultry house to start managing birds.</p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-transform"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Add First House
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {houses.map((house) => {
              const statusStyle = statusColors[house.status] || statusColors.Inactive;
              const dynamicPopulation = batches
                .filter(b => b.houseId === house.id && ['BROODING', 'GROWING', 'LAYING'].includes(b.status))
                .reduce((sum, b) => sum + (b.currentQuantity || 0), 0);

              const occupancy = house.capacity > 0
                ? Math.round((dynamicPopulation / house.capacity) * 100)
                : 0;

              return (
                <div
                  key={house.id}
                  className="premium-card rounded-2xl border border-border p-4 touch-active active:scale-98 transition-transform duration-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--gradient-primary)' }}
                      >
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-base truncate">{house.name}</p>
                        <p className="text-xs font-medium text-muted-foreground">{house.houseType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusStyle.bg} ${statusStyle.darkBg} ${statusStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {house.status}
                      </span>
                      <button onClick={() => setEditingHouse(house)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingHouse({ id: house.id!, name: house.name })}
                        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                        aria-label="Delete structure"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          {dynamicPopulation.toLocaleString()} <span className="font-normal opacity-70">/ {house.capacity.toLocaleString()}</span>
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${occupancy > 90 ? 'text-red-500' : occupancy > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {occupancy}% Full
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted dark:bg-muted/50 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-400 to-green-500'
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium FAB */}
      {houses.length > 0 && (
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

      {/* Add/Edit House Dialog */}
      <Dialog open={isAddOpen || !!editingHouse} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditingHouse(null);
        }
      }}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingHouse ? 'Edit Structure' : 'New Structure'}</DialogTitle>
          </DialogHeader>
          <HouseForm initialData={editingHouse} onSubmit={handleAddHouse} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingHouse} onOpenChange={(open) => !open && setDeletingHouse(null)}>
        <DialogContent className="max-w-sm rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">Delete Structure?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">{deletingHouse?.name}</span>? 
              This will not delete the batches inside it, but they will no longer be linked to this house.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingHouse(null)}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHouse}
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
