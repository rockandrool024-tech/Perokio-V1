'use client'

/**
 * B15 Posting Queue — time-slot calendar.
 *
 * Per Cycle 5c brief:
 *   "NOT a clone of B09. B15 is a horizontal time-slot calendar
 *    (Mon-Sun columns, 9am-9pm rows).
 *    Each scheduled post = fact code + creator avatar + platform icons
 *    + scheduled time.
 *    Drag between slots to reschedule.
 *    'Ready to post' section at top: what's queued for next 2 hours.
 *    Filters: This week / Next week / All."
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, VIDEOS, FACTS, CREATORS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/format'
import { easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Clock, ChevronRight, Zap, Video, Eye,
  GripVertical, AlertCircle,
} from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9) // 9am - 9pm

type WeekFilter = 'this' | 'next' | 'all'

// Mock scheduled posts — derived from existing VIDEOS + a few synthetic slots
interface ScheduledPost {
  videoId: string
  factCode: string
  factClaim: string
  creatorAvatar: string
  creatorName: string
  platform: 'tiktok' | 'instagram' | 'youtube'
  day: number // 0-6 (Mon-Sun)
  hour: number // 9-21
  weekOffset: number // 0 = this week, 1 = next week
  views: number
  viewCap: number
}

function getMockSchedule(brandName: string): ScheduledPost[] {
  const brandVideos = VIDEOS.filter(
    (v) => v.brandName === brandName && (v.stage === 'published' || v.stage === 'counting' || v.stage === 'settled'),
  )
  // Spread them across the current week at varied times
  return brandVideos.slice(0, 6).map((v, i) => ({
    videoId: v.id,
    factCode: v.factCode,
    factClaim: v.factClaim,
    creatorAvatar: v.creatorAvatar,
    creatorName: v.creatorName,
    platform: v.platform,
    day: i % 7,
    hour: 10 + (i * 2) % 12,
    weekOffset: i < 4 ? 0 : 1,
    views: v.views,
    viewCap: v.viewCap,
  }))
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TT',
  instagram: 'IG',
  youtube: 'YT',
}

export function PostingQueue() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick)
  const setActiveVideo = usePerokioStore((s) => s.setActiveVideo)
  const setView = usePerokioStore((s) => s.setBrandView)
  const t = useT()
  const pick = usePick()
  const [weekFilter, setWeekFilter] = useState<WeekFilter>('this')
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null)
  // useState initializer runs once on mount; the parent BrandApp passes
  // key={queue-${brandId}} so this component fully remounts on brand change,
  // re-running the initializer with the new brand's data.
  const [schedule, setSchedule] = useState<ScheduledPost[]>(() =>
    getMockSchedule(BRANDS.find((b) => b.id === brandId)?.name || ''),
  )

  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]

  const filtered = schedule.filter((p) => {
    if (weekFilter === 'this') return p.weekOffset === 0
    if (weekFilter === 'next') return p.weekOffset === 1
    return true
  })

  // "Ready to post" = next 2 hours (mock: hour 10-12 today = day 0)
  const nowHour = 10 // mock "now"
  const nowDay = 0 // mock "today = Monday"
  const readyToPost = filtered.filter(
    (p) => p.day === nowDay && p.hour >= nowHour && p.hour <= nowHour + 2,
  )

  // Drag-to-reschedule handlers
  const handleDragStart = (post: ScheduledPost) => setDraggedPost(post)
  const handleDrop = (day: number, hour: number) => {
    if (!draggedPost) return
    setSchedule((prev) =>
      prev.map((p) =>
        p.videoId === draggedPost.videoId
          ? { ...p, day, hour, weekOffset: draggedPost.weekOffset }
          : p,
      ),
    )
    setDraggedPost(null)
  }

  const getPostAt = (day: number, hour: number) =>
    filtered.find((p) => p.day === day && p.hour === hour)

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-lime" />
            Posting Queue
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B15</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            {brand.logo} {brand.name} · drag posts between slots to reschedule
          </p>
        </div>
        {/* Week filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl glass">
          {([
            { id: 'this', label: 'This week' },
            { id: 'next', label: 'Next week' },
            { id: 'all', label: 'All' },
          ] as { id: WeekFilter; label: string }[]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setWeekFilter(opt.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                weekFilter === opt.id
                  ? 'bg-lime/15 text-lime border-lime/30'
                  : 'text-muted-fg hover:text-fg border-transparent',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* === Ready to post (next 2 hours) === */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className="glass-lime rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-lime" />
          <h3 className="font-serif text-base font-semibold">Ready to post</h3>
          <span className="text-xs text-muted-fg">· next 2 hours</span>
          <Badge className="text-[10px] bg-lime text-[#0A0F0D] ms-auto" data-mono>
            {readyToPost.length}
          </Badge>
        </div>
        {readyToPost.length === 0 ? (
          <p className="text-sm text-muted-fg py-2">Nothing scheduled for the next 2 hours.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {readyToPost.map((post) => (
              <button
                key={post.videoId}
                onClick={() => {
                  setActiveVideo(post.videoId)
                  setView('detail')
                }}
                className="flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/[0.05] transition-colors text-start"
              >
                <span className="text-2xl">{post.creatorAvatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{post.factCode}</div>
                  <div className="text-[10px] text-muted-fg font-mono flex items-center gap-1" data-mono>
                    <Clock className="h-3 w-3" />
                    {String(post.hour).padStart(2, '0')}:00 · {post.creatorName}
                  </div>
                </div>
                <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10" data-mono>
                  {PLATFORM_LABELS[post.platform]}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </motion.section>

      {/* === Time-slot calendar (Mon-Sun × 9am-9pm) === */}
      <div className="glass rounded-2xl p-4 overflow-x-auto scrollbar-thin">
        <div className="min-w-[800px]">
          {/* Day header row */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
            <div className="text-[10px] text-muted-fg uppercase tracking-wider" />
            {DAYS.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs font-medium py-2 rounded-lg',
                  idx === nowDay && 'glass-lime text-lime',
                )}
              >
                {day}
                {idx === nowDay && (
                  <div className="text-[9px] text-muted-fg mt-0.5">today</div>
                )}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="space-y-1">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                {/* Hour label */}
                <div className="text-[10px] text-muted-fg font-mono flex items-center justify-end pe-2" data-mono>
                  {String(hour).padStart(2, '0')}:00
                </div>
                {/* Day cells */}
                {DAYS.map((_, dayIdx) => {
                  const post = getPostAt(dayIdx, hour)
                  const isNow = dayIdx === nowDay && hour === nowHour
                  return (
                    <div
                      key={dayIdx}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(dayIdx, hour)}
                      className={cn(
                        'min-h-[56px] rounded-lg border transition-colors',
                        isNow
                          ? 'border-lime/30 bg-lime/[0.04]'
                          : 'border-white/[0.04] hover:border-white/10',
                        draggedPost && 'hover:bg-white/[0.03]',
                      )}
                    >
                      {post && (
                        <motion.button
                          layout
                          draggable
                          onDragStart={() => handleDragStart(post)}
                          onClick={() => {
                            setActiveVideo(post.videoId)
                            setView('detail')
                          }}
                          whileHover={{ scale: 1.02 }}
                          className="w-full h-full p-1.5 text-start rounded-lg glass hover:glass-lime transition-colors group"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <GripVertical className="h-3 w-3 text-muted-fg shrink-0 opacity-50 group-hover:opacity-100" />
                            <span className="text-[10px] font-mono text-muted-fg truncate" data-mono>
                              {post.factCode.split('-').pop()}
                            </span>
                            <span className="text-sm shrink-0">{post.creatorAvatar}</span>
                            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-white/[0.04] text-muted-fg border border-white/10 ms-auto" data-mono>
                              {PLATFORM_LABELS[post.platform]}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-fg truncate">
                            {post.factClaim.slice(0, 22)}…
                          </div>
                        </motion.button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === Footer help === */}
      <div className="glass rounded-xl p-3 flex items-center gap-2 text-xs text-muted-fg">
        <AlertCircle className="h-3.5 w-3.5 text-orange shrink-0" />
        <span>Drag any post card to a different time slot to reschedule. Click a card to view details.</span>
      </div>
    </div>
  )
}
