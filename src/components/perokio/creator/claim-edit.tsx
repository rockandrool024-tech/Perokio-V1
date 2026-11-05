'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TimerBar } from '@/components/perokio/shared/timer-bar'
import { usePerokioStore, useActiveFact } from '@/store/perokio'
import { MAX_CPM_PAYOUT } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatDuration } from '@/lib/perokio/live'
import {
  Lock, Play, Music, ImageIcon, Video, Sparkles, ChevronRight,
  Clock, ShieldCheck, Wand2, Film,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ClaimEdit() {
  const fact = useActiveFact()
  const setView = usePerokioStore((s) => s.setCreatorView)
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const lockVideo = usePerokioStore((s) => s.lockVideo)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  if (!fact) {
    return (
      <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center">
        <Sparkles className="h-8 w-8 text-muted-fg mx-auto mb-2" />
        <p className="text-sm text-muted-fg">{t('No fact claimed yet — pick one from the Wall!')}</p>
        <Button className="mt-4 bg-lime text-[#0A0F0D] hover:bg-lime/90" onClick={() => setView('wall')}>
          {t('Browse Facts Wall')}
        </Button>
      </div>
    )
  }

  const totalDuration = fact.scriptLines.reduce((s, l) => s + l.durationSec, 0)
  const maxEarning = fact.baseFee + MAX_CPM_PAYOUT
  const wasLocked = ['locked', 'approved', 'printed', 'paid'].includes(fact.status) || isLocked

  const handleLock = () => {
    setIsLocked(true)
    // E2E: use the store action so the brand sees this in B09 → B12
    lockVideo(fact.id, 'cr_amira')
    // Route to C05 Lock Confirmation (calm, not celebration)
    setTimeout(() => {
      setView('lockconfirm')
    }, 300)
  }

  return (
    <div className="space-y-6">
      {/* === Header with giant orange timer === */}
      <div className="relative overflow-hidden rounded-2xl glass p-5 lg:p-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 600px 300px at 90% -10%, rgba(237,122,66,0.18), transparent 60%)',
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-fg" data-mono>{fact.code}</span>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">{t(fact.tier)}</Badge>
              <Badge className="text-[10px] gap-1 bg-lime/15 text-lime border border-lime/25">
                <ShieldCheck className="h-3 w-3" /> {t('B11-verified script')}
              </Badge>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">{fact.lang.toUpperCase()}</Badge>
            </div>
            <h2 className="text-xl font-serif font-semibold leading-tight">{pick(fact.claim, fact.claimAr)}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-fg">
              <span>{fact.brandName}</span>
              <span>·</span>
              <span>{fact.trendTag}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 max-w-md">
              <div>
                <div className="text-[10px] text-muted-fg uppercase tracking-wider">{t('Base Fee')}</div>
                <div className="font-mono font-bold text-lime text-lg" data-mono>${fact.baseFee}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-fg uppercase tracking-wider">{t('CPM Rate')}</div>
                <div className="font-mono font-bold text-orange text-lg" data-mono>${fact.cpmRate}/1k</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-fg uppercase tracking-wider">{t('Max earn')}</div>
                <div className="font-mono font-bold text-red text-lg" data-mono>${maxEarning}</div>
              </div>
            </div>
          </div>

          {/* === 24h TimerBar pinned to top (§1: replaced Countdown with TimerBar) === */}
          <div className="flex flex-col gap-2 p-5 rounded-2xl glass-orange">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange" />
              <span className="text-xs text-muted-fg">{t('24h lock countdown')}</span>
            </div>
            <TimerBar
              hours={24}
              layout="bar"
              size="lg"
              label={t('Review window')}
              className="w-full"
            />
            <span className="text-[10px] text-muted-fg text-center max-w-[180px] leading-snug">
              {t('The fact auto-returns to the Wall if you miss it')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === Hyperframe Editor (center) === */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 font-serif text-base font-semibold">
              <Video className="h-4 w-4 text-lime" /> {t('Hyperframe Editor')}
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">C04</Badge>
            </span>
            <Badge className="text-[10px] gap-1 bg-orange/15 text-orange border border-orange/25">
              <Wand2 className="h-3 w-3" /> {t('In-browser editing')}
            </Badge>
          </div>

          {/* === 9:16 vertical video preview frame === */}
          <div className="flex justify-center mb-4">
            <div
              className="relative rounded-2xl overflow-hidden border-2 border-white/10"
              style={{
                aspectRatio: '9/16',
                width: 'min(280px, 70vw)',
                background:
                  'linear-gradient(135deg, rgba(216,239,112,0.12), rgba(237,122,66,0.08), rgba(111,211,199,0.10))',
              }}
            >
              {/* Top overlay badges */}
              <div className="absolute top-2 start-2 end-2 flex items-center justify-between z-10">
                <Badge className="bg-black/40 text-white backdrop-blur text-[10px] border border-white/10" data-mono>
                  9:16 · {totalDuration}s
                </Badge>
                <Badge className="bg-black/40 text-white backdrop-blur text-[10px] border border-white/10">
                  TikTok
                </Badge>
              </div>

              {/* Floating preview asset */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="text-7xl drop-shadow-[0_4px_12px_rgba(216,239,112,0.4)]"
                >
                  {fact.assets[0]?.thumb || '🎬'}
                </motion.div>
                <div className="text-center max-w-[200px]">
                  <div className="text-xs font-medium text-fg/90">{fact.scriptLines[0]?.text}</div>
                  <div className="text-[10px] text-muted-fg mt-1 font-mono" data-mono>
                    L1 · {t('Hook')} · {fact.scriptLines[0]?.durationSec}s
                  </div>
                </div>
              </div>

              {/* === Timeline strip of B-Roll clips === */}
              <div className="absolute bottom-0 inset-x-0 h-10 bg-black/50 backdrop-blur-md flex items-center px-2 gap-1 border-t border-white/10">
                {fact.assets.filter((a) => a.type === 'broll' || a.type === 'image').map((a, i) => {
                  const Icon = a.type === 'broll' ? Video : ImageIcon
                  return (
                    <motion.button
                      key={a.id}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedAsset(a.id)}
                      className={cn(
                        'h-7 flex-1 rounded flex items-center justify-center gap-1 text-[10px] font-medium transition-all',
                        selectedAsset === a.id ? 'bg-lime text-[#0A0F0D]' : 'bg-white/10 text-white/80 hover:bg-white/20',
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {a.thumb}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Audio timeline */}
          <div className="rounded-lg glass p-2 mb-4">
            <div className="flex items-center gap-2 text-xs">
              <Music className="h-3.5 w-3.5 text-teal" />
              <span className="text-muted-fg">Track</span>
              <span className="font-medium truncate flex-1">
                {fact.assets.find((a) => a.type === 'audio')?.label || 'No audio'}
              </span>
              <span className="font-mono text-muted-fg" data-mono>
                {fact.assets.find((a) => a.type === 'audio')?.durationSec ?? 0}s
              </span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2 glass hover:bg-white/5 border-white/10">
              <Play className="h-4 w-4" /> {t('Preview')}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 glass hover:bg-white/5 border-white/10">
              <Wand2 className="h-4 w-4" /> {t('AI captions')}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 glass hover:bg-white/5 border-white/10">
              <ImageIcon className="h-4 w-4" /> {t('Swap assets')}
            </Button>
          </div>

          {/* === Giant lime Lock Video & Submit button === */}
          <Button
            onClick={handleLock}
            disabled={wasLocked}
            className={cn(
              'w-full mt-4 gap-3 h-14 text-base font-bold transition-all',
              wasLocked
                ? 'bg-white/[0.04] text-muted-fg border border-white/10 cursor-not-allowed'
                : 'bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime',
            )}
          >
            <Lock className="h-5 w-5" />
            {wasLocked ? t('Locked · awaiting review') : t('Lock Video & Submit')}
            {!wasLocked && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* === Right rail === */}
        <div className="space-y-6">
          {/* Locked script */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-teal" />
              <span className="font-serif text-base font-semibold">{t('Script (locked)')}</span>
            </div>
            <div className="space-y-2">
              {fact.scriptLines.map((l, i) => {
                const source = fact.sources.find((s) => s.id === l.sourceId)
                return (
                  <div key={l.id} className="rounded-lg p-2.5 glass">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-lime/15 text-lime" data-mono>
                        L{i + 1}
                      </span>
                      {l.isHook && (
                        <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25">
                          {t('Hook')}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-fg font-mono ms-auto" data-mono>
                        {l.durationSec}s
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{l.text}</p>
                    {source && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-fg">
                        <ShieldCheck className="h-3 w-3 text-lime" />
                        <span className="truncate">{source.label}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-muted-fg">{t('Total duration')}</span>
                <span className="font-mono font-semibold text-fg" data-mono>
                  {totalDuration}s · {formatDuration(totalDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Asset library */}
          <div className="glass rounded-2xl p-5">
            <span className="font-serif text-base font-semibold">{t('Asset library')}</span>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {fact.assets.map((a) => {
                const Icon = a.type === 'broll' ? Video : a.type === 'image' ? ImageIcon : a.type === 'audio' ? Music : Sparkles
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAsset(a.id)}
                    className={cn(
                      'rounded-lg p-3 text-start transition-all border',
                      selectedAsset === a.id
                        ? 'border-lime/40 bg-lime/5'
                        : 'border-white/10 hover:border-lime/30 hover:bg-white/[0.03]',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3.5 w-3.5 text-muted-fg" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-fg">{a.type}</span>
                    </div>
                    <div className="text-xl mb-1">{a.thumb}</div>
                    <div className="text-xs font-medium leading-snug line-clamp-2">{a.label}</div>
                    {a.durationSec && (
                      <div className="text-[10px] text-muted-fg font-mono mt-1" data-mono>{a.durationSec}s</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Earnings estimate */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('Earnings estimate')}</span>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10" data-mono>
                10k {t('views')}
              </Badge>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-fg">{t('Base Fee')}</span>
                <span className="font-mono text-fg" data-mono>${fact.baseFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-fg">{t('CPM (10k × rate)')}</span>
                <span className="font-mono text-orange" data-mono>${MAX_CPM_PAYOUT}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.06] font-bold">
                <span>{t('Estimated total')}</span>
                <span className="font-mono text-lime text-lg" data-mono>${maxEarning}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-fg hover:text-fg" onClick={() => setCreatorView('wall')}>
              {t('Back to Facts Wall')} <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
