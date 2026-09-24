import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { ContentPageRenderer } from '@/components/ContentPageRenderer'
import { resolveSeo } from '@/lib/seo'
import { getContentPage } from '@/lib/contentPages'
import { PAGE_KEY, FALLBACK_CONTENT } from './fallbackContent'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo(PAGE_KEY, {
    title: 'Distress Sale Dubai | What It Is & How to Buy Safely',
    description: 'What a distress sale is, why Dubai owners sell below market, typical discounts, and how to verify a distress sale is genuine before you buy.',
    path: `/${PAGE_KEY}`,
  })
}

export default async function DistressSaleDubaiPage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Distress Sale Dubai', item: `${SITE_URL}/${PAGE_KEY}` },
    ],
  }

  return (
    <div className="page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <ContentPageRenderer content={content} />

      <section className="section section-alt">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <h2 className="heading-lg mb-6">Related Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/distressed-villas-dubai" className="card p-5 group">
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--teal)] transition-colors" style={{ color: 'var(--text)' }}>Distressed Villas in Dubai</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Villa-specific below-market listings and what to check.</p>
            </Link>
            <Link href="/dubai-property-auctions" className="card p-5 group">
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--teal)] transition-colors" style={{ color: 'var(--text)' }}>Dubai Property Auctions</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>How auctions differ from a negotiated distress sale.</p>
            </Link>
            <Link href="/sell-property-fast-dubai" className="card p-5 group">
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--teal)] transition-colors" style={{ color: 'var(--text)' }}>Sell Your Property Fast</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Need a quick, verified exit? Here's how it works.</p>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
