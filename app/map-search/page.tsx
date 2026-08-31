import type { Metadata } from 'next'
import MapSearchClient from './MapSearchClient'

export const metadata: Metadata = {
  title: 'Map Search — Properties in Dubai',
  description: 'Browse properties for sale and rent across Dubai on an interactive map.',
  robots: { index: false, follow: true },
}

export default function MapSearchPage() {
  return <MapSearchClient />
}
