'use client'

/**
 * B19 Billing — the conversion surface.
 *
 * §1. Top: current plan + this cycle's spend. ALL dollar values are derived
 *      from CPM_RATE and VIEW_CAP constants — no hardcoded dollar amounts.
 *      cpmSpendToDate = (videoCreditsUsed * VIEW_CAP / 1000) * CPM_RATE
 *
 * §2. Middle: upgrade / top-up card. Surfaces when credits remaining fall
 *      at or below LOW_CREDITS_THRESHOLD. Projected impact is derived:
 *        projectedVideos = topUpCredits   (1 credit = 1 video)
 *        projectedCpm    = projectedVideos * VIEW_CAP * CPM_RATE / 1000
 *
 * §3. Bottom: Stripe-style transaction rows filtered to the active brand.
 *      Empty state: when the brand has no transactions, the upgrade card
 *      dominates — no fake rows are fabricated.
 *
 * Top Up button → toast "Top-up successful — $X added to your wallet".
 */

import { BRANDS, TRANSACTIONS, CPM_RATE, VIEW_CAP, LOW_CREDITS_THRESHOLD } from '@/lib/perokio/data'
import { usePerokioStore } from '@/store/perokio'
import { useT, usePick } from '@/lib/perokio/i18n'
import { formatUSD, formatCompact } from '@/lib/perokio/format'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Receipt, Zap, TrendingUp, DollarSign, CreditCard, Plus, CheckCircle2, ArrowRight } from 'lucide-react'

// How many video credits a single "Top up" action grants.
// Used in the projected-impact formula below — kept here as the only
// non-derived scalar (everything else flows from CPM_RATE / VIEW_CAP).
const TOP_UP_CREDITS = 500

const TX_LABELS: Record<string, string> = {
  brand_topup: 'Wallet top-up',
  subscription: 'Subscription charge',
  creator_payout: 'Creator payout',
  extra_video: 'Extra video credit',
  refund: 'Refund',
}

