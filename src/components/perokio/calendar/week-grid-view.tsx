'use client'

import { motion } from 'framer-motion'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Flame, Sparkles, Lock, Plus } from 'lucide-react'
import type { MediaEntry } from './media-calendar'

// ============================================================================
// WeekGridView — 7-day horizontal grid (the existing WeekGrid pattern, upgraded)
// ============================================================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCurrentWeek(): Date[] {
  const today = new Date()
  const day = today.getDay()
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

interface WeekGridViewProps {
  entries: MediaEntry[]
  onEntryClick?: (entry: MediaEntry) => void
  onNewEntry?: (day: Date) => void
}

export function WeekGridView({ entries, onEntryClick, onNewEntry }: WeekGridViewProps) {
  const t = useT()
  const week = getCurrentWeek()
  const today = new Date()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={easeEditorial}
    >
      <div className="grid grid-cols-7 gap-2">
        {week.map((day, idx) => {
          const isToday = isSameDay(day, today)
          const dayEntries = entries.filter((e) => isSameDay(new Date(e.scheduledAt), day))

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, ...springSoft }}
              className={cn(
                'day-column min-h-[130px] rounded-xl border p-2 relative',
                isToday
                  ? 'border-lime/30 bg-lime/[0.03]'
                  : 'border-white/[0.06] bg-white/[0.015]',
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-fg uppercase tracking-wider font-medium">
                  {DAYS[idx]}
                </span>
                <span className={cn(
                  'text-xs font-mono font-bold tabular',
                  isToday ? 'text-lime' : 'text-muted-fg',
                )} data-mono>
                  {formatDayNum(day)}
                </span>
              </div>

              {isToday && (
                <div className="text-[9px] text-lime font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-lime animate-breathe-slow" />
                  {t('Today')}
                </div>
              )}

              <div className="space-y-1.5">
                {dayEntries.map((entry) => {
                  const isFact = entry.type === 'FACT'
                  const Icon = isFact ? Flame : Sparkles
                  return (
                    <motion.button
                      key={entry.id}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onEntryClick?.(entry)}
                      className={cn(
                        'w-full text-start rounded-lg p-1.5 border transition-all',
                        isFact
                          ? 'bg-lime/[0.05] border-lime/15 hover:border-lime/30'
                          : 'bg-orange/[0.05] border-orange/15 hover:border-orange/30',
                      )}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Icon className={cn('h-2.5 w-2.5', isFact ? 'text-lime/70' : 'text-orange/70')} />
                        <span className={cn(
                          'text-[9px] font-medium uppercase tracking-wider',
                          entry.status === 'published' ? 'text-lime' :
                          entry.status === 'approved' ? 'text-lime/60' :
                          entry.status === 'locked' ? 'text-orange' : 'text-muted-fg',
                        )}>
                          {entry.status}
                        </span>
                        <span className="text-[9px] text-muted-fg ms-auto font-mono" data-mono>
                          {new Date(entry.scheduledAt).getHours().toString().padStart(2, '0')}:00
                        </span>
                      </div>
                      <p className={cn(
                        'text-[10px] leading-tight line-clamp-2 font-medium',
                        isFact ? 'text-lime/80' : 'text-orange/80',
                      )}>
                        {entry.title}
                      </p>
                      {!isFact && entry.creatorAvatar && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <span className="text-[10px]">{entry.creatorAvatar}</span>
                          <span className="text-[8px] text-muted-fg">{entry.creatorName}</span>
                        </div>
                      )}
                      {entry.status === 'locked' && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Lock className="h-2 w-2 text-orange" />
                          <span className="text-[8px] text-orange font-mono" data-mono>LOCKED</span>
                        </div>
                      )}
                    </motion.button>
                  )
                })}

                {dayEntries.length === 0 && (
                  <button
                    onClick={() => onNewEntry?.(day)}
                    className="w-full text-[10px] text-subtle hover:text-muted-fg transition-colors py-2 rounded-lg border border-dashed border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]"
                  >
                    + {t('add')}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
