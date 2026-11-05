'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Countdown } from '@/components/perokio/shared/countdown'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, VIDEOS, FACTS, STAGE_LABELS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film, Lock, CheckCircle2, Sparkles, Video, Eye, ChevronRight, ChevronDown, Calendar, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// Pipeline stages with icons + accent colors
const STAGES = [
  { id: 'drafting', label: 'AI Draft', short: 'AI', icon: Sparkles, color: 'text-teal' },
  { id: 'editing', label: 'Editing', short: 'EDIT', icon: Film, color: 'text-orange' },
  { id: 'locked_pending', label: 'Locked', short: 'LOCK', icon: Lock, color: 'text-red' },
  { id: 'approved_queued', label: 'Approved', short: 'OK', icon: CheckCircle2, color: 'text-lime' },
  { id: 'published', label: 'Printed', short: 'PUB', icon: Video, color: 'text-lime' },
  { id: 'counting', label: 'Counting', short: 'CNT', icon: Eye, color: 'text-lime' },
  { id: 'settled', label: 'Settled', short: 'DONE', icon: CheckCircle2, color: 'text-muted-fg' },
]

// Mock calendar rating dots — Green/Orange/Red per day
const CALENDAR_DAYS = [
  { day: 1, rating: 'green' }, { day: 2, rating: 'green' }, { day: 3, rating: 'orange' },
  { day: 4, rating: 'green' }, { day: 5, rating: 'red' }, { day: 6, rating: 'green' },
  { day: 7, rating: 'green' }, { day: 8, rating: 'orange' }, { day: 9, rating: 'green' },
  { day: 10, rating: 'green' }, { day: 11, rating: 'red' }, { day: 12, rating: 'green' },
  { day: 13, rating: 'green' }, { day: 14, rating: 'green' }, { day: 15, rating: 'orange' },
  { day: 16, rating: 'green' }, { day: 17, rating: 'green' }, { day: 18, rating: 'green' },
  { day: 19, rating: 'red' }, { day: 20, rating: 'green' }, { day: 21, rating: 'green' },
  { day: 22, rating: 'green' }, { day: 23, rating: 'orange' }, { day: 24, rating: 'green' },
  { day: 25, rating: 'green' }, { day: 26, rating: 'green' }, { day: 27, rating: 'green' },
  { day: 28, rating: 'green' }, { day: 29, rating: 'green' }, { day: 30, rating: 'green' },
]

const ratingColor = (r: string) =>
  r === 'green' ? 'bg-lime' : r === 'orange' ? 'bg-orange' : 'bg-red'

// Mock timeline slots — 02:00 PM through 06:00 PM, mapped to NOW line position
const TIMELINE_SLOTS = [
  { time: '10:00 AM', videos: [] as string[] },
  { time: '11:00 AM', videos: ['vid_003'] },
  { time: '12:00 PM', videos: [] as string[] },
  { time: '01:00 PM', videos: ['vid_004'] },
  { time: '02:00 PM', videos: [] as string[] },
  { time: '03:00 PM', videos: ['vid_005', 'vid_008'] },
  { time: '04:00 PM', videos: [] as string[] },
  { time: '05:00 PM', videos: ['vid_001'] },
  { time: '06:00 PM', videos: ['vid_007'] },
  { time: '07:00 PM', videos: [] as string[] },
]
// NOW line is positioned at ~3:30 PM (index 5.5 of 10 slots)
const NOW_LINE_INDEX = 5.5

