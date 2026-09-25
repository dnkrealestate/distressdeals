import type { Metadata } from 'next'
import { propertyAPI } from '@/lib/api'
import { resolveSeo } from '@/lib/seo'
import PropertiesListClient from '../buyer/properties/PropertiesListClient'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('for-rent', {
    title: 'Property for Rent in Dubai | Verified Listings',
    description: 'Verified apartments and villas for rent across Dubai, with genuine availability and no duplicate listings. Updated daily.',
    path: '/for-rent',
  })
}

export default async function ForRentPage() {
  // Server-fetched first page — so crawlers (and the very first paint) see real listings, not an empty shell.
  // The client component re-fetches on mount as usual for filters/sorting; this only seeds that initial render.
  const initial = await propertyAPI.getAll({ listingType: 'rent', page: 1, limit: 40, sortBy: 'recommended' })
    .then(r => r.data.success ? r.data.data : null)
    .catch(() => null)

  return (
    <PropertiesListClient
      forcedListingType="rent"
      initialProperties={initial?.data}
      initialTotal={initial?.total}
      initialTotalPages={initial?.totalPages}
    />
  )
}
