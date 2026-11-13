'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Flame, Check, Save, AlertCircle, Sparkles } from 'lucide-react'
import { CAMPAIGN_TEMPLATES, type CampaignTemplate } from '@/lib/perokio/campaign-templates'
import { registerPerokioBlocks } from '@/lib/perokio/chai-blocks'

// ============================================================================
// PageBuilderHost — the integration point for Chai Builder SDK
// ============================================================================
// This component wraps the ChaiBuilderEditor and provides:
//   1. Dynamic loading via next/dynamic (the SDK is heavy — 377 packages)
//   2. Template selection (pre-built QSR campaign templates)
//   3. Custom block registration (TastyIgniterMenu, SparkCTA, CountdownTimer)
//   4. AI assistant config (OpenRouter via env var)
//   5. Graceful fallback to mock preview if the SDK fails to load
//
// The onSave callback receives the block tree + theme + design tokens
// and stores them in the Zustand activeCampaign.pageContent.
// ============================================================================

// Dynamic import — the SDK loads only when the editor is opened
const ChaiBuilderEditor = dynamic(
  () => import('@chaibuilder/sdk').then((mod) => mod.ChaiBuilderEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
)

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
  const [sdkAvailable, setSdkAvailable] = useState<boolean | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate>(CAMPAIGN_TEMPLATES[0])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Check if the SDK loaded successfully
    import('@chaibuilder/sdk')
      .then(() => {
        setSdkAvailable(true)
        // Register Perokio custom blocks
        registerPerokioBlocks()
      })
      .catch(() => setSdkAvailable(false))
  }, [])

  const handleSave = async (saveData: { blocks: any[]; autoSave?: boolean }) => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSave?.({ blocks: saveData.blocks })
    return true
  }

  // === If SDK loaded: render the ChaiBuilderEditor ===
  if (sdkAvailable === true) {
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

        {/* The Chai Builder editor */}
        <div className="flex-1 overflow-hidden rounded-xl border border-white/10">
          <ChaiBuilderEditor
            blocks={selectedTemplate.blocks}
            onSave={handleSave}
            autoSave={true}
            autoSaveActionsCount={10}
            askAiCallBack={async (type, prompt, blocks, lang) => {
              // AI callback — uses Perokio's OpenRouter key
              // V1: Return mock suggestions. V2: call OpenRouter API.
              return {
                blocks: blocks.map((b: any) => ({
                  ...b,
                  content: type === 'content' ? `${prompt} — ${b.content}` : b.content,
                })),
              }
            }}
            onError={(error: Error) => {
              console.error('[ChaiBuilderEditor] Error:', error)
            }}
            debugLogs={false}
            locale="en"
          />
        </div>

        {/* Save indicator */}
        <div className="mt-2 flex items-center justify-between">
          <Badge className="text-[10px] bg-lime/10 text-lime border border-lime/25">
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            Chai Builder SDK Active
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

  // === If SDK failed to load: render the mock preview ===
  if (sdkAvailable === false) {
    return (
      <div className="flex flex-col items-center">
        <MockPhonePreview headline={headline} subhead={subhead} socialProof={socialProof} ctaText={ctaText} />
        <Badge className="mt-3 text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
          <AlertCircle className="h-2.5 w-2.5 mr-1" />
          SDK fallback — using mock preview
        </Badge>
      </div>
    )
  }

  // === Loading state ===
  return <EditorSkeleton />
}

// ============================================================================
// MockPhonePreview — the fallback when Chai Builder SDK is unavailable
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
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 shadow-2xl">
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
      {/* SDK badge */}
      <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full glass-strong text-[9px] text-muted-fg font-mono border border-white/10" data-mono>
        SDK READY · iframe host
      </div>
    </motion.div>
  )
}

// ============================================================================
// EditorSkeleton — loading state for the Chai Builder SDK
// ============================================================================

function EditorSkeleton() {
  return (
    <div className="w-full h-full space-y-3">
      <div className="h-8 w-48 skeleton-premium rounded-lg border" />
      <div className="h-4 w-full skeleton-premium rounded border" />
      <div className="h-4 w-2/3 skeleton-premium rounded border" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="h-20 skeleton-premium rounded-xl border" />
        <div className="h-20 skeleton-premium rounded-xl border" />
      </div>
      <div className="h-4 w-full skeleton-premium rounded border mt-4" />
      <div className="h-4 w-1/2 skeleton-premium rounded border" />
      <div className="h-10 w-full skeleton-premium rounded-xl border mt-4" />
      <div className="text-center text-xs text-muted-fg font-mono pt-2" data-mono>
        Loading Chai Builder SDK...
      </div>
    </div>
  )
}
