'use client'

import { StatCard } from '@/components/perokio/shared/stat-card'
import { ViewTicker } from '@/components/perokio/shared/view-ticker'
import { Countdown } from '@/components/perokio/shared/countdown'
import { WeekGrid } from '@/components/perokio/shared/week-grid'
import { ParrotEye, ParrotEyeHandle, ParrotLogo } from '@/components/perokio/shared/parrot-logo'
import { usePerokioLiveViews, formatUSD, formatCompact, formatNumber } from '@/lib/perokio/live'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, VIDEOS, FACTS } from '@/lib/perokio/data'
import { getBrandStats, MARQUEE_ACTIVITY, VIEWS_CURVE_24H } from '@/lib/perokio/mock-data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Wallet, Film, TrendingUp, Flame, Zap, ArrowUpRight, Sparkles, Activity, DollarSign, EyeOff } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const viewsChartData = VIEWS_CURVE_24H

// Live activity feed for the marquee — from mock-data.ts (single source of truth)
const MARQUEE_ITEMS = MARQUEE_ACTIVITY

export function CommandCenter() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick)
  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const brandStats = getBrandStats(brand.id)
  const liveViews = usePerokioLiveViews(brand.totalViews)
  const setView = usePerokioStore((s) => s.setBrandView)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const setActiveVideo = usePerokioStore((s) => s.setActiveVideo)
  const t = useT()
  const pick = usePick()

  const eyeRef = useRef<ParrotEyeHandle>(null)
  const [walletVisible, setWalletVisible] = useState(true)

  const recentVideos = VIDEOS.filter((v) => v.brandName === brand.name).slice(-5)
  const activeFacts = FACTS.filter((f) => f.brandId === brand.id && f.status !== 'paid')
  const pendingReview = VIDEOS.filter((v) => v.brandName === brand.name && v.stage === 'locked_pending')

  return (
    <div className="space-y-6">
      {/* === Scrolling marquee — live creator activity === */}
      <div className="relative overflow-hidden rounded-xl glass py-2.5">
        <div className="absolute start-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-[#0A0F0D] to-transparent pointer-events-none" />
        <div className="absolute end-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-[#0A0F0D] to-transparent pointer-events-none" />
        <div className="flex w-max animate-ticker gap-8 px-4">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs whitespace-nowrap">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              </span>
              <span className="font-mono text-lime" data-mono>{item.handle}</span>
              <span className="text-muted-fg">{t(item.action)}</span>
              {item.fact && (
                <span className="font-mono text-subtle" data-mono>· {item.fact}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* === WeekGrid — the Calendar-as-Spine (replaces the dashboard hero) === */}
      <WeekGrid
        onEntryClick={(entry) => {
          if (entry.factId) {
            setActiveFact(entry.factId)
            setView('script')
          }
        }}
      />

      {/* === Hero — Parrot Eye + Live views + Wallet === */}
      <div className="relative overflow-hidden rounded-2xl glass p-6 lg:p-8">
        {/* Ambient gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 800px 400px at 90% -10%, rgba(216,239,112,0.10), transparent 60%), radial-gradient(ellipse 600px 400px at -10% 110%, rgba(237,122,66,0.08), transparent 60%)',
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{brand.logo}</span>
              <span className="font-semibold text-fg">{pick(brand.name, brand.nameAr)}</span>
              <Badge className="text-[10px] bg-lime/10 text-lime border border-lime/20">{brand.tier}</Badge>
            </div>
            <h2 className="text-3xl font-serif font-semibold tracking-tight text-fg">
              {t('Command Center')}
            </h2>

            <div className="flex flex-wrap items-center gap-8 mt-2">
              {/* Live total views — with blinking Parrot Eye */}
              <div>
                <div className="text-[11px] tracking-wider uppercase text-muted-fg mb-1.5 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> {t('Live total views')}
                </div>
                <div className="flex items-center gap-3">
                  <ParrotEye ref={eyeRef} size={48} />
                  <ViewTicker
                    initialViews={liveViews}
                    onTick={() => eyeRef.current?.blink()}
                    className="text-4xl font-mono font-bold tabular-nums text-lime"
                  />
                </div>
              </div>

              {/* Wallet — toggleable eye */}
              <div className="h-12 w-px bg-white/10" />
              <div>
                <div className="text-[11px] tracking-wider uppercase text-muted-fg mb-1.5 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" /> {t('Wallet balance')}
                  <button
                    onClick={() => setWalletVisible((v) => !v)}
                    className="ms-1 text-muted-fg hover:text-fg transition-colors"
                    aria-label={t('Toggle wallet visibility')}
                  >
                    {walletVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="text-4xl font-mono font-bold tabular-nums text-fg" data-mono>
                  {walletVisible ? formatUSD(brand.walletBalance) : '$ • • •'}
                </div>
                {walletVisible && (
                  <div className="text-[11px] text-muted-fg mt-0.5 font-mono" data-mono>
                    ${brand.walletBalance} / ${brand.monthlyBudget}
                  </div>
                )}
              </div>

              {/* Total videos */}
              <div className="h-12 w-px bg-white/10" />
              <div>
                <div className="text-[11px] tracking-wider uppercase text-muted-fg mb-1.5 flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5" /> {t('Total videos')}
                </div>
                <div className="text-4xl font-mono font-bold tabular-nums text-fg" data-mono>
                  {brand.totalVideos}
                </div>
              </div>
            </div>

            {pendingReview.length > 0 && (
              <Button
                onClick={() => setView('review')}
                className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90"
              >
                <Zap className="h-4 w-4" />
                {pendingReview.length} {t('videos awaiting your review')}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Moat status panel — static ParrotLogo (3D parrot deferred to V2) */}
          <div className="relative w-44 h-44 rounded-2xl glass-lime overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
                <ParrotLogo size={56} />
              </motion.div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted-fg">{t('MOAT ACTIVE')}</div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse-glow" />
                <span className="text-xs font-mono text-lime" data-mono>B11 · {activeFacts.length}</span>
              </div>
            </div>
            {/* Scan line */}
            <div className="absolute inset-x-0 h-px bg-lime/40 animate-scan-line pointer-events-none" />
          </div>
        </div>
      </div>

      {/* === KPI cards === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('Weekly ROI')} value={`${brandStats.weeklyRoi}×`} icon={TrendingUp} delta={`+${brandStats.weeklyRoiDelta} ${t('vs last week')}`} deltaType="up" accent="lime" />
        <StatCard label={t('Avg CPM')} value={`$${brand.avgCpm}`} icon={DollarSign} delta={t(brandStats.industryLabel)} deltaType="up" accent="orange" />
        <StatCard label={t('Active Fact Bundles')} value={activeFacts.length} icon={Flame} delta={`${brand.videoCredits - brand.videoCreditsUsed} ${t('video credits left')}`} deltaType="neutral" accent="teal" />
        <StatCard label={t('Spent this month')} value={formatUSD(brand.walletSpent)} icon={Activity} delta={`/${formatUSD(brand.monthlyBudget)}`} deltaType="neutral" accent="violet" />
      </div>

      {/* === Mini glowing SVG chart + Wallet/budget === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold">{t('Views trend · 24h')}</h3>
              <p className="text-xs text-muted-fg">{t('Cumulative views across all creator videos')}</p>
            </div>
            <Badge className="gap-1 bg-lime/10 text-lime border border-lime/20">
              <Sparkles className="h-3 w-3" /> {t('Live')}
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={viewsChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D8EF70" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#D8EF70" stopOpacity={0} />
                </linearGradient>
                <filter id="glowFilter">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <XAxis dataKey="t" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => formatCompact(v)} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,15,13,0.95)',
                  border: '1px solid rgba(216,239,112,0.3)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#fff',
                  backdropFilter: 'blur(20px)',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                formatter={(v: number) => [formatNumber(v) + ' ' + t('views'), t('Views')]}
              />
              <Area type="monotone" dataKey="v" stroke="#D8EF70" strokeWidth={2} fill="url(#viewsGrad)" animationDuration={1200} filter="url(#glowFilter)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Wallet & Budget */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold">{t('Wallet & Budget')}</h3>
            <Wallet className="h-4 w-4 text-lime" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-muted-fg mb-1.5">
                <span>{t('Monthly budget')}</span>
                <span className="font-mono" data-mono>
                  {formatUSD(brand.walletSpent)} / {formatUSD(brand.monthlyBudget)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-lime to-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${(brand.walletSpent / brand.monthlyBudget) * 100}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <BudgetRow label={t('Subscription')} value={`${formatUSD(brand.subscription)}${t('/mo')}`} />
              <BudgetRow label={t('CPM budget cap')} value={formatUSD(brand.cpmCap)} />
              <BudgetRow label={t('Video credits')} value={`${brand.videoCreditsUsed}/${brand.videoCredits}`} />
              <BudgetRow label={t('CPM rate')} value={`$3.00 ${t('per 1k views')}`} accent="lime" />
            </div>

            <Button onClick={() => setView('billing')} variant="outline" className="w-full gap-2 glass hover:bg-white/5 border-white/10">
              <DollarSign className="h-4 w-4" />
              {t('Top up & billing')}
            </Button>
          </div>
        </div>
      </div>

      {/* === Arena Cards — horizontal scroll with 24h countdown === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-semibold">{t('Active Fact Bundles')}</h3>
          <Button variant="ghost" size="sm" onClick={() => setView('library')} className="text-xs text-muted-fg hover:text-fg">
            {t('View all')} →
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 snap-x">
          {activeFacts.map((f, idx) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              onClick={() => {
                setActiveFact(f.id)
                setView('script')
              }}
              className="snap-start flex-shrink-0 w-72 text-start rounded-2xl glass hover:glass-lime transition-all p-4 group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono text-muted-fg" data-mono>{f.code}</span>
                <Badge
                  className={
                    f.tier === 'Hot'
                      ? 'text-[10px] bg-red/15 text-red border border-red/25'
                      : f.tier === 'Premium'
                        ? 'text-[10px] bg-violet/15 text-[#B6A6FF] border border-[#B6A6FF]/25'
                        : 'text-[10px] bg-white/[0.04] text-muted-fg border border-white/10'
                  }
                >
                  {f.tier === 'Hot' && <Flame className="h-3 w-3 me-1" />}
                  {t(f.tier)}
                </Badge>
              </div>
              <p className="text-sm font-medium leading-snug line-clamp-2 mb-3">{pick(f.claim, f.claimAr)}</p>

              {/* 24h countdown progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-muted-fg mb-1">
                  <span>{t('Claim window')}</span>
                  <Countdown hours={24 - (idx * 3)} size="sm" variant="orange" />
                </div>
                <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange to-red"
                    initial={{ width: '100%' }}
                    animate={{ width: `${Math.max(20, 100 - idx * 15)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-fg">
                <span className="font-mono" data-mono>{f.claimedBy.length}/{f.maxCreators}</span>
                <span>·</span>
                <span className="font-mono" data-mono>{formatCompact(f.totalViews)} {t('views')}</span>
                <span>·</span>
                <span className="text-lime">★ {f.rating}</span>
              </div>

              {/* §2 Phase 2: small ghost CTAs to navigate to B11 + B10 */}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveFact(f.id)
                    setView('script')
                  }}
                  className="h-7 px-2 text-[11px] text-muted-fg hover:text-lime hover:bg-lime/10 gap-1"
                >
                  Edit Fact
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setView('library')
                  }}
                  className="h-7 px-2 text-[11px] text-muted-fg hover:text-lime hover:bg-lime/10 gap-1"
                >
                  View Details
                </Button>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* === Recent videos === */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-serif text-lg font-semibold">{t('Recent videos')}</h3>
            <p className="text-xs text-muted-fg">{t('Latest published videos')}</p>
          </div>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
          {recentVideos.map((v) => {
            const ctr = v.views > 0 ? (v.clicks / v.views) * 100 : 0
            const grade =
              v.successScore >= 90 ? 'A' : v.successScore >= 70 ? 'B' : 'C'
            const gradeColor =
              v.successScore >= 90
                ? 'bg-lime/10 text-lime border border-lime/20'
                : v.successScore >= 70
                  ? 'bg-orange/15 text-orange border border-orange/25'
                  : 'bg-white/[0.04] text-muted-fg border border-white/10'
            return (
            <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
              <div className="h-10 w-10 rounded-md flex items-center justify-center text-xl glass">
                {v.thumbnail}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-2">
                  <span className="truncate">{v.factClaim}</span>
                  {v.successScore > 0 && (
                    <Badge className={`text-[10px] shrink-0 ${gradeColor}`} data-mono>
                      Grade {grade}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-fg flex items-center gap-2">
                  <span>{v.creatorName}</span>
                  <span>·</span>
                  <span className="capitalize">{v.platform}</span>
                  <span>·</span>
                  <span className="font-mono" data-mono>{formatCompact(v.views)} {t('views')}</span>
                </div>
              </div>
              <div className="text-end">
                <div className="text-sm font-mono font-semibold text-lime" data-mono>
                  +${v.earningsBase + v.earningsCpm}
                </div>
                <div className="text-[10px] text-muted-fg">{t('Base+CPM')}</div>
              </div>
              {v.clicks > 0 && (
                <div className="text-end min-w-[60px]">
                  <div className="text-sm font-mono font-semibold text-orange" data-mono>
                    {formatCompact(v.clicks)}
                  </div>
                  <div className="text-[10px] text-muted-fg font-mono" data-mono>
                    {ctr.toFixed(1)}% CTR
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveVideo(v.id)
                  setView('detail')
                }}
                className="text-xs text-lime hover:text-lime hover:bg-lime/10 shrink-0 gap-1"
              >
                {t('View Analytics')}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
              {/* Boost CTA — only if views < 50% of cap (underperforming) */}
              {v.views > 0 && v.views < v.viewCap * 0.5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveVideo(v.id)
                    setView('results')
                  }}
                  className="text-xs text-orange hover:text-orange hover:bg-orange/10 shrink-0 gap-1"
                >
                  <Zap className="h-3 w-3" />
                  {t('Boost')}
                </Button>
              )}
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BudgetRow({ label, value, accent }: { label: string; value: string; accent?: 'lime' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-fg">{label}</span>
      <span className={`font-mono ${accent === 'lime' ? 'text-lime' : 'text-fg'}`} data-mono>
        {value}
      </span>
    </div>
  )
}
