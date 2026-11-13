'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { springSoft } from '@/lib/perokio/motion'

// ============================================================================
// SuccessScoreRing — circular SVG progress ring, glowing in lime
// ============================================================================
// Renders the Success Score (0-100) as a premium circular gauge.
// The ring fills with lime on mount, with a subtle glow.
// ============================================================================

interface SuccessScoreRingProps {
  score: number  // 0-100
  size?: number
  stroke?: number
  showLabel?: boolean
  className?: string
}

export function SuccessScoreRing({
  score,
  size = 48,
  stroke = 4,
  showLabel = true,
  className,
}: SuccessScoreRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const isHigh = score >= 90
  const isMid = score >= 70 && score < 90
  const color = isHigh ? '#D8EF70' : isMid ? '#ED7A42' : '#E5484D'

  return (
    <div className={cn('relative success-ring-glow', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`success-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#success-grad-${size})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-mono font-bold tabular text-lime', className)} style={{ fontSize: size * 0.28 }} data-mono>
            {score}
          </span>
        </div>
      )}
    </div>
  )
}
