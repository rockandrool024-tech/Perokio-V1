'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Flame, TrendingUp, Star, Users, Eye, ShieldCheck } from 'lucide-react'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { springSoft, easeEditorial } from '@/lib/perokio/motion'
import type { FactBundle } from '@/lib/perokio/types'
import type { ReactNode } from 'react'

type FactCardVariant = 'curator' | 'hunt' | 'review' | 'pipeline'

interface FactCardProps {
  fact: FactBundle
  variant?: FactCardVariant
  /** Click handler — opens detail / claim / review / etc. */
  onClick?: () => void
  /** Optional footer slot (CTAs, metadata). */
  footer?: ReactNode
  /** Show the claim text? Some variants (curator) hide it to save space. */
  showClaim?: boolean
  /** Show the trend tag? */
  showTrend?: boolean
  /** Show the rating row? */
  showRating?: boolean
  className?: string
}

/**
 * FactCard — the reusable fact-bundle card.
 *
 * Per §6: "FactCard (used in B10, B12, C01, A01)"
 *
 * Variants:
 *   - curator  (B10 Fact Library): magazine-style, large, with rating + trend
 *   - hunt     (C01 Facts Wall): compact, payout-focused, claim CTA
 *   - review   (B12 Video Review): with script-locked badge, minimal info
 *   - pipeline (A01 Brand Pipeline): minimal, just code + brand + status
 *
 * All variants share the same glassmorphism style and the verified-lines indicator.
 */
export function FactCard({
  fact,
  variant = 'hunt',
  onClick,
  footer,
  showClaim = true,
  showTrend = true,
  showRating = true,
  className,
}: FactCardProps) {
  const t = useT()
  const pick = usePick()
  const reduced = useReducedMotion()

  const verifiedLines = fact.scriptLines.filter((l) => l.sourceId).length
  const totalLines = fact.scriptLines.length
  const allVerified = verifiedLines === totalLines
  const spotsLeft = fact.maxCreators - fact.claimedBy.length

  const tierBadge =
    fact.tier === 'Hot'
      ? 'bg-red/15 text-red border border-red/25'
      : fact.tier === 'Premium'
        ? 'bg-[#B6A6FF]/15 text-[#B6A6FF] border border-[#B6A6FF]/25'
        : 'bg-white/[0.04] text-muted-fg border border-white/10'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0.15 } : easeEditorial}
      whileHover={reduced ? undefined : { scale: 1.01, y: -2 }}
      className={cn(
        'relative w-full text-start rounded-2xl p-4 transition-colors',
        variant === 'curator' && 'glass p-5',
        variant === 'hunt' && 'glass hover:bg-white/[0.05]',
        variant === 'review' && 'glass-lime',
        variant === 'pipeline' && 'glass',
        allVerified && variant !== 'review' && 'glass-lime',
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-muted-fg" data-mono>
            {fact.code}
          </span>
          <Badge className={cn('text-[10px] gap-1', tierBadge)}>
            {fact.tier === 'Hot' && <Flame className="h-3 w-3" />}
            {t(fact.tier)}
          </Badge>
          <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
            {fact.lang.toUpperCase()}
          </Badge>
        </div>

        {/* Verified-lines indicator — the moat signal */}
        {variant !== 'pipeline' && (
          <Badge
            className={cn(
              'text-[10px] gap-1 shrink-0',
              allVerified
                ? 'bg-lime/15 text-lime border border-lime/25'
                : 'bg-red/15 text-red border border-red/25',
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            <span className="font-mono" data-mono>
              {verifiedLines}/{totalLines}
            </span>
          </Badge>
        )}
      </div>

      {/* Claim text */}
      {showClaim && (
        <p
          className={cn(
            'text-sm font-medium leading-snug line-clamp-2 mb-2',
            variant === 'curator' && 'text-base',
          )}
        >
          {pick(fact.claim, fact.claimAr)}
        </p>
      )}

      {/* Trend + rating */}
      {showTrend && (
        <div className="flex items-center gap-2 text-xs text-muted-fg mb-2">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">{fact.trendTag}</span>
          <span>·</span>
          <span>{fact.topic}</span>
        </div>
      )}

      {showRating && fact.rating > 0 && (
        <div className="flex items-center gap-2 text-xs mb-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  'h-3 w-3',
                  s <= Math.round(fact.rating) ? 'fill-lime text-lime' : 'text-white/15',
                )}
              />
            ))}
          </div>
          <span className="font-mono font-bold text-lime" data-mono>
            {fact.rating}
          </span>
        </div>
      )}

      {/* Payout cells — only for hunt variant (creator-facing) */}
      {variant === 'hunt' && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <PayoutCell label={t('Base Fee')} value={`$${fact.baseFee}`} accent="lime" />
          <PayoutCell label={t('CPM')} value={`$${fact.cpmRate}/1k`} accent="orange" />
          <PayoutCell
            label={t('Max earn')}
            value={`$${fact.baseFee + (fact.maxCreators * 0 + 30)}`}
            accent="red"
          />
        </div>
      )}

      {/* Footer (claimants + views + spots left) */}
      {footer ?? (
        <div className="flex items-center justify-between text-xs text-muted-fg">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="font-mono" data-mono>
                {fact.claimedBy.length}/{fact.maxCreators}
              </span>
            </span>
            {fact.totalViews > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span className="font-mono" data-mono>
                  {formatCompact(fact.totalViews)}
                </span>
              </span>
            )}
          </div>
          <span className={cn('font-medium', spotsLeft <= 3 ? 'text-red' : 'text-muted-fg')}>
            {spotsLeft} {t('spots left')}
          </span>
        </div>
      )}
    </motion.button>
  )
}

function PayoutCell({ label, value, accent }: { label: string; value: string; accent: 'lime' | 'orange' | 'red' }) {
  const color = accent === 'lime' ? 'text-lime' : accent === 'orange' ? 'text-orange' : 'text-red'
  return (
    <div className="text-center rounded-lg glass py-2">
      <div className="text-[10px] text-muted-fg">{label}</div>
      <div className={cn('font-mono font-bold', color)} data-mono>
        {value}
      </div>
    </div>
  )
}
