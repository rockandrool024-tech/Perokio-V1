'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CountUp } from '@/components/perokio/shared/count-up'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import {
  X, Link2, Copy, Check, Sparkles, Wand2, ImageIcon, Type, Flame,
  ShoppingBag, ChevronRight, ChevronLeft, BarChart3, Zap, ArrowRight,
  TrendingUp, MousePointerClick, Eye, DollarSign, Plus, Trash2,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// CampaignStudio — The $499 Feature
// ============================================================================
// A full-screen, immersive glassmorphic environment. 3-phase wizard:
//   Phase 1: Smart Link & Routing Hub (pero.to/ + A/B testing)
//   Phase 2: Conversion Canvas (Page Editor with live iPhone preview)
//   Phase 3: ROI Command Center (Revenue Waterfall + Attribution Leaderboard)
// ============================================================================

type Phase = 1 | 2 | 3

interface CampaignStudioProps {
  open: boolean
  onClose: () => void
  factClaim?: string
  factCode?: string
  brandName?: string
}

export function CampaignStudio({
  open, onClose,
  factClaim = 'Dar Zaitouna arabica beans come from Cap Bon',
  factCode = 'F-XXXX',
  brandName = 'Café Dar Zaitouna',
}: CampaignStudioProps) {
  const t = useT()
  const [phase, setPhase] = useState<Phase>(1)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#0A0F0D]/95 backdrop-blur-xl flex flex-col"
        >
          {/* === Top bar === */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg glass-lime flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-lime" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold leading-tight">Campaign Studio</h2>
                <p className="text-[10px] text-muted-fg font-mono" data-mono>
                  {factCode} · {brandName}
                </p>
              </div>
            </div>

            {/* Phase indicator */}
            <div className="flex items-center gap-2">
              {([1, 2, 3] as Phase[]).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <button
                    onClick={() => setPhase(p)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      phase === p
                        ? 'bg-lime/15 text-lime border border-lime/25'
                        : 'glass text-muted-fg hover:text-fg border border-white/[0.06]',
                    )}
                  >
                    <span className="font-mono" data-mono>{p}</span>
                    {p === 1 && 'Smart Link'}
                    {p === 2 && 'Page Editor'}
                    {p === 3 && 'ROI Funnel'}
                  </button>
                  {p < 3 && <ChevronRight className="h-3 w-3 text-subtle" />}
                </div>
              ))}
            </div>

            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
              <X className="h-5 w-5 text-muted-fg" />
            </button>
          </div>

          {/* === Phase content === */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <AnimatePresence mode="wait">
              {phase === 1 && <Phase1SmartLink key="p1" factClaim={factClaim} onNext={() => setPhase(2)} />}
              {phase === 2 && <Phase2PageEditor key="p2" factClaim={factClaim} brandName={brandName} onNext={() => setPhase(3)} onBack={() => setPhase(1)} />}
              {phase === 3 && <Phase3RoiFunnel key="p3" onBack={() => setPhase(2)} onClose={onClose} />}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Phase 1: Smart Link & Routing Hub
// ============================================================================

function Phase1SmartLink({ factClaim, onNext }: { factClaim: string; onNext: () => void }) {
  const t = useT()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [variants, setVariants] = useState([
    { id: 'A', label: 'TastyIgniter Menu', url: 'https://order.darzitouna.tn/menu', weight: 50 },
    { id: 'B', label: 'WhatsApp Order', url: 'https://wa.me/21612345678', weight: 50 },
  ])

  const shortCode = `pero.to/${factClaim.substring(0, 3).toLowerCase()}-${Date.now().toString(36).slice(-4)}`
  const fullUrl = `https://${shortCode}`

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).catch(() => {})
    }
    setCopied(true)
    toast({ title: `✓ Copied`, description: shortCode })
    setTimeout(() => setCopied(false), 2000)
  }

  const addVariant = () => {
    const nextId = String.fromCharCode(65 + variants.length)
    setVariants([...variants, { id: nextId, label: `Variant ${nextId}`, url: '', weight: 0 }])
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={easeEditorial}
      className="max-w-3xl mx-auto px-6 py-12 space-y-8"
    >
      {/* Smart Link Display */}
      <div className="text-center space-y-4">
        <div>
          <h3 className="font-serif text-2xl font-semibold mb-1">Your Smart Link</h3>
          <p className="text-sm text-muted-fg">One link. Dynamic routing. Auto A/B testing.</p>
        </div>

        {/* The pero.to/ input */}
        <div className="relative max-w-xl mx-auto">
          <div className="flex items-center gap-0 rounded-2xl glass-premium border border-white/10 overflow-hidden">
            <span className="px-4 py-4 text-muted-fg font-mono text-sm border-r border-white/[0.06]" data-mono>
              pero.to/
            </span>
            <input
              readOnly
              value={shortCode.replace('pero.to/', '')}
              className="flex-1 bg-transparent px-4 py-4 text-lime font-mono text-sm focus:outline-none"
              data-mono
            />
            {/* Copy button with morph + confetti */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className={cn(
                  'px-6 py-4 font-semibold text-sm transition-all flex items-center gap-2',
                  copied ? 'bg-lime text-[#0A0F0D]' : 'bg-white/[0.04] text-fg hover:bg-white/[0.08]',
                )}
              >
                {copied ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springSnappy}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Copied
                  </motion.div>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </motion.button>

              {/* Mini confetti burst */}
              {copied && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2
                    const x = Math.cos(angle) * 30
                    const y = Math.sin(angle) * 30
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 0, x, y, scale: 0.3 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute w-1.5 h-1.5 rounded-sm bg-lime"
                        style={{ boxShadow: '0 0 4px rgba(216,239,112,0.6)' }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Routing (A/B Testing) */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange" />
            <h4 className="font-serif text-base font-semibold">Dynamic Routing</h4>
            <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25">A/B TEST</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={addVariant} className="text-xs gap-1 text-muted-fg hover:text-lime">
            <Plus className="h-3 w-3" />
            Add Variant
          </Button>
        </div>

        <div className="space-y-3">
          {variants.map((v, idx) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, ...springSoft }}
              className="flex items-center gap-3"
            >
              <Badge className={cn(
                'text-xs font-mono shrink-0 w-8 justify-center',
                v.id === 'A' ? 'bg-lime/15 text-lime border border-lime/25' : 'bg-orange/15 text-orange border border-orange/25',
              )} data-mono>
                {v.id}
              </Badge>
              <input
                defaultValue={v.url}
                placeholder="https://your-destination.com"
                className="flex-1 px-3 py-2.5 rounded-lg glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30 placeholder:text-subtle"
              />
              <div className="flex items-center gap-2 shrink-0 w-24">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue={v.weight}
                  className="w-full accent-lime"
                />
                <span className="text-xs font-mono text-muted-fg w-8 text-end" data-mono>{v.weight}%</span>
              </div>
              {variants.length > 2 && (
                <button
                  onClick={() => setVariants(variants.filter((x) => x.id !== v.id))}
                  className="p-1.5 rounded-lg hover:bg-red/10 text-muted-fg hover:text-red transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <p className="text-[11px] text-subtle mt-3 leading-relaxed">
          Traffic auto-splits based on weight. The system learns which variant converts better
          and automatically shifts traffic to the winner after 100 clicks.
        </p>
      </div>

      {/* Next */}
      <div className="flex justify-end">
        <Button onClick={onNext} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime">
          Build Landing Page
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Phase 2: Conversion Canvas (Page Editor with live iPhone preview)
// ============================================================================

function Phase2PageEditor({
  factClaim, brandName, onNext, onBack,
}: { factClaim: string; brandName: string; onNext: () => void; onBack: () => void }) {
  const t = useT()
  const { toast } = useToast()
  const [headline, setHeadline] = useState(factClaim.substring(0, 60) + '...')
  const [subText, setSubText] = useState('Verified by Perokio · Order now and taste the difference')
  const [ctaText, setCtaText] = useState('Order Now')
  const [socialProof, setSocialProof] = useState(1240)
  const [magicLoading, setMagicLoading] = useState(false)

  const magicHeadlines = [
    `${brandName} — verified premium. Taste the Cap Bon difference.`,
    `🔥 1,240 orders this week. Here's why they chose ${brandName}.`,
    `The coffee that Tunisia trusts. ${factClaim.substring(0, 40)}...`,
  ]

  const handleMagicWrite = () => {
    setMagicLoading(true)
    setTimeout(() => {
      setMagicLoading(false)
      toast({
        title: '✨ 3 headlines generated',
        description: 'Click any headline below to use it',
      })
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={easeEditorial}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-6 min-h-full"
    >
      {/* === Left: Editor === */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-teal" />
          Conversion Canvas
        </h3>

        {/* Headline with Magic Write */}
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-fg uppercase tracking-wider flex items-center gap-1">
              <Type className="h-3 w-3" />
              Headline
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMagicWrite}
              disabled={magicLoading}
              className="h-6 px-2 text-[10px] gap-1 text-teal hover:text-teal hover:bg-teal/10"
            >
              {magicLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-3 w-3" />
                </motion.div>
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Magic Write
            </Button>
          </div>
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30 resize-none"
          />
          {/* AI-generated headline suggestions */}
          {magicLoading && (
            <div className="space-y-1.5 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-premium h-8 rounded-lg border" />
              ))}
            </div>
          )}
        </div>

        {/* Sub-text */}
        <div className="glass rounded-xl p-4 space-y-2">
          <label className="text-xs text-muted-fg uppercase tracking-wider">Sub-text</label>
          <textarea
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30 resize-none"
          />
        </div>

        {/* Hero Image dropzone */}
        <div className="glass rounded-xl p-4 space-y-2">
          <label className="text-xs text-muted-fg uppercase tracking-wider flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            Hero Image
          </label>
          <div className="aspect-video rounded-lg border-2 border-dashed border-white/10 hover:border-lime/30 flex items-center justify-center transition-colors cursor-pointer group">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-muted-fg group-hover:text-lime transition-colors mx-auto mb-1" />
              <p className="text-[10px] text-muted-fg">Drop image or click to upload</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="glass rounded-xl p-4 space-y-2">
          <label className="text-xs text-muted-fg uppercase tracking-wider">Social Proof</label>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange" />
            <input
              type="number"
              value={socialProof}
              onChange={(e) => setSocialProof(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30 font-mono"
              data-mono
            />
            <span className="text-xs text-muted-fg">people ordered this week</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="glass rounded-xl p-4 space-y-2">
          <label className="text-xs text-muted-fg uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" />
            CTA Button
          </label>
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30"
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack} className="gap-1 text-muted-fg">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90">
            View ROI Funnel
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* === Right: iPhone 15 Pro Live Preview === */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, ...springSoft }}
          className="sticky top-6"
        >
          {/* iPhone frame */}
          <div className="relative w-[280px] h-[580px] rounded-[3rem] border-[8px] border-[#1a1a1a] bg-[#0A0F0D] shadow-2xl overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-10" />

            {/* Screen content — live preview */}
            <motion.div
              layout
              className="h-full overflow-y-auto scrollbar-thin pt-8"
            >
              {/* Hero image area */}
              <div className="aspect-square bg-gradient-to-br from-lime/10 via-orange/5 to-transparent flex items-center justify-center">
                <span className="text-6xl opacity-50">☕</span>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                {/* Headline */}
                <motion.h4
                  key={headline}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={springSoft}
                  className="font-serif text-lg font-semibold leading-tight"
                >
                  {headline}
                </motion.h4>

                {/* Sub-text */}
                <motion.p
                  key={subText}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={springSoft}
                  className="text-xs text-muted-fg leading-relaxed"
                >
                  {subText}
                </motion.p>

                {/* Social proof */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Flame className="h-3 w-3 text-orange" />
                  <span className="font-mono text-orange" data-mono>{socialProof.toLocaleString()}</span>
                  <span className="text-muted-fg">ordered this week</span>
                </div>

                {/* CTA Button */}
                <motion.button
                  key={ctaText}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={springSnappy}
                  className="w-full py-3 rounded-xl bg-lime text-[#0A0F0D] font-bold text-sm hover:bg-lime/90 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {ctaText}
                </motion.button>

                {/* Verified badge */}
                <div className="flex items-center justify-center gap-1 pt-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
                  <span className="text-[9px] text-muted-fg font-mono" data-mono>
                    🦜 Verified by Perokio · B11
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
            Live Preview · Updates as you type
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Phase 3: ROI Command Center (Revenue Waterfall + Attribution)
// ============================================================================

function Phase3RoiFunnel({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const t = useT()

  // Mock funnel data
  const funnelData = [
    { stage: 'Views', value: 10000, color: '#D8EF70', icon: Eye },
    { stage: 'Clicks', value: 1200, color: '#6FD3C7', icon: MousePointerClick },
    { stage: 'Page Views', value: 1000, color: '#ED7A42', icon: TrendingUp },
    { stage: 'Orders', value: 45, color: '#B6A6FF', icon: ShoppingBag },
  ]

  const revenueData = [
    { day: 'Mon', revenue: 120 },
    { day: 'Tue', revenue: 180 },
    { day: 'Wed', revenue: 95 },
    { day: 'Thu', revenue: 240 },
    { day: 'Fri', revenue: 310 },
    { day: 'Sat', revenue: 420 },
    { day: 'Sun', revenue: 285 },
  ]

  const creators = [
    { name: 'Amira Ben Salah', handle: '@amira.tn', avatar: '👩🏽‍🦱', orders: 28, revenue: 840, cvr: '12.5%' },
    { name: 'Yassine Mejri', handle: '@yassine', avatar: '🧔🏽', orders: 12, revenue: 360, cvr: '8.2%' },
    { name: 'Omar Trabelsi', handle: '@omar', avatar: '👨🏽', orders: 5, revenue: 150, cvr: '5.1%' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={easeEditorial}
      className="px-6 py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-lime" />
            ROI Command Center
          </h3>
          <p className="text-sm text-muted-fg">Revenue waterfall · Attribution leaderboard</p>
        </div>
      </div>

      {/* === Revenue Summary Cards === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: 1350, prefix: '$', icon: DollarSign, accent: 'text-lime' },
          { label: 'Orders', value: 45, prefix: '', icon: ShoppingBag, accent: 'text-orange' },
          { label: 'Avg Order Value', value: 30, prefix: '$', icon: TrendingUp, accent: 'text-teal' },
          { label: 'Conversion Rate', value: 3.75, prefix: '', suffix: '%', icon: Zap, accent: 'text-lime' },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, ...springSoft }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-fg uppercase tracking-wider">{card.label}</span>
              <card.icon className={cn('h-4 w-4', card.accent)} />
            </div>
            <div className={cn('text-2xl font-mono font-bold tabular', card.accent)} data-mono>
              <CountUp
                value={card.value}
                delay={idx * 0.08 + 0.1}
                format={(n) => `${card.prefix}${n.toFixed(card.value % 1 === 0 ? 0 : 2)}${card.suffix || ''}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* === Revenue Waterfall (Step-down funnel) === */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...easeEditorial }}
        className="glass-premium rounded-2xl p-6"
      >
        <h4 className="font-serif text-lg font-semibold mb-4">Revenue Waterfall</h4>
        <div className="space-y-2">
          {funnelData.map((step, idx) => {
            const pct = (step.value / funnelData[0].value) * 100
            const dropoff = idx > 0
              ? ((funnelData[idx - 1].value - step.value) / funnelData[idx - 1].value * 100).toFixed(0)
              : null
            return (
              <motion.div
                key={step.stage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, ...springSoft }}
                className="flex items-center gap-3"
              >
                <div className="w-28 shrink-0 flex items-center gap-1.5">
                  <step.icon className="h-3.5 w-3.5" style={{ color: step.color }} />
                  <span className="text-xs font-medium">{step.stage}</span>
                </div>
                <div className="flex-1 relative h-8 rounded-lg bg-white/[0.03] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
                    className="h-full rounded-lg"
                    style={{
                      background: `linear-gradient(90deg, ${step.color}40, ${step.color}10)`,
                      borderRight: `1px solid ${step.color}60`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-xs font-mono font-bold" style={{ color: step.color }} data-mono>
                      {step.value.toLocaleString()}
                    </span>
                    {dropoff && (
                      <span className="text-[9px] text-muted-fg font-mono" data-mono>
                        -{dropoff}% dropoff
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* === Revenue Trend Chart === */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...easeEditorial }}
        className="glass rounded-2xl p-5"
      >
        <h4 className="font-serif text-base font-semibold mb-3">Revenue · Last 7 Days</h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D8EF70" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#D8EF70" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,15,13,0.95)',
                border: '1px solid rgba(216,239,112,0.3)',
                borderRadius: 12, fontSize: 12, color: '#fff', backdropFilter: 'blur(20px)',
              }}
              formatter={(v: number) => [`$${v}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#D8EF70" strokeWidth={2} fill="url(#revGrad)" animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* === Attribution Leaderboard === */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...easeEditorial }}
        className="glass rounded-2xl p-5"
      >
        <h4 className="font-serif text-base font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lime" />
          Attribution Leaderboard
          <span className="text-[10px] text-muted-fg font-normal">Which creator drove the most revenue?</span>
        </h4>
        <div className="space-y-2">
          {creators.map((c, idx) => (
            <motion.div
              key={c.handle}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + idx * 0.08, ...springSoft }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors',
                idx === 0 ? 'glass-lime' : 'glass hover:bg-white/[0.05]',
              )}
            >
              <span className="text-xl">{c.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-[10px] text-muted-fg font-mono" data-mono>{c.handle}</div>
              </div>
              <div className="text-center min-w-[60px]">
                <div className="text-sm font-mono font-bold text-orange" data-mono>{c.orders}</div>
                <div className="text-[9px] text-muted-fg">orders</div>
              </div>
              <div className="text-center min-w-[60px]">
                <div className="text-sm font-mono font-bold text-muted-fg" data-mono>{c.cvr}</div>
                <div className="text-[9px] text-muted-fg">CVR</div>
              </div>
              <div className="text-end min-w-[80px]">
                <div className="text-sm font-mono font-bold text-lime" data-mono>${c.revenue}</div>
                <div className="text-[9px] text-muted-fg">revenue</div>
              </div>
              {idx === 0 && <Badge className="text-[9px] bg-lime text-[#0A0F0D]">🏆 TOP</Badge>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* === The Loop CTA === */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, ...easeEditorial }}
        className="flex items-center justify-between pt-2"
      >
        <Button variant="ghost" onClick={onBack} className="gap-1 text-muted-fg">
          <ChevronLeft className="h-4 w-4" />
          Back to Editor
        </Button>
        <Button
          onClick={onClose}
          className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime h-12 px-8 text-base font-bold"
        >
          Launch Next Campaign
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
