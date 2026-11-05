'use client'

/**
 * C03 Claim Confirmation — the dopamine moment.
 *
 * Per master spec §4 (C03):
 *   - Full-screen celebration
 *   - ParrotEye state="claim" (slow pupil dilation), size=120, centered
 *   - "You have 24 hours." Big text
 *   - TimerBar hours=24, layout="bar", size="lg" — prominent, color-shifts lime→orange→red
 *   - "Go to editor →" CTA → setCreatorView('claim') (C04)
 *   - "Back to Facts Wall" secondary CTA → setCreatorView('wall')
 *   - Uses easeEditorial for entrance animations
 *   - Background: radial gradient with lime glow
 */

import { motion } from 'framer-motion'
import { ParrotEye } from '@/components/perokio/shared/parrot-logo'
import { TimerBar } from '@/components/perokio/shared/timer-bar'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { usePerokioStore, useActiveFact } from '@/store/perokio'
import { useT, usePick } from '@/lib/perokio/i18n'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial } from '@/lib/perokio/motion'
import { ArrowRight, ArrowLeft, Sparkles, Clock, Flame } from 'lucide-react'

export function ClaimConfirmation() {
  const fact = useActiveFact()
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const t = useT()
  const pick = usePick()
  const reduced = useReducedMotion()

  return (
    <div
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl"
      style={{
        background:
          'radial-gradient(ellipse 900px 500px at 50% 0%, rgba(216,239,112,0.18), transparent 60%), radial-gradient(ellipse 700px 500px at 50% 100%, rgba(237,122,66,0.08), transparent 60%)',
      }}
    >
      {/* Ambient floating sparkles — purely decorative */}
      {!reduced && (
        <>
          {[
            { x: '8%', y: '18%', d: 0, s: 1 },
            { x: '82%', y: '14%', d: 0.2, s: 0.8 },
            { x: '14%', y: '70%', d: 0.4, s: 0.7 },
            { x: '88%', y: '76%', d: 0.6, s: 1.1 },
            { x: '50%', y: '8%', d: 0.8, s: 0.9 },
          ].map((p, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{ left: p.x, top: p.y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, p.s, p.s * 1.4],
                y: [0, -20, -40],
              }}
              transition={{
                duration: 2.4,
                delay: p.d,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: 'easeOut',
              }}
            >
              <Sparkles className="h-4 w-4 text-lime/70" />
            </motion.div>
          ))}
        </>
      )}

      {/* === Hero card — the moment itself === */}
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={easeEditorial}
        className="relative z-10 w-full max-w-xl mx-auto px-6 py-10 lg:py-14 text-center"
      >
        {/* ParrotEye — state="claim" triggers slow pupil dilation (per §6 parrot-logo) */}
        <motion.div
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...easeEditorial, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <ParrotEye state="claim" size={120} />
        </motion.div>

        {/* "Claimed!" badge */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeEditorial, delay: 0.2 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-lime text-lime text-xs font-bold tracking-wider uppercase mb-4"
        >
          <Sparkles className="h-3 w-3" />
          {t('Fact Bundle claimed')}
        </motion.div>

        {/* Big text — the dopamine line */}
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeEditorial, delay: 0.3 }}
          className="font-serif text-4xl lg:text-5xl font-semibold tracking-tight leading-tight"
        >
          {t('You have 24 hours.')}
        </motion.h1>

        {/* Supporting context — the fact code + claim */}
        {fact && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeEditorial, delay: 0.4 }}
            className="mt-4 space-y-1.5"
          >
            <div className="text-[11px] font-mono text-muted-fg" data-mono>
              {fact.code} · {fact.brandName}
            </div>
            <p className="text-sm text-muted-fg max-w-md mx-auto leading-relaxed line-clamp-2">
              "{pick(fact.claim, fact.claimAr)}"
            </p>
          </motion.div>
        )}

        {/* === The prominent 24h timer — color-shifts lime → orange → red === */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeEditorial, delay: 0.5 }}
          className="mt-8 mx-auto max-w-md rounded-2xl glass-strong p-5"
        >
          <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-fg">
            <Clock className="h-3.5 w-3.5 text-orange" />
            <span>{t('24h lock countdown')}</span>
          </div>
          <TimerBar hours={24} layout="bar" size="lg" />
          <p className="mt-3 text-[11px] text-muted-fg leading-snug">
            {t('The fact auto-returns to the Wall if you miss it')}
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
            onClick={() => setCreatorView('claim')}
            className="min-w-[220px]"
          >
            Go to editor <ArrowRight className="h-4 w-4" />
          </AnimatedCTA>
          <AnimatedCTA
            variant="ghost"
            onClick={() => setCreatorView('wall')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back to Facts Wall')}
          </AnimatedCTA>
        </motion.div>

        {/* Tiny "what happens next" hint */}
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...easeEditorial, delay: 0.8 }}
          className="mt-6 text-[11px] text-subtle flex items-center justify-center gap-1.5"
        >
          <Flame className="h-3 w-3 text-orange" />
          Lock &amp; submit your video before the timer runs out
        </motion.p>
      </motion.div>
    </div>
  )
}
