'use client'

import { useSyncExternalStore } from 'react'

/**
 * useReducedMotion — respects the user's OS-level "reduce motion" preference.
 *
 * Per §5 of the master spec:
 *   "prefers-reduced-motion: swap the 3D parrot for the current 2D blinking eye SVG."
 *   "Add prefers-reduced-motion support everywhere." (Cycle 2 amendment)
 *
 * Implementation uses useSyncExternalStore (React 18+) — the canonical way to
 * subscribe to browser APIs like matchMedia without violating the React Compiler's
 * "no setState in effect" rule.
 *
 * Usage:
 *   const reduced = useReducedMotion()
 *   <motion.div animate={reduced ? { opacity: [0,1] } : { opacity: [0,1], y: [12,0] }} />
 *
 * When reduced is true, animations should:
 *   - Remove all transform-based motion (scale, y, x, rotate)
 *   - Keep opacity-only fades (≤200ms)
 *   - Skip continuous loops (parrot blink, ticker pulse)
 *   - Replace 3D parrot with 2D SVG fallback (handled in Cycle 3)
 */

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// SSR snapshot — must match the initial client render to avoid hydration mismatch.
function getServerSnapshot(): boolean {
  return false
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
