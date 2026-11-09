'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CREATORS, TRANSACTIONS, USD_TO_TND, MAX_CPM_PAYOUT, VIEW_CAP, VIDEOS } from '@/lib/perokio/data'
import { getCreatorStats, EARNINGS_CURVE_5D } from '@/lib/perokio/mock-data'
import { useGrowthStore } from '@/lib/perokio/use-growth-store'
import { useT } from '@/lib/perokio/i18n'
import { formatTND, formatUSD, formatCompact } from '@/lib/perokio/format'
import { useLiveEarnings } from '@/lib/perokio/use-live-views'
import { Flame, Wallet, TrendingUp, Gift, ArrowDownToLine, Zap, Crown, Trophy, Copy, Check, UserPlus, Link2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useToast } from '@/hooks/use-toast'

const earningsData = EARNINGS_CURVE_5D

/**
 * CircularProgressRing — SVG ring used for the live CPM 24h view window tracker.
 * The dollar amount AND view count tick up in real-time.
 */
function CircularProgressRing({
  progress,
  size = 200,
  stroke = 14,
}: {
  progress: number // 0-1
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - progress)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8EF70" />
            <stop offset="100%" stopColor="#6FD3C7" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          filter="url(#ringGlow)"
          style={{ boxShadow: '0 0 20px rgba(216,239,112,0.5)' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] tracking-wider uppercase text-muted-fg">24h CPM window</span>
        <span className="text-3xl font-mono font-bold text-lime tabular-nums my-1" data-mono>
          {Math.round(progress * 100)}%
        </span>
        <span className="text-[10px] text-muted-fg">to full payout</span>
      </div>
    </div>
  )
}

