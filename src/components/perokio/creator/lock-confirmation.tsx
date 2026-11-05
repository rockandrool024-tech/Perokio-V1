'use client'

/**
 * C05 Lock Confirmation — relief, not celebration.
 *
 * Per master spec §4 (C05):
 *   - Calmer than C03. The creator just hit "Lock & submit" and is exhaling.
 *   - ParrotEye state="idle" (default), size=80
 *   - "Submitted. Brand will reply within 12h."
 *   - TimerBar hours=12, layout="bar", size="md" — the 12h brand review window
 *   - "Back to Facts Wall" → setCreatorView('wall')
 *   - "View in My Prints" → setCreatorView('prints')
 *   - Calm background: subtle gradient, no confetti
 */

import { motion } from 'framer-motion'
import { ParrotEye } from '@/components/perokio/shared/parrot-logo'
import { TimerBar } from '@/components/perokio/shared/timer-bar'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { usePerokioStore, useActiveFact } from '@/store/perokio'
import { useT } from '@/lib/perokio/i18n'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial } from '@/lib/perokio/motion'
import { ArrowRight, ArrowLeft, ShieldCheck, Clock, Film, Check } from 'lucide-react'

export function LockConfirmation() {
  const fact = useActiveFact()
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const t = useT()
  const reduced = useReducedMotion()

  return (
    <div
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl"
      style={{
        background:
          'radial-gradient(ellipse 800px 400px at 50% 0%, rgba(216,239,112,0.06), transparent 60%), linear-gradient(180deg, rgba(15,22,18,0.4), rgba(10,15,13,0.95))',
      }}
    >
      {/* === Calm hero card === */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className="relative z-10 w-full max-w-lg mx-auto px-6 py-10 lg:py-12 text-center"
      >
        {/* ParrotEye — idle, smaller than C03 (relief, not celebration) */}
        <motion.div
          initial={reduced ? false : { scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...easeEditorial, delay: 0.1 }}
          className="flex justify-center mb-5"
        >
          <ParrotEye state="idle" size={80} />
        </motion.div>

        {/* Subtle "done" check */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...easeEditorial, delay: 0.2 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-fg text-xs font-medium mb-4"
        >
          <Check className="h-3 w-3 text-lime" />
          Submitted
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeEditorial, delay: 0.3 }}
          className="font-serif text-2xl lg:text-3xl font-semibold leading-tight"
        >
          Submitted. Brand will reply within 12h.
        </motion.h1>

        {/* Fact context */}
        {fact && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeEditorial, delay: 0.4 }}
            className="mt-3"
          >
            <div className="text-[11px] font-mono text-muted-fg" data-mono>
              {fact.code} · {fact.brandName}
            </div>
          </motion.div>
        )}

        {/* === Calm 12h review window === */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeEditorial, delay: 0.5 }}
          className="mt-8 mx-auto max-w-md rounded-2xl glass p-4"
        >
          <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-fg">
            <Clock className="h-3.5 w-3.5 text-orange" />
            <span>Brand review window</span>
          </div>
          <TimerBar hours={12} layout="bar" size="md" />
          <p className="mt-3 text-[11px] text-muted-fg leading-snug flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-lime" />
            Auto-approves on timeout — go relax.
          </p>
        </motion.div>

        {/* === CTAs === */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeEditorial, delay: 0.6 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <AnimatedCTA
            variant="primary"
            onClick={() => setCreatorView('prints')}
            className="min-w-[200px]"
          >
            <Film className="h-4 w-4" />
            View in My Prints
            <ArrowRight className="h-4 w-4" />
          </AnimatedCTA>
          <AnimatedCTA
            variant="ghost"
            onClick={() => setCreatorView('wall')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back to Facts Wall')}
          </AnimatedCTA>
        </motion.div>
      </motion.div>
    </div>
  )
}
