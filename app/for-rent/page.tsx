import type { Metadata } from 'next'
import { quickLinksAPI } from '@/lib/api'
import { getContentPage } from '@/lib/contentPages'
import { GUIDE_RENTING } from '@/lib/guideContent'
import { tagHeadline, TAG_LABELS } from '@/lib/listingTags'
import MoreSearches from '@/components/listing/MoreSearches'
import GuideSection from '@/components/listing/GuideSection'
import AreaPriceMap from '@/components/AreaPriceMap'
import { resolveSeo, withPage } from '@/lib/seo'
import { listingSeed } from '@/lib/listingSeed'
import { notFound } from 'next/navigation'
import { TYPE_PAGE_LABELS } from '@/lib/listingSeo'
import PropertiesListClient from '../buyer/properties/PropertiesListClient'

const TYPE_PAGE = TYPE_PAGE_LABELS

// Page 2, 3… (?page=N) get their own canonical and "– Page N" title (lib/seo withPage).
export async function generateMetadata({ searchParams }: { searchParams?: { tag?: string; type?: string; page?: string } }): Promise<Metadata> {
  return withPage(await baseMetadata(searchParams), Math.max(1, Math.floor(Number(searchParams?.page) || 1)))
}

async function baseMetadata(searchParams?: { tag?: string; type?: string }): Promise<Metadata> {
  const tag = searchParams?.tag && TAG_LABELS[searchParams.tag] ? searchParams.tag : ''
  const seo = await resolveSeo('for-rent', {
    title: 'Property for Rent in Dubai | Verified Listings',
    description: 'Verified apartments and villas for rent across Dubai, with genuine availability and no duplicate listings. Updated daily.',
    path: '/for-rent',
  })
  // A property-type page (/for-rent?type=villa) is its own page: its own title, description and canonical.
  const typeLabel = !tag && searchParams?.type ? TYPE_PAGE[searchParams.type] : ''
  if (typeLabel) {
    const t = `${typeLabel} for Rent in Dubai & UAE`
    return { ...seo, title: t, description: `${typeLabel} for rent in Dubai and across the UAE — verified listings with real availability, direct from owners.`, alternates: { canonical: `/for-rent?type=${searchParams!.type}` }, openGraph: { ...(seo.openGraph || {}), title: t, url: `/for-rent?type=${searchParams!.type}` } }
  }
  if (!tag) return seo
  // A "More searches" page (/for-rent?tag=luxury) gets its own title and canonical.
  const h = tagHeadline(tag, 'rent')
  const t = h.charAt(0).toUpperCase() + h.slice(1)
  return { ...seo, title: t, description: `${t} — verified listings direct from owners on Distress Deals UAE, with real prices and no third-party agents.`, alternates: { canonical: `/for-rent?tag=${tag}` } }
}

export default async function ForRentPage({ searchParams }: { searchParams?: Record<string, string | undefined> }) {
  const [quickLinks, guide, initial] = await Promise.all([
    quickLinksAPI.get('rent').then(r => r.data.success ? r.data.data : null).catch(() => null),
    getContentPage('guide-renting', GUIDE_RENTING),
    // The list's page in Best Opportunities order, rendered here so crawlers (and the first paint) see real cards.
    listingSeed('rent', searchParams),
  ])
  // A page past the end of the list (?page=999) is a real 404, not an empty 200 ("soft 404").
  if (initial && initial.page > 1 && initial.page > initial.totalPages) notFound()

  return (
    <PropertiesListClient
      forcedListingType="rent"
      initial={initial}
      bottom={<><AreaPriceMap defaultPurpose="rent" title="Compare rents by area" subtitle="See what a year’s rent gets you across different areas." /><MoreSearches data={quickLinks} /><GuideSection content={guide} /></>}
    />
  )
}
