import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import MobileBottomNav from '@/components/layouts/MobileBottomNav'
import FloatingActions from '@/components/layouts/FloatingActions'
import { GoogleTagHead, GoogleTagNoScript } from '@/components/GoogleTags'

// Canonical www — the actual live domain (non-www 301s to this), so metadataBase (and therefore every relative
// `alternates.canonical` across the app) must resolve here too, not to a URL that immediately redirects away.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Distress Sale Dubai | Distressed Property Deals UAE', template: '%s | Distress Deals Dubai' },
  description: "Dubai's centralized real estate platform. Every listing verified, one dedicated agent from first message to keys-in-hand — buy, sell, or rent with confidence.",
  // Google Search Console site-ownership verification (renders <meta name="google-site-verification">).
  verification: { google: 'KrXeALfeYBTVJyLMYrcTeL2aTOpRbWPWuhkg_-JR79k' },
  // No `keywords` — Google has ignored this tag since 2009, and it does nothing but hand competitors your
  // targeting for free.
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'en_AE', url: '/',
    siteName: 'Distress Deals Dubai',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
}
export const viewport: Viewport = { themeColor: '#CB0101' }

// Sitewide identity signal for search engines — one Organization/LocalBusiness
// entity, not a per-agent profile, matching the centralized (no marketplace) model.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Distress Deals Dubai',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.webp`,
  image: `${SITE_URL}/logo.webp`,
  description: "Dubai's centralized real estate platform — every listing verified, one dedicated in-house agent from first message to keys-in-hand.",
  areaServed: { '@type': 'City', name: 'Dubai' },
  address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
  sameAs: [
    'https://www.instagram.com/distressdeals_uae/',
    'https://www.tiktok.com/@distressdeals',
    'https://www.linkedin.com/company/distress-dealsuae/',
    'https://www.facebook.com/profile.php?id=61594458870625',
    'https://www.youtube.com/@Distressdeals',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body>
        <GoogleTagNoScript />
        <GoogleTagHead />
        <Providers>
          <EmailVerificationBanner />
          {children}
          <MobileBottomNav />
          <FloatingActions />
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
