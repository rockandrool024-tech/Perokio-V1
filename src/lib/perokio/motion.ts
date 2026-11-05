// Perokio motion system — locked spring curves + elevation tokens (§6 extension).
// Imported by every animated component so motion language is consistent.

import type { Transition, Variants } from 'framer-motion'

// ============================================================================
// SPRING CURVES — locked (§6)
// ============================================================================

/** springSoft — for state changes (status pills, panel mount/unmount). */
export const springSoft: Transition = { type: 'spring', stiffness: 120, damping: 20 }

/** springSnappy — for microinteractions (button hover/tap, ticker ticks). */
export const springSnappy: Transition = { type: 'spring', stiffness: 300, damping: 25 }

/** easeEditorial — for entrances (cards, panels sliding in). Cubic-bezier. */
export const easeEditorial: Transition = {
  duration: 0.5,
  ease: [0.22, 0.61, 0.36, 1],
}

// ============================================================================
// ELEVATION TOKENS — locked (§6)
// ============================================================================

export const shadows = {
  /** shadow-glass — default elevation for glassmorphism cards. */
  glass: '0 20px 60px rgba(0,0,0,0.4)',
  /** shadow-lime-glow — for verified / success / primary CTAs. */
  limeGlow: '0 0 24px rgba(216,239,112,0.4)',
  /** shadow-orange-glow — for urgent / opportunity states. */
  orangeGlow: '0 0 24px rgba(237,122,66,0.4)',
} as const

// ============================================================================
// TIMER URGENCY STATES — used by TimerBar + Countdown
// ============================================================================

export type TimerUrgency = 'calm' | 'urgent' | 'critical'

/** Determine urgency from remaining seconds. Thresholds per design spec. */
export function urgencyFromSeconds(secs: number): TimerUrgency {
  if (secs <= 0) return 'critical'
  if (secs < 3600) return 'critical'      // <1h → red pulse
  if (secs < 3 * 3600) return 'urgent'    // <3h → orange
  return 'calm'                            // >3h → lime
}

export const timerVariants: Variants = {
  calm: { color: '#D8EF70', boxShadow: '0 0 0px rgba(216,239,112,0)' },
  urgent: { color: '#ED7A42', boxShadow: '0 0 12px rgba(237,122,66,0.4)' },
  critical: { color: '#E5484D', boxShadow: '0 0 16px rgba(229,72,77,0.6)' },
}

// ============================================================================
// ANIMATED CTA — variants for hover/press/success morph
// ============================================================================

export const ctaVariants: Variants = {
  rest: { scale: 1, boxShadow: '0 0 0px rgba(216,239,112,0)' },
  hover: { scale: 1.02, boxShadow: '0 0 24px rgba(216,239,112,0.5)' },
  press: { scale: 0.97 },
  success: {
    scale: 1,
    boxShadow: '0 0 32px rgba(216,239,112,0.7)',
    transition: { duration: 0.4 },
  },
}
