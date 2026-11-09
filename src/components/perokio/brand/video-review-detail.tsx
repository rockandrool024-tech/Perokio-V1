'use client'

/**
 * B14 Video Review Detail — analytics deep-dive on ONE published video.
 *
 * Per Cycle 5b brief:
 *   "Single-column deep-dive on ONE published video.
 *    Top: Video preview at 9:16 + creator name + fact reference.
 *    Middle: Script line-by-line with timestamps (0:00, 0:05, 0:10...)
 *    and source tags per line. Show which lines were actually delivered
 *    vs which were edited out.
 *    Bottom: 24h view curve (simple line chart), comparison to brand avg,
 *    CPM earned."
 *
 * NOT B12. B12 is "Approve or Reject with 12h countdown."
 * B14 is "Understand why this video performed how it did, after the fact."
 */

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, VIDEOS, FACTS, CREATORS, MAX_CPM_PAYOUT } from '@/lib/perokio/data'
import { getBrandStats } from '@/lib/perokio/mock-data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact, formatUSD, formatDuration } from '@/lib/perokio/format'
import { easeEditorial } from '@/lib/perokio/motion'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Eye, ShieldCheck, TrendingUp, DollarSign, ArrowLeft, ChevronRight,
  CheckCircle2, Clock, Activity, BarChart3, ExternalLink,
} from 'lucide-react'

// 24h view curve data — generated from the video's total views
function generate24hCurve(totalViews: number): { h: string; v: number }[] {
  // Realistic curve: steep early growth, plateau mid-day, slight tail
  const points = [
    { h: '0h', pct: 0.02 },
    { h: '2h', pct: 0.12 },
    { h: '4h', pct: 0.32 },
    { h: '6h', pct: 0.55 },
    { h: '8h', pct: 0.74 },
    { h: '10h', pct: 0.86 },
    { h: '12h', pct: 0.92 },
    { h: '14h', pct: 0.95 },
    { h: '16h', pct: 0.97 },
    { h: '18h', pct: 0.98 },
    { h: '20h', pct: 0.99 },
    { h: '22h', pct: 1.0 },
    { h: '24h', pct: 1.0 },
  ]
  return points.map((p) => ({ h: p.h, v: Math.round(totalViews * p.pct) }))
}

