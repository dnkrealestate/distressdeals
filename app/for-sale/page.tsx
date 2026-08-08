import type { Metadata } from 'next'
import PropertiesListClient from '../buyer/properties/PropertiesListClient'

export const metadata: Metadata = {
  title: 'Properties for Sale in Dubai',
  description: 'Browse verified apartments, villas, and penthouses for sale across Dubai — updated daily with real-time pricing and availability.',
  alternates: { canonical: '/for-sale' },
  openGraph: {
    title: 'Properties for Sale in Dubai',
    description: 'Browse verified apartments, villas, and penthouses for sale across Dubai — updated daily with real-time pricing and availability.',
    type: 'website',
    url: '/for-sale',
  },
}

export default function ForSalePage() {
  return <PropertiesListClient forcedListingType="sale" />
}
