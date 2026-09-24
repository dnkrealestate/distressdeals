import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import BlogListClient from './BlogListClient'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('blog', {
    title: 'Dubai Property Market Blog',
    description: 'Dubai real estate market trends, buying guides, investment insights, and regulatory news — curated by our in-house specialists.',
    path: '/blog',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default function BlogPage() {
  return <BlogListClient />
}
