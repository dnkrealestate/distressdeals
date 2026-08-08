import type { Metadata } from 'next'
import InsightsClient from './InsightsClient'

export const metadata: Metadata = {
  title: 'Insights',
  description: 'Everything informational in one place — market blog, news, and guides to Dubai areas, communities, and buildings.',
  alternates: { canonical: '/insights' },
  openGraph: {
    title: 'Insights',
    description: 'Everything informational in one place — market blog, news, and guides to Dubai areas, communities, and buildings.',
    type: 'website',
    url: '/insights',
  },
}

export default function InsightsPage() {
  return <InsightsClient />
}
