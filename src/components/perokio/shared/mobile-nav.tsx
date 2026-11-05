'use client'

import { useState } from 'react'
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
  BarChart3,
  Calendar,
  MoreHorizontal,
  Settings as SettingsIcon,
  X,
  Grid3x3,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type NavItem = { id: string; label: string; icon: LucideIcon }

// ============================================================================
// Per spec Issue 2: Mobile nav max 5 items.
// Brand: Command, Content, Facts, Feed, More (sheet with Script/Review/Detail/Billing)
// Creator: 4 items (under limit)
// Admin: 5 items (Pipe, Vet, QA, Trends, More sheet with Monitor/Create)
// ============================================================================
const PRIMARY_NAVS: Record<'brand' | 'creator' | 'admin', NavItem[]> = {
  brand: [
    { id: 'command', label: 'Command', icon: LayoutDashboard },
    { id: 'machine', label: 'Content', icon: Film },
    { id: 'library', label: 'Facts', icon: FileText },
    { id: 'feed', label: 'Feed', icon: Activity },
  ],
  creator: [
    { id: 'wall', label: 'Wall', icon: Sparkles },
    { id: 'prints', label: 'Prints', icon: Grid3x3 },
    { id: 'claim', label: 'Edit', icon: Film },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ],
  admin: [
    { id: 'pipeline', label: 'Pipe', icon: Building2 },
    { id: 'vetting', label: 'Vet', icon: Users },
    { id: 'qa', label: 'QA', icon: ShieldCheck },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ],
}

// Items relegated to the "More" sheet
const MORE_NAVS: Record<'brand' | 'creator' | 'admin', NavItem[]> = {
  brand: [
    { id: 'script', label: 'Script Review', icon: ShieldCheck },
    { id: 'review', label: 'Video Review', icon: Eye },
    { id: 'detail', label: 'Video Detail', icon: BarChart3 },
    { id: 'queue', label: 'Posting Queue', icon: Calendar },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'next', label: 'Next Cycle', icon: Sparkles },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    // Note: B16 Assisted Post is a MODAL, not a screen — never in nav
  ],
  creator: [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'profile-edit', label: 'Edit Profile', icon: SettingsIcon },
  ],
  admin: [
    { id: 'monitor', label: 'Wall Monitor', icon: Activity },
    { id: 'quality', label: 'Quality Dashboard', icon: ShieldCheck },
    { id: 'authoring', label: 'Fact Authoring', icon: Sparkles },
  ],
}

export function MobileNav() {
  const role = usePerokioStore((s) => s.role)
  const setBrandView = usePerokioStore((s) => s.setBrandView)
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const setAdminView = usePerokioStore((s) => s.setAdminView)
  const brandView = usePerokioStore((s) => s.brandView)
  const creatorView = usePerokioStore((s) => s.creatorView)
  const adminView = usePerokioStore((s) => s.adminView)
  const t = useT()
  const [moreOpen, setMoreOpen] = useState(false)

  const primaryItems = PRIMARY_NAVS[role]
  const moreItems = MORE_NAVS[role]
  const hasMore = moreItems.length > 0
  const currentView = role === 'brand' ? brandView : role === 'creator' ? creatorView : adminView
  const setter = role === 'brand' ? setBrandView : role === 'creator' ? setCreatorView : setAdminView

  // Check if current view is in the "More" sheet — highlight More button if so
  const isMoreActive = hasMore && moreItems.some((i) => i.id === currentView)

  const handleNavigate = (id: string) => {
    setter(id as never)
    setMoreOpen(false)
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-3 inset-x-3 z-40"
        aria-label="Mobile navigation"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
          {primaryItems.map((item) => {
            const Icon = item.icon
            const active = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
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

          {/* "More" button — 5th slot, opens a sheet with secondary nav items */}
          {hasMore && (
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                'relative flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[10px] font-medium transition-colors min-h-[48px] justify-center',
                isMoreActive ? 'text-lime' : 'text-muted-fg active:text-fg',
              )}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
            >
              {isMoreActive && (
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
              <MoreHorizontal className="relative z-10 h-4 w-4" />
              <span className="relative z-10 truncate">{t('More')}</span>
            </button>
          )}
        </motion.div>
      </nav>

      {/* === More sheet — slides up from bottom with secondary nav items === */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-3"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="glass-strong rounded-2xl w-full max-w-md p-4 pb-8"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold">More</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="text-muted-fg hover:text-fg transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {moreItems.map((item) => {
                  const Icon = item.icon
                  const active = currentView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl text-start transition-colors border',
                        active
                          ? 'glass-lime border-lime/40 text-lime'
                          : 'glass border-white/10 text-fg hover:bg-white/[0.05]',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium">{t(item.label)}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
