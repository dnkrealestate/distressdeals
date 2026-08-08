import type { Metadata } from 'next'
import AreasListClient from './AreasListClient'

export const metadata: Metadata = {
  title: 'Dubai Area Guides',
  description: 'Explore Dubai neighborhoods with real average prices and listing counts from our verified inventory — Dubai Marina, Downtown, Business Bay, and more.',
  alternates: { canonical: '/areas' },
  openGraph: {
    title: 'Dubai Area Guides',
    description: 'Explore Dubai neighborhoods with real average prices and listing counts from our verified inventory.',
    type: 'website',
    url: '/areas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dubai Area Guides',
    description: 'Explore Dubai neighborhoods with real average prices and listing counts.',
  },
}

export default function AreasPage() {
  return <AreasListClient />
}
