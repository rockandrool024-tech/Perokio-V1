'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FACTS, CREATORS, VIDEOS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { Eye, Users, Activity, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const STATUS_BADGE: Record<string, string> = {
  live: '🟢 On Wall',
  claimed: '🟡 Claimed',
  locked: '🔴 Locked',
  funded: '💵 Funded',
  in_edit: '✏️ In Edit',
}

const HEALTH = [
  { name: 'B11 lock engine', status: '✓ Healthy', detail: '0 unverified lines' },
  { name: 'Postiz publishing', status: '✓ Healthy', detail: 'TikTok + IG OK' },
  { name: 'Flouci payouts', status: '⚠ Degraded', detail: 'Some withdrawals delayed' },
  { name: 'Hyperframe editor', status: '✓ Healthy', detail: 'Response < 200ms' },
]

// §1: Growth metrics now pulled from useGrowthStore (was hardcoded mock)
import {
  useGrowthStore,
  useKFactor,
  useShareRate,
  useInviteAcceptance,
  PUBLISH_RATE,
} from '@/lib/perokio/use-growth-store'

const GROWTH_TONE_CLASS: Record<'lime' | 'orange', string> = {
  lime: 'text-primary',
  orange: 'text-chart-2',
}

export function WallMonitor() {
  const t = useT()
  const pick = usePick()
  const wallFacts = FACTS.filter((f) => ['live', 'claimed', 'funded', 'locked', 'in_edit'].includes(f.status))
  const activeCreators = CREATORS.filter((c) => c.reliabilityScore > 80)
  const pendingLocked = VIDEOS.filter((v) => v.stage === 'locked_pending')
  const lockedLines = FACTS.reduce((s, f) => s + f.scriptLines.filter((l) => l.sourceId).length, 0)

  // §1: Pull live growth metrics from the store (was hardcoded)
  const kFactor = useKFactor()
  const shareRate = useShareRate()
  const inviteAcceptance = useInviteAcceptance()
  const profileShares = useGrowthStore((s) => s.profileShares)
  const factShares = useGrowthStore((s) => s.factShares)
  const invitesSent = useGrowthStore((s) => s.invitesSent)

  const growthMetrics = [
    { label: 'K-factor', value: kFactor.toFixed(2), hint: `${invitesSent} invites × 0.67 / ${5} creators`, tone: 'lime' as const },
    { label: 'Share rate', value: `${Math.round(shareRate)}%`, hint: `${profileShares + factShares} shares / ${5} creators`, tone: 'lime' as const },
    { label: 'Invite acceptance', value: `${Math.round(inviteAcceptance)}%`, hint: 'of invites accepted', tone: 'orange' as const },
    { label: 'Publish rate', value: `${PUBLISH_RATE}/day`, hint: 'avg videos published daily', tone: 'orange' as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t('Wall Monitor')}
          <Badge variant="outline" className="text-[10px]">A05</Badge>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('Real-time monitoring of the Wall, creators, output & B11 status')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-primary/30">
          <div className="absolute -top-6 -end-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
          <CardContent className="relative z-10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Eye className="h-3.5 w-3.5 text-primary" /> {t('Live total views')}
            </div>
            <div className="text-2xl font-bold tabular-nums text-primary">
              {formatCompact(FACTS.reduce((s, f) => s + f.totalViews, 0))}
            </div>
            <div className="text-[10px] text-primary mt-1">{t('+47 in the last 3s')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t('Verified facts')}
            </div>
            <div className="text-2xl font-bold tabular-nums">{FACTS.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {lockedLines} {t('lines locked')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5 text-chart-2" /> {t('Active creators')}
            </div>
            <div className="text-2xl font-bold tabular-nums">{activeCreators.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('of')} {CREATORS.length} {t('total')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Activity className="h-3.5 w-3.5 text-chart-3" /> {t('Videos pending brand review')}
            </div>
            <div className="text-2xl font-bold tabular-nums text-chart-3">{pendingLocked.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('needs brand action')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Wall status */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('Facts Wall · live status')}</CardTitle>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {t('Live')}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {wallFacts.map((f, idx) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl border border-border/60 p-3 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{f.code}</span>
                  <Badge
                    variant="outline"
                    className={
                      f.status === 'live' ? 'border-primary/40 text-primary text-[10px]' :
                      f.status === 'claimed' ? 'border-chart-2/40 text-chart-2 text-[10px]' :
                      f.status === 'locked' ? 'border-chart-3/40 text-chart-3 text-[10px]' :
                      'text-[10px]'
                    }
                  >
                    {t(STATUS_BADGE[f.status])}
                  </Badge>
                </div>

                <p className="text-xs font-medium leading-snug line-clamp-2 mb-2">{pick(f.claim, f.claimAr)}</p>

                <div className="text-[10px] text-muted-foreground mb-2">
                  {f.brandName} · {f.trendTag}
                </div>

                {/* Claimers */}
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] text-muted-foreground me-1">{t('Claimed by:')}</span>
                  {f.claimedBy.length > 0 ? (
                    <div className="flex -space-x-1.5 rtl:space-x-reverse">
                      {f.claimedBy.map((id) => {
                        const c = CREATORS.find((x) => x.id === id)
                        return (
                          <div
                            key={id}
                            className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-chart-3 border border-background flex items-center justify-center text-[10px]"
                            title={c?.name}
                          >
                            {c?.avatar}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">{t('No claims yet')}</span>
                  )}
                  <span className="ms-2 text-[10px] text-muted-foreground">
                    {f.claimedBy.length}/{f.maxCreators}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>{t('Base Fee')} ${f.baseFee}</span>
                  {f.totalViews > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatCompact(f.totalViews)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    {f.scriptLines.filter((l) => l.sourceId).length}/{f.scriptLines.length}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health checks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('Platform health')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {HEALTH.map((h) => (
              <div key={h.name} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{t(h.name)}</span>
                  <div className={`h-2 w-2 rounded-full ${h.status.includes('✓') ? 'bg-primary' : 'bg-chart-2'} animate-pulse`} />
                </div>
                <div className={`text-xs font-semibold mb-0.5 ${h.status.includes('✓') ? 'text-primary' : 'text-chart-2'}`}>
                  {t(h.status)}
                </div>
                <div className="text-[10px] text-muted-foreground">{t(h.detail)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Growth panel — §1: pulls from useGrowthStore (live tracking) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('Growth')}
            <Badge variant="outline" className="text-[10px] ms-2">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {growthMetrics.map((m) => (
              <div
                key={m.label}
                className="glass rounded-xl p-3 border border-border/60"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t(m.label)}
                </div>
                <div
                  className={`text-2xl font-bold font-mono ${GROWTH_TONE_CLASS[m.tone]}`}
                  data-mono
                >
                  {m.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {t(m.hint)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
