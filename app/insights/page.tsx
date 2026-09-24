import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import InsightsClient from './InsightsClient'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('insights', {
    title: 'Dubai Property Market Insights & Price Data',
    description: 'Everything informational in one place — market blog, news, and guides to Dubai areas, communities, and buildings.',
    path: '/insights',
  })
}

export default function InsightsPage() {
  return <InsightsClient />
}
