'use client'

/**
 * B01-B07 Brand Onboarding Steps
 *
 * Per Cycle 1 design rationale:
 *   - One question per screen
 *   - One "why" sentence
 *   - Single typeface accent (Fraunces for the question, Inter for body)
 *   - No celebration animations until B07
 *   - Whitespace dominates
 *
 * Each step is a self-contained component that reads/writes from the shared
 * brandOnboardingStore. The wizard shell handles navigation + progress bar.
 */

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import {
  brandOnboardingStore,
  INDUSTRIES,
  TIERS,
  REGIONS,
  LOGOS,
  TREND_TEMPLATES,
  type TrendTemplate,
} from '@/lib/perokio/onboarding-store'
import { CREATORS } from '@/lib/perokio/data'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { easeEditorial } from '@/lib/perokio/motion'
import {
  Check, ArrowRight, ShieldCheck, Sparkles, TrendingUp, Wallet,
  Crown, Users, Flame, Zap,
} from 'lucide-react'

// ============================================================================
// Shared question header — Fraunces serif, generous spacing
// ============================================================================
function Question({
  number,
  title,
  why,
}: {
  number: string
  title: string
  why: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={easeEditorial}
      className="mb-8"
    >
      <div className="text-xs font-mono text-muted-fg tracking-widest mb-3" data-mono>
        {number}
      </div>
      <h1 className="font-serif text-3xl lg:text-4xl font-semibold leading-tight tracking-tight mb-3">
        {title}
      </h1>
      <p className="text-sm text-muted-fg leading-relaxed max-w-md">{why}</p>
    </motion.div>
  )
}

// ============================================================================
// B01 — Welcome
// ============================================================================
export function Step01Welcome() {
  const next = brandOnboardingStore((s) => s.next)
  const set = brandOnboardingStore((s) => s.set)

  const handleStart = () => {
    set('welcomed', true)
    next()
  }

  return (
    <div>
      <Question
        number="01"
        title="Welcome to Perokio."
        why="You're 5 minutes away from funding your first verified fact. Brands fund facts, creators film them, Perokio locks the truth. No agency, no middleman, no hallucinations."
      />

      {/* What happens in the next 6 steps — a calm preview, not a feature grid */}
      <div className="space-y-3 mb-8">
        {[
          { label: 'Tell us about your brand', icon: Crown },
          { label: 'Pick your audience & industry', icon: Users },
          { label: 'Choose a plan & budget', icon: Wallet },
          { label: 'Select your first fact from live trends', icon: TrendingUp },
          { label: 'Top up your wallet', icon: Sparkles },
          { label: 'Invite creators to claim your fact', icon: Flame },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...easeEditorial, delay: i * 0.05 }}
              className="flex items-center gap-3 text-sm"
            >
              <div className="h-8 w-8 rounded-lg glass flex items-center justify-center">
                <Icon className="h-4 w-4 text-lime" />
              </div>
              <span className="text-fg/80">{item.label}</span>
            </motion.div>
          )
        })}
      </div>

      <AnimatedCTA onClick={handleStart} className="w-full justify-center !py-3 !text-base">
        Begin setup
        <ArrowRight className="h-4 w-4" />
      </AnimatedCTA>
    </div>
  )
}

