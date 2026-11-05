'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS, TRANSACTIONS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { formatUSD } from '@/lib/perokio/live'
import { Wallet, CreditCard, TrendingUp, Download, ArrowDownCircle, ArrowUpCircle, Receipt } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useToast } from '@/hooks/use-toast'

const monthlyData = [
  { m: 'Jun', spend: 240 },
  { m: 'Jul', spend: 380 },
  { m: 'Aug', spend: 540 },
  { m: 'Sep', spend: 720 },
  { m: 'Oct', spend: 980 },
  { m: 'Nov', spend: 580 },
]

const TX_LABELS: Record<string, string> = {
  brand_topup: 'Wallet top-up',
  subscription: 'Subscription charge',
  creator_payout: 'Creator payout',
  extra_video: 'Extra video credit',
  refund: 'Refund',
}

export function Billing() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const transactions = TRANSACTIONS.filter((tx) => tx.party === brand.name)
  const { toast } = useToast()
  const t = useT()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          {t('Billing')}
          <Badge variant="outline" className="text-[10px]">B13</Badge>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{brand.logo} {brand.name} · {brand.tier}</p>
      </div>

      {/* Wallet summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-primary/30">
          <div className="absolute -top-6 -end-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
          <CardContent className="relative z-10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Wallet className="h-4 w-4 text-primary" /> {t('Current balance')}
            </div>
            <div className="text-3xl font-bold tabular-nums">{formatUSD(brand.walletBalance)}</div>
            <Button
              className="mt-3 w-full gap-2"
              onClick={() => toast({ title: `✅ ${t('Top-up successful')}`, description: `${formatUSD(500)} ${t('added to your wallet.')}` })}
            >
              <ArrowDownCircle className="h-4 w-4" /> {t('Top up $500')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4 text-chart-2" /> {t('Spent this month')}
            </div>
            <div className="text-3xl font-bold tabular-nums">{formatUSD(brand.walletSpent)}</div>
            <div className="mt-3 text-xs text-muted-foreground">
              {((brand.walletSpent / brand.monthlyBudget) * 100).toFixed(0)}% {t('of')} {formatUSD(brand.monthlyBudget)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <CreditCard className="h-4 w-4 text-chart-5" /> {t('Subscription')}
            </div>
            <div className="text-3xl font-bold tabular-nums">{formatUSD(brand.subscription)}{t('/mo')}</div>
            <div className="mt-3 text-xs text-muted-foreground">
              {t('Video credits')} {brand.videoCreditsUsed}/{brand.videoCredits} · $12/{t('videos')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spend chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('Monthly spend trend')}</CardTitle>
          <CardDescription className="text-xs">{t('Last 6 months (USD)')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [formatUSD(v), t('Spend')]}
              />
              <Bar dataKey="spend" fill="#16a34a" radius={[6, 6, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('Transactions')}</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <Download className="h-3 w-3" /> {t('Export CSV')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
            {transactions.map((tx) => {
              const isIn = tx.type === 'brand_topup'
              return (
                <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isIn ? 'bg-primary/10' : 'bg-muted'}`}>
                    {isIn ? <ArrowDownCircle className="h-4 w-4 text-primary" /> : <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{t(TX_LABELS[tx.type] || tx.type)}</div>
                    <div className="text-xs text-muted-foreground">
                      {tx.createdAt}
                      {tx.factCode && <span className="font-mono ms-2">{tx.factCode}</span>}
                      <span className="ms-2">· {tx.method}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className={`font-mono font-semibold ${isIn ? 'text-primary' : 'text-foreground'}`}>
                      {isIn ? '+' : '-'}{formatUSD(tx.amount)}
                    </div>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">{tx.status}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
