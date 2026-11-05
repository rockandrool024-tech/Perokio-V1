'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PIPELINE_BRANDS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { formatUSD } from '@/lib/perokio/live'
import { Building2, Users, DollarSign, TrendingUp, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'
import type { PipelineBrand } from '@/lib/perokio/types'

// English source labels — passed through t() for Arabic
const STAGE_META = {
  lead: { label: 'Lead', color: 'text-muted-foreground', bg: 'bg-muted' },
  demo: { label: 'Demo', color: 'text-chart-4', bg: 'bg-chart-4/10' },
  pilot: { label: 'Pilot', color: 'text-chart-2', bg: 'bg-chart-2/10' },
  active: { label: 'Active', color: 'text-primary', bg: 'bg-primary/10' },
  churned: { label: 'Churned', color: 'text-destructive', bg: 'bg-destructive/10' },
} as const

type StageKey = keyof typeof STAGE_META

export function BrandPipeline() {
  const t = useT()
  // Local mutable copy so drag-and-drop can move brands between stages
  const [brands, setBrands] = useState<PipelineBrand[]>(PIPELINE_BRANDS)
  const draggedIdRef = useRef<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<StageKey | null>(null)

  const totalMRR = brands.reduce((s, b) => s + b.mrr, 0)
  const activeCount = brands.filter((b) => b.stage === 'active').length

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, brandId: string) => {
    draggedIdRef.current = brandId
    setDraggingId(brandId)
    e.dataTransfer.effectAllowed = 'move'
    // Required for Firefox to initiate drag
    e.dataTransfer.setData('text/plain', brandId)
  }

  const handleDragEnd = () => {
    draggedIdRef.current = null
    setDraggingId(null)
    setDropTarget(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stage: StageKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dropTarget !== stage) setDropTarget(stage)
  }

  const handleDragLeave = (stage: StageKey) => {
    if (dropTarget === stage) setDropTarget(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: StageKey) => {
    e.preventDefault()
    const id = draggedIdRef.current
    if (id) {
      setBrands((list) =>
        list.map((b) => (b.id === id ? { ...b, stage } : b))
      )
    }
    draggedIdRef.current = null
    setDraggingId(null)
    setDropTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t('Brand Pipeline')}
            <Badge variant="outline" className="text-[10px]">A01</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('Brand sales pipeline · Tunisia Pilot')}</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> {t('Add brand')}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Building2 className="h-3.5 w-3.5" /> {t('Total brands')}
            </div>
            <div className="text-2xl font-bold">{PIPELINE_BRANDS.length}</div>
            <div className="text-[10px] text-primary mt-1">{t('+2 this month')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" /> {t('Active clients')}
            </div>
            <div className="text-2xl font-bold">{activeCount}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('95% retention')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" /> {t('MRR')}
            </div>
            <div className="text-2xl font-bold">{formatUSD(totalMRR)}</div>
            <div className="text-[10px] text-primary mt-1">{t('+18% MoM')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> {t('Pilot conversion')}
            </div>
            <div className="text-2xl font-bold">67%</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('2/3 pilots converted')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {Object.entries(STAGE_META).map(([stageKey, meta]) => {
          const stage = stageKey as StageKey
          const items = brands.filter((b) => b.stage === stageKey)
          const isDropTarget = dropTarget === stage
          return (
            <div
              key={stageKey}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={() => handleDragLeave(stage)}
              onDrop={(e) => handleDrop(e, stage)}
              className={cn(
                'space-y-2 rounded-lg p-1.5 transition-colors',
                isDropTarget && 'bg-primary/5 ring-2 ring-primary/50 ring-inset'
              )}
            >
              <div className="flex items-center justify-between px-1">
                <div className={cn('text-xs font-semibold flex items-center gap-1.5', meta.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', meta.bg)} />
                  {t(meta.label)}
                </div>
                <span className="text-[10px] text-muted-foreground">{items.length}</span>
              </div>
              <div
                className={cn(
                  'space-y-2 min-h-[60px] rounded-md transition-colors',
                  isDropTarget && 'bg-primary/5'
                )}
              >
                {items.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      draggable
                      onDragStart={(e) => handleDragStart(e, b.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
                        draggingId === b.id && 'opacity-50'
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold truncate">{b.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-2">
                          {b.industry} · {b.owner}
                        </div>
                        {b.mrr > 0 && (
                          <div className="text-xs font-mono font-bold text-primary mb-2">
                            {formatUSD(b.mrr)}{t('/mo')}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-1">
                          {b.nextStep}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
