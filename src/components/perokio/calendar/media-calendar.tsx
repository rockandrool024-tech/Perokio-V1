'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Calendar, Lock } from 'lucide-react'
import { MonthGrid } from './month-grid'
import { DayTimeline } from './day-timeline'
import { WeekGridView } from './week-grid-view'

// ============================================================================
// MediaCalendar — The Visual Media Command Center
// ============================================================================

export interface MediaEntry {
  id: string
  type: 'FACT' | 'SPARK'
  channel: 'BRAND_ACCOUNT' | 'CREATOR_WALL' | 'DIRECT_INVITE'
  title: string
  scheduledAt: Date
  status: 'draft' | 'locked' | 'approved' | 'published'
  factId?: string
  creatorName?: string
  creatorAvatar?: string
  views?: number
  clicks?: number
  orders?: number
}

type ViewMode = 'month' | 'week' | 'day'

const DEMO_ENTRIES: MediaEntry[] = [
  { id: 'e1', type: 'FACT', channel: 'BRAND_ACCOUNT', title: 'Spicy Chicken Burger Launch', scheduledAt: new Date(Date.now() + 86400000), status: 'locked', factId: 'f1' },
  { id: 'e2', type: 'SPARK', channel: 'CREATOR_WALL', title: 'Olive oil exports +32%', scheduledAt: new Date(Date.now() + 2 * 86400000), status: 'approved', creatorName: 'Amira', creatorAvatar: '👩🏽‍🦱' },
  { id: 'e3', type: 'FACT', channel: 'BRAND_ACCOUNT', title: 'Cap Bon coffee origin story', scheduledAt: new Date(Date.now() + 3 * 86400000), status: 'draft' },
  { id: 'e4', type: 'SPARK', channel: 'DIRECT_INVITE', title: 'Creator collab: Yassine', scheduledAt: new Date(Date.now() + 4 * 86400000), status: 'approved', creatorName: 'Yassine', creatorAvatar: '🧔🏽' },
  { id: 'e5', type: 'SPARK', channel: 'CREATOR_WALL', title: 'Fresh Summer Deals', scheduledAt: new Date(Date.now() - 2 * 86400000), status: 'published', creatorName: 'Amira', creatorAvatar: '👩🏽‍🦱', views: 8400, clicks: 1200, orders: 45 },
  { id: 'e6', type: 'FACT', channel: 'BRAND_ACCOUNT', title: 'Weekend Bundle Special', scheduledAt: new Date(Date.now() - 86400000), status: 'published', views: 6200, clicks: 890, orders: 32 },
]

interface MediaCalendarProps {
  entries?: MediaEntry[]
  onEntryClick?: (entry: MediaEntry) => void
  onNewEntry?: (day: Date) => void
  onReschedule?: (entryId: string, newDate: Date) => void
  className?: string
}

export function MediaCalendar({
  entries, onEntryClick, onNewEntry, onReschedule, className,
}: MediaCalendarProps) {
  const t = useT()
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const allEntries = entries && entries.length > 0 ? entries : DEMO_ENTRIES

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={easeEditorial}
      className={cn('glass-premium rounded-2xl p-5 lg:p-6 relative overflow-hidden', className)}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 600px 300px at 90% -10%, rgba(216,239,112,0.06), transparent 60%)' }} />

      {/* Header with segmented control */}
      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg glass-lime flex items-center justify-center">
            <Calendar className="h-4 w-4 text-lime" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold leading-tight">{t('Media Calendar')}</h3>
            <p className="text-[10px] text-muted-fg font-mono" data-mono>
              {allEntries.length} {t('entries')} · {viewMode === 'month' ? 'Month view' : viewMode === 'week' ? 'Mon–Sun' : 'Day timeline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl glass">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === mode
                  ? 'bg-lime/15 text-lime'
                  : 'text-muted-fg hover:text-fg hover:bg-white/[0.04]',
              )}
            >
              {mode === 'month' ? t('Month') : mode === 'week' ? t('Week') : t('Day')}
            </button>
          ))}
        </div>
      </div>

      {/* Monday Lock indicator */}
      <div className="relative z-10 mb-4 flex items-center gap-2.5">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-orange"
        >
          <Lock className="h-3.5 w-3.5 text-orange" />
          <span className="text-[11px] font-medium text-orange">{t('Next week locks Monday 9am')}</span>
        </motion.div>
      </div>

      {/* View content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {viewMode === 'month' && (
            <MonthGrid key="month" entries={allEntries} selectedDate={selectedDate} onSelectDate={(d) => { setSelectedDate(d); setViewMode('day') }} onEntryClick={onEntryClick} onNewEntry={onNewEntry} />
          )}
          {viewMode === 'week' && (
            <WeekGridView key="week" entries={allEntries} onEntryClick={onEntryClick} onNewEntry={onNewEntry} />
          )}
          {viewMode === 'day' && (
            <DayTimeline key="day" entries={allEntries} selectedDate={selectedDate} onEntryClick={onEntryClick} onReschedule={onReschedule} />
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-muted-fg">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-lime/60" />{t('Fact')} <span className="text-subtle">— brand account</span></span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-orange/60" />{t('Spark')} <span className="text-subtle">— creator wall</span></span>
        {viewMode === 'day' && (
          <span className="flex items-center gap-1.5 ms-auto">
            <span className="h-0.5 w-3 bg-lime rounded-full" />{t('Now line')}
          </span>
        )}
      </div>
    </motion.div>
  )
}
