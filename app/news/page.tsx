import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import NewsListClient from './NewsListClient'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('news', {
    title: 'Dubai Real Estate News & Market Updates',
    description: 'Dubai real estate regulatory updates, market announcements, and industry news — as they happen.',
    path: '/news',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default function NewsPage() {
  return <NewsListClient />
}
