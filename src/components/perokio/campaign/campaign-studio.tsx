'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CountUp } from '@/components/perokio/shared/count-up'
import { usePerokioStore } from '@/store/perokio'
import { conversionApi } from '@/lib/perokio/api-client'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import {
  X, ArrowRight, ArrowLeft, Check, Copy, Link2, Sparkles, Wand2,
  Image as ImageIcon, Type, Flame, ShoppingBag, TrendingDown, DollarSign,
  Eye, MousePointerClick, Zap, ChevronRight, Plus, Trash2, Save,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
} from 'recharts'

// ============================================================================
// CampaignStudio — The $499 Feature (Campaign & Link Lifecycle)
// ============================================================================
// 3-phase wizard, now wired to the Zustand store (activeCampaign):
//   Phase 1: Link Creation — pero.to/ slug + A/B routing → setCampaignShortlink()
//   Phase 2: Page Editing — split-screen editor + iframe-ready mobile preview → saveCampaignPage()
//   Phase 3: Funnel Monitoring — Revenue Waterfall + Attribution → setCampaignFunnel()
//
// External SDK Integration:
//   - Page Editor (Phase 2): The right-side "Live Mobile Preview" is structured
//     as an iframe container ready to host Chai Builder / Plasmic SDK.
//     For V1, we render a mock iPhone preview. The <PageBuilderHost> component
//     is the integration point — swap its inner content for the SDK.
//   - Conversion Engine (Phase 3): Pulls live data from
//     GET /api/conversion/stats/:brandId (TastyIgniter webhooks → Clicks → Orders → Revenue).
// ============================================================================

type Phase = 1 | 2 | 3

interface CampaignStudioProps {
  open: boolean
  onClose: () => void
  factClaim?: string
  brandName?: string
  brandId?: string
}

