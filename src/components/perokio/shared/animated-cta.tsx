'use client'

import { forwardRef, useState } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { ctaVariants, springSnappy, springSoft } from '@/lib/perokio/motion'

type CtaVariant = 'primary' | 'success' | 'destructive' | 'ghost'

interface AnimatedCTAProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: CtaVariant
  /** When set, animates to the success state (label swaps, lime pulse). */
  success?: boolean
  /** Optional success-state label. Falls back to children. */
  successLabel?: string
  /** Glow color override — defaults to variant-based. */
  glowOnHover?: boolean
}

const VARIANT_STYLES: Record<CtaVariant, { bg: string; text: string; border: string; glow: string }> = {
  primary: {
    bg: 'bg-lime',
    text: 'text-[#0A0F0D]',
    border: 'border-transparent',
    glow: 'shadow-lime-glow',
  },
  success: {
    bg: 'bg-lime',
    text: 'text-[#0A0F0D]',
    border: 'border-lime/30',
    glow: 'shadow-lime-glow',
  },
  destructive: {
    bg: 'bg-white/[0.04]',
    text: 'text-red',
    border: 'border-red/30',
    glow: 'shadow-orange-glow',
  },
  ghost: {
    bg: 'glass',
    text: 'text-muted-fg',
    border: 'border-white/10',
    glow: 'shadow-glass',
  },
}

/**
 * AnimatedCTA — hover/press/success morph.
 *
 * Per §6: "AnimatedCTA (hover/press/success morph)"
 *
 * Behavior:
 *   - Hover: subtle scale (1.02) + glow shadow
 *   - Press: scale down (0.97)
 *   - Success: label swaps to "✓ Done" + lime glow pulse (0.4s)
 *   - prefers-reduced-motion: opacity-only transitions, no scale
 *
 * Replaces generic <Button> on the primary CTA of every screen.
 */
export const AnimatedCTA = forwardRef<HTMLButtonElement, AnimatedCTAProps>(function AnimatedCTA(
  {
    variant = 'primary',
    success = false,
    successLabel,
    glowOnHover = true,
    className,
    children,
    onClick,
    disabled,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotion()
  const [internalSuccess, setInternalSuccess] = useState(false)
  const isShowingSuccess = success || internalSuccess

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    onClick?.(e)
    if (successLabel) {
      setInternalSuccess(true)
      // Reset after 2s so the button can be used again
      setTimeout(() => setInternalSuccess(false), 2000)
    }
  }

  const v = VARIANT_STYLES[variant]
  const showGlow = glowOnHover && !reduced

  return (
    <motion.button
      ref={ref}
      variants={reduced ? undefined : ctaVariants}
      initial="rest"
      animate={isShowingSuccess ? 'success' : 'rest'}
      whileHover={disabled || reduced ? undefined : 'hover'}
      whileTap={disabled || reduced ? undefined : 'press'}
      transition={reduced ? { duration: 0.15 } : springSnappy}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        v.bg, v.text, v.border, 'border',
        showGlow && !disabled && 'hover:' + v.glow,
        isShowingSuccess && !reduced && v.glow,
        className,
      )}
      {...rest}
    >
      {/* Success overlay pulse */}
      {isShowingSuccess && !reduced && (
        <motion.span
          className="absolute inset-0 rounded-2xl bg-lime pointer-events-none"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {isShowingSuccess && successLabel ? successLabel : children}
      </span>
    </motion.button>
  )
})
