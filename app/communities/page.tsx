import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import CommunitiesListClient from './CommunitiesListClient'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('communities', {
    title: 'Dubai Communities Guide',
    description: 'Explore Dubai neighbourhoods and sub-communities — real listing counts and prices from our own verified inventory.',
    path: '/communities',
  })
}

export default function CommunitiesPage() {
  return <CommunitiesListClient />
}
