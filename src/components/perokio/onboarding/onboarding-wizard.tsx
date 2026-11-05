'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ParrotLogo, PerokioWordmark } from '@/components/perokio/shared/parrot-logo'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { brandOnboardingStore, type WizardStep } from '@/lib/perokio/onboarding-store'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial, springSnappy } from '@/lib/perokio/motion'
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react'
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

/**
 * hasWizardProgress — check if the user has filled in any field.
 * Used by the Cancel button to decide whether to show a confirmation dialog.
 */
function hasWizardProgress(): boolean {
  const s = brandOnboardingStore.getState()
  return (
    s.step > 1 ||
    s.brandName.trim().length > 0 ||
    s.industry !== '' ||
    s.selectedTrend !== null ||
    s.invitedCreators.length > 0 ||
    s.topUpAmount !== 500 ||  // default value
    s.monthlyBudget !== 400   // default tier value
  )
}

export function OnboardingWizard() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const step = brandOnboardingStore((s) => s.step)
  const back = brandOnboardingStore((s) => s.back)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const StepComponent = STEP_COMPONENTS[step]
  const stepLabel = STEP_LABELS.find((s) => s.num === step)

  // Cancel handler — show confirm dialog if there's progress to lose
  const handleCancelClick = () => {
    if (hasWizardProgress()) {
      setShowCancelConfirm(true)
    } else {
      router.push('/landing')
    }
  }

  const handleConfirmLeave = () => {
    brandOnboardingStore.getState().reset()
    router.push('/landing')
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-fg flex flex-col">
      {/* === Top nav — minimal, no role switcher, no live ticker ===
          Step 1: just Cancel on the left.
          Step 2-7: Back on the left + Cancel on the right (always accessible). */}
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
          <button
            onClick={handleCancelClick}
            className="flex items-center gap-2 text-sm text-muted-fg hover:text-fg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        )}
        <a href="/landing" className="flex items-center">
          <PerokioWordmark size={28} />
        </a>
        {step > 1 ? (
          <button
            onClick={handleCancelClick}
            className="text-sm text-muted-fg hover:text-red transition-colors"
          >
            Cancel
          </button>
        ) : (
          <div className="w-16" /> /* spacer for centering on step 1 */
        )}
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

      {/* === Cancel confirmation dialog (Polish 3) ===
          Shown when the user clicks Cancel on B02-B07 and has unsaved progress.
          Per spec: "Leave setup? Your progress will be lost." with Cancel/Leave options. */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springSnappy}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={springSnappy}
              className="glass-strong rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-title"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl glass-red flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red" />
                </div>
                <h3 id="cancel-title" className="font-serif text-lg font-semibold">
                  Leave setup?
                </h3>
              </div>
              <p className="text-sm text-muted-fg mb-6 leading-relaxed">
                Your progress will be lost. You'll need to start over from the welcome step next time.
              </p>
              <div className="flex gap-2">
                <AnimatedCTA
                  variant="ghost"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 justify-center"
                  autoFocus
                >
                  Cancel
                </AnimatedCTA>
                <AnimatedCTA
                  variant="destructive"
                  onClick={handleConfirmLeave}
                  className="flex-1 justify-center"
                >
                  Leave
                </AnimatedCTA>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
