'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ViewTickerProps {
  initialViews: number
  className?: string
  /** Fires every time the view count increments — used by B08 to blink the Parrot Eye. */
  onTick?: (newViews: number, delta: number) => void
  /** ms interval range (default 2-4s). */
  minIntervalMs?: number
  maxIntervalMs?: number
}

/**
 * ViewTicker — JetBrains Mono number that ticks up at random intervals.
 * Calls onTick after every increment so listeners (Parrot Eye) can react.
 */
export function ViewTicker({
  initialViews,
  className,
  onTick,
  minIntervalMs = 2000,
  maxIntervalMs = 4000,
}: ViewTickerProps) {
  const [views, setViews] = useState(initialViews)
  const onTickRef = useRef(onTick)

  // Sync ref inside an effect, NOT during render (React Compiler rule)
  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const increment = Math.floor(Math.random() * 47) + 1
      setViews((v) => {
        const next = v + increment
        onTickRef.current?.(next, increment)
        return next
      })
      timer = setTimeout(tick, minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs))
    }
    timer = setTimeout(tick, minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs))
    return () => clearTimeout(timer)
  }, [minIntervalMs, maxIntervalMs])

  const formatted = views.toLocaleString('en-US')

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
      </span>
      <motion.span
        key={views}
        initial={{ scale: 1.08, color: '#D8EF70' }}
        animate={{ scale: 1, color: 'rgba(255,255,255,0.92)' }}
        transition={{ duration: 0.45 }}
        className="font-mono font-semibold tabular-nums text-fg"
        data-mono
      >
        {formatted}
      </motion.span>
    </div>
  )
}
