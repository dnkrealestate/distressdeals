import type { Metadata } from 'next'
import { propertyAPI } from '@/lib/api'
import { resolveSeo } from '@/lib/seo'
import PropertiesListClient from '../buyer/properties/PropertiesListClient'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('for-sale', {
    title: 'Distressed Property for Sale in Dubai | Below Market',
    description: 'Distressed and below-market property for sale in Dubai. Verified villas, apartments and penthouses with real pricing, updated daily.',
    path: '/for-sale',
  })
}

export default async function ForSalePage() {
  // Server-fetched first page — so crawlers (and the very first paint) see real listings, not an empty shell.
  // The client component re-fetches on mount as usual for filters/sorting; this only seeds that initial render.
  const initial = await propertyAPI.getAll({ listingType: 'sale', page: 1, limit: 12, sortBy: 'recommended' })
    .then(r => r.data.success ? r.data.data : null)
    .catch(() => null)

  return (
    <PropertiesListClient
      forcedListingType="sale"
      initialProperties={initial?.data}
      initialTotal={initial?.total}
      initialTotalPages={initial?.totalPages}
    />
  )
}
