'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { ShareCardPreview } from '@/components/perokio/shared/share-card-preview'
import { formatCompact, formatUSD } from '@/lib/perokio/format'
import type { Creator, FactBundle, Video, Brand } from '@/lib/perokio/types'
import type { CreatorDisplayStats } from '@/lib/perokio/mock-data'
import { easeEditorial } from '@/lib/perokio/motion'
import { Star, Flame, TrendingUp, Eye, Crown, ShieldCheck, ArrowRight } from 'lucide-react'

/**
 * CreatorProfileView — the visual body of P03.
 *
 * Server component friendly (no client hooks). Shows:
 *   - Hero with avatar, name, level badge, top 3 stats
 *   - Live OG card preview (the shareable card itself)
 *   - Top 3 prints (portfolio thumbnails with views + fact code)
 *   - Brands the creator has printed for
 *   - Footer badge is in the page route (Powered by Perokio)
 */
interface CreatorProfileViewProps {
  creator: Creator
  stats: CreatorDisplayStats
  prints: { video: Video; fact?: FactBundle }[]
  printedBrands: Brand[]
}

export function CreatorProfileView({
  creator,
  stats,
  prints,
  printedBrands,
}: CreatorProfileViewProps) {
  const hasActiveStreak = creator.streak >= 3

  return (
    <div className="space-y-8">
      {/* === Hero — avatar + name + level + top 3 stats === */}
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
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center text-4xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(216,239,112,0.25), rgba(237,122,66,0.20))',
              border: '1px solid rgba(216,239,112,0.3)',
            }}
          >
            {creator.avatar}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
                {creator.name}
              </h1>
              <Badge className="bg-lime/15 text-lime border border-lime/25">
                <Crown className="h-3 w-3 me-1" />
                {creator.level}
              </Badge>
            </div>
            <div className="text-sm text-muted-fg font-mono" data-mono>
              {creator.handle}
            </div>
            <div className="text-sm text-muted-fg">
              {creator.rank} · {creator.location}
            </div>
            {hasActiveStreak && (
              <div className="flex items-center gap-2 text-xs">
                <Flame className="h-3.5 w-3.5 text-orange" />
                <span className="text-orange font-semibold">
                  {creator.streak}-day streak
                </span>
                <span className="text-muted-fg">
                  · {stats.streakCycleDays - (creator.streak % stats.streakCycleDays || stats.streakCycleDays)} days to next reward
                </span>
              </div>
            )}
          </div>

          {/* Top 3 stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <Stat label="Prints" value={String(creator.completedVideos)} icon={ShieldCheck} accent="lime" />
            <Stat label="Total views" value={formatCompact(creator.followers * 4)} icon={Eye} accent="orange" />
            <Stat label="Earned" value={formatUSD(creator.totalEarned)} icon={TrendingUp} accent="lime" />
          </div>
        </div>

        {/* Rating footer */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= Math.round(creator.rating)
                      ? 'fill-lime text-lime'
                      : 'text-white/15'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono font-bold text-lime" data-mono>{creator.rating}</span>
            <span className="text-xs text-muted-fg">·</span>
            <span className="text-xs text-muted-fg">Reliability {creator.reliabilityScore}/100</span>
          </div>
          <a
            href="/login"
            className="text-xs glass rounded-full px-3 py-1.5 text-lime hover:bg-lime/10 transition-colors flex items-center gap-1"
          >
            Join Perokio <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </motion.section>

      {/* === Live OG card preview (the shareable card) === */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs tracking-widest uppercase text-muted-fg">Shareable card</h2>
          <span className="text-[10px] text-subtle">1200 × 630 · auto-generated</span>
        </div>
        <div className="max-w-xl">
          <ShareCardPreview type="creator" creator={creator} />
        </div>
      </section>

      {/* === Top 3 prints (portfolio) === */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-3">Top prints</h2>
        {prints.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-fg">
            No printed videos yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prints.map(({ video, fact }, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...easeEditorial, delay: i * 0.08 }}
                className="glass rounded-2xl p-4"
              >
                {/* Thumbnail */}
                <div className="aspect-[9/16] max-h-32 mx-auto rounded-xl glass flex items-center justify-center text-4xl mb-3">
                  {video.thumbnail}
                </div>
                {/* Meta */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <a
                      href={`/wall/${fact?.id}`}
                      className="font-mono text-muted-fg hover:text-lime transition-colors"
                      data-mono
                    >
                      {video.factCode}
                    </a>
                    <span className="text-muted-fg">{video.brandName}</span>
                  </div>
                  <p className="text-xs line-clamp-2 min-h-[32px]">
                    {fact?.claim.slice(0, 80)}…
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="flex items-center gap-1 text-xs text-muted-fg">
                      <Eye className="h-3 w-3" />
                      <span className="font-mono" data-mono>{formatCompact(video.views)}</span>
                    </span>
                    <span className="font-mono text-xs text-lime" data-mono>
                      +${video.earningsBase + video.earningsCpm}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* === Brands printed for === */}
      {printedBrands.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-3">Printed for</h2>
          <div className="flex flex-wrap gap-2">
            {printedBrands.map((brand) => (
              <div
                key={brand.id}
                className="glass rounded-full px-3 py-1.5 flex items-center gap-2 text-xs"
              >
                <span className="text-base">{brand.logo}</span>
                <span>{brand.name}</span>
                <span className="text-muted-fg">· {brand.industry}</span>
              </div>
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
  icon: typeof Star
  accent: 'lime' | 'orange'
}) {
  const color = accent === 'lime' ? 'text-lime' : 'text-orange'
  return (
    <div className="text-center">
      <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
      <div className={`font-mono text-xl lg:text-2xl font-bold ${color}`} data-mono>
        {value}
      </div>
      <div className="text-[10px] text-muted-fg uppercase tracking-wider">{label}</div>
    </div>
  )
}
