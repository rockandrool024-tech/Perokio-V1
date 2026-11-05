'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ShareCardPreview } from '@/components/perokio/shared/share-card-preview'
import { formatCompact, formatUSD } from '@/lib/perokio/format'
import type { FactBundle, Video, Creator, Brand } from '@/lib/perokio/types'
import { easeEditorial } from '@/lib/perokio/motion'
import {
  ShieldCheck, Eye, TrendingUp, Users, Flame, ArrowRight, ExternalLink,
} from 'lucide-react'

/**
 * FactPageView — the visual body of P04.
 *
 * Shows:
 *   - Hero: the verified claim, founding brand, source-locked badge
 *   - Aggregate stats: total creators, total views, total paid out
 *   - Live OG card preview (the shareable card itself)
 *   - All creator versions (sorted by views)
 *   - "More from the Wall" section (other top facts)
 */
interface FactPageViewProps {
  fact: FactBundle
  brand?: Brand
  versionsWithCreators: { video: Video; creator?: Creator }[]
  aggregateViews: number
  aggregateEarnings: number
  otherFacts: FactBundle[]
}

export function FactPageView({
  fact,
  brand,
  versionsWithCreators,
  aggregateViews,
  aggregateEarnings,
  otherFacts,
}: FactPageViewProps) {
  const verifiedLines = fact.scriptLines.filter((l) => l.sourceId).length
  const totalLines = fact.scriptLines.length

  return (
    <div className="space-y-8">
      {/* === Hero — the verified claim === */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className="relative overflow-hidden rounded-2xl glass p-6 lg:p-8"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 600px 400px at 90% -10%, rgba(216,239,112,0.10), transparent 60%)',
          }}
        />
        <div className="relative z-10 space-y-4">
          {/* Header row: fact code + verified badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] text-muted-fg" data-mono>{fact.code}</span>
              <Badge className="text-[10px] bg-lime/15 text-lime border border-lime/25 gap-1">
                <ShieldCheck className="h-3 w-3" />
                VERIFIED · {verifiedLines}/{totalLines} lines locked
              </Badge>
              {fact.tier === 'Hot' && (
                <Badge className="text-[10px] bg-red/15 text-red border border-red/25 gap-1">
                  <Flame className="h-3 w-3" /> HOT
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-fg">
              Published {fact.publishedAt}
            </span>
          </div>

          {/* The claim — the headline of the page */}
          <h1 className="font-serif text-2xl lg:text-4xl font-semibold leading-tight tracking-tight">
            "{fact.claim}"
          </h1>

          {/* Founding brand */}
          <div className="flex items-center gap-3 pt-2">
            {brand && (
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${brand.accent}22`, border: `1px solid ${brand.accent}40` }}
              >
                {brand.logo}
              </div>
            )}
            <div>
              <div className="text-sm font-medium">{fact.brandName}</div>
              <div className="text-xs text-muted-fg">{brand?.industry} · {brand?.location}</div>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <span className="text-xs text-muted-fg">Trend:</span>
              <span className="text-xs font-medium text-orange">{fact.trendTag}</span>
            </div>
          </div>

          {/* Aggregate stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/[0.06]">
            <Stat label="Creators" value={String(fact.claimedBy.length)} icon={Users} accent="lime" />
            <Stat label="Total views" value={formatCompact(aggregateViews)} icon={Eye} accent="orange" />
            <Stat label="Paid out" value={formatUSD(aggregateEarnings)} icon={TrendingUp} accent="lime" />
            <Stat label="Base fee" value={`$${fact.baseFee}`} icon={ShieldCheck} accent="lime" />
          </div>
        </div>
      </motion.section>

      {/* === Live OG card preview === */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs tracking-widest uppercase text-muted-fg">Shareable card</h2>
          <span className="text-[10px] text-subtle">1200 × 630 · auto-generated</span>
        </div>
        <div className="max-w-xl">
          <ShareCardPreview type="fact" fact={fact} />
        </div>
      </section>

      {/* === All creator versions === */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold">
            Creator versions ({versionsWithCreators.length})
          </h2>
          <a
            href="/login"
            className="text-xs glass rounded-full px-3 py-1.5 text-lime hover:bg-lime/10 transition-colors flex items-center gap-1"
          >
            Film your version <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {versionsWithCreators.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-fg">
            No creator versions yet. Be the first to film this fact.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {versionsWithCreators.map(({ video, creator }, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...easeEditorial, delay: i * 0.06 }}
                className="glass rounded-2xl p-4 hover:bg-white/[0.05] transition-colors"
              >
                {/* 9:16 thumbnail */}
                <div className="aspect-[9/16] max-h-40 mx-auto rounded-xl glass flex items-center justify-center text-4xl mb-3">
                  {video.thumbnail}
                </div>
                {/* Creator info */}
                {creator && (
                  <a
                    href={`/creator/${creator.handle.replace('@', '')}`}
                    className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-base">{creator.avatar}</span>
                    <span className="text-xs font-medium truncate">{creator.name}</span>
                    <ExternalLink className="h-3 w-3 text-muted-fg ms-auto" />
                  </a>
                )}
                {/* Stats */}
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-fg">
                    <Eye className="h-3 w-3" />
                    <span className="font-mono" data-mono>{formatCompact(video.views)}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-fg">
                    Platform: <span className="font-mono capitalize" data-mono>{video.platform}</span>
                  </span>
                </div>
                {video.views > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-muted-fg">Earned</span>
                    <span className="font-mono text-lime font-semibold" data-mono>
                      +${video.earningsBase + video.earningsCpm}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* === More from the Wall === */}
      {otherFacts.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-3">More from the Wall</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {otherFacts.map((f) => (
              <Link
                key={f.id}
                href={`/wall/${f.id}`}
                className="glass rounded-xl p-4 hover:bg-white/[0.05] transition-colors block"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-muted-fg" data-mono>{f.code}</span>
                  <span className="text-[10px] text-lime flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> VERIFIED
                  </span>
                </div>
                <p className="text-xs line-clamp-2 min-h-[32px]">{f.claim}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-fg">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-mono" data-mono>{f.claimedBy.length}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span className="font-mono text-lime" data-mono>{formatCompact(f.totalViews)}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: typeof Eye
  accent: 'lime' | 'orange'
}) {
  const color = accent === 'lime' ? 'text-lime' : 'text-orange'
  return (
    <div className="glass rounded-xl p-3 text-center">
      <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
      <div className={`font-mono text-lg lg:text-xl font-bold ${color}`} data-mono>
        {value}
      </div>
      <div className="text-[10px] text-muted-fg uppercase tracking-wider">{label}</div>
    </div>
  )
}
