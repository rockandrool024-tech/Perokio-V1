'use client'

/**
 * U01 Notifications — push-notification feed (NOT a settings screen).
 *
 * Per master spec §4 (U01):
 *   - Retention surface. Slack / Activity feed style.
 *   - Types: claim_approved, video_paid, streak_alert, brand_replied, new_fact_available
 *   - Each card: icon, title, description, timestamp, unread vs read states
 *   - Tap action: navigates to relevant screen
 *       (approved → wallet, new_fact → wall, replied → prints)
 *   - Mock data: 6–8 notifications, mix of read/unread
 *   - Header: "Notifications" + unread count badge
 *   - motion for entrance + AnimatePresence
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { usePerokioStore } from '@/store/perokio'
import { useT } from '@/lib/perokio/i18n'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial, springSnappy } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Wallet, Flame, MessageSquare, Sparkles, Bell,
  ChevronRight, Check, CheckCheck,
} from 'lucide-react'

// Local view-target union — mirrors the subset of CreatorView we route to.
// Not imported from the store (which doesn't export its internal type alias)
// to avoid leaking the store's private types into this component's surface.
type NotificationTargetView = 'wall' | 'wallet' | 'prints' | 'claim'

type NotificationType =
  | 'claim_approved'
  | 'video_paid'
  | 'streak_alert'
  | 'brand_replied'
  | 'new_fact_available'

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  /** minutes ago — formatted to "2h ago", "just now", etc. */
  agoMinutes: number
  read: boolean
}

interface TypeMeta {
  icon: typeof Flame
  color: string
  bg: string
  ring: string
  /** Where tapping the notification should take the creator. */
  view: NotificationTargetView
}

const TYPE_META: Record<NotificationType, TypeMeta> = {
  claim_approved: {
    icon: CheckCircle2,
    color: 'text-lime',
    bg: 'bg-lime/15',
    ring: 'ring-lime/30',
    view: 'wallet',
  },
  video_paid: {
    icon: Wallet,
    color: 'text-lime',
    bg: 'bg-lime/15',
    ring: 'ring-lime/30',
    view: 'wallet',
  },
  streak_alert: {
    icon: Flame,
    color: 'text-orange',
    bg: 'bg-orange/15',
    ring: 'ring-orange/30',
    view: 'wallet',
  },
  brand_replied: {
    icon: MessageSquare,
    color: 'text-red',
    bg: 'bg-red/15',
    ring: 'ring-red/30',
    view: 'prints',
  },
  new_fact_available: {
    icon: Sparkles,
    color: 'text-lime',
    bg: 'bg-lime/15',
    ring: 'ring-lime/30',
    view: 'wall',
  },
}

// === Mock data — 7 notifications, mix of read/unread ===
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'claim_approved',
    title: 'Your video was approved',
    description: 'Café Dar Zaitouna approved your video for F-2024-1101-01. It\'s now queued for publishing.',
    agoMinutes: 4,
    read: false,
  },
  {
    id: 'n2',
    type: 'video_paid',
    title: 'Payout received: 117.80 TND',
    description: 'Your video F-2024-1025-05 reached 10K views. Settlement arrived via Flouci.',
    agoMinutes: 32,
    read: false,
  },
  {
    id: 'n3',
    type: 'new_fact_available',
    title: '🔥 New Hot Drop on the Wall',
    description: 'F-2024-1104-04 · Tunis Tech Hub is funding a Premium bundle ($30 base). 10 spots.',
    agoMinutes: 78,
    read: false,
  },
  {
    id: 'n4',
    type: 'streak_alert',
    title: '14-day streak unlocked',
    description: 'You earned a +$25 streak reward. Keep the chain alive — 14 days to the next tier.',
    agoMinutes: 180,
    read: false,
  },
  {
    id: 'n5',
    type: 'brand_replied',
    title: 'Bloom Cosmetics replied',
    description: 'Feedback on F-2024-1028-03 · "Hook is strong — could you tighten the second beat?"',
    agoMinutes: 240,
    read: true,
  },
  {
    id: 'n6',
    type: 'claim_approved',
    title: 'Your video was approved',
    description: 'Tunis Tech Hub approved F-2024-1103-06. Publishing via Postiz now.',
    agoMinutes: 1440,
    read: true,
  },
  {
    id: 'n7',
    type: 'video_paid',
    title: 'Payout received: 38.00 TND',
    description: 'Video earnings for F-2024-1025-05 settled to your Flouci wallet.',
    agoMinutes: 2880,
    read: true,
  },
]

