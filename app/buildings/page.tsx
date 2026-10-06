import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import BuildingsListClient from './BuildingsListClient'
import { buildingContentAPI } from '@/lib/api'

// Edited in the admin — rebuilt from the latest data at most every 60 s.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('buildings', {
    title: 'Dubai Buildings & Towers Directory',
    description: 'Building-level guides for Dubai towers and developments — amenities, developer, and year built.',
    path: '/buildings',
  })
}

export default async function BuildingsPage() {
  // Loaded here so the list is server-rendered; the component fetches it itself if this fails.
  const initial = await buildingContentAPI.getAll().then(r => (r.data.success && Array.isArray(r.data.data) ? r.data.data : undefined)).catch(() => undefined)
  // Only what the cards show — the list is embedded in the page's HTML, so full guides would make it far heavier.
  const cards = initial?.map((b: any) => ({ _id: b._id, name: b.name, slug: b.slug, area: b.area, community: b.community, developer: b.developer, heroImage: b.heroImage, yearBuilt: b.yearBuilt, isFeatured: b.isFeatured }))
  return <BuildingsListClient initial={cards} />
}
