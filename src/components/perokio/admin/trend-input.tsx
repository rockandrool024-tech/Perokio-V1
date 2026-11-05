'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TRENDS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { TrendingUp, Flame, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function TrendInput() {
  const { toast } = useToast()
  const t = useT()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('Trend Input')}
            <Badge variant="outline" className="text-[10px]">A04</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('MENA trend radar · TikTok / IG / YT · scanned daily')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast({ title: `🔄 ${t('Trends refreshed')}`, description: t('Pulled the latest 24h data from TikTok / IG.') })}
          >
            <RefreshCw className="h-4 w-4" /> {t('Refresh')}
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> {t('Add trend')}
          </Button>
        </div>
      </div>

      {/* Hot now */}
      <Card className="relative overflow-hidden border-chart-3/30 bg-gradient-to-br from-chart-3/10 to-transparent">
        <CardContent className="relative z-10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame className="h-5 w-5 text-chart-3" />
            </motion.div>
            <span className="font-semibold">{t('Hottest now · 24h')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TRENDS.slice(0, 3).map((tr) => (
              <div key={tr.id} className="rounded-xl bg-card/80 backdrop-blur border border-chart-3/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-semibold text-chart-3">{tr.keyword}</span>
                  <Badge variant="outline" className="text-[10px] border-chart-3/40 text-chart-3">
                    🔥 {tr.velocity}/h
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground text-[10px]">{t('Platform')}</div>
                    <div className="font-medium">{tr.platform}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">{t('Volume')}</div>
                    <div className="font-mono font-medium">{formatCompact(tr.volume)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">{t('Region')}</div>
                    <div className="font-medium">{tr.region}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 gap-1 text-xs"
                  onClick={() => toast({ title: `🎯 ${t('Trend locked')}`, description: `${t('A Fact Bundle will be drafted from')} ${tr.keyword}.` })}
                >
                  <Sparkles className="h-3 w-3" /> {t('Convert to Fact Bundle')}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All trends */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('Trend library')}</CardTitle>
          <CardDescription className="text-xs">{TRENDS.length} {t('trends · sorted by heat')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {TRENDS.map((tr, idx) => (
              <motion.div
                key={tr.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors group"
              >
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center text-sm font-mono font-bold',
                  tr.velocity > 400 ? 'bg-chart-3/10 text-chart-3' :
                  tr.velocity > 200 ? 'bg-chart-2/10 text-chart-2' :
                  'bg-muted text-muted-foreground'
                )}>
                  {tr.velocity > 400 ? '🔥' : tr.velocity > 200 ? '📈' : '·'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-sm">{tr.keyword}</span>
                    <Badge variant="outline" className="text-[10px]">{tr.category}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {tr.platform} · {tr.region} · {tr.ageHours}h
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-sm font-mono font-semibold">{formatCompact(tr.volume)}</div>
                  <div className="text-[10px] text-muted-foreground">{t('Volume')}</div>
                </div>

                <div className="text-end">
                  <div className="text-sm font-mono font-semibold text-chart-3">{tr.velocity}/h</div>
                  <div className="text-[10px] text-muted-foreground">{t('growth/h')}</div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-xs"
                  onClick={() => toast({ title: `🎯 ${t('Trend locked')}`, description: `${tr.keyword} → Fact Bundle` })}
                >
                  <Plus className="h-3 w-3" /> {t('Convert to Fact Bundle')}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
