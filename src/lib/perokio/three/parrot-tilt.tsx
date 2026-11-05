'use client'

/**
 * PROTOTYPE A — 2D SVG Parrot with CSS 3D transforms.
 *
 * Approach: keep the existing SVG parrot, wrap it in a perspective container,
 * apply mouse-tracking rotateX/rotateY + parallax depth on layered elements
 * (eye, beak, body, tail) to fake 3D depth.
 *
 * This is the "CSS 3D transforms" alternative to procedural R3F per the user
 * caveat: "prototype one frame procedurally AND one frame as a 2D sprite sheet
 * with CSS 3D transforms before committing."
 *
 * Pros vs procedural:
 *   - Zero WebGL dependency, works everywhere
 *   - Already exists (current ParrotLogo SVG), just adds tilt
 *   - Tiny bundle (~2KB)
 *
 * Cons vs procedural:
 *   - Can't truly rotate the parrot in 3D space (only fake-tilt)
 *   - Can't show "spin 360°" success animation (limited to ~30° tilt)
 *   - Layered parallax is visually subtle, not a "wow" moment
 */

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ParrotTiltProps {
  size?: number
  className?: string
  /** When incremented, plays the "claim" nod animation (forward tilt + return). */
  claimTrigger?: number
  /** When incremented, plays a quick fake-spin via Y oscillation. */
  successTrigger?: number
}

export function ParrotTilt({
  size = 96,
  className,
  claimTrigger = 0,
  successTrigger = 0,
}: ParrotTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  // Mouse-tracked rotation (springs for smooth follow)
  const mouseX = useMotionValue(0.5) // 0-1, 0.5 = center
  const mouseY = useMotionValue(0.5)
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-15, 15]), { stiffness: 150, damping: 15 })
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), { stiffness: 150, damping: 15 })

  useEffect(() => {
    if (!isHovering) {
      mouseX.set(0.5)
      mouseY.set(0.5)
    }
  }, [isHovering, mouseX, mouseY])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size, perspective: 600 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Ambient glow — independent of tilt */}
      <motion.div
        className="absolute inset-0 rounded-full blur-lg"
        style={{ background: 'radial-gradient(circle, rgba(216,239,112,0.4), transparent 70%)' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* The 3D-tilted parrot stage */}
      <motion.div
        className="relative"
        style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
        animate={{
          // Claim: forward nod
          rotateX: claimTrigger ? [0, 15, 0] : 0,
          // Success: spin (limited to 180° oscillation since CSS can't truly 360)
          rotateY: successTrigger ? [0, 30, -30, 0] : 0,
        }}
        transition={{
          duration: successTrigger ? 0.8 : 0.4,
          ease: 'easeOut',
        }}
      >
        {/* Mouse-driven tilt layer (the parent of the SVG) */}
        <motion.div
          className="absolute inset-0"
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        >
          <svg viewBox="0 0 48 48" width={size} height={size} className="relative z-10">
            <defs>
              <linearGradient id="tiltBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D8EF70" />
                <stop offset="55%" stopColor="#6FD3C7" />
                <stop offset="100%" stopColor="#ED7A42" />
              </linearGradient>
              <linearGradient id="tiltBeak" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ED7A42" />
                <stop offset="100%" stopColor="#E5484D" />
              </linearGradient>
            </defs>

            {/* Body — depth layer 1 (back) */}
            <path
              d="M 12 16 Q 10 8 18 6 Q 28 4 34 12 Q 38 18 36 26 Q 34 34 26 36 Q 18 38 14 32 Q 10 26 12 16 Z"
              fill="url(#tiltBody)"
              style={{ transform: 'translateZ(0px)' }}
            />
            {/* Wing — depth layer 2 (mid) */}
            <path
              d="M 22 18 Q 28 16 32 22 Q 34 28 30 32 Q 24 32 22 26 Z"
              fill="#0A0F0D"
              opacity="0.35"
              style={{ transform: 'translateZ(8px)' }}
            />
            {/* Eye — depth layer 3 (front) */}
            <g style={{ transform: 'translateZ(16px)' }}>
              <circle cx="28" cy="14" r="2.8" fill="#fff" />
              <circle cx="28.6" cy="14.4" r="1.6" fill="#0A0F0D" className="animate-parrot-blink" />
              {/* Eye highlight */}
              <circle cx="28.2" cy="13.8" r="0.5" fill="#fff" />
            </g>
            {/* Beak — depth layer 4 (most-front) */}
            <path
              d="M 33 14 L 40 16 L 33 18 Z"
              fill="url(#tiltBeak)"
              style={{ transform: 'translateZ(20px)' }}
            />
            {/* Tail — depth layer 0 (back-most) */}
            <path
              d="M 12 24 L 6 28 L 12 32 Z"
              fill="#ED7A42"
              opacity="0.85"
              style={{ transform: 'translateZ(-4px)' }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}
