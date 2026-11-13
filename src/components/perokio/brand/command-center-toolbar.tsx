'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePerokioStore } from '@/store/perokio'
import { useT } from '@/lib/perokio/i18n'
import { springSnappy, springSoft } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import {
  Sparkles, Zap, TrendingUp, ArrowRight, X, Plus, Radar,
  Calendar, ChevronRight, AlertTriangle, Flame,
} from 'lucide-react'

// ============================================================================
// CommandCenterToolbar — B08 header with AI Copilot + action buttons
// ============================================================================
// The "power tools" that make the app feel like a Revenue OS:
//   - [+ Schedule Content] opens a side drawer
//   - [📡 Scan Market] triggers a radar animation
//   - AI Copilot pill: floating, glassmorphic, suggests the next best action
// ============================================================================

interface CommandCenterToolbarProps {
  onScheduleContent?: () => void
  onScanMarket?: () => void
  onBoost?: () => void
  onGenerateFact?: () => void
}

export function CommandCenterToolbar({
  onScheduleContent, onScanMarket, onBoost, onGenerateFact,
}: CommandCenterToolbarProps) {
  const t = useT()
  const [scanning, setScanning] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleScan = () => {
    setScanning(true)
    onScanMarket?.()
    setTimeout(() => setScanning(false), 3000)
  }

  return (
    <>
      {/* === Toolbar === */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setDrawerOpen(true)}
            className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime"
          >
            <Plus className="h-4 w-4" />
            {t('Schedule Content')}
          </Button>
          <Button
            variant="outline"
            onClick={handleScan}
            disabled={scanning}
            className="gap-2 glass border-white/10 hover:bg-white/5"
          >
            {scanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Radar className="h-4 w-4 text-orange" />
              </motion.div>
            ) : (
              <Radar className="h-4 w-4 text-orange" />
            )}
            {scanning ? 'Scanning…' : t('Scan Market')}
          </Button>
        </div>

        {/* Scanning radar animation */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springSnappy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-orange text-xs"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-orange"
              />
              <span className="text-orange font-mono" data-mono>AI scanning market trends…</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === AI Copilot Pill (floating, bottom center) === */}
      <AICopilot onBoost={onBoost} onGenerateFact={onGenerateFact} />

      {/* === Schedule Content Side Drawer === */}
      <AnimatePresence>
        {drawerOpen && (
          <ScheduleDrawer onClose={() => setDrawerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// AICopilot — floating "Next Best Action" pill
// ============================================================================

function AICopilot({
  onBoost, onGenerateFact,
}: { onBoost?: () => void; onGenerateFact?: () => void }) {
  const t = useT()
  const [dismissed, setDismissed] = useState(false)
  const [suggestionIdx, setSuggestionIdx] = useState(0)

  const suggestions = [
    {
      icon: AlertTriangle,
      color: 'text-orange',
      bg: 'glass-orange',
      text: 'CPM on TikTok is up 15%. I recommend boosting Amira\'s Spark.',
      cta: 'Boost Now',
      action: onBoost,
    },
    {
      icon: Flame,
      color: 'text-red',
      bg: 'glass-red',
      text: '🔥 Trend Alert: #IcedCoffee is exploding (+280/h).',
      cta: 'Generate Fact Bundle',
      action: onGenerateFact,
    },
    {
      icon: TrendingUp,
      color: 'text-lime',
      bg: 'glass-lime',
      text: 'Revenue up 42% this week. Launch another campaign to compound.',
      cta: 'New Campaign',
      action: undefined,
    },
  ]

  const current = suggestions[suggestionIdx]

  if (dismissed) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.5, ...springSoft }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pb-4 md:pb-0"
    >
      <motion.div
        layout
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-2xl max-w-md',
          current.bg,
        )}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="shrink-0"
        >
          <current.icon className={cn('h-5 w-5', current.color)} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-xs leading-snug">{current.text}</p>
        </div>

        {current.action && (
          <Button
            size="sm"
            onClick={current.action}
            className={cn(
              'shrink-0 gap-1 h-7 px-3 text-xs',
              current.color === 'text-lime' && 'bg-lime text-[#0A0F0D] hover:bg-lime/90',
              current.color === 'text-orange' && 'bg-orange text-white hover:bg-orange/90',
              current.color === 'text-red' && 'bg-red text-white hover:bg-red/90',
            )}
          >
            {current.cta}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}

        {/* Cycle through suggestions */}
        <button
          onClick={() => setSuggestionIdx((i) => (i + 1) % suggestions.length)}
          className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors shrink-0"
          title="Next suggestion"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-fg" />
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5 text-muted-fg" />
        </button>
      </motion.div>

      {/* AI label */}
      <div className="flex items-center justify-center gap-1 mt-1">
        <Sparkles className="h-2.5 w-2.5 text-lime" />
        <span className="text-[9px] text-muted-fg font-mono uppercase tracking-wider" data-mono>
          AI Copilot · Next Best Action
        </span>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ScheduleDrawer — side drawer for scheduling content
// ============================================================================

function ScheduleDrawer({ onClose }: { onClose: () => void }) {
  const t = useT()
  const setView = usePerokioStore((s) => s.setBrandView)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={springSnappy}
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#0A0F0D] border-l border-white/[0.08] z-50 overflow-y-auto scrollbar-thin"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-lime" />
              Schedule Content
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05]">
              <X className="h-4 w-4 text-muted-fg" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { setView('library'); onClose() }}
              className="w-full text-start p-4 rounded-xl glass hover:glass-lime transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-lime" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">New Fact Bundle</div>
                  <div className="text-xs text-muted-fg">Generate via RAG Harness</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-fg group-hover:text-lime transition-colors" />
              </div>
            </button>

            <button
              onClick={() => { setView('machine'); onClose() }}
              className="w-full text-start p-4 rounded-xl glass hover:glass-orange transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Boost a Spark</div>
                  <div className="text-xs text-muted-fg">Promote an underperforming video</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-fg group-hover:text-orange transition-colors" />
              </div>
            </button>

            <button
              onClick={() => { setView('queue'); onClose() }}
              className="w-full text-start p-4 rounded-xl glass hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-muted-fg" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">View Posting Queue</div>
                  <div className="text-xs text-muted-fg">Drag-and-drop calendar</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-fg group-hover:text-fg transition-colors" />
              </div>
            </button>
          </div>

          {/* Next Monday Lock */}
          <div className="glass-orange rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Calendar className="h-4 w-4 text-orange" />
              </motion.div>
              <span className="text-xs font-semibold text-orange">Next Monday 9am Lock</span>
            </div>
            <p className="text-[11px] text-muted-fg leading-relaxed">
              Schedule content before Monday 9am to be included in next week's
              creator distribution cycle.
            </p>
          </div>
        </div>
      </motion.div>
    </>
  )
}