export function VideoReviewDetail() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  const activeVideoId = usePerokioStore((s) => s.activeVideoId)
  const setActiveVideo = usePerokioStore((s) => s.setActiveVideo)
  const setView = usePerokioStore((s) => s.setBrandView)
  usePerokioStore((s) => s.walletTick)
  const t = useT()
  const pick = usePick()
  const reduced = useReducedMotion()
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  // Refs to each line card for scrollIntoView when timeline tab is clicked
  const lineRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Click a timeline tab (L1/L2/L3) → toggle selection AND scroll the line into view
  const handleLineSelect = useCallback((lineId: string | null) => {
    setSelectedLine((prev) => {
      const next = prev === lineId ? null : lineId
      // Scroll into view if we're selecting (not deselecting)
      if (next) {
        setTimeout(() => {
          lineRefs.current[next]?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'center',
          })
        }, 50)
      }
      return next
    })
  }, [reduced])

  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const brandStats = getBrandStats(brand.id)

  // Get the active video — published/counting/settled only (this is the post-mortem screen)
  const brandVideos = VIDEOS.filter(
    (v) =>
      v.brandName === brand.name &&
      ['published', 'counting', 'settled'].includes(v.stage),
  )
  const activeVideo =
    VIDEOS.find((v) => v.id === activeVideoId && brandVideos.includes(v)) ||
    brandVideos[0]

  if (!activeVideo) {
    return (
      <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-fg mx-auto mb-3" />
        <h3 className="text-lg font-serif font-semibold mb-1">No published videos yet</h3>
        <p className="text-sm text-muted-fg mb-4">
          Video Review Detail analyzes videos after they're printed. Approve a video in B12 first.
        </p>
        <Button onClick={() => setView('review')} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go to Video Review (B12)
        </Button>
      </div>
    )
  }

  const fact = FACTS.find((f) => f.id === activeVideo.factId)
  const creator = CREATORS.find((c) => c.id === activeVideo.creatorId)
  const brandAvgCpm = brand.avgCpm
  const videoCpm = activeVideo.views > 0 ? (activeVideo.earningsCpm / activeVideo.views) * 1000 : 0
  const cpmDelta = brandAvgCpm > 0 ? ((videoCpm - brandAvgCpm) / brandAvgCpm) * 100 : 0
  const views24h = generate24hCurve(activeVideo.views)
  const peakHour = views24h.reduce((max, p) => (p.v > max.v ? p : max), views24h[0])

  return (
    <div className="space-y-6">
      {/* === Header with breadcrumb === */}
      <div>
        <button
          onClick={() => setView('machine')}
          className="flex items-center gap-2 text-sm text-muted-fg hover:text-fg transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Content Machine
        </button>
        <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-lime" />
          Video Detail
          <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B14</Badge>
        </h2>
        <p className="text-sm text-muted-fg mt-0.5">
          Post-mortem on a printed video — understand what worked, what didn't.
        </p>
      </div>

      {/* === Top: Video preview + identity === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className="glass rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
      >
        {/* 9:16 preview */}
        <div className="flex justify-center">
          <div
            className="relative rounded-2xl overflow-hidden border-2 border-white/10"
            style={{
              aspectRatio: '9/16',
              width: 'min(220px, 70vw)',
              background:
                'linear-gradient(135deg, rgba(216,239,112,0.12), rgba(237,122,66,0.08), rgba(111,211,199,0.10))',
            }}
          >
            <div className="absolute top-2 start-2 end-2 flex items-center justify-between z-10">
              <Badge className="bg-black/40 text-white backdrop-blur text-[10px] border border-white/10" data-mono>
                9:16 · {activeVideo.durationSec}s
              </Badge>
              <Badge className="bg-black/40 text-white backdrop-blur text-[10px] border border-white/10">
                {activeVideo.platform}
              </Badge>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl drop-shadow-[0_4px_12px_rgba(216,239,112,0.4)]">
                {activeVideo.thumbnail}
              </span>
            </div>
            <div className="absolute bottom-2 start-2 end-2 text-white/90 text-[10px]">
              {activeVideo.publishedAt}
            </div>
          </div>
        </div>

        {/* Identity + key stats */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{creator?.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{activeVideo.creatorName}</div>
              {creator && (
                <div className="text-xs text-muted-fg font-mono" data-mono>
                  {creator.handle} · {creator.level} · ★ {creator.rating}
                </div>
              )}
            </div>
            <Badge className="bg-lime/15 text-lime border border-lime/25 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Printed
            </Badge>
            {activeVideo.successScore > 0 && (
              <Badge
                className={
                  activeVideo.successScore >= 90
                    ? 'text-[10px] bg-lime/15 text-lime border border-lime/25 gap-0.5'
                    : activeVideo.successScore >= 70
                      ? 'text-[10px] bg-orange/15 text-orange border border-orange/25 gap-0.5'
                      : 'text-[10px] bg-white/[0.04] text-muted-fg border border-white/10 gap-0.5'
                }
                data-mono
              >
                ★ {activeVideo.successScore}/100
              </Badge>
            )}
          </div>

          {/* Fact reference */}
          {fact && (
            <button
              onClick={() => {
                usePerokioStore.getState().setActiveFact(fact.id)
                setView('script')
              }}
              className="block w-full text-start glass rounded-xl p-3 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-muted-fg" data-mono>{fact.code}</span>
                <span className="text-[10px] text-lime flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>
              <p className="text-sm line-clamp-2">"{fact.claim}"</p>
              <div className="flex items-center justify-end gap-1 text-xs text-muted-fg mt-2">
                Open script <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          )}

          {/* Key metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Metric label="Total views" value={formatCompact(activeVideo.views)} sub={`of ${formatCompact(activeVideo.viewCap)} cap`} accent="lime" icon={Eye} />
            <Metric label="Earned" value={formatUSD(activeVideo.earningsBase + activeVideo.earningsCpm)} sub={`$${activeVideo.earningsBase} + $${activeVideo.earningsCpm.toFixed(0)}`} accent="lime" icon={DollarSign} />
            <Metric label="Effective CPM" value={`$${videoCpm.toFixed(2)}`} sub={`${cpmDelta >= 0 ? '+' : ''}${cpmDelta.toFixed(0)}% vs avg`} accent={cpmDelta >= 0 ? 'lime' : 'orange'} icon={TrendingUp} />
            <Metric label="Engagement" value={`${((activeVideo.views / (creator?.followers || 1)) * 100).toFixed(1)}%`} sub="views / followers" accent="orange" icon={Activity} />
            {activeVideo.clicks > 0 && (
              <Metric
                label="Clicks"
                value={formatCompact(activeVideo.clicks)}
                sub={`CTR: ${activeVideo.views > 0 ? ((activeVideo.clicks / activeVideo.views) * 100).toFixed(1) : '0.0'}%`}
                accent="orange"
                icon={ExternalLink}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* === Middle: Script line-by-line with timestamps + source tags === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeEditorial, delay: 0.1 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-lime" />
            Script breakdown
          </h3>
          <span className="text-xs text-muted-fg">Tap a line to see its source</span>
        </div>

        {/* Timeline visualization — horizontal bar of script segments.
            Clicking a tab selects + scrolls the line into view (jump-to-line). */}
        <div className="mb-6">
          <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden glass">
            {fact?.scriptLines.map((line, i) => {
              const source = fact.sources.find((s) => s.id === line.sourceId)
              const widthPct = (line.durationSec / activeVideo.durationSec) * 100
              const isSelected = selectedLine === line.id
              return (
                <button
                  key={line.id}
                  onClick={() => handleLineSelect(line.id)}
                  className={cn(
                    'h-full flex items-center justify-center text-[10px] font-mono transition-colors border-r border-white/[0.06] last:border-r-0',
                    isSelected ? 'bg-lime text-[#0A0F0D]' : source ? 'bg-lime/15 text-lime hover:bg-lime/25' : 'bg-red/15 text-red',
                  )}
                  style={{ width: `${widthPct}%` }}
                  data-mono
                  title={`L${i + 1} · ${line.text}`}
                  aria-label={`Jump to line ${i + 1}: ${line.text}`}
                >
                  L{i + 1}
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-fg mt-1 font-mono" data-mono>
            <span>0:00</span>
            <span>0:{String(Math.floor(activeVideo.durationSec / 2)).padStart(2, '0')}</span>
            <span>0:{String(activeVideo.durationSec).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Line-by-line list with timestamps + source tags */}
        <div className="space-y-2">
          {fact?.scriptLines.map((line, i) => {
            const source = fact.sources.find((s) => s.id === line.sourceId)
            const startTime = fact.scriptLines
              .slice(0, i)
              .reduce((s, l) => s + l.durationSec, 0)
            const endTime = startTime + line.durationSec
            const isSelected = selectedLine === line.id
            return (
              <motion.button
                key={line.id}
                ref={(el) => { lineRefs.current[line.id] = el }}
                onClick={() => handleLineSelect(line.id)}
                whileHover={reduced ? undefined : { x: 4 }}
                className={cn(
                  'w-full text-start rounded-xl p-3 border transition-all flex items-start gap-3',
                  isSelected
                    ? 'glass-lime border-lime/40'
                    : source
                      ? 'glass border-white/10 hover:border-lime/30'
                      : 'glass-red border-red/30 border-dashed',
                )}
                style={!source ? { borderStyle: 'dashed' } : undefined}
              >
                {/* Timestamp */}
                <div className="font-mono text-xs text-muted-fg shrink-0 w-12 pt-0.5" data-mono>
                  0:{String(startTime).padStart(2, '0')}–0:{String(endTime).padStart(2, '0')}
                </div>

                {/* Line content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted-fg" data-mono>L{i + 1}</span>
                    {line.isHook && (
                      <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25">
                        Hook
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-fg ms-auto" data-mono>
                      {line.durationSec}s
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{line.text}</p>

                  {/* Source tag */}
                  {source && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                      <ShieldCheck className="h-3 w-3 text-lime" />
                      <span className="text-muted-fg">{source.label}</span>
                      <span className="text-lime font-mono" data-mono>
                        · Fact #{source.id.split('_').pop()?.slice(0, 4).toUpperCase() ?? 'TUN'}
                      </span>
                      <span className="text-muted-fg" data-mono>· {source.verifiedAt}</span>
                    </div>
                  )}
                </div>

                {/* Status icon */}
                <div className="shrink-0">
                  {source ? (
                    <CheckCircle2 className="h-4 w-4 text-lime" />
                  ) : (
                    <span className="text-[10px] text-red font-mono" data-mono>UNVERIFIED</span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* === Bottom: 24h view curve + comparison === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeEditorial, delay: 0.2 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-lime" />
            24-hour view curve
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-muted-fg">
              Peak: <span className="font-mono text-lime" data-mono>{peakHour.h}</span>
              · <span className="font-mono" data-mono>{formatCompact(peakHour.v)}</span>
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={views24h} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D8EF70" stopOpacity={1} />
                <stop offset="100%" stopColor="#6FD3C7" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="h"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
              tickFormatter={(v) => formatCompact(v)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,15,13,0.95)',
                border: '1px solid rgba(216,239,112,0.3)',
                borderRadius: 12,
                fontSize: 12,
                color: '#fff',
                backdropFilter: 'blur(20px)',
              }}
              formatter={(v: number) => [formatCompact(v) + ' views', 'Cumulative']}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="url(#viewsLine)"
              strokeWidth={2}
              dot={{ fill: '#D8EF70', r: 3 }}
              activeDot={{ r: 5, fill: '#D8EF70', stroke: '#0A0F0D', strokeWidth: 2 }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Comparison row */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <ComparisonCard
            label="This video"
            value={`$${videoCpm.toFixed(2)}`}
            sub="effective CPM"
            accent="lime"
          />
          <ComparisonCard
            label={`${brand.name} average`}
            value={`$${brandAvgCpm}`}
            sub="across all videos"
            accent="orange"
          />
          <ComparisonCard
            label="Industry benchmark"
            value={`$${brandStats.industryAvgCpm}`}
            sub={brandStats.industryLabel}
            accent="teal"
          />
        </div>
      </motion.div>

      {/* === Footer: total earned breakdown === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeEditorial, delay: 0.3 }}
        className="glass rounded-2xl p-5"
      >
        <h3 className="font-serif text-lg font-semibold mb-3">Payout breakdown</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-fg">Base fee (paid on lock)</span>
            <span className="font-mono text-lime" data-mono>${activeVideo.earningsBase}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-fg">CPM earnings ({formatCompact(activeVideo.views)} views × $3/1k)</span>
            <span className="font-mono text-lime" data-mono>${activeVideo.earningsCpm.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-white/[0.06]">
            <span className="font-medium">Total paid to {activeVideo.creatorName.split(' ')[0]}</span>
            <span className="font-mono text-lime font-bold text-lg" data-mono>
              ${activeVideo.earningsBase + activeVideo.earningsCpm}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs text-muted-fg">
          <Clock className="h-3 w-3" />
          <span>
            Settled {activeVideo.publishedAt ? `· published ${activeVideo.publishedAt}` : ''}
          </span>
          <span className="ms-auto flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            View on {activeVideo.platform}
          </span>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================
function Metric({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string
  value: string
  sub: string
  accent: 'lime' | 'orange'
  icon: typeof Eye
}) {
  const color = accent === 'lime' ? 'text-lime' : 'text-orange'
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-fg uppercase tracking-wider">{label}</span>
        <Icon className={cn('h-3 w-3', color)} />
      </div>
      <div className={cn('font-mono text-lg font-bold', color)} data-mono>
        {value}
      </div>
      <div className="text-[10px] text-muted-fg mt-0.5">{sub}</div>
    </div>
  )
}

function ComparisonCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: 'lime' | 'orange' | 'teal'
}) {
  const color =
    accent === 'lime' ? 'text-lime' : accent === 'orange' ? 'text-orange' : 'text-teal'
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] text-muted-fg uppercase tracking-wider mb-1">{label}</div>
      <div className={cn('font-mono text-xl font-bold', color)} data-mono>
        {value}
      </div>
      <div className="text-[10px] text-muted-fg mt-0.5">{sub}</div>
    </div>
  )
}
