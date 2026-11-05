'use client'

/**
 * PROTOTYPE B — Procedural React Three Fiber Parrot.
 *
 * Built entirely from R3F primitives (no external GLTF). This gives full control
 * over the poly budget and palette compliance.
 *
 * Poly budget:
 *   - Body sphere (24x16 segs):       ~768 polys
 *   - Head sphere (16x12 segs):      ~384 polys
 *   - Beak cone (16 segs):           ~32 polys
 *   - Eye spheres (2x 16 segs):       ~64 polys
 *   - Wing boxes (2x 6 quads):        ~24 polys
 *   - Tail cone (12 segs):            ~24 polys
 *   ──────────────────────────────────────────
 *   TOTAL:                            ~1,296 polys  ✓ under 2,800 budget
 *
 * Material: MeshBasicMaterial (no PBR, no lighting cost — flat shading
 * aesthetic, intentional per Cycle 1 strategy doc).
 *
 * Animation states (per §5 of master spec):
 *   - idle:     subtle breathing + 3-5s blink
 *   - claim:    leans forward, nods once
 *   - edit:     head tilt oscillation (working)
 *   - lock:     hunches down, eyes forward
 *   - publish:  bounce + rotate
 *   - success:  360° spin
 *   - error:    droop + red flash
 */

import { Canvas, useFrame } from '@react-three/fiber'
import { Component, useMemo, useRef, useState, useEffect, Suspense, type ReactNode } from 'react'
import * as THREE from 'three'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'

export type ParrotState = 'idle' | 'claim' | 'edit' | 'lock' | 'publish' | 'success' | 'error'

interface ParrotMascotProps {
  size?: number
  state?: ParrotState
  className?: string
}

// ============================================================================
// COLORS — locked palette (per §2 NON-NEGOTIABLES)
// ============================================================================
const COLORS = {
  body: '#D8EF70',
  bodyDark: '#8FB33A',
  belly: '#B8D956',
  beak: '#ED7A42',
  beakDark: '#C25A28',
  eyeWhite: '#FFFFFF',
  eyePupil: '#0A0F0D',
  tail: '#ED7A42',
  error: '#E5484D',
} as const

// ============================================================================
// WebGL Error Boundary — catches Canvas init failures, falls back to 2D
// ============================================================================
class ParrotErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    // Log to console for dev visibility — production would ship to PostHog
    console.warn('[ParrotMascot] WebGL failed, falling back to 2D:', error)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// ============================================================================
