import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://distressdeals.ae'),
  title: { default: 'Distress Deals Dubai — Verified Properties, Managed End-to-End', template: '%s | Distress Deals Dubai' },
  description: "Dubai's centralized real estate platform. Every listing verified, one dedicated agent from first message to keys-in-hand — buy, sell, or rent with confidence.",
  keywords: ['Dubai real estate', 'property for sale Dubai', 'apartments for rent Dubai', 'villas Dubai', 'off-plan Dubai'],
  openGraph: {
    type: 'website', locale: 'en_AE', url: '/',
    siteName: 'Distress Deals Dubai',
  },
}
export const viewport: Viewport = { themeColor: '#31B2DE' }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://distressdeals.ae'

// Sitewide identity signal for search engines — one Organization/LocalBusiness
// entity, not a per-agent profile, matching the centralized (no marketplace) model.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Distress Deals Dubai',
  url: SITE_URL,
  description: "Dubai's centralized real estate platform — every listing verified, one dedicated in-house agent from first message to keys-in-hand.",
  areaServed: { '@type': 'City', name: 'Dubai' },
  address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body>
        <Providers>
          <EmailVerificationBanner />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(17,17,17,0.95)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                borderRadius: '12px',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#C9941A', secondary: '#080808' } },
              error:   { iconTheme: { primary: '#F43F5E', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
