'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePerokioStore } from '@/store/perokio'
import { FACTS, FACT_STATUS_LABELS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { Search, Flame, Plus, Eye, Users, Star, ChevronRight, FileText } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function FactLibrary() {
  const setView = usePerokioStore((s) => s.setBrandView)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const brandId = usePerokioStore((s) => s.activeBrandId)
  const t = useT()
  const pick = usePick()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'hot' | 'premium' | 'standard'>('all')

  const facts = FACTS.filter((f) => f.brandId === brandId)
  const filtered = facts.filter((f) => {
    if (q && !f.claim.toLowerCase().includes(q.toLowerCase())) return false
    if (filter === 'hot' && f.tier !== 'Hot') return false
    if (filter === 'premium' && f.tier !== 'Premium') return false
    if (filter === 'standard' && f.tier !== 'Standard') return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('Fact Library')}
            <Badge variant="outline" className="text-[10px]">B10</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('Verified fact bundles · one fact = 10 creator videos')}</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> {t('New Fact Bundle')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search claims...')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted/60 border border-border/60">
          {[
            { id: 'all', label: t('All') },
            { id: 'hot', label: `🔥 ${t('Hot')}` },
            { id: 'premium', label: `⭐ ${t('Premium')}` },
            { id: 'standard', label: t('Standard') },
          ].map((ft) => (
            <button
              key={ft.id}
              onClick={() => setFilter(ft.id as typeof filter)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                filter === ft.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f, idx) => {
          const verified = f.scriptLines.filter((l) => l.sourceId).length
          const total = f.scriptLines.length
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card
                className="overflow-hidden hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group h-full"
                onClick={() => {
                  setActiveFact(f.id)
                  setView('script')
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{f.code}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] gap-1',
                          f.tier === 'Hot' && 'border-chart-3/40 text-chart-3',
                          f.tier === 'Premium' && 'border-chart-5/40 text-chart-5'
                        )}
                      >
                        {f.tier === 'Hot' && <Flame className="h-3 w-3" />}
                        {t(f.tier)}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {t(FACT_STATUS_LABELS[f.status])}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium leading-snug line-clamp-2 mb-3">{pick(f.claim, f.claimAr)}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatCompact(f.totalViews)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {f.claimedBy.length}/{f.maxCreators}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {f.rating || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t('Verified lines')}</span>
                      <span className={cn(
                        'ms-1 font-mono font-semibold',
                        verified === total ? 'text-primary' : 'text-chart-3'
                      )}>
                        {verified}/{total}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t('Base Fee')}</span>
                      <span className="ms-1 font-mono font-semibold">${f.baseFee}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('View script')} <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            {t('No matching fact bundles')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
