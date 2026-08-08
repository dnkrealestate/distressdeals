import type { Metadata } from 'next'
import BuildingsListClient from './BuildingsListClient'

export const metadata: Metadata = {
  title: 'Dubai Buildings & Towers',
  description: 'Building-level guides for Dubai towers and developments — amenities, developer, and year built.',
  alternates: { canonical: '/buildings' },
  openGraph: {
    title: 'Dubai Buildings & Towers',
    description: 'Building-level guides for Dubai towers and developments — amenities, developer, and year built.',
    type: 'website',
    url: '/buildings',
  },
}

export default function BuildingsPage() {
  return <BuildingsListClient />
}
