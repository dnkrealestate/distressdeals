import type { Metadata } from 'next'
import PropertiesListClient from './PropertiesListClient'

// The all-listings search (sale + rent, any filter) — a tool page. Search engines index /for-sale, /for-rent and their
// type pages instead; links on this page are still followed.
export const metadata: Metadata = {
  title: 'Search Properties',
  robots: { index: false, follow: true },
}

export default function PropertiesPage() {
  return <PropertiesListClient />
}
