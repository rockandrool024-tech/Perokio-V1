'use client'

/**
 * B16 Assisted Post — MODAL, not a screen.
 *
 * Per Cycle 5c brief:
 *   "Triggered from B17 or B09 when a video is underperforming
 *    (<50% of view cap after 12h).
 *    Modal shows: video preview, current views vs cap, current CPM
 *    vs expected, 'Boost this video' CTA + budget input.
 *    NOT a standalone screen. If it becomes a full screen, that's a cycle fail."
 *
 * Implementation: a self-contained modal component that any screen (B17, B09)
 * can render. The parent controls open/close. No sidebar entry, no route.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { usePerokioStore } from '@/store/perokio'
import { CPM_RATE, VIEW_CAP } from '@/lib/perokio/data'
import { formatCompact, formatUSD } from '@/lib/perokio/format'
import { useToast } from '@/hooks/use-toast'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { springSnappy } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import {
  X, Zap, TrendingUp, Eye, DollarSign, AlertTriangle, Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import type { Video } from '@/lib/perokio/types'

interface AssistedPostModalProps {
  video: Video | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * AssistedPostModal — the boost dialog.
 *
 * The trigger logic lives in the parent (B17 or B09): the parent decides
 * whether to show the "Boost" button based on the underperformance threshold
 * (<50% of view cap after 12h). This component only renders the modal UI
 * and the boost simulation.
 */
export function AssistedPostModal({ video, open, onOpenChange }: AssistedPostModalProps) {
  const reduced = useReducedMotion()
  const { toast } = useToast()
  const [boostBudget, setBoostBudget] = useState(20)

  if (!video) return null

  // Per the spec: trigger when views < 50% of cap after 12h.
  // We don't actually track "12h elapsed" in mock data, so we use the views/cap ratio.
  const viewsRatio = video.views / video.viewCap
  const isUnderperforming = viewsRatio < 0.5

  // Calculate current vs expected CPM using the SAME constants as WL01.
  // currentCpm = (views / 1000) * CPM_RATE — same formula as WL01's live tracker.
  const currentCpm = (video.views / 1000) * CPM_RATE
  const expectedCpm = (video.viewCap / 1000) * CPM_RATE // max possible
  const currentEarned = video.earningsBase + currentCpm
  const potentialEarned = video.earningsBase + expectedCpm

  // Simulated boost: $X budget → +X*100 estimated views (mock conversion rate)
  const estimatedBoostViews = boostBudget * 100
  const projectedViews = Math.min(video.viewCap, video.views + estimatedBoostViews)
  const projectedCpm = (projectedViews / 1000) * CPM_RATE
  const projectedEarned = video.earningsBase + projectedCpm

  const handleBoost = () => {
    toast({
      title: '🚀 Boost activated',
      description: `+${formatCompact(estimatedBoostViews)} estimated views for ${formatUSD(boostBudget)}. Ad campaign queued via Postiz.`,
    })
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
            transition={springSnappy}
            className="glass-strong rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="boost-title"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl glass-orange flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange" />
                </div>
                <div>
                  <h3 id="boost-title" className="font-serif text-lg font-semibold">
                    Boost this video
                  </h3>
                  <div className="text-[10px] text-muted-fg font-mono" data-mono>
                    {video.factCode} · {video.creatorName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-fg hover:text-fg transition-colors p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Underperformance warning */}
            {isUnderperforming && (
              <div className="glass-red rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-red mb-0.5">Underperforming</div>
                  <div className="text-muted-fg">
                    Only {Math.round(viewsRatio * 100)}% of view cap reached. Boost to recover CPM.
                  </div>
                </div>
              </div>
            )}

            {/* Video preview */}
            <div
              className="relative rounded-xl overflow-hidden border border-white/10 mb-4 mx-auto"
              style={{
                aspectRatio: '9/16',
                maxWidth: 160,
                background: 'linear-gradient(135deg, rgba(216,239,112,0.12), rgba(237,122,66,0.08))',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-5xl">
                {video.thumbnail}
              </div>
              <Badge className="absolute top-2 start-2 bg-black/40 text-white text-[10px]" data-mono>
                {video.platform}
              </Badge>
            </div>

            {/* Current stats vs expected */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCompare
                label="Current views"
                value={formatCompact(video.views)}
                expected={`of ${formatCompact(video.viewCap)} cap`}
                ratio={viewsRatio}
              />
              <StatCompare
                label="Current earned"
                value={formatUSD(currentEarned)}
                expected={`of ${formatUSD(potentialEarned)} max`}
                ratio={currentEarned / potentialEarned}
              />
            </div>

            {/* Boost budget input */}
            <div className="glass rounded-xl p-4 mb-4">
              <label className="text-xs text-muted-fg uppercase tracking-wider mb-3 block flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-lime" />
                Boost budget
              </label>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-mono text-muted-fg">$</span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={boostBudget}
                  onChange={(e) => setBoostBudget(Number(e.target.value))}
                  className="flex-1 accent-lime"
                />
                <span className="font-mono text-xl font-bold text-lime w-16 text-end" data-mono>
                  ${boostBudget}
                </span>
              </div>
              {/* Preset amounts */}
              <div className="flex gap-2">
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBoostBudget(amt)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all border',
                      boostBudget === amt
                        ? 'bg-lime/15 text-lime border-lime/30'
                        : 'glass text-muted-fg border-white/10 hover:text-fg',
                    )}
                    data-mono
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Projected impact */}
            <div className="glass-lime rounded-xl p-4 mb-4">
              <div className="text-xs text-muted-fg uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-lime" />
                Projected impact
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <ProjectedStat
                  label="Est. new views"
                  value={`+${formatCompact(estimatedBoostViews)}`}
                  accent="lime"
                />
                <ProjectedStat
                  label="Total views"
                  value={formatCompact(projectedViews)}
                  accent="orange"
                />
                <ProjectedStat
                  label="Total earned"
                  value={formatUSD(projectedEarned)}
                  accent="lime"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 gap-2 glass border-white/10 hover:bg-white/5"
              >
                Cancel
              </Button>
              <AnimatedCTA
                onClick={handleBoost}
                successLabel="✓ Boosted"
                className="flex-1 justify-center"
              >
                <Zap className="h-4 w-4" />
                Boost {formatUSD(boostBudget)}
              </AnimatedCTA>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatCompare({
  label,
  value,
  expected,
  ratio,
}: {
  label: string
  value: string
  expected: string
  ratio: number
}) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] text-muted-fg uppercase tracking-wider mb-1">{label}</div>
      <div className="font-mono text-xl font-bold" data-mono>{value}</div>
      {/* Progress bar showing ratio */}
      <div className="h-1 rounded-full bg-white/[0.04] mt-2 overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            ratio < 0.5 ? 'bg-red' : ratio < 0.8 ? 'bg-orange' : 'bg-lime',
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, ratio * 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-[10px] text-muted-fg mt-1">{expected}</div>
    </div>
  )
}

function ProjectedStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'lime' | 'orange'
}) {
  const color = accent === 'lime' ? 'text-lime' : 'text-orange'
  return (
    <div>
      <div className={cn('font-mono text-base font-bold', color)} data-mono>{value}</div>
      <div className="text-[10px] text-muted-fg mt-0.5">{label}</div>
    </div>
  )
}
