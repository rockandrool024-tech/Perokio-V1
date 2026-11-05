import { ImageResponse } from 'next/og'
import { FACTS, BRANDS } from '@/lib/perokio/data'
import { formatCompact } from '@/lib/perokio/format'

/**
 * OG Image route — generates a 1200×630 PNG for printed fact shares.
 *
 * Per §4: "Every printed fact has an OG card showing the fact text, brand logo,
 * creator count, and total views."
 *
 * Note: every div has explicit `display: flex` (next/og requirement).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const fact = FACTS.find((f) => f.id === id || f.code === id)

  if (!fact) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0A0F0D 0%, #14201A 50%, #0A0F0D 100%)',
            color: '#fff',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 700 }}>Fact not found</div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

  const brand = BRANDS.find((b) => b.name === fact.brandName)
  const accent = brand?.accent ?? '#D8EF70'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0A0F0D 0%, #14201A 50%, #0A0F0D 100%)',
          color: '#fff',
          fontFamily: 'sans-serif',
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #D8EF70 0%, #6FD3C7 60%, #ED7A42 100%)',
                boxShadow: '0 0 24px rgba(216,239,112,0.5)',
                display: 'flex',
              }}
            />
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, fontFamily: 'serif' }}>
              Perokio
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            Verified Fact
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 20,
            flex: 1,
            marginTop: 40,
          }}
        >
          {/* Fact code + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', fontSize: 16, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
              {fact.code}
            </div>
            <div style={{ display: 'flex', color: 'rgba(255,255,255,0.2)' }}>·</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', fontSize: 24 }}>{brand?.logo ?? '📋'}</div>
              <div style={{ display: 'flex', fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
                {fact.brandName}
              </div>
            </div>
          </div>

          {/* The claim */}
          <div
            style={{
              display: 'flex',
              fontSize: 44,
              fontWeight: 700,
              fontFamily: 'serif',
              lineHeight: 1.2,
              maxWidth: 1000,
            }}
          >
            "{fact.claim.length > 140 ? fact.claim.slice(0, 140) + '…' : fact.claim}"
          </div>

          {/* Aggregate stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            <StatBox label="Creators" value={String(fact.claimedBy.length)} accent={accent} />
            <StatBox label="Total views" value={formatCompact(fact.totalViews)} accent={accent} />
            <StatBox label="Base fee" value={`$${fact.baseFee}`} accent={accent} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 24,
            marginTop: 40,
          }}
        >
          <div style={{ display: 'flex', fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
            Made with
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'serif',
              color: '#D8EF70',
            }}
          >
            Perokio
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  )
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, color: accent }}>
        {value}
      </div>
    </div>
  )
}
