import { useState, useEffect } from 'react';
import { AiService } from '@/features/ai/services/aiService';
import { Sparkles, Bot, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AiDashboardInsightProps {
  metrics: {
    totalBirds: number;
    layingBirds: number;
    activeHouses: number;
    todayEggs: number;
    todayMortality: number;
    lowStockCount: number;
    upcomingVaccinesCount: number;
  };
}

const CACHE_KEY = 'ai_dashboard_insight_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Only triggers when there's something URGENT:
 *  - Mortality recorded today (birds are dying)
 *  - Overdue or imminent vaccine (within 3 days)
 *  - Critically low stock items
 *
 * Routine events like egg collection do NOT trigger the AI call.
 * Insight is cached in localStorage for 24 hours to conserve API quota.
 */
function hasUrgentCondition(metrics: AiDashboardInsightProps['metrics']): boolean {
  return (
    metrics.todayMortality > 0 ||
    metrics.upcomingVaccinesCount > 0 ||
    metrics.lowStockCount > 0
  );
}

interface CachedInsight {
  text: string;
  timestamp: number;
  conditionKey: string;
}

function getCachedInsight(conditionKey: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedInsight = JSON.parse(raw);
    const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
    const isSameCondition = cached.conditionKey === conditionKey;
    if (!isExpired && isSameCondition) return cached.text;
    return null;
  } catch {
    return null;
  }
}

function setCachedInsight(text: string, conditionKey: string) {
  try {
    const entry: CachedInsight = { text, timestamp: Date.now(), conditionKey };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

export function AiDashboardInsight({ metrics }: AiDashboardInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  const isUrgent = hasUrgentCondition(metrics);

  // Build a key that represents current alert state — if nothing changed, use cache
  const conditionKey = [
    metrics.todayMortality,
    metrics.upcomingVaccinesCount,
    metrics.lowStockCount,
    metrics.todayEggs,
    metrics.layingBirds,
  ].join('|');

  useEffect(() => {
    if (!isUrgent || dismissed) return;

    // Try to use cached insight first (saves API quota)
    const cached = getCachedInsight(conditionKey);
    if (cached) {
      setInsight(cached);
      return;
    }

    // No valid cache — call the API once
    const fetchInsight = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const result = await AiService.getDashboardInsight(metrics);
        setInsight(result);
        setCachedInsight(result, conditionKey);
      } catch {
        setError(true);
        setInsight(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUrgent, conditionKey]);

  if (!isUrgent || dismissed || (!isLoading && !insight && !error)) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-200/60 dark:border-pink-800/40 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-950/30 dark:via-purple-950/20 dark:to-indigo-950/20">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 transition-colors z-10"
        aria-label="Dismiss AI insight"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <div className="p-4 flex gap-3 items-start pr-10">
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
          <Bot className="w-[18px] h-[18px] text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-pink-500 flex-shrink-0" />
            <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest">AI Urgent Alert</span>
          </div>

          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-pink-200/60 dark:bg-pink-800/30 rounded-full animate-pulse" />
              <div className="h-2.5 w-3/4 bg-pink-200/60 dark:bg-pink-800/30 rounded-full animate-pulse" />
            </div>
          ) : error ? (
            <p className="text-xs text-muted-foreground">Couldn't generate insight right now. Check the AI Assistant for detailed advice.</p>
          ) : insight ? (
            <p className="text-xs font-medium text-foreground leading-relaxed">{insight}</p>
          ) : null}

          {/* Link to full AI chat */}
          <Link
            to="/ai-assistant"
            className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
          >
            Ask AI for more details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
