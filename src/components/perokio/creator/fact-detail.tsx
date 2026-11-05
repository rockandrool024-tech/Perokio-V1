'use client'

/**
 * C02 Fact Detail — the pre-claim "spec sheet" for a Fact Bundle.
 *
 * Per master spec §4 (C02):
 *   - Full fact claim (the verified sentence a creator will print)
 *   - Locked script preview — each line with its verified-source chip
 *   - Verified sources list (the moat — the legal proof behind the script)
 *   - Previous creator versions — thumbnails + view counts (social proof)
 *   - Claim CTA → AnimatedCTA with successLabel="✓ Claimed"
 *   - On claim: claimFact + toast + setActiveFact + setCreatorView('claimconfirm') (C03)
 *
 * Breadcrumb: "Back to Facts Wall" → setCreatorView('wall')
 */

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { usePerokioStore, useActiveFact } from '@/store/perokio'
import { CREATORS, VIDEOS, MAX_CPM_PAYOUT, CPM_RATE } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/format'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial } from '@/lib/perokio/motion'
import {
  ArrowLeft, ShieldCheck, Flame, TrendingUp, Star, Users, Eye,
  Sparkles, Music, ImageIcon, Video as VideoIcon, Clock, Zap,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const DEMO_CREATOR_ID = 'cr_amira'

export function FactDetail() {
  const fact = useActiveFact()
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const claimFact = usePerokioStore((s) => s.claimFact)
  usePerokioStore((s) => s.walletTick)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()
  const reduced = useReducedMotion()

  if (!fact) {
    // No active fact — bounce back to the Wall.
    return (
      <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center">
        <Sparkles className="h-8 w-8 text-muted-fg mx-auto mb-2" />
        <p className="text-sm text-muted-fg">No fact selected.</p>
        <AnimatedCTA variant="ghost" className="mt-4" onClick={() => setCreatorView('wall')}>
          <ArrowLeft className="h-4 w-4" /> {t('Back to Facts Wall')}
        </AnimatedCTA>
      </div>
    )
  }

  const claimedByMe = fact.claimedBy.includes(DEMO_CREATOR_ID)
  const spotsLeft = fact.maxCreators - fact.claimedBy.length
  const isFull = spotsLeft <= 0 && !claimedByMe
  const maxEarning = fact.baseFee + MAX_CPM_PAYOUT
  const totalDuration = fact.scriptLines.reduce((s, l) => s + l.durationSec, 0)
  const verifiedLines = fact.scriptLines.filter((l) => l.sourceId).length
  const allVerified = verifiedLines === fact.scriptLines.length

  // Previous creator versions — videos already printed for this fact (social proof)
  const previousVersions = VIDEOS.filter(
    (v) => v.factId === fact.id && ['published', 'counting', 'settled'].includes(v.stage),
  )

  const handleClaim = () => {
    if (claimedByMe) {
      // Already claimed — go straight to the editor (C04)
      setActiveFact(fact.id)
      setCreatorView('claim')
      return
    }
    if (isFull) return
    claimFact(fact.id, DEMO_CREATOR_ID)
    toast({
      title: `🎯 ${t('Fact Bundle claimed')}`,
      description: `${fact.code} · ${t('You have 24 hours to edit and lock.')}`,
    })
    setActiveFact(fact.id)
    setCreatorView('claimconfirm')
  }

  return (
    <div className="space-y-6">
      {/* === Breadcrumb === */}
      <button
        onClick={() => setCreatorView('wall')}
        className="inline-flex items-center gap-1.5 text-xs text-muted-fg hover:text-lime transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Back to Facts Wall')}
      </button>

      {/* === Hero — full claim text + payout breakdown === */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className={cn(
          'relative overflow-hidden rounded-2xl p-5 lg:p-6',
          allVerified ? 'glass-lime' : 'glass',
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 600px 300px at 90% -10%, rgba(216,239,112,0.12), transparent 60%)',
          }}
        />
        <div className="relative z-10 space-y-4">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-fg" data-mono>{fact.code}</span>
            <Badge
              className={cn(
                'text-[10px] gap-1',
                fact.tier === 'Hot' && 'bg-red/15 text-red border border-red/25',
                fact.tier === 'Premium' && 'bg-[#B6A6FF]/15 text-[#B6A6FF] border border-[#B6A6FF]/25',
                fact.tier === 'Standard' && 'bg-white/[0.04] text-muted-fg border border-white/10',
              )}
            >
              {fact.tier === 'Hot' && <Flame className="h-3 w-3" />}
              {t(fact.tier)}
            </Badge>
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
              {fact.lang.toUpperCase()}
            </Badge>
            <Badge className="text-[10px] gap-1 bg-lime/15 text-lime border border-lime/25">
              <ShieldCheck className="h-3 w-3" /> {t('B11-verified script')}
            </Badge>
            {claimedByMe && (
              <Badge className="text-[10px] gap-1 bg-lime text-[#0A0F0D]">
                <Sparkles className="h-3 w-3" /> {t('Claimed')}
              </Badge>
            )}
          </div>

          {/* === The full verified claim — the centerpiece === */}
          <h2 className="text-xl lg:text-2xl font-serif font-semibold leading-snug">
            "{pick(fact.claim, fact.claimAr)}"
          </h2>

          {/* Brand + trend */}
          <div className="flex items-center gap-3 text-xs text-muted-fg flex-wrap">
            <span className="font-medium text-fg/80">{fact.brandName}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {fact.trendTag}
            </span>
            <span>·</span>
            <span>{fact.topic}</span>
            {fact.rating > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-lime text-lime" />
                  <span className="font-mono text-lime" data-mono>{fact.rating}</span>
                </span>
              </>
            )}
          </div>

          {/* === Payout breakdown === */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <PayoutCell
              label={t('Base Fee')}
              value={`$${fact.baseFee}`}
              accent="lime"
            />
            <PayoutCell
              label={t('CPM Rate')}
              value={`$${CPM_RATE}/1k`}
              accent="orange"
            />
            <PayoutCell
              label={t('Max earn')}
              value={`$${maxEarning}`}
              accent="red"
            />
          </div>

          {/* Claimants + spots */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 text-muted-fg">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="font-mono" data-mono>
                  {fact.claimedBy.length}/{fact.maxCreators}
                </span>
                <span className="opacity-70">{t('claimed').toLowerCase()}</span>
              </span>
              {fact.totalViews > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="font-mono" data-mono>{formatCompact(fact.totalViews)}</span>
                </span>
              )}
            </div>
            <span className={cn('font-medium', spotsLeft <= 3 ? 'text-red' : 'text-muted-fg')}>
              {spotsLeft} {t('spots left')}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === Locked script preview — each line with source chips === */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 font-serif text-base font-semibold">
              <Sparkles className="h-4 w-4 text-teal" />
              {t('Script (locked)')}
            </span>
            <Badge
              className={cn(
                'text-[10px] gap-1',
                allVerified
                  ? 'bg-lime/15 text-lime border border-lime/25'
                  : 'bg-red/15 text-red border border-red/25',
              )}
            >
              <ShieldCheck className="h-3 w-3" />
              <span className="font-mono" data-mono>
                {verifiedLines}/{fact.scriptLines.length}
              </span>
              verified
            </Badge>
          </div>

          <div className="space-y-2">
            {fact.scriptLines.map((l, i) => {
              const source = fact.sources.find((s) => s.id === l.sourceId)
              return (
                <motion.div
                  key={l.id}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...easeEditorial, delay: i * 0.06 }}
                  className={cn(
                    'rounded-lg p-3 glass',
                    l.isHook && 'border-l-2 border-l-orange',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-lime/15 text-lime"
                      data-mono
                    >
                      L{i + 1}
                    </span>
                    {l.isHook && (
                      <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25">
                        {t('Hook')}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-fg font-mono ms-auto flex items-center gap-1" data-mono>
                      <Clock className="h-3 w-3" />
                      {l.durationSec}s
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{l.text}</p>
                  {source ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] flex-wrap">
                      <ShieldCheck className="h-3 w-3 text-lime shrink-0" />
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded font-mono',
                          source.type === 'official' && 'bg-lime/10 text-lime border border-lime/20',
                          source.type === 'news' && 'bg-orange/10 text-orange border border-orange/20',
                          source.type === 'research' && 'bg-[#B6A6FF]/10 text-[#B6A6FF] border border-[#B6A6FF]/20',
                          source.type === 'brand_asset' && 'bg-white/[0.04] text-muted-fg border border-white/10',
                        )}
                        data-mono
                      >
                        {source.type}
                      </span>
                      <span className="text-muted-fg truncate">{source.label}</span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-red">
                      <ShieldCheck className="h-3 w-3" />
                      Unverified line
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-muted-fg">{t('Total duration')}</span>
            <span className="font-mono font-semibold text-fg" data-mono>
              {totalDuration}s
            </span>
          </div>
        </div>

        {/* === Right rail — sources + assets + previous versions === */}
        <div className="space-y-6">
          {/* Verified sources list — the moat */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-lime" />
              <span className="font-serif text-base font-semibold">{t('Sources')}</span>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10 ms-auto" data-mono>
                {fact.sources.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {fact.sources.map((s) => (
                <div key={s.id} className="rounded-lg p-2.5 glass">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded',
                        s.type === 'official' && 'bg-lime/10 text-lime',
                        s.type === 'news' && 'bg-orange/10 text-orange',
                        s.type === 'research' && 'bg-[#B6A6FF]/10 text-[#B6A6FF]',
                        s.type === 'brand_asset' && 'bg-white/[0.04] text-muted-fg',
                      )}
                      data-mono
                    >
                      {s.type}
                    </span>
                    <span className="text-[10px] text-muted-fg font-mono ms-auto" data-mono>
                      {s.verifiedAt}
                    </span>
                  </div>
                  <div className="text-xs font-medium leading-snug">{s.label}</div>
                  <div className="text-[10px] text-muted-fg font-mono mt-0.5" data-mono>
                    {s.url}
                  </div>
                  <div className="text-[10px] text-muted-fg mt-0.5">
                    Verified by {s.verifiedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assets preview */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-base font-semibold">{t('Asset library')}</span>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10" data-mono>
                {fact.assets.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fact.assets.map((a) => {
                const Icon = a.type === 'broll' ? VideoIcon : a.type === 'image' ? ImageIcon : a.type === 'audio' ? Music : Sparkles
                return (
                  <div key={a.id} className="rounded-lg p-2.5 glass">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3 w-3 text-muted-fg" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-fg">{a.type}</span>
                      {a.durationSec && (
                        <span className="text-[9px] text-muted-fg font-mono ms-auto" data-mono>
                          {a.durationSec}s
                        </span>
                      )}
                    </div>
                    <div className="text-lg mb-0.5">{a.thumb}</div>
                    <div className="text-[11px] font-medium leading-tight line-clamp-2">{a.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Previous creator versions — social proof */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-base font-semibold">Previous versions</span>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10" data-mono>
                {previousVersions.length}
              </Badge>
            </div>
            {previousVersions.length === 0 ? (
              <div className="text-xs text-muted-fg py-4 text-center">
                No prints yet — be the first.
              </div>
            ) : (
              <div className="space-y-2">
                {previousVersions.map((v) => {
                  const creator = CREATORS.find((c) => c.id === v.creatorId)
                  return (
                    <div
                      key={v.id}
                      className="flex items-center gap-2.5 rounded-lg p-2 glass hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl glass shrink-0">
                        {v.thumbnail}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {creator?.name ?? v.creatorName}
                        </div>
                        <div className="text-[10px] text-muted-fg flex items-center gap-1">
                          <Eye className="h-2.5 w-2.5" />
                          <span className="font-mono" data-mono>
                            {formatCompact(v.views)}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-lime" data-mono>
                            +${v.earningsBase + v.earningsCpm}
                          </span>
                        </div>
                      </div>
                      <Badge className="text-[9px] bg-white/[0.04] text-muted-fg border border-white/10 capitalize">
                        {v.stage}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Sticky claim CTA bar === */}
      <div className="sticky bottom-4 z-30">
        <div className="glass-strong rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg glass-lime shrink-0">
              {fact.assets[0]?.thumb ?? '🎬'}
            </div>
            <div>
              <div className="text-xs text-muted-fg font-mono" data-mono>{fact.code}</div>
              <div className="text-sm font-semibold">
                {claimedByMe ? 'You already claimed this fact' : isFull ? t('Full') : 'Ready to claim?'}
              </div>
            </div>
          </div>
          <AnimatedCTA
            variant={isFull ? 'ghost' : 'primary'}
            successLabel="✓ Claimed"
            disabled={isFull}
            onClick={handleClaim}
            className="min-w-[200px]"
          >
            {claimedByMe ? (
              <>Continue editing <ArrowLeft className="h-4 w-4 rotate-180" /></>
            ) : isFull ? (
              t('Full')
            ) : (
              <>
                <Zap /> {t('Claim · lock within 24h')}
              </>
            )}
          </AnimatedCTA>
        </div>
      </div>
    </div>
  )
}

// Small local helper — avoids the PayoutCell name collision with FactCard's.
function PayoutCell({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'lime' | 'orange' | 'red'
}) {
  const color = accent === 'lime' ? 'text-lime' : accent === 'orange' ? 'text-orange' : 'text-red'
  return (
    <div className="text-center rounded-lg glass py-2.5">
      <div className="text-[10px] text-muted-fg">{label}</div>
      <div className={cn('font-mono font-bold text-lg', color)} data-mono>
        {value}
      </div>
    </div>
  )
}

// Zap icon — already imported above with the rest of the lucide icons.
