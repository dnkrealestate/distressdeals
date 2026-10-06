import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
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
    title: 'Dubai Property Auctions | How They Work & Key Risks',
    description: 'How Dubai property auctions work, the risks of buying at auction, and why a negotiated distress sale is often a safer way to buy below market.',
    path: `/${PAGE_KEY}`,
  })
}

export default async function DubaiPropertyAuctionsPage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Dubai Property Auctions', item: `${SITE_URL}/${PAGE_KEY}` },
    ],
  }

  return (
    <div className="page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <ContentPageRenderer content={content} />
      <LandingExtras listingTitle="Below-market property for sale now" listingParams={{ listingType: 'sale' }} viewAllHref="/for-sale"
        faqTitle="Dubai property auctions: FAQs" faqs={content.faqs?.length ? content.faqs : FAQS} related={otherGuides(`/${PAGE_KEY}`)} />
      <Footer />
    </div>
  )
}
