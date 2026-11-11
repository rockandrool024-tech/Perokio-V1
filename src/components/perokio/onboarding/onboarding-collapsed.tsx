'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ParrotLogo, PerokioWordmark } from '@/components/perokio/shared/parrot-logo'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { WeekGrid } from '@/components/perokio/shared/week-grid'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial, springSnappy } from '@/lib/perokio/motion'
import { ArrowRight, ArrowLeft, Check, Coffee, Sparkles, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Onboarding (B01-B07) — Collapsed 3-field screen with live WeekGrid preview.
 *
 * The original 7-step wizard (Welcome → Identity → Industry → Budget →
 * First Fact → Top-up → Invite) is collapsed into a single screen:
 *   1. Brand Name (text)
 *   2. Industry (select)
 *   3. Logo (emoji picker)
 *
 * Below the form: a LIVE WeekGrid preview showing how the brand's week
 * will look once they start scheduling Facts and Sparks.
 *
 * On submit → routes to / (the app) with the brand role active.
 */

const INDUSTRIES = [
  { id: 'cafe', label: 'Café & Hospitality', emoji: '☕' },
  { id: 'beauty', label: 'Beauty & Cosmetics', emoji: '💄' },
  { id: 'food', label: 'Food & Beverage', emoji: '🫒' },
  { id: 'tech', label: 'Technology', emoji: '🎮' },
  { id: 'travel', label: 'Travel & Tourism', emoji: '✈️' },
  { id: 'fashion', label: 'Fashion & Apparel', emoji: '👕' },
]

const LOGO_OPTIONS = ['☕', '💄', '🫒', '🎮', '✈️', '👕', '🌱', '🍯', '🎨', '📚', '🔥', '⭐']

export function OnboardingWizard() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [logo, setLogo] = useState('☕')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = brandName.trim().length > 0 && industry !== ''

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    // Mock: in production this would POST /api/facts + create the brand
    setTimeout(() => {
      router.push('/')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-fg flex flex-col">
      {/* === Top nav === */}
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PerokioWordmark size={24} />
        </div>
        <Badge className="text-[10px] bg-lime/10 text-lime border border-lime/20">
          <Lock className="h-3 w-3 mr-1" />
          Monday Lock · 7 days
        </Badge>
      </header>

      {/* === Main — 2-column layout: form + WeekGrid preview === */}
      <main className="flex-1 px-4 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* === Left: The 3-field form === */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={easeEditorial}
            className="space-y-6"
          >
            <div>
              <motion.div
                initial={reduced ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springSnappy, delay: 0.1 }}
                className="mb-4"
              >
                <ParrotLogo size={48} />
              </motion.div>
              <h1 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                Set up your brand in 60 seconds.
              </h1>
              <p className="text-sm text-muted-fg max-w-md">
                Three fields. We'll generate your first Fact Bundle and schedule it
                for next week's Monday lock.
              </p>
            </div>

            {/* Field 1: Brand Name */}
            <div className="space-y-2">
              <label className="text-xs text-muted-fg uppercase tracking-wider">
                Brand Name
              </label>
              <input
                type="text"
                autoFocus
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Café Dar Zaitouna"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/40 placeholder:text-subtle"
              />
            </div>

            {/* Field 2: Industry */}
            <div className="space-y-2">
              <label className="text-xs text-muted-fg uppercase tracking-wider">
                Industry
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => {
                      setIndustry(ind.id)
                      setLogo(ind.emoji)
                    }}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border transition-all text-sm text-start',
                      industry === ind.id
                        ? 'border-lime/40 bg-lime/[0.06] text-lime'
                        : 'border-white/10 glass hover:bg-white/[0.05] text-muted-fg hover:text-fg',
                    )}
                  >
                    <span className="text-lg">{ind.emoji}</span>
                    <span className="font-medium">{ind.label}</span>
                    {industry === ind.id && <Check className="h-3.5 w-3.5 ms-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Logo */}
            <div className="space-y-2">
              <label className="text-xs text-muted-fg uppercase tracking-wider">
                Logo
              </label>
              <div className="flex flex-wrap gap-2">
                {LOGO_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setLogo(emoji)}
                    className={cn(
                      'h-11 w-11 rounded-xl border flex items-center justify-center text-xl transition-all',
                      logo === emoji
                        ? 'border-lime/40 bg-lime/[0.06] scale-105'
                        : 'border-white/10 glass hover:bg-white/[0.05]',
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <AnimatedCTA
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full justify-center"
            >
              {submitting ? 'Setting up…' : (
                <>
                  Generate my first Fact
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </AnimatedCTA>

            <p className="text-[10px] text-subtle text-center leading-relaxed">
              Your first Fact Bundle will be scheduled for next Monday's lock.
              You can edit it anytime before then.
            </p>
          </motion.div>

          {/* === Right: Live WeekGrid preview === */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...easeEditorial, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lime" />
              <h3 className="font-serif text-base font-semibold">Your week, previewed</h3>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
                LIVE PREVIEW
              </Badge>
            </div>

            <WeekGrid />

            <div className="glass rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
                <span className="text-lime font-medium">Brand: {brandName || 'Your Brand'}</span>
                <span className="text-muted-fg">· {INDUSTRIES.find(i => i.id === industry)?.label || 'Select industry'}</span>
              </div>
              <div className="text-[11px] text-muted-fg leading-relaxed">
                Once you click "Generate", we'll create your first Fact Bundle from
                your industry's trending topic and schedule it for Monday.
                The WeekGrid will populate with real entries as you add Facts and Sparks.
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
