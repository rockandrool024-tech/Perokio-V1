'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PerokioWordmark, ParrotLogo } from '@/components/perokio/shared/parrot-logo'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { easeEditorial, springSnappy } from '@/lib/perokio/motion'
import { Mail, Check, ArrowRight, ArrowLeft } from 'lucide-react'

/**
 * P02 Login — VISUAL RESTYLE ONLY.
 *
 * Per Amendment #5: "Do NOT add a real magic-link flow — that's a separate
 * functional cycle. Mock the visual if needed with a setTimeout, but don't
 * fake a real email signup."
 *
 * Behavior:
 *   - Step 1: email input + "Send magic link" button. Click → setTimeout(800ms)
 *     → flips to Step 2 ("Check your inbox" confirmation). NO real email sent.
 *   - Step 2: "Open the demo" button → routes to / (the app).
 *   - Social sign-in buttons (Apple / Google) → also mock with setTimeout → /
 *
 * Premium aesthetic: single glass card, single column, generous whitespace.
 * No "🚀" emojis, no SaaS illustrations.
 */

type Step = 'email' | 'sent' | 'signing-in'

export function Login() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [signingInWith, setSigningInWith] = useState<'apple' | 'google' | null>(null)

  // Mock magic-link send — setTimeout, no actual email (Amendment #5)
  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) return
    setStep('sent')
  }

  // Mock social sign-in — setTimeout, then route to app
  const handleSocial = (provider: 'apple' | 'google') => {
    setSigningInWith(provider)
    setStep('signing-in')
    setTimeout(() => {
      router.push('/')
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-fg flex flex-col">
      {/* === Top nav === */}
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <Link href="/landing" className="flex items-center gap-2 text-sm text-muted-fg hover:text-fg transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </header>

      {/* === Main — single glass card === */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Wordmark + parrot */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={easeEditorial}
            className="flex flex-col items-center mb-8"
          >
            <ParrotLogo size={56} />
            <div className="mt-3">
              <PerokioWordmark size={28} />
            </div>
            <p className="text-sm text-muted-fg mt-3 text-center max-w-xs">
              Sign in to claim facts, film videos, and get paid within 24 hours.
            </p>
          </motion.div>

          {/* The card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeEditorial, delay: 0.1 }}
            className="glass rounded-2xl p-6 lg:p-8 space-y-6"
          >
            <AnimatePresence mode="wait">
              {/* === Step 1: email input === */}
              {step === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={springSnappy}
                  className="space-y-5"
                >
                  <form onSubmit={handleSendLink} className="space-y-3">
                    <label htmlFor="email" className="text-xs text-muted-fg uppercase tracking-wider">
                      Email or handle
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
                      <input
                        id="email"
                        type="email"
                        autoFocus
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="amira.tn@example.com"
                        className="w-full pl-10 pr-3 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-lime/40 placeholder:text-subtle"
                      />
                    </div>
                    <AnimatedCTA type="submit" className="w-full justify-center">
                      Send magic link
                      <ArrowRight className="h-4 w-4" />
                    </AnimatedCTA>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 text-xs text-muted-fg">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span>or</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  {/* Social sign-in (mock) */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSocial('apple')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl glass border border-white/10 hover:bg-white/[0.05] transition-colors text-sm font-medium"
                    >
                      <AppleIcon className="h-4 w-4" />
                      Continue with Apple
                    </button>
                    <button
                      onClick={() => handleSocial('google')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl glass border border-white/10 hover:bg-white/[0.05] transition-colors text-sm font-medium"
                    >
                      <GoogleIcon className="h-4 w-4" />
                      Continue with Google
                    </button>
                  </div>

                  <p className="text-[10px] text-subtle text-center leading-relaxed">
                    By signing in, you agree to film only B11-verified scripts.
                    No hallucinations. No fake claims.
                  </p>
                </motion.div>
              )}

              {/* === Step 2: "Check your inbox" — mock confirmation === */}
              {step === 'sent' && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={springSnappy}
                  className="space-y-5 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springSnappy, delay: 0.1 }}
                    className="mx-auto h-14 w-14 rounded-full glass-lime flex items-center justify-center"
                  >
                    <Check className="h-7 w-7 text-lime" />
                  </motion.div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold mb-1">Check your inbox</h2>
                    <p className="text-sm text-muted-fg">
                      We sent a magic link to
                    </p>
                    <p className="text-sm font-mono text-fg mt-1" data-mono>{email}</p>
                  </div>
                  <p className="text-xs text-muted-fg leading-relaxed">
                    This is a demo — no actual email was sent. Click below to enter the app
                    as Amira (the demo creator).
                  </p>
                  <AnimatedCTA onClick={() => router.push('/')} className="w-full justify-center">
                    Open the demo
                    <ArrowRight className="h-4 w-4" />
                  </AnimatedCTA>
                  <button
                    onClick={() => setStep('email')}
                    className="text-xs text-muted-fg hover:text-fg transition-colors"
                  >
                    ← Use a different email
                  </button>
                </motion.div>
              )}

              {/* === Step 3: signing in (mock loading) === */}
              {step === 'signing-in' && (
                <motion.div
                  key="signing-in"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springSnappy}
                  className="space-y-5 text-center py-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mx-auto"
                  >
                    <ParrotLogo size={48} />
                  </motion.div>
                  <p className="text-sm text-muted-fg">
                    Signing in with {signingInWith === 'apple' ? 'Apple' : 'Google'}…
                  </p>
                  <p className="text-xs text-subtle">
                    (Demo mode — redirecting to the app)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer link */}
          <p className="text-xs text-muted-fg text-center mt-6">
            New to Perokio?{' '}
            <Link href="/landing" className="text-lime hover:underline">
              See how it works
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.05 12.04c-.02-2.18 1.78-3.23 1.86-3.28-1.02-1.49-2.6-1.69-3.16-1.71-1.34-.14-2.62.79-3.31.79-.69 0-1.74-.77-2.86-.75-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.23 1.18-2.43 1.2-2.49-.03-.01-2.29-.88-2.31-3.47m-2.18-6.51c.61-.74 1.02-1.76.91-2.78-.88.03-1.94.59-2.57 1.32-.57.65-1.06 1.69-.93 2.69.98.08 1.98-.5 2.59-1.23" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.85" />
      <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity="0.7" />
      <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.55" />
    </svg>
  )
}
