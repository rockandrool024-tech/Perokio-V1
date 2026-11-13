'use client'

import { motion } from 'framer-motion'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Flame, Sparkles, Plus } from 'lucide-react'
import type { MediaEntry } from './media-calendar'

// ============================================================================
// MonthGrid — 7-column calendar grid
// ============================================================================
// - Today's cell gets a glowing lime border (animate-pulse-glow)
// - Days with scheduled posts show up to 2 tiny thumbnails
// - Fact entries = lime dots, Spark entries = orange dots
// ============================================================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCurrentMonth(): Date[] {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const dayOfWeek = firstDay.getDay()
  const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() + startOffset)

  const days: Date[] = []
  for (let i = 0; i < 42; i++) { // 6 weeks × 7 days
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    days.push(d)
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

interface MonthGridProps {
  entries: MediaEntry[]
  selectedDate: Date
  onSelectDate: (d: Date) => void
  onEntryClick?: (entry: MediaEntry) => void
  onNewEntry?: (d: Date) => void
}

export function MonthGrid({ entries, selectedDate, onSelectDate, onEntryClick, onNewEntry }: MonthGridProps) {
  const t = useT()
  const today = new Date()
  const monthDays = getCurrentMonth()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={easeEditorial}
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-[10px] text-muted-fg uppercase tracking-wider text-center font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day, idx) => {
          const isToday = isSameDay(day, today)
          const inMonth = isSameMonth(day, today)
          const dayEntries = entries.filter((e) => isSameDay(new Date(e.scheduledAt), day))

          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.005, ...springSoft }}
              onClick={() => onSelectDate(day)}
              className={cn(
                'min-h-[64px] rounded-lg border p-1.5 transition-all text-start relative',
                isToday
                  ? 'border-lime/40 bg-lime/[0.04] animate-pulse-glow'
                  : inMonth
                    ? 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.04]'
                    : 'border-transparent bg-transparent opacity-30',
              )}
            >
              {/* Day number */}
              <div className={cn(
                'text-xs font-mono font-bold mb-1',
                isToday ? 'text-lime' : inMonth ? 'text-muted-fg' : 'text-subtle',
              )} data-mono>
                {day.getDate()}
              </div>

              {/* Entry thumbnails */}
              <div className="space-y-0.5">
                {dayEntries.slice(0, 2).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={(e) => { e.stopPropagation(); onEntryClick?.(entry) }}
                    className={cn(
                      'rounded px-1 py-0.5 text-[8px] font-medium truncate cursor-pointer',
                      entry.type === 'FACT'
                        ? 'bg-lime/10 text-lime/80'
                        : 'bg-orange/10 text-orange/80',
                    )}
                  >
                    {entry.type === 'FACT' ? '🔥' : '✨'} {entry.title.substring(0, 12)}
                  </div>
                ))}
                {dayEntries.length > 2 && (
                  <div className="text-[8px] text-muted-fg px-1">
                    +{dayEntries.length - 2} more
                  </div>
                )}
              </div>

              {/* Today indicator dot */}
              {isToday && dayEntries.length === 0 && (
                <div className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
