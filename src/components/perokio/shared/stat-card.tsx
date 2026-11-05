'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
  accent?: 'lime' | 'orange' | 'red' | 'teal' | 'violet'
  children?: ReactNode
  className?: string
}

const accentMap = {
  lime: { glow: 'rgba(216,239,112,0.35)', text: 'text-lime', chipBg: 'bg-lime/10' },
  orange: { glow: 'rgba(237,122,66,0.35)', text: 'text-orange', chipBg: 'bg-orange/10' },
  red: { glow: 'rgba(229,72,77,0.35)', text: 'text-red', chipBg: 'bg-red/10' },
  teal: { glow: 'rgba(111,211,199,0.35)', text: 'text-teal', chipBg: 'bg-teal/10' },
  violet: { glow: 'rgba(182,166,255,0.35)', text: 'text-[#B6A6FF]', chipBg: 'bg-[#B6A6FF]/10' },
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaType = 'neutral',
  accent = 'lime',
  children,
  className,
}: StatCardProps) {
  const a = accentMap[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('glass relative overflow-hidden p-4 rounded-2xl', className)}
    >
      {/* Ambient glow corner */}
      <div
        className="absolute -top-10 -end-10 h-28 w-28 rounded-full blur-2xl opacity-50"
        style={{ background: `radial-gradient(circle, ${a.glow}, transparent 70%)` }}
      />
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-wider uppercase text-muted-fg font-medium">
            {label}
          </span>
          {Icon && (
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', a.chipBg)}>
              <Icon className={cn('h-3.5 w-3.5', a.text)} />
            </span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-fg" data-mono>
            {value}
          </span>
          {delta && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'text-xs font-semibold mb-1 font-mono',
                deltaType === 'up' && 'text-lime',
                deltaType === 'down' && 'text-red',
                deltaType === 'neutral' && 'text-muted-fg',
              )}
            >
              {deltaType === 'up' && '↑ '}
              {deltaType === 'down' && '↓ '}
              {delta}
            </motion.span>
          )}
        </div>
        {children}
      </div>
    </motion.div>
  )
}
