'use client'

/**
 * C06 My Prints — the creator's portfolio grid.
 *
 * Per master spec §4 (C06):
 *   - Portfolio grid of all the creator's videos (filter VIDEOS by creatorId === 'cr_amira')
 *   - Filter by status: All / In Progress / Published / Settled
 *   - Each card: thumbnail (emoji), fact code, status pill (color-coded), views, earnings
 *   - CRITICAL: every in-progress print card (stage = 'editing' or 'locked_pending')
 *     must show a TimerBar with hours=24, layout="bar", size="sm"
 *   - For locked_pending videos, also show a 12h TimerBar for the brand review window
 *   - Click on a published/settled card → setActiveVideo + setCreatorView('wallet')
 *   - motion for card entrance animations
 *   - useLiveEarnings for live view counts on published videos
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { TimerBar } from '@/components/perokio/shared/timer-bar'
import { usePerokioStore } from '@/store/perokio'
import { VIDEOS, STAGE_LABELS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { formatCompact, formatUSD } from '@/lib/perokio/format'
import { useLiveEarnings } from '@/lib/perokio/use-live-views'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import type { Video, VideoStage } from '@/lib/perokio/types'
import { Film, Eye, Clock, Lock, Sparkles, ChevronRight } from 'lucide-react'

const DEMO_CREATOR_ID = 'cr_amira'

type Filter = 'all' | 'in_progress' | 'published' | 'settled'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'published', label: 'Published' },
  { id: 'settled', label: 'Settled' },
]

export function MyPrints() {
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const setActiveVideo = usePerokioStore((s) => s.setActiveVideo)
  usePerokioStore((s) => s.walletTick)
  const t = useT()
  const reduced = useReducedMotion()
  const [filter, setFilter] = useState<Filter>('all')

  const myVideos = VIDEOS.filter((v) => v.creatorId === DEMO_CREATOR_ID)

  const filtered = myVideos.filter((v) => {
    if (filter === 'all') return true
    if (filter === 'in_progress') return v.stage === 'editing' || v.stage === 'locked_pending'
    if (filter === 'published') return v.stage === 'published' || v.stage === 'counting'
    if (filter === 'settled') return v.stage === 'settled'
    return true
  })

  // Sort: in-progress first (most urgent), then by recency
  const sorted = [...filtered].sort((a, b) => {
    const order = (s: VideoStage) =>
      s === 'editing' ? 0 : s === 'locked_pending' ? 1 : s === 'counting' ? 2 : s === 'published' ? 3 : 4
    return order(a.stage) - order(b.stage)
  })

  const counts = {
    all: myVideos.length,
    in_progress: myVideos.filter((v) => v.stage === 'editing' || v.stage === 'locked_pending').length,
    published: myVideos.filter((v) => v.stage === 'published' || v.stage === 'counting').length,
    settled: myVideos.filter((v) => v.stage === 'settled').length,
  }

  const handleCardClick = (v: Video) => {
    // Click on published / settled / counting → go to wallet (which shows the live CPM tracker)
    if (v.stage === 'published' || v.stage === 'counting' || v.stage === 'settled') {
      setActiveVideo(v.id)
      setCreatorView('wallet')
    } else if (v.stage === 'editing') {
      // Editing → C04 editor
      setActiveVideo(null) // wallet tracker uses videoId, but editor uses activeFactId
      setCreatorView('claim')
    }
    // locked_pending → no nav, just review the status (handled in card body)
  }

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Film className="h-5 w-5 text-lime" />
            My Prints
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">C06</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            {myVideos.length} total · {counts.in_progress} active · {counts.published} live · {counts.settled} settled
          </p>
        </div>
      </div>

      {/* === Filter pills === */}
      <div className="flex gap-1 p-1 rounded-xl glass w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
              filter === f.id
                ? 'bg-lime/15 text-lime border border-lime/25'
                : 'text-muted-fg hover:text-fg border border-transparent',
            )}
          >
            {f.label}
            <span
              className={cn(
                'text-[10px] font-mono px-1 rounded',
                filter === f.id ? 'bg-lime/20 text-lime' : 'bg-white/[0.04] text-muted-fg',
              )}
              data-mono
            >
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {/* === Grid === */}
      {sorted.length === 0 ? (
        <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center text-muted-fg">
          <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No prints in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((v, idx) => (
            <PrintCard
              key={v.id}
              video={v}
              index={idx}
              reduced={reduced}
              onClick={() => handleCardClick(v)}
              stageLabel={STAGE_LABELS[v.stage] ?? v.stage}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PrintCard — one portfolio card. In-progress cards MUST show a TimerBar
// (24h lock countdown). locked_pending cards ALSO show a 12h review bar.
// ============================================================================

interface PrintCardProps {
  video: Video
  index: number
  reduced: boolean
  onClick: () => void
  stageLabel: string
  t: (s: string) => string
}

function PrintCard({ video, index, reduced, onClick, stageLabel, t }: PrintCardProps) {
  // Status pill color — per spec
  const stage = video.stage
  const pillStyle =
    stage === 'editing'
      ? 'bg-orange/15 text-orange border border-orange/25'
      : stage === 'locked_pending'
        ? 'bg-red/15 text-red border border-red/25'
        : stage === 'published' || stage === 'counting'
          ? 'bg-lime/15 text-lime border border-lime/25'
          : stage === 'settled'
            ? 'bg-white/[0.04] text-muted-fg border border-white/10'
            : 'bg-white/[0.04] text-muted-fg border border-white/10'

  const isInProgress = stage === 'editing' || stage === 'locked_pending'
  const isLocked = stage === 'locked_pending'
  const isLive = stage === 'published' || stage === 'counting' || stage === 'settled'

  // Live view counts on published / counting videos
  const isCounting = stage === 'published' || stage === 'counting'
  const live = useLiveEarnings(isCounting ? video.id : null)
  const displayViews = isCounting ? live.views : video.views
  const displayEarnings = isCounting ? live.totalEarned : video.earningsBase + video.earningsCpm

  // Hook into the live earnings progress for the progress bar (only when counting)
  const progress = isCounting ? live.progress : video.views / video.viewCap

  const clickable = isLive || stage === 'editing'

  return (
    <motion.button
      type="button"
      onClick={clickable ? onClick : undefined}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...easeEditorial, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={reduced || !clickable ? undefined : { y: -2 }}
      className={cn(
        'relative text-start rounded-2xl overflow-hidden transition-all',
        isLocked ? 'glass-red' : isInProgress ? 'glass-orange' : 'glass hover:bg-white/[0.05]',
        clickable && 'cursor-pointer hover:border-lime/30',
        !clickable && 'cursor-default',
      )}
    >
      {/* === Thumbnail (9:16 mini-preview) === */}
      <div className="relative aspect-[16/10] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(216,239,112,0.10), rgba(237,122,66,0.08), rgba(111,211,199,0.08))',
          }}
        />
        <motion.span
          className="relative text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          animate={reduced ? undefined : { y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {video.thumbnail}
        </motion.span>

        {/* Top-left status pill */}
        <div className="absolute top-2 start-2 z-10">
          <Badge className={cn('text-[10px] gap-1 backdrop-blur', pillStyle)}>
            {isInProgress && <Lock className="h-2.5 w-2.5" />}
            {isLive && <Sparkles className="h-2.5 w-2.5" />}
            {stageLabel}
          </Badge>
        </div>

        {/* Top-right platform */}
        <div className="absolute top-2 end-2 z-10">
          <Badge className="text-[10px] bg-black/40 text-white border border-white/15 backdrop-blur capitalize">
            {video.platform}
          </Badge>
        </div>

        {/* Bottom overlay — fact code */}
        <div className="absolute bottom-2 start-2 end-2 z-10 flex items-center justify-between text-[10px]">
          <span className="font-mono text-white/80 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded" data-mono>
            {video.factCode}
          </span>
          <span className="font-mono text-white/60 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded" data-mono>
            {video.durationSec}s
          </span>
        </div>
      </div>

      {/* === Card body === */}
      <div className="p-3.5 space-y-3">
        {/* Claim text */}
        <p className="text-xs font-medium leading-snug line-clamp-2 min-h-[32px]">
          {video.factClaim}
        </p>

        {/* === CRITICAL: in-progress cards show the 24h lock countdown === */}
        {isInProgress && (
          <div className="rounded-lg p-2.5 bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-fg">
              <Clock className="h-3 w-3 text-orange" />
              <span>{t('24h lock countdown')}</span>
            </div>
            <TimerBar hours={24} layout="bar" size="sm" />
          </div>
        )}

        {/* === locked_pending: ALSO show the 12h brand review window === */}
        {isLocked && (
          <div className="rounded-lg p-2.5 bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-fg">
              <Lock className="h-3 w-3 text-red" />
              <span>Brand review window</span>
            </div>
            <TimerBar hours={12} layout="bar" size="sm" />
          </div>
        )}

        {/* === Views + earnings === */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg p-2 glass">
            <div className="text-[9px] uppercase tracking-wider text-muted-fg flex items-center gap-1">
              <Eye className="h-2.5 w-2.5" /> {t('views')}
            </div>
            <div className="font-mono font-bold text-fg text-sm" data-mono>
              {formatCompact(displayViews)}
            </div>
          </div>
          <div className="rounded-lg p-2 glass">
            <div className="text-[9px] uppercase tracking-wider text-muted-fg">Earned</div>
            <div className={cn('font-mono font-bold text-sm', isLive ? 'text-lime' : 'text-muted-fg')} data-mono>
              {formatUSD(displayEarnings)}
            </div>
          </div>
        </div>

        {/* === Live progress bar for counting/published === */}
        {isLive && (
          <div className="pt-1 space-y-1">
            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime to-teal"
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${Math.min(100, progress * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-fg">
              <span className="font-mono" data-mono>
                {formatCompact(displayViews)} / {formatCompact(video.viewCap)}
              </span>
              {isCounting && (
                <span className="flex items-center gap-1 text-lime">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                  </span>
                  Live
                </span>
              )}
            </div>
          </div>
        )}

        {/* === Footer action === */}
        <div className="flex items-center justify-between text-[10px] text-muted-fg pt-1 border-t border-white/[0.06]">
          <span>{video.brandName}</span>
          {clickable ? (
            <span className="flex items-center gap-0.5 text-lime">
              {isLive ? 'View earnings' : 'Open editor'}
              <ChevronRight className="h-3 w-3" />
            </span>
          ) : (
            <span>Awaiting review</span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
