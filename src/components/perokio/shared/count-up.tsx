'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// CountUp — animated number that rolls from 0 to target on mount
// ============================================================================
// Uses Framer Motion's animate() for smooth spring-based counting.
// Stagger via the `delay` prop.
// ============================================================================

interface CountUpProps {
  value: number
  duration?: number
  delay?: number
  format?: (n: number) => string
  className?: string
}

export function CountUp({
  value,
  duration = 1.0,
  delay = 0,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: CountUpProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => format(v))
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      delay,
      ease: [0.22, 0.61, 0.36, 1],
    })

    const unsubscribe = rounded.on('change', (v) => setDisplay(v))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, duration, delay, count, rounded])

  return (
    <span className={cn('animate-count-up tabular', className)} data-mono>
      {display}
    </span>
  )
}
