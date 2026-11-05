'use client'

import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { TimerBar } from '@/components/perokio/shared/timer-bar'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, VIDEOS, FACTS, MAX_CPM_PAYOUT } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { CheckCircle2, X, Play, Eye, MessageSquare, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial, springSnappy } from '@/lib/perokio/motion'

/**
 * VideoReview (B12) — premium pass with new design system components.
 *
 * This screen is the proof-of-concept for Cycle 2's reusable components:
 *   - TimerBar (12h shrinking review window, urgency color-shift)
 *   - AnimatedCTA (Approve / Request changes morph on click)
 *   - prefers-reduced-motion support
 *
 * B12 is single-focus: one video, full attention, time-pressured.
 * Per Cycle 1 design rationale:
 *   "Top: 12h shrinking review bar (orange → red as it depletes).
 *    Submitted Xh ago — Yh to auto-approve."
 */
export function VideoReview() {
  const setActiveVideo = usePerokioStore((s) => s.setActiveVideo)
  const activeVideoId = usePerokioStore((s) => s.activeVideoId)
  const approveVideo = usePerokioStore((s) => s.approveVideo)
  const setView = usePerokioStore((s) => s.setBrandView)
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()
  const reduced = useReducedMotion()
  const [feedback, setFeedback] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showReject, setShowReject] = useState(false)

  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const pendingVideos = VIDEOS.filter((v) => v.brandName === brand.name && v.stage === 'locked_pending')
  const activeVideo = VIDEOS.find((v) => v.id === activeVideoId && v.stage === 'locked_pending') || pendingVideos[0]

  if (!activeVideo) {
    return (
      <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-lime mx-auto mb-3" />
        <h3 className="text-lg font-serif font-semibold mb-1">{t('No videos pending review')}</h3>
        <p className="text-sm text-muted-fg">{t('All creator submissions are processed')} ✨</p>
        <AnimatedCTA variant="ghost" className="mt-4" onClick={() => setView('machine')}>
          {t('Back to Content Machine')}
        </AnimatedCTA>
      </div>
    )
  }

  const fact = FACTS.find((f) => f.id === activeVideo.factId)
  const reviewHoursLeft = activeVideo.reviewDeadline ?? 12
  // Compute "submitted Xh ago" — assume 12h - reviewDeadline = time elapsed
  const submittedHoursAgo = 12 - reviewHoursLeft

  const handleApprove = () => {
    approveVideo(activeVideo.id)
    setShowSuccess(true)
    toast({
      title: `✅ ${t('Video approved')}`,
      description: `${activeVideo.factCode} ${t('queued for publishing via Postiz.')} (${activeVideo.platform})`,
    })
    setFeedback('')
    setTimeout(() => setShowSuccess(false), 2500)
  }

  const handleReject = () => {
    setShowReject(true)
    toast({
      title: `❌ ${t('Video returned')}`,
      description: t('The creator receives feedback and keeps a 12-hour revision window.'),
      variant: 'destructive',
    })
    setFeedback('')
    setTimeout(() => setShowReject(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* === Header with shrinking 12h review bar === */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-lime" />
            <h2 className="text-2xl font-serif font-semibold">{t('Video Review')}</h2>
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B12</Badge>
          </div>
          <span className="text-xs text-muted-fg">{t('12-hour review window · auto-approves on timeout')}</span>
        </div>

        {/* === The 12h shrinking review bar (TimerBar) === */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-fg">
              {t('Submitted')} <span className="font-mono text-fg" data-mono>{submittedHoursAgo}h</span> {t('ago')} ·{' '}
              <span className="text-orange">{reviewHoursLeft}h {t('to auto-approve')}</span>
            </span>
            <TimerBar
              hours={12}
              layout="inline"
              size="md"
              className="text-orange"
            />
          </div>
          <TimerBar
            hours={12}
            label={t('Review window')}
            layout="bar"
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === Pending queue === */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-base font-semibold">{t('Pending queue')}</span>
            <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25" data-mono>
              {pendingVideos.length}
            </Badge>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {pendingVideos.map((v) => {
              const isActive = activeVideo.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveVideo(v.id)}
                  className={cn(
                    'w-full text-start p-3 rounded-xl border transition-all',
                    isActive
                      ? 'glass-lime border-lime/40'
                      : 'glass hover:bg-white/[0.05] border-white/10',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{v.thumbnail}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-muted-fg" data-mono>{v.factCode}</div>
                      <div className="text-sm font-medium truncate">{v.creatorName}</div>
                    </div>
                    <TimerBar hours={v.reviewDeadline ?? 12} layout="inline" size="sm" />
                  </div>
                  <div className="text-xs text-muted-fg line-clamp-1">{v.factClaim}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* === Preview & decision === */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-serif text-base font-semibold">
              {t('Video preview')} · <span className="font-mono text-muted-fg" data-mono>{activeVideo.factCode}</span>
            </span>
          </div>

          <div className="space-y-4">
            {/* === 9:16 mock player === */}
            <div className="flex justify-center">
              <div
                className="relative rounded-2xl overflow-hidden border-2 border-white/10"
                style={{
                  aspectRatio: '9/16',
                  width: 'min(280px, 70vw)',
                  background:
                    'linear-gradient(135deg, rgba(216,239,112,0.12), rgba(237,122,66,0.08), rgba(111,211,199,0.10))',
                }}
              >
                <div className="absolute top-3 start-3 end-3 flex items-center justify-between z-10">
                  <Badge className="bg-black/40 text-white backdrop-blur text-[10px] border border-white/10" data-mono>
                    9:16 · {activeVideo.durationSec}s
                  </Badge>
                  <Badge className="bg-black/40 text-white backdrop-blur text-[10px] border border-white/10">
                    {activeVideo.platform}
                  </Badge>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                  <motion.div
                    animate={reduced ? undefined : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-7xl drop-shadow-[0_4px_12px_rgba(216,239,112,0.4)]"
                  >
                    {activeVideo.thumbnail}
                  </motion.div>
                  <div className="text-center max-w-[200px]">
                    <div className="text-xs font-medium text-fg/90 line-clamp-2">
                      {fact?.scriptLines[0]?.text}
                    </div>
                  </div>
                </div>

                {/* Bottom creator info */}
                <div className="absolute bottom-3 start-3 end-3">
                  <div className="text-xs text-white/90 font-medium line-clamp-2 mb-1">
                    {fact ? pick(fact.claim, fact.claimAr) : ''}
                  </div>
                  <div className="text-[10px] text-white/60 font-mono" data-mono>
                    @{activeVideo.creatorName.toLowerCase().replace(' ', '.')} · #perokio
                  </div>
                </div>

                {/* Play overlay */}
                <button className="absolute inset-0 flex items-center justify-center group" aria-label={t('Preview')}>
                  <div className="h-14 w-14 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-lime ms-0.5" fill="currentColor" />
                  </div>
                </button>
              </div>
            </div>

            {/* === Locked script (B11 verified) === */}
            <div className="rounded-xl glass p-3">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-lime" />
                <span className="text-xs font-semibold">{t('Script (locked by B11)')}</span>
                <Badge className="text-[10px] ms-auto bg-lime/10 text-lime border border-lime/20">
                  {t('Verified')} ✓
                </Badge>
              </div>
              <div className="space-y-1">
                {fact?.scriptLines.map((l, i) => {
                  const source = fact.sources.find((s) => s.id === l.sourceId)
                  return (
                    <div key={l.id} className="text-xs leading-relaxed text-fg/80">
                      <span className="text-muted-fg font-mono me-1" data-mono>L{i + 1}</span>
                      {l.text}
                      {source && (
                        <span className="text-[10px] text-lime ms-2 font-mono" data-mono>
                          · Fact #{source.id.split('_').pop()?.slice(0, 4).toUpperCase() ?? 'TUN'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* === Feedback === */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-xs text-muted-fg flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> {t('Feedback (optional — required when rejecting)')}
              </Label>
              <Textarea
                id="feedback"
                placeholder={t('e.g., hook is weak, add a number; extend the brand logo by 1s...')}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="glass border-white/10 bg-white/[0.02] placeholder:text-subtle"
              />
            </div>

            {/* === Actions — AnimatedCTA with success morph === */}
            <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
              <AnimatedCTA
                onClick={handleApprove}
                success={showSuccess}
                successLabel={`✓ ${t('Approved')}`}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('Approve & publish')}
              </AnimatedCTA>
              <AnimatedCTA
                variant="destructive"
                onClick={handleReject}
                success={showReject}
                successLabel={`↩ ${t('Returned')}`}
                className="flex-1"
              >
                <X className="h-4 w-4" />
                {t('Request changes')}
              </AnimatedCTA>
            </div>

            {/* === Stats === */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <StatCell label={t('views')} value={formatCompact(activeVideo.views)} accent="lime" />
              <StatCell label={t('Base Fee')} value={`$${activeVideo.earningsBase}`} accent="orange" />
              <StatCell label={t('Max CPM')} value={`$${MAX_CPM_PAYOUT}`} accent="red" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCell({ label, value, accent }: { label: string; value: string; accent: 'lime' | 'orange' | 'red' }) {
  const color = accent === 'lime' ? 'text-lime' : accent === 'orange' ? 'text-orange' : 'text-red'
  return (
    <div className="p-2 rounded-lg glass">
      <div className="text-muted-fg text-[10px] mb-0.5">{label}</div>
      <div className={cn('font-mono font-semibold', color)} data-mono>{value}</div>
    </div>
  )
}
