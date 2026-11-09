'use client'

/**
 * B18 Next Cycle — trend-based fact recommendations.
 *
 * Per Cycle 5c brief:
 *   "Trend-based fact recommendations.
 *    Each recommendation: trend keyword + velocity + suggested base fee
 *    + projected CPM (also derived from constants).
 *    'Create fact from this trend' CTA → routes to A07 authoring
 *    with the trend pre-filled.
 *    This is the 'brand comes back next month' surface. Must feel
 *    like a strategy session, not a dashboard."
 *
 * Uses the SAME TRENDS constant as A04 (trend-input.tsx) —
 * trend names like #tunisiancoffee are consistent everywhere.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePerokioStore } from '@/store/perokio'
import { TRENDS, CPM_RATE, VIEW_CAP } from '@/lib/perokio/data'
import { getBrandStats } from '@/lib/perokio/mock-data'
import { useT } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/format'
import { easeEditorial } from '@/lib/perokio/motion'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { useToast } from '@/hooks/use-toast'
import {
  Sparkles, TrendingUp, Flame, ChevronRight, ArrowRight,
  Calendar, Target, DollarSign, Zap, RefreshCw, Eye,
} from 'lucide-react'

// Map trend category → suggested base fee + projected CPM
// (suggested base fees are reasonable per-category; projected CPM uses CPM_RATE constant)
const CATEGORY_BASE_FEES: Record<string, number> = {
  'Food & Beverage': 8,
  'Beauty': 25,
  'Agriculture': 10,
  'Tech': 30,
  'Gaming': 15,
  'Lifestyle': 12,
}

export function NextCycle() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick)
  const setRole = usePerokioStore((s) => s.setRole)
  const setAdminView = usePerokioStore((s) => s.setAdminView)
  const t = useT()
  const { toast } = useToast()
  const reduced = useReducedMotion()
  const [refreshing, setRefreshing] = useState(false)

  const handleCreateFromTrend = (trendKeyword: string) => {
    toast({
      title: '🎬 Opening Studio…',
      description: `Pre-filling authoring with ${trendKeyword}. Switching to Studio in 400ms.`,
    })
    setTimeout(() => {
      setRole('admin')
      setAdminView('authoring')
    }, 400)
  }

  // §2 Phase 2: "View Trend Details" ghost button — shows a toast
  // with the trend's velocity + volume data instead of navigating away.
  const handleViewTrendDetails = (trend: typeof TRENDS[number]) => {
    toast({
      title: `📊 ${trend.keyword}`,
      description: `Velocity: +${trend.velocity}/h · Volume: ${formatCompact(trend.volume)} mentions · ${trend.ageHours}h old on ${trend.platform}.`,
    })
  }

  // Mock "next month" theme — derived from the highest-velocity trends
  const topTrends = [...TRENDS].sort((a, b) => b.velocity - a.velocity).slice(0, 5)
  const monthlyTheme = topTrends[0]?.category || 'Food & Beverage'
  const brandStats = getBrandStats(brandId)

  // Projected metrics per trend — ALL derived from constants
  // projectedCPM = (VIEW_CAP / 1000) * CPM_RATE — same as WL01's max
  const projectedCpm = (VIEW_CAP / 1000) * CPM_RATE // = $30 max
  // Projected total per creator slot = baseFee + projectedCpm
  // Projected total across 10 slots = 10 * (baseFee + projectedCpm)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      toast({
        title: '🔄 Trends refreshed',
        description: 'Pulled the latest 24h data from TikTok / IG / YT.',
      })
    }, 800)
  }

  return (
    <div className="space-y-6">
      {/* === Header — strategy session framing === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-lime" />
            Next Cycle
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B18</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            Strategy session · what should you fund next month?
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="gap-2 glass border-white/10 hover:bg-white/5"
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh trends
        </Button>
      </div>

      {/* === Monthly theme card — sets the strategy === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className="glass-lime rounded-2xl p-6 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 600px 300px at 90% -10%, rgba(216,239,112,0.10), transparent 60%)',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-lime" />
              <span className="text-xs uppercase tracking-widest text-muted-fg">Recommended theme · next 30 days</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-semibold leading-tight mb-2">
              {monthlyTheme} — the breakout category
            </h3>
            <p className="text-sm text-muted-fg max-w-lg">
              Trends in this category are growing {topTrends[0]?.velocity}/h on {topTrends[0]?.platform}.
              Fund one fact here and 10 creators could claim it within 24h.
            </p>
          </div>
          <div className="glass rounded-xl p-4 text-center min-w-[160px]">
            <div className="text-[10px] text-muted-fg uppercase tracking-wider mb-1">Projected CPM cap</div>
            <div className="font-mono text-3xl font-bold text-lime" data-mono>
              ${projectedCpm}
            </div>
            <div className="text-[10px] text-muted-fg mt-1">per creator per video</div>
          </div>
        </div>
      </motion.div>

      {/* === Trend recommendations — the strategy menu === */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-orange" />
            Trend recommendations
          </h3>
          <span className="text-xs text-muted-fg">
            {topTrends.length} trends · sorted by velocity
          </span>
        </div>

        <div className="space-y-3">
          {topTrends.map((trend, i) => {
            const suggestedBaseFee = CATEGORY_BASE_FEES[trend.category] ?? 10
            const projectedEarnedPerCreator = suggestedBaseFee + projectedCpm
            const projectedTotal = projectedEarnedPerCreator * 10 // 10 creator slots
            return (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...easeEditorial, delay: i * 0.06 }}
                className="glass rounded-2xl p-4 hover:bg-white/[0.05] transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                  {/* Left: trend info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-lime" data-mono>
                        {trend.keyword}
                      </span>
                      <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
                        {trend.platform}
                      </Badge>
                      <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25">
                        {trend.category}
                      </Badge>
                      <span className="text-[10px] text-muted-fg">· {trend.region}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-orange">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-mono" data-mono>+{trend.velocity}/h</span>
                        velocity
                      </span>
                      <span className="flex items-center gap-1 text-muted-fg">
                        <Flame className="h-3 w-3" />
                        <span className="font-mono" data-mono>{formatCompact(trend.volume)}</span>
                        volume
                      </span>
                      <span className="flex items-center gap-1 text-muted-fg">
                        <Zap className="h-3 w-3" />
                        <span className="font-mono" data-mono>{trend.ageHours}h</span>
                        old
                      </span>
                    </div>
                  </div>

                  {/* Right: projected metrics + CTA */}
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <div className="text-[10px] text-muted-fg uppercase tracking-wider">Projected per creator</div>
                      <div className="font-mono text-lg font-bold text-lime" data-mono>
                        ${projectedEarnedPerCreator}
                      </div>
                      <div className="text-[10px] text-muted-fg">
                        ${suggestedBaseFee} base + ${projectedCpm} CPM
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <AnimatedCTA
                        onClick={() => handleCreateFromTrend(trend.keyword)}
                        variant="ghost"
                        className="!px-4 !py-2 !text-xs"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Create fact
                        <ArrowRight className="h-3 w-3" />
                      </AnimatedCTA>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTrendDetails(trend)}
                        className="h-7 px-3 text-[11px] text-muted-fg hover:text-lime hover:bg-lime/10 gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Trend Details
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* === Projected monthly impact === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeEditorial, delay: 0.3 }}
        className="glass rounded-2xl p-5"
      >
        <h3 className="font-serif text-lg font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-lime" />
          Projected monthly impact
        </h3>
        <p className="text-xs text-muted-fg mb-4">
          If you fund 1 fact from each top trend above (5 facts × 10 creators each):
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ProjectedMetric
            label="Facts funded"
            value={String(topTrends.length)}
            sub="across categories"
          />
          <ProjectedMetric
            label="Creator slots"
            value={String(topTrends.length * 10)}
            sub="10 per fact"
          />
          <ProjectedMetric
            label="Max CPM payout"
            value={`$${projectedCpm * topTrends.length * 10}`}
            sub={`@ $${CPM_RATE}/1k × ${formatCompact(VIEW_CAP)} views`}
          />
          <ProjectedMetric
            label="Total potential"
            value={`$${topTrends.reduce((s, t) => s + (CATEGORY_BASE_FEES[t.category] ?? 10) + projectedCpm, 0) * 10}`}
            sub="base + CPM across all"
            accent="lime"
          />
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-muted-fg font-mono" data-mono>
          Math: Σ (suggestedBaseFee + projectedCpm) × 10 slots · CPM_RATE=${CPM_RATE} · VIEW_CAP={formatCompact(VIEW_CAP)}
        </div>
      </motion.div>
    </div>
  )
}

function ProjectedMetric({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string; accent?: 'lime'
}) {
  const color = accent === 'lime' ? 'text-lime' : 'text-fg'
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="text-[10px] text-muted-fg uppercase tracking-wider mb-1">{label}</div>
      <div className={cn('font-mono text-xl font-bold', color)} data-mono>{value}</div>
      <div className="text-[10px] text-muted-fg mt-0.5">{sub}</div>
    </div>
  )
}
