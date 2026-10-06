import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ContactForm from '@/components/ContactForm'
import { ContentPageRenderer } from '@/components/ContentPageRenderer'
import { resolveSeo } from '@/lib/seo'
import { getContentPage } from '@/lib/contentPages'
import { PAGE_KEY, FALLBACK_CONTENT, FAQS } from './fallbackContent'
import LandingExtras, { otherGuides } from '@/components/LandingExtras'

// Content is edited in the admin — rebuild this page from the latest data at most every 60 s (otherwise a production
// build freezes it at build time and edits never show).
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo(PAGE_KEY, {
    title: 'Sell Your Property Fast in Dubai | Quick, Verified Exit',
    description: 'Need to sell a Dubai property quickly? Our process, timeline, required documents, and fees for owners who need a fast, verified sale.',
    path: `/${PAGE_KEY}`,
  })
}

export default async function SellPropertyFastDubaiPage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Sell Your Property Fast', item: `${SITE_URL}/${PAGE_KEY}` },
    ],
  }

  return (
    <div className="page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <ContentPageRenderer content={content} />

      <section className="section">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <h2 className="heading-lg mb-3 text-center">Tell Us About Your Property</h2>
          <p className="muted mb-8 text-center">No cost, no obligation — just a starting conversation with your assigned agent.</p>
          <ContactForm
            source="fast_sale_request"
            messagePlaceholder="Property location, type, and your ideal timeline to sell…"
            submitLabel="Request a Fast-Sale Consultation"
          />
        </div>
      </section>

      <LandingExtras listingTitle="Recently listed property" listingParams={{ listingType: 'sale', sortBy: 'newest' }} viewAllHref="/for-sale"
        faqTitle="Selling your property fast in Dubai: FAQs" faqs={content.faqs?.length ? content.faqs : FAQS} related={otherGuides(`/${PAGE_KEY}`)} />
      <Footer />
    </div>
  )
}
