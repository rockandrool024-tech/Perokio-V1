'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePerokioStore } from '@/store/perokio'
import { FACTS, CREATORS, MAX_CPM_PAYOUT } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { Countdown } from '@/components/perokio/shared/countdown'
import { motion } from 'framer-motion'
import { Flame, TrendingUp, Star, Users, Eye, ChevronRight, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Bright gradient combos for Hot Drops cards (gaming-app style)
const HOT_DROPS_GRADIENTS = [
  'linear-gradient(135deg, #FF3D9A 0%, #FFD23F 100%)', // pink → yellow
  'linear-gradient(135deg, #6FD3C7 0%, #D8EF70 100%)', // teal → lime
  'linear-gradient(135deg, #ED7A42 0%, #FF3D9A 100%)', // orange → pink
  'linear-gradient(135deg, #B6A6FF 0%, #6FD3C7 100%)', // violet → teal
]

export function FactsWall() {
  const setView = usePerokioStore((s) => s.setCreatorView)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const claimFact = usePerokioStore((s) => s.claimFact)
  usePerokioStore((s) => s.walletTick)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()
  const [filter, setFilter] = useState<'all' | 'hot' | 'premium' | 'high_cpm'>('all')
  const [q, setQ] = useState('')
  // §2: Auto-advance state — tracks which Hot Drop card was claimed
  // so we can animate it out and slide the next one in.
  const [claimedHotDropId, setClaimedHotDropId] = useState<string | null>(null)
  // §4 Phase 4 §14: swipe-to-dismiss — swiped-left cards fade out without claiming
  const [dismissedHotDropIds, setDismissedHotDropIds] = useState<Set<string>>(new Set())

  const creatorId = 'cr_amira'
  const creator = CREATORS[0]

  const wallFacts = FACTS.filter((f) => ['live', 'claimed'].includes(f.status))
  const filtered = wallFacts.filter((f) => {
    if (q && !f.claim.toLowerCase().includes(q.toLowerCase())) return false
    if (filter === 'hot' && f.tier !== 'Hot') return false
    if (filter === 'premium' && f.tier !== 'Premium') return false
    if (filter === 'high_cpm' && f.baseFee < 15) return false
    return true
  })

  const hotDrops = wallFacts.filter((f) => f.tier === 'Hot').slice(0, 4)

  const handleClaim = (factId: string) => {
    const fact = FACTS.find((f) => f.id === factId)
    if (!fact) return
    if (fact.claimedBy.includes(creatorId)) {
      // Already claimed — go directly to editor
      setActiveFact(factId)
      setView('claim')
      return
    }
    // §2: Auto-advance — claim, toast "next drop", then route to C03 confirmation
    claimFact(factId, creatorId)
    setClaimedHotDropId(factId) // triggers slide-out animation

    // Show "Claimed ✓ — next drop" toast
    toast({
      title: `✓ Claimed`,
      description: `${fact.code} · Next drop loaded. You have 24 hours.`,
    })

    // After a brief delay (for the animation), route to C03 Claim Confirmation
    setTimeout(() => {
      setActiveFact(factId)
      setView('claimconfirm')
    }, 600)
  }

  // For card click (not claim) — go to C02 Fact Detail
  const handleCardClick = (factId: string) => {
    setActiveFact(factId)
    setView('factdetail')
  }

  return (
    <div className="space-y-6">
      {/* === Hot Drops carousel — bright gradient cards === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame className="h-6 w-6 text-red" />
            </motion.div>
            <h2 className="text-xl font-serif font-bold">{t('Hot Drops')} 🔥</h2>
            <Badge className="text-[10px] bg-red/15 text-red border border-red/25 gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red" />
              </span>
              {t('Live')}
            </Badge>
          </div>
          <div className="text-xs text-muted-fg flex items-center gap-2">
            {t('Next refresh')} <Countdown hours={2} size="sm" variant="orange" />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 snap-x">
          {hotDrops.map((f, idx) => {
            // §2: Auto-advance — claimed card animates out (slide + fade)
            const isClaimed = claimedHotDropId === f.id
            // §4 Phase 4 §14: dismissed card (swiped left) fades out
            const isDismissed = dismissedHotDropIds.has(f.id)
            return (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, x: 20 }}
              animate={
                isClaimed
                  ? { opacity: 0, x: -100, scale: 0.8 } // slide out left
                  : isDismissed
                    ? { opacity: 0, scale: 0.6 }       // fade out (dismiss)
                    : { opacity: 1, x: 0 }
              }
              transition={isClaimed || isDismissed ? { duration: 0.5, ease: 'easeOut' } : { delay: idx * 0.07 }}
              whileHover={isClaimed || isDismissed ? undefined : { scale: 1.03, y: -2 }}
              onClick={() => handleClaim(f.id)}
              // §4 Phase 4 §14: swipe-to-dismiss / swipe-to-claim drag gestures
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -100) {
                  // swipe left → dismiss (fade out)
                  setDismissedHotDropIds((prev) => new Set(prev).add(f.id))
                } else if (info.offset.x > 100) {
                  // swipe right → claim (uses existing handleClaim logic)
                  handleClaim(f.id)
                }
              }}
              className="snap-start flex-shrink-0 w-64 text-start rounded-2xl overflow-hidden relative group cursor-grab active:cursor-grabbing"
              style={{ background: HOT_DROPS_GRADIENTS[idx % HOT_DROPS_GRADIENTS.length] }}
            >
              {/* Shimmer animation overlay */}
              <div className="absolute inset-0 animate-gradient-drift opacity-50"
                style={{
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                }}
              />
              <div className="relative z-10 p-4 text-[#0A0F0D]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold opacity-80" data-mono>{f.code}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">🔥 {t('Hot')}</span>
                </div>
                <p className="text-sm font-bold leading-snug line-clamp-2 mb-3 min-h-[40px]">
                  {pick(f.claim, f.claimAr)}
                </p>
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="font-mono" data-mono>${f.baseFee}</span>
                    <span className="opacity-70">+ ${f.cpmRate}/1k</span>
                  </div>
                  <span className="opacity-80 font-mono" data-mono>{f.claimedBy.length}/{f.maxCreators}</span>
                </div>
                {/* Star rating */}
                {f.rating > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold">
                    <Star className="h-3 w-3 fill-current" /> {f.rating}
                    <span className="opacity-70 ms-1">· {f.trendTag}</span>
                  </div>
                )}
              </div>
              {/* Bottom mini thumbnail strip */}
              <div className="relative z-10 h-8 bg-black/20 backdrop-blur-sm flex items-center px-3 gap-1">
                {f.assets.slice(0, 4).map((a, i) => (
                  <span key={i} className="text-sm">{a.thumb}</span>
                ))}
                <span className="ml-auto text-[10px] font-mono text-[#0A0F0D]/80" data-mono>
                  {f.assets.length} assets
                </span>
              </div>
            </motion.button>
            )
          })}
        </div>
        {/* §4 Phase 4 §14: swipe hint text below the carousel */}
        <p className="mt-2 text-[11px] text-muted-fg text-center font-mono" data-mono>
          ← Swipe to dismiss · Swipe to claim →
        </p>
      </div>

      {/* === Creator strip === */}
      <div className="rounded-2xl glass-lime p-4 flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(216,239,112,0.30), rgba(237,122,66,0.20))',
            border: '1px solid rgba(216,239,112,0.35)',
          }}
        >
          {creator.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{creator.name}</span>
            <Badge className="text-[10px] bg-lime/15 text-lime border border-lime/25">{creator.level}</Badge>
            <Badge className="text-[10px] gap-1 bg-white/[0.04] text-muted-fg border border-white/10">
              <Star className="h-3 w-3 fill-lime text-lime" /> {creator.rating}
            </Badge>
          </div>
          <div className="text-xs text-muted-fg mt-0.5">
            {creator.rank} · 🔥 {creator.streak} {t('day streak')} · {t('pending')}{' '}
            <span className="font-mono text-lime" data-mono>${creator.pendingPayout}</span>
          </div>
        </div>
        <div className="text-end">
          <div className="text-xs text-muted-fg">{t('My balance')}</div>
          <div className="text-xl font-mono font-bold tabular-nums text-lime" data-mono>${creator.totalEarned}</div>
        </div>
      </div>

      {/* === Filter & search === */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('Search facts or trends...')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full ps-9 pe-3 py-2.5 rounded-xl glass border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30 placeholder:text-subtle"
          />
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-fg text-sm">🔍</span>
        </div>
        <div className="flex gap-1 p-1 rounded-xl glass">
          {[
            { id: 'all', label: t('All') },
            { id: 'hot', label: `🔥 ${t('Hot')}` },
            { id: 'premium', label: `⭐ ${t('Premium')}` },
            { id: 'high_cpm', label: `💰 ${t('High pay')}` },
          ].map((ft) => (
            <button
              key={ft.id}
              onClick={() => setFilter(ft.id as typeof filter)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === ft.id
                  ? 'bg-lime/15 text-lime border border-lime/25'
                  : 'text-muted-fg hover:text-fg border border-transparent',
              )}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      {/* === Main feed — 2-column masonry === */}
      <div className="columns-1 md:columns-2 gap-4 space-y-4">
        {filtered.map((f, idx) => {
          const claimedByMe = f.claimedBy.includes(creatorId)
          const spotsLeft = f.maxCreators - f.claimedBy.length
          const maxEarning = f.baseFee + MAX_CPM_PAYOUT

          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleCardClick(f.id)}
              className={cn(
                'break-inside-avoid rounded-2xl p-4 transition-all cursor-pointer',
                claimedByMe ? 'glass-lime' : 'glass hover:bg-white/[0.05]',
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-fg" data-mono>{f.code}</span>
                  <Badge
                    className={cn(
                      'text-[10px]',
                      f.tier === 'Hot' && 'bg-red/15 text-red border border-red/25',
                      f.tier === 'Premium' && 'bg-[#B6A6FF]/15 text-[#B6A6FF] border border-[#B6A6FF]/25',
                      f.tier === 'Standard' && 'bg-white/[0.04] text-muted-fg border border-white/10',
                    )}
                  >
                    {f.tier === 'Hot' && <Flame className="h-3 w-3 me-1" />}
                    {t(f.tier)}
                  </Badge>
                  <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">{f.lang.toUpperCase()}</Badge>
                </div>
                {claimedByMe && (
                  <Badge className="text-[10px] gap-1 bg-lime text-[#0A0F0D]">
                    <Sparkles className="h-3 w-3" /> {t('Claimed')}
                  </Badge>
                )}
              </div>

              {/* Mini thumbnail */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl glass">
                  {f.assets[0]?.thumb || '🎬'}
                </div>
                <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">{pick(f.claim, f.claimAr)}</p>
              </div>

              {/* Star rating */}
              {f.rating > 0 && (
                <div className="flex items-center gap-2 text-xs mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn('h-3 w-3', s <= Math.round(f.rating) ? 'fill-lime text-lime' : 'text-white/15')}
                      />
                    ))}
                  </div>
                  <span className="font-mono font-bold text-lime" data-mono>{f.rating}</span>
                  <span className="text-muted-fg">·</span>
                  <TrendingUp className="h-3 w-3 text-muted-fg" />
                  <span className="text-muted-fg font-medium">{f.trendTag}</span>
                </div>
              )}

              {/* Brand */}
              <div className="flex items-center gap-2 text-xs text-muted-fg mb-3 pb-3 border-b border-white/[0.06]">
                <span className="font-medium text-fg/80">{f.brandName}</span>
              </div>

              {/* Payout */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <PayoutCell label={t('Base Fee')} value={`$${f.baseFee}`} accent="lime" />
                <PayoutCell label={t('CPM')} value={`$${f.cpmRate}/1k`} accent="orange" />
                <PayoutCell label={t('Max earn')} value={`$${maxEarning}`} accent="red" />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-muted-fg mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-mono" data-mono>{f.claimedBy.length}/{f.maxCreators}</span>
                  </span>
                  {f.totalViews > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span className="font-mono" data-mono>{formatCompact(f.totalViews)}</span>
                    </span>
                  )}
                </div>
                <span className={cn('font-medium', spotsLeft <= 3 ? 'text-red' : 'text-muted-fg')}>
                  {spotsLeft} {t('spots left')}
                </span>
              </div>

              {/* CTA — stopPropagation so card click doesn't also fire */}
              <Button
                onClick={(e) => { e.stopPropagation(); handleClaim(f.id) }}
                className={cn(
                  'w-full gap-2',
                  claimedByMe
                    ? 'bg-lime text-[#0A0F0D] hover:bg-lime/90'
                    : spotsLeft === 0
                      ? 'bg-white/[0.04] text-muted-fg border border-white/10 cursor-not-allowed'
                      : 'glass hover:bg-white/5 border border-lime/30 text-lime hover:bg-lime/10',
                )}
                disabled={spotsLeft === 0 && !claimedByMe}
              >
                {claimedByMe ? (
                  <>{t('Continue edit')} <ChevronRight className="h-4 w-4" /></>
                ) : spotsLeft === 0 ? (
                  t('Full')
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> {t('Claim · lock within 24h')} <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center text-muted-fg">
          {t('No matching bundles')}
        </div>
      )}
    </div>
  )
}

function PayoutCell({ label, value, accent }: { label: string; value: string; accent: 'lime' | 'orange' | 'red' }) {
  const color = accent === 'lime' ? 'text-lime' : accent === 'orange' ? 'text-orange' : 'text-red'
  return (
    <div className="text-center rounded-lg glass py-2">
      <div className="text-[10px] text-muted-fg">{label}</div>
      <div className={cn('font-mono font-bold', color)} data-mono>{value}</div>
    </div>
  )
}
