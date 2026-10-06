import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import CommunitiesListClient from './CommunitiesListClient'
import { communityContentAPI } from '@/lib/api'

// Content is edited in the admin — rebuild this page from the latest data at most every 60 s (otherwise a production
// build freezes it at build time and edits never show).
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('communities', {
    title: 'Dubai Communities Guide',
    description: 'Explore Dubai neighbourhoods and sub-communities — real listing counts and prices from our own verified inventory.',
    path: '/communities',
  })
}

export default async function CommunitiesPage() {
  // Loaded here so the list is server-rendered; the component fetches it itself if this fails.
  const initial = await communityContentAPI.getAll({ fields: 'card' }).then(r => (r.data.success && Array.isArray(r.data.data) ? r.data.data : undefined)).catch(() => undefined)
  return <CommunitiesListClient initial={initial} />
}
