'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PerokioWordmark, ParrotLogo } from '@/components/perokio/shared/parrot-logo'
import { ShareCardPreview } from '@/components/perokio/shared/share-card-preview'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { DEMO_CREATOR } from '@/lib/perokio/mock-data'
import { FACTS } from '@/lib/perokio/data'
import { formatCompact, formatUSD } from '@/lib/perokio/format'
import { ArrowRight, ShieldCheck, Wallet, TrendingUp, Users } from 'lucide-react'
import { easeEditorial } from '@/lib/perokio/motion'

/**
 * P01 Landing — sells the creator's hustle, NOT the brand's reliability.
 *
 * Per Cycle 1 design rationale:
 *   "Hero: a real creator's wallet screenshot with the line 'Amira earned this
 *    in 38 videos. She started 4 months ago.' CTA: 'Start earning in 24h.'
 *    Below the fold: 3 real printed facts with their view counts.
 *    The proof IS the product."
 *
 * Rejection list (anti-patterns from §7):
 *   - NO feature grid
 *   - NO "trusted by" logos
 *   - NO "🚀 Get started" hero
 *   - NO generic SaaS illustrations
 *   - NO testimonial bloat
 */
export function Landing() {
  const creator = DEMO_CREATOR
  const printedFacts = FACTS.filter((f) => f.totalViews > 10000).slice(0, 3)
  const totalCreatorSlots = FACTS.reduce((s, f) => s + f.claimedBy.length, 0)
  const totalPrintedViews = FACTS.reduce((s, f) => s + f.totalViews, 0)

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-fg">
      {/* === Top nav — minimal === */}
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/landing">
            <PerokioWordmark size={32} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-fg hover:text-fg transition-colors">
              Sign in
            </Link>
            <Link href="/">
              <AnimatedCTA variant="ghost" className="!py-2 !px-4 !text-sm">
                Open the app
                <ArrowRight className="h-3.5 w-3.5" />
              </AnimatedCTA>
            </Link>
          </div>
        </div>
      </header>

      {/* === Hero — Amira's wallet, the proof === */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 1200px 600px at 80% -10%, rgba(216,239,112,0.10), transparent 60%), radial-gradient(ellipse 1000px 700px at -10% 100%, rgba(237,122,66,0.06), transparent 60%)',
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-6 pt-16 lg:pt-24 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={easeEditorial}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-fg">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
                </span>
                Tunisia Pilot · Live now
              </div>

              <h1 className="font-serif text-4xl lg:text-6xl font-semibold leading-tight tracking-tight">
                Amira earned{' '}
                <span className="text-lime" style={{ textShadow: '0 0 24px rgba(216,239,112,0.4)' }}>
                  {formatUSD(creator.totalEarned)}
                </span>{' '}
                in {creator.completedVideos} videos.
              </h1>

              <p className="text-lg text-muted-fg leading-relaxed max-w-xl">
                She started 4 months ago. No agency, no manager, no editing skills.
                Just a phone, 20 seconds per video, and verified facts brands pay to film.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/login">
                  <AnimatedCTA className="!px-6 !py-3 !text-base w-full sm:w-auto justify-center">
                    Start earning in 24h
                    <ArrowRight className="h-4 w-4" />
                  </AnimatedCTA>
                </Link>
                <Link href="/creator/amira.tn">
                  <AnimatedCTA variant="ghost" className="!px-6 !py-3 !text-base w-full sm:w-auto justify-center">
                    See Amira's profile
                  </AnimatedCTA>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-6 text-sm text-muted-fg">
                <div>
                  <div className="font-mono text-2xl font-bold text-fg" data-mono>
                    {totalCreatorSlots}
                  </div>
                  <div className="text-xs">creator slots claimed</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="font-mono text-2xl font-bold text-fg" data-mono>
                    {formatCompact(totalPrintedViews)}
                  </div>
                  <div className="text-xs">views printed</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="font-mono text-2xl font-bold text-lime" data-mono>$3</div>
                  <div className="text-xs">CPM per 1k views</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...easeEditorial, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-lime/5 blur-3xl rounded-3xl" />
              <div className="relative">
                <ShareCardPreview type="creator" creator={creator} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -bottom-4 -start-4 glass-strong rounded-xl px-3 py-2 flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4 text-lime" />
                  <div>
                    <div className="text-[10px] text-muted-fg uppercase tracking-wider">Last payout</div>
                    <div className="font-mono text-sm font-bold text-lime" data-mono>+${creator.pendingPayout}</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === The 3-step hustle === */}
      <section className="border-t border-white/[0.06] py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
              Three steps. Twenty-four hours.
            </h2>
            <p className="text-muted-fg mt-2">
              No portfolio. No follower minimum. No editing software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Claim a fact',
                body: 'Brands fund verified fact bundles — real data, real sources, locked by B11. Pick one from the Wall. You have 24 hours to film.',
                icon: ShieldCheck,
              },
              {
                num: '02',
                title: 'Film 20 seconds',
                body: 'Use the in-browser Hyperframe editor. The script is locked, the assets are provided, the captions are AI-generated. Just film.',
                icon: TrendingUp,
              },
              {
                num: '03',
                title: 'Get paid',
                body: "Base fee of $2-$80 per video + $3 per 1,000 views. Payouts via Flouci within 24h of brand approval. That's it.",
                icon: Wallet,
              },
            ].map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...easeEditorial, delay: i * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-muted-fg" data-mono>{step.num}</span>
                    <Icon className="h-5 w-5 text-lime" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-fg leading-relaxed">{step.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* === Printed facts — the proof IS the product === */}
      <section className="border-t border-white/[0.06] py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
                Real facts. Real views.
              </h2>
              <p className="text-muted-fg mt-2">
                Each fact is verified, source-locked, and printed by real creators.
              </p>
            </div>
            <Link href="/wall/F-2024-1025-05" className="text-sm text-lime hover:underline flex items-center gap-1">
              Browse the Wall <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {printedFacts.map((fact, i) => (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...easeEditorial, delay: i * 0.08 }}
              >
                <Link
                  href={`/wall/${fact.id}`}
                  className="block glass rounded-2xl p-5 hover:bg-white/[0.05] transition-colors h-full"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] text-muted-fg" data-mono>{fact.code}</span>
                    <span className="text-[10px] text-lime flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> VERIFIED
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug line-clamp-3 mb-4 min-h-[60px]">
                    "{fact.claim}"
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-muted-fg">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-mono" data-mono>{fact.claimedBy.length}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-mono text-lime" data-mono>{formatCompact(fact.totalViews)}</span>
                      </span>
                    </div>
                    <span className="text-muted-fg">{fact.brandName}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === The moat — B11 explained === */}
      <section className="border-t border-white/[0.06] py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={easeEditorial}
            className="inline-flex items-center justify-center mb-6"
          >
            <ParrotLogo size={64} />
          </motion.div>
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight mb-4">
            The AI cannot hallucinate.
          </h2>
          <p className="text-muted-fg leading-relaxed max-w-2xl mx-auto">
            Every script line is locked to a verified source. If a line isn't sourced,
            the publish button is physically disabled. No brand has ever been embarrassed
            by an AI-made-up claim on Perokio. None ever will.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 glass rounded-full px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-lime" />
            <span className="text-xs font-mono text-lime" data-mono>B11 · 0 unverified lines platform-wide</span>
          </div>
        </div>
      </section>

      {/* === Final CTA === */}
      <section className="border-t border-white/[0.06] py-16 lg:py-24">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="font-serif text-3xl lg:text-5xl font-semibold tracking-tight mb-4">
            Your first video could pay{' '}
            <span className="text-lime">$38</span> tomorrow.
          </h2>
          <p className="text-muted-fg mb-8">
            $8 base fee + $30 max CPM. 24 hours from sign-up to payout.
          </p>
          <Link href="/login">
            <AnimatedCTA className="!px-8 !py-4 !text-base">
              Start earning in 24h
              <ArrowRight className="h-4 w-4" />
            </AnimatedCTA>
          </Link>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-fg">
          <div className="flex items-center gap-2">
            <ParrotLogo size={20} />
            <span>Perokio · Verified Facts × Local Film</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/wall/F-2024-1025-05" className="hover:text-fg transition-colors">Public Wall</Link>
            <Link href="/creator/amira.tn" className="hover:text-fg transition-colors">Creator profile</Link>
            <span className="text-muted-fg/60">Tunisia Pilot · 2024</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
