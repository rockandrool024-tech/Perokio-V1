'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import {
  Plus, Radar, Zap, TrendingUp, AlertTriangle, Flame, ChevronRight, X, BarChart3,
} from 'lucide-react'

// ============================================================================
// CommandCenterToolbar — B08 header with AI Copilot + power tools
// ============================================================================

interface CommandCenterToolbarProps {
  onScheduleContent?: () => void
  onScanMarket?: () => void
  onCreatePromo?: () => void
  onViewCampaigns?: () => void
}

export function CommandCenterToolbar({
  onScheduleContent, onScanMarket, onCreatePromo, onViewCampaigns,
}: CommandCenterToolbarProps) {
  const t = useT()
  const [scanning, setScanning] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleScan = () => {
    setScanning(true)
    onScanMarket?.()
    setTimeout(() => setScanning(false), 2000)
  }

  return (
    <>
      {/* === Toolbar === */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* + Schedule Content — opens side drawer */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDrawerOpen(true)}
          className="gap-2 glass border-white/10 hover:bg-white/5"
        >
          <Plus className="h-4 w-4 text-lime" />
          {t('Schedule Content')}
        </Button>

        {/* Scan Market — radar animation */}
        <Button
          variant="outline"
          size="sm"
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
          {scanning ? 'Scanning...' : t('Scan Market')}
        </Button>

        {/* View Campaigns — opens CampaignStudio at Phase 3 (Monitor) */}
        <Button
          variant="outline"
          size="sm"
          onClick={onViewCampaigns}
          className="gap-2 glass border-white/10 hover:bg-white/5"
        >
          <BarChart3 className="h-4 w-4 text-lime" />
          {t('View Campaigns')}
        </Button>
      </div>

      {/* === AI Copilot — floating pill === */}
      <AICopilot onCreatePromo={onCreatePromo} />

      {/* === Schedule Content side drawer === */}
      <ScheduleDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* === Bottom CTA: Create New Promo Cycle === */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 hidden lg:block" style={{ bottom: '80px' }}>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ...springSnappy }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreatePromo}
          className="px-6 py-3 rounded-2xl bg-lime text-[#0A0F0D] font-bold text-sm flex items-center gap-2 glow-lime shadow-lg"
        >
          {t('Create New Promo Cycle')}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </>
  )
}

// ============================================================================
// AICopilot — floating glassmorphic pill at bottom center
// ============================================================================

interface CopilotSuggestion {
  id: string
  icon: typeof AlertTriangle
  color: string
  text: string
  cta: string
  action?: () => void
}

function AICopilot({ onCreatePromo }: { onCreatePromo?: () => void }) {
  const t = useT()
  const [visible, setVisible] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState(0)

  const suggestions: CopilotSuggestion[] = [
    {
      id: 'cpm_alert',
      icon: AlertTriangle,
      color: 'text-orange',
      text: 'Your CPM on TikTok is up 15%. I recommend boosting Amira\'s Spark.',
      cta: 'Boost Now',
    },
    {
      id: 'trend_alert',
      icon: Flame,
      color: 'text-red',
      text: 'Trend Alert: #IcedCoffee is exploding (+380/h). Generate a Fact Bundle.',
      cta: 'Generate Fact',
    },
    {
      id: 'revenue_milestone',
      icon: TrendingUp,
      color: 'text-lime',
      text: 'You hit $1,840 in attributed revenue this week. Launch a new campaign to compound.',
      cta: 'Launch Campaign',
      action: onCreatePromo,
    },
  ]

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000)
    const rotate = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % suggestions.length)
    }, 8000)
    return () => { clearTimeout(timer); clearInterval(rotate) }
  }, [])

  if (!visible) return null

  const suggestion = suggestions[currentSuggestion]
  const Icon = suggestion.icon

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={suggestion.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={springSnappy}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-md w-[calc(100%-2rem)] lg:w-auto"
      >
        <div className="glass-premium rounded-2xl p-3 flex items-center gap-3 shadow-lg">
          {/* AI indicator */}
          <div className="relative shrink-0">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-8 w-8 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center"
            >
              <Icon className={cn('h-4 w-4', suggestion.color)} />
            </motion.div>
          </div>

          {/* Suggestion text */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted-fg uppercase tracking-wider font-medium mb-0.5">
              AI Copilot
            </div>
            <p className="text-xs text-fg leading-tight">{suggestion.text}</p>
          </div>

          {/* CTA */}
          <Button
            size="sm"
            onClick={suggestion.action}
            className="gap-1.5 bg-lime text-[#0A0F0D] hover:bg-lime/90 shrink-0 h-7 px-3 text-[11px]"
          >
            <Zap className="h-3 w-3" />
            {suggestion.cta}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// ScheduleDrawer — side drawer for scheduling content
// ============================================================================

function ScheduleDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springSoft}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 glass-strong border-l border-white/10 p-6 overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-semibold">{t('Schedule Content')}</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.05]">
                <X className="h-5 w-5 text-muted-fg" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Content type */}
              <div>
                <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 rounded-xl glass-lime border border-lime/30 text-sm font-medium text-lime">
                    🔥 Fact
                  </button>
                  <button className="p-3 rounded-xl glass border border-white/10 text-sm font-medium text-muted-fg hover:bg-white/[0.05]">
                    ✨ Spark
                  </button>
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30"
                />
              </div>

              {/* Time picker */}
              <div>
                <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Time</label>
                <input
                  type="time"
                  defaultValue="12:00"
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30 font-mono"
                  data-mono
                />
              </div>

              {/* Channel */}
              <div>
                <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Channel</label>
                <select className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30">
                  <option>Brand Account</option>
                  <option>Creator Wall</option>
                  <option>Direct Invite</option>
                </select>
              </div>

              <Button className="w-full mt-4 gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90">
                {t('Schedule')} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
