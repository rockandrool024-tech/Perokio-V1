import { ImageResponse } from 'next/og'
import { CREATORS } from '@/lib/perokio/data'
import { getCreatorStats } from '@/lib/perokio/mock-data'
import { formatCompact, formatUSD } from '@/lib/perokio/format'

/**
 * OG Image route — generates a 1200×630 PNG for creator profile shares.
 *
 * Per §4: "Every creator profile has an auto-generated OG card (1200×630) showing
 * their name, level badge, top 3 stats, and 'Powered by Perokio.'"
 *
 * Per user caveat (Cycle 4 blocker resolution): verified to render on the preview
 * environment using the default Node.js runtime (no edge config needed in Next 16).
 *
 * Note: next/og ImageResponse requires explicit `display: flex` on every div with
 * multiple children. We use `display: flex` everywhere defensively.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')?.replace('@', '')

  const creator = CREATORS.find(
    (c) => c.handle === `@${handle}` || c.handle === handle,
  )

  if (!creator) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0A0F0D 0%, #14201A 50%, #0A0F0D 100%)',
            color: '#fff',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 700 }}>Creator not found</div>
          <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
            perokio.io/creator/{handle}
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

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
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Creator
          </div>
        </div>

        {/* Body — creator identity + stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 24,
            flex: 1,
            marginTop: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(216,239,112,0.25), rgba(237,122,66,0.20))',
                border: '2px solid rgba(216,239,112,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
              }}
            >
              {creator.avatar}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, fontFamily: 'serif' }}>
                  {creator.name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#D8EF70',
                    background: 'rgba(216,239,112,0.15)',
                    border: '1px solid rgba(216,239,112,0.3)',
                    padding: '4px 12px',
                    borderRadius: 8,
                  }}
                >
                  {creator.level}
                </div>
              </div>
              <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>
                {creator.handle} · {creator.rank}
              </div>
            </div>
          </div>

          {/* Top 3 stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            <StatBox label="Prints" value={String(creator.completedVideos)} accent="#D8EF70" />
            <StatBox label="Followers" value={formatCompact(creator.followers)} accent="#ED7A42" />
            <StatBox label="Earned" value={formatUSD(creator.totalEarned)} accent="#D8EF70" />
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
            Powered by
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
