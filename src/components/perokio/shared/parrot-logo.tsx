'use client'

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'

/**
 * ParrotLogo — Perokio brand mark.
 * Compact parrot silhouette in lime/orange/red palette over Deep Dark.
 */
export function ParrotLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 rounded-full blur-md"
        style={{ background: 'radial-gradient(circle, rgba(216,239,112,0.4), transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg viewBox="0 0 48 48" width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="parrotBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8EF70" />
            <stop offset="55%" stopColor="#6FD3C7" />
            <stop offset="100%" stopColor="#ED7A42" />
          </linearGradient>
          <linearGradient id="parrotBeak" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ED7A42" />
            <stop offset="100%" stopColor="#E5484D" />
          </linearGradient>
        </defs>
        <path
          d="M 12 16 Q 10 8 18 6 Q 28 4 34 12 Q 38 18 36 26 Q 34 34 26 36 Q 18 38 14 32 Q 10 26 12 16 Z"
          fill="url(#parrotBody)"
        />
        <path d="M 22 18 Q 28 16 32 22 Q 34 28 30 32 Q 24 32 22 26 Z" fill="#0A0F0D" opacity="0.35" />
        <circle cx="28" cy="14" r="2.6" fill="#fff" />
        <circle cx="28.6" cy="14.4" r="1.5" fill="#0A0F0D" />
        <path d="M 33 14 L 40 16 L 33 18 Z" fill="url(#parrotBeak)" />
        <path d="M 12 24 L 6 28 L 12 32 Z" fill="#ED7A42" opacity="0.85" />
      </svg>
    </div>
  )
}

export type ParrotEyeState = 'idle' | 'claim' | 'approve'

export interface ParrotEyeHandle {
  /** Force a one-shot blink (used when the live view count ticks). */
  blink: () => void
}

/**
 * ParrotEye — V1's entire mascot (3D deferred to V2).
 *
 * §6 Polish (Cycle 5d):
 *   - Idle blink: randomized 3-5s interval, respecting prefers-reduced-motion
 *   - State reactions: slow pupil dilation on Claim, quick squint on Approve
 *   - Consistent placement: same component + same idle timing everywhere
 *     (B08 header, B12 approve, C01 header, C03 confirmation)
 */
export const ParrotEye = forwardRef<
  ParrotEyeHandle,
  { size?: number; className?: string; state?: ParrotEyeState }
>(function ParrotEye({ size = 48, className = '', state = 'idle' }, ref) {
  const [blinkKey, setBlinkKey] = useState(0)
  const lastBlinkRef = useRef(0)
  const reduced = useReducedMotion()

  // === Idle blink: randomized 3-5s ===
  useEffect(() => {
    if (reduced) return // no blink under reduced motion
    let timer: ReturnType<typeof setTimeout>
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 2000 // 3-5s
      timer = setTimeout(() => {
        setBlinkKey((k) => k + 1)
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => clearTimeout(timer)
  }, [reduced])

  useImperativeHandle(ref, () => ({
    blink: () => {
      if (reduced) return
      const now = Date.now()
      if (now - lastBlinkRef.current < 350) return
      lastBlinkRef.current = now
      setBlinkKey((k) => k + 1)
    },
  }))

  // === State reactions ===
  // Claim: slow pupil dilation (scale up the pupil briefly)
  // Approve: quick squint (scale down the iris vertically)
  const pupilScale = state === 'claim' ? 1.3 : 1
  const irisScaleY = state === 'approve' ? 0.5 : 1

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-md"
        style={{ background: 'radial-gradient(circle, rgba(216,239,112,0.55), transparent 65%)' }}
        animate={reduced ? undefined : { scale: [1, 1.18, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg viewBox="0 0 64 64" width={size} height={size} className="relative z-10">
        <defs>
          <radialGradient id="eyeSocket" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1a2620" />
            <stop offset="60%" stopColor="#0A0F0D" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <radialGradient id="irisGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#F4FFB8" />
            <stop offset="35%" stopColor="#D8EF70" />
            <stop offset="80%" stopColor="#8FB33A" />
            <stop offset="100%" stopColor="#3D4F1A" />
          </radialGradient>
          <radialGradient id="highlight" cx="35%" cy="30%" r="35%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="socketRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D8EF70" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#6FD3C7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ED7A42" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* 3D socket — dark sphere */}
        <circle cx="32" cy="32" r="28" fill="url(#eyeSocket)" stroke="url(#socketRim)" strokeWidth="1.4" />
        <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />

        {/* Iris (lime) — with state-driven squint on Approve */}
        <g key={blinkKey} className={reduced ? '' : 'animate-blink-once'} style={{ transformOrigin: '32px 32px', transform: `scaleY(${irisScaleY})` }}>
          <circle cx="32" cy="32" r="13" fill="url(#irisGrad)" />
          {/* Pupil — with state-driven dilation on Claim */}
          <motion.circle
            cx="32"
            cy="32"
            r="6"
            fill="#0A0F0D"
            animate={{ r: 6 * pupilScale }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          {/* Highlight */}
          <circle cx="28" cy="28" r="3.5" fill="url(#highlight)" />
          {/* Iris striations */}
          <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none">
            <line x1="32" y1="20" x2="32" y2="26" />
            <line x1="32" y1="38" x2="32" y2="44" />
            <line x1="20" y1="32" x2="26" y2="32" />
            <line x1="38" y1="32" x2="44" y2="32" />
          </g>
        </g>
      </svg>
    </div>
  )
})

export function PerokioWordmark({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <ParrotLogo size={size} />
      <div className="flex flex-col leading-none">
        <span className="font-serif text-lg font-semibold tracking-tight text-fg">Perokio</span>
        <span className="text-[10px] tracking-[0.18em] uppercase text-subtle">
          Verified Facts × Local Film
        </span>
      </div>
    </div>
  )
}
