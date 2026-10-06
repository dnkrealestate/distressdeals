import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import BlogListClient from './BlogListClient'
import { blogAPI } from '@/lib/api'

// New posts show within a minute.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('blog', {
    title: 'Dubai Property Guides & Real Estate Blog',
    description: 'UAE real estate guides: how to buy, sell, rent and invest in Dubai property — fees, mortgages, off-plan, distress sales, Golden Visa and area advice from our in-house specialists.',
    path: '/blog',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default async function BlogPage() {
  // First page loaded here so the posts are server-rendered; the list fetches further pages itself.
  const initial = await blogAPI.getAll({ page: 1, limit: 12 })
    .then(r => (r.data.success ? { data: r.data.data.data || [], total: r.data.data.total || 0 } : undefined)).catch(() => undefined)
  return <BlogListClient initial={initial} />
}