// ============================================================================
// B02 — Brand identity (name + logo + location)
// ============================================================================
export function Step02Identity() {
  const brandName = brandOnboardingStore((s) => s.brandName)
  const brandLogo = brandOnboardingStore((s) => s.brandLogo)
  const brandLocation = brandOnboardingStore((s) => s.brandLocation)
  const set = brandOnboardingStore((s) => s.set)
  const next = brandOnboardingStore((s) => s.next)

  const canContinue = brandName.trim().length > 1

  return (
    <div>
      <Question
        number="02"
        title="What's your brand called?"
        why="This is how creators will see you on the Facts Wall. Pick a name your audience recognizes."
      />

      <div className="space-y-5">
        {/* Brand name */}
        <div>
          <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
            Brand name
          </label>
          <input
            type="text"
            autoFocus
            value={brandName}
            onChange={(e) => set('brandName', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canContinue && next()}
            placeholder="e.g., Café Dar Zaitouna"
            className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/[0.02] text-base focus:outline-none focus:ring-2 focus:ring-lime/40 placeholder:text-subtle"
          />
        </div>

        {/* Logo picker — emoji grid */}
        <div>
          <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
            Logo (pick an emoji)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {LOGOS.map((logo) => (
              <button
                key={logo}
                onClick={() => set('brandLogo', logo)}
                className={cn(
                  'h-12 rounded-xl text-2xl flex items-center justify-center transition-all border',
                  brandLogo === logo
                    ? 'glass-lime border-lime/40 scale-105'
                    : 'glass border-white/10 hover:bg-white/[0.05]',
                )}
              >
                {logo}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
            Location
          </label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => set('brandLocation', region)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm transition-all border',
                  brandLocation === region
                    ? 'bg-lime/15 text-lime border-lime/30'
                    : 'glass border-white/10 text-muted-fg hover:text-fg',
                )}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <AnimatedCTA
          onClick={next}
          disabled={!canContinue}
          className="w-full justify-center !py-3"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </AnimatedCTA>
      </div>
    </div>
  )
}

// ============================================================================
// B03 — Industry & audience
// ============================================================================
export function Step03Industry() {
  const industry = brandOnboardingStore((s) => s.industry)
  const audienceRegion = brandOnboardingStore((s) => s.audienceRegion)
  const set = brandOnboardingStore((s) => s.set)
  const next = brandOnboardingStore((s) => s.next)

  const canContinue = industry !== ''

  return (
    <div>
      <Question
        number="03"
        title="What industry are you in?"
        why="We use this to match you with creators whose audience already cares about your category. The right creator = 3x views."
      />

      <div className="grid grid-cols-2 gap-3 mb-8">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            onClick={() => set('industry', ind.label)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl text-start transition-all border',
              industry === ind.label
                ? 'glass-lime border-lime/40'
                : 'glass border-white/10 hover:bg-white/[0.05]',
            )}
          >
            <span className="text-2xl">{ind.emoji}</span>
            <span className="text-sm font-medium">{ind.label}</span>
            {industry === ind.label && <Check className="h-4 w-4 text-lime ms-auto" />}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
          Where's your audience?
        </label>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => set('audienceRegion', region)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm transition-all border',
                audienceRegion === region
                  ? 'bg-lime/15 text-lime border-lime/30'
                  : 'glass border-white/10 text-muted-fg hover:text-fg',
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <AnimatedCTA
        onClick={next}
        disabled={!canContinue}
        className="w-full justify-center !py-3"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </AnimatedCTA>
    </div>
  )
}

// ============================================================================
// B04 — Budget & tier
// ============================================================================
export function Step04Budget() {
  const tier = brandOnboardingStore((s) => s.tier)
  const monthlyBudget = brandOnboardingStore((s) => s.monthlyBudget)
  const set = brandOnboardingStore((s) => s.set)
  const next = brandOnboardingStore((s) => s.next)

  return (
    <div>
      <Question
        number="04"
        title="Pick your plan."
        why="Pilot lets you test with one fact. Pro gives you priority review. Enterprise unlocks a dedicated Studio liaison. You can change or cancel anytime."
      />

      <div className="space-y-3 mb-8">
        {TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              set('tier', t.id)
              set('monthlyBudget', t.price)
            }}
            className={cn(
              'w-full text-start p-4 rounded-xl transition-all border',
              tier === t.id
                ? 'glass-lime border-lime/40'
                : 'glass border-white/10 hover:bg-white/[0.05]',
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {t.id === 'Enterprise' && <Crown className="h-4 w-4 text-[#B6A6FF]" />}
                {t.id === 'Pro' && <Zap className="h-4 w-4 text-orange" />}
                {t.id === 'Pilot' && <Sparkles className="h-4 w-4 text-lime" />}
                <span className="font-serif text-lg font-semibold">{t.id}</span>
              </div>
              <span className="font-mono text-xl font-bold" data-mono>
                ${t.price}<span className="text-xs text-muted-fg">/mo</span>
              </span>
            </div>
            <p className="text-xs text-muted-fg mt-1">{t.description}</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-fg">
              <span className="font-mono" data-mono>{t.credits}</span> video credits/mo
            </div>
          </button>
        ))}
      </div>

      {/* Optional custom budget slider — for brands that want to spend more */}
      <div className="glass rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between text-xs text-muted-fg mb-2">
          <span>Optional: set a custom monthly cap</span>
          <span className="font-mono text-lime" data-mono>${monthlyBudget}</span>
        </div>
        <input
          type="range"
          min={tier === 'Pilot' ? 400 : tier === 'Pro' ? 800 : 1500}
          max={5000}
          step={100}
          value={monthlyBudget}
          onChange={(e) => set('monthlyBudget', Number(e.target.value))}
          className="w-full accent-lime"
        />
      </div>

      <AnimatedCTA onClick={next} className="w-full justify-center !py-3">
        Continue
        <ArrowRight className="h-4 w-4" />
      </AnimatedCTA>
    </div>
  )
}

