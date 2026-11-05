'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CREATORS, VIDEOS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { formatCompact, formatUSD } from '@/lib/perokio/live'
import { Star, Crown, Trophy, Eye, Film, Shield, TrendingUp } from 'lucide-react'

export function CreatorProfile() {
  const creator = CREATORS[0]
  const myVideos = VIDEOS.filter((v) => v.creatorId === creator.id)
  const t = useT()

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary/30 via-chart-2/20 to-chart-3/20" />
        <CardContent className="relative -mt-12 p-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-5xl border-4 border-background">
              {creator.avatar}
            </div>
            <div className="flex-1 pt-12">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-2xl font-bold">{creator.name}</h2>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Crown className="h-3 w-3" /> {creator.level}
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Star className="h-3 w-3 fill-current" /> {creator.rating}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {creator.handle} · {creator.location}
              </div>
              <div className="text-xs text-primary font-semibold mt-1">
                {creator.rank}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-12 text-center">
              <div>
                <div className="text-xl font-bold tabular-nums">{creator.completedVideos}</div>
                <div className="text-[10px] text-muted-foreground">{t('videos')}</div>
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums">{formatCompact(creator.followers)}</div>
                <div className="text-[10px] text-muted-foreground">{t('followers')}</div>
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums">{creator.streak}</div>
                <div className="text-[10px] text-muted-foreground">{t('Streak')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <Eye className="h-4 w-4 text-primary mb-2" />
            <div className="text-2xl font-bold tabular-nums">142K</div>
            <div className="text-xs text-muted-foreground">{t('Total views')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Film className="h-4 w-4 text-chart-2 mb-2" />
            <div className="text-2xl font-bold tabular-nums">98%</div>
            <div className="text-xs text-muted-foreground">{t('Approval rate')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Shield className="h-4 w-4 text-chart-3 mb-2" />
            <div className="text-2xl font-bold tabular-nums">{creator.reliabilityScore}</div>
            <div className="text-xs text-muted-foreground">{t('Reliability score')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-4 w-4 text-chart-5 mb-2" />
            <div className="text-2xl font-bold tabular-nums">{formatUSD(creator.totalEarned)}</div>
            <div className="text-xs text-muted-foreground">{t('Total earned')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" /> {t('My portfolio')}
            <Badge variant="secondary" className="text-[10px]">{myVideos.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {myVideos.map((v) => (
              <div key={v.id} className="group relative rounded-xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all cursor-pointer">
                <div className="aspect-[9/16] bg-gradient-to-br from-primary/15 via-chart-2/10 to-chart-4/15 flex items-center justify-center text-5xl">
                  {v.thumbnail}
                </div>
                <div className="absolute top-1.5 start-1.5">
                  <Badge variant="outline" className="text-[9px] bg-black/40 text-white border-white/30 backdrop-blur">
                    {v.platform}
                  </Badge>
                </div>
                <div className="absolute bottom-1.5 start-1.5 end-1.5">
                  <Badge variant="outline" className="text-[9px] bg-black/40 text-white border-white/30 backdrop-blur font-mono">
                    {formatCompact(v.views)} {t('views')}
                  </Badge>
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-mono text-muted-foreground mb-0.5">{v.factCode}</div>
                  <div className="text-xs font-medium line-clamp-2 leading-tight">{v.factClaim}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-chart-2" /> {t('Achievements')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { icon: Star, label: t('7-day streak'), color: 'text-chart-3', unlocked: true },
              { icon: Crown, label: t('Top 5%'), color: 'text-chart-5', unlocked: true },
              { icon: Star, label: t('5-star rated'), color: 'text-chart-2', unlocked: true },
              { icon: Film, label: t('50 videos'), color: 'text-primary', unlocked: false },
              { icon: Trophy, label: t('Monthly champion'), color: 'text-chart-3', unlocked: false },
              { icon: Shield, label: t('Gold creator'), color: 'text-chart-4', unlocked: false },
            ].map((a, i) => {
              const Icon = a.icon
              return (
                <div
                  key={i}
                  className={`rounded-xl p-3 border text-center ${
                    a.unlocked
                      ? 'border-border/60 bg-muted/30'
                      : 'border-border/30 bg-muted/10 opacity-40'
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-1.5 ${a.unlocked ? a.color : 'text-muted-foreground'}`} />
                  <div className="text-[10px] font-medium">{a.label}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
