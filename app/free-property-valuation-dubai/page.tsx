import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ContactForm from '@/components/ContactForm'
import { ContentPageRenderer } from '@/components/ContentPageRenderer'
import { resolveSeo } from '@/lib/seo'
import { getContentPage } from '@/lib/contentPages'
import { PAGE_KEY, FALLBACK_CONTENT } from './fallbackContent'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo(PAGE_KEY, {
    title: 'Free Property Valuation Dubai | Know Your Property’s Value',
    description: 'Get a free, no-obligation valuation for your Dubai property — based on real comparable sales, current demand, and condition. No cost, no pressure.',
    path: `/${PAGE_KEY}`,
  })
}

export default async function FreePropertyValuationDubaiPage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Free Property Valuation', item: `${SITE_URL}/${PAGE_KEY}` },
    ],
  }

  return (
    <div className="page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <ContentPageRenderer content={content} />

      <section className="section section-alt">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <h2 className="heading-lg mb-3 text-center">Request Your Free Valuation</h2>
          <p className="muted mb-8 text-center">Takes two minutes. No cost, no obligation to list.</p>
          <ContactForm
            source="valuation_request"
            messagePlaceholder="Property location, type, size, and any recent renovations…"
            submitLabel="Request My Free Valuation"
          />
        </div>
      </section>

      <Footer />
    </div>
  )
}