// ============================================================================
// B05 — First fact (from trend templates)
// ============================================================================
export function Step05FirstFact() {
  const selectedTrend = brandOnboardingStore((s) => s.selectedTrend)
  const customClaim = brandOnboardingStore((s) => s.customClaim)
  const baseFee = brandOnboardingStore((s) => s.baseFee)
  const set = brandOnboardingStore((s) => s.set)
  const next = brandOnboardingStore((s) => s.next)

  const canContinue = selectedTrend !== null

  const handleSelect = (trend: TrendTemplate) => {
    set('selectedTrend', trend)
    set('baseFee', trend.suggestedBaseFee)
    if (!customClaim) set('customClaim', trend.suggestedClaim)
  }

  return (
    <div>
      <Question
        number="05"
        title="Pick your first fact."
        why="These are real trends from our radar — scanned from TikTok, IG, and YouTube in the last 24h. Each comes with a suggested verified claim + base fee. You can edit the claim, but every fact is B11-locked to a real source before it goes live."
      />

      <div className="space-y-2 mb-6">
        {TREND_TEMPLATES.map((trend) => {
          const selected = selectedTrend?.keyword === trend.keyword
          return (
            <button
              key={trend.keyword}
              onClick={() => handleSelect(trend)}
              className={cn(
                'w-full text-start p-4 rounded-xl transition-all border',
                selected
                  ? 'glass-lime border-lime/40'
                  : 'glass border-white/10 hover:bg-white/[0.05]',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-lime" data-mono>{trend.keyword}</span>
                  <span className="text-[10px] text-muted-fg px-1.5 py-0.5 rounded bg-white/[0.04]">
                    {trend.platform}
                  </span>
                  <span className="text-[10px] text-muted-fg">· {trend.category}</span>
                </div>
                {selected && <Check className="h-4 w-4 text-lime" />}
              </div>
              <p className="text-sm leading-snug mb-2 line-clamp-2">"{trend.suggestedClaim}"</p>
              <div className="flex items-center justify-between text-[10px] text-muted-fg">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-orange" />
                  <span className="font-mono" data-mono>+{trend.velocity}/h</span>
                  · <span className="font-mono" data-mono>{(trend.volume / 1000).toFixed(0)}K volume</span>
                </span>
                <span className="text-lime font-mono" data-mono>suggested base: ${trend.suggestedBaseFee}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Editable claim + base fee (only shown when a trend is selected) */}
      {selectedTrend && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={easeEditorial}
          className="glass rounded-xl p-4 mb-6 space-y-3"
        >
          <div>
            <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
              Edit the claim (optional — our Studio will verify it before publishing)
            </label>
            <textarea
              value={customClaim}
              onChange={(e) => set('customClaim', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-lime/40 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
              Base fee per creator (paid on lock)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={2}
                max={80}
                value={baseFee}
                onChange={(e) => set('baseFee', Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lime/40"
                data-mono
              />
              <span className="text-xs text-muted-fg">
                + $3 CPM per 1,000 views · max $30 per video
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatedCTA
        onClick={next}
        disabled={!canContinue}
        className="w-full justify-center !py-3"
      >
        {canContinue ? 'Lock this fact' : 'Pick a trend to continue'}
        {canContinue && <ArrowRight className="h-4 w-4" />}
      </AnimatedCTA>
    </div>
  )
}

// ============================================================================
// B06 — Wallet top-up
// ============================================================================
export function Step06TopUp() {
  const topUpAmount = brandOnboardingStore((s) => s.topUpAmount)
  const paymentMethod = brandOnboardingStore((s) => s.paymentMethod)
  const tier = brandOnboardingStore((s) => s.tier)
  const monthlyBudget = brandOnboardingStore((s) => s.monthlyBudget)
  const baseFee = brandOnboardingStore((s) => s.baseFee)
  const set = brandOnboardingStore((s) => s.set)
  const next = brandOnboardingStore((s) => s.next)

  // Calculate how many creator claims this funds
  const estimatedClaims = Math.floor(topUpAmount / (baseFee + 30)) // base + max CPM

  return (
    <div>
      <Question
        number="06"
        title="Top up your wallet."
        why={`Your ${tier} plan ($${monthlyBudget}/mo) covers the subscription. Top up extra for creator payouts — each claim pays the base fee + CPM.`}
      />

      {/* Pre-set amounts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[200, 500, 1000].map((amount) => (
          <button
            key={amount}
            onClick={() => set('topUpAmount', amount)}
            className={cn(
              'py-4 rounded-xl text-center transition-all border',
              topUpAmount === amount
                ? 'glass-lime border-lime/40'
                : 'glass border-white/10 hover:bg-white/[0.05]',
            )}
          >
            <div className="font-mono text-xl font-bold" data-mono>${amount}</div>
            <div className="text-[10px] text-muted-fg mt-1">
              ~{Math.floor(amount / (baseFee + 30))} claims
            </div>
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="glass rounded-xl p-4 mb-4">
        <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
          Or set a custom amount
        </label>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono text-muted-fg">$</span>
          <input
            type="number"
            min={50}
            max={10000}
            step={50}
            value={topUpAmount}
            onChange={(e) => set('topUpAmount', Number(e.target.value))}
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-lime/40"
            data-mono
          />
        </div>
      </div>

      {/* Payment method */}
      <div className="space-y-2 mb-4">
        <label className="text-xs text-muted-fg uppercase tracking-wider block">
          Payment method
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => set('paymentMethod', 'stripe')}
            className={cn(
              'p-3 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm',
              paymentMethod === 'stripe'
                ? 'glass-lime border-lime/40'
                : 'glass border-white/10 hover:bg-white/[0.05]',
            )}
          >
            💳 Stripe
          </button>
          <button
            onClick={() => set('paymentMethod', 'flouci')}
            className={cn(
              'p-3 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm',
              paymentMethod === 'flouci'
                ? 'glass-lime border-lime/40'
                : 'glass border-white/10 hover:bg-white/[0.05]',
            )}
          >
            📱 Flouci (TND)
          </button>
        </div>
      </div>

      {/* Estimate */}
      <div className="glass rounded-xl p-4 mb-6 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-fg">Subscription ({tier})</span>
          <span className="font-mono" data-mono>${monthlyBudget}/mo</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-fg">Wallet top-up</span>
          <span className="font-mono text-lime" data-mono>+${topUpAmount}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-muted-fg">Estimated claims funded</span>
          <span className="font-mono font-bold" data-mono>{estimatedClaims} creators</span>
        </div>
      </div>

      <AnimatedCTA onClick={next} className="w-full justify-center !py-3">
        Continue
        <ArrowRight className="h-4 w-4" />
      </AnimatedCTA>
    </div>
  )
}

// ============================================================================
// B07 — First claim invitation (the celebration moment)
// ============================================================================
export function Step07Invite() {
  const router = useRouter()
  const { toast } = useToast()
  const invitedCreators = brandOnboardingStore((s) => s.invitedCreators)
  const toggleInvitedCreator = brandOnboardingStore((s) => s.toggleInvitedCreator)
  const brandName = brandOnboardingStore((s) => s.brandName)
  const brandLogo = brandOnboardingStore((s) => s.brandLogo)
  const selectedTrend = brandOnboardingStore((s) => s.selectedTrend)
  const baseFee = brandOnboardingStore((s) => s.baseFee)
  const topUpAmount = brandOnboardingStore((s) => s.topUpAmount)
  const reset = brandOnboardingStore((s) => s.reset)

  const handleFinish = () => {
    toast({
      title: '🎉 Welcome to Perokio!',
      description: `${brandName}'s first fact is queued for B11 verification. Invited ${invitedCreators.length} creator(s). Opening your Command Center…`,
    })
    setTimeout(() => {
      reset()
      router.push('/')
    }, 1500)
  }

  return (
    <div>
      <Question
        number="07"
        title="Invite your first creators."
        why="Pick a few creators to claim your fact first. They'll get a 24h head start. Your fact goes live on the Wall the moment they lock their first video."
      />

      {/* Summary card — what's about to go live */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className="glass-lime rounded-2xl p-5 mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{brandLogo}</span>
          <div>
            <div className="font-serif text-lg font-semibold">{brandName || 'Your brand'}</div>
            <div className="text-xs text-muted-fg">First fact ready to publish</div>
          </div>
          <ShieldCheck className="h-5 w-5 text-lime ms-auto" />
        </div>
        {selectedTrend && (
          <p className="text-sm leading-snug mb-3">"{selectedTrend.suggestedClaim}"</p>
        )}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-muted-fg">
            <TrendingUp className="h-3 w-3 text-orange" />
            <span className="font-mono" data-mono>{selectedTrend?.keyword}</span>
          </span>
          <span className="flex items-center gap-1 text-muted-fg">
            <Wallet className="h-3 w-3 text-lime" />
            <span className="font-mono" data-mono>${baseFee} base + $3 CPM</span>
          </span>
          <span className="flex items-center gap-1 text-muted-fg">
            <Sparkles className="h-3 w-3" />
            <span className="font-mono" data-mono>${topUpAmount} funded</span>
          </span>
        </div>
      </motion.div>

      {/* Creator list — pre-filtered to ones likely to match */}
      <div className="space-y-2 mb-6 max-h-80 overflow-y-auto scrollbar-thin">
        {CREATORS.map((creator) => {
          const invited = invitedCreators.includes(creator.handle)
          return (
            <button
              key={creator.id}
              onClick={() => toggleInvitedCreator(creator.handle)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-start',
                invited
                  ? 'glass-lime border-lime/40'
                  : 'glass border-white/10 hover:bg-white/[0.05]',
              )}
            >
              <span className="text-2xl">{creator.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{creator.name}</div>
                <div className="text-[10px] text-muted-fg flex items-center gap-2">
                  <span className="font-mono" data-mono>{creator.handle}</span>
                  <span>·</span>
                  <span>{creator.level}</span>
                  <span>·</span>
                  <span>{(creator.followers / 1000).toFixed(1)}K followers</span>
                </div>
              </div>
              {invited && <Check className="h-4 w-4 text-lime" />}
            </button>
          )
        })}
      </div>

      <div className="text-xs text-muted-fg mb-4 text-center">
        {invitedCreators.length === 0
          ? 'You can skip this — your fact will be open to all creators on the Wall.'
          : `${invitedCreators.length} creator${invitedCreators.length === 1 ? '' : 's'} will get a 24h head start.`}
      </div>

      <AnimatedCTA
        onClick={handleFinish}
        successLabel="✓ Setup complete"
        className="w-full justify-center !py-3 !text-base glow-lime"
      >
        <Flame className="h-4 w-4" />
        Publish my first fact
      </AnimatedCTA>
    </div>
  )
}
