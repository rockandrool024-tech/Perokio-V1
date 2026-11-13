'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Plus, Sparkles, Rocket, Search, Filter, X } from 'lucide-react'

// ============================================================================
// FactLibraryHeader — B10 header with RAG trigger + Campaign Builder
// ============================================================================

interface FactLibraryHeaderProps {
  query: string
  setQuery: (q: string) => void
  onGenerateFact?: () => void
  onBuildCampaign?: (factId: string) => void
  factCount: number
}

export function FactLibraryHeader({
  query, setQuery, onGenerateFact, onBuildCampaign, factCount,
}: FactLibraryHeaderProps) {
  const t = useT()
  const [generating, setGenerating] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    onGenerateFact?.()
    // Show skeleton loading state for 2-3s (handled by parent)
    setTimeout(() => setGenerating(false), 2500)
  }

  return (
    <div className="glass-premium rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your facts..."
            className="w-full ps-10 pe-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-lime/40 placeholder:text-subtle"
          />
        </div>

        {/* Generate Fact Bundle — triggers RAG Harness loading skeletons */}
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 shadow-lime-glow disabled:opacity-60 shrink-0"
        >
          {generating ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
              <span className="hidden sm:inline">Generating...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Fact Bundle</span>
              <span className="sm:hidden">Generate</span>
            </>
          )}
        </Button>

        {/* Build Campaign */}
        {onBuildCampaign && (
          <Button
            variant="outline"
            onClick={() => onBuildCampaign(factCount > 0 ? 'first' : '')}
            className="gap-2 glass border-lime/25 text-lime hover:bg-lime/10 shrink-0"
          >
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Build Campaign</span>
          </Button>
        )}
      </div>

      {/* RAG loading skeletons */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springSoft}
            className="overflow-hidden space-y-2"
          >
            <div className="text-[10px] text-muted-fg font-mono flex items-center gap-1.5" data-mono>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              </span>
              RAG PIPELINE ACTIVE · Retrieving BrandContext + verifiedSources...
            </div>
            {/* Skeleton fact cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {[1, 2].map((i) => (
                <div key={i} className="glass rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 skeleton-premium rounded border" />
                    <div className="h-5 w-12 skeleton-premium rounded border" />
                  </div>
                  <div className="h-3 w-full skeleton-premium rounded border" />
                  <div className="h-3 w-2/3 skeleton-premium rounded border" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-6 w-20 skeleton-premium rounded-lg border" />
                    <div className="h-6 w-16 skeleton-premium rounded-lg border" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