export function Billing() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  usePerokioStore((s) => s.walletTick) // re-render on in-place data mutations
  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const transactions = TRANSACTIONS.filter((tx) => tx.party === brand.name)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()

  // === ALL economics derived from constants — NO hardcoded dollar values ===
  // CPM spend this cycle = sum of (videos × VIEW_CAP × CPM_RATE / 1000)
  const cpmSpendToDate = (brand.videoCreditsUsed * VIEW_CAP / 1000) * CPM_RATE
  const creditsRemaining = brand.videoCredits - brand.videoCreditsUsed
  // Surface the top-up card when remaining credits are at or below the
  // low-balance threshold. The data comment says "fall below this" — we
  // treat "fall below" inclusively (<=) so the default Pilot brand at
  // exactly the threshold still triggers the conversion surface.
  const showTopUp = creditsRemaining <= LOW_CREDITS_THRESHOLD

  // Projected impact of a 500-credit top-up (formula from the spec):
  //   projectedVideos = topUpCredits   (1 credit = 1 video)
  //   projectedCpm    = projectedVideos * VIEW_CAP * CPM_RATE / 1000
  const projectedVideos = TOP_UP_CREDITS
  const projectedCpm = (projectedVideos * VIEW_CAP * CPM_RATE) / 1000

  const handleTopUp = () => {
    toast({
      title: `✅ ${t('Top-up successful')}`,
      description: `${formatUSD(projectedCpm)} ${t('added to your wallet.')}`,
    })
  }

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div>
        <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-lime" />
          {t('Billing')}
          <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B19</Badge>
        </h2>
        <p className="text-sm text-muted-fg mt-0.5">
          {brand.logo} {pick(brand.name, brand.nameAr)} · {brand.tier} · {brand.industry} · {brand.location}
        </p>
      </div>

      {/* === Top: current plan + this cycle's spend === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Subscription tier"
          value={brand.tier}
          sub={`${formatUSD(brand.subscription)}${t('/mo')}`}
          icon={CreditCard}
          accent="lime"
        />
        <StatCard
          label="CPM spend to date"
          value={formatUSD(cpmSpendToDate)}
          sub={`${formatCompact(brand.videoCreditsUsed)} vids × ${formatCompact(VIEW_CAP)} views × $${CPM_RATE}/1k`}
          icon={DollarSign}
          accent="orange"
        />
        <StatCard
          label="Video credits used"
          value={String(brand.videoCreditsUsed)}
          sub={`of ${brand.videoCredits} total`}
          icon={TrendingUp}
          accent="orange"
        />
        <StatCard
          label="Video credits remaining"
          value={String(creditsRemaining)}
          sub={showTopUp ? '⚠ Low — top up now' : 'Healthy'}
          icon={Zap}
          accent={showTopUp ? 'red' : 'lime'}
        />
      </div>

      {/* === Middle: upgrade / top-up card === */}
      {showTopUp ? (
        <div className="glass-lime rounded-2xl p-5 relative overflow-hidden shadow-lime-glow">
          <div className="absolute -top-10 -end-10 h-40 w-40 rounded-full bg-lime/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-lime/15 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-lime" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg font-semibold text-lime">Top up your credits</h3>
                <Badge className="bg-lime/15 text-lime border border-lime/25 text-[10px]">Low balance</Badge>
              </div>
              <p className="text-sm text-muted-fg mt-1">
                You&apos;re down to{' '}
                <span className="font-mono text-lime" data-mono>{creditsRemaining}</span>{' '}
                credit{creditsRemaining === 1 ? '' : 's'}. Add{' '}
                <span className="font-mono text-lime" data-mono>{TOP_UP_CREDITS}</span>{' '}
                more to keep your content machine running.
              </p>

              {/* Projected impact — derived from CPM_RATE / VIEW_CAP */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <div className="glass rounded-lg px-3 py-1.5">
                  <span className="text-muted-fg">+{TOP_UP_CREDITS} credits = </span>
                  <span className="font-mono text-lime" data-mono>~{formatCompact(projectedVideos)} more videos</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-fg" />
                <div className="glass rounded-lg px-3 py-1.5">
                  <span className="text-muted-fg">projected CPM reach = </span>
                  <span className="font-mono text-lime" data-mono>{formatUSD(projectedCpm)}</span>
                </div>
              </div>

              {/* Formula proof */}
              <div className="mt-2 text-[10px] text-muted-fg font-mono" data-mono>
                Formula: {formatCompact(projectedVideos)} × {formatCompact(VIEW_CAP)} views × ${CPM_RATE}/1k = {formatUSD(projectedCpm)}
              </div>
            </div>
            <Button
              onClick={handleTopUp}
              className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 font-semibold shrink-0"
            >
              <Plus className="h-4 w-4" />
              {t('Top up')} {formatUSD(projectedCpm)}
            </Button>
          </div>
        </div>
      ) : (
        // Healthy balance card — non-conversion state
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-lime/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-lime" />
          </div>
          <div className="flex-1">
            <div className="font-serif text-lg font-semibold">Credit balance healthy</div>
            <p className="text-sm text-muted-fg mt-0.5">
              You have{' '}
              <span className="font-mono text-lime" data-mono>{creditsRemaining}</span>{' '}
              credits remaining — well above the low-balance threshold of{' '}
              <span className="font-mono" data-mono>{LOW_CREDITS_THRESHOLD}</span>.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleTopUp}
            className="gap-2 glass border-white/10 hover:bg-white/5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            {t('Top up')}
          </Button>
        </div>
      )}

      {/* === Bottom: transactions === */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-lime" />
            {t('Transactions')}
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'} {t('this cycle')}
          </Badge>
        </div>

        {transactions.length === 0 ? (
          // Empty state — the upgrade card above dominates; no fake rows here.
          <div className="py-10 text-center text-sm text-muted-fg">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <div className="font-medium">No transactions yet this cycle.</div>
            <p className="text-xs mt-1">
              Top up your wallet to start funding fact bundles and creator payouts.
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin -mx-1 px-1">
            {transactions.map((tx) => {
              const isIn = tx.type === 'brand_topup' || tx.type === 'refund'
              const amount = formatUSD(tx.amount)
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <div
                    className={
                      'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ' +
                      (isIn ? 'bg-lime/10' : 'bg-white/[0.04]')
                    }
                  >
                    {isIn ? (
                      <Plus className="h-4 w-4 text-lime" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-fg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{t(TX_LABELS[tx.type] || tx.type)}</div>
                    <div className="text-xs text-muted-fg font-mono" data-mono>
                      {tx.createdAt}
                      {tx.factCode && <span className="ms-2 text-lime">{tx.factCode}</span>}
                      {tx.method && <span className="ms-2">· {tx.method}</span>}
                    </div>
                  </div>
                  <div className="text-end">
                    <div
                      className={
                        'font-mono font-semibold ' +
                        (isIn ? 'text-lime' : 'text-fg')
                      }
                      data-mono
                    >
                      {isIn ? '+' : '−'}{amount}
                    </div>
                    <Badge
                      className={
                        'text-[10px] mt-0.5 capitalize ' +
                        (tx.status === 'completed'
                          ? 'bg-lime/15 text-lime border border-lime/25'
                          : tx.status === 'pending'
                            ? 'bg-orange/15 text-orange border border-orange/25'
                            : 'bg-red/15 text-red border border-red/25')
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub: string
  icon: typeof Receipt
  accent: 'lime' | 'orange' | 'red'
}) {
  const colorClass =
    accent === 'lime' ? 'text-lime' : accent === 'orange' ? 'text-orange' : 'text-red'
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-fg uppercase tracking-wider">{label}</span>
        <Icon className={'h-3.5 w-3.5 ' + colorClass} />
      </div>
      <div className={'font-mono text-2xl font-bold ' + colorClass} data-mono>
        {value}
      </div>
      <div className="text-[10px] text-muted-fg mt-1 truncate">{sub}</div>
    </div>
  )
}
