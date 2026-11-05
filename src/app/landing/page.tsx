import { Landing } from '@/components/perokio/landing/landing'

export const metadata = {
  title: 'Perokio · Earn from Verified Facts',
  description:
    'Tunisian creators earn $2-$80 per video + CPM by filming verified fact bundles. Brands fund the facts, creators film them, Perokio locks the truth.',
  keywords: ['Perokio', 'MENA creator economy', 'TikTok earnings', 'CPM', 'Tunisia creators'],
  openGraph: {
    title: 'Perokio · Earn from Verified Facts',
    description:
      'Amira earned $1,840 in 38 videos. She started 4 months ago. Start earning in 24h.',
    type: 'website',
  },
}

export default function LandingPage() {
  return <Landing />
}
