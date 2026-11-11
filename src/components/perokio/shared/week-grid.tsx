'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/perokio/i18n'
import { cn } from '@/lib/utils'
import { Flame, Sparkles, Lock, ChevronRight, Calendar } from 'lucide-react'
import { useState } from 'react'

// ============================================================================
// WeekGrid — the "Calendar-as-Spine" component (the $499 product)
// ============================================================================
// A 7-day horizontal grid showing Facts (scheduled posts) and Sparks
// (creator wall drops). Each day is a column. The grid drives the brand's
// weekly rhythm:
//   - Monday 9am: next week's locks close
//   - Facts appear as lime cards
//   - Sparks appear as orange cards
//   - "Today" is highlighted with a lime border
// ============================================================================

export interface WeekEntry {
  id: string
  type: 'FACT' | 'SPARK'
  channel: 'BRAND_ACCOUNT' | 'CREATOR_WALL' | 'DIRECT_INVITE'
  title: string
  scheduledAt: Date
  status: 'draft' | 'locked' | 'approved' | 'published'
  factId?: string
}

interface WeekGridProps {
  entries?: WeekEntry[]
  onEntryClick?: (entry: WeekEntry) => void
  onNewEntry?: (day: Date) => void
  className?: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Generate the current week (Mon-Sun) based on today */
function getCurrentWeek(): Date[] {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 1=Mon, ...
  const monday = new Date(today)
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const week: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    week.push(d)
  }
  return week
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatDayNum(d: Date): string {
  return String(d.getDate()).padStart(2, '0')
}

// Mock entries for demo (when no entries are passed)
const MOCK_ENTRIES: WeekEntry[] = [
  { id: 'e1', type: 'FACT', channel: 'BRAND_ACCOUNT', title: 'Cap Bon coffee origin', scheduledAt: new Date(Date.now() + 86400000), status: 'locked', factId: 'f1' },
  { id: 'e2', type: 'SPARK', channel: 'CREATOR_WALL', title: 'Olive oil exports +32%', scheduledAt: new Date(Date.now() + 2 * 86400000), status: 'approved' },
  { id: 'e3', type: 'FACT', channel: 'BRAND_ACCOUNT', title: 'Roasting since 1987', scheduledAt: new Date(Date.now() + 3 * 86400000), status: 'draft' },
  { id: 'e4', type: 'SPARK', channel: 'DIRECT_INVITE', title: 'Creator collab: Amira', scheduledAt: new Date(Date.now() + 4 * 86400000), status: 'approved' },
]

export function WeekGrid({ entries, onEntryClick, onNewEntry, className }: WeekGridProps) {
  const t = useT()
  const week = getCurrentWeek()
  const today = new Date()
  const allEntries = entries && entries.length > 0 ? entries : MOCK_ENTRIES

  // Next Monday 9am
  const nextMonday = new Date(week[0])
  nextMonday.setDate(nextMonday.getDate() + 7)
  nextMonday.setHours(9, 0, 0, 0)
  const daysUntilLock = Math.ceil((nextMonday.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className={cn('glass rounded-2xl p-5 relative overflow-hidden', className)}>
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 600px 300px at 90% -10%, rgba(216,239,112,0.08), transparent 60%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-lime" />
          <h3 className="font-serif text-lg font-semibold">{t('This Week')}</h3>
          <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
            {allEntries.length} {t('entries')}
          </Badge>
        </div>

        {/* Monday lock urgency */}
        <div className="flex items-center gap-2 text-xs">
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-1.5 text-orange"
          >
            <Lock className="h-3.5 w-3.5" />
            <span className="font-medium">
              {t('Next week locks Monday 9am')}
            </span>
          </motion.div>
          <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25 font-mono" data-mono>
            {daysUntilLock}d {t('left')}
          </Badge>
        </div>
      </div>

      {/* === The 7-day grid === */}
      <div className="relative z-10 grid grid-cols-7 gap-2">
        {week.map((day, idx) => {
          const isToday = isSameDay(day, today)
          const dayEntries = allEntries.filter((e) => {
            const eDate = new Date(e.scheduledAt)
            return isSameDay(eDate, day)
          })

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={cn(
                'min-h-[120px] rounded-xl border p-2 transition-colors',
                isToday
                  ? 'border-lime/40 bg-lime/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
              )}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-fg uppercase tracking-wider">
                  {DAYS[idx]}
                </span>
                <span className={cn(
                  'text-xs font-mono font-bold',
                  isToday ? 'text-lime' : 'text-muted-fg',
                )} data-mono>
                  {formatDayNum(day)}
                </span>
              </div>

              {/* Today badge */}
              {isToday && (
                <div className="text-[9px] text-lime font-bold uppercase tracking-wider mb-1">
                  {t('Today')}
                </div>
              )}

              {/* Entries */}
              <div className="space-y-1.5">
                {dayEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick?.(entry)} />
                ))}

                {/* Add button */}
                {dayEntries.length === 0 && (
                  <button
                    onClick={() => onNewEntry?.(day)}
                    className="w-full text-[10px] text-subtle hover:text-muted-fg transition-colors py-1.5 rounded-lg border border-dashed border-white/[0.06] hover:border-white/10"
                  >
                    +
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* === Legend === */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-muted-fg">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-lime" />
          {t('Fact')} <span className="text-subtle">(brand account)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-orange" />
          {t('Spark')} <span className="text-subtle">(creator wall)</span>
        </span>
        <span className="flex items-center gap-1 ms-auto font-mono" data-mono>
          <Lock className="h-2.5 w-2.5" />
          {t('Locked')} = {t('ready to publish')}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// EntryCard — a single Fact or Spark in the grid
// ============================================================================

function EntryCard({ entry, onClick }: { entry: WeekEntry; onClick?: () => void }) {
  const isFact = entry.type === 'FACT'
  const Icon = isFact ? Flame : Sparkles
  const statusColor =
    entry.status === 'published' ? 'text-lime' :
    entry.status === 'approved' ? 'text-lime/70' :
    entry.status === 'locked' ? 'text-orange' : 'text-muted-fg'

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        'w-full text-start rounded-lg p-1.5 border transition-all',
        isFact
          ? 'bg-lime/[0.06] border-lime/20 hover:border-lime/40'
          : 'bg-orange/[0.06] border-orange/20 hover:border-orange/40',
      )}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={cn('h-2.5 w-2.5', isFact ? 'text-lime' : 'text-orange')} />
        <span className={cn('text-[9px] font-medium', statusColor)}>
          {entry.status}
        </span>
        <span className="text-[9px] text-muted-fg ms-auto font-mono" data-mono>
          {new Date(entry.scheduledAt).getHours().toString().padStart(2, '0')}:00
        </span>
      </div>
      <p className={cn(
        'text-[10px] leading-tight line-clamp-2',
        isFact ? 'text-lime/90' : 'text-orange/90',
      )}>
        {entry.title}
      </p>
    </motion.button>
  )
}
