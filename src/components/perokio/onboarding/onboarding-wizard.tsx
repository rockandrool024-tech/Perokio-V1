'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ParrotLogo, PerokioWordmark } from '@/components/perokio/shared/parrot-logo'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { brandOnboardingStore, type WizardStep } from '@/lib/perokio/onboarding-store'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial, springSnappy } from '@/lib/perokio/motion'
import { ArrowLeft, Check } from 'lucide-react'
import { Step01Welcome, Step02Identity, Step03Industry, Step04Budget, Step05FirstFact, Step06TopUp, Step07Invite } from './steps'

const STEP_LABELS: { num: WizardStep; title: string }[] = [
  { num: 1, title: 'Welcome' },
  { num: 2, title: 'Brand' },
  { num: 3, title: 'Audience' },
  { num: 4, title: 'Plan' },
  { num: 5, title: 'First fact' },
  { num: 6, title: 'Wallet' },
  { num: 7, title: 'Invite' },
]

const STEP_COMPONENTS = {
  1: Step01Welcome,
  2: Step02Identity,
  3: Step03Industry,
  4: Step04Budget,
  5: Step05FirstFact,
  6: Step06TopUp,
  7: Step07Invite,
} as const

export function OnboardingWizard() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const step = brandOnboardingStore((s) => s.step)
  const back = brandOnboardingStore((s) => s.back)

  const StepComponent = STEP_COMPONENTS[step]
  const stepLabel = STEP_LABELS.find((s) => s.num === step)

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-fg flex flex-col">
      {/* === Top nav — minimal, no role switcher, no live ticker === */}
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={back}
            className="flex items-center gap-2 text-sm text-muted-fg hover:text-fg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <Link href="/landing" className="flex items-center gap-2 text-sm text-muted-fg hover:text-fg transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>
        )}
        <a href="/landing" className="flex items-center">
          <PerokioWordmark size={28} />
        </a>
        <div className="w-16" /> {/* spacer for centering */}
      </header>

      {/* === Progress bar (the only chrome above the question) === */}
      <div className="px-4 lg:px-6 pb-2">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-fg" data-mono>
              {String(step).padStart(2, '0')} / 07
            </span>
            <span className="text-xs text-muted-fg">{stepLabel?.title}</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-lime to-teal"
              initial={reduced ? false : { width: 0 }}
              animate={{ width: `${(step / 7) * 100}%` }}
              transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
            />
          </div>
          {/* Step dots — show progress visually */}
          <div className="flex items-center justify-between mt-3">
            {STEP_LABELS.map((s) => (
              <button
                key={s.num}
                onClick={() => s.num < step && brandOnboardingStore.getState().setStep(s.num)}
                disabled={s.num >= step}
                className="group relative"
                aria-label={s.title}
              >
                <div
                  className={
                    'h-1.5 w-1.5 rounded-full transition-all ' +
                    (s.num < step
                      ? 'bg-lime group-hover:scale-125 cursor-pointer'
                      : s.num === step
                        ? 'bg-lime ring-2 ring-lime/30'
                        : 'bg-white/10')
                  }
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === Step body — single question, generous whitespace === */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 lg:py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
              transition={reduced ? { duration: 0.15 } : springSnappy}
            >
              <StepComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* === Footer — minimal, just the moat reminder === */}
      <footer className="px-4 lg:px-6 py-4 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-[10px] text-muted-fg">
          <ParrotLogo size={14} />
          <span>B11 Script-Locking Engine ·</span>
          <span className="text-lime">your fact will be verified before it goes live</span>
        </div>
      </footer>
    </div>
  )
}
