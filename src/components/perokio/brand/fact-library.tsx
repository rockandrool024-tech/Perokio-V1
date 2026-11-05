'use client'

/**
 * B10 Fact Library — the brand's curator shelf.
 *
 * Per Cycle 1 design rationale + Cycle 5b brief:
 *   "Layout: Magazine-style. Featured fact = full-width hero card at top.
 *    Smaller facts = 2-column grid below."
 *
 * Distinct from C01: this is the brand curating THEIR OWN facts (filtered
 * to the active brand). C01 is creators hunting ANY brand's facts.
 *
 * Uses the FactCard component with variant="curator" (built in Cycle 2,
 * finally wired here).
 *
 * Filters: Tier (Hot/Premium/Standard), Status, Sector (industry), Language.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, FACTS, STAGE_LABELS, FACT_STATUS_LABELS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/format'
import { FactCard } from '@/components/perokio/shared/fact-card'
import { easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Library, Flame, Star, Eye, TrendingUp, ShieldCheck, Filter, Search,
  X, ChevronRight, Plus,
} from 'lucide-react'

type TierFilter = 'all' | 'Hot' | 'Premium' | 'Standard'
type StatusFilter = 'all' | 'live' | 'claimed' | 'locked' | 'printed' | 'paid' | 'funded' | 'draft'

const STATUS_OPTIONS: { id: StatusFilter; label: string; color: string }[] = [
  { id: 'all', label: 'All statuses', color: 'text-muted-fg' },
  { id: 'live', label: 'On Wall', color: 'text-lime' },
  { id: 'claimed', label: 'Claimed', color: 'text-orange' },
  { id: 'locked', label: 'Locked', color: 'text-red' },
  { id: 'printed', label: 'Printed', color: 'text-lime' },
  { id: 'paid', label: 'Paid', color: 'text-muted-fg' },
  { id: 'funded', label: 'Funded', color: 'text-teal' },
  { id: 'draft', label: 'Draft', color: 'text-subtle' },
]

const TIER_OPTIONS: { id: TierFilter; label: string; emoji?: string }[] = [
  { id: 'all', label: 'All tiers' },
  { id: 'Hot', label: 'Hot', emoji: '🔥' },
  { id: 'Premium', label: 'Premium', emoji: '⭐' },
  { id: 'Standard', label: 'Standard' },
]

const LANGUAGES = [
  { id: 'all', label: 'All languages' },
  { id: 'ar', label: 'Arabic (MSA)' },
  { id: 'derja', label: 'Tunisian Derja' },
  { id: 'fr', label: 'French' },
  { id: 'en', label: 'English' },
]

export function FactLibrary() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick)
  const setView = usePerokioStore((s) => s.setBrandView)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const t = useT()
  const pick = usePick()

  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [langFilter, setLangFilter] = useState('all')
  const [query, setQuery] = useState('')

  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const brandFacts = useMemo(
    () => FACTS.filter((f) => f.brandId === brand.id),
    [brand.id],
  )

  // Apply filters
  const filtered = brandFacts.filter((f) => {
    if (tierFilter !== 'all' && f.tier !== tierFilter) return false
    if (statusFilter !== 'all' && f.status !== statusFilter) return false
    if (langFilter !== 'all' && f.lang !== langFilter) return false
    if (query && !f.claim.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  // Featured fact = highest-velocity / highest views / most recent
  const featured = filtered.find((f) => f.tier === 'Hot' && f.totalViews > 10000) || filtered[0]
  const rest = filtered.filter((f) => f.id !== featured?.id)

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Library className="h-5 w-5 text-lime" />
            {t('Fact Library')}
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B10</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            {brand.logo} {brand.name} · {brandFacts.length} facts · {brandFacts.filter((f) => f.status === 'live' || f.status === 'claimed').length} active
          </p>
        </div>
        <Button onClick={() => setView('machine')} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90">
          <Plus className="h-4 w-4" />
          New Fact Bundle
        </Button>
      </div>

      {/* === Filters — single row, not a wall === */}
      <div className="glass rounded-2xl p-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your facts…"
            className="w-full ps-10 pe-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-lime/40 placeholder:text-subtle"
          />
        </div>

        {/* Filter chips — tier + status + language in a single scrollable row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted-fg me-1">Tier:</span>
          {TIER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.id}
              active={tierFilter === opt.id}
              onClick={() => setTierFilter(opt.id)}
            >
              {opt.emoji && <span className="me-1">{opt.emoji}</span>}
              {opt.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted-fg me-1">Status:</span>
          {STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.id}
              active={statusFilter === opt.id}
              onClick={() => setStatusFilter(opt.id)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted-fg me-1">Language:</span>
          {LANGUAGES.map((opt) => (
            <FilterChip
              key={opt.id}
              active={langFilter === opt.id}
              onClick={() => setLangFilter(opt.id)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* === Featured hero card (magazine layout) === */}
      {featured && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeEditorial}
        >
          <FeaturedHeroCard
            fact={featured}
            onClick={() => {
              setActiveFact(featured.id)
              setView('script')
            }}
          />
        </motion.section>
      )}

      {/* === Smaller facts — 2-col grid === */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-semibold">
            {filtered.length} {filtered.length === 1 ? 'fact' : 'facts'}
          </h3>
          <span className="text-xs text-muted-fg">
            {rest.length} below the featured
          </span>
        </div>

        {rest.length === 0 ? (
          <div className="glass rounded-2xl border-dashed border-white/10 p-8 text-center">
            <Library className="h-8 w-8 text-muted-fg mx-auto mb-2" />
            <p className="text-sm text-muted-fg">
              {brandFacts.length === 0
                ? 'No facts yet. Create your first Fact Bundle to populate the library.'
                : 'No facts match your filters. Try clearing them.'}
            </p>
            {brandFacts.length === 0 && (
              <Button onClick={() => setView('machine')} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create first fact
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rest.map((fact, i) => (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...easeEditorial, delay: i * 0.05 }}
              >
                <FactCard
                  fact={fact}
                  variant="curator"
                  onClick={() => {
                    setActiveFact(fact.id)
                    setView('script')
                  }}
                  footer={
                    <div className="flex items-center justify-between text-xs text-muted-fg">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span className="font-mono" data-mono>{formatCompact(fact.totalViews)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        CPM spent: <span className="font-mono text-lime" data-mono>${Math.round(fact.totalViews / 1000) * 3}</span>
                      </span>
                    </div>
                  }
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ============================================================================
// FeaturedHeroCard — full-width hero card with rich metadata
// ============================================================================
function FeaturedHeroCard({
  fact,
  onClick,
}: {
  fact: typeof FACTS[number]
  onClick: () => void
}) {
  const t = useT()
  const pick = usePick()
  const verifiedLines = fact.scriptLines.filter((l) => l.sourceId).length
  const totalLines = fact.scriptLines.length
  const cpmSpent = Math.round(fact.totalViews / 1000) * 3

  return (
    <button
      onClick={onClick}
      className="block w-full text-start glass-lime rounded-2xl p-6 hover:bg-lime/[0.08] transition-colors group"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left — featured tag + claim */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="text-[10px] bg-lime text-[#0A0F0D] gap-1">
              <Star className="h-3 w-3 fill-current" />
              FEATURED
            </Badge>
            <span className="text-[10px] font-mono text-muted-fg" data-mono>{fact.code}</span>
            <Badge className="text-[10px] bg-red/15 text-red border border-red/25 gap-1">
              <Flame className="h-3 w-3" />
              {fact.tier}
            </Badge>
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
              {fact.lang.toUpperCase()}
            </Badge>
          </div>

          <h3 className="font-serif text-2xl lg:text-3xl font-semibold leading-tight tracking-tight">
            "{pick(fact.claim, fact.claimAr)}"
          </h3>

          <div className="flex items-center gap-3 text-xs text-muted-fg">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-orange" />
              <span className="font-medium">{fact.trendTag}</span>
            </span>
            <span>·</span>
            <span>{fact.topic}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-lime" />
              <span className="font-mono" data-mono>{verifiedLines}/{totalLines}</span> lines locked
            </span>
          </div>
        </div>

        {/* Right — stats column */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatCell label="Status" value={t(FACT_STATUS_LABELS[fact.status])} accent="lime" />
            <StatCell label="Rating" value={`★ ${fact.rating}`} accent="lime" />
            <StatCell label="Views" value={formatCompact(fact.totalViews)} accent="orange" />
            <StatCell label="CPM spent" value={`$${cpmSpent}`} accent="lime" />
          </div>
          <div className="glass rounded-lg p-2 flex items-center justify-between text-xs">
            <span className="text-muted-fg">Creators</span>
            <span className="font-mono" data-mono>
              {fact.claimedBy.length} / {fact.maxCreators}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1 text-xs text-lime group-hover:translate-x-1 transition-transform">
            View script <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </button>
  )
}

function StatCell({ label, value, accent }: { label: string; value: string; accent: 'lime' | 'orange' }) {
  const color = accent === 'lime' ? 'text-lime' : 'text-orange'
  return (
    <div className="glass rounded-lg p-2 text-center">
      <div className="text-[10px] text-muted-fg uppercase tracking-wider">{label}</div>
      <div className={cn('font-mono text-sm font-bold', color)} data-mono>{value}</div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
        active
          ? 'bg-lime/15 text-lime border-lime/30'
          : 'glass text-muted-fg border-white/10 hover:text-fg hover:bg-white/[0.05]',
      )}
    >
      {children}
    </button>
  )
}
