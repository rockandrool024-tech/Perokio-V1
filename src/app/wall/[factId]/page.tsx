import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FACTS, VIDEOS, CREATORS, BRANDS } from '@/lib/perokio/data'
import { formatCompact } from '@/lib/perokio/format'
import { FactPageView } from '@/components/perokio/public/fact-page-view'
import { PerokioWordmark, ParrotLogo } from '@/components/perokio/shared/parrot-logo'

/**
 * P04 Public Fact Page — `/wall/[factId]`
 *
 * Per Cycle 1 design rationale:
 *   - SSR'd, public URL
 *   - Aggregates all creator versions of a single fact under the founding brand's logo
 *   - This is BOTH an SEO asset AND a social-proof asset
 *   - "Every brand wants their fact to be 'in the top Wall facts.'"
 *   - Footer badge: "Made with Perokio"
 *
 * This is the brand FOMO loop's anchor: when a brand sees their fact here with
 * 10 creator versions and 200K aggregate views, they want to fund more facts.
 */

interface PageProps {
  params: Promise<{ factId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { factId } = await params
  const fact = FACTS.find((f) => f.id === factId || f.code === factId)

  if (!fact) {
    return { title: 'Fact not found · Perokio Wall' }
  }

  const ogUrl = `/api/og/fact?id=${encodeURIComponent(fact.id)}`
  const creatorCount = fact.claimedBy.length
  const totalViews = fact.totalViews

  return {
    title: `${fact.claim.slice(0, 60)}${fact.claim.length > 60 ? '…' : ''} · Perokio Wall`,
    description: `Verified fact: ${fact.claim}. ${creatorCount} creators · ${formatCompact(totalViews)} views · funded by ${fact.brandName}. Made with Perokio.`,
    openGraph: {
      title: fact.claim.slice(0, 80),
      description: `${creatorCount} creators · ${formatCompact(totalViews)} views · ${fact.brandName}`,
      type: 'article',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: fact.claim }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fact.claim.slice(0, 60),
      description: `${creatorCount} creators · ${formatCompact(totalViews)} views · ${fact.brandName}`,
      images: [ogUrl],
    },
  }
}

export default async function FactPage({ params }: PageProps) {
  const { factId } = await params
  const fact = FACTS.find((f) => f.id === factId || f.code === factId)

  if (!fact) {
    notFound()
  }

  // The founding brand
  const brand = BRANDS.find((b) => b.name === fact.brandName)
  // All creator versions (videos) of this fact — sorted by views
  const creatorVersions = VIDEOS.filter((v) => v.factId === fact.id)
    .sort((a, b) => b.views - a.views)
  // Resolve each creator
  const versionsWithCreators = creatorVersions.map((v) => ({
    video: v,
    creator: CREATORS.find((c) => c.id === v.creatorId),
  }))
  // Aggregate stats
  const aggregateViews = creatorVersions.reduce((s, v) => s + v.views, 0)
  const aggregateEarnings = creatorVersions.reduce(
    (s, v) => s + v.earningsBase + v.earningsCpm,
    0,
  )
  // Other top facts (for "more from the Wall" section)
  const otherFacts = FACTS.filter((f) => f.id !== fact.id && f.totalViews > 5000)
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-fg">
      <header className="glass-strong sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <a href="/landing">
            <PerokioWordmark size={28} />
          </a>
          <a
            href="/login"
            className="text-xs glass rounded-full px-3 py-1.5 text-lime hover:bg-lime/10 transition-colors"
          >
            Join Perokio
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <FactPageView
          fact={fact}
          brand={brand}
          versionsWithCreators={versionsWithCreators}
          aggregateViews={aggregateViews}
          aggregateEarnings={aggregateEarnings}
          otherFacts={otherFacts}
        />
      </main>

      {/* Footer — "Made with Perokio" (per §4 spec) */}
      <footer className="border-t border-white/[0.06] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 flex items-center justify-between text-xs text-muted-fg">
          <div className="flex items-center gap-2">
            <ParrotLogo size={20} />
            <span>Made with</span>
            <span className="font-serif font-semibold text-lime">Perokio</span>
          </div>
          <span>Verified Facts × Local Film</span>
        </div>
      </footer>
    </div>
  )
}
