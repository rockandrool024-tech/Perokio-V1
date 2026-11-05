'use client'

import { usePerokioStore } from '@/store/perokio'
import { useT } from '@/lib/perokio/i18n'
import {
  LayoutDashboard,
  Film,
  ShieldCheck,
  FileText,
  Eye,
  Receipt,
  Wallet,
  User,
  Building2,
  Users,
  TrendingUp,
  Activity,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type NavItem = { id: string; label: string; icon: LucideIcon }

const NAVS: Record<'brand' | 'creator' | 'admin', NavItem[]> = {
  brand: [
    { id: 'command', label: 'Command', icon: LayoutDashboard },
    { id: 'machine', label: 'Machine', icon: Film },
    { id: 'script', label: 'Script', icon: ShieldCheck },
    { id: 'library', label: 'Facts', icon: FileText },
    { id: 'review', label: 'Review', icon: Eye },
    { id: 'billing', label: 'Billing', icon: Receipt },
  ],
  creator: [
    { id: 'wall', label: 'Wall', icon: Sparkles },
    { id: 'claim', label: 'Edit', icon: Film },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ],
  admin: [
    { id: 'pipeline', label: 'Pipe', icon: Building2 },
    { id: 'vetting', label: 'Vet', icon: Users },
    { id: 'qa', label: 'QA', icon: ShieldCheck },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'monitor', label: 'Monitor', icon: Activity },
    { id: 'authoring', label: 'Create', icon: Sparkles },
  ],
}

/**
 * MobileNav — bottom-floating navigation pill.
 * Renders as a glassmorphism pill that floats above content with safe-area inset.
 * Hidden on md+ screens (desktop uses the sidebar).
 */
export function MobileNav() {
  const role = usePerokioStore((s) => s.role)
  const setBrandView = usePerokioStore((s) => s.setBrandView)
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const setAdminView = usePerokioStore((s) => s.setAdminView)
  const brandView = usePerokioStore((s) => s.brandView)
  const creatorView = usePerokioStore((s) => s.creatorView)
  const adminView = usePerokioStore((s) => s.adminView)
  const t = useT()

  const items = NAVS[role]
  const currentView = role === 'brand' ? brandView : role === 'creator' ? creatorView : adminView
  const setter = role === 'brand' ? setBrandView : role === 'creator' ? setCreatorView : setAdminView

  return (
    <nav
      className="md:hidden fixed bottom-3 inset-x-3 z-40"
      aria-label="Mobile navigation"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.15 }}
        className="glass-strong rounded-2xl px-1.5 py-1.5 flex items-center justify-between shadow-2xl"
        style={{
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {items.map((item) => {
          const Icon = item.icon
          const active = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setter(item.id as never)}
              className={cn(
                'relative flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[10px] font-medium transition-colors min-h-[48px] justify-center',
                active ? 'text-lime' : 'text-muted-fg active:text-fg',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId={`nav-pill-${role}`}
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'rgba(216,239,112,0.10)',
                    border: '1px solid rgba(216,239,112,0.25)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <Icon className={cn('relative z-10 h-4 w-4', active && 'drop-shadow-[0_0_8px_rgba(216,239,112,0.5)]')} />
              <span className="relative z-10 truncate">{t(item.label)}</span>
            </button>
          )
        })}
      </motion.div>
    </nav>
  )
}
