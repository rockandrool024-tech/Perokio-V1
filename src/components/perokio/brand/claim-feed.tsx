'use client'

/**
 * B13 Claim Feed — Slack-style vertical activity stream.
 *
 * Per Cycle 5b brief:
 *   "Layout: Vertical feed. Every entry is one line:
 *    [avatar] @handle [action] F-XXX · 2h ago · [view →]
 *    Not a timeline. Not a card grid. Not a clone of B09."
 *
 * Live-updating every 3-5 seconds (simulated).
 * Sample actions: claimed / started editing / locked video / fact expired /
 * printed first version.
 *
 * One job: make the brand feel the velocity of their fact moving through creators.
 * This is the "Brand FOMO" driver from the Cycle 1 research.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, FACTS, CREATORS, VIDEOS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity, Flame, Eye, ChevronRight, Zap, Lock, Sparkles,
  CheckCircle2, TrendingUp, ArrowRight,
} from 'lucide-react'

// ============================================================================
// Activity feed item shape
// ============================================================================
type FeedAction =
  | 'claimed'
  | 'started_editing'
  | 'locked_video'
  | 'printed_first_version'
  | 'fact_expired'
  | 'received_payout'
  | 'joined_pool'

interface FeedItem {
  id: string
  creatorHandle: string  // @handle
  creatorAvatar: string
  creatorName: string
  action: FeedAction
  factCode: string  // F-XXX
  factId: string  // for the "view →" link
  agoMinutes: number  // 2 = "2h ago"
  videoId?: string  // set for printed_first_version → "View Video" navigation
}

// Map action → human-readable verb + icon + color
const ACTION_META: Record<
  FeedAction,
  { verb: string; icon: typeof Flame; color: string; bg: string }
> = {
  claimed: { verb: 'claimed', icon: Zap, color: 'text-lime', bg: 'bg-lime/15' },
  started_editing: { verb: 'started editing', icon: Activity, color: 'text-orange', bg: 'bg-orange/15' },
  locked_video: { verb: 'locked a video for', icon: Lock, color: 'text-red', bg: 'bg-red/15' },
  printed_first_version: { verb: 'printed first version of', icon: Sparkles, color: 'text-lime', bg: 'bg-lime/15' },
  fact_expired: { verb: 'expired — returned to Wall:', icon: TrendingUp, color: 'text-muted-fg', bg: 'bg-white/[0.04]' },
  received_payout: { verb: 'received payout for', icon: CheckCircle2, color: 'text-lime', bg: 'bg-lime/15' },
  joined_pool: { verb: 'joined the creator pool', icon: Flame, color: 'text-orange', bg: 'bg-orange/15' },
}

// ============================================================================
// Generate realistic feed activity from the seed data
// ============================================================================
function generateInitialFeed(brandName: string): FeedItem[] {
  // Use the brand's actual claimed facts + videos to build a realistic activity feed
  const brandFacts = FACTS.filter((f) => f.brandName === brandName)
  const brandVideos = VIDEOS.filter((v) => v.brandName === brandName)
  const items: FeedItem[] = []

  // Recent claims (from claimedBy arrays)
  brandFacts.slice(0, 3).forEach((fact, idx) => {
    fact.claimedBy.forEach((creatorId, cIdx) => {
      const creator = CREATORS.find((c) => c.id === creatorId)
      if (!creator) return
      items.push({
        id: `init-${fact.id}-${cIdx}`,
        creatorHandle: creator.handle,
        creatorAvatar: creator.avatar,
        creatorName: creator.name,
        action: 'claimed',
        factCode: fact.code,
        factId: fact.id,
        agoMinutes: (idx + 1) * 23 + cIdx * 17 + 5,  // varied times
      })
    })
  })

  // Recent locks (from locked_pending videos)
  brandVideos
    .filter((v) => v.stage === 'locked_pending' || v.stage === 'approved_queued' || v.stage === 'published')
    .slice(0, 4)
    .forEach((v, idx) => {
      const creator = CREATORS.find((c) => c.id === v.creatorId)
      if (!creator) return
      items.push({
        id: `lock-${v.id}`,
        creatorHandle: creator.handle,
        creatorAvatar: creator.avatar,
        creatorName: creator.name,
        action: 'locked_video',
        factCode: v.factCode,
        factId: v.factId,
        agoMinutes: 8 + idx * 14,
      })
    })

  // Recent prints (published videos)
  brandVideos
    .filter((v) => v.stage === 'published' || v.stage === 'counting' || v.stage === 'settled')
    .slice(0, 2)
    .forEach((v, idx) => {
      const creator = CREATORS.find((c) => c.id === v.creatorId)
      if (!creator) return
      items.push({
        id: `print-${v.id}`,
        creatorHandle: creator.handle,
        creatorAvatar: creator.avatar,
        creatorName: creator.name,
        action: 'printed_first_version',
        factCode: v.factCode,
        factId: v.factId,
        agoMinutes: 35 + idx * 22,
        videoId: v.id,
      })
    })

  // Sort by recency (smaller agoMinutes = more recent)
  return items.sort((a, b) => a.agoMinutes - b.agoMinutes)
}

// Generate a new random feed item (for live updates)
function generateRandomItem(brandName: string): FeedItem {
  const brandFacts = FACTS.filter((f) => f.brandName === brandName)
  const fact = brandFacts[Math.floor(Math.random() * brandFacts.length)] || FACTS[0]
  const creator = CREATORS[Math.floor(Math.random() * CREATORS.length)]
  const actions: FeedAction[] = [
    'claimed', 'started_editing', 'locked_video', 'printed_first_version', 'received_payout',
  ]
  return {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    creatorHandle: creator.handle,
    creatorAvatar: creator.avatar,
    creatorName: creator.name,
    action: actions[Math.floor(Math.random() * actions.length)],
    factCode: fact.code,
    factId: fact.id,
    agoMinutes: 0,  // just happened
  }
}

// ============================================================================
// Main B13 Claim Feed component
// ============================================================================
export function ClaimFeed() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick)
  const setView = usePerokioStore((s) => s.setBrandView)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const setActiveVideo = usePerokioStore((s) => s.setActiveVideo)
  const t = useT()
  const reduced = useReducedMotion()

  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  // Use a key based on brand.name to reset the component's state when brand changes
  // (avoids the "setState in effect" lint error — React's canonical pattern for
  // "reset state when prop changes" is to remount via key, not sync via effect).
  const [items, setItems] = useState<FeedItem[]>(() => generateInitialFeed(brand.name))

  // === Live updates — new item every 3-5 seconds (per spec) ===
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 2000  // 3-5s
      timer = setTimeout(() => {
        const newItem = generateRandomItem(brand.name)
        // Prepend (newest at top), bump all existing items' age by ~1 min
        setItems((prev) =>
          [newItem, ...prev.map((it) => ({ ...it, agoMinutes: it.agoMinutes + 1 }))]
            .slice(0, 50),  // cap at 50 items
        )
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => clearTimeout(timer)
  }, [brand.name])

  const handleViewItem = (factId: string) => {
    setActiveFact(factId)
    setView('script')
  }

  // §2 Phase 2: contextual action buttons based on the feed action
  // - locked_video → "Review Now" → B12 video review (uses factId)
  // - printed_first_version → "View Video" → B14 detail (uses videoId)
  const handleReviewNow = (factId: string) => {
    setActiveFact(factId)
    setView('review')
  }
  const handleViewVideo = (videoId: string) => {
    setActiveVideo(videoId)
    setView('detail')
  }

  // Aggregate stats for the header
  const lastHourCount = items.filter((i) => i.agoMinutes <= 60).length
  const todayCount = items.filter((i) => i.agoMinutes <= 1440).length

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-lime" />
            Claim Feed
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B13</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            Live activity from creators working on {brand.logo} {brand.name}'s facts
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="glass rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
            </span>
            <span className="font-mono text-lime" data-mono>{lastHourCount}</span>
            <span className="text-muted-fg">in last hour</span>
          </div>
          <div className="glass rounded-lg px-3 py-2 flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-orange" />
            <span className="font-mono text-orange" data-mono>{todayCount}</span>
            <span className="text-muted-fg">today</span>
          </div>
        </div>
      </div>

      {/* === The Slack-style vertical feed === */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Channel-style header */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-fg">#</span>
            <span className="font-mono text-sm font-medium" data-mono>{brand.name.toLowerCase().replace(/\s+/g, '-')}-activity</span>
          </div>
          <span className="text-[10px] text-muted-fg">Auto-refreshing · live</span>
        </div>

        {/* Feed — vertical list of one-line entries */}
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
          <AnimatePresence initial={false}>
            {items.map((item, idx) => {
              const meta = ACTION_META[item.action]
              const Icon = meta.icon
              return (
                <motion.div
                  key={item.id}
                  layout={!reduced}
                  initial={idx === 0 && !reduced ? { opacity: 0, height: 0, y: -10 } : false}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springSnappy}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group',
                    idx === 0 && item.agoMinutes === 0 && 'glass-lime',
                  )}
                >
                  {/* Avatar */}
                  <span className="text-xl shrink-0">{item.creatorAvatar}</span>

                  {/* Action line — single line */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap text-sm">
                    <span className="font-mono text-lime shrink-0" data-mono>
                      {item.creatorHandle}
                    </span>
                    <span className="text-muted-fg shrink-0">{meta.verb}</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0',
                        meta.bg, meta.color,
                      )}
                      data-mono
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {item.factCode}
                    </span>
                    <span className="text-muted-fg shrink-0">·</span>
                    <span className="text-xs text-muted-fg shrink-0">
                      {formatAgo(item.agoMinutes)}
                    </span>
                  </div>

                  {/* View link — far right */}
                  <button
                    onClick={() => handleViewItem(item.factId)}
                    className="flex items-center gap-1 text-xs text-muted-fg hover:text-lime transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    View <ChevronRight className="h-3 w-3" />
                  </button>

                  {/* §2 Phase 2: contextual CTA — Review Now (locked) or View Video (printed) */}
                  {item.action === 'locked_video' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReviewNow(item.factId)
                      }}
                      className="h-7 px-2 text-[11px] text-lime hover:text-lime hover:bg-lime/10 shrink-0 gap-1"
                    >
                      Review Now
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                  {item.action === 'printed_first_version' && item.videoId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewVideo(item.videoId!)
                      }}
                      className="h-7 px-2 text-[11px] text-lime hover:text-lime hover:bg-lime/10 shrink-0 gap-1"
                    >
                      View Video
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-fg">
              No activity yet. Once creators start claiming your facts, you'll see them here in real time.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-muted-fg">
          <span>{items.length} activities shown · max 50</span>
          <span className="font-mono" data-mono>
            Last update: {items[0]?.agoMinutes === 0 ? 'just now' : `${items[0]?.agoMinutes}m ago`}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================
function formatAgo(minutes: number): string {
  if (minutes === 0) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
