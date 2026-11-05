'use client'

import { useEffect, useRef, useState } from 'react'
import { differenceInSeconds, intervalToDuration } from 'date-fns'
import { motion } from 'framer-motion'

type CountdownVariant = 'default' | 'urgent' | 'critical' | 'orange'

interface CountdownProps {
  /** Target time — either hours-from-now OR an ISO/date target. */
  hours?: number
  target?: Date | string
  variant?: CountdownVariant
  /** Show "HH:MM:SS" (default) or compact "12h 04m" */
  format?: 'hms' | 'compact'
  className?: string
  /** Show the leading icon (none / lock / clock) */
  showIcon?: 'none' | 'lock' | 'clock' | 'alert'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Countdown — JetBrains Mono number driven by date-fns.
 * Color rules per design system:
 *   - default (>3h): muted white
 *   - urgent (<3h): Opportunity Orange #ED7A42
 *   - critical (<1h): Alert Red #E5484D + pulse-glow
 */
export function Countdown({
  hours,
  target,
  variant = 'default',
  format = 'hms',
  className = '',
  showIcon = 'none',
  size = 'md',
}: CountdownProps) {
  const targetDate = target ? new Date(target) : new Date(Date.now() + (hours ?? 0) * 3600 * 1000)

  const compute = () => {
    const secs = Math.max(0, differenceInSeconds(targetDate, new Date()))
    const d = intervalToDuration({ start: 0, end: secs * 1000 })
    return { secs, d }
  }

  // Lazy initial state — avoids React-Compiler set-state-in-effect lint
  const [state, setState] = useState(() => compute())
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setState(compute())
    }, 1000)
    return () => clearInterval(id)
  }, [targetDate.getTime()])

  const { secs, d } = state
  const hh = String(d.hours ?? 0).padStart(2, '0')
  const mm = String(d.minutes ?? 0).padStart(2, '0')
  const ss = String(d.seconds ?? 0).padStart(2, '0')

  // Effective variant — auto-escalates by remaining time unless explicitly orange
  let effVariant = variant
  if (variant === 'default' || variant === 'urgent' || variant === 'critical') {
    if (secs <= 0) effVariant = 'critical'
    else if (secs < 3600) effVariant = 'critical'
    else if (secs < 3 * 3600) effVariant = 'urgent'
    else effVariant = 'default'
  }

  const color =
    effVariant === 'critical'
      ? 'text-red'
      : effVariant === 'urgent'
        ? 'text-orange'
        : effVariant === 'orange'
          ? 'text-orange'
          : 'text-fg'
  const glow =
    effVariant === 'critical'
      ? 'animate-pulse-glow-red'
      : effVariant === 'urgent'
        ? 'glow-orange'
        : ''

  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }[size]

  const display =
    format === 'compact'
      ? secs > 3600
        ? `${hh}h ${mm}m`
        : `${mm}m ${ss}s`
      : secs > 0
        ? `${hh}:${mm}:${ss}`
        : '00:00:00'

  return (
    <motion.span
      layout
      className={`inline-flex items-center gap-2 font-mono tabular-nums ${sizeClass} ${color} ${glow} ${className}`}
      data-mono
    >
      {showIcon === 'lock' && <LockIcon className="w-4 h-4" />}
      {showIcon === 'clock' && <ClockIcon className="w-4 h-4" />}
      {showIcon === 'alert' && <AlertIcon className="w-4 h-4" />}
      {display}
    </motion.span>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
function AlertIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" />
    </svg>
  )
}
