'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/lib/perokio/i18n'
import { cn } from '@/lib/utils'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { Flame, Sparkles, Lock, ChevronRight } from 'lucide-react'

// ============================================================================
// WeekGrid — Premium "Patek Philippe" Calendar-as-Spine
// ============================================================================
// The most important component in the app. Meticulously crafted:
//   - glass-premium container with ring-1 ring-white/10 + backdrop-blur
//   - Monolithic minimal grid. Fact cells = muted lime. Spark cells = muted orange.
//   - "Monday 9am Lock" indicator with slow-breathing pulse animation
//   - Day columns raise on hover (translate-y-[-2px]) with soft drop shadow
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

// Premium QSR demo entries
const DEMO_ENTRIES: WeekEntry[] = [
  { id: 'e1', type: 'FACT', channel: 'BRAND_ACCOUNT', title: 'Spicy Chicken Burger Launch', scheduledAt: new Date(Date.now() + 86400000), status: 'locked', factId: 'f1' },
  { id: 'e2', type: 'SPARK', channel: 'CREATOR_WALL', title: 'Olive oil exports +32%', scheduledAt: new Date(Date.now() + 2 * 86400000), status: 'approved' },
  { id: 'e3', type: 'FACT', channel: 'BRAND_ACCOUNT', title: 'Cap Bon coffee origin story', scheduledAt: new Date(Date.now() + 3 * 86400000), status: 'draft' },
  { id: 'e4', type: 'SPARK', channel: 'DIRECT_INVITE', title: 'Creator collab: Amira', scheduledAt: new Date(Date.now() + 4 * 86400000), status: 'approved' },
]

export function WeekGrid({ entries, onEntryClick, onNewEntry, className }: WeekGridProps) {
  const t = useT()
  const week = getCurrentWeek()
  const today = new Date()
  const allEntries = entries && entries.length > 0 ? entries : DEMO_ENTRIES

  // Next Monday 9am
  const nextMonday = new Date(week[0])
  nextMonday.setDate(nextMonday.getDate() + 7)
  nextMonday.setHours(9, 0, 0, 0)
  const daysUntilLock = Math.max(0, Math.ceil((nextMonday.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const hoursUntilLock = Math.max(0, Math.floor((nextMonday.getTime() - Date.now()) / (1000 * 60 * 60)) % 24)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={easeEditorial}
      className={cn('glass-premium rounded-2xl p-5 lg:p-6 relative overflow-hidden', className)}
    >
      {/* Ambient gradient — subtle lime glow top-right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 600px 300px at 90% -10%, rgba(216,239,112,0.06), transparent 60%)',
        }}
      />

      {/* === Header === */}
      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg glass-lime flex items-center justify-center">
            <Flame className="h-4 w-4 text-lime" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold leading-tight">{t('This Week')}</h3>
            <p className="text-[10px] text-muted-fg font-mono" data-mono>
              {allEntries.length} {t('entries')} · {t('Mon–Sun')}
            </p>
          </div>
        </div>

        {/* === Monday 9am Lock indicator — breathing pulse === */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springSnappy, delay: 0.2 }}
          className="flex items-center gap-2.5"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-orange">
            {/* Breathing lock icon */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Lock className="h-3.5 w-3.5 text-orange" />
              </motion.div>
              <Lock className="h-3.5 w-3.5 text-orange opacity-0" />
            </div>
            <span className="text-[11px] font-medium text-orange">
              {t('Next week locks Monday 9am')}
            </span>
          </div>
          <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25 font-mono tabular" data-mono>
            {daysUntilLock}d {hoursUntilLock}h
          </Badge>
        </motion.div>
      </div>

      {/* === The 7-day grid — monolithic, minimal === */}
      <div className="relative z-10 grid grid-cols-7 gap-2">
        {week.map((day, idx) => {
          const isToday = isSameDay(day, today)
          const dayEntries = allEntries.filter((e) => isSameDay(new Date(e.scheduledAt), day))

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
              {/* Day header */}
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

              {/* Today badge */}
              {isToday && (
                <div className="text-[9px] text-lime font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-lime animate-breathe-slow" />
                  {t('Today')}
                </div>
              )}

              {/* Entries */}
              <div className="space-y-1.5">
                {dayEntries.map((entry) => (
                  <PremiumEntryCard key={entry.id} entry={entry} onClick={() => onEntryClick?.(entry)} />
                ))}

                {/* Add button */}
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

      {/* === Legend === */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-muted-fg">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-lime/60" />
          {t('Fact')} <span className="text-subtle">— brand account</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-orange/60" />
          {t('Spark')} <span className="text-subtle">— creator wall</span>
        </span>
        <span className="flex items-center gap-1.5 ms-auto">
          <Lock className="h-2.5 w-2.5 text-orange" />
          <span className="text-muted-fg">{t('Locked')} = {t('ready to publish')}</span>
        </span>
      </div>
    </motion.div>
  )
}

// ============================================================================
// PremiumEntryCard — muted lime (Fact) or muted orange (Spark)
// ============================================================================

function PremiumEntryCard({ entry, onClick }: { entry: WeekEntry; onClick?: () => void }) {
  const isFact = entry.type === 'FACT'
  const Icon = isFact ? Flame : Sparkles
  const statusColor =
    entry.status === 'published' ? 'text-lime' :
    entry.status === 'approved' ? 'text-lime/60' :
    entry.status === 'locked' ? 'text-orange' : 'text-muted-fg'

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      onClick={onClick}
      className={cn(
        'w-full text-start rounded-lg p-1.5 border transition-all relative overflow-hidden group',
        isFact
          ? 'bg-lime/[0.05] border-lime/15 hover:border-lime/30'
          : 'bg-orange/[0.05] border-orange/15 hover:border-orange/30',
      )}
    >
      {/* Shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
      </div>

      <div className="relative flex items-center gap-1 mb-0.5">
        <Icon className={cn('h-2.5 w-2.5 shrink-0', isFact ? 'text-lime/70' : 'text-orange/70')} />
        <span className={cn('text-[9px] font-medium uppercase tracking-wider', statusColor)}>
          {entry.status}
        </span>
        <span className="text-[9px] text-muted-fg ms-auto font-mono" data-mono>
          {new Date(entry.scheduledAt).getHours().toString().padStart(2, '0')}:00
        </span>
      </div>
      <p className={cn(
        'relative text-[10px] leading-tight line-clamp-2 font-medium',
        isFact ? 'text-lime/80' : 'text-orange/80',
      )}>
        {entry.title}
      </p>
      {entry.status === 'locked' && (
        <div className="relative mt-0.5 flex items-center gap-0.5">
          <Lock className="h-2 w-2 text-orange" />
          <span className="text-[8px] text-orange font-mono" data-mono>LOCKED</span>
        </div>
      )}
    </motion.button>
  )
}
