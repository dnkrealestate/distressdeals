import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import NewsListClient from './NewsListClient'
import { newsAPI } from '@/lib/api'

// New articles show within a minute.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('news', {
    title: 'Dubai Real Estate News & Market Updates',
    description: 'Dubai real estate regulatory updates, market announcements, and industry news — as they happen.',
    path: '/news',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default async function NewsPage() {
  // First page loaded here so the articles are server-rendered; the list fetches further pages itself.
  const initial = await newsAPI.getAll({ page: 1, limit: 12 })
    .then(r => (r.data.success ? { data: r.data.data.data || [], total: r.data.data.total || 0 } : undefined)).catch(() => undefined)
  return <NewsListClient initial={initial} />
}
