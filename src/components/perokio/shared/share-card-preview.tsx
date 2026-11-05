'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial } from '@/lib/perokio/motion'
import { ParrotLogo } from './parrot-logo'
import type { Creator, FactBundle } from '@/lib/perokio/types'
import { formatCompact, formatUSD } from '@/lib/perokio/live'

type ShareCardType = 'creator' | 'fact' | 'payout'

interface ShareCardPreviewProps {
  type: ShareCardType
  /** For 'creator' type. */
  creator?: Creator
  /** For 'fact' + 'payout' types. */
  fact?: FactBundle
  /** For 'payout' type. */
  amount?: number
  className?: string
  /** Compact (no animation, for OG export preview). */
  static?: boolean
}

/**
 * ShareCardPreview — the OG card preview component.
 *
 * Per §4 of the master spec:
 *   - Every creator profile has an auto-generated OG card (1200×630) showing name,
 *     level badge, top 3 stats, and "Powered by Perokio."
 *   - Every printed fact has an OG card showing fact text, brand logo, creator count,
 *     and total views.
 *   - Every wallet payout generates a shareable "I earned $X on Perokio" card (opt-in).
 *
 * Used in P03 (creator profile), P04 (printed fact page), WL01 (payout share),
 * and C07 (profile editor live preview).
 */
export function ShareCardPreview({
  type,
  creator,
  fact,
  amount,
  className,
  static: isStatic = false,
}: ShareCardPreviewProps) {
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced

  // 1200×630 is the OG card spec. We render at a scaled-down ratio (600×315)
  // for the in-app preview; the OG image route will render at full res.
  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.96 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={animate ? easeEditorial : { duration: 0 }}
      className={cn(
        'relative rounded-2xl overflow-hidden border border-white/10',
        // 1200:630 = 40:21 aspect ratio
        'aspect-[40/21]',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, #0A0F0D 0%, #14201A 50%, #0A0F0D 100%)',
      }}
    >
      {/* Ambient parrot glow */}
      <div
        className="absolute -top-20 -end-20 w-60 h-60 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(216,239,112,0.4), transparent 70%)' }}
      />

      {/* Content layer */}
      <div className="relative z-10 h-full p-5 flex flex-col">
        {/* Header — parrot + brand mark */}
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center gap-2">
            <ParrotLogo size={28} />
            <span className="font-serif text-base font-semibold tracking-tight text-fg">Perokio</span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-fg" data-mono>
            {type === 'creator' ? 'Creator' : type === 'fact' ? 'Verified Fact' : 'Payout'}
          </span>
        </div>

        {/* Body — depends on type */}
        {type === 'creator' && creator && <CreatorBody creator={creator} />}
        {type === 'fact' && fact && <FactBody fact={fact} />}
        {type === 'payout' && fact && amount !== undefined && <PayoutBody fact={fact} amount={amount} />}

        {/* Footer — "Powered by Perokio" */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
          <span className="text-[10px] text-muted-fg">Powered by</span>
          <span className="font-serif text-xs font-semibold text-lime">Perokio</span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Bodies
// ============================================================================

function CreatorBody({ creator }: { creator: Creator }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-2 py-2">
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(216,239,112,0.25), rgba(237,122,66,0.20))',
            border: '1px solid rgba(216,239,112,0.3)',
          }}
        >
          {creator.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-lg font-bold truncate text-fg">{creator.name}</div>
          <div className="text-[11px] text-muted-fg font-mono" data-mono>
            {creator.handle}
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-lime/15 text-lime text-[10px] font-bold border border-lime/25">
          {creator.level}
        </span>
      </div>

      {/* Top 3 stats — the social proof */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <Stat label="Prints" value={String(creator.completedVideos)} accent="lime" />
        <Stat label="Views" value={formatCompact(creator.followers * 4)} accent="orange" />
        <Stat label="Earned" value={formatUSD(creator.totalEarned)} accent="lime" />
      </div>
    </div>
  )
}

function FactBody({ fact }: { fact: FactBundle }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-2 py-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-mono text-muted-fg" data-mono>{fact.code}</span>
        <span className="text-[10px] text-lime">·</span>
        <span className="text-[11px] font-medium text-fg">{fact.brandName}</span>
      </div>
      <p className="font-serif text-base font-semibold leading-snug line-clamp-3 text-fg">
        "{fact.claim}"
      </p>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Stat label="Creators" value={String(fact.claimedBy.length)} accent="orange" />
        <Stat label="Total views" value={formatCompact(fact.totalViews)} accent="lime" />
      </div>
    </div>
  )
}

function PayoutBody({ fact, amount }: { fact: FactBundle; amount: number }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-2 py-2">
      <p className="font-serif text-base font-semibold leading-snug text-fg">
        I earned
      </p>
      <div
        className="font-mono font-bold text-4xl tabular-nums text-lime"
        style={{ textShadow: '0 0 24px rgba(216,239,112,0.4)' }}
        data-mono
      >
        {formatUSD(amount)}
      </div>
      <p className="text-[11px] text-muted-fg">
        on a verified fact from <span className="text-fg">{fact.brandName}</span>
      </p>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: 'lime' | 'orange' }) {
  const color = accent === 'lime' ? 'text-lime' : 'text-orange'
  return (
    <div className="rounded-lg glass p-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-muted-fg">{label}</div>
      <div className={cn('font-mono font-bold text-sm', color)} data-mono>{value}</div>
    </div>
  )
}
