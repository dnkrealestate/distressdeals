import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { ContentPageRenderer } from '@/components/ContentPageRenderer'
import LandingExtras, { otherGuides } from '@/components/LandingExtras'
import { resolveSeo } from '@/lib/seo'
import { getContentPage } from '@/lib/contentPages'
import { PAGE_KEY, FALLBACK_CONTENT, FAQS } from './fallbackContent'

// Content is edited in the admin (Settings → page content) — rebuilt from the latest data at most every 60 s.
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo(PAGE_KEY, {
    title: 'Panic Selling in Dubai: Guide for Buyers & Sellers',
    description: 'What panic selling in Dubai real estate is, what triggers it, how buyers can find real value, and what owners should check before cutting their price.',
    path: `/${PAGE_KEY}`,
  })
}

export default async function PanicSellingDubaiPage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Panic Selling in Dubai', item: `${SITE_URL}/${PAGE_KEY}` },
    ],
  }
  return (
    <div className="page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <ContentPageRenderer content={content} />
      <LandingExtras listingTitle="Property for sale now" listingParams={{ listingType: 'sale' }} viewAllHref="/for-sale"
        faqTitle="Panic selling in Dubai: FAQs" faqs={content.faqs?.length ? content.faqs : FAQS} related={otherGuides(`/${PAGE_KEY}`)} />
      <Footer />
    </div>
  )
}
