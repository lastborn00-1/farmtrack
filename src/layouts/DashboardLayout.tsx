import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/services/authService';
import { AiReportService } from '@/features/ai/services/aiReportService';
import { useAiReports } from '@/features/ai/hooks/useAiReports';
import {
  LayoutDashboard,
  Home,
  Layers,
  Egg,
  MoreHorizontal,
  Bell,
  ChevronRight,
  LogOut,
  ClipboardList,
  Wheat,
  Warehouse,
  Pill,
  Syringe,
  DollarSign,
  BarChart3,
  Settings,
  User,
  X,
  AlertTriangle,
  PackageOpen,
  Sparkles,
  BotMessageSquare,
  Download,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { useHealth } from '@/features/health/hooks/useHealth';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { getLayingLifecycle, getCountdownText } from '@/lib/birdAge';

const bottomTabs = [
  { href: '/', icon: LayoutDashboard, label: 'Home', exact: true },
  { href: '/houses', icon: Home, label: 'Houses' },
  { href: '/batches', icon: Layers, label: 'Batches' },
  { href: '/egg-production', icon: Egg, label: 'Eggs' },
  { href: '/more', icon: MoreHorizontal, label: 'More' },
];

const moreItems = [
  { href: '/daily-records', icon: ClipboardList, label: 'Daily Records',  color: 'text-blue-600',   bg: 'bg-blue-50',   darkBg: 'dark:bg-blue-900/20' },
  { href: '/feed',          icon: Wheat,         label: 'Feed Management',color: 'text-amber-600',  bg: 'bg-amber-50',  darkBg: 'dark:bg-amber-900/20' },
  { href: '/inventory',     icon: Warehouse,     label: 'Inventory',      color: 'text-violet-600', bg: 'bg-violet-50', darkBg: 'dark:bg-violet-900/20' },
  { href: '/health',        icon: Pill,          label: 'Health Records', color: 'text-rose-600',   bg: 'bg-rose-50',   darkBg: 'dark:bg-rose-900/20' },
  { href: '/vaccination',   icon: Syringe,       label: 'Vaccination',    color: 'text-teal-600',   bg: 'bg-teal-50',   darkBg: 'dark:bg-teal-900/20' },
  { href: '/finance',       icon: DollarSign,    label: 'Finance',        color: 'text-emerald-600',bg: 'bg-emerald-50',darkBg: 'dark:bg-emerald-900/20' },
  { href: '/reports',       icon: BarChart3,     label: 'Standard Reports',color: 'text-indigo-600', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/20' },
  { href: '/ai-assistant',  icon: Sparkles,      label: 'AI Assistant',   color: 'text-pink-600',   bg: 'bg-pink-50',   darkBg: 'dark:bg-pink-900/20' },
  { href: '/ai-reports',    icon: BotMessageSquare,label: 'AI Intelligence', color: 'text-fuchsia-600',bg: 'bg-fuchsia-50',darkBg: 'dark:bg-fuchsia-900/20' },
  { href: '/guide',         icon: BookOpen,      label: 'Farming Guide',  color: 'text-emerald-600',bg: 'bg-emerald-50',darkBg: 'dark:bg-emerald-900/20' },
  { href: '/settings',      icon: Settings,      label: 'Settings',       color: 'text-slate-600',  bg: 'bg-slate-100', darkBg: 'dark:bg-slate-800/40' },
];

import { usePwaInstall } from '@/hooks/usePwaInstall';

function MoreDrawer({ onClose }: { onClose: () => void }) {
  const { profile, activeFarm } = useAuthStore();
  const navigate = useNavigate();
  const { hasUnreadReport } = useAiReports();
  const { isInstallable, installPwa } = usePwaInstall();

  const handleLogout = async () => {
    await authService.logout();
    onClose();
  };

  const handleNav = (href: string) => {
    navigate(href);
    onClose();
  };

  const roleColors: Record<string, string> = {
    OWNER: 'bg-emerald-500/20 text-emerald-300',
    MANAGER: 'bg-blue-500/20 text-blue-300',
    ATTENDANT: 'bg-slate-500/20 text-slate-300',
    SUPER_ADMIN: 'bg-violet-500/20 text-violet-300',
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 animate-slide-in-right">
      {/* Profile Header — premium gradient */}
      <div
        className="flex-shrink-0 relative overflow-hidden pt-safe px-5 pb-6"
        style={{ background: 'var(--gradient-primary)' }}
      >
        {/* Decorative bubbles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-12 -right-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

        <div className="flex items-center justify-between mb-4 pt-2 relative z-10">
          <h2 className="text-white font-bold text-lg">Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center touch-active"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">{profile?.fullName || 'Farmer'}</p>
            <p className="text-white/70 text-sm truncate">{activeFarm?.name || 'My Farm'}</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[profile?.role ?? ''] ?? 'bg-white/20 text-white'}`}>
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 mobile-scroll scrollbar-hide px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Modules</p>
        <div className="space-y-1">
            {moreItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors touch-active text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.darkBg} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground truncate">{item.label}</span>
                {item.href === '/ai-reports' && hasUnreadReport && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse-dot flex-shrink-0" />
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
        </div>
      </div>

      {/* Logout & App Install */}
      <div className="px-4 pb-6 flex-shrink-0 space-y-3">
        {isInstallable && (
          <button
            onClick={() => { installPwa(); onClose(); }}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-primary text-white font-semibold active:scale-95 transition-transform duration-100 shadow-lg"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Download className="w-5 h-5" />
            Install PoultryPro App
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold active:scale-95 transition-transform duration-100 border border-red-100 dark:border-red-900/30"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const { activeFarm } = useAuthStore();
  const { hasUnreadReport } = useAiReports();

  // Run AI report check on load
  useEffect(() => {
    if (activeFarm?.farmId) {
      AiReportService.checkAndGenerateReports(activeFarm.farmId);
    }
  }, [activeFarm?.farmId]);
  const [showNotifs, setShowNotifs] = useState(false);
  // Track seen notifications so badge clears once the user opens the bell
  const [seenAlertKey, setSeenAlertKey] = useState('');

  const { items } = useInventory();
  const { vaccines } = useHealth();
  const { batches } = useBatches();

  const now = new Date();
  const lowStockItems = items.filter(i => i.currentQuantity <= i.reorderLevel);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const pendingVaccines = vaccines.filter(v => {
    if (v.status !== 'Pending') return false;
    const dueTime = new Date(v.scheduledDate).getTime();
    const nowTime = now.getTime();
    // Due within 7 days or overdue
    return dueTime - nowTime <= sevenDaysMs;
  });

  // Lifecycle alerts derived from bird ages
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  const layingSoonBatches = batches.filter(b => {
    if (!['GROWING', 'BROODING'].includes(b.status)) return false;
    const milestones = getLayingLifecycle(b.arrivalDate, b.currentAgeWeeks);
    if (!milestones.layingStartDate) return false;
    const diff = milestones.layingStartDate.getTime() - now.getTime();
    return diff > 0 && diff <= twoWeeksMs;
  });
  const endOfLaySoonBatches = batches.filter(b => {
    if (['COMPLETED', 'SOLD', 'CULLED'].includes(b.status)) return false;
    const milestones = getLayingLifecycle(b.arrivalDate, b.currentAgeWeeks);
    if (!milestones.restockAlertDate || !milestones.endOfLayDate) return false;
    return milestones.restockAlertDate <= now && milestones.endOfLayDate > now;
  });

  const alertCount =
    lowStockItems.length +
    pendingVaccines.length +
    (hasUnreadReport ? 1 : 0) +
    layingSoonBatches.length +
    endOfLaySoonBatches.length;

  // Unique key representing current alert state — badge shows when unseen
  const currentAlertKey = [
    alertCount,
    hasUnreadReport,
    lowStockItems.map(i => i.id).join(','),
    layingSoonBatches.map(b => b.id).join(','),
    endOfLaySoonBatches.map(b => b.id).join(','),
  ].join('|');

  const hasUnseenAlerts = alertCount > 0 && currentAlertKey !== seenAlertKey;

  const handleBellClick = () => {
    setShowNotifs(v => {
      if (!v) {
        // Opening the bell — mark everything as seen
        setSeenAlertKey(currentAlertKey);
      }
      return !v;
    });
  };

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return activeFarm?.name || 'PoultryPro';
    if (path === '/houses') return 'Poultry Houses';
    if (path === '/batches') return 'Bird Batches';
    if (path === '/egg-production') return 'Egg Production';
    if (path === '/daily-records') return 'Daily Records';
    if (path === '/feed') return 'Feed Management';
    if (path === '/inventory') return 'Inventory';
    if (path === '/health') return 'Health Records';
    if (path === '/vaccination') return 'Vaccination';
    if (path === '/finance') return 'Finance';
    if (path === '/reports') return 'Reports';
    if (path === '/ai-assistant') return 'AI Assistant';
    if (path === '/ai-reports') return 'AI Reports';
    if (path === '/settings') return 'Settings';
    return 'PoultryPro';
  };

  return (
    <div className="app-shell fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* ── Top App Bar ── */}
      <header className="flex-shrink-0 bg-white dark:bg-zinc-900 border-b border-border/60 pt-safe px-5"
        style={{ boxShadow: '0 1px 0 hsl(var(--border) / 0.6), 0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between h-14">
          {showMore ? (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground">Menu</h1>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {location.pathname === '/' && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: 'var(--gradient-primary)' }}>
                    <span className="text-base">🐔</span>
                  </div>
                )}
                <h1 className="text-lg font-bold text-foreground truncate">{getTitle()}</h1>
              </div>
              {location.pathname === '/' && (
                <p className="text-[11px] text-muted-foreground font-medium">
                  {format(new Date(), 'EEEE, d MMMM yyyy')}
                </p>
              )}
            </div>
          )}

          {/* PoultryPro logo mark */}
          <div className="flex items-center gap-2 ml-2 relative">
            {!showMore && (
              <button
                onClick={handleBellClick}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative touch-active"
              >
                <Bell className="text-muted-foreground" style={{ width: '18px', height: '18px' }} />
                {hasUnseenAlerts && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold border border-white dark:border-zinc-900">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>
            )}

            {/* Floating Notification Popover */}
            {showNotifs && (
              <div className="absolute top-12 right-0 w-80 max-h-[70vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-border/50 z-50 overflow-hidden flex flex-col animate-fade-in-up">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/20">
                  <p className="font-bold text-foreground text-sm">Notifications</p>
                  <button onClick={() => setShowNotifs(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center touch-active hover:bg-muted/80">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
                  {alertCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
                        <Bell className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-bold text-foreground text-sm">All clear!</p>
                      <p className="text-[11px] text-muted-foreground">No alerts right now.</p>
                    </div>
                  ) : (
                    <>
                      {hasUnreadReport && (
                        <div 
                          onClick={() => { setShowNotifs(false); navigate('/ai-reports'); }}
                          className="flex items-start gap-3 p-3 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-900/50 bg-fuchsia-50/50 dark:bg-fuchsia-900/10 cursor-pointer touch-active"
                        >
                          <div className="w-8 h-8 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center flex-shrink-0">
                            <BotMessageSquare className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">New AI Report</p>
                            <p className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 mt-0.5">
                              Tap to view your farm analysis
                            </p>
                          </div>
                        </div>
                      )}
                      {lowStockItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => { setShowNotifs(false); navigate('/inventory'); }}
                          className="flex items-start gap-3 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10 cursor-pointer touch-active"
                        >
                          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                            <PackageOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">Low Stock: {item.name}</p>
                            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                              {item.currentQuantity} {item.unit} left · Tap to restock
                            </p>
                          </div>
                        </div>
                      ))}
                      {pendingVaccines.map(v => (
                        <div
                          key={v.id}
                          onClick={() => { setShowNotifs(false); navigate('/vaccination'); }}
                          className="flex items-start gap-3 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 cursor-pointer touch-active"
                        >
                          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">Pending Vaccine</p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                              {v.vaccineName} for {v.batchName} · Tap to manage
                            </p>
                          </div>
                        </div>
                      ))}
                      {layingSoonBatches.map(b => {
                        const milestones = getLayingLifecycle(b.arrivalDate, b.currentAgeWeeks);
                        return (
                          <div
                            key={`lay-${b.id}`}
                            onClick={() => { setShowNotifs(false); navigate('/batches'); }}
                            className="flex items-start gap-3 p-3 rounded-2xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/10 cursor-pointer touch-active"
                          >
                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                              <Egg className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground">First Eggs Soon 🥚</p>
                              <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5 truncate">
                                {b.batchName} starts laying {getCountdownText(milestones.layingStartDate)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {endOfLaySoonBatches.map(b => {
                        const milestones = getLayingLifecycle(b.arrivalDate, b.currentAgeWeeks);
                        return (
                          <div
                            key={`eol-${b.id}`}
                            onClick={() => { setShowNotifs(false); navigate('/batches'); }}
                            className="flex items-start gap-3 p-3 rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10 cursor-pointer touch-active"
                          >
                            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground">⚠️ End of Lay Approaching</p>
                              <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5 truncate">
                                {b.batchName} ends {getCountdownText(milestones.endOfLayDate)} — plan restock
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <span className="text-white font-bold text-sm">🐔</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="app-main flex-1 overflow-hidden relative">
        {showMore ? (
          <MoreDrawer onClose={() => setShowMore(false)} />
        ) : (
          <div className="h-full mobile-scroll scrollbar-hide pb-safe">
            <div className="px-4 py-4 min-h-full">
              <Outlet />
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav
        className="bottom-nav flex-shrink-0 bg-white dark:bg-zinc-900 border-t border-border/60"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {bottomTabs.map((tab) => {
            const isActive = tab.href === '/more'
              ? showMore
              : tab.exact
                ? location.pathname === tab.href && !showMore
                : location.pathname.startsWith(tab.href) && !showMore;

            return (
              <button
                key={tab.href}
                onClick={() => {
                  if (tab.href === '/more') {
                    setShowMore((v) => !v);
                  } else {
                    setShowMore(false);
                    window.history.pushState(null, '', tab.href);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 touch-active min-w-[56px] relative"
              >
                {/* Active pill indicator */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ background: 'var(--gradient-primary)' }}
                  />
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 dark:bg-primary/15' : ''}`}>
                  <tab.icon
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                    }`}
                  />
                  {tab.href === '/more' && hasUnreadReport && (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-pink-500 animate-pulse-dot" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-all ${isActive ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
