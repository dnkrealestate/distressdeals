import type { Metadata } from 'next'
import PropertiesListClient from '../buyer/properties/PropertiesListClient'

export const metadata: Metadata = {
  title: 'Properties for Rent in Dubai',
  description: 'Browse verified apartments, villas, and penthouses for rent across Dubai — updated daily with real-time pricing and availability.',
  alternates: { canonical: '/for-rent' },
  openGraph: {
    title: 'Properties for Rent in Dubai',
    description: 'Browse verified apartments, villas, and penthouses for rent across Dubai — updated daily with real-time pricing and availability.',
    type: 'website',
    url: '/for-rent',
  },
}

export default function ForRentPage() {
  return <PropertiesListClient forcedListingType="rent" />
}