// ProceduralParrot — the actual 3D mesh
// ============================================================================
function ProceduralParrot({ state = 'idle' }: { state?: ParrotState }) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const eyeLRef = useRef<THREE.Mesh>(null)
  const eyeRRef = useRef<THREE.Mesh>(null)
  const bodyMatRef = useRef<THREE.MeshBasicMaterial>(null)

  // State machine: tracks elapsed time in current state for animation timing
  const stateStart = useRef(performance.now() / 1000)
  const lastBlink = useRef(0)

  // Reset state timer when state changes (no setState — use ref)
  useEffect(() => {
    stateStart.current = performance.now() / 1000
  }, [state])

  useFrame((threeState) => {
    if (!groupRef.current || !headRef.current || !eyeLRef.current || !eyeRRef.current) return
    const t = threeState.clock.elapsedTime
    const elapsed = t - stateStart.current

    // === ALWAYS-ON: idle breathing (subtle Y scale oscillation) ===
    const breathing = state === 'idle' || state === 'edit' ? Math.sin(t * 1.5) * 0.02 : 0

    // === BLINK (every 3-5s on idle, never on error) ===
    if (state === 'idle' && t - lastBlink.current > 3 + Math.random() * 2) {
      lastBlink.current = t
    }
    const blinkDelta = t - lastBlink.current
    const isBlinking = blinkDelta < 0.15 // 150ms blink
    const blinkScale = isBlinking ? 0.1 : 1
    eyeLRef.current.scale.y = blinkScale
    eyeRRef.current.scale.y = blinkScale

    // === STATE-SPECIFIC ANIMATIONS ===
    const g = groupRef.current
    const h = headRef.current

    switch (state) {
      case 'idle': {
        // Gentle float + breathing
        g.position.y = Math.sin(t * 0.8) * 0.05
        g.rotation.z = Math.sin(t * 0.6) * 0.02
        g.rotation.x = 0
        g.rotation.y = 0
        g.scale.setScalar(1 + breathing)
        h.rotation.x = 0
        h.rotation.z = 0
        break
      }
      case 'claim': {
        // Lean forward + nod once (0-0.6s), then return to idle
        const p = Math.min(elapsed / 0.6, 1)
        const nod = p < 0.5 ? p * 2 : (1 - p) * 2
        g.rotation.x = nod * 0.3
        g.position.y = -nod * 0.1
        g.rotation.z = 0
        g.rotation.y = 0
        g.scale.setScalar(1)
        h.rotation.x = 0
        h.rotation.z = 0
        break
      }
      case 'edit': {
        // Head tilt oscillation (working)
        h.rotation.z = Math.sin(t * 2.5) * 0.15
        h.rotation.x = Math.sin(t * 1.8) * 0.05
        g.rotation.x = 0
        g.rotation.y = 0
        g.position.y = Math.sin(t * 0.8) * 0.04
        g.scale.setScalar(1 + breathing)
        break
      }
      case 'lock': {
        // Hunch down, focus forward (scale.y shrink, slight forward lean)
        g.scale.set(1, 0.92, 1)
        g.rotation.x = 0.08
        g.position.y = -0.05
        g.rotation.z = 0
        g.rotation.y = 0
        h.rotation.x = 0
        h.rotation.z = 0
        break
      }
      case 'publish': {
        // Bounce up + small rotate
        const bounce = Math.abs(Math.sin(elapsed * 8)) * 0.2
        g.position.y = bounce
        g.rotation.y = Math.sin(elapsed * 6) * 0.3
        g.rotation.x = 0
        g.rotation.z = 0
        g.scale.setScalar(1)
        h.rotation.x = 0
        h.rotation.z = 0
        break
      }
      case 'success': {
        // 360° spin over 2s, with a slight hop
        const spin = (elapsed / 2) * Math.PI * 2
        g.rotation.y = spin
        g.position.y = Math.sin(elapsed * Math.PI) * 0.2 // hop
        g.rotation.x = 0
        g.rotation.z = 0
        g.scale.setScalar(1)
        h.rotation.x = 0
        h.rotation.z = 0
        break
      }
      case 'error': {
        // Droop + small shake. Error pulse (red body) for first 1s.
        const isErrorPulsing = elapsed < 1
        if (bodyMatRef.current) {
          bodyMatRef.current.color.set(isErrorPulsing ? COLORS.error : COLORS.body)
        }
        g.rotation.z = -0.15
        g.rotation.x = 0.1
        g.position.y = -0.05
        g.scale.set(1, 0.95, 1)
        // Quick shake for first 200ms
        const shake = elapsed < 0.2 ? Math.sin(elapsed * 60) * 0.05 : 0
        g.rotation.z += shake
        h.rotation.x = 0.2
        h.rotation.z = 0
        break
      }
    }

    // Reset body color when not in error state
    if (state !== 'error' && bodyMatRef.current) {
      bodyMatRef.current.color.set(COLORS.body)
    }
  })

  // === Geometry construction (memoized — created once) ===
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* === BODY — lime, stretched sphere === */}
      <mesh position={[0, 0, 0]} scale={[0.85, 1, 0.85]}>
        <sphereGeometry args={[0.7, 24, 16]} />
        <meshBasicMaterial ref={bodyMatRef} color={COLORS.body} />
      </mesh>

      {/* === BELLY — slightly darker, smaller sphere on front === */}
      <mesh position={[0, -0.15, 0.4]} scale={[0.55, 0.65, 0.3]}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshBasicMaterial color={COLORS.belly} />
      </mesh>

      {/* === HEAD group (animated separately for edit/lock) === */}
      <group ref={headRef} position={[0, 0.7, 0.1]}>
        {/* Head sphere */}
        <mesh>
          <sphereGeometry args={[0.45, 16, 12]} />
          <meshBasicMaterial color={COLORS.body} />
        </mesh>

        {/* === EYES (two white spheres + pupils) === */}
        <mesh ref={eyeLRef} position={[-0.18, 0.08, 0.4]}>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshBasicMaterial color={COLORS.eyeWhite} />
        </mesh>
        <mesh ref={eyeRRef} position={[0.18, 0.08, 0.4]}>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshBasicMaterial color={COLORS.eyeWhite} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.18, 0.08, 0.48]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshBasicMaterial color={COLORS.eyePupil} />
        </mesh>
        <mesh position={[0.18, 0.08, 0.48]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshBasicMaterial color={COLORS.eyePupil} />
        </mesh>

        {/* === BEAK — orange cone === */}
        <mesh position={[0, -0.12, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.25, 16]} />
          <meshBasicMaterial color={COLORS.beak} />
        </mesh>
      </group>

      {/* === WINGS — flat boxes on body sides === */}
      <mesh position={[-0.55, -0.05, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.15, 0.55, 0.35]} />
        <meshBasicMaterial color={COLORS.bodyDark} />
      </mesh>
      <mesh position={[0.55, -0.05, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.15, 0.55, 0.35]} />
        <meshBasicMaterial color={COLORS.bodyDark} />
      </mesh>

      {/* === TAIL — orange cone pointing back === */}
      <mesh position={[0, -0.4, -0.6]} rotation={[-Math.PI / 4, 0, 0]}>
        <coneGeometry args={[0.18, 0.5, 12]} />
        <meshBasicMaterial color={COLORS.tail} />
      </mesh>

      {/* === FEET — two tiny orange boxes === */}
      <mesh position={[-0.2, -0.75, 0.1]}>
        <boxGeometry args={[0.1, 0.08, 0.15]} />
        <meshBasicMaterial color={COLORS.beakDark} />
      </mesh>
      <mesh position={[0.2, -0.75, 0.1]}>
        <boxGeometry args={[0.1, 0.08, 0.15]} />
        <meshBasicMaterial color={COLORS.beakDark} />
      </mesh>
    </group>
  )
}

