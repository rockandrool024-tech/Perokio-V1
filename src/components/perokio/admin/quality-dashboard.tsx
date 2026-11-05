'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ShieldCheck, Clock, BarChart3, AlertCircle } from 'lucide-react'
import { useT } from '@/lib/perokio/i18n'

// Mock aggregated QA metrics
const QA_METRICS = [
  {
    icon: Clock,
    label: 'Avg verification time',
    value: '4.2h',
    hint: 'from draft to QA-approved',
    tone: 'lime' as const,
  },
  {
    icon: BarChart3,
    label: 'Source diversity',
    value: '3.2',
    hint: 'sources/fact avg',
    tone: 'lime' as const,
  },
  {
    icon: ShieldCheck,
    label: 'Rejection rate',
    value: '12%',
    hint: 'of submitted facts rejected',
    tone: 'orange' as const,
  },
  {
    icon: AlertCircle,
    label: 'Top rejection reason',
    value: 'Missing source link',
    hint: '#1 cause of QA rejection',
    tone: 'red' as const,
  },
]

const TONE_CLASS: Record<'lime' | 'orange' | 'red', string> = {
  lime: 'text-primary',
  orange: 'text-chart-2',
  red: 'text-chart-3',
}

const TONE_BG: Record<'lime' | 'orange' | 'red', string> = {
  lime: 'bg-primary/10',
  orange: 'bg-chart-2/10',
  red: 'bg-chart-3/10',
}

// Mock: QA items by status — drives the bar chart
const STATUS_DATA = [
  { status: 'Approved', count: 42, fill: '#D8EF70' },
  { status: 'In Review', count: 18, fill: '#ED7A42' },
  { status: 'Pending', count: 11, fill: '#6FD3C7' },
  { status: 'Rejected', count: 7, fill: '#E5484D' },
]

export function QualityDashboard() {
  const t = useT()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t('Quality Dashboard')}
          <Badge variant="outline" className="text-[10px]">A06</Badge>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Aggregated QA metrics · verification throughput, source rigor, rejection funnel')}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QA_METRICS.map((m) => (
          <Card key={m.label} className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-8 w-8 rounded-lg ${TONE_BG[m.tone]} flex items-center justify-center`}>
                  <m.icon className={`h-4 w-4 ${TONE_CLASS[m.tone]}`} />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t(m.label)}
                </div>
              </div>
              <div
                className={`font-mono font-bold ${TONE_CLASS[m.tone]} ${
                  m.value.length > 10 ? 'text-base' : 'text-2xl'
                }`}
                data-mono
              >
                {m.value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {t(m.hint)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status distribution bar chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('QA items by status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={STATUS_DATA}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  background: 'rgba(10,15,13,0.95)',
                  border: '1px solid rgba(216,239,112,0.3)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#fff',
                  backdropFilter: 'blur(20px)',
                }}
                formatter={(v: number) => [v, t('Items')]}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-border/60">
            {STATUS_DATA.map((s) => (
              <div key={s.status} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: s.fill }}
                />
                <span className="text-muted-foreground">{t(s.status)}</span>
                <span className="font-mono font-semibold" data-mono>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
