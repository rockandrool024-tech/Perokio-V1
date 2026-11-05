import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CREATORS, FACTS, VIDEOS, BRANDS } from '@/lib/perokio/data'
import { getCreatorStats } from '@/lib/perokio/mock-data'
import { formatCompact, formatUSD } from '@/lib/perokio/format'
import { CreatorProfileView } from '@/components/perokio/public/creator-profile-view'
import { PerokioWordmark, ParrotLogo } from '@/components/perokio/shared/parrot-logo'

/**
 * P03 Public Creator Profile — `/creator/[handle]`
 *
 * Per Cycle 1 design rationale:
 *   - SSR'd, no auth wall
 *   - Shows: name, level badge, top 3 stats (Prints, Total Views, Total Earned),
 *     streak counter (only if active), top 3 print thumbnails
 *   - Footer badge: "Powered by Perokio"
 *   - OG card via /api/og/creator?handle=...
 *
 * This is the Cash App cashtag equivalent — every creator sharing their profile
 * URL in their TikTok bio is recruiting new creators to Perokio.
 */

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const cleanHandle = decodeURIComponent(handle).replace('@', '')
  const creator = CREATORS.find((c) => c.handle === `@${cleanHandle}` || c.handle === cleanHandle)

  if (!creator) {
    return {
      title: 'Creator not found · Perokio',
    }
  }

  const ogUrl = `/api/og/creator?handle=${encodeURIComponent(creator.handle.replace('@', ''))}`

  return {
    title: `${creator.name} · Perokio Creator`,
    description: `${creator.name} (${creator.handle}) — ${creator.completedVideos} prints, ${formatCompact(creator.followers)} followers, ${formatUSD(creator.totalEarned)} earned. Powered by Perokio.`,
    openGraph: {
      title: `${creator.name} · Perokio`,
      description: `${creator.completedVideos} prints · ${formatCompact(creator.followers)} followers · ${formatUSD(creator.totalEarned)} earned`,
      type: 'profile',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${creator.name} on Perokio` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${creator.name} on Perokio`,
      description: `${creator.completedVideos} prints · ${formatCompact(creator.followers)} followers · ${formatUSD(creator.totalEarned)} earned`,
      images: [ogUrl],
    },
  }
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { handle } = await params
  const cleanHandle = decodeURIComponent(handle).replace('@', '')
  const creator = CREATORS.find(
    (c) => c.handle === `@${cleanHandle}` || c.handle === cleanHandle,
  )

  if (!creator) {
    notFound()
  }

  // Top 3 prints by views (the creator's portfolio)
  const creatorVideos = VIDEOS.filter((v) => v.creatorId === creator.id && v.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3)
  // Pull the fact details for each video
  const printsWithFacts = creatorVideos.map((v) => ({
    video: v,
    fact: FACTS.find((f) => f.id === v.factId),
  }))
  const stats = getCreatorStats(creator.id)
  // Brands the creator has printed for (social proof)
  const printedBrands = Array.from(
    new Set(creatorVideos.map((v) => v.brandName)),
  )
    .map((name) => BRANDS.find((b) => b.name === name))
    .filter(Boolean)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-fg">
      {/* Top nav — minimal */}
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
        <CreatorProfileView
          creator={creator}
          stats={stats}
          prints={printsWithFacts}
          printedBrands={printedBrands as typeof BRANDS}
        />
      </main>

      {/* Footer — "Powered by Perokio" badge (per §4 spec) */}
      <footer className="border-t border-white/[0.06] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 flex items-center justify-between text-xs text-muted-fg">
          <div className="flex items-center gap-2">
            <ParrotLogo size={20} />
            <span>Powered by</span>
            <span className="font-serif font-semibold text-lime">Perokio</span>
          </div>
          <span>Verified Facts × Local Film</span>
        </div>
      </footer>
    </div>
  )
}
