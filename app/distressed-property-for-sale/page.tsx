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
    title: 'Distressed Property for Sale in Dubai & UAE',
    description: 'Distressed property for sale in Dubai and the UAE — apartments, villas, townhouses and off-plan units below market value, each one checked before it goes live.',
    path: `/${PAGE_KEY}`,
  })
}

export default async function DistressedPropertyForSalePage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Distressed Property for Sale', item: `${SITE_URL}/${PAGE_KEY}` },
    ],
  }
  return (
    <div className="page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <ContentPageRenderer content={content} />
      <LandingExtras listingTitle="Below-market property for sale now" listingParams={{ listingType: 'sale' }} viewAllHref="/for-sale"
        faqTitle="Distressed property for sale: FAQs" faqs={content.faqs?.length ? content.faqs : FAQS} related={otherGuides(`/${PAGE_KEY}`)} />
      <Footer />
    </div>
  )
}