export function ContentMachine() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick)
  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const setView = usePerokioStore((s) => s.setBrandView)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const setActiveVideo = usePerokioStore((s) => s.setActiveVideo)
  const approveVideo = usePerokioStore((s) => s.approveVideo)
  const publishVideo = usePerokioStore((s) => s.publishVideo)
  const settleVideo = usePerokioStore((s) => s.settleVideo)
  const t = useT()
  const [calendarOpen, setCalendarOpen] = useState(true)

  const brandVideos = VIDEOS.filter((v) => v.brandName === brand.name)
  const brandFacts = FACTS.filter((f) => f.brandId === brand.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Film className="h-5 w-5 text-lime" />
            {t('Content Machine')}
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B09</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            {t('From facts to videos — the full pipeline timeline')} · {brand.logo} {brand.name}
          </p>
        </div>
        <Button onClick={() => setView('library')} variant="outline" size="sm" className="gap-2 glass hover:bg-white/5 border-white/10">
          <Sparkles className="h-4 w-4" /> {t('New Fact Bundle')}
        </Button>
      </div>

      {/* === Collapsible monthly calendar === */}
      <div className="glass rounded-2xl overflow-hidden">
        <button
          onClick={() => setCalendarOpen((o) => !o)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange" />
            <span className="font-serif text-base font-semibold">November 2024</span>
            <span className="text-xs text-muted-fg">· {brandVideos.length} videos · {brandFacts.length} facts</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-fg">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lime" /> Hot</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange" /> Avg</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red" /> Cold</span>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-fg transition-transform', !calendarOpen && '-rotate-90')} />
          </div>
        </button>
        <AnimatePresence initial={false}>
          {calendarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="p-4 grid grid-cols-7 gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-[10px] text-subtle text-center font-medium uppercase">{d}</div>
                ))}
                {CALENDAR_DAYS.map((d) => (
                  <div
                    key={d.day}
                    className="aspect-square rounded-lg glass flex flex-col items-center justify-center gap-1 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-mono text-muted-fg" data-mono>{d.day}</span>
                    <span className={cn('h-1.5 w-1.5 rounded-full', ratingColor(d.rating))} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === Stage header row === */}
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-2">
          {STAGES.map((s) => {
            const count = brandVideos.filter((v) => v.stage === s.id).length
            const Icon = s.icon
            return (
              <div key={s.id} className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-1">
                  <Icon className={cn('h-3.5 w-3.5', s.color)} />
                </div>
                <span className="text-[10px] font-medium text-muted-fg hidden sm:inline">{t(s.label)}</span>
                <span className="text-sm font-mono font-bold text-fg" data-mono>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* === Vertical timeline grid: Time | Node | Card === */}
      <div className="glass rounded-2xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold">{t('Pipeline timeline')}</h3>
          <span className="text-xs text-muted-fg font-mono" data-mono>
            {brandVideos.length} {t('videos')}
          </span>
        </div>

        <div className="relative">
          {/* NOW line — red glowing horizontal line */}
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `calc(${(NOW_LINE_INDEX / TIMELINE_SLOTS.length) * 100}% )` }}
          >
            <div className="relative flex items-center">
              <span className="absolute left-0 -translate-y-1/2 px-2 py-0.5 rounded-md bg-red text-white text-[10px] font-mono font-bold animate-pulse-glow-red" data-mono>
                NOW · 3:30 PM
              </span>
              <div className="w-full h-0.5 bg-red animate-now-line mt-0" />
              <span className="absolute right-0 -translate-y-1/2 h-2 w-2 rounded-full bg-red animate-pulse-glow-red" />
            </div>
          </div>

          {/* Timeline rows */}
          <div className="space-y-3 pt-4">
            {TIMELINE_SLOTS.map((slot, slotIdx) => {
              const slotVideos = brandVideos.filter((v) => slot.videos.includes(v.id))
              const isPast = slotIdx < NOW_LINE_INDEX
              const isFuture = slotIdx > NOW_LINE_INDEX
              return (
                <div key={slot.time} className="grid grid-cols-[80px_40px_1fr] gap-3 items-start">
                  {/* Time column */}
                  <div className="text-xs font-mono text-muted-fg pt-2" data-mono>
                    {slot.time}
                  </div>
                  {/* Node column */}
                  <div className="flex flex-col items-center pt-2">
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full border-2',
                        slotVideos.length > 0
                          ? 'bg-lime border-lime'
                          : isPast
                            ? 'bg-white/[0.04] border-white/10'
                            : 'bg-transparent border-white/10',
                      )}
                    />
                    {slotIdx < TIMELINE_SLOTS.length - 1 && (
                      <div className="w-px h-full bg-white/[0.06] mt-1" style={{ minHeight: '60px' }} />
                    )}
                  </div>
                  {/* Card column */}
                  <div className="space-y-2">
                    {slotVideos.map((v) => (
                      <TimelineVideoCard
                        key={v.id}
                        video={v}
                        t={t}
                        onReview={() => {
                          setActiveVideo(v.id)
                          setView('review')
                        }}
                        onApprove={() => approveVideo(v.id)}
                        onPublish={() => publishVideo(v.id)}
                        onSettle={() => settleVideo(v.id)}
                        onViewScript={() => {
                          setActiveFact(v.factId)
                          setView('script')
                        }}
                      />
                    ))}
                    {slotVideos.length === 0 && (
                      <div className="text-xs text-subtle py-2">—</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {brandFacts.length === 0 && (
        <div className="glass rounded-2xl border-dashed border-white/10 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-fg mx-auto mb-2" />
          <p className="text-sm text-muted-fg">
            {t('No active facts yet. Create your first Fact Bundle in the Library.')}
          </p>
        </div>
      )}
    </div>
  )
}

interface TimelineVideoCardProps {
  video: typeof VIDEOS[number]
  t: (s: string) => string
  onReview: () => void
  onApprove: () => void
  onPublish: () => void
  onSettle: () => void
  onViewScript: () => void
}

function TimelineVideoCard({ video: v, t, onReview, onApprove, onPublish, onSettle, onViewScript }: TimelineVideoCardProps) {
  const stageIdx = STAGES.findIndex((s) => s.id === v.stage)
  const progress = ((stageIdx + 1) / STAGES.length) * 100
  const isLocked = v.stage === 'locked_pending'
  const reviewHoursLeft = v.reviewDeadline ?? 12
  const reviewProgress = (reviewHoursLeft / 12) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass hover:glass-strong transition-all p-3"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-lg flex items-center justify-center text-xl shrink-0 glass">
          {v.thumbnail}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-muted-fg" data-mono>{v.factCode}</span>
                <Badge
                  className={cn(
                    'text-[10px] gap-1 border',
                    v.stage === 'locked_pending' && 'bg-red/10 text-red border-red/25',
                    v.stage === 'editing' && 'bg-orange/10 text-orange border-orange/25',
                    (v.stage === 'published' || v.stage === 'counting') && 'bg-lime/10 text-lime border-lime/25',
                    v.stage === 'settled' && 'bg-white/[0.04] text-muted-fg border-white/10',
                  )}
                >
                  {t(STAGE_LABELS[v.stage])}
                </Badge>
              </div>
              <div className="text-sm font-medium truncate">{v.factClaim}</div>
              <div className="text-xs text-muted-fg flex items-center gap-2 mt-0.5">
                <span>{v.creatorName}</span>
                <span>·</span>
                <span className="capitalize">{v.platform}</span>
                {v.views > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-mono" data-mono>{formatCompact(v.views)} / {formatCompact(v.viewCap)} {t('views')}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {v.stage === 'editing' && v.hoursToLock !== undefined && (
                <Countdown hours={v.hoursToLock} size="sm" variant="orange" showIcon="clock" />
              )}
              {v.stage === 'locked_pending' && v.reviewDeadline !== undefined && (
                <Countdown hours={v.reviewDeadline} size="sm" variant="critical" showIcon="lock" />
              )}
              {v.stage === 'published' && (
                <div className="text-[10px] px-2 py-0.5 rounded bg-lime/10 text-lime font-mono flex items-center gap-1 border border-lime/20" data-mono>
                  <Eye className="h-3 w-3" /> {t('Counting')}
                </div>
              )}
              {v.stage === 'settled' && (
                <div className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-muted-fg font-mono border border-white/10" data-mono>
                  ✓ {t('Settled')}
                </div>
              )}
            </div>
          </div>

          {/* Stage progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1 flex-1 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime to-teal"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span className="text-[10px] text-muted-fg font-mono shrink-0" data-mono>
              {stageIdx + 1}/{STAGES.length}
            </span>
          </div>

          {/* === Locked card: shrinking 12h review progress bar === */}
          {isLocked && (
            <div className="mt-2 rounded-lg glass-red p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-red font-medium flex items-center gap-1">
                  <Lock className="h-3 w-3" /> 12h {t('Review time left')}
                </span>
                <span className="text-[10px] font-mono text-red" data-mono>
                  {reviewHoursLeft}h / 12h
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-red/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-red to-orange"
                  initial={{ width: '100%' }}
                  animate={{ width: `${reviewProgress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ boxShadow: '0 0 8px rgba(229,72,77,0.5)' }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {v.stage === 'locked_pending' && (
              <>
                <Button size="sm" className="h-7 text-xs gap-1 bg-lime text-[#0A0F0D] hover:bg-lime/90" onClick={onReview}>
                  {t('Review')} <ChevronRight className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 glass hover:bg-white/5 border-white/10" onClick={onApprove}>
                  <CheckCircle2 className="h-3 w-3" /> {t('Approve')}
                </Button>
              </>
            )}
            {v.stage === 'approved_queued' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 glass hover:bg-white/5 border-white/10" onClick={onPublish}>
                <Video className="h-3 w-3" /> {t('Publish now')}
              </Button>
            )}
            {v.stage === 'counting' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 glass hover:bg-white/5 border-white/10" onClick={onSettle}>
                <CheckCircle2 className="h-3 w-3" /> {t('Settle early')}
              </Button>
            )}
            {v.stage === 'editing' && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-fg hover:text-fg" onClick={onViewScript}>
                {t('View script')} <ChevronRight className="h-3 w-3" />
              </Button>
            )}
            {(v.stage === 'published' || v.stage === 'settled') && (
              <div className="text-xs text-muted-fg">
                {t('Earnings')} <span className="font-mono font-semibold text-lime" data-mono>
                  ${formatUSDShort(v.earningsBase + v.earningsCpm)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function formatUSDShort(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}
