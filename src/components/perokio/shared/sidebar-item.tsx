'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  code?: string // screen code, e.g. "B08"
  active?: boolean
  badge?: string | number
  onClick?: () => void
}

/**
 * SidebarItem — glassmorphism nav row with screen-code chip.
 * Active state shows a lime accent bar + glow.
 */
export function SidebarItem({ icon: Icon, label, code, active, badge, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
        active
          ? 'text-fg bg-white/[0.06] border border-white/10'
          : 'text-muted-fg hover:text-fg hover:bg-white/[0.03] border border-transparent',
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute start-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-e-full bg-lime"
          style={{ boxShadow: '0 0 12px rgba(216,239,112,0.6)' }}
        />
      )}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          active ? 'text-lime' : 'text-muted-fg group-hover:text-fg',
        )}
      />
      <span className="flex-1 text-start">{label}</span>
      {code && (
        <span
          className={cn(
            'text-[10px] font-mono px-1.5 py-0.5 rounded',
            active ? 'bg-lime/15 text-lime' : 'bg-white/[0.04] text-subtle',
          )}
          data-mono
        >
          {code}
        </span>
      )}
      {badge !== undefined && badge !== '' && (
        <span
          className={cn(
            'min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold font-mono',
            active ? 'bg-lime text-[#0A0F0D]' : 'bg-orange/15 text-orange border border-orange/25',
          )}
          data-mono
        >
          {badge}
        </span>
      )}
    </button>
  )
}
