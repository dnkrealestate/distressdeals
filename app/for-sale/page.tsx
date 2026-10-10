import type { Metadata } from 'next'
import { propertyAPI, quickLinksAPI } from '@/lib/api'
import { getContentPage } from '@/lib/contentPages'
import { GUIDE_BUYING } from '@/lib/guideContent'
import { tagHeadline, TAG_LABELS } from '@/lib/listingTags'
import MoreSearches from '@/components/listing/MoreSearches'
import GuideSection from '@/components/listing/GuideSection'
import AreaPriceMap from '@/components/AreaPriceMap'
import { resolveSeo } from '@/lib/seo'
import PropertiesListClient from '../buyer/properties/PropertiesListClient'

const TYPE_PAGE: Record<string, string> = {
  apartment: 'Apartments', villa: 'Villas', townhouse: 'Townhouses', penthouse: 'Penthouses', studio: 'Studios', plot: 'Plots',
  office: 'Offices', retail: 'Retail Spaces', warehouse: 'Warehouses', commercial: 'Commercial Properties', commercial_villa: 'Commercial Villas',
}

export async function generateMetadata({ searchParams }: { searchParams?: { tag?: string; type?: string } }): Promise<Metadata> {
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

export default async function ForSalePage({ searchParams }: { searchParams?: { type?: string } }) {
  const [quickLinks, guide] = await Promise.all([
    quickLinksAPI.get('sale').then(r => r.data.success ? r.data.data : null).catch(() => null),
    getContentPage('guide-buying', GUIDE_BUYING),
  ])
  // Server-fetched first page — so crawlers (and the very first paint) see real listings, not an empty shell.
  // The client component re-fetches on mount as usual for filters/sorting; this only seeds that initial render.
  const type = searchParams?.type && TYPE_PAGE[searchParams.type] ? searchParams.type : undefined
  const initial = await propertyAPI.getAll({ listingType: 'sale', page: 1, limit: 40, sortBy: 'opportunity', ...(type ? { type } : {}) })
    .then(r => r.data.success ? r.data.data : null)
    .catch(() => null)

  return (
    <PropertiesListClient
      forcedListingType="sale"
      initialProperties={initial?.data}
      initialTotal={initial?.total}
      initialTotalPages={initial?.totalPages}
      bottom={<><AreaPriceMap defaultPurpose="buy" /><MoreSearches data={quickLinks} /><GuideSection content={guide} /></>}
    />
  )
}
