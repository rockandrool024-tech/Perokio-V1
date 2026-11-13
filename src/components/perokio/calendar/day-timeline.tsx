'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '@/lib/perokio/i18n'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Flame, Sparkles, Lock, Eye, MousePointerClick, ShoppingBag, Clock } from 'lucide-react'
import type { MediaEntry } from './media-calendar'

// ============================================================================
// DayTimeline — Vertical timeline with lime "Now" line
// ============================================================================
// Premium vertical timeline inspired by high-end media management tools:
//   - Facts render as Lime-tinted glass cards
//   - Sparks render as Orange-tinted glass cards (with Creator avatar)
//   - A glowing lime "Now" line crosses the timeline
//   - Drag-and-drop to reschedule entries
//   - Hovering over a published Spark shows inline metrics:
//     Views: 8.4k · Clicks: 1.2k · Orders: 45
// ============================================================================

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9) // 9am - 8pm

interface DayTimelineProps {
  entries: MediaEntry[]
  selectedDate: Date
  onEntryClick?: (entry: MediaEntry) => void
  onReschedule?: (entryId: string, newDate: Date) => void
}

export function DayTimeline({ entries, selectedDate, onEntryClick, onReschedule }: DayTimelineProps) {
  const t = useT()
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null)
  const [draggedEntry, setDraggedEntry] = useState<MediaEntry | null>(null)
  const [dragOverHour, setDragOverHour] = useState<number | null>(null)

  const dayEntries = entries.filter((e) => {
    const eDate = new Date(e.scheduledAt)
    return eDate.getFullYear() === selectedDate.getFullYear() &&
      eDate.getMonth() === selectedDate.getMonth() &&
      eDate.getDate() === selectedDate.getDate()
  })

  const now = new Date()
  const isToday = now.getFullYear() === selectedDate.getFullYear() &&
    now.getMonth() === selectedDate.getMonth() &&
    now.getDate() === selectedDate.getDate()
  const currentHour = now.getHours()
  // Position of the "Now" line (as percentage of the 9am-8pm range)
  const nowLinePct = isToday
    ? Math.max(0, Math.min(100, ((currentHour - 9) / 11) * 100))
    : null

  const handleDragStart = (entry: MediaEntry) => setDraggedEntry(entry)
  const handleDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault()
    setDragOverHour(hour)
  }
  const handleDrop = (hour: number) => {
    if (!draggedEntry) return
    const newDate = new Date(selectedDate)
    newDate.setHours(hour, 0, 0, 0)
    onReschedule?.(draggedEntry.id, newDate)
    setDraggedEntry(null)
    setDragOverHour(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={easeEditorial}
      className="relative"
    >
      {/* Date header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-mono font-bold text-lime" data-mono>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
        {isToday && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/25 font-medium">
            TODAY
          </span>
        )}
        <span className="text-xs text-muted-fg ms-auto">
          {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* === Timeline === */}
      <div className="relative max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
        <div className="relative">
          {/* === The glowing lime "Now" line === */}
          {nowLinePct !== null && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${nowLinePct}%` }}
            >
              <div className="flex items-center">
                <span className="px-1.5 py-0.5 rounded-md bg-lime text-[#0A0F0D] text-[9px] font-mono font-bold whitespace-nowrap shadow-lg" data-mono>
                  NOW · {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
                </span>
                <div className="flex-1 h-0.5 bg-lime" style={{ boxShadow: '0 0 8px rgba(216,239,112,0.8), 0 0 16px rgba(216,239,112,0.4)' }} />
                <span className="h-2 w-2 rounded-full bg-lime" style={{ boxShadow: '0 0 6px rgba(216,239,112,1)' }} />
              </div>
            </div>
          )}

          {/* === Hour rows === */}
          <div className="space-y-1">
            {HOURS.map((hour, idx) => {
              const hourEntries = dayEntries.filter(
                (e) => new Date(e.scheduledAt).getHours() === hour,
              )
              const isPast = isToday && hour < currentHour
              const isDragOver = dragOverHour === hour

              return (
                <div
                  key={hour}
                  onDragOver={(e) => handleDragOver(e, hour)}
                  onDrop={() => handleDrop(hour)}
                  className={cn(
                    'grid grid-cols-[50px_1fr] gap-3 items-start min-h-[44px] rounded-lg transition-colors',
                    isDragOver && 'bg-lime/[0.06] ring-1 ring-lime/20',
                  )}
                >
                  {/* Hour label */}
                  <div className={cn(
                    'text-[10px] font-mono pt-2 text-end',
                    isPast ? 'text-subtle' : 'text-muted-fg',
                  )} data-mono>
                    {hour.toString().padStart(2, '0')}:00
                  </div>

                  {/* Entry area */}
                  <div className="space-y-1.5 pt-1 pb-1">
                    {hourEntries.map((entry) => (
                      <TimelineEntryCard
                        key={entry.id}
                        entry={entry}
                        isHovered={hoveredEntry === entry.id}
                        onHover={() => setHoveredEntry(entry.id)}
                        onLeave={() => setHoveredEntry(null)}
                        onClick={() => onEntryClick?.(entry)}
                        onDragStart={() => handleDragStart(entry)}
                        isDragging={draggedEntry?.id === entry.id}
                      />
                    ))}

                    {/* Empty slot — dropzone */}
                    {hourEntries.length === 0 && (
                      <div
                        className={cn(
                          'h-8 rounded-lg border border-dashed transition-colors',
                          isDragOver
                            ? 'border-lime/40 bg-lime/[0.04]'
                            : 'border-white/[0.04] hover:border-white/[0.08]',
                        )}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// TimelineEntryCard — a single Fact or Spark in the timeline
// ============================================================================

function TimelineEntryCard({
  entry, isHovered, onHover, onLeave, onClick, onDragStart, isDragging,
}: {
  entry: MediaEntry
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  onClick: () => void
  onDragStart: () => void
  isDragging: boolean
}) {
  const isFact = entry.type === 'FACT'
  const Icon = isFact ? Flame : Sparkles
  const isPublished = entry.status === 'published'
  const hasMetrics = entry.views !== undefined && entry.clicks !== undefined && entry.orders !== undefined

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={springSnappy}
      draggable
      onDragStart={onDragStart}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'relative rounded-xl p-3 border cursor-pointer transition-all',
        isFact
          ? 'glass-lime border-lime/20 hover:border-lime/40'
          : 'glass-orange border-orange/20 hover:border-orange/40',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <div className={cn(
          'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
          isFact ? 'bg-lime/15' : 'bg-orange/15',
        )}>
          <Icon className={cn('h-3.5 w-3.5', isFact ? 'text-lime' : 'text-orange')} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + time */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono text-muted-fg" data-mono>
              {new Date(entry.scheduledAt).getHours().toString().padStart(2, '0')}:{new Date(entry.scheduledAt).getMinutes().toString().padStart(2, '0')}
            </span>
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-wider',
              entry.status === 'published' ? 'text-lime' :
              entry.status === 'approved' ? 'text-lime/60' :
              entry.status === 'locked' ? 'text-orange' : 'text-muted-fg',
            )}>
              {entry.status}
            </span>
            {entry.status === 'locked' && <Lock className="h-2.5 w-2.5 text-orange" />}
          </div>

          {/* Title */}
          <p className={cn(
            'text-xs font-medium leading-tight truncate',
            isFact ? 'text-lime/90' : 'text-orange/90',
          )}>
            {entry.title}
          </p>

          {/* Creator avatar (Sparks only) */}
          {!isFact && entry.creatorAvatar && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm">{entry.creatorAvatar}</span>
              <span className="text-[10px] text-muted-fg">{entry.creatorName}</span>
            </div>
          )}
        </div>

        {/* Drag handle */}
        <div className="shrink-0 text-muted-fg/30 cursor-grab active:cursor-grabbing">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2" r="1" /><circle cx="8" cy="2" r="1" />
            <circle cx="2" cy="7" r="1" /><circle cx="8" cy="7" r="1" />
            <circle cx="2" cy="12" r="1" /><circle cx="8" cy="12" r="1" />
          </svg>
        </div>
      </div>

      {/* === Inline metrics (shown on hover for published entries) === */}
      <AnimatePresence>
        {isHovered && isPublished && hasMetrics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springSoft}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-lime">
                <Eye className="h-2.5 w-2.5" />
                <span className="font-mono font-bold" data-mono>{formatK(entry.views!)}</span>
                views
              </span>
              <span className="flex items-center gap-1 text-orange">
                <MousePointerClick className="h-2.5 w-2.5" />
                <span className="font-mono font-bold" data-mono>{formatK(entry.clicks!)}</span>
                clicks
              </span>
              <span className="flex items-center gap-1 text-[#B6A6FF]">
                <ShoppingBag className="h-2.5 w-2.5" />
                <span className="font-mono font-bold" data-mono>{entry.orders}</span>
                orders
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function formatK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}
