import { useAuthStore } from '@/store/authStore';
import { useHouses } from '@/features/farm/hooks/useHouses';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { useEggProduction } from '@/features/production/hooks/useEggProduction';
import { useDailyRecords } from '@/features/production/hooks/useDailyRecords';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { useHealth } from '@/features/health/hooks/useHealth';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { AiDashboardInsight } from '@/features/ai/components/AiDashboardInsight';
import { calcCurrentAgeWeeks, getLifecycleStage } from '@/lib/birdAge';
import { Link } from 'react-router-dom';
import {
  Home,
  Layers,
  Egg,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Wheat,
  DollarSign,
  PackageOpen,
  Syringe,
  BarChart3,
  Heart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';

const quickActions = [
  { href: '/egg-production',icon: Egg,          label: 'Log Eggs',  grad: 'from-amber-400 to-orange-500',  shadow: 'shadow-amber-200 dark:shadow-amber-900/40'  },
  { href: '/daily-records', icon: ClipboardList,label: 'Daily Log', grad: 'from-blue-400 to-blue-600',     shadow: 'shadow-blue-200 dark:shadow-blue-900/40'    },
  { href: '/feed',          icon: Wheat,         label: 'Feed',      grad: 'from-green-400 to-emerald-600', shadow: 'shadow-green-200 dark:shadow-emerald-900/40' },
  { href: '/finance',       icon: DollarSign,    label: 'Finance',   grad: 'from-violet-400 to-purple-600', shadow: 'shadow-violet-200 dark:shadow-violet-900/40' },
];

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  iconGrad: string;
}

