'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Flame, Check, Save, AlertCircle, Sparkles } from 'lucide-react'
import { CAMPAIGN_TEMPLATES, type CampaignTemplate } from '@/lib/perokio/campaign-templates'

// ============================================================================
// PageBuilderHost — the integration point for the Page Editor
// ============================================================================
// V1 Architecture: Renders a live-updating iPhone mock preview.
// V2 Architecture: Will embed Chai Builder via an <iframe> pointing to a
//   standalone Chai Builder instance (deployed separately). The SDK is too
//   heavy (377 packages + incompatible framer-motion version) to bundle
//   directly inside the Next.js app.
//
// The iframe approach:
//   <iframe src={`https://editor.perokio.com/embed/${campaignId}`} className="w-full h-full" />
//
// The standalone editor would be a separate Next.js app that imports
// @chaibuilder/sdk without version conflicts.
// ============================================================================

interface PageBuilderHostProps {
  headline: string
  subhead: string
  ctaText: string
  socialProof: string
  onSave?: (data: { blocks: any[]; theme?: any; designTokens?: any }) => void
  brandId?: string
}

export function PageBuilderHost({
  headline, subhead, ctaText, socialProof, onSave, brandId,
}: PageBuilderHostProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate>(CAMPAIGN_TEMPLATES[0])
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // V1: Save the template's block tree to the Zustand store
    // V2: POST the block tree to the NestJS backend + the Chai Builder instance
    onSave?.({ blocks: selectedTemplate.blocks })
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Template selector */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-thin pb-1">
        {CAMPAIGN_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setSelectedTemplate(tpl)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors',
              selectedTemplate.id === tpl.id
                ? 'bg-lime/10 text-lime border-lime/25'
                : 'glass text-muted-fg border-white/10 hover:text-fg'
            )}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Live mobile preview (V1) / iframe container (V2) */}
      <div className="flex-1 flex items-center justify-center relative">
        <MockPhonePreview headline={headline} subhead={subhead} socialProof={socialProof} ctaText={ctaText} />

        {/* SDK badge */}
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full glass-strong text-[9px] text-muted-fg font-mono border border-white/10" data-mono>
          V1 PREVIEW · iframe ready
        </div>
      </div>

      {/* Save indicator */}
      <div className="mt-2 flex items-center justify-between">
        <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
          <Sparkles className="h-2.5 w-2.5 mr-1" />
          Template: {selectedTemplate.name}
        </Badge>
        {saved && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSnappy}
            className="text-xs text-lime flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Saved
          </motion.span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MockPhonePreview — the live-updating iPhone preview
// ============================================================================

function MockPhonePreview({ headline, subhead, socialProof, ctaText }: {
  headline: string; subhead: string; socialProof: string; ctaText: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={easeEditorial}
      className="relative"
      style={{ width: 300, height: 620 }}
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