export function CampaignStudio({
  open, onClose, factClaim = 'Spicy Chicken Burger Launch', brandName = 'Café Dar Zaitouna', brandId,
}: CampaignStudioProps) {
  const t = useT()
  const campaignPhase = usePerokioStore((s) => s.campaignPhase)
  const setCampaignPhase = usePerokioStore((s) => s.setCampaignPhase)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#0A0F0D]/95 backdrop-blur-xl flex flex-col"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={easeEditorial}
            className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 lg:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* === Header === */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl glass-lime flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-lime" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold">Campaign Studio</h2>
                  <p className="text-xs text-muted-fg font-mono" data-mono>
                    {brandName} · {factClaim.substring(0, 40)}...
                  </p>
                </div>
              </div>

              {/* Phase indicator */}
              <div className="flex items-center gap-2">
                {([1, 2, 3] as Phase[]).map((p) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <motion.div
                      animate={{
                        scale: campaignPhase === p ? 1.1 : 1,
                        backgroundColor: campaignPhase >= p ? 'rgba(216,239,112,0.15)' : 'rgba(255,255,255,0.04)',
                      }}
                      transition={springSnappy}
                      className={cn(
                        'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold border transition-colors',
                        campaignPhase >= p ? 'border-lime/30 text-lime' : 'border-white/10 text-muted-fg',
                      )}
                      data-mono
                    >
                      {campaignPhase > p ? <Check className="h-3.5 w-3.5" /> : p}
                    </motion.div>
                    {p < 3 && <div className={cn('h-px w-6', campaignPhase > p ? 'bg-lime/30' : 'bg-white/10')} />}
                  </div>
                ))}
              </div>

              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
                <X className="h-5 w-5 text-muted-fg" />
              </button>
            </div>

            {/* === Phase content === */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {campaignPhase === 1 && <SmartLinkPhase key="p1" onNext={() => setCampaignPhase(2)} />}
                {campaignPhase === 2 && <PageEditorPhase key="p2" factClaim={factClaim} onNext={() => setCampaignPhase(3)} onBack={() => setCampaignPhase(1)} />}
                {campaignPhase === 3 && <RoiFunnelPhase key="p3" brandId={brandId} onBack={() => setCampaignPhase(2)} onClose={onClose} />}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// PHASE 1: Smart Link & Routing Hub — Link Creation (The Hook)
// ============================================================================

function SmartLinkPhase({ onNext }: { onNext: () => void }) {
  const t = useT()
  const setCampaignShortlink = usePerokioStore((s) => s.setCampaignShortlink)
  const activeShortlink = usePerokioStore((s) => s.activeCampaign.shortlink)
  const [linkCode, setLinkCode] = useState(activeShortlink?.replace('pero.to/', '') || 'spicy-chicken-burger')
  const [variants, setVariants] = useState([
    { id: 'a', label: 'Variant A: TastyIgniter Menu', url: 'https://order.darzitouna.tn/menu', weight: 50 },
    { id: 'b', label: 'Variant B: WhatsApp Order', url: 'https://wa.me/21612345678', weight: 50 },
  ])
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleCopy = () => {
    // Update the Zustand store with the new shortlink
    setCampaignShortlink(linkCode)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`pero.to/${linkCode}`).catch(() => {})
    }
    setCopied(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1000)
    setTimeout(() => setCopied(false), 2000)
  }

  const addVariant = () => {
    if (variants.length >= 4) return
    const newWeight = Math.floor(100 / (variants.length + 1))
    setVariants(prev => [
      ...prev.map(v => ({ ...v, weight: newWeight })),
      { id: String.fromCharCode(97 + variants.length), label: `Variant ${String.fromCharCode(65 + variants.length).toUpperCase()}: New`, url: '', weight: newWeight },
    ])
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={easeEditorial}
      className="h-full flex flex-col"
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-6 max-w-3xl mx-auto w-full">
        {/* === Smart Link input === */}
        <div>
          <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Smart Link</label>
          <div className="flex items-center gap-2 p-1 glass-premium rounded-2xl">
            <div className="ps-4 font-mono text-sm text-muted-fg" data-mono>pero.to/</div>
            <input
              type="text"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="flex-1 bg-transparent border-0 outline-none text-sm font-mono text-fg py-3"
              data-mono
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              transition={springSnappy}
              onClick={handleCopy}
              className={cn(
                'relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all overflow-hidden',
                copied ? 'bg-lime text-[#0A0F0D]' : 'bg-white/[0.06] text-fg hover:bg-white/[0.1]',
              )}
            >
              {copied ? (
                <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={springSnappy} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Copied
                </motion.span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy className="h-4 w-4" /> Copy Link
                </span>
              )}
              {/* Mini confetti */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2
                    const x = Math.cos(angle) * 30
                    const y = Math.sin(angle) * 30
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, x: 0, y: 0 }}
                        animate={{ opacity: 0, x, y }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute w-1 h-1 rounded-sm bg-lime"
                      />
                    )
                  })}
                </div>
              )}
            </motion.button>
          </div>
          {activeShortlink && (
            <p className="text-[10px] text-lime mt-2 font-mono" data-mono>
              ✓ Active campaign shortlink: {activeShortlink}
            </p>
          )}
        </div>

        {/* === Dynamic Routing (A/B Testing) === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-serif text-base font-semibold">Dynamic Routing (A/B Testing)</h3>
              <p className="text-xs text-muted-fg">Traffic auto-splits across destinations</p>
            </div>
            <Button variant="ghost" size="sm" onClick={addVariant} className="gap-1.5 text-xs text-muted-fg hover:text-lime">
              <Plus className="h-3.5 w-3.5" /> Add Variant
            </Button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, ...springSoft }}
                className="glass rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold border',
                    v.id === 'a' ? 'bg-lime/10 text-lime border-lime/25' : 'bg-orange/10 text-orange border-orange/25',
                  )} data-mono>
                    {v.id.toUpperCase()}
                  </div>
                  <input
                    type="text"
                    value={v.label}
                    onChange={(e) => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, label: e.target.value } : x))}
                    className="flex-1 bg-transparent border-0 outline-none text-sm font-medium"
                  />
                  {variants.length > 2 && (
                    <button onClick={() => {
                      const remaining = variants.filter(x => x.id !== v.id)
                      const w = Math.floor(100 / remaining.length)
                      setVariants(remaining.map(x => ({ ...x, weight: w })))
                    }} className="p-1 hover:bg-red/10 rounded text-muted-fg hover:text-red transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={v.url}
                  onChange={(e) => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, url: e.target.value } : x))}
                  placeholder="https://"
                  className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-white/[0.02] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-lime/30"
                  data-mono
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', v.id === 'a' ? 'bg-lime' : 'bg-orange')}
                      initial={{ width: 0 }}
                      animate={{ width: `${v.weight}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-fg w-10 text-end" data-mono>{v.weight}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 border-t border-white/[0.06] flex justify-end">
        <Button onClick={() => { setCampaignShortlink(linkCode); onNext() }} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90">
          Build Landing Page <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// PHASE 2: Conversion Canvas (Page Editor) — Page Editing (The Value)
// ============================================================================
// The right side is an iframe-ready container. For V1, we render a mock
// iPhone preview. To integrate Chai Builder / Plasmic, replace the content
// of <PageBuilderHost> with the SDK's React component or an iframe.
// ============================================================================

function PageEditorPhase({ factClaim, onNext, onBack }: { factClaim: string; onNext: () => void; onBack: () => void }) {
  const t = useT()
  const saveCampaignPage = usePerokioStore((s) => s.saveCampaignPage)
  const savedContent = usePerokioStore((s) => s.activeCampaign.pageContent)

  const [headline, setHeadline] = useState(savedContent?.headline || 'The Spiciest Chicken in Tunis')
  const [subhead, setSubhead] = useState(savedContent?.subhead || 'Made with Cap Bon peppers. Available for 48 hours.')
  const [ctaText, setCtaText] = useState(savedContent?.ctaText || 'Order Now')
  const [socialProof, setSocialProof] = useState(savedContent?.socialProof || '1,240 people ordered this week')
  const [magicOpen, setMagicOpen] = useState(false)
  const [magicSuggestions, setMagicSuggestions] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveCampaignPage({ headline, subhead, ctaText, socialProof })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // In production, this would also POST to the Plasmic/Chai Builder API
  }

  const handleMagicWrite = () => {
    setMagicOpen(true)
    setGenerating(true)
    setTimeout(() => {
      setMagicSuggestions([
        `${factClaim.substring(0, 40)} — Limited Drop`,
        `Tunisia's #1 Spicy Chicken. 48h Only.`,
        `1,240 Orders. The Hype is Real.`,
      ])
      setGenerating(false)
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={easeEditorial}
      className="h-full flex flex-col"
    >
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* === Left: Editor === */}
        <div className="overflow-y-auto scrollbar-thin space-y-5 pr-2">
          {/* Hero Image dropzone */}
          <div>
            <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Hero Image</label>
            <div className="aspect-[16/9] rounded-xl border-2 border-dashed border-white/10 hover:border-lime/30 glass flex items-center justify-center cursor-pointer transition-all group">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-muted-fg mx-auto mb-2 group-hover:text-lime transition-colors" />
                <p className="text-xs text-muted-fg">Drop image or click to upload</p>
              </div>
            </div>
          </div>

          {/* Headline with Magic Write */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-fg uppercase tracking-wider">Headline</label>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMagicWrite}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#B6A6FF]/10 text-[#B6A6FF] border border-[#B6A6FF]/25 hover:bg-[#B6A6FF]/20 transition-colors text-[11px] font-medium"
              >
                <Wand2 className="h-3 w-3" /> Magic Write
              </motion.button>
            </div>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30 font-medium"
            />
            <AnimatePresence>
              {magicOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springSoft}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {generating ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-10 rounded-lg skeleton-premium border" style={{ width: `${90 - i * 5}%` }} />
                        ))}
                      </>
                    ) : (
                      magicSuggestions.map((s, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1, ...springSnappy }}
                          onClick={() => { setHeadline(s); setMagicOpen(false) }}
                          className="w-full text-start px-3 py-2 rounded-lg glass border border-[#B6A6FF]/15 hover:border-[#B6A6FF]/30 hover:bg-[#B6A6FF]/[0.06] transition-colors text-sm flex items-center gap-2"
                        >
                          <Sparkles className="h-3 w-3 text-[#B6A6FF] shrink-0" />
                          {s}
                        </motion.button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subhead */}
          <div>
            <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Sub-headline</label>
            <input
              type="text"
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30"
            />
          </div>

          {/* Social Proof */}
          <div>
            <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">Social Proof</label>
            <input
              type="text"
              value={socialProof}
              onChange={(e) => setSocialProof(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30"
            />
          </div>

          {/* CTA Button text */}
          <div>
            <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">CTA Button</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/30"
              />
              <Link2 className="h-4 w-4 text-muted-fg" />
              <span className="text-xs font-mono text-muted-fg" data-mono>TastyIgniter</span>
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            className="w-full gap-2"
            variant={saved ? 'default' : 'outline'}
          >
            {saved ? (
              <><Check className="h-4 w-4" /> Saved to campaign</>
            ) : (
              <><Save className="h-4 w-4" /> Save Page</>
            )}
          </Button>
        </div>

        {/* === Right: Page Builder Host (iframe-ready container) === */}
        <div className="flex items-center justify-center">
          {/*
            INTEGRATION POINT:
            Replace <MockPhonePreview> with the Chai Builder / Plasmic SDK component.
            The SDK would render inside an iframe or a React component tree.
            Example:
              <iframe src={`https://editor.chaibuilder.com/embed/${campaignId}`} className="w-full h-full" />
            or:
              <PlasmicComponent component="CampaignPage" props={{ headline, subhead, ctaText }} />

            For V1, we render the mock phone preview that mirrors the editor state.
          */}
          <PageBuilderHost
            headline={headline}
            subhead={subhead}
            socialProof={socialProof}
            ctaText={ctaText}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/[0.06] flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-fg hover:text-fg">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={() => { handleSave(); onNext() }} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90">
          View ROI Funnel <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// PageBuilderHost — the integration point for Chai Builder / Plasmic SDK
// ============================================================================

function PageBuilderHost({ headline, subhead, socialProof, ctaText }: {
  headline: string; subhead: string; socialProof: string; ctaText: string
}) {
  return (
    <div className="relative" style={{ width: 300, height: 620 }}>
      {/*
        SDK INTEGRATION NOTE:
        This container is structured to accept an iframe or React component
        from Chai Builder (github.com/chaibuilder/sdk) or Plasmic
        (github.com/plasmicapp/plasmic).

        To integrate:
          1. Install the SDK: pnpm add @chaibuilder/sdk (or @plasmicapp/loader-react)
          2. Replace the <MockPhonePreview> below with:
             <iframe src={chaibuilderEmbedUrl} className="w-full h-full rounded-[2.5rem]" />
          3. Pass the editor state (headline, subhead, etc.) as props/URL params

        For V1, we render a live-updating iPhone mock that mirrors the editor.
      */}
      <MockPhonePreview headline={headline} subhead={subhead} socialProof={socialProof} ctaText={ctaText} />

      {/* SDK badge */}
      <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full glass-strong text-[9px] text-muted-fg font-mono border border-white/10" data-mono>
        SDK READY · iframe host
      </div>
    </div>
  )
}

// ============================================================================
// MockPhonePreview — the V1 iPhone preview (replaced by SDK in production)
// ============================================================================

function MockPhonePreview({ headline, subhead, socialProof, ctaText }: {
  headline: string; subhead: string; socialProof: string; ctaText: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={easeEditorial}
      className="absolute inset-0"
    >
      <div className="h-full rounded-[3rem] bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 shadow-2xl">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl z-10" />
        <div className="h-full rounded-[2.5rem] overflow-hidden bg-[#0A0F0D] relative">
          <div className="aspect-square w-full glass relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className="h-16 w-16 text-orange/30" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <motion.h3
              key={headline}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={springSnappy}
              className="font-serif text-lg font-bold leading-tight"
            >
              {headline}
            </motion.h3>
            <motion.p
              key={subhead}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={springSnappy}
              className="text-xs text-muted-fg leading-relaxed"
            >
              {subhead}
            </motion.p>
            <motion.div
              key={socialProof}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={springSnappy}
              className="flex items-center gap-1.5 text-[10px] text-orange"
            >
              <Flame className="h-3 w-3" /> {socialProof}
            </motion.div>
            <motion.button
              key={ctaText}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={springSnappy}
              className="w-full py-3 rounded-xl bg-lime text-[#0A0F0D] font-bold text-sm"
            >
              {ctaText}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// PHASE 3: ROI Command Center — Funnel Monitoring (The ROI)
// ============================================================================
// Pulls live data from GET /api/conversion/stats/:brandId
// Shows the Revenue Waterfall: Views → Clicks → Page Views → Orders → Revenue
// ============================================================================

function RoiFunnelPhase({ brandId, onBack, onClose }: { brandId?: string; onBack: () => void; onClose: () => void }) {
  const t = useT()
  const setCampaignFunnel = usePerokioStore((s) => s.setCampaignFunnel)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLaunchButton, setShowLaunchButton] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await conversionApi.getStats(brandId)
        setStats(data)
        // Store the funnel data in the Zustand campaign state
        setCampaignFunnel({
          views: data.totalClicks * 8, // estimate: ~8 views per click
          clicks: data.totalClicks,
          pageViews: Math.round(data.totalClicks * 0.8),
          orders: data.totalOrders,
          revenueCents: data.attributedRevenueCents,
        })
      } catch {
        // Fallback to demo data if API unavailable
        setStats({
          totalClicks: 1240,
          totalOrders: 45,
          conversionRate: 3.6,
          attributedRevenueCents: 135000,
          attributedRevenueUsd: 1350,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    setTimeout(() => setShowLaunchButton(true), 2000)
  }, [brandId])

  const funnelData = stats ? [
    { label: 'Views', value: stats.totalClicks * 8 || 10000, color: '#D8EF70', icon: Eye },
    { label: 'Clicks', value: stats.totalClicks, color: '#ED7A42', icon: MousePointerClick },
    { label: 'Page Views', value: Math.round((stats.totalClicks || 1240) * 0.8), color: '#6FD3C7', icon: TrendingDown },
    { label: 'Orders', value: stats.totalOrders, color: '#B6A6FF', icon: ShoppingBag },
  ] : []

  const revenueData = [
    { day: 'Mon', revenue: 120 },
    { day: 'Tue', revenue: 340 },
    { day: 'Wed', revenue: 580 },
    { day: 'Thu', revenue: 420 },
    { day: 'Fri', revenue: 890 },
    { day: 'Sat', revenue: 1240 },
    { day: 'Sun', revenue: 980 },
  ]

  const leaderboard = [
    { name: 'Amira', avatar: '👩🏽‍🦱', revenue: 1840, orders: 22, pct: 41 },
    { name: 'Yassine', avatar: '🧔🏽', revenue: 1320, orders: 15, pct: 29 },
    { name: 'Omar', avatar: '👨🏽', revenue: 980, orders: 8, pct: 22 },
  ]

  const totalRevenue = stats?.attributedRevenueUsd || leaderboard.reduce((s, c) => s + c.revenue, 0)
  const maxFunnel = funnelData[0]?.value || 1

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={easeEditorial}
      className="h-full flex flex-col overflow-y-auto scrollbar-thin"
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-8 w-48 skeleton-premium rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 skeleton-premium rounded-xl border" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* === Revenue Waterfall === */}
            <div className="glass-premium rounded-2xl p-5">
              <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-lime" /> Revenue Waterfall
              </h3>
              <div className="space-y-3">
                {funnelData.map((stage, idx) => {
                  const pct = (stage.value / maxFunnel) * 100
                  const dropoff = idx > 0 ? ((funnelData[idx - 1].value - stage.value) / funnelData[idx - 1].value * 100).toFixed(0) : null
                  const Icon = stage.icon
                  return (
                    <motion.div
                      key={stage.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.15, ...springSoft }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" style={{ color: stage.color }} />
                          <span className="text-xs font-medium text-muted-fg">{stage.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {dropoff && <span className="text-[10px] text-muted-fg font-mono" data-mono>-{dropoff}%</span>}
                          <CountUp value={stage.value} className="text-sm font-mono font-bold" delay={idx * 0.15} />
                        </div>
                      </div>
                      <div className="h-8 rounded-lg bg-white/[0.02] overflow-hidden">
                        <motion.div
                          className="h-full rounded-lg flex items-center justify-end pe-2"
                          style={{ background: `${stage.color}20`, borderRight: `2px solid ${stage.color}` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: idx * 0.15 + 0.3, duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
                        >
                          <span className="text-[10px] font-mono text-muted-fg" data-mono>{pct.toFixed(0)}%</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* === Revenue chart === */}
            <div className="glass-premium rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-lime" /> Revenue · 7 days
                </h3>
                <Badge className="text-[10px] bg-lime/10 text-lime border border-lime/25">Live</Badge>
              </div>
              <div className="mb-4">
                <CountUp value={totalRevenue} delay={0.3} format={(n) => `$${Math.round(n).toLocaleString()}`} className="text-3xl font-mono font-bold text-lime" />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D8EF70" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D8EF70" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="revenue" stroke="#D8EF70" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* === Attribution Leaderboard === */}
          <div className="glass rounded-2xl p-5 mb-6">
            <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lime" /> Attribution Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.map((creator, idx) => (
                <motion.div
                  key={creator.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, ...springSoft }}
                  className="flex items-center gap-4 p-3 rounded-xl glass hover:bg-white/[0.05] transition-colors"
                >
                  <div className="text-lg font-mono font-bold text-muted-fg w-6" data-mono>{idx + 1}</div>
                  <div className="text-2xl">{creator.avatar}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{creator.name}</div>
                    <div className="text-[10px] text-muted-fg font-mono" data-mono>{creator.orders} orders · {creator.pct}% share</div>
                  </div>
                  <div className="w-32">
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-1">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-lime to-teal"
                        initial={{ width: 0 }}
                        animate={{ width: `${creator.pct}%` }}
                        transition={{ delay: idx * 0.1 + 0.3, duration: 0.8 }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-mono font-bold text-lime w-20 text-end" data-mono>
                    <CountUp value={creator.revenue} delay={idx * 0.1 + 0.2} format={(n) => `$${Math.round(n)}`} className="text-sm font-mono font-bold text-lime" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* === Loop CTA === */}
          <AnimatePresence>
            {showLaunchButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springSnappy}
                className="flex justify-center pb-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springSnappy}
                  onClick={onClose}
                  className="px-8 py-4 rounded-2xl bg-lime text-[#0A0F0D] font-bold text-base flex items-center gap-2 glow-lime"
                >
                  Launch Next Campaign
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-white/[0.06] flex justify-start">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-fg hover:text-fg">
          <ArrowLeft className="h-4 w-4" /> Back to Editor
        </Button>
      </div>
    </motion.div>
  )
}
