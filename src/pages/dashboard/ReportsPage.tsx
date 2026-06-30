import { useEggProduction } from '@/features/production/hooks/useEggProduction';
import { useDailyRecords } from '@/features/production/hooks/useDailyRecords';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Egg, DollarSign, Activity } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Feed Cost':   '#f59e0b',
  'Medication':  '#ef4444',
  'Equipment':   '#3b82f6',
  'Additive':    '#8b5cf6',
  'Salary':      '#ec4899',
  'Egg Sales':   '#22c55e',
  'Bird Sales':  '#10b981',
  'Manure Sales':'#6ee7b7',
  'Other':       '#94a3b8',
};
const FALLBACK_COLORS = ['#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#22c55e','#10b981','#94a3b8'];

export default function ReportsPage() {
  const { records: eggRecords } = useEggProduction();
  const { records: dailyRecords } = useDailyRecords();
  const { transactions } = useFinance();
  const { batches } = useBatches();

  // Last 14 days egg production
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dayStr = format(d, 'yyyy-MM-dd');
    const eggs = eggRecords.filter(r => r.date === dayStr).reduce((s, r) => s + (r.totalEggs || 0), 0);
    const mortality = dailyRecords.filter(r => r.date === dayStr).reduce((s, r) => s + (r.mortality || 0), 0);
    return { day: format(d, 'd MMM'), eggs, mortality };
  });

  // This month finance
  const thisMonth = new Date();
  const monthStart = startOfMonth(thisMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: thisMonth });
  const monthFinance = monthDays.map(d => {
    const dayStr = format(d, 'yyyy-MM-dd');
    const income = transactions.filter(t => t.type === 'INCOME' && t.date === dayStr).reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE' && t.date === dayStr).reduce((s, t) => s + t.amount, 0);
    return { day: format(d, 'd'), income, expense };
  });

  // Expense breakdown by category
  const expenseCategories = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const pieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));

  // Summary stats
  const totalEggs = eggRecords.reduce((s, r) => s + (r.totalEggs || 0), 0);
  const totalCrates = eggRecords.reduce((s, r) => s + (r.totalCrates || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const totalMortality = dailyRecords.reduce((s, r) => s + (r.mortality || 0), 0);
  const totalBirds = batches.reduce((s, b) => s + (b.currentQuantity || 0), 0);

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fade-in-up">

      {/* Hero */}
      <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(240,50%,18%), hsl(250,40%,24%))' }}>
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-5 h-5 text-indigo-300" />
          <p className="text-indigo-200/70 text-xs font-bold uppercase tracking-wide">Farm Analytics</p>
        </div>
        <h2 className="text-white text-2xl font-extrabold">Reports Overview</h2>
        <p className="text-white/50 text-xs mt-1">{format(new Date(), 'MMMM yyyy')}</p>

        {/* KPI row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Total Eggs', value: totalEggs.toLocaleString(), icon: '🥚' },
            { label: 'Net Balance', value: `₦${(totalIncome - totalExpense).toLocaleString()}`, icon: '💰' },
            { label: 'Mortality', value: totalMortality.toString(), icon: '📉' },
          ].map(k => (
            <div key={k.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <p className="text-lg">{k.icon}</p>
              <p className="text-white font-extrabold text-sm">{k.value}</p>
              <p className="text-white/50 text-[9px] font-medium uppercase mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Crates', value: totalCrates.toFixed(1), sub: 'All time', icon: Egg, grad: 'from-amber-400 to-orange-500' },
          { label: 'Total Income', value: `₦${totalIncome.toLocaleString()}`, sub: 'All time', icon: DollarSign, grad: 'from-emerald-400 to-green-600' },
          { label: 'Total Expense', value: `₦${totalExpense.toLocaleString()}`, sub: 'All time', icon: DollarSign, grad: 'from-rose-400 to-red-600' },
          { label: 'Total Deaths', value: totalMortality.toString(), sub: `${totalBirds} birds alive`, icon: Activity, grad: 'from-slate-400 to-slate-600' },
        ].map(c => (
          <div key={c.label} className="premium-card border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-3`}>
              <c.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{c.label}</p>
            <p className="text-xl font-extrabold text-foreground mt-0.5">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Egg Production Chart */}
      <div className="premium-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground mb-4">🥚 Egg Production — 14 Days</p>
        {last14Days.some(d => d.eggs > 0) ? (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={last14Days} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
              <defs>
                <linearGradient id="eggAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152,65%,28%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(152,65%,28%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
              />
              <Area type="monotone" dataKey="eggs" stroke="hsl(152,65%,28%)" strokeWidth={2} fill="url(#eggAreaGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No egg data yet</div>
        )}
      </div>

      {/* Mortality Chart */}
      <div className="premium-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground mb-4">📉 Mortality — 14 Days</p>
        {last14Days.some(d => d.mortality > 0) ? (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last14Days} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="mortality" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-36 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl mb-1">✅</p>
              <p className="text-sm font-semibold text-emerald-600">No mortality recorded</p>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Finance Chart */}
      <div className="premium-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground mb-1">💰 Income vs Expense — This Month</p>
        <div className="flex gap-4 mb-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="w-3 h-3 rounded-sm inline-block" style={{background:'hsl(152,60%,35%)'}} /> Income
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="w-3 h-3 rounded-sm inline-block" style={{background:'hsl(0,84%,60%)'}} /> Expense
          </span>
        </div>
        {monthFinance.some(d => d.income > 0 || d.expense > 0) ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthFinance} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, '']}
              />
              <Bar dataKey="income" fill="hsl(152,60%,35%)" radius={[4, 4, 0, 0]} name="Income" maxBarSize={18} />
              <Bar dataKey="expense" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} name="Expense" maxBarSize={18} />

            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No transactions recorded this month</div>
        )}
      </div>

      {/* Expense Breakdown Pie */}
      {pieData.length > 0 && (
        <div className="premium-card border border-border rounded-2xl p-4">
          <p className="text-sm font-bold text-foreground mb-4">📊 Expense Breakdown</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, '']}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((d, i) => {
                  const total = pieData.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  const color = CATEGORY_COLORS[d.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-semibold text-foreground truncate">{d.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground ml-1">{pct}%</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">₦{d.value.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-center">
              <div>
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm font-semibold text-foreground">No expenses yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add cost when restocking inventory to see breakdown here.</p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
