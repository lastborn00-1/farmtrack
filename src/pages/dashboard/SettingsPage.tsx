import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/services/authService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'sonner';
import {
  Moon,
  Sun,
  Bell,
  Shield,
  LogOut,
  User,
  Building2,
  Info,
  Edit2,
  Check,
  X
} from 'lucide-react';

export default function SettingsPage() {
  const { profile, activeFarm, setActiveFarm } = useAuthStore();
  const [isEditingFarmName, setIsEditingFarmName] = useState(false);
  const [newFarmName, setNewFarmName] = useState(activeFarm?.name || '');
  const [isSavingFarmName, setIsSavingFarmName] = useState(false);

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleDark = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const handleLogout = async () => {
    await authService.logout();
  };

  const roleColors: Record<string, { bg: string; text: string }> = {
    OWNER:      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    MANAGER:    { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400' },
    ATTENDANT:  { bg: 'bg-slate-100 dark:bg-slate-800/40',     text: 'text-slate-700 dark:text-slate-400' },
    SUPER_ADMIN:{ bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-400' },
  };
  const role = profile?.role ?? 'ATTENDANT';
  const rc = roleColors[role] ?? roleColors.ATTENDANT;

  return (
    <div className="flex flex-col gap-5 pb-2 animate-fade-in-up">

      {/* Profile Hero */}
      <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-lg leading-tight truncate">{profile?.fullName || 'Farmer'}</p>
            <p className="text-white/65 text-sm truncate">{profile?.email}</p>
            <span className={`inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${rc.bg} ${rc.text}`}>
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Farm Info */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">Farm Information</p>
        <div className="premium-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Farm Name</p>
              {isEditingFarmName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newFarmName}
                    onChange={(e) => setNewFarmName(e.target.value)}
                    disabled={isSavingFarmName}
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (!newFarmName.trim() || !activeFarm) return;
                      setIsSavingFarmName(true);
                      try {
                        await updateDoc(doc(db, 'farms', activeFarm.farmId), {
                          name: newFarmName.trim()
                        });
                        setActiveFarm({ ...activeFarm, name: newFarmName.trim() });
                        setIsEditingFarmName(false);
                        toast.success('Farm name updated successfully');
                      } catch (error: any) {
                        toast.error(error?.message || 'Failed to update farm name');
                      } finally {
                        setIsSavingFarmName(false);
                      }
                    }}
                    disabled={isSavingFarmName || !newFarmName.trim() || newFarmName === activeFarm?.name}
                    className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50"
                  >
                    {isSavingFarmName ? <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setNewFarmName(activeFarm?.name || '');
                      setIsEditingFarmName(false);
                    }}
                    disabled={isSavingFarmName}
                    className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center hover:bg-rose-200 dark:hover:bg-rose-900/50 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm font-bold text-foreground truncate">{activeFarm?.name || '—'}</p>
                  <button
                    onClick={() => {
                      setNewFarmName(activeFarm?.name || '');
                      setIsEditingFarmName(true);
                    }}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Farm ID</p>
              <p className="text-xs font-mono text-foreground truncate">{activeFarm?.farmId || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">Preferences</p>
        <div className="premium-card border border-border rounded-2xl overflow-hidden divide-y divide-border">

          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center">
              {isDark ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch to {isDark ? 'light' : 'dark'} appearance</p>
            </div>
            <button
              onClick={toggleDark}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                isDark ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  isDark ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Alerts for mortality, stock & vaccines</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                notificationsEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Vaccinations */}
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Auto Vaccinations</p>
              <p className="text-xs text-muted-foreground">Auto-schedule standard vaccinations</p>
            </div>
            <button
              onClick={async () => {
                if (!activeFarm) return;
                const newVal = activeFarm.autoVaccinationSchedule === false ? true : false;
                try {
                  await updateDoc(doc(db, 'farms', activeFarm.farmId), {
                    autoVaccinationSchedule: newVal
                  });
                  setActiveFarm({ ...activeFarm, autoVaccinationSchedule: newVal });
                  toast.success(`Auto-vaccination ${newVal ? 'enabled' : 'disabled'}`);
                } catch (e: any) {
                  toast.error(e.message || 'Failed to update setting');
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                activeFarm?.autoVaccinationSchedule !== false ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  activeFarm?.autoVaccinationSchedule !== false ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">About</p>
        <div className="premium-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-xl">🐔</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">PoultryPro</p>
              <p className="text-xs text-muted-foreground">v1.0.0 · Layer Farm Management</p>
            </div>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>


      {/* Security */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">Security</p>
        <div className="premium-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Role-Based Access</p>
              <p className="text-xs text-muted-foreground">Your role: <span className="font-semibold">{role}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm active:scale-95 transition-transform duration-100"
      >
        <LogOut className="w-5 h-5" />
        Sign Out of PoultryPro
      </button>

      <p className="text-center text-[10px] text-muted-foreground pb-1">
        Powered by Loopvora | +2349052249906
      </p>

    </div>
  );
}