function StatCard({ label, value, sub, trend, icon: Icon, iconGrad }: StatCardProps) {
  return (
    <div className="premium-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGrad} flex items-center justify-center shadow-sm flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && trend !== 'neutral' && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                           : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5 animate-count-up truncate">{value}</p>
        {sub && (
          <p className={`text-xs mt-0.5 font-medium ${
            trend === 'up' ? 'text-emerald-600 dark:text-emerald-400'
            : trend === 'down' ? 'text-red-500 dark:text-red-400'
            : 'text-muted-foreground'
          }`}>{sub}</p>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-3 py-2 text-xs font-semibold text-foreground">
        🥚 {payload[0].value.toLocaleString()} eggs
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { profile, activeFarm } = useAuthStore();
  const { houses } = useHouses();
  const { batches } = useBatches();
  const { records: eggRecords } = useEggProduction();
  const { records: dailyRecords } = useDailyRecords();
  const { items: inventoryItems } = useInventory();
  const { vaccines } = useHealth();
  const { transactions } = useFinance();

  const totalBirds = batches.reduce((s, b) => s + (b.currentQuantity || 0), 0);
  const layingBirds = batches.filter(b => b.status === 'LAYING').reduce((s, b) => s + (b.currentQuantity || 0), 0);
  const activeHouses = houses.filter(h => h.status === 'Active').length;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayDailyRecords = dailyRecords.filter(r => r.date === todayStr);
  const todayEggRecords = eggRecords.filter(r => r.date === todayStr);
  const todayMortality = todayDailyRecords.reduce((s, r) => s + (r.mortality || 0), 0);
  const totalMortality = dailyRecords.reduce((s, r) => s + (r.mortality || 0), 0);
  const todayEggs = todayEggRecords.reduce((s, r) => s + (r.totalEggs || 0), 0);
  const todayCrates = todayEggRecords.reduce((s, r) => s + (r.totalCrates || 0), 0);

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.fullName?.split(' ')[0] || 'Farmer';

  // Smart Alerts
  const lowStockItems = inventoryItems.filter(i => i.currentQuantity <= i.reorderLevel);
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const upcomingVaccines = vaccines.filter(v => v.status === 'Pending' && new Date(v.scheduledDate).getTime() <= now + threeDays);

  // Recharts — Last 7 days egg production
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, 'yyyy-MM-dd');
    const total = eggRecords
      .filter(r => r.date === dayStr)
      .reduce((s, r) => s + (r.totalEggs || 0), 0);
    return { day: format(d, 'EEE'), eggs: total };
  });
  const hasSparklData = last7Days.some(d => d.eggs > 0);

  const activeBatches = batches.filter(b => ['LAYING','GROWING','BROODING'].includes(b.status));

  // Average age across all active batches
  const avgAgeWeeks = activeBatches.length > 0
    ? Math.round(activeBatches.reduce((sum, b) => sum + calcCurrentAgeWeeks(b.arrivalDate, b.currentAgeWeeks).totalWeeks, 0) / activeBatches.length)
    : null;
  const layingBatchCount = activeBatches.filter(b => getLifecycleStage(calcCurrentAgeWeeks(b.arrivalDate, b.currentAgeWeeks).totalWeeks) === 'Laying').length;

  return (
    <div className="flex flex-col gap-5 pb-2 animate-fade-in-up">

      {/* ── Hero Banner ── */}
      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'var(--gradient-primary)' }}
      >
        {/* Decorative bubbles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
        <div className="absolute top-4 right-20 w-12 h-12 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-4 w-28 h-28 bg-white/5 rounded-full" />

        <p className="text-white/80 text-sm font-medium">{greeting},</p>
        <h2 className="text-white text-2xl font-extrabold mt-0.5">{firstName} 👋</h2>
        <p className="text-white/65 text-xs mt-1 font-medium">
          {activeFarm?.name || 'Your Farm'} · {format(new Date(), 'EEEE, d MMM yyyy')}
        </p>

        {/* Bird summary chip */}
        <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🐔</span>
          <div>
            <p className="text-white text-sm font-bold">{totalBirds.toLocaleString()} birds across {activeHouses} houses</p>
            <p className="text-white/65 text-xs">
              {activeBatches.length} active {activeBatches.length === 1 ? 'batch' : 'batches'}
              {avgAgeWeeks !== null && ` · Avg ${avgAgeWeeks}w`}
              {layingBatchCount > 0 && ` · ${layingBatchCount} laying`}
            </p>
          </div>
        </div>

        {/* Egg sparkline */}
        {hasSparklData && (
          <div className="mt-4 bg-white/10 rounded-2xl px-3 pt-2 pb-1">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-1">7-Day Egg Trend</p>
            <ResponsiveContainer width="100%" height={56}>
              <AreaChart data={last7Days} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eggGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#fff" stopOpacity={0.35} />
                    <stop offset="90%" stopColor="#fff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="eggs"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={2}
                  fill="url(#eggGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#fff', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-0.5">
              {last7Days.map(d => (
                <span key={d.day} className="text-[9px] text-white/50 font-medium">{d.day}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-0.5">Quick Actions</p>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              to={a.href}
              className="flex flex-col items-center gap-2 touch-active"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.grad} flex items-center justify-center shadow-md ${a.shadow}`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── AI Insights ── */}
      <AiDashboardInsight 
        metrics={{
          totalBirds,
          layingBirds,
          activeHouses,
          todayEggs,
          todayMortality,
          lowStockCount: lowStockItems.length,
          upcomingVaccinesCount: upcomingVaccines.length
        }} 
      />

      {/* ── Smart Alerts ── */}
      {(todayMortality > 5 || lowStockItems.length > 0 || upcomingVaccines.length > 0) && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">⚠️ Action Required</p>

          {todayMortality > 5 && (
            <div className="alert-pulse bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800 dark:text-red-300">High Mortality Alert</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{todayMortality} birds reported dead today. Investigate immediately.</p>
              </div>
            </div>
          )}

          {lowStockItems.length > 0 && (
            <Link to="/inventory" className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 touch-active block">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                <PackageOpen className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Low Stock Alert</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{lowStockItems.length} item(s) below reorder level. Tap to restock.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 flex-shrink-0 mt-1" />
            </Link>
          )}

          {upcomingVaccines.length > 0 && (
            <Link to="/health" className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 touch-active block">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Syringe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Vaccinations Due</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{upcomingVaccines.length} vaccination(s) due in the next 3 days.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
            </Link>
          )}
        </div>
      )}

      {/* ── Today's Stats ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Today's Overview</p>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Eggs Collected"
            value={todayEggs.toLocaleString()}
            sub={`${todayCrates.toFixed(1)} crates today`}
            trend="up"
            icon={Egg}
            iconGrad="from-amber-400 to-orange-500"
          />
          <StatCard
            label="Mortality"
            value={totalMortality}
            sub={todayMortality > 0 ? `${todayMortality} today` : 'No deaths today'}
            trend={totalMortality > 0 ? 'down' : 'neutral'}
            icon={Heart}
            iconGrad="from-rose-400 to-red-600"
          />
          <StatCard
            label="Active Houses"
            value={activeHouses}
            sub={`${houses.length} total registered`}
            trend="neutral"
            icon={Home}
            iconGrad="from-emerald-400 to-green-600"
          />
          <StatCard
            label="Active Batches"
            value={activeBatches.length}
            sub={`${batches.length} total batches`}
            trend="neutral"
            icon={Layers}
            iconGrad="from-blue-400 to-blue-600"
          />
        </div>
      </div>

      {/* ── Finance Summary ── */}
      <div className="rounded-2xl overflow-hidden premium-card border border-border">
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, hsl(222, 40%, 14%), hsl(222, 30%, 18%))' }}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-white/60" />
            <span className="text-white/80 text-xs font-bold uppercase tracking-wide">Net Balance</span>
          </div>
          <Link to="/finance" className="text-[10px] font-bold text-white/50 flex items-center gap-0.5">
            View <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <p className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {netProfit >= 0 ? '+' : '-'}₦{Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Net profit / loss</p>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Income</p>
              <p className="text-sm font-bold text-emerald-600">₦{totalIncome.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Expense</p>
              <p className="text-sm font-bold text-red-500">₦{totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Egg Production ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Recent Egg Records</p>
          <Link to="/egg-production" className="text-xs text-primary font-bold flex items-center gap-0.5">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {eggRecords.length === 0 ? (
          <div className="premium-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Egg className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-foreground">No egg records yet</p>
              <p className="text-xs text-muted-foreground mt-1">Tap "Log Eggs" above to record your first batch</p>
            </div>
            <Link
              to="/egg-production"
              className="mt-1 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ background: 'var(--gradient-gold)' }}
            >
              Log First Record →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {eggRecords.slice(0, 3).map((record) => (
              <div key={record.id} className="premium-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Egg className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{record.batchName}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(record.date), 'EEE, d MMM')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-extrabold text-foreground">{record.totalEggs.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{record.totalCrates} crates</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reports CTA ── */}
      <Link
        to="/reports"
        className="flex items-center gap-4 p-4 rounded-2xl border border-border touch-active overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, hsl(240, 40%, 14%), hsl(250, 35%, 18%))' }}
      >
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">View Full Reports</p>
          <p className="text-xs text-white/50 mt-0.5">P&L, production trends & more</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />
      </Link>

    </div>
  );
}
