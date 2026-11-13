'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePerokioStore } from '@/store/perokio'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Search, Sparkles, Rocket, X, Loader2, CheckCircle2,
  FileText, AlertCircle,
} from 'lucide-react'

// ============================================================================
// FactLibraryHeader — B10 header with RAG trigger + Campaign Builder
// ============================================================================
// Power tools for the Fact Library:
//   - [+ Generate Fact Bundle] triggers the RAG Harness (loading skeletons)
//   - [🚀 Build Campaign] opens the Campaign Studio
// ============================================================================

interface FactLibraryHeaderProps {
  onBuildCampaign?: (factId: string) => void
  brandName?: string
}

export function FactLibraryHeader({ onBuildCampaign, brandName = 'Brand' }: FactLibraryHeaderProps) {
  const t = useT()
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)
  const [query, setQuery] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    toast({
      title: '🤖 RAG Harness activated',
      description: 'Generating script with brand context + verified sources…',
    })

    // Simulate the RAG pipeline (in production, calls POST /api/facts/:id/generate)
    setTimeout(() => {
      setGenerating(false)
      toast({
        title: '✅ Script generated',
        description: '3 lines created. All verified=false — needs QA review.',
      })
    }, 2500)
  }

  return (
    <div className="space-y-3">
      {/* === Header row === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-lime" />
            {t('Fact Library')}
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B10</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            {brandName} · RAG-powered fact generation
          </p>
        </div>

        {/* === Generate Fact Bundle (RAG trigger) === */}
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime shrink-0"
        >
          {generating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
              Generating…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('Generate Fact Bundle')}
            </>
          )}
        </Button>
      </div>

      {/* === Search bar === */}
      <div className="glass rounded-2xl p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search facts or trends…"
              className="w-full ps-10 pe-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-lime/40 placeholder:text-subtle"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 glass border-white/10 hover:bg-white/5 shrink-0">
            <Rocket className="h-3.5 w-3.5 text-orange" />
            Build Campaign
          </Button>
        </div>
      </div>

      {/* === RAG loading skeletons (when generating) === */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springSoft}
            className="glass rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="text-teal"
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
              <span className="text-sm font-serif text-muted-fg">RAG pipeline active — generating script…</span>
              <span className="text-[10px] text-subtle font-mono ms-auto" data-mono>
                Fetching brand context + verified sources
              </span>
            </div>

            {/* Skeleton lines */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, ...springSoft }}
                className="skeleton-premium rounded-xl p-4 border flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-8 rounded bg-white/[0.06]" />
                    <div className="h-4 w-20 rounded bg-white/[0.06]" />
                    <div className="h-3 w-16 rounded bg-lime/10 ms-auto" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 rounded bg-white/[0.06]" style={{ width: `${85 - i * 8}%` }} />
                    <div className="h-3 rounded bg-white/[0.04]" style={{ width: `${60 - i * 10}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}

            <p className="text-[10px] text-subtle text-center pt-1">
              Lines will be created with verified=false. A human must verify each line before B11 approval.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
