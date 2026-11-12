import type { Metadata } from 'next'
import { quickLinksAPI } from '@/lib/api'
import { getContentPage } from '@/lib/contentPages'
import { GUIDE_BUYING } from '@/lib/guideContent'
import { tagHeadline, TAG_LABELS } from '@/lib/listingTags'
import MoreSearches from '@/components/listing/MoreSearches'
import GuideSection from '@/components/listing/GuideSection'
import AreaPriceMap from '@/components/AreaPriceMap'
import { resolveSeo, withPage, filterVariant } from '@/lib/seo'
import { listingSeed } from '@/lib/listingSeed'
import { notFound } from 'next/navigation'
import { TYPE_PAGE_LABELS, listBreadcrumbJsonLd } from '@/lib/listingSeo'
import PropertiesListClient from '../buyer/properties/PropertiesListClient'

const TYPE_PAGE = TYPE_PAGE_LABELS

// Page 2, 3… (?page=N) get their own canonical and "– Page N" title (lib/seo withPage).
// Any other filter (?area=, ?beds=, ?type=… with ?area=) is noindex, follow (lib/seo filterVariant).
export async function generateMetadata({ searchParams }: { searchParams?: Record<string, string | undefined> }): Promise<Metadata> {
  const [base, seed] = await Promise.all([baseMetadata(searchParams), listingSeed('sale', searchParams)])
  const meta = filterVariant(withPage(base, Math.max(1, Math.floor(Number(searchParams?.page) || 1))), searchParams, (k, v) => k === 'page' || (k === 'tag' && !!TAG_LABELS[v]) || (k === 'type' && !!TYPE_PAGE[v] && !searchParams?.tag))
  // A page of its own with nothing on it right now: still shown (200, with the "no listings" message), but not
  // indexed until it has listings — an empty page in Google's index is a "soft 404".
  return seed && seed.total + seed.projectTotal === 0 && !meta.robots ? { ...meta, robots: { index: false, follow: true } } : meta
}

async function baseMetadata(searchParams?: { tag?: string; type?: string }): Promise<Metadata> {
  const tag = searchParams?.tag && TAG_LABELS[searchParams.tag] ? searchParams.tag : ''
  const seo = await resolveSeo('for-sale', {
    title: 'Distressed Property for Sale in Dubai | Below Market',
    description: 'Distressed and below-market property for sale in Dubai. Verified villas, apartments and penthouses with real pricing, updated daily.',
    path: '/for-sale',
  })
  // A property-type page (/for-sale?type=villa) is its own page: its own title, description and canonical.
  const typeLabel = !tag && searchParams?.type ? TYPE_PAGE[searchParams.type] : ''
  if (typeLabel) {
    const t = `${typeLabel} for Sale in Dubai & UAE`
    return { ...seo, title: t, description: `${typeLabel} for sale in Dubai and across the UAE — verified listings, distress deals and new projects with real prices, direct from owners and developers.`, alternates: { canonical: `/for-sale?type=${searchParams!.type}` }, openGraph: { ...(seo.openGraph || {}), title: t, url: `/for-sale?type=${searchParams!.type}` } }
  }
  if (!tag) return seo
  // A "More searches" page (/for-sale?tag=luxury) gets its own title and canonical.
  const h = tagHeadline(tag, 'sale')
  const t = h.charAt(0).toUpperCase() + h.slice(1)
  return { ...seo, title: t, description: `${t} — verified listings direct from owners on Distress Deals UAE, with real prices and no third-party agents.`, alternates: { canonical: `/for-sale?tag=${tag}` } }
}

export default async function ForSalePage({ searchParams }: { searchParams?: Record<string, string | undefined> }) {
  const [quickLinks, guide, initial] = await Promise.all([
    quickLinksAPI.get('sale').then(r => r.data.success ? r.data.data : null).catch(() => null),
    getContentPage('guide-buying', GUIDE_BUYING),
    // The list's page in Best Opportunities order, rendered here so crawlers (and the first paint) see real cards.
    listingSeed('sale', searchParams),
  ])
  // A page past the end of the list (?page=999) is a real 404, not an empty 200 ("soft 404").
  if (initial && initial.page > 1 && initial.page > initial.totalPages) notFound()

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listBreadcrumbJsonLd('sale', searchParams)) }} />
      <PropertiesListClient
        forcedListingType="sale"
        initial={initial}
        bottom={<><AreaPriceMap defaultPurpose="buy" /><MoreSearches data={quickLinks} /><GuideSection content={guide} /></>}
      />
    </>
  )
}