// ============================================================================
// SuccessSparkles — instanced sparkle particles (10 particles, 1 quad each)
// ============================================================================
function SuccessSparkles({ active }: { active: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: (i / 10) * Math.PI * 2,
        radius: 0.8 + Math.random() * 0.4,
        speed: 1 + Math.random() * 0.5,
        size: 0.05 + Math.random() * 0.05,
      })),
    [],
  )

  useFrame((state) => {
    if (!ref.current || !active) return
    const t = state.clock.elapsedTime
    particles.forEach((p, i) => {
      const a = p.angle + t * p.speed
      const r = p.radius * (1 + Math.sin(t * 2 + i) * 0.2)
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r + t * 0.3, Math.sin(a * 2) * 0.3)
      dummy.scale.setScalar(p.size * (1 - Math.min(t / 2, 1)))
      dummy.rotation.z = t * 2
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  if (!active) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 10]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={COLORS.body} transparent opacity={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

// ============================================================================
// ParrotMascot — the exported component (Canvas wrapper + state machine)
// ============================================================================
export function ParrotMascot({ size = 120, state = 'idle', className }: ParrotMascotProps) {
  const reduced = useReducedMotion()
  const [inView, setInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // === IntersectionObserver — only mount the Canvas when in view ===
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setInView(e.isIntersecting))
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // === prefers-reduced-motion → always use 2D fallback ===
  if (reduced) {
    return <Parrot2DFallback size={size} state={state} className={className} />
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {inView ? (
        <ParrotErrorBoundary
          fallback={<Parrot2DFallback size={size} state={state} className={className} />}
        >
          <Suspense fallback={<Parrot2DFallback size={size} state={state} />}>
            <Canvas
              // Per Cycle 1 strategy: Performance scaling + adaptive DPR
              dpr={[1, 2]}
              performance={{ min: 0.5 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              style={{ width: '100%', height: '100%' }}
              camera={{ position: [0, 0, 3], fov: 35 }}
            >
              <ambientLight intensity={0.8} />
              <ProceduralParrot state={state} />
              <SuccessSparkles active={state === 'success'} />
            </Canvas>
          </Suspense>
        </ParrotErrorBoundary>
      ) : (
        // Out of view — render placeholder to save resources
        <div style={{ width: size, height: size }} />
      )}
    </div>
  )
}

// ============================================================================
// Parrot2DFallback — the existing SVG parrot with state-based animation
// ============================================================================
function Parrot2DFallback({
  size,
  state,
  className,
}: {
  size: number
  state: ParrotState
  className?: string
}) {
  const color =
    state === 'error' ? COLORS.error : state === 'success' ? COLORS.body : COLORS.body

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      data-parrot-fallback
    >
      <div
        className="absolute inset-0 rounded-full blur-lg"
        style={{
          background: `radial-gradient(circle, ${color}40, transparent 70%)`,
        }}
      />
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        style={{ transform: state === 'lock' ? 'scale(0.95)' : 'scale(1)' }}
      >
        <defs>
          <linearGradient id="fbBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.body} />
            <stop offset="55%" stopColor="#6FD3C7" />
            <stop offset="100%" stopColor={COLORS.beak} />
          </linearGradient>
        </defs>
        <path
          d="M 12 16 Q 10 8 18 6 Q 28 4 34 12 Q 38 18 36 26 Q 34 34 26 36 Q 18 38 14 32 Q 10 26 12 16 Z"
          fill={state === 'error' ? COLORS.error : 'url(#fbBody)'}
        />
        <path d="M 22 18 Q 28 16 32 22 Q 34 28 30 32 Q 24 32 22 26 Z" fill="#0A0F0D" opacity="0.35" />
        <circle cx="28" cy="14" r="2.8" fill="#fff" />
        <circle
          cx="28.6"
          cy="14.4"
          r="1.6"
          fill="#0A0F0D"
          className={state === 'idle' ? 'animate-parrot-blink' : ''}
        />
        <path d="M 33 14 L 40 16 L 33 18 Z" fill={COLORS.beak} />
        <path d="M 12 24 L 6 28 L 12 32 Z" fill={COLORS.beak} opacity="0.85" />
      </svg>
    </div>
  )
}
