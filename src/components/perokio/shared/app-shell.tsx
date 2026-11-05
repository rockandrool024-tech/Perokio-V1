'use client'

import { useEffect } from 'react'
import { usePerokioStore } from '@/store/perokio'
import { PerokioWordmark, ParrotEye, ParrotEyeHandle } from './parrot-logo'
import { ViewTicker } from './view-ticker'
import { usePerokioLiveViews } from '@/lib/perokio/live'
import { useT } from '@/lib/perokio/i18n'
import { Bell, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/perokio/types'
import { useRef } from 'react'
import { motion } from 'framer-motion'

const ROLES: { id: Role; key: string; dot: string; activeRing: string }[] = [
  { id: 'brand', key: 'Brand', dot: 'bg-teal', activeRing: 'ring-teal/40' },
  { id: 'creator', key: 'Creator', dot: 'bg-orange', activeRing: 'ring-orange/40' },
  { id: 'admin', key: 'Studio', dot: 'bg-red', activeRing: 'ring-red/40' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = usePerokioStore((s) => s.role)
  const setRole = usePerokioStore((s) => s.setRole)
  const lang = usePerokioStore((s) => s.lang)
  const setLang = usePerokioStore((s) => s.setLang)
  const liveViews = usePerokioLiveViews()
  const t = useT()
  const eyeRef = useRef<ParrotEyeHandle>(null)

  // RTL / LTR direction + lang attribute follow the selected language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Nav — glassmorphism */}
      <header className="sticky top-0 z-40 w-full glass-strong">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <a href="/landing" aria-label="View landing page" className="hover:opacity-80 transition-opacity">
            <PerokioWordmark size={32} />
          </a>

          {/* Live view ticker — with parrot eye that blinks on every tick */}
          <div className="hidden md:flex items-center gap-2.5 ms-4 ps-4 border-s border-border/60">
            <ParrotEye ref={eyeRef} size={32} />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] tracking-wider uppercase text-subtle">
                {t('Live views across platform')}
              </span>
              <ViewTicker
                initialViews={liveViews}
                onTick={() => eyeRef.current?.blink()}
                className="text-lime"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Language switcher — AR / EN */}
          <div
            className="flex items-center rounded-lg glass overflow-hidden"
            role="group"
            aria-label={t('Language')}
          >
            <button
              onClick={() => setLang('en')}
              className={cn(
                'px-2.5 py-1 text-xs font-bold tracking-wide transition-colors',
                lang === 'en' ? 'bg-lime text-[#0A0F0D]' : 'text-muted-fg hover:text-fg',
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ar')}
              className={cn(
                'px-2.5 py-1 text-xs font-bold tracking-wide transition-colors',
                lang === 'ar' ? 'bg-lime text-[#0A0F0D]' : 'text-muted-fg hover:text-fg',
              )}
            >
              ع
            </button>
          </div>

          {/* Role Switcher — segmented control */}
          <div className="flex items-center gap-1 p-1 rounded-xl glass">
            {ROLES.map((r) => {
              const active = role === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                    active ? 'text-fg' : 'text-muted-fg hover:text-fg',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="role-pill"
                      className={cn(
                        'absolute inset-0 rounded-lg ring-1',
                        r.activeRing,
                      )}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', r.dot)} />
                    <span className="hidden sm:inline">{t(r.key)}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 hover:bg-white/5"
            aria-label={t('Notifications')}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 end-2 h-2 w-2 rounded-full bg-red animate-pulse-glow-red" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex gap-2 glass hover:bg-white/5"
          >
            <Wallet className="h-4 w-4 text-lime" />
            <span className="font-mono font-semibold" data-mono>$1,180</span>
            <Badge className="text-[10px] h-4 px-1 bg-lime/15 text-lime border-lime/20">Pro</Badge>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex">{children}</main>

      {/* Footer — Moat status */}
      <footer className="border-t border-border/60 bg-background/60 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-center gap-3 text-xs text-muted-fg flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse-glow" />
            {t('Perokio V1 · Tunisia Pilot')}
          </span>
          <span className="text-border">·</span>
          <span>{t('Verified Facts × Local Film')}</span>
          <span className="text-border">·</span>
          <span className="text-lime font-medium">{t('B11 Script-Locking Engine · Active')}</span>
        </div>
      </footer>
    </div>
  )
}