export function NotificationsView() {
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const t = useT()
  const reduced = useReducedMotion()
  const [items, setItems] = useState<Notification[]>(INITIAL_NOTIFICATIONS)

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const handleTap = (n: Notification) => {
    // Mark as read on tap
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    const meta = TYPE_META[n.type]
    setCreatorView(meta.view)
  }

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Group by recency buckets for the feed rhythm
  const recent = items.filter((n) => n.agoMinutes < 60)
  const today = items.filter((n) => n.agoMinutes >= 60 && n.agoMinutes < 1440)
  const earlier = items.filter((n) => n.agoMinutes >= 1440)

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-lime" />
            {t('Notifications')}
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">U01</Badge>
          </h2>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={reduced ? false : { scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={springSnappy}
              className="min-w-6 h-6 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-bold font-mono bg-red text-white animate-pulse-glow-red"
              data-mono
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all',
              unreadCount === 0
                ? 'text-subtle cursor-not-allowed'
                : 'text-muted-fg hover:text-lime glass hover:bg-white/[0.04]',
            )}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      {/* === Feed — Slack / Activity style === */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Channel-style header */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-fg">#</span>
            <span className="font-mono text-sm font-medium" data-mono>
              amira-notifications
            </span>
          </div>
          <span className="text-[10px] text-muted-fg flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            {unreadCount} unread · {items.length} total
          </span>
        </div>

        {/* === Feed list === */}
        <div className="max-h-[640px] overflow-y-auto scrollbar-thin">
          <AnimatePresence initial={false}>
            {[
              { label: 'Recent', items: recent },
              { label: 'Today', items: today },
              { label: 'Earlier', items: earlier },
            ].map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.label}>
                  {/* Sticky group label */}
                  <div className="sticky top-0 z-10 px-4 py-2 bg-background/80 backdrop-blur-sm text-[10px] uppercase tracking-widest text-subtle border-b border-white/[0.04]">
                    {group.label}
                  </div>
                  {group.items.map((n, idx) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      index={idx}
                      reduced={reduced}
                      onTap={handleTap}
                    />
                  ))}
                </div>
              ),
            )}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-fg">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No notifications yet. New activity will show up here.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-muted-fg">
          <span>Tap a notification to open the relevant screen</span>
          <span className="font-mono" data-mono>
            Last update: {items[0]?.agoMinutes === 0 ? 'just now' : `${items[0]?.agoMinutes}m ago`}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// NotificationRow — one feed entry
// ============================================================================

function NotificationRow({
  notification,
  index,
  reduced,
  onTap,
}: {
  notification: Notification
  index: number
  reduced: boolean
  onTap: (n: Notification) => void
}) {
  const meta = TYPE_META[notification.type]
  const Icon = meta.icon

  return (
    <motion.button
      type="button"
      onClick={() => onTap(notification)}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ ...easeEditorial, delay: Math.min(index * 0.04, 0.32) }}
      whileHover={reduced ? undefined : { backgroundColor: 'rgba(255,255,255,0.02)' }}
      className={cn(
        'relative w-full text-start flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] transition-colors group',
        !notification.read ? 'glass-lime' : 'hover:bg-white/[0.02]',
      )}
    >
      {/* Unread dot — far left, lime */}
      <div className="flex flex-col items-center gap-1 pt-1 shrink-0 w-2">
        {!notification.read && (
          <motion.span
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={springSnappy}
            className="h-2 w-2 rounded-full bg-lime"
            style={{ boxShadow: '0 0 8px rgba(216,239,112,0.5)' }}
          />
        )}
      </div>

      {/* Type icon */}
      <div
        className={cn(
          'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ring-1',
          meta.bg,
          meta.color,
          meta.ring,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              'text-sm font-semibold truncate',
              notification.read ? 'text-muted-fg' : 'text-fg',
            )}
          >
            {notification.title}
          </span>
        </div>
        <p
          className={cn(
            'text-xs leading-snug line-clamp-2',
            notification.read ? 'text-subtle' : 'text-muted-fg',
          )}
        >
          {notification.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-subtle">
          <span className="font-mono" data-mono>
            {formatAgo(notification.agoMinutes)}
          </span>
          <span>·</span>
          <span className="capitalize">{notification.type.replace(/_/g, ' ')}</span>
          {notification.read && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Check className="h-2.5 w-2.5" /> read
              </span>
            </>
          )}
        </div>
      </div>

      {/* View chevron — far right */}
      <ChevronRight className="h-4 w-4 text-subtle group-hover:text-lime transition-colors shrink-0 mt-1.5" />
    </motion.button>
  )
}

function formatAgo(minutes: number): string {
  if (minutes === 0) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
