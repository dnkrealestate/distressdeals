import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import AreasListClient from './AreasListClient'

// Content is edited in the admin — rebuild this page from the latest data at most every 60 s (otherwise a production
// build freezes it at build time and edits never show).
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('areas', {
    title: 'Dubai Area Guides: Average Prices by Community',
    description: 'Explore Dubai neighborhoods with real average prices and listing counts from our verified inventory — Dubai Marina, Downtown, Business Bay, and more.',
    path: '/areas',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default function AreasPage() {
  return <AreasListClient />
}