export function WalletView() {
  const creator = CREATORS[0]
  const stats = getCreatorStats(creator.id)
  const myTx = TRANSACTIONS.filter((tx) => tx.party === creator.name)
  const { toast } = useToast()
  const t = useT()
  const trackInviteSent = useGrowthStore((s) => s.trackInviteSent)
  const trackProfileShare = useGrowthStore((s) => s.trackProfileShare)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [profileCopied, setProfileCopied] = useState(false)
  // §4 Phase 4 §13: confetti burst state — fires on Withdraw click, auto-clears in 2s
  const [showConfetti, setShowConfetti] = useState(false)

  // === §1 BLOCKING PATCH: shared live views via useLiveEarnings ===
  // Both WL01 and B17 consume this hook for the same video → identical numbers.
  // The independent liveDollars/liveViews state is removed.
  // vid_001 is Amira's published video (the one the wallet tracks).
  const trackedVideoId = 'vid_001'
  const { views: liveViews, totalEarned: liveDollars, progress: liveProgress } = useLiveEarnings(trackedVideoId)

  const streakToNext = creator.streak >= 28 ? 30 : creator.streak >= 14 ? 28 : stats.streakCycleDays
  const streakProgress = (creator.streak / streakToNext) * 100

  return (
    <div className="space-y-6">
      {/* === Hero wallet + circular CPM tracker === */}
      <div className="relative overflow-hidden rounded-2xl glass p-6 lg:p-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 800px 400px at 90% -10%, rgba(216,239,112,0.15), transparent 60%), radial-gradient(ellipse 600px 400px at -10% 110%, rgba(237,122,66,0.10), transparent 60%)',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* === Giant balance display === */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Wallet className="h-5 w-5 text-lime" />
              <span className="text-sm text-muted-fg">{t('My wallet')}</span>
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">WL01</Badge>
              <span className="text-sm font-medium">{creator.name}</span>
              {/* §3 Phase 3: Copy Profile Link — uses creator.handle without @ */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = `perokio.com/creator/${creator.handle.replace(/^@/, '')}`
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(url).catch(() => {})
                  }
                  trackProfileShare()
                  setProfileCopied(true)
                  toast({
                    title: `🔗 ${t('Profile link copied')}`,
                    description: t('Share it in your bio.'),
                  })
                  setTimeout(() => setProfileCopied(false), 2000)
                }}
                className="h-7 px-2 text-[11px] text-muted-fg hover:text-lime hover:bg-lime/10 gap-1"
              >
                {profileCopied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                {profileCopied ? t('Copied') : t('Copy Profile Link')}
              </Button>
            </div>

            <div>
              <div className="text-xs text-muted-fg mb-1">{t('Withdrawable balance')}</div>
              <motion.div
                initial={{ scale: 0.96, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-mono font-bold tracking-tight tabular-nums text-lime"
                style={{ textShadow: '0 0 30px rgba(216,239,112,0.4)' }}
                data-mono
              >
                {formatUSD(creator.pendingPayout)}
              </motion.div>
              <div className="text-xs text-muted-fg mt-1 font-mono" data-mono>
                ≈ {formatTND(creator.pendingPayout * USD_TO_TND)} · {t('Rate: 1 USD = 3.10 TND')}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {/* §4 Phase 4 §13: confetti burst overlay — anchored to the Withdraw button */}
              <div className="relative">
                <Button
                  className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime"
                  onClick={() => {
                    setShowConfetti(true)
                    setTimeout(() => setShowConfetti(false), 2000)
                    toast({
                      title: `💸 ${t('Withdrawal requested')}`,
                      description: `${formatTND(creator.pendingPayout * USD_TO_TND)} ${t('arriving via Flouci within 24h.')}`,
                    })
                  }}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  {t('Withdraw to Flouci')}
                </Button>

                {/* Confetti particles — 20 divs, random colors + trajectories via framer-motion */}
                {showConfetti && (
                  <div className="absolute left-1/2 top-1/2 pointer-events-none z-50" aria-hidden>
                    {Array.from({ length: 20 }).map((_, i) => {
                      const colors = ['#D8EF70', '#ED7A42', '#6FD3C7', '#B6A6FF']
                      const color = colors[i % colors.length]
                      const angle = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
                      const distance = 80 + Math.random() * 100
                      const x = Math.cos(angle) * distance
                      const y = Math.sin(angle) * distance - 40 // bias upward
                      const rot = Math.random() * 720 - 360
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                          animate={{ opacity: 0, x, y, scale: 0.5, rotate: rot }}
                          transition={{ duration: 1.6 + Math.random() * 0.4, ease: 'easeOut' }}
                          className="absolute"
                          style={{
                            width: 8,
                            height: 8,
                            background: color,
                            borderRadius: '2px',
                            boxShadow: `0 0 6px ${color}66`,
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
              <Button variant="outline" className="gap-2 glass hover:bg-white/5 border-white/10">
                <Zap className="h-4 w-4 text-orange" />
                {t('Auto-withdraw')}
              </Button>
            </div>
          </div>

          {/* === Live CPM tracker — circular progress ring === */}
          <div className="flex flex-col items-center gap-3">
            <CircularProgressRing progress={liveProgress} size={200} />
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-fg">Live views</div>
                <div className="font-mono font-bold text-lime text-lg tabular-nums" data-mono>
                  {formatCompact(liveViews)}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-fg">Live earnings</div>
                <motion.div
                  key={Math.floor(liveDollars)}
                  initial={{ scale: 1.08 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="font-mono font-bold text-orange text-lg tabular-nums"
                  data-mono
                >
                  ${liveDollars.toFixed(2)}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Streak / level cards */}
          <div className="flex flex-col gap-3 min-w-[240px]">
            <div className="rounded-xl p-4 glass-orange">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange" />
                  <span className="font-semibold">{t('Streak')}</span>
                </div>
                <span className="text-2xl font-mono font-bold text-orange" data-mono>{creator.streak}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange to-red"
                  initial={{ width: 0 }}
                  animate={{ width: `${streakProgress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-fg">{streakToNext - creator.streak} {t('days to next reward')}</span>
                <Badge className="text-[10px] bg-orange/15 text-orange border border-orange/25" data-mono>+${stats.streakRewardAmount}</Badge>
              </div>
            </div>

            <div className="rounded-xl p-4 glass" style={{ borderColor: 'rgba(182,166,255,0.25)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[#B6A6FF]" />
                  <span className="font-semibold">{t('Creator level')}</span>
                </div>
                <Badge className="text-[10px] bg-[#B6A6FF]/15 text-[#B6A6FF] border border-[#B6A6FF]/25">
                  {creator.level}
                </Badge>
              </div>
              <div className="text-xs text-muted-fg mt-2">{creator.rank}</div>
            </div>
          </div>
        </div>
      </div>

      {/* === KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label={t('Total earned')} value={formatUSD(creator.totalEarned)} delta={`+${stats.monthlyGrowthPct}% ${t('this month')}`} deltaType="up" />
        <KpiCard label={t('Completed videos')} value={String(creator.completedVideos)} delta={`+${stats.monthlyNewVideos} ${t('this month')}`} deltaType="neutral" />
        <KpiCard label={t('Avg rating')} value={`★ ${creator.rating}`} delta={`${t('Reliability')} ${creator.reliabilityScore}/100`} deltaType="neutral" />
        <KpiCard label={t('Followers')} value={formatCompact(creator.followers)} delta={creator.platform} deltaType="up" />
        {/* Phase 1.2: Link Clicks — sum of clicks across all the creator's videos */}
        <KpiCard
          label={t('Link Clicks')}
          value={formatCompact(VIDEOS.filter((v) => v.creatorId === 'cr_amira').reduce((s, v) => s + v.clicks, 0))}
          delta={`${t('across all videos')}`}
          deltaType="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold">{t('Earnings curve · last 5 days')}</h3>
              <p className="text-xs text-muted-fg">{t('Daily Base + CPM')}</p>
            </div>
            <Badge className="gap-1 bg-lime/10 text-lime border border-lime/20">
              <TrendingUp className="h-3 w-3" /> {t('Live')}
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={earningsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D8EF70" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#D8EF70" stopOpacity={0} />
                </linearGradient>
                <filter id="earningsGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,15,13,0.95)',
                  border: '1px solid rgba(216,239,112,0.3)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#fff',
                  backdropFilter: 'blur(20px)',
                }}
                formatter={(v: number) => [formatUSD(v), t('Earnings')]}
              />
              <Area type="monotone" dataKey="e" stroke="#D8EF70" strokeWidth={2} fill="url(#earningsGrad)" animationDuration={1200} filter="url(#earningsGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* §1 (Cycle 8): Invite a Creator — referral CTA, $20 bonus per verified creator */}
        <div
          className="rounded-2xl p-5 glass"
          style={{ borderColor: 'rgba(216,239,112,0.30)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-lime" />
            <span className="font-serif text-base font-semibold">{t('Invite a Creator')}</span>
            <Badge className="text-[10px] bg-lime/15 text-lime border border-lime/25">+$20</Badge>
          </div>
          <p className="text-xs text-muted-fg mb-3">
            {t('Earn')} <span className="text-lime font-semibold">$20</span> {t('per verified creator you invite. They get a fast-track to Elite status.')}
          </p>

          {/* Copyable referral link */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              readOnly
              value="perokio.com/join?ref=amira.tn"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg glass border border-white/10 bg-white/[0.02] text-xs font-mono focus:outline-none"
              data-mono
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 glass border-lime/25 text-lime hover:bg-lime/10"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText('perokio.com/join?ref=amira.tn').catch(() => {})
                }
                trackInviteSent()
                toast({
                  title: `🎁 ${t('Invite link copied')}`,
                  description: t("You'll earn $20 when they post their first video."),
                })
                setInviteCopied(true)
                setTimeout(() => setInviteCopied(false), 2000)
              }}
            >
              {inviteCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {inviteCopied ? t('Copied') : t('Copy Invite Link')}
            </Button>
          </div>

          {/* Mini referral stats footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-fg pt-2 border-t border-white/[0.06]">
            <span className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              <span className="font-mono" data-mono>10 {t('invites sent')}</span>
            </span>
            <span className="text-lime font-mono" data-mono>7 {t('accepted')} · $140 {t('earned')}</span>
          </div>
        </div>

        {/* Rewards */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-orange" />
            <span className="font-serif text-base font-semibold">{t('Rewards')}</span>
          </div>
          <div className="space-y-2">
            <RewardItem label={t('Complete 5 videos')} reward={`+$${stats.videosRewardAmount}`} progress={stats.videosRewardProgress} subtitle={`${stats.videosRewardCurrent} / ${stats.videosRewardThreshold}`} accent="lime" />
            <RewardItem label={t('Reach 100k total views')} reward={`+$${stats.viewsRewardAmount}`} progress={stats.viewsRewardProgress} subtitle={`${stats.viewsRewardCurrent.toLocaleString()} / ${stats.viewsRewardThreshold.toLocaleString()}`} accent="orange" />
            <RewardItem label={t('Upgrade to Elite')} reward={t(stats.eliteRewardLabel)} progress={stats.eliteRewardProgress} subtitle={`${t('Reliability')} ${creator.reliabilityScore} / ${stats.eliteRewardThreshold}`} accent="violet" />
            <Button variant="outline" className="w-full mt-2 gap-2 glass hover:bg-white/5 border-white/10">
              <Trophy className="h-4 w-4 text-orange" /> {t('View all rewards')}
            </Button>
          </div>
        </div>
      </div>

      {/* === Transactions list === */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-serif text-lg font-semibold mb-3">{t('Recent transactions')}</h3>
        <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
          {myTx.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center glass">
                <ArrowDownToLine className="h-4 w-4 text-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {tx.factCode ? `${t('Video earnings')} ${tx.factCode}` : t('Withdrawal')}
                </div>
                <div className="text-xs text-muted-fg font-mono" data-mono>
                  {tx.createdAt} · Flouci
                </div>
              </div>
              <div className="text-end">
                <div className="font-mono font-semibold text-lime" data-mono>+{formatTND(tx.amount)}</div>
                <Badge
                  className={
                    tx.status === 'completed'
                      ? 'text-[10px] bg-lime/10 text-lime border border-lime/20'
                      : 'text-[10px] bg-orange/10 text-orange border border-orange/25'
                  }
                >
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  deltaType,
}: {
  label: string
  value: string
  delta: string
  deltaType: 'up' | 'down' | 'neutral'
}) {
  const color = deltaType === 'up' ? 'text-lime' : deltaType === 'down' ? 'text-red' : 'text-muted-fg'
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-muted-fg mb-1">{label}</div>
      <div className="text-2xl font-mono font-bold tabular-nums" data-mono>{value}</div>
      <div className={`text-[10px] mt-1 ${color}`}>{delta}</div>
    </div>
  )
}

function RewardItem({
  label,
  reward,
  progress,
  subtitle,
  accent,
}: {
  label: string
  reward: string
  progress: number
  subtitle: string
  accent: 'lime' | 'orange' | 'violet'
}) {
  const barColor = accent === 'lime' ? 'from-lime to-teal' : accent === 'orange' ? 'from-orange to-red' : 'from-[#B6A6FF] to-teal'
  const textColor = accent === 'lime' ? 'text-lime' : accent === 'orange' ? 'text-orange' : 'text-[#B6A6FF]'
  return (
    <div className="rounded-lg p-3 glass">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <Badge className={`text-[10px] bg-white/[0.04] border border-white/10 ${textColor}`} data-mono>{reward}</Badge>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-1">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        />
      </div>
      <div className="text-[10px] text-muted-fg font-mono" data-mono>{subtitle}</div>
    </div>
  )
}
