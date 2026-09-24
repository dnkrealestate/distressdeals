import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Distress Deals Dubai — Verified distressed and below-market property across the UAE'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Generated at request time (Satori/next-og, no external image asset or design tool needed) — this is what
// every WhatsApp/social share preview uses, since the site had no og:image at all before this.
export default function OpengraphImage() {
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
          background: 'linear-gradient(135deg, #0D1117 0%, #1a1010 55%, #2a0e0e 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '18px 40px',
            borderRadius: 999,
            background: 'rgba(203,1,1,0.14)',
            border: '2px solid rgba(203,1,1,0.5)',
            marginBottom: 44,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #CB0101, #FD7147)',
            }}
          />
          <span style={{ color: '#FD7147', fontSize: 30, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            Distress Sale Dubai
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 80,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.15,
            padding: '0 80px',
          }}
        >
          Distressed Property Deals in Dubai
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: 'rgba(255,255,255,0.72)',
            marginTop: 36,
            textAlign: 'center',
            padding: '0 120px',
          }}
        >
          Verified below-market villas &amp; apartments — one dedicated agent, start to finish
        </div>
      </div>
    ),
    { ...size }
  )
}
