'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CountUp } from '@/components/perokio/shared/count-up'
import { conversionApi } from '@/lib/perokio/api-client'
import { usePerokioStore } from '@/store/perokio'
import { useT } from '@/lib/perokio/i18n'
import { easeEditorial, springSoft } from '@/lib/perokio/motion'
import {
  MousePointerClick, ShoppingBag, TrendingUp, DollarSign,
  Zap, ArrowUpRight, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// A08 Lead Magnet — Studio Admin conversion dashboard
// ============================================================================
// Displays the ROI engine metrics:
//   - Total Clicks (from CtaClickEvent)
//   - Total Orders (from TastyIgniterOrder)
//   - Conversion Rate (Orders / Clicks * 100)
//   - Attributed Revenue (sum of TastyIgniterOrder.amountCents)
// ============================================================================

export function LeadMagnet() {
  const t = useT()
  const openCampaignStudio = usePerokioStore((s) => s.openCampaignStudio)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await conversionApi.getStats()
        setStats(data)
      } catch (e) {
        // Fallback to mock data if API is unavailable
        setStats({
          totalClicks: 0,
          totalOrders: 0,
          conversionRate: 0,
          attributedRevenueCents: 0,
          attributedRevenueUsd: 0,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton-premium rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton-premium rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-lime" />
            Lead Magnet
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">A08</Badge>
          </h2>
          <p className="text-sm text-muted-fg mt-0.5">
            Conversion tracking · TastyIgniter + CTA clicks → orders → revenue
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 glass border-white/10 hover:bg-white/5"
          onClick={async () => {
            // Simulate a test order
            await conversionApi.triggerOrder({
              orderId: `TI-TEST-${Date.now()}`,
              amountCents: 1500,
            })
            const fresh = await conversionApi.getStats()
            setStats(fresh)
          }}
        >
          <Zap className="h-3.5 w-3.5 text-orange" />
          Simulate Order
        </Button>
      </div>

      {/* === 4-card metric grid === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks — clickable → CampaignStudio Phase 3 */}
        <div onClick={() => openCampaignStudio(3)} className="cursor-pointer">
          <MetricCard
            icon={MousePointerClick}
            label="Total Clicks"
            value={stats.totalClicks}
            accent="orange"
            delay={0}
          />
        </div>

        {/* Total Orders */}
        <MetricCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats.totalOrders}
          accent="lime"
          delay={0.1}
        />

        {/* Conversion Rate */}
        <MetricCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={stats.conversionRate}
          suffix="%"
          accent="teal"
          delay={0.2}
          format={(n) => n.toFixed(1)}
        />

        {/* Attributed Revenue — clickable → CampaignStudio Phase 3 */}
        <div onClick={() => openCampaignStudio(3)} className="cursor-pointer">
          <MetricCard
            icon={DollarSign}
            label="Attributed Revenue"
            value={stats.attributedRevenueUsd}
            prefix="$"
            accent="lime"
            delay={0.3}
            format={(n) => n.toFixed(2)}
          />
        </div>
      </div>

      {/* === Per-brand breakdown === */}
      {stats.perBrand && stats.perBrand.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeEditorial, delay: 0.4 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-serif text-lg font-semibold mb-4">Per-Brand Breakdown</h3>
          <div className="space-y-2">
            {stats.perBrand.map((brand: any, idx: number) => (
              <motion.div
                key={brand.brandId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05, ...springSoft }}
                className="flex items-center gap-4 p-3 rounded-xl glass hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm font-mono text-muted-fg" data-mono>
                    {brand.brandId.substring(0, 20)}...
                  </div>
                </div>
                <div className="text-center min-w-[80px]">
                  <div className="text-sm font-mono font-bold text-orange" data-mono>
                    {brand.clicks}
                  </div>
                  <div className="text-[10px] text-muted-fg">clicks</div>
                </div>
                <div className="text-center min-w-[80px]">
                  <div className="text-sm font-mono font-bold text-lime" data-mono>
                    {brand.orders}
                  </div>
                  <div className="text-[10px] text-muted-fg">orders</div>
                </div>
                <div className="text-center min-w-[80px]">
                  <div className="text-sm font-mono font-bold text-teal" data-mono>
                    {brand.conversionRate}%
                  </div>
                  <div className="text-[10px] text-muted-fg">CVR</div>
                </div>
                <div className="text-end min-w-[100px]">
                  <div className="text-sm font-mono font-bold text-lime" data-mono>
                    ${brand.revenueUsd}
                  </div>
                  <div className="text-[10px] text-muted-fg">revenue</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* === Webhook documentation === */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">
          TastyIgniter Webhook Endpoints
        </h4>
        <div className="space-y-2 font-mono text-[11px]" data-mono>
          <div className="flex items-center gap-2">
            <Badge className="text-[9px] bg-orange/15 text-orange border border-orange/25">POST</Badge>
            <code className="text-muted-fg">/api/webhooks/tastyigniter/cta</code>
            <span className="text-subtle">— record a CTA click</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[9px] bg-lime/15 text-lime border border-lime/25">POST</Badge>
            <code className="text-muted-fg">/api/webhooks/tastyigniter/order</code>
            <span className="text-subtle">— record a completed order</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[9px] bg-white/[0.04] text-muted-fg border border-white/10">GET</Badge>
            <code className="text-muted-fg">/api/conversion/stats/:brandId</code>
            <span className="text-subtle">— per-brand stats</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[9px] bg-white/[0.04] text-muted-fg border border-white/10">GET</Badge>
            <code className="text-muted-fg">/api/conversion/stats</code>
            <span className="text-subtle">— all-brands stats (admin)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MetricCard — count-up animated metric card
// ============================================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
  accent,
  delay = 0,
  format,
}: {
  icon: typeof Zap
  label: string
  value: number
  prefix?: string
  suffix?: string
  accent: 'lime' | 'orange' | 'teal'
  delay?: number
  format?: (n: number) => string
}) {
  const colorClass =
    accent === 'lime' ? 'text-lime' :
    accent === 'orange' ? 'text-orange' : 'text-teal'
  const bgClass =
    accent === 'lime' ? 'glass-lime' :
    accent === 'orange' ? 'glass-orange' : 'glass'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...springSoft }}
      className={cn('glass rounded-2xl p-4 relative overflow-hidden', bgClass)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-fg uppercase tracking-wider font-medium">{label}</span>
        <Icon className={cn('h-4 w-4', colorClass)} />
      </div>
      <div className={cn('text-3xl font-mono font-bold tabular', colorClass)} data-mono>
        <CountUp
          value={value}
          delay={delay + 0.1}
          format={(n) => `${prefix}${format ? format(n) : Math.round(n).toLocaleString()}${suffix}`}
        />
      </div>
    </motion.div>
  )
}
