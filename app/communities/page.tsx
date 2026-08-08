import type { Metadata } from 'next'
import CommunitiesListClient from './CommunitiesListClient'

export const metadata: Metadata = {
  title: 'Dubai Communities',
  description: 'Explore Dubai neighbourhoods and sub-communities — real listing counts and prices from our own verified inventory.',
  alternates: { canonical: '/communities' },
  openGraph: {
    title: 'Dubai Communities',
    description: 'Explore Dubai neighbourhoods and sub-communities — real listing counts and prices from our own verified inventory.',
    type: 'website',
    url: '/communities',
  },
}

export default function CommunitiesPage() {
  return <CommunitiesListClient />
}
