'use client'

import { useEffect, useState } from 'react'
import { differenceInSeconds, intervalToDuration } from 'date-fns'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { timerVariants, urgencyFromSeconds, springSnappy, type TimerUrgency } from '@/lib/perokio/motion'

interface TimerBarProps {
  /** Hours-from-now OR an ISO/date target. */
  hours?: number
  target?: Date | string
  /** Optional label shown above the bar. */
  label?: string
  /** Visual layout: 'bar' (horizontal progress) or 'inline' (just the number). */
  layout?: 'bar' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * TimerBar — reusable countdown with color-shift urgency states.
 *
 * Per §6 of the master spec:
 *   "TimerBar (reusable countdown with color-shift urgency states)"
 *
 * Behavior:
 *   - >3h: lime, no glow (calm)
 *   - <3h: orange, soft glow (urgent)
 *   - <1h: red, pulsing glow (critical)
 *   - prefers-reduced-motion: opacity-only fade, no pulse
 *
 * Used in B09 (locked cards), B12 (review window), C04 (24h lock), C06 (in-progress prints).
 */
export function TimerBar({
  hours,
  target,
  label,
  layout = 'bar',
  size = 'md',
  className,
}: TimerBarProps) {
  const targetDate = target ? new Date(target) : new Date(Date.now() + (hours ?? 0) * 3600 * 1000)
  const reduced = useReducedMotion()

  const compute = () => {
    const secs = Math.max(0, differenceInSeconds(targetDate, new Date()))
    const d = intervalToDuration({ start: 0, end: secs * 1000 })
    return { secs, d, urgency: urgencyFromSeconds(secs) }
  }

  const [state, setState] = useState(() => compute())

  useEffect(() => {
    const id = setInterval(() => setState(compute()), 1000)
    return () => clearInterval(id)
  }, [targetDate.getTime()])

  const { secs, d, urgency } = state
  const hh = String(d.hours ?? 0).padStart(2, '0')
  const mm = String(d.minutes ?? 0).padStart(2, '0')
  const ss = String(d.seconds ?? 0).padStart(2, '0')

  const colorClass =
    urgency === 'critical' ? 'text-red' : urgency === 'urgent' ? 'text-orange' : 'text-lime'
  const barColor =
    urgency === 'critical'
      ? 'from-red to-orange'
      : urgency === 'urgent'
        ? 'from-orange to-lime'
        : 'from-lime to-teal'

  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' }[size]

  // Progress percentage relative to the original window
  const initialSecs = (hours ?? 12) * 3600
  const progressPct = initialSecs > 0 ? Math.max(0, Math.min(100, (secs / initialSecs) * 100)) : 0

  if (layout === 'inline') {
    return (
      <motion.span
        variants={reduced ? undefined : timerVariants}
        animate={urgency}
        transition={springSnappy}
        className={cn('inline-flex items-center gap-2 font-mono tabular-nums', sizeClass, colorClass, className)}
        data-mono
      >
        {secs > 0 ? `${hh}:${mm}:${ss}` : '00:00:00'}
      </motion.span>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex items-center justify-between text-[10px] text-muted-fg">
          <span>{label}</span>
          <motion.span
            variants={reduced ? undefined : timerVariants}
            animate={urgency}
            transition={springSnappy}
            className="font-mono"
            data-mono
          >
            {hh}:{mm}:{ss}
          </motion.span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', barColor)}
          initial={reduced ? false : { width: '100%' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: reduced ? 0 : 1, ease: 'linear' }}
          style={
            urgency === 'critical' && !reduced
              ? { boxShadow: '0 0 8px rgba(229,72,77,0.5)' }
              : urgency === 'urgent' && !reduced
                ? { boxShadow: '0 0 6px rgba(237,122,66,0.4)' }
                : undefined
          }
        />
      </div>
    </div>
  )
}

export type { TimerUrgency }
